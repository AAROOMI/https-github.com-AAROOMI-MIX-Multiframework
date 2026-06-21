import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Users, 
  Bot, 
  MessageSquare, 
  Briefcase, 
  UserPlus, 
  RefreshCw, 
  Upload, 
  FileCheck, 
  Fingerprint, 
  Award, 
  AlertTriangle, 
  Mail, 
  Phone, 
  CheckCircle, 
  ChevronRight, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Shield, 
  Eye, 
  QrCode, 
  Database,
  Lock,
  ChevronDown,
  Clock,
  Printer,
  History,
  Scale,
  Volume2,
  VolumeX
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AIService } from '../services/aiService';
import { virtualAgents } from '../data/virtualAgents';
import { sampleCyberSkills, CYBER_DOMAINS, ALL_CYBER_SKILLS_COUNT, CORE_DOMAINS_COUNT, CyberSkill } from '../data/cybersecuritySkills';
import { Search, Filter, Cpu, BookOpen } from 'lucide-react';
import type { OrganizationSize, VirtualAgent, Risk, PolicyDocument, AssessmentItem, AuditAction, CompanyProfile } from '../types';

interface VirtualDepartmentPageProps {
    onDelegateTask: (agentName: string, task: string) => void;
    onConsultAgent: (agent: VirtualAgent) => void;
    risks?: Risk[];
    documents?: PolicyDocument[];
    eccAssessment?: AssessmentItem[];
    pdplAssessment?: AssessmentItem[];
    onAddDocument?: (doc: PolicyDocument) => void;
    onAddRisk?: (risk: Risk) => void;
    onAddAuditLog?: (action: AuditAction, details: string) => void;
    auditLog?: any[];
    language?: 'en' | 'ar';
    companyProfile?: CompanyProfile | null;
}

interface DialogueEntry {
    speaker: string;
    message_en: string;
    message_ar: string;
    timestamp: number;
    action?: string;
    taskCompleted?: boolean;
}

interface SignatureUser {
    name: string;
    role: 'Risk Owner' | 'Line Manager' | 'CIO' | 'CEO';
    pin: string;
    registered: boolean;
    registeredAt?: number;
}

interface AuditEvidence {
    id: string;
    controlId: string;
    framework: 'NCA ECC' | 'SAMA CSF' | 'PDPL';
    fileName: string;
    fileSize: string;
    uploadedBy: string;
    uploadedAt: number;
    status: 'Pending Review' | 'Rejected' | 'Approved';
    cnnOutputLog: string[];
    signatures: {
        riskOwner: boolean;
        lineManager: boolean;
        cio: boolean;
        ceo: boolean;
    };
    treatmentPlan?: {
        gapComments: string;
        remediationActions: string[];
        dueDate: string;
        responsibleParty: string;
    };
}

interface ComplianceCertificate {
    id: string;
    companyName: string;
    framework: string;
    issueDate: number;
    serialNumber: string;
    securityHash: string;
    signees: string[];
}

