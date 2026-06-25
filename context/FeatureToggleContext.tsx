import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuditMiddleware } from '../hooks/useAuditMiddleware';
import type { User, CompanyProfile } from '../types';

export interface Feature {
  id: string;
  name: string;
  status: 'Enabled' | 'Disabled';
}

export interface Module {
  moduleId: string;
  name: string;
  version: string;
  status: 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived';
  enabled: boolean;
  billingModel: 'Subscription' | 'Pay As You Go' | 'Consumption' | 'Seat Based' | 'Enterprise';
  createdBy: string;
  createdAt: string;
  features: Feature[];
}

export interface Framework {
  id: string;
  name: string;
  code: string;
  version: string;
  controlsCount: number;
  status: 'Enabled' | 'Read Only' | 'Disabled';
}

interface FeatureToggleContextType {
  modules: Module[];
  frameworks: Framework[];
  toggleModuleState: (moduleId: string, newStatus: Module['status'], reason?: string) => Promise<void>;
  toggleFeatureState: (moduleId: string, featureId: string, enabled: boolean, reason?: string) => Promise<void>;
  isModuleEnabled: (moduleId: string) => boolean;
  isFeatureEnabled: (featureId: string) => boolean;
  isMenuEnabled: (menuId: string) => boolean;
  
  // Real-time CRUD on Modules
  addModule: (newMod: Omit<Module, 'moduleId' | 'createdBy' | 'createdAt'>, reason?: string) => Promise<void>;
  updateModule: (updatedMod: Module, reason?: string) => Promise<void>;
  deleteModule: (moduleId: string, reason?: string) => Promise<void>;

  // Real-time CRUD on Frameworks
  addFramework: (newFw: Omit<Framework, 'id'>, reason?: string) => Promise<void>;
  updateFramework: (updatedFw: Framework, reason?: string) => Promise<void>;
  deleteFramework: (fwId: string, reason?: string) => Promise<void>;
}

const FeatureToggleContext = createContext<FeatureToggleContextType | undefined>(undefined);

const DEFAULT_MODULES: Module[] = [
  {
    moduleId: 'mod-grc',
    name: 'GRC Core Assessment',
    version: 'v2.4.1',
    status: 'Enabled',
    enabled: true,
    billingModel: 'Subscription',
    createdBy: 'aaroomi@gmail.com',
    createdAt: '2026-01-10T08:00:00Z',
    features: [
      { id: 'feat-control-eval', name: 'NCA Evidence Collection', status: 'Enabled' },
      { id: 'feat-scorecard', name: 'Compliance Index Scorecard', status: 'Enabled' },
      { id: 'feat-auto-remediation', name: 'AI Auto-Remediation Generator', status: 'Enabled' }
    ]
  },
  {
    moduleId: 'mod-risk',
    name: 'Risk Management Engine',
    version: 'v1.8.0',
    status: 'Enabled',
    enabled: true,
    billingModel: 'Pay As You Go',
    createdBy: 'aaroomi@gmail.com',
    createdAt: '2026-02-15T09:30:00Z',
    features: [
      { id: 'feat-risk-register', name: 'Risk Register & Ledger', status: 'Enabled' },
      { id: 'feat-risk-heatmap', name: 'Risk Probability Heatmap', status: 'Enabled' },
      { id: 'feat-risk-analytics', name: 'Monte Carlo Simulations', status: 'Disabled' }
    ]
  },
  {
    moduleId: 'mod-vapt',
    name: 'VAPT Security Orchestrator',
    version: 'v1.1.2',
    status: 'Enabled',
    enabled: true,
    billingModel: 'Consumption',
    createdBy: 'aaroomi@gmail.com',
    createdAt: '2026-03-01T14:20:00Z',
    features: [
      { id: 'feat-vulnerability-scan', name: 'Owasp ZAP Scanner', status: 'Enabled' },
      { id: 'feat-network-discovery', name: 'Active Port Mapper', status: 'Enabled' }
    ]
  },
  {
    moduleId: 'mod-ai-gov',
    name: 'AI Governance & Virtual Department',
    version: 'v3.0.0-beta',
    status: 'Enabled',
    enabled: true,
    billingModel: 'Seat Based',
    createdBy: 'aaroomi@gmail.com',
    createdAt: '2026-04-20T10:15:00Z',
    features: [
      { id: 'feat-virtual-org', name: 'Multi-Agent Virtual Board', status: 'Enabled' },
      { id: 'feat-voice-nav', name: 'Voice Command Orchestrator', status: 'Enabled' },
      { id: 'feat-cnn-indexing', name: 'CNN Feature Evidence Classifier', status: 'Enabled' }
    ]
  },
  {
    moduleId: 'mod-bcm',
    name: 'Business Continuity Manager',
    version: 'v1.0.0',
    status: 'Disabled',
    enabled: false,
    billingModel: 'Subscription',
    createdBy: 'aaroomi@gmail.com',
    createdAt: '2026-05-12T11:45:00Z',
    features: [
      { id: 'feat-bia', name: 'Business Impact Analysis (BIA)', status: 'Disabled' },
      { id: 'feat-dr-plan', name: 'Disaster Recovery Playbook', status: 'Disabled' }
    ]
  }
];

