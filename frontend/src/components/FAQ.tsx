"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const faqs = [
  {
    question: "How does SupportMind AI learn about my business?",
    answer:
      "SupportMind AI ingests your documentation, FAQs, past support tickets, and knowledge base during setup. Our advanced machine learning models then create a custom AI agent that understands your products, policies, and brand voice.",
  },
  {
    question: "Can I customize the AI responses?",
    answer: "Yes. You can tune tone, escalation rules, allowed sources, and response style.",
  },
  {
    question: "What happens if the AI doesn't know the answer?",
    answer: "It can refuse, ask for clarification, or escalate to a human based on your configured policy.",
  },
  {
    question: "Is my customer data secure?",
    answer: "Data is isolated by tenant and protected with encryption, access controls, and audit-friendly storage patterns.",
  },
  {
    question: "How long does it take to set up?",
    answer: "Most of our customers get their custom AI agent up and running in under 10 minutes.",
  },
  {
    question: "Can I try it before committing?",
    answer: "Yes, we offer a 14-day free trial on all plans with full feature access.",
  },
];

export function FAQ() {
  // Using an array of booleans to allow multiple to be open at once
  const [openStates, setOpenStates] = useState<boolean[]>(
    faqs.map((_, i) => i === 0) // First one open by default
  );

  const toggleFaq = (index: number) => {
    setOpenStates((prev) => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  return (
    <section id="faq" className="border-y border-border/60 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked"
          highlight="Questions"
          subtitle="Everything you need to know about SupportMind AI"
        />
        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openStates[index];

            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 shadow-sm ${
                  isOpen
                    ? "border-blue-500/30 bg-blue-50/50 dark:bg-[#0d121f]"
                    : "border-black/5 dark:border-white/5 bg-white dark:bg-[#0d121f]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors duration-200 ${
                    isOpen ? "text-blue-600 dark:text-blue-400" : "text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0 text-muted-foreground"
                    }`}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
