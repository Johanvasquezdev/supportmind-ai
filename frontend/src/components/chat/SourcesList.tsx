"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContextItem } from "@/lib/parse-citations";
import { SourceCard } from "./SourceCard";

interface SourcesListProps {
  context: ContextItem[];
  highlightedIndex: number | null;
}

export function SourcesList({ context, highlightedIndex }: SourcesListProps) {
  const [showAll, setShowAll] = useState(false);

  // Frontend deduplication by documentId + chunkIndex
  const uniqueSources = useMemo(() => {
    if (!context) return [];
    const seen = new Set<string>();
    return context.filter(item => {
      const key = `${item.metadata.documentId}-${item.metadata.chunkIndex}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [context]);

  if (!uniqueSources || uniqueSources.length === 0) return null;

  const displaySources = showAll ? uniqueSources : uniqueSources.slice(0, 3);
  const hasMore = uniqueSources.length > 3;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* Header Row */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6A72]">
          SOURCES
        </span>
        <span className="font-mono text-[11px] text-[#6B6A72]">
          {uniqueSources.length} reference{uniqueSources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {displaySources.map((item, i) => (
            <motion.div
              key={item.vectorId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: i * 0.05,
                ease: "easeOut"
              }}
            >
              <SourceCard 
                item={item} 
                index={i + 1} 
                isHighlighted={highlightedIndex === (i + 1)} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More Toggle */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex w-full items-center justify-center border border-dashed border-white/10 bg-black/20 py-3 transition-all hover:bg-black/40"
        >
          <span className="font-mono text-[11px] text-[#6B6A72]">
            Show all {uniqueSources.length} sources ↓
          </span>
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center justify-center py-2"
        >
          <span className="font-mono text-[11px] text-[#6B6A72] hover:text-[#F0EEE9] transition-colors">
            Show fewer sources ↑
          </span>
        </button>
      )}
    </div>
  );
}