const DEFAULT_FRAMEWORKS: Framework[] = [
  { id: 'fw-ecc', name: 'NCA Essential Cybersecurity Controls', code: 'NCA ECC', version: '2018-1-1', controlsCount: 114, status: 'Enabled' },
  { id: 'fw-cscc', name: 'NCA Critical Systems Cybersecurity Controls', code: 'NCA CSCC', version: '2019-1', controlsCount: 89, status: 'Enabled' },
  { id: 'fw-sama', name: 'SAMA Cybersecurity Framework', code: 'SAMA CSF', version: 'v3.4', controlsCount: 56, status: 'Enabled' },
  { id: 'fw-pdpl', name: 'SDAIA Personal Data Protection Law', code: 'PDPL', version: 'v2-2023', controlsCount: 42, status: 'Enabled' },
  { id: 'fw-iso27001', name: 'ISO/IEC 27001 Information Security', code: 'ISO 27001', version: '2022', controlsCount: 93, status: 'Read Only' },
  { id: 'fw-nist-ai', name: 'NIST Artificial Intelligence Risk Management', code: 'NIST AI RMF', version: 'v1.0', controlsCount: 38, status: 'Enabled' }
];

// Mapping of menus/views to their controlling parent modules
const MENU_TO_MODULE_MAP: Record<string, string> = {
  assessment: 'mod-grc',
  pdplAssessment: 'mod-grc',
  samaCsfAssessment: 'mod-grc',
  cmaAssessment: 'mod-grc',
  documents: 'mod-grc',
  riskAssessment: 'mod-risk',
  vapt: 'mod-vapt',
  virtualDepartment: 'mod-ai-gov',
  virtualMeeting: 'mod-ai-gov',
  whiteboard: 'mod-ai-gov',
  creatorMarketplace: 'mod-ai-gov',
  liveVoiceDemo: 'mod-ai-gov',
  complianceAgent: 'mod-ai-gov'
};

