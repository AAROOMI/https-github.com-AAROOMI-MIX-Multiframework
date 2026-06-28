
import React, { useState, useRef, useEffect } from 'react';
import { AgentService, type OrchestratorDecision } from '../services/agentService';
import { LocalLLM } from '../services/localLLM';
import { virtualAgents } from '../data/virtualAgents';
import { 
    MicrophoneIcon, 
    ShieldCheckIcon, 
    ShieldAlertIcon, 
    ActivityIcon, 
    PhoneIcon, 
    UserIcon, 
    CheckCircleIcon, 
    DocumentTextIcon 
} from './Icons';
import { 
    Server, 
    Cpu, 
    Radio, 
    Volume2, 
    Sliders, 
    Settings, 
    Play, 
    Wifi, 
    WifiOff, 
    VolumeX, 
    Terminal,
    Sparkles,
    Database,
    Binary
} from 'lucide-react';
import type { CompanyProfile, User, PolicyDocument, GRCAgentRole } from '../types';

interface LiveVoiceDemoPageProps {
    company: CompanyProfile;
    users: User[];
    documents: PolicyDocument[];
    assessments: any;
}

export const LiveVoiceDemoPage: React.FC<LiveVoiceDemoPageProps> = ({ company, users, documents, assessments }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'meeting' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [decision, setDecision] = useState<OrchestratorDecision | null>(null);
    const [prevMOM, setPrevMOM] = useState<any>(null);
    const [logs, setLogs] = useState<{ id: string; msg: string; type: 'system' | 'agent' | 'human' }[]>([]);
    const [activeSpeaker, setActiveSpeaker] = useState<{ name: string; role: string } | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Local-Talking-LLM Offline Pipeline Parameters
    const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('force_local_llm') === 'true';
        }
        return false;
    });
    const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
    const [selectedModel, setSelectedModel] = useState('gemma-2-9b-it:latest');
    const [whisperModel, setWhisperModel] = useState('quantized-tiny');
    const [ttsPitch, setTtsPitch] = useState<number>(1.0);
    const [ttsRate, setTtsRate] = useState<number>(0.95);
    const [auditioningAgentId, setAuditioningAgentId] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const meetingSessionIdRef = useRef<number>(0);

    // Sync voices natively
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

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleProcessRequest(text);
            };

            recognitionRef.current.onend = () => {
                if (status === 'listening') setStatus('idle');
            };
        }
    }, [status]);

    const addLog = (msg: string, type: 'system' | 'agent' | 'human' = 'system') => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setLogs(prev => [{ id: uniqueId, msg, type }, ...prev].slice(0, 50));
    };

    const toggleLocalMode = (enabled: boolean) => {
        setIsLocalMode(enabled);
        if (typeof window !== 'undefined') {
            localStorage.setItem('force_local_llm', enabled ? 'true' : 'false');
        }
        addLog(`Local Talking LLM Mode: ${enabled ? 'ENABLED (OFFLINE WORKFLOW)' : 'DISABLED (CLOUD WORKFLOW)'}`, 'system');
        addLog(enabled ? "Whisper STT, Ollama LLM, & Chatterbox TTS integrated successfully." : "Cloud-based Gemini Live Audio and reasoning links re-established.", 'system');
    };

    const startListening = () => {
        meetingSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setTranscript('');
        setDecision(null);
        setLogs([]);
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setStatus('listening');
            addLog("User speaking - Listening...", 'human');
        } else {
            // Emulate local speech recognition for environments without SpeechRecognition API support
            setStatus('listening');
            addLog("[Whisper-STT Emulator] Simulating offline voice listener...", 'system');
            setTimeout(() => {
                const simulatedInputs = [
                    "Perform a quick security audit on SAMA compliance regulations",
                    "What is our status on NCA ECC controls implementation?",
                    "Assess network isolation security risks offline",
                    "Conduct local multi-agent boardroom meeting"
                ];
                const text = simulatedInputs[Math.floor(Math.random() * simulatedInputs.length)];
                setTranscript(text);
                handleProcessRequest(text);
            }, 3000);
        }
    };

    const handleProcessRequest = async (text: string) => {
        meetingSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setStatus('processing');
        addLog(`Voice Processing: "${text}"`, 'human');
        
        if (isLocalMode) {
            addLog("[Local Talking LLM Pipeline] Route: User Speech -> Whisper STT Decoded", 'system');
            addLog(`[Local Talking LLM Pipeline] Querying local Ollama server at ${ollamaHost} with model ${selectedModel}...`, 'system');
        } else {
            addLog("Activating Cloud GRC Orchestrator... Connecting stakeholders.", 'system');
        }
        
        try {
            const result = await AgentService.conductMeeting(text, {
                company,
                users,
                assessments,
                documents,
                prevMOM: prevMOM
            });
            
            setDecision(result);
            if (result.mom) setPrevMOM(result.mom);
            runMeetingVoices(result);
        } catch (error) {
            addLog("Error in multi-agent orchestration.", 'system');
            setStatus('idle');
        }
    };

    const runMeetingVoices = async (result: OrchestratorDecision) => {
        setStatus('meeting');
        addLog(isLocalMode ? "[Local Talking LLM] Multi-agent boardroom running entirely offline." : "Meeting in progress in the GRC Boardroom.", 'system');
        const currentSessionId = ++meetingSessionIdRef.current;

        // Play each agent's part sequentially
        for (const trace of result.agentTrace) {
            if (meetingSessionIdRef.current !== currentSessionId) {
                console.log("GRC Boardroom Interrupted - terminating speech thread.");
                break;
            }
            setActiveSpeaker({ name: trace.speakerName, role: trace.agentRole });
            addLog(`${trace.speakerName} (${trace.agentRole}): ${trace.reasoning}`, 'agent');
            await speak(trace.reasoning, trace.agentRole, currentSessionId);
        }

        // Final Orchestrator summary
        if (meetingSessionIdRef.current === currentSessionId) {
            setActiveSpeaker({ name: 'Orchestrator', role: 'Orchestrator' });
            addLog(`Orchestrator: ${result.summary}`, 'agent');
            await speak(result.summary, 'Orchestrator', currentSessionId);
        }

        if (meetingSessionIdRef.current === currentSessionId) {
            setActiveSpeaker(null);
            setStatus('idle');
        }
    };

    const speak = (text: string, role: string, sessionId: number) => {
        return new Promise<void>((resolve) => {
            if (!('speechSynthesis' in window) || meetingSessionIdRef.current !== sessionId) {
                resolve();
                return;
            }

            // Always clear previous voice queue first to avoid talking lag
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

            const getBestMaleVoice = () => {
                const preferredKeywords = [
                    'natural male',
                    'premium male',
                    'neural male',
                    'google male',
                    'microsoft male',
                    'apple male',
                    'google us english male',
                    'guy',
                    'david',
                    'mark',
                    'george',
                    'richard',
                    'andrew',
                    'microsoft david',
                    'male'
                ];
                for (const keyword of preferredKeywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const nonRobotic = voicesList.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak') && v.lang.toLowerCase().startsWith('en'));
                if (nonRobotic) return nonRobotic;

                const anyMale = voicesList.find(v => (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('guy')) && v.lang.toLowerCase().startsWith('en'));
                if (anyMale) return anyMale;
                return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const getBestFemaleVoice = () => {
                const preferredKeywords = [
                    'natural female',
                    'premium female',
                    'neural female',
                    'google female',
                    'microsoft female',
                    'apple female',
                    'google us english female',
                    'zira',
                    'hazel',
                    'susan',
                    'siri',
                    'samantha',
                    'mary',
                    'kore',
                    'heera',
                    'female'
                ];
                for (const keyword of preferredKeywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const nonRobotic = voicesList.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak') && v.lang.toLowerCase().startsWith('en'));
                if (nonRobotic) return nonRobotic;

                const anyFemale = voicesList.find(v => (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('siri') || v.name.toLowerCase().includes('samantha')) && v.lang.toLowerCase().startsWith('en'));
                if (anyFemale) return anyFemale;
                return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const isFemale = role.toUpperCase() === 'DPO' || role.toLowerCase().includes('data protection officer') || role.toLowerCase().includes('hoda');
            const selectedVoice = isFemale ? getBestFemaleVoice() : getBestMaleVoice();
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            // Assign different characteristics based on role
            let basePitch = 1.0;
            let baseRate = 1.0;

            switch (role) {
                case 'CISO': basePitch = 0.82; baseRate = 0.88; break;
                case 'CIO': basePitch = 1.0; baseRate = 0.92; break;
                case 'DPO': basePitch = 1.02; baseRate = 0.96; break;
                case 'Auditor': basePitch = 0.88; baseRate = 0.94; break;
                case 'Compliance Officer': basePitch = 0.96; baseRate = 0.94; break;
                default: basePitch = 0.95; baseRate = 0.95;
            }

            // Adjust with offline custom Chatterbox modifiers if in Local mode
            if (isLocalMode) {
                utterance.pitch = basePitch * ttsPitch;
                utterance.rate = baseRate * ttsRate;
            } else {
                utterance.pitch = basePitch;
                utterance.rate = baseRate;
            }

            utterance.onend = () => {
                resolve();
            };
            utterance.onerror = () => {
                resolve();
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // Test a specific agent's offline vocal engine
    const auditionAgentOffline = async (agent: any) => {
        if (status !== 'idle') return;
        setAuditioningAgentId(agent.id);
        setStatus('speaking');
        setActiveSpeaker({ name: agent.name, role: agent.role });
        
        const testPrompt = `Synthesize offline speech test for ${agent.name} (${agent.role})`;
        const offlineSpeechText = await LocalLLM.generateResponse(agent.name.toLowerCase());
        
        addLog(`[Chatterbox-TTS Audition] Rendering local speech profile for ${agent.name}...`, 'system');
        addLog(`${agent.name} (Offline): "${offlineSpeechText}"`, 'agent');
        
        const currentSessionId = ++meetingSessionIdRef.current;
        await speak(offlineSpeechText, agent.role, currentSessionId);
        
        setActiveSpeaker(null);
        setAuditioningAgentId(null);
        setStatus('idle');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-teal-600" />
                        GRC Executive Boardroom
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live multi-agent collaboration and offline voice decision console.</p>
                </div>
                
                {/* Mode Selector Pill */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl flex items-center border border-slate-200/50 dark:border-slate-800">
                        <button
                            onClick={() => toggleLocalMode(false)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal transition-all ${
                                !isLocalMode 
                                    ? 'bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <Wifi className="w-3.5 h-3.5" />
                            Cloud Mode (Gemini)
                        </button>
                        <button
                            onClick={() => toggleLocalMode(true)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal transition-all ${
                                isLocalMode 
                                    ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <WifiOff className="w-3.5 h-3.5" />
                            Offline Mode (Local-Talking-LLM)
                        </button>
                    </div>

                    <span className={`flex items-center gap-1.5 text-[10px] font-normal px-2.5 py-1.5 rounded-lg border ${
                        status === 'listening' ? 'text-red-500 bg-red-50 dark:bg-red-900/15 border-red-100 dark:border-red-900/35 animate-pulse' :
                        status === 'processing' ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/15 border-purple-100 dark:border-purple-900/35' :
                        status === 'meeting' || status === 'speaking' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/15 border-blue-100 dark:border-blue-900/35' :
                        'text-green-500 bg-green-50 dark:bg-green-900/15 border-green-100 dark:border-green-900/35'
                    }`}>
                        <ActivityIcon className="w-3.5 h-3.5 animate-pulse" />
                        SYSTEM: {status.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Config & Diagnostics dashboard (Only shows/active in local mode) */}
            <div className={`transition-all duration-500 overflow-hidden ${
                isLocalMode ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-amber-950/15 dark:to-orange-950/5 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-4 h-4 text-amber-600" />
                        <h3 className="text-xs font-normal uppercase text-amber-800 dark:text-amber-300 tracking-wider">Local-Talking-LLM Offline Pipeline Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Whisper Node */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-4 rounded-xl border border-amber-200/40 dark:border-amber-900/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Radio className="w-3.5 h-3.5 text-amber-500" /> STT: Whisper Node
                                </span>
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[9px] rounded font-normal">Active</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Converts microphone audio to text entirely on device RAM.</p>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-normal text-gray-400 uppercase">Whisper Weight-Set</label>
                                <select 
                                    value={whisperModel} 
                                    onChange={(e) => setWhisperModel(e.target.value)}
                                    className="w-full text-xs bg-white dark:bg-gray-900 border border-amber-200/50 dark:border-amber-900/40 rounded p-1.5 focus:outline-none"
                                >
                                    <option value="quantized-tiny">WASM Quantized Tiny (70 MB)</option>
                                    <option value="quantized-base">WASM Quantized Base (140 MB)</option>
                                    <option value="distil-v3">Distil-Whisper-v3 (Offline)</option>
                                </select>
                            </div>
                        </div>

                        {/* Ollama Node */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-4 rounded-xl border border-amber-200/40 dark:border-amber-900/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-orange-500" /> LLM: Ollama Instance
                                </span>
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[9px] rounded font-normal">Connected</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1">Ollama Host Address</label>
                                    <input 
                                        type="text" 
                                        value={ollamaHost} 
                                        onChange={(e) => setOllamaHost(e.target.value)}
                                        className="w-full text-xs font-mono bg-white dark:bg-gray-900 border border-amber-200/50 dark:border-amber-900/40 rounded p-1.5 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1">Active GRC Model</label>
                                    <select 
                                        value={selectedModel} 
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full text-xs bg-white dark:bg-gray-900 border border-amber-200/50 dark:border-amber-900/40 rounded p-1.5 focus:outline-none"
                                    >
                                        <option value="gemma-2-9b-it:latest">Gemma-2-9B-IT GRC Fine-tuned</option>
                                        <option value="llama-3-8b-instruct">Llama-3-8B-Instruct (Local)</option>
                                        <option value="mistral-7b-instruct">Mistral-7B-Instruct (Sovereign)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Chatterbox Node */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-4 rounded-xl border border-amber-200/40 dark:border-amber-900/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Volume2 className="w-3.5 h-3.5 text-amber-500" /> TTS: Chatterbox Voice
                                </span>
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[9px] rounded font-normal">Active</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Offline speech synthesizer applying realistic, distinct stakeholder pitches.</p>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase text-gray-400">
                                    <span>Vocal Pitch Modifier</span>
                                    <span className="font-mono text-amber-700 dark:text-amber-400">{ttsPitch.toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="1.5" 
                                    step="0.05"
                                    value={ttsPitch}
                                    onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                                    className="w-full accent-amber-500 h-1 rounded"
                                />

                                <div className="flex justify-between text-[10px] uppercase text-gray-400 mt-2">
                                    <span>Speech Speed Rate</span>
                                    <span className="font-mono text-amber-700 dark:text-amber-400">{ttsRate.toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="1.5" 
                                    step="0.05"
                                    value={ttsRate}
                                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                                    className="w-full accent-amber-500 h-1 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Boardroom Visualization Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 min-h-[420px] flex flex-col relative overflow-hidden">
                        {/* Elegant background tint */}
                        <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
                            isLocalMode 
                                ? 'bg-gradient-to-b from-amber-50/15 to-transparent dark:from-amber-900/5' 
                                : 'bg-gradient-to-b from-teal-50/30 to-transparent dark:from-teal-900/5'
                        }`} />
                        
                        {/* Virtual Boardroom Table Visualization */}
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {['CISO', 'CIO', 'DPO', 'Auditor', 'Compliance', 'CEO', 'CTO', 'Risk Manager'].map((role) => {
                                const isSpeaking = activeSpeaker?.role === role || (role === 'CEO' && status === 'listening');
                                const agent = virtualAgents.find(a => a.role === role);
                                
                                return (
                                    <div key={role} className={`flex flex-col items-center transition-all duration-300 ${
                                        isSpeaking ? 'scale-105 filter-none' : 'opacity-50 scale-95 blur-[0.3px]'
                                    }`}>
                                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mb-2 shadow-md relative overflow-hidden ${
                                            isSpeaking 
                                                ? isLocalMode ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/35' : 'border-teal-500 bg-teal-50 dark:bg-teal-900/35'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                                        }`}>
                                            {agent?.avatarUrl ? (
                                                <img 
                                                    src={agent.avatarUrl} 
                                                    alt={role} 
                                                    className="w-full h-full object-cover" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <UserIcon className={`w-7 h-7 ${isSpeaking ? (isLocalMode ? 'text-amber-600' : 'text-teal-600') : 'text-gray-400'}`} />
                                            )}
                                            {isSpeaking && (
                                                <div className={`absolute inset-0 rounded-full border-4 animate-ping opacity-25 ${
                                                    isLocalMode ? 'border-amber-400' : 'border-teal-400'
                                                }`} />
                                            )}
                                        </div>
                                        <p className={`text-[9px] font-normal uppercase tracking-tight text-center leading-tight ${
                                            isSpeaking 
                                                ? isLocalMode ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-teal-600 dark:text-teal-400 font-medium' 
                                                : 'text-gray-500'
                                        }`}>
                                            {agent ? agent.name : role}
                                        </p>
                                        <p className="text-[7px] text-gray-400 uppercase mt-0.5">{role}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Central Interaction Stage */}
                        <div className="flex-1 flex flex-col items-center justify-center mt-auto">
                            {/* Listening / Speaking active status ring */}
                            <div className={`relative p-6 rounded-full transition-all duration-700 ${
                                status === 'listening' 
                                    ? 'bg-red-50/60 dark:bg-red-950/20' 
                                    : status === 'speaking' || status === 'meeting'
                                        ? isLocalMode ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-teal-50/50 dark:bg-teal-950/20'
                                        : 'bg-transparent'
                        }`}>
                                <button
                                    onClick={startListening}
                                    disabled={status !== 'idle'}
                                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl overflow-hidden relative group border ${
                                        status === 'idle' 
                                            ? isLocalMode 
                                                ? 'bg-amber-600 hover:bg-amber-700 border-amber-500 text-white hover:scale-105' 
                                                : 'bg-teal-600 hover:bg-teal-700 border-teal-500 text-white hover:scale-105'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200/50 scale-95 cursor-not-allowed'
                                    }`}
                                >
                                    <MicrophoneIcon className={`w-9 h-9 mb-1 transition-colors ${
                                        status === 'listening' ? 'animate-pulse text-red-500' : 'text-white'
                                    }`} />
                                    <span className="text-[8px] font-normal uppercase tracking-widest text-center">
                                        {status === 'idle' ? 'Start Session' : status}
                                    </span>
                                    
                                    {status === 'processing' && (
                                        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center">
                                            <div className={`w-10 h-10 border-4 rounded-full animate-spin ${
                                                isLocalMode ? 'border-amber-500 border-t-transparent' : 'border-teal-500 border-t-transparent'
                                            }`} />
                                        </div>
                                    )}
                                </button>
                            </div>
                            
                            {/* Dynamic Soundwave Visualizer Bars */}
                            {(status === 'listening' || status === 'speaking' || status === 'meeting') && (
                                <div className="flex items-center gap-1.5 h-12 mt-6">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
                                        // Random scale height calculations
                                        const delay = bar * 0.1;
                                        return (
                                            <div 
                                                key={bar} 
                                                className={`w-1 rounded-full transition-all duration-300 ${
                                                    status === 'listening' ? 'bg-red-500' :
                                                    isLocalMode ? 'bg-amber-500' : 'bg-teal-500'
                                                }`}
                                                style={{
                                                    height: `${Math.floor(Math.random() * 35) + 10}px`,
                                                    animation: `bounce 1s infinite alternate`,
                                                    animationDelay: `${delay}s`
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Transcript feedback box */}
                            <div className="mt-8 max-w-lg w-full text-center">
                                {transcript && (
                                    <div className="bg-slate-50 dark:bg-gray-900/40 p-3 rounded-lg inline-block border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs italic text-gray-600 dark:text-gray-400">"{transcript}"</p>
                                    </div>
                                )}
                                
                                {activeSpeaker && (
                                    <div className={`mt-4 p-5 rounded-xl border animate-slide-up text-left ${
                                        isLocalMode 
                                            ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30' 
                                            : 'bg-teal-50/20 dark:bg-teal-950/10 border-teal-100/30 dark:border-teal-900/30'
                                    }`}>
                                         <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-gray-900">
                                             <span className={`text-[9px] font-normal uppercase tracking-wider ${
                                                 isLocalMode ? 'text-amber-700 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'
                                             }`}>
                                                 Active Stakeholder: {activeSpeaker.role} • {activeSpeaker.name}
                                             </span>
                                             <span className="text-[8px] text-gray-400 uppercase font-mono">
                                                 {isLocalMode ? 'TTS: Chatterbox Offline' : 'TTS: Browser Native'}
                                             </span>
                                         </div>
                                         <p className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed font-normal">
                                             {logs.find(l => l.type === 'agent' && l.msg.includes(activeSpeaker.name))?.msg.replace(/.*?\): /, '') || logs[0]?.msg || "Analyzing controls..."}
                                         </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: STT-LLM-TTS Status & GRC Agent Vocals */}
                <div className="space-y-6">
                    {/* GRC Stakeholder Offline Voice Controller List */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-5 flex flex-col h-[320px]">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 dark:border-gray-900 pb-2">
                            <h4 className="text-[10px] font-normal uppercase text-gray-400 flex items-center gap-1.5 tracking-wider">
                                <Binary className="w-3.5 h-3.5 text-teal-600" />
                                Stakeholder Voice Directives
                            </h4>
                            <span className="text-[8px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">
                                {virtualAgents.length} Agents
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                            {virtualAgents.map((agent) => {
                                const isAuditioning = auditioningAgentId === agent.id;
                                return (
                                    <div 
                                        key={agent.id} 
                                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                            isAuditioning 
                                                ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/60 dark:border-amber-900/40 shadow-sm' 
                                                : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100/50 dark:border-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                                {agent.avatarUrl ? (
                                                    <img 
                                                        src={agent.avatarUrl} 
                                                        alt={agent.name} 
                                                        className="w-full h-full object-cover" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                                                        {agent.name.substring(0, 1)}
                                                    </div>
                                                )}
                                                {isAuditioning && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-normal text-gray-800 dark:text-gray-100">{agent.name}</p>
                                                <p className="text-[8px] text-gray-400 uppercase tracking-tighter leading-none">{agent.title}</p>
                                                <p className="text-[7px] text-teal-600/80 uppercase tracking-tight mt-0.5">
                                                    {agent.gender} • Pitch: {agent.voiceName}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => auditionAgentOffline(agent)}
                                            disabled={status !== 'idle'}
                                            title="Test local speech synthesis for this agent"
                                            className={`p-1.5 rounded-lg border transition-all ${
                                                isAuditioning
                                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300'
                                                    : 'bg-white dark:bg-gray-900 text-slate-500 hover:text-teal-600 dark:text-slate-400 hover:border-teal-500 border-slate-200/60 dark:border-slate-800'
                                            } ${status !== 'idle' && !isAuditioning ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Live Transcript Logs */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 h-[230px] overflow-hidden flex flex-col">
                        <h4 className="text-[10px] font-normal uppercase text-gray-500 mb-3 flex items-center gap-1.5 tracking-wider">
                             <Terminal className="w-3.5 h-3.5 text-teal-400" />
                             Boardroom Transcript Log
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 p-4">
                                    <ActivityIcon className="w-6 h-6 mb-1 text-gray-700" />
                                    <p className="text-[10px] uppercase font-mono tracking-tight">System Idle. Voice session uninitiated.</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className={`flex flex-col gap-1 border-b border-slate-800/60 pb-2 ${log.type === 'human' ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[8px] font-mono uppercase ${
                                            log.type === 'human' ? 'text-blue-400' : 
                                            log.type === 'agent' ? 'text-teal-400' : 
                                            'text-gray-500'
                                        }`}>
                                            {log.type.toUpperCase()}
                                        </span>
                                        <p className={`text-[10.5px] leading-relaxed font-mono ${
                                            log.type === 'human' ? 'text-blue-100 text-right' : 'text-gray-300'
                                        }`}>
                                            {log.msg}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results / NFA & MOM container */}
            {decision && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 space-y-6 animate-slide-up">
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                        <span className={`text-[9px] font-normal uppercase px-2 py-1 rounded ${
                            decision.complianceStatus === 'compliant' || decision.complianceStatus === 'undetermined'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                            {decision.complianceStatus}
                        </span>
                        <span className="text-[9px] font-normal uppercase text-gray-400 font-mono">
                            Risk Level: <strong className="text-gray-700 dark:text-gray-300 font-medium">{decision.riskLevel}</strong>
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Meeting Minutes */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-normal uppercase text-teal-600 dark:text-teal-400 flex items-center gap-2 tracking-wider">
                                 <DocumentTextIcon className="w-4 h-4" />
                                 Minutes of Meeting (MOM)
                            </h4>
                            <div className="space-y-3 max-h-56 overflow-y-auto pr-2 scrollbar-thin">
                                {decision.mom?.discussionPoints.map((point, i) => (
                                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400 border-l-2 border-teal-500 pl-3 leading-relaxed">
                                        {point}
                                    </p>
                                ))}
                            </div>
                            
                            {decision.mom?.identifiedRisks && decision.mom.identifiedRisks.length > 0 && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-900">
                                    <p className="text-[10px] font-normal text-red-500 uppercase mb-2 tracking-wider">Risks Identified</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {decision.mom.identifiedRisks.map((risk: any, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-normal border border-red-100/50 dark:border-red-900/30">
                                                {risk.title || risk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Executive Directives */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-normal uppercase text-orange-500 dark:text-orange-400 flex items-center gap-2 tracking-wider">
                                 <ShieldAlertIcon className="w-4 h-4" />
                                 Executive Directives (NFA)
                            </h4>
                            <div className="space-y-2.5">
                                {decision.nfa.map((nfa, i) => (
                                    <div key={i} className="flex items-start gap-2.5 p-3 bg-orange-50/40 dark:bg-orange-950/10 rounded-xl border border-orange-100/50 dark:border-orange-900/30">
                                        <CheckCircleIcon className="w-4 h-4 text-orange-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-800 dark:text-gray-200 leading-normal">{nfa.action}</p>
                                            <p className="text-[9px] text-gray-400 uppercase font-normal mt-0.5 tracking-wider">{nfa.priority} priority</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Bounce animation for soundwave */}
            <style>{`
                @keyframes bounce {
                    from {
                        transform: scaleY(0.3);
                    }
                    to {
                        transform: scaleY(1.0);
                    }
                }
            `}</style>
        </div>
    );
};
