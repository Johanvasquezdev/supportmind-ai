"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { ContextItem } from "@/lib/parse-citations";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SourceCardProps {
  item: ContextItem;
  index: number;
  isHighlighted: boolean;
}

export function SourceCard({ item, index, isHighlighted }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score > 0.85) return "text-[#a855f7]"; // bright purple
    if (score >= 0.6) return "text-[#7c3aed]"; // muted purple
    return "text-[#6B6A72]"; // gray
  };

  const getBarColor = (score: number) => {
    if (score > 0.85) return "#a855f7";
    if (score >= 0.6) return "#7c3aed";
    return "#6B6A72";
  };

  const handleNavigate = () => {
    router.push(`/dashboard/documents?id=${item.metadata.documentId}`);
  };

  return (
    <motion.div
      id={`source-card-${index}`}
      animate={{
        borderColor: isHighlighted ? "#7c3aed" : "rgba(255,255,255,0.1)",
        backgroundColor: isHighlighted ? "rgba(124, 58, 237, 0.05)" : "rgba(0,0,0,0.4)",
      }}
      transition={{ duration: 0.2 }}
      className="flex w-full flex-col border p-[12px_16px] rounded-[2px] transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Left: Index */}
        <div className="shrink-0 pt-0.5">
          <span className="font-mono text-[11px] font-bold text-purple-400 align-super">
            {index < 10 ? `0${index}` : index}
          </span>
        </div>

        {/* Center: Content */}
        <div className="flex-1 space-y-1.5">
          <div 
            className={cn(
              "font-sans text-[13px] leading-relaxed text-[#F0EEE9]",
              !isExpanded && "line-clamp-2"
            )}
          >
            {item.text}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-mono text-[11px] text-[#6B6A72] transition-colors hover:text-[#F0EEE9]"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Right: Metrics & Link */}
        <div className="shrink-0 flex flex-col items-end gap-3 pt-0.5 ml-4">
          <div className="flex items-center gap-2">
            <div className="h-[3px] w-[40px] bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(100, Math.max(0, item.score * 100))}%`,
                  backgroundColor: getBarColor(item.score)
                }}
                className="h-full"
              />
            </div>
            <span className={cn("font-mono text-[10px] uppercase", getScoreColor(item.score))}>
              {(item.score * 100).toFixed(0)}% match
            </span>
          </div>

          <button
            onClick={handleNavigate}
            className="text-[#6B6A72] transition-colors hover:text-[#F0EEE9]"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
