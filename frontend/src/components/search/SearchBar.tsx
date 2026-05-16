"use client";

import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearch, type HybridSearchResult } from "@/hooks/useSearch";

interface SearchBarProps {
  onResults: (query: string, results: HybridSearchResult[]) => void;
  onClear: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export function SearchBar({ onResults, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { search, clear, isLoading } = useSearch();

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      clear();
      onClear();
      return;
    }

    const id = window.setTimeout(async () => {
      const results = await search(cleanQuery);
      onResults(cleanQuery, results);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [clear, onClear, onResults, query, search]);

  const handleClear = useCallback(() => {
    setQuery("");
    clear();
    onClear();
  }, [clear, onClear]);

  return (
    <div className="relative w-full min-w-[220px]">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6B6A72]" />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your knowledge base..."
        className="h-9 w-full rounded-[2px] border border-[#1a1a2e] bg-[#12121f] pl-9 pr-10 text-[14px] text-[#F0EEE9] outline-none placeholder:text-[#6B6A72] focus:border-[#7c3aed]/60"
      />
      {isLoading ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#7c3aed]" />
      ) : query ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-[2px] text-[#6B6A72] hover:bg-[#0d0d1a] hover:text-[#F0EEE9]"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
