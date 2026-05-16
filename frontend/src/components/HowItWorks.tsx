"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Upload Your Documents",
    description: "Paste or upload your company knowledge — FAQs, support policies, product guides, onboarding docs. Any text content your support team uses daily.",
    features: [
      "Paste plain text or documentation",
      "No file format restrictions",
      "Process multiple documents at once",
    ],
  },
  {
    step: "02",
    title: "AI Learns Your Business",
    description: "SupportMind automatically splits your content into smart chunks, generates semantic embeddings, and indexes everything for instant retrieval.",
    features: [
      "Sentence-aware chunking preserves meaning",
      "Vector embeddings enable semantic search",
      "Processing happens in the background",
    ],
  },
  {
    step: "03",
    title: "Chat With Your AI Agent",
    description: "Ask questions in natural language. The AI retrieves the most relevant sections from your docs and answers using only your verified content — no hallucinations.",
    features: [
      "Answers grounded in your documentation",
      "Understands context and follow-up questions",
      "Cites sources from your knowledge base",
    ],
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Header */}
        <div className="mb-16">
          <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">How It Works</h2>
          <p className="font-sans text-[16px] text-[#6B6A72]">
            From zero to AI-powered support in under 10 minutes. No training required.
          </p>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-12 mb-20 border-b border-[#1a1a2e]">
          {steps.map((s, i) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(i)}
              className={`pb-4 font-mono text-sm transition-all relative ${
                activeStep === i ? "text-[#F0EEE9]" : "text-[#6B6A72] hover:text-[#F0EEE9]"
              }`}
            >
              {s.step}
              {activeStep === i && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7c3aed]" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Left Column */}
              <div className="relative">
                <div className="absolute -top-24 -left-12 font-mono text-[160px] font-bold text-[#12121f] select-none z-0">
                  {steps[activeStep].step}
                </div>
                <div className="relative z-10 space-y-6">
                  <h3 className="font-sans text-[28px] font-bold text-[#F0EEE9]">
                    {steps[activeStep].title}
                  </h3>
                  <p className="font-sans text-[16px] text-[#6B6A72] leading-relaxed max-w-[440px]">
                    {steps[activeStep].description}
                  </p>
                  <ul className="space-y-4 pt-4">
                    {steps[activeStep].features.map((f, idx) => (
                      <li key={idx} className="font-sans text-sm text-[#6B6A72] flex items-center gap-3">
                        <span className="text-[#7c3aed]">→</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column (Illustration) */}
              <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-[2px] p-12 flex items-center justify-center min-h-[360px]">
                {activeStep === 0 && <Step1Illustration />}
                {activeStep === 1 && <Step2Illustration />}
                {activeStep === 2 && <Step3Illustration />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

function Step1Illustration() {
  return (
    <div className="w-full max-w-[200px] space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.8, delay: i * 0.2 }}
          className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden"
        >
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            className="w-1/3 h-full bg-[#7c3aed]" 
          />
        </motion.div>
      ))}
    </div>
  );
}

function Step2Illustration() {
  return (
    <div className="relative size-32">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-dashed border-[#1a1a2e] rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 border-2 border-[#7c3aed]/20 rounded-full flex items-center justify-center"
      >
        <div className="size-2 bg-[#7c3aed] rounded-full shadow-[0_0_10px_#7c3aed]" />
      </motion.div>
    </div>
  );
}

function Step3Illustration() {
  const text = "SupportMind is thinking...";
  return (
    <div className="font-mono text-sm text-[#7c3aed] flex items-center gap-1">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: i * 0.05, repeat: Infinity, repeatDelay: 2 }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span 
        animate={{ opacity: [0, 1, 0] }} 
        transition={{ duration: 0.8, repeat: Infinity }}
        className="w-2 h-4 bg-[#7c3aed]" 
      />
    </div>
  );
}
