import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { virtualAgents } from '../data/virtualAgents';
import { SparklesIcon, PhoneIcon, MicrophoneIcon } from './Icons';
import { AIService } from '../services/aiService';
import type { User, VirtualAgent } from '../types';

interface Participant {
    id: string;
    name: string;
    role: string;
    avatarUrl: string;
    isSpeaking: boolean;
    hasLaptop: boolean;
    hasMic: boolean;
    isHuman?: boolean;
}

interface MeetingRoomPageProps {
    currentUser?: User | null;
}

export const MeetingRoomPage: React.FC<MeetingRoomPageProps> = ({ currentUser }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
    const [meetingMinutes, setMeetingMinutes] = useState<string[]>([]);
    const [isMeetingActive, setIsMeetingActive] = useState(false);

    // Microphone & Speech System state
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessingHumanInput, setIsProcessingHumanInput] = useState(false);
    const [humanTranscript, setHumanTranscript] = useState('');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    const recognitionRef = useRef<any>(null);

    // Sync available voices natively
    useEffect(() => {
        const loadVoices = () => {
            if ('speechSynthesis' in window) {
                setAvailableVoices(window.speechSynthesis.getVoices());
            }
        };
        loadVoices();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Load participants including user
    useEffect(() => {
        const initial: Participant[] = virtualAgents.map(agent => ({
            ...agent,
            isSpeaking: false,
            hasLaptop: true,
            hasMic: true,
            isHuman: false
        }));

        // Seat the logged in user as an active GRC Board Member
        if (currentUser) {
            initial.push({
                id: currentUser.id || 'boardroom-user',
                name: `${currentUser.name} (You)`,
                role: currentUser.role,
                avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop', // Elegant tech employee portrait
                isSpeaking: false,
                hasLaptop: true,
                hasMic: isMicEnabled,
                isHuman: true
            });
        }

        setParticipants(initial);
    }, [currentUser, isMicEnabled]);

    // Setup speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
                setHumanTranscript('Listening...');
            };

            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setHumanTranscript(text);
                handleSpeakToBoard(text);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            rec.onerror = (e: any) => {
                console.error("Speech recognition error:", e);
                setIsListening(false);
                setHumanTranscript('');
            };

            recognitionRef.current = rec;
        }
    }, [participants]);

    // Automated Virtual Speaker loop
    useEffect(() => {
        if (!isMeetingActive || isListening || isProcessingHumanInput) return;

        const interval = setInterval(() => {
            // Pick a virtual agent (exclude user)
            const bots = participants.filter(p => !p.isHuman);
            if (bots.length === 0) return;

            const speaker = bots[Math.floor(Math.random() * bots.length)];
            setActiveSpeakerId(speaker.id);
            
            // Mock boardroom deliberations
            const phrases = [
                `${speaker.name} is discussing the quarterly compliance roadmap.`,
                `${speaker.name} raised a point about PDPL data residency requirements.`,
                `${speaker.name} is presenting the latest risk assessment findings.`,
                `${speaker.name} suggests increasing the budget for VAPT tools.`,
                `${speaker.name} is reviewing the new NCA ECC controls implementation.`,
                `${speaker.name} highlights the importance of Zero Trust architecture.`,
                `${speaker.name} recommends conducting an external cybersecurity audit.`,
                `${speaker.name} underscores need for role-based security training.`
            ];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            setMeetingMinutes(prev => [randomPhrase, ...prev].slice(0, 15));

            // Optional vocal synthesis for spontaneous interventions
            if (Math.random() > 0.6) {
                speakVoice(`Regarding this topic, the ${speaker.role} has logged comments into the compliance minutes.`, speaker.role);
            }

        }, 7000);

        return () => clearInterval(interval);
    }, [isMeetingActive, participants, isListening, isProcessingHumanInput]);

    // Speak to GRC Board with mic
    const handleSpeakToBoard = async (text: string) => {
        if (!text || text.trim() === '' || text === 'Listening...') return;
        setIsProcessingHumanInput(true);
        setActiveSpeakerId(currentUser?.id || 'boardroom-user');

        // Append user speech to minutes
        setMeetingMinutes(prev => [`You: "${text}"`, ...prev].slice(0, 15));

        try {
            const bots = participants.filter(p => !p.isHuman);
            const prompt = `
                You are simulating a GRC (Governance, Risk, and Compliance) executive board meeting.
                The user just spoke into their microphone saying this:
                "${text}"

                The virtual board members present are:
                ${bots.map(b => `- ${b.name} (${b.role})`).join('\n')}

                Please select ONE suitable board member to respond directly and constructively to the user's statement or question.
                Provide your response as a JSON object:
                {
                    "responderId": "Id of the board member replying (e.g. from the present list)",
                    "responderName": "Name of the board member replying",
                    "responderRole": "Role of the board member",
                    "response": "A professional, realistic 2-sentence response addressing the user's issue with executive gravity."
                }
            `;

            const data = await AIService.generateStructuredContent<{
                responderId: string;
                responderName: string;
                responderRole: string;
                response: string;
            }>(prompt, {
                responderId: 'string',
                responderName: 'string',
                responderRole: 'string',
                response: 'string'
            });

            if (data && data.responderId) {
                const matchedBot = bots.find(b => b.id === data.responderId || b.name === data.responderName) || bots[0];
                setActiveSpeakerId(matchedBot.id);
                setMeetingMinutes(prev => [`${matchedBot.name} (${matchedBot.role}): "${data.response}"`, ...prev].slice(0, 15));
                await speakVoice(data.response, matchedBot.role);
            } else {
                // Fallback
                const bot = bots[0];
                setActiveSpeakerId(bot.id);
                const msg = "We have received your input, and will integrate this into our upcoming risk evaluations.";
                setMeetingMinutes(prev => [`${bot.name} (${bot.role}): "${msg}"`, ...prev].slice(0, 15));
                await speakVoice(msg, bot.role);
            }

        } catch (e) {
            console.error("Board reaction generation failed", e);
        } finally {
            setIsProcessingHumanInput(false);
            setActiveSpeakerId(null);
            setHumanTranscript('');
        }
    };

    // Text to Speech playback
    const speakVoice = (text: string, role: string) => {
        return new Promise<void>((resolve) => {
            if (!('speechSynthesis' in window)) {
                resolve();
                return;
            }
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

            const getBestMaleVoice = () => {
                const keywords = [
                    'google us english male',
                    'natural male',
                    'premium male',
                    'guy',
                    'david',
                    'mark',
                    'george',
                    'richard',
                    'andrew',
                    'microsoft david'
                ];
                for (const keyword of keywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const fallbackMale = voicesList.find(v => v.name.toLowerCase().includes('male') && v.lang.toLowerCase().startsWith('en'));
                return fallbackMale || voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const selectedVoice = getBestMaleVoice();
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // Differentiate vocal delivery based on executive role
            switch (role) {
                case 'CISO': utterance.pitch = 0.82; utterance.rate = 0.88; break;
                case 'CIO': utterance.pitch = 1.0; utterance.rate = 0.92; break;
                case 'DPO': utterance.pitch = 1.05; utterance.rate = 0.95; break;
                case 'Auditor': utterance.pitch = 0.85; utterance.rate = 0.94; break;
                default: utterance.pitch = 0.95; utterance.rate = 0.95;
            }

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    const handleToggleMeeting = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsMeetingActive(!isMeetingActive);
        if (!isMeetingActive) {
            setMeetingMinutes(["Meeting started. Recording minutes..."]);
        } else {
            setMeetingMinutes(prev => ["Meeting adjourned.", ...prev]);
            setActiveSpeakerId(null);
            if (isListening) {
                stopListeningUser();
            }
        }
    };

    // Toggle real mic permission and state
    const handleToggleMic = async () => {
        if (!isMicEnabled) {
            try {
                // Request live user media capture
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsMicEnabled(true);
                setMeetingMinutes(prev => ["Microphone enabled. You are cleared to speak.", ...prev]);
            } catch (err) {
                console.error("Microphone access declined", err);
                alert("Could not access microphone feed. Please check browser privacy/frame permissions for mic use.");
            }
        } else {
            setIsMicEnabled(false);
            if (isListening) {
                stopListeningUser();
            }
        }
    };

    const startListeningUser = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (recognitionRef.current && isMicEnabled) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Recognition start failed", e);
            }
        } else {
            alert("Please enable the boardroom microphone first by clicking 'Enable Mic'.");
        }
    };

    const stopListeningUser = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Recognition stop failed", e);
            }
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-gray-900 dark:text-white tracking-tight">Virtual Board Meeting Room</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal uppercase tracking-wider mt-1">Autonomous GRC Decision-Making Environment</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={handleToggleMic}
                        className={`px-4 py-2.5 rounded-full text-sm font-normal transition-all flex items-center gap-2 border ${
                            isMicEnabled
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title="Enable Microphone Feed"
                    >
                        <MicrophoneIcon className={`w-4 h-4 ${isMicEnabled ? 'animate-pulse' : ''}`} />
                        <span>{isMicEnabled ? 'Mic Active' : 'Enable Mic'}</span>
                    </button>

                    <button 
                        onClick={handleToggleMeeting}
                        className={`px-6 py-2.5 rounded-full text-sm font-normal uppercase tracking-widest transition-all ${
                            isMeetingActive 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20'
                        }`}
                    >
                        {isMeetingActive ? 'Adjourn Meeting' : 'Start Board Meeting'}
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Visual Meeting Room Area */}
                <div className="lg:col-span-2 bg-[#f8fafc] dark:bg-[#0f172a] rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    
                    {/* The Meeting Table */}
                    <div className="relative w-full max-w-2xl aspect-[16/9] bg-white dark:bg-gray-800 rounded-[60px] shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10">
                        {/* Table Top Surface Decor */}
                        <div className="absolute inset-4 border border-gray-100 dark:border-gray-700 rounded-[50px] pointer-events-none"></div>
                        
                        {/* Conference Mic / Speaker Hub in center */}
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center shadow-inner relative">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMeetingActive ? 'bg-teal-500/20 text-teal-600 animate-pulse' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                               <PhoneIcon className="w-6 h-6" />
                           </div>
                           {isMeetingActive && <div className="absolute inset-0 rounded-full border-2 border-teal-500 animate-ping opacity-25"></div>}
                        </div>

                        {/* Participants Positioning */}
                        {participants.map((participant, index) => {
                            // Circular positioning around the table
                            const angle = (index / participants.length) * 2 * Math.PI - Math.PI / 2;
                            const isCurrentSpeaker = activeSpeakerId === participant.id;

                            return (
                                <div 
                                    key={participant.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
                                    style={{ 
                                        left: `calc(50% + ${Math.cos(angle) * (45)}%)`, 
                                        top: `calc(50% + ${Math.sin(angle) * (60)}%)` 
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        {/* Avatar & Chair */}
                                        <div className="relative group">
                                            {/* Chair Back */}
                                            <div className="absolute -inset-2 bg-gray-200 dark:bg-gray-700 rounded-2xl opacity-50 shadow-sm"></div>
                                            
                                            {/* Sitting indicator Circle */}
                                            <div className={`relative p-1 rounded-full border-2 transition-all duration-500 ${isCurrentSpeaker ? 'border-teal-500 scale-110 shadow-lg shadow-teal-500/20' : 'border-transparent'}`}>
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 bg-gray-200 shadow-md">
                                                    <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
                                                </div>
                                                {isCurrentSpeaker && (
                                                    <motion.div 
                                                        layoutId="speaking-indicator"
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"></path></svg>
                                                    </motion.div>
                                                )}
                                                {participant.isHuman && isListening && (
                                                    <div className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-ping opacity-75"></div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Label */}
                                        <div className="mt-2 text-center">
                                            <p className="text-[11px] font-normal text-gray-900 dark:text-white leading-none truncate w-24 uppercase tracking-tighter">{participant.name}</p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5">{participant.role}</p>
                                        </div>

                                        {/* Equipment on Table (Only if sitting "at" the table) */}
                                        <div 
                                            className="absolute pointer-events-none"
                                            style={{ 
                                                left: '50%',
                                                top: angle > 0 && angle < Math.PI ? '0%' : '100%',
                                                transform: `translate(-50%, ${angle > 0 && angle < Math.PI ? '-140%' : '40%'})`
                                            }}
                                        >
                                            <div className="flex gap-2">
                                                {/* Laptop */}
                                                <div className="w-10 h-6 bg-gray-100 dark:bg-gray-900 rounded-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full opacity-50"></div>
                                                </div>
                                                {/* Console Mic */}
                                                <div className={`w-3 h-3 rounded-full border shadow-inner transition-colors ${participant.hasMic ? 'bg-emerald-500 border-emerald-400 animate-pulse' : 'bg-gray-800 dark:bg-black border-gray-600'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Speech Interaction Controls */}
                    {isMeetingActive && isMicEnabled && (
                        <div className="mt-6 z-20 bg-white/90 dark:bg-gray-850/90 backdrop-blur border border-gray-200 dark:border-gray-700 px-6 py-4 rounded-2xl flex flex-col items-center gap-2 max-w-md w-full shadow-lg">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={isListening ? stopListeningUser : startListeningUser}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                        isListening
                                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                        {isListening ? 'Boardroom Listening...' : 'Click to Speak'}
                                    </p>
                                    <p className="text-[9px] text-gray-500 dark:text-gray-450 uppercase">
                                        {isListening ? 'Speak clearly into your microphone' : 'Intervene or ask board members a question'}
                                    </p>
                                </div>
                            </div>
                            {humanTranscript && (
                                <p className="text-[11px] italic text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg w-full text-center border border-gray-100 dark:border-gray-800">
                                    "{humanTranscript}"
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Live Transcript / MOM Area */}
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Board Deliberations</h3>
                            <p className="text-[10px] text-gray-550 dark:text-gray-450 uppercase tracking-widest leading-none mt-0.5">Real-time MOM Generation</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {meetingMinutes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                <PhoneIcon className="w-12 h-12 mb-4 text-gray-300" />
                                <p className="text-xs uppercase tracking-widest font-normal">Waiting for meeting to start...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout text-normal-weight">
                                {meetingMinutes.map((log, idx) => {
                                    const isUserMessage = log.startsWith('You:');
                                    return (
                                        <motion.div 
                                            key={log + idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                                                isUserMessage
                                                ? 'bg-emerald-50 dark:bg-emerald-990/20 border-emerald-100 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                                                : idx === 0 
                                                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/40 text-teal-800 dark:text-teal-200' 
                                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 text-gray-600 dark:text-gray-400'
                                            }`}
                                        >
                                            <div className="flex gap-2">
                                                <span className="text-[9px] font-mono opacity-50 shrink-0 mt-0.5">
                                                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                                <p className="font-normal">{log}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>

                    {isMeetingActive && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-normal uppercase tracking-widest text-gray-500">Live Recording</span>
                             </div>
                             <button className="text-[10px] font-normal uppercase tracking-widest text-teal-600 hover:text-teal-700">Export Transcript</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
