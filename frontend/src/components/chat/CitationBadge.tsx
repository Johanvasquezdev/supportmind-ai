"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContextItem } from "@/lib/parse-citations";
import { cn } from "@/lib/utils";

interface CitationBadgeProps {
  index: number;
  item: ContextItem;
  onClick: (index: number) => void;
}

export function CitationBadge({ index, item, onClick }: CitationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span className="relative inline-block align-baseline mx-0.5">
      <button
        onClick={() => onClick(index)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-[2px] border border-white/10 bg-black/40 px-1 transition-all hover:border-purple-500",
          "font-mono text-[10px] font-bold text-purple-400"
        )}
      >
        {index}
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="absolute bottom-full left-1/2 z-[100] mb-2 w-[280px] -translate-x-1/2 pointer-events-none"
          >
            <div className="rounded-[2px] border border-[#1E1E26] bg-[#131318] p-3 shadow-2xl">
              <p className="font-sans text-[12px] leading-relaxed text-[#F0EEE9]">
                {item.text.length > 120 ? `${item.text.slice(0, 120)}...` : item.text}
              </p>
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#1E1E26] bg-[#131318]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
