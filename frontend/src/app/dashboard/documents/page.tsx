"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Grid,
  List,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

import { UploadZone } from "@/components/documents/UploadZone";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { EmptyState } from "@/components/documents/EmptyState";
import { DataTablesPanel } from "@/components/documents/DataTablesPanel";
import { InsightsPanel } from "@/components/documents/InsightsPanel";
import { TextSummaryPanel } from "@/components/documents/TextSummaryPanel";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultItem } from "@/components/search/SearchResultItem";
import type {
  DocumentStatus,
  FileUploadState,
  SourceDocument,
} from "@/components/documents/types";
import type { HybridSearchResult } from "@/hooks/useSearch";

type OpenDocumentPanel = {
  documentId: string;
  type: "summary" | "tables" | "insights";
} | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_SUCCESS_DISMISS_MS = 3_000;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const api = useApi();
  const { show: toast } = useToast();

  // ── Data state ──
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── UI state ──
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HybridSearchResult[] | null>(
    null,
  );
  const [highlightedDocumentId, setHighlightedDocumentId] = useState<
    string | null
  >(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("document"),
  );
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "ALL">(
    "ALL"
  );
  const [openDocumentPanel, setOpenDocumentPanel] =
    useState<OpenDocumentPanel>(null);

  // ── Upload state ──
  const [uploadQueue, setUploadQueue] = useState<
    Record<string, FileUploadState>
  >({});
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // ─── Debounced search ────────────────────────────────────────────────────────
  // ─── Load documents ──────────────────────────────────────────────────────────
  const loadDocuments = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        else setIsSyncing(true);
        const res = await api.get<SourceDocument[]>("/documents");
        setDocuments(res.data);
      } catch {
        if (!silent) toast("Failed to load knowledge base.");
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [api, toast]
  );

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const documentId = new URLSearchParams(window.location.search).get(
      "document",
    );
    if (!documentId) return;

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(`document-${documentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [documents.length]);

  // ─── Real-time polling while any doc is in-flight ────────────────────────────
  useEffect(() => {
    const hasActive = documents.some(
      (d) => d.status === "PENDING" || d.status === "PROCESSING"
    );
    if (!hasActive) return;

    const id = setInterval(() => loadDocuments(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [documents, loadDocuments]);

  // ─── Upload ──────────────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (file: File, fileId: string) => {
      setUploadQueue((prev) => ({
        ...prev,
        [fileId]: { file, progress: 0, status: "uploading" },
      }));

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadQueue((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: "error",
            error: "File exceeds 10 MB limit",
          },
        }));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post("/documents/upload", formData, {
          onUploadProgress: (e) => {
            const progress = Math.round((e.loaded * 100) / (e.total ?? 100));
            setUploadQueue((prev) => ({
              ...prev,
              [fileId]: { ...prev[fileId], progress },
            }));
          },
        });

        setUploadQueue((prev) => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: "completed", progress: 100 },
        }));

        // Refresh list so the new doc appears with PROCESSING status immediately
        await loadDocuments(true);

        setTimeout(() => {
          setUploadQueue((prev) => {
            const next = { ...prev };
            if (next[fileId]?.status === "completed") delete next[fileId];
            return next;
          });
        }, UPLOAD_SUCCESS_DISMISS_MS);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } }; message?: string })
            ?.response?.data?.message ??
          (err as Error)?.message ??
          "Upload failed";

        setUploadQueue((prev) => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: "error", error: message },
        }));
        toast(`Could not upload "${file.name}": ${message}`);
      }
    },
    [api, loadDocuments, toast]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) =>
        uploadFile(file, `${file.name}-${Date.now()}-${Math.random()}`)
      );
    },
    [uploadFile]
  );

  const retryUpload = useCallback(
    (fileId: string) => {
      const state = uploadQueue[fileId];
      if (state) uploadFile(state.file, fileId);
    },
    [uploadFile, uploadQueue]
  );

  const dismissUpload = useCallback((fileId: string) => {
    setUploadQueue((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  // ─── Document actions ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Remove this document from your knowledge base? This cannot be undone."
        )
      )
        return;

      try {
        await api.delete(`/documents/${id}`);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        toast("Document removed from knowledge base.");
      } catch {
        toast("Failed to delete document.");
      }
    },
    [api, toast]
  );

  const handleRetry = useCallback(
    async (id: string) => {
      // Optimistic update
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "PROCESSING" as DocumentStatus } : d
        )
      );

      try {
        await api.post(`/documents/${id}/retry`);
        // Polling will pick up the real status
      } catch {
        // Revert optimistic update
        await loadDocuments(true);
        toast("Failed to restart document ingestion.");
      }
    },
    [api, loadDocuments, toast]
  );

  const handleSummarize = useCallback(
    async (id: string) => {
      try {
        toast("Generating audio summary...");
        const res = await api.post(`/voice/summarize`, { documentId: id }, {
          responseType: "blob",
        });

        const base64Summary = res.headers["x-summary-text"] as string | undefined;
        const summaryText = base64Summary
          ? decodeURIComponent(escape(window.atob(base64Summary)))
          : "Summary ready.";

        const audioUrl = URL.createObjectURL(res.data as Blob);
        const audio = new Audio(audioUrl);
        audio.play();

        toast(summaryText);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } }; message?: string })
            ?.response?.data?.message ??
          (err as Error)?.message ??
          "Failed to generate summary.";
        toast(message);
      }
    },
    [api, toast]
  );

  const toggleTextSummary = useCallback((documentId: string) => {
    setOpenDocumentPanel((current) =>
      current?.documentId === documentId && current.type === "summary"
        ? null
        : { documentId, type: "summary" },
    );
  }, []);

  const toggleTables = useCallback((documentId: string) => {
    setOpenDocumentPanel((current) =>
      current?.documentId === documentId && current.type === "tables"
        ? null
        : { documentId, type: "tables" },
    );
  }, []);

  const toggleInsights = useCallback((documentId: string) => {
    setOpenDocumentPanel((current) =>
      current?.documentId === documentId && current.type === "insights"
        ? null
        : { documentId, type: "insights" },
    );
  }, []);

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: documents.length,
      ready: documents.filter((d) => d.status === "READY").length,
      processing: documents.filter(
        (d) => d.status === "PROCESSING" || d.status === "PENDING"
      ).length,
      failed: documents.filter((d) => d.status === "FAILED").length,
    }),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus =
        statusFilter === "ALL" || doc.status === statusFilter;
      return matchesStatus;
    });
  }, [documents, statusFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setStatusFilter("ALL");
  }, []);

  const handleSearchResults = useCallback(
    (query: string, results: HybridSearchResult[]) => {
      setSearchQuery(query);
      setSearchResults(results);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  const openSearchResult = useCallback((documentId: string) => {
    setHighlightedDocumentId(documentId);
    document
      .getElementById(`document-${documentId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const scrollToUpload = useCallback(() => {
    uploadZoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      {/* ── 1. Header ── */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#F0EEE9]">
            Knowledge Base
          </h1>
          <p className="text-sm text-[#6B6A72]">
            Manage the documents used to ground your AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar onResults={handleSearchResults} onClear={clearSearch} />

          {/* Filter */}
          <div className="flex h-9 items-center gap-2 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] px-3 text-[#6B6A72] transition-colors hover:border-[#7c3aed]/30">
            <Filter size={13} />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DocumentStatus | "ALL")
              }
              className="bg-transparent font-mono text-[10px] font-bold uppercase tracking-widest text-[#F0EEE9] outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex h-9 items-center rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] p-1">
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={cn(
                "flex size-7 items-center justify-center rounded-[1px] transition-colors",
                viewMode === "list"
                  ? "bg-[#12121f] text-[#F0EEE9]"
                  : "text-[#6B6A72] hover:text-[#F0EEE9]"
              )}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={cn(
                "flex size-7 items-center justify-center rounded-[1px] transition-colors",
                viewMode === "grid"
                  ? "bg-[#12121f] text-[#F0EEE9]"
                  : "text-[#6B6A72] hover:text-[#F0EEE9]"
              )}
            >
              <Grid size={15} />
            </button>
          </div>

          {/* Upload CTA */}
          <button
            onClick={scrollToUpload}
            className="flex h-9 items-center gap-2 rounded-[2px] bg-[#7c3aed] px-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#7c3aed]/20 transition-all hover:bg-[#6d28d9] active:scale-95"
          >
            <Plus size={15} />
            Upload
          </button>
        </div>
      </div>

      {/* ── 2. Stats bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Documents",
            value: stats.total,
            dot: null,
          },
          {
            label: "Ready",
            value: stats.ready,
            dot: <div className="size-2 rounded-full bg-emerald-500" />,
          },
          {
            label: "Processing",
            value: stats.processing,
            dot: (
              <div
                className={cn(
                  "size-2 rounded-full bg-amber-500",
                  stats.processing > 0 && "animate-pulse"
                )}
              />
            ),
          },
          {
            label: "Failed",
            value: stats.failed,
            dot: <div className="size-2 rounded-full bg-red-500" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative flex flex-col gap-1 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] p-4 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-[#1a1a2e]" />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6B6A72]">
              {stat.dot}
              {stat.label}
            </div>
            <div className="font-mono text-2xl font-bold text-[#F0EEE9]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Syncing indicator ── */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c3aed]"
          >
            <RefreshCw size={11} className="animate-spin" />
            Syncing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. Upload zone ── */}
      <div ref={uploadZoneRef}>
        <UploadZone
          uploadQueue={uploadQueue}
          onFiles={handleFiles}
          onRetryFile={retryUpload}
          onDismissFile={dismissUpload}
        />
      </div>

      {/* ── 5. Document library ── */}
      {isLoading && documents.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-[#7c3aed]" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#6B6A72]">
            Loading Knowledge Base...
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          searchQuery=""
          statusFilter={statusFilter}
          hasAnyDocuments={documents.length > 0}
          onClearFilters={clearFilters}
          onUploadClick={scrollToUpload}
        />
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-12 border-b border-[#1a1a2e] px-4 pb-2 text-[9px] font-bold uppercase tracking-widest text-[#6B6A72]">
            <div className="col-span-5">Document</div>
            <div className="col-span-3">Processing Data</div>
            <div className="col-span-4 text-right">Status &amp; Actions</div>
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="space-y-0">
                  <DocumentRow
                    doc={doc}
                    onDelete={() => handleDelete(doc.id)}
                    onRetry={() => handleRetry(doc.id)}
                    onSummarize={() => handleSummarize(doc.id)}
                    onTextSummary={() => toggleTextSummary(doc.id)}
                    onTables={() => toggleTables(doc.id)}
                    onInsights={() => toggleInsights(doc.id)}
                    highlighted={highlightedDocumentId === doc.id}
                    textSummaryOpen={
                      openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "summary"
                    }
                    tablesOpen={
                      openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "tables"
                    }
                    insightsOpen={
                      openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "insights"
                    }
                  />
                  <AnimatePresence>
                    {openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "summary" && (
                      <TextSummaryPanel documentId={doc.id} />
                    )}
                    {openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "tables" && (
                        <DataTablesPanel
                          documentId={doc.id}
                          documentTitle={doc.title}
                        />
                      )}
                    {openDocumentPanel?.documentId === doc.id &&
                      openDocumentPanel.type === "insights" && (
                        <InsightsPanel documentId={doc.id} />
                      )}
                  </AnimatePresence>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={() => handleDelete(doc.id)}
                onRetry={() => handleRetry(doc.id)}
                onSummarize={() => handleSummarize(doc.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {searchResults && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3 rounded-[2px] border border-[#1a1a2e] bg-[#0d0d1a] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[12px] text-[#6B6A72]">
                Search Results for &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="font-mono text-[11px] text-[#7c3aed] transition-colors hover:text-[#a78bfa]"
              >
                Clear search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6B6A72]">
                No results for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <SearchResultItem
                    key={result.chunkId}
                    result={result}
                    query={searchQuery}
                    onClick={() => openSearchResult(result.documentId)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
