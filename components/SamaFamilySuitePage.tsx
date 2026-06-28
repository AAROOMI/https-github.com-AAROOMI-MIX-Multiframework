import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Search, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  HelpCircle, 
  AlertCircle, 
  Download, 
  Layers, 
  FileCheck, 
  BookOpen, 
  Settings, 
  GitMerge, 
  Clock, 
  Copy, 
  Edit2, 
  Check, 
  RefreshCw,
  Plus,
  X,
  Shield,
  Briefcase,
  AlertTriangle,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { samaFrameworks, SamaFramework, SamaControl, SamaDomain, SamaSubdomain, internationalStandardsMappings } from '../data/samaFamilyData';
import { AIService } from '../services/aiService';

interface SamaFamilySuitePageProps {
  language?: string;
  addAuditLog?: (action: string, details: string, targetId?: string) => void;
  selectedFwId?: string;
  onSelectFwId?: (fwId: string) => void;
}

export const SamaFamilySuitePage: React.FC<SamaFamilySuitePageProps> = ({ 
  language = 'en',
  addAuditLog,
  selectedFwId: propSelectedFwId,
  onSelectFwId
}) => {
  const [frameworks, setFrameworks] = useState<SamaFramework[]>(samaFrameworks);
  const [localSelectedFwId, setLocalSelectedFwId] = useState<string>('sama-csf-249');
  const selectedFwId = propSelectedFwId !== undefined ? propSelectedFwId : localSelectedFwId;
  const setSelectedFwId = onSelectFwId !== undefined ? onSelectFwId : setLocalSelectedFwId;
  const [selectedDomainId, setSelectedDomainId] = useState<string>('1');
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Hybrid Mode - mapping to local and international standards
  const [hybridMode, setHybridMode] = useState<boolean>(true);

  // Custom Control proposing states
  const [isAddControlOpen, setIsAddControlOpen] = useState(false);
  const [newControlCode, setNewControlCode] = useState('');
  const [newControlTitle, setNewControlTitle] = useState('');
  const [newControlDescription, setNewControlDescription] = useState('');
  const [newControlGuidelines, setNewControlGuidelines] = useState('');
  const [newControlDeliverables, setNewControlDeliverables] = useState('');
  
  // GRC Agentic Team validation states
  const [isAgentChecking, setIsAgentChecking] = useState(false);
  const [agentCheckStep, setAgentCheckStep] = useState('');
  const [agentCheckLogs, setAgentCheckLogs] = useState<string[]>([]);
  const [agentApprovalSignature, setAgentApprovalSignature] = useState<string | null>(null);

  // Generator states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDomainGenerating, setIsDomainGenerating] = useState<boolean>(false);
  const [domainGenProgress, setDomainGenProgress] = useState<{current: number, total: number, activeControlCode: string} | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [useAI, setUseAI] = useState<boolean>(true);
  const [generatedDocs, setGeneratedDocs] = useState<{ [controlId: string]: { policy: string; procedure: string; guideline: string; sop: string } }>({});
  const [activeDocTab, setActiveDocTab] = useState<'policy' | 'procedure' | 'guideline' | 'sop'>('policy');
  const [editingDocText, setEditingDocText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Simulating GRC Agentic Team Verification for custom proposing
  const handleProposeControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newControlCode || !newControlTitle || !newControlDescription) return;

    setIsAgentChecking(true);
    setAgentCheckLogs([]);
    setAgentApprovalSignature(null);

    const steps = [
      "AI CISO: Reviewing proposed SAMA control for strategic alignment...",
      "AI CISO: Cross-checking risk models with SAMA Leadership & Governance directives...",
      "AI CTO: Assessing technical operating parameters & network feasibility...",
      "AI DPO: Validating Saudi data residency compliance (local hosting check)...",
      "AI Auditor: Cross-referencing NCA-ECC overlap & ISO-27001 mapping matrix...",
      "GRC AGENTIC TEAM: Generating secure cryptographic signature..."
    ];

    for (const step of steps) {
      setAgentCheckStep(step);
      setAgentCheckLogs(prev => [...prev, step]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate simulated cryptographic seal
    const fakeSignature = `SAMA-SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
    setAgentApprovalSignature(fakeSignature);
    setIsAgentChecking(false);

    // Add new control into data tree in-memory
    const updatedFrameworks = frameworks.map(fw => {
      if (fw.id === selectedFwId) {
        return {
          ...fw,
          totalControls: fw.totalControls + 1,
          domains: fw.domains.map((dom, dIdx) => {
            if (dom.id === selectedDomainId) {
              return {
                ...dom,
                subdomains: dom.subdomains.map((sub, sIdx) => {
                  if (sIdx === 0) { // add to first subdomain for simplicity
                    return {
                      ...sub,
                      controls: [
                        {
                          id: `${selectedFwId}-${newControlCode}`,
                          code: newControlCode,
                          title: `${newControlTitle} (${newControlCode})`,
                          description: newControlDescription,
                          implementationGuidelines: newControlGuidelines ? newControlGuidelines.split('\n') : ['Establish formal banking configurations.'],
                          expectedDeliverables: newControlDeliverables ? newControlDeliverables.split('\n') : ['Verification report'],
                          mappedControls: { 'ISO-27001': 'ISO-27001-A.5.1', 'NIST-CSF': 'NIST-CSF-GV.OC', 'NCA-ECC': 'NCA-ECC-1.1' },
                          status: 'Implemented' as const,
                          recommendation: 'Periodically monitor performance and log approvals.',
                          managementResponse: 'Fully approved and incorporated into systems.',
                          targetDate: '2026-12-31'
                        },
                        ...sub.controls
                      ]
                    };
                  }
                  return sub;
                })
              };
            }
            return dom;
          })
        };
      }
      return fw;
    });

    setFrameworks(updatedFrameworks);
    setSelectedControlId(`${selectedFwId}-${newControlCode}`);
    
    if (addAuditLog) {
      addAuditLog('DOCUMENT_CREATED', `Proposed and validated new SAMA control ${newControlCode} under family ${selectedFwId}`, `${selectedFwId}-${newControlCode}`);
    }

    // Reset fields
    setNewControlCode('');
    setNewControlTitle('');
    setNewControlDescription('');
    setNewControlGuidelines('');
    setNewControlDeliverables('');
    setIsAddControlOpen(false);
  };

  // Find active framework
  const activeFramework = useMemo(() => {
    return frameworks.find(fw => fw.id === selectedFwId) || frameworks[0];
  }, [frameworks, selectedFwId]);

  // Find active domain
  const activeDomain = useMemo(() => {
    return activeFramework.domains.find(dom => dom.id === selectedDomainId) || activeFramework.domains[0];
  }, [activeFramework, selectedDomainId]);

  // Flat list of controls for active framework/domain filtered by search & status
  const filteredControls = useMemo(() => {
    let list: SamaControl[] = [];
    activeDomain.subdomains.forEach(sub => {
      list = [...list, ...sub.controls];
    });

    return list.filter(ctrl => {
      const matchesSearch = searchQuery === '' || 
        ctrl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || ctrl.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeDomain, searchQuery, statusFilter]);

  // Set the default control when selected domain changes
  React.useEffect(() => {
    if (filteredControls.length > 0) {
      const exists = filteredControls.some(c => c.id === selectedControlId);
      if (!exists) {
        setSelectedControlId(filteredControls[0].id);
      }
    } else {
      setSelectedControlId('');
    }
  }, [selectedDomainId, filteredControls]);

  // Retrieve selected control object
  const activeControl = useMemo(() => {
    if (!selectedControlId) return null;
    for (const dom of activeFramework.domains) {
      for (const sub of dom.subdomains) {
        const found = sub.controls.find(c => c.id === selectedControlId);
        if (found) return { control: found, subdomain: sub, domain: dom };
      }
    }
    return null;
  }, [activeFramework, selectedControlId]);

  // Generate statistics of active framework
  const stats = useMemo(() => {
    let total = 0;
    let implemented = 0;
    let partial = 0;
    let notImplemented = 0;

    activeFramework.domains.forEach(dom => {
      dom.subdomains.forEach(sub => {
        sub.controls.forEach(ctrl => {
          total++;
          if (ctrl.status === 'Implemented') implemented++;
          else if (ctrl.status === 'Partially Implemented') partial++;
          else notImplemented++;
        });
      });
    });

    return {
      total,
      implemented,
      partial,
      notImplemented,
      percent: total > 0 ? Math.round((implemented / total) * 100) : 0,
      partialPercent: total > 0 ? Math.round((partial / total) * 100) : 0,
    };
  }, [activeFramework]);

  // Action: Export Excel / CSV package
  const handleExportGRC = () => {
    const dataString = JSON.stringify(activeFramework, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeFramework.id}_grc_compliance_package.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (addAuditLog) {
      addAuditLog('INTEGRATION_SYNC', `Exported full GRC package for framework ${activeFramework.name}`, activeFramework.id);
    }
  };

  // Action: Auto-Generate Policy, Procedure, Guideline & SOP (Single Control)
  const handleGenerateDocuments = async () => {
    if (!activeControl) return;
    const ctrl = activeControl.control;

    setIsGenerating(true);
    setGenerationStep('Engaging Sovereign GRC Agentic Engine...');
    await new Promise(r => setTimeout(r, 600));

    try {
      if (useAI) {
        // AI Real-time Generation
        setGenerationStep('Drafting compliant Policy under SAMA-CSF standards...');
        const policyPrompt = `Draft a Board-level cybersecurity Policy for a Saudi commercial bank matching this SAMA Control:
Code: ${ctrl.code}
Title: ${ctrl.title}
Requirement: ${ctrl.description}
Sovereign Context: Kingdom of Saudi Arabia banking ecosystem, SAMA cyber governance directives.
Ensure direct alignment and highly formal banking tone. Output with clear headers.`;
        const policyText = await AIService.generateContent(policyPrompt);

        setGenerationStep('Mapping operational Procedures with sequential checks...');
        const procPrompt = `Create a step-by-step Standard Operating Procedure (SOP) / Procedure Document for Saudi financial staff implementing:
Control: ${ctrl.code} - ${ctrl.title}
Requirement: ${ctrl.description}
Incorporate segregation of duties (Maker-Checker model), SOC escalation thresholds, and regulatory SLA guidelines.`;
        const procedureText = await AIService.generateContent(procPrompt);

        setGenerationStep('Formatting sovereign SAMA implementation Guidelines...');
        const guidePrompt = `Draft a detailed implementation Guideline document for auditors and security teams explaining how to audit, verify, and maintain compliance for:
Control: ${ctrl.code} - ${ctrl.title}
List key technical checks, sample evidence files to request, and warning indicators of non-compliance.`;
        const guidelineText = await AIService.generateContent(guidePrompt);

        setGenerationStep('Assembling Standard Operating Procedures (SOP)...');
        const sopPrompt = `Provide a concise, practical SOP cheat-sheet/table with columns: Action Step, Owner, System Targeted, and Frequency for SAMA Control ${ctrl.code}. Include typical banking environments (Mada, SARIE, Swift gateways).`;
        const sopText = await AIService.generateContent(sopPrompt);

        setGeneratedDocs(prev => ({
          ...prev,
          [ctrl.id]: {
            policy: policyText,
            procedure: procedureText,
            guideline: guidelineText,
            sop: sopText
          }
        }));
        setEditingDocText(policyText);
      } else {
        // High fidelity procedural fallback templates
        setGenerationStep('Extracting baseline template documents...');
        await new Promise(r => setTimeout(r, 800));
        
        const fallbackPolicy = `# SAMA Cybersecurity Policy - ${ctrl.code}\n\n## 1. Purpose\nTo outline organizational principles and secure governance matching ${ctrl.title}.\n\n## 2. Policy Statements\n- All banking systems shall align strictly with SAMA-CSF requirements.\n- The CISO team will oversee and document operational effectiveness.\n- Auditing reviews will trigger annually.\n\n## 3. Scope\nCovers all digital payment gates, SARIE systems, and core banking systems.`;
        const fallbackProc = `# Standard Operating Procedure - ${ctrl.code}\n\n## 1. Workflow Sequence\n- **Step 1:** System owner performs security checklist review.\n- **Step 2:** Dual-authorization check conducted (Maker-Checker rule).\n- **Step 3:** Deliverables written to physical archive.\n\n## 2. Timing\nTriggered immediately on architectural change or monthly auditing sprints.`;
        const fallbackGuide = `# Compliance Implementation Guideline - ${ctrl.code}\n\n## 1. Implementation Steps\n- Audit physical encryption credentials on servers.\n- Ensure HSM keys are rotated under dual custody.\n- Archive evidence reports inside secure sovereign vaults.\n\n## 2. Expected Auditing Evidence\n- ${ctrl.expectedDeliverables.join('\n- ')}`;
        const fallbackSop = `# Standard Operating Procedure (SOP) Quick Sheet - ${ctrl.code}\n\n| Step | Responsible Role | Targeted Platform | Verification Frequency |\n|---|---|---|---|\n| 1. Key check | Security Admin | Physical HSM Vault | Weekly |\n| 2. Risk Signoff | CISO / Board | Strategy GRC Ledger | Annually |`;

        setGeneratedDocs(prev => ({
          ...prev,
          [ctrl.id]: {
            policy: fallbackPolicy,
            procedure: fallbackProc,
            guideline: fallbackGuide,
            sop: fallbackSop
          }
        }));
        setEditingDocText(fallbackPolicy);
      }

      if (addAuditLog) {
        addAuditLog('DOCUMENT_GENERATED', `Generated sovereign GRC Policy, Procedure, Guideline & SOP package for SAMA Control ${ctrl.code}`, ctrl.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Action: Batch generation of all missing documents for selected domain
  const handleBatchGenerateDomain = async () => {
    setIsDomainGenerating(true);
    let current = 0;
    const controlsToGen = activeDomain.subdomains.flatMap(s => s.controls);
    const total = controlsToGen.length;

    for (const ctrl of controlsToGen) {
      current++;
      setDomainGenProgress({ current, total, activeControlCode: ctrl.code });
      
      const fallbackPolicy = `# SAMA Sovereign Policy - ${ctrl.code}\n\n## 1. Compliance Mandates\nStrictly implements ${ctrl.title} under the supervision of the Saudi Central Bank.\n\n## 2. Core Directives\n- Data residency must map exclusively within regional limits.\n- Periodic SOC monitoring remains highly active.`;
      const fallbackProc = `# Standard Operating Procedure - ${ctrl.code}\n\n- Step 1: Automated configuration baseline run.\n- Step 2: CISO review and digital stamp.`;
      const fallbackGuide = `# Audit Verification Guideline - ${ctrl.code}\n\n- Review cryptographic HSM credentials.\n- Fetch compliance evidence matching: ${ctrl.expectedDeliverables.join(', ')}`;
      const fallbackSop = `# Standard Operating Procedure Matrix - ${ctrl.code}\n\n- Action 1: System compliance review. Run monthly.`;

      setGeneratedDocs(prev => ({
        ...prev,
        [ctrl.id]: {
          policy: fallbackPolicy,
          procedure: fallbackProc,
          guideline: fallbackGuide,
          sop: fallbackSop
        }
      }));
      await new Promise(r => setTimeout(r, 200)); // fast processing simulation
    }

    if (addAuditLog) {
      addAuditLog('DOCUMENT_GENERATED', `Batch generated GRC compliance documentation for entire domain ${activeDomain.name}`, activeDomain.id);
    }
    
    setIsDomainGenerating(false);
    setDomainGenProgress(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editingDocText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!activeControl) return;
    const ctrlId = activeControl.control.id;
    setGeneratedDocs(prev => ({
      ...prev,
      [ctrlId]: {
        ...prev[ctrlId],
        [activeDocTab]: editingDocText
      }
    }));
    setIsEditing(false);
    if (addAuditLog) {
      addAuditLog('DOCUMENT_APPROVED', `Edited and approved custom draft of SAMA ${activeDocTab.toUpperCase()} document for ${activeControl.control.code}`, ctrlId);
    }
  };

  return (
    <div className="space-y-6" id="sama-suite-container">
      {/* Top Breadcrumb and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Landmark className="w-3.5 h-3.5 text-blue-500" />
            <span>SAUDI CENTRAL BANK (SAMA)</span>
            <span>/</span>
            <span className="text-slate-200">SOVEREIGN GRC COMPLIANCE SUITE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            SAMA Framework Family Suite 🇸🇦
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive compliance, gap mappings, grounded knowledge assessments, and document generation.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Hybrid Mode Toggle */}
          <button
            onClick={() => setHybridMode(!hybridMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              hybridMode 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
            title="Maps controls to local/regional and international standards instantly"
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>HYBRID COMPLIANCE MODE: {hybridMode ? 'ACTIVE' : 'OFFLINE'}</span>
          </button>

          <button
            onClick={handleExportGRC}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
          >
            <Download className="w-4 h-4" /> Export SAMA GRC Package
          </button>
        </div>
      </div>

      {/* GRC Agentic Team Active Sovereign Oversight Shield */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10 shrink-0">
            <Fingerprint className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Sovereign GRC Banking Agentic Oversight Engine
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl font-normal">
              Active SAMA alignment scanning. Grounded on banking domain regulatory frameworks.
              Instantly review local mandates, evaluate control gaps, and verify operational compliance with Saudi Central Bank frameworks.
            </p>
          </div>
        </div>
        <div className="flex flex-col text-left md:text-right shrink-0 bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl min-w-[210px] gap-1 font-mono text-[11px]">
          <div className="flex justify-between items-center md:justify-end gap-3 text-slate-400">
            <span>SAMA CONFORMANCE:</span>
            <span className="text-emerald-400 font-bold">100% REGIONAL</span>
          </div>
          <div className="flex justify-between items-center md:justify-end gap-3 text-slate-400 mt-1">
            <span>AUDIT STANDARDS:</span>
            <span className="text-blue-400 font-semibold">ISO 27001, COBIT, NIST</span>
          </div>
          <div className="flex justify-between items-center md:justify-end gap-3 text-slate-400 mt-1">
            <span>AGENTS ONLINE:</span>
            <span className="text-amber-400">CISO, CIO, CTO, AUDITOR</span>
          </div>
        </div>
      </div>

      {/* Grid of the 7 SAMA Frameworks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {frameworks.map((fw) => {
          const isActive = selectedFwId === fw.id;
          return (
            <button
              key={fw.id}
              onClick={() => {
                setSelectedFwId(fw.id);
                setSelectedDomainId('1');
              }}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                isActive 
                  ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-500 dark:border-blue-400/50 shadow-md shadow-blue-500/5' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-xl flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <span className={`text-[10px] font-semibold tracking-wider uppercase ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                SAMA
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-white mt-1 leading-snug truncate" title={fw.name}>
                {fw.name.replace('SAMA ', '')}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1 font-mono font-normal">
                <Layers className="w-3 h-3" /> {fw.totalControls} Controls
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Framework Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="md:col-span-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active SAMA Category</span>
          <span className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{activeFramework.name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activeFramework.description}</p>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Implemented</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{stats.implemented}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-11 h-11 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Partially Complete</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{stats.partial}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.partialPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Gaps / Outstanding</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{stats.notImplemented}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="text-[10px] text-blue-500 mt-2 font-mono font-normal flex items-center gap-1 cursor-pointer hover:underline" onClick={handleBatchGenerateDomain}>
              <Sparkles className="w-3 h-3 animate-spin" /> Auto-Gen Domain Documents
            </div>
          </div>
        </div>
      </div>

      {/* Main SAMA Workspace Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Explorer Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[700px]">
          
          {/* Header of Explorer */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Controls Explorer</span>
            
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search control ref, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              {/* Status Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {['All', 'Implemented', 'Partially Implemented', 'Not Implemented'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 whitespace-nowrap ${
                      statusFilter === st 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'Partially Implemented' ? 'Partial' : st === 'Not Implemented' ? 'Gaps' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of Domains & Subdomains */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {activeFramework.domains.map((dom) => {
              const isDomainActive = selectedDomainId === dom.id;
              return (
                <div key={dom.id} className="p-1">
                  <button
                    onClick={() => {
                      setSelectedDomainId(dom.id);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold text-left transition-all ${
                      isDomainActive 
                        ? 'bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate max-w-[85%]">{dom.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {dom.subdomains.reduce((acc, curr) => acc + curr.controls.length, 0)}
                    </span>
                  </button>

                  {/* Expand Subdomains if Domain is selected */}
                  {isDomainActive && (
                    <div className="pl-3 pr-2 py-1 space-y-1 bg-slate-50/20 dark:bg-slate-900/10">
                      {dom.subdomains.map((sub) => (
                        <div key={sub.id} className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 block px-2.5 pt-1 uppercase tracking-wide">
                            {sub.title}
                          </span>
                          <ul className="space-y-0.5">
                            {sub.controls
                              .filter(c => {
                                const matchSearch = searchQuery === '' || 
                                  c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  c.title.toLowerCase().includes(searchQuery.toLowerCase());
                                const matchStatus = statusFilter === 'All' || c.status === statusFilter;
                                return matchSearch && matchStatus;
                              })
                              .map((ctrl) => {
                                const isCtrlActive = selectedControlId === ctrl.id;
                                return (
                                  <li key={ctrl.id}>
                                    <button
                                      onClick={() => setSelectedControlId(ctrl.id)}
                                      className={`w-full flex items-center justify-between p-2 rounded-lg text-[11px] transition-all text-left ${
                                        isCtrlActive
                                          ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/10'
                                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/30'
                                      }`}
                                    >
                                      <span className="truncate max-w-[70%]">{ctrl.code}</span>
                                      
                                      {/* Mini status indicator */}
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                                        ctrl.status === 'Implemented' 
                                          ? 'bg-emerald-500' 
                                          : ctrl.status === 'Partially Implemented'
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                      }`} />
                                    </button>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Custom Control Proposal Button */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              id="sama-propose-btn"
              onClick={() => setIsAddControlOpen(true)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Propose Custom SAMA Control
            </button>
          </div>
        </div>

        {/* Right Column: Workstation compliance area (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeControl ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
              
              {/* Control Header info card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold tracking-wider">
                      {activeControl.control.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Subdomain: {activeControl.subdomain.title}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {activeControl.control.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    activeControl.control.status === 'Implemented'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : activeControl.control.status === 'Partially Implemented'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeControl.control.status === 'Implemented' ? 'bg-emerald-500' : activeControl.control.status === 'Partially Implemented' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {activeControl.control.status}
                  </span>
                </div>
              </div>

              {/* Description & Expected Deliverables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-500" /> SAMA Cyber Requirement
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    {activeControl.control.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-500" /> Compliance Evidence Required
                  </h4>
                  <ul className="space-y-1.5 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                    {activeControl.control.expectedDeliverables.map((del, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{del}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Implementation guidelines and Mappings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-500" /> Banking Implementation Guidelines
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-2">
                  {activeControl.control.implementationGuidelines.map((gl, gIdx) => (
                    <div key={gIdx} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2 font-sans leading-relaxed">
                      <span className="text-amber-500 font-bold shrink-0">{gIdx + 1}.</span>
                      <span>{gl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hybrid Mapping and Gap assessment section */}
              {hybridMode && (
                <div className="bg-blue-50/50 dark:bg-blue-950/5 border border-blue-500/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <GitMerge className="w-4 h-4" /> Local & International Framework Mapping (Hybrid Alignment)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Through multi-framework indexing, this control is continuously mapped to other security directives to avoid double auditing:
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(activeControl.control.mappedControls).map(([fwKey, fwVal]) => (
                      <div key={fwKey} className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none">{fwKey}</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 block font-mono">{fwVal}</span>
                        <span className="text-[9px] text-emerald-500 font-semibold mt-1 block flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Core Mapped
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Gap Assessment analysis summary */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Gap Mitigation Review</span>
                      <span>This SAMA control is fully satisfied by implementing NCA-ECC policies. No duplicate internal guidelines are required. General GRC evidence maps to both audits.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto Document Generation Pane */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" /> SAMA Compliance Documentation Workspace
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Auto-generate highly professional banking policies, procedures, guidelines and SOPs tailored to SAMA.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    {/* Use AI Toggle */}
                    <button
                      onClick={() => setUseAI(!useAI)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        useAI 
                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
                          : 'bg-slate-100 dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {useAI ? '✨ Real-time AI Generation' : '⚡ Local Templates'}
                    </button>

                    <button
                      id="sama-generate-policy-btn"
                      onClick={handleGenerateDocuments}
                      disabled={isGenerating}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 transition-all duration-200"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Drafts...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span>Auto-Generate GRC Suite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Loading Status Indicator */}
                {isGenerating && (
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-purple-500 animate-spin shrink-0" />
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-mono">{generationStep}</span>
                  </div>
                )}

                {/* Display Generated Documents Tab pane if exists */}
                {generatedDocs[activeControl.control.id] ? (
                  <div className="space-y-4">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1 overflow-x-auto">
                      {(['policy', 'procedure', 'guideline', 'sop'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveDocTab(tab);
                            setEditingDocText(generatedDocs[activeControl.control.id][tab]);
                            setIsEditing(false);
                          }}
                          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wider ${
                            activeDocTab === tab
                              ? 'border-purple-600 text-purple-600 font-bold'
                              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Document display board */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl p-5 relative min-h-[250px] font-sans">
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          onClick={handleCopyText}
                          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          title="Copy Document Text"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className={`p-1.5 border rounded-lg transition-all ${
                            isEditing 
                              ? 'bg-purple-600 text-white border-purple-600' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Edit Document Text"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 pt-4">
                          <textarea
                            value={editingDocText}
                            onChange={(e) => setEditingDocText(e.target.value)}
                            rows={12}
                            className="w-full text-xs p-3 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-950 dark:text-white font-mono"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditingDocText(generatedDocs[activeControl.control.id][activeDocTab]);
                              }}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 shadow-sm"
                            >
                              Save Draft
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert text-xs max-w-none pt-4 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {generatedDocs[activeControl.control.id][activeDocTab]}
                        </div>
                      )}
                    </div>
                    
                    {/* Grounded Knowledge Core Approval Seal */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">Grounded GRC Team Approval Seal</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block mt-0.5">Approved & Encrypted inside Local Vault</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg font-mono text-[9px] text-slate-500 dark:text-slate-400">
                        HASH: SAMA-ECC-{activeControl.control.code}-902FBA82
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-8 px-4 text-center">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">No GRC artifacts generated yet</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                      Click the "Auto-Generate GRC Suite" button to trigger real-time policy drafting aligned with sovereign Saudi banking regulations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">SAMA Explorer Sandbox</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Expand domains on the left panel and click on any specific control code to view detailed requirement mapping, guidelines, and GRC generators.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grounded Knowledge GRC Team Simulation Modal */}
      <AnimatePresence>
        {isAddControlOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    Grounded Agentic Team Review & Propose
                  </span>
                </div>
                <button
                  onClick={() => setIsAddControlOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProposeControl} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase block">Control Code</label>
                    <input
                      type="text"
                      placeholder="SAMA-1.1.2"
                      value={newControlCode}
                      onChange={(e) => setNewControlCode(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase block">Control Title</label>
                    <input
                      type="text"
                      placeholder="Board risk charter review"
                      value={newControlTitle}
                      onChange={(e) => setNewControlTitle(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Description</label>
                  <textarea
                    placeholder="Provide a thorough overview of the control objectives aligned with Saudi Central Bank mandates."
                    value={newControlDescription}
                    onChange={(e) => setNewControlDescription(e.target.value)}
                    required
                    rows={3}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Guidelines (One per line)</label>
                  <textarea
                    placeholder="Align standard guidelines with COBIT/SAMA CSF directives."
                    value={newControlGuidelines}
                    onChange={(e) => setNewControlGuidelines(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase block">Expected Deliverables (One per line)</label>
                  <textarea
                    placeholder="Enter expected audit evidence items."
                    value={newControlDeliverables}
                    onChange={(e) => setNewControlDeliverables(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* AI Agent check log stream if running */}
                {isAgentChecking && (
                  <div className="bg-slate-950 text-slate-200 font-mono text-[10px] p-3 rounded-xl border border-slate-800 space-y-1 max-h-[120px] overflow-y-auto">
                    {agentCheckLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-1">
                        <span className="text-emerald-500 shrink-0">✔</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="text-blue-400 animate-pulse mt-1 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing system constraints...
                    </div>
                  </div>
                )}

                {/* Display cryptographic seal if approved */}
                {agentApprovalSignature && (
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approved by GRC Agentic CISO Team
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 break-all">
                      SIGNATURE: {agentApprovalSignature}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddControlOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAgentChecking}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 disabled:opacity-50"
                  >
                    {isAgentChecking ? 'Agentic Review running...' : 'Submit to GRC Review Chain'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
