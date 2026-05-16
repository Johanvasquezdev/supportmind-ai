"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileUploadState } from "./types";

interface UploadZoneProps {
  uploadQueue: Record<string, FileUploadState>;
  onFiles: (files: File[]) => void;
  onRetryFile: (fileId: string) => void;
  onDismissFile: (fileId: string) => void;
}

export function UploadZone({
  uploadQueue,
  onFiles,
  onRetryFile,
  onDismissFile,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only fire if leaving the zone entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFiles(files);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  };

  const queueEntries = Object.entries(uploadQueue);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2px] border-2 border-dashed py-10 transition-all",
          isDragOver
            ? "border-[#7c3aed] bg-[#7c3aed]/8"
            : "border-[#1a1a2e] bg-[#0d0d1a] hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/5"
        )}
      >
        <motion.div
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={cn(
            "flex size-12 items-center justify-center rounded-[2px] border transition-colors",
            isDragOver
              ? "border-[#7c3aed]/60 bg-[#7c3aed]/20 text-[#7c3aed]"
              : "border-[#1a1a2e] bg-[#12121f] text-[#6B6A72]"
          )}
        >
          <Upload size={22} />
        </motion.div>

        <div className="text-center">
          <p className="text-sm font-medium text-[#F0EEE9]">
            {isDragOver ? "Drop files to upload" : "Drag & drop files here"}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[#6B6A72]">
            PDF, TXT, MD — max 10 MB per file
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.pdf,.md"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Upload queue */}
      <AnimatePresence mode="popLayout">
        {queueEntries.map(([id, state]) => (
          <motion.div
            key={id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-4 rounded-[2px] border border-[#7c3aed]/20 bg-[#7c3aed]/5 px-4 py-3"
          >
            <FileText size={20} className="shrink-0 text-[#7c3aed]" />

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-medium text-[#F0EEE9]">
                  {state.file.name}
                </span>
                <span className="ml-4 shrink-0 font-mono text-[10px] text-[#6B6A72]">
                  {(state.file.size / 1024).toFixed(1)} KB
                </span>
              </div>

              {state.status === "error" ? (
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-red-400">
                  <AlertCircle size={10} />
                  {state.error ?? "Upload failed"}
                </div>
              ) : (
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-[#1a1a2e]">
                  <motion.div
                    className="h-full bg-[#7c3aed]"
                    initial={{ width: 0 }}
                    animate={{ width: `${state.progress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </div>
              )}
            </div>

            {/* Status indicator + controls */}
            <div className="shrink-0 flex items-center gap-2">
              {state.status === "uploading" && (
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  <Loader2 size={11} className="animate-spin" />
                  {state.progress}%
                </div>
              )}
              {state.status === "completed" && (
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <CheckCircle2 size={11} />
                  Done
                </div>
              )}
              {state.status === "error" && (
                <button
                  onClick={() => onRetryFile(id)}
                  className="flex h-6 items-center gap-1 rounded-[2px] border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/20"
                >
                  <RefreshCw size={9} />
                  Retry
                </button>
              )}
              {state.status !== "uploading" && (
                <button
                  onClick={() => onDismissFile(id)}
                  className="flex size-6 items-center justify-center rounded-[2px] border border-[#1a1a2e] text-[#6B6A72] transition-all hover:border-red-500/40 hover:text-red-400"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
