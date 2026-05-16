"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StatItem {
  numericValue: number;
  suffix: string;
  label: string;
  sublabel: string;
}

const stats: StatItem[] = [
  { numericValue: 99, suffix: "%", label: "Customer Satisfaction", sublabel: "Rated by 10,000+ users" },
  { numericValue: 2, suffix: "M+", label: "Conversations Handled", sublabel: "Every single month" },
  { numericValue: 60, suffix: "%", label: "Cost Reduction", sublabel: "Average savings reported" },
  { numericValue: 24, suffix: "/7", label: "Always Available", sublabel: "Never miss a customer" },
];

function AnimatedNumber({ value, isVisible }: { value: number; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart
      const easedProgress = 1 - Math.pow(1 - progress, 4);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, value]);

  return <span>{displayValue}</span>;
}

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="w-full bg-[#0d0d1a] border-y border-[#1a1a2e]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`px-8 py-16 text-center lg:text-left flex flex-col items-center lg:items-start justify-center border-[#1a1a2e] ${
              idx !== stats.length - 1 ? "lg:border-r border-b lg:border-b-0" : "border-b md:border-b-0"
            }`}
          >
            <div className="font-mono text-[64px] font-bold text-[#F0EEE9] leading-none mb-4 tabular-nums">
              <AnimatedNumber value={stat.numericValue} isVisible={isVisible} />
              {stat.suffix}
            </div>
            <div className="font-sans text-[13px] font-bold text-[#F0EEE9] uppercase tracking-widest mb-1">
              {stat.label}
            </div>
            <div className="font-sans text-[12px] text-[#6B6A72]">
              {stat.sublabel}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
