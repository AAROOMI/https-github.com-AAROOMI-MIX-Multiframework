import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentIcon, UsersIcon, BuildingOfficeIcon, DashboardIcon, ClipboardListIcon, BeakerIcon, ClipboardCheckIcon, ShieldKeyholeIcon, LandmarkIcon, IdentificationIcon, QuestionMarkCircleIcon, GraduationCapIcon, ExclamationTriangleIcon, LineChartIcon, SparklesIcon, ShieldCheckIcon, ChatBotIcon, SunIcon, MoonIcon, LinkIcon, BugAntIcon, UserGroupIcon, PhoneIcon, LayoutIcon } from './Icons';
import type { Domain, Permission, View, UserTrainingProgress } from '../types';
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
  onCloseMobile
}) => {
  const t = translations[language];

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
            className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full overflow-hidden ${
                currentView === 'saraAgent'
                ? 'bg-slate-200/50 dark:bg-white/10 shadow-lg'
                : 'hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
         >
            {/* Holographic Shimmer Effect for Active Profile */}
            {currentView === 'saraAgent' && (
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none opacity-20"
                initial={{ backgroundPosition: '0% 0%' }}
                animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                  backgroundSize: '200% 200%',
                  mixBlendMode: 'overlay'
                }}
              />
            )}

            <div className="relative mb-3 z-10">
              {/* Circular Container with Gradient Border */}
              <div className={`p-1 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg transition-transform duration-300 ${currentView === 'saraAgent' ? 'scale-105' : 'group-hover:scale-105'}`}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-slate-100 dark:bg-gray-800">
                    <img 
                        src={sarahJohnsonImg} 
                        alt="Sarah Johnson Professional Consultant" 
                        className="w-full h-full object-cover"
                    />
                </div>
              </div>
              {/* Online Status Indicator */}
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-[#1A1A2E] rounded-full animate-pulse shadow-sm" title="Online"></span>
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

      {permissions.has('dashboard:read') && (
        <li>
          <button
              id="sidebar-dashboard"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'dashboard'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <DashboardIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'dashboard' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="relative z-10 font-normal">{t.dashboard}</span>
            </button>
        </li>
      )}

      {/* Virtual Department Section */}
      {permissions.has('virtualDept:manage') && (
        <li className="mt-6 mb-4">
           <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{language === 'ar' ? 'إدارة مجلس الحوكمة الافتراضي' : 'Virtual GRC Dept'}</span>
           </div>
           
           <div className="space-y-1">
             <button
                onClick={() => handleNavClick('virtualDepartment')}
                className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'virtualDepartment'
                    ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {currentView === 'virtualDepartment' && (
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-20"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                      backgroundSize: '200% 200%',
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}
                <UserGroupIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualDepartment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
                <span className="relative z-10 font-normal">{t.virtualDepartment}</span>
              </button>

             <button
                onClick={() => handleNavClick('virtualMeeting')}
                className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'virtualMeeting'
                    ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {currentView === 'virtualMeeting' && (
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-10"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                      backgroundSize: '200% 200%',
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}
                <PhoneIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualMeeting' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
                <span className="relative z-10 font-normal">{t.virtualMeeting}</span>
              </button>

             <button
                onClick={() => handleNavClick('whiteboard')}
                className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'whiteboard'
                    ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {currentView === 'whiteboard' && (
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-10"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                      backgroundSize: '200% 200%',
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}
                <LayoutIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'whiteboard' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
                <span className="relative z-10 font-normal">{t.whiteboard}</span>
              </button>

             <button
                onClick={() => handleNavClick('creatorMarketplace')}
                className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                  currentView === 'creatorMarketplace'
                    ? 'bg-amber-50 dark:bg-white/10 text-amber-700 dark:text-white font-medium border border-amber-500/20 dark:border-white/10 shadow-lg dark:shadow-amber-500/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {currentView === 'creatorMarketplace' && (
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-20"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 0%, #F59E0B 20%, #FBBF24 40%, #F59E0B 60%, #D97706 80%, #FBBF24 100%)',
                      backgroundSize: '200% 200%',
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}
                <UsersIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'creatorMarketplace' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400/70'}`} />
                <span className="relative z-10 font-normal">{t.creatorMarketplace}</span>
              </button>
           </div>

           <div className="pl-3 space-y-1.5 mt-2.5">
               {virtualAgents.map(agent => (
                   <div 
                     key={agent.id} 
                     className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer transition-colors" 
                     onClick={() => handleNavClick('virtualDepartment')}
                   >
                       <div className="relative flex-shrink-0">
                           <img src={agent.avatarUrl} alt={agent.name} className="w-6 h-6 rounded-full object-cover border border-black/10 dark:border-white/10" />
                           <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900"></span>
                       </div>
                       <div className="min-w-0">
                           <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">{agent.name}</p>
                           <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none truncate">{agent.role}</p>
                       </div>
                   </div>
               ))}
           </div>
        </li>
      )}

      {permissions.has('users:read') && (
        <li>
          <button
              onClick={() => handleNavClick('userManagement')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'userManagement'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <UsersIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'userManagement' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.userManagement}</span>
            </button>
        </li>
      )}

      {permissions.has('company:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('companyProfile')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'companyProfile'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BuildingOfficeIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'companyProfile' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.companyProfile}</span>
            </button>
        </li>
      )}

      {permissions.has('userProfile:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('userProfile')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'userProfile'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <IdentificationIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'userProfile' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.myProfile}</span>
            </button>
        </li>
      )}

      {permissions.has('assets:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('assets')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'assets'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ShieldCheckIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'assets' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.assetInventory}</span>
            </button>
        </li>
      )}

      {permissions.has('integrations:manage') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('integrations')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'integrations'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <LinkIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'integrations' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.integrations}</span>
            </button>
        </li>
      )}

      {permissions.has('vapt:manage') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('vapt')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'vapt'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BugAntIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'vapt' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.vaptOrchestrator}</span>
            </button>
        </li>
      )}

      {permissions.has('documents:read') && (
        <li className="mt-1">
          <button
              id="sidebar-documents"
              onClick={() => handleNavClick('documents')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'documents'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <DocumentIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'documents' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.documents}</span>
            </button>
        </li>
      )}
      
      {/* Security Awareness Section */}
      {permissions.has('training:read') && (
        <li className="mt-5 mb-2">
           <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Security Awareness</span>
           </div>
           <div className="space-y-1">
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
                           className={`w-full text-left p-2 pl-3 rounded-md text-sm transition-colors duration-200 flex items-center justify-between group ${
                               currentView === 'training' 
                               ? 'bg-teal-50 dark:bg-white/10 text-teal-700 dark:text-teal-300 font-normal border border-teal-500/20 dark:border-white/10' 
                               : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                           }`}
                       >
                           <div className="flex items-center overflow-hidden gap-2">
                               <div className={`relative flex-shrink-0 ${isBadgeEarned ? 'text-yellow-500' : 'text-slate-400'}`}>
                                  <GraduationCapIcon className="w-4 h-4" />
                                  {isBadgeEarned && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                               </div>
                               <span className="truncate text-xs font-normal">{course.title.replace('Cybersecurity ', '').replace('Security', '')}</span>
                           </div>
                           
                           <div className="flex items-center">
                               {percent > 0 && (
                                 <div className="w-8 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 ml-2">
                                    <div className={`h-1.5 rounded-full ${percent === 100 ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }}></div>
                                 </div>
                               )}
                           </div>
                       </button>
                   );
               })}
           </div>
        </li>
      )}

      {permissions.has('riskAssessment:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('riskAssessment')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'riskAssessment'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ExclamationTriangleIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'riskAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.riskAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:read') && (
        <li className="mt-1">
          <button
              id="sidebar-assessment"
              onClick={() => handleNavClick('assessment')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'assessment'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ClipboardCheckIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'assessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.eccAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('pdplAssessment:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('pdplAssessment')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'pdplAssessment'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ShieldKeyholeIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'pdplAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.pdplAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('samaCsfAssessment:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('samaCsfAssessment')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'samaCsfAssessment'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <LandmarkIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'samaCsfAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.samaAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('cmaAssessment:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('cmaAssessment')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'cmaAssessment'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10 shadow-lg dark:shadow-cyan-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <LineChartIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'cmaAssessment' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.cmaAssessment}</span>
            </button>
        </li>
      )}

      {permissions.has('audit:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('auditLog')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'auditLog'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <ClipboardListIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'auditLog' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{t.auditLog}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:update') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('liveVoiceDemo')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'liveVoiceDemo'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <PhoneIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'liveVoiceDemo' ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="font-normal">{language === 'ar' ? 'تجربة الصوت الحي' : 'Live Voice Demo'}</span>
            </button>
        </li>
      )}

      {permissions.has('assessment:update') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('complianceAgent')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'complianceAgent'
                  ? 'bg-purple-50 dark:bg-white/10 text-purple-700 dark:text-white font-medium border border-purple-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <SparklesIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'complianceAgent' ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="font-normal">{language === 'ar' ? 'وكيل الامتثال الذكي' : 'Compliance Agent'}</span>
            </button>
        </li>
      )}

      {/* Super Admin Button */}
      {permissions.has('superAdmin:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('superAdmin')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'superAdmin'
                  ? 'bg-red-50 dark:bg-white/10 text-red-700 dark:text-white font-medium border border-red-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BuildingOfficeIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'superAdmin' ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="font-normal">{language === 'ar' ? 'مشرف النظام' : 'Super Admin'}</span>
            </button>
        </li>
      )}

      {permissions.has('help:read') && (
        <li className="mt-1">
          <button
              onClick={() => handleNavClick('help')}
              className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                currentView === 'help'
                  ? 'bg-teal-50 dark:bg-white/10 text-teal-600 dark:text-white font-medium border border-teal-500/20 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <QuestionMarkCircleIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'help' ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-cyan-400/70'}`} />
              <span className="font-normal">{language === 'ar' ? 'الدعم الفني للنظام' : 'System Support'}</span>
            </button>
        </li>
      )}

      {/* Internal Links for Quick Access */}
      <li className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
         <h2 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 px-3 uppercase tracking-[0.2em]">Quick Links</h2>
         <div className="space-y-1">
           <button
              onClick={() => handleNavClick('cmaAssessment')}
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">1</span>
              <span>CMA</span>
            </button>
            <button
              onClick={() => handleNavClick('breadcrumbDesign')}
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-blue-100 dark:bg-blue-950/40 text-[10px] font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">BD</span>
              <span>Breadcrumb Design</span>
            </button>
            <button
              onClick={() => handleNavClick('accordionDesign')}
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-purple-100 dark:bg-purple-950/40 text-[10px] font-medium text-purple-600 dark:text-purple-400 flex-shrink-0">AD</span>
              <span>Accordion Design</span>
            </button>
            <a
              href="https://hrsd-automated-policy-generator-365172165068.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">2</span>
              <span>HRSD</span>
            </a>
           <button
              onClick={() => handleNavClick('pdplAssessment')}
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">3</span>
              <span>PDPL</span>
            </button>
            <a
              href="https://app-496821664990.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-2.5 rounded-md text-[13px] transition-colors duration-200 flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">4</span>
              <span>ISO 31000</span>
            </a>
         </div>
      </li>

      {permissions.has('navigator:read') && (
        <li id="sidebar-navigator-header" className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center mb-3 px-3">
            <h2 className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{language === 'ar' ? 'مستعرض ضوابط الهيئة الوطنية' : 'NCA ECC Control Navigator'}</h2>
          </div>
          <div className="space-y-1">
            {domains.map((domain, index) => {
              const controlCount = domain.subdomains.reduce((acc, sub) => acc + sub.controls.length, 0);
              const isSelected = selectedDomain.id === domain.id && currentView === 'navigator';
              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainClick(domain)}
                  className={`w-full text-left p-3 rounded-md text-xs transition-colors duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-white/10 text-teal-700 dark:text-teal-300 font-normal border border-teal-500/20 dark:border-white/10 shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start flex-1 min-w-0 pr-2">
                    <span className={`mr-2.5 font-mono text-teal-600 dark:text-teal-400 font-semibold ${isSelected ? 'font-bold' : ''}`}>{index + 1}</span>
                    <span className="truncate" title={domain.name}>{domain.name}</span>
                  </div>
                  <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? 'bg-teal-100 dark:bg-teal-500/30 text-teal-800 dark:text-teal-200'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
      <aside className="w-72 glass-panel m-4 mr-0 border-white/5 shadow-2xl overflow-hidden hidden md:flex md:flex-col h-[calc(100%-2rem)] bg-white/40 dark:bg-white/[0.01]">
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
              className={`relative w-72 glass-panel m-4 border-white/5 shadow-2xl overflow-hidden flex flex-col h-[calc(100%-2rem)] z-50 bg-slate-50 dark:bg-[#111122]`}
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
