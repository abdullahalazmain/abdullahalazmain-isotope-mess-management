import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  Plug, 
  Search, 
  Moon, 
  Sun, 
  Bell, 
  Settings, 
  Download, 
  Plus, 
  User, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  FileText,
  Clock,
  Gift,
  Menu,
  LogOut,
  Users,
  Utensils,
  ShoppingCart,
  CreditCard,
  Megaphone,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import MembersView from './MembersView';
import MealsView from './MealsView';
import BazarView from './BazarView';
import PaymentsView from './PaymentsView';
import SummaryView from './SummaryView';
import NoticeView from './NoticeView';
import SettingsView from './SettingsView';

const expenseData = [
  { name: 'Jan', expense: 4000, market: 2400 },
  { name: 'Feb', expense: 3000, market: 1398 },
  { name: 'Mar', expense: 2000, market: 9800 },
  { name: 'Apr', expense: 2780, market: 3908 },
  { name: 'May', expense: 1890, market: 4800 },
];

const pieData = [
  { name: 'বাজার', value: 400 },
  { name: 'ভাড়া', value: 300 },
  { name: 'ইউটিলিটি', value: 300 },
];
const COLORS = ['#6366f1', '#10b981', '#f43f5e'];

const Sidebar = ({ isOpen, onToggle, activeView, setActiveView }: { isOpen: boolean, onToggle: () => void, activeView: string, setActiveView: (v: string) => void }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const icons = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, title: "ড্যাশবোর্ড (Dashboard)", active: activeView === 'dashboard' },
    { id: 'members', icon: <Users size={20} />, title: "মেম্বার (Members)", active: activeView === 'members' },
    { id: 'meals', icon: <Utensils size={20} />, title: "মিলের হিসাব (Meals)", active: activeView === 'meals' },
    { id: 'bazar', icon: <ShoppingCart size={20} />, title: "বাজার খরচ (Bazar/Expenses)", active: activeView === 'bazar' },
    { id: 'payments', icon: <CreditCard size={20} />, title: "পেমেন্টস ও বিল (Payments & Bills)", active: activeView === 'payments' },
    { id: 'notice', icon: <Megaphone size={20} />, title: "নোটিশ বোর্ড (Notice Board)", active: activeView === 'notice' },
    { id: 'summary', icon: <PieChart size={20} />, title: "ফাইনাল সামারি (Monthly Summary)", active: activeView === 'summary' },
    { id: 'settings', icon: <Settings size={20} />, title: "সেটিংস (Settings)", active: activeView === 'settings' },
  ];

  return (
    <>
      {!isOpen && (
        <button onClick={onToggle} className="fixed left-6 top-8 z-50 w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center shadow-lg border border-slate-100 cursor-pointer hover:scale-105 transition-transform">
          <Menu className="text-[#6366f1]" size={24} />
        </button>
      )}

      <motion.div 
        initial={false}
        animate={{ x: isOpen ? 0 : -150, opacity: isOpen ? 1 : 0 }}
        className="fixed left-0 top-0 bottom-0 flex items-center pointer-events-none z-40"
      >
        <div className="w-[80px] h-[95vh] bg-[#6366f1] rounded-r-[3rem] flex flex-col items-center py-10 gap-8 pointer-events-auto shadow-2xl relative">
          
          {/* Background blobs in their own overflow-hidden container */}
          <div className="absolute inset-0 overflow-hidden rounded-r-[3rem] pointer-events-none">
            <div className="absolute top-[-10%] right-[-50%] w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-[20%] left-[-20%] w-24 h-24 bg-black/10 rounded-full blur-xl" />
          </div>

          <div onClick={onToggle} className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center mb-4 shadow-lg shrink-0 cursor-pointer hover:scale-105 transition-transform relative z-10 group">
            <Menu className="text-[#6366f1]" size={24} />
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
              মেনু গুটিয়ে ফেলুন
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          </div>

        <div className="flex flex-col gap-6 w-full items-center flex-1 no-scrollbar relative z-10">
          {icons.map((item, i) => (
            <div key={i} className="relative group cursor-pointer w-full flex justify-center">
              {item.active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-400 rounded-r-full" />
              )}
              <div 
                onClick={() => { if(item.id) setActiveView(item.id); }}
                className={`p-3 rounded-xl transition-all ${item.active ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                {item.icon}
              </div>

              {/* Custom Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
                {item.title}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6 shrink-0 cursor-pointer relative z-10 group" onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=James" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/50 hover:scale-105 transition-transform" />
          
          {/* Custom Tooltip for Profile */}
          {!isProfileOpen && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
              আপনার প্রোফাইল
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          )}
        </div>
        </div>

        <AnimatePresence>
          {isProfileOpen && isOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-[90px] bottom-10 w-64 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_-15px_rgba(81,68,177,0.3)] border border-white flex flex-col pointer-events-auto z-50"
            >
              <div className="flex items-center gap-3 mb-4 p-2 border-b border-slate-100 pb-4">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=James" alt="Profile" className="w-12 h-12 rounded-full border-2 border-indigo-100 bg-indigo-50" />
                <div>
                  <h4 className="text-slate-800 font-bold text-sm">গুগল ইউজার</h4>
                  <p className="text-xs text-slate-500">user@example.com</p>
                </div>
              </div>
              <button onClick={() => window.location.href = '/'} className="flex items-center gap-3 w-full p-3 hover:bg-red-50 rounded-xl text-left font-semibold text-red-500 transition-colors mt-1">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">লগআউট</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const Navbar = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
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

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManager, setIsManager] = useState(() => localStorage.getItem('userRole') === 'Manager');
  const [activeView, setActiveView] = useState('dashboard');

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans overflow-hidden flex relative">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} activeView={activeView} setActiveView={setActiveView} />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-28' : 'ml-4'} pl-4 pr-10 py-8 h-screen overflow-y-auto no-scrollbar relative`}>
        <Navbar isSidebarOpen={isSidebarOpen} />

        {/* View Toggle removed for production auth */}

        {activeView === 'members' ? (
          <MembersView isManager={isManager} />
        ) : activeView === 'meals' ? (
          <MealsView isManager={isManager} />
        ) : activeView === 'bazar' ? (
          <BazarView isManager={isManager} />
        ) : activeView === 'payments' ? (
          <PaymentsView isManager={isManager} />
        ) : activeView === 'summary' ? (
          <SummaryView isManager={isManager} />
        ) : activeView === 'notices' ? (
          <NoticeView isManager={isManager} />
        ) : activeView === 'settings' ? (
          <SettingsView isManager={isManager} />
        ) : (
          <>
            {/* 7.1 The Personal View */}
        <div className="flex flex-col gap-8 relative z-10">
          
          {/* A) Personal Finance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Paid */}
            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">পরিশোধিত টাকা</p>
              <h3 className="text-2xl font-black text-slate-800">৳ ৫,০০০</h3>
            </div>
            {/* Meal Cost */}
            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">খাবার খরচ</p>
              <h3 className="text-2xl font-black text-slate-800">৳ ২,৪৫০</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">৩৫ মিল × ৳৭০</p>
            </div>
            {/* Utility/Fixed */}
            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">অন্যান্য বিল</p>
              <h3 className="text-2xl font-black text-slate-800">৳ ১,২০০</h3>
            </div>
            {/* Market Credit */}
            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বাজার ক্রেডিট</p>
              <h3 className="text-2xl font-black text-[#6366f1]">৳ ৩,০০০</h3>
            </div>
            {/* Final Status */}
            <div className="bg-[#1e1b4b]/90 backdrop-blur-xl shadow-2xl shadow-[#1e1b4b]/20 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">কারেন্ট ব্যালেন্স</p>
              <h3 className="text-3xl font-black text-emerald-400">৳ ৪,৩৫০</h3>
              <p className="text-xs font-bold text-emerald-300 mt-1">আপনি পাবেন</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* B) Meal Tracker Grid */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Utensils className="w-5 h-5 text-[#6366f1]" /> মিল ট্র্যাকার</h3>
                <span className="px-4 py-1.5 bg-indigo-50/80 text-[#6366f1] rounded-full text-xs font-bold shadow-sm">মে ২০২৪</span>
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-3 mb-6">
                {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'].map(d => (
                  <div key={d} className="text-[10px] font-bold text-slate-400 text-center">{d}</div>
                ))}
                {days.map((d) => (
                  <div key={d} className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${d === 15 ? 'bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] ring-2 ring-indigo-100 ring-offset-2' : 'bg-white/50 text-slate-700 hover:bg-white shadow-sm border border-white/40'}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] opacity-60">{d}</span>
                      <span>{d % 5 === 0 ? '0' : d % 3 === 0 ? '1.5' : '2'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-slate-200/50 flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-500">মোট মিল:</h4>
                <h2 className="text-2xl font-black text-slate-800">৩৫.৫</h2>
              </div>
            </div>

            {/* C) Alerts & Duty Tracker */}
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/80 backdrop-blur-md border border-orange-100/50 shadow-xl rounded-3xl p-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-orange-500" /> নোটিফিকেশন</h3>
                <div className="flex flex-col gap-3">
                  <div className="bg-white/80 p-3 rounded-xl border border-white shadow-sm">
                    <p className="text-xs font-bold text-slate-700">খালার বিল ১০ তারিখের মধ্যে দিন!</p>
                    <p className="text-[10px] text-slate-400 mt-1">ম্যানেজার • ২ ঘন্টা আগে</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-white shadow-sm">
                    <p className="text-xs font-bold text-slate-700">আগামীকাল আপনার বাজারের ডিউটি।</p>
                    <p className="text-[10px] text-slate-400 mt-1">সিস্টেম • ৫ ঘন্টা আগে</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex-1">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-emerald-500" /> বাজারের দিন</h3>
                <div className="flex items-center gap-4 p-4 bg-emerald-50/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-lg font-black text-emerald-600">১২</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">মে ১২, ২০২৪</h4>
                    <p className="text-xs font-semibold text-emerald-600">আপনার ডিউটি</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D) Data Visualization */}
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 h-80">
             <h3 className="font-bold text-slate-800 text-lg mb-6">খরচ বনাম বাজার (Insights)</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="খরচ" />
                  <Bar dataKey="market" fill="#10b981" radius={[4, 4, 0, 0]} name="বাজার ক্রেডিট" />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

        {/* 7.2 The Admin Control View */}
        {isManager && (
          <div className="mt-12 flex flex-col gap-8 relative z-10">
            <div className="absolute -left-4 -right-10 top-0 bottom-0 bg-[#6366f1]/5 rounded-[3rem] -z-10 border border-[#6366f1]/10 backdrop-blur-sm" />
            
            <div className="flex items-center gap-3 pt-8 px-6">
              <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">মেস কন্ট্রোল প্যানেল</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
              {/* A) Mess Health Stats */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60 flex flex-col">
                <h3 className="font-bold text-slate-800 text-lg mb-4">মেস হেলথ</h3>
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট বকেয়া</p>
                  <h3 className="text-3xl font-black text-rose-500">৳ ১২,৫০০</h3>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">কালেকশন স্ট্যাটাস</p>
                    <span className="text-xs font-bold text-[#6366f1]">৭৫%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-[#6366f1] rounded-full w-3/4" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">শীর্ষ বকেয়া</p>
                  <div className="flex flex-col gap-3">
                    {['রহিম', 'করিম'].map((name, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                        <span className="text-xs font-bold text-slate-700">{name} <span className="text-rose-500 ml-1">(৳ ৫,০০০)</span></span>
                        <button className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-colors shadow-sm">Alert</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* B) Operational Checklist */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60">
                <h3 className="font-bold text-slate-800 text-lg mb-6">অপারেশনাল চেকলিস্ট</h3>
                <div className="flex flex-col gap-4 mb-8">
                  {['বাসা ভাড়া', 'বিদ্যুৎ বিল', 'পানির বিল'].map((bill, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-2xl shadow-sm border border-slate-50 transition-all hover:shadow-md">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${i === 0 ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                        {i === 0 && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${i === 0 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{bill}</span>
                    </label>
                  ))}
                </div>
                <div className="p-5 bg-indigo-50/80 backdrop-blur-sm rounded-3xl border border-indigo-100 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">পেন্ডিং ভাউচার</h4>
                    <p className="text-[10px] font-semibold text-slate-500">বাজারের রিকোয়েস্ট</p>
                  </div>
                  <div className="w-10 h-10 bg-[#6366f1] text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-indigo-200">৩</div>
                </div>
              </div>

              {/* C) Admin Charts */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60 flex flex-col">
                <h3 className="font-bold text-slate-800 text-lg mb-2">ব্যয় বিভাজন</h3>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366f1]" /> <span className="text-[10px] font-bold text-slate-600">বাজার</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> <span className="text-[10px] font-bold text-slate-600">ভাড়া</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> <span className="text-[10px] font-bold text-slate-600">ইউটিলিটি</span></div>
                </div>
              </div>
            </div>
            <div className="pb-24"></div>
          </div>
        )}
          </>
        )}

      </div>

      {/* 7.3 Floating Action Button (FAB) */}
      <button className="fixed bottom-8 right-8 px-6 py-4 bg-[#1e1b4b] text-white rounded-full font-bold shadow-[0_10px_40px_-10px_rgba(30,27,75,0.7)] hover:bg-[#312e81] hover:-translate-y-1 transition-all flex items-center gap-3 z-50 group border border-white/10 backdrop-blur-md">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
          <Plus className="w-5 h-5" />
        </div>
        {isManager ? 'Add Mess Expense' : 'Add Guest Meal'}
      </button>

    </div>
  );
}
