export type DocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "UPLOADING";

export interface SourceDocument {
  id: string;
  title: string;
  status: DocumentStatus;
  chunksCount?: number;
  tokensCount?: number;
  createdAt: string;
  errorMsg?: string;
}

export interface FileUploadState {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export interface DocumentStats {
  total: number;
  ready: number;
  processing: number;
  failed: number;
}
