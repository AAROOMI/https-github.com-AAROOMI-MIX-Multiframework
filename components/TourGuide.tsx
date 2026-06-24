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
  const [styles, setStyles] = useState<{ highlight: React.CSSProperties, popover: React.CSSProperties }>({
    highlight: { display: 'none' },
    popover: { display: 'none' },
  });
  
  const popoverRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // English Steps Definition
  const stepsEn: TourStep[] = [
    {
      target: 'body',
      title: 'Welcome to GRC Cybersecurity Navigator',
      content: 'Welcome, Officer! This interactive voice guide will walk you through your high-security GRC compliance system. Let us guide you through our main modules.',
      position: 'center',
      view: 'dashboard'
    },
    {
      target: '#sidebar-dashboard',
      title: 'Dynamic Compliance Dashboard',
      content: 'This is your centralized command center. It aggregates compliance scores across Saudi NCA ECC, PDPL, SAMA, and CMA controls, visualizing risk levels and track items in real-time.',
      position: 'right',
      view: 'dashboard'
    },
    {
      target: '#sidebar-assessment',
      title: 'NCA ECC Compliance Portal',
      content: 'Browse, manage, and audit Essential Cybersecurity Controls (ECC) here. You can run gap analyses, assign subdomains, and upload evidence directly to the immutable audit ledger.',
      position: 'right',
      view: 'assessment'
    },
    {
      target: '#sidebar-virtualDepartment',
      title: 'Virtual Cybersecurity Boardroom',
      content: 'Meet your virtual, autonomous department of AI agents! Each agent (CISO, CTO, DPO, CIO) has a custom professional profile and works on GRC policies, giving approvals with deep logic.',
      position: 'right',
      view: 'virtualDepartment'
    },
    {
      target: '#sidebar-riskAssessment',
      title: 'ISO 31000 Risk Register',
      content: 'This is the enterprise risk ledger aligned with ISO 31000 standards. Categorize vulnerabilities, calculate impact/likelihood matrices, and lock down secure mitigation measures.',
      position: 'right',
      view: 'riskAssessment'
    },
    {
      target: '#header-airgap-toggle',
      title: 'Government Air-Gap Redundancy Link',
      content: 'For supreme sovereignty on secure government networks, toggle this switch. It redirects all GRC intelligence to your fully-embedded, offline Google Gemma 4 model with 100% data confinement.',
      position: 'bottom',
      view: 'dashboard'
    },
    {
      target: '#sidebar-liveVoiceDemo',
      title: 'Sovereign Voice AI Sandbox',
      content: 'Step into the Voice AI sandbox to test voice command navigation and interact with our Virtual GRC agents using secure local speech recognition.',
      position: 'right',
      view: 'liveVoiceDemo'
    }
  ];

  // Arabic Steps Definition
  const stepsAr: TourStep[] = [
    {
      target: 'body',
      title: 'مرحباً بك في منصة الحوكمة والالتزام',
      content: 'أهلاً بك يا سيادة مسؤول الأمن السيبراني! سيقوم هذا الدليل الصوتي التفاعلي بمرافقتك في جولة سريعة داخل لوحة تحكم الحوكمة وإدارة المخاطر. استمع إلينا لنرشدك خطوة بخطوة.',
      position: 'center',
      view: 'dashboard'
    },
    {
      target: '#sidebar-dashboard',
      title: 'لوحة التحكم والمؤشرات التفاعلية',
      content: 'هنا تجد مركز القيادة والتحكم الخاص بك. تجمع لوحة التحكم هذه مؤشرات الأداء الحية لضوابط الهيئة الوطنية للأمن السيبراني ECC، والبنك المركزي السعودي SAMA، وهيئة السوق المالية CMA، ونظام PDPL في الوقت الفعلي.',
      position: 'left',
      view: 'dashboard'
    },
    {
      target: '#sidebar-assessment',
      title: 'بوابة التزام ضوابط الهيئة الوطنية ECC',
      content: 'تتيح لك هذه البوابة مراجعة وتدقيق التزام منشأتك بضوابط الأمن السيبراني الأساسية الصادرة عن الهيئة الوطنية للأمن السيبراني، وإجراء تحليلات فجوات الالتزام ورفع أدلة الإثبات.',
      position: 'left',
      view: 'assessment'
    },
    {
      target: '#sidebar-virtualDepartment',
      title: 'غرفة الاجتماعات الافتراضية للحوكمة',
      content: 'تعرف على مجلس الإدارة الافتراضي المكون من خبراء الذكاء الاصطناعي! يمتلك كل وكيل (CISO, CTO, DPO, CIO) هوية وصوتاً مهنياً مخصصاً لمناقشة السياسات، والتصويت على القرارات، وتوزيع مهام مصفوفة راسي.',
      position: 'left',
      view: 'virtualDepartment'
    },
    {
      target: '#sidebar-riskAssessment',
      title: 'سجل المخاطر وتصنيفها (ISO 31000)',
      content: 'يتيح لك هذا السجل حصر وتصنيف ومعالجة المخاطر التقنية والتشغيلية وفق المعيار العالمي أيزو 31000، ومتابعة تنفيذ الضوابط الوقائية والمعالجات لتقليل مستويات التهديد.',
      position: 'left',
      view: 'riskAssessment'
    },
    {
      target: '#header-airgap-toggle',
      title: 'الربط المحلي الآمن للشبكات المعزولة',
      content: 'لتحقيق السيادة المطلقة للبيانات في الشبكات المعزولة التابعة للجهات الحكومية، قم بتفعيل زر الربط المحلي. سيتحول النظام كلياً ليعتمد على نموذج غوغل غيما 4 المحلي بنسبة عزل كاملة عن الإنترنت.',
      position: 'bottom',
      view: 'dashboard'
    },
    {
      target: '#sidebar-liveVoiceDemo',
      title: 'بيئة تجربة الوكيل الصوتي السيبراني',
      content: 'مرحباً بك في بيئة تجربة الوكيل الصوتي! هنا يمكنك اختبار التوليف الصوتي المحلي ومخاطبة مسؤول الحوكمة الافتراضي بالذكاء الاصطناعي من خلال الأوامر الصوتية الذكية مباشرة.',
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
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('user_journey_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 min-h-[50px]">
            {step.content}
          </p>
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
