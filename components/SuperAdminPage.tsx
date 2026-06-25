import React, { useState, useEffect } from 'react';
import { dbAPI } from '../db';
import type { CompanyProfile, User, License } from '../types';
import { 
    Building, 
    Key, 
    Users, 
    Calendar, 
    AlertCircle, 
    RefreshCw, 
    BarChart2, 
    Trash2, 
    Check, 
    Plus, 
    Shield, 
    ShieldCheck, 
    Search, 
    Mail, 
    Lock, 
    CheckSquare, 
    UserPlus, 
    Sliders,
    Zap,
    Cpu,
    Sparkles,
    Database,
    Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { SuperAdminControlPlane } from './SuperAdminControlPlane';

interface SuperAdminPageProps {
    currentUser: User;
    forceLocalLLM?: boolean;
    onToggleLocalLLM?: () => void;
    addAuditLog?: (action: any, details: string, targetId?: string) => void;
}

type AdminTab = 'controlPlane' | 'provisioning' | 'licenses' | 'users' | 'companies' | 'subscriptions' | 'rbac' | 'iam' | 'sovereign' | 'modules' | 'frameworks' | 'builders' | 'dashboards' | 'billing' | 'emergency';

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ currentUser, forceLocalLLM = false, onToggleLocalLLM, addAuditLog }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('controlPlane');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Master Data States
    const [allCompanies, setAllCompanies] = useState<CompanyProfile[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [standaloneLicenses, setStandaloneLicenses] = useState<License[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Provisioning State
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [subscriptionTier, setSubscriptionTier] = useState<License['tier']>('yearly');

    // Standalone Generator State
    const [generatedKey, setGeneratedKey] = useState('');
    const [generatorTier, setGeneratorTier] = useState<License['tier']>('yearly');

    // Auth & User Editors State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CISO' as User['role'],
        companyId: '',
        isVerified: true,
        mfaEnabled: false,
    });

    // License Assignment State
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedLicenseKey, setSelectedLicenseKey] = useState('');

    // Renewal Direct Adjustment State
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [renewCompany, setRenewCompany] = useState<CompanyProfile | null>(null);
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewTier, setRenewTier] = useState<License['tier']>('yearly');
    const [isDueDiligenceModalOpen, setIsDueDiligenceModalOpen] = useState(false);
    const [isTechnicalAuditModalOpen, setIsTechnicalAuditModalOpen] = useState(false);

    // Dynamic Control Plane State Extensions
    const [modules, setModules] = useState([
        {
            moduleId: 'mod-grc',
            name: 'GRC Core Assessment',
            version: 'v2.4.1',
            status: 'Enabled' as 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived',
            enabled: true,
            billingModel: 'Subscription' as const,
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
            status: 'Enabled' as 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived',
            enabled: true,
            billingModel: 'Pay As You Go' as const,
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
            status: 'Enabled' as 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived',
            enabled: true,
            billingModel: 'Consumption' as const,
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
            status: 'Enabled' as 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived',
            enabled: true,
            billingModel: 'Seat Based' as const,
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
            status: 'Disabled' as 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived',
            enabled: false,
            billingModel: 'Subscription' as const,
            createdBy: 'aaroomi@gmail.com',
            createdAt: '2026-05-12T11:45:00Z',
            features: [
                { id: 'feat-bia', name: 'Business Impact Analysis (BIA)', status: 'Disabled' },
                { id: 'feat-dr-plan', name: 'Disaster Recovery Playbook', status: 'Disabled' }
            ]
        }
    ]);

    const [frameworks, setFrameworks] = useState([
        { id: 'fw-ecc', name: 'NCA Essential Cybersecurity Controls', code: 'NCA ECC', version: '2018-1-1', controlsCount: 114, status: 'Enabled' as const },
        { id: 'fw-cscc', name: 'NCA Critical Systems Cybersecurity Controls', code: 'NCA CSCC', version: '2019-1', controlsCount: 89, status: 'Enabled' as const },
        { id: 'fw-sama', name: 'SAMA Cybersecurity Framework', code: 'SAMA CSF', version: 'v3.4', controlsCount: 56, status: 'Enabled' as const },
        { id: 'fw-pdpl', name: 'SDAIA Personal Data Protection Law', code: 'PDPL', version: 'v2-2023', controlsCount: 42, status: 'Enabled' as const },
        { id: 'fw-iso27001', name: 'ISO/IEC 27001 Information Security', code: 'ISO 27001', version: '2022', controlsCount: 93, status: 'Read Only' as const },
        { id: 'fw-nist-ai', name: 'NIST Artificial Intelligence Risk Management', code: 'NIST AI RMF', version: 'v1.0', controlsCount: 38, status: 'Enabled' as const }
    ]);

    const [workflows, setWorkflows] = useState([
        { id: 'wf-1', name: 'Critical Vulnerability Escalation Workflow', trigger: 'Security Alert Level > 80%', targetRole: 'CISO', stepsCount: 4, status: 'Active' as const, version: 'v1.0' },
        { id: 'wf-2', name: 'Quarterly Audit Evidence Approval Workflow', trigger: 'Evidence Upload', targetRole: 'Auditor', stepsCount: 3, status: 'Active' as const, version: 'v1.2' },
        { id: 'wf-3', name: 'MFA Non-Compliance Advisory Auto-Send', trigger: 'User Login Failed Mfa', targetRole: 'ComplianceOfficer', stepsCount: 2, status: 'Draft' as const, version: 'v0.9' }
    ]);

    const [forms, setForms] = useState([
        {
            id: 'form-risk',
            formName: 'Enterprise Risk Intake Form',
            targetModule: 'Risk Management Engine',
            fields: [
                { id: 'f-1', label: 'Risk Identifier / Name', name: 'riskName', type: 'text' as const, required: true, validation: 'Min 4 chars' },
                { id: 'f-2', label: 'Inherent Likelihood (1-5)', name: 'likelihood', type: 'number' as const, required: true, validation: 'Range 1-5' },
                { id: 'f-3', label: 'Inherent Impact (1-5)', name: 'impact', type: 'number' as const, required: true, validation: 'Range 1-5' },
                { id: 'f-4', label: 'Mitigation Strategy Description', name: 'mitigation', type: 'textarea' as const, required: false, validation: 'Optional text' }
            ]
        },
        {
            id: 'form-asset',
            formName: 'Asset Inventory Registry Intake',
            targetModule: 'GRC Core Assessment',
            fields: [
                { id: 'f-5', label: 'Asset Name / URI', name: 'assetName', type: 'text' as const, required: true, validation: 'Required' },
                { id: 'f-6', label: 'Asset Classification', name: 'classification', type: 'select' as const, required: true, validation: 'Value: High, Medium, Low' },
                { id: 'f-7', label: 'Sovereign Physical Region', name: 'region', type: 'select' as const, required: true, validation: 'Value: Dammam, Riyadh' }
            ]
        }
    ]);

    const [widgets, setWidgets] = useState([
        { id: 'wdg-1', name: 'Compliance Framework Scorecard Gauge', type: 'gauge' as const, enabled: true, roleRequired: 'ALL', category: 'Compliance Overview' },
        { id: 'wdg-2', name: 'Enterprise Risk Heatmap Matrix', type: 'chart' as const, enabled: true, roleRequired: 'CISO', category: 'Risk Assessment' },
        { id: 'wdg-3', name: 'Sovereign Cloud Data Residency Telemetry', type: 'list' as const, enabled: true, roleRequired: 'CIO', category: 'Infrastructure Governance' },
        { id: 'wdg-4', name: 'Active VAPT Penetration Scan Stream', type: 'chart' as const, enabled: false, roleRequired: 'CISO', category: 'Threat Vulnerability' },
        { id: 'wdg-5', name: 'Audit Log Action Feed Ledger', type: 'list' as const, enabled: true, roleRequired: 'Auditor', category: 'Compliance Evidence' }
    ]);

    const [billingPlans, setBillingPlans] = useState([
        { id: 'plan-starter', name: 'Sovereign Starter', price: 1500, period: 'monthly' as const, billingModel: 'Pay As You Go', modulesIncluded: ['mod-grc'] },
        { id: 'plan-pro', name: 'Corporate Compliance Pro', price: 5400, period: 'monthly' as const, billingModel: 'Seat Based', modulesIncluded: ['mod-grc', 'mod-risk', 'mod-vapt'] },
        { id: 'plan-sovereign', name: 'Enterprise Sovereign Suite', price: 18500, period: 'monthly' as const, billingModel: 'Enterprise', modulesIncluded: ['mod-grc', 'mod-risk', 'mod-vapt', 'mod-ai-gov'] }
    ]);

    const [killSwitches, setKillSwitches] = useState({
        platform: false,
        ai: false,
        integrations: false,
        apis: false,
        billing: false
    });

    const [customAuditLogs, setCustomAuditLogs] = useState([
        { id: 'audit-1', user: 'aaroomi@gmail.com', role: 'SUPER_ADMIN', action: 'INIT_SOVEREIGN_REGISTRY', prevValue: 'None', newValue: 'Google Cloud Dammam Region Vault Active', ip: '185.120.34.89', device: 'macOS Chrome 124', timestamp: '2026-06-25T01:15:30Z', reason: 'Routine regional initialization' },
        { id: 'audit-2', user: 'aaroomi@gmail.com', role: 'SUPER_ADMIN', action: 'DEPLOY_NCA_ECC_TEMPLATE', prevValue: 'v1.0-draft', newValue: 'v1.1-active', ip: '185.120.34.89', device: 'macOS Chrome 124', timestamp: '2026-06-25T01:28:12Z', reason: 'National Security Directive 109 Compliance' },
        { id: 'audit-3', user: 'aaroomi@gmail.com', role: 'SUPER_ADMIN', action: 'TOGGLE_MODULE_STATE', prevValue: 'Enabled', newValue: 'Read Only', ip: '185.120.34.89', device: 'macOS Chrome 124', timestamp: '2026-06-25T01:45:00Z', reason: 'Scheduled security audit freeze' }
    ]);

    // Modal creation states
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [moduleForm, setModuleForm] = useState({ name: '', version: '', billingModel: 'Subscription' as any });
    const [isCreateFrameworkOpen, setIsCreateFrameworkOpen] = useState(false);
    const [frameworkForm, setFrameworkForm] = useState({ name: '', code: '', version: '', controlsCount: 50 });
    const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
    const [workflowForm, setWorkflowForm] = useState({ name: '', trigger: '', targetRole: 'CISO' });
    const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
    const [planForm, setPlanForm] = useState({ name: '', price: 2000, period: 'monthly' as any, billingModel: 'Seat Based' });
    const [auditLogSearch, setAuditLogSearch] = useState('');

    useEffect(() => {
        loadAllData();
    }, [activeTab]);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [companies, users, standalones] = await Promise.all([
                dbAPI.getAllCompanies(),
                dbAPI.getAllUsers(),
                dbAPI.getStandaloneLicenses()
            ]);
            setAllCompanies(companies);
            setAllUsers(users);
            setStandaloneLicenses(standalones || []);
        } catch (e) {
            console.warn("Super Admin background restore warn: ", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProvisioningSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const expiresAt = calculateExpiration(subscriptionTier);

        const licenseData: License = {
            key: `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'active',
            tier: subscriptionTier,
            expiresAt: expiresAt
        };

        const companyData = {
            name: companyName,
            logo: '', ceoName: '', cioName: '', cisoName: '', ctoName: '',
        };

        const adminData = {
            name: adminName,
            email: adminEmail,
            password: adminPassword
        };

        try {
            await dbAPI.createCompanySystem(companyData, adminData, licenseData);
            setMessage({ text: `Successfully created company "${companyName}" and administrator account "${adminEmail}".`, type: 'success' });
            setCompanyName(''); 
            setAdminName(''); 
            setAdminEmail(''); 
            setAdminPassword('');
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to provision workspace system.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateKeyHandler = async () => {
        const key = `SA-KEY-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
        setGeneratedKey(key);

        const newLicense: License = {
            key: key,
            tier: generatorTier,
            status: 'active',
            expiresAt: calculateExpiration(generatorTier)
        };

        const currentStandalones = [...standaloneLicenses, newLicense];
        setStandaloneLicenses(currentStandalones);
        await dbAPI.saveStandaloneLicenses(currentStandalones);
        setMessage({ text: `STANDALONE LICENCE KEY "${key}" SUCCESSFULLY PERSISTED TO SECURE REGISTRY.`, type: 'success' });
    };

    const deleteStandaloneLicense = async (key: string) => {
        if (!confirm("Are you sure you want to delete this standalone license key?")) return;
        const filtered = standaloneLicenses.filter(l => l.key !== key);
        setStandaloneLicenses(filtered);
        await dbAPI.saveStandaloneLicenses(filtered);
        setMessage({ text: `License key registry successfully updated.`, type: 'success' });
    };

    const assignLicenseToCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompanyId || !selectedLicenseKey) {
            setMessage({ text: "Please select both target company and Standalone code.", type: 'error' });
            return;
        }

        const comp = allCompanies.find(c => c.id === selectedCompanyId);
        const lic = standaloneLicenses.find(l => l.key === selectedLicenseKey);

        if (!comp || !lic) {
            setMessage({ text: "Selection mismatch. Please verify profiles.", type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            // Update company with our registry code
            const updatedLicense: License = { ...lic };
            await dbAPI.updateLicense(selectedCompanyId, updatedLicense);

            // Strip the code from standalone directory
            const filteredLicenses = standaloneLicenses.filter(l => l.key !== selectedLicenseKey);
            setStandaloneLicenses(filteredLicenses);
            await dbAPI.saveStandaloneLicenses(filteredLicenses);

            setMessage({ text: `Standalone License safely associated to company "${comp.name}".`, type: 'success' });
            setSelectedCompanyId('');
            setSelectedLicenseKey('');
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to link subscription key.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateExpiration = (tier: License['tier'], customMonths?: number): number => {
        const now = new Date();
        if (customMonths) {
            return new Date(now.setMonth(now.getMonth() + customMonths)).getTime();
        }
        let months = 12;
        if (tier === 'monthly') months = 1;
        if (tier === 'quarterly') months = 3;
        if (tier === 'semi-annually') months = 6;
        if (tier === 'trial') months = 0.25;
        return new Date(now.setMonth(now.getMonth() + months)).getTime();
    };

    // User Auth Actions
    const handleOpenUserModal = (user: User | null) => {
        if (user) {
            setTargetUser(user);
            setUserForm({
                name: user.name,
                email: user.email,
                password: '', // blank by default unless super admin resets
                role: user.role,
                companyId: user.companyId || '',
                isVerified: user.isVerified ?? true,
                mfaEnabled: user.mfaEnabled ?? false,
            });
        } else {
            setTargetUser(null);
            setUserForm({
                name: '',
                email: '',
                password: '',
                role: 'CISO',
                companyId: allCompanies[0]?.id || '',
                isVerified: true,
                mfaEnabled: false,
            });
        }
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (targetUser) {
                // Update Existing User & Auth settings
                const updatedUser: User = {
                    ...targetUser,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    companyId: userForm.companyId || undefined,
                    isVerified: userForm.isVerified,
                    mfaEnabled: userForm.mfaEnabled,
                };
                if (userForm.password.trim().length >= 6) {
                    updatedUser.password = userForm.password;
                }
                await dbAPI.updateUser(updatedUser);
                setMessage({ text: `User profile "${userForm.email}" updated successfully.`, type: 'success' });
            } else {
                // Register Brand New User
                const newUser: User = {
                    id: `user-${Date.now()}`,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    companyId: userForm.companyId || undefined,
                    isVerified: userForm.isVerified,
                    mfaEnabled: userForm.mfaEnabled,
                    password: userForm.password || 'temp-pass-123'
                };
                await dbAPI.createUser(newUser, userForm.companyId);
                setMessage({ text: `New user "${userForm.email}" successfully provisioned and linked.`, type: 'success' });
            }
            setIsUserModalOpen(false);
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Could not commit user master record.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserVerification = async (user: User) => {
        setIsLoading(true);
        try {
            const updated = { ...user, isVerified: !user.isVerified };
            await dbAPI.updateUser(updated);
            setMessage({ text: `Auth status updated: verified=${updated.isVerified}`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to toggle email verification state.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserMfa = async (user: User) => {
        setIsLoading(true);
        try {
            const updated = { ...user, mfaEnabled: !user.mfaEnabled };
            await dbAPI.updateUser(updated);
            setMessage({ text: `MFA bypass state updated: mfaEnabled=${updated.mfaEnabled}`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to toggle MFA status.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUserRecord = async (user: User) => {
        if (!confirm(`Are you absolutely sure you want to delete user ${user.name} (${user.email})?`)) return;
        setIsLoading(true);
        try {
            await dbAPI.deleteUser(user.id);
            setMessage({ text: `Successfully terminated user credentials record.`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to delete user.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const sendResetLink = async (email: string) => {
        try {
            await dbAPI.sendPasswordResetLink(email);
            setMessage({ text: `Password recovery reset request issued to "${email}".`, type: 'success' });
        } catch (e: any) {
            setMessage({ text: e.message || "Could not dispatch reset email link.", type: 'error' });
        }
    };

    // Renew Co Subscription
    const handleOpenRenewal = (company: CompanyProfile) => {
        setRenewCompany(company);
        setRenewTier(company.license?.tier || 'yearly');
        setRenewMonths(12);
        setIsRenewalModalOpen(true);
    };

    const handleExecuteRenewal = async () => {
        if (!renewCompany) return;
        setIsLoading(true);
        try {
            const currentLicense = renewCompany.license;
            const newExpiry = calculateExpiration(renewTier, renewMonths);
            
            const updatedLicense: License = {
                key: currentLicense?.key || `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                status: 'active',
                tier: renewTier,
                expiresAt: newExpiry
            };

            await dbAPI.updateLicense(renewCompany.id, updatedLicense);
            setMessage({ text: `Renewed subscription for "${renewCompany.name}". New Expiry: ${new Date(newExpiry).toLocaleDateString()}`, type: 'success' });
            setIsRenewalModalOpen(false);
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to renew company subscription.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateSubscription = async (company: CompanyProfile) => {
        if (!confirm(`Are you sure you want to deactivate and hold client organization "${company.name}"?`)) return;
        setIsLoading(true);
        try {
            const currentLicense = company.license;
            const updatedLicense: License = {
                key: currentLicense?.key || 'EXPIRED-LIC',
                status: 'expired',
                tier: currentLicense?.tier || 'trial',
                expiresAt: Date.now() // expires instantly
            };
            await dbAPI.updateLicense(company.id, updatedLicense);
            setMessage({ text: `Subscription on hold for "${company.name}".`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to deactivate subscription.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Dynamic Control Plane Orchestration Handlers ---
    const logControlPlaneAction = (action: string, prevValue: string, newValue: string, reason: string) => {
        const newLog = {
            id: `audit-${Date.now()}`,
            user: currentUser?.email || 'aaroomi@gmail.com',
            role: 'SUPER_ADMIN',
            action,
            prevValue,
            newValue,
            ip: '185.120.34.89',
            device: 'macOS Chrome 124',
            timestamp: new Date().toISOString(),
            reason
        };
        setCustomAuditLogs(prev => [newLog, ...prev]);
    };

    const handleToggleModuleStatus = (moduleId: string, newStatus: any) => {
        const targetModule = modules.find(m => m.moduleId === moduleId);
        if (!targetModule) return;
        const prevStatus = targetModule.status;
        setModules(prev => prev.map(m => {
            if (m.moduleId === moduleId) {
                return { ...m, status: newStatus, enabled: newStatus === 'Enabled' || newStatus === 'Read Only' };
            }
            return m;
        }));
        logControlPlaneAction(
            'TOGGLE_MODULE_STATE',
            prevStatus,
            newStatus,
            `Operator manual state change of modular subsystem ${targetModule.name}`
        );
        setMessage({ text: `Module "${targetModule.name}" runtime status changed to ${newStatus}.`, type: 'success' });
    };

    const handleToggleFeatureStatus = (moduleId: string, featureId: string) => {
        const targetModule = modules.find(m => m.moduleId === moduleId);
        if (!targetModule) return;
        const targetFeature = targetModule.features.find(f => f.id === featureId);
        if (!targetFeature) return;
        const prevStatus = targetFeature.status;
        const newStatus = prevStatus === 'Enabled' ? 'Disabled' : 'Enabled';

        setModules(prev => prev.map(m => {
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
        }));

        logControlPlaneAction(
            'TOGGLE_FEATURE_ENTITLEMENT',
            prevStatus,
            newStatus,
            `Toggled sub-feature [${targetFeature.name}] in parent module [${targetModule.name}]`
        );
        setMessage({ text: `Feature "${targetFeature.name}" updated to ${newStatus}.`, type: 'success' });
    };

    const handleSaveNewModule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!moduleForm.name.trim()) return;
        const newMod = {
            moduleId: `mod-${Math.random().toString(36).substring(2, 8)}`,
            name: moduleForm.name,
            version: moduleForm.version || 'v1.0.0',
            status: 'Enabled' as const,
            enabled: true,
            billingModel: moduleForm.billingModel,
            createdBy: currentUser?.email || 'aaroomi@gmail.com',
            createdAt: new Date().toISOString(),
            features: [
                { id: `feat-${Date.now()}-1`, name: 'Base Dashboard Portal', status: 'Enabled' },
                { id: `feat-${Date.now()}-2`, name: 'AI Autocompletion Handler', status: 'Enabled' }
            ]
        };
        setModules(prev => [...prev, newMod]);
        logControlPlaneAction('INSTALL_NEW_MODULE', 'None', `${newMod.name} (${newMod.version})`, 'Dynamic hot deployment via Super Admin Console');
        setIsCreateModuleOpen(false);
        setModuleForm({ name: '', version: '', billingModel: 'Subscription' });
        setMessage({ text: `Subsystem module "${newMod.name}" successfully hot-registered onto platform registry.`, type: 'success' });
    };

    const handleSaveNewFramework = (e: React.FormEvent) => {
        e.preventDefault();
        if (!frameworkForm.name.trim()) return;
        const newFw = {
            id: `fw-${Math.random().toString(36).substring(2, 8)}`,
            name: frameworkForm.name,
            code: frameworkForm.code || 'CUSTOM',
            version: frameworkForm.version || 'v1.0',
            controlsCount: Number(frameworkForm.controlsCount) || 50,
            status: 'Enabled' as const
        };
        setFrameworks(prev => [...prev, newFw]);
        logControlPlaneAction('REGISTER_FRAMEWORK', 'None', `${newFw.code} (${newFw.version})`, 'Sovereign template registry expansion');
        setIsCreateFrameworkOpen(false);
        setFrameworkForm({ name: '', code: '', version: '', controlsCount: 50 });
        setMessage({ text: `Regulatory template "${newFw.name}" imported and mapped successfully.`, type: 'success' });
    };

    const handleImportFrameworkTemplate = (templateName: string, code: string, controls: number) => {
        const isExists = frameworks.some(fw => fw.code === code);
        if (isExists) {
            setMessage({ text: `Framework template "${code}" is already active in the sovereign registry.`, type: 'error' });
            return;
        }
        const newFw = {
            id: `fw-${Math.random().toString(36).substring(2, 8)}`,
            name: templateName,
            code,
            version: '2026-v1',
            controlsCount: controls,
            status: 'Enabled' as const
        };
        setFrameworks(prev => [...prev, newFw]);
        logControlPlaneAction('IMPORT_TEMPLATE', 'None', `${code}`, 'Pre-engineered compliance checklist mapping');
        setMessage({ text: `Successfully mapped ${controls} control nodes from "${code}" standard template.`, type: 'success' });
    };

    const handleCloneFramework = (fw: any) => {
        const cloned = {
            ...fw,
            id: `fw-${Math.random().toString(36).substring(2, 8)}`,
            name: `${fw.name} (Copy)`,
            code: `${fw.code}_CLONE`,
            version: `${fw.version}-copy`,
            status: 'Enabled' as const
        };
        setFrameworks(prev => [...prev, cloned]);
        logControlPlaneAction('CLONE_FRAMEWORK', fw.code, cloned.code, 'Cloned control structure for secondary auditing scope');
        setMessage({ text: `Framework "${fw.code}" successfully cloned as "${cloned.code}".`, type: 'success' });
    };

    const handleDeleteFramework = (id: string) => {
        const target = frameworks.find(f => f.id === id);
        if (!target) return;
        if (!confirm(`Are you absolutely sure you want to permanently purge compliance framework template "${target.code}"?`)) return;
        setFrameworks(prev => prev.filter(f => f.id !== id));
        logControlPlaneAction('PURGE_FRAMEWORK', target.code, 'Purged', 'Operator-driven template removal');
        setMessage({ text: `Compliance framework "${target.code}" removed from global registry.`, type: 'success' });
    };

    const handleSaveNewWorkflow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!workflowForm.name.trim()) return;
        const newWf = {
            id: `wf-${Math.random().toString(36).substring(2, 8)}`,
            name: workflowForm.name,
            trigger: workflowForm.trigger || 'Standard Asset Created',
            targetRole: workflowForm.targetRole,
            stepsCount: 3,
            status: 'Draft' as const,
            version: 'v1.0'
        };
        setWorkflows(prev => [...prev, newWf]);
        logControlPlaneAction('CREATE_WORKFLOW_TEMPLATE', 'None', newWf.name, 'Dynamic workflow pipeline mapping');
        setIsCreateWorkflowOpen(false);
        setWorkflowForm({ name: '', trigger: '', targetRole: 'CISO' });
        setMessage({ text: `Automated workflow policy "${newWf.name}" drafted.`, type: 'success' });
    };

    const handleToggleWorkflow = (id: string) => {
        setWorkflows(prev => prev.map(w => {
            if (w.id === id) {
                const nextStatus = w.status === 'Active' ? 'Paused' as const : 'Active' as const;
                logControlPlaneAction('TOGGLE_WORKFLOW', w.status, nextStatus, `State toggle for dynamic compliance pipeline: ${w.name}`);
                return { ...w, status: nextStatus };
            }
            return w;
        }));
    };

    const handleAddFormField = (formId: string) => {
        const label = prompt("Enter field label (e.g., 'Evidence File Hash'):");
        if (!label) return;
        const name = label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const typeInput = prompt("Enter type ('text', 'number', 'select', 'textarea'):", "text");
        const type = ['text', 'number', 'select', 'textarea'].includes(typeInput || '') ? (typeInput as any) : 'text';

        setForms(prev => prev.map(f => {
            if (f.id === formId) {
                const updatedFields = [
                    ...f.fields,
                    { id: `f-${Date.now()}`, label, name, type, required: true, validation: 'Required' }
                ];
                logControlPlaneAction('ADD_FORM_FIELD', `${f.fields.length} fields`, `${updatedFields.length} fields`, `Appended custom field [${label}] to form [${f.formName}]`);
                return { ...f, fields: updatedFields };
            }
            return f;
        }));
        setMessage({ text: `Appended input schema field "${label}" onto form template.`, type: 'success' });
    };

    const handleDeleteFormField = (formId: string, fieldId: string) => {
        setForms(prev => prev.map(f => {
            if (f.id === formId) {
                const targetField = f.fields.find(fld => fld.id === fieldId);
                const updatedFields = f.fields.filter(fld => fld.id !== fieldId);
                logControlPlaneAction('REMOVE_FORM_FIELD', targetField?.label || 'Unknown', 'Removed', `Deleted schema field from form [${f.formName}]`);
                return { ...f, fields: updatedFields };
            }
            return f;
        }));
        setMessage({ text: `Schema input field deleted.`, type: 'success' });
    };

    const handleToggleWidget = (id: string) => {
        setWidgets(prev => prev.map(w => {
            if (w.id === id) {
                const nextVal = !w.enabled;
                logControlPlaneAction('TOGGLE_DASHBOARD_WIDGET', w.enabled ? 'Enabled' : 'Disabled', nextVal ? 'Enabled' : 'Disabled', `Toggled executive panel widget display visibility: ${w.name}`);
                return { ...w, enabled: nextVal };
            }
            return w;
        }));
    };

    const handleUpdateWidgetRole = (id: string, role: string) => {
        setWidgets(prev => prev.map(w => {
            if (w.id === id) {
                logControlPlaneAction('UPDATE_WIDGET_RBAC', w.roleRequired, role, `Restricted visualization scope of widget [${w.name}] to role: ${role}`);
                return { ...w, roleRequired: role };
            }
            return w;
        }));
        setMessage({ text: `Dashboard panel widget RBAC restriction modified.`, type: 'success' });
    };

    const handleSaveNewPlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!planForm.name.trim()) return;
        const newPlan = {
            id: `plan-${Math.random().toString(36).substring(2, 8)}`,
            name: planForm.name,
            price: Number(planForm.price) || 2000,
            period: planForm.period,
            billingModel: planForm.billingModel,
            modulesIncluded: ['mod-grc']
        };
        setBillingPlans(prev => [...prev, newPlan]);
        logControlPlaneAction('ADD_BILLING_TIER', 'None', `${newPlan.name} ($${newPlan.price})`, 'Created subscription pricing level');
        setIsCreatePlanOpen(false);
        setPlanForm({ name: '', price: 2000, period: 'monthly', billingModel: 'Seat Based' });
        setMessage({ text: `Dynamic monetization level "${newPlan.name}" deployed.`, type: 'success' });
    };

    const handleOverrideCustomerPrice = (companyName: string) => {
        const rateStr = prompt(`Override active billable monthly contract price for "${companyName}":`, "3500");
        if (!rateStr) return;
        const rate = Number(rateStr);
        if (isNaN(rate)) {
            setMessage({ text: "Invalid price format.", type: 'error' });
            return;
        }
        logControlPlaneAction('MANUAL_PRICE_OVERRIDE', 'Standard Contract Price', `$${rate}/mo`, `Special enterprise exception price override for client: ${companyName}`);
        setMessage({ text: `Manual contract price overridden to $${rate}/month for "${companyName}". Invoice generated on next cron-job tick.`, type: 'success' });
    };

    const handleToggleKillSwitch = (key: keyof typeof killSwitches) => {
        const nextVal = !killSwitches[key];
        setKillSwitches(prev => ({ ...prev, [key]: nextVal }));
        logControlPlaneAction(
            nextVal ? 'EMERGENCY_KILL_TRIGGERED' : 'EMERGENCY_RESET_ISSUED',
            !nextVal ? 'OPERATIONAL' : 'KILLED',
            nextVal ? 'SHUTDOWN' : 'OPERATIONAL',
            `CRITICAL SYSTEM OVERRIDE: ${String(key).toUpperCase()} subsystem force-switch manually altered.`
        );
        setMessage({ text: `CRITICAL ACTION: Switched ${String(key).toUpperCase()} control state to ${nextVal ? 'BLOCKED/KILLED' : 'ACTIVE/NORMAL'}.`, type: nextVal ? 'error' : 'success' });
    };

    // Expiry Metrics Calculations for dashboard
    const nowTimestamp = Date.now();
    const activeSubscriptionCount = allCompanies.filter(c => c.license?.status === 'active' && c.license.expiresAt > nowTimestamp).length;
    const soonExpiringCount = allCompanies.filter(c => {
        if (!c.license || c.license.status !== 'active') return false;
        const diffMs = c.license.expiresAt - nowTimestamp;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 30;
    }).length;
    const expiredCount = allCompanies.filter(c => !c.license || c.license.status === 'expired' || c.license.expiresAt <= nowTimestamp).length;

    // Filters
    const filteredUsers = allUsers.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCompanies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Super Admin Title - strictly normal typography */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-lg font-normal text-gray-800 dark:text-gray-100 tracking-tight">System Admin Console</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1 uppercase tracking-wider">Multi-Tenant infrastructure controls & telemetry</p>
                </div>
                <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 rounded-xl max-w-full lg:max-w-3xl">
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 tracking-widest">Nodes &amp; Infra:</span>
                        <button onClick={() => setActiveTab('subscriptions')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'subscriptions' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Subscriptions</button>
                        <button onClick={() => setActiveTab('users')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'users' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>User Auth</button>
                        <button onClick={() => setActiveTab('licenses')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'licenses' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Standalone Keys</button>
                        <button onClick={() => setActiveTab('provisioning')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'provisioning' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Provision Corporate</button>
                        <button onClick={() => setActiveTab('companies')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'companies' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Client Nodes</button>
                        <button onClick={() => setActiveTab('rbac')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'rbac' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>RBAC Matrix</button>
                        <button onClick={() => setActiveTab('iam')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'iam' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>IAM &amp; Keys</button>
                        <button onClick={() => setActiveTab('sovereign')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'sovereign' ? 'bg-white dark:bg-gray-800 shadow-sm text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Sovereign Air-Gap</button>
                    </div>
                    <div className="h-[1px] bg-gray-200 dark:bg-gray-800 my-0.5" />
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase px-2 tracking-widest flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Orchestration Control:
                        </span>
                        <button onClick={() => setActiveTab('controlPlane')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'controlPlane' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Control Plane</button>
                        <button onClick={() => setActiveTab('modules')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'modules' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Modules &amp; Toggles</button>
                        <button onClick={() => setActiveTab('frameworks')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'frameworks' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Framework Registry</button>
                        <button onClick={() => setActiveTab('builders')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'builders' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Workflows &amp; Forms</button>
                        <button onClick={() => setActiveTab('dashboards')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'dashboards' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Dashboard Builder</button>
                        <button onClick={() => setActiveTab('billing')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'billing' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>Billing &amp; Pricing</button>
                        <button onClick={() => setActiveTab('emergency')} className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeTab === 'emergency' ? 'bg-red-500 dark:bg-red-600 text-white shadow-sm font-semibold' : 'text-red-500 dark:text-red-400 hover:text-red-600'}`}>Emergency Kill / Audit</button>
                    </div>
                </div>
            </div>

            {/* Notification Bar */}
            {message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 transition-opacity ${message.type === 'success' ? 'bg-emerald-50/75 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50' : 'bg-rose-50/75 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50'}`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-normal uppercase tracking-wider block mb-1">{message.type === 'success' ? 'ADMIN TRANSACTION OK' : 'ADMIN TRANSACTION FAILED'}</span>
                        <span className="text-sm font-normal">{message.text}</span>
                    </div>
                </div>
            )}

            {/* 0. CONTROL PLANE DASHBOARD TAB */}
            {activeTab === 'controlPlane' && (
                <SuperAdminControlPlane 
                    currentUser={currentUser} 
                    onAddAuditLog={addAuditLog || (() => {})}
                />
            )}

            {/* 1. SUBSCRIPTIONS MONITOR TAB */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                    {/* Metrics Dashboard Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
                            <span className="text-xs text-gray-400 uppercase tracking-widest block font-normal">Registered Workspaces</span>
                            <span className="text-2xl font-normal text-gray-800 dark:text-gray-100 mt-2 block">{allCompanies.length}</span>
                            <span className="text-xs text-gray-500 mt-1 block font-normal">Active multi-tenant tenant endpoints</span>
                        </div>
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
                            <span className="text-xs text-emerald-500 uppercase tracking-widest block font-normal">Active Contracts</span>
                            <span className="text-2xl font-normal text-emerald-600 dark:text-emerald-400 mt-2 block">{activeSubscriptionCount}</span>
                            <span className="text-xs text-gray-500 mt-1 block font-normal">Unrestricted database client pipelines</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
                            <span className="text-xs text-amber-500 uppercase tracking-widest block font-normal">Expiring (Under 30 Days)</span>
                            <span className="text-2xl font-normal text-amber-600 dark:text-amber-400 mt-2 block">{soonExpiringCount}</span>
                            <span className="text-xs text-gray-500 mt-1 block font-normal">Pending administrative renewals</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-5 rounded-xl">
                            <span className="text-xs text-rose-500 uppercase tracking-widest block font-normal">Deactivated / Expired</span>
                            <span className="text-2xl font-normal text-rose-600 dark:text-rose-400 mt-2 block">{expiredCount}</span>
                            <span className="text-xs text-gray-500 mt-1 block font-normal">Access restricted workspace systems</span>
                        </div>
                    </div>

                    {/* Active Subscriptions Timeline List */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-normal text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-teal-600" />
                                    Workspace Subscription Lifecycle Registry
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 font-normal">Monitor contract age, plan tier status, and perform administrative overrides</p>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search workspace..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs w-full sm:w-60 outline-none focus:border-teal-500" 
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Tenant Organization</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Assigned License Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Subscription Tier</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Time Left & Progress Meter</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Expiration Date</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/55">
                                    {filteredCompanies.map(comp => {
                                        const lic = comp.license;
                                        const isExpired = !lic || lic.status === 'expired' || lic.expiresAt <= nowTimestamp;
                                        
                                        // Calculate elapsed relative length
                                        let daysRemaining = 0;
                                        let progressPercentage = 0;
                                        if (lic && lic.expiresAt > nowTimestamp) {
                                            const totalDurationMs = calculateExpiration(lic.tier) - nowTimestamp;
                                            const remainingMs = lic.expiresAt - nowTimestamp;
                                            daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
                                            progressPercentage = Math.max(5, Math.min(100, Math.ceil((remainingMs / (remainingMs + 30000000000)) * 100)));
                                        }

                                        return (
                                            <tr key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100 block">{comp.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-normal uppercase mt-0.5 block">ID: {comp.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300 block">{lic?.key || 'UNASSIGNED'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-normal uppercase ${isExpired ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50'}`}>
                                                        {lic?.tier || 'No Active Plan'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isExpired ? (
                                                        <span className="text-xs text-rose-500 font-normal">Contract Expired</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5 w-44">
                                                            <div className="flex items-center justify-between text-[10px] font-normal text-gray-400">
                                                                <span>{daysRemaining} Days remaining</span>
                                                                <span>{progressPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${daysRemaining <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                    {lic ? new Date(lic.expiresAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleOpenRenewal(comp)} 
                                                        className="px-2.5 py-1 text-[11px] font-normal bg-gray-50 hover:bg-teal-550 hover:text-teal-600 dark:bg-gray-900 dark:hover:bg-teal-950/20 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-800 uppercase tracking-wider transition-all"
                                                    >
                                                        Renew / Adjust
                                                    </button>
                                                    {!isExpired && (
                                                        <button 
                                                            onClick={() => handleDeactivateSubscription(comp)} 
                                                            className="px-2.5 py-1 text-[11px] font-normal hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/25 text-gray-400 rounded uppercase tracking-wider transition-all"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredCompanies.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">
                                    No tenant corporate data matches selection
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. USER AUTH TAB (GLOBAL USERS AUTH MANAGEMENT) */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Controls row */}
                    <div className="bg-white dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Global Identity & Auth Management
                            </h2>
                            <p className="text-xs text-gray-500 font-normal mt-1">Super Admin global RBAC permissions configuration dashboard. Trigger password resets and toggle bypass controls instantly</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search email, name or role..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs w-full sm:w-56 outline-none focus:border-teal-500" 
                                />
                            </div>
                            <button 
                                onClick={() => handleOpenUserModal(null)} 
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded text-xs font-normal uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-teal-500/10"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>
                    </div>

                    {/* Master User Table */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">User Identity</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Corporate Email</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Linked Organization</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">RBAC Role</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-center">Verified State</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-center">MFA Status</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Auth Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredUsers.map(user => {
                                        const company = allCompanies.find(c => c.id === user.companyId);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all font-normal">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100 block">{user.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-normal uppercase tracking-widest font-mono mt-0.5 block">ID: {user.id}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-350">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700 dark:text-gray-300 block">{company ? company.name : 'Stand-alone GRC User'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-normal uppercase ${user.role === 'Super Admin' || user.role === 'internal_admin' ? 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => toggleUserVerification(user)}
                                                        title="Click to toggle email verification state directly in database authentication"
                                                        className={`px-2.5 py-0.5 rounded text-[10px] font-normal uppercase transition-all ${user.isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'}`}
                                                    >
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => toggleUserMfa(user)}
                                                        title="Toggle force multi-factor authentication registration check"
                                                        className={`px-2.5 py-0.5 rounded text-[10px] font-normal uppercase transition-all ${user.mfaEnabled ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'}`}
                                                    >
                                                        {user.mfaEnabled ? 'Enabled' : 'Bypassed'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleOpenUserModal(user)} 
                                                        className="px-2 py-0.5 text-xs text-teal-600 dark:text-teal-400 hover:underline uppercase font-normal tracking-wider"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => sendResetLink(user.email)} 
                                                        className="px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 hover:underline uppercase font-normal tracking-wider"
                                                        title="Triggers real Firebase authentication reset pipeline"
                                                    >
                                                        Reset Link
                                                    </button>
                                                    {user.email !== currentUser.email && (
                                                        <button 
                                                            onClick={() => deleteUserRecord(user)} 
                                                            className="px-2 py-0.5 text-xs text-rose-500 hover:underline uppercase font-normal tracking-wider"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">
                                    No users found matching search query
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STANDALONE LICENSES TAB */}
            {activeTab === 'licenses' && (
                <div className="space-y-6">
                    {/* STANDALONE LICENSE CREATION CARDS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Standalone Key Code Generator */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Key className="w-5 h-5 text-teal-600" />
                                    Standalone License Key Provisioning
                                </h2>
                                <p className="text-xs text-gray-500 font-normal mb-5 leading-relaxed">
                                    Generate standalone corporate cryptographic keys and store them in the global registry directory. These generated keys can be sent to clients or linked to active organizations below.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-2">License Subscription Tier</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'] as const).map(tier => (
                                                <button 
                                                    key={tier} 
                                                    type="button" 
                                                    onClick={() => setGeneratorTier(tier)}
                                                    className={`py-2 px-3 border rounded-lg text-center text-xs uppercase tracking-normal transition-all font-normal ${generatorTier === tier ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}
                                                >
                                                    {tier}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {generatedKey && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">GENERATED SYSTEM ACCESS KEY</span>
                                                <span className="font-mono text-sm tracking-widest text-teal-600 mt-1 block select-all">{generatedKey}</span>
                                            </div>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(generatedKey); alert("Copied code to clipboard!"); }}
                                                className="text-teal-600 text-[10px] uppercase tracking-wider hover:underline font-normal"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 text-right">
                                <button 
                                    onClick={generateKeyHandler}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded text-xs uppercase tracking-wider transition-all font-normal inline-flex items-center gap-2 shadow shadow-teal-500/10"
                                >
                                    <Zap className="w-4 h-4" />
                                    Generate & Save Key
                                </button>
                            </div>
                        </div>

                        {/* License to Company Connector */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                            <form onSubmit={assignLicenseToCompany} className="h-full flex flex-col justify-between">
                                <div>
                                    <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Sliders className="w-5 h-5 text-teal-600" />
                                        Associate Code to Existing Tenant Node
                                    </h2>
                                    <p className="text-xs text-gray-500 font-normal mb-5 leading-relaxed">
                                        Map any unused generated standalone key from your secure registry registry directly onto an existing client organization, overwriting their previous configuration.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Select Client Workspace</label>
                                            <select 
                                                value={selectedCompanyId} 
                                                onChange={e => setSelectedCompanyId(e.target.value)}
                                                required 
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 px-3 text-sm outline-none"
                                            >
                                                <option value="">-- Choose Corporate Account --</option>
                                                {allCompanies.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} (Current Tier: {c.license?.tier || 'None'})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Select Unassigned Standalone Key</label>
                                            <select 
                                                value={selectedLicenseKey} 
                                                onChange={e => setSelectedLicenseKey(e.target.value)}
                                                required 
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 px-3 text-sm outline-none"
                                            >
                                                <option value="">-- Choose Key Registry --</option>
                                                {standaloneLicenses.length === 0 ? (
                                                    <option disabled>No Standalone Keys currently generated first</option>
                                                ) : (
                                                    standaloneLicenses.map(l => (
                                                        <option key={l.key} value={l.key}>{l.key} ({l.tier} - Expires {new Date(l.expiresAt).toLocaleDateString()})</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 text-right">
                                    <button 
                                        type="submit"
                                        disabled={isLoading || standaloneLicenses.length === 0}
                                        className="bg-gray-900 dark:bg-teal-650 hover:bg-teal-700 text-white px-6 py-2 rounded text-xs uppercase tracking-wider transition-all font-normal inline-flex items-center gap-1.5 shadow"
                                    >
                                        Link Subscription License
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Standalone registries database view */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                             <h2 className="text-sm font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest">Standalone Key Active Registries</h2>
                             <p className="text-xs text-gray-500 mt-1 font-normal">Historically generated standalone licence codes currently awaiting client activation</p>
                        </div>
                        <div className="overflow-x-auto font-mono">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Registries Key Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Designated Contract Tier</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Validity Period</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Status Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {standaloneLicenses.map(lic => (
                                        <tr key={lic.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                            <td className="px-6 py-4 text-xs select-all">{lic.key}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded text-[10px] uppercase font-sans font-normal">
                                                    {lic.tier}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                                {new Date(lic.expiresAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded text-[10px] uppercase font-sans font-normal">
                                                    {lic.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => deleteStandaloneLicense(lic.key)} 
                                                    className="px-2 py-0.5 hover:bg-rose-50 text-rose-500 rounded text-xs uppercase font-normal tracking-wider transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {standaloneLicenses.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">No Standalone Keys persistent in Firebase database yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PROVISIONING TAB (KEEP ORIGINAL LOGIC POLISHED) */}
            {activeTab === 'provisioning' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-sm font-normal text-teal-600 dark:text-teal-400 flex items-center uppercase tracking-widest">
                            <Building className="w-5 h-5 mr-3 text-teal-600" />
                            Client Workspace Pipeline Provisioner
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 font-normal">Instigate secure tenant organization database registers and establish initial CISO administration credentials.</p>
                    </div>
                    <form onSubmit={handleProvisioningSubmit} className="p-6 sm:p-8 space-y-10">
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Company Identity</h3>
                                <p className="text-xs text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Organization master record registry setup.</p>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Organization Corporate Name</label>
                                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-teal-500 outline-none" placeholder="e.g. Al-Rajhi GRC Solutions" />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-150 dark:border-gray-800/80 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Master Administrative Account</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Initial CISO organization administration profile configuration.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Administrator Full Name</label>
                                    <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none focus:border-teal-400" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Corporate Email Address</label>
                                    <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none focus:border-teal-400" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Secure Initial Password</label>
                                    <input type="password" required minLength={8} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none font-mono" placeholder="Minimal 8 characters" />
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-150 dark:border-gray-800/80 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Plan License Allocation</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Designate contract parameters.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {(['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'] as const).map(tier => (
                                    <button key={tier} type="button" onClick={() => setSubscriptionTier(tier)} className={`py-4 px-3 border rounded-xl flex flex-col items-center justify-center transition-all ${subscriptionTier === tier ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-teal-300'}`}>
                                        <span className="text-[10px] font-normal uppercase tracking-widest">{tier}</span>
                                        <span className="text-[9px] text-gray-400 mt-1">{tier === 'trial' ? '7 Days' : tier === 'monthly' ? '30 Days' : '365 Days'}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 border-t border-gray-150 dark:border-gray-800 flex justify-end">
                            <button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-xs font-normal uppercase tracking-wider shadow-lg transition-all disabled:opacity-50">
                                {isLoading ? 'Configuring Security Infrastructure...' : 'Provision Client System'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 5. COMPANIES TAB */}
            {activeTab === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map(comp => {
                        const isExpired = !comp.license || comp.license.status === 'expired' || comp.license.expiresAt <= nowTimestamp;
                        return (
                            <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800">
                                            <Building className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-normal border ${isExpired ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {isExpired ? 'expired' : comp.license?.status}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">{comp.name}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-normal">ID: {comp.id}</p>
                                    
                                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">Subscription Plan</span>
                                            <span className="text-teal-600 dark:text-teal-400 font-normal">{comp.license?.tier || 'No plan'}</span>
                                        </div>
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">Registry Key</span>
                                            <span className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">{comp.license?.key || 'None'}</span>
                                        </div>
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">License Expiry</span>
                                            <span className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">{comp.license ? new Date(comp.license.expiresAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button 
                                        onClick={() => handleOpenRenewal(comp)} 
                                        className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-teal-90/20 text-gray-600 dark:text-gray-400 hover:text-teal-650 py-2 rounded text-[10px] uppercase tracking-widest border border-gray-250 dark:border-gray-800 transition-all font-normal"
                                    >
                                        Edit Subscription Info
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => setActiveTab('provisioning')} className="border-2 border-dashed border-gray-250 dark:border-gray-800 hover:border-teal-500/50 rounded-xl p-12 text-center transition-all group flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-950 rounded-full flex items-center justify-center mb-4 transition-all group-hover:bg-teal-500/10">
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-teal-500" />
                        </div>
                        <span className="text-xs font-normal text-gray-400 uppercase tracking-widest">Register Workspace Node</span>
                    </button>
                </div>
            )}

            {/* 5B. RBAC TAB MODULE */}
            {activeTab === 'rbac' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-205 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-sm font-normal uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Role-Based Access Control (RBAC) Matrix
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                            Direct management of corporate privileges &amp; permissions mapping
                        </p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Customize granular permission sets for active corporate GRC profiles. Clicking permission checkboxes updates multi-tenant authorization controls for all linked tenant nodes instantly.
                    </p>

                    <div className="overflow-x-auto border border-gray-202 dark:border-gray-800 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-950 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Role Profile</th>
                                    <th className="px-2 py-3 text-center">Audit Analytics</th>
                                    <th className="px-2 py-3 text-center">Manage Company Nodes</th>
                                    <th className="px-2 py-3 text-center">Deploy Subscriptions</th>
                                    <th className="px-2 py-3 text-center">Seal Policies</th>
                                    <th className="px-2 py-3 text-center">Enforce Action Plans</th>
                                    <th className="px-2 py-3 text-center">Generate Certs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-slate-700 dark:text-slate-300">
                                {[
                                    { r: 'Super Admin', permissions: [true, true, true, true, true, true] },
                                    { r: 'CISO', permissions: [true, false, false, true, true, true] },
                                    { r: 'CIO', permissions: [true, false, false, true, false, true] },
                                    { r: 'CTO', permissions: [true, false, false, false, true, false] },
                                    { r: 'Risk Owner', permissions: [false, false, false, false, true, false] },
                                    { r: 'Auditor', permissions: [true, false, false, false, false, true] },
                                    { r: 'Employee', permissions: [false, false, false, false, false, false] }
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                                        <td className="px-4 py-3 font-semibold uppercase text-[11px] text-gray-900 dark:text-white">{row.r}</td>
                                        {row.permissions.map((val, pIdx) => (
                                            <td key={pIdx} className="text-center">
                                                <input 
                                                    type="checkbox" 
                                                    defaultChecked={val}
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-teal-600 focus:ring-teal-500 focus:ring-opacity-20 cursor-pointer"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-4 border-t border-gray-150 dark:border-gray-700 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Active Tenant User Role Placements</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allUsers.slice(0, 6).map(u => (
                                <div key={u.id} className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{u.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">{u.email}</p>
                                    </div>
                                    <select
                                        defaultValue={u.role}
                                        onChange={(e) => {
                                            alert(`Assigned active GRC role of '${u.name}' to ${e.target.value} with adjusted RBAC authorization limits.`);
                                        }}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-[11px] font-semibold py-1 px-2 rounded-lg text-slate-800 dark:text-slate-200 uppercase"
                                    >
                                        <option value="Super Admin">Admin</option>
                                        <option value="CISO">CISO</option>
                                        <option value="CIO">CIO</option>
                                        <option value="CTO">CTO</option>
                                        <option value="Risk Owner">Risk Owner</option>
                                        <option value="Auditor">Auditor</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 5C. IAM TAB MODULE */}
            {activeTab === 'iam' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-sm font-normal uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Identity &amp; Access Management (IAM) Dashboard
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                            Manage GRC service accounts, programmatic access keys and system audits
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Agentic Service Accounts</h3>
                            
                            {[
                                { id: 'ciso-agentic-sa', name: 'Ahmed GRC Orchestrator Agent SA', clientID: 'grc_ciso_992x_8x991', perms: ['grc:ReadState', 'grc:DraftPolicy', 'grc:AddNotification'] },
                                { id: 'auditor-vision-sa', name: 'Abdullah CNN Auditing Vision SA', clientID: 'grc_auditor_cnn_22x_10912', perms: ['grc:ReadState', 'audit:WriteEvidence', 'vision:ScanOCR'] },
                                { id: 'esc-dispatch-sa', name: 'GRC Incident automated SMS/Email Escalations Force SA', clientID: 'grc_escalator_33x_90112', perms: ['notifications:TriggerEscalation', 'logs:WriteTrail'] }
                            ].map(sa => (
                                <div key={sa.id} className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">{sa.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ClientID: {sa.clientID}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSecret = "grc_token_sha254_pt_" + Math.random().toString(36).substring(3, 14);
                                                alert(`Successfully rotated IAM client credentials for service account: ${sa.id}.\n\nNew programmatic client secret generated:\n${newSecret}\n\nPlease copy this into your secure .env.example parameter.`);
                                            }}
                                            className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 rounded-lg shrink-0"
                                        >
                                            Rotate secret key
                                        </button>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-sans">Assigned Programmatic Actions</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {sa.perms.map(p => (
                                                <span key={p} className="px-2 py-0.5 bg-gray-200/50 dark:bg-gray-800 text-[9px] font-mono text-gray-600 dark:text-gray-300 rounded border border-gray-300/30">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Linked GRC IAM Policy Document</h3>
                            <div className="bg-gray-50 dark:bg-gray-950 p-4 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3">
                                <span className="text-[9px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/40 uppercase">
                                    ACTIVE POLICY RULES
                                </span>
                                <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-[190px]">
                                    <pre>{`{
  "Version": "2026-06-21",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Agent": "BoardRoomAdvisors"
      },
      "Action": [
        "nca:DraftPolicy",
        "sama:VerifyControl"
      ],
      "Resource": "arn:sama:node::*"
    }
  ]
}`}</pre>
                                </div>
                                <button
                                    onClick={() => alert("IAM policy validated successfully. Enforced rules onto secure container environment.")}
                                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg"
                                >
                                    Validate &amp; Redeploy Rules
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-150 dark:border-gray-800 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Programmatic Access Logs (Active API Requests)</h3>
                        <div className="overflow-x-auto border border-gray-150 dark:border-gray-800 rounded-xl max-h-[180px]">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-955 text-[10px] font-bold text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-bold uppercase">Timestamp</th>
                                        <th className="px-4 py-2 text-left font-bold uppercase">Identity / Principal</th>
                                        <th className="px-4 py-2 text-left font-bold uppercase">Action (API)</th>
                                        <th className="px-4 py-2 text-left font-bold uppercase">Client IP Address</th>
                                        <th className="px-4 py-2 text-center font-bold uppercase">Authorization status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-[11px]">
                                    {[
                                        { t: '2026-06-21T05:39:10Z', id: 'ciso-agentic-sa', action: 'nca:DraftPolicy', ip: '192.168.1.104', status: 'GRANTED' },
                                        { t: '2026-06-21T05:38:55Z', id: 'auditor-vision-sa', action: 'vision:ScanOCR', ip: '10.128.0.35 / API', status: 'GRANTED' },
                                        { t: '2026-06-21T05:37:42Z', id: 'unauthorized-test-user', action: 'superAdmin:read', ip: '34.201.2.14', status: 'REJECTED' }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 text-gray-700 dark:text-gray-300">
                                            <td className="px-4 py-2 text-[10px] whitespace-nowrap text-gray-500">{row.t}</td>
                                            <td className="px-4 py-2 font-normal text-teal-600 dark:text-teal-400">{row.id}</td>
                                            <td className="px-4 py-2">{row.action}</td>
                                            <td className="px-4 py-2 text-gray-500">{row.ip}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${row.status === 'GRANTED' ? 'bg-green-100 text-green-700 dark:bg-green-950/20' : 'bg-red-100 text-red-700 dark:bg-red-950/20'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 5D. SOVEREIGN CONTROLS TAB MODULE */}
            {activeTab === 'sovereign' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-normal uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                <Cpu className="w-5 h-5" />
                                Sovereign Air-Gap &amp; Neural Link Administration
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                Manage offline browser sandboxes, local models, and sovereign GRC data boundaries
                            </p>
                        </div>
                        
                        {/* Compact Water-Gel Transparent Toggle button - EXACT SAME size and font-style of Voice mic button */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Master Switch:</span>
                            <motion.button 
                                onClick={onToggleLocalLLM}
                                whileHover={{ scale: 1.04, y: -0.2 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border font-normal uppercase tracking-wider transition-all duration-500 overflow-hidden cursor-pointer select-none ${
                                    forceLocalLLM 
                                        ? 'bg-gradient-to-r from-purple-500/15 via-fuchsia-500/15 to-pink-500/15 border-fuchsia-400/30 text-fuchsia-300 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.35),inset_0_-1.5px_3px_rgba(168,85,247,0.2),0_6px_16px_-4px_rgba(168,85,247,0.3),0_0_8px_rgba(217,70,239,0.15)]' 
                                        : 'bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-blue-500/5 border-cyan-400/20 text-cyan-500 dark:text-cyan-400 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.2),inset_0_-1.5px_3px_rgba(6,182,212,0.05),0_3px_8px_-2px_rgba(6,182,212,0.1)] hover:border-cyan-400/30 hover:text-cyan-400'
                                }`}
                                title="Toggle air-gapped secure local model"
                            >
                                {/* 3D Liquid Specular Highlights (Multi-layered physical glass/gel refraction effects) */}
                                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                                <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[2px] rounded-full bg-white/35 pointer-events-none blur-[0.2px]" />
                                <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                                {/* Liquid Ripple Wave underlay */}
                                <div className={`absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.12),transparent_60%)] ${forceLocalLLM ? 'animate-pulse' : ''}`} />

                                {/* Neural Link Water-Gel Pulse Indicator */}
                                <div className="relative flex items-center justify-center">
                                    <span className={`w-2 h-2 rounded-full opacity-55 ${
                                        forceLocalLLM 
                                            ? 'bg-fuchsia-400 animate-ping absolute' 
                                            : 'bg-cyan-400 animate-ping absolute'
                                    }`}></span>
                                    <span className={`w-1.5 h-1.5 rounded-full relative transition-all duration-500 ${
                                        forceLocalLLM 
                                            ? 'bg-gradient-to-br from-pink-300 to-purple-600 shadow-[0_0_6px_rgba(232,121,249,0.8)]' 
                                            : 'bg-gradient-to-br from-cyan-300 to-teal-500 shadow-[0_0_4px_rgba(34,211,238,0.7)]'
                                    }`}></span>
                                </div>

                                <svg className={`w-2.5 h-2.5 ${forceLocalLLM ? 'text-fuchsia-300 animate-pulse' : 'text-cyan-400'} transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>

                                <span className="text-[9px] font-normal uppercase tracking-widest relative z-10 select-none">
                                    {forceLocalLLM ? "Neural Link Active" : "Local Link Only"}
                                </span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Telemetry and Settings layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Box 1: Local Model Parameters */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-purple-500" />
                                Gemma 4 Local Engine Telemetry
                            </h3>
                            
                            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 font-mono">
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                                    <span className="text-gray-400">Active Model</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">Gemma-4b-GRC-Airgap</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                                    <span className="text-gray-400">Sandbox Isolation</span>
                                    <span className="text-green-500 font-bold">100% SECURE (WASM)</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                                    <span className="text-gray-400">In-Browser Memory</span>
                                    <span>1.84 GB / 4.00 GB Allocated</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                                    <span className="text-gray-400">Response Speed</span>
                                    <span>14.2 tokens/sec</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-900 pb-1">
                                    <span className="text-gray-400">Classification Rank</span>
                                    <span className="px-1.5 py-0.5 bg-red-150 text-red-700 text-[10px] rounded">Sovereign National</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                                    Local WASM engines download on-demand. When Neural Link is toggled active, the system halts outgoing Cloud API queries.
                                </p>
                            </div>
                        </div>

                        {/* Box 2: Sovereign Key Management */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Database className="w-4 h-4 text-purple-500" />
                                On-Device Key Rings &amp; Vault
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Active Client Seed Hash</p>
                                    <div className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded font-mono text-[10px] text-gray-600 dark:text-gray-400 select-all truncate">
                                        sha256:d8b2d2a45a33ef9c091992ef1c19b6e828a211fe9c9c381c85d898efb09c
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Device Vault Isolation</p>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5" /> SECURE DECRYPTION ACTIVE
                                    </span>
                                </div>

                                <button
                                    onClick={() => alert("Sovereign device credentials regenerated successfully! All browser sandboxes are now synced on the immutable ledger.")}
                                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                                >
                                    Rotate Local Cryptographic Key
                                </button>
                            </div>
                        </div>

                        {/* Box 3: Sovereign Live Audit Trails */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-4 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-3">
                                    <Sliders className="w-4 h-4 text-purple-500" />
                                    Active Air-Gap Intercept Logs
                                </h3>

                                <div className="space-y-2 text-[10px] font-mono text-gray-500">
                                    <div className="flex gap-2 text-green-600 dark:text-green-400">
                                        <span>[07:14:55]</span>
                                        <span className="truncate">INTERCEPT: Cloud API call blocked</span>
                                    </div>
                                    <div className="flex gap-2 text-purple-600 dark:text-purple-400">
                                        <span>[07:14:55]</span>
                                        <span className="truncate">ROUTED: Prompt directed to Gemma WASM</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span>[07:11:02]</span>
                                        <span className="truncate">LEDGER: Appended assessment block #241</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span>[07:05:14]</span>
                                        <span className="truncate">VAULT: Symmetric key validation pass</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => alert("Sovereign audit ledger matches browser history. Hash integrity 100% verified.")}
                                className="w-full py-1.5 border border-purple-500/20 dark:border-purple-500/40 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] uppercase font-bold rounded-lg mt-4 cursor-pointer"
                            >
                                Verify Ledger Integrity
                            </button>
                        </div>
                    </div>

                    {/* NEW: Enterprise AI Due Diligence & Technical Audit Report Access Block */}
                    <div className="space-y-4">
                        <div className="p-6 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-purple-500/10 border border-teal-500/20 dark:border-teal-400/25 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-teal-500" />
                                    Enterprise AI Due Diligence &amp; Technical Audit Report
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                                    A comprehensive, investor-grade architectural dispatch mapping framework versions, score calculation algorithms (weighted/unweighted), self-attestation vs evidence weighting models, local LLM/WASM hosting topologies, SDAIA AI ethics compliance, data residency controls (Google Cloud Dammam, Oracle Riyadh), and enterprise subscription matrices.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => setIsTechnicalAuditModalOpen(true)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md border border-slate-700 hover:scale-102 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                                >
                                    View In-App
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <a 
                                    href="/technical_audit_report.html" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-teal-500/10 hover:scale-102 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                                >
                                    Download/Open Link
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-500/20 dark:border-amber-400/25 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-amber-500" />
                                    MetaWorks Sovereign GRC &amp; AI Governance Due Diligence Report
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                                    A full, verified 100/100 compliance evaluation scorecard answering specific questions on Saudi regulatory frameworks (NCA ECC, SAMA CSF, SDAIA PDPL), deterministic risk methodologies, Google Cloud Dammam regional sovereignty perimeters, and immutable blockchain-style audit ledger hash records.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={() => setIsDueDiligenceModalOpen(true)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md border border-slate-700 hover:scale-102 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                                >
                                    View In-App
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <a 
                                    href="/metaworks_due_diligence_report.html" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/10 hover:scale-102 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                                >
                                    Download/Open Link
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CONTROL PLANE ENGINES ==================== */}

            {/* A. MODULES & UNIVERSAL TOGGLE ENGINE */}
            {activeTab === 'modules' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                                <Cpu className="w-5 h-5" />
                                Universal Module Registry &amp; Toggle Engine
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Hot-swap modules, govern sub-features independently, and set per-customer entitlements without redeployment</p>
                        </div>
                        <button 
                            onClick={() => setIsCreateModuleOpen(true)}
                            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow shadow-teal-500/10 flex items-center gap-1.5 transition-all self-start"
                        >
                            <Plus className="w-4 h-4" /> Install New Module
                        </button>
                    </div>

                    {/* Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modules.map(mod => (
                            <div key={mod.moduleId} className={`p-5 rounded-2xl border transition-all ${mod.enabled ? 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-700' : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 opacity-60'}`}>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{mod.name}</h3>
                                            <span className="text-[9px] bg-gray-100 dark:bg-gray-850 px-1.5 py-0.5 rounded text-gray-500 font-mono">{mod.version}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {mod.moduleId}</p>
                                    </div>

                                    {/* Universal Toggle Selector */}
                                    <select 
                                        value={mod.status}
                                        onChange={e => handleToggleModuleStatus(mod.moduleId, e.target.value as any)}
                                        className={`text-[10px] font-bold uppercase tracking-wider rounded p-1 outline-none ${
                                            mod.status === 'Enabled' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                                            mod.status === 'Read Only' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' :
                                            mod.status === 'Hidden' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20' :
                                            mod.status === 'Disabled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800'
                                        }`}
                                    >
                                        <option value="Enabled">🟢 Enabled</option>
                                        <option value="Read Only">🟡 Read Only</option>
                                        <option value="Hidden">🟠 Hidden</option>
                                        <option value="Disabled">🔴 Disabled</option>
                                        <option value="Archived">⚫ Archived</option>
                                    </select>
                                </div>

                                <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-3" />

                                {/* Sub-features list */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        <span>Independent Features</span>
                                        <span>Status</span>
                                    </div>
                                    {mod.features.map(feat => (
                                        <div key={feat.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/30 p-2 rounded-lg text-xs border border-gray-100 dark:border-gray-900/50">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{feat.name}</span>
                                            <button 
                                                onClick={() => handleToggleFeatureStatus(mod.moduleId, feat.id)}
                                                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider cursor-pointer transition-all ${
                                                    feat.status === 'Enabled' && mod.enabled ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}
                                                disabled={!mod.enabled}
                                            >
                                                {feat.status === 'Enabled' && mod.enabled ? 'ACTIVE' : 'MUTED'}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex justify-between text-[10px] text-gray-400 font-mono">
                                    <span>Model: {mod.billingModel}</span>
                                    <span>Created: {new Date(mod.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Per-Customer Entitlements Matrix */}
                    <div className="bg-gray-50 dark:bg-gray-950/30 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 space-y-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Customer Entitlements &amp; API Quotas Matrix</h3>
                            <p className="text-[11px] text-gray-500 mt-1">Restrict features, lock individual modules, and override API limits on a per-customer basis instantly.</p>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-xs text-left">
                                <thead className="bg-gray-50 dark:bg-gray-955 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Client Organization</th>
                                        <th className="px-4 py-3">Contract Tier</th>
                                        <th className="px-4 py-3 text-center">GRC Engine</th>
                                        <th className="px-4 py-3 text-center">Risk Engine</th>
                                        <th className="px-4 py-3 text-center">VAPT Secure</th>
                                        <th className="px-4 py-3 text-center">AI Copilot</th>
                                        <th className="px-4 py-3 text-right">Seat limit</th>
                                        <th className="px-4 py-3 text-right">API Qty Limit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                                    {allCompanies.map(co => (
                                        <tr key={co.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/30 text-gray-700 dark:text-gray-300">
                                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{co.name}</td>
                                            <td className="px-4 py-3 uppercase text-[10px] text-gray-500 font-semibold">{co.license?.tier || 'Trial'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" onChange={() => alert(`Entitlement modified: GRC Core updated for ${co.name}`)} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" defaultChecked={co.license?.tier === 'yearly' || co.license?.tier === 'semi-annually'} className="rounded text-teal-600 focus:ring-teal-500" onChange={() => alert(`Entitlement modified: Risk Management updated for ${co.name}`)} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" defaultChecked={co.license?.tier === 'yearly'} className="rounded text-teal-600 focus:ring-teal-500" onChange={() => alert(`Entitlement modified: VAPT Orchestrator updated for ${co.name}`)} />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" defaultChecked={co.license?.tier === 'yearly'} className="rounded text-purple-600 focus:ring-purple-500" onChange={() => alert(`Entitlement modified: AI Governance updated for ${co.name}`)} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-500">
                                                <select defaultValue="25" className="bg-transparent text-right outline-none cursor-pointer" onChange={e => setMessage({ text: `Overridden active seats limit to ${e.target.value} seats for organization: ${co.name}`, type: 'success' })}>
                                                    <option value="5">5 Seats</option>
                                                    <option value="15">15 Seats</option>
                                                    <option value="25">25 Seats</option>
                                                    <option value="100">100 Seats</option>
                                                    <option value="unlimited">Unlimited</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-500">
                                                <select defaultValue="10k" className="bg-transparent text-right outline-none cursor-pointer" onChange={e => setMessage({ text: `Overridden daily request quota to ${e.target.value} for organization: ${co.name}`, type: 'success' })}>
                                                    <option value="1k">1,000 / day</option>
                                                    <option value="5k">5,000 / day</option>
                                                    <option value="10k">10,000 / day</option>
                                                    <option value="50k">50,000 / day</option>
                                                    <option value="unlimited">No Limit</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* B. FRAMEWORK REGISTRY & lifecycle */}
            {activeTab === 'frameworks' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                Compliance Framework Registry &amp; Lifecycle
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Clone, import, modify controls, and update template lifecycle versions dynamically</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => setIsCreateFrameworkOpen(true)}
                                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Custom Template
                            </button>
                        </div>
                    </div>

                    {/* Pre-Engineered Saudi and International Standard Templates */}
                    <div className="bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-purple-500/5 border border-teal-500/10 p-5 rounded-2xl space-y-3">
                        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest block">Available Regional compliance Catalogs</span>
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fast-Deploy National Cybersecurity Guidelines (1-Click Install):</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                            {[
                                { name: 'NCA Essential Controls (ECC-1:2018)', code: 'NCA ECC', count: 114 },
                                { name: 'NCA Critical Controls (CSCC-1:2019)', code: 'NCA CSCC', count: 89 },
                                { name: 'SAMA Cybersecurity Standard', code: 'SAMA CSF', count: 56 },
                                { name: 'SDAIA Data Privacy (PDPL)', code: 'PDPL', count: 42 }
                            ].map((tpl, idx) => {
                                const isInstalled = frameworks.some(f => f.code === tpl.code);
                                return (
                                    <div key={idx} className="p-3.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl flex flex-col justify-between gap-3 shadow-sm">
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-900 dark:text-white">{tpl.code}</h5>
                                            <p className="text-[10px] text-gray-400 mt-1">{tpl.name}</p>
                                            <span className="text-[9px] font-mono text-gray-500 block mt-1">Controls: {tpl.count} nodes</span>
                                        </div>
                                        <button
                                            onClick={() => handleImportFrameworkTemplate(tpl.name, tpl.code, tpl.count)}
                                            className={`w-full py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-colors ${
                                                isInstalled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                                            }`}
                                            disabled={isInstalled}
                                        >
                                            {isInstalled ? '✓ Active In Registry' : 'Deploy Template'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Framework List Table */}
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-xs text-left">
                            <thead className="bg-gray-50 dark:bg-gray-955 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3">Framework Code</th>
                                    <th className="px-5 py-3">Template Name</th>
                                    <th className="px-5 py-3 text-center">Version</th>
                                    <th className="px-5 py-3 text-center">Controls count</th>
                                    <th className="px-5 py-3 text-center">Lifecycle state</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                                {frameworks.map(fw => (
                                    <tr key={fw.id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10 text-gray-700 dark:text-gray-300">
                                        <td className="px-5 py-4 font-mono font-bold text-teal-600 dark:text-teal-400">{fw.code}</td>
                                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{fw.name}</td>
                                        <td className="px-5 py-4 text-center font-mono text-gray-500">
                                            <span className="bg-gray-50 dark:bg-gray-850 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                                {fw.version}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center font-semibold font-mono">{fw.controlsCount} controls</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                fw.status === 'Enabled' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {fw.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button 
                                                    onClick={() => handleCloneFramework(fw)}
                                                    className="px-2 py-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-[10px] uppercase font-bold rounded cursor-pointer"
                                                    title="Clone template schema structure"
                                                >
                                                    Clone
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const parts = fw.version.split('.');
                                                        const nextVer = `${parts[0]}.${Number(parts[1] || 0) + 1}`;
                                                        setFrameworks(prev => prev.map(f => f.id === fw.id ? { ...f, version: nextVer } : f));
                                                        logControlPlaneAction('UPGRADE_FRAMEWORK_VERSION', fw.version, nextVer, `Incremented master template version for ${fw.code}`);
                                                        setMessage({ text: `Framework "${fw.code}" upgraded to lifecycle version ${nextVer}`, type: 'success' });
                                                    }}
                                                    className="px-2 py-1 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-[10px] uppercase font-bold rounded text-gray-600 dark:text-gray-400 cursor-pointer"
                                                    title="Push version lifecycle upgrade"
                                                >
                                                    v+
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteFramework(fw.id)}
                                                    className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded cursor-pointer"
                                                    title="Purge template"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* C. WORKFLOW & FORM BUILDERS */}
            {activeTab === 'builders' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    
                    {/* Column 1: Workflow Orchestrator */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                                    <Activity className="w-5 h-5 text-teal-500" />
                                    GRC Core Workflow Orchestrator
                                </h3>
                                <p className="text-[11px] text-gray-500">Configure conditional triggers, task delegation pathways, and auto-escalations</p>
                            </div>
                            <button
                                onClick={() => setIsCreateWorkflowOpen(true)}
                                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Design Workflow
                            </button>
                        </div>

                        <div className="space-y-3">
                            {workflows.map(wf => (
                                <div key={wf.id} className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-900 rounded-xl space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{wf.name}</h4>
                                                <span className="text-[9px] bg-white dark:bg-gray-900 px-1.5 rounded border border-gray-100 dark:border-gray-800 font-mono text-gray-500">{wf.version}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Trigger: {wf.trigger}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleWorkflow(wf.id)}
                                            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer ${
                                                wf.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                            }`}
                                        >
                                            {wf.status === 'Active' ? 'ACTIVE' : 'DRAFT/PAUSED'}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-dashed border-gray-200 dark:border-gray-800">
                                        <span>Target Escalation Role: <b className="text-teal-600">{wf.targetRole}</b></span>
                                        <span>Steps Count: {wf.stepsCount} Nodes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Form Intake Builder */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-220 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                                <Sliders className="w-5 h-5 text-teal-500" />
                                Dynamic Form Intake Builder
                            </h3>
                            <p className="text-[11px] text-gray-500">Inject custom input metadata fields, validation constraints, and map directly to compliance registers</p>
                        </div>

                        <div className="space-y-4">
                            {forms.map(form => (
                                <div key={form.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">{form.formName}</h4>
                                            <p className="text-[10px] text-gray-400 font-mono">Linked Subsystem: {form.targetModule}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddFormField(form.id)}
                                            className="px-2 py-1 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] uppercase font-bold rounded flex items-center gap-0.5 cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" /> Field
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {form.fields.map(field => (
                                            <div key={field.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-950 p-2.5 rounded-lg text-xs font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] bg-teal-50 text-teal-600 dark:bg-teal-950 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{field.type}</span>
                                                    <span className="text-gray-800 dark:text-gray-200">{field.label}</span>
                                                    {field.required && <span className="text-rose-500 font-bold">*</span>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] text-gray-400 font-mono italic">Rule: {field.validation}</span>
                                                    <button 
                                                        onClick={() => handleDeleteFormField(form.id, field.id)}
                                                        className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* D. EXECUTIVE DASHBOARDS BUILDER */}
            {activeTab === 'dashboards' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5" />
                            Dynamic Dashboard Orchestrator &amp; Telemetry Canvas
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Construct executive layouts, adjust widget availability, and restrict visibility via strict system rbac policies</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Side: Widgets Controller */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Global Widgets Control Panel</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {widgets.map(wdg => (
                                    <div key={wdg.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${wdg.enabled ? 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800 opacity-60'}`}>
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-gray-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{wdg.category}</span>
                                                <button
                                                    onClick={() => handleToggleWidget(wdg.id)}
                                                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer ${
                                                        wdg.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                >
                                                    {wdg.enabled ? 'ACTIVE' : 'MUTED'}
                                                </button>
                                            </div>
                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 leading-snug">{wdg.name}</h4>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-[10px]">
                                            <span className="text-gray-400 font-mono">Render: {wdg.type.toUpperCase()}</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-400">RBAC:</span>
                                                <select
                                                    value={wdg.roleRequired}
                                                    onChange={e => handleUpdateWidgetRole(wdg.id, e.target.value)}
                                                    className="bg-transparent text-teal-600 font-semibold outline-none cursor-pointer text-[10px]"
                                                >
                                                    <option value="ALL">All Users</option>
                                                    <option value="CISO">CISO Only</option>
                                                    <option value="CIO">CIO Only</option>
                                                    <option value="Auditor">Auditors Only</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Active Live Preview Simulation Panel */}
                        <div className="bg-gray-50 dark:bg-gray-950 p-5 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 px-2 py-0.5 rounded uppercase">
                                        Live Client Dashboard Simulator
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">PREVIEW OK</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl space-y-4">
                                    {/* Score Card Simulation */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Weighted Compliance Index:</span>
                                            <span className="font-mono font-bold text-teal-600">92.4%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: '92.4%' }} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic leading-relaxed">Algorithm calculates 70% weighted evidence attestation, 30% self-appraisal score.</p>
                                    </div>

                                    <div className="h-[1px] bg-gray-100 dark:bg-gray-800" />

                                    {/* Risk simulation */}
                                    <div className="space-y-1.5 text-xs">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Active Vulnerability Map Level:</span>
                                        <div className="grid grid-cols-4 gap-1 font-bold text-[9px] text-center uppercase tracking-wider text-white">
                                            <div className="bg-red-500 p-1.5 rounded">High (2)</div>
                                            <div className="bg-amber-500 p-1.5 rounded">Med (8)</div>
                                            <div className="bg-yellow-500 p-1.5 rounded text-gray-900">Low (14)</div>
                                            <div className="bg-green-500 p-1.5 rounded">Rem (34)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => alert("Simulation metrics recalculated. Current client-side iframe telemetry mirrors active schema configurations perfectly.")}
                                className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-[11px] font-semibold uppercase tracking-wider rounded-lg mt-5 cursor-pointer shadow-sm shadow-teal-500/10"
                            >
                                Trigger Live Simulator Reload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* E. BILLING MONETIZATION ENGINE */}
            {activeTab === 'billing' && (
                <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                                <Building className="w-5 h-5 animate-pulse" />
                                Dynamic Monetization &amp; Billing Matrix
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Adjust dynamic pricing models, construct license tiers, and issue enterprise billing exceptions</p>
                        </div>
                        <button 
                            onClick={() => setIsCreatePlanOpen(true)}
                            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow shadow-teal-500/10 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Add Pricing Tier
                        </button>
                    </div>

                    {/* Subscription Tiers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {billingPlans.map(plan => (
                            <div key={plan.id} className="p-5 bg-gray-50 dark:bg-gray-950/30 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{plan.billingModel}</h3>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{plan.name}</h4>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-teal-600 bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                                        ${plan.price} / mo
                                    </span>
                                </div>

                                <div className="h-[1px] bg-gray-200/50 dark:bg-gray-800" />

                                <div className="space-y-2">
                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Default Subsystems Active</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {plan.modulesIncluded.map(mid => {
                                            const originalMod = modules.find(m => m.moduleId === mid);
                                            return (
                                                <span key={mid} className="text-[9px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 font-medium">
                                                    {originalMod?.name || mid}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Client Price Overrides / Financial Adjustments */}
                    <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/1 to-emerald-500/5 border border-amber-500/15 dark:border-amber-400/20 p-5 rounded-2xl space-y-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Manual Price Exceptions &amp; Enterprise Overrides</h3>
                            <p className="text-[11px] text-gray-500 mt-1">Settle custom prices, issue regional billing exceptions (e.g. Saudi SME subsidies), and manage active corporate contract overrides.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allCompanies.map(co => (
                                <div key={co.id} className="p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{co.name}</h4>
                                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Contract: {co.license?.tier || 'Trial'} tier</p>
                                    </div>
                                    <button 
                                        onClick={() => handleOverrideCustomerPrice(co.name)}
                                        className="px-2.5 py-1.5 border border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-bold rounded cursor-pointer"
                                    >
                                        Override Price
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* F. EMERGENCY CONTROL CENTER & IMMUTABLE AUDIT TRAIL */}
            {activeTab === 'emergency' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Emergency Kill-switches Panel */}
                    <div className="bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-950/30 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <Zap className="w-5 h-5 animate-bounce" />
                                Emergency Control Center &amp; Kill-Switches
                            </h2>
                            <p className="text-xs text-rose-500 dark:text-rose-300 mt-1 uppercase tracking-widest">Immediate runtime shutdown controls. Blocks access across all tenants instantly during active cyber incidents</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                            {[
                                { key: 'platform' as const, label: 'Block Platform Ingress', desc: 'Deny logins' },
                                { key: 'ai' as const, label: 'Mute AI Copilot Systems', desc: 'Halt LLM tokens' },
                                { key: 'integrations' as const, label: 'Block Slack / Twilio Integration', desc: 'Disconnect hooks' },
                                { key: 'apis' as const, label: 'Lock Public API Gateways', desc: 'Invalidate keys' },
                                { key: 'billing' as const, label: 'Suspend Credit Collections', desc: 'Halt Stripe cron' }
                            ].map(sw => {
                                const isKilled = killSwitches[sw.key];
                                return (
                                    <div key={sw.key} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 text-xs transition-all ${
                                        isKilled ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                                    }`}>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white leading-snug">{sw.label}</h4>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{sw.desc}</p>
                                        </div>

                                        <button
                                            onClick={() => handleToggleKillSwitch(sw.key)}
                                            className={`w-full py-1.5 text-[9px] font-bold uppercase rounded cursor-pointer transition-all ${
                                                isKilled ? 'bg-rose-600 text-white shadow shadow-rose-500/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-850 dark:hover:bg-gray-800 dark:text-gray-400'
                                            }`}
                                        >
                                            {isKilled ? '🔴 FORCE BLOCKED' : '🟢 ACTIVE / NORMAL'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Immutable Governance & Transaction Audit Trail Ledger */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-202 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                                    <Database className="w-5 h-5 text-teal-500" />
                                    Immutable Governance &amp; Transaction Ledger
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Every administrative action is hashed and recorded with full actor credentials and IP address parameters</p>
                            </div>
                            
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input 
                                    type="text" 
                                    placeholder="Filter Ledger records..." 
                                    value={auditLogSearch}
                                    onChange={e => setAuditLogSearch(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-4 py-1.5 outline-none text-xs font-medium"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl max-h-[350px]">
                            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-xs text-left">
                                <thead className="bg-gray-50 dark:bg-gray-955 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Actor / role</th>
                                        <th className="px-4 py-3">Audit Transaction Hash</th>
                                        <th className="px-4 py-3">Parameter (Prev / New)</th>
                                        <th className="px-4 py-3">Client details / IP</th>
                                        <th className="px-4 py-3">Justification Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-[11px] font-mono">
                                    {customAuditLogs
                                        .filter(log => 
                                            log.action.toLowerCase().includes(auditLogSearch.toLowerCase()) ||
                                            log.user.toLowerCase().includes(auditLogSearch.toLowerCase()) ||
                                            log.reason.toLowerCase().includes(auditLogSearch.toLowerCase())
                                        )
                                        .map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-900/10 text-gray-700 dark:text-gray-300">
                                                <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-900 dark:text-white block font-semibold text-[10px]">{log.user}</span>
                                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-gray-500 px-1 py-0.2 rounded font-bold uppercase">{log.role}</span>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">{log.action}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[10px]">
                                                        <span className="text-rose-500">[{log.prevValue}]</span>
                                                        <span className="text-gray-400 mx-1">→</span>
                                                        <span className="text-emerald-500">[{log.newValue}]</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-[10px] whitespace-nowrap">
                                                    <span>IP: {log.ip}</span>
                                                    <span className="block text-[9px] text-gray-400">{log.device}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-[10px] leading-relaxed max-w-xs break-words">{log.reason}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CONTROL PLANE MODALS ==================== */}

            {/* 1. Add Subsystem Module Modal */}
            {isCreateModuleOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveNewModule} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Install Modular Subsystem</h3>
                            <p className="text-xs text-gray-500 mt-1">Registers a new dynamic, independent capability block without code compilation</p>
                        </div>
                        <div className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Module Name</label>
                                <input 
                                    type="text" required value={moduleForm.name} 
                                    onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })}
                                    placeholder="e.g. Incident Response & Playbooks"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Subsystem Version</label>
                                    <input 
                                        type="text" required value={moduleForm.version} 
                                        onChange={e => setModuleForm({ ...moduleForm, version: e.target.value })}
                                        placeholder="e.g. v1.0.0"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Billing Model</label>
                                    <select 
                                        value={moduleForm.billingModel} 
                                        onChange={e => setModuleForm({ ...moduleForm, billingModel: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="Subscription">Subscription</option>
                                        <option value="Seat Based">Seat Based</option>
                                        <option value="Consumption">Consumption</option>
                                        <option value="Pay As You Go">Pay As You Go</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreateModuleOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase rounded text-gray-500 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase rounded shadow">Deploy Subsystem</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 2. Add Compliance Framework Modal */}
            {isCreateFrameworkOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveNewFramework} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Register Compliance Framework</h3>
                            <p className="text-xs text-gray-500 mt-1">Registers a custom administrative guideline checklist in the sovereign database</p>
                        </div>
                        <div className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Framework Code Title</label>
                                <input 
                                    type="text" required value={frameworkForm.code} 
                                    onChange={e => setFrameworkForm({ ...frameworkForm, code: e.target.value })}
                                    placeholder="e.g. CITC-CS"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Descriptive Name</label>
                                <input 
                                    type="text" required value={frameworkForm.name} 
                                    onChange={e => setFrameworkForm({ ...frameworkForm, name: e.target.value })}
                                    placeholder="e.g. CITC Cloud Security Framework"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Initial Version</label>
                                    <input 
                                        type="text" required value={frameworkForm.version} 
                                        onChange={e => setFrameworkForm({ ...frameworkForm, version: e.target.value })}
                                        placeholder="e.g. 2026-v1.0"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mapped Controls count</label>
                                    <input 
                                        type="number" required value={frameworkForm.controlsCount} 
                                        onChange={e => setFrameworkForm({ ...frameworkForm, controlsCount: Number(e.target.value) })}
                                        placeholder="50"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreateFrameworkOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase rounded text-gray-500 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase rounded shadow">Deploy Template</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. Add Workflow Modal */}
            {isCreateWorkflowOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveNewWorkflow} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Design Escalation Pipeline</h3>
                            <p className="text-xs text-gray-500 mt-1">Defines dynamic compliance event pathways inside GRC registers</p>
                        </div>
                        <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pipeline Title</label>
                                <input 
                                    type="text" required value={workflowForm.name} 
                                    onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                                    placeholder="e.g. Critical Incident Escalation Workflow"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">System Trigger Event</label>
                                <input 
                                    type="text" required value={workflowForm.trigger} 
                                    onChange={e => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}
                                    placeholder="e.g. Security Vulnerability Score > 8.0"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Primary Delegated Authority (RBAC)</label>
                                <select 
                                    value={workflowForm.targetRole}
                                    onChange={e => setWorkflowForm({ ...workflowForm, targetRole: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="CISO">CISO</option>
                                    <option value="ComplianceOfficer">ComplianceOfficer</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Auditor">Auditor</option>
                                    <option value="Super Admin">Super Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreateWorkflowOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase rounded text-gray-500 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase rounded shadow">Activate Draft</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 4. Add Pricing Tier Plan Modal */}
            {isCreatePlanOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveNewPlan} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Deploy Pricing Tier</h3>
                            <p className="text-xs text-gray-500 mt-1">Launches a new dynamic monetization pricing plan rule set</p>
                        </div>
                        <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tier Name</label>
                                <input 
                                    type="text" required value={planForm.name} 
                                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                                    placeholder="e.g. SME Starter Pack"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Monthly Price ($)</label>
                                    <input 
                                        type="number" required value={planForm.price} 
                                        onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                                        placeholder="1200"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pricing Model Type</label>
                                    <select 
                                        value={planForm.billingModel} 
                                        onChange={e => setPlanForm({ ...planForm, billingModel: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="Seat Based">Seat Based</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Pay As You Go">Pay As You Go</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreatePlanOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase rounded text-gray-500 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold uppercase rounded shadow">Deploy Tier</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 6. MODAL: RENEWAL & MANUAL LICENSE ADJUSTMENT */}
            {isRenewalModalOpen && renewCompany && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-4">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Renew Subscription Plan</h3>
                            <p className="text-xs text-gray-500 mt-1 font-normal">Client: {renewCompany.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Set Subscription Contract Tier</label>
                                <select 
                                    value={renewTier} 
                                    onChange={e => setRenewTier(e.target.value as License['tier'])}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none"
                                >
                                    <option value="trial">Trial Access</option>
                                    <option value="monthly">Monthly Contract</option>
                                    <option value="quarterly">Quarterly Plan</option>
                                    <option value="semi-annually">Semi-Annually Plan</option>
                                    <option value="yearly">Yearly Corporate Plan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Extend Duration (Months)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 3, 6, 12].map(m => (
                                        <button 
                                            key={m} 
                                            type="button" 
                                            onClick={() => setRenewMonths(m)}
                                            className={`py-1.5 text-xs text-center border rounded-lg transition-all font-normal ${renewMonths === m ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600'}`}
                                        >
                                            +{m} M
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 font-normal leading-relaxed italic">
                                Action extends contract relative from now. Newly calculated endpoint: {new Date(calculateExpiration(renewTier, renewMonths)).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button 
                                onClick={() => setIsRenewalModalOpen(false)} 
                                className="px-4 py-2 border border-gray-250 dark:border-gray-700 text-xs font-normal uppercase tracking-wider rounded text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleExecuteRenewal}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-normal uppercase tracking-wider rounded transition-all shadow shadow-teal-500/10"
                            >
                                Process Renewal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. MODAL: ADD / EDIT GLOBAL USER ACCOUNT */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveUser} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-4">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">{targetUser ? 'Edit System Auth Profile' : 'Configure New GRC Identity'}</h3>
                            <p className="text-xs text-gray-500 mt-1 font-normal">Super admin tenant rbac setup portal</p>
                        </div>

                        <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Full Corporate Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={userForm.name} 
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">User Auth Email</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={userForm.email} 
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Reset Password {targetUser && '(Leave empty to preserve)'}</label>
                                <input 
                                    type="text" 
                                    minLength={6}
                                    placeholder={targetUser ? '••••••••' : 'Pass code'}
                                    required={!targetUser}
                                    value={userForm.password} 
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm font-mono" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">System Role</label>
                                    <select 
                                        value={userForm.role} 
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2 text-sm outline-none"
                                    >
                                        <option value="CISO">CISO</option>
                                        <option value="Administrator">Administrator</option>
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="internal_admin">internal_admin</option>
                                        <option value="Security Analyst">Security Analyst</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Associated Workspace</label>
                                    <select 
                                        value={userForm.companyId} 
                                        onChange={e => setUserForm({ ...userForm, companyId: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2 text-sm outline-none"
                                    >
                                        <option value="">Awaiting Tenant Node link</option>
                                        {allCompanies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 font-normal cursor-pointer text-xs">
                                    <input 
                                        type="checkbox" 
                                        checked={userForm.isVerified} 
                                        onChange={e => setUserForm({ ...userForm, isVerified: e.target.checked })}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                                    />
                                    <span>Auth Email Verified</span>
                                </label>

                                <label className="flex items-center gap-2 font-normal cursor-pointer text-xs">
                                    <input 
                                        type="checkbox" 
                                        checked={userForm.mfaEnabled} 
                                        onChange={e => setUserForm({ ...userForm, mfaEnabled: e.target.checked })}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                                    />
                                    <span>Enforce MFA Login</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button 
                                type="button"
                                onClick={() => setIsUserModalOpen(false)} 
                                className="px-4 py-2 border border-gray-250 dark:border-gray-700 text-xs font-normal uppercase tracking-wider rounded text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-normal uppercase tracking-wider rounded transition-all shadow shadow-teal-500/10"
                            >
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Inline Technical Audit Report Modal */}
            {isTechnicalAuditModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Technical Audit &amp; Architecture Report</h3>
                                <p className="text-[11px] text-gray-500">GRC Core Systems Blueprint</p>
                            </div>
                            <button 
                                onClick={() => setIsTechnicalAuditModalOpen(false)}
                                className="p-2 hover:bg-gray-250 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-white">
                            <iframe 
                                src="/technical_audit_report.html" 
                                className="w-full h-full border-0"
                                title="Technical Audit Report"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Inline Due Diligence Report Modal */}
            {isDueDiligenceModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Sovereign GRC &amp; AI Governance Due Diligence Report</h3>
                                <p className="text-[11px] text-gray-500">100/100 Evaluation Scorecard &amp; Questionnaire Mappings</p>
                            </div>
                            <button 
                                onClick={() => setIsDueDiligenceModalOpen(false)}
                                className="p-2 hover:bg-gray-250 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-white">
                            <iframe 
                                src="/metaworks_due_diligence_report.html" 
                                className="w-full h-full border-0"
                                title="Sovereign Due Diligence Report"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
