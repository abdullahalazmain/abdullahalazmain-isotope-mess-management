import { motion } from "motion/react";
import React, { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  db, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from '../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification, 
  signOut 
} from 'firebase/auth';

export const ModalOverlay = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
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

const AuthModal = ({
  type,
  onSwitch,
  onLoginSuccess
}: {
  type: 'login' | 'register',
  onSwitch: () => void,
  onLoginSuccess: (role: 'Manager' | 'Member', profile?: any) => void
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getBengaliError = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use': return 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।';
      case 'auth/invalid-credential':
      case 'auth/wrong-password': return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
      case 'auth/user-not-found': return 'এই ইমেইলের কোন একাউন্ট পাওয়া যায়নি।';
      case 'auth/weak-password': return 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।';
      case 'auth/too-many-requests': return 'অনেক বেশি চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      default: return 'একটি ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।';
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      setIsProcessing(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      alert('আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে। দয়া করে চেক করুন!');
      await signOut(auth);
      onSwitch(); // Switch back to login
    } catch (error: any) {
      console.error(error);
      alert(getBengaliError(error.code));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginSubmit = async () => {
    try {
      setIsProcessing(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        alert('দয়া করে আগে ইমেইল ভেরিফাই করুন। আপনার ইনবক্স চেক করুন।');
        await signOut(auth);
        return;
      }

      const profile = {
        name: user.displayName || email.split('@')[0],
        email: user.email || '',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
      };

      if (email === 'abdullahalazmain1@gmail.com') {
        onLoginSuccess('Manager', profile);
      } else {
        onLoginSuccess('Member', profile);
      }
    } catch (error: any) {
      console.error(error);
      alert(getBengaliError(error.code));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'register') {
      handleRegisterSubmit();
    } else {
      handleLoginSubmit();
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsProcessing(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = {
        uid: user.uid,
        name: user.displayName || 'গুগল ইউজার',
        email: user.email || '',
        photoURL: user.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=GoogleUser',
        lastLogin: serverTimestamp()
      };
      
      // Sync with Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...profile,
          role: user.email === 'abdullahalazmain1@gmail.com' ? 'Manager' : 'Member',
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, profile, { merge: true });
      }

      const role = (userSnap.exists() ? userSnap.data().role : (user.email === 'abdullahalazmain1@gmail.com' ? 'Manager' : 'Member')) as 'Manager' | 'Member';
      onLoginSuccess(role, { ...profile, role });
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      alert(`Google Login Failed: ${error.message}\n\nPlease check the console for details.`);
    } finally {
      setIsProcessing(false);
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
              <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isProcessing} placeholder="উদাঃ আব্দুর রহমান" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400 disabled:opacity-50" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">ইমেইল বা ফোন নম্বর</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isProcessing} placeholder="user@example.com" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400 disabled:opacity-50" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-1.5 ml-1">পাসওয়ার্ড</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isProcessing} placeholder="••••••••" className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium placeholder:text-slate-400 disabled:opacity-50" required />
          </div>

          <button type="submit" disabled={isProcessing} className="w-full py-4 mt-2 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100 flex justify-center items-center">
            {isProcessing ? 'অপেক্ষা করুন...' : (type === 'login' ? 'লগইন করুন' : 'একাউন্ট তৈরি করুন')}
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
          disabled={isProcessing}
          className="w-full py-3.5 px-5 bg-white border-2 border-slate-100 text-[#1e293b] font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
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
          <button onClick={() => !isProcessing && onSwitch()} className="ml-2 text-brand-primary font-bold hover:underline" disabled={isProcessing}>
            {type === 'login' ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default AuthModal;
