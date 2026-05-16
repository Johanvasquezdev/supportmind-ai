"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  {
    role: "user",
    text: "How do I reset my password?",
    time: "10:02 AM",
  },
  {
    role: "assistant",
    text: "To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new one within 2 minutes.",
    time: "10:02 AM",
  },
  {
    role: "user",
    text: "Does it work on mobile?",
    time: "10:03 AM",
  },
  {
    role: "assistant",
    text: "Yes, the reset process is fully responsive and works on any iOS or Android device. Our system supports all major mobile browsers.",
    time: "10:03 AM",
  },
];

export function ChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((prev) => (prev < messages.length ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[440px] bg-[#0d0d1a] border border-[#1a1a2e] rounded-[2px] overflow-hidden shadow-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e] bg-[#080810]">
        <span className="font-mono text-[12px] text-[#6B6A72] uppercase tracking-wider">SupportMind Agent</span>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#FF4545] animate-pulse" />
          <span className="font-mono text-[11px] text-[#6B6A72]">LIVE</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="p-6 space-y-6 h-[320px] overflow-y-auto chat-scrollbar">
        {messages.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 font-sans text-[13px] leading-relaxed text-[#F0EEE9] ${
                msg.role === "user" 
                  ? "border-r-2 border-[#7c3aed] text-right" 
                  : "bg-[#12121f] border-l-2 border-[#7c3aed]"
              }`}
            >
              {msg.text}
            </div>
            <span className="mt-1 font-mono text-[10px] text-[#6B6A72] uppercase tracking-tighter">
              {msg.time}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[#1a1a2e] bg-[#080810]">
        <div className="flex items-center gap-3 bg-[#12121f] border border-[#1a1a2e] rounded-[2px] px-3 py-2">
          <span className="flex-1 font-sans text-[13px] text-[#6B6A72]">Ask anything...</span>
          <div className="size-7 bg-[#7c3aed] rounded-[2px] flex items-center justify-center">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatDemoSection() {
  return (
    <section className="py-[120px] border-b border-[#1a1a2e]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
          >
            <h2 className="font-sans text-[48px] font-bold text-[#F0EEE9] mb-4">
              AI That Actually Understands
            </h2>
            <p className="font-sans text-[16px] text-[#6B6A72]">
              Watch how SupportMind AI handles real customer conversations with context, empathy, and precision.
            </p>
          </motion.div>
          <div className="flex justify-center lg:justify-end">
            <ChatDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
