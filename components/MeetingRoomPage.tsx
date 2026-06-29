import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { virtualAgents } from '../data/virtualAgents';
import { SparklesIcon, PhoneIcon, MicrophoneIcon } from './Icons';
import { AIService } from '../services/aiService';
import { sampleCyberSkills } from '../data/cybersecuritySkills';
import { LiveGeminiVoiceService } from '../services/live.gemini';
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

// --- TRANSCRIPT MODEL FOR SEARCHABLE MULTI-AGENT MOM ---
interface TranscriptLog {
    id: string;
    timestamp: string;
    speakerId: string;
    speakerName: string;
    speakerRole: string;
    avatarUrl: string;
    message: string;
    anchoredClause?: string;      // Clashing or targeted SAMA/NCA/PDPL Clause
    anchoredFramework?: string;   // e.g. "NCA ECC", "SAMA CSF", "PDPL", "ISO 31000"
    evidenceFile?: string;        // Mapped RAG evidence file
    isAlert?: boolean;            // Alert badge indicator
    vote?: 'Approve' | 'Reject' | 'Abstain'; // Voting status
}

export const MeetingRoomPage: React.FC<MeetingRoomPageProps> = ({ currentUser }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
    const [activeSpeakerText, setActiveSpeakerText] = useState<string>('');
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

    // --- EXTENDED GRC BOARD STATES ---
    const [transcript, setTranscript] = useState<TranscriptLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [discrepancy, setDiscrepancy] = useState<{ id: string; agent1: string; agent2: string; details: string; clause1: string; clause2: string } | null>(null);
    const [activeVote, setActiveVote] = useState<{ topic: string; votes: Record<string, 'Approve' | 'Reject' | 'Abstain'>; status: 'idle' | 'voting' | 'completed'; tallies: { Approve: number; Reject: number; Abstain: number } } | null>(null);

    const recognitionRef = useRef<any>(null);

    // Web Audio API refs for Chairperson voice "Barge-In" detection threshold
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Synchronize voices natively
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

        if (currentUser) {
            initial.push({
                id: currentUser.id || 'boardroom-user',
                name: `${currentUser.name} (You)`,
                role: currentUser.role,
                avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop',
                isSpeaking: false,
                hasLaptop: true,
                hasMic: isMicEnabled,
                isHuman: true
            });
        }

        setParticipants(initial);
    }, [currentUser, isMicEnabled]);

    // Auto-request microphone permission on mount for hands-free and clear mic indicators
    useEffect(() => {
        const autoEnableMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                setIsMicEnabled(true);
            } catch (err) {
                console.warn("Auto mic permission deferred or denied:", err);
            }
        };
        autoEnableMic();
    }, []);

    // Register voice interruption event handler to immediately update speaking status
    useEffect(() => {
        LiveGeminiVoiceService.setOnInterrupt(() => {
            setActiveSpeakerId(currentUser?.id || 'boardroom-user');
            setActiveSpeakerText('Listening...');
        });
        return () => {
            LiveGeminiVoiceService.setOnInterrupt(() => {});
        };
    }, [currentUser]);

    // Real-Time Audio Analyser for Chairperson Barge-In Threshold monitoring
    useEffect(() => {
        if (isMeetingActive && isMicEnabled) {
            let stream: MediaStream | null = null;
            const startAnalyser = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext = new AudioContextClass();
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    const source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);

                    audioContextRef.current = audioContext;
                    analyserRef.current = analyser;
                    microphoneRef.current = source;

                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const checkVolume = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / bufferLength;
                        
                        // Speak detection threshold (average > 30 is regular speaking volume)
                        if (average > 30) {
                            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                                console.log("🎙️ [Barge-In Interruption] Chairperson verbal input detected. Terminating board playback.");
                                LiveGeminiVoiceService.interrupt();
                                window.speechSynthesis.cancel();
                            }
                        }
                        animationFrameRef.current = requestAnimationFrame(checkVolume);
                    };
                    checkVolume();
                } catch (err) {
                    console.error("Failed to start audio analyzer for barge-in", err);
                }
            };
            startAnalyser();
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (microphoneRef.current) {
                    microphoneRef.current.disconnect();
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [isMeetingActive, isMicEnabled]);

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
                setActiveSpeakerId(currentUser?.id || 'boardroom-user');
                setActiveSpeakerText('Listening...');
                LiveGeminiVoiceService.interrupt();
            };

            rec.onspeechstart = () => {
                LiveGeminiVoiceService.interrupt();
            };

            rec.onsoundstart = () => {
                LiveGeminiVoiceService.interrupt();
            };

            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setHumanTranscript(text);
                setActiveSpeakerText(text);
                handleSpeakToBoard(text);
            };

            rec.onend = () => {
                setIsListening(false);
                setHumanTranscript('');
                setActiveSpeakerId(null);
                setActiveSpeakerText('');
            };

            recognitionRef.current = rec;
        }
    }, [selectedLanguage, currentUser]);

    // Responsive continuous hands-free listening loop
    useEffect(() => {
        if (isMeetingActive && isMicEnabled && !isProcessingHumanInput && !isListening) {
            const timer = setTimeout(() => {
                startListeningUser();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isMeetingActive, isMicEnabled, isProcessingHumanInput, isListening]);

    // Helper GRC Anchor mapper linking verbal discussion to precise compliance clauses
    const getGRCAnchor = (text: string, role: string) => {
        const textLower = text.toLowerCase();
        const roleUpper = role.toUpperCase();

        if (roleUpper === 'CISO' || textLower.includes('security') || textLower.includes('protection') || textLower.includes('firewall') || textLower.includes('encryption')) {
            return {
                clause: "NCA ECC-1-2-1 (Cybersecurity Management)",
                framework: "NCA ECC",
                file: "ECC_Implementation_Guidelines_v2024.pdf"
            };
        }
        if (roleUpper === 'CTO' || textLower.includes('cloud') || textLower.includes('server') || textLower.includes('infrastructure') || textLower.includes('api') || textLower.includes('architecture')) {
            return {
                clause: "SAMA CSF Section 3.4.3 (Cloud Computing & Hosting)",
                framework: "SAMA CSF",
                file: "SAMA_Cyber_Security_Framework_v1.0.pdf"
            };
        }
        if (roleUpper === 'DPO' || textLower.includes('privacy') || textLower.includes('personal data') || textLower.includes('gdpr') || textLower.includes('consent') || textLower.includes('pdpl')) {
            return {
                clause: "Saudi PDPL Article 4 (Data Subject Rights & Consent)",
                framework: "Saudi PDPL",
                file: "Personal_Data_Protection_Law_SDAIA.pdf"
            };
        }
        if (roleUpper === 'CRO' || textLower.includes('risk') || textLower.includes('assess') || textLower.includes('threat') || textLower.includes('mitigate')) {
            return {
                clause: "ISO 31000 Section 6.4 (Risk Identification & Assessment)",
                framework: "ISO 31000",
                file: "ISO_31000_Risk_Management_Guidelines.pdf"
            };
        }
        if (roleUpper === 'CCO' || textLower.includes('compliance') || textLower.includes('audit') || textLower.includes('verify')) {
            return {
                clause: "NCA ECC-1-8 (Periodical Cybersecurity Review & Audit)",
                framework: "NCA ECC",
                file: "NCA_ECC_Audit_Readiness_Checklist.pdf"
            };
        }
        return {
            clause: "NCNICC-1-1 (Cybersecurity Management & Leadership)",
            framework: "NCNICC",
            file: "Draft_Non-CNI_Private_Sector_Controls_2024.pdf"
        };
    };

    // Automated check for conflicting executive recommendations during boardroom deliberations (Feature 4)
    const checkForDiscrepancy = (text: string, responseText: string) => {
        const combined = (text + ' ' + responseText).toLowerCase();
        if (combined.includes('cloud') || combined.includes('hosting') || combined.includes('third party') || combined.includes('on-premise')) {
            return {
                id: 'disc-' + Date.now(),
                agent1: "Ahmed Al-Harbi (CISO)",
                agent2: "Fahad Al-Tamimi (CTO)",
                details: "CISO Ahmed advocates for strict local air-gapped on-premises hosting under CSCC 4-2-1 to protect critical national interest, whereas CTO Fahad recommends migrating to a SAMA-compliant Hybrid Cloud under SAMA 3.4.3.",
                clause1: "NCA CSCC 4-2-1",
                clause2: "SAMA CSF 3.4.3"
            };
        }
        if (combined.includes('privacy') || combined.includes('marketing') || combined.includes('data subject') || combined.includes('consent') || combined.includes('pdpl')) {
            return {
                id: 'disc-' + Date.now(),
                agent1: "Noora Al-Anazi (DPO)",
                agent2: "Mohammed Al-Otaibi (CIO)",
                details: "DPO Noora insists on explicit, granular opt-in consent for handling personal data under PDPL Article 5, while CIO Mohammed targets immediate data consolidation for analytics pipelines.",
                clause1: "PDPL Article 5",
                clause2: "SAMA CSF 3.3.5"
            };
        }
        return null;
    };

    // Helper to parse multi-agent replies
    const parseResponseSegments = (rawResponse: string, bots: Participant[]) => {
        const lines = rawResponse.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const segments: { responderId: string; responderName: string; responderRole: string; response: string; gender: 'male' | 'female' }[] = [];

        for (const line of lines) {
            const match = line.match(/^([^:(]+)(?:\(([^)]+)\))?\s*:\s*(.+)$/);
            if (match) {
                const namePart = match[1].trim();
                const rolePart = match[2] ? match[2].trim() : '';
                let textPart = match[3].trim();
                if (textPart.startsWith('"') && textPart.endsWith('"')) {
                    textPart = textPart.slice(1, -1);
                } else if (textPart.startsWith('“') && textPart.endsWith('”')) {
                    textPart = textPart.slice(1, -1);
                }

                const matchedBot = bots.find(b => 
                    b.name.toLowerCase().includes(namePart.toLowerCase()) ||
                    namePart.toLowerCase().includes(b.name.toLowerCase()) ||
                    (rolePart && b.role.toLowerCase() === rolePart.toLowerCase())
                );

                if (matchedBot) {
                    segments.push({
                        responderId: matchedBot.id,
                        responderName: matchedBot.name,
                        responderRole: matchedBot.role,
                        response: textPart,
                        gender: matchedBot.gender || 'male'
                    });
                }
            }
        }
        return segments;
    };

    // Speak to GRC Board with mic or text input
    const handleSpeakToBoard = async (text: string) => {
        if (!text || text.trim() === '' || text === 'Listening...') return;
        setIsProcessingHumanInput(true);
        setActiveSpeakerId(currentUser?.id || 'boardroom-user');
        setActiveSpeakerText(text);

        // Append user speech to minutes and transcript
        setMeetingMinutes(prev => [`You: "${text}"`, ...prev].slice(0, 15));
        
        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const userLog: TranscriptLog = {
            id: 'user-' + Date.now(),
            timestamp,
            speakerId: currentUser?.id || 'boardroom-user',
            speakerName: currentUser?.name || 'Chairperson',
            speakerRole: currentUser?.role || 'Chairperson',
            avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop',
            message: text
        };
        setTranscript(prev => [userLog, ...prev]);

        // Search matching cyber skills in our 754 skills repository
        const queryWords = text.toLowerCase().split(/\s+/);
        const matchedSkills = sampleCyberSkills.filter(skill => {
            const searchStr = (skill.title + ' ' + skill.description + ' ' + skill.domain + ' ' + (skill.targetFrameworks || []).join(' ')).toLowerCase();
            return queryWords.some(word => word.length > 3 && searchStr.includes(word));
        }).slice(0, 3);

        try {
            const bots = participants.filter(p => !p.isHuman);
            const userLangName = selectedLanguage === 'ur-PK' ? 'Urdu' : selectedLanguage === 'ar-SA' ? 'Arabic' : 'English';
            
            const prompt = `
                IDENTITY:
                You are the Enterprise GRC Agentic Executive Force (Version 1.0).
                You operate as a single autonomous Executive AI Board composed of permanent executive officers who collaborate internally before providing a unified response.
                The human user is the Chairperson of the Executive Board and has ultimate authority. Executives advise, Chairperson decides.

                The virtual board members present are:
                ${bots.map(b => `- ${b.name} (${b.role}): ${b.description}`).join('\n')}

                ${matchedSkills.length > 0 ? `
                RELEVANT CYBERSECURITY SKILLS INVOLVED (From our 754 integrated repository):
                The following technical skills from our database directly map to the current discussion. You MUST reference their codes and titles in your response to deliver deep professional authority:
                ${matchedSkills.map(s => `- [${s.id}] ${s.title} (Domain: ${s.domain}) - Frameworks: ${s.targetFrameworks.join(', ')} - Required Actions: ${s.technicalAction}`).join('\n')}
                ` : ''}

                The user (Chairperson) just addressed the board or asked a question in ${userLangName}.
                The user statement/question:
                "${text}"

                DIRECTIONS:
                1. Select ONE suitable board member to respond directly and constructively to the user's statement or question, keeping all other executives in silent listening mode.
                
                2. CRITICAL - TEAM-WIDE OR MIC CHECKS (e.g. "hear me", "clearly", "can you hear", "audio check", "test", "mic check", "greetings everyone"):
                   If the user is checking if they can be heard, testing their mic, or addressing the entire board:
                   You MUST simulate a quick consecutive round of short, warm check-ins from ALL 9 members of the Executive Board present so that EVERYONE answers!
                   Format the 'response' string with ALL 9 members on separate lines, each prefixed with their "Name (Role):" followed by their short quote, for example:
                   "Fahad AI (CTO): Clear and strong, Chairperson. Ready on the tech side.
                   Mohammed AI (CIO): Connection is perfectly stable on my panel.
                   Ahmed AI (CISO): Secure comms are green. I hear you loud and clear.
                   Rashid AI (CRO): Perfect audio signal, Chairperson.
                   Asaad AI (CCO): Verified. Hearing you clearly on our compliance channel.
                   Sara AI (CGO): Loud and clear. Corporate systems are aligned.
                   Noora AI (DPO): Privacy comms are verified and clear.
                   Abdullah AI (CIA): Audited and confirmed. Signal strength is 100%.
                   Khalid AI (CQO): Secure coding logs showing flawless stream transmission."
                   This round-robin response is mandatory so that the Chairperson receives verification from all 9 officers without exception.

                3. INTERNALLY COLLABORATING ON COMPLEX QUESTIONS:
                   For complex queries involving multiple domains, the officers collaborate internally to produce one unified final executive recommendation, presented by the most relevant lead officer.

                4. DECISION FRAMEWORK:
                   Every executive response or recommendation must implicitly evaluate: Technology Impact, Business Impact, Cybersecurity Impact, Compliance Impact, Governance Impact, Risk Impact, Privacy Impact, Financial Impact, Operational Impact, AI Ethics, Regulatory Requirements.

                IMPORTANT LANGUAGE CONSTRAINT:
                - If the user spoke, typed or has a selected language of Arabic, you MUST write the 'response' entirely in natural Arabic (AR).
                - If the user spoke, typed or has a selected language of Urdu, you MUST write the 'response' entirely in natural Urdu (UR) script.
                - If the user spoke, typed or has a selected language of English, you MUST write the 'response' entirely in English (EN).
                Strictly match the language of the user's input/selected language (${userLangName}).

                Provide your response as a JSON object:
                {
                    "responderId": "Id of the board member replying (e.g. agent-fahad, agent-sara, agent-ahmed, agent-noora, etc.)",
                    "responderName": "Name of the board member replying",
                    "responderRole": "Role of the board member",
                    "response": "A professional, realistic response addressing the user's issue with executive gravity in the matched language."
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

            // Parse response segments (e.g., if it's a team check-in)
            const segments = data && data.response ? parseResponseSegments(data.response, bots) : [];
            
            if (segments.length > 1) {
                for (const seg of segments) {
                    setActiveSpeakerId(seg.responderId);
                    setActiveSpeakerText(seg.response);
                    setMeetingMinutes(prev => [`${seg.responderName} (${seg.responderRole}): "${seg.response}"`, ...prev].slice(0, 15));
                    
                    const anchor = getGRCAnchor(seg.response, seg.responderRole);
                    const agentLog: TranscriptLog = {
                        id: 'agent-' + seg.responderId + '-' + Date.now(),
                        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        speakerId: seg.responderId,
                        speakerName: seg.responderName,
                        speakerRole: seg.responderRole,
                        avatarUrl: bots.find(b => b.id === seg.responderId)?.avatarUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop',
                        message: seg.response,
                        anchoredClause: anchor.clause,
                        anchoredFramework: anchor.framework,
                        evidenceFile: anchor.file
                    };
                    setTranscript(prev => [agentLog, ...prev]);

                    await speakVoice(seg.response, seg.responderRole, seg.gender);
                }
            } else {
                // Determine responder agent
                let matchedBot = bots[0];
                let responseText = data && data.response && data.response !== "Content generation failed." ? data.response : '';

                if (data && data.responderId && data.responderId !== "Content generation failed.") {
                    const searchId = data.responderId.toLowerCase();
                    const searchName = (data.responderName || '').toLowerCase();
                    const searchRole = (data.responderRole || '').toLowerCase();
                    
                    matchedBot = bots.find(b => 
                        b.id.toLowerCase() === searchId || 
                        b.id.toLowerCase().includes(searchId) || 
                        b.name.toLowerCase() === searchName || 
                        b.name.toLowerCase().includes(searchName) ||
                        b.role.toLowerCase() === searchRole ||
                        b.role.toLowerCase().includes(searchRole)
                    ) || bots[0];
                } else if (matchedSkills.length > 0) {
                    let ownerId = matchedSkills[0].agentOwnerId;
                    if (ownerId === 'agent-cio') ownerId = 'agent-mohammed';
                    else if (ownerId === 'agent-ciso') ownerId = 'agent-ahmed';
                    else if (ownerId === 'agent-cto') ownerId = 'agent-fahad';
                    else if (ownerId === 'agent-charon') ownerId = 'agent-rashid';
                    else if (ownerId === 'agent-sara') ownerId = 'agent-sara';
                    else if (ownerId === 'agent-noora') ownerId = 'agent-noora';
                    else if (ownerId === 'agent-abdullah') ownerId = 'agent-abdullah';
                    else if (ownerId === 'agent-khalid') ownerId = 'agent-khalid';
                    else if (ownerId === 'agent-asaad') ownerId = 'agent-asaad';

                    matchedBot = bots.find(b => b.id === ownerId || b.id.toLowerCase().includes(ownerId.toLowerCase())) || bots[0];
                }

                // If no response could be generated online, generate fallbacks using GRC skills
                if (!responseText) {
                    const skill = matchedSkills[0];
                    if (skill) {
                        if (selectedLanguage === 'ar-SA') {
                            responseText = `بصفتي ${matchedBot.role}، قمت بتحليل توجيهاتك بالتنسيق مع أعضاء مجلس الإدارة. بالرجوع لمهارة الأمن السيبراني النشطة لدينا [${skill.id}] "${skill.title}" ضمن نطاق "${skill.domain}"، فإن الإجراء الفني المطلوب هو: "${skill.technicalAction}". سنقوم بمواءمة هذا التوجيه مع الأطر المرجعية المعتمدة للامتثال (${skill.targetFrameworks.join(', ')}) بشكل كامل وفوري لضمان أعلى معايير الجودة والحوكمة.`;
                        } else if (selectedLanguage === 'ur-PK') {
                            responseText = `بطور ${matchedBot.role}، میں نے آپ کے سوال کا تجزیہ اپنی فعال سائبر سیکیورٹی مهارٹ [${skill.id}] "${skill.title}" کے تحت کیا ہے۔ مطلوبہ تکنیکی عمل یہ ہے: "${skill.technicalAction}"۔ ہم اس حل کو تعمیل کے متعلقہ فریم ورکس (${skill.targetFrameworks.join(', ')}) کے ساتھ فوری مربوط کر کے بورڈ لاگ کا حصہ بنائیں گے۔`;
                        } else {
                            responseText = `As your ${matchedBot.role}, I have analyzed your query alongside the board. Mapping this to our certified production skill [${skill.id}] "${skill.title}" within the "${skill.domain}" domain, our precise technical course of action is: "${skill.technicalAction}". We will immediately implement this control and verify its alignment with standard framework structures (${skill.targetFrameworks.join(', ')}).`;
                        }
                    } else {
                        if (selectedLanguage === 'ar-SA') {
                            responseText = `لقد استلمت توجيهاتكم القيمة، وبصفتي ${matchedBot.role}، سأعمل فوراً مع الزملاء على مراجعة ضوابط الهيئة الوطنية للأمن السيبراني ذات الصلة وتحديث سجل الحوكمة والمخاطر لضمان مواءمتها بشكل كامل مع متطلبات الامتثال.`;
                        } else if (selectedLanguage === 'ur-PK') {
                            responseText = `بطور ${matchedBot.role}، میں نے آپ کی بات نوٹ کر لی ہے۔ ہم تعمیل کی ضروریات اور گورننس پالیسیوں کے تحت مناسب اقدامات کریں گے اور اسے لاگ انٹیگریٹی کا حصہ بنائیں گے۔`;
                        } else {
                            responseText = `I have logged your request, Chairperson. As ${matchedBot.role}, I will collaborate with the GRC board to assess our existing technical controls and log our updated posture mapping directly onto our compliance tracking ledger.`;
                        }
                    }
                }

                // Check for clashing viewpoints to raise Discrepancy Alerts (Feature 4)
                const clash = checkForDiscrepancy(text, responseText);
                if (clash) {
                    setDiscrepancy(clash);
                }

                setActiveSpeakerId(matchedBot.id);
                setActiveSpeakerText(responseText);
                setMeetingMinutes(prev => [`${matchedBot.name} (${matchedBot.role}): "${responseText}"`, ...prev].slice(0, 15));

                // Anchor verbal recommendation dynamically (Feature 1)
                const anchor = getGRCAnchor(responseText, matchedBot.role);
                const agentLog: TranscriptLog = {
                    id: 'agent-' + matchedBot.id + '-' + Date.now(),
                    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    speakerId: matchedBot.id,
                    speakerName: matchedBot.name,
                    speakerRole: matchedBot.role,
                    avatarUrl: matchedBot.avatarUrl,
                    message: responseText,
                    anchoredClause: anchor.clause,
                    anchoredFramework: anchor.framework,
                    evidenceFile: anchor.file
                };
                setTranscript(prev => [agentLog, ...prev]);

                await speakVoice(responseText, matchedBot.role, matchedBot.gender);
            }

        } catch (e) {
            console.error("Board reaction generation failed", e);
            const bots = participants.filter(p => !p.isHuman);
            const fallbackBot = bots[0];
            setActiveSpeakerId(fallbackBot.id);
            const errMsg = selectedLanguage === 'ar-SA' 
                ? `بصفتي ${fallbackBot.role}، قمنا بتسجيل مدخلاتكم بنجاح وسندمجها في جلسة التقييم التالية.`
                : selectedLanguage === 'ur-PK'
                ? `ہم نے آپ کے نوٹ درج کر لیے ہیں اور ہم اگلے اجلاس میں اس پر غور کریں گے۔`
                : `We have logged your query and will address these requirements in our upcoming boardroom cycle.`;
            setActiveSpeakerText(errMsg);
            setMeetingMinutes(prev => [`${fallbackBot.name} (${fallbackBot.role}): "${errMsg}"`, ...prev].slice(0, 15));
            await speakVoice(errMsg, fallbackBot.role, fallbackBot.gender);
        } finally {
            setIsProcessingHumanInput(false);
            setActiveSpeakerId(null);
            setActiveSpeakerText('');
            setHumanTranscript('');
        }
    };

    // Execute sequential real-time board voting with sound-synthesized rationale (Feature 2)
    const runExecutiveVote = async (topic: string) => {
        if (activeVote && activeVote.status === 'voting') return;

        setActiveVote({
            topic,
            votes: {},
            status: 'voting',
            tallies: { Approve: 0, Reject: 0, Abstain: 0 }
        });

        const bots = participants.filter(p => !p.isHuman);
        
        for (const bot of bots) {
            let decision: 'Approve' | 'Reject' | 'Abstain' = 'Approve';
            let rationale = '';

            const topicLower = topic.toLowerCase();
            if (bot.role.toUpperCase() === 'CISO') {
                decision = topicLower.includes('cloud') || topicLower.includes('bypass') ? 'Reject' : 'Approve';
                rationale = decision === 'Reject'
                    ? "I vote REJECT. Direct public cloud mapping violates NCA CSCC 2-3-1-4 isolation constraints."
                    : "I vote APPROVE. Security controls and cryptographic boundaries are fully satisfied.";
            } else if (bot.role.toUpperCase() === 'CTO') {
                decision = 'Approve';
                rationale = "I vote APPROVE. The underlying microservice architecture fully scales to match these requirements.";
            } else if (bot.role.toUpperCase() === 'DPO') {
                decision = topicLower.includes('data') || topicLower.includes('third party') ? 'Abstain' : 'Approve';
                rationale = decision === 'Abstain'
                    ? "I vote ABSTAIN. An exhaustive privacy impact assessment is required under PDPL Article 22 prior to go-live."
                    : "I vote APPROVE. User privacy parameters are fully respected here.";
            } else if (bot.role.toUpperCase() === 'CRO') {
                decision = Math.random() > 0.3 ? 'Approve' : 'Reject';
                rationale = decision === 'Approve'
                    ? "I vote APPROVE. The residual risk is well within our accepted ISO 31000 thresholds."
                    : "I vote REJECT. The threat exposure here carries high operational risk.";
            } else if (bot.role.toUpperCase() === 'CCO') {
                decision = 'Approve';
                rationale = "I vote APPROVE. Verified auditing and logs mapping are compliant with NCA ECC 1-8-1.";
            } else {
                decision = Math.random() > 0.4 ? 'Approve' : 'Abstain';
                rationale = `I vote ${decision}. This complies with our administrative roadmap.`;
            }

            // Highlights currently voting board member
            setActiveSpeakerId(bot.id);
            setActiveSpeakerText(rationale);

            const voteLog: TranscriptLog = {
                id: 'vote-' + bot.id + '-' + Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                speakerId: bot.id,
                speakerName: bot.name,
                speakerRole: bot.role,
                avatarUrl: bot.avatarUrl,
                message: `[VOTED ${decision.toUpperCase()}]: "${rationale}"`,
                vote: decision,
                anchoredClause: decision === 'Reject' ? "NCA CSCC 2-3-1-4" : "SAMA CSF 3.4.3"
            };

            setTranscript(prev => [voteLog, ...prev]);
            setMeetingMinutes(prev => [`${bot.name} (${bot.role}) cast vote [${decision}]: "${rationale}"`, ...prev].slice(0, 15));

            await speakVoice(rationale, bot.role, bot.gender);

            // Incrementally update live voting visualizers
            setActiveVote(prev => {
                if (!prev) return null;
                const updatedVotes = { ...prev.votes, [bot.id]: decision };
                const tallies: Record<'Approve' | 'Reject' | 'Abstain', number> = { Approve: 0, Reject: 0, Abstain: 0 };
                Object.values(updatedVotes).forEach(v => {
                    const voteVal = v as 'Approve' | 'Reject' | 'Abstain';
                    if (tallies[voteVal] !== undefined) {
                        tallies[voteVal]++;
                    }
                });
                return {
                    ...prev,
                    votes: updatedVotes,
                    tallies
                };
            });

            await new Promise(r => setTimeout(r, 800));
        }

        setActiveVote(prev => {
            if (!prev) return null;
            return { ...prev, status: 'completed' };
        });

        setActiveSpeakerId(null);
        setActiveSpeakerText('');
    };

    // Text to Speech playback using LiveGeminiVoiceService for high-fidelity natural human voice
    const speakVoice = (text: string, role: string, gender?: 'male' | 'female') => {
        return LiveGeminiVoiceService.speak(text, role, gender, selectedLanguage);
    };

    const handleToggleMeeting = async () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        const nextActive = !isMeetingActive;
        setIsMeetingActive(nextActive);
        if (nextActive) {
            setMeetingMinutes(["Meeting started. Recording minutes..."]);
            setTranscript([{
                id: 'sys-start',
                timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                speakerId: 'system',
                speakerName: 'System Engine',
                speakerRole: 'System',
                avatarUrl: '',
                message: 'Meeting room session formally active. Secure audio comms online.'
            }]);
            if (!isMicEnabled) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setIsMicEnabled(true);
                } catch (err) {
                    console.warn("Muted start or permissions deferred", err);
                }
            }
        } else {
            setMeetingMinutes(prev => ["Meeting adjourned.", ...prev]);
            setActiveSpeakerId(null);
            setActiveSpeakerText('');
            setDiscrepancy(null);
            setActiveVote(null);
            if (isListening) {
                stopListeningUser();
            }
        }
    };

    // Toggle real mic permission and state
    const handleToggleMic = async () => {
        if (!isMicEnabled) {
            try {
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

    const startListeningUser = async () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Recognition start failed, retrying...", e);
                try {
                    recognitionRef.current.stop();
                } catch (_) {}
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                    } catch (err) {
                        console.error("Failed to start speech recognition after stop:", err);
                    }
                }, 200);
            }
        } else {
            alert("Speech recognition is not fully supported in this browser environment. Please use the text chat input box below.");
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

    // Filtered transcript list for real-time flowing searchable MOM (Feature 3)
    const filteredTranscript = transcript.filter(log => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.speakerName.toLowerCase().includes(query) ||
            log.speakerRole.toLowerCase().includes(query) ||
            log.message.toLowerCase().includes(query) ||
            (log.anchoredClause && log.anchoredClause.toLowerCase().includes(query))
        );
    });

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-gray-900 dark:text-white tracking-tight">Virtual Board Meeting Room</h1>
                    <p className="text-gray-550 dark:text-gray-400 text-sm font-normal uppercase tracking-wider mt-1">Autonomous GRC Decision-Making Environment</p>
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

            {/* Real-time GRC Discrepancy Banner alert system (Feature 4) */}
            {isMeetingActive && discrepancy && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border-2 border-amber-500/40 p-5 rounded-2xl text-left flex items-start gap-4 shadow-md bg-slate-900/10 backdrop-blur"
                >
                    <span className="text-2xl mt-1 shrink-0 animate-bounce">⚠️</span>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">GRC Discrepancy Alert detected</h4>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1">{discrepancy.details}</p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                            <span className="bg-slate-200/50 dark:bg-slate-800/80 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium">Clashing Clause 1: {discrepancy.agent1.split(' ')[0]} ({discrepancy.clause1})</span>
                            <span className="bg-slate-200/50 dark:bg-slate-800/80 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 font-medium">Clashing Clause 2: {discrepancy.agent2.split(' ')[0]} ({discrepancy.clause2})</span>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => {
                                    runExecutiveVote(`Resolve clash: ${discrepancy.clause1} vs ${discrepancy.clause2}`);
                                    setDiscrepancy(null);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] shadow"
                            >
                                Initiate Board Vote to Resolve
                            </button>
                            <button 
                                onClick={() => setDiscrepancy(null)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-widest pt-2"
                            >
                                Dismiss Alert
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Real-time Voice Voting Dashboard panel (Feature 2) */}
            {isMeetingActive && activeVote && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 border border-slate-750 text-white p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-left"
                >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                            <span className="text-[10px] bg-teal-500/20 text-teal-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active Board Vote</span>
                            <h3 className="text-md font-bold text-white mt-1">Topic: {activeVote.topic}</h3>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${activeVote.status === 'voting' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {activeVote.status === 'voting' ? 'VOTING IN PROGRESS' : 'VOTING COMPLETED'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-2">
                        {/* Vote Distribution bar chart */}
                        <div className="md:col-span-2 space-y-3">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>APPROVED ({activeVote.tallies.Approve})</span>
                                    <span>{Math.round((activeVote.tallies.Approve / Math.max(1, Object.keys(activeVote.votes).length)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(activeVote.tallies.Approve / Math.max(1, Object.keys(activeVote.votes).length)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>REJECTED ({activeVote.tallies.Reject})</span>
                                    <span>{Math.round((activeVote.tallies.Reject / Math.max(1, Object.keys(activeVote.votes).length)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(activeVote.tallies.Reject / Math.max(1, Object.keys(activeVote.votes).length)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>ABSTAINED ({activeVote.tallies.Abstain})</span>
                                    <span>{Math.round((activeVote.tallies.Abstain / Math.max(1, Object.keys(activeVote.votes).length)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-slate-500 h-full transition-all duration-500" style={{ width: `${(activeVote.tallies.Abstain / Math.max(1, Object.keys(activeVote.votes).length)) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Voting Tally Summary Block */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-black text-teal-400">{activeVote.tallies.Approve}</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Total Approvals</span>
                            <span className="text-xs text-slate-500 mt-2">
                                {activeVote.tallies.Approve > activeVote.tallies.Reject ? "Motion Passes" : "Requires Chairperson Review"}
                            </span>
                        </div>
                    </div>

                    {activeVote.status === 'completed' && (
                        <button 
                            onClick={() => setActiveVote(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            Finalize Vote and Resume Discussion
                        </button>
                    )}
                </motion.div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Live Boardroom Visual Camera Feed - Natural Look and Feel */}
                    <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-850 bg-[#0f172a] group">
                        <img 
                            src="/src/assets/images/grc_boardroom_meeting_1782644856320.jpg" 
                            alt="Cybersecurity GRC Boardroom Advisory Meeting" 
                            className="w-full h-full object-cover transition-transform duration-[10000ms] ease-out"
                            style={{ transform: isMeetingActive ? 'scale(1.04)' : 'scale(1.0)' }}
                        />
                        {/* Status overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none"></div>
                        
                        {/* Live Recording HUD Indicator */}
                        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-slate-750/50 shadow-lg">
                            <span className={`w-2.5 h-2.5 rounded-full ${isMeetingActive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                {isMeetingActive ? 'LIVE BOARDROOM FEED' : 'BOARDROOM OFFLINE'}
                            </span>
                        </div>

                        {/* Language & Network link HUD */}
                        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-700/50 shadow-md">
                            <span className="text-[9px] font-mono text-teal-400 font-bold uppercase tracking-wider">SECURE SOVEREIGN COMM-LINK</span>
                        </div>

                        {/* Speaker Panel Overlay - Only visible when an agent is actually speaking */}
                        {activeSpeakerId && (
                            <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-teal-500/50 flex items-center gap-4 shadow-2xl animate-fade-in z-20">
                                {(() => {
                                    const currentAgent = participants.find(p => p.id === activeSpeakerId);
                                    if (!currentAgent) return null;
                                    return (
                                        <>
                                            <div className="relative shrink-0">
                                                <img 
                                                    src={currentAgent.avatarUrl} 
                                                    alt={currentAgent.name} 
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-teal-500 shadow-lg"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop";
                                                    }}
                                                />
                                                <span className="absolute -bottom-1 -right-1 bg-teal-500 text-white rounded-full p-1 animate-pulse border border-slate-900">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                                                    </svg>
                                                </span>
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{currentAgent.role}</p>
                                                <h4 className="text-sm font-semibold text-white leading-tight truncate">{currentAgent.name}</h4>
                                                <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">
                                                    "{activeSpeakerText || 'Addressing the GRC board...'}"
                                                </p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Interactive Seat Mapping and Seat Layout */}
                    <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner">
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                        
                        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 text-center">Interactive GRC Council Seats</h2>
                        
                        <div className="relative w-full max-w-2xl aspect-[16/7] bg-white dark:bg-gray-850 rounded-[40px] shadow-lg border border-gray-200/60 dark:border-gray-800 flex items-center justify-center z-10">
                            <div className="absolute inset-4 border border-dashed border-gray-100 dark:border-gray-850 rounded-[30px] pointer-events-none"></div>
                            
                            {/* Conference Mic Hub */}
                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center shadow-inner relative">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isMeetingActive ? 'bg-teal-500/20 text-teal-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                    <PhoneIcon className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Participants Positioning */}
                            {participants.map((participant, index) => {
                                const angle = (index / participants.length) * 2 * Math.PI - Math.PI / 2;
                                const isCurrentSpeaker = activeSpeakerId === participant.id;

                                return (
                                    <div 
                                        key={participant.id}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
                                        style={{ 
                                            left: `calc(50% + ${Math.cos(angle) * (44)}%)`, 
                                            top: `calc(50% + ${Math.sin(angle) * (58)}%)` 
                                        }}
                                    >
                                        <div className="flex flex-col items-center relative">
                                            {/* Real-time floating speech bubble */}
                                            {isCurrentSpeaker && activeSpeakerText && (
                                                <div className="absolute bottom-[115%] left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border border-teal-500 px-3 py-2 rounded-2xl shadow-xl min-w-[140px] max-w-[240px] text-center animate-fade-in">
                                                    <p className="text-[10px] leading-snug font-normal">
                                                        {activeSpeakerText}
                                                    </p>
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950"></div>
                                                </div>
                                            )}

                                            {/* Avatar & Chair seat back */}
                                            <div className="relative">
                                                {/* Solid chair seat structure backing */}
                                                <div className={`absolute -inset-2 bg-slate-200 dark:bg-slate-800 rounded-xl opacity-60 shadow-sm border ${isCurrentSpeaker ? 'border-teal-500 scale-105' : 'border-transparent'}`}></div>
                                                
                                                <div className={`relative p-0.5 rounded-full border-2 transition-all duration-500 ${isCurrentSpeaker ? 'border-teal-500 scale-110 shadow-md shadow-teal-500/20' : 'border-transparent'}`}>
                                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white dark:border-gray-800 bg-gray-200 shadow-md flex items-center justify-center">
                                                        <img 
                                                            src={participant.avatarUrl} 
                                                            alt={participant.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&auto=format&fit=crop";
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info Label */}
                                            <div className="mt-1.5 text-center max-w-[80px]">
                                                <p className="text-[9px] font-bold text-gray-800 dark:text-gray-200 leading-none truncate">{participant.name.split(' ')[0]}</p>
                                                <p className="text-[7px] text-gray-550 dark:text-gray-400 font-medium tracking-tight mt-0.5 truncate uppercase">{participant.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                                        <MicrophoneIcon className="w-5 h-5 text-white" />
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
                                    <button 
                                        type="button"
                                        onClick={() => runExecutiveVote("Audit configuration and regulatory compliance")}
                                        className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        🗳️ Request Board Vote
                                    </button>
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

                {/* Flowing, Searchable Real-Time Transcript Side Panel (Feature 3) */}
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-150 dark:border-gray-750">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                            <SparklesIcon className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Flowing GRC Transcript</h3>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">Real-time MOM & Evidence Mapping</p>
                        </div>
                    </div>

                    {/* Search bar inside the transcript panel */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 Search transcript or compliance clause..."
                            className="w-full bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-inner"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 text-left">
                        {filteredTranscript.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                <PhoneIcon className="w-10 h-10 mb-4 text-gray-300" />
                                <p className="text-xs uppercase tracking-widest font-normal">
                                    {searchQuery ? "No matches found" : "Waiting for discussions..."}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredTranscript.map((log) => {
                                    const isUser = log.speakerId === 'boardroom-user' || log.speakerId === currentUser?.id;
                                    const hasAnchor = log.anchoredClause;
                                    
                                    return (
                                        <motion.div 
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-2xl border flex flex-col gap-2 relative overflow-hidden transition-all ${
                                                isUserMessageHelper(log.speakerId)
                                                ? 'bg-slate-950 border-emerald-500/20 shadow-inner'
                                                : 'bg-slate-900/95 border-teal-500/10 shadow-md'
                                            }`}
                                        >
                                            {/* Header of message with Avatar & Speaker meta */}
                                            <div className="flex items-center justify-between border-b border-gray-150/10 dark:border-gray-750/30 pb-1.5">
                                                <div className="flex items-center gap-2">
                                                    {log.avatarUrl && (
                                                        <img src={log.avatarUrl} alt={log.speakerName} className="w-5 h-5 rounded-full object-cover border border-teal-500/50" />
                                                    )}
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-100">{log.speakerName}</span>
                                                        <span className="text-[8px] uppercase tracking-wider font-semibold text-teal-400 ml-1.5">({log.speakerRole})</span>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-mono text-gray-400">{log.timestamp}</span>
                                            </div>

                                            {/* Main Message Text */}
                                            <p className="text-[11px] leading-relaxed text-gray-300">{log.message}</p>

                                            {/* Real-time Evidence Anchor Badge layout (Feature 1) */}
                                            {hasAnchor && (
                                                <div className="flex flex-col gap-1.5 mt-1 pt-1.5 border-t border-slate-800/80">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px]" title="GRC Anchor">🔗</span>
                                                        <span className="text-[9px] font-bold text-teal-400 bg-teal-500/15 border border-teal-500/25 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                            {log.anchoredFramework}: {log.anchoredClause}
                                                        </span>
                                                    </div>
                                                    {log.evidenceFile && (
                                                        <div className="flex items-center gap-1 pl-1">
                                                            <span className="text-[9px]">📄</span>
                                                            <span className="text-[9px] text-slate-400 font-mono italic truncate">
                                                                {log.evidenceFile}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Vote Casting Indicators */}
                                            {log.vote && (
                                                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2.5 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
                                                    <span className="text-[8px] font-bold tracking-widest text-teal-400 uppercase">Voted {log.vote}</span>
                                                </div>
                                            )}
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
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Recording</span>
                             </div>
                             <button 
                                onClick={() => {
                                    const textContent = transcript.map(l => `[${l.timestamp}] ${l.speakerName} (${l.speakerRole}): ${l.message}`).join('\n');
                                    const blob = new Blob([textContent], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `MetaWorks_GRC_Transcript_${Date.now()}.txt`;
                                    a.click();
                                }}
                                className="text-[10px] font-bold uppercase tracking-widest text-teal-500 hover:text-teal-400"
                             >
                                Export Transcript
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper inside MeetingRoomPage to check user types securely
function isUserMessageHelper(speakerId: string) {
    return speakerId === 'boardroom-user' || speakerId.startsWith('user');
}
