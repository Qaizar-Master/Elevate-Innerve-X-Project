
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Menu, X, Pin, PinOff, Layers, User } from 'lucide-react';
import { NavItemConfig, UserRole, UserProfile, AppView } from '../types';
import { api } from '../services/api.client';

interface SidebarProps {
  config: NavItemConfig[];
  activeId: string;
  userRole: UserRole;
  onNavigate: (item: NavItemConfig) => void;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Telemetry mock
const trackNavClick = (id: string) => {
    // console.log(`[Telemetry] Navigation Click: ${id}`);
};

const NavItem: React.FC<{
  item: NavItemConfig;
  isActive: boolean;
  activeId?: string;
  isCollapsed: boolean;
  depth: number;
  onNavigate: (item: NavItemConfig) => void;
}> = ({ item, isActive, activeId, isCollapsed, depth, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  // Auto-expand if a child is active
  useEffect(() => {
    if (hasSubItems && activeId && item.subItems?.some(sub => sub.id === activeId)) {
        setIsExpanded(true);
    }
  }, [activeId, item.subItems, hasSubItems]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackNavClick(item.id);
    
    if (hasSubItems) {
      setIsExpanded(!isExpanded);
    } else {
      onNavigate(item);
    }
  };

  const basePadding = isCollapsed ? 'p-3 justify-center' : `py-3 pr-4 pl-${depth * 4 + 4}`;

  return (
    <li className="mb-1">
      <button
        onClick={handleClick}
        aria-expanded={hasSubItems ? isExpanded : undefined}
        aria-current={isActive ? 'page' : undefined}
        title={isCollapsed ? item.label : undefined}
        className={`
          group w-full flex items-center rounded-lg transition-all duration-200 relative border border-transparent
          ${basePadding}
          ${isActive 
            ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#0A1A3F]/50 border-[#1E3A8A]' 
            : 'text-[#CBD5E1] hover:text-white hover:bg-[#1E293B]'
          }
        `}
      >
        <div className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
          {item.icon}
        </div>

        {!isCollapsed && (
          <>
            <span className="ml-3 font-medium text-sm truncate flex-1 text-left tracking-wide">
              {item.label}
            </span>
            
            {item.badge && (
              <span className={`
                ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                ${item.badge.color === 'red' ? 'bg-red-500/20 text-red-300' : ''}
                ${item.badge.color === 'blue' ? 'bg-[#1E3A8A]/40 text-blue-200' : ''}
                ${item.badge.color === 'green' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                ${item.badge.color === 'yellow' ? 'bg-amber-500/20 text-amber-300' : ''}
              `}>
                {item.badge.text}
              </span>
            )}

            {hasSubItems && (
              <div className={`ml-2 ${isActive ? 'text-white/80' : 'text-[#64748B]'}`}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
          </>
        )}
        
        {/* Active Indicator Glow for Collapsed Mode */}
        {isCollapsed && isActive && (
             <div className="absolute right-1 top-1 w-2 h-2 bg-[#00C2FF] rounded-full animate-pulse shadow-glow" />
        )}
      </button>

      {/* Submenu */}
      {hasSubItems && isExpanded && !isCollapsed && (
        <ul className="mt-1 space-y-1 animate-slide-down origin-top overflow-hidden">
          {item.subItems!.map((sub) => (
            <NavItem 
                key={sub.id} 
                item={sub} 
                isActive={activeId === sub.id}
                activeId={activeId}
                isCollapsed={isCollapsed}
                depth={depth + 1}
                onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
    config, activeId, userRole, onNavigate, isMobile, isOpen, setIsOpen 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
      const loadProfile = async () => {
          const p = await api.getUserProfile();
          setProfile(p);
      };
      loadProfile();
      
      // Listen for profile updates (primitive polling for this demo)
      const interval = setInterval(loadProfile, 2000);
      return () => clearInterval(interval);
  }, []);

  // Filter items by role
  const visibleItems = config.filter(item => !item.role || item.role.includes(userRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
            fixed lg:relative z-50 h-screen bg-[#0F172A] border-r border-[#1E293B] flex flex-col transition-all duration-300 ease-in-out shadow-2xl
            ${isMobile 
                ? (isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') 
                : (isCollapsed ? 'w-20' : 'w-72')
            }
        `}
      >
        {/* Header */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-[#1E293B]`}>
            {!isCollapsed && (
                 <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A1A3F] to-[#1E3A8A] flex items-center justify-center shadow-lg border border-[#1E3A8A]">
                        <Layers size={20} className="text-white"/>
                    </div>
                    <span className="font-bold text-white text-xl tracking-tight">Elevate</span>
                </div>
            )}
            {isCollapsed && (
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A1A3F] to-[#1E3A8A] flex items-center justify-center font-bold text-white shadow-lg">E</div>
            )}

            {/* Collapse Toggle (Desktop only) */}
            {!isMobile && (
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-[#64748B] hover:text-white transition-colors"
                >
                    {isCollapsed ? <PinOff size={18}/> : <Pin size={18} className="rotate-45"/>}
                </button>
            )}
            
            {/* Close (Mobile only) */}
            {isMobile && (
                <button onClick={() => setIsOpen(false)} className="text-[#64748B]">
                    <X size={24} />
                </button>
            )}
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
            <ul className="space-y-1">
                {visibleItems.map(item => (
                    <NavItem 
                        key={item.id} 
                        item={item} 
                        isActive={activeId === item.id} 
                        activeId={activeId}
                        isCollapsed={isCollapsed && !isMobile}
                        depth={0}
                        onNavigate={(i) => {
                            onNavigate(i);
                            if(isMobile) setIsOpen(false);
                        }}
                    />
                ))}
            </ul>
        </div>

        {/* Footer / User Profile - CLEANED UP */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1C]">
            <button 
                onClick={() => {
                    const settingsNav = config.find(c => c.view === AppView.SETTINGS);
                    if (settingsNav) {
                        onNavigate(settingsNav);
                        if(isMobile) setIsOpen(false);
                    }
                }}
                className={`flex items-center w-full rounded-xl transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3 px-3 py-2 hover:bg-[#1E293B]'}`}
            >
                <div className="w-10 h-10 rounded-full bg-[#1E3A8A] border border-[#334155] flex items-center justify-center overflow-hidden shrink-0">
                     {profile?.avatarUrl ? (
                         <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                     ) : (
                         <User size={20} className="text-white"/>
                     )}
                </div>
                {!isCollapsed && (
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{profile?.name || 'Student'}</p>
                    </div>
                )}
            </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
