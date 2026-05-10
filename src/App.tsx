/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import { 
  Users, 
  BarChart3, 
  Calculator, 
  Zap, 
  FileText, 
  Check, 
  X, 
  Mail, 
  Phone, 
  MapPin,
  LayoutDashboard,
  Menu,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Circle,
  LogIn,
  Bell,
  Plus,
  Search,
  ArrowRight,
  LogOut
} from "lucide-react";
import { auth, googleProvider, signInWithPopup } from './firebase';


/**
 * Navbar component with Glassmorphic design and mobile responsiveness.
 */
const Navbar = ({ isLoggedIn, onLoginClick, onRegisterClick, onDashboardClick, onLogout }: { isLoggedIn: boolean, onLoginClick: () => void, onRegisterClick: () => void, onDashboardClick: () => void, onLogout: () => void }) => {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4 md:py-6"
      }`}
      id="navbar-container"
    >
      <div 
        className={`max-w-7xl mx-auto px-6 h-16 flex items-center justify-between rounded-full transition-all duration-500 border border-transparent ${
          scrolled ? "glass mx-4 shadow-[0_20px_50px_-15px_rgba(81,68,177,0.15)] border-white/40" : "bg-transparent"
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
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser" alt="Profile" className="w-full h-full object-cover bg-brand-primary/10 rounded-full" />
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
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser" alt="Profile" className="w-12 h-12 rounded-full border-2 border-brand-primary/20 bg-brand-primary/10" />
                      <div>
                        <h4 className="text-[#1e293b] font-bold">গুগল ইউজার</h4>
                        <p className="text-xs text-slate-500">user@example.com</p>
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
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser" alt="Profile" className="w-12 h-12 rounded-full border-2 border-brand-primary/20 bg-brand-primary/10" />
                    <div>
                      <h4 className="text-[#1e293b] font-bold">গুগল ইউজার</h4>
                      <p className="text-xs text-slate-500">user@example.com</p>
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

const Hero = ({ onStartClick }: { onStartClick: () => void }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const rotate = useTransform(scrollY, [0, 500], [0, 45]);

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-40" id="hero">
      {/* High-Fidelity 3D/Geometric Background */}
      <div className="absolute inset-0 -z-10">
        {/* Real-world background image with professional overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2400')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-[#f8f9ff]/100 backdrop-blur-[1px]" />
        
        {/* Shadow/Vignette Effect for Background Depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.05)] pointer-events-none" />
        
        <motion.div 
          style={{ y: y1, rotate }}
          className="absolute top-[15%] left-[5%] w-96 h-96 bg-brand-primary/10 rounded-[4rem] blur-3xl opacity-40" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] opacity-60" 
        />
        
        {/* Animated Patterns */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #5144b1 1.5px, transparent 0)`, backgroundSize: '48px 48px' }} />
        
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#5144b1" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="max-w-5xl mx-auto text-center px-6 relative z-10" id="hero-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass mb-8 border-brand-primary/20 shadow-[0_10px_30px_-10px_rgba(81,68,177,0.2)]"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[11px] md:text-sm font-black text-brand-primary uppercase tracking-[0.2em]">২০২৬ এর সেরা মেস ম্যানেজমেন্ট সিস্টেম</span>
        </motion.div>

        <motion.h1 
          className="text-3xl md:text-6xl lg:text-7xl font-black text-[#1e293b] leading-[1.2] mb-8 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          আইসোটোপ-এর সাথে আপনার <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-blue-600">মেস লাইফ করুন আরও সহজ।</span>
        </motion.h1>
        
        <motion.p 
          className="text-sm md:text-lg text-[#64748b] mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          মিল, বাজার এবং মেস খরচের নিখুঁত হিসাব এখন আপনার হাতের মুঠোয়।
        </motion.p>
        
        <motion.button 
          onClick={onStartClick}
          className="group relative px-12 py-5 bg-brand-primary text-white text-base md:text-xl font-black rounded-full shadow-[0_20px_50px_rgba(81,68,177,0.3)] hover:shadow-[0_25px_60px_rgba(81,68,177,0.4)] transition-all overflow-hidden mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="relative z-10">শুরু করুন</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </motion.button>
      </div>
    </section>
  );
};

/**
 * Helper to convert English digits to Bengali digits.
 */
const toBengaliDigits = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .split("")
    .map((digit) => (/\d/.test(digit) ? bengaliDigits[parseInt(digit)] : digit))
    .join("");
};

