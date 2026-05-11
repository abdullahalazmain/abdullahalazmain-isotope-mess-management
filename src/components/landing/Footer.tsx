import React from "react";
import { LayoutDashboard, Mail, Phone, MapPin, Zap } from "lucide-react";

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
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary transition-colors"><Phone className="w-4 h-4" /></div>
              <span className="mt-1 group-hover:text-white transition-colors text-slate-400">+৮৮০ ১৭১১-০০০০০০</span>
            </li>
            <li className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary transition-colors"><MapPin className="w-4 h-4" /></div>
              <span className="mt-1 group-hover:text-white transition-colors text-slate-400">ঢাকা, বাংলাদেশ</span>
            </li>
          </ul>
        </div>

        <div id="footer-newsletter">
          <h4 className="text-lg font-black mb-6">নিউজলেটার</h4>
          <p className="text-slate-400 text-sm mb-4">সর্বশেষ আপডেট পেতে সাবস্ক্রাইব করুন।</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="ইমেইল এড্রেস"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary w-full"
            />
            <button className="bg-brand-primary hover:bg-brand-secondary px-4 py-2 rounded-xl transition-all">
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs md:text-sm font-bold">
        <p>© ২০২৬ আইসোটোপ। সর্বস্বত্ব সংরক্ষিত।</p>
        <p>Developed with ❤️ by Isotope Team</p>
      </div>
    </div>
  </footer>
);

export default Footer;
