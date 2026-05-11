import { motion, useScroll, useTransform } from "motion/react";
import React from "react";

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
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#5144b1" strokeWidth="1" />
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

export default Hero;
