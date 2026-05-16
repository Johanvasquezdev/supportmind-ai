"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "SupportMind AI reduced our response time from 4 hours to under 2 minutes. Our customer satisfaction scores have never been higher.",
    name: "Sarah Chen",
    role: "Head of Customer Success at TechFlow Inc",
    initials: "SC",
  },
  {
    quote: "We cut our support costs by 60% while improving quality. The AI handles 80% of our tickets, and our team focuses on complex issues.",
    name: "Michael Rodriguez",
    role: "VP of Operations at CloudScale",
    initials: "MR",
  },
  {
    quote: "The onboarding process was incredibly smooth. Within a week, the AI was answering technical questions accurately from our knowledge base.",
    name: "Jessica Taylor",
    role: "Director of Support at DataStack",
    initials: "JT",
  },
  {
    quote: "Our international customers love getting instant answers in their native languages. SupportMind AI has been a game-changer for our global expansion.",
    name: "David Kim",
    role: "COO at GlobalReach",
    initials: "DK",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">What Teams Say</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            Join forward-thinking companies transforming their support experience.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, idx) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative bg-[#0d0d1a] border border-[#1a1a2e] rounded-[2px] p-10 overflow-hidden"
            >
              {/* Large Decorative Quote Mark */}
              <div className="absolute -top-4 -left-4 font-sans text-[96px] font-bold text-[#1a1a2e] select-none z-0">
                &quot;
              </div>

              <div className="relative z-10 space-y-8">
                <p className="font-sans text-[15px] leading-relaxed text-[#F0EEE9]">
                  {t.quote}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center border border-[#1a1a2e] bg-[#080810] text-[#7c3aed] font-mono text-[13px]">
                    {t.initials}
                  </div>
                  <div>
                    <h3 className="font-mono text-[12px] font-bold text-[#F0EEE9] uppercase tracking-wider">
                      {t.name}
                    </h3>
                    <p className="font-sans text-[13px] text-[#6B6A72]">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}
