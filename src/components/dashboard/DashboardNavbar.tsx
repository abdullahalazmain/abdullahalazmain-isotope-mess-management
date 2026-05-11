import React, { useState } from 'react';
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

const DashboardNavbar = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const [isDark, setIsDark] = useState(false);

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

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 text-slate-500 hover:text-slate-800 shadow-sm transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
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
