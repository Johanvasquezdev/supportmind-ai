"use client";

import { 
  Upload, 
  FileText, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Play, 
  Search, 
  Grid, 
  List, 
  Filter,
  RefreshCw,
  FileCode,
  FileJson,
  Plus
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { summarizeDocument } from "@/lib/voice-api";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SupportMind AI - Premium Knowledge Base
 * Final Enterprise Version
 */

type DocumentStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED" | "UPLOADING";

interface SourceDocument {
  id: string;
  title: string;
  status: DocumentStatus;
  chunksCount?: number;
  tokensCount?: number;
  createdAt: string;
  errorMsg?: string;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function DocumentsPage() {
  const api = useApi();
  const { getToken } = useAuth();
  const { show: toast } = useToast();
  
  // -- State --
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "ALL">("ALL");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Controls upload panel
  
  // -- Upload State --
  const [uploadQueue, setUploadQueue] = useState<Record<string, FileUploadState>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Polling State --
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDocuments = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      if (silent) setIsSyncing(true);
      const res = await api.get<SourceDocument[]>("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
      toast("Failed to sync knowledge base.");
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadDocuments();
  }, []);

  // Real-time Polling Logic
  useEffect(() => {
    const hasActiveTasks = documents.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
    
    if (hasActiveTasks) {
      const interval = setInterval(() => {
        loadDocuments(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  // -- Actions --
  const uploadFile = async (file: File, fileId: string) => {
    setUploadQueue(prev => ({
      ...prev,
      [fileId]: { file, progress: 0, status: 'uploading', error: undefined }
    }));

    // Local size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadQueue(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'error', error: "File exceeds 10MB limit" }
      }));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/documents/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadQueue(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress }
          }));
        }
      });

      setUploadQueue(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'completed', progress: 100 }
      }));

      loadDocuments(true);
      
      // Auto-remove success after delay
      setTimeout(() => {
        setUploadQueue(prev => {
          const next = { ...prev };
          // Only remove if it was successful (user might have retried or removed it)
          if (next[fileId]?.status === 'completed') {
            delete next[fileId];
          }
          return next;
        });
      }, 3000);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Upload failed";
      setUploadQueue(prev => ({
        ...prev,
        [fileId]: { ...prev[fileId], status: 'error', error: errorMsg }
      }));
      toast(`Could not upload ${file.name}`);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    await Promise.all(newFiles.map(file => uploadFile(file, `${file.name}-${Date.now()}`)));
  };

  const removeFromQueue = (fileId: string) => {
    setUploadQueue(prev => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document from your knowledge base?")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast("Source removed from knowledge base.");
    } catch (err) {
      toast("Failed to delete document.");
    }
  };

  const handleRetry = async (id: string) => {
    try {
      // Optimistic update
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'PROCESSING' as DocumentStatus } : d));
      
      await api.post(`/documents/${id}/retry`);
      
      toast("Document status updated to processing.");
      
      loadDocuments(true);
    } catch (err) {
      toast("Unable to restart ingestion process.");
    }
  };

  const handleSummarize = async (id: string) => {
    try {
      toast("Generating summary...");
      const res = await api.post(`/voice/summarize`, { documentId: id }, {
        responseType: 'blob'
      });

      // Extract text summary from header
      const base64Summary = res.headers['x-summary-text'];
      const summaryText = base64Summary 
        ? decodeURIComponent(escape(window.atob(base64Summary))) 
        : "Summary ready.";

      // Play audio
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      audio.play();

      toast(summaryText);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to generate summary.";
      toast(errorMsg);
    }
  };

  // -- Computed Stats --
  const stats = useMemo(() => {
    return {
      total: documents.length,
      ready: documents.filter(d => d.status === 'READY').length,
      processing: documents.filter(d => d.status === 'PROCESSING' || d.status === 'PENDING').length,
      failed: documents.filter(d => d.status === 'FAILED').length,
    };
  }, [documents]);

  // -- Filtered Documents --
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Manage the documents used to ground your AI assistant's answers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-64 rounded-[2px] border border-border bg-card pl-10 pr-4 font-mono text-xs text-foreground outline-none focus:border-purple-500/50 transition-all placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter */}
          <div className="relative h-10 px-3 flex items-center gap-2 rounded-[2px] border border-border bg-card text-muted-foreground hover:border-border/80 transition-all cursor-pointer">
            <Filter size={14} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer pr-4 text-foreground"
            >
              <option value="ALL">All Status</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex h-10 items-center rounded-[2px] border border-border bg-card p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex size-8 items-center justify-center rounded-[1px] transition-all",
                viewMode === 'list' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex size-8 items-center justify-center rounded-[1px] transition-all",
                viewMode === 'grid' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid size={16} />
            </button>
          </div>

          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 items-center gap-2 rounded-[2px] bg-purple-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-purple-700 active:scale-95 shadow-lg shadow-purple-500/20"
          >
            <Plus size={16} />
            Upload Source
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleUpload(e.target.files)}
            multiple 
            className="hidden" 
            accept=".txt,.pdf,.md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Documents", value: stats.total, icon: null },
          { label: "Ready", value: stats.ready, icon: <div className="size-2 rounded-full bg-emerald-500" /> },
          { label: "Processing", value: stats.processing, icon: <div className={cn("size-2 rounded-full bg-amber-500", stats.processing > 0 && "animate-pulse")} /> },
          { label: "Failed", value: stats.failed, icon: <div className="size-2 rounded-full bg-red-500" /> },
        ].map((stat, i) => (
          <div key={i} className="group relative flex flex-col gap-1 rounded-[2px] border border-border bg-card p-4 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {stat.icon}
              {stat.label}
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 3. Syncing Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400"
          >
            <RefreshCw size={12} className="animate-spin" />
            Syncing Knowledge Base...
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Upload Queue Progress */}
      {Object.keys(uploadQueue).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload Queue</h3>
          <div className="grid gap-2">
            {Object.entries(uploadQueue).map(([id, state]) => (
              <div key={id} className="flex items-center gap-4 rounded-[2px] border border-purple-500/20 bg-purple-500/5 p-4">
                <FileText className="size-8 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{state.file.name}</span>
                    <span className="font-mono text-muted-foreground">{(state.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  {state.status === 'error' ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-red-500">
                      <AlertCircle size={10} />
                      {state.error || "Upload failed"}
                    </div>
                  ) : (
                    <div className="h-1 w-full overflow-hidden rounded-[2px] bg-muted">
                      <motion.div 
                        className="h-full bg-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${state.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {state.status === 'uploading' ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                      <Loader2 size={12} className="animate-spin" />
                      Uploading
                    </div>
                  ) : state.status === 'completed' ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                      <CheckCircle2 size={12} />
                      Done
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => uploadFile(state.file, id)}
                        className="flex h-7 items-center gap-1.5 rounded-[2px] border border-purple-500/30 bg-purple-500/10 px-3 text-[9px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <RefreshCw size={10} />
                        Retry
                      </button>
                      <button 
                        onClick={() => removeFromQueue(id)}
                        className="flex size-7 items-center justify-center rounded-[2px] border border-border text-muted-foreground hover:text-red-500 hover:border-red-400 dark:hover:text-red-400 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Library View */}
      {isLoading && documents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="size-8 animate-spin text-purple-500" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading Knowledge Base...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState 
          query={searchQuery} 
          filter={statusFilter} 
          onClear={() => { setSearchQuery(""); setStatusFilter("ALL"); }} 
          onUpload={() => fileInputRef.current?.click()}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {/* List Headers */}
          <div className="grid grid-cols-12 px-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground pb-2 border-b border-border">
            <div className="col-span-5">Document Name</div>
            <div className="col-span-3">Processing Data</div>
            <div className="col-span-4 text-right">Status & Actions</div>
          </div>
          
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc) => (
                <DocumentRow 
                  key={doc.id} 
                  doc={doc} 
                  onDelete={() => handleDelete(doc.id)} 
                  onRetry={() => handleRetry(doc.id)}
                  onSummarize={() => handleSummarize(doc.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function DocumentRow({ doc, onDelete, onRetry, onSummarize }: { doc: SourceDocument, onDelete: () => void, onRetry: () => void, onSummarize: () => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative grid grid-cols-12 items-center rounded-[2px] border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:border-border/80 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {/* Name Section */}
      <div className="col-span-5 flex items-center gap-4 pr-4">
        <FileIcon filename={doc.title} />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium text-foreground font-sans">{doc.title}</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tighter">
            Added {new Date(doc.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Data Section */}
      <div className="col-span-3 flex gap-6 text-[11px] font-mono text-muted-foreground">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest opacity-50">Chunks</span>
          <span className="text-foreground">{doc.chunksCount ?? '--'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-widest opacity-50">Tokens</span>
          <span className="text-foreground">{doc.tokensCount ?? '--'}</span>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="col-span-4 flex items-center justify-end gap-4">
        <div className="flex flex-col items-end">
          <StatusBadge status={doc.status} />
          {doc.status === 'FAILED' && doc.errorMsg && (
            <span className="mt-1 max-w-[150px] truncate text-[9px] text-red-500/80 font-mono">
              {doc.errorMsg}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {doc.status === 'READY' && (
            <button 
              onClick={onSummarize}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-border bg-muted text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-muted/80"
            >
              Summary
            </button>
          )}
          {doc.status === 'FAILED' && (
            <button 
              onClick={onRetry}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-purple-500/50 bg-purple-500/10 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
          <button 
            onClick={onDelete}
            className="flex size-8 items-center justify-center rounded-[2px] border border-border text-muted-foreground hover:text-red-600 hover:border-red-400 dark:hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DocumentCard({ doc, onDelete, onRetry, onSummarize }: { doc: SourceDocument, onDelete: () => void, onRetry: () => void, onSummarize: () => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col gap-6 rounded-[2px] border border-border bg-card p-6 transition-all hover:bg-muted/50 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <FileIcon filename={doc.title} size={32} />
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={doc.status} />
          {doc.status === 'FAILED' && doc.errorMsg && (
            <span className="max-w-[100px] truncate text-[8px] text-red-500 font-mono">
              {doc.errorMsg}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground font-sans leading-relaxed h-10">{doc.title}</h3>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {new Date(doc.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Chunks</span>
            <span className="font-mono text-xs text-foreground">{doc.chunksCount ?? '--'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tokens</span>
            <span className="font-mono text-xs text-foreground">{doc.tokensCount ?? '--'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {doc.status === 'READY' && (
            <button 
              onClick={onSummarize}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-border bg-muted text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-muted/80"
            >
              Summary
            </button>
          )}
          {doc.status === 'FAILED' && (
            <button 
              onClick={onRetry}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[2px] border border-purple-500/50 bg-purple-500/10 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
          <button 
            onClick={onDelete}
            className="flex size-8 items-center justify-center rounded-[2px] border border-border text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:border-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = {
    READY: { color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Ready" },
    PROCESSING: { color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse", label: "Processing" },
    PENDING: { color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse", label: "Processing" },
    FAILED: { color: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Failed" },
    UPLOADING: { color: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", label: "Uploading" },
  }[status] || { color: "text-muted-foreground", dot: "bg-gray-500", label: status };

  return (
    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]", config.color)}>
      <div className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </div>
  );
}

function FileIcon({ filename, size = 20 }: { filename: string, size?: number }) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'pdf') return <FileText size={size} className="text-red-500 dark:text-red-400" />;
  if (ext === 'md') return <FileCode size={size} className="text-purple-600 dark:text-purple-400" />;
  if (ext === 'txt') return <FileText size={size} className="text-blue-600 dark:text-blue-400" />;
  return <FileText size={size} className="text-muted-foreground" />;
}

function EmptyState({ query, filter, onClear, onUpload }: { query: string, filter: string, onClear: () => void, onUpload: () => void }) {
  const isSearch = query || filter !== "ALL";

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-[2px] border border-border bg-card py-24 text-center">
      <div className="flex size-20 items-center justify-center rounded-[2px] bg-muted border border-border text-muted-foreground">
        {isSearch ? <Filter size={40} /> : <Upload size={40} />}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {isSearch ? `No ${filter !== 'ALL' ? filter : ''} documents match your search` : "Your Knowledge Base is empty"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {isSearch 
            ? "Try adjusting your filters or search terms to find what you're looking for."
            : "Upload documentation, FAQs, and guides. SupportMind will learn from your docs and answer questions grounded in your content."
          }
        </p>
      </div>

      <div className="flex gap-4">
        {isSearch ? (
          <button 
            onClick={onClear}
            className="rounded-[2px] border border-border px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
          >
            Clear Filters
          </button>
        ) : (
          <button 
            onClick={onUpload}
            className="flex items-center gap-2 rounded-[2px] bg-purple-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-purple-700 transition-all active:scale-95 shadow-xl shadow-purple-500/20"
          >
            <Plus size={16} />
            Upload Your First Document
          </button>
        )}
      </div>
    </div>
  );
}
