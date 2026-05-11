import { motion } from "motion/react";
import React from "react";
import { Users, Zap } from "lucide-react";
import NumberTicker from "./NumberTicker";

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

export default StatsBar;
