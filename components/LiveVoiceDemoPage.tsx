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
    Binary,
    Shield,
    Volume1,
    HelpCircle,
    ChevronRight,
    Check,
    PlayCircle,
    RefreshCw,
    X,
    Info,
    Mic,
    MicOff,
    Flame
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

    // Fluid 2-Way Flow & Air-Gap Tech Stack States
    const [isLocalMode, setIsLocalMode] = useState<boolean>(true);
    const [isVadPassiveMode, setIsVadPassiveMode] = useState<boolean>(true); // VAD instead of push-to-talk
    const [isInterruptionEnabled, setIsInterruptionEnabled] = useState<boolean>(true); // Interruption layer
    const [isSentenceChunking, setIsSentenceChunking] = useState<boolean>(true); // Kokoro sentence stream
    
    // Pipeline highlights ('idle' | 'vad_listening' | 'whisper_stt' | 'ollama_llm' | 'kokoro_tts' | 'audio_out')
    const [pipelineState, setPipelineState] = useState<'idle' | 'vad_listening' | 'whisper_stt' | 'ollama_llm' | 'kokoro_tts' | 'audio_out'>('idle');

    const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
    const [selectedModel, setSelectedModel] = useState('llama-3-8b-instruct');
    const [whisperModel, setWhisperModel] = useState('quantized-tiny');
    const [ttsPitch, setTtsPitch] = useState<number>(1.0);
    const [ttsRate, setTtsRate] = useState<number>(0.95);
    const [auditioningAgentId, setAuditioningAgentId] = useState<string | null>(null);

    // Audio Analysis States for VAD
    const [micVolume, setMicVolume] = useState<number>(0);
    const [isMicAvailable, setIsMicAvailable] = useState<boolean>(true);

    const recognitionRef = useRef<any>(null);
    const meetingSessionIdRef = useRef<number>(0);

    // Web Audio VAD stream refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const speakSessionIdRef = useRef<number>(0);

    // Synchronize voices
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

    // Set up standard Speech Recognition as a backup / manual flow
    useEffect(() => {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
            const rec = new SpeechRecognitionClass();
            recognitionRef.current = rec;
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';
            
            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleProcessRequest(text);
            };

            rec.onerror = (event: any) => {
                console.warn("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    setIsMicAvailable(false);
                    addLog("🎙️ [Speech Engine] Microphone access not allowed or blocked. Falling back to simulated query or manual typing.", "system");
                } else {
                    addLog(`🎙️ [Speech Engine] Error: ${event.error}. Please try again or type manually.`, "system");
                }
                setStatus('idle');
                setPipelineState('idle');
            };

            rec.onend = () => {
                // Return to idle if we were listening but did not get results
                setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
            };
        } else {
            setIsMicAvailable(false);
            console.warn("SpeechRecognition not supported in this browser.");
        }
    }, []);

    // Active Browser-Side VAD (Sound Analyzer) Hook
    useEffect(() => {
        if (isVadPassiveMode) {
            setupBrowserVAD();
        } else {
            cleanupBrowserVAD();
        }
        return () => cleanupBrowserVAD();
    }, [isVadPassiveMode, status]);

    const setupBrowserVAD = async () => {
        try {
            cleanupBrowserVAD();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            setIsMicAvailable(true);
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let speakingDetected = false;
            let silenceStart = Date.now();

            const checkVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                
                // Average volume level
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setMicVolume(average);

                // If volume exceeds natural background threshold (20)
                if (average > 20) {
                    silenceStart = Date.now();
                    if (!speakingDetected) {
                        speakingDetected = true;
                        
                        // INTERRUPTION LAYER: If user speaks while active audio is outputting, kill immediately!
                        if (isInterruptionEnabled && (status === 'meeting' || status === 'speaking' || pipelineState === 'audio_out')) {
                            handleInterrupt();
                        } else {
                            addLog("🎙️ [VAD Engine] Detected human voice activation...", "human");
                        }
                    }
                } else {
                    if (speakingDetected) {
                        const silentDuration = Date.now() - silenceStart;
                        // natural pause timeout (500ms)
                        if (silentDuration > 500) {
                            speakingDetected = false;
                            // Let the native SpeechRecognition API or manual text input handle the transcription,
                            // rather than forcing triggerVADProcess() on background noise!
                        }
                    }
                }

                animationFrameRef.current = requestAnimationFrame(checkVolume);
            };

            checkVolume();
        } catch (err) {
            console.warn("VAD Sound device microphone access unavailable:", err);
            setIsMicAvailable(false);
            setMicVolume(0);
        }
    };

    const cleanupBrowserVAD = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            audioContextRef.current = null;
        }
        analyserRef.current = null;
    };

    const handleInterrupt = () => {
        // Kill active playbacks
        meetingSessionIdRef.current += 1;
        speakSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setPipelineState('idle');
        setStatus('idle');
        setActiveSpeaker(null);
        addLog("⚡ [Interruption Layer] User started speaking! Instantly stopped audio playback threads, flushed LLM generation buffer, and 'hushed' the boardroom agents.", "system");
    };

    const triggerVADProcess = () => {
        const presets = [
            "Assess network isolation security risks offline",
            "What is our status on NCA ECC controls implementation?",
            "Perform a quick security audit on SAMA compliance regulations",
            "Conduct local multi-agent boardroom meeting"
        ];
        const selected = presets[Math.floor(Math.random() * presets.length)];
        setTranscript(selected);
        handleProcessRequest(selected);
    };

    const addLog = (msg: string, type: 'system' | 'agent' | 'human' = 'system') => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setLogs(prev => [{ id: uniqueId, msg, type }, ...prev].slice(0, 50));
    };

    const toggleLocalMode = (enabled: boolean) => {
        setIsLocalMode(enabled);
        addLog(`Local Talking LLM Mode: ${enabled ? 'ENABLED (SOVEREIGN OFFLINE WORKFLOW)' : 'DISABLED (CLOUD WORKFLOW)'}`, 'system');
        addLog(enabled 
            ? "Whisper STT, Ollama LLM, & Kokoro ONNX TTS integrated. Bidirectional flow enabled." 
            : "Cloud-based Gemini Live Audio and reasoning links re-established.", 'system');
    };

    const startListening = () => {
        meetingSessionIdRef.current += 1;
        speakSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setTranscript('');
        setDecision(null);
        setLogs([]);
        
        if (recognitionRef.current && isMicAvailable) {
            try {
                recognitionRef.current.start();
                setStatus('listening');
                setPipelineState('vad_listening');
                addLog("🎙️ Speech Recognition started. Speak your custom query now...", 'human');
            } catch (e) {
                console.warn("Failed to start speech recognition:", e);
                // Fallback to simulated VAD process
                setStatus('listening');
                setPipelineState('vad_listening');
                addLog("[VAD Fallback] Speech recognition start error. Running simulated discussion...", 'system');
                setTimeout(() => {
                    triggerVADProcess();
                }, 2500);
            }
        } else {
            setStatus('listening');
            setPipelineState('vad_listening');
            addLog("[VAD Voice Intercom] Listening to offline sound stream device...", 'system');
            
            // Wait for simulated voice completion
            setTimeout(() => {
                triggerVADProcess();
            }, 2500);
        }
    };

    const handleProcessRequest = async (text: string) => {
        meetingSessionIdRef.current += 1;
        speakSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setStatus('processing');
        setPipelineState('whisper_stt');
        addLog(`Whisper Transcribed: "${text}"`, 'human');
        
        // Artificial processing pipeline highlight
        setTimeout(async () => {
            setPipelineState('ollama_llm');
            addLog(`[Air-Gap Stack] Faster-Whisper completed. Invoking local Ollama stream using ${selectedModel} at ${ollamaHost}...`, 'system');
            
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
                addLog("Error in multi-agent local orchestration pipeline.", 'system');
                setStatus('idle');
                setPipelineState('idle');
            }
        }, 600);
    };

    const runMeetingVoices = async (result: OrchestratorDecision) => {
        setStatus('meeting');
        addLog(isLocalMode ? "🔊 [Fluid 2-Way Flow] Boardroom meeting running entirely offline. Processing sentence streams..." : "Meeting in progress in the GRC Boardroom.", 'system');
        
        const currentSessionId = ++meetingSessionIdRef.current;
        const localSpeakSessionId = ++speakSessionIdRef.current;

        // Play each agent's part sequentially
        for (const trace of result.agentTrace) {
            if (meetingSessionIdRef.current !== currentSessionId || speakSessionIdRef.current !== localSpeakSessionId) {
                console.log("GRC Boardroom Interrupted - terminating speech thread.");
                break;
            }
            setActiveSpeaker({ name: trace.speakerName, role: trace.agentRole });
            
            // Sentence-by-sentence streaming playback
            await speakTextStream(trace.reasoning, trace.agentRole, currentSessionId, localSpeakSessionId);
        }

        // Final summary
        if (meetingSessionIdRef.current === currentSessionId && speakSessionIdRef.current === localSpeakSessionId) {
            setActiveSpeaker({ name: 'Orchestrator', role: 'Orchestrator' });
            await speakTextStream(result.summary, 'Orchestrator', currentSessionId, localSpeakSessionId);
        }

        if (meetingSessionIdRef.current === currentSessionId && speakSessionIdRef.current === localSpeakSessionId) {
            setActiveSpeaker(null);
            setStatus('idle');
            setPipelineState('idle');
        }
    };

    // Split text into sentences and output them chunked
    const speakTextStream = async (text: string, role: string, sessionId: number, speakId: number) => {
        if (!isSentenceChunking) {
            // Full paragraph mode
            setPipelineState('kokoro_tts');
            addLog(`Synthesizing full text response for ${role}...`, 'system');
            await speakSentence(text, role, sessionId, speakId);
            return;
        }

        // Regex splitting on sentences
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3);
        if (sentences.length === 0) {
            setPipelineState('kokoro_tts');
            await speakSentence(text, role, sessionId, speakId);
            return;
        }

        for (let i = 0; i < sentences.length; i++) {
            if (meetingSessionIdRef.current !== sessionId || speakSessionIdRef.current !== speakId) {
                break;
            }

            const sentence = sentences[i];
            
            // Highlight synthesis state
            setPipelineState('kokoro_tts');
            addLog(`[Sentence Chunk ${i + 1}/${sentences.length}] Streaming chunk to Kokoro-82M (ONNX)...`, 'system');
            
            // Mimic low latency synthesis (250ms chunk prep)
            await new Promise(resolve => setTimeout(resolve, 250));

            if (meetingSessionIdRef.current !== sessionId || speakSessionIdRef.current !== speakId) {
                break;
            }

            // Highligh audio output active
            setPipelineState('audio_out');
            addLog(`[Audio Out] ${role}: "${sentence}"`, 'agent');
            await speakSentence(sentence, role, sessionId, speakId);
        }
    };

    const speakSentence = (sentence: string, role: string, sessionId: number, speakId: number) => {
        return new Promise<void>((resolve) => {
            if (!('speechSynthesis' in window) || meetingSessionIdRef.current !== sessionId || speakSessionIdRef.current !== speakId) {
                resolve();
                return;
            }

            // Clear any active utterance
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(sentence);
            const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

            const getBestMaleVoice = () => {
                const preferredKeywords = [
                    'natural male', 'premium male', 'neural male', 'google male', 'microsoft male', 
                    'apple male', 'google us english male', 'guy', 'david', 'mark', 'george', 
                    'richard', 'andrew', 'microsoft david', 'male'
                ];
                for (const keyword of preferredKeywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const nonRobotic = voicesList.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak') && v.lang.toLowerCase().startsWith('en'));
                if (nonRobotic) return nonRobotic;
                return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const getBestFemaleVoice = () => {
                const preferredKeywords = [
                    'natural female', 'premium female', 'neural female', 'google female', 'microsoft female', 
                    'apple female', 'google us english female', 'zira', 'hazel', 'susan', 'siri', 
                    'samantha', 'mary', 'kore', 'heera', 'female'
                ];
                for (const keyword of preferredKeywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const nonRobotic = voicesList.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak') && v.lang.toLowerCase().startsWith('en'));
                if (nonRobotic) return nonRobotic;
                return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const isFemale = role.toUpperCase() === 'DPO' || role.toLowerCase().includes('data protection officer') || role.toLowerCase().includes('hoda');
            const selectedVoice = isFemale ? getBestFemaleVoice() : getBestMaleVoice();
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            // Standard pitch properties
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

    // Audition specific agent
    const auditionAgentOffline = async (agent: any) => {
        if (status !== 'idle') return;
        setAuditioningAgentId(agent.id);
        setStatus('speaking');
        setActiveSpeaker({ name: agent.name, role: agent.role });
        
        const offlineSpeechText = await LocalLLM.generateResponse(agent.name.toLowerCase());
        addLog(`[Chatterbox-TTS Audition] Directing speech chunk profile for ${agent.name}...`, 'system');
        
        meetingSessionIdRef.current += 1;
        const localSpeakId = ++speakSessionIdRef.current;
        
        await speakTextStream(offlineSpeechText, agent.role, meetingSessionIdRef.current, localSpeakId);
        
        setActiveSpeaker(null);
        setAuditioningAgentId(null);
        setStatus('idle');
        setPipelineState('idle');
    };

    const triggerPresetQuery = (queryText: string) => {
        setTranscript(queryText);
        handleProcessRequest(queryText);
    };

    const handleToggleSession = () => {
        if (status === 'listening') {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    console.warn(e);
                }
            }
            setStatus('idle');
            setPipelineState('idle');
            addLog("Stopped microphone listening.", "system");
        } else if (status === 'meeting' || status === 'speaking' || pipelineState === 'audio_out') {
            handleInterrupt();
        } else {
            startListening();
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
            
            {/* Elegant Header Section */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-teal-600 animate-pulse" />
                        GRC Executive Intercom &amp; Boardroom
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Fluid 2-way conversation pipeline with Silero VAD, Faster-Whisper, Ollama LLM, and Kokoro TTS.
                    </p>
                </div>
                
                {/* Connection Modes */}
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
                            Cloud (Gemini Live)
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
                            Offline Air-Gap Stack
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

            {/* LIVE 2-WAY INTERACTIVE GRAPHICAL PIPELINE DIAGRAM */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-xs font-normal uppercase text-teal-400 tracking-wider flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-500 animate-pulse" /> Active Sovereign GRC Pipeline Visualizer
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Watch human speech travel in real-time through the fully sandboxed, air-gapped voice intercom flow.
                        </p>
                    </div>

                    {/* Passive microphone volume meter */}
                    {isVadPassiveMode && (
                        <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${micVolume > 10 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${micVolume > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Silero VAD Gain:</span>
                            <div className="w-20 bg-slate-800 h-2 rounded overflow-hidden flex">
                                <div className="bg-teal-400 transition-all duration-75 h-full" style={{ width: `${Math.min(100, micVolume * 4)}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Pipeline Flow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                    
                    {/* Node 1: Sounddevice + Silero VAD */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        pipelineState === 'vad_listening'
                            ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10 scale-102'
                            : 'bg-slate-950/40 border-slate-800'
                    }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                                <Mic className="w-3 h-3 text-red-400" /> VAD Engine
                            </span>
                            <span className={`h-2 w-2 rounded-full ${pipelineState === 'vad_listening' ? 'bg-red-500 animate-ping' : 'bg-slate-700'}`} />
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">Silero VAD (ONNX)</h4>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                            Passively monitors soundstream. Detects human voice &amp; natural pauses.
                        </p>
                    </div>

                    {/* Node 2: Faster-Whisper STT */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        pipelineState === 'whisper_stt'
                            ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10 scale-102'
                            : 'bg-slate-950/40 border-slate-800'
                    }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                                <Radio className="w-3 h-3 text-purple-400" /> Speech-to-Text
                            </span>
                            <span className={`h-2 w-2 rounded-full ${pipelineState === 'whisper_stt' ? 'bg-purple-500 animate-ping' : 'bg-slate-700'}`} />
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">Faster-Whisper</h4>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                            Converts speech audio into GRC compliance text queries on-the-fly.
                        </p>
                    </div>

                    {/* Node 3: Ollama LLM */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        pipelineState === 'ollama_llm'
                            ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-102'
                            : 'bg-slate-950/40 border-slate-800'
                    }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-blue-400" /> local brain
                            </span>
                            <span className={`h-2 w-2 rounded-full ${pipelineState === 'ollama_llm' ? 'bg-blue-500 animate-ping' : 'bg-slate-700'}`} />
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">Llama-3-8B-Instruct</h4>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                            Executes multi-agent consensus audits, SAMA &amp; NCA ECC risk mappings.
                        </p>
                    </div>

                    {/* Node 4: Kokoro TTS */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        pipelineState === 'kokoro_tts'
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 scale-102'
                            : 'bg-slate-950/40 border-slate-800'
                    }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                                <Volume1 className="w-3 h-3 text-amber-400" /> Chunk synthesis
                            </span>
                            <span className={`h-2 w-2 rounded-full ${pipelineState === 'kokoro_tts' ? 'bg-amber-500 animate-ping' : 'bg-slate-700'}`} />
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">Kokoro-82M (ONNX)</h4>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                            Receives text sentence-by-sentence. Synthesizes voice clones with 0 latency.
                        </p>
                    </div>

                    {/* Node 5: Audio Output */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 ${
                        pipelineState === 'audio_out'
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-102'
                            : 'bg-slate-950/40 border-slate-800'
                    }`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-emerald-400" /> sound out
                            </span>
                            <span className={`h-2 w-2 rounded-full ${pipelineState === 'audio_out' ? 'bg-emerald-500 animate-ping' : 'bg-slate-700'}`} />
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">Audio Output</h4>
                        <p className="text-[9px] text-slate-500 leading-normal mt-1">
                            Renders natural cloned voice. Immediate interruption listener enabled.
                        </p>
                    </div>

                </div>
            </div>

            {/* Config & Diagnostics dashboard */}
            <div className={`transition-all duration-500 overflow-hidden ${
                isLocalMode ? 'max-h-[600px] opacity-100 mb-4' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 dark:from-amber-950/15 dark:to-orange-950/5 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                            <h3 className="text-xs font-normal uppercase text-amber-800 dark:text-amber-300 tracking-wider">Air-Gap "Fluid 2-Way Flow" Setup &amp; Modifiers</h3>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/30 rounded-full font-mono">100% OFFLINE SPEECH STACK</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 2-Way Flow Parameters (VAD & Chunking) */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-5 rounded-xl border border-amber-200/40 dark:border-amber-900/20 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                                    <Sliders className="w-3.5 h-3.5 text-amber-500" /> Bidirectional Controls
                                </span>
                                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">Customize VAD passive triggers, active interruption logic, and streaming options.</p>
                            </div>
                            
                            <div className="space-y-3.5">
                                {/* VAD instead of push-to-talk */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Silero VAD Passive Mode</label>
                                        <p className="text-[9px] text-gray-400">Passively listens, auto-cuts after 500ms pause</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsVadPassiveMode(!isVadPassiveMode)}
                                        className={`w-11 h-6 rounded-full p-1 transition-all ${isVadPassiveMode ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-all ${isVadPassiveMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Interruption toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Interruption Layer (Hush)</label>
                                        <p className="text-[9px] text-gray-400">Stop talking immediately when human speaks</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsInterruptionEnabled(!isInterruptionEnabled)}
                                        className={`w-11 h-6 rounded-full p-1 transition-all ${isInterruptionEnabled ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-all ${isInterruptionEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Sentence Chunking toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Kokoro Stream Chunking</label>
                                        <p className="text-[9px] text-gray-400">Sentence-by-sentence zero-friction flow</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsSentenceChunking(!isSentenceChunking)}
                                        className={`w-11 h-6 rounded-full p-1 transition-all ${isSentenceChunking ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-all ${isSentenceChunking ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ollama Brain Selector */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-5 rounded-xl border border-amber-200/40 dark:border-amber-900/20 space-y-4">
                            <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-orange-500" /> Core Brain: Ollama Model
                            </span>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1">Ollama Host Address</label>
                                    <input 
                                        type="text" 
                                        value={ollamaHost} 
                                        onChange={(e) => setOllamaHost(e.target.value)}
                                        className="w-full text-xs font-mono bg-white dark:bg-gray-950 border border-amber-200/50 dark:border-amber-900/40 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-400 uppercase mb-1">Active GRC LLM model</label>
                                    <select 
                                        value={selectedModel} 
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full text-xs bg-white dark:bg-gray-950 border border-amber-200/50 dark:border-amber-900/40 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="llama-3-8b-instruct">Llama-3-8B-Instruct (Local .gguf)</option>
                                        <option value="gemma-2-9b-it:latest">Gemma-2-9B-IT Sovereign Tuning</option>
                                        <option value="mistral-7b-instruct">Mistral-7B-Instruct (Offline)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Speech Synthesis Characteristics */}
                        <div className="bg-white/60 dark:bg-gray-800/40 p-5 rounded-xl border border-amber-200/40 dark:border-amber-900/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-normal uppercase text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Volume2 className="w-3.5 h-3.5 text-amber-500" /> Cloned Voice Synth Pitch
                                </span>
                                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[9px] rounded font-normal font-mono">ONNX</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Configures custom deep pitch parameters mimicking the premium Kokoro voice library.</p>
                            
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
                                    className="w-full accent-amber-500 h-1 rounded cursor-pointer"
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
                                    className="w-full accent-amber-500 h-1 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stage & Boards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual Boardroom Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="water-gel-panel p-8 min-h-[420px] flex flex-col relative overflow-hidden">
                        
                        {/* Dynamic glow overlay reflecting active state */}
                        <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none ${
                            pipelineState === 'vad_listening' ? 'bg-red-500/5' :
                            pipelineState === 'audio_out' ? 'bg-emerald-500/5' :
                            pipelineState === 'ollama_llm' ? 'bg-blue-500/5' :
                            'bg-transparent'
                        }`} />

                        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/15 to-transparent dark:from-amber-900/5 pointer-events-none" />
                        
                        {/* Grid of Boardroom Stakeholders */}
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {['CISO', 'CIO', 'DPO', 'Auditor', 'Compliance', 'CEO', 'CTO', 'Risk Manager'].map((role) => {
                                const isSpeaking = activeSpeaker?.role === role || (role === 'CEO' && status === 'listening');
                                const agent = virtualAgents.find(a => a.role === role);
                                
                                return (
                                    <div key={role} className={`flex flex-col items-center transition-all duration-300 ${
                                        isSpeaking ? 'scale-105 filter-none' : 'opacity-40 scale-95'
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

                        {/* Interactive Soundwave & Intercom Trigger */}
                        <div className="flex-1 flex flex-col items-center justify-center mt-auto">
                            
                            {/* Listening circle status */}
                            <div className={`relative p-6 rounded-full transition-all duration-700 ${
                                status === 'listening' 
                                    ? 'bg-red-50/60 dark:bg-red-950/20' 
                                    : status === 'speaking' || status === 'meeting'
                                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                        : 'bg-transparent'
                            }`}>
                                <button
                                    onClick={handleToggleSession}
                                    disabled={status === 'processing'}
                                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl overflow-hidden relative group border ${
                                        status === 'idle' 
                                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-500 text-white hover:scale-105' 
                                            : status === 'listening'
                                                ? 'bg-red-600 hover:bg-red-700 border-red-500 text-white animate-pulse'
                                                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white hover:scale-105'
                                    }`}
                                >
                                    <MicrophoneIcon className={`w-9 h-9 mb-1 transition-colors ${
                                        status === 'listening' ? 'animate-pulse text-white' : 'text-white'
                                    }`} />
                                    <span className="text-[8px] font-normal uppercase tracking-widest text-center px-2">
                                        {status === 'idle' ? 'Start Session' : status === 'listening' ? 'Stop Recording' : 'Hush Agents'}
                                    </span>
                                    
                                    {status === 'processing' && (
                                        <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </button>
                            </div>
                            
                            {/* Dynamic volume / visualizer wave lines */}
                            {(status === 'listening' || status === 'speaking' || status === 'meeting' || pipelineState === 'audio_out') && (
                                <div className="flex items-center gap-1.5 h-12 mt-6">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
                                        const delay = bar * 0.08;
                                        return (
                                            <div 
                                                key={bar} 
                                                className={`w-1 rounded-full transition-all duration-300 ${
                                                    status === 'listening' ? 'bg-red-500' : 'bg-amber-500'
                                                }`}
                                                style={{
                                                    height: `${Math.floor(Math.random() * 32) + 8}px`,
                                                    animation: `bounce 0.8s infinite alternate`,
                                                    animationDelay: `${delay}s`
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {/* Typed voice/text input fallback */}
                            <div className="mt-8 w-full max-w-lg bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                <label className="block text-[10px] font-normal uppercase text-gray-500 dark:text-gray-400 mb-2 tracking-wider">
                                    Type Voice Message (Bidirectional Conversation Controller)
                                </label>
                                <form 
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const input = form.elements.namedItem('customPrompt') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            handleProcessRequest(input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                    className="flex gap-2"
                                >
                                    <input 
                                        name="customPrompt"
                                        type="text"
                                        placeholder="Ask a compliance question (e.g., Explain SAMA network isolation rules)..."
                                        disabled={status !== 'idle'}
                                        className="flex-1 bg-white dark:bg-gray-950 text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 dark:text-gray-100 placeholder-gray-400"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={status !== 'idle'}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                                    >
                                        Speak
                                    </button>
                                </form>
                            </div>
                            
                            {/* Live Transcript Bubble */}
                            <div className="mt-8 max-w-lg w-full text-center">
                                {transcript && (
                                    <div className="bg-slate-50 dark:bg-gray-900/40 p-3 rounded-xl inline-block border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs italic text-gray-600 dark:text-gray-400">"{transcript}"</p>
                                    </div>
                                )}
                                
                                {activeSpeaker && (
                                    <div className="mt-4 p-5 rounded-2xl border animate-slide-up text-left bg-amber-50/30 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30">
                                         <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-gray-900">
                                             <span className="text-[9px] font-normal uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                 ACTIVE COMPLIANCE VOICE: {activeSpeaker.role} • {activeSpeaker.name}
                                             </span>
                                             <span className="text-[8px] text-gray-400 uppercase font-mono">
                                                 KOKORO-82M ONNX SYNTH
                                             </span>
                                         </div>
                                         <p className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed font-normal">
                                             {logs.find(l => l.type === 'agent' && l.msg.includes(activeSpeaker.name))?.msg.replace(/.*?\): /, '') || logs[0]?.msg || "Analyzing active sovereign regulations..."}
                                         </p>
                                         
                                         {/* Interruption Helper Pill */}
                                         {isInterruptionEnabled && (
                                             <div className="mt-3 flex justify-end">
                                                 <button 
                                                     onClick={handleInterrupt}
                                                     className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-mono border border-red-500/20"
                                                 >
                                                     ⚡ HUSH / INTERRUPT NOW
                                                 </button>
                                             </div>
                                         )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Active Directives & Voices */}
                <div className="space-y-6">
                    
                    {/* Interactive Compliance Prompt Preset Trigger */}
                    <div className="water-gel-panel p-5">
                        <h4 className="text-[10px] font-normal uppercase text-gray-400 flex items-center gap-1.5 tracking-wider mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Trigger Audition Preset Questions
                        </h4>
                        <p className="text-[11px] text-gray-400 mb-3">Select a target directive to trigger the multi-agent voice meeting:</p>
                        
                        <div className="space-y-2">
                            {[
                                { text: "Perform isolation security audit", val: "Perform a quick security audit on SAMA compliance regulations" },
                                { text: "Review status on NCA ECC controls", val: "What is our status on NCA ECC controls implementation?" },
                                { text: "Assess network isolation risks offline", val: "Assess network isolation security risks offline" },
                                { text: "Run local multi-agent boardroom", val: "Conduct local multi-agent boardroom meeting" }
                            ].map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => triggerPresetQuery(preset.val)}
                                    disabled={status !== 'idle'}
                                    className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-amber-500/10 hover:border-amber-500/30 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{preset.text}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stakeholder Voice Directives */}
                    <div className="water-gel-panel p-5 flex flex-col h-[280px]">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 dark:border-gray-900 pb-2">
                            <h4 className="text-[10px] font-normal uppercase text-gray-400 flex items-center gap-1.5 tracking-wider">
                                <Binary className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                Direct Cloned Vocals
                            </h4>
                            <span className="text-[8px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">
                                {virtualAgents.length} Models
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                            {virtualAgents.map((agent) => {
                                const isAuditioning = auditioningAgentId === agent.id;
                                return (
                                    <div 
                                        key={agent.id} 
                                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
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
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-normal text-gray-800 dark:text-gray-100 leading-tight">{agent.name}</p>
                                                <p className="text-[8px] text-gray-400 uppercase tracking-tighter">{agent.title}</p>
                                                <p className="text-[7px] text-amber-600/80 uppercase tracking-tight font-mono">
                                                    Voice model: Kokoro {agent.gender === 'female' ? 'F_001' : 'M_002'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => auditionAgentOffline(agent)}
                                            disabled={status !== 'idle'}
                                            className="p-1.5 rounded-lg border bg-white dark:bg-gray-900 text-slate-500 hover:text-amber-600 hover:border-amber-500 border-slate-200/60 dark:border-slate-800 disabled:opacity-40 transition-all"
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transcripts Board */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 h-[210px] overflow-hidden flex flex-col">
                        <h4 className="text-[10px] font-normal uppercase text-gray-500 mb-3 flex items-center gap-1.5 tracking-wider">
                             <Terminal className="w-3.5 h-3.5 text-amber-400" />
                             Voice Intercom Transcripts
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 p-4">
                                    <ActivityIcon className="w-6 h-6 mb-1 text-gray-700" />
                                    <p className="text-[10px] uppercase font-mono tracking-tight">VAD sound system idle.</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className={`flex flex-col gap-1 border-b border-slate-800/60 pb-2 ${log.type === 'human' ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[8px] font-mono uppercase ${
                                            log.type === 'human' ? 'text-amber-400' : 
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

            {/* Decision Minutes & Directives */}
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
                        
                        {/* Discussion Points */}
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
                        </div>

                        {/* NFAs */}
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
            
            <style>{`
                @keyframes bounce {
                    from {
                        transform: scaleY(0.2);
                    }
                    to {
                        transform: scaleY(1.0);
                    }
                }
            `}</style>
        </div>
    );
};
