import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Workflow, 
  Plug, 
  Search, 
  Moon, 
  Bell, 
  Settings, 
  Download 
} from 'lucide-react';

const DashboardNavbar = ({ 
  isSidebarOpen,
  unreadCount = 0, 
  unreadNotices = [], 
  onNoticeClick,
  onBellClick
}: { 
  isSidebarOpen: boolean, 
  unreadCount?: number,
  unreadNotices?: any[],
  onNoticeClick?: (id: string) => void,
  onBellClick?: () => void
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center justify-between w-full mb-10 pr-4">
      <div className={`flex items-center gap-8 transition-all duration-300 ${!isSidebarOpen ? 'ml-16' : 'ml-0'}`}>
        <div className="flex items-center gap-2 cursor-pointer">
          <LayoutDashboard className="w-5 h-5 text-slate-800" />
          <span className="font-bold text-slate-800 border-b-2 border-slate-800 pb-1">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
          <Workflow className="w-5 h-5" />
          <span className="font-semibold">Workflows</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
          <Plug className="w-5 h-5" />
          <span className="font-semibold">Integrations</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search or type command" 
            className="w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center bg-white rounded-full p-1 border border-slate-100 shadow-sm">
          <button 
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${!isDark ? 'bg-[#6366f1] text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setIsDark(false)}
          >
            <div className={`w-2 h-2 rounded-full ${!isDark ? 'bg-white' : 'bg-slate-300'}`} /> Light
          </button>
          <button 
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${isDark ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setIsDark(true)}
          >
            <Moon className="w-3 h-3" /> Dark
          </button>
        </div>

        <div className="flex items-center gap-3 relative" ref={notifRef}>
          <button 
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) onBellClick?.();
            }}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-slate-500 hover:text-slate-800 shadow-sm transition-colors relative"
          >
            <motion.div
              animate={unreadCount > 0 ? {
                rotate: [0, -15, 15, -15, 15, 0],
              } : {}}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                repeatDelay: 2
              }}
            >
              <Bell className="w-5 h-5" />
            </motion.div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-red-200">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute top-12 right-0 w-80 bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[2rem] overflow-hidden z-[100]"
              >
                <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-black text-slate-800 text-sm">নোটিফিকেশন ({unreadCount})</h3>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  {unreadNotices.length > 0 ? (
                    unreadNotices.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onNoticeClick?.(n.id);
                          setIsNotifOpen(false);
                        }}
                        className="w-full p-4 text-left bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.isUrgent ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{n.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">ম্যানেজার থেকে বার্তা</p>
                          </div>
                          {n.isUrgent && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-xs font-bold text-slate-400">কোনো নতুন নোটিশ নেই</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    onNoticeClick?.(''); // Hack to just redirect to notice page if empty? No, better just use a generic redirect.
                    setIsNotifOpen(false);
                  }}
                  className="w-full p-4 bg-slate-50 text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-colors text-center uppercase tracking-widest"
                >
                  সব নোটিশ দেখুন
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-slate-500 hover:text-slate-800 shadow-sm transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#6366f1]/10 text-[#6366f1] rounded-full text-sm font-bold hover:bg-[#6366f1]/20 transition-colors">
            <Download className="w-4 h-4" />
            Export data
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1e1b4b] text-white rounded-full text-sm font-bold hover:bg-[#312e81] shadow-lg shadow-[#1e1b4b]/20 transition-all">
            Add new board
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
