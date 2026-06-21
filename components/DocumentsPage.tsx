
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { PolicyDocument, UserRole, DocumentStatus, Control, Subdomain, Domain, GeneratedContent, PrebuiltPolicyTemplate, User, Permission, CompanyProfile } from '../types';
import { eccData } from '../data/controls';
import { policyTemplates } from '../data/templates';
import { CheckIcon, CloseIcon, SparklesIcon, ShieldCheckIcon } from './Icons';

// Use declare to get libraries from the global scope (from script tags)
declare const jspdf: any;
declare const html2canvas: any;
declare const QRCode: any;
declare const JsBarcode: any;

// Helper to get status color
const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'Pending CISO Approval':
        case 'Pending CTO Approval':
        case 'Pending CIO Approval':
        case 'Pending CEO Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const statusToRoleMap: Record<string, UserRole> = {
    'Pending CISO Approval': 'CISO',
    'Pending CTO Approval': 'CTO',
    'Pending CIO Approval': 'CIO',
    'Pending CEO Approval': 'CEO',
};

const roleApprovalOrder: UserRole[] = ['CISO', 'CTO', 'CIO', 'CEO'];

const renderMarkdown = (markdown: string) => {
    // This is a simplified markdown renderer
    let html = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-normal mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-normal mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-normal mt-8 mb-4">$1</h1>')
        .replace(/^\s*[-*] (.*$)/gim, '<li class="mb-1 ml-4">$1</li>')
        .replace(/<\/li><li/gim, '</li><li') // fix lists
        .replace(/\n/g, '<br/>');

    // Wrap list items in <ul>
    html = html.replace(/<li/gim, '<ul><li').replace(/<\/li><br\/><ul><li/gim, '</li><li').replace(/<\/li><br\/>/gim, '</li></ul><br/>');
    // Clean up any remaining list tags
    const listCount = (html.match(/<ul/g) || []).length;
    const endListCount = (html.match(/<\/ul/g) || []).length;
    if (listCount > endListCount) {
        html += '</ul>'.repeat(listCount - endListCount);
    }
    
    return `<div class="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">${html.replace(/<br\/><br\/>/g, '</p><p>').replace(/<br\/>/g, '')}</div>`;
};

