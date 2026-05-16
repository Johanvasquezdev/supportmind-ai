"use client";

import { Filter, Upload, Plus } from "lucide-react";
import type { SourceDocument } from "./types";
import type { DocumentStatus } from "./types";

interface EmptyStateProps {
  searchQuery: string;
  statusFilter: DocumentStatus | "ALL";
  hasAnyDocuments: boolean;
  onClearFilters: () => void;
  onUploadClick: () => void;
}

export function EmptyState({
  searchQuery,
  statusFilter,
  hasAnyDocuments,
  onClearFilters,
  onUploadClick,
}: EmptyStateProps) {
  const isFiltered = !!searchQuery || statusFilter !== "ALL";

  if (!hasAnyDocuments && !isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-[2px] border border-[#1a1a2e] bg-[#12121f] text-[#6B6A72]">
          <Upload size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight text-[#F0EEE9]">
            Your Knowledge Base is empty
          </h3>
          <p className="mx-auto max-w-sm text-sm text-[#6B6A72]">
            Upload documentation, FAQs, and guides. SupportMind will learn from
            your docs and answer questions grounded in your content.
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 rounded-[2px] bg-[#7c3aed] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#7c3aed]/20 transition-all hover:bg-[#6d28d9] active:scale-95"
        >
          <Plus size={16} />
          Upload Your First Document
        </button>
      </div>
    );
  }

  // Filtered empty state
  const filterLabel =
    statusFilter !== "ALL" ? statusFilter.toLowerCase() : "matching";

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-[2px] border border-[#1a1a2e] bg-[#12121f] text-[#6B6A72]">
        <Filter size={24} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[#F0EEE9]">
          {searchQuery
            ? `No ${filterLabel} documents match "${searchQuery}"`
            : `No ${filterLabel} documents`}
        </h3>
        <p className="text-sm text-[#6B6A72]">
          Try adjusting your filters or search terms.
        </p>
      </div>
      <button
        onClick={onClearFilters}
        className="rounded-[2px] border border-[#1a1a2e] px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#6B6A72] transition-all hover:border-[#7c3aed]/40 hover:text-[#F0EEE9]"
      >
        Clear Filters
      </button>
    </div>
  );
}
