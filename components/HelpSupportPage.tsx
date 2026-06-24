import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Users, 
  ChevronDown, 
  Play, 
  Volume2, 
  VolumeX, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Server, 
  ArrowRight,
  Sparkles,
  Info,
  Terminal,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface HelpSupportPageProps {
  onStartTour: () => void;
  language?: 'en' | 'ar';
}

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ onStartTour, language = 'en' }) => {
  const [activeNode, setActiveNode] = useState<string>('dashboard');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Audio controller
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (isMuted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.lang = targetLang;

    const voices = window.speechSynthesis.getVoices();
    const targetVoices = voices.filter(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase()) || 
      v.lang.toLowerCase().startsWith(language)
    );

    // Premium natural voices to guarantee beautiful, human-like voice quality
    const premiumKeywords = [
      'natural', 'neural', 'premium', 'google', 'apple', 'siri', 'samantha', 'aria', 'guy', 'david', 'zira', 'susan', 'hazel',
      'maged', 'hoda', 'tarik', 'laila', 'zeina', 'salma'
    ];

    let bestVoice = null;
    for (const keyword of premiumKeywords) {
      bestVoice = targetVoices.find(v => v.name.toLowerCase().includes(keyword));
      if (bestVoice) break;
    }

    if (!bestVoice) {
      // Specifically avoid legacy local robotic systems if any other voice is available
      bestVoice = targetVoices.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak')) ||
                  targetVoices[0] || 
                  null;
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Gentle, pleasant, human-sounding speaking rates ( robotic voice is usually too fast )
    utterance.rate = language === 'ar' ? 0.90 : 0.95;
    utterance.pitch = language === 'ar' ? 1.0 : 1.02;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const architectureNodes = [
    {
      id: 'dashboard',
      titleEn: '1. GRC Compliance Control Center',
      titleAr: '١. مركز قيادة التزام الحوكمة GRC',
      icon: Layers,
      color: 'from-blue-500 to-cyan-500 shadow-blue-500/10',
      descEn: 'The core visualization dashboard displaying real-time compliance metrics, framework coverages (NCA ECC, SAMA, CMA, PDPL), live gaps, and aggregated scores. Highlights status trends with interactive high-contrast charts.',
      descAr: 'لوحة التحكم الرئيسية التي تعرض مؤشرات قياس الالتزام في الوقت الفعلي، وتغطية المعايير والضوابط الصادرة عن الهيئة الوطنية للأمن السيبراني، البنك المركزي السعودي، هيئة السوق المالية، ونظام حماية البيانات الشخصية.',
      tipsEn: [
        'Monitor aggregated compliance percentiles dynamically.',
        'Filter assessments by Domain, Sub-domain, and Compliance Status.',
        'Click "Editable Assessment Sheet" for rapid bulk-editing operations.'
      ],
      tipsAr: [
        'متابعة نسب الالتزام المجمعة والفرعية بشكل ديناميكي ومباشر.',
        'تصفية وفلترة الضوابط حسب المجال الأساسي، الفرعي وحالة الالتزام.',
        'انقر على "جدول البيانات القابل للتعديل" لإجراء تحديثات جماعية سريعة.'
      ],
      voiceTextEn: 'The GRC Compliance Control Center serves as your main dashboard. It aggregates compliance scores for NCA, SAMA, and other crucial frameworks in real-time. Use the filters to drill down into specific domains or edit controls in bulk using the spreadsheet view.',
      voiceTextAr: 'يوفر لك مركز قيادة الالتزام لوحة متابعة موحدة تجمع نسب ومؤشرات التزام الجهة بالضوابط المختلفة كضوابط الهيئة الوطنية وبنك ساما. يمكنك فرز الضوابط وتعديلها دفعة واحدة من خلال جدول التحرير السريع.'
    },
    {
      id: 'boardroom',
      titleEn: '2. Virtual Boardroom & AI Agents',
      titleAr: '٢. مجلس الإدارة الافتراضي ووكلاء الذكاء الاصطناعي',
      icon: Users,
      color: 'from-purple-500 to-pink-500 shadow-purple-500/10',
      descEn: 'An advanced multi-agent simulator where specialized AI Agents (CISO, CTO, DPO, CIO) hold automated discussions to review cybersecurity policies, vote on critical compliance challenges, and assign RACI tasks.',
      descAr: 'غرفة محاكاة حية متطورة تضم وكلاء ذكاء اصطناعي متخصصين (مسؤول أمن المعلومات، مدير التقنية، مسؤول حماية البيانات) لمناقشة السياسات والتصويت على القرارات وتوزيع المسؤوليات وتعيين المهام.',
      tipsEn: [
        'Initiate custom boardroom discussions by typing prompts.',
        'Observe distinct agent voice characteristics and real-time votes.',
        'Review the generated RACI matrices to identify key owners.'
      ],
      tipsAr: [
        'ابدأ نقاشاً برلمانياً مخصصاً بكتابة موضوع أو تحدي سيبراني جديد.',
        'شاهد الحوار التفاعلي المصوت واستمع لأصوات الوكلاء المتميزة والواضحة.',
        'راجع مصفوفة راسي الناتجة لتوثيق المسؤوليات والمهام بوضوح.'
      ],
      voiceTextEn: 'The Virtual Boardroom leverages specialized AI agents simulating roles like the CISO and CTO. They discuss governance issues, vote on resolutions, and build interactive RACI matrices. You can hear each agent speak with a custom, high-fidelity professional voice.',
      voiceTextAr: 'مجلس الإدارة الافتراضي يجمع نخبة من خبراء الذكاء الاصطناعي كمسؤول أمن المعلومات ومدير التقنية لمناقشة تحديات الالتزام والتصويت عليها وتوليد مصفوفة المسؤوليات بصوت بشري مميز وموثوق لكل وكيل.'
    },
    {
      id: 'risk',
      titleEn: '3. ISO 31000 Risk Register',
      titleAr: '٣. سجل المخاطر ومعايير أيزو ٣١٠٠٠',
      icon: AlertTriangle,
      color: 'from-amber-500 to-red-500 shadow-amber-500/10',
      descEn: 'An interactive risk analysis matrix compliant with ISO 31000. It maps risks based on Likelihood and Impact, computes heatmaps, tracks mitigations, and links risks to active cybersecurity controls.',
      descAr: 'مصفوفة تفاعلية متطورة لإدارة وتحليل المخاطر بما يتوافق مع المعيار العالمي أيزو 31000. تقوم باحتساب مستويات الخطر تلقائياً، وربطها بالضوابط الوقائية المعالجة وتتبعها.',
      tipsEn: [
        'View the dynamic color-coded 5x5 Risk Heatmap.',
        'Add, edit, or remove technical and operational threats.',
        'Link risks directly to active controls to trace mitigation paths.'
      ],
      tipsAr: [
        'تصفح جدول الخطر الحراري خماسي الأبعاد لمعرفة مستويات التهديد.',
        'إضافة وتعديل المخاطر التشغيلية والتقنية وتحديد الإجراءات التصحيحية.',
        'ربط المخاطر بضوابط الالتزام الأساسية لتتبع مسار المعالجة والأثر.'
      ],
      voiceTextEn: 'Our Risk Register is fully aligned with ISO 31000 standards. It provides a visual 5x5 heatmap to assess likelihood and impact. You can record threats, document mitigation plans, and link them to active controls for seamless traceability.',
      voiceTextAr: 'يمنحك سجل المخاطر لوحة تفاعلية متوافقة مع معيار أيزو 31000 لتقييم احتمالية حدوث المخاطر وأثرها عبر مصفوفة حرارية ذكية، مع إمكانية ربط كل خطر بالضابط الأمني المناسب لمعالجته.'
    },
    {
      id: 'airgap',
      titleEn: '4. Air-Gapped AI (Gemma 4)',
      titleAr: '٤. الربط السيادي المحلي المعزول (نموذج غيما ٤)',
      icon: Cpu,
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10',
      descEn: 'A sovereign privacy feature for national security or critical infrastructure. Activating the Air-Gap toggle routes all prompt reasoning to a fully isolated local Google Gemma 4 model, preventing data leaks.',
      descAr: 'ميزة أمنية سيادية فائقة مخصصة للجهات الحكومية والشبكات الحساسة المعزولة عن الإنترنت. يؤدي تفعيلها إلى تحويل كافة عمليات معالجة وتحليل السياسات محلياً بنسبة ١٠٠٪ دون أي اتصال خارجي.',
      tipsEn: [
        'Toggle Air-Gap mode on from the main header or settings.',
        'Ensures 100% data residency and zero-latency cloud queries.',
        'Ideal for secret classified policies or sensitive defense networks.'
      ],
      tipsAr: [
        'فعل وضع الربط المعزول من زر التبديل العلوي لحماية بياناتك الحساسة.',
        'يضمن بقاء البيانات داخل البيئة المحلية بنسبة مائة بالمائة وبمعزل تام عن الإنترنت.',
        'مثالي لمراجعة وثائق السياسات السرية وشبكات البنية التحتية الحساسة.'
      ],
      voiceTextEn: 'The Air-Gapped Local Link enables total sovereign data privacy. When enabled, the application disconnects from the external internet and handles all intelligence and assessment analysis using a secure, local Gemma 4 model.',
      voiceTextAr: 'يوفر لك الربط المحلي المعزول حماية مطلقة وسيادة كاملة لبياناتك السيبرانية الحساسة. عند تفعيله، ينقطع النظام تلقائياً عن الخدمات السحابية الخارجية ليعتمد كلياً على نموذج غيما المحلي الآمن.'
    },
    {
      id: 'ledger',
      titleEn: '5. Immutable Audit Ledger',
      titleAr: '٥. سجل التدقيق غير القابل للتعديل',
      icon: Database,
      color: 'from-slate-600 to-zinc-800 shadow-slate-600/10',
      descEn: 'A chronological, tamper-proof system ledger that records all user assessments, policy updates, evidence uploads, and boardroom decisions, providing a robust chain of custody for external cyber-auditors.',
      descAr: 'سجل زمني تدقيقي آمن وغير قابل للتعديل يوثق كافة إجراءات التقييم، وتغيير حالات الضوابط، وإرفاق الأدلة والاجتماعات، مما يسهل عمليات التدقيق الخارجي وإثبات الالتزام قانونياً.',
      tipsEn: [
        'Export verified CSV compliance reports with single clicks.',
        'Track exact timestamps, agent IDs, and actions for legal compliance.',
        'Upload files with automated hash calculation for file verification.'
      ],
      tipsAr: [
        'تصدير تقارير التزام شاملة بصيغة إكسل أو ملفات نصية معتمدة.',
        'متابعة البصمة الزمنية الدقيقة وتوقيعات الوكلاء الرقمية لتوثيق كل تعديل.',
        'إرفاق أدلة الإثبات مع احتساب البصمة الرقمية للملف لمنع التلاعب.'
      ],
      voiceTextEn: 'The Immutable Audit Ledger tracks all system operations chronologically. Every compliance update, policy edit, and boardroom resolution is logged with cryptographic timestamps, creating a secure audit trail for external compliance inspectors.',
      voiceTextAr: 'يقوم سجل التدقيق غير القابل للتعديل برصد وتوثيق كافة العمليات في النظام تاريخياً بدقة متناهية، ليمثل سجلاً قانونياً موثوقاً أمام مدققي الهيئات التنظيمية والجهات السيادية.'
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      titleEn: 'Configure Profile & Scope',
      titleAr: 'تهيئة الحساب والنطاق الفني',
      descEn: 'Setup your company profile, select active frameworks, and define read/write permissions for specific operational teams.',
      descAr: 'قم بضبط حساب المنشأة، واختيار الأطر التنظيمية المستهدفة (مثلECC أو SAMA)، وتحديد مصفوفة الصلاحيات لفرق العمل المختلفة.',
      icon: ShieldCheck
    },
    {
      step: 2,
      titleEn: 'Perform Interactive Audit',
      titleAr: 'إجراء التدقيق والتقييم التفاعلي',
      descEn: 'Assess cybersecurity controls in bulk on the interactive sheet, or engage with Noora via Voice Assessment for a fast conversational audit.',
      descAr: 'ابدأ بتقييم الضوابط وتعبئتها يدوياً عبر جدول البيانات الذكي، أو استخدم المساعد الصوتي تفاعلياً لتعبئة البيانات بمجرد التحدث بصوتك.',
      icon: Cpu
    },
    {
      step: 3,
      titleEn: 'Consult Virtual Boardroom',
      titleAr: 'عقد جلسة الحوكمة الافتراضية',
      descEn: 'Invite AI agents to vote on policy gaps, resolve risk concerns, draft mitigating actions, and construct legal compliance documents.',
      descAr: 'قم بإحالة الثغرات أو السياسات لمجلس الإدارة الافتراضي المكون من خبراء الذكاء الاصطناعي للمناقشة والتصويت وصياغة المعالجات بمصفوفة راسي.',
      icon: Users
    },
    {
      step: 4,
      titleEn: 'Mitigate Risks & Log Evidence',
      titleAr: 'معالجة المخاطر وتوثيق الأدلة',
      descEn: 'Map unresolved issues to the ISO 31000 risk register, track progress status, upload secure files, and generate immutable audit ledgers.',
      descAr: 'اربط الفجوات بسجل المخاطر لمعالجة الثغرات، وارفع ملفات الإثبات التنظيمية، وصدر التقارير التدقيقية الموقعة بختم الالتزام الرقمي.',
      icon: FileText
    }
  ];

  const faqs = [
    {
      qEn: 'How can I start a new cybersecurity compliance audit?',
      qAr: 'كيف يمكنني البدء بتقييم التزام سيبراني جديد؟',
      aEn: 'Navigate to any specific framework under the sidebar (e.g., NCA ECC, SAMA). If no audit is running, click "Initiate New Assessment". This resets old draft states and opens a clean, interactive sheet powered by the local ledger.',
      aAr: 'توجه إلى أي من الأطر التنظيمية المتاحة في القائمة الجانبية (مثل ضوابط الهيئة الوطنية ECC). إذا لم يكن هناك تقييم قائم، انقر فوق زر "بدء تقييم جديد" لتصفير المسودات القديمة والبدء فوراً بجدول التدقيق التفاعلي.'
    },
    {
      qEn: 'What is the role of the sovereign Air-Gap Toggle?',
      qAr: 'ما هي أهمية زر تفعيل الربط المحلي المعزول (Air-Gap)؟',
      aEn: 'The Air-Gap toggle restricts the app from sending policy text or chat logs to cloud AI. In this state, the app runs entirely in your browser sandbox and communicates with a local Gemma 4 parsing engine, keeping classified national government secrets completely safe.',
      aAr: 'يعمل زر تفعيل الربط المعزول على عزل النظام كلياً عن شبكة الإنترنت السحابية، حيث يتم تحويل عمليات معالجة وتحليل السياسات محلياً داخل المتصفح بالاعتماد على نموذج غيما المحلي لضمان سرية البيانات الحكومية المطلقة.'
    },
    {
      qEn: 'Can I hear the AI boardroom agents in different premium voices?',
      qAr: 'هل يمكنني الاستماع لوكلاء مجلس الإدارة بأصوات بشرية متعددة؟',
      aEn: 'Yes! The boardroom utilizes advanced Web Speech APIs to map premium, natural male and female voices based on the speaker. For example, Dr. Hoda uses a premium natural female voice, while Eng. Ahmed uses an authoritative deep male voice. Standard robotic voices are automatically filtered out.',
      aAr: 'نعم بالتأكيد! يستخدم مجلس الإدارة الذكي بروتوكول توليد الصوت المتقدم لربط كل وكيل بصوت بشري مناسب لشخصيته ولغته؛ حيث تتحدث الدكتورة هدى بصوت نسائي طبيعي، بينما يتحدث المهندس أحمد بصوت جهوري دافئ وموثوق.'
    },
    {
      qEn: 'How are risks handled under the ISO 31000 standard?',
      qAr: 'كيف يتم التعامل مع المخاطر وفق المعيار العالمي أيزو ٣١٠٠٠؟',
      aEn: 'The Risk Assessment module allows you to define threat profiles, rank them using a visual 5x5 matrix, specify mitigation tasks, and link those threats directly to active regulatory controls. This maintains high visibility for audit reviews.',
      aAr: 'يتيح لك قسم إدارة المخاطر تدوين التهديدات المختلفة وتقييم درجتها عبر مصفوفة خماسية الأبعاد واضحة، مع صياغة خطة معالجة وربط الخطر مباشرة بالضابط الأمني المناسب لمتابعة سد الثغرات.'
    }
  ];

  const activeNodeData = architectureNodes.find(n => n.id === activeNode) || architectureNodes[0];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fade-in px-4">
      
      {/* Title & Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-slate-950 to-slate-900 border border-teal-500/20 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-2xl -z-10"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/25 rounded-full text-[10px] font-bold tracking-wider text-teal-400 uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              {language === 'ar' ? 'دليل المستخدم التفاعلي' : 'Interactive User Manual'}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
              {language === 'ar' ? 'مكتبة المعرفة والسيادة السيبرانية' : 'GRC Sovereign Cyber Manual'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {language === 'ar'
                ? 'استكشف البنية التقنية للمنصة والمسار الإجرائي للالتزام عبر مخطط المعلومات البياني التفاعلي واستمع للدليل الصوتي بصوت بشري طبيعي.'
                : 'Explore the platform architecture and procedural compliance workflows through our interactive bento infographics and natural spoken narration guides.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => speakText(
                language === 'ar'
                  ? 'مرحباً بك في دليل حوكمة البيانات التفاعلي. تصفح المخطط الهيكلي بالنقر على أي عنصر، أو راجع مراحل الالتزام الأربعة.'
                  : 'Welcome to our Interactive Cybersecurity Controls Navigator manual. Click on any component in the landscape map below to explore its details.'
              )}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
              <span>{language === 'ar' ? 'استمع للترحيب الصوتي' : 'Listen to Intro'}</span>
            </button>

            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-xl border border-slate-700/60 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'بدء الجولة التفاعلية' : 'Launch Tour'}</span>
            </button>

            <button
              onClick={() => {
                const speechState = !isMuted;
                setIsMuted(speechState);
                if (speechState && typeof window !== 'undefined') {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              title={isMuted ? "Unmute Voice Guide" : "Mute Voice Guide"}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25' 
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Interactive System Landscape Map (Infographic Bento) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '١. مخطط البنية السيبرانية التفاعلي' : '1. Interactive System Architecture Infographic'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Visual SVG Map (Bento Nodes) */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">
              {language === 'ar'
                ? 'انقر على أي مكون من مكونات الخريطة لتسليط الضوء عليه وعرض شرحه التفصيلي وسماع الشرح الصوتي الخاص به:'
                : 'Click any module on the interactive topology block to display operational workflows and play premium human audio narration:'}
            </p>

            <div className="relative border border-slate-100 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden space-y-6">
              
              {/* Node 1: Control Center */}
              <button
                onClick={() => setActiveNode('dashboard')}
                className={`w-full text-left transition-all duration-300 p-4 rounded-2xl border flex items-center justify-between group cursor-pointer ${
                  activeNode === 'dashboard'
                    ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-blue-400/40 dark:hover:border-blue-400/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'بوابة الحوكمة ولوحة التحليلات والقيادة' : 'GRC Dashboard & Analytics Gateway'}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'ar' ? 'مؤشرات الأداء للالتزام (ECC, SAMA, CMA)' : 'Compliance Scores, SAMA & PDPL trackers'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-blue-500 ${activeNode === 'dashboard' ? 'animate-ping' : ''}`}></span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Connecting Vector Line */}
              <div className="flex justify-center -my-3">
                <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 opacity-50"></div>
              </div>

              {/* Node 2: Virtual Boardroom */}
              <button
                onClick={() => setActiveNode('boardroom')}
                className={`w-full text-left transition-all duration-300 p-4 rounded-2xl border flex items-center justify-between group cursor-pointer ${
                  activeNode === 'boardroom'
                    ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5 ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-purple-400/40 dark:hover:border-purple-400/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'مجلس الإدارة الافتراضي الحوكمي' : 'Sovereign AI Boardroom Collaboration'}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'ar' ? 'وكلاء الذكاء الاصطناعي (CISO, CTO) ومصفوفة المسؤوليات RACI' : 'AI specialists, voting algorithms, and task matrices'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-purple-500 ${activeNode === 'boardroom' ? 'animate-ping' : ''}`}></span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Connecting Vector Line Double Branch */}
              <div className="grid grid-cols-2 gap-4 -my-3 px-12">
                <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-amber-500 opacity-50 justify-self-start"></div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-emerald-500 opacity-50 justify-self-end"></div>
              </div>

              {/* Two Column Layout for Risk Register and AirGap AI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Node 3: Risk Register */}
                <button
                  onClick={() => setActiveNode('risk')}
                  className={`text-left transition-all duration-300 p-4 rounded-2xl border flex flex-col justify-between h-32 group cursor-pointer ${
                    activeNode === 'risk'
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-amber-400/40 dark:hover:border-amber-400/30'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-md`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className={`h-2 w-2 rounded-full bg-amber-500 ${activeNode === 'risk' ? 'animate-ping' : ''}`}></span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'سجل المخاطر (أيزو ٣١٠٠٠)' : 'ISO 31000 Risk Register'}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                      {language === 'ar' ? 'مصفوفة التهديدات والفرص والوقاية' : 'Threat matrix & preventative maps'}
                    </p>
                  </div>
                </button>

                {/* Node 4: Air-Gapped AI Link */}
                <button
                  onClick={() => setActiveNode('airgap')}
                  className={`text-left transition-all duration-300 p-4 rounded-2xl border flex flex-col justify-between h-32 group cursor-pointer ${
                    activeNode === 'airgap'
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-emerald-400/40 dark:hover:border-emerald-400/30'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md`}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className={`h-2 w-2 rounded-full bg-emerald-500 ${activeNode === 'airgap' ? 'animate-ping' : ''}`}></span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'نموذج غيما المعزول السيادي' : 'Air-Gapped Gemma 4 Model'}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                      {language === 'ar' ? 'معالجة محلية كاملة دون سحابة' : 'Fully localized offline LLM parser'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Connecting Vector Lines to Ledger */}
              <div className="grid grid-cols-2 gap-4 -my-3 px-12">
                <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-slate-600 opacity-50 justify-self-start"></div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-slate-600 opacity-50 justify-self-end"></div>
              </div>

              {/* Node 5: Ledger */}
              <button
                onClick={() => setActiveNode('ledger')}
                className={`w-full text-left transition-all duration-300 p-4 rounded-2xl border flex items-center justify-between group cursor-pointer ${
                  activeNode === 'ledger'
                    ? 'bg-slate-500/10 border-slate-500/40 shadow-lg shadow-slate-500/5 ring-2 ring-slate-500/20'
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-slate-400/40 dark:hover:border-slate-400/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br from-slate-600 to-zinc-800 text-white shadow-md`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'سجل التدقيق المحلي وسلسلة الإثبات' : 'Immutable Secure Compliance Ledger'}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {language === 'ar' ? 'توقيع وتأمين الحركات والتعديلات دورياً' : 'Cryptographic trail and file integrity maps'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-slate-600 ${activeNode === 'ledger' ? 'animate-ping' : ''}`}></span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>

          {/* Interactive Workspace Explanation Card */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-150 dark:border-gray-700 p-6 shadow-xl space-y-6 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Node Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-widest text-teal-600 dark:text-cyan-400 uppercase">
                      {language === 'ar' ? 'المكون المحدد' : 'Selected Component'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <activeNodeData.icon className="w-4 h-4 text-slate-500" />
                      {language === 'ar' ? activeNodeData.titleAr : activeNodeData.titleEn}
                    </h3>
                  </div>
                  
                  {/* Spoken Narration Button */}
                  <button
                    onClick={() => speakText(language === 'ar' ? activeNodeData.voiceTextAr : activeNodeData.voiceTextEn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-cyan-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-lg text-[10px] font-bold uppercase transition-all"
                    title="Narrate Section with natural voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'استمع للمكون' : 'Speak'}</span>
                  </button>
                </div>

                {/* Node Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {language === 'ar' ? activeNodeData.descAr : activeNodeData.descEn}
                </p>

                {/* Steps and Manual instructions */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'إرشادات الاستخدام المتقدمة' : 'Advanced Usage Instructions'}
                  </span>
                  
                  <ul className="space-y-2">
                    {(language === 'ar' ? activeNodeData.tipsAr : activeNodeData.tipsEn).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Status footer inside card */}
              <div className="pt-4 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                  {language === 'ar' ? 'المعالج المحلي: متصل وآمن' : 'Local Engine: Ready & Airgapped'}
                </span>
                <span>ID: grc_topo_{activeNode}</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: Compliance Life Cycle Interactive Workflow */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600 dark:text-pink-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '٢. دورة حياة الالتزام والتدقيق الرقمي' : '2. Interactive Compliance Lifecycle Journey'}
          </h2>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-8">
          
          {/* Timeline Navigation Headers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {workflowSteps.map((ws, index) => {
              const WS_Icon = ws.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setActiveWorkflowStep(index);
                    speakText(language === 'ar' ? ws.descAr : ws.descEn);
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer h-28 relative ${
                    activeWorkflowStep === index
                      ? 'bg-gradient-to-br from-teal-900 to-slate-950 border-teal-500 text-white shadow-lg ring-2 ring-teal-500/10'
                      : 'bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeWorkflowStep === index ? 'text-teal-400' : 'text-slate-400'}`}>
                      {language === 'ar' ? `المرحلة ${ws.step}` : `STAGE 0${ws.step}`}
                    </span>
                    <WS_Icon className={`w-4 h-4 ${activeWorkflowStep === index ? 'text-teal-400' : 'text-slate-400'}`} />
                  </div>
                  
                  <h4 className="text-xs font-bold leading-snug line-clamp-2">
                    {language === 'ar' ? ws.titleAr : ws.titleEn}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Detailed Workflow Step Presentation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-150 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] font-extrabold text-teal-600 dark:text-cyan-400 uppercase tracking-wider">
                {language === 'ar' ? 'الخطوات التشغيلية الحية لغرفة العمليات' : 'Active Compliance Step Flow'}
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {language === 'ar' ? workflowSteps[activeWorkflowStep].titleAr : workflowSteps[activeWorkflowStep].titleEn}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'ar' ? workflowSteps[activeWorkflowStep].descAr : workflowSteps[activeWorkflowStep].descEn}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => speakText(language === 'ar' ? workflowSteps[activeWorkflowStep].descAr : workflowSteps[activeWorkflowStep].descEn)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'استمع للخطوة' : 'Listen'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: Standard Compliance FAQs Accordion */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {language === 'ar' ? '٣. الأسئلة المتكررة وأكواد التشغيل السريع' : '3. Frequently Asked Questions'}
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-150 dark:border-gray-700 rounded-3xl p-6 shadow-sm divide-y divide-slate-100 dark:divide-gray-700">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() => {
                    setOpenFaq(isOpen ? null : idx);
                    if (!isOpen) {
                      speakText(language === 'ar' ? faq.aAr : faq.aEn);
                    }
                  }}
                  className="w-full flex justify-between items-center text-left text-slate-800 dark:text-slate-200 hover:text-teal-600 transition-colors"
                >
                  <span className="text-xs font-bold pr-4">
                    {language === 'ar' ? faq.qAr : faq.qEn}
                  </span>
                  <ChevronDown className={`w-4 h-4 transform transition-transform text-slate-400 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-4">
                    <p>{language === 'ar' ? faq.aAr : faq.aEn}</p>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-gray-800">
                      <span className="text-[10px] text-slate-400 italic">
                        {language === 'ar' ? 'اضغط للاستماع مجدداً بصوت بشري طبيعي' : 'Click Speaker to replay spoken guide'}
                      </span>
                      <button
                        onClick={() => speakText(language === 'ar' ? faq.aAr : faq.aEn)}
                        className="p-1.5 rounded bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-teal-600 transition-all cursor-pointer"
                        title="Speak Answer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER & DOWNLOAD OPTION */}
      <div className="rounded-3xl border border-slate-200/60 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/30 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? 'هل تحتاج إلى مزيد من الدعم الفني المباشر؟' : 'Need Additional Technical Support?'}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' 
              ? 'اتصل بمسؤولي الحوكمة والامتياز بالمنشأة أو تواصل على support@metaworkss.com'
              : 'Contact our cybersecurity team at support@metaworkss.com or call +966 -0570992973'}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="mailto:support@metaworkss.com"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مراسلتنا بالبريد' : 'Email HelpDesk'}</span>
          </a>
        </div>
      </div>

    </div>
  );
};
