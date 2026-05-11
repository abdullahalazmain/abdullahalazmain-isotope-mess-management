import { motion, useScroll, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  doc, 
  getDoc,
  onSnapshot
} from '../firebase';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

// Components
import LandingNavbar from "../components/landing/LandingNavbar";
import Hero from "../components/landing/Hero";
import StatsBar from "../components/landing/StatsBar";
import Features from "../components/landing/Features";
import Timeline from "../components/landing/Timeline";
import ComparisonTable from "../components/landing/ComparisonTable";
import Testimonials from "../components/landing/Testimonials";
import Footer from "../components/landing/Footer";
import AuthModal, { ModalOverlay } from "../components/landing/AuthModal";
import DecisionModal from "../components/landing/DecisionModal";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeModal, setActiveModal] = useState<'login' | 'register' | 'decision' | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Listen to fresh profile from Firestore
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserProfile(data);
            localStorage.setItem('userProfile', JSON.stringify(data));
            localStorage.setItem('userRole', data.role);
            
            // If the user is on the DecisionModal and gets accepted
            if (data.messId && activeModal === 'decision') {
              window.location.href = '/dashboard.html';
            }
          }
        });
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userRole');
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [activeModal]);

  const handleLoginSuccess = (role: 'Manager' | 'Member', profile?: any) => {
    if (profile) {
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      localStorage.setItem('userRole', role);
    }
    setIsLoggedIn(true);
    setActiveModal('decision');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setActiveModal(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-primary selection:text-white bg-[#f8f9ff] text-[#2D3142]">
      <LandingNavbar
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
        onLoginClick={() => setActiveModal('login')}
        onRegisterClick={() => setActiveModal('register')}
        onDashboardClick={() => setActiveModal('decision')}
        onLogout={handleLogout}
      />

      <AnimatePresence mode="wait">
        {activeModal && (
          <ModalOverlay onClose={() => setActiveModal(null)}>
            {activeModal === 'decision' ? (
              <DecisionModal userProfile={userProfile} onClose={() => setActiveModal(null)} />
            ) : (
              <AuthModal
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
