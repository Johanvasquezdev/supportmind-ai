"use client";

import { motion } from "framer-motion";

const features = [
  {
    id: "01",
    title: "RAG-Powered Answers",
    description: "Advanced natural language processing that truly understands customer intent and context using your documentation as the single source of truth.",
  },
  {
    id: "02",
    title: "24/7 Availability",
    description: "Never miss a customer query. Instant, high-quality responses at any time, any day, across all your support channels.",
  },
  {
    id: "03",
    title: "Multi-Language Support",
    description: "Communicate with customers in 95+ languages with native-level accuracy, ensuring global accessibility for your support knowledge.",
  },
  {
    id: "04",
    title: "Real-Time Analytics",
    description: "Track performance, sentiment, and resolution rates with detailed data-driven insights to optimize your customer experience.",
  },
  {
    id: "05",
    title: "Enterprise Security",
    description: "Built with data privacy first. End-to-end encryption, strict multi-tenant isolation, and SOC 2 ready compliance standards.",
  },
  {
    id: "06",
    title: "Instant Integration",
    description: "Connect your AI agent with Slack, Discord, Email, and your existing support workflows in minutes with zero coding required.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">Everything You Need</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            Powerful features that grow with your business, from startup to enterprise.
          </p>
        </div>

        {/* Features Grid (2 column) */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group flex items-start gap-8 p-12 border-[#1a1a2e] border-l-2 border-l-transparent hover:border-l-[#7c3aed] transition-all ${
                idx % 2 === 0 ? "md:border-r" : ""
              } ${
                idx < 4 ? "border-b" : ""
              }`}
            >
              <span className="font-mono text-[13px] text-[#7c3aed] mt-1 shrink-0">{feature.id}</span>
              <div className="space-y-3">
                <h3 className="font-sans text-[16px] font-bold text-[#F0EEE9]">
                  {feature.title}
                </h3>
                <p className="font-sans text-[14px] text-[#6B6A72] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
