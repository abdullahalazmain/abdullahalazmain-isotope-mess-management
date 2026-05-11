import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const testimonials = [
    {
      name: "আব্দুর রহমান",
      role: "মেস মেম্বার",
      text: "আগে খাতা-কলমে হিসাব করতে অনেক সময় লাগত এবং ভুল হত। এখন খুব সহজেই করতে পারি।"
    },
    {
      name: "কামরুল হাসান",
      role: "মেস ম্যানেজার",
      text: "বাজারের হিসাব এখন একদম ক্লিয়ার। সব কিছু অ্যাপেই দেখা যায়, তাই বিশ্বাসযোগ্যতা বাড়ে।"
    },
    {
      name: "তানভীর আহমেদ",
      role: "মেস মেম্বার",
      text: "রিপোর্ট জেনারেট করা নিয়ে আর কোন ঝামেলা নেই। মাস শেষে সব অটোমেটিক হয়ে যায়।"
    },
    {
      name: "মাহমুদুল হাসান",
      role: "মেস ম্যানেজার",
      text: "আমাদের মেস লাইফ এখন অনেক গোছানো। আইসোটোপ সত্যি বিস্ময়কর!"
    }
  ];

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = scrollContainer.scrollLeft;
    const step = 0.8;
    const interval = setInterval(() => {
      scrollAmount += step;
      if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollAmount = 0;
      }
      scrollContainer.scrollLeft = scrollAmount;
    }, 20);

    return () => clearInterval(interval);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      setIsPaused(true);
      const amount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(() => setIsPaused(false), 3000);
    }
  };

  return (
    <section className="py-24 px-6 overflow-hidden bg-slate-50/50 relative" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-black text-[#1e293b] mb-4">ইউজারদের মতামত</h2>
          <div className="w-20 h-1.5 bg-brand-primary mx-auto rounded-full" />
        </div>

        <div
          className="relative group/nav"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all opacity-0 group-hover/nav:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all opacity-0 group-hover/nav:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto pb-10 gap-8 snap-x no-scrollbar px-2"
            id="testimonials-scroll"
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="min-w-[300px] md:min-w-[420px] snap-center p-8 md:p-10 glass rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 border-none relative group"
                id={`testimonial-${i}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px]">
                    <div className="w-full h-full bg-white rounded-[calc(1rem)] flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${t.name}${i}`} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#1e293b]">{t.name}</h4>
                    <p className="text-sm font-semibold text-brand-primary">{t.role}</p>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed italic font-medium">"{t.text}"</p>
                <div className="mt-4 text-slate-400 font-bold text-xs">- {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
