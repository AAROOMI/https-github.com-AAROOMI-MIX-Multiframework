import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: string; // Automatically navigate to this view when starting this step
}

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSetView: (view: any) => void;
  language?: 'en' | 'ar';
}

export const TourGuide: React.FC<TourGuideProps> = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onSetView, 
  language = 'en' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Voice-First Mode Tech Stack States
  const [isVoiceFirstEnabled, setIsVoiceFirstEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [styles, setStyles] = useState<{ highlight: React.CSSProperties, popover: React.CSSProperties }>({
    highlight: { display: 'none' },
    popover: { display: 'none' },
  });
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // State reference tracking to completely avoid stale closures in browser event listeners
  const isOpenRef = useRef(isOpen);
  const isVoiceFirstRef = useRef(isVoiceFirstEnabled);
  const isSpeakingRef = useRef(isSpeaking);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { isVoiceFirstRef.current = isVoiceFirstEnabled; }, [isVoiceFirstEnabled]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // English Steps Definition
  const stepsEn: TourStep[] = [
    {
      target: 'body',
      title: 'Welcome to your GRC Cybersecurity Command',
      content: 'Welcome, Officer! This interactive voice-guided journey will walk you through the entire application step-by-step. We will explain how to use every single function across our sovereign compliance ecosystem so you can easily navigate and master your security controls.',
      position: 'center',
      view: 'dashboard'
    },
    {
      target: '#sidebar-dashboard',
      title: 'Compliance Command Dashboard',
      content: 'How to use: Use this dashboard to get an immediate high-level standing of your organizational alignment. You can track dynamic gauges and risk alerts. Scroll to the bottom to view the blockchain-inspired audit log. Here, every control modification, AI document generation, or digital sign-off is logged in an immutable ledger with full cryptographic signatures.',
      position: 'right',
      view: 'dashboard'
    },
    {
      target: '#sidebar-assessment',
      title: 'Saudi NCA ECC Compliance Portal',
      content: 'How to use: Click here to manage your alignment with Saudi National Cybersecurity Authority Essential Controls. In this portal, navigate the 5 main security domains on the left. Click any domain to drill down into controls. For each control, you can review details, toggle implementation status, assign control owners, and upload verification files to your secure evidence vault.',
      position: 'right',
      view: 'assessment'
    },
    {
      target: '#sidebar-samaFamilySuite',
      title: 'SAMA Banking Framework Suite',
      content: 'How to use: This is a highly specialized environment representing the Saudi Central Bank regulations. Toggle between 7 distinct financial frameworks, such as Cyber Security Framework, Business Continuity, and Fraud. This lets you align core banking services with regulatory directives in one consolidated workstation.',
      position: 'right',
      view: 'samaFamilySuite'
    },
    {
      target: '#sama-propose-btn',
      title: 'Proposing Custom SAMA Controls',
      content: 'How to use: If your bank requires custom controls, click the "Propose Custom SAMA Control" button at the bottom. Fill in the title and code. When submitted, our Virtual CISO AI agent automatically audits the proposal, runs an alignment check, and applies a secure, encrypted digital stamp of approval directly into the system logs.',
      position: 'top',
      view: 'samaFamilySuite'
    },
    {
      target: '#sama-generate-policy-btn',
      title: 'Automated GRC Policy & SOP Generation',
      content: 'How to use: Under SAMA controls, select any control and click "Auto-Generate GRC Suite". The system drafts a full suite of board-ready compliance documents: security policies, step-by-step procedures, implementation guidelines, and standard operating matrices. You can edit and export these templates instantly.',
      position: 'top',
      view: 'samaFamilySuite'
    },
    {
      target: '#sidebar-virtualDepartment',
      title: 'Virtual Cybersecurity Boardroom',
      content: 'How to use: Meet your virtual, autonomous department of GRC experts comprising CISO, CTO, DPO, and CIO. You can delegate custom compliance tasks to them, read their automated discussions as they debate security policy proposals, and view their cryptographic approval status for key tasks.',
      position: 'right',
      view: 'virtualDepartment'
    },
    {
      target: '#sidebar-riskAssessment',
      title: 'ISO 31000 Sovereign Risk Register',
      content: 'How to use: To identify and mitigate enterprise threats, click "Identify New Risk". Enter the title, select threat category, and assign likelihood and impact values from 1 to 5. The matrix dynamically computes the Risk Score and highlights priority levels. You can then map mitigating controls to reduce vulnerabilities.',
      position: 'right',
      view: 'riskAssessment'
    },
    {
      target: '#header-airgap-toggle',
      title: 'Air-Gap Sovereign Isolation',
      content: 'How to use: Click the Neural Link button in the top header. In this mode, public external APIs are completely blocked, and all GRC intelligence, policy drafts, and virtual boardroom discussions are handled locally inside your secure environment using the embedded offline Gemma model.',
      position: 'bottom',
      view: 'dashboard'
    },
    {
      target: '#sidebar-liveVoiceDemo',
      title: 'Sovereign Voice Assistant & Mic Navigation',
      content: 'How to use: Click the microphone in the sidebar, or speak directly to our assistant. Try speaking navigation commands such as "Show Dashboard", "Open SAMA Suite", or "Open Risk Register" to run your compliance workstation completely hands-free using local secure voice recognition.',
      position: 'right',
      view: 'liveVoiceDemo'
    }
  ];

  // Arabic Steps Definition
  const stepsAr: TourStep[] = [
    {
      target: 'body',
      title: 'مرحباً بك في منصة الالتزام والسيادة السيبرانية',
      content: 'أهلاً بك يا سيادة مسؤول الأمن السيبراني! سيرافقك هذا المساعد الصوتي التفاعلي خطوة بخطوة لشرح كل وظيفة من وظائف النظام المتكامل، لنوضح لك بالتفصيل كيفية تشغيل وإدارة متطلبات الالتزام عبر منشأتك بكل يسر.',
      position: 'center',
      view: 'dashboard'
    },
    {
      target: '#sidebar-dashboard',
      title: 'لوحة التحكم الموحدة لمؤشرات الأداء',
      content: 'كيفية الاستخدام: تابع نسب الالتزام الموحدة لضوابط الهيئة الوطنية، والبنك المركزي، وهيئة السوق المالية، ونظام حماية البيانات الشخصية. كما يمكنك متابعة سجل التدقيق الحي في الأسفل لتتبع كل تغيير رقمياً وبشكل موثق وغير قابل للتعديل.',
      position: 'left',
      view: 'dashboard'
    },
    {
      target: '#sidebar-assessment',
      title: 'بوابة ضوابط الهيئة الوطنية للأمن السيبراني ECC',
      content: 'كيفية الاستخدام: تصفح المجالات الخمسة الرئيسية للضوابط، قم بالدخول في الضوابط الفرعية، وحدد حالة الالتزام لكل ضابط، وارفع مستندات الإثبات، وقم بتعيين المسؤولين عن التنفيذ لضمان تلبية المعايير الحكومية.',
      position: 'left',
      view: 'assessment'
    },
    {
      target: '#sidebar-samaFamilySuite',
      title: 'إطارات البنك المركزي السعودي SAMA',
      content: 'كيفية الاستخدام: يمكنك التنقل بين سبعة إطارات مالية وتنظيمية مختلفة تشمل إطار الأمن السيبراني، واستمرارية الأعمال، وحوكمة تقنية المعلومات، ومكافحة الاحتيال، من شاشة موحدة تضمن تلبية متطلبات ساما للخدمات المصرفية.',
      position: 'left',
      view: 'samaFamilySuite'
    },
    {
      target: '#sama-propose-btn',
      title: 'اقتراح الضوابط المخصصة وإقرارها',
      content: 'كيفية الاستخدام: تحت أي إطار من إطارات مؤسسة النقد، اضغط على زر "اقتراح ضابط مخصص" في أسفل القائمة لإضافة متطلبات خاصة بجهتك. سيقوم وكيل رئيس مكتب أمن المعلومات الافتراضي بالتدقيق في الضابط وتطبيق الختم الرقمي المشفر فور اعتماده.',
      position: 'top',
      view: 'samaFamilySuite'
    },
    {
      target: '#sama-generate-policy-btn',
      title: 'الصياغة الآلية لسياسات وإجراءات الحوكمة GRC',
      content: 'كيفية الاستخدام: اختر أي ضابط من ضوابط إطارات ساما، واضغط على زر "صياغة مستندات الحوكمة". سيقوم محرك الذكاء الاصطناعي السيادي فوراً بصياغة حزمة متكاملة تشمل وثيقة السياسة، وإجراءات التشغيل القياسية SOP، والمصفوفات الوظيفية، والأدلة الرقابية الجاهزة للتصدير والتحرير.',
      position: 'top',
      view: 'samaFamilySuite'
    },
    {
      target: '#sidebar-virtualDepartment',
      title: 'مجلس الحوكمة وإدارة المهام الافتراضي',
      content: 'كيفية الاستخدام: راقب نقاشات فريق وكلاء الذكاء الاصطناعي (رئيس أمن المعلومات، رئيس التقنية، مسؤول حماية البيانات، ورئيس المعلومات). يمكنك إسناد مهام الالتزام إليهم وتتبع موافقاتهم وتوقيعاتهم الرقمية المشفرة.',
      position: 'left',
      view: 'virtualDepartment'
    },
    {
      target: '#sidebar-riskAssessment',
      title: 'سجل وإدارة المخاطر التقنية ISO 31000',
      content: 'كيفية الاستخدام: اضغط على زر "إضافة خطر جديد"، حدد وصف التهديد وفئته، ثم اختر درجة الاحتمالية والأثر من واحد إلى خمسة. سيقوم النظام بحساب درجة الخطر الكلية تلقائياً لتتمكن من وضع خطط المعالجة والضوابط الوقائية.',
      position: 'left',
      view: 'riskAssessment'
    },
    {
      target: '#header-airgap-toggle',
      title: 'العزل السيادي التام للبيانات',
      content: 'كيفية الاستخدام: قم بتفعيل هذا الزر لعزل النظام بالكامل عن الشبكات الخارجية وحماية السجلات المصرفية الحساسة. في هذا الوضع، يتم تحويل جميع عمليات الذكاء الاصطناعي وصياغة السياسات لتتم محلياً بالكامل عبر نموذج غوغل غيما المعزول دون تسريب أي بيانات.',
      position: 'bottom',
      view: 'dashboard'
    },
    {
      target: '#sidebar-liveVoiceDemo',
      title: 'التحكم والتنقل بالأوامر الصوتية',
      content: 'كيفية الاستخدام: اضغط على زر الميكروفون في الشريط الجانبي أو ادخل إلى هذه الصفحة وتحدث مباشرة للنظام. جرب نطق أوامر مثل "افتح لوحة التحكم" أو "افتح سجل المخاطر" أو "افتح إطارات ساما" للتنقل والتحكم الكامل بدون استخدام اليدين عبر تقنية التعرف الصوتي المحلي.',
      position: 'left',
      view: 'liveVoiceDemo'
    }
  ];

  const steps = language === 'ar' ? stepsAr : stepsEn;
  const step = steps[currentStep];

  // Speech Synthesis Controller with natural human-like voice mapping
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any previous speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);

    if (isMuted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Detect language and configure appropriate voice locale
    const targetLang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.lang = targetLang;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Find the absolute best premium natural-sounding voice for a human feeling
    const targetVoices = voices.filter(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase()) || 
      v.lang.toLowerCase().startsWith(language)
    );

    // Prioritize natural neural premium voices to completely banish robotic tones
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
      // Avoid anything explicitly mentioning local/espeak/robotic
      bestVoice = targetVoices.find(v => !v.name.toLowerCase().includes('local') && !v.name.toLowerCase().includes('espeak')) ||
                  targetVoices[0] || 
                  null;
    }
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Set warm human conversational flow parameters (slightly slower, gentle breathing cadences)
    utterance.rate = language === 'ar' ? 0.90 : 0.95; // Slightly slower is far more human-like and natural
    utterance.pitch = language === 'ar' ? 1.0 : 1.02; // Warm pitch adjustment


    // Event hooks
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      // Auto start listening in voice-first mode
      setTimeout(() => {
        startListeningIfEnabled();
      }, 300);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
      // Auto start listening in voice-first mode
      setTimeout(() => {
        startListeningIfEnabled();
      }, 300);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle Play/Pause
  const togglePlayPause = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      // Replay
      speakText(`${step.title}. ${step.content}`);
    }
  };

  // Handle Mute toggle
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      // Speak current step text immediately upon unmute
      setTimeout(() => {
        speakText(`${step.title}. ${step.content}`);
      }, 100);
    } else {
      setIsMuted(true);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Synchronize view change when current step shifts
  useEffect(() => {
    if (!isOpen) return;

    if (step.view && step.view !== currentView) {
      onSetView(step.view);
    }
  }, [isOpen, currentStep, step.view, onSetView, currentView]);

  // Compute layout position highlights
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsPaused(false);
      return;
    }

    // Play narration after a short delay to let page mount
    const speakTimer = setTimeout(() => {
      speakText(`${step.title}. ${step.content}`);
    }, 600);

    const calculateStyles = () => {
      const targetElement = document.querySelector(step.target);

      if (step.target === 'body' || !targetElement) {
        setStyles({
          highlight: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '0',
            height: '0',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            zIndex: 150,
          },
          popover: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            zIndex: 160,
          },
        });
        return;
      }

      // Smooth scroll target element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      const targetRect = targetElement.getBoundingClientRect();
      
      const highlightStyle: React.CSSProperties = {
        position: 'fixed',
        top: `${targetRect.top - 4}px`,
        left: `${targetRect.left - 4}px`,
        width: `${targetRect.width + 8}px`,
        height: `${targetRect.height + 8}px`,
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 150,
        pointerEvents: 'none',
        border: '2px solid #06b6d4', // Neon highlight border
      };

      const popoverStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 160,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      };
      
      const popoverRect = popoverRef.current?.getBoundingClientRect();
      const popoverWidth = popoverRect?.width || 340;
      const popoverHeight = popoverRect?.height || 220;
      const margin = 20;

      switch (step.position) {
        case 'top':
          popoverStyle.top = `${targetRect.top - popoverHeight - margin}px`;
          popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
          break;
        case 'left':
          popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
          popoverStyle.left = `${targetRect.left - popoverWidth - margin}px`;
          break;
        case 'right':
          popoverStyle.top = `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`;
          popoverStyle.left = `${targetRect.right + margin}px`;
          break;
        case 'bottom':
        default:
          popoverStyle.top = `${targetRect.bottom + margin}px`;
          popoverStyle.left = `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`;
          break;
      }

      // Prevent popover from spilling offscreen
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;

      const leftVal = parseInt(String(popoverStyle.left), 10);
      const topVal = parseInt(String(popoverStyle.top), 10);

      if (leftVal < margin) popoverStyle.left = `${margin}px`;
      if (leftVal + popoverWidth > viewWidth - margin) {
        popoverStyle.left = `${viewWidth - popoverWidth - margin}px`;
      }
      if (topVal < margin) popoverStyle.top = `${margin}px`;
      if (topVal + popoverHeight > viewHeight - margin) {
        popoverStyle.top = `${viewHeight - popoverHeight - margin}px`;
      }
      
      setStyles({ highlight: highlightStyle, popover: popoverStyle });
    };
    
    calculateStyles();

    // Set recalculation timers to account for asynchronous rendering
    const timer1 = setTimeout(calculateStyles, 100);
    const timer2 = setTimeout(calculateStyles, 450);

    // Dynamic resize handler
    window.addEventListener('resize', calculateStyles);

    return () => {
      clearTimeout(speakTimer);
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', calculateStyles);
    };

  }, [isOpen, currentStep, language]);

  // Clean up voice synthesis on unmount/close
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('user_journey_completed', 'true');
      onClose();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  function startListeningIfEnabled() {
    if (!isOpenRef.current || !isVoiceFirstRef.current || isMutedRef.current) return;
    
    // Make sure SpeechSynthesis is not speaking
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      return; 
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Already running, catch and ignore
      }
    }
  }

  function handleVoiceCommand(text: string) {
    const cleanText = text.trim().toLowerCase();
    
    const nextWordsEn = ['next', 'continue', 'yes', 'okay', 'ok', 'go', 'proceed', 'forward', 'step', 'acknowledge'];
    const nextWordsAr = ['التالي', 'نعم', 'موافق', 'موافقة', 'استمر', 'متابعة', 'قدام', 'خطوة', 'صحيح', 'أوك', 'مستعد'];
    
    const backWordsEn = ['back', 'previous', 'return', 'reverse', 'past', 'go back'];
    const backWordsAr = ['السابق', 'رجوع', 'خلف', 'ورا', 'سابق', 'للخلف'];
    
    const exitWordsEn = ['exit', 'close', 'stop', 'quit', 'end', 'cancel', 'terminate', 'finish'];
    const exitWordsAr = ['خروج', 'إلغاء', 'إيقاف', 'وقف', 'إنهاء', 'اغلاق', 'إغلاق', 'خلص'];

    const muteWordsEn = ['mute', 'silent', 'shutup', 'quiet'];
    const muteWordsAr = ['صامت', 'كتم', 'اسكت', 'هدوء'];

    // Check if matching any category
    const isNext = nextWordsEn.some(w => cleanText.includes(w)) || (language === 'ar' && nextWordsAr.some(w => cleanText.includes(w)));
    const isBack = backWordsEn.some(w => cleanText.includes(w)) || (language === 'ar' && backWordsAr.some(w => cleanText.includes(w)));
    const isExit = exitWordsEn.some(w => cleanText.includes(w)) || (language === 'ar' && exitWordsAr.some(w => cleanText.includes(w)));
    const isMute = muteWordsEn.some(w => cleanText.includes(w)) || (language === 'ar' && muteWordsAr.some(w => cleanText.includes(w)));

    if (isNext) {
      handleNext();
    } else if (isBack) {
      handlePrev();
    } else if (isExit) {
      onClose();
    } else if (isMute) {
      toggleMute();
    }
  }

  // Set up standard Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        handleVoiceCommand(transcript);
      };
      
      rec.onerror = (event: any) => {
        const err = event.error;
        if (err === 'not-allowed') {
          setVoiceError(language === 'ar' ? 'مطلوب إذن الميكروفون' : 'Microphone permission required');
        } else if (err !== 'no-speech') {
          setVoiceError(err);
        }
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
        // Auto-restart listening if voice-first is active and we are idle
        setTimeout(() => {
          if (isOpenRef.current && isVoiceFirstRef.current && !isSpeakingRef.current && !isMutedRef.current) {
            startListeningIfEnabled();
          }
        }, 450);
      };
      
      recognitionRef.current = rec;
    } else {
      setVoiceError(language === 'ar' ? 'التعرف على الصوت غير مدعوم' : 'Speech recognition not supported');
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language]);

  // Audio-loop monitoring effect
  useEffect(() => {
    if (!isOpen || !isVoiceFirstEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    if (isSpeaking) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      const timer = setTimeout(() => {
        startListeningIfEnabled();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVoiceFirstEnabled, isSpeaking, currentStep, isMuted]);

  const isRTL = language === 'ar';

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Dimmed Background Overlay */}
      <div 
        style={styles.highlight} 
        className="pointer-events-auto"
      />
      
      {/* Tour Dialogue Card */}
      <div
        ref={popoverRef}
        style={styles.popover}
        className="bg-white dark:bg-[#151b2d] rounded-2xl shadow-2xl p-6 w-[350px] border border-cyan-500/20 dark:border-cyan-500/30 pointer-events-auto flex flex-col justify-between"
      >
        <div>
          {/* Top Status Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                {isSpeaking && !isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpeaking && !isPaused ? 'bg-cyan-500' : 'bg-slate-400'}`}></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
                {language === 'ar' ? 'المساعد الصوتي للحوكمة' : 'GRC Voice Guide'}
              </span>
            </div>

            {/* Equalizer Visualizer */}
            {isSpeaking && !isPaused ? (
              <div className="flex items-end gap-[2px] h-3">
                <div className="w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-full h-1 animate-pulse" style={{ animationDuration: '0.6s' }}></div>
                <div className="w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-full h-3 animate-pulse" style={{ animationDuration: '0.4s' }}></div>
                <div className="w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-full h-2 animate-pulse" style={{ animationDuration: '0.5s' }}></div>
                <div className="w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-full h-3 animate-pulse" style={{ animationDuration: '0.3s' }}></div>
                <div className="w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-full h-1 animate-pulse" style={{ animationDuration: '0.7s' }}></div>
              </div>
            ) : (
              <div className="flex items-end gap-[2px] h-3 opacity-40">
                <div className="w-[3px] bg-slate-400 rounded-full h-[2px]"></div>
                <div className="w-[3px] bg-slate-400 rounded-full h-[2px]"></div>
                <div className="w-[3px] bg-slate-400 rounded-full h-[2px]"></div>
                <div className="w-[3px] bg-slate-400 rounded-full h-[2px]"></div>
              </div>
            )}
          </div>

          {/* Step Title */}
          <h3 className="text-md font-bold text-slate-800 dark:text-white mb-2 leading-snug">
            {step.title}
          </h3>

          {/* Step Content */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 min-h-[45px]">
            {step.content}
          </p>

          {/* Voice-First Console Panel */}
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isVoiceFirstEnabled && isListening && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isVoiceFirstEnabled ? (isListening ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-300'}`}></span>
                </span>
                {language === 'ar' ? 'وضع التحكم الصوتي التفاعلي' : 'Interactive Voice Control'}
              </span>
              <button
                onClick={() => {
                  const nextState = !isVoiceFirstEnabled;
                  setIsVoiceFirstEnabled(nextState);
                  if (!nextState && recognitionRef.current) {
                    try {
                      recognitionRef.current.stop();
                    } catch (e) {}
                  }
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isVoiceFirstEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {isVoiceFirstEnabled 
                  ? (language === 'ar' ? 'نشط' : 'Enabled') 
                  : (language === 'ar' ? 'متوقف' : 'Disabled')}
              </button>
            </div>

            {isVoiceFirstEnabled && (
              <div className="text-[11px] space-y-1.5 mt-0.5">
                {/* Listening Status Indicators */}
                {isSpeaking ? (
                  <div className="text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
                    <span className="animate-pulse">●</span>
                    {language === 'ar' ? 'انتظر انتهاء صوت المساعد السيبراني...' : 'Listening paused during narration...'}
                  </div>
                ) : isListening ? (
                  <div className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-bounce text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>
                      {language === 'ar' 
                        ? "تحدث الآن (قل: 'التالي'، 'السابق'، 'خروج')" 
                        : "Speak now (say: 'Next', 'Back', 'Exit')"}
                    </span>
                  </div>
                ) : (
                  <div className="text-amber-500 dark:text-amber-400 flex items-center gap-1">
                    <span>⚡</span>
                    <span>{language === 'ar' ? 'مستعد للتشغيل...' : 'Initializing speech link...'}</span>
                  </div>
                )}

                {/* Show Transcript Feedback */}
                {voiceTranscript && (
                  <div className="p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 font-mono text-[10px] text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <span className="font-bold">{language === 'ar' ? 'مسموع:' : 'Heard:'}</span>
                    <span className="italic">"{voiceTranscript}"</span>
                  </div>
                )}

                {/* Show Speech Recognition Error if any */}
                {voiceError && (
                  <div className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-[10px] text-red-600 dark:text-red-400">
                    ⚠️ {voiceError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            {/* Voice Control Buttons */}
            <div className="flex items-center gap-1">
              {/* Play / Pause Voice */}
              <button
                onClick={togglePlayPause}
                disabled={isMuted}
                className={`p-1.5 rounded-lg border transition-all ${
                  isMuted 
                    ? 'opacity-30 cursor-not-allowed bg-transparent border-transparent text-slate-400' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500'
                }`}
                title={language === 'ar' ? 'تشغيل / إيقاف مؤقت' : 'Play / Pause Voice'}
              >
                {isSpeaking && !isPaused ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Mute Voice */}
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded-lg border transition-all ${
                  isMuted 
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/50 text-red-500' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500'
                }`}
                title={isMuted ? (language === 'ar' ? 'إلغاء كتم الصوت' : 'Unmute Voice') : (language === 'ar' ? 'كتم الصوت' : 'Mute Voice')}
              >
                {isMuted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5V14.5H7.75L12 18.75Z" />
                  </svg>
                )}
              </button>

              {/* Speech State Description */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">
                {isMuted 
                  ? (language === 'ar' ? 'الصوت صامت' : 'Muted') 
                  : (isSpeaking ? (isPaused ? (language === 'ar' ? 'مؤقت' : 'Paused') : (language === 'ar' ? 'يتحدث...' : 'Speaking...')) : (language === 'ar' ? 'جاهز' : 'Ready'))}
              </span>
            </div>

            {/* Step Count */}
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {language === 'ar' 
                ? `الخطوة ${currentStep + 1} من ${steps.length}` 
                : `Step ${currentStep + 1} of ${steps.length}`}
            </span>
          </div>

          <div className="flex justify-between items-center gap-2">
            {/* Exit Guide Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent"
            >
              {language === 'ar' ? 'خروج' : 'Exit Journey'}
            </button>

            {/* Previous & Next Buttons */}
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors"
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-lg shadow-md shadow-cyan-500/10 transition-all flex items-center gap-1"
              >
                <span>
                  {currentStep === steps.length - 1 
                    ? (language === 'ar' ? 'إنهاء' : 'Finish') 
                    : (language === 'ar' ? 'التالي' : 'Next')}
                </span>
                {currentStep < steps.length - 1 && (
                  <svg className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
