import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentIcon, UsersIcon, BuildingOfficeIcon, DashboardIcon, ClipboardListIcon, BeakerIcon, ClipboardCheckIcon, ShieldKeyholeIcon, LandmarkIcon, IdentificationIcon, QuestionMarkCircleIcon, GraduationCapIcon, ExclamationTriangleIcon, LineChartIcon, SparklesIcon, ShieldCheckIcon, ChatBotIcon, SunIcon, MoonIcon, LinkIcon, BugAntIcon, UserGroupIcon, PhoneIcon, LayoutIcon } from './Icons';
import type { Domain, Permission, View, UserTrainingProgress } from '../types';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import { virtualAgents } from '../data/virtualAgents';
import { trainingCourses } from '../data/trainingData';
import { translations } from '../translations';

const sarahJohnsonImg = "/src/assets/images/regenerated_image_1782014756973.jpg";

interface SidebarProps {
  domains: Domain[];
  selectedDomain: Domain;
  onSelectDomain: (domain: Domain) => void;
  currentView: View;
  onSetView: (view: View) => void;
  permissions: Set<Permission>;
  trainingProgress?: UserTrainingProgress;
  language?: 'en' | 'ar';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  selectedNcaFrameworkId?: string;
  onSelectNcaFrameworkId?: (fwId: string) => void;
  selectedSamaFrameworkId?: string;
  onSelectSamaFrameworkId?: (fwId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  domains, 
  selectedDomain, 
  onSelectDomain, 
  currentView, 
  onSetView, 
  permissions, 
  trainingProgress, 
  language = 'en',
  isMobileOpen = false,
  onCloseMobile,
  selectedNcaFrameworkId,
  onSelectNcaFrameworkId,
  selectedSamaFrameworkId,
  onSelectSamaFrameworkId
}) => {
  const t = translations[language];
  const { isMenuEnabled } = useFeatureToggles();

  const handleNavClick = (view: View) => {
    onSetView(view);
    if (view === 'saraAgent') {
      if (typeof window !== 'undefined') {
        const loadScript = (window as any).loadDidAgentScript;
        if (loadScript) {
          loadScript();
        } else {
          const scriptId = 'did-agent-v2-script';
          if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.type = 'module';
            script.src = 'https://agent.d-id.com/v2/index.js';
            script.setAttribute('data-mode', 'fabio');
            script.setAttribute('data-client-key', 'YXV0aDB8NjdlZWI3NmYwOTYxZDU0Yjg2N2Y4ZWE3OkMwcExqeHpDYkl0VWt0N1dBQ056WQ==');
            script.setAttribute('data-agent-id', 'v2_agt_56bnv71C');
            script.setAttribute('data-name', 'did-agent');
            script.setAttribute('data-monitor', 'true');
            script.setAttribute('data-orientation', 'horizontal');
            script.setAttribute('data-position', 'right');
            script.setAttribute('data-open-mode', 'expanded');
            document.body.appendChild(script);
            console.log('D-ID Conversational Agent script injected dynamically from Sidebar click');
          }
        }
      }
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleDomainClick = (domain: Domain) => {
    onSelectDomain(domain);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavContent = () => (
    <ul className="space-y-1">
      {/* Sara - AI Agent Profile */}
      <li className="mb-6 pb-6 border-b border-black/5 dark:border-white/5">
         <button
            onClick={() => handleNavClick('saraAgent')}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-500 w-full overflow-hidden border ${
                currentView === 'saraAgent'
                ? 'water-gel-nav-btn-active'
                : 'water-gel-nav-btn'
            }`}
         >
            {/* 3D Liquid Specular Highlights (Multi-layered physical glass/gel refraction effects) */}
            <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[2px] rounded-full bg-white/40 pointer-events-none blur-[0.2px]" />
            <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/15 to-transparent pointer-events-none" />

            {/* Liquid Ripple Wave underlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.15),transparent_60%)] group-hover:opacity-20 transition-opacity duration-300" />

            <div className="relative mb-3 z-10">
              {/* Circular Container with Gradient Border */}
              <div className={`p-1 rounded-full bg-gradient-to-tr from-teal-400/80 to-purple-500/80 shadow-[0_0_12px_rgba(45,212,191,0.3)] transition-transform duration-500 ${currentView === 'saraAgent' ? 'scale-105 shadow-[0_0_20px_rgba(45,212,191,0.5)]' : 'group-hover:scale-105'}`}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/40 bg-slate-100 dark:bg-gray-800 relative shadow-inner">
                    {/* Refraction highlight inside avatar image */}
                    <div className="absolute top-0 left-0 right-0 h-[35%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none z-10" />
                    <img 
                        src={sarahJohnsonImg} 
                        alt="Sarah Johnson Professional Consultant" 
                        className="w-full h-full object-cover relative z-0"
                    />
                </div>
              </div>
              {/* Online Status Indicator */}
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-teal-400 border-2 border-white dark:border-[#1A1A2E] rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" title="Online"></span>
            </div>
            
            <div className="text-center z-10">
              <span className="block font-medium text-slate-800 dark:text-white/90 text-[14px] leading-tight mb-1">Sarah Johnson</span>
              <div className="flex items-center justify-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal uppercase tracking-wider">Virtual Consultant</span>
              </div>
            </div>
         </button>
      </li>

      {permissions.has('dashboard:read') && isMenuEnabled('dashboard') && (
        <li>
          <button
              id="sidebar-dashboard"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full text-left p-3 rounded-xl text-[13px] flex items-center group relative overflow-hidden transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'water-gel-nav-btn-active'
                  : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
              
              <DashboardIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'dashboard' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="relative z-10 font-normal">{t.dashboard}</span>
            </button>
        </li>
      )}

      {/* Virtual Department Section */}
      {permissions.has('virtualDept:manage') && isMenuEnabled('virtualDepartment') && (
        <li className="mt-6 mb-4">
           <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{language === 'ar' ? 'إدارة مجلس الحوكمة الافتراضي' : 'Virtual GRC Dept'}</span>
           </div>
           
           <div className="space-y-2">
             <button
                id="sidebar-virtualDepartment"
                onClick={() => handleNavClick('virtualDepartment')}
                className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'virtualDepartment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                }`}
              >
                {/* 3D Specular Highlights */}
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                <UserGroupIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualDepartment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
                <span className="relative z-10 font-normal">{t.virtualDepartment}</span>
              </button>

             <button
                onClick={() => handleNavClick('virtualMeeting')}
                className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'virtualMeeting' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                }`}
             >
                {/* 3D Specular Highlights */}
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                <PhoneIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualMeeting' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
                <span className="relative z-10 font-normal">{t.virtualMeeting}</span>
              </button>

             <button
                onClick={() => handleNavClick('whiteboard')}
                className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'whiteboard' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                }`}
             >
                {/* 3D Specular Highlights */}
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                <LayoutIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'whiteboard' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
                <span className="relative z-10 font-normal">{t.whiteboard}</span>
              </button>

             <button
                onClick={() => handleNavClick('creatorMarketplace')}
                className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'creatorMarketplace' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                }`}
             >
                {/* 3D Specular Highlights */}
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                <UsersIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'creatorMarketplace' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
                <span className="relative z-10 font-normal">{t.creatorMarketplace}</span>
              </button>
           </div>

           <div className="pl-3 space-y-1.5 mt-2.5">
               {virtualAgents.map(agent => (
                   <div 
                     key={agent.id} 
                     className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer select-none border border-teal-500/10 dark:border-cyan-500/10 bg-gradient-to-br from-teal-500/5 to-transparent hover:from-teal-500/15 hover:border-teal-500/20 dark:from-cyan-500/5 dark:hover:from-cyan-500/15 dark:hover:border-cyan-500/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_2px_4px_rgba(0,0,0,0.03)]"
                     onClick={() => handleNavClick('virtualDepartment')}
                   >
                       {/* 3D Liquid Specular Highlights (Multi-layered physical glass/gel refraction effects) */}
                       <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                       <div className="absolute top-[0.5px] left-1 right-1 h-[1.5px] rounded-full bg-white/40 pointer-events-none blur-[0.1px]" />
                       <div className="absolute bottom-[0.5px] left-1.5 right-1.5 h-[1px] rounded-full bg-gradient-to-t from-white/15 to-transparent pointer-events-none" />

                       {/* Neural link circular avatar container */}
                       <div className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-teal-500/35 dark:border-cyan-500/35 bg-teal-500/10 dark:bg-cyan-500/10 overflow-hidden p-0.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_8px_rgba(45,212,191,0.2)]">
                           <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                           <span className="absolute bottom-0 right-0 w-2 h-2 bg-teal-400 rounded-full border border-white dark:border-slate-900 shadow-[0_0_4px_rgba(45,212,191,0.8)] animate-pulse"></span>
                       </div>
                       <div className="min-w-0 relative z-10">
                           <p className="text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate">{agent.name}</p>
                           <p className="text-[9px] text-teal-600 dark:text-cyan-400 leading-none truncate font-mono uppercase tracking-tight mt-0.5">{agent.role}</p>
                       </div>
                   </div>
               ))}
           </div>
        </li>
      )}

      {permissions.has('users:read') && isMenuEnabled('userManagement') && (
        <li>
          <button
              onClick={() => handleNavClick('userManagement')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'userManagement' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <UsersIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'userManagement' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.userManagement}</span>
            </button>
        </li>
      )}

      {permissions.has('company:read') && isMenuEnabled('companyProfile') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('companyProfile')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'companyProfile' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <BuildingOfficeIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'companyProfile' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.companyProfile}</span>
            </button>
        </li>
      )}

      {permissions.has('userProfile:read') && isMenuEnabled('userProfile') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('userProfile')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'userProfile' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <IdentificationIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'userProfile' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.myProfile}</span>
            </button>
        </li>
      )}

      {permissions.has('assets:read') && isMenuEnabled('assets') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('assets')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'assets' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ShieldCheckIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'assets' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.assetInventory}</span>
            </button>
        </li>
      )}

      {permissions.has('integrations:manage') && isMenuEnabled('integrations') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('integrations')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'integrations' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <LinkIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'integrations' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.integrations}</span>
            </button>
        </li>
      )}

      {permissions.has('vapt:manage') && isMenuEnabled('vapt') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('vapt')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'vapt' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <BugAntIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'vapt' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.vaptOrchestrator}</span>
            </button>
        </li>
      )}

      {permissions.has('documents:read') && isMenuEnabled('documents') && (
        <li className="mt-1">
          <button
              id="sidebar-documents"
              onClick={() => handleNavClick('documents')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'documents' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <DocumentIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'documents' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.documents}</span>
            </button>
        </li>
      )}
      
      {/* Security Awareness Section */}
      {permissions.has('training:read') && isMenuEnabled('training') && (
        <li className="mt-5 mb-2">
           <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Security Awareness</span>
           </div>
           <div className="space-y-1.5">
               {trainingCourses.map(course => {
                   const progress = trainingProgress?.[course.id];
                   const completed = progress?.completedLessons.length || 0;
                   const total = course.lessons.length;
                   const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                   const isBadgeEarned = progress?.badgeEarned;

                   return (
                       <button
                           key={course.id}
                           onClick={() => handleNavClick('training')}
                           className={`w-full text-left p-2.5 pl-3 rounded-xl text-sm transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                               currentView === 'training' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                           }`}
                       >
                           {/* 3D Specular Highlights */}
                           <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                           <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                           <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                           <div className="flex items-center overflow-hidden gap-2 relative z-10">
                               <div className={`relative flex-shrink-0 ${isBadgeEarned ? 'text-yellow-500' : 'text-slate-400'}`}>
                                  <GraduationCapIcon className="w-4 h-4" />
                                  {isBadgeEarned && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                               </div>
                               <span className="truncate text-xs font-normal">{course.title.replace('Cybersecurity ', '').replace('Security', '')}</span>
                           </div>
                           
                           <div className="flex items-center relative z-10">
                               {percent > 0 && (
                                 <div className="w-8 bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5 ml-2 overflow-hidden border border-black/5 dark:border-white/5">
                                    <div className={`h-full rounded-full ${percent === 100 ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }}></div>
                                 </div>
                               )}
                           </div>
                       </button>
                   );
               })}
           </div>
        </li>
      )}

      {permissions.has('riskAssessment:read') && isMenuEnabled('riskAssessment') && (
        <li className="mt-1">
          <button
              id="sidebar-riskAssessment"
              onClick={() => handleNavClick('riskAssessment')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'riskAssessment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ExclamationTriangleIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'riskAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.riskAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:read') && isMenuEnabled('assessment') && (
        <li className="mt-1">
          <button
              id="sidebar-assessment"
              onClick={() => handleNavClick('assessment')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'assessment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ClipboardCheckIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'assessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.eccAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('pdplAssessment:read') && isMenuEnabled('pdplAssessment') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('pdplAssessment')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'pdplAssessment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ShieldKeyholeIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'pdplAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.pdplAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('samaCsfAssessment:read') && isMenuEnabled('samaCsfAssessment') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('samaCsfAssessment')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'samaCsfAssessment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <LandmarkIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'samaCsfAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.samaAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('cmaAssessment:read') && isMenuEnabled('cmaAssessment') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('cmaAssessment')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'cmaAssessment' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <LineChartIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'cmaAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.cmaAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('ncaFamilySuite')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'ncaFamilySuite' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ShieldCheckIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'ncaFamilySuite' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10 text-teal-700 dark:text-teal-300">{language === 'ar' ? 'عائلة إطارات NCA' : 'NCA Framework Family'}</span>
            </button>
            
            {currentView === 'ncaFamilySuite' && (
              <ul className="mt-2 ml-4 pl-3 border-l border-teal-500/30 space-y-1.5">
                {[
                  { id: 'ecc-2.0', name: 'NCA ECC 2.0 (200 Controls)', nameAr: 'إي سي سي 2.0 (200 ضابط)' },
                  { id: 'ecc-175', name: 'NCA ECC (175 Controls)', nameAr: 'إي سي سي (175 ضابط)' },
                  { id: 'dcc-66', name: 'NCA DCC (66 Controls)', nameAr: 'دي سي سي (66 ضابط)' },
                  { id: 'cscc-105', name: 'NCA CSCC (105 Controls)', nameAr: 'سي إس سي سي (105 ضابط)' },
                  { id: 'otcc-169', name: 'NCA OTCC (169 Controls)', nameAr: 'أو تي سي سي (169 ضابط)' },
                  { id: 'osmacc-53', name: 'OSMACC (53 Controls)', nameAr: 'أوسماك (53 ضابط)' },
                  { id: 'ncs-100', name: 'NCA NCS (100 Controls)', nameAr: 'إن سي إس (100 ضابط)' },
                  { id: 'tcc-63', name: 'NCA TCC (63 Controls)', nameAr: 'تي سي سي (63 ضابط)' },
                  { id: 'ncnicc-65', name: 'NCNICC (65 Controls)', nameAr: 'إن سي إن آي سي سي (65 ضابط)' },
                ].map((item) => {
                  const isItemActive = selectedNcaFrameworkId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (onSelectNcaFrameworkId) {
                            onSelectNcaFrameworkId(item.id);
                          }
                          onSetView('ncaFamilySuite');
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-[11px] transition-all duration-200 flex items-center relative overflow-hidden font-normal ${
                          isItemActive ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                        }`}
                      >
                        {/* 3D Specular Highlights */}
                        <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute top-[0.5px] left-1 right-1 h-[1px] rounded-full bg-white/20 pointer-events-none blur-[0.1px]" />

                        <span className="truncate relative z-10">{language === 'ar' ? item.nameAr : item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </li>
      )}

      {permissions.has('assessment:read') && (
        <li className="mt-1" id="sidebar-samaFamilySuite">
          <button
              onClick={() => handleNavClick('samaFamilySuite')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'samaFamilySuite' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <LandmarkIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'samaFamilySuite' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600'}`} />
              <span className="font-normal relative z-10 text-blue-700 dark:text-blue-300">{language === 'ar' ? 'إطارات مؤسسة النقد SAMA' : 'SAMA Framework Family'}</span>
            </button>

            {currentView === 'samaFamilySuite' && (
              <ul className="mt-2 ml-4 pl-3 border-l border-blue-500/30 space-y-1.5">
                {[
                  { id: 'sama-csf-249', name: 'SAMA CSF (249 Controls)', nameAr: 'إطار الأمن السيبراني (249 ضابط)' },
                  { id: 'sama-bcm-76', name: 'SAMA BCM (76 Controls)', nameAr: 'استمرارية الأعمال (76 ضابط)' },
                  { id: 'sama-itg-568', name: 'SAMA IT Governance (568 Controls)', nameAr: 'حوكمة تقنية المعلومات (568 ضابط)' },
                  { id: 'sama-cti-69', name: 'SAMA CTI (69 Controls)', nameAr: 'استخبارات التهديدات (69 ضابط)' },
                  { id: 'sama-fraud-707', name: 'SAMA Fraud Controls (707 Controls)', nameAr: 'ضوابط الاحتيال (707 ضابط)' },
                  { id: 'sama-mvc-32', name: 'SAMA MVC (32 Controls)', nameAr: 'التحقق من النماذج (32 ضابط)' },
                  { id: 'sama-crfr-23', name: 'SAMA CRFR (23 Controls)', nameAr: 'مرونة المخاطر (23 ضابط)' },
                ].map((item) => {
                  const isItemActive = selectedSamaFrameworkId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (onSelectSamaFrameworkId) {
                            onSelectSamaFrameworkId(item.id);
                          }
                          onSetView('samaFamilySuite');
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-[11px] transition-all duration-200 flex items-center relative overflow-hidden font-normal ${
                          isItemActive ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                        }`}
                      >
                        {/* 3D Specular Highlights */}
                        <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute top-[0.5px] left-1 right-1 h-[1px] rounded-full bg-white/20 pointer-events-none blur-[0.1px]" />

                        <span className="truncate relative z-10">{language === 'ar' ? item.nameAr : item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </li>
      )}

      {permissions.has('audit:read') && isMenuEnabled('auditLog') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('auditLog')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'auditLog' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <ClipboardListIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'auditLog' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{t.auditLog}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:update') && isMenuEnabled('liveVoiceDemo') && (
        <li className="mt-1">
          <button
              id="sidebar-liveVoiceDemo"
              onClick={() => handleNavClick('liveVoiceDemo')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'liveVoiceDemo' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <PhoneIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'liveVoiceDemo' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{language === 'ar' ? 'تجربة الصوت الحي' : 'Live Voice Demo'}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:update') && isMenuEnabled('complianceAgent') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('complianceAgent')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'complianceAgent' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <SparklesIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'complianceAgent' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-purple-600'}`} />
              <span className="font-normal relative z-10">{language === 'ar' ? 'وكيل الامتثال الذكي' : 'Compliance Agent'}</span>
            </button>
        </li>
      )}

      {/* Super Admin Button */}
      {permissions.has('superAdmin:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('superAdmin')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'superAdmin' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <BuildingOfficeIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'superAdmin' ? 'text-red-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-red-500'}`} />
              <span className="font-normal relative z-10">{language === 'ar' ? 'مشرف النظام' : 'Super Admin'}</span>
            </button>
        </li>
      )}

      {permissions.has('help:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('help')}
              className={`w-full text-left p-3 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'help' ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
              }`}
            >
              {/* 3D Specular Highlights */}
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
              <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

              <QuestionMarkCircleIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'help' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600'}`} />
              <span className="font-normal relative z-10">{language === 'ar' ? 'الدعم الفني للنظام' : 'System Support'}</span>
            </button>
        </li>
      )}

      {/* Internal Links for Quick Access */}
      <li className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
         <h2 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 px-3 uppercase tracking-[0.2em]">Quick Links</h2>
         <div className="space-y-1.5">
           <button
              onClick={() => handleNavClick('cmaAssessment')}
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200/50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5">1</span>
              <span className="relative z-10">CMA</span>
            </button>
            <button
              onClick={() => handleNavClick('breadcrumbDesign')}
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-blue-100/50 dark:bg-blue-950/40 text-[10px] font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5 font-mono">BD</span>
              <span className="relative z-10">Breadcrumb Design</span>
            </button>
            <button
              onClick={() => handleNavClick('accordionDesign')}
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-purple-100/50 dark:bg-purple-950/40 text-[10px] font-medium text-purple-600 dark:text-purple-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5 font-mono">AD</span>
              <span className="relative z-10">Accordion Design</span>
            </button>
            <a
              href="https://hrsd-automated-policy-generator-365172165068.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200/50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5">2</span>
              <span className="relative z-10">HRSD</span>
            </a>
           <button
              onClick={() => handleNavClick('pdplAssessment')}
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200/50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5">3</span>
              <span className="relative z-10">PDPL</span>
            </button>
            <a
              href="https://app-496821664990.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-2.5 rounded-xl text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden water-gel-nav-btn"
            >
              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200/50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 relative z-10 border border-black/5 dark:border-white/5">4</span>
              <span className="relative z-10">ISO 31000</span>
            </a>
         </div>
      </li>

      {permissions.has('navigator:read') && (
        <li id="sidebar-navigator-header" className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center mb-3 px-3">
            <h2 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{language === 'ar' ? 'مستعرض ضوابط الهيئة الوطنية' : 'NCA ECC Control Navigator'}</h2>
          </div>
          <div className="space-y-1.5">
            {domains.map((domain, index) => {
              const controlCount = domain.subdomains.reduce((acc, sub) => acc + sub.controls.length, 0);
              const isSelected = selectedDomain.id === domain.id && currentView === 'navigator';
              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainClick(domain)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                    isSelected ? 'water-gel-nav-btn-active' : 'water-gel-nav-btn'
                  }`}
                >
                  {/* 3D Specular Highlights */}
                  <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <div className="absolute top-[0.5px] left-1.5 right-1.5 h-[1.5px] rounded-full bg-white/30 pointer-events-none blur-[0.1px]" />
                  <div className="absolute bottom-[0.5px] left-2 right-2 h-[1px] rounded-full bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

                  <div className="flex items-start flex-1 min-w-0 pr-2 relative z-10">
                    <span className={`mr-2.5 font-mono text-teal-600 dark:text-teal-400 font-semibold ${isSelected ? 'font-bold text-teal-800 dark:text-cyan-300' : ''}`}>{index + 1}</span>
                    <span className="truncate" title={domain.name}>{domain.name}</span>
                  </div>
                  <span className={`text-[10px] font-normal px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 relative z-10 ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-black/5 dark:border-white/5'
                  }`}>
                    {controlCount}
                  </span>
                </button>
              );
            })}
          </div>
        </li>
      )}
    </ul>
  );

  return (
    <>
      {/* Desktop Sidebar Container */}
      <aside className="w-72 water-gel-panel m-4 mr-0 shadow-2xl overflow-hidden hidden md:flex md:flex-col h-[calc(100%-2rem)]">
        <nav className="flex-grow overflow-y-auto scrollbar-hide p-4">
          {renderNavContent()}
        </nav>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" id="mobile-sidebar-drawer">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile} 
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" 
            />
            {/* Drawer Content block */}
            <motion.aside 
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative w-72 water-gel-panel m-4 shadow-2xl overflow-hidden flex flex-col h-[calc(100%-2rem)] z-50`}
            >
               {/* Close Header */}
               <div className="flex justify-between items-center p-4 border-b border-black/5 dark:border-white/5 bg-slate-100/50 dark:bg-transparent">
                 <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Cybersecurity Portal</span>
                 <button onClick={onCloseMobile} className="p-1 px-2.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-xs font-semibold flex items-center gap-1">
                   ✕ Close
                 </button>
               </div>
               <nav className="flex-grow overflow-y-auto scrollbar-hide p-4">
                  {renderNavContent()}
               </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
