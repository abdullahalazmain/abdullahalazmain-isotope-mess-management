import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import {
  Bell,
  LayoutDashboard,
  Menu,
  X as CloseIcon,
  LogIn,
  LogOut
} from "lucide-react";

/**
 * Navbar component with Glassmorphic design and mobile responsiveness.
 */
const LandingNavbar = ({ isLoggedIn, userProfile, onLoginClick, onRegisterClick, onDashboardClick, onLogout }: { isLoggedIn: boolean, userProfile: any, onLoginClick: () => void, onRegisterClick: () => void, onDashboardClick: () => void, onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-4 md:py-6"
        }`}
      id="navbar-container"
    >
      <div
        className={`max-w-7xl mx-auto px-6 h-16 flex items-center justify-between rounded-full transition-all duration-500 border border-transparent ${scrolled ? "glass mx-4 shadow-[0_20px_50px_-15px_rgba(81,68,177,0.15)] border-white/40" : "bg-transparent"
          }`}
        id="navbar-inner"
      >
        <div className="flex items-center gap-2 group cursor-pointer" id="logo">
          <div className="w-10 h-10 rounded-2xl border-2 border-brand-primary/20 flex items-center justify-center bg-white shadow-soft group-hover:rotate-12 transition-transform">
            <LayoutDashboard className="w-6 h-6 text-brand-primary" />
          </div>
          <span className="text-2xl font-black text-[#1e293b] tracking-tight">Isotope</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[#64748b] font-semibold" id="nav-links">
          <a href="#" className="hover:text-brand-primary transition-all relative group">
            হোম
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
          </a>
          <a href="#" className="hover:text-brand-primary transition-all relative group">
            ডকুমেন্টেশন
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
          </a>
          <a href="#" className="hover:text-brand-primary transition-all relative group">
            আমাদের সম্পর্কে
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
          </a>
        </div>

        {isLoggedIn ? (
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 text-[#64748b] hover:text-brand-primary transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full border-2 border-brand-primary/30 p-0.5 hover:scale-105 transition-transform overflow-hidden cursor-pointer shadow-soft">
                <img src={userProfile?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser"} alt="Profile" className="w-full h-full object-cover bg-brand-primary/10 rounded-full" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-64 glass bg-white/90 rounded-2xl p-4 shadow-[0_20px_50px_-15px_rgba(81,68,177,0.2)] border border-white flex flex-col z-50"
                  >
                    <div className="flex items-center gap-3 mb-4 p-2 border-b border-slate-100 pb-4">
                      <img src={userProfile?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser"} alt="Profile" className="w-12 h-12 rounded-full border-2 border-brand-primary/20 bg-brand-primary/10" />
                      <div>
                        <h4 className="text-[#1e293b] font-bold">{userProfile?.name || 'গুগল ইউজার'}</h4>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-slate-500">{userProfile?.email || 'user@example.com'}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setIsProfileOpen(false); onDashboardClick(); }} className="flex items-center gap-3 w-full p-3 hover:bg-brand-primary/5 rounded-xl text-left font-semibold text-[#1e293b] transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-brand-primary" />
                      ড্যাশবোর্ড
                    </button>
                    <button onClick={() => { setIsProfileOpen(false); onLogout(); }} className="flex items-center gap-3 w-full p-3 hover:bg-red-50 rounded-xl text-left font-semibold text-red-500 transition-colors mt-1">
                      <LogOut className="w-5 h-5" />
                      লগআউট
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-4" id="nav-actions">
            <button onClick={onLoginClick} className="flex items-center gap-2 px-6 py-2.5 text-brand-primary font-bold border-2 border-brand-primary/10 rounded-full hover:bg-brand-primary hover:text-white transition-all transform active:scale-95 group">
              <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
              লগইন করুন
            </button>
            <button onClick={onRegisterClick} className="px-8 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-full shadow-xl shadow-brand-primary/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
              রেজিস্ট্রেশন
            </button>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-[#1e293b] hover:bg-brand-primary/5 rounded-xl transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <CloseIcon className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-20 left-4 right-4 glass p-8 rounded-[2rem] md:hidden flex flex-col gap-6 items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] z-50 overflow-hidden"
            id="mobile-menu"
          >
            <a href="#" className="text-xl font-bold text-[#1e293b] py-2">হোম</a>
            <a href="#" className="text-xl font-bold text-[#1e293b] py-2">ডকুমেন্টেশন</a>
            <a href="#" className="text-xl font-bold text-[#1e293b] py-2">আমাদের সম্পর্কে</a>
            <div className="w-full h-px bg-brand-primary/10 my-2" />
            <div className="w-full flex flex-col gap-4">
              {isLoggedIn ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-4 p-4 border-2 border-brand-primary/10 rounded-2xl bg-white/50">
                    <img src={userProfile?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser"} alt="Profile" className="w-12 h-12 rounded-full border-2 border-brand-primary/20 bg-brand-primary/10" />
                    <div>
                      <h4 className="text-[#1e293b] font-bold">{userProfile?.name || 'গুগল ইউজার'}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500">{userProfile?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setIsOpen(false); onDashboardClick(); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary/10 text-brand-primary rounded-xl font-bold w-full">
                    <LayoutDashboard className="w-5 h-5" />
                    ড্যাশবোর্ড
                  </button>
                  <button onClick={() => { setIsOpen(false); onLogout(); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold w-full">
                    <LogOut className="w-5 h-5" />
                    লগআউট
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setIsOpen(false); onLoginClick(); }} className="flex items-center justify-center gap-2 w-full py-4 text-brand-primary font-bold border-2 border-brand-primary/10 rounded-2xl hover:bg-brand-primary/5 group">
                    <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    লগইন করুন
                  </button>
                  <button onClick={() => { setIsOpen(false); onRegisterClick(); }} className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-xl shadow-brand-primary/20">
                    রেজিস্ট্রেশন
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default LandingNavbar;
