"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "How does SupportMind AI learn about my business?",
    answer: "SupportMind AI ingests your documentation, FAQs, past support tickets, and knowledge base during setup. Our models then create a custom AI agent that understands your products and brand voice.",
  },
  {
    question: "Can I customize the AI responses?",
    answer: "Yes. You can tune tone, escalation rules, allowed sources, and response style to match your brand requirements.",
  },
  {
    question: "What happens if the AI doesn't know the answer?",
    answer: "The agent will refuse to hallucinate, citing only the context it has, or escalate to a human based on your configured escalation policy.",
  },
  {
    question: "Is my customer data secure?",
    answer: "Data is isolated by tenant and protected with AES-256 encryption, access controls, and audit-friendly storage patterns.",
  },
  {
    question: "How long does it take to set up?",
    answer: "Most of our customers get their custom AI agent up and running in under 10 minutes — no engineering required.",
  },
  {
    question: "Can I try it before committing?",
    answer: "Yes, we offer a 14-day free trial on all plans with full access to all features so you can see the value immediately.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">Common Questions</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            Everything you need to know about SupportMind AI
          </p>
        </div>

        {/* Accordion */}
        <div className="border-t border-[#1a1a2e]">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-[#1a1a2e]">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between py-6 text-left"
              >
                <span className="font-sans text-[15px] font-bold text-[#F0EEE9]">{faq.question}</span>
                <span className="font-mono text-[20px] text-[#7c3aed]">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 font-sans text-[14px] text-[#6B6A72] leading-relaxed max-w-[800px]">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
