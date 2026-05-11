import React, { useState, useRef, useEffect } from "react";
import { toBengaliDigits } from "../../utils";

/**
 * Animated number ticker component.
 */
const NumberTicker = ({ value, suffix = "", useBengali = true }: { value: string; suffix?: string; useBengali?: boolean }) => {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/,/g, "").match(/\d+/)?.[0] || "0");
  const nodeRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.1 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      {useBengali ? toBengaliDigits(count) : count.toLocaleString()}{suffix}
    </span>
  );
};

export default NumberTicker;
