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
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm backdrop-blur-md ${
                  isOpen
                    ? "border-purple-500/30 bg-muted/40"
                    : "border-border bg-card/40 hover:bg-muted/50"
                }`}
              >
                {/* Highlight gradient */}
                <div className={`absolute inset-x-0 -top-px mx-auto h-1 w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-transparent blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                <div className={`absolute inset-x-0 -top-px mx-auto h-[2px] w-2/3 rounded-t-2xl bg-gradient-to-r from-blue-400 to-purple-400 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />

                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className={`flex w-full items-center justify-between p-6 text-left transition-colors duration-200 ${
                    isOpen ? "text-purple-600 dark:text-purple-400" : "text-foreground hover:text-purple-600 dark:hover:text-purple-400"
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
