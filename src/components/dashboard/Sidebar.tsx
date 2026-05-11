import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Utensils, 
  ShoppingCart, 
  CreditCard, 
  Megaphone, 
  PieChart, 
  Settings, 
  Menu, 
  LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, onToggle, activeView, setActiveView, userProfile }: { isOpen: boolean, onToggle: () => void, activeView: string, setActiveView: (v: string) => void, userProfile: any }) => {
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

                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 shrink-0 cursor-pointer relative z-10 group" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <img src={userProfile?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=James"} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/50 hover:scale-105 transition-transform" />
            
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
                <img src={userProfile?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=James"} alt="Profile" className="w-12 h-12 rounded-full border-2 border-indigo-100 bg-indigo-50" />
                <div>
                  <h4 className="text-slate-800 font-bold text-sm">{userProfile?.name || 'গুগল ইউজার'}</h4>
                  <div className="flex flex-col">
                    <p className="text-[10px] text-slate-500 leading-tight">{userProfile?.email || 'user@example.com'}</p>
                    {userProfile?.role && (
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${userProfile.role === 'Manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {userProfile.role === 'Manager' ? 'ম্যানেজার' : 'মেম্বার'}
                        </span>
                      </div>
                    )}
                  </div>
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

export default Sidebar;