/**
 * Animated number ticker component.
 */
const NumberTicker = ({ value, suffix = "", useBengali = true }: { value: string; suffix?: string; useBengali?: boolean }) => {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/,/g, "").match(/\d+/)?.[0] || "0");
  const nodeRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.1 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {useBengali ? toBengaliDigits(count) : count.toLocaleString()}{suffix}
    </span>
  );
};

const StatsBar = () => (
  <div className="max-w-4xl mx-auto -mt-16 md:-mt-24 mb-20 relative z-20 px-6" id="stats-section">
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="glass px-6 md:px-12 py-6 md:py-8 rounded-3xl md:rounded-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-4 shadow-[0_40px_80px_-15px_rgba(81,68,177,0.15)] bg-white/80 border border-white/60"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.05, y: -5 }} 
        className="flex items-center gap-4 cursor-default group"
      >
        <div className="p-3 bg-brand-primary/10 rounded-full group-hover:bg-brand-primary/20 transition-colors">
          <Users className="w-6 h-6 text-brand-primary" />
        </div>
        <span className="text-lg md:text-xl font-black text-[#1e293b] min-w-[100px]"><NumberTicker value="500" />+ মেস</span>
      </motion.div>
      <div className="hidden md:block w-px h-10 bg-slate-200" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.05, y: -5 }} 
        className="flex items-center gap-4 cursor-default group"
      >
        <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
          <Users className="w-6 h-6 text-blue-500" />
        </div>
        <span className="text-lg md:text-xl font-black text-[#1e293b] min-w-[120px]"><NumberTicker value="10,000" />+ ইউজার</span>
      </motion.div>
      <div className="hidden md:block w-px h-10 bg-slate-200" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.05, y: -5 }} 
        className="flex items-center gap-4 cursor-default group"
      >
        <div className="p-3 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
          <Zap className="w-6 h-6 text-emerald-500" />
        </div>
        <span className="text-lg md:text-xl font-black text-[#1e293b] min-w-[100px]"><NumberTicker value="0" />% ভুল হিসাব</span>
      </motion.div>
    </motion.div>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: "বাজার মনিটর",
      desc: "প্রতিদিনের বাজারের নিখুঁত হিসাব রাখুন এবং খরচ ট্র্যাক করুন।"
    },
    {
      icon: <Calculator className="w-8 h-8 text-purple-500" />,
      title: "মিলের হিসাব",
      desc: "কে কয়টি মিল খেল তা দ্রুত ট্র্যাক করুন এবং সহজে আপডেট করুন।"
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-500" />,
      title: "সহজে আপডেট",
      desc: "বাজারের জন্য আলাদা ফর্ম ফিলাপ ও আপডেট করার বিশেষ সুবিধা।"
    },
    {
      icon: <FileText className="w-8 h-8 text-emerald-500" />,
      title: "অটোমেটেড রিপোর্ট",
      desc: "মাস শেষে অটোমেটিক মিল রেট এবং রিপোর্ট জেনারেটেশন ঝামেলাহীন।"
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden" id="features">
      <div className="text-center mb-20">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="text-3xl md:text-5xl font-black text-[#1e293b] mb-4"
        >
          আমাদের বৈশিষ্ট্যসমূহ
        </motion.h2>
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: 96 }}
          className="h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary mx-auto rounded-full" 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, i) => (
          <motion.div 
            key={i}
            className="p-10 glass rounded-[2.5rem] hover:shadow-[0_40px_100px_-15px_rgba(81,68,177,0.15)] transition-all border-none group relative overflow-hidden bg-white/60 hover:bg-white"
            whileHover={{ y: -20, scale: 1.02 }}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50, y: 50 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ 
              delay: i * 0.1, 
              duration: 0.8, 
              type: "spring",
              damping: 15
            }}
            id={`feature-card-${i}`}
          >
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 12 }}
              className="mb-8 p-6 bg-white rounded-[1.5rem] shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] group-hover:shadow-brand-primary/20 transition-all duration-500 inline-block relative z-10"
            >
              <div className="relative z-10">{f.icon}</div>
              <div className="absolute inset-0 bg-brand-primary/5 rounded-[1.5rem] scale-0 group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100" />
            </motion.div>
            
            <h3 className="text-xl font-black text-[#1e293b] mb-4 group-hover:text-brand-primary transition-colors relative z-10">{f.title}</h3>
            <p className="text-sm text-[#64748b] leading-relaxed font-semibold transition-colors group-hover:text-[#1e293b] relative z-10">{f.desc}</p>
            
            {/* Professional Semi-circle Flash Hover Effect - More Refined */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 flex items-center justify-center shadow-[0_0_40px_rgba(81,68,177,0.4)]">
              <Zap className="w-7 h-7 text-white ml-[-12px] mt-[12px] animate-pulse" />
            </div>
            
            {/* Hover Shine Effect */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Timeline = () => {
  const steps = [
    { number: 1, title: "ধাপ ১: একাউন্ট তৈরি করুন", side: "left", icon: <Users className="w-6 h-6" /> },
    { number: 2, title: "ধাপ ২: মেস আইডি জেনারেট বা জয়েন করুন", side: "right", icon: <LayoutDashboard className="w-6 h-6" /> },
    { number: 3, title: "ধাপ ৩: মেস আইডি ও পাসওয়ার্ড নিয়ে জয়েন করুন", side: "left", icon: <Zap className="w-6 h-6" /> }
  ];

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={containerRef} className="py-20 px-6 bg-gradient-to-b from-[#f8f9ff] to-white relative overflow-hidden" id="how-to-start">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-[#1e293b] mb-4">কিভাবে শুরু করবেন?</h2>
          <div className="w-20 h-1.5 bg-brand-primary mx-auto rounded-full shadow-lg shadow-brand-primary/20" />
        </div>
        
        <div className="relative pt-4 pb-12" id="timeline">
          {/* Vertical line precisely middle */}
          <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 md:w-3 bg-brand-primary/5 rounded-full" />
          <motion.div 
            style={{ scaleY: pathLength }}
            className="absolute left-[20px] md:left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 md:w-3 bg-gradient-to-b from-brand-primary via-brand-secondary to-blue-500 rounded-full origin-top shadow-[0_0_15px_rgba(81,68,177,0.3)]" 
          />
          
          <div className="space-y-16 md:space-y-32">
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                className={`flex items-center w-full relative ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`} 
                id={`step-${i}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Card side */}
                <div className={`w-full md:w-1/2 flex ${i % 2 === 0 ? 'md:justify-end' : 'md:justify-start'} justify-start pl-14 md:pl-0 md:px-12 lg:px-16`}>
                  <div className="glass p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] inline-block text-left border-none shadow-[0_20px_40px_rgba(0,0,0,0.06)] bg-white/80 hover:scale-105 transition-transform max-w-[calc(100%-40px)] md:max-w-md w-full">
                    <div className="flex items-center gap-4 md:gap-6">
                      <motion.div 
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className="flex-shrink-0 p-3 md:p-4 bg-brand-primary/10 rounded-xl md:rounded-2xl text-brand-primary shadow-inner"
                      >
                        {step.icon}
                      </motion.div>
                      <span className="text-sm md:text-xl font-black text-[#1e293b] leading-tight break-words">{step.title}</span>
                    </div>
                  </div>
                </div>
                
                {/* Center Circle */}
                <div className="absolute left-[20px] md:left-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                  <motion.div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full glass border-none flex items-center justify-center text-[#1e293b] text-xs md:text-lg font-black shadow-xl bg-white"
                    whileInView={{ 
                      backgroundColor: "#5144b1", 
                      color: "#ffffff",
                      scale: 1.1
                    }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    {step.number}
                  </motion.div>
                </div>
                
                {/* Empty side for layout on desktop */}
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ComparisonTable = () => {
  const data = [
    { feature: "মিল ও বাজার ট্র্যাকিং", regular: false, isotope: true },
    { feature: "বাজার-খরচ হিসাব", regular: false, isotope: true },
    { feature: "অটোমেটিক মিল রেট", regular: false, isotope: true },
    { feature: "নির্ভুল রিপোর্ট তৈরি", regular: false, isotope: true },
  ];

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto" id="why-isotope">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-[#1e293b] mb-4">কেন আইসোটোপ ব্যবহার করবেন?</h2>
        <div className="w-20 h-1.5 bg-brand-primary mx-auto rounded-full" />
      </div>
      
      <div className="overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(81,68,177,0.12)] bg-white border border-brand-primary/5" id="comparison-table">
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="min-w-full">
            <div className="grid grid-cols-[1.3fr_1fr_1fr] md:grid-cols-3 bg-gradient-to-r from-brand-primary via-brand-secondary to-blue-600 text-white font-black p-3 md:p-10">
              <div className="text-[10px] sm:text-[14px] md:text-2xl flex items-center justify-center text-center px-1">ফিচার</div>
              <div className="text-center text-[9px] sm:text-[12px] md:text-2xl opacity-90 flex items-center justify-center leading-tight px-1">খাতা-কলমের হিসাব</div>
              <div className="text-center text-[10px] sm:text-[14px] md:text-2xl flex items-center justify-center px-1">আইসোটোপ</div>
            </div>
            
            <div className="divide-y divide-brand-primary/5">
              {data.map((row, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="grid grid-cols-[1.3fr_1fr_1fr] md:grid-cols-3 p-3 md:p-10 items-center hover:bg-brand-primary/5 transition-colors group"
                >
                  <div className="font-black text-[#1e293b] text-[10px] sm:text-[13px] md:text-xl lg:text-2xl py-1 md:py-0 leading-tight flex items-center justify-center text-center px-1 md:px-2">{row.feature}</div>
                  <div className="flex justify-center items-center">
                    {row.regular ? <Check className="text-green-500 w-4 h-4 md:w-10 md:h-10" /> : <X className="text-red-400 w-4 h-4 md:w-10 md:h-10" />}
                  </div>
                  <div className="flex justify-center items-center">
                    <div className="w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-brand-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Check className="text-brand-primary w-4 h-4 md:w-10 md:h-10 stroke-[3]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const testimonials = [
    {
      name: "আব্দুর রহমান",
      role: "মেস মেম্বার",
      text: "আগে খাতা-কলমে হিসাব করতে অনেক সময় লাগত এবং ভুল হত। এখন খুব সহজেই করতে পারি।"
    },
    {
      name: "কামরুল হাসান",
      role: "মেস ম্যানেজার",
      text: "বাজারের হিসাব এখন একদম ক্লিয়ার। সব কিছু অ্যাপেই দেখা যায়, তাই বিশ্বাসযোগ্যতা বাড়ে।"
    },
    {
      name: "তানভীর আহমেদ",
      role: "মেস মেম্বার",
      text: "রিপোর্ট জেনারেট করা নিয়ে আর কোন ঝামেলা নেই। মাস শেষে সব অটোমেটিক হয়ে যায়।"
    },
    {
      name: "মাহমুদুল হাসান",
      role: "মেস ম্যানেজার",
      text: "আমাদের মেস লাইফ এখন অনেক গোছানো। আইসোটোপ সত্যি বিস্ময়কর!"
    }
  ];

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = scrollContainer.scrollLeft;
    const step = 0.8;
    const interval = setInterval(() => {
      scrollAmount += step;
      if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
    }, 20);

    return () => clearInterval(interval);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      setIsPaused(true);
      const amount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(() => setIsPaused(false), 3000);
    }
  };

  return (
    <section className="py-24 px-6 overflow-hidden bg-slate-50/50 relative" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-black text-[#1e293b] mb-4">ইউজারদের মতামত</h2>
          <div className="w-20 h-1.5 bg-brand-primary mx-auto rounded-full" />
        </div>
        
        <div 
          className="relative group/nav"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all opacity-0 group-hover/nav:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all opacity-0 group-hover/nav:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto pb-10 gap-8 snap-x no-scrollbar px-2" 
            id="testimonials-scroll"
          >
            {testimonials.map((t, i) => (
              <div 
                key={i} 
                className="min-w-[300px] md:min-w-[420px] snap-center p-8 md:p-10 glass rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 border-none relative group" 
                id={`testimonial-${i}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px]">
                    <div className="w-full h-full bg-white rounded-[calc(1rem)] flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}${i}`} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1e293b]">{t.name}</h4>
                    <p className="text-sm font-semibold text-brand-primary">{t.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed italic font-medium">"{t.text}"</p>
                <div className="mt-4 text-slate-400 font-bold text-xs">- {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#1e293b] text-white pt-16 pb-10 px-6 relative overflow-hidden" id="footer">
    <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[150px]" />
    
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div id="footer-logo">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-[1rem] border-2 border-white/20 flex items-center justify-center bg-white/5 shadow-2xl">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter">Isotope</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium">
            মেস লাইফকে সহজ করতে আমরা নিয়ে এসেছি আইসোটোপ। 
            মিলের হিসাব থেকে বাজার মনিটর—সবই এক জায়গায়।
          </p>
        </div>
        
        <div id="footer-links">
          <h4 className="text-lg font-black mb-6">প্রয়োজনীয় লিঙ্ক</h4>
          <ul className="space-y-3 text-slate-400 text-sm md:text-base">
            <li><a href="#" className="hover:text-white transition-all inline-block hover:translate-x-3 duration-300">হোম</a></li>
            <li><a href="#" className="hover:text-white transition-all inline-block hover:translate-x-3 duration-300">ডকুমেন্টেশন</a></li>
            <li><a href="#" className="hover:text-white transition-all inline-block hover:translate-x-3 duration-300">আমাদের সম্পর্কে</a></li>
            <li><a href="#" className="hover:text-white transition-all inline-block hover:translate-x-3 duration-300">প্রাইভেসি পলিসি</a></li>
          </ul>
        </div>
        
        <div id="footer-contact">
          <h4 className="text-lg font-black mb-6">যোগাযোগ</h4>
          <ul className="space-y-4 text-slate-400 text-sm md:text-base font-medium">
            <li className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary transition-colors"><Mail className="w-4 h-4" /></div>
              <span className="mt-1 group-hover:text-white transition-colors text-slate-400">abdullahalazmain@gmail.com</span>
            </li>
            <li className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-green-500 transition-colors"><Phone className="w-4 h-4" /></div>
              <span className="mt-1 group-hover:text-white transition-colors text-slate-400">01890098492</span>
            </li>
            <li className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-red-500 transition-colors"><MapPin className="w-4 h-4" /></div>
              <span className="mt-1 group-hover:text-white transition-colors text-slate-400">চট্টগ্রাম, বাংলাদেশ</span>
            </li>
          </ul>
        </div>
        
        <div id="footer-brand">
          <div className="glass-dark p-6 rounded-[2rem] text-center border-white/5 shadow-2xl relative overflow-hidden group/profile max-w-[280px] mx-auto lg:ml-auto">
            <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 mb-4 font-black">ENGINEERED BY</p>
            
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-brand-primary/30 p-1 mb-1 group-hover/profile:scale-110 transition-transform duration-500">
                <img 
                  src="/profile.jpg" 
                  alt="Al Azmain"
                  className="w-full h-full object-cover rounded-full shadow-2xl"
                />
              </div>
              <h3 className="text-3xl md:text-4xl font-signature text-brand-primary italic tracking-wide group-hover/profile:text-white transition-colors duration-300 whitespace-nowrap">Al Azmain</h3>
              <p className="text-[11px] md:text-xs font-bold text-slate-400 -mt-2">Full Stack Developer</p>
            </div>

            <div className="mt-6 flex justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-8 h-1.5 rounded-full bg-brand-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm md:text-base font-bold">
        <p>© ২০২৬ আইসোটোপ - সর্বস্বত্ব সংরক্ষিত।</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-all hover:scale-110">Facebook</a>
          <a href="#" className="hover:text-white transition-all hover:scale-110">LinkedIn</a>
          <a href="#" className="hover:text-white transition-all hover:scale-110">Twitter</a>
        </div>
      </div>
    </div>
  </footer>
);

// ----- MODALS & DASHBOARD TRANSITION -----

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
  >
    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-md" onClick={onClose} />
    {children}
  </motion.div>
);

const AuthModalContent = ({ 
  type, 
  onSwitch, 
  onLoginSuccess 
}: { 
  type: 'login' | 'register', 
  onSwitch: () => void,
  onLoginSuccess: (role: 'Manager' | 'Member') => void 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'abdullahalazmain1@gmail.com' && password === '@12Azmain') {
      onLoginSuccess('Manager');
    } else {
      // Any other user logs in as a regular member
      onLoginSuccess('Member');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      if (userEmail === 'abdullahalazmain1@gmail.com') {
        onLoginSuccess('Manager');
      } else {
        onLoginSuccess('Member');
      }
    } catch (error: any) {
      console.error(error);
      alert('Google Login Failed. Please try again.');
    }
  };
  return (
    <motion.div
      key={type}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
      className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_80px_rgba(81,68,177,0.3)] border border-white overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl border-2 border-brand-primary/20 flex items-center justify-center bg-white shadow-soft">
            <LayoutDashboard className="w-6 h-6 text-brand-primary" />
          </div>
          <span className="text-xl font-black text-[#1e293b] tracking-tight">Isotope</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] mb-2">
          {type === 'login' ? 'স্বাগতম ফিরে এসেছেন!' : 'নতুন একাউন্ট তৈরি করুন'}
        </h2>
        <p className="text-[#64748b] font-medium mb-8">
          {type === 'login' 
            ? 'আপনার মেস একাউন্টে লগইন করুন' 
            : 'আপনার মেস ম্যানেজমেন্ট যাত্রা শুরু করুন'}
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
          {type === 'register' && (
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">আপনার নাম</label>
              <input type="text" placeholder="উদাঃ আব্দুর রহমান" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">ইমেইল বা ফোন নম্বর</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
          </div>
          {type === 'register' && (
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
          )}

          <button type="submit" className="w-full py-4 mt-2 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
            {type === 'login' ? 'লগইন করুন' : 'একাউন্ট তৈরি করুন'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">অথবা</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3.5 px-5 bg-white border-2 border-slate-100 text-[#1e293b] font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google এর মাধ্যমে চালিয়ে যান
        </button>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          {type === 'login' ? 'একাউন্ট নেই?' : 'ইতিমধ্যে একাউন্ট আছে?'}
          <button onClick={onSwitch} className="ml-2 text-brand-primary font-bold hover:underline">
            {type === 'login' ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

const DecisionScreenModal = ({ onClose }: { onClose: () => void }) => {
  const [view, setView] = useState<'decision' | 'join'>('decision');
  const [messId, setMessId] = useState('');
  const [messPassword, setMessPassword] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messId === 'i12345' && messPassword === '12345') {
      window.location.href = '/dashboard.html';
    } else {
      alert("Test Validation Failed: Please use Mess ID 'i12345' and Password '12345' to test the website.");
    }
  };

  const handleCreateMess = () => {
    alert("নতুন মেস তৈরি করার ফিচারটি আপাতত বন্ধ আছে। টেস্ট করার জন্য 'মেসে জয়েন করুন' অপশনটি ব্যবহার করুন।");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
      className="relative w-full max-w-3xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_80px_rgba(81,68,177,0.3)] border border-white overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      {view === 'join' && (
        <button onClick={() => setView('decision')} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20">
        <CloseIcon className="w-5 h-5" />
      </button>

      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {view === 'decision' ? (
        <>
          <div className="relative z-10 text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-[#1e293b] mb-3">ড্যাশবোর্ড ডিরেক্টরি</h2>
            <p className="text-[#64748b] font-medium text-sm md:text-base max-w-md mx-auto">
              আপনি কি কোন বিদ্যমান মেসে জয়েন করতে চান নাকি নিজের জন্য নতুন একটি মেস তৈরি করতে চান?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('join')}
              className="group flex flex-col items-center text-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                <Search className="w-10 h-10 text-blue-500 group-hover:text-brand-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-[#1e293b] mb-2 group-hover:text-brand-primary transition-colors">মেসে জয়েন করুন</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">মেস আইডি এবং পাসওয়ার্ড দিয়ে আপনার মেসে যুক্ত হোন।</p>
              <div className="mt-auto flex items-center gap-2 text-brand-primary font-bold">
                এগিয়ে যান <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateMess}
              className="group flex flex-col items-center text-center p-8 bg-white border-2 border-slate-100 rounded-[2rem] hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 transition-colors">
                <Plus className="w-10 h-10 text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-[#1e293b] mb-2 group-hover:text-emerald-500 transition-colors">নতুন মেস তৈরি করুন</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">ম্যানেজার হিসেবে আপনার নিজের মেস তৈরি করুন এবং মেম্বার যুক্ত করুন।</p>
              <div className="mt-auto flex items-center gap-2 text-emerald-500 font-bold">
                এগিয়ে যান <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 max-w-md mx-auto"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-brand-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] mb-2 text-center">মেসে জয়েন করুন</h2>
            <p className="text-[#64748b] font-medium text-center">সঠিক মেস আইডি এবং পাসওয়ার্ড দিয়ে যুক্ত হোন</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleJoinSubmit}>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">মেস আইডি</label>
              <input type="text" value={messId} onChange={e => setMessId(e.target.value)} placeholder="উদাঃ i12345" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড</label>
              <input type="password" value={messPassword} onChange={e => setMessPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>

            <button type="submit" className="w-full py-4 mt-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              জয়েন করুন
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            বিদ্যমান কোন মেস নেই?
            <button onClick={onClose} className="ml-2 text-emerald-500 font-bold hover:underline">
              নতুন মেস তৈরি করুন
            </button>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'decision' | null>(null);

  const handleLoginSuccess = (role: 'Manager' | 'Member') => {
    localStorage.setItem('userRole', role);
    setIsLoggedIn(true);
    setActiveModal('decision');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-primary selection:text-white bg-[#f8f9ff] text-[#2D3142]">
      <Navbar 
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setActiveModal('login')}
        onRegisterClick={() => setActiveModal('register')}
        onDashboardClick={() => setActiveModal('decision')}
        onLogout={handleLogout}
      />
      
      <AnimatePresence mode="wait">
        {activeModal && (
          <ModalOverlay onClose={() => setActiveModal(null)}>
            {activeModal === 'decision' ? (
              <DecisionScreenModal onClose={() => setActiveModal(null)} />
            ) : (
              <AuthModalContent 
                type={activeModal} 
                onSwitch={() => setActiveModal(activeModal === 'login' ? 'register' : 'login')}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </ModalOverlay>
        )}
      </AnimatePresence>

      <main>
        <Hero onStartClick={() => {
          if (isLoggedIn) setActiveModal('decision');
          else setActiveModal('login');
        }} />
        <StatsBar />
        <Features />
        <Timeline />
        <ComparisonTable />
        <Testimonials />
      </main>
      <Footer />
      
      {/* Scroll to top decorative bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-brand-primary transform origin-left z-[60]"
        style={{ scaleX: useScroll().scrollYProgress }}
      />
    </div>
  );
}
