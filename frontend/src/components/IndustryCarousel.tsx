"use client";

import { motion } from "framer-motion";

const industries = [
  {
    title: "E-commerce Support",
    description: "Handle order tracking, returns, and product questions instantly across all channels.",
    metric: "95%",
    label: "Resolution rate",
  },
  {
    title: "SaaS Onboarding",
    description: "Guide new users through setup, answer technical questions, and reduce churn rates.",
    metric: "60%",
    label: "Faster onboarding",
  },
  {
    title: "HR & Internal Support",
    description: "Answer employee questions about benefits, policies, and IT support 24/7.",
    metric: "70%",
    label: "Ticket reduction",
  },
  {
    title: "Financial Services",
    description: "Provide instant account information, transaction details, and secure fraud alerts.",
    metric: "99.9%",
    label: "Accuracy rating",
  },
];

export function IndustryCarousel() {
  return (
    <section id="industries" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">Where It Deploys</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            SupportMind AI scales across diverse sectors with vertical-specific precision.
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {industries.map((item, idx) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-[2px] p-8 group hover:border-[#7c3aed] transition-all duration-200"
            >
              <div className="flex flex-col h-full justify-between gap-8">
                <div>
                  <h3 className="font-sans text-[18px] font-bold text-[#F0EEE9] mb-3">{item.title}</h3>
                  <p className="font-sans text-[14px] text-[#6B6A72] leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[40px] text-[#7c3aed] leading-none mb-1">
                    {item.metric}
                  </div>
                  <div className="font-mono text-[11px] text-[#6B6A72] uppercase tracking-wider">
                    {item.label}
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
