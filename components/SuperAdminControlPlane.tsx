import React, { useState, useEffect } from 'react';
import { useFeatureToggles, Module, Framework } from '../context/FeatureToggleContext';
import { dbAPI } from '../db';
import type { CompanyProfile, User } from '../types';
import { 
  Cpu, 
  Layers, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  Check, 
  X, 
  Building, 
  Activity, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Lock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuperAdminControlPlaneProps {
  currentUser: User;
  onAddAuditLog: (action: any, details: string, targetId?: string) => void;
}

export const SuperAdminControlPlane: React.FC<SuperAdminControlPlaneProps> = ({ currentUser, onAddAuditLog }) => {
  const {
    modules,
    frameworks,
    toggleModuleState,
    toggleFeatureState,
    addModule,
    updateModule,
    deleteModule,
    addFramework,
    updateFramework,
    deleteFramework
  } = useFeatureToggles();

  const [activeSubTab, setActiveSubTab] = useState<'modules' | 'frameworks' | 'customers' | 'ledger'>('modules');
  const [customers, setCustomers] = useState<CompanyProfile[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal forms states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleFormType, setModuleFormType] = useState<'create' | 'edit'>('create');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    name: '',
    version: 'v1.0.0',
    status: 'Enabled' as Module['status'],
    billingModel: 'Subscription' as Module['billingModel']
  });

  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState(false);
  const [frameworkFormType, setFrameworkFormType] = useState<'create' | 'edit'>('create');
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [frameworkForm, setFrameworkForm] = useState({
    name: '',
    code: '',
    version: '2026-v1',
    controlsCount: 50,
    status: 'Enabled' as Framework['status']
  });

  const [reason, setReason] = useState('Super Admin Configuration Update');

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setIsLoading(true);
    try {
      const allCos = await dbAPI.getAllCompanies();
      setCustomers(allCos);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // CRUD MODULE ACTIONS
  const handleOpenModuleCreate = () => {
    setModuleFormType('create');
    setModuleForm({ name: '', version: 'v1.0.0', status: 'Enabled', billingModel: 'Subscription' });
    setReason('Provisioning new platform module');
    setIsModuleModalOpen(true);
  };

  const handleOpenModuleEdit = (mod: Module) => {
    setModuleFormType('edit');
    setSelectedModule(mod);
    setModuleForm({
      name: mod.name,
      version: mod.version,
      status: mod.status,
      billingModel: mod.billingModel
    });
    setReason('Updating module configuration');
    setIsModuleModalOpen(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) return;

    try {
      if (moduleFormType === 'create') {
        await addModule({
          name: moduleForm.name,
          version: moduleForm.version,
          status: moduleForm.status,
          enabled: moduleForm.status === 'Enabled' || moduleForm.status === 'Read Only',
          billingModel: moduleForm.billingModel,
          features: [
            { id: `feat-${Date.now()}-1`, name: 'Standard Interactive Dashboard', status: 'Enabled' },
            { id: `feat-${Date.now()}-2`, name: 'Audit Compliance Node', status: 'Enabled' }
          ]
        }, reason);
        showStatus(`Module "${moduleForm.name}" created successfully.`, 'success');
      } else if (moduleFormType === 'edit' && selectedModule) {
        await updateModule({
          ...selectedModule,
          name: moduleForm.name,
          version: moduleForm.version,
          status: moduleForm.status,
          enabled: moduleForm.status === 'Enabled' || moduleForm.status === 'Read Only',
          billingModel: moduleForm.billingModel
        }, reason);
        showStatus(`Module "${moduleForm.name}" updated successfully.`, 'success');
      }
      setIsModuleModalOpen(false);
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteModule = async (moduleId: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete module "${name}"? This is destructive and non-reversible.`)) return;
    try {
      await deleteModule(moduleId, `Decommissioning of module ${name}`);
      showStatus(`Module "${name}" successfully deleted.`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Deletion failed', 'error');
    }
  };

  // CRUD FRAMEWORK ACTIONS
  const handleOpenFrameworkCreate = () => {
    setFrameworkFormType('create');
    setFrameworkForm({ name: '', code: '', version: '2026-v1', controlsCount: 50, status: 'Enabled' });
    setReason('Registering new national regulatory framework standard');
    setIsFrameworkModalOpen(true);
  };

  const handleOpenFrameworkEdit = (fw: Framework) => {
    setFrameworkFormType('edit');
    setSelectedFramework(fw);
    setFrameworkForm({
      name: fw.name,
      code: fw.code,
      version: fw.version,
      controlsCount: fw.controlsCount,
      status: fw.status
    });
    setReason('Updating framework checklist specification');
    setIsFrameworkModalOpen(true);
  };

  const handleFrameworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameworkForm.name.trim() || !frameworkForm.code.trim()) return;

    try {
      if (frameworkFormType === 'create') {
        await addFramework({
          name: frameworkForm.name,
          code: frameworkForm.code,
          version: frameworkForm.version,
          controlsCount: Number(frameworkForm.controlsCount),
          status: frameworkForm.status
        }, reason);
        showStatus(`Framework standard "${frameworkForm.code}" instantiated successfully.`, 'success');
      } else if (frameworkFormType === 'edit' && selectedFramework) {
        await updateFramework({
          ...selectedFramework,
          name: frameworkForm.name,
          code: frameworkForm.code,
          version: frameworkForm.version,
          controlsCount: Number(frameworkForm.controlsCount),
          status: frameworkForm.status
        }, reason);
        showStatus(`Framework standard "${frameworkForm.code}" updated successfully.`, 'success');
      }
      setIsFrameworkModalOpen(false);
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteFramework = async (id: string, code: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the "${code}" compliance framework? All controls will be purged.`)) return;
    try {
      await deleteFramework(id, `Regulatory checklist deprovision: ${code}`);
      showStatus(`Framework template "${code}" deleted.`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Deletion failed', 'error');
    }
  };

  // Filter lists
  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFrameworks = frameworks.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Active Modules</span>
            <span className="text-2xl font-semibold text-slate-800 dark:text-white mt-1 block">
              {modules.filter(m => m.status === 'Enabled' || m.status === 'Read Only').length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Core Features</span>
            <span className="text-2xl font-semibold text-slate-800 dark:text-white mt-1 block">
              {modules.reduce((sum, m) => sum + m.features.length, 0)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">National Standards</span>
            <span className="text-2xl font-semibold text-slate-800 dark:text-white mt-1 block">
              {frameworks.length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Customer Tenants</span>
            <span className="text-2xl font-semibold text-slate-800 dark:text-white mt-1 block">
              {customers.length || 5}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Inner Navigation for Control Plane */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Controls Column */}
        <div className="w-full">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header / Sub Tabs */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 gap-4">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveSubTab('modules')}
                  className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all flex items-center gap-1.5 ${activeSubTab === 'modules' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Cpu className="w-3.5 h-3.5" /> Subsystems &amp; Toggles
                </button>
                <button
                  onClick={() => setActiveSubTab('frameworks')}
                  className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all flex items-center gap-1.5 ${activeSubTab === 'frameworks' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Framework Templates
                </button>
                <button
                  onClick={() => setActiveSubTab('customers')}
                  className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all flex items-center gap-1.5 ${activeSubTab === 'customers' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Building className="w-3.5 h-3.5" /> Customer Tenants
                </button>
              </div>

              {/* Action and Search Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search registry node..."
                    className="w-full sm:w-48 pl-8 pr-3 py-1 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {activeSubTab === 'modules' && (
                  <button
                    onClick={handleOpenModuleCreate}
                    className="px-2.5 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white font-normal rounded-md flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                )}

                {activeSubTab === 'frameworks' && (
                  <button
                    onClick={handleOpenFrameworkCreate}
                    className="px-2.5 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white font-normal rounded-md flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Framework
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {/* 1. Modules and Entitlement Manager */}
                {activeSubTab === 'modules' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    {filteredModules.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-xl">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-normal">No modules found matching search criteria.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {filteredModules.map((mod) => (
                          <div
                            key={mod.moduleId}
                            className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 bg-white dark:bg-slate-900/50 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              {/* Header details */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">{mod.name}</h3>
                                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                                      {mod.version}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono">ID: {mod.moduleId} &bull; Model: {mod.billingModel}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenModuleEdit(mod)}
                                    className="p-1 text-slate-400 hover:text-teal-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    title="Edit Module Properties"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteModule(mod.moduleId, mod.name)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    title="Purge Module"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Runtime status toggle select */}
                              <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 dark:border-slate-800/80 pt-2.5">
                                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Subsystem State:</span>
                                <select
                                  value={mod.status}
                                  onChange={(e) => toggleModuleState(mod.moduleId, e.target.value as any, 'Super Admin manual control override')}
                                  className={`text-[10px] font-medium border rounded px-2 py-0.5 focus:outline-none ${
                                    mod.status === 'Enabled' 
                                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40' 
                                      : mod.status === 'Disabled' 
                                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40'
                                  }`}
                                >
                                  <option value="Enabled">Enabled</option>
                                  <option value="Read Only">Read Only</option>
                                  <option value="Hidden">Hidden</option>
                                  <option value="Disabled">Disabled</option>
                                  <option value="Archived">Archived</option>
                                </select>
                              </div>

                              {/* Feature toggles */}
                              <div className="mt-3.5 space-y-2">
                                <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sub-Feature Entitlements</h4>
                                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                                  {mod.features.map((feat) => {
                                    const isFeatEnabled = feat.status === 'Enabled';
                                    return (
                                      <div key={feat.id} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-300 font-normal">{feat.name}</span>
                                        <button
                                          onClick={() => toggleFeatureState(mod.moduleId, feat.id, !isFeatEnabled, 'Super Admin toggled feature entitlement')}
                                          className={`focus:outline-none transition-colors ${isFeatEnabled ? 'text-teal-600 dark:text-teal-400' : 'text-gray-300 dark:text-gray-700'}`}
                                        >
                                          {isFeatEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-3 text-right pt-2 border-t border-slate-50 dark:border-slate-800">
                              Deployed: {new Date(mod.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. Frameworks & Template Registry */}
                {activeSubTab === 'frameworks' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-normal border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3.5 font-semibold">Framework Standard</th>
                            <th className="p-3.5 font-semibold">Code Key</th>
                            <th className="p-3.5 font-semibold">Revision Version</th>
                            <th className="p-3.5 font-semibold text-center">Control Nodes</th>
                            <th className="p-3.5 font-semibold">Status</th>
                            <th className="p-3.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                          {filteredFrameworks.map((fw) => (
                            <tr key={fw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-xs text-slate-700 dark:text-slate-300 transition-colors">
                              <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">{fw.name}</td>
                              <td className="p-3.5 font-mono font-semibold text-teal-600 dark:text-teal-400">{fw.code}</td>
                              <td className="p-3.5 font-mono">{fw.version}</td>
                              <td className="p-3.5 text-center font-mono">{fw.controlsCount} nodes</td>
                              <td className="p-3.5">
                                <select
                                  value={fw.status}
                                  onChange={(e) => updateFramework({ ...fw, status: e.target.value as any }, 'Super Admin toggled framework standard state')}
                                  className={`text-[10px] font-medium border rounded px-2 py-0.5 focus:outline-none ${
                                    fw.status === 'Enabled' 
                                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40' 
                                      : fw.status === 'Disabled' 
                                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40'
                                  }`}
                                >
                                  <option value="Enabled">Enabled</option>
                                  <option value="Read Only">Read Only</option>
                                  <option value="Disabled">Disabled</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenFrameworkEdit(fw)}
                                  className="p-1 hover:text-teal-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  title="Edit Template Checklists"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFramework(fw.id, fw.code)}
                                  className="p-1 hover:text-red-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  title="Purge Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* 3. Customer Entities / Tenants Manager */}
                {activeSubTab === 'customers' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3 bg-white dark:bg-slate-900/50 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">{cust.name}</h3>
                                <p className="text-[10px] text-slate-400 font-mono">Node ID: {cust.id}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                cust.license?.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                              }`}>
                                {cust.license?.status || 'inactive'}
                              </span>
                            </div>

                            <div className="mt-3.5 space-y-2 text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subscription Tier:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200 capitalize">{cust.license?.tier || 'trial'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">CISO Contact:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200">{cust.cisoName || 'Not Appointed'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Contract Expiration:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200">
                                  {cust.license?.expiresAt ? new Date(cust.license.expiresAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => {
                                const newTier = prompt('Change license tier (monthly/yearly/enterprise):', cust.license?.tier || 'yearly');
                                if (newTier) {
                                  dbAPI.updateLicense(cust.id, {
                                    key: cust.license?.key || 'LIC-NEW',
                                    status: 'active',
                                    tier: newTier as any,
                                    expiresAt: cust.license?.expiresAt || Date.now() + 365*24*60*60*1000
                                  });
                                  loadEntities();
                                  showStatus(`Subscription level for ${cust.name} modified to ${newTier}.`, 'success');
                                }
                              }}
                              className="flex-1 py-1 px-2 text-center text-[10px] border border-slate-200 dark:border-slate-800 hover:border-teal-500 rounded text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-all"
                            >
                              Adjust Entitlements
                            </button>
                            <button
                              onClick={() => {
                                const newDate = prompt('Adjust Expiration Date (YYYY-MM-DD):');
                                if (newDate) {
                                  dbAPI.updateLicense(cust.id, {
                                    key: cust.license?.key || 'LIC-NEW',
                                    status: 'active',
                                    tier: cust.license?.tier || 'yearly',
                                    expiresAt: new Date(newDate).getTime()
                                  });
                                  loadEntities();
                                  showStatus(`Billing timeline adjusted successfully for ${cust.name}.`, 'success');
                                }
                              }}
                              className="py-1 px-2 text-[10px] text-slate-400 hover:text-teal-600 border border-slate-100 dark:border-slate-800 rounded transition-all"
                              title="Override Chronology"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL WINDOWS FOR DYNAMIC METADATA CONTROLS */}
      
      {/* 1. MODULE CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsModuleModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-normal text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-600" /> 
                {moduleFormType === 'create' ? 'Hot-Deploy Platform Module' : 'Configure Module Properties'}
              </h2>

              <form onSubmit={handleModuleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Module Name</label>
                  <input
                    type="text"
                    required
                    value={moduleForm.name}
                    onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                    placeholder="e.g. Risk Assessment Engine"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Version Release</label>
                    <input
                      type="text"
                      required
                      value={moduleForm.version}
                      onChange={(e) => setModuleForm({ ...moduleForm, version: e.target.value })}
                      placeholder="e.g. v1.0.0"
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Billing Tier</label>
                    <select
                      value={moduleForm.billingModel}
                      onChange={(e) => setModuleForm({ ...moduleForm, billingModel: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Subscription">Subscription</option>
                      <option value="Pay As You Go">Pay As You Go</option>
                      <option value="Consumption">Consumption</option>
                      <option value="Seat Based">Seat Based</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lifecycle Status</label>
                  <select
                    value={moduleForm.status}
                    onChange={(e) => setModuleForm({ ...moduleForm, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Enabled">Enabled</option>
                    <option value="Read Only">Read Only</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Regulatory Change Authority Reason (Audit Ledger)</label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter compliance authorization details..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 h-20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> 
                    {moduleFormType === 'create' ? 'Instantiate Subsystem' : 'Save Adjustments'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. FRAMEWORK CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isFrameworkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsFrameworkModalOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-normal text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> 
                {frameworkFormType === 'create' ? 'Ingest Regulatory Standard' : 'Configure Compliance Spec'}
              </h2>

              <form onSubmit={handleFrameworkSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Standard Full Name</label>
                  <input
                    type="text"
                    required
                    value={frameworkForm.name}
                    onChange={(e) => setFrameworkForm({ ...frameworkForm, name: e.target.value })}
                    placeholder="e.g. SAMA Cybersecurity Framework"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Standard Code</label>
                    <input
                      type="text"
                      required
                      value={frameworkForm.code}
                      onChange={(e) => setFrameworkForm({ ...frameworkForm, code: e.target.value })}
                      placeholder="e.g. SAMA CSF"
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Framework Revision</label>
                    <input
                      type="text"
                      required
                      value={frameworkForm.version}
                      onChange={(e) => setFrameworkForm({ ...frameworkForm, version: e.target.value })}
                      placeholder="e.g. v3.4"
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Control Nodes</label>
                    <input
                      type="number"
                      required
                      value={frameworkForm.controlsCount}
                      onChange={(e) => setFrameworkForm({ ...frameworkForm, controlsCount: Number(e.target.value) })}
                      placeholder="e.g. 114"
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ingest Status</label>
                    <select
                      value={frameworkForm.status}
                      onChange={(e) => setFrameworkForm({ ...frameworkForm, status: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Enabled">Enabled</option>
                      <option value="Read Only">Read Only</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Regulatory Change Authority Reason (Audit Ledger)</label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter compliance authorization details..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 h-20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFrameworkModalOpen(false)}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> 
                    {frameworkFormType === 'create' ? 'Ingest Standard' : 'Save Adjustments'}
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
