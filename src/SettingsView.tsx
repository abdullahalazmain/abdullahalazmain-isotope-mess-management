import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Image as ImageIcon, Lock, Copy, Download, 
  Trash2, ShieldAlert, LogOut, Check, ArrowRight
} from 'lucide-react';

export default function SettingsView({ isManager }: { isManager: boolean }) {
  const [messName, setMessName] = useState('Isotope Mess');
  const [joinPassword, setJoinPassword] = useState('12345');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(joinPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-300">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">সেটিংস</h1>
          <p className="text-sm font-semibold text-slate-500">মেস প্রোফাইল ও সিকিউরিটি পরিচালনা</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* MESS PROFILE SECTION */}
        <section className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-100 rounded-[2rem] p-6 md:p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#6366f1]" /> মেস প্রোফাইল</h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#1e1b4b] to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-indigo-200">
                {messName.substring(0, 2).toUpperCase()}
              </div>
              {isManager && (
                <button className="text-xs font-bold text-[#6366f1] bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">ছবি পরিবর্তন করুন</button>
              )}
            </div>

            <div className="flex-1 w-full space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">মেসের নাম</label>
                <input 
                  type="text" value={messName} onChange={e => setMessName(e.target.value)} disabled={!isManager}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-70" 
                />
              </div>
              
              {isManager && (
                <button className="px-6 py-3 bg-[#6366f1] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-colors">প্রোফাইল সেভ করুন</button>
              )}
            </div>
          </div>
        </section>

        {/* SECURITY & INVITE SECTION */}
        <section className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-100 rounded-[2rem] p-6 md:p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-emerald-500" /> সিকিউরিটি ও ইনভাইট</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">মেস আইডি (Mess ID)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" value="i12345" disabled
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none disabled:opacity-70" 
                  />
                  <button onClick={() => { navigator.clipboard.writeText('i12345'); }} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">জয়েনিং পাসওয়ার্ড</label>
                <p className="text-[10px] font-semibold text-slate-500 mb-2">নতুন মেম্বার যুক্ত হওয়ার সময় এই পাসওয়ার্ড প্রয়োজন হবে।</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} disabled={!isManager}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-70" 
                  />
                  <button onClick={handleCopyPassword} className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
                    {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {isManager && <button className="text-[10px] font-bold text-emerald-600 mt-2">নতুন পাসওয়ার্ড জেনারেট করুন</button>}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center">
               <h3 className="text-sm font-bold text-emerald-800 mb-2">শেয়ারেবল ইনভাইট লিংক</h3>
               <p className="text-xs font-semibold text-emerald-600/80 mb-4">এই লিংকের মাধ্যমে মেম্বাররা সরাসরি জয়েন করতে পারবে।</p>
               <button className="w-full py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">লিংক কপি করুন</button>
            </div>
          </div>
        </section>

        {/* DATA & MANAGER CONTROLS SECTION */}
        {isManager && (
          <section className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-100 rounded-[2rem] p-6 md:p-8">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500" /> ডাটা ও এডমিন কন্ট্রোল</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex flex-col items-start p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-100 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><Download className="w-5 h-5" /></div>
                <h3 className="font-bold text-slate-800 mb-1">সকল ডাটা এক্সপোর্ট করুন (CSV)</h3>
                <p className="text-xs font-semibold text-slate-500 text-left">মেসের সকল বাজার, মিল এবং বিলের হিসাব এক্সেল ফাইলে ডাউনলোড করুন।</p>
              </button>

              <button className="flex flex-col items-start p-5 bg-orange-50 rounded-2xl border border-orange-100 hover:border-orange-300 hover:bg-orange-100 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center mb-3"><ArrowRight className="w-5 h-5" /></div>
                <h3 className="font-bold text-orange-900 mb-1">নতুন মাস শুরু করুন (Clone Mess)</h3>
                <p className="text-xs font-semibold text-orange-700/70 text-left">বর্তমান মেম্বারদের নিয়ে নতুন মাসের হিসাব শুরু করুন। আগের ডাটা সেভ থাকবে।</p>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="flex flex-col md:flex-row justify-between items-center bg-rose-50 p-5 rounded-2xl border border-rose-100 gap-4">
                 <div>
                   <h3 className="font-bold text-rose-800 mb-1">মেস ডিলিট করুন</h3>
                   <p className="text-xs font-semibold text-rose-600/80">এই অ্যাকশনটি পুনরায় ফেরানো সম্ভব নয়। সকল ডাটা চিরতরে মুছে যাবে।</p>
                 </div>
                 <button className="w-full md:w-auto px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shrink-0">
                   <Trash2 className="w-4 h-4" /> ডিলিট মেস
                 </button>
               </div>
            </div>
          </section>
        )}

        {/* LOGOUT */}
        <section className="flex justify-center mb-12">
           <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
             <LogOut className="w-5 h-5" /> লগআউট করুন
           </button>
        </section>

      </div>
    </div>
  );
}
