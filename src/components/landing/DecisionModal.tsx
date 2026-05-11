import { motion } from "motion/react";
import React, { useState } from "react";
import { ChevronLeft, X as CloseIcon, Search, Plus, ArrowRight } from "lucide-react";
import { 
  auth, 
  db, 
  doc, 
  setDoc, 
  updateDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp 
} from '../../firebase';

const DecisionModal = ({ onClose, userProfile }: { onClose: () => void, userProfile?: any }) => {
  const [view, setView] = useState<'decision' | 'join' | 'create'>('decision');
  const [messId, setMessId] = useState('');
  const [messPassword, setMessPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newMessName, setNewMessName] = useState('');
  const [newMessPassword, setNewMessPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const q = query(collection(db, 'messes'), where('messId', '==', messId));
      const messSnap = await getDocs(q);
      
      if (!messSnap.empty) {
        const messDoc = messSnap.docs[0];
        const messData = messDoc.data();
        if (messData.password === messPassword) {
          const user = auth.currentUser;
          if (user) {
            const isManager = messData.creatorUid === user.uid;
            
            if (isManager) {
              // Direct join for creator
              await updateDoc(doc(db, 'users', user.uid), {
                messId: messDoc.id,
                role: 'Manager',
                joinedAt: serverTimestamp()
              });
              window.location.href = '/dashboard.html';
            } else {
              // 1. Create a request document
              const requestRef = doc(db, 'messes', messDoc.id, 'requests', user.uid);
              await setDoc(requestRef, {
                uid: user.uid,
                name: userProfile?.name || user.displayName || 'Unknown',
                email: user.email,
                phone: userProfile?.phone || '',
                avatarSeed: userProfile?.avatarSeed || user.email,
                requestDate: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
              });

              // 2. Mark user with pendingMessId
              await updateDoc(doc(db, 'users', user.uid), {
                pendingMessId: messDoc.id
              });

              alert("আপনার রিকোয়েস্ট পাঠানো হয়েছে। মেসে যুক্ত হতে ম্যানেজারের সাথে যোগাযোগ করুন।");
              // Wait for auth to trigger reload, or manually close/refresh
              window.location.reload();
            }
          }
        } else {
          alert("ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিন।");
        }
      } else {
        alert("এই মেস আইডি-টি পাওয়া যায়নি।");
      }
    } catch (error) {
      console.error("Join Error:", error);
      alert("একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };


  const generateMessId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleCreateMessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessPassword !== confirmPassword) {
      alert("পাসওয়ার্ড মেলেনি!");
      return;
    }
    
    setIsProcessing(true);
    try {
      const generatedId = generateMessId();
      const user = auth.currentUser;
      
      if (!user) throw new Error("No authenticated user");

      // 1. Create Mess Document
      await setDoc(doc(db, 'messes', generatedId), {
        messId: generatedId,
        name: newMessName,
        password: newMessPassword,
        creatorUid: user.uid,
        managerEmail: user.email,
        createdAt: serverTimestamp(),
        membersCount: 1
      });

      // 2. Update User Profile
      await updateDoc(doc(db, 'users', user.uid), {
        messId: generatedId,
        role: 'Manager',
        joinedAt: serverTimestamp()
      });

      window.location.href = '/dashboard.html';
    } catch (error) {
      console.error("Create Mess Error:", error);
      alert("একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
      className="relative w-full max-w-3xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_80px_rgba(81,68,177,0.3)] border border-white overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
    >
      {(view === 'join' || view === 'create') && (
        <button onClick={() => setView('decision')} className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20">
        <CloseIcon className="w-5 h-5" />
      </button>

      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {userProfile?.pendingMessId ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center py-8"
        >
          <div className="w-24 h-24 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner border-2 border-amber-100">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#1e293b] mb-4">অপেক্ষায় আছে...</h2>
          <p className="text-[#64748b] font-medium text-lg max-w-md mx-auto mb-8 leading-relaxed">
            আপনার জয়েনিং রিকোয়েস্ট ম্যানেজারের কাছে পাঠানো হয়েছে। ম্যানেজার অনুমোদন করলে আপনি মেসে প্রবেশ করতে পারবেন।
          </p>
        </motion.div>
      ) : view === 'decision' ? (
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
              onClick={() => setView('create')}
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
      ) : view === 'join' ? (
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
              <input type="text" value={messId} onChange={e => setMessId(e.target.value)} disabled={isProcessing} placeholder="উদাঃ i12345" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড</label>
              <input type="password" value={messPassword} onChange={e => setMessPassword(e.target.value)} disabled={isProcessing} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>

            <button type="submit" disabled={isProcessing} className="w-full py-4 mt-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70">
              {isProcessing ? 'অপেক্ষা করুন...' : 'জয়েন করুন'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            বিদ্যমান কোন মেস নেই?
            <button onClick={() => setView('create')} className="ml-2 text-emerald-500 font-bold hover:underline">
              নতুন মেস তৈরি করুন
            </button>
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 max-w-md mx-auto"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] mb-2 text-center">নতুন মেস তৈরি করুন</h2>
            <p className="text-[#64748b] font-medium text-center">ম্যানেজার হিসেবে আপনার মেস পরিচালনা শুরু করুন</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleCreateMessSubmit}>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">মেসের নাম</label>
              <input type="text" value={newMessName} onChange={e => setNewMessName(e.target.value)} disabled={isProcessing} placeholder="উদাঃ ইকো মেস" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">জয়েনিং পাসওয়ার্ড</label>
              <input type="password" value={newMessPassword} onChange={e => setNewMessPassword(e.target.value)} disabled={isProcessing} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isProcessing} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400" required />
            </div>

            <button type="submit" disabled={isProcessing} className="w-full py-4 mt-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70">
              {isProcessing ? 'তৈরি হচ্ছে...' : 'মেস তৈরি করুন'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            ইতিমধ্যে মেস আছে?
            <button onClick={() => setView('join')} className="ml-2 text-brand-primary font-bold hover:underline">
              মেসে জয়েন করুন
            </button>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DecisionModal;
