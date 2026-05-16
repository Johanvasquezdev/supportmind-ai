"use client";

import { motion } from "framer-motion";
import { AlignLeft, Diamond, Play, RefreshCw, Table2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcon";
import { StatusBadge } from "./StatusBadge";
import type { SourceDocument } from "./types";

interface DocumentRowProps {
  doc: SourceDocument;
  onDelete: () => void;
  onRetry: () => void;
  onSummarize: () => void;
  onTextSummary: () => void;
  onTables: () => void;
  onInsights: () => void;
  highlighted?: boolean;
  textSummaryOpen?: boolean;
  tablesOpen?: boolean;
  insightsOpen?: boolean;
}

export function DocumentRow({
  doc,
  onDelete,
  onRetry,
  onSummarize,
  onTextSummary,
  onTables,
  onInsights,
  highlighted = false,
  textSummaryOpen = false,
  tablesOpen = false,
  insightsOpen = false,
}: DocumentRowProps) {
  const uploadDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      id={`document-${doc.id}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative grid grid-cols-12 items-center gap-2 rounded-[2px] border bg-[#0d0d1a] px-4 py-3 transition-colors hover:bg-[#12121f]",
        highlighted
          ? "border-[#7c3aed] bg-[#7c3aed]/10"
          : "border-[#1a1a2e]",
      )}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />

      {/* — Col 1: Name (5 cols) — */}
      <div className="col-span-5 flex min-w-0 items-center gap-3 pr-2">
        <FileIcon filename={doc.title} size={18} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] font-medium leading-snug text-[#F0EEE9]">
            {doc.title}
          </span>
          <span className="font-mono text-[11px] text-[#6B6A72]">
            {uploadDate}
          </span>
        </div>
      </div>

      {/* — Col 2: Processing data (3 cols) — */}
      <div className="col-span-3 flex gap-6 font-mono text-[11px] text-[#6B6A72]">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest opacity-60">
            Chunks
          </span>
          <span className="text-[#F0EEE9]">{doc.chunksCount ?? "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest opacity-60">
            Tokens
          </span>
          <span className="text-[#F0EEE9]">{doc.tokensCount ?? "—"}</span>
        </div>
      </div>

      {/* — Col 3: Status + Actions (4 cols) — */}
      <div className="col-span-4 flex items-center justify-end gap-3">
        <div className="flex flex-col items-end">
          <StatusBadge status={doc.status} />
          {doc.status === "FAILED" && doc.errorMsg && (
            <span className="mt-0.5 max-w-[140px] truncate font-mono text-[9px] text-red-500/80">
              {doc.errorMsg}
            </span>
          )}
        </div>

        {/* Actions — always reserve space to avoid layout shift */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity",
            "opacity-0 group-hover:opacity-100"
          )}
        >
          {doc.status === "READY" && (
            <div className="flex h-7 overflow-hidden rounded-[2px] border border-[#1a1a2e] bg-[#12121f]">
              <button
                type="button"
                onClick={onSummarize}
                className="flex items-center gap-1.5 border-r border-[#1a1a2e] px-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F0EEE9] transition-colors hover:bg-[#7c3aed]/10"
              >
                <Play size={11} />
                Audio
              </button>
              <button
                type="button"
                onClick={onTextSummary}
                className={cn(
                  "flex items-center gap-1.5 border-r border-[#1a1a2e] px-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[#7c3aed]/10",
                  textSummaryOpen ? "text-[#a78bfa]" : "text-[#F0EEE9]",
                )}
              >
                <AlignLeft size={12} />
                Text
              </button>
              <button
                type="button"
                onClick={onTables}
                className={cn(
                  "flex items-center gap-1.5 border-r border-[#1a1a2e] px-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[#7c3aed]/10",
                  tablesOpen ? "text-[#a78bfa]" : "text-[#F0EEE9]",
                )}
              >
                <Table2 size={12} />
                Tables
              </button>
              <button
                type="button"
                onClick={onInsights}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[#7c3aed]/10",
                  insightsOpen ? "text-[#a78bfa]" : "text-[#F0EEE9]",
                )}
              >
                <Diamond size={11} />
                Insights
              </button>
            </div>
          )}

          {doc.status === "FAILED" && (
            <button
              onClick={onRetry}
              className="flex h-7 items-center gap-1.5 rounded-[2px] border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/20"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          )}

          <button
            onClick={onDelete}
            title="Delete document"
            className="flex size-7 items-center justify-center rounded-[2px] border border-[#1a1a2e] text-[#6B6A72] transition-all hover:border-red-500/40 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
