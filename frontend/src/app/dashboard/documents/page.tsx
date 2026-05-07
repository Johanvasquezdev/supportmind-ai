"use client";

import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";

type DocumentStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

type SourceDocument = {
  id: string;
  title?: string;
  status: DocumentStatus;
  createdAt: string;
};

type PendingFile = {
  file: File;
  error?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".txt", ".md", ".pdf"];

export default function DocumentsPage() {
  const api = useApi();
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    const hasPendingDocument = documents.some((document) =>
      ["PENDING", "PROCESSING"].includes(document.status)
    );

    if (!hasPendingDocument) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadDocuments(false);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [documents]);

  const loadDocuments = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingDocuments(true);
    }
    try {
      const response = await api.get<SourceDocument[]>("/documents");
      setDocuments(response.data);
    } finally {
      if (showLoading) {
        setIsLoadingDocuments(false);
      }
    }
  };

  const addFiles = (incomingFiles: File[]) => {
    const nextFiles = incomingFiles.map((file) => ({
      file,
      error: validateFile(file),
    }));

    setPendingFiles((prev) => [...prev, ...nextFiles]);
    setMessage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    setPendingFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const uploadFiles = async () => {
    const validFiles = pendingFiles.filter((item) => !item.error);

    if (validFiles.length === 0) {
      setMessage("Add at least one .txt or .md file under 10MB.");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      for (const item of validFiles) {
        const formData = new FormData();
        formData.append("file", item.file);

        await api.post("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setPendingFiles((prev) => prev.filter((item) => item.error));
      setMessage(
        "Documents uploaded. They are now being embedded and will become chat sources when ready."
      );
      await loadDocuments();
    } catch {
      setMessage("Upload failed. Check your API connection and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const hasValidFiles = pendingFiles.some((item) => !item.error);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-all",
          isDragging
            ? "border-purple-500 bg-purple-500/5"
            : "border-border hover:border-purple-500/30 hover:bg-accent/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex size-14 items-center justify-center rounded-xl border border-purple-500/20 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
          <Upload className="size-6 text-purple-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Drop your source documents here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-400 transition-colors hover:text-purple-300"
            >
              browse files
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supports .txt, .md, and .pdf, max 10MB per file.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".txt,.md,.pdf"
        />
      </div>

      {message && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      {pendingFiles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium text-foreground">
              Ready to upload ({pendingFiles.length})
            </h3>
            <button
              type="button"
              disabled={isUploading || !hasValidFiles}
              onClick={uploadFiles}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading && <Loader2 className="size-4 animate-spin" />}
              Upload Files
            </button>
          </div>

          <div className="grid gap-3">
            {pendingFiles.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-accent">
                    <FileText className="size-4 text-purple-400" />
                  </div>
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-red-300">{item.error}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Chat sources</h3>
          {isLoadingDocuments && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-accent">
                    <FileText className="size-4 text-purple-400" />
                  </div>
                  <div className="truncate">
                    <p className="truncate text-sm font-medium text-foreground">
                      {document.title || "Untitled document"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.status === "READY"
                        ? "Available to chat"
                        : document.status === "FAILED"
                          ? "Embedding failed"
                          : "Embedding in progress"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={document.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/40 py-12 text-center">
            <FileText className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No sources uploaded yet. Upload your knowledge base to ground chat
              answers.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function validateFile(file: File): string | undefined {
  const name = file.name.toLowerCase();
  const isSupportedFile = SUPPORTED_EXTENSIONS.some((extension) =>
    name.endsWith(extension)
  );

  if (!isSupportedFile) {
    return "Only .txt, .md, and .pdf uploads are supported.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File is over 10MB.";
  }

  return undefined;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const isReady = status === "READY";
  const isFailed = status === "FAILED";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        isReady && "bg-green-500/10 text-green-300",
        isFailed && "bg-red-500/10 text-red-300",
        !isReady && !isFailed && "bg-yellow-500/10 text-yellow-300"
      )}
    >
      {isReady ? (
        <CheckCircle2 className="size-3" />
      ) : isFailed ? (
        <AlertCircle className="size-3" />
      ) : (
        <Loader2 className="size-3 animate-spin" />
      )}
      {status}
    </span>
  );
}
