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
    gender?: 'male' | 'female';
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
    const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'ar-SA' | 'ur-PK'>('en-US');
    const [typedMessage, setTypedMessage] = useState('');

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
            rec.lang = selectedLanguage;

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
    }, [participants, selectedLanguage]);

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
                speakVoice(`Regarding this topic, the ${speaker.role} has logged comments into the compliance minutes.`, speaker.role, speaker.gender);
            }

        }, 7000);

        return () => clearInterval(interval);
    }, [isMeetingActive, participants, isListening, isProcessingHumanInput]);

    // Speak to GRC Board with mic or text input
    const handleSpeakToBoard = async (text: string) => {
        if (!text || text.trim() === '' || text === 'Listening...') return;
        setIsProcessingHumanInput(true);
        setActiveSpeakerId(currentUser?.id || 'boardroom-user');

        // Append user speech to minutes
        setMeetingMinutes(prev => [`You: "${text}"`, ...prev].slice(0, 15));

        try {
            const bots = participants.filter(p => !p.isHuman);
            const userLangName = selectedLanguage === 'ur-PK' ? 'Urdu' : selectedLanguage === 'ar-SA' ? 'Arabic' : 'English';
            
            const prompt = `
                You are simulating a GRC (Governance, Risk, and Compliance) executive board meeting.
                The user just addressed the board or asked a question in ${userLangName}.
                The user statement/question:
                "${text}"

                The virtual board members present are:
                ${bots.map(b => `- ${b.name} (${b.role})`).join('\n')}

                Please select ONE suitable board member to respond directly and constructively to the user's statement or question.

                IMPORTANT LANGUAGE CONSTRAINT:
                1. If the user spoke, typed or has a selected language of Arabic, you MUST write the 'response' entirely in natural Arabic (AR).
                2. If the user spoke, typed or has a selected language of Urdu, you MUST write the 'response' entirely in natural, native Urdu (UR) script.
                3. If the user spoke, typed or has a selected language of English, you MUST write the 'response' entirely in English (EN).
                Strictly match the language of the user's input/selected language (${userLangName}). No translations or explanations in other languages should be included.

                Provide your response as a JSON object:
                {
                    "responderId": "Id of the board member replying (e.g. from the present list)",
                    "responderName": "Name of the board member replying",
                    "responderRole": "Role of the board member",
                    "response": "A professional, realistic 2-sentence response addressing the user's issue with executive gravity in the matched language."
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

            if (data && (data.responderId || data.responderName || data.response)) {
                const searchId = (data.responderId || '').toLowerCase();
                const searchName = (data.responderName || '').toLowerCase();
                const searchRole = (data.responderRole || '').toLowerCase();
                
                const matchedBot = bots.find(b => 
                    b.id.toLowerCase() === searchId || 
                    b.id.toLowerCase().includes(searchId) || 
                    b.name.toLowerCase() === searchName || 
                    b.name.toLowerCase().includes(searchName) ||
                    b.role.toLowerCase() === searchRole ||
                    b.role.toLowerCase().includes(searchRole)
                ) || bots[0];
                
                const responseText = data.response && data.response !== "Content generation failed." 
                    ? data.response 
                    : (selectedLanguage === 'ur-PK' 
                        ? `میں نے آپ کا نقطہ نظر سمجھ لیا ہے۔ بطور ${matchedBot.role}، میں اس معاملے پر گہرائی سے کام کروں گا۔`
                        : selectedLanguage === 'ar-SA'
                        ? `لقد فهمت وجهة نظرك تمامًا. بصفتي ${matchedBot.role}، سأعمل على هذه المسألة بدقة.`
                        : `I understand your point completely. As ${matchedBot.role}, I will address this matter with high priority.`);

                setActiveSpeakerId(matchedBot.id);
                setMeetingMinutes(prev => [`${matchedBot.name} (${matchedBot.role}): "${responseText}"`, ...prev].slice(0, 15));
                await speakVoice(responseText, matchedBot.role, matchedBot.gender);
            } else {
                // Fallback
                const bot = bots[0];
                setActiveSpeakerId(bot.id);
                const msg = selectedLanguage === 'ur-PK' 
                    ? "ہم نے آپ کی بات نوٹ کر لی ہے اور اسے اپنے آئندہ خطرات کے جائزے میں شامل کریں گے۔"
                    : selectedLanguage === 'ar-SA'
                    ? "لقد استلمنا مداخلتك وسندمجها في تقييمات المخاطر القادمة لدينا."
                    : "We have received your input, and will integrate this into our upcoming risk evaluations.";
                setMeetingMinutes(prev => [`${bot.name} (${bot.role}): "${msg}"`, ...prev].slice(0, 15));
                await speakVoice(msg, bot.role, bot.gender);
            }

        } catch (e) {
            console.error("Board reaction generation failed", e);
        } finally {
            setIsProcessingHumanInput(false);
            setActiveSpeakerId(null);
            setHumanTranscript('');
        }
    };

    // Text to Speech playback with gender-based natural voice profiles (using professional D-ID equivalent settings)
    const speakVoice = (text: string, role: string, gender?: 'male' | 'female') => {
        return new Promise<void>((resolve) => {
            if (!('speechSynthesis' in window)) {
                resolve();
                return;
            }
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

            // Detect language of the text
            const isArabicText = /[\u0600-\u06FF]/.test(text);
            let langPattern = 'en';
            if (isArabicText) {
                if (selectedLanguage === 'ur-PK') {
                    langPattern = 'ur';
                } else {
                    langPattern = 'ar';
                }
            } else if (selectedLanguage === 'ur-PK') {
                langPattern = 'ur';
            } else if (selectedLanguage === 'ar-SA') {
                langPattern = 'ar';
            }

            const matchingVoices = voicesList.filter(v => 
                v.lang.toLowerCase().startsWith(langPattern) || 
                v.lang.toLowerCase().includes(langPattern + '-')
            );

            // Precise Gender Check: prioritize agent gender attribute, fallback on role identification
            const isFemale = gender === 'female' || role.toLowerCase() === 'dpo' || role.toLowerCase().includes('data protection officer');

            const scoreVoice = (voice: SpeechSynthesisVoice) => {
                let score = 0;
                const name = voice.name.toLowerCase();
                
                // Actively penalize legacy, local, or eSpeak robotic systems to prioritize rich human warmth
                if (name.includes('local') || name.includes('espeak') || name.includes('synth') || name.includes('robotic')) {
                    score -= 100;
                }

                // Boost premium, high-quality, neural, or natural voices
                if (name.includes('natural') || name.includes('neural') || name.includes('premium') || name.includes('siri') || name.includes('enhanced') || name.includes('wavenet') || name.includes('high') || name.includes('quality') || name.includes('hd')) {
                    score += 50;
                }
                
                if (name.includes('google') || name.includes('microsoft') || name.includes('apple') || name.includes('desktop')) {
                    score += 15;
                }
                
                // Gender Match
                if (isFemale) {
                    if (name.includes('female') || name.includes('zira') || name.includes('hazel') || name.includes('susan') || name.includes('siri') || name.includes('samantha') || name.includes('mary') || name.includes('kore') || name.includes('heera') || name.includes('muna') || name.includes('hoda') || name.includes('laila') || name.includes('zeina') || name.includes('nadia') || name.includes('salma') || name.includes('asma') || name.includes('uzma') || name.includes('zoya') || name.includes('aisha')) {
                        score += 30;
                    }
                    if (name.includes('male') || name.includes('david') || name.includes('guy') || name.includes('stefan') || name.includes('george') || name.includes('mark') || name.includes('puck') || name.includes('charon')) {
                        score -= 30;
                    }
                } else {
                    if (name.includes('male') || name.includes('david') || name.includes('george') || name.includes('guy') || name.includes('mark') || name.includes('puck') || name.includes('charon') || name.includes('stefan') || name.includes('tarif') || name.includes('shakir') || name.includes('riyad') || name.includes('hassan') || name.includes('omar') || name.includes('imran') || name.includes('bilal') || name.includes('sajid')) {
                        score += 30;
                    }
                    if (name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('hazel') || name.includes('siri') || name.includes('muna') || name.includes('hoda')) {
                        score -= 30;
                    }
                }
                
                return score;
            };

            const sortedVoices = [...matchingVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
            const selectedVoice = sortedVoices[0] || voicesList.find(v => v.lang.toLowerCase().startsWith(langPattern)) || voicesList.find(v => v.lang.toLowerCase().startsWith('en'));

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
            }

            // Custom natural pitch and rate settings matching individual board roles to sound human and alive!
            switch (role.toUpperCase()) {
                case 'CISO': utterance.pitch = 0.98; utterance.rate = 1.0; break;
                case 'CIO': utterance.pitch = 1.02; utterance.rate = 1.02; break;
                case 'CTO': utterance.pitch = 0.95; utterance.rate = 1.01; break;
                case 'DPO': utterance.pitch = 1.12; utterance.rate = 0.98; break; // Hoda (Female)
                case 'RISK MANAGER': utterance.pitch = 0.94; utterance.rate = 0.97; break;
                case 'COMPLIANCE': utterance.pitch = 1.04; utterance.rate = 1.03; break;
                case 'AUDITOR':
                case 'INTERNAL AUDITOR': utterance.pitch = 0.97; utterance.rate = 1.0; break;
                default: utterance.pitch = 1.0; utterance.rate = 1.0;
            }

            // Fallback timeout to prevent SpeechSynthesis lockups
            const timeoutId = setTimeout(() => {
                resolve();
            }, 12000);

            utterance.onend = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            utterance.onerror = () => {
                clearTimeout(timeoutId);
                resolve();
            };
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

                    {/* Speech & Text Interaction Controls */}
                    {isMeetingActive && (
                        <div className="mt-6 z-20 bg-white/95 dark:bg-gray-850/90 backdrop-blur border border-gray-200 dark:border-gray-700 px-6 py-5 rounded-2xl flex flex-col gap-4 max-w-xl w-full shadow-lg">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
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
                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wider text-left">
                                            {isListening ? 'Boardroom Listening...' : 'Click to Speak'}
                                        </p>
                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase text-left">
                                            {isListening ? 'Speak clearly into your microphone' : 'Intervene using your microphone'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Language:</span>
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                        className="bg-gray-50 dark:bg-gray-805 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-normal text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="en-US">🇺🇸 English</option>
                                        <option value="ar-SA">🇸🇦 العربية</option>
                                        <option value="ur-PK">🇵🇰 اردو</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Text message box in case Mic is not active / permissions are missing */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (typedMessage.trim() && !isProcessingHumanInput) {
                                        handleSpeakToBoard(typedMessage);
                                        setTypedMessage('');
                                    }
                                }}
                                className="flex gap-2 w-full"
                            >
                                <input
                                    type="text"
                                    value={typedMessage}
                                    onChange={(e) => setTypedMessage(e.target.value)}
                                    placeholder={selectedLanguage === 'ur-PK' ? "اردو میں بورڈ سے بات کریں..." : selectedLanguage === 'ar-SA' ? "تحدث مع المجلس باللغة العربية..." : "Type a message or ask a question to the board..."}
                                    disabled={isProcessingHumanInput}
                                    className="flex-1 bg-gray-50 dark:bg-gray-805 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isProcessingHumanInput || !typedMessage.trim()}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all disabled:opacity-50"
                                >
                                    {isProcessingHumanInput ? 'Wait...' : 'Send'}
                                </button>
                            </form>
                            
                            {humanTranscript && (
                                <p className="text-[11px] italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg w-full text-center border border-gray-100 dark:border-gray-800">
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
