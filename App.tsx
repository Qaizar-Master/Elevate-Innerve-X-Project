
import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, MessageSquare, Code, Users, Settings, 
    Menu, PenTool, StickyNote, ArrowLeft, Sun, Moon
} from 'lucide-react';
import { AppView, NavItemConfig, UserRole } from './types';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import CodeSandbox from './components/CodeSandbox';
import TeacherDashboard from './components/TeacherDashboard';
import SettingsPage from './components/Settings';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import NotesLibrary from './components/NotesLibrary';
import TestGenerator from './components/TestGenerator';

// --- Navigation Configuration ---
const navigationConfig: NavItemConfig[] = [
    {
        id: 'my_progress',
        label: 'My Progress',
        icon: <LayoutDashboard size={20} />,
        view: AppView.DASHBOARD,
        badge: { text: 'Home', color: 'blue' }
    },
    {
        id: 'ask_question',
        label: 'Ask Question',
        icon: <MessageSquare size={20} />,
        view: AppView.CHAT
    },
    {
        id: 'generate_test',
        label: 'Generate Test',
        icon: <PenTool size={20} />,
        view: AppView.TEST_GENERATOR
        // Badge removed as requested
    },
    {
        id: 'coding_sandbox',
        label: 'Coding Sandbox',
        icon: <Code size={20} />,
        view: AppView.CODING,
        shortcut: 'Alt+C'
    },
    {
        id: 'notes',
        label: 'Notes & Summaries',
        icon: <StickyNote size={20} />,
        view: AppView.NOTES_LIBRARY
    },
    {
        id: 'teachers',
        label: 'Teachers / Class',
        icon: <Users size={20} />,
        view: AppView.TEACHER,
        role: ['teacher', 'admin']
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: <Settings size={20} />,
        view: AppView.SETTINGS
    }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [viewProps, setViewProps] = useState<Record<string, any>>({});
  const [activeNavId, setActiveNavId] = useState('my_progress');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Navigation History Stack
  const [navHistory, setNavHistory] = useState<{view: AppView, id: string, props: any}[]>([{ view: AppView.DASHBOARD, id: 'my_progress', props: {} }]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleNavigate = (item: NavItemConfig) => {
    setActiveNavId(item.id);
    if (item.view) {
        setCurrentView(item.view);
    }
    const props = item.viewProps || {};
    setViewProps(props);

    // Push to history if it's different from current
    setNavHistory(prev => {
        const last = prev[prev.length - 1];
        if (last.id !== item.id) {
            return [...prev, { view: item.view || AppView.DASHBOARD, id: item.id, props }];
        }
        return prev;
    });
  };

  const handleBack = () => {
      if (navHistory.length > 1) {
          const newHistory = [...navHistory];
          newHistory.pop(); // Remove current
          const previous = newHistory[newHistory.length - 1];
          setNavHistory(newHistory);
          setCurrentView(previous.view);
          setActiveNavId(previous.id);
          setViewProps(previous.props);
      } else {
          // If at root but not dashboard, go dashboard
          if (currentView !== AppView.DASHBOARD) {
              handleNavigate(navigationConfig[0]);
          }
      }
  };

  if (!isAuthenticated) {
      return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // Determine if main area should scroll or if child handles it
  const isScrollablePage = currentView === AppView.DASHBOARD || currentView === AppView.TEACHER || currentView === AppView.SETTINGS || currentView === AppView.TEST_GENERATOR;

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 overflow-hidden font-sans selection:bg-[#0A1A3F] selection:text-white dark:selection:bg-indigo-500">
      
      {/* Sidebar Component */}
      <Sidebar 
        config={navigationConfig}
        activeId={activeNavId}
        userRole={'student'} 
        onNavigate={handleNavigate}
        isMobile={isMobile}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden transition-colors duration-200">
        
        {/* Universal Header */}
        <header className="h-16 shrink-0 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 z-20 shadow-sm transition-colors duration-200">
             <div className="flex items-center gap-3">
                 {/* Mobile Menu Toggle */}
                 <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-[#64748B] dark:text-slate-400 hover:text-[#0A1A3F] dark:hover:text-white rounded-lg">
                    <Menu size={24} />
                 </button>
                 
                 {/* Back Button */}
                 {(navHistory.length > 1 || currentView !== AppView.DASHBOARD) && (
                     <button 
                        onClick={handleBack}
                        className="p-2 text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 group"
                        title="Go Back"
                     >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold text-sm hidden sm:inline">Back</span>
                     </button>
                 )}

                 {/* Branding / Title on Mobile if sidebar hidden */}
                 <div className="lg:hidden flex items-center gap-2 ml-2">
                     <span className="font-bold text-[#0F172A] dark:text-white text-lg">Elevate</span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                 >
                     {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
                 
                 <button 
                    onClick={() => setIsAuthenticated(false)}
                    className="text-xs font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0A1A3F] dark:hover:text-white transition-colors"
                 >
                     Sign Out
                 </button>
             </div>
        </header>

        {/* Content Container */}
        <div className={`flex-1 relative w-full ${isScrollablePage ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}>
            <div className={`h-full w-full ${isScrollablePage ? 'min-h-full' : 'h-full'}`}>
                 <div className="p-2 lg:p-6 h-full w-full max-w-[1600px] mx-auto">
                    {currentView === AppView.DASHBOARD && (
                        <Dashboard />
                    )}

                    <div className={`h-full w-full ${currentView === AppView.CHAT ? 'block' : 'hidden'}`}>
                        <ChatInterface />
                    </div>

                    <div className={`h-full w-full ${currentView === AppView.NOTES_LIBRARY ? 'block' : 'hidden'}`}>
                        <NotesLibrary />
                    </div>

                    <div className={`h-full w-full ${currentView === AppView.TEST_GENERATOR ? 'block' : 'hidden'}`}>
                        <TestGenerator />
                    </div>

                    <div className={`h-full w-full ${currentView === AppView.CODING ? 'block' : 'hidden'}`}>
                        <CodeSandbox />
                    </div>

                    {currentView === AppView.TEACHER && (
                        <TeacherDashboard />
                    )}

                    {currentView === AppView.SETTINGS && (
                        <SettingsPage />
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
