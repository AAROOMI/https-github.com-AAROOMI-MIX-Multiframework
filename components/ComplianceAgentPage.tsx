
import React, { useState } from 'react';
import { AIService } from '../services/aiService';
import { AgentService, type OrchestratorDecision } from '../services/agentService';
import type { ComplianceGap, AgentLogEntry, Permission, AssessmentItem, EvidenceValidation } from '../types';
import { SparklesIcon, EyeIcon, CheckCircleIcon, CloseIcon, ShieldCheckIcon, ShieldAlertIcon, ActivityIcon, PlusCircleIcon } from './Icons';

interface ComplianceAgentPageProps {
    onRunAnalysis: () => ComplianceGap[];
    onGenerateDocuments: (gaps: ComplianceGap[]) => Promise<void>;
    agentLog: AgentLogEntry[];
    permissions: Set<Permission>;
    assessments?: {
        ecc: AssessmentItem[];
        pdpl: AssessmentItem[];
        sama: AssessmentItem[];
        cma: AssessmentItem[];
    };
}

export const ComplianceAgentPage: React.FC<ComplianceAgentPageProps> = ({ onRunAnalysis, onGenerateDocuments, agentLog, permissions, assessments }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'vision' | 'orchestrator' | 'performance' | 'solaceMesh'>('orchestrator');
    const [gaps, setGaps] = useState<ComplianceGap[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Solace Agent Mesh State
    const [solaceTopic, setSolaceTopic] = useState('solace/grc/vapt/vulnerability-found');
    const [solacePayload, setSolacePayload] = useState(JSON.stringify({ 
      severity: "CRITICAL", 
      component: "Core DB Server", 
      details: "SLA-084 unpatched symmetric key lifecycle vulnerability",
      remediationRequired: true
    }, null, 2));
    
    const [solaceLogs, setSolaceLogs] = useState<any[]>([
      { id: '1', timestamp: '01:40:12', topic: 'solace/grc/system/ingress', sender: 'Ingress Gate', message: 'Solace Event Broker initialized successfully & 9 GRC core agents auto-connected.', type: 'info' },
      { id: '2', timestamp: '01:40:15', topic: 'solace/grc/policy/draft', sender: 'Yousef AI', message: 'Published Annex A control policy outline under topic solace/grc/policy/draft.', type: 'publish' },
      { id: '3', timestamp: '01:40:16', topic: 'solace/grc/policy/draft', sender: 'Asaad AI', message: 'Matched subscriber: Asaad AI (sub: solace/grc/policy/>) - Audited PDPL mapping.', type: 'consume' }
    ]);
    const [isPublishingEvent, setIsPublishingEvent] = useState(false);
    const [isScenarioRunning, setIsScenarioRunning] = useState(false);
    const [activeScenarioStep, setActiveScenarioStep] = useState<number>(-1);
    const [activeScenarioName, setActiveScenarioName] = useState<string>('');
    const [showSourcedCode, setShowSourcedCode] = useState(false);

    // Orchestrator State
    const [orchestratorQuery, setOrchestratorQuery] = useState('');
    const [orchestratorResult, setOrchestratorResult] = useState<any>(null);
    const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(false);
    
    // Vision Audit State
    const [isVisionRunning, setIsVisionRunning] = useState(false);
    const [visionResults, setVisionResults] = useState<{item: AssessmentItem, result: EvidenceValidation}[]>([]);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEvidence, setTotalEvidence] = useState(0);

    // Performance Audit State
    const [isAuditRunning, setIsAuditRunning] = useState(false);
    const [auditProgress, setAuditProgress] = useState(0);

    const canRunAgent = permissions.has('complianceAgent:run');

    const handleRunAnalysis = () => {
        setIsAnalyzing(true);
        // Simulate a short delay for better UX
        setTimeout(() => {
            const foundGaps = onRunAnalysis();
            setGaps(foundGaps);
            setIsAnalyzing(false);
        }, 500);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        await onGenerateDocuments(gaps);
        setGaps([]); // Clear gaps after generation is initiated
        setIsGenerating(false);
    };

    const handleRunVisionAudit = async () => {
        // ... (existing vision logic)
    };

    const handleOrchestratorQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orchestratorQuery.trim()) return;

        setIsOrchestratorRunning(true);
        try {
            const result = await AgentService.conductMeeting(orchestratorQuery, {
                company: {}, // In a real scenario, pass company profile
                users: [],
                assessments: assessments || {},
                documents: []
            });
            setOrchestratorResult(result);
        } catch (error) {
            console.error("Orchestrator feedback failed:", error);
        } finally {
            setIsOrchestratorRunning(false);
        }
    };

    const getStatusColor = (status: AgentLogEntry['status']) => {
        switch(status) {
            case 'success': return 'text-green-500';
            case 'working': return 'text-blue-500';
            case 'error': return 'text-red-500';
            case 'info':
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">Compliance Agent</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Deploy specialized AI Agents for text analysis and visual evidence auditing.</p>
            </div>

            {/* Agent Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('orchestrator')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'orchestrator' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ShieldCheckIcon className="w-4 h-4" />
                        Team Orchestrator
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'text' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Gap Analysis Agent
                    </button>
                    <button
                        onClick={() => setActiveTab('vision')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'vision' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <EyeIcon className="w-4 h-4" />
                        Deep Vision Auditor
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'performance' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ActivityIcon className="w-4 h-4 text-teal-500" />
                        Agent Performance Report
                    </button>
                    <button
                        onClick={() => setActiveTab('solaceMesh')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'solaceMesh' ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        Solace Agent Mesh
                    </button>
                </nav>
            </div>
            
            {activeTab === 'orchestrator' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-4">Multi-Agent GRC Orchestrator</h2>
                        <form onSubmit={handleOrchestratorQuery} className="space-y-4">
                            <textarea
                                value={orchestratorQuery}
                                onChange={(e) => setOrchestratorQuery(e.target.value)}
                                placeholder="Example: Is this vendor compliant with Saudi PDPL based on our encryption tokens?"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                rows={2}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">Language: Automatic (Multi-lingual supported)</p>
                                <button
                                    type="submit"
                                    disabled={isOrchestratorRunning || !orchestratorQuery.trim()}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    {isOrchestratorRunning && (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    )}
                                    Activate GRC Team
                                </button>
                            </div>
                        </form>
                    </div>

                    {orchestratorResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Summary & Decision */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-teal-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100">Decision Outcome</h3>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-normal uppercase tracking-wider ${
                                                orchestratorResult.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                                                orchestratorResult.complianceStatus === 'non-compliant' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {orchestratorResult.complianceStatus}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-normal uppercase tracking-wider ${
                                                orchestratorResult.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                orchestratorResult.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                Risk: {orchestratorResult.riskLevel}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{orchestratorResult.summary}</p>
                                    
                                    <div className="mt-6">
                                        <h4 className="text-sm font-normal text-gray-500 uppercase flex items-center gap-2 mb-3">
                                            <ActivityIcon className="w-4 h-4" />
                                            Multi-Agent Reasoning Trace
                                        </h4>
                                        <div className="space-y-3">
                                            {orchestratorResult.agentTrace.map((node: any, i: number) => (
                                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-100 dark:border-gray-800">
                                                    <p className="text-xs font-normal text-teal-600 dark:text-teal-400 mb-1">{node.agentRole}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{node.reasoning}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NFAs */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <ShieldAlertIcon className="w-5 h-5 text-orange-500" />
                                        Next Follow-up Actions (NFA)
                                    </h3>
                                    <div className="space-y-4">
                                        {orchestratorResult.nfa.map((task: any, i: number) => (
                                            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/10 flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] uppercase font-normal px-1.5 py-0.5 rounded ${
                                                        task.priority === 'critical' ? 'bg-red-600 text-white' :
                                                        task.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{task.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200">{task.action}</p>
                                                <button className="mt-2 text-[10px] font-normal text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 uppercase tracking-tighter">
                                                    <PlusCircleIcon className="w-3 h-3" /> Assign To Expert
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'text' && (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">Automated Gap Analysis</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Scan all assessments for non-compliant controls that are missing documentation.</p>
                        </div>
                        {canRunAgent ? (
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing || isGenerating}
                                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? "Analyzing..." : "Analyze Assessments"}
                            </button>
                        ) : (
                            <p className="mt-4 sm:mt-0 text-sm text-gray-500">You don't have permission to run the agent.</p>
                        )}
                    </div>

                    {gaps.length > 0 && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-normal text-gray-800 dark:text-gray-200">Identified Gaps ({gaps.length})</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The following controls are not fully compliant and lack a corresponding policy document.</p>
                            
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {gaps.map(gap => (
                                        <li key={gap.controlCode} className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                                            <div>
                                                <p className="font-normal font-mono text-sm text-gray-800 dark:text-gray-200">{gap.controlCode} <span className="text-xs font-sans text-gray-500">({gap.framework})</span></p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{gap.controlName}</p>
                                            </div>
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{gap.assessedStatus.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {canRunAgent && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-normal rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating Documents...
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                                Generate All Missing Documents
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'vision' && (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                Deep Vision Auditor
                                <span className="text-xs font-normal bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-200">CNN Powered</span>
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                This agent uses Computer Vision to visually inspect uploaded evidence (screenshots, diagrams) and validate if they support the implemented control.
                            </p>
                        </div>
                        {canRunAgent && (
                            <button
                                onClick={handleRunVisionAudit}
                                disabled={isVisionRunning}
                                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isVisionRunning ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Scanning Evidence ({processedCount}/{totalEvidence})...
                                    </>
                                ) : (
                                    "Run CNN Validation Protocol"
                                )}
                            </button>
                        )}
                    </div>

                    {isVisionRunning && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
                            <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(processedCount / totalEvidence) * 100}%` }}></div>
                        </div>
                    )}

                    {visionResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visionResults.map(({ item, result }, idx) => (
                                <div key={idx} className={`flex gap-4 p-4 rounded-lg border-l-4 shadow-sm bg-gray-50 dark:bg-gray-900/50 ${result.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex-shrink-0">
                                        {/* Thumbnail of evidence */}
                                        <img src={item.evidence?.dataUrl} alt="Evidence" className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-normal text-gray-800 dark:text-gray-200 font-mono">{item.controlCode}</h4>
                                            <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${result.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {result.isValid ? 'VALIDATED' : 'REJECTED'} ({result.confidence}%)
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.controlName}</p>
                                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                                <span className="font-normal text-purple-600 dark:text-purple-400">AI Reasoning:</span> {result.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !isVisionRunning && <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded border border-dashed border-gray-300 dark:border-gray-700">
                            <EyeIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No visual audit results yet. Upload evidence in assessment controls and click "Run CNN Validation Protocol".</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-teal-900 to-slate-905 text-white rounded-2xl p-6 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30 uppercase tracking-widest px-2.5 py-1 rounded">
                                    Auditor General Boardroom Ledger
                                </span>
                            </div>
                            <h2 className="text-xl font-normal tracking-tight pt-1">Agentic Audit Contribution &amp; Performance Ledger</h2>
                            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                                This dashboard aggregates, assesses, and grades the sovereign actions taken by our Virtual GRC specialists during the latest NCA ECC &amp; SAMA CSF compliance cycles, matching each contribution directly to its corresponding, established technical skill within the Anthropic 754 cybersecurity repository.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsAuditRunning(true);
                                setAuditProgress(10);
                                const interval = setInterval(() => {
                                    setAuditProgress(prev => {
                                        if (prev >= 100) {
                                            clearInterval(interval);
                                            setIsAuditRunning(false);
                                            return 100;
                                        }
                                        return prev + 15;
                                    });
                                }, 300);
                            }}
                            disabled={isAuditRunning}
                            className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-normal px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 flex-shrink-0"
                        >
                            {isAuditRunning ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Running Boardroom Integrity Analysis ({auditProgress}%)</span>
                                </>
                            ) : (
                                <>
                                    <ActivityIcon className="w-4 h-4 text-teal-300" />
                                    <span>Audit Consensus Dry-Run</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Progress Bar of Simulation */}
                    {isAuditRunning && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${auditProgress}%` }} />
                        </div>
                    )}

                    {/* Contribution matrix grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* CISO Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Ahmed AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Ahmed AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">CISO (Chief Information Security Officer)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Governed threat models, structured response timelines, orchestrated corporate audit strategies, and approved the final consensus framework registry.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-012] Endpoint Isolation</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-302] Threat Hunting Response</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTO Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Fahad AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Fahad AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">CTO (Chief Technology Officer)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Enforced network security controls, specified load balancers, configured secure reverse proxy gating, and streamlined certificate parameters.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-084] Symmetric Key Lifecycle</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-109] Reverse Proxy Gateways</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CIO Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Mohammed AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Mohammed AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">CIO (Chief Information Officer)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Managed corporate asset classifications, verified cloud database storage configurations, and aligned technical encryption controls.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-041] Database Cryptography</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-055] Multi-cloud Sec Auditing</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DPO Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Hoda AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Hoda AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">DPO (Data Protection Officer)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Enforced Saudi Personal Data Protection Law (PDPL), verified consent tracking metrics, and audited compliance mappings.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-162] PDPL Privacy Registry</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-203] Consent Verification</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ISO Specialist Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Yousef AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Yousef AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">ISO 27001 / ISMS Specialist</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Author of ISMS manual, governed Statement of Applicability (SoA) and performed Annex A control cross-checks.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-402] SOA Annex A Audit</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-415] Annex A Asset Audit</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NIST Specialist Profile */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Sultan AI" className="w-10 h-10 rounded-full object-cover border border-teal-500 shadow" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Sultan AI</h4>
                                        <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">NIST Framework / AI Safety Specialist</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                    Evaluated model hallucinations, deployed adversarial alignments, and implemented safety checkpoints under NIST AI RMF.
                                </p>
                            </div>
                            <div className="space-y-2 border-t border-slate-105 dark:border-gray-700/60 pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sovereign Skills Deployed:</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-702] NIST AI RMF Alignment</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                        <span className="font-mono text-teal-600 dark:text-teal-300 font-semibold text-[10px]">[CS-711] Model Drifting Guard</span>
                                        <span className="text-[10px] text-green-500 font-bold uppercase">Pass</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'solaceMesh' && (
                <div className="space-y-6 animate-fade-in text-gray-800 dark:text-gray-100">
                    <div className="bg-gradient-to-r from-teal-900 to-slate-905 text-white rounded-2xl p-6 border border-teal-500/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 uppercase tracking-widest px-2.5 py-1 rounded">
                                        SOLACE SYSTEM INTEGRATION
                                    </span>
                                </div>
                                <h2 className="text-xl font-normal tracking-tight pt-1">Event-Driven GRC Multi-Agent Mesh Broker</h2>
                                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                                    Autonomous GRC agents communicate asynchronously using pub/sub events via topics routed through our real-time simulated <strong>Solace Event Broker</strong>. This architectural model overrides static orchestration with fully dynamic, event-driven multi-step choreographies.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSourcedCode(!showSourcedCode)}
                                className="bg-slate-850 hover:bg-slate-800 text-teal-300 border border-teal-500/20 text-xs font-normal px-4.5 py-2.5 rounded-xl transition-all font-mono"
                            >
                                {showSourcedCode ? 'Hide Embedded SDK Code' : 'Inspect Solace SDK Client'}
                            </button>
                        </div>

                        {showSourcedCode && (
                            <div className="mt-4 p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-lg border border-teal-500/20 max-h-80 overflow-y-auto leading-relaxed">
                                <p className="text-teal-400 font-semibold mb-2">// Embedded Solace-Agent-Mesh Client Class - Integrated in all GRC AI Agents</p>
                                <pre>{`class SolaceAgentGateway {
    private solaceBrokerUrl = "smf://solace.platform.internal:55443";
    
    constructor(
        private agentId: string, 
        private agentRole: string,
        private subscriptions: string[] = []
    ) {
        this.initializeClient();
    }

    private initializeClient() {
        console.log(\`[Solace Native SDK] Agent \${this.agentId} connected to \${this.solaceBrokerUrl}\`);
        this.subscriptions.forEach(topic => this.subscribe(topic));
    }

    /**
     * Publish function: Emits a GRC event into the message broker
     */
    public async publish(topic: string, payload: any, correlationId?: string): Promise<void> {
        const message = {
            messageId: "msg-" + Math.random().toString(36).substr(2, 9),
            correlationId: correlationId || null,
            sender: this.agentId,
            timestamp: Date.now(),
            topic: topic,
            payload: payload
        };
        // Simulated Event Broker Ingress Gating
        solaceEventBus.routeEvent(topic, message);
    }

    /**
     * Subscribe function: Binds subscription wildcard filter on the broker queue
     */
    public subscribe(topicPattern: string): void {
        console.log(\`[Solace DB Bind] Agent \${this.agentId} registered subscription queue matching: \${topicPattern}\`);
        solaceEventBus.registerQueue(this.agentId, topicPattern, this.onMessage.bind(this));
    }

    /**
     * Autonomous Callback Triggered upon Topic Match
     */
    public async onMessage(topic: string, eventPayload: any): Promise<void> {
        console.log(\`[Solace Consumer] Agent \${this.agentId} [Role: \${this.agentRole}] received event on topic: \${topic}\`);
        // Match specific cybersecurity sovereign cognitive capsule capabilities to perform reasoning
        await this.handleAutonomousReasoning(topic, eventPayload);
    }
}`}</pre>
                            </div>
                        )}
                    </div>

                    {/* Active subscribers and status panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        
                        {/* Subscriptions Registry List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 lg:col-span-1 space-y-4 shadow-sm">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center justify-between">
                                <span>Agent Subscriptions</span>
                                <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-[9px] px-2 py-0.5 rounded">
                                    9 Clients
                                </span>
                            </h3>

                            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {Object.entries({
                                    'Ahmed AI': { role: 'CISO', status: 'Online', subs: ['solace/grc/vapt/>', 'solace/grc/alert/>', 'solace/grc/consensus/decide'] },
                                    'Fahad AI': { role: 'CTO', status: 'Online', subs: ['solace/grc/vapt/>', 'solace/grc/infrastructure/vulnerability'] },
                                    'Mohammed AI': { role: 'CIO', status: 'Online', subs: ['solace/grc/infrastructure/>', 'solace/grc/policy/draft'] },
                                    'Hoda AI': { role: 'DPO', status: 'Online', subs: ['solace/grc/pdpl/>', 'solace/grc/privacy/>'] },
                                    'Majed AI': { role: 'BCM', status: 'Online', subs: ['solace/grc/continuity/>', 'solace/grc/bcm/incident'] },
                                    'Asaad AI': { role: 'Compliance', status: 'Online', subs: ['solace/grc/regulatory/>', 'solace/grc/compliance/gap'] },
                                    'Abdullah AI': { role: 'Auditor', status: 'Online', subs: ['solace/grc/audit/>', 'solace/grc/evidence/uploaded'] },
                                    'Khalid AI': { role: 'Code Reviewer', status: 'Idle', subs: ['solace/grc/vapt/code'] },
                                    'Sultan AI': { role: 'NIST Expert', status: 'Online', subs: ['solace/grc/nist/>'] }
                                }).map(([name, data]) => (
                                    <div key={name} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{name}</p>
                                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">{data.role}</p>
                                            </div>
                                            <span className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${data.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                <span className="text-[9px] text-gray-400 uppercase font-mono">{data.status}</span>
                                            </span>
                                        </div>
                                        <div className="space-y-0.5 border-t border-gray-200/50 dark:border-gray-700/50 pt-1.5">
                                            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Topic Subscriptions:</p>
                                            {data.subs.map(sub => (
                                                <div key={sub} className="text-[9px] font-mono text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 px-1 py-0.5 rounded truncate border border-gray-100 dark:border-gray-800">
                                                    {sub}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Main Broker Panel */}
                        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
                            
                            {/* Orchestrated Simulation Scenarios */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Asynchronous Event-Storm Triggers
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Trigger real-time scenarios showing multi-step event propagation. Matches are evaluated instantly against Solace routing standards.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 rounded-xl cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                                         onClick={() => {
                                            if (isScenarioRunning) return;
                                            setIsScenarioRunning(true);
                                            setActiveScenarioName('Scenario 1: Critical Ransomware Incident');
                                            
                                            const newLogs = [...solaceLogs];
                                            const timestamp = () => new Date().toLocaleTimeString();
                                            
                                            // Step 1
                                            newLogs.push({ id: Date.now() + '1', timestamp: timestamp(), topic: 'solace/grc/vapt/vulnerability-found', sender: 'Bandar AI (CSO)', message: '⚠️ Live attack reported: Rogue service injecting unpatched TLS keys.', type: 'publish' });
                                            setSolaceLogs([...newLogs]);
                                            
                                            // Step 2
                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '2', timestamp: timestamp(), topic: 'solace/grc/vapt/vulnerability-found', sender: 'Fahad AI (CTO)', message: '✅ Matched subscription "solace/grc/vapt/>". Isolating database subnets immediately & publishing solace/grc/vapt/isolate-remediation.', type: 'consume' });
                                                setSolaceLogs([...newLogs]);
                                            }, 1200);

                                            // Step 3
                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '3', timestamp: timestamp(), topic: 'solace/grc/vapt/vulnerability-found', sender: 'Ahmed AI (CISO)', message: '🚨 Incident logged under tracker #INC-2026. Elevating hazard level to CRITICAL. Emitting event solace/grc/alert/critical.', type: 'publish' });
                                                setSolaceLogs([...newLogs]);
                                            }, 2400);

                                            // Step 4
                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '4', timestamp: timestamp(), topic: 'solace/grc/alert/critical', sender: 'Majed AI (BCM)', message: '🔄 Matched subscription "solace/grc/continuity/>". Activating BCM Disaster DR runbook plans, notifying CEO [Sovereign Skill CS-123 mapped].', type: 'consume' });
                                                newLogs.push({ id: Date.now() + '5', timestamp: timestamp(), topic: 'solace/grc/system/ingress', sender: 'Solace Broker', message: '🎉 Scenario 1 completed. 5 GRC events successfully routed asynchronously.', type: 'info' });
                                                setSolaceLogs([...newLogs]);
                                                setIsScenarioRunning(false);
                                            }, 3600);
                                         }}
                                    >
                                        <div>
                                            <h4 className="font-semibold text-xs text-emerald-800 dark:text-emerald-400">1. Ransomware Threat Mitigation Loop</h4>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">
                                                Bandar AI discovers a vulnerability &rarr; Fahad isolated &rarr; Ahmed upgrades &rarr; Majed activates Business Continuity runbook.
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-normal uppercase tracking-tight mt-2 flex items-center gap-1">
                                            ⚡ Trigger Incident Loop
                                        </span>
                                    </div>

                                    <div className="p-4 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 rounded-xl cursor-pointer transition-all space-y-2 flex flex-col justify-between"
                                         onClick={() => {
                                            if (isScenarioRunning) return;
                                            setIsScenarioRunning(true);
                                            setActiveScenarioName('Scenario 2: PDPL Compliance Auditing');
                                            
                                            const newLogs = [...solaceLogs];
                                            const timestamp = () => new Date().toLocaleTimeString();
                                            
                                            newLogs.push({ id: Date.now() + '1', timestamp: timestamp(), topic: 'solace/grc/privacy/dsar-received', sender: 'System Ingress', message: '📥 Data Subject Access Request (DSAR) received for user encryption tokens.', type: 'publish' });
                                            setSolaceLogs([...newLogs]);
                                            
                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '2', timestamp: timestamp(), topic: 'solace/grc/privacy/dsar-received', sender: 'Hoda AI (DPO)', message: '✅ Matched subscription "solace/grc/privacy/>". Running personal data classification checklist and publishing solace/grc/pdpl/masking-required.', type: 'consume' });
                                                setSolaceLogs([...newLogs]);
                                            }, 1200);

                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '3', timestamp: timestamp(), topic: 'solace/grc/pdpl/masking-required', sender: 'Mohammed AI (CIO)', message: '⚡ Enforcing DB pseudonymization metrics on Core Storage. Masking active, publishing solace/grc/infrastructure/completed.', type: 'publish' });
                                                setSolaceLogs([...newLogs]);
                                            }, 2400);

                                            setTimeout(() => {
                                                newLogs.push({ id: Date.now() + '4', timestamp: timestamp(), topic: 'solace/grc/infrastructure/completed', sender: 'Asaad AI (Compliance)', message: '⚖️ Matched compliance scope. Logging control confirmation of PDPL audit records to ledger.', type: 'consume' });
                                                newLogs.push({ id: Date.now() + '5', timestamp: timestamp(), topic: 'solace/grc/system/ingress', sender: 'Solace Broker', message: '🎉 Scenario 2 completed. 4 GRC events successfully processed.', type: 'info' });
                                                setSolaceLogs([...newLogs]);
                                                setIsScenarioRunning(false);
                                            }, 3600);
                                         }}
                                    >
                                        <div>
                                            <h4 className="font-semibold text-xs text-purple-800 dark:text-purple-400">2. Saudi PDPL Data Privacy Process</h4>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-1">
                                                Ingress fires DSAR request &rarr; Hoda DPO initiates data scan &rarr; Mohammed masks token &rarr; Asaad archives evidence log.
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-normal uppercase tracking-tight mt-2 flex items-center gap-1">
                                            ⚡ Trigger PDPL Loop
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Event publisher */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    Interactive Custom Event Publisher
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1 space-y-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Publish Topic String</label>
                                            <input
                                                type="text"
                                                value={solaceTopic}
                                                onChange={(e) => setSolaceTopic(e.target.value)}
                                                className="mt-1 w-full text-xs p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-400 italic">
                                                Try topics e.g. <code>solace/grc/vapt/leak</code>, <code>solace/grc/privacy/alert</code> to test wildcards matching like <code>&gt;</code> and <code>*</code>
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const timestampList = () => new Date().toLocaleTimeString();
                                                const matchSolaceWildcard = (subscription: string, published: string): boolean => {
                                                    const subParts = subscription.split('/');
                                                    const pubParts = published.split('/');
                                                    for (let i = 0; i < subParts.length; i++) {
                                                        const subPart = subParts[i];
                                                        if (subPart === '>') return true;
                                                        if (subPart === '*') {
                                                            if (i >= pubParts.length) return false;
                                                            continue;
                                                        }
                                                        if (pubParts[i] !== subPart) return false;
                                                    }
                                                    return subParts.length === pubParts.length;
                                                };

                                                const subscribersMap: Record<string, string[]> = {
                                                    'Ahmed AI (CISO)': ['solace/grc/vapt/>', 'solace/grc/alert/>', 'solace/grc/consensus/decide'],
                                                    'Fahad AI (CTO)': ['solace/grc/vapt/>', 'solace/grc/infrastructure/vulnerability'],
                                                    'Mohammed AI (CIO)': ['solace/grc/infrastructure/>', 'solace/grc/policy/draft'],
                                                    'Hoda AI (DPO)': ['solace/grc/pdpl/>', 'solace/grc/privacy/>'],
                                                    'Majed AI (BCM)': ['solace/grc/continuity/>', 'solace/grc/bcm/incident'],
                                                    'Asaad AI (Compliance)': ['solace/grc/regulatory/>', 'solace/grc/compliance/gap'],
                                                    'Abdullah AI (Auditor)': ['solace/grc/audit/>', 'solace/grc/evidence/uploaded'],
                                                    'Khalid AI (Code Reviewer)': ['solace/grc/vapt/code'],
                                                    'Sultan AI (NIST Expert)': ['solace/grc/nist/>']
                                                };

                                                const matchedAgents: string[] = [];
                                                Object.entries(subscribersMap).forEach(([agent, subs]) => {
                                                    const hasMatch = subs.some(sub => matchSolaceWildcard(sub, solaceTopic));
                                                    if (hasMatch) matchedAgents.push(agent);
                                                });

                                                const messageId = 'msg-' + Math.random().toString(36).substr(2, 5);
                                                const publishLog = {
                                                    id: Date.now().toString(),
                                                    timestamp: timestampList(),
                                                    topic: solaceTopic,
                                                    sender: 'System Publisher',
                                                    message: `📤 Published custom event [Id: ${messageId}] to Solace message broker!`,
                                                    type: 'publish'
                                                };

                                                const nextLogs = [...solaceLogs, publishLog];

                                                if (matchedAgents.length === 0) {
                                                    nextLogs.push({
                                                        id: Date.now().toString() + 'no',
                                                        timestamp: timestampList(),
                                                        topic: solaceTopic,
                                                        sender: 'Solace Broker',
                                                        message: '⚠️ Message published but has no matching subscribers. Unmatched topic message dropped.',
                                                        type: 'info'
                                                    });
                                                } else {
                                                    matchedAgents.forEach((agent, i) => {
                                                        const agentQuotes: Record<string, string> = {
                                                            'Ahmed AI (CISO)': 'Evaluating core security metrics relative to risk score metrics.',
                                                            'Fahad AI (CTO)': 'Updating isolated host assets, inspecting certificate parameters.',
                                                            'Mohammed AI (CIO)': 'Auditing database storage tokenization alignments.',
                                                            'Hoda AI (DPO)': 'Executing PDPL audit impact assessments to verify data storage.',
                                                            'Majed AI (BCM)': 'Mapping metrics directly to ISO 22301 standard limits.',
                                                            'Asaad AI (Compliance)': 'Verifying regulatory compliance thresholds.',
                                                            'Abdullah AI (Auditor)': 'Validating quantitative ledger hashes and proof checks.',
                                                            'Khalid AI (Code Reviewer)': 'Analyzing security vulnerabilities in repository pipeline code.',
                                                            'Sultan AI (NIST Expert)': 'Checking NIST SP 800-53 threat vectors.'
                                                        };
                                                        const phrase = agentQuotes[agent] || 'Initiating autonomous action loop.';
                                                        nextLogs.push({
                                                            id: Date.now().toString() + 'match' + i,
                                                            timestamp: timestampList(),
                                                            topic: solaceTopic,
                                                            sender: agent,
                                                            message: `✅ Subscription Matched! Executing: "${phrase}"`,
                                                            type: 'consume'
                                                        });
                                                    });
                                                }

                                                setSolaceLogs(nextLogs);
                                            }}
                                            className="w-full text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded font-normal text-xs transition-all uppercase tracking-tight"
                                        >
                                            Publish Live Event
                                        </button>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Payload Document Body (JSON)</label>
                                        <textarea
                                            value={solacePayload}
                                            onChange={(e) => setSolacePayload(e.target.value)}
                                            rows={5}
                                            className="mt-1 w-full text-xs p-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Live Terminal outputs */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                        <span>Solace Live Message Broker Console</span>
                                    </h3>
                                    <button
                                        onClick={() => setSolaceLogs([])}
                                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-white underline"
                                    >
                                        Clear Broker Output Log
                                    </button>
                                </div>

                                <div className="bg-gray-950 dark:bg-slate-900 text-slate-100 font-mono text-[11px] p-4 rounded-lg overflow-y-auto max-h-60 flex-1 space-y-2.5 leading-relaxed shadow-inner border border-slate-900">
                                    {solaceLogs.length > 0 ? (
                                        solaceLogs.map((log) => (
                                            <div key={log.id} className="flex gap-2">
                                                <span className="text-gray-600 text-[10px] select-none flex-shrink-0">{log.timestamp}</span>
                                                <div className="min-w-0">
                                                    <span className={`text-[10px] font-bold uppercase ${
                                                        log.type === 'publish' ? 'text-amber-500' :
                                                        log.type === 'consume' ? 'text-teal-400' : 'text-cyan-400'
                                                    } mr-2`}>
                                                        [{log.sender}]
                                                    </span>
                                                    <span className="text-gray-500 text-[10px] mr-2">Topic: {log.topic}</span>
                                                    <p className="mt-0.5 text-slate-200 whitespace-pre-wrap">{log.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No events published. Use scenarions or publish a custom topic message to spin up the broker.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Shared Log */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                 <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">Agent Activity Log</h2>
                 <div className="mt-4 max-h-80 overflow-y-auto bg-gray-900 text-white font-mono text-sm p-4 rounded-md">
                    {agentLog.length > 0 ? (
                        agentLog.map(log => (
                            <p key={log.id}>
                                <span className="text-gray-500 mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`${getStatusColor(log.status)}`}>{log.message}</span>
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-500">No agent activity yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};
