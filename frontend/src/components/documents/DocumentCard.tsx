"use client";

import { motion } from "framer-motion";
import { RefreshCw, Trash2 } from "lucide-react";
import { FileIcon } from "./FileIcon";
import { StatusBadge } from "./StatusBadge";
import type { SourceDocument } from "./types";

interface DocumentCardProps {
  doc: SourceDocument;
  onDelete: () => void;
  onRetry: () => void;
  onSummarize: () => void;
}

export function DocumentCard({
  doc,
  onDelete,
  onRetry,
  onSummarize,
}: DocumentCardProps) {
  const uploadDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className="group relative flex flex-col gap-4 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] p-5 transition-colors hover:bg-[#12121f]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />

      {/* Top row: icon + status */}
      <div className="flex items-start justify-between">
        <FileIcon filename={doc.title} size={32} />
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={doc.status} />
          {doc.status === "FAILED" && doc.errorMsg && (
            <span className="max-w-[110px] truncate font-mono text-[9px] text-red-500/80">
              {doc.errorMsg}
            </span>
          )}
        </div>
      </div>

      {/* Filename + date */}
      <div className="space-y-1">
        <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-medium leading-snug text-[#F0EEE9]">
          {doc.title}
        </h3>
        <p className="font-mono text-[11px] text-[#6B6A72]">{uploadDate}</p>
      </div>

      {/* Footer: stats + actions */}
      <div className="flex items-center justify-between border-t border-[#1a1a2e] pt-4">
        <div className="flex gap-5 font-mono text-[11px]">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6A72]">
              Chunks
            </span>
            <span className="text-[#F0EEE9]">{doc.chunksCount ?? "—"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6B6A72]">
              Tokens
            </span>
            <span className="text-[#F0EEE9]">{doc.tokensCount ?? "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {doc.status === "READY" && (
            <button
              onClick={onSummarize}
              className="flex h-7 items-center gap-1.5 rounded-[2px] border border-[#1a1a2e] bg-[#12121f] px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F0EEE9] transition-colors hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/10"
            >
              Summary
            </button>
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
