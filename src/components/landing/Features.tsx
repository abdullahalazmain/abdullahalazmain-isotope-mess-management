import { motion } from "motion/react";
import React from "react";
import { BarChart3, Calculator, Zap, FileText } from "lucide-react";

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

export default Features;
