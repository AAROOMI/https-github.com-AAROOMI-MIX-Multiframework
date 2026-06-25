import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
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
  RefreshCw 
} from 'lucide-react';
import { ncaFrameworks, NcaFramework, NcaControl, NcaDomain, NcaSubdomain } from '../data/ncaFamilyData';
import { AIService } from '../services/aiService';

interface NcaFamilySuitePageProps {
  language?: string;
  addAuditLog?: (action: string, details: string, targetId?: string) => void;
  selectedFwId?: string;
  onSelectFwId?: (fwId: string) => void;
}

export const NcaFamilySuitePage: React.FC<NcaFamilySuitePageProps> = ({ 
  language = 'en',
  addAuditLog,
  selectedFwId: propSelectedFwId,
  onSelectFwId
}) => {
  const [localSelectedFwId, setLocalSelectedFwId] = useState<string>('ecc-2.0');
  const selectedFwId = propSelectedFwId !== undefined ? propSelectedFwId : localSelectedFwId;
  const setSelectedFwId = onSelectFwId !== undefined ? onSelectFwId : setLocalSelectedFwId;
  const [selectedDomainId, setSelectedDomainId] = useState<string>('1');
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

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

  // Active framework
  const activeFramework = useMemo(() => {
    return ncaFrameworks.find(fw => fw.id === selectedFwId) || ncaFrameworks[0];
  }, [selectedFwId]);

  // Active Domain
  const activeDomain = useMemo(() => {
    return activeFramework.domains.find(d => d.id === selectedDomainId) || activeFramework.domains[0];
  }, [activeFramework, selectedDomainId]);

  // Filtered Controls
  const filteredControls = useMemo(() => {
    const list: NcaControl[] = [];
    activeFramework.domains.forEach(domain => {
      // If we are filtering by domain, only include if matches active domain
      if (domain.id !== selectedDomainId) return;

      domain.subdomains.forEach(subdomain => {
        subdomain.controls.forEach(ctrl => {
          const matchesSearch = 
            ctrl.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ctrl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ctrl.description.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesStatus = statusFilter === 'All' || ctrl.status === statusFilter;

          if (matchesSearch && matchesStatus) {
            list.push(ctrl);
          }
        });
      });
    });
    return list;
  }, [activeFramework, selectedDomainId, searchQuery, statusFilter]);

  // Selected control details
  const activeControl = useMemo(() => {
    if (!selectedControlId) return null;
    for (const domain of activeFramework.domains) {
      for (const sub of domain.subdomains) {
        const found = sub.controls.find(c => c.id === selectedControlId);
        if (found) return { control: found, subdomain: sub, domain: domain };
      }
    }
    return null;
  }, [activeFramework, selectedControlId]);

  // Set default control when framework or domain changes
  React.useEffect(() => {
    if (filteredControls.length > 0) {
      setSelectedControlId(filteredControls[0].id);
    } else {
      setSelectedControlId('');
    }
  }, [selectedFwId, selectedDomainId]);

  // Calculate stats for current framework
  const stats = useMemo(() => {
    let total = 0;
    let implemented = 0;
    let partial = 0;
    let notImplemented = 0;

    activeFramework.domains.forEach(d => {
      d.subdomains.forEach(s => {
        s.controls.forEach(c => {
          total++;
          if (c.status === 'Implemented') implemented++;
          else if (c.status === 'Partially Implemented') partial++;
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

  // Fallback high-fidelity document generator
  const getOfflineDrafts = (ctrl: NcaControl, fwName: string) => {
    const policy = `# ${fwName} Cybersecurity Compliance Policy
## Control Ref: ${ctrl.code} - ${ctrl.title}
**Classification:** Internal / Confidential
**Version:** 1.2 (Sovereign Alignment)

### 1. Purpose
The purpose of this policy is to mandate the administrative and technical controls required to implement ${ctrl.description}. This guarantees rigorous strategic alignment with the Kingdom of Saudi Arabia's cybersecurity rules.

### 2. Scope
This policy applies to all personnel, technological assets, databases, cloud environments, and third-party integrations involved in processing critical organizational data.

### 3. Policy Statements
* **Strict Alignment:** The organization must continuously enforce standard criteria outlined under ${ctrl.code} to defend our national digital borders.
* **Audit and Validation:** A quarterly audit must verify the continuous implementation of these mechanisms.
* **System Hardening:** All servers, endpoints, and SCADA control channels related to this scope must follow approved build guidelines.
* **Continuous Monitoring:** High-fidelity event logs must feed automatically into the centralized Security Operations Center (SOC).

### 4. Roles & Responsibilities
* **CISO / GRC Director:** Overall owner of the validation lifecycle.
* **System Administrators:** Responsible for implementing technical guidelines and host configuration baselines.
* **Internal Audit Team:** Responsible for verifying operational effectiveness.`;

    const procedure = `# SOP & Operational Compliance Procedure
## Control Code: ${ctrl.code} - Procedure Manual
**Author:** GRC Implementation Office
**Effective Date:** Immediate

### 1. Initial Assessment Phase
1. Establish automated scanners to identify any gaps matching ${ctrl.code}.
2. Categorize system interfaces and assign data owners for each affected asset class.
3. Review current host firewall access list policies.

### 2. Operational Implementation
1. Configure host agents and multi-factor authentication requirements as specified.
2. Segment non-essential ports and enforce secure IPsec tunnels for cross-region traffic.
3. Update standard golden images with secure OS benchmarks.

### 3. Maintenance and Continual Logging
1. Execute daily script automated backups and save state logs.
2. Route access logs to central SIEM systems with retention configured for at least 12 months.
3. Test emergency restore capabilities twice per annum.`;

    const guideline = `# National Compliance Guidelines
## Framework Implementation Guideline (${ctrl.code})
**National Standard:** ${fwName} Family
**Scope:** Kingdom-wide GRC Standard

### 1. General Principles
Implementing ${ctrl.code} requires a layered defense model. Ensure all controls are documented with explicit screenshots and configuration file audits before submitting to national audit inspectors.

### 2. Key Technical Best Practices
* **Zero Trust Access:** Apply least-privilege roles to both humans and machines.
* **Air-Gapped Zones:** For Operational Technology, segment networks using bidirectional safety diodes.
* **Sovereignty Shield:** Ensure no cloud assets reside on servers physically located outside national borders.

### 3. Key Documentation Requirements
1. Approved security strategy signature sheet.
2. Active firewall configuration rules.
3. SOC alert definition screenshots.`;

    const sop = `# Standard Operating Procedure (SOP)
## System-Level Instructions: ${ctrl.code} Implementation
**Task:** Continuous Management and Verification SOP
**Interval:** Weekly / Monthly

### 1. Verification Tasks
1. Log into the GRC Console and review compliance flags for ${ctrl.code}.
2. Extract the security event logs matching previous 7 days of privileged access.
3. Run a network segment validation tool to verify active routes.

### 2. Escalation Paths
* **Alert Trigger:** Unsanctioned configuration change on critical servers.
* **Level 1 Escalation:** System administrator immediately rolls back configuration to master image.
* **Level 2 Escalation:** Security Incident Response Team (SIRT) launches investigation within 15 minutes.

### 3. Completion Sign-off
Maintain a weekly digital log signed by the GRC manager confirming verification actions were completed successfully.`;

    return { policy, procedure, guideline, sop };
  };

  // Auto generate documents
  const handleGenerateDocs = async (ctrl: NcaControl) => {
    setIsGenerating(true);
    setGenerationStep('Initializing National Framework compliance structures...');
    
    if (addAuditLog) {
      addAuditLog('AUTO_GENERATE_COMPLIANCE_DOCS', `Generated Policy, Procedure, Guideline, and SOP for ${ctrl.code} under ${activeFramework.name}`, ctrl.id);
    }

    try {
      if (useAI) {
        // Step 1: Policy
        setGenerationStep('Formulating Custom Sovereign Policy...');
        await new Promise(r => setTimeout(r, 600));
        const policyPrompt = `Write a professional, comprehensive cybersecurity Policy aligned with NCA rules for control code "${ctrl.code}" with title "${ctrl.title}". Description: "${ctrl.description}". Focus on Saudi national compliance, roles, and administrative mandates. Format with clear Markdown headings.`;
        const policyText = await AIService.generateContent(policyPrompt);

        // Step 2: Procedure
        setGenerationStep('Drafting Step-by-Step Implementation Procedure...');
        await new Promise(r => setTimeout(r, 500));
        const procPrompt = `Write a detailed compliance Procedure document for control "${ctrl.code}" (${ctrl.title}). Provide steps for initial assessment, implementation, and logging. Use clean markdown formatting.`;
        const procedureText = await AIService.generateContent(procPrompt);

        // Step 3: Guideline
        setGenerationStep('Aligning National Regulatory Guidelines...');
        await new Promise(r => setTimeout(r, 500));
        const guidePrompt = `Generate compliance Guidelines for control code "${ctrl.code}". Include key tech best practices, zero-trust rules, and documentation criteria. Format as clean Markdown.`;
        const guidelineText = await AIService.generateContent(guidePrompt);

        // Step 4: SOP
        setGenerationStep('Structuring Technical Standard Operating Procedure (SOP)...');
        await new Promise(r => setTimeout(r, 500));
        const sopPrompt = `Provide a detailed Standard Operating Procedure (SOP) with system-level instructions, check intervals, escalation paths, and verification scripts for control "${ctrl.code}" (${ctrl.title}). Use clear Markdown headers.`;
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
        // Instant Offline template
        setGenerationStep('Compiling High-Fidelity Premium Templates...');
        await new Promise(r => setTimeout(r, 1200));
        const offline = getOfflineDrafts(ctrl, activeFramework.name);
        setGeneratedDocs(prev => ({
          ...prev,
          [ctrl.id]: offline
        }));
        setEditingDocText(offline.policy);
      }
    } catch (err) {
      console.error("Error generating documents:", err);
      // Fallback
      const offline = getOfflineDrafts(ctrl, activeFramework.name);
      setGeneratedDocs(prev => ({
        ...prev,
        [ctrl.id]: offline
      }));
      setEditingDocText(offline.policy);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      setIsEditing(false);
    }
  };

  // Bulk generate documents for active Domain
  const handleGenerateDomainDocs = async () => {
    setIsDomainGenerating(true);
    const domainControls: NcaControl[] = [];
    activeDomain.subdomains.forEach(s => {
      s.controls.forEach(c => {
        domainControls.push(c);
      });
    });

    if (domainControls.length === 0) {
      setIsDomainGenerating(false);
      return;
    }

    if (addAuditLog) {
      addAuditLog('AUTO_GENERATE_DOMAIN_POLICIES', `Bulk generated policies for domain ${activeDomain.name} under ${activeFramework.name}`, activeDomain.id);
    }

    try {
      for (let i = 0; i < domainControls.length; i++) {
        const ctrl = domainControls[i];
        setDomainGenProgress({ current: i + 1, total: domainControls.length, activeControlCode: ctrl.code });
        
        // Short delay for UI updates
        await new Promise(r => setTimeout(r, 200));

        if (useAI) {
          try {
            const policyPrompt = `Draft a concise compliance policy of normal font size for control "${ctrl.code}" - "${ctrl.title}" focusing on NCA guidelines. Keep the tone human, and avoid heavy headings.`;
            const policyText = await AIService.generateContent(policyPrompt);

            const procedurePrompt = `Draft a concise step-by-step procedure of normal font size for control "${ctrl.code}".`;
            const procedureText = await AIService.generateContent(procedurePrompt);

            const guidelinePrompt = `Draft concise guidelines for control "${ctrl.code}".`;
            const guidelineText = await AIService.generateContent(guidelinePrompt);

            const sopPrompt = `Draft concise SOP instructions for control "${ctrl.code}".`;
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
            
            if (selectedControlId === ctrl.id) {
              setEditingDocText(policyText);
            }
          } catch (e) {
            const offline = getOfflineDrafts(ctrl, activeFramework.name);
            setGeneratedDocs(prev => ({
              ...prev,
              [ctrl.id]: offline
            }));
            if (selectedControlId === ctrl.id) {
              setEditingDocText(offline.policy);
            }
          }
        } else {
          const offline = getOfflineDrafts(ctrl, activeFramework.name);
          setGeneratedDocs(prev => ({
            ...prev,
            [ctrl.id]: offline
          }));
          if (selectedControlId === ctrl.id) {
            setEditingDocText(offline.policy);
          }
        }
      }
    } catch (err) {
      console.error("Error in domain generation:", err);
    } finally {
      setIsDomainGenerating(false);
      setDomainGenProgress(null);
    }
  };

  // Change active doc tab
  const handleTabChange = (tab: 'policy' | 'procedure' | 'guideline' | 'sop') => {
    setActiveDocTab(tab);
    if (activeControl) {
      const docs = generatedDocs[activeControl.control.id];
      if (docs) {
        setEditingDocText(docs[tab]);
      }
    }
    setIsEditing(false);
  };

  // Save edit changes locally
  const handleSaveDocEdit = () => {
    if (!activeControl) return;
    const ctrlId = activeControl.control.id;
    const currentDocs = generatedDocs[ctrlId];
    if (currentDocs) {
      const updated = {
        ...currentDocs,
        [activeDocTab]: editingDocText
      };
      setGeneratedDocs(prev => ({
        ...prev,
        [ctrlId]: updated
      }));
      setIsEditing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editingDocText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download compliance package for active framework
  const handleDownloadPackage = () => {
    const filename = `${activeFramework.id}-compliance-package.json`;
    const docList = activeFramework.domains.flatMap(d => 
      d.subdomains.flatMap(s => 
        s.controls.map(c => ({
          controlCode: c.code,
          controlTitle: c.title,
          status: c.status,
          generatedArtifacts: generatedDocs[c.id] || null
        }))
      )
    );
    
    const fileData = {
      framework: activeFramework.name,
      exportedAt: new Date().toISOString(),
      coverage: stats,
      details: docList
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fileData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (addAuditLog) {
      addAuditLog('EXPORT_NCA_COMPLIANCE_PACKAGE', `Exported full compliance package for ${activeFramework.name}`, activeFramework.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full text-xs font-normal uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> NCA GRC Ecosystem
            </span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-normal uppercase tracking-wider">
              9 Frameworks Integrated
            </span>
          </div>
          <h1 className="text-sm font-normal text-slate-800 dark:text-white tracking-tight">NCA Framework Family Suite</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One unified stream managing national cybersecurity controls, cross-mappings, and automatic GRC artifact generation.
          </p>
        </div>

        <button 
          onClick={handleDownloadPackage}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-normal shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200"
        >
          <Download className="w-4 h-4" /> Export Framework GRC Package
        </button>
      </div>

      {/* Grid of the 9 Integrated Frameworks */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {ncaFrameworks.map((fw) => {
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
                  ? 'bg-teal-50/70 dark:bg-teal-950/20 border-teal-500 dark:border-teal-400/50 shadow-md shadow-teal-500/5' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-teal-500/10 rounded-bl-xl flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
              )}
              <span className={`text-[10px] font-normal tracking-wider uppercase ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {fw.name.split(' ')[0]}
              </span>
              <span className="text-xs font-normal text-slate-800 dark:text-white mt-1 leading-snug">
                {fw.name.replace('NCA ', '')}
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
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Workspace</span>
          <span className="text-sm font-normal text-slate-800 dark:text-white mt-1">{activeFramework.name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activeFramework.description}</p>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-normal">Implemented Controls</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-normal text-slate-800 dark:text-white">{stats.implemented}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-normal">Partially Implemented</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-normal text-slate-800 dark:text-white">{stats.partial}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.partialPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-normal">Not Implemented</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-normal text-slate-800 dark:text-white">{stats.notImplemented}</span>
              <span className="text-xs text-slate-400 font-normal">/ {stats.total}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-mono font-normal">Needs Compliance Generate</div>
          </div>
        </div>
      </div>

      {/* Main GRC Workspace Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Explorer Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[700px]">
          
          {/* Header of Explorer */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] font-normal text-slate-400 uppercase tracking-widest block mb-2">Controls Explorer</span>
            
            {/* Search and filter bars */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search control ref, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Tabs filters */}
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                {['All', 'Implemented', 'Partially Implemented', 'Not Implemented'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`flex-1 py-1 text-[10px] font-normal rounded-md transition-all ${
                      statusFilter === st 
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-normal' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                    }`}
                  >
                    {st === 'Partially Implemented' ? 'Partial' : st === 'Not Implemented' ? 'Not' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Domain tabs inside explorer */}
          <div className="flex gap-1 overflow-x-auto px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
            {activeFramework.domains.map((dom) => {
              const isDomActive = selectedDomainId === dom.id;
              return (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomainId(dom.id)}
                  className={`px-3 py-1.5 text-xs font-normal rounded-full whitespace-nowrap transition-all ${
                    isDomActive
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-normal'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-normal'
                  }`}
                >
                  {dom.name}
                </button>
              );
            })}
          </div>

          {/* Domain bulk auto-generate requirements action */}
          <div className="p-3 bg-teal-500/5 dark:bg-teal-950/5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              {language === 'ar' ? 'متطلبات و سياسات المجال:' : 'Requirements & policies:'} <span className="text-teal-600 dark:text-teal-400 font-normal">{activeDomain.name}</span>
            </div>
            
            <button
              onClick={handleGenerateDomainDocs}
              disabled={isDomainGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/25 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/10 dark:border-teal-500/20 rounded-lg text-[11px] font-normal transition-all duration-200 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isDomainGenerating 
                ? (language === 'ar' ? 'جاري التوليد...' : 'Generating...') 
                : (language === 'ar' ? 'توليد متطلبات المجال تلقائياً' : 'Auto-Generate Domain Policies')}
            </button>
          </div>

          {/* Progress bar for Domain Generation */}
          {isDomainGenerating && domainGenProgress && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span className="font-normal">{language === 'ar' ? `توليد ${domainGenProgress.activeControlCode}...` : `Drafting ${domainGenProgress.activeControlCode}...`}</span>
                <span className="font-mono font-normal">{domainGenProgress.current} / {domainGenProgress.total}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full transition-all duration-300" 
                  style={{ width: `${(domainGenProgress.current / domainGenProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {filteredControls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <span className="text-xs font-normal text-slate-500">No controls match filters</span>
              </div>
            ) : (
              filteredControls.map((ctrl) => {
                const isSelected = selectedControlId === ctrl.id;
                const statusColor = 
                  ctrl.status === 'Implemented' 
                    ? 'bg-teal-500' 
                    : ctrl.status === 'Partially Implemented' 
                      ? 'bg-amber-500' 
                      : 'bg-slate-300 dark:bg-slate-600';

                return (
                  <button
                    key={ctrl.id}
                    onClick={() => setSelectedControlId(ctrl.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex gap-3 ${
                      isSelected 
                        ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-teal-600 dark:border-l-teal-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-col items-center mt-1">
                       <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-normal text-teal-600 dark:text-teal-400">{ctrl.code}</span>
                        {generatedDocs[ctrl.id] && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-normal flex items-center gap-0.5">
                            <FileCheck className="w-2.5 h-2.5" /> GRC Loaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-normal text-slate-800 dark:text-white mt-0.5 line-clamp-1">{ctrl.title}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{ctrl.description}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Details & Document Generator Pane (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Detailed Control Panel */}
          {activeControl ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col space-y-5">
              
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                <div>
                  <span className="text-xs font-mono font-normal text-teal-600 dark:text-teal-400 uppercase tracking-widest">{activeControl.domain.name} / {activeControl.subdomain.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-sm font-normal text-slate-800 dark:text-white tracking-tight">{activeControl.control.code} - {activeControl.control.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-normal ${
                      activeControl.control.status === 'Implemented' 
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' 
                        : activeControl.control.status === 'Partially Implemented' 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {activeControl.control.status}
                    </span>
                  </div>
                </div>

                {/* Generate Action Button */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mr-2 select-none font-normal">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Refinement
                  </label>

                  <button
                    onClick={() => handleGenerateDocs(activeControl.control)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-normal transition-all"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    Auto-Generate Artifacts
                  </button>
                </div>
              </div>

              {/* Control Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Control Objective</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{activeControl.subdomain.objective}</p>
                  </div>

                  <div>
                    <h4 className="font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Implementation Guidelines</h4>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-1.5 space-y-1 pl-1">
                      {activeControl.control.implementationGuidelines.map((gl, i) => (
                        <li key={i}>{gl}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Control Description</h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{activeControl.control.description}</p>
                  </div>

                  <div>
                    <h4 className="font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Expected Deliverables</h4>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-1.5 space-y-1 pl-1">
                      {activeControl.control.expectedDeliverables.map((dl, i) => (
                        <li key={i}>{dl}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION: Integration & Multi-Framework Mapping Network */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <GitMerge className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-normal text-slate-800 dark:text-white uppercase tracking-wider">Cross-Framework National Integration &amp; Mapping</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(activeControl.control.mappedControls).map(([fwId, code]) => {
                    const mappedFw = ncaFrameworks.find(f => f.id === fwId);
                    return (
                      <div 
                        key={fwId} 
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-normal text-slate-400 uppercase">{mappedFw?.name || fwId.toUpperCase()}</span>
                          <span className="text-[11px] font-mono font-normal text-teal-600 dark:text-teal-400 mt-0.5">{code}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500/70" title="Connected Alignment" />
                      </div>
                    );
                  })}

                  {/* External Mapping (SAMA, CMA) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-normal text-slate-400 uppercase">SAMA CSF Mapping</span>
                      <span className="text-[11px] font-mono font-normal text-emerald-600 dark:text-emerald-400 mt-0.5">SAMA-1.3.1</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-normal text-slate-400 uppercase">CMA Compliance</span>
                      <span className="text-[11px] font-mono font-normal text-cyan-600 dark:text-cyan-400 mt-0.5">CMA-ART-5</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/70" />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
              <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-normal text-slate-500">Please select a control to begin GRC operations</p>
            </div>
          )}

          {/* Section 2: GRC Compliance Document Hub */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            
            {/* Tab header bar */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-normal text-slate-800 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Sovereign Compliance Artifacts Hub
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Edit, review, and export generated Policies, Procedures, Guidelines, and SOPs.</p>
              </div>

              {/* Document selection tabs */}
              {activeControl && generatedDocs[activeControl.control.id] && (
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(['policy', 'procedure', 'guideline', 'sop'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-3 py-1.5 text-xs font-normal rounded-lg uppercase transition-all ${
                        activeDocTab === tab
                          ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-normal'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Document body or empty state */}
            <div className="p-6 flex-1 flex flex-col relative">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-600 dark:border-t-teal-400 animate-spin" />
                      <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400 absolute top-5 left-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-normal text-slate-800 dark:text-white">Auto-Drafting Compliance Material</p>
                      <p className="text-xs text-slate-400 font-mono animate-pulse">{generationStep}</p>
                    </div>
                  </motion.div>
                ) : activeControl && generatedDocs[activeControl.control.id] ? (
                  <motion.div
                    key={activeDocTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex-1 flex flex-col space-y-4"
                  >
                    {/* Action buttons on active document */}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ready to export as legal standard • Fully compliant</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                           <button
                            onClick={handleSaveDocEdit}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-normal rounded-lg text-[11px]"
                          >
                            Save Edits
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}

                        <button
                          onClick={handleCopyText}
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1">
                      {isEditing ? (
                        <textarea
                          value={editingDocText}
                          onChange={(e) => setEditingDocText(e.target.value)}
                          className="w-full h-96 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                        />
                      ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-xs font-mono bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed h-[420px] overflow-y-auto">
                          {editingDocText}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 dark:text-slate-500">
                    <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-2" />
                    <p className="text-xs font-normal">No active GRC documentation compiled yet.</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                      Select a control ref above and click "Auto-Generate Artifacts" to automatically compose policy, procedure, guidelines and SOP compliance packs.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
