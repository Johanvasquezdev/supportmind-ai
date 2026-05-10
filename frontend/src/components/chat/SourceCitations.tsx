"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  vectorId: string;
  score: number;
  text: string;
  metadata?: {
    documentId?: string;
    documentTitle?: string;
    chunkIndex?: number;
  };
}

interface SourceCitationsProps {
  sources: Source[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
          Sources & Citations
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sources.map((source, index) => (
          <motion.div
            key={source.vectorId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex flex-col rounded-xl border border-black/5 bg-black/[0.02] p-3 transition-all hover:border-purple-500/30 hover:bg-black/[0.04] dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/50 shadow-sm dark:bg-white/5">
                  <FileText className="size-3 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="truncate text-[11px] font-semibold text-black/80 dark:text-white/80">
                  {source.metadata?.documentTitle || "Untitled Document"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                {(source.score * 100).toFixed(0)}%
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-black/50 dark:text-white/50 italic">
              &quot;{source.text}&quot;
            </p>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] font-mono text-black/30 dark:text-white/30">
                REF-{index + 1}
              </span>
              <button className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-purple-600/60 transition-colors hover:text-purple-600 dark:text-purple-400/60 dark:hover:text-purple-400">
                View Source <ExternalLink size={10} />
              </button>
            </div>
            
            {/* Hover Tooltip/Detail - Expanding on click could be added later */}
            <div className="pointer-events-none absolute -inset-px rounded-xl border-2 border-purple-500/0 transition-all group-hover:border-purple-500/10" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
