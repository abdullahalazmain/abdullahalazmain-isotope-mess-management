import { motion, useScroll, useTransform } from "motion/react";
import React, { useRef } from "react";
import { Users, LayoutDashboard, Zap } from "lucide-react";

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

export default Timeline;
