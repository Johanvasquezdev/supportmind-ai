"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  /** The number to animate to */
  numericValue: number;
  /** Suffix like %, +, M+ */
  suffix: string;
  /** Optional prefix like $ */
  prefix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  { numericValue: 99, suffix: "%", prefix: "", label: "Customer Satisfaction", description: "Rated by 10,000+ users" },
  { numericValue: 2, suffix: "M+", prefix: "", label: "Conversations Handled", description: "Every single month" },
  { numericValue: 60, suffix: "%", prefix: "", label: "Cost Reduction", description: "Average savings reported" },
  { numericValue: 24, suffix: "/7", prefix: "", label: "Always Available", description: "Never miss a customer" },
];

/** Easing function for smooth deceleration */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function AnimatedNumber({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      setDisplayValue(Math.round(easedProgress * stat.numericValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, stat.numericValue]);

  return (
    <p className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-6xl font-bold text-transparent md:text-7xl tabular-nums">
      {stat.prefix}
      {displayValue}
      {stat.suffix}
    </p>
  );
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
    <section ref={sectionRef} className="border-y border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <AnimatedNumber stat={stat} isVisible={isVisible} />
            <h3 className="mt-6 text-2xl font-semibold text-foreground">{stat.label}</h3>
            <p className="mt-3 text-muted-foreground">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
