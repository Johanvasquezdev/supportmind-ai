"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChatDemo } from "./ChatDemo";

const codeTokens = [
  "Upload docs",
  "RAG-powered",
  "Source-cited",
  "Zero hallucinations",
];

export function Hero() {
  return (
    <section className="relative min-h-screen bg-[#080810] pt-32 pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content (7 columns) */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-6"
            >
              <h1 className="font-sans text-[48px] md:text-[80px] font-bold leading-[1.1] tracking-tight text-[#F0EEE9] text-left">
                Your Docs.<br />
                Your Support Agent.
              </h1>
              
              <p className="font-sans text-lg md:text-xl text-[#6B6A72] max-width-[480px] leading-relaxed text-left">
                Upload your documentation. SupportMind trains an AI that answers 
                questions using only your verified content — accurate, instant, 24/7.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="flex flex-wrap gap-3"
            >
              {codeTokens.map((token) => (
                <span 
                  key={token}
                  className="font-mono text-[12px] text-[#6B6A72] border border-[#1a1a2e] rounded-[2px] px-3 py-1.5 bg-[#0d0d1a]"
                >
                  [ {token} ]
                </span>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start gap-8"
            >
              <Link
                href="/sign-up"
                className="bg-[#7c3aed] text-white font-sans text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-[2px] hover:bg-[#6d28d9] transition-colors"
              >
                Start Free Trial
              </Link>
              <a 
                href="#how-it-works"
                className="font-sans text-sm font-bold text-[#F0EEE9] pt-4 hover:text-[#7c3aed] transition-colors"
              >
                See how it works ↓
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              className="font-mono text-[12px] text-[#6B6A72] flex items-center gap-2"
            >
              <span>No credit card</span>
              <span className="text-[#1a1a2e]">·</span>
              <span>14-day trial</span>
              <span className="text-[#1a1a2e]">·</span>
              <span>10 min setup</span>
            </motion.div>
          </div>

          {/* Right Content (5 columns) - Chat Demo */}
          <div className="lg:col-span-5 relative">
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
             >
               <ChatDemo />
             </motion.div>
          </div>

        </div>
      </div>
      
      {/* Horizontal Rule */}
      <div className="absolute bottom-0 w-full h-px bg-[#1a1a2e]" />
    </section>
  );
}
