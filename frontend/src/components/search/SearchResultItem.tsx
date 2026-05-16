"use client";

import { FileText, FileType, Sheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HybridSearchResult } from "@/hooks/useSearch";

interface SearchResultItemProps {
  result: HybridSearchResult;
  query: string;
  isActive?: boolean;
  onClick: () => void;
}

function FileIconForTitle({ title }: { title: string }) {
  const lower = title.toLowerCase();

  if (lower.endsWith(".pdf")) return <FileType size={16} />;
  if (lower.endsWith(".md")) return <Sheet size={16} />;
  return <FileText size={16} />;
}

function getScoreColor(score: number) {
  if (score > 0.7) return "#7c3aed";
  if (score >= 0.5) return "#F0EEE9";
  return "#6B6A72";
}

function createExcerpt(text: string, query: string) {
  const cleanQuery = query.trim().toLowerCase();
  const compactText = text.replace(/\s+/g, " ").trim();

  if (!cleanQuery) return compactText.slice(0, 180);

  const firstTerm = cleanQuery.split(/\s+/)[0];
  const index = compactText.toLowerCase().indexOf(firstTerm);

  if (index < 0) return compactText.slice(0, 180);

  const start = Math.max(0, index - 70);
  const end = Math.min(compactText.length, index + 120);
  return `${start > 0 ? "... " : ""}${compactText.slice(start, end)}${end < compactText.length ? " ..." : ""}`;
}

function HighlightedExcerpt({ text, query }: { text: string; query: string }) {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = terms.some((term) =>
          new RegExp(`^${term}$`, "i").test(part),
        );

        return isMatch ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-[1px] bg-[#7c3aed20] px-0.5 text-[#a855f7]"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

export function SearchResultItem({
  result,
  query,
  isActive,
  onClick,
}: SearchResultItemProps) {
  const scorePercent = Math.min(
    100,
    Math.max(0, Math.round(result.hybridScore * 100)),
  );
  const scoreColor = getScoreColor(result.hybridScore);
  const excerpt = createExcerpt(result.text, query);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full grid-cols-[24px_minmax(0,1fr)_46px] gap-3 rounded-[2px] px-3 py-3 text-left transition-colors",
        isActive ? "bg-[#12121f]" : "hover:bg-[#12121f]",
      )}
    >
      <div className="mt-0.5 flex size-6 items-center justify-center text-[#7c3aed]">
        <FileIconForTitle title={result.documentTitle} />
      </div>

      <div className="min-w-0 space-y-1">
        <div className="truncate text-[13px] font-bold text-[#F0EEE9]">
          {result.documentTitle}
        </div>
        <p className="line-clamp-2 text-[13px] leading-5 text-[#6B6A72]">
          <HighlightedExcerpt text={excerpt} query={query} />
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 pt-1">
        <div className="h-[3px] w-6 bg-[#1a1a2e]">
          <div
            className="h-full"
            style={{
              width: `${scorePercent}%`,
              backgroundColor: scoreColor,
            }}
          />
        </div>
        <span className="font-mono text-[10px] text-[#6B6A72]">
          {scorePercent}%
        </span>
      </div>
    </button>
  );
}
