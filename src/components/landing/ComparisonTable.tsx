import { motion } from "motion/react";
import React from "react";
import { Check, X } from "lucide-react";

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

export default ComparisonTable;
