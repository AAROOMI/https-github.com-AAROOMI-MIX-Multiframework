import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  RefreshCw, 
  Video, 
  HelpCircle
} from 'lucide-react';

export const DidEmbed: React.FC = () => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const url = "https://studio.d-id.com/agents/share?id=v2_agt_56bnv71C&utm_source=copy&key=WVhWMGFEQjhOamRsWldJM05tWXdPVFl4WkRVMFlqZzJOMlk0WldFM09rTXdjRXhxZUhwRFlrbDBWV3QwTjFkQlEwNTZXUT09";
  
  const agentId = "v2_agt_56bnv71C";
  const clientKey = "YXV0aDB8NjdlZWI3NmYwOTYxZDU0Yjg2N2Y4ZWE3OkMwcExqeHpDYkl0VWt0N1dBQ056WQ==";

  // Run the dynamic conversational script tag in the background silently as requested
  const runDidAgentScript = () => {
    const scriptId = 'did-agent-v2-script';
    
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'module';
    script.src = 'https://agent.d-id.com/v2/index.js';
    script.setAttribute('data-mode', 'fabio');
    script.setAttribute('data-client-key', clientKey);
    script.setAttribute('data-agent-id', agentId);
    script.setAttribute('data-name', 'did-agent');
    script.setAttribute('data-monitor', 'true');
    script.setAttribute('data-orientation', 'horizontal');
    script.setAttribute('data-position', 'right');
    script.setAttribute('data-open-mode', 'expanded');
    
    script.addEventListener('load', () => {
      setScriptLoaded(true);
      console.log('Sarah conversational script initialized.');
    });

    script.addEventListener('error', (err) => {
      console.warn('Silent loading info:', err);
    });

    document.body.appendChild(script);
    setScriptLoaded(true);
  };

  useEffect(() => {
    (window as any).loadDidAgentScript = runDidAgentScript;
    runDidAgentScript();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 py-6">
      
      {/* Profile Header Block */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
          <div className="relative">
            <div className="p-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 bg-slate-100">
                <img 
                  src="/src/assets/images/regenerated_image_1782014756973.jpg" 
                  alt="Sarah Johnson Professional Consultant" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Sarah Johnson</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 rounded-full text-center uppercase self-center">
                Virtual Assistant
              </span>
            </div>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">NCA ECC &amp; SAMA Security Specialist</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl">
              Sarah can guide you through direct conversational verification of controls, answering complex framework requirements, and addressing compliance inquiries dynamically.
            </p>
          </div>
        </div>

        {/* Refresh stream or quick action block */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setIsIframeLoaded(false);
              const frame = document.getElementById('sarah-video-stream') as HTMLIFrameElement;
              if (frame) {
                frame.src = url;
              }
            }}
            className="w-full md:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Video Stream</span>
          </button>
        </div>
      </div>

      {/* Primary Video Stream Frame */}
      <div className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[400px] max-h-[640px] bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg relative overflow-hidden flex flex-col">
        
        {/* Frame status */}
        <div className="absolute top-4 left-4 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
          <Video className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Live Stream Frame</span>
        </div>

        {/* Loading Indicator */}
        {!isIframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-white/50 z-10 transition-all">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 animate-pulse">Establishing Live Video Stream...</p>
          </div>
        )}
        
        {/* Live Video frame */}
        <div className="relative w-full h-full overflow-hidden rounded-xl bg-black">
          <iframe
            id="sarah-video-stream"
            src={url}
            onLoad={() => setIsIframeLoaded(true)}
            className={`
              transition-opacity duration-700 w-full h-full
              ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              width: '140%',
              height: '140%',
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              border: 'none',
              pointerEvents: 'auto',
            }}
            allow="microphone; camera; display-capture; autoplay; encrypted-media"
            title="Sarah GRC virtual assistant secure video stream"
          />
        </div>
        
        {/* Anti-Larping Clean Matte Blockers to hide unnecessary sharing bars in layout */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-950 z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-950 z-20 pointer-events-none" />
      </div>

    </div>
  );
};