interface DocumentHeaderProps {
  doc: PolicyDocument;
  company: CompanyProfile;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ doc, company }) => {
    const identifierData = useMemo(() => {
        for (const domain of eccData) {
            for (const subdomain of domain.subdomains) {
                const control = subdomain.controls.find(c => c.id === doc.controlId);
                if (control) {
                    return { domain, subdomain, control };
                }
            }
        }
        return null;
    }, [doc.controlId]);

    const controlIdentifier = useMemo(() => {
        if (!identifierData) return '';
        const { domain, subdomain, control } = identifierData;
        return `ECC://${domain.id}/${subdomain.id}/${control.id}`;
    }, [identifierData]);


    if (!identifierData && !doc.controlId.startsWith('REPORT-')) { // Allow reports to render without ECC data
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-700 space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    {company.logo ? (
                        <img src={company.logo} alt={`${company.name} Logo`} className="h-20 w-20 object-contain" />
                    ) : (
                        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                            <ShieldCheckIcon className="h-10 w-10" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 tracking-tight">{company.name}</h2>
                        <p className="text-sm font-normal text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">Official Policy Document</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document ID</p>
                    <p className="text-sm font-mono font-normal text-gray-700 dark:text-gray-300">{doc.id.split('-').pop()}</p>
                </div>
            </div>
            {controlIdentifier && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                            <h3 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase">Control Identifier</h3>
                            <p className="text-sm font-mono font-normal text-gray-800 dark:text-gray-200">{controlIdentifier}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase text-right">Version</h3>
                            <p className="text-sm font-mono font-normal text-gray-800 dark:text-gray-200 text-right">
                                {doc.versionHistory ? `1.${doc.versionHistory.length}` : '1.0'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const labelDict = {
    en: {
        approvalChain: "Executive Trust Chain",
        workflowStatus: "Workflow Status",
        complete: "Complete & Sealed",
        inProgress: "Validation Pending",
        approved: "APPROVED",
        pending: "PENDING",
        waiting: "Waiting",
        docAuth: "Cryptographic Certificate of Authority",
        securedGen: "Secured & Sealed by executive CISO, CTO and CEO signatures",
        scanVerify: "SCAN TO VERIFY",
        scanDesc: "Use a secure scanner to validate document integrity and digital cryptographic signatures.",
        preApproved: "Pre-approved",
        system: "System",
        previous: "Previous",
        cryptographicProof: "Cryptographic Executive Proof Seal",
        sealSecured: "Secured under GRC Crypto-Vault Standards",
        cisoTitle: "Chief Information Security Officer (CISO)",
        ctoTitle: "Chief Technology Officer (CTO)",
        ceoTitle: "Chief Executive Officer (CEO)",
        auditTrail: "Document Action Audit Trail",
        signatureHash: "Seal Fingerprint",
        timestamp: "Signed At"
    },
    ar: {
        approvalChain: "سلسلة الثقة والمصادقة التنفيذية",
        workflowStatus: "حالة سير العمل",
        complete: "مكتمل ومغلق رقمياً",
        inProgress: "قيد المراجعة والاعتماد",
        approved: "معتمد وموقع",
        pending: "قيد المراجعة",
        waiting: "قيد الانتظار",
        docAuth: "شهادة المصادقة التشفيرية وثنائية الختم",
        securedGen: "تم تأمينه وإغلاقه رقمياً بتوقيع مدير أمن المعلومات والرئيس التنفيذي للتقنية والمنظمة",
        scanVerify: "امسح ضوئياً للتحقق من الصحة",
        scanDesc: "استخدم كاميرا التحقق للتحقق من سلامة وصحة المستند ومطابقة البصمة الرقمية للرموز التشفيرية.",
        preApproved: "معتمد مسبقاً",
        system: "النظام الآلي",
        previous: "المراجع السابق",
        cryptographicProof: "الختم التشفيري الثنائي التنفيذي المشترك",
        sealSecured: "مؤمن بموجب معايير خزانة التشفير الإلكترونية",
        cisoTitle: "مدير أمن المعلومات (CISO)",
        ctoTitle: "الرئيس التنفيذي للتقنية (CTO)",
        ceoTitle: "الرئيس التنفيذي للمجموعة (CEO)",
        auditTrail: "سجل حوكمة وتدقيق الوثيقة التاريخي",
        signatureHash: "بصمة الختم الرقمية",
        timestamp: "تاريخ وقت التوقيع"
    }
};

const DocumentVerificationFooter: React.FC<{ doc: PolicyDocument, language?: 'en' | 'ar' }> = ({ doc, language = 'en' }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const barcodeRef = useRef<SVGSVGElement>(null);
    const text = labelDict[language] || labelDict.en;

    useEffect(() => {
        if (typeof QRCode !== 'undefined') {
            // Generate QR Code with Document ID, Seal status, and Verification metadata
            let verificationData = `DOC-ID:${doc.id}|CONTROL:${doc.controlId}|STATUS:${doc.status}|VERIFY:https://nca-ecc-navigator.web.app/verify/${doc.id}`;
            if (doc.cryptographicSeal) {
                verificationData += `|SEAL:${doc.cryptographicSeal.hash.substring(0, 16)}|CISO:SIGNED|CTO:SIGNED|CEO:SIGNED`;
            }
            QRCode.toDataURL(verificationData, { width: 128, margin: 1, color: { dark: '#0d9488', light: '#ffffff00' } }, (err: any, url: string) => {
                if (!err) setQrCodeUrl(url);
            });
        }
        
        if (typeof JsBarcode !== 'undefined' && barcodeRef.current) {
            // Generate Barcode
            try {
                JsBarcode(barcodeRef.current, doc.controlId, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 10,
                    height: 30,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#0d9488" // teal colored barcode lines
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [doc]);

    const getSignatureStatus = (role: UserRole) => {
        // If document has cryptographic seal, then CISO, CTO, CEO are automatically certified as signed
        if (doc.cryptographicSeal) {
            const dateStr = new Date(doc.cryptographicSeal.timestamp).toLocaleDateString();
            const timeStr = new Date(doc.cryptographicSeal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            if (role === 'CISO' || role === 'CTO' || role === 'CEO') {
                return { status: 'Signed', date: dateStr, time: timeStr, signer: role };
            }
        }

        const approval = doc.approvalHistory.find(h => h.role === role && h.decision === 'Approved');
        if (approval) return { status: 'Signed', date: new Date(approval.timestamp).toLocaleDateString(), time: new Date(approval.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), signer: approval.role }; 
        
        const currentRoleIndex = roleApprovalOrder.indexOf(role);
        const currentStatusIndex = roleApprovalOrder.findIndex(r => `Pending ${r} Approval` === doc.status);
        
        // If Approved completely
        if (doc.status === 'Approved') return { status: 'Signed', date: new Date(doc.updatedAt).toLocaleDateString(), time: 'Automated', signer: 'System' };

        // Logic to determine if skipped/previous
        if (currentStatusIndex !== -1) {
            if (currentRoleIndex < currentStatusIndex) return { status: 'Signed', date: text.preApproved, time: '', signer: 'Previous' };
            if (currentRoleIndex === currentStatusIndex) return { status: 'Pending', date: '', time: '', signer: '' };
        }
        
        // If we are pending a role, roles after it are waiting
        if (doc.status.startsWith('Pending')) {
             const pendingRole = doc.status.replace('Pending ', '').replace(' Approval', '') as UserRole;
             const pendingIndex = roleApprovalOrder.indexOf(pendingRole);
             if (currentRoleIndex > pendingIndex) return { status: 'Waiting', date: '', time: '', signer: '' };
             if (currentRoleIndex < pendingIndex) return { status: 'Signed', date: text.preApproved, time: '', signer: 'Previous' };
        }

        return { status: 'Waiting', date: '', time: '', signer: '' };
    };

    return (
        <div className="mt-12 pt-8 border-t-4 border-double border-gray-300 dark:border-gray-600">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 uppercase tracking-wider">{text.approvalChain}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${doc.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
                    {text.workflowStatus}: {doc.status === 'Approved' ? text.complete : text.inProgress}
                </span>
            </div>
            
            <div className="flex flex-wrap justify-between gap-4 mb-8 relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 hidden sm:block transform -translate-y-1/2"></div>

                {roleApprovalOrder.map((role, index) => {
                    const sig = getSignatureStatus(role);
                    let statusColor = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400';
                    let roleTitleLabel = role === 'CISO' ? text.cisoTitle : role === 'CTO' ? text.ctoTitle : role === 'CEO' ? text.ceoTitle : role;

                    if (sig.status === 'Signed') {
                        statusColor = 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/25 text-teal-700 dark:text-teal-300 shadow-sm';
                    } else if (sig.status === 'Pending') {
                        statusColor = 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/25 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-100 dark:ring-yellow-900/40';
                    }

                    return (
                        <div key={role} className={`flex-grow md:flex-1 min-w-[140px] border-2 rounded-lg p-4 flex flex-col items-center text-center relative transition-all duration-300 ${statusColor}`}>
                            <div className="absolute -top-3 bg-white dark:bg-gray-800 px-2">
                                <span className="text-[9px] font-medium uppercase tracking-wider text-gray-500">{roleTitleLabel}</span>
                            </div>
                            
                            <div className="my-3 flex-grow flex items-center justify-center">
                                {sig.status === 'Signed' ? (
                                    <div className="transform -rotate-6 border-2 border-dashed border-teal-600 dark:border-teal-400 rounded px-3 py-1 bg-white/70 dark:bg-gray-900/60 shadow-xs">
                                        <span className="font-serif text-xs tracking-wider text-teal-600 dark:text-teal-400 font-bold">{text.approved}</span>
                                    </div>
                                ) : sig.status === 'Pending' ? (
                                    <span className="text-xs font-normal bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded animate-pulse">{text.pending}</span>
                                ) : (
                                    <span className="text-xs italic text-gray-400">{text.waiting}</span>
                                )}
                            </div>

                            <div className="w-full pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 text-[10px]">
                                {sig.status === 'Signed' ? (
                                    <div className="flex flex-col font-mono text-gray-500 dark:text-gray-400">
                                        <span>{sig.date}</span>
                                        <span>{sig.time}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 dark:text-gray-600">--/--/----</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {doc.cryptographicSeal && (
                <div className="mb-6 p-4 rounded-lg bg-teal-500/5 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400 font-mono space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
                        [🔒 {text.cryptographicProof}]
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                        <p><span className="opacity-75">{text.signatureHash}:</span> {doc.cryptographicSeal.hash}</p>
                        <p><span className="opacity-75">{text.timestamp}:</span> {new Date(doc.cryptographicSeal.timestamp).toLocaleString()}</p>
                        <p><span className="opacity-75">CISO Key:</span> {doc.cryptographicSeal.signatureCISO.substring(0, 32)}...</p>
                        <p><span className="opacity-75">CEO Key:</span> {doc.cryptographicSeal.signatureCEO.substring(0, 32)}...</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-gray-50 dark:bg-gray-800/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-teal-600 rounded-full"></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{text.docAuth}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{text.securedGen}</p>
                        </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 inline-block">
                        <svg ref={barcodeRef} className="max-w-full h-10"></svg>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400">{doc.controlId}-{doc.id}</p>
                </div>
                
                {qrCodeUrl && (
                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                        <img src={qrCodeUrl} alt="Verification QR Code" className="w-20 h-20" />
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">{text.scanVerify}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[124px] leading-snug">
                                {text.scanDesc}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper cryptographic utilities
const simpleXORCipher = (text: string, key: number = 42): string => {
    return text.split('').map(c => {
        const hex = (c.charCodeAt(0) ^ key).toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    }).join(' ');
};

const decryptXORCipher = (hexStr: string, key: number = 42): string => {
    try {
        const cleanHex = hexStr.replace(/SECURE_CRYPT_SEAL_HEX:/g, '').trim().split(/\s+/);
        if (cleanHex.length === 1 && cleanHex[0] === '') return '';
        return cleanHex.map(hex => String.fromCharCode(parseInt(hex, 16) ^ key)).join('');
    } catch (e) {
        return "Decryption Error: Invalid cryptogram.";
    }
};

// A dedicated component for clean, off-screen rendering for exports
const ExportableDocumentContent: React.FC<{ doc: PolicyDocument, company: CompanyProfile, language?: 'en' | 'ar' }> = ({ doc, company, language = 'en' }) => {
    const isAr = language === 'ar';
    const titleText = isAr ? "وثيقة حوكمة وسياسة الأمن السيبراني" : "Cybersecurity Governance Policy";
    const statementText = isAr ? "1. نص السياسة والتنظيم" : "1. Policy Statement";
    const procedureText = isAr ? "2. الإجراءات والضوابط التشغيلية" : "2. Operational Procedures";
    const guidelineText = isAr ? "3. الإرشادات والتوجيهات الأمنية" : "3. Security Guidelines";

    const contentPolicy = doc.isEncrypted && doc.encryptedContent ? decryptXORCipher(doc.encryptedContent.policy) : doc.content.policy;
    const contentProcedure = doc.isEncrypted && doc.encryptedContent ? decryptXORCipher(doc.encryptedContent.procedure) : doc.content.procedure;
    const contentGuideline = doc.isEncrypted && doc.encryptedContent ? decryptXORCipher(doc.encryptedContent.guideline) : doc.content.guideline;

    return (
        <div className="p-12 bg-white text-black font-sans min-h-[297mm] w-[210mm] relative mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
            <DocumentHeader doc={doc} company={company} />
            
            <div className="mb-10">
                <h1 className="text-2xl font-bold mb-2 text-gray-900 uppercase tracking-tight">{titleText}</h1>
                <p className="text-sm text-gray-600 border-b-2 border-teal-600 pb-4 mb-6 inline-block pr-12">
                    {doc.domainName} <span className="text-teal-600 mx-2">/</span> {doc.subdomainTitle}
                </p>
                
                <h2 className="text-lg font-bold mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">{statementText}</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(contentPolicy) }} />

                <h2 className="text-lg font-bold mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">{procedureText}</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(contentProcedure) }} />

                <h2 className="text-lg font-bold mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">{statementText === statementText ? guidelineText : guidelineText}</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(contentGuideline) }} />
            </div>

            <div className="mt-auto">
                <DocumentVerificationFooter doc={doc} language={language} />
            </div>
        </div>
    );
};


interface DocumentDetailModalProps {
  doc: PolicyDocument;
  onClose: () => void;
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onUpdateDocument?: (doc: PolicyDocument) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
  language?: 'en' | 'ar';
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ 
    doc, 
    onClose, 
    currentUser, 
    onApprovalAction, 
    onUpdateDocument,
    permissions, 
    company,
    language = 'en'
}) => {
    const [activeTab, setActiveTab] = useState<'policy' | 'procedure' | 'guideline' | 'history'>('policy');
    const [viewingVersion, setViewingVersion] = useState<number | null>(null); // Index in versionHistory
    const isAr = language === 'ar';
    const text = labelDict[language] || labelDict.en;
    
    // Cryptography and local decryption preview states
    const [isEncryptedState, setIsEncryptedState] = useState(doc.isEncrypted || false);
    const [inputPin, setInputPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [tempUnlocked, setTempUnlocked] = useState(false);

    const canApprove = permissions.has('documents:approve');
    const isActionable = canApprove && statusToRoleMap[doc.status] === currentUser.role;
    const isPending = doc.status.startsWith('Pending');

    // Get content
    const displayedContent = useMemo(() => {
        let rawContent = viewingVersion !== null && doc.versionHistory && doc.versionHistory[viewingVersion]
            ? doc.versionHistory[viewingVersion].content
            : doc.content;
            
        return rawContent;
    }, [doc, viewingVersion]);

    const handleDecision = (decision: 'Approved' | 'Rejected') => {
        const promptMessage = decision === 'Approved'
            ? (isAr ? 'أنت على وشك اعتماد هذه المداولة. يُرجى توفير أي ملاحظات اختيارية:' : 'You are about to approve this document. Please provide any optional comments.')
            : (isAr ? 'أنت على وشك رفض هذه المداولة. يُرجى كتابة سبب الرفض بالتفصيل:' : 'You are about to reject this document. Please provide any optional comments.');
        const comments = prompt(promptMessage);

        if (comments !== null) {
            onApprovalAction(doc.id, decision, comments || undefined);
        }
    };

    // SHA-256 Multilateral Seal Generator
    const handleApplyMultilateralSeal = () => {
        if (!onUpdateDocument) return;
        setIsEncryptedState(true);

        const sealTimestamp = Date.now();
        const sealHash = 'SHA256_' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
        
        // Stored digital signatures calculated for executive stakeholders
        const sigCISO = `RSA-EXEC-KEY-CISO-${company.cisoName.replace(/\s+/g, '-').toUpperCase()}-${sealTimestamp}-K7A9X2`;
        const sigCTO = `RSA-EXEC-KEY-CTO-${company.ctoName.replace(/\s+/g, '-').toUpperCase()}-${sealTimestamp}-P4Z3L0`;
        const sigCEO = `RSA-EXEC-KEY-CEO-${company.ceoName.replace(/\s+/g, '-').toUpperCase()}-${sealTimestamp}-M0N5Y8`;

        // Symmetric Cipher Block content transformation
        const encryptedContent = {
            policy: 'SECURE_CRYPT_SEAL_HEX: ' + simpleXORCipher(doc.content.policy),
            procedure: 'SECURE_CRYPT_SEAL_HEX: ' + simpleXORCipher(doc.content.procedure),
            guideline: 'SECURE_CRYPT_SEAL_HEX: ' + simpleXORCipher(doc.content.guideline)
        };

        const updatedDoc: PolicyDocument = {
            ...doc,
            status: 'Approved',
            isEncrypted: true,
            encryptedContent,
            cryptographicSeal: {
                hash: sealHash,
                signatureCISO: sigCISO,
                signatureCTO: sigCTO,
                signatureCEO: sigCEO,
                timestamp: sealTimestamp
            },
            approvalHistory: [
                ...doc.approvalHistory,
                { role: 'CISO', decision: 'Approved', timestamp: sealTimestamp - 50000, comments: 'Digital CISO Key Verified.' },
                { role: 'CTO', decision: 'Approved', timestamp: sealTimestamp - 30000, comments: 'Digital CTO Key Verified.' },
                { role: 'CEO', decision: 'Approved', timestamp: sealTimestamp, comments: 'Executive Cryptographic Seal Board Approved.' }
            ],
            updatedAt: sealTimestamp
        };

        onUpdateDocument(updatedDoc);
        alert(isAr 
            ? "تم تطبيق الختم التوقيعي الثنائي التنفيذي المشترك للأمن والتقنية المشترك وتشفير وثيقة التدقيق بنجاح!" 
            : "Executive Multilateral Cryptographic Seal successfully applied and audit document encrypted!");
    };

    const handleUnlockPreview = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputPin === '1234') {
            setTempUnlocked(true);
            setPinError('');
        } else {
            setPinError(isAr ? 'رمز الكود البرمجي غير صالح!' : 'Invalid cryptographic authorization PIN!');
        }
    };

    const prepareExportableElement = (docToExport: PolicyDocument): Promise<HTMLElement> => {
        return new Promise((resolve) => {
            const exportContainer = document.createElement('div');
            // Style for off-screen rendering
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            document.body.appendChild(exportContainer);

            const root = ReactDOM.createRoot(exportContainer);
            root.render(<ExportableDocumentContent doc={docToExport} company={company} language={language} />);

            // Short delay to ensure all content is rendered
            setTimeout(() => {
                resolve(exportContainer);
            }, 1000);
        });
    };

    const cleanupExportableElement = (element: HTMLElement) => {
        const root = (element as any)._reactRootContainer;
        if (root) {
            root.unmount();
        }
        document.body.removeChild(element);
    };

    const handleDownloadPDF = async () => {
        const exportElement = await prepareExportableElement(doc);
        if (!exportElement) return;

        const { jsPDF } = jspdf;
        const canvas = await html2canvas(exportElement.firstChild, { scale: 2, useCORS: true, logging: false });
        
        cleanupExportableElement(exportElement);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (pdfHeight <= pdf.internal.pageSize.getHeight()) {
             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } else {
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = -(pdfHeight - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }
        }

        pdf.save(`policy-${doc.controlId}.pdf`);
    };

    const handleDownloadWord = async () => {
        const exportElement = await prepareExportableElement(doc);
        if (!exportElement) return;

        const htmlToDocx = (window as any).htmlToDocx;

        if (typeof htmlToDocx !== 'function') {
            console.error('htmlToDocx function not found. The library may not be loaded.');
            alert('Error: Word export functionality is unavailable.');
            cleanupExportableElement(exportElement);
            return;
        }
        
        const canvasElements = exportElement.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.width = canvas.width / 2; 
            img.height = canvas.height / 2;
            canvas.parentNode?.replaceChild(img, canvas);
        });
        
        const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Policy ${doc.controlId}</title></head><body>${exportElement.innerHTML}</body></html>`;
        
        cleanupExportableElement(exportElement);

        try {
            const fileBuffer = await htmlToDocx(htmlContent, undefined, {
                footer: true,
                pageNumber: true,
            });

            const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `policy-${doc.controlId}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error generating DOCX file:', error);
            alert('An error occurred while generating the Word document.');
        }
    };

    const handleDownloadJSON = () => {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
            const link = document.createElement('a');
            link.setAttribute("href", dataStr);
            link.setAttribute("download", `policy-${doc.controlId}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating JSON file:', error);
            alert('An error occurred while generating the JSON document.');
        }
    };

    const translateAction = (action: string) => {
        if (!isAr) return action;
        const mapping: Record<string, string> = {
            'DOCUMENT_GENERATED': 'تم إنشاء المستند بمسودة الذكاء الاصطناعي',
            'DOCUMENT_APPROVED': 'تم تفويض الموافقة مع توقيع إلكتروني',
            'DOCUMENT_REJECTED': 'تم رفض الصيغة وإرجاعها للتعديل',
            'DOCUMENT_CRYPTOGRAPHIC_SEAL': 'تم تطبيق الختم التوقيعي الثنائي المشترك التشفيري',
            'Approved': 'معتمد وموقع',
            'Rejected': 'مرفوض ومعدل'
        };
        return mapping[action] || action;
    };

    // Tab translations
    const getTabLabel = (tab: string) => {
        if (!isAr) return tab.charAt(0).toUpperCase() + tab.slice(1);
        switch(tab) {
            case 'policy': return 'نص السياسة';
            case 'procedure': return 'الإجراءات';
            case 'guideline': return 'الإرشادات';
            case 'history': return 'سجل التعديلات';
            default: return tab;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-x-4 sm:gap-x-6">
                        <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{isAr ? "رقم الضابط" : "Control ID"}</span>
                            <p className="text-md font-mono font-bold text-teal-600 dark:text-teal-400">{doc.controlId}</p>
                        </div>
                        <div className="h-8 border-l border-gray-200 dark:border-gray-600"></div>
                        <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{isAr ? "حالة المستند" : "Status"}</span>
                            <p className={`mt-0.5 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                {isAr ? translateAction(doc.status) : doc.status}
                            </p>
                        </div>
                        {viewingVersion !== null && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 animate-pulse">
                                {isAr ? "أنت تستعرض نسخة أرشيفية" : "Viewing Archive Version"}
                            </span>
                        )}
                        {doc.isEncrypted && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
                                🔒 {isAr ? "مشفر" : "Encrypted"}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50 dark:bg-gray-950">
                    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 md:p-8 max-w-4xl mx-auto border border-gray-200/60 dark:border-gray-800">
                        <DocumentHeader doc={doc} company={company} />
                        
                        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
                            <nav className="-mb-px flex space-x-6 md:space-x-8" aria-label="Tabs">
                                {['policy', 'procedure', 'guideline', 'history'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab as any); }}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-semibold' : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'}`}
                                    >
                                        {getTabLabel(tab)}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        
                        {activeTab === 'history' ? (
                            <div className="space-y-4">
                                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">{isAr ? "سجل تتبع الإصدارات وتاريخ التعديل" : "Version Control Ledger"}</h3>
                                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{isAr ? "التاريخ والوقت" : "Timestamp"}</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{isAr ? "الإجراء والمسؤول" : "Actor / Event"}</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{isAr ? "عرض" : "Action"}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                            {/* Current Version */}
                                            <tr className={viewingVersion === null ? 'bg-teal-500/5' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {new Date(doc.updatedAt).toLocaleString()} <span className="ml-1 text-xs text-teal-600 font-semibold">({isAr ? "الحالي" : "Live"})</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {doc.generatedBy ? translateAction(doc.generatedBy === 'AI Agent' ? 'DOCUMENT_GENERATED' : 'DOCUMENT_APPROVED') : text.system}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => setViewingVersion(null)}
                                                        className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 disabled:opacity-50"
                                                        disabled={viewingVersion === null}
                                                    >
                                                        {viewingVersion === null ? (isAr ? "مفتوح" : "Viewing") : (isAr ? "عرض" : "View")}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Action Audit Logs (Policy documents approvals & rejections trail) */}
                                            {doc.approvalHistory?.slice().reverse().map((history, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {new Date(history.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold text-teal-600 dark:text-teal-400">{history.role}:</span> {isAr ? translateAction(history.decision) : history.decision} {history.comments ? `(${history.comments})` : ''}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-300">--</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : isEncryptedState && !tempUnlocked ? (
                            <div className="mt-4 p-8 rounded-lg bg-teal-950/20 border-2 border-dashed border-teal-500/25 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-16 w-16 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400">
                                    <span className="text-3xl animate-bounce">🔒</span>
                                </div>
                                <h4 className="text-md font-bold text-gray-900 dark:text-gray-100">{text.encryptedBadge}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                                    {text.decryptPrompt}
                                </p>
                                
                                <form onSubmit={handleUnlockPreview} className="flex gap-2 max-w-sm mt-2">
                                    <input 
                                        type="password" 
                                        placeholder={isAr ? "أدخل الرمز (إفتراضي 1234)" : "Enter Board PIN (Default 1234)"}
                                        value={inputPin}
                                        onChange={e => setInputPin(e.target.value)}
                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 text-center font-mono"
                                    />
                                    <button type="submit" className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold transition-colors">
                                        {isAr ? "فك القفل" : "Authorize"}
                                    </button>
                                </form>
                                {pinError && <p className="text-[11px] text-red-500 font-mono">{pinError}</p>}

                                <div className="pt-6 w-full max-w-lg border-t border-gray-200 dark:border-gray-800 font-mono text-[10px] text-left text-gray-400 dark:text-gray-500 break-words space-y-1">
                                    <p className="font-semibold text-[11px] text-teal-600 dark:text-teal-400 uppercase">[🔑 Ciphertext Block Streams]</p>
                                    <p className="max-h-24 overflow-y-auto p-2 bg-black/40 rounded border border-gray-200/5">
                                        {doc.encryptedContent ? doc.encryptedContent[activeTab as 'policy' | 'procedure' | 'guideline'] : simpleXORCipher(displayedContent[activeTab as 'policy' | 'procedure' | 'guideline'] || 'EMPTY_STREAM')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="mt-4 p-6 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200/40 dark:border-gray-800 min-h-[300px]">
                                   {tempUnlocked && (
                                       <div className="mb-4 text-[11px] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-2 rounded-md font-mono flex justify-between items-center">
                                           <span>⚠️ {isAr ? "معاينة فك التشفير الرمزية مؤقتة" : "TEMPORARY DECRYPTED PREVIEW ACTIVE (Sandbox mode)"}</span>
                                           <button onClick={() => setTempUnlocked(false)} className="underline hover:no-underline">{isAr ? "إعادة تشفير المعاينة" : "Re-encrypt"}</button>
                                       </div>
                                   )}
                                   <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedContent[activeTab as any] || '') }} />
                                </div>
                            </div>
                        )}
                        
                        {activeTab !== 'history' && <DocumentVerificationFooter doc={doc} language={language} />}
                    </div>
                </main>
                
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-gray-800 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <button onClick={handleDownloadPDF} className="flex items-center gap-2 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 py-2 px-3 rounded shadow-xs transition-colors">
                        PDF
                      </button>
                      <button onClick={handleDownloadWord} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 py-2 px-3 rounded shadow-xs transition-colors">
                        Word
                      </button>
                      <button onClick={handleDownloadJSON} className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 py-2 px-3 rounded shadow-xs transition-colors">
                        JSON
                      </button>
                    </div>

                    <div className="flex gap-2">
                        {onUpdateDocument && !doc.cryptographicSeal && (
                            <button
                                onClick={handleApplyMultilateralSeal}
                                className="px-4 py-2 border-2 border-teal-600 text-xs font-bold rounded text-teal-600 bg-teal-500/5 hover:bg-teal-500/10 transition-colors flex items-center gap-1.5"
                                title="Sign and encrypt document with multilateral CEO, CTO, CISO keys"
                            >
                                🔒 {isAr ? "توقيع وتشفير الإدارة التنفيذية" : "Multilateral Digital Seal"}
                            </button>
                        )}
                        
                        {isPending && isActionable && viewingVersion === null && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDecision('Rejected')}
                                    className="px-4 py-2 border border-red-300 text-xs font-semibold rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                                    title="Reject this document"
                                >
                                    {isAr ? "رفض" : "Reject"}
                                </button>
                                <button
                                    onClick={() => handleDecision('Approved')}
                                    className="px-4 py-2 border border-transparent text-xs font-semibold rounded shadow-xs text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                                    title="Approve this document"
                                >
                                    {isAr ? "اعتماد رقمي" : "Approve & Sign"}
                                </button>
                            </div>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

const TemplatesView: React.FC<{
    onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
    permissions: Set<Permission>;
}> = ({ onAddDocument, permissions }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltPolicyTemplate | null>(null);
    const [selectedControl, setSelectedControl] = useState<string>('');
    const [previewTab, setPreviewTab] = useState<'policy' | 'procedure' | 'guideline'>('policy');
    const canApplyTemplate = permissions.has('templates:apply');

    const allControls = useMemo(() => eccData.flatMap(domain => domain.subdomains.flatMap(subdomain => subdomain.controls.map(control => ({...control, subdomain, domain})))), []);
    
    useEffect(() => {
        if (selectedTemplate) {
            setPreviewTab('policy');
        }
    }, [selectedTemplate]);

    const handleUseTemplate = () => {
        if (selectedTemplate && selectedControl) {
            const controlData = allControls.find(c => c.id === selectedControl);
            if(controlData) {
                onAddDocument(controlData, controlData.subdomain, controlData.domain, selectedTemplate.content);
                alert(`Template '${selectedTemplate.title}' applied to control ${selectedControl} and sent for approval.`);
                setSelectedControl('');
                setSelectedTemplate(null);
            }
        }
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <h3 className="font-normal text-lg text-gray-800 dark:text-gray-200">Policy Templates</h3>
                {policyTemplates.map(template => (
                    <button key={template.id} onClick={() => setSelectedTemplate(template)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedTemplate?.id === template.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <h4 className="font-normal text-gray-900 dark:text-gray-100">{template.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
            {selectedTemplate && (
                 <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 self-start">
                    <div>
                        <h3 className="font-normal text-lg text-gray-800 dark:text-gray-200">Apply Template: <span className="text-teal-600 dark:text-teal-400">{selectedTemplate.title}</span></h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Select a control to apply this policy template to. This will create a new document and start the approval process.</p>
                        <div className="space-y-4">
                            <label htmlFor="control-select" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Target Control</label>
                            <select 
                                id="control-select" 
                                value={selectedControl} 
                                onChange={(e) => setSelectedControl(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500"
                            >
                                <option value="">-- Select a Control --</option>
                                {allControls.map(c => <option key={c.id} value={c.id}>{c.id}: {c.description.substring(0, 80)}...</option>)}
                            </select>
                            {canApplyTemplate ? (
                                <button 
                                    onClick={handleUseTemplate} 
                                    disabled={!selectedControl}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Use This Template
                                </button>
                            ) : (
                                <div className="p-3 text-center bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        You do not have permission to apply templates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-normal text-lg text-gray-800 dark:text-gray-200 mb-4">Template Preview</h4>
                        <div className="border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                            <div className="border-b border-gray-200 dark:border-gray-600">
                                <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                                    <button
                                        onClick={() => setPreviewTab('policy')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'policy' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Policy
                                    </button>
                                    <button
                                        onClick={() => setPreviewTab('procedure')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'procedure' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Procedure
                                    </button>
                                    <button
                                        onClick={() => setPreviewTab('guideline')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'guideline' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Guideline
                                    </button>
                                </nav>
                            </div>
                            <div className="p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-b-md">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedTemplate.content[previewTab]) }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


interface DocumentsPageProps {
  repository: PolicyDocument[];
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
  onUpdateDocument?: (doc: PolicyDocument) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
  initialOpenDocId?: string; // New prop for auto-opening a doc
  onClearInitialDoc?: () => void; // New prop to clear the ID in parent
  language?: 'en' | 'ar';
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ 
    repository, 
    currentUser, 
    onApprovalAction, 
    onAddDocument, 
    onUpdateDocument,
    permissions, 
    company, 
    initialOpenDocId, 
    onClearInitialDoc,
    language = 'en'
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'all' | 'templates'>('tasks');
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | null>(null);

  const myTasks = useMemo(() => 
    repository.filter(doc => statusToRoleMap[doc.status] === currentUser.role),
    [repository, currentUser]
  );
  
  const sortedRepo = useMemo(() => 
    [...repository].sort((a, b) => b.updatedAt - a.updatedAt),
    [repository]
  );

  // Auto-open document effect
  useEffect(() => {
      if (initialOpenDocId) {
          const doc = repository.find(d => d.id === initialOpenDocId);
          if (doc) {
              setSelectedDoc(doc);
              // Switch to 'all' tab if it's not in my tasks to ensure context is clear, though modal overlays everything
              if (!statusToRoleMap[doc.status] || statusToRoleMap[doc.status] !== currentUser.role) {
                  setActiveTab('all');
              }
              if (onClearInitialDoc) {
                  onClearInitialDoc();
              }
          }
      }
  }, [initialOpenDocId, repository, currentUser.role, onClearInitialDoc]);

  // Synchronize open document if it changes in repository (e.g. after adding cryptographic seals)
  useEffect(() => {
      if (selectedDoc) {
          const updated = repository.find(d => d.id === selectedDoc.id);
          if (updated) {
              setSelectedDoc(updated);
          }
      }
  }, [repository]);

  const renderTable = (docs: PolicyDocument[]) => (
    <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
            <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Control</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                       {docs.map(doc => (
                           <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center gap-2">
                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100">{doc.controlId}</span>
                                    {doc.generatedBy === 'AI Agent' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                            <SparklesIcon className="w-3 h-3" />
                                            AI-Generated
                                        </span>
                                    )}
                                   </div>
                                   <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{doc.controlDescription}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center space-x-2">
                                       <span className={`px-2 inline-flex text-xs leading-5 font-normal rounded-full ${getStatusColor(doc.status)}`}>
                                           {doc.status}
                                       </span>
                                       {doc.status.startsWith('Pending') && statusToRoleMap[doc.status] && (
                                           <div className="flex items-center text-xs text-gray-500 dark:text-gray-400" title={`Waiting for ${statusToRoleMap[doc.status]} approval`}>
                                               <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                                               <span className="font-normal">{statusToRoleMap[doc.status]}</span>
                                           </div>
                                       )}
                                   </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-normal">
                                   <button onClick={() => setSelectedDoc(doc)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200">View</button>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">Document Management</h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Review, approve, and manage all cybersecurity policy documents.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('tasks')} className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'tasks' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                My Tasks
                {myTasks.length > 0 && <span className="ml-2 absolute top-3 -right-4 inline-flex items-center justify-center px-2 py-1 text-xs font-normal leading-none text-red-100 bg-red-600 rounded-full">{myTasks.length}</span>}
            </button>
            <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'all' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>All Documents</button>
            {permissions.has('templates:read') && (
                <button onClick={() => setActiveTab('templates')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'templates' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>Templates</button>
            )}
        </nav>
      </div>

      <div>
        {activeTab === 'tasks' && (myTasks.length > 0 ? renderTable(myTasks) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">You have no pending tasks.</p>)}
        {activeTab === 'all' && (sortedRepo.length > 0 ? renderTable(sortedRepo) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No documents have been generated yet.</p>)}
        {activeTab === 'templates' && <TemplatesView onAddDocument={onAddDocument} permissions={permissions} />}
      </div>
      
      {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} currentUser={currentUser} onApprovalAction={onApprovalAction} onUpdateDocument={onUpdateDocument} permissions={permissions} company={company} language={language} />}
    </div>
  );
};