export const VirtualDepartmentPage: React.FC<VirtualDepartmentPageProps> = ({ 
    onDelegateTask, 
    onConsultAgent,
    risks = [],
    documents = [],
    eccAssessment = [],
    pdplAssessment = [],
    onAddDocument,
    onAddRisk,
    onAddAuditLog,
    auditLog = [],
    language = 'en',
    companyProfile = null
}) => {
    // Top tabs selection
    type TabKey = 'team' | 'meeting' | 'audit' | 'vault' | 'escalations' | 'skills';
    const [activeTab, setActiveTab] = useState<TabKey>('meeting');

    const [orgSize, setOrgSize] = useState<OrganizationSize>('Mid-Market');
    const [selectedAgent, setSelectedAgent] = useState<VirtualAgent | null>(null);
    const [agentTaskInput, setAgentTaskInput] = useState('');
    const [boardroomLang, setBoardroomLang] = useState<'en' | 'ar'>('en');
    
    // Skills search & filter states
    const [skillsSearch, setSkillsSearch] = useState('');
    const [selectedCyberDomain, setSelectedCyberDomain] = useState<string>('All');
    const [simulatingSkillId, setSimulatingSkillId] = useState<string | null>(null);
    const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

    const filteredCyberSkills = useMemo(() => {
        return sampleCyberSkills.filter(skill => {
            const matchesDomain = selectedCyberDomain === 'All' || skill.domain === selectedCyberDomain;
            const matchesSearch = skill.title.toLowerCase().includes(skillsSearch.toLowerCase()) || 
                                  skill.description.toLowerCase().includes(skillsSearch.toLowerCase()) ||
                                  skill.technicalAction.toLowerCase().includes(skillsSearch.toLowerCase()) ||
                                  skill.domain.toLowerCase().includes(skillsSearch.toLowerCase()) ||
                                  skill.targetFrameworks.some(f => f.toLowerCase().includes(skillsSearch.toLowerCase()));
            return matchesDomain && matchesSearch;
        });
    }, [skillsSearch, selectedCyberDomain]);

    // Toggleable corporate frameworks
    const [activeFrameworks, setActiveFrameworks] = useState<string[]>(['NCA ECC', 'SAMA CSF', 'PDPL', 'ISO 27001', 'ISO 22301']);

    // Computed dynamic virtual team (human position assistants and framework expansions)
    const dynamicAgents = useMemo(() => {
        let list: VirtualAgent[] = [...virtualAgents];

        if (companyProfile) {
            // Apply human/copilot assistant relationships dynamic mapping
            list = list.map(agent => {
                const updated = { ...agent };
                if (agent.role === 'CTO' && companyProfile.ctoName) {
                    updated.role = 'CTO Assistant';
                    updated.title = `Technical Assistant to ${companyProfile.ctoName} (CTO)`;
                    updated.description = `Serves as direct technology co-pilot. Assists CTO ${companyProfile.ctoName} with system security configurations, operational parameters, and architecture reviews.`;
                    updated.reportingLine = companyProfile.ctoName;
                } else if (agent.role === 'CIO' && companyProfile.cioName) {
                    updated.role = 'CIO Assistant';
                    updated.title = `Information Systems Assistant to ${companyProfile.cioName} (CIO)`;
                    updated.description = `Coordinates strategic digital capability, IT systems governance checklists, and budget recommendations as assistant to CIO ${companyProfile.cioName}.`;
                    updated.reportingLine = companyProfile.cioName;
                } else if (agent.role === 'CISO' && companyProfile.cisoName) {
                    updated.role = 'CISO Assistant';
                    updated.title = `Corporate Cybersecurity Assistant to ${companyProfile.cisoName} (CISO)`;
                    updated.description = `Active security co-pilot. Assists CISO ${companyProfile.cisoName} in driving robust information security standards and threat responses.`;
                    updated.reportingLine = companyProfile.cisoName;
                } else if (agent.role === 'Compliance' && companyProfile.complianceOfficerName) {
                    updated.role = 'Compliance Assistant';
                    updated.title = `Compliance Assistant to ${companyProfile.complianceOfficerName}`;
                    updated.description = `Co-pilots regulatory audit preparatives and continuous control checking alongside Compliance Officer ${companyProfile.complianceOfficerName}.`;
                    updated.reportingLine = companyProfile.complianceOfficerName;
                }
                return updated;
            });

            // If CEO human exists, instantiate assistant Sultan AI
            if (companyProfile.ceoName) {
                if (!list.some(a => a.id === 'agent-ceo-assistant')) {
                    list.push({
                        id: 'agent-ceo-assistant',
                        name: 'Sultan AI',
                        role: 'CEO Assistant',
                        title: `Executive Assistant to CEO ${companyProfile.ceoName}`,
                        description: `Coordinates executive dashboard briefings, GRC readiness assessments, and boardroom alignment schedules acting under the directives of CEO ${companyProfile.ceoName}.`,
                        fullBio: `Sultan AI is the Chief Executive Chief-of-Staff AI, dedicated to assisting ${companyProfile.ceoName}. He provides rapid synthesis of all control validation streams, audits, and policy guidelines.`,
                        responsibilities: [
                            'Synthesize real-time regulatory status reports for executive reviews.',
                            'Act as liaison to translate technical parameters for high-level briefers.',
                            'Escalate high-priority risk registry items directly to CEO.',
                            'Deploy alignment playbooks as requested by executive leadership.'
                        ],
                        jobAttributes: ['Strategic Co-pilot', 'Executive Intelligence', 'Resource Coordinator'],
                        reportingLine: companyProfile.ceoName,
                        voiceName: 'Fenrir',
                        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        capabilities: ['Direct Briefing', 'Strategic Alignment', 'Policy Drafting'],
                        status: 'Idle'
                    });
                }
            }

            // If DPO human exists, instantiate assistant Layan AI
            if (companyProfile.dpoName) {
                if (!list.some(a => a.id === 'agent-dpo-assistant')) {
                    list.push({
                        id: 'agent-dpo-assistant',
                        name: 'Layan AI',
                        role: 'DPO Assistant',
                        title: `Data Protection Assistant to DPO ${companyProfile.dpoName}`,
                        description: `Enforces data privacy safeguards, automates system classification registries, and monitors Personal Data Protection Law (PDPL) rules reporting to ${companyProfile.dpoName}.`,
                        fullBio: `Layan AI is the professional Data Privacy and Protection Assistant. She supports DPO ${companyProfile.dpoName} by managing consent logging, vetting data subject request procedures, and tracking encryption controls.`,
                        responsibilities: [
                            'Formulate draft personal privacy policies matching standard PDPL rules.',
                            'Vet regulatory data classification records and registries.',
                            'Monitor consent audit registers and verify compliance reports.',
                            'Support the organization with data mapping templates.'
                        ],
                        jobAttributes: ['Privacy Advocate', 'Analytical', 'Standards-Driven'],
                        reportingLine: companyProfile.dpoName,
                        voiceName: 'Aoede',
                        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        capabilities: ['PDPL Management', 'DSAR Verification', 'Data Mapping Control'],
                        status: 'Idle'
                    });
                }
            }

            // If Cybersecurity Officer human exists, instantiate assistant Saad AI
            if (companyProfile.cybersecurityOfficerName) {
                if (!list.some(a => a.id === 'agent-cso-assistant')) {
                    list.push({
                        id: 'agent-cso-assistant',
                        name: 'Saad AI',
                        role: 'CSO Assistant',
                        title: `Operations Assistant to Cybersecurity Officer ${companyProfile.cybersecurityOfficerName}`,
                        description: `Coordinates with Cybersecurity Officer ${companyProfile.cybersecurityOfficerName} to scan systems, trace control evidence, and compile security log dashboards.`,
                        fullBio: `Saad AI is the continuous security operations assistant, working to aggregate system parameters and prepare verified audit logs for compliance review queues.`,
                        responsibilities: [
                            'Execute system configuration analysis scripts.',
                            'Prepare evidence submission packages in the auditor dashboard.',
                            'Analyze continuous monitoring logs to identify vulnerabilities.',
                            'Streamline remediation timelines for operational controls.'
                        ],
                        jobAttributes: ['Technical Analyst', 'Diligence-Driven', 'Process Specialist'],
                        reportingLine: companyProfile.cybersecurityOfficerName,
                        voiceName: 'Puck',
                        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                        capabilities: ['System Scanning', 'Continuous Telemetry', 'Vulnerability Tracking'],
                        status: 'Idle'
                    });
                }
            }
        }

        // Framework additions: ISO 27001
        if (activeFrameworks.includes('ISO 27001')) {
            if (!list.some(a => a.id === 'agent-iso27001')) {
                list.push({
                    id: 'agent-iso27001',
                    name: 'Sahar AI',
                    role: 'ISO 27001 Specialist',
                    title: 'ISMS ISO 27001 Lead Implementer',
                    description: 'Automates information security frameworks, governs Annex A clauses, and guarantees continuous ISMS readiness.',
                    fullBio: 'Sahar AI is the dedicated ISO 27001 expert of our virtual boardroom. She coordinates statement of applicability records, aligns internal procedures to standard ISO clauses, and automates control tracking panels.',
                    responsibilities: [
                        'Oversee Statement of Applicability (SoA) revisions and mappings.',
                        'Conduct pre-compliance checkpoints to identify Annex A gaps.',
                        'Draft security classification procedures under ISO rules.',
                        'Establish clear continuous audit matrices for documentation reviews.'
                    ],
                    jobAttributes: ['Governance Expert', 'Detail-Obsessed', 'Framework Specialist'],
                    reportingLine: 'Compliance Advisor / CISO',
                    voiceName: 'Aoede',
                    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    capabilities: ['ISO 27001 Controls', 'Annex A Mapping', 'Statement of Applicability'],
                    status: 'Idle'
                });
            }
        }

        // Framework additions: ISO 22301
        if (activeFrameworks.includes('ISO 22301')) {
            if (!list.some(a => a.id === 'agent-iso22301')) {
                list.push({
                    id: 'agent-iso22301',
                    name: 'Rayan AI',
                    role: 'ISO 22301 Specialist',
                    title: 'BCMS Disaster Recovery & Resilience Advisor',
                    description: 'Validates operational emergency backup setups, business impact assessments (BIA), and recovery velocity benchmarks.',
                    fullBio: 'Rayan AI is our specialized Business Continuity Management System advisor. He verifies recovery objectives, drafts emergency continuity standards, and designs rigorous mock-drilling scenarios.',
                    responsibilities: [
                        'Formulate Business Impact Analyses (BIAs) matching core processes.',
                        'Author business continuity playbooks and notification chains.',
                        'Monitor simulated recovery times (RTO/RPO) for continuous status loops.',
                        'Verify backup site resilience checklists.'
                    ],
                    jobAttributes: ['Resilience Champion', 'Process Architect', 'Calm and Systematic'],
                    reportingLine: 'Director of Operations',
                    voiceName: 'Charon',
                    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    capabilities: ['ISO 22301 Resilience', 'Business Impact Analysis', 'Continuity Planning'],
                    status: 'Idle'
                });
            }
        }

        return list;
    }, [companyProfile, activeFrameworks]);

    // Autonomous Skill-to-Agent Dispatcher state
    const [taskQuery, setTaskQuery] = useState('');
    const [dispatcherSuccess, setDispatcherSuccess] = useState<string | null>(null);
    const [matchedSkill, setMatchedSkill] = useState<any | null>(null);

    const handleDispatchTask = (query: string) => {
        setTaskQuery(query);
        if (!query.trim()) {
            setDispatcherSuccess(null);
            setMatchedSkill(null);
            return;
        }

        // Search the 754-skill library for matches in title, description or domain
        const matches = sampleCyberSkills.filter(skill => {
            const skillW = (skill.title + ' ' + skill.description + ' ' + skill.domain).toLowerCase();
            return skillW.includes(query.toLowerCase());
        });

        if (matches.length > 0) {
            const bestSkill = matches[0];
            setMatchedSkill(bestSkill);

            // Resolve agent owner
            let resolvedId = bestSkill.agentOwnerId;
            if (resolvedId === 'agent-cio') resolvedId = 'agent-mohammed';
            else if (resolvedId === 'agent-ciso') resolvedId = 'agent-ahmed';
            else if (resolvedId === 'agent-cto') resolvedId = 'agent-fahad';
            else if (resolvedId === 'agent-charon') resolvedId = 'agent-rashid';

            const bestAgent = dynamicAgents.find(a => a.id === resolvedId) || 
                              dynamicAgents.find(a => a.role.toLowerCase().includes(bestSkill.agentOwnerId.replace('agent-', ''))) || 
                              dynamicAgents[0];

            if (bestAgent) {
                setSelectedAgent(bestAgent);
                setDispatcherSuccess(`AUTONOMOUS DISPATCH SUCCESS: Mapped technical task to ${bestAgent.name} [${bestAgent.role}] based on mapped expertise!`);
            }
        } else {
            setDispatcherSuccess(`No precise skill match found in the 754 integrated library. CISO compliance advisor remains assigned.`);
            setMatchedSkill(null);
        }
    };

    // TTS voices from browser cache
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Meeting Logs & active statuses
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [meetingLog, setMeetingLog] = useState<DialogueEntry[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isMicActive, setIsMicActive] = useState(false);
    const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
    const [speakingDialogIdx, setSpeakingDialogIdx] = useState<number | null>(null);
    const [designatedRespondent, setDesignatedRespondent] = useState<any | null>(null);

    // Missing Task generation states
    const [isTaskGenerating, setIsTaskGenerating] = useState(false);
    const [generatedTaskDetails, setGeneratedTaskDetails] = useState<{
        id: string;
        taskTitle: string;
        category: string;
        draftContent: string;
        agentFeedback: { speaker: string; role: string; comment_en: string; comment_ar: string; status: 'Signed' | 'Needs Review' }[];
        humanApproved: boolean;
        implementationTracker: {
            step: string;
            status: 'Todo' | 'In Progress' | 'Done';
            timeline: string;
        }[];
    } | null>(null);

    // Authority Digital Signature Vault State
    const [authorities, setAuthorities] = useState<Record<string, SignatureUser>>(() => {
        const saved = localStorage.getItem('grc_authority_signatures');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return {
            riskOwner: { name: 'Sarah Johnson', role: 'Risk Owner', pin: '1111', registered: true, registeredAt: Date.now() },
            lineManager: { name: 'Thamer Al-Ahmadi', role: 'Line Manager', pin: '2222', registered: true, registeredAt: Date.now() },
            cio: { name: 'Mohammed Al-Saudi', role: 'CIO', pin: '3333', registered: true, registeredAt: Date.now() },
            ceo: { name: 'Abdulaziz Bin Faisal', role: 'CEO', pin: '4444', registered: false }
        };
    });

    useEffect(() => {
        localStorage.setItem('grc_authority_signatures', JSON.stringify(authorities));
    }, [authorities]);

    // Active Auditing and evidence registries
    const [evidences, setEvidences] = useState<AuditEvidence[]>(() => {
        const saved = localStorage.getItem('grc_audit_evidence');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('grc_audit_evidence', JSON.stringify(evidences));
    }, [evidences]);

    // Selected control for auditing
    const [selectedAuditControlId, setSelectedAuditControlId] = useState<string>('ECC-1-1');
    const [selectedAuditFramework, setSelectedAuditFramework] = useState<'NCA ECC' | 'SAMA CSF' | 'PDPL'>('NCA ECC');
    const [isScanningEvidence, setIsScanningEvidence] = useState(false);
    const [auditSearchQuery, setAuditSearchQuery] = useState('');

    // Pre-registered mock list of framework controls for selection in auditor portal
    const frameworkControlsList = [
        { id: 'ECC-1-1', title: 'Cybersecurity Governance Policy Guideline', domain: 'Governance' },
        { id: 'ECC-1-2', title: 'Roles and Responsibilities Matrix', domain: 'Governance' },
        { id: 'ECC-2-1', title: 'Asset Inventory Management Standard', domain: 'Operations' },
        { id: 'ECC-2-5', title: 'Network Protection Boundary Architecture', domain: 'Technical' },
        { id: 'ECC-3-2', title: 'Data Encryption and Protection Procedure', domain: 'Technical' },
        { id: 'SAMA-2.1', title: 'Enterprise Information Security Policy', domain: 'SAMA CSF' },
        { id: 'SAMA-2.8', title: 'Third-Party Relationship Security Requirements', domain: 'SAMA CSF' },
        { id: 'PDPL-3.1', title: 'Personal Data Processing & Privacy Notice', domain: 'PDPL' },
    ];

    // Certificate issued registry
    const [certificates, setCertificates] = useState<ComplianceCertificate[]>(() => {
        const saved = localStorage.getItem('grc_certificates');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('grc_certificates', JSON.stringify(certificates));
    }, [certificates]);

    // Escalation Simulator Logs
    const [escalationLogs, setEscalationLogs] = useState<{ id: string; timestamp: number; type: 'Email' | 'WhatsApp' | 'Call'; target: string; message: string; status: 'Dispatched' | 'Delivered' | 'Connected' | 'Acked' }[]>([]);
    const [outboundTarget, setOutboundTarget] = useState('+966 50 123 4567');
    const [outboundEmail, setOutboundEmail] = useState('executive.board@sama-compliant-node.gov.sa');
    const [escalationTriggerSuccess, setEscalationTriggerSuccess] = useState(false);

    // References
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeSimulationIdRef = useRef(0);
    const speechRecognitionRef = useRef<any>(null);

    // Load SpeechSynthesis Voices
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

    // Speech recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const rec = new SpeechClass();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = boardroomLang === 'ar' ? 'ar-SA' : 'en-US';

            rec.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                handleUserSpeak(text);
                setIsMicActive(false);
            };

            rec.onerror = (err: any) => {
                console.warn("Speech recognition warning: ", err);
                setIsMicActive(false);
            };

            rec.onend = () => {
                setIsMicActive(false);
            };

            speechRecognitionRef.current = rec;
        }
    }, [boardroomLang]);

    const toggleMic = () => {
        if (!speechRecognitionRef.current) {
            alert("Speech recognition is not supported in this frame / browser version.");
            return;
        }
        if (isMicActive) {
            speechRecognitionRef.current.stop();
            setIsMicActive(false);
        } else {
            speechRecognitionRef.current.start();
            setIsMicActive(true);
        }
    };

    // Auto scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [meetingLog]);

    // Delegated task registry state
    interface DelegatedTask {
        id: string;
        title: string;
        description: string;
        assignedAgent: string;
        assignedRole: string;
        raciStatus: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
        status: 'To Do' | 'In Progress' | 'Done';
        progress: number;
        createdAt: number;
    }

    const [delegatedTasks, setDelegatedTasks] = useState<DelegatedTask[]>(() => {
        const saved = localStorage.getItem('grc_delegated_tasks');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [
            {
                id: 'task-1',
                title: 'Develop Privilege Access Management Policy',
                description: 'Draft operational boundary policy for high-privilege users in accordance with SAMA CSF 3.1.2 and NCA ECC-1-2.',
                assignedAgent: 'Fahad AI',
                assignedRole: 'CTO',
                raciStatus: 'Responsible',
                status: 'In Progress',
                progress: 60,
                createdAt: Date.now() - 172800000,
            },
            {
                id: 'task-2',
                title: 'Formulate Business Continuity Incident Playbook',
                description: 'Write disaster recovery step-by-step playbook under SAMA CSF 3.5.3.',
                assignedAgent: 'Ahmed AI',
                assignedRole: 'CISO',
                raciStatus: 'Accountable',
                status: 'To Do',
                progress: 10,
                createdAt: Date.now() - 86400000,
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('grc_delegated_tasks', JSON.stringify(delegatedTasks));
    }, [delegatedTasks]);

    // Text To Speech with optimized natural voice parameters mapping distinct agents
    const speakLine = (line: Partial<DialogueEntry> | string, speakerName: string, msgIdx?: number | null, forceSpeak?: boolean) => {
        if (!('speechSynthesis' in window)) return;
        
        // Suppress overlap
        window.speechSynthesis.cancel();

        if (!isVoiceOutputEnabled && !forceSpeak) {
            console.log("Speech output is disabled by user setting.");
            return;
        }

        let rawText = "";
        let speakingLanguage = boardroomLang;

        if (typeof line === 'string') {
            rawText = line;
        } else {
            if (boardroomLang === 'ar') {
                rawText = line.message_ar || line.message_en || "";
                speakingLanguage = 'ar';
            } else {
                rawText = line.message_en || "";
                speakingLanguage = 'en';
            }
        }

        const utterance = new SpeechSynthesisUtterance(rawText);
        const systemVoices = window.speechSynthesis.getVoices();
        
        // Find language matching voices
        const languageMatchedVoices = systemVoices.filter(v => v.lang.toLowerCase().startsWith(speakingLanguage));
        
        let targetVoice = null;
        if (languageMatchedVoices.length > 0) {
            const speakerLower = (speakerName || '').toLowerCase();
            
            // Assign distinct premium voices or distinct indices relative to names to bypass robotic uniformity
            if (speakerLower.includes("ahmed")) {
                // deep authoritative CISO
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("maged")) || languageMatchedVoices[0];
                utterance.pitch = 0.82;
                utterance.rate = 0.88;
            } else if (speakerLower.includes("fahad")) {
                // rapid-fire CTO
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("mark") || v.name.toLowerCase().includes("tarik")) || languageMatchedVoices[Math.min(1, languageMatchedVoices.length - 1)];
                utterance.pitch = 1.05;
                utterance.rate = 1.05;
            } else if (speakerLower.includes("mohammed")) {
                // statesman CIO
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("george") || v.name.toLowerCase().includes("naayf")) || languageMatchedVoices[Math.min(2, languageMatchedVoices.length - 1)];
                utterance.pitch = 0.95;
                utterance.rate = 0.94;
            } else if (speakerLower.includes("rashid")) {
                // Enterprise Risk Manager
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("guy") || v.name.toLowerCase().includes("tarif")) || languageMatchedVoices[Math.min(3, languageMatchedVoices.length - 1)];
                utterance.pitch = 0.76;
                utterance.rate = 0.90;
            } else if (speakerLower.includes("ibrahim")) {
                // process-driven DOP
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("microsoft") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("hoda")) || languageMatchedVoices[Math.min(4, languageMatchedVoices.length - 1)];
                utterance.pitch = 1.00;
                utterance.rate = 0.96;
            } else if (speakerLower.includes("asaad")) {
                // structured Compliance Officer
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("english") || v.name.toLowerCase().includes("laila")) || languageMatchedVoices[Math.min(5, languageMatchedVoices.length - 1)];
                utterance.pitch = 1.03;
                utterance.rate = 0.92;
            } else if (speakerLower.includes("abdullah")) {
                // skeptical Internal Auditor
                targetVoice = languageMatchedVoices.find(v => v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("naayf")) || languageMatchedVoices[languageMatchedVoices.length % 2];
                utterance.pitch = 0.88;
                utterance.rate = 1.08;
            } else {
                targetVoice = languageMatchedVoices[0];
            }
        }

        if (targetVoice) {
            utterance.voice = targetVoice;
            utterance.lang = targetVoice.lang;
        }

        if (msgIdx !== undefined && msgIdx !== null) {
            utterance.onstart = () => {
                setSpeakingDialogIdx(msgIdx);
            };
            utterance.onend = () => {
                setSpeakingDialogIdx(current => current === msgIdx ? null : current);
            };
            utterance.onerror = () => {
                setSpeakingDialogIdx(current => current === msgIdx ? null : current);
            };
        }

        window.speechSynthesis.speak(utterance);
    };

    // User Text Input Submit inside Meeting
    const handleUserSpeak = async (text: string) => {
        activeSimulationIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        const userEntry: DialogueEntry = {
            speaker: "You (User)",
            message_en: text,
            message_ar: text,
            timestamp: Date.now()
        };

        setMeetingLog(prev => [...prev, userEntry]);
        
        // Run simulated multi-agent dialog reflecting common boardroom intelligence
        await runSimulationTurn(text);
    };

    const cleanJson = (text: string) => {
        const match = text.match(/\[[\s\S]*\]/);
        return match ? match[0] : text;
    };

    // Simulation / Boardroom reasoning loop powered by Gemini under general template context
    const runSimulationTurn = async (userMsg?: string) => {
        setIsThinking(true);
        const currentRunId = ++activeSimulationIdRef.current;

        // Establish the designated responsible agent based on technical domain context
        let responsibleAgent = { name: "Ahmed Al-Mansoori", role: "CISO" };
        if (userMsg) {
            const query = userMsg.toLowerCase();
            if (query.includes("privacy") || query.includes("pdpl") || query.includes("consent") || query.includes("notice") || query.includes("data transfer")) {
                responsibleAgent = { name: "Hoda AI", role: "DPO (Data Protection Officer)" };
            } else if (query.includes("nca") || query.includes("sama") || query.includes("regulatory") || query.includes("framework") || query.includes("clause") || query.includes("compliance") || query.includes("governance")) {
                responsibleAgent = { name: "Asaad AI", role: "Compliance Specialist" };
            } else if (query.includes("code") || query.includes("review") || query.includes("software") || query.includes("sdlc") || query.includes("security scanning")) {
                responsibleAgent = { name: "Khalid AI", role: "Secure Code Reviewer" };
            } else if (query.includes("risk") || query.includes("mitigation") || query.includes("register") || query.includes("appetite") || query.includes("tolerance")) {
                responsibleAgent = { name: "Rashid AI", role: "GRC Risk Manager" };
            } else if (query.includes("backup") || query.includes("disaster") || query.includes("bcm") || query.includes("continuity") || query.includes("iso 22301") || query.includes("resilience")) {
                responsibleAgent = { name: "Rayan AI", role: "ISO 22301 Specialist" };
            } else if (query.includes("cloud") || query.includes("bucket") || query.includes("database") || query.includes("serverless") || query.includes("budget") || query.includes("asset")) {
                responsibleAgent = { name: "Mohammed AI", role: "CIO" };
            } else if (query.includes("network") || query.includes("firewall") || query.includes("proxy") || query.includes("port") || query.includes("cyber range") || query.includes("encryption")) {
                responsibleAgent = { name: "Fahad AI", role: "CTO" };
            } else if (query.includes("audit") || query.includes("evidence") || query.includes("check") || query.includes("verification") || query.includes("screenshot") || query.includes("logs")) {
                responsibleAgent = { name: "Abdullah AI", role: "Internal Auditor" };
            } else if (query.includes("iso 27001") || query.includes("isms") || query.includes("annex") || query.includes("statement of applicability")) {
                responsibleAgent = { name: "Sahar AI", role: "ISO 27001 Specialist" };
            }
        }
        setDesignatedRespondent(responsibleAgent);

        try {
            if (meetingLog.length === 0 && !userMsg) {
                const welcomeLine: DialogueEntry = {
                    speaker: "Ahmed Al-Mansoori",
                    message_en: "Welcome board members. As CISO, I would like to initialize this strategic alignment session. We must address outstanding controls under our NCA ECC, SAMA CSF, and PDPL frameworks. What shall we target today?",
                    message_ar: "مرحباً بأعضاء مجلس الإدارة. بصفتي مسؤول أمن المعلومات، أرغب في بدء هذه الجلسة الاستراتيجية. يجب علينا مراجعة الضوابط المعلقة وتوثيقها لتسليمها لمدقق الحسابات. كيف ترغبون بالبدء؟",
                    timestamp: Date.now()
                };
                setMeetingLog([welcomeLine]);
                setTimeout(() => speakLine(welcomeLine, welcomeLine.speaker, 0), 100);
                setIsThinking(false);
                return;
            }

            const eccCompliance = Math.round((eccAssessment.filter(v => v.controlStatus === 'Implemented').length / (eccAssessment.length || 1)) * 100);
            const activeRisksCount = risks.length;
            const outstandingTasks = delegatedTasks.filter(t => t.status !== 'Done').length;

            const conversationHistory = meetingLog.slice(-5).map(m => `${m.speaker}: "${m.message_en}"`).join('\n');
            
            const specificPrompt = userMsg 
                ? `The administrator (Human) asked: "${userMsg}". The primary responsible domain expert for this query is "${responsibleAgent.name}" of role or core capability of [${responsibleAgent.role}]. That agent MUST respond first, speaking with high-level professional authority, and addressing the specific technical layers of the human's query. Other board members can then debate or add secondary feedback.`
                : `Continue GRC strategizing. Focus on SAMA compliance, security architecture mapping, and auditor evidence verification.`;

            const sysInstruction = `
            You are drafting a professional dialog for an active, multi-disciplinary, cross-functional GRC board meeting consisting of:
            1. Ahmed Al-Mansoori (CISO) - Authoritative, ultimate accountability, risk-aware. Expert in incident handling and forensics.
            2. Fahad AI (CTO) - Highly technical, focus on secure edge gateways, configurations, network protection, and keys.
            3. Mohammed AI (CIO) - Visionary resource allocator, cloud identity structures, assets, and storage systems.
            4. Ibrahim AI (Operations) - Execution supervisor, workflows, daily continuity, tracking.
            5. Asaad AI (Compliance) - Meticulous researcher mapping SAMA CSF, NCA ECC, and legal frameworks.
            6. Abdullah AI (Internal Auditor) - Skeptical, data-driven, demands telemetry evidence logs and configuration hashes.
            7. Hoda AI (DPO) - Expert in Saudi Personal Data Protection Law (PDPL), privacy registry, consent flows, cross-border controls.
            8. Sahar AI (ISO 27001 Specialist) - Lead implementer for Information Security Manager Manuals and Statement of Applicability (SoA) Annex A checks.
            9. Rayan AI (ISO 22301 Specialist) - Expert in business continuity impact analysis (BIA), playbooks, resilience tests.
            10. Khalid AI (Secure Code Reviewer) - In-depth static/dynamic vulnerabilities analyst, secure pipelines, and refactoring.
            11. Rashid AI (GRC Risk Manager / Special Envoy) - Risk appetite models, threat modeling, financial risk.

            **Integrated Agentic Skills Repository Knowledge Base:**
            - Repository: https://github.com/mukul975/Anthropic-Cybersecurity-Skills.git
            - Total skills: 754 Agentic Cognitive Skills across 26 domains (Cloud, DevSecOps, Cryptography, BCM ISO 22301, ISMS ISO 27001, Privacy PDPL, secure code reviews, AI safety, etc.)
            - Mapped directly to active controls in NCA ECC, SAMA CSF, PDPL, CMA, ISO 27001, ISO 22301, NIST AI RMF, and NIST CSF.

            **System GRC Reality State:**
            - NCA ECC compliance completion: ${eccCompliance}%
            - Active risk register count: ${activeRisksCount}
            - Pending delegated workflow tasks: ${outstandingTasks}

            **Last 5 turns of transcript:**
            ${conversationHistory}

            **Task:**
            Produce a custom dialog with exactly 2 to 3 logically structured turns where boardroom members interact directly. The first turn MUST be from the designated domain expert ("Ahmed Al-Mansoori" | "Fahad AI" | "Mohammed AI" | "Ibrahim AI" | "Asaad AI" | "Abdullah AI" | "Hoda AI" | "Sahar AI" | "Rayan AI" | "Khalid AI" | "Rashid AI") of the question! Speak with absolute professional GRC authority, using concrete terms from our 754 technical skills repository.

            **Output Format (JSON Array ONLY):**
            [{ "speaker": "Ahmed Al-Mansoori" | "Fahad AI" | "Mohammed AI" | "Ibrahim AI" | "Asaad AI" | "Abdullah AI" | "Hoda AI" | "Sahar AI" | "Rayan AI" | "Khalid AI" | "Rashid AI", "message_en": "Professional feedback", "message_ar": "ترجمة عربية متناسقة ممتازة" }]
            `;

            let simulatedThread: any[] = [];
            try {
                const response = await AIService.generateContent(specificPrompt, {
                    model: 'gemini-2.0-flash',
                    systemInstruction: sysInstruction,
                });

                if (activeSimulationIdRef.current !== currentRunId) return;
                const evaluated = JSON.parse(cleanJson(response));
                if (Array.isArray(evaluated)) {
                    simulatedThread = evaluated;
                }
            } catch (err) {
                console.warn("AI dialog synthesis fallback.", err);
                simulatedThread = [
                    {
                        speaker: responsibleAgent.name,
                        message_en: `As the responsible representative for this topic, I can confirm that we are actively reviewing all relevant technical parameters. We will align our operational checklists with the specified controls.`,
                        message_ar: `بصفتي المسؤول المباشر عن هذا الموضوع، أؤكد أننا نراجع الإعدادات الفنية بالتفصيل لتتماشى مع الضوابط المطلوبة.`
                    },
                    {
                        speaker: "Ahmed Al-Mansoori",
                        message_en: "Indeed. Let's make sure our compliance logs reflect these evidence parameters for the internal auditor to verify.",
                        message_ar: "بالفعل. دعونا نضمن تسجيل كافة هذه البنود في سجلات المطابقة ليسهل على المدقق الداخلي مراجعتها."
                    }
                ];
            }

            // Stagger speaker intervals with distinct voices
            for (const turn of simulatedThread) {
                if (activeSimulationIdRef.current !== currentRunId) break;

                const entry: DialogueEntry = {
                    speaker: turn.speaker,
                    message_en: turn.message_en,
                    message_ar: turn.message_ar,
                    timestamp: Date.now()
                };

                // Add to list first, then speak on the correct index
                await new Promise<void>(resolve => {
                    setMeetingLog(prev => {
                        const nextLog = [...prev, entry];
                        const idx = nextLog.length - 1;
                        // Trigger voice playback matching the exact dialog index
                        setTimeout(() => {
                            speakLine(entry, entry.speaker, idx);
                        }, 50);
                        resolve();
                        return nextLog;
                    });
                });

                // Wait during pronunciation duration
                const duration = Math.max(3500, turn.message_en.length * 60);
                await new Promise(resolve => setTimeout(resolve, duration));
            }

        } catch (e) {
            console.error("Board discussion logic failed: ", e);
        } finally {
            if (activeSimulationIdRef.current === currentRunId) {
                setIsThinking(false);
            }
        }
    };

    // Ask agents to cooperative-draft missing task
    const handleTriggerMissingTaskCooperation = async (taskName: string) => {
        setIsTaskGenerating(true);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        const triggerDialogue: DialogueEntry = {
            speaker: "You (User)",
            message_en: `Team, we have a missing control requirement. Specifically, we need to immediately build, draft, and implement: "${taskName}". Please collaborate to draft a comprehensive compliant policy and coordinate on its operational implementation strategy.`,
            message_ar: `فريق العمل، لدينا متطلب ناقص. بالتحديد، نحتاج فوراً إلى بناء وصياغة وتطبيق: "${taskName}". يرجى التعاون لصياغة مبدأ السياسة وتنسيق خطة تفعيلها السيبراني.`,
            timestamp: Date.now()
        };

        setMeetingLog(prev => [...prev, triggerDialogue]);

        // Synthesize Boardroom agent debate and collaborative draft
        const draftingPrompt = `The administrator requested custom implementation drafting for: "${taskName}". Generate an elegant, highly formal draft content outline, followed by unique review remarks and digital signatures from 5 separate boardroom advisors.`;
        const taskSystemInstructions = `
        You are a collaborative agent team. Generate a JSON payload drafting progress for the missing control task specified:
        Includes:
        1. "controlDraft": comprehensive Markdown policy outline containing scope, requirements, compliance alignment.
        2. "agentReviews": Array of objects detailing specific professional criticisms, advice, and a "status: 'Signed'" endorsement from:
           - Ahmed Al-Mansoori (CISO)
           - Fahad AI (CTO)
           - Mohammed AI (CIO)
           - Ibrahim AI (DOP)
           - Asaad AI (Compliance)
        3. "implementationSteps": step-by-step follow-up timeline for human in the loop.

        JSON structure:
        {
          "taskTitle": "...",
          "category": "...",
          "draftText": "Markdown text...",
          "reviews": [
             { "speaker": "Ahmed Al-Mansoori", "role": "CISO", "comment_en": "Deep structural policy validation check.", "comment_ar": "تعليق التدقيق الهيكلي للسياسة", "status": "Signed" }
             ...
          ],
          "steps": [
             { "step": "Phase 1: Configure security system mappings", "timeline": "Days 1-3" }
             ...
          ]
        }
        `;

        try {
            const response = await AIService.generateContent(draftingPrompt, {
                model: 'gemini-2.0-flash',
                systemInstruction: taskSystemInstructions
            });

            const parsed = JSON.parse(cleanJson(response));
            const newTaskId = `task-inst-${Date.now()}`;

            setGeneratedTaskDetails({
                id: newTaskId,
                taskTitle: parsed.taskTitle || taskName,
                category: parsed.category || 'Security Policy',
                draftContent: parsed.draftText || `# Policy: ${taskName}\n\nScope: Corporate Core Systems\n\n1. Policy Objectives\nAll systems must adhere to rigorous configuration monitoring.`,
                agentFeedback: parsed.reviews || [
                    { speaker: 'Ahmed Al-Mansoori', role: 'CISO', comment_en: 'Excellent governance baseline established. Fully signed off.', comment_ar: 'تم إقرار الهيكل العام للسياسة من قبل CISO.', status: 'Signed' }
                ],
                humanApproved: false,
                implementationTracker: (parsed.steps || []).map((s: any) => ({
                    step: s.step,
                    status: 'Todo',
                    timeline: s.timeline || 'TBD'
                }))
            });

            // Announce completion in dialogue
            const announceTurn: DialogueEntry = {
                speaker: "Asaad AI",
                message_en: `Cooperative drafting for "${taskName}" is complete! As Compliance Officer, I have mapped all clauses under NCA ECC. My board colleagues Fahad, Ahmed, Mohammed, and Ibrahim have performed their review and successfully digitally signed. It is now awaiting your validation and approval in the Strategic Queue.`,
                message_ar: `اكتملت صياغة سياسة "${taskName}" بالتعاون المشترك! بصفة مسؤول المطابقة، قمت بربط البنود. قام زملائي كبار مسؤولي الفريق بالتوقيع والمراجعة. ننتظر الآن موافقتكم واعتمادكم النهائي في صفحة مراجعة المستندات.`,
                timestamp: Date.now()
            };

            speakLine(announceTurn, announceTurn.speaker);
            setMeetingLog(prev => [...prev, announceTurn]);

        } catch (err) {
            console.error("Cooperative task generation failed: ", err);
            // Offline fallback
            setGeneratedTaskDetails({
                id: `task-inst-${Date.now()}`,
                taskTitle: taskName,
                category: 'Cybersecurity Operations',
                draftContent: `# Corporate Security Control Standard: ${taskName}\n\n1. Purpose\nEnforce strict operational policies to conform with NCA guidelines.\n\n2. Implementation Scope\nApplies to all cloud directories, identity registers, and edge infrastructure.`,
                agentFeedback: [
                    { speaker: 'Ahmed Al-Mansoori', role: 'CISO', comment_en: 'Standard outline approved. Fully compliant with GCC privacy requirements.', comment_ar: 'الوثيقة مطابقة لمتطلبات حماية الخصوصية ومقررة.', status: 'Signed' },
                    { speaker: 'Fahad AI', role: 'CTO', comment_en: 'Vulnerability scan configurations updated to log this evidence.', comment_ar: 'التكوينات التقنية مجهزة لتغذية السجلات المعتمدة.', status: 'Signed' },
                    { speaker: 'Mohammed AI', role: 'CIO', comment_en: 'Operational budget allocated for ongoing monitoring.', comment_ar: 'تم مواءمة الميزانية لعمليات المتابعة المستمرة للسياسة.', status: 'Signed' }
                ],
                humanApproved: false,
                implementationTracker: [
                    { step: 'Deploy system settings configuration parameters', status: 'Todo', timeline: 'Week 1' },
                    { step: 'Schedule operational walkthrough and review checks', status: 'Todo', timeline: 'Week 2' }
                ]
            });
        } finally {
            setIsTaskGenerating(false);
        }
    };

    // Promote cooperatively-drafted Document to real corporate Policy Document registry & start coordination
    const handleHumanValidateAndApprove = () => {
        if (!generatedTaskDetails) return;

        const approvedDetails = { ...generatedTaskDetails, humanApproved: true };
        setGeneratedTaskDetails(approvedDetails);

        // Save to parent GRC documents repository
        if (onAddDocument) {
            const newDoc: PolicyDocument = {
                id: `doc-corp-${Date.now()}`,
                controlId: `ECC-${Date.now().toString().slice(-3)}`,
                domainName: 'Governance and Strategy',
                subdomainTitle: approvedDetails.category,
                controlDescription: approvedDetails.taskTitle,
                status: 'Approved',
                content: {
                    policy: approvedDetails.draftContent,
                    procedure: 'Cooperatively formulated by virtual board GRC agents.',
                    guideline: 'NCA ECC standard implementation guidance.'
                },
                approvalHistory: approvedDetails.agentFeedback.map(f => ({
                    userId: f.speaker,
                    userName: f.speaker,
                    userRole: f.role as any,
                    action: 'Approved',
                    timestamp: Date.now() - 3600000,
                    comment: f.comment_en
                })),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                generatedBy: 'AI Agent'
            };
            onAddDocument(newDoc);
        }

        if (onAddAuditLog) {
            onAddAuditLog('DOCUMENT_APPROVED', `Admin approved and sealed policy: ${approvedDetails.taskTitle}`);
        }

        // Inform in chat
        const coordinationStartTurn: DialogueEntry = {
            speaker: "Ibrahim AI",
            message_en: `Thank you for approving the ${approvedDetails.taskTitle} policy draft! I have officially added it with status 'Seal Approved' into the corporate documents ledger. I am now initiating our real-time Implementation Coordination tracker. Let us monitor this live.`,
            message_ar: `نشكركم على اعتماد مسودة سياسة ${approvedDetails.taskTitle}. قمت بتسجيلها وتوثيقها رسمياً كسياسة معتمدة بالكامل. سأبدأ في متابعة مؤشر التنفيذ المباشر بالتنسيق معكم.`,
            timestamp: Date.now()
        };

        speakLine(coordinationStartTurn, coordinationStartTurn.speaker);
        setMeetingLog(prev => [...prev, coordinationStartTurn]);
    };

    // Human coordinates and advances tracking boards
    const handleAdvanceImplementationStep = (index: number) => {
        if (!generatedTaskDetails) return;

        const updatedTracker = [...generatedTaskDetails.implementationTracker];
        const step = updatedTracker[index];
        step.status = step.status === 'Todo' ? 'In Progress' : 'Done';

        setGeneratedTaskDetails({
            ...generatedTaskDetails,
            implementationTracker: updatedTracker
        });

        // Trigger agent to speak encouragement
        if (step.status === 'Done') {
            const isFinishedAll = updatedTracker.every(t => t.status === 'Done');
            const alertText = isFinishedAll 
                ? `Incredible! We have successfully implemented all action steps for "${generatedTaskDetails.taskTitle}". Let's finalize evidence collection.`
                : `Operational advance: Ibrahim AI has confirmed completion of "${step.step}". Good job!`;

            const turn: DialogueEntry = {
                speaker: "Ibrahim AI",
                message_en: alertText,
                message_ar: isFinishedAll ? `رائع جداً! تم الانتهاء من جميع مراحل تطبيق الضوابط والسياسات الخاصة بـ "${generatedTaskDetails.taskTitle}". فلننتقل لرفع الإثباتات.` : `تحديث تشغيلي: جرى الانتهاء بنجاح من بند "${step.step}". أحسنت!`,
                timestamp: Date.now()
            };
            speakLine(turn, turn.speaker);
            setMeetingLog(prev => [...prev, turn]);
        }
    };

    // Signature authority registration handling
    const handleRegisterAuthority = (roleKey: string) => {
        const update = { ...authorities };
        update[roleKey].registered = true;
        update[roleKey].registeredAt = Date.now();
        setAuthorities(update);

        if (onAddAuditLog) {
            onAddAuditLog('USER_UPDATED', `Registered professional digital signature credentials for ${update[roleKey].name} (${update[roleKey].role})`);
        }
    };

    // GRC Evidence Submissions & Custom CNN Computer Vision Validation Audit
    const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanningEvidence(true);

        const controlObj = frameworkControlsList.find(c => c.id === selectedAuditControlId) || { id: 'ECC-1-1', title: 'Cybersecurity Governance Policy Guideline', domain: 'Governance' };

        setTimeout(() => {
            const fakeEvidenceId = `evid-${Date.now()}`;
            const cnnLogs = [
                `[CNN Core] Spawning visual analyzer process context...`,
                `[CNN Core] Target artifact file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                `[CNN Core] Loading pre-trained GRC artifact detection network models...`,
                `[CNN Core] Scanning document semantic hierarchy layout...`,
                `[OCR Core] Identified text segments: "${controlObj.title}"`,
                `[OCR Core] Found section headings: "Scope", "Requirements", "Review Intervals"`,
                `[VISION] Analysis matrix mapping: verified corporate letterhead structure.`,
                `[VISION] Detected formal digital seal structure in artifact footnotes.`,
                `[CNN Core] Validation verification confidence score: 98.4% MATCH.`,
                `[AUDIT] Artifact recognized as legitimate draft compliance evidence log.`
            ];

            const newEvidence: AuditEvidence = {
                id: fakeEvidenceId,
                controlId: selectedAuditControlId,
                framework: selectedAuditFramework,
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                uploadedBy: 'System Compliance Agent',
                uploadedAt: Date.now(),
                status: 'Pending Review',
                cnnOutputLog: cnnLogs,
                signatures: {
                    riskOwner: false,
                    lineManager: false,
                    cio: false,
                    ceo: false
                }
            };

            setEvidences(prev => [newEvidence, ...prev]);
            setIsScanningEvidence(false);

            if (onAddAuditLog) {
                onAddAuditLog('VIRTUAL_DEPT_ACTION', `Audit evidence uploaded for ${selectedAuditControlId}: ${file.name}`);
            }

            // Auditor AI talks
            const auditorTurn: DialogueEntry = {
                speaker: "Abdullah AI",
                message_en: `I have received your evidence file: "${file.name}" for compliance control ${selectedAuditControlId}. My CNN Computer Vision engine completed the visual structure and content OCR check. To formally accept this, we must obtain validated signatures from 4 corporate levels: Risk Owner, Line Manager, CIO, and CEO.`,
                message_ar: `تلقيت ملف الإثبات: "${file.name}" للضابط رقم ${selectedAuditControlId}. انتهى نظام الرؤية الحاسوبية من تحليل الهيكل والتطابق. لاعتماده بالكامل، نحتاج لتوقيع 4 مستويات: مالك المخاطر، المدير المباشر، CIO، والمدير التنفيذي.`,
                timestamp: Date.now()
            };

            speakLine(auditorTurn, auditorTurn.speaker);
            setMeetingLog(prev => [...prev, auditorTurn]);

            // Switch to audit tab automatically for user progression
            setActiveTab('audit');

        }, 3000);
    };

    // Digital Signature Signing processing
    const handleSignEvidence = (evidenceId: string, roleKey: 'riskOwner' | 'lineManager' | 'cio' | 'ceo', pinAttempt: string) => {
        const targetAuth = authorities[roleKey];
        if (!targetAuth.registered) {
            alert(`Authority ${targetAuth.role} (${targetAuth.name}) is not registered in the Vault. Please register them in the Credentials tab.`);
            return;
        }

        if (targetAuth.pin !== pinAttempt) {
            alert(`Invalid cryptographic PIN specified for ${targetAuth.role}. Verify passcode and retry.`);
            return;
        }

        const updatedEvidences = evidences.map(ev => {
            if (ev.id === evidenceId) {
                const signs = { ...ev.signatures, [roleKey]: true };
                // If all signatures are verified, promote status of evidence to Approved
                const isFullySigned = signs.riskOwner && signs.lineManager && signs.cio && signs.ceo;
                
                return {
                    ...ev,
                    signatures: signs,
                    status: isFullySigned ? 'Approved' as const : 'Pending Review' as const
                };
            }
            return ev;
        });

        setEvidences(updatedEvidences);

        if (onAddAuditLog) {
            onAddAuditLog('VIRTUAL_DEPT_ACTION', `Digital Signature applied by ${targetAuth.name} (${targetAuth.role}) on target evidence.`);
        }

        // Trigger agent commentary
        const signedEvidence = updatedEvidences.find(e => e.id === evidenceId);
        if (signedEvidence) {
            const allSigned = signedEvidence.signatures.riskOwner && signedEvidence.signatures.lineManager && signedEvidence.signatures.cio && signedEvidence.signatures.ceo;
            
            const speechText = allSigned
                ? `Excellent! All 4 corporate levels have signed off. Under my authority as Internal Auditor, I have approved evidence matching "${signedEvidence.fileName}" for control ${signedEvidence.controlId}. We are fully compliant here.`
                : `Signature verification successful. Applied visual stamp for ${targetAuth.role} (${targetAuth.name}). Waiting for subsequent authorizations.`;

            const turn: DialogueEntry = {
                speaker: "Abdullah AI",
                message_en: speechText,
                message_ar: allSigned ? `رائع! تم اكتمال توقيع المستويات الأربعة. بصفة المراجع الداخلي، قمت باعتماد الإثبات للضابط ${signedEvidence.controlId}. دليلك متوافق بالكامل.` : `تأكيد التوقيع الرقمي بنجاح بصفتي ${targetAuth.role}. بانتظار توقيع بقية الإدارات.`,
                timestamp: Date.now()
            };
            speakLine(turn, turn.speaker);
            setMeetingLog(prev => [...prev, turn]);
        }
    };

    // Generate Treatment Plan if evidence is rejected or cannot be fully signed
    const handleIssueTreatmentPlan = (evidenceId: string) => {
        const plan = {
            gapComments: 'Artifact lacks multi-lateral authorization hierarchy and CIO configuration seal under SAMA CSF requirement 3.1.2.',
            remediationActions: [
                'Provision formal administrative dual-control IAM approval settings.',
                'Record network activity logs mapping high-vulnerability databases.',
                'Present validated signature certifications to board members.'
            ],
            dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString(),
            responsibleParty: 'Fahad AI (CTO)'
        };

        const updated = evidences.map(ev => {
            if (ev.id === evidenceId) {
                return {
                    ...ev,
                    status: 'Rejected' as const,
                    treatmentPlan: plan
                };
            }
            return ev;
        });

        setEvidences(updated);

        // Agents announce corrective plan
        const planTurn: DialogueEntry = {
            speaker: "Rashid AI",
            message_en: `Since our uploaded compliance evidence for control is missing vital signatures, I have compiled a detailed Remediation Treatment Plan. I expect CTO Fahad AI to enforce double-factor validation maps within 15 days.`,
            message_ar: `نظراً لنقص التوقيعات اللازمة على الإثبات المرفوع، قمت بإصدار خطة علاجية لمعالجة الفجوات الأمنية. على المدير التقني مواءمة الضوابط للتنفيذ في غضون ١٥ يوماً.`,
            timestamp: Date.now()
        };

        speakLine(planTurn, planTurn.speaker);
        setMeetingLog(prev => [...prev, planTurn]);
    };

    // Certify compliant state & emit formal Certificate & Findings report
    const handleIssueCertificate = () => {
        const approvedCount = evidences.filter(e => e.status === 'Approved').length;
        if (approvedCount === 0) {
            alert("No fully signed and validated audit evidence records exist in this system yet. Please upload and sign evidence first.");
            return;
        }

        const certId = `CERT-GRC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const hash = "SHA256-" + Math.random().toString(36).substring(2, 14).toUpperCase() + Date.now().toString().slice(-4);
        
        const newCert: ComplianceCertificate = {
            id: certId,
            companyName: 'Acme Cybersecurity Node',
            framework: selectedAuditFramework,
            issueDate: Date.now(),
            serialNumber: `SN-${Date.now().toString().slice(-6)}`,
            securityHash: hash,
            signees: dynamicAgents.map(a => `${a.name} (${a.role})`)
        };

        setCertificates(prev => [newCert, ...prev]);

        if (onAddAuditLog) {
            onAddAuditLog('AGENTIC_AUDIT_COMPLETED', `Formal encrypted Certificate of Completion generated: ${certId}`);
        }

        // Ultimate consensus boardroom announcement
        const finalTurn: DialogueEntry = {
            speaker: "Ahmed Al-Mansoori",
            message_en: `Congratulations board members! We have successfully satisfied outstanding control reviews under standard verification. I have generated, encrypted, and compiled our ultimate GRC Certifications of Compliance: [${certId}], digitally sealed by all virtual department advisors.`,
            message_ar: `تهانينا لأعضاء مجلس الإدارة والفرق المختصة! لقد قمنا بتلبية كافة شروط الامتثال المطلوبة بنجاح. قمت بإصدار شهادة المطابقة والامتثال الرقمية المشفرة: [${certId}] بموافقة الجميع.`,
            timestamp: Date.now()
        };

        speakLine(finalTurn, finalTurn.speaker);
        setMeetingLog(prev => [...prev, finalTurn]);
    };

    // Automated Notification Escalation engine (Email, WhatsApp, Phone call simulation logs)
    const triggerEscalationSimulation = (type: 'Email' | 'WhatsApp' | 'Call') => {
        setEscalationTriggerSuccess(true);
        setTimeout(() => setEscalationTriggerSuccess(false), 4000);

        let target = type === 'Email' ? outboundEmail : outboundTarget;
        let message = "";

        if (type === 'Email') {
            message = `🚨 [GRC ESCALATION DRIFT ALERT] Attention executive officers! Framework Compliance for SAMA CSF control 3.1.2 has drifted. Action required within 48 hours.`;
        } else if (type === 'WhatsApp') {
            message = `⚠️ [Automa-Agentic GRC Force] SEC ops warning dispatched to CISO! Control ECC-2-1 failed nightly CNN screenshot check. Remediation requested.`;
        } else {
            message = `📞 [VoIP Call Dispatch] Initiating automated incident script to CEO: 'Alert: Active critical vulnerabilities detected on production network DB node'`;
        }

        const logEntry = {
            id: `esc-log-${Date.now()}`,
            timestamp: Date.now(),
            type,
            target,
            message,
            status: type === 'Call' ? 'Connected' as const : 'Dispatched' as const
        };

        setEscalationLogs(prev => [logEntry, ...prev]);

        if (onAddAuditLog) {
            onAddAuditLog('VIRTUAL_DEPT_ACTION', `Automated agentic escalation triggered (${type}) targeting ${target}`);
        }

        // Outbound trace simulation steps
        if (type === 'Call') {
            setTimeout(() => {
                setEscalationLogs(prev => {
                    return prev.map(l => l.id === logEntry.id ? { ...l, status: 'Acked' as const } : l);
                });
            }, 3000);
        } else {
            setTimeout(() => {
                setEscalationLogs(prev => {
                    return prev.map(l => l.id === logEntry.id ? { ...l, status: 'Delivered' as const } : l);
                });
            }, 1000);
        }
    };

    // Direct Inline Dynamic SVG generators for Company QR Code
    const generateCompanyQR = (cert: ComplianceCertificate) => {
        // Aesthetic mock QR code SVG showing a stylized QR block representation to avoid external library failures
        return (
            <svg viewBox="0 0 100 100" className="w-24 h-24 bg-white p-1 rounded border border-gray-200">
                <rect width="100" height="100" fill="white" />
                {/* 3 large anchor square checkers */}
                <rect x="5" y="5" width="20" height="20" fill="black" />
                <rect x="10" y="10" width="10" height="10" fill="white" />
                
                <rect x="75" y="5" width="20" height="20" fill="black" />
                <rect x="80" y="10" width="10" height="10" fill="white" />
                
                <rect x="5" y="75" width="20" height="20" fill="black" />
                <rect x="10" y="80" width="10" height="10" fill="white" />

                {/* Simulated cryptographic bar lines and bits inside */}
                <rect x="35" y="5" width="5" height="15" fill="black" />
                <rect x="45" y="10" width="10" height="5" fill="black" />
                <rect x="60" y="5" width="5" height="5" fill="black" />
                
                <rect x="35" y="30" width="25" height="25" fill="black" opacity="0.85" />
                <rect x="40" y="35" width="15" height="15" fill="white" />
                <rect x="45" y="40" width="5" height="5" fill="black" />

                <rect x="70" y="35" width="10" height="10" fill="black" />
                <rect x="5" y="45" width="15" height="5" fill="black" />
                <rect x="15" y="55" width="5" height="15" fill="black" />
                <rect x="75" y="60" width="15" height="15" fill="black" />

                {/* Stylized custom GRC lock icon in perfect center */}
                <circle cx="50" cy="50" r="10" fill="#0d9488" />
                <rect x="46" y="46" width="8" height="8" rx="1" fill="white" />
            </svg>
        );
    };

    // Direct Inline SVG Barcode generator for compliance documents
    const generateDocumentBarcode = (docId: string) => {
        return (
            <svg viewBox="0 0 160 50" className="w-48 h-12 bg-white px-2 py-1 rounded border border-gray-200">
                <rect width="160" height="50" fill="white" />
                {/* Dynamic visual barcode bars generated from document ID */}
                <g fill="black">
                    <rect x="5" y="5" width="3" height="30" />
                    <rect x="10" y="5" width="1" height="30" />
                    <rect x="13" y="5" width="4" height="30" />
                    <rect x="20" y="5" width="2" height="30" />
                    <rect x="24" y="5" width="1" height="30" />
                    <rect x="28" y="5" width="5" height="30" />
                    <rect x="36" y="5" width="2" height="30" />
                    <rect x="40" y="5" width="3" height="30" />
                    <rect x="46" y="5" width="1" height="30" />
                    <rect x="50" y="5" width="4" height="30" />
                    <rect x="58" y="5" width="2" height="30" />
                    <rect x="62" y="5" width="1" height="30" />
                    <rect x="65" y="5" width="6" height="30" />
                    <rect x="74" y="5" width="2" height="30" />
                    <rect x="78" y="5" width="3" height="30" />
                    <rect x="84" y="5" width="1" height="30" />
                    <rect x="88" y="5" width="4" height="30" />
                    <rect x="94" y="5" width="2" height="30" />
                    <rect x="99" y="5" width="1" height="30" />
                    <rect x="102" y="5" width="5" height="30" />
                    <rect x="110" y="5" width="2" height="30" />
                    <rect x="114" y="5" width="3" height="30" />
                    <rect x="120" y="5" width="1" height="30" />
                    <rect x="124" y="5" width="6" height="30" />
                    <rect x="132" y="5" width="2" height="30" />
                    <rect x="136" y="5" width="1" height="30" />
                    <rect x="140" y="5" width="4" height="30" />
                    <rect x="146" y="5" width="2" height="30" />
                    <rect x="150" y="5" width="3" height="30" />
                </g>
                <text x="80" y="44" fill="black" fontSize="8" fontFamily="monospace" textAnchor="middle">{docId}</text>
            </svg>
        );
    };

    const handleSimulateSkill = (skill: CyberSkill) => {
        setSimulatingSkillId(skill.id);
        const ownerAgent = dynamicAgents.find(a => a.id === skill.agentOwnerId) || dynamicAgents[0];
        
        const logs = [
            `► [GRC BOARDROOM LOG] Initializing Sovereign Autonomous Agent Session...`,
            `► [GRC SYSTEM] Restoring knowledge capsule for: ${skill.id}`,
            `► [GRC SYSTEM] Assigned Agent Co-pilot: ${ownerAgent.name} (${ownerAgent.title})`,
            `► [GRC SYSTEM] Domain: ${skill.domain}`,
            `► [GRC SYSTEM] Aligning Security Framework Guidelines: ${skill.targetFrameworks.join(' | ')}`,
            `► [EXECUTION RUN] "${skill.title}" payload uploaded successfully.`,
            `► [TELEMETRY] Action step: ${skill.technicalAction}`,
            `► [COMPLIANCE LEDGER] Hashing results on ledger consensus registry...`,
            `✔ Verification Complete. Stamping audit confirmation on blockchain compliance ledger.`
        ];

        setSimulationLogs([]);
        let index = 0;
        
        // Clear previous interval if any
        const interval = setInterval(() => {
            if (index < logs.length) {
                setSimulationLogs(prev => [...prev, logs[index]]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 450);
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-1 py-1">
            {/* Main Header section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-normal text-slate-950 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-teal-600" />
                        Virtual GRC &amp; Cybersecurity Boardroom
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                        Multi-Agent Intelligent Department &amp; Audit Consensus Ledger
                    </p>
                </div>
                
                {/* Horizontal navigation tabs */}
                <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'team' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Advisors Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('meeting')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'meeting' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Boardroom Deliberations
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Auditor Portal (CNN)
                    </button>
                    <button
                        onClick={() => setActiveTab('vault')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'vault' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        Credentials Vault
                    </button>
                    <button
                        onClick={() => setActiveTab('escalations')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'escalations' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        {language === 'ar' ? 'سجلات التصعيد' : 'Escalation logs'}
                    </button>
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`px-3 py-1.5 text-xs font-normal rounded-lg transition-all ${activeTab === 'skills' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'} flex items-center gap-1 border border-teal-500/20 dark:border-teal-400/20`}
                    >
                        <Cpu className="w-3.5 h-3.5 text-teal-500" />
                        <span>{language === 'ar' ? 'مكتبة مهارات الوكلاء' : 'Agent Cyber Skills'}</span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT 1: Advisors Matrix */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    {/* Active GRC Framework Matrix Selector */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-teal-600" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-300">
                                Active Corporate GRC Frameworks &amp; Standards
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Selecting regulatory frameworks automatically instantiates the respective specialized advisor agents with dedicated professional domain expertise into the courtroom.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {['NCA ECC', 'SAMA CSF', 'PDPL', 'ISO 27001', 'ISO 22301'].map(fw => {
                                const active = activeFrameworks.includes(fw);
                                return (
                                    <button
                                        key={fw}
                                        onClick={() => {
                                            if (active) {
                                                if (['NCA ECC', 'SAMA CSF', 'PDPL'].includes(fw)) return;
                                                setActiveFrameworks(prev => prev.filter(x => x !== fw));
                                            } else {
                                                setActiveFrameworks(prev => [...prev, fw]);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                            active
                                                ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400'
                                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-teal-500' : 'bg-slate-400'}`}></span>
                                        {fw}
                                        {['NCA ECC', 'SAMA CSF', 'PDPL'].includes(fw) && (
                                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 bg-slate-100 dark:bg-slate-800 rounded">Standard</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Autonomous Skill-to-Agent Dispatcher */}
                    <div className="bg-slate-900 text-white rounded-2xl border border-teal-500/30 p-5 shadow-lg space-y-4">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-teal-400" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                                Autonomous Skill-to-Agent Dispatch Engine
                            </h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                            Input a specific technical cybersecurity task (e.g., <span className="italic text-teal-300">"Acquisition"</span>, <span className="italic text-teal-300">"S3 bucket hardening"</span>, <span className="italic text-teal-300">"BCM"</span>, or <span className="italic text-teal-300">"Annex"</span>). The dispatch engine searches the 754-skill library, identifies the best-qualified expert, and automatically selects that agent in the Virtual Department registry for immediate advisory engagement.
                        </p>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Enter technical task (e.g., Encryption, Malware, BCM, Audit) to find and select agent..."
                                    value={taskQuery}
                                    onChange={(e) => handleDispatchTask(e.target.value)}
                                    className="pl-9 pr-4 py-2 w-full text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-white placeholder:text-slate-600 font-mono"
                                />
                            </div>
                            {taskQuery.trim() && (
                                <button
                                    onClick={() => handleDispatchTask('')}
                                    className="px-3.5 py-2 text-xs font-normal bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {dispatcherSuccess && (
                            <div className="p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl flex items-start gap-2.5 text-xs text-teal-200 animate-fade-in">
                                <span className="inline-block p-1 bg-teal-500/20 rounded mt-0.5">
                                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <div className="space-y-1">
                                    <p className="font-semibold">{dispatcherSuccess}</p>
                                    {matchedSkill && (
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Telemetry Skill Match: <span className="font-mono text-teal-300 font-semibold bg-teal-950 px-1.5 py-0.5 rounded">[{matchedSkill.id.toUpperCase()}]</span> — <span className="italic">"{matchedSkill.title}"</span>. Domain: {matchedSkill.domain}.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dynamicAgents.map(agent => (
                            <div 
                                key={agent.id} 
                                className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 transition-all cursor-pointer overflow-hidden flex flex-col h-full ${selectedAgent?.id === agent.id ? 'border-teal-500 ring-2 ring-teal-50 dark:ring-slate-800' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                onClick={() => setSelectedAgent(agent)}
                            >
                                <div className="p-6 flex-grow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative">
                                            <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md" />
                                            {agent.id === 'agent-abdullah' && (
                                                <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-normal px-1.5 py-0.5 rounded-full animate-pulse border border-white dark:border-slate-800">CNN ACTIVE</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-normal text-slate-950 dark:text-white">{agent.name}</h3>
                                            <p className="text-xs font-normal text-teal-600 dark:text-teal-400 uppercase tracking-widest">{agent.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">{agent.description}</p>
                                    
                                    <div className="space-y-2">
                                        {agent.capabilities.slice(0, 3).map((cap, i) => (
                                            <div key={i} className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                                <CheckCircle className="w-3 h-3 mr-1.5 text-teal-500" />
                                                {cap}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
                                    <span className="text-[11px] text-slate-500">Reports: <span className="font-normal">{agent.reportingLine}</span></span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConsultAgent(agent);
                                        }}
                                        className="flex items-center gap-1 text-xs font-normal text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Consult Voice
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedAgent && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 animate-fade-in">
                            <img src={selectedAgent.avatarUrl} alt={selectedAgent.name} className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 shadow-md self-start" />
                            <div className="flex-grow space-y-4">
                                <div>
                                    <h2 className="text-lg font-normal text-slate-950 dark:text-white">{selectedAgent.name}</h2>
                                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">{selectedAgent.title}</p>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedAgent.fullBio}</p>
                                
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-2">Primary RACI Scope &amp; Responsibilities</p>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {selectedAgent.responsibilities.map((r, i) => (
                                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                                                <ChevronRight className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 2: Boardroom Deliberations */}
            {activeTab === 'meeting' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Collective intelligence panel inside the meeting */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-normal uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Database className="w-4 h-4 text-teal-600" />
                                Board Shared Intelligence
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Our agents inspect the live micro-services of the compliance platform. They share a synchronized state ledger.
                            </p>

                            <div className="space-y-3 pt-2">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">NCA ECC Compliance</span>
                                    <span className="text-xs font-bold text-teal-600">
                                        {Math.round((eccAssessment.filter(v => v.controlStatus === 'Implemented').length / (eccAssessment.length || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Active Risk Index</span>
                                    <span className="text-xs font-bold text-amber-600">{risks.length} Listed</span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Remedial Plans</span>
                                    <span className="text-xs font-bold text-red-500">
                                        {evidences.filter(e => e.status === 'Rejected').length} Pending Treatment
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Co-operative Drafting trigger section */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <h2 className="text-sm font-normal uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <Bot className="w-4 h-4 text-purple-600" />
                                Cooperatively Draft Missing Tasks
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Identify a loophole or unfulfilled regulation? Command all boardroom members to collaborate. They will debate, auto-generate a comprehensive policy standard, apply peer-review signatures, and hand it to you for deployment.
                            </p>

                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={() => handleTriggerMissingTaskCooperation("Privileged Access Governance Control Policy")}
                                    disabled={isTaskGenerating}
                                    className="w-full text-left p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl text-xs text-purple-900 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/40 transition flex items-center justify-between"
                                >
                                    <span>Draft SAMA CSF Privileged Access Policy</span>
                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                </button>
                                <button
                                    onClick={() => handleTriggerMissingTaskCooperation("Vulnerability Remediation Operational Standard")}
                                    disabled={isTaskGenerating}
                                    className="w-full text-left p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl text-xs text-purple-900 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/40 transition flex items-center justify-between"
                                >
                                    <span>Draft Vulnerability Remediation Standard</span>
                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                </button>
                                <button
                                    onClick={() => handleTriggerMissingTaskCooperation("Personal Data Protection Privacy Notice")}
                                    disabled={isTaskGenerating}
                                    className="w-full text-left p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl text-xs text-purple-900 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/40 transition flex items-center justify-between"
                                >
                                    <span>Draft PDPL Compliance Privacy Notice</span>
                                    <ChevronRight className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chat Boardroom transcripts and active logs */}
                    <div className="lg:col-span-2 flex flex-col h-[640px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <h3 className="text-white text-sm font-normal text-[13px] uppercase tracking-wider">
                                    Strategic Alignment Meeting - Active
                                </h3>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Voice auto-narration / manual override controls */}
                                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                                    <button
                                        onClick={() => {
                                            const nextVal = !isVoiceOutputEnabled;
                                            setIsVoiceOutputEnabled(nextVal);
                                            if (nextVal) {
                                                speakLine("Voice synth activated.", "Asaad AI", null, true);
                                            } else {
                                                if ('speechSynthesis' in window) {
                                                    window.speechSynthesis.cancel();
                                                }
                                            }
                                        }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${isVoiceOutputEnabled ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                        title="Toggle text-to-speech auto-play"
                                    >
                                        {isVoiceOutputEnabled ? (
                                            <>
                                                <Volume2 className="w-3.5 h-3.5" />
                                                <span>Voice ON</span>
                                            </>
                                        ) : (
                                            <>
                                                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                                                <span>Voice MUTED</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            speakLine("Cross functional sound board check active.", "Ahmed Al-Mansoori", null, true);
                                        }}
                                        className="px-1.5 py-1 text-slate-400 hover:text-slate-200 text-[9px] uppercase font-mono tracking-widest border border-slate-800 hover:border-slate-700 rounded transition-all"
                                        title="Test speech engine output"
                                    >
                                        Test Audio
                                    </button>
                                </div>

                                {/* Multilingual control */}
                                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                                    <button 
                                        onClick={() => setBoardroomLang('en')}
                                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${boardroomLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        EN 🇬🇧
                                    </button>
                                    <button 
                                        onClick={() => setBoardroomLang('ar')}
                                        className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${boardroomLang === 'ar' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        AR 🇸🇦
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active cross-functional respondent focus bar */}
                        {designatedRespondent && (
                            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                    <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-ping"></span>
                                    Active Cross-Funct Respondent: <span className="text-purple-400 font-bold">{designatedRespondent.name}</span> <span className="text-slate-500">[{designatedRespondent.role}]</span>
                                </span>
                                <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                                    Direct Duty Assigned
                                </span>
                            </div>
                        )}

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {meetingLog.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 text-slate-400">
                                    <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
                                    <p className="text-xs uppercase tracking-widest font-normal">Strategic board meeting idle. Click compile baseline to assemble agents.</p>
                                    <button 
                                        onClick={() => runSimulationTurn()}
                                        className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs uppercase font-bold animate-pulse"
                                    >
                                        Initialize Meeting Session
                                    </button>
                                </div>
                            )}

                            {meetingLog.map((log, idx) => {
                                const agent = dynamicAgents.find(a => a.name === log.speaker);
                                const isUser = log.speaker.startsWith("You");
                                const isActivelySpeaking = speakingDialogIdx === idx;
                                return (
                                    <div key={idx} className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
                                        {agent ? (
                                            <div className="relative shrink-0">
                                                <img src={agent.avatarUrl} alt={agent.name} className={`w-9 h-9 rounded-full object-cover border mt-1 transition-all ${isActivelySpeaking ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105' : 'border-slate-700'}`} />
                                                {isActivelySpeaking && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-slate-900 rounded-full animate-ping"></span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-teal-900 flex items-center justify-center text-white text-xs mt-1 shrink-0">
                                                {isUser ? 'ME' : 'SYS'}
                                            </div>
                                        )}
                                        <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[11px] font-semibold text-slate-400">{log.speaker}</span>
                                                <span className="text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                
                                                {/* Pulsing live cyber waves for active speech synthesis feedback */}
                                                {isActivelySpeaking && (
                                                    <div className="flex items-center gap-0.5 h-3 px-1.5 bg-emerald-950/60 border border-emerald-850 rounded-full animate-pulse ml-1">
                                                        <span className="w-0.5 bg-emerald-400 animate-[pulse_0.4s_infinite] h-2"></span>
                                                        <span className="w-0.5 bg-emerald-400 animate-[pulse_0.6s_infinite] h-3"></span>
                                                        <span className="w-0.5 bg-emerald-400 animate-[pulse_0.3s_infinite] h-1.5"></span>
                                                        <span className="w-0.5 bg-emerald-400 animate-[pulse_0.5s_infinite] h-2.5"></span>
                                                        <span className="text-[8px] font-mono text-emerald-400 ml-1 uppercase">Speaking</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="relative group mt-1">
                                                <div className={`p-3 rounded-2xl text-[13px] md:text-xs leading-relaxed ${isUser ? 'bg-teal-950/40 border border-teal-800 text-teal-100' : 'bg-slate-800/80 border border-slate-700 text-slate-100'} ${isActivelySpeaking ? 'ring-1 ring-emerald-500 bg-slate-800' : ''}`}>
                                                    <p className={boardroomLang === 'ar' ? 'font-arabic text-right' : 'text-left'} dir={boardroomLang === 'ar' ? 'rtl' : 'ltr'}>
                                                        {boardroomLang === 'ar' ? (log.message_ar || log.message_en) : log.message_en}
                                                    </p>
                                                    
                                                    {/* Directly embedded Audio trigger bypass button to ensure perfect compliance in restricted iframes */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => speakLine(log, log.speaker, idx, true)}
                                                            className="p-1 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors shadow-lg flex items-center gap-1 scale-90"
                                                            title="Play/Hear voice output immediately (bypasses browser autoplay limits)"
                                                        >
                                                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span className="text-[8px] font-bold uppercase tracking-wider pr-1">Hear</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {isThinking && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse pl-4">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Boardroom advisors are debating consensus...</span>
                                </div>
                            )}

                            {isTaskGenerating && (
                                <div className="p-4 bg-purple-950/20 border border-purple-900/60 rounded-xl space-y-3 animate-pulse">
                                    <div className="w-7 h-7 bg-purple-800 rounded-full flex items-center justify-center text-white text-xs">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-purple-300">Cooperative Agent Drafting Engine Triggered</p>
                                        <p className="text-[11px] text-purple-400 mt-1">CISO, Compliance, CTO and DevOps are formatting markdown standards and reviews...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Meeting controls footer */}
                        <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row items-center gap-3">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={toggleMic}
                                    className={`p-2 rounded-xl transition-all ${isMicActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    title="Speak to board"
                                >
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                                    title="Submit evidence file"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*,application/pdf"
                                    onChange={handleEvidenceUpload}
                                />
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const text = (e.currentTarget.elements.namedItem('chatIn') as HTMLInputElement).value;
                                    if (text.trim()) {
                                        // Synchronously trigger a silent check to keep Speech Synthesis active in gesture handler
                                        speakLine("Taking question", "System", null, false);
                                        handleUserSpeak(text.trim());
                                        e.currentTarget.reset();
                                    }
                                }}
                                className="flex-1 flex gap-2 w-full"
                            >
                                <input
                                    name="chatIn"
                                    type="text"
                                    placeholder="Instruct the advisors or ask compliance questions..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg uppercase"
                                >
                                    Send
                                </button>
                            </form>
                            
                            <button
                                onClick={() => runSimulationTurn()}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold rounded-lg shrink-0"
                            >
                                Debrief
                            </button>
                        </div>
                    </div>

                    {/* Collaborative drafting validator panel */}
                    {generatedTaskDetails && (
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/20 text-[10px] text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-widest rounded border border-purple-100 dark:border-purple-900/40">Collaborative Draft Standard</span>
                                    <h2 className="text-lg font-normal text-slate-950 dark:text-white mt-2">{generatedTaskDetails.taskTitle}</h2>
                                    <p className="text-xs text-slate-500 mt-1">Assigned Context: {generatedTaskDetails.category}</p>
                                </div>
                                {!generatedTaskDetails.humanApproved ? (
                                    <button
                                        onClick={handleHumanValidateAndApprove}
                                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Validate &amp; Seal Policy
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-950 px-4 py-2 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Seal Approved. Saved to GRC Registry</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Policy Markdown content</p>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 overflow-x-auto max-h-[250px]">
                                        <pre className="whitespace-pre-wrap">{generatedTaskDetails.draftContent}</pre>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Board Consensus Signatures</p>
                                    <div className="space-y-3">
                                        {generatedTaskDetails.agentFeedback.map((f, i) => (
                                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl relative overflow-hidden">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.speaker}</p>
                                                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">{f.role}</p>
                                                    </div>
                                                    <span className="text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/40">
                                                        SIGNED
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 italic">"{f.comment_en}"</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-arabic" dir="rtl">{f.comment_ar}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Implementation Coordination section */}
                            {generatedTaskDetails.humanApproved && (
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Implementation Coordination (Human-in-the-Loop)</h3>
                                    <p className="text-xs text-slate-500">
                                        Director of Operations Ibrahim AI leads the deployment schedule. Review steps below, execute in your local node systems, and advance the state.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        {generatedTaskDetails.implementationTracker.map((step, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${step.status === 'Done' ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/60 opacity-80' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                                                <div>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${step.status === 'Todo' ? 'bg-slate-100 text-slate-600' : step.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                        {step.status}
                                                    </span>
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white mt-3 leading-relaxed">{step.step}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Target: {step.timeline}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAdvanceImplementationStep(idx)}
                                                    className={`w-full py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${step.status === 'Done' ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 hover:bg-teal-100'}`}
                                                >
                                                    {step.status === 'Todo' ? 'Initiate' : step.status === 'In Progress' ? 'Confirm Completed' : 'Completed ✔'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 3: Internal Audit Portal (CNN Engine) */}
            {activeTab === 'audit' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-md font-normal text-slate-950 dark:text-white flex items-center gap-2">
                                    <Fingerprint className="w-5 h-5 text-teal-600" />
                                    Internal Auditor Node Operations
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                                    Continuous verification supervised by Abdullah AI
                                </p>
                            </div>
                            
                            <button
                                onClick={handleIssueCertificate}
                                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow transition"
                            >
                                Issue Complete GRC Certificate
                            </button>
                        </div>

                        {/* Search and framework select controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Regulation Control</label>
                                <select
                                    value={selectedAuditControlId}
                                    onChange={(e) => {
                                        setSelectedAuditControlId(e.target.value);
                                        // Auto map framework
                                        const found = frameworkControlsList.find(c => c.id === e.target.value);
                                        if (found) {
                                            setSelectedAuditFramework(found.domain === 'SAMA CSF' ? 'SAMA CSF' : found.domain === 'PDPL' ? 'PDPL' : 'NCA ECC');
                                        }
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                                >
                                    {frameworkControlsList.map(c => (
                                        <option key={c.id} value={c.id}>[{c.id}] {c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Evidence Submission Drag-and-Drop</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-lg p-3 bg-white dark:bg-slate-900 flex items-center justify-center gap-2 cursor-pointer transition"
                                >
                                    <Upload className="w-4 h-4 text-teal-600" />
                                    <span className="text-xs text-slate-505 dark:text-slate-400">Click to attach screenshot, system backup or signed logs...</span>
                                </div>
                            </div>
                        </div>

                        {isScanningEvidence && (
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-pulse">
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>CNN VISION PIPELINE: Extrapolating configuration telemetry, verifying digital visual markers...</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                                    <div className="bg-purple-500 h-full w-[45%] animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Evidence verification queue */}
                    {evidences.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence Verification Ledger</h3>
                            
                            {evidences.map(ev => {
                                const ctrl = frameworkControlsList.find(c => c.id === ev.controlId);
                                return (
                                    <div key={ev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-bold rounded">
                                                        {ev.framework} - {ev.controlId}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                                                        ev.status === 'Approved' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/40' :
                                                        ev.status === 'Rejected' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40' :
                                                        'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                                    }`}>
                                                        {ev.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-semibold text-slate-950 dark:text-white mt-2">Target: {ctrl?.title || 'System Control Policy'}</h4>
                                                <p className="text-[11px] text-slate-400 mt-1">Uploaded: {ev.fileName} ({ev.fileSize}) • {new Date(ev.uploadedAt).toLocaleString()}</p>
                                            </div>

                                            {ev.status === 'Pending Review' && (
                                                <button
                                                    onClick={() => handleIssueTreatmentPlan(ev.id)}
                                                    className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-800/40 dark:hover:bg-red-950/20 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                                                    title="Reject evidence and generate corrective timeline"
                                                >
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Flag Treatment Plan
                                                </button>
                                            )}
                                        </div>

                                        {/* Multi-Signature authorizations checklist & inputs */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
                                                    Authorized Corporate Approvals (4-Levels Required)
                                                </p>
                                                <span className="text-[10px] text-slate-400 uppercase">Input secret PIN to sign</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                {/* Signature slots */}
                                                {(['riskOwner', 'lineManager', 'cio', 'ceo'] as const).map(roleKey => {
                                                    const aut = authorities[roleKey];
                                                    const isSigned = ev.signatures[roleKey];
                                                    return (
                                                        <div key={roleKey} className={`p-3 rounded-lg border-2 ${isSigned ? 'bg-emerald-50/25 dark:bg-emerald-950/20 border-emerald-500/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{aut.name}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{aut.role}</p>
                                                            
                                                            <div className="mt-3">
                                                                {isSigned ? (
                                                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                                                                        <Check className="w-4 h-4 shrink-0" />
                                                                        <span>SEAL SIGNED</span>
                                                                    </div>
                                                                ) : (
                                                                    <form
                                                                        onSubmit={(e) => {
                                                                            e.preventDefault();
                                                                            const pin = (e.currentTarget.elements.namedItem('pinIn') as HTMLInputElement).value;
                                                                            handleSignEvidence(ev.id, roleKey, pin);
                                                                        }}
                                                                        className="flex gap-1"
                                                                    >
                                                                        <input
                                                                            name="pinIn"
                                                                            type="password"
                                                                            placeholder="PIN"
                                                                            className="w-12 bg-slate-50 dark:bg-slate-800 text-xs text-center border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 py-0.5"
                                                                        />
                                                                        <button 
                                                                            type="submit"
                                                                            className="px-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold"
                                                                        >
                                                                            Stamp
                                                                        </button>
                                                                    </form>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Diagnostic CNN Logs Panel */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNN Audit Diagnostic Logs</p>
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[160px] overflow-y-auto text-xs font-mono text-slate-400 space-y-1">
                                                {ev.cnnOutputLog.map((log, idx) => (
                                                    <p key={idx} className={log.includes('[VISION]') || log.includes('[OCR]') ? 'text-cyan-400' : ''}>{log}</p>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actionable treatment plans if rejected */}
                                        {ev.treatmentPlan && (
                                            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3 animate-fade-in">
                                                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-semibold text-xs uppercase tracking-wide">
                                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                    <span>Cybersecurity Remediation Treatment Plan Issued</span>
                                                </div>
                                                <p className="text-xs text-rose-900/80 dark:text-rose-300 leading-relaxed italic">
                                                    Gaps identified: "{ev.treatmentPlan.gapComments}"
                                                </p>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Corrective Measures Required:</p>
                                                    <ul className="list-disc pl-4 text-xs text-rose-800 dark:text-rose-400 mt-1 space-y-1">
                                                        {ev.treatmentPlan.remediationActions.map((act, i) => (
                                                            <li key={i}>{act}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="text-[10px] text-rose-600 dark:text-rose-400 flex justify-between uppercase pt-1 font-semibold">
                                                    <span>Assignee: {ev.treatmentPlan.responsibleParty}</span>
                                                    <span>Target Timeline: {ev.treatmentPlan.dueDate}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Issued Certificates */}
                    {certificates.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issued Corporate Certification Records</h3>
                            
                            {certificates.map(cert => (
                                <div key={cert.id} className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-teal-500 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                    {/* background design */}
                                    <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="space-y-4 max-w-xl text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-3">
                                            <Award className="w-10 h-10 text-teal-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-teal-400 text-xs font-bold tracking-widest uppercase">Certificate of Cybersecurity Compliance</p>
                                                <h4 className="text-md font-normal text-white mt-1">FRAMEWORK VERIFIED: {cert.framework}</h4>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            This nodes confirms compliance. Subject is hereby certified under cryptographic supervision matching ECC-1 control standards of general multi-tenant governance security boundaries SAMA ECC.
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 uppercase pt-2 font-mono">
                                            <div>ID: {cert.id}</div>
                                            <div>Serial: {cert.serialNumber}</div>
                                            <div className="col-span-2 truncate">Hash: {cert.securityHash}</div>
                                        </div>
                                    </div>

                                    {/* Direct Inline Generators: QR Code, barcode */}
                                    <div className="flex flex-col items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0">
                                        {generateCompanyQR(cert)}
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Company QR Stamp</p>
                                        
                                        {generateDocumentBarcode(cert.id)}
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Document Barcode</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 4: Credentials Vault */}
            {activeTab === 'vault' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-sm font-normal uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Fingerprint className="w-5 h-5 text-teal-600" />
                            Digital Signature Registry Vault
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Register formal compliance authority credentials. Set authentication PINs used to securely validate and stamp audit evidence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(Object.keys(authorities) as Array<keyof typeof authorities>).map(key => {
                            const aut = authorities[key];
                            return (
                                <div key={key} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-950 dark:text-white uppercase">{aut.role} Profile</h3>
                                            <p className="text-md font-normal text-slate-800 dark:text-slate-200 mt-1">{aut.name}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${aut.registered ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                                            {aut.registered ? 'Active Credentials' : 'Unregistered'}
                                        </span>
                                    </div>

                                    {aut.registered ? (
                                        <div className="space-y-2">
                                            <div className="text-[11px] text-slate-500">
                                                Visual signature stamp registered successfully. PIN is set to <span className="font-mono text-teal-600 font-bold">****</span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 uppercase">Registered at: {new Date(aut.registeredAt || Date.now()).toLocaleDateString()}</div>
                                        </div>
                                    ) : (
                                        <div className="pt-2">
                                            <button
                                                onClick={() => handleRegisterAuthority(key as string)}
                                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition"
                                            >
                                                Initialize Authority Signature
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT 5: Outbound Escalation Simulator Logs */}
            {activeTab === 'escalations' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-sm font-normal uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-teal-600" />
                            Incident Trigger &amp; Escalation Simulator
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Simulate active notifications sent automatically by the compliance agents if control levels drift or reviews miss their schedule.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escalation WhatsApp &amp; VoIP phone</label>
                            <input
                                type="text"
                                value={outboundTarget}
                                onChange={(e) => setOutboundTarget(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-white"
                            />

                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Escalation Email contact</label>
                            <input
                                type="text"
                                value={outboundEmail}
                                onChange={(e) => setOutboundEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-white"
                            />

                            <div className="space-y-2 pt-4">
                                <button
                                    onClick={() => triggerEscalationSimulation('Email')}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>Trigger Outbound Email Alert</span>
                                </button>
                                <button
                                    onClick={() => triggerEscalationSimulation('WhatsApp')}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Bot className="w-4 h-4" />
                                    <span>Send WhatsApp Alert</span>
                                </button>
                                <button
                                    onClick={() => triggerEscalationSimulation('Call')}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>Initiate VoIP Agent Call</span>
                                </button>
                            </div>

                            {escalationTriggerSuccess && (
                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest animate-pulse mt-2">
                                    ✔ Dispatch queue processed successfully. Logged.
                                </p>
                            )}
                        </div>

                        {/* Logs console */}
                        <div className="lg:col-span-2 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Dispatch Log Console</p>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-[260px] overflow-y-auto text-xs font-mono text-slate-400 space-y-2">
                                {escalationLogs.length === 0 ? (
                                    <p className="text-slate-600 italic">No outbound escalations triggered. Click buttons to test dispatches.</p>
                                ) : (
                                    escalationLogs.map(log => (
                                        <div key={log.id} className="border-b border-slate-800/60 pb-2">
                                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                                                <span>{new Date(log.timestamp).toLocaleTimeString()} • Type: {log.type}</span>
                                                <span className={`font-bold uppercase ${log.status === 'Acked' || log.status === 'Delivered' ? 'text-green-500' : 'text-cyan-400 animate-pulse'}`}>{log.status}</span>
                                            </div>
                                            <p className="text-slate-200 mt-1">{log.message}</p>
                                            <p className="text-slate-400 text-[10px] mt-0.5">Destination: {log.target}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 6: Agentic Cybersecurity Skills Knowledge Base (Anthropic 754 Library) */}
            {activeTab === 'skills' && (
                <div className="space-y-6">
                    {/* Hero stats & Repository banner */}
                    <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
                        {/* Abstract background graphics */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial-gradient pointer-events-none flex items-center justify-center">
                            <Cpu className="w-48 h-48 text-cyan-400" />
                        </div>

                        <div className="flex flex-col gap-2 max-w-3xl">
                            <div className="flex items-center gap-2">
                                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">
                                    AI-Native Knowledge Base
                                </span>
                                <span className="text-slate-500 text-xs font-mono">•</span>
                                <a 
                                    href="https://github.com/mukul975/Anthropic-Cybersecurity-Skills.git" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                                >
                                    <span>github.com/mukul975/Anthropic-Cybersecurity-Skills.git</span>
                                    <span>↗</span>
                                </a>
                            </div>
                            <h2 className="text-lg font-normal tracking-tight text-white flex items-center gap-2 pt-1">
                                <BookOpen className="w-5 h-5 text-teal-400" />
                                {language === 'ar' 
                                  ? 'مكتبة مهارات ومعرفة وكلاء الأمن السيبراني المستقلين' 
                                  : 'Sovereign Agentic Cybersecurity Skills Library'}
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {language === 'ar'
                                  ? 'لا تقتصر هذه المكتبة على البرامج النصية والتعليمات البسيطة، بل هي عبارة عن "كبسولات معرفية سيبرانية لوكلاء الذكاء الاصطناعي". تكمن أهميتها في هيكلتها لتمكين الوكلاء من اتخاذ قرارات مستقلة وخبرات نوعية كمحللي أمن سيبراني متقدمين.'
                                  : 'This is not just a collection of scripts or checklists. It is an AI-native cognitive base structured for GRC & Technical Cybersecurity AI agents to perform sovereign audit checks, network validation, threat mitigation, and code refactoring as veteran corporate security analysts.'}
                            </p>
                        </div>

                        {/* Knowledge matrix badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40">
                                <p className="text-xl font-mono text-cyan-400 font-bold">754</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                    {language === 'ar' ? 'مهارة جاهزة للإنتاج' : 'Production-Ready Skills'}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40">
                                <p className="text-xl font-mono text-teal-400 font-bold">26</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                    {language === 'ar' ? 'مجالاً سيبرانياً مخصصاً' : 'Specialized Cyber Domains'}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/40">
                                <p className="text-xs text-purple-400 font-medium font-mono">MITRE ATT&amp;CK / NIST AI RMF</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                                    {language === 'ar' ? 'خريطة الأطر والامتثال' : 'Established Mappings'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visual Cybersecurity Skills Map Dashboard */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                                    Active Cybersecurity Skills Map (754 Integrated Capsules)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                                    Browse technical capability allocations across the 26 specialist domains. Select a domain card to filter the underlying telemetry list.
                                </p>
                            </div>
                            <span className="text-[11px] font-mono text-teal-600 bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 px-2.5 py-1 rounded-full">
                                Core Mapped Entities: {sampleCyberSkills.length} Checked
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                { name: "Cloud Security", count: 45, agent: "Mohammed AI", role: "CIO", color: "border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10 text-blue-600" },
                                { name: "Digital Forensics", count: 38, agent: "Ahmed AI", role: "CISO", color: "border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-600" },
                                { name: "Cryptography", count: 42, agent: "Mohammed AI", role: "CIO", color: "border-purple-500/20 bg-purple-50/20 dark:bg-purple-950/10 text-purple-600" },
                                { name: "Malware Analysis", count: 31, agent: "Ahmed AI", role: "CISO", color: "border-red-500/20 bg-red-50/20 dark:bg-red-950/10 text-red-600" },
                                { name: "DevSecOps & Secure SDLC", count: 36, agent: "Khalid AI", role: "Code Reviewer", color: "border-orange-500/20 bg-orange-50/20 dark:bg-orange-950/10 text-orange-600" },
                                { name: "GRC & Risk Management", count: 48, agent: "Rashid AI", role: "Risk Manager", color: "border-teal-500/20 bg-teal-50/20 dark:bg-teal-950/10 text-teal-600" },
                                { name: "Threat Hunting", count: 34, agent: "Ahmed AI", role: "CISO", color: "border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 text-amber-600" },
                                { name: "Network Security", count: 40, agent: "Fahad AI", role: "CTO", color: "border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-600" },
                                { name: "Incident Response", count: 44, agent: "Ahmed AI", role: "CISO", color: "border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600" },
                                { name: "Identity & Access Management (IAM)", count: 39, agent: "Ibrahim AI", role: "DOP", color: "border-cyan-500/20 bg-cyan-50/20 dark:bg-cyan-950/10 text-cyan-600" },
                                { name: "Penetration Testing", count: 35, agent: "Ahmed AI", role: "CISO", color: "border-fuchsia-500/20 bg-fuchsia-50/20 dark:bg-fuchsia-950/10 text-fuchsia-600" },
                                { name: "Data Protection & Privacy", count: 43, agent: "Hoda AI", role: "DPO", color: "border-pink-500/20 bg-pink-50/20 dark:bg-pink-950/10 text-pink-600" },
                                { name: "Application Security", count: 37, agent: "Khalid AI", role: "Code Reviewer", color: "border-violet-500/20 bg-violet-50/20 dark:bg-violet-950/10 text-violet-600" },
                                { name: "Vulnerability Management", count: 29, agent: "Ahmed AI", role: "CISO", color: "border-lime-500/20 bg-lime-50/20 dark:bg-lime-950/10 text-lime-600" },
                                { name: "Security Architecture", count: 33, agent: "Fahad AI", role: "CTO", color: "border-sky-500/20 bg-sky-50/20 dark:bg-sky-950/10 text-sky-600" },
                                { name: "OS Hardening & Linux Security", count: 28, agent: "Fahad AI", role: "CTO", color: "border-slate-500/20 bg-slate-50/20 dark:bg-slate-900/10 text-slate-600" },
                                { name: "AI Safety & NIST AI RMF", count: 41, agent: "Sultan AI", role: "NIST Consultant", color: "border-teal-500/20 bg-teal-50/20 dark:bg-teal-900/10 text-teal-600" },
                                { name: "Threat Intelligence", count: 30, agent: "Ahmed AI", role: "CISO", color: "border-emerald-500/20 bg-emerald-50/25 dark:bg-emerald-950/10 text-emerald-600" },
                                { name: "Audit & Compliance Tracking", count: 32, agent: "Abdullah AI", role: "Auditor", color: "border-yellow-500/20 bg-yellow-50/20 dark:bg-yellow-950/10 text-yellow-600" },
                                { name: "Infrastructure Sec Audit", count: 27, agent: "Fahad AI", role: "CTO", color: "border-blue-500/25 bg-blue-50/25 dark:bg-blue-950/10 text-blue-600" },
                                { name: "Continuous Security Monitoring", count: 31, agent: "Abdullah AI", role: "Auditor", color: "border-red-500/20 bg-red-50/20 dark:bg-red-950/10 text-red-600" },
                                { name: "Business Continuity (ISO 22301)", count: 46, agent: "Majed AI", role: "BCM Consultant", color: "border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-600" },
                                { name: "ISMS Governance (ISO 27001)", count: 47, agent: "Yousef AI", role: "ISO 27001 Consultant", color: "border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-600" },
                                { name: "NIST CSF Benchmarking", count: 39, agent: "Sultan AI", role: "NIST Consultant", color: "border-purple-500/20 bg-purple-50/20 dark:bg-purple-950/10 text-purple-600" },
                                { name: "Privacy Governance (PDPL)", count: 42, agent: "Hoda AI", role: "DPO", color: "border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600" },
                                { name: "Secure Code Review & Refactoring", count: 35, agent: "Khalid AI", role: "Code Reviewer", color: "border-green-500/20 bg-green-50/20 dark:bg-green-950/10 text-green-600" }
                            ].map((dom) => {
                                const active = selectedCyberDomain === dom.name;
                                return (
                                    <button
                                        key={dom.name}
                                        onClick={() => setSelectedCyberDomain(active ? 'All' : dom.name)}
                                        className={`p-3 text-left rounded-xl border transition-all h-24 flex flex-col justify-between ${dom.color} ${active ? 'ring-2 ring-teal-500 bg-teal-500/5 shadow-md border-teal-500/40' : 'hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                                    >
                                        <div className="w-full">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold tracking-tight text-slate-800 dark:text-slate-200 truncate pr-1" title={dom.name}>
                                                    {dom.name}
                                                </p>
                                                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                    {dom.count}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5">
                                                <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${Math.min(100, (dom.count / 48) * 100)}%` }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="text-[10px] text-slate-400 font-normal">Active Expert:</span>
                                            <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-500/10 px-1 shadow-sm rounded">
                                                {dom.agent} ({dom.role})
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filters controls */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search Input */}
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={language === 'ar' 
                                      ? 'ابحث في الـ ٧٥٤ مهارة طبقاً للمجال، العنوان، أو الأطر المرجعية...' 
                                      : 'Search 754 skills by title, description, code, or framework mappings...'}
                                    value={skillsSearch}
                                    onChange={(e) => setSkillsSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                            
                            {/* Domains Dropdown selector */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <select
                                    value={selectedCyberDomain}
                                    onChange={(e) => setSelectedCyberDomain(e.target.value)}
                                    className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full md:w-[240px]"
                                >
                                    <option value="All">{language === 'ar' ? 'جميع المجالات المتاحة' : 'All 26 Cybersecurity Domains'}</option>
                                    {CYBER_DOMAINS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Small shortcuts pills for popular domains */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            {['All', 'Cloud Security', 'AI Safety & NIST AI RMF', 'Data Protection & Privacy', 'Business Continuity (ISO 22301)', 'ISMS Governance (ISO 27001)'].map(domainShortcut => (
                                <button
                                    key={domainShortcut}
                                    onClick={() => setSelectedCyberDomain(domainShortcut)}
                                    className={`px-3 py-1 text-[11px] font-normal rounded-full transition-all ${selectedCyberDomain === domainShortcut ? 'bg-teal-500/10 text-teal-600 border border-teal-500/20 font-medium' : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {domainShortcut === 'All' ? (language === 'ar' ? 'عرض الكـل' : 'Show All') : domainShortcut}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Skills browser list */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredCyberSkills.map(skill => {
                            const ownerAgent = dynamicAgents.find(a => a.id === skill.agentOwnerId) || dynamicAgents[0];
                            const isBeingSimulated = simulatingSkillId === skill.id;

                            return (
                                <div 
                                    key={skill.id} 
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start flex-wrap gap-2">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2.5 py-1 rounded-md font-medium">
                                                {skill.domain}
                                            </span>
                                            
                                            <div className="flex gap-1.5 flex-wrap">
                                                {skill.targetFrameworks.map(fw => (
                                                    <span 
                                                        key={fw} 
                                                        className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-mono px-2 py-0.5 rounded border border-teal-500/20"
                                                    >
                                                        {fw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                                {skill.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                {skill.description}
                                            </p>
                                        </div>

                                        {/* Technical Action mapping */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                                                {language === 'ar' ? 'التوجيه البرمجي للوكيل / خطوات التحقق' : 'Agent Telemetry Action / Verification Procedure'}
                                            </p>
                                            <p className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {skill.technicalAction}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {ownerAgent.avatar ? (
                                                <span className="text-xl">{ownerAgent.avatar}</span>
                                            ) : (
                                                <div className="w-5 h-5 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center text-[10px] font-bold">A</div>
                                            )}
                                            <div className="text-left">
                                                <p className="text-[11px] font-medium text-slate-900 dark:text-white leading-none">{ownerAgent.name}</p>
                                                <p className="text-[9px] text-slate-400 tracking-tight mt-0.5">{ownerAgent.title}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSimulateSkill(skill)}
                                            className="px-3 py-1.5 bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-xs font-normal text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Bot className="w-3.5 h-3.5 text-teal-400" />
                                            <span>
                                                {isBeingSimulated ? (language === 'ar' ? 'جاري التشغيل...' : 'Executing...') : (language === 'ar' ? 'تشغيل المهارة سيادياً' : 'Dispatch Sovereign')}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Simulation Console Screen */}
                                    {isBeingSimulated && (
                                        <div className="col-span-full mt-3 p-4 bg-slate-950 rounded-xl border border-teal-500/30 font-mono text-[11px] text-teal-400 space-y-1.5 animate-fadeIn">
                                            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800 pb-1.5 mb-2">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                                                    <span>Autonomous Cognitive Dispatch Stream - {skill.id}</span>
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSimulatingSkillId(null);
                                                    }}
                                                    className="hover:text-red-400"
                                                >
                                                    [Close logs]
                                                </button>
                                            </div>
                                            <div className="max-h-[160px] overflow-y-auto space-y-1 scrollbar-thin">
                                                {simulationLogs.map((log, lIdx) => (
                                                    <div 
                                                        key={lIdx} 
                                                        className={`transition-all duration-300 ${log.startsWith('✔') ? 'text-emerald-400 font-bold' : log.startsWith('►') ? 'text-slate-400' : 'text-slate-300'}`}
                                                    >
                                                        {log}
                                                    </div>
                                                ))}
                                                <div className="h-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {filteredCyberSkills.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                                    {language === 'ar' ? 'لم يتم العثور على مهارات سيبرانية تطابق البحث' : 'No Skills Found'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {language === 'ar' ? 'يرجى مراجعة معيار البحث أو تحديد مجال آخر للفلترة.' : 'Try adjusting your search criteria or selecting a different knowledge domain filter.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