export const FeatureToggleProvider: React.FC<{
  children: React.ReactNode;
  currentUser: User | null;
  company: CompanyProfile | null;
  addAuditLog?: (action: any, details: string, targetId?: string) => void;
}> = ({ children, currentUser, company, addAuditLog }) => {
  const [modules, setModules] = useState<Module[]>(() => {
    const saved = localStorage.getItem('universal_engine_modules');
    return saved ? JSON.parse(saved) : DEFAULT_MODULES;
  });

  const [frameworks, setFrameworks] = useState<Framework[]>(() => {
    const saved = localStorage.getItem('universal_engine_frameworks');
    return saved ? JSON.parse(saved) : DEFAULT_FRAMEWORKS;
  });

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('universal_engine_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('universal_engine_frameworks', JSON.stringify(frameworks));
  }, [frameworks]);

  // Connect the global AuditMiddleware
  const { logChange } = useAuditMiddleware(currentUser, company, addAuditLog);

  // Helper selectors
  const isModuleEnabled = (moduleId: string): boolean => {
    const mod = modules.find(m => m.moduleId === moduleId);
    return mod ? (mod.status === 'Enabled' || mod.status === 'Read Only') : false;
  };

  const isFeatureEnabled = (featureId: string): boolean => {
    // Find module containing feature
    for (const mod of modules) {
      if (!isModuleEnabled(mod.moduleId)) continue;
      const feat = mod.features.find(f => f.id === featureId);
      if (feat) {
        return feat.status === 'Enabled';
      }
    }
    return false;
  };

  const isMenuEnabled = (menuId: string): boolean => {
    const controllingModule = MENU_TO_MODULE_MAP[menuId];
    if (!controllingModule) return true; // not constrained by any module
    return isModuleEnabled(controllingModule);
  };

  // State transitions wrapped in AuditMiddleware
  const toggleModuleState = async (moduleId: string, newStatus: Module['status'], reason = 'Manual state override') => {
    const oldModules = [...modules];
    const target = modules.find(m => m.moduleId === moduleId);
    if (!target) return;

    const previousStatus = target.status;
    const updatedModules = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          status: newStatus,
          enabled: newStatus === 'Enabled' || newStatus === 'Read Only'
        };
      }
      return m;
    });

    setModules(updatedModules);

    await logChange(
      'MODULE_STATE_TOGGLED',
      { moduleId, status: previousStatus },
      { moduleId, status: newStatus },
      `Switched state of ${target.name} from "${previousStatus}" to "${newStatus}". Reason: ${reason}`,
      moduleId
    );
  };

  const toggleFeatureState = async (moduleId: string, featureId: string, enabled: boolean, reason = 'Operator preference override') => {
    const oldModules = [...modules];
    const mod = modules.find(m => m.moduleId === moduleId);
    if (!mod) return;
    const feat = mod.features.find(f => f.id === featureId);
    if (!feat) return;

    const previousStatus = feat.status;
    const newStatus: 'Enabled' | 'Disabled' = enabled ? 'Enabled' : 'Disabled';

    const updatedModules = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          features: m.features.map(f => {
            if (f.id === featureId) {
              return { ...f, status: newStatus };
            }
            return f;
          })
        };
      }
      return m;
    });

    setModules(updatedModules);

    await logChange(
      'FEATURE_STATE_TOGGLED',
      { featureId, status: previousStatus },
      { featureId, status: newStatus },
      `Switched feature [${feat.name}] under [${mod.name}] to "${newStatus}". Reason: ${reason}`,
      featureId
    );
  };

  // CRUD on Modules
  const addModule = async (newMod: Omit<Module, 'moduleId' | 'createdBy' | 'createdAt'>, reason = 'New modular feature rollout') => {
    const moduleId = `mod-${Math.random().toString(36).substring(2, 8)}`;
    const fullMod: Module = {
      ...newMod,
      moduleId,
      createdBy: currentUser?.email || 'admin@sovereign.sa',
      createdAt: new Date().toISOString()
    };

    setModules(prev => [...prev, fullMod]);

    await logChange(
      'MODULE_CREATED',
      null,
      fullMod,
      `Successfully provisioned and deployed new module: ${fullMod.name} (ID: ${moduleId}). Reason: ${reason}`,
      moduleId
    );
  };

  const updateModule = async (updatedMod: Module, reason = 'Module configuration adjustments') => {
    const previous = modules.find(m => m.moduleId === updatedMod.moduleId);
    if (!previous) return;

    setModules(prev => prev.map(m => m.moduleId === updatedMod.moduleId ? updatedMod : m));

    await logChange(
      'MODULE_UPDATED',
      previous,
      updatedMod,
      `Updated module metadata/attributes for: ${updatedMod.name}. Reason: ${reason}`,
      updatedMod.moduleId
    );
  };

  const deleteModule = async (moduleId: string, reason = 'Subsystem retirement') => {
    const target = modules.find(m => m.moduleId === moduleId);
    if (!target) return;

    setModules(prev => prev.filter(m => m.moduleId !== moduleId));

    await logChange(
      'MODULE_DELETED',
      target,
      null,
      `Permanently terminated and deleted module registry item: ${target.name} (ID: ${moduleId}). Reason: ${reason}`,
      moduleId
    );
  };

  // CRUD on Frameworks
  const addFramework = async (newFw: Omit<Framework, 'id'>, reason = 'Regulatory template ingest') => {
    const id = `fw-${Math.random().toString(36).substring(2, 8)}`;
    const fullFw: Framework = {
      ...newFw,
      id
    };

    setFrameworks(prev => [...prev, fullFw]);

    await logChange(
      'FRAMEWORK_CREATED',
      null,
      fullFw,
      `Imported new regulatory compliance framework template: ${fullFw.name} (${fullFw.code}). Reason: ${reason}`,
      id
    );
  };

  const updateFramework = async (updatedFw: Framework, reason = 'Compliance guideline updates') => {
    const previous = frameworks.find(f => f.id === updatedFw.id);
    if (!previous) return;

    setFrameworks(prev => prev.map(f => f.id === updatedFw.id ? updatedFw : f));

    await logChange(
      'FRAMEWORK_UPDATED',
      previous,
      updatedFw,
      `Modified attributes of compliance template: ${updatedFw.code}. Reason: ${reason}`,
      updatedFw.id
    );
  };

  const deleteFramework = async (fwId: string, reason = 'Regulatory compliance template deprovisioning') => {
    const target = frameworks.find(f => f.id === fwId);
    if (!target) return;

    setFrameworks(prev => prev.filter(f => f.id !== fwId));

    await logChange(
      'FRAMEWORK_DELETED',
      target,
      null,
      `Purged and deleted regulatory standard framework checklist: ${target.code}. Reason: ${reason}`,
      fwId
    );
  };

  return (
    <FeatureToggleContext.Provider value={{
      modules,
      frameworks,
      toggleModuleState,
      toggleFeatureState,
      isModuleEnabled,
      isFeatureEnabled,
      isMenuEnabled,
      addModule,
      updateModule,
      deleteModule,
      addFramework,
      updateFramework,
      deleteFramework
    }}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

export const useFeatureToggles = () => {
  const context = useContext(FeatureToggleContext);
  if (context === undefined) {
    throw new Error('useFeatureToggles must be used within a FeatureToggleProvider');
  }
  return context;
};
