'use client';

import { useState, useRef } from 'react';
import { Upload, File, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { formatDate, getApiErrorMessage } from '@/lib/utils';
import { Document } from '@/types';

interface DocumentUploadProps {
  documents: Document[];
  onDocumentsChange: () => void;
}

export default function DocumentUpload({ documents, onDocumentsChange }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onDocumentsChange();
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      alert(getApiErrorMessage(error, 'Error uploading file'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      onDocumentsChange();
    } catch (error: unknown) {
      console.error('Error deleting document:', error);
      alert(getApiErrorMessage(error, 'Error deleting document'));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PROCESSING':
        return 'Procesando';
      case 'COMPLETED':
        return 'Completado';
      case 'FAILED':
        return 'Falló';
      default:
        return status;
    }
  };

  const acceptedFileTypes = ['.pdf', '.docx', '.txt'];

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subir Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra y suelta archivos aquí
            </p>
            <p className="text-sm text-gray-500 mb-4">
              o{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
                disabled={uploading}
              >
                selecciona archivos
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Formatos soportados: PDF, DOCX, TXT (máx. 10MB)
            </p>
            
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Subiendo archivo...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documentos Subidos</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No hay documentos subidos aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-8 w-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {document.originalName}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatFileSize(document.size)}
                        </span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(document.status)}
                          <span className="text-sm text-gray-500">
                            {getStatusText(document.status)}
                          </span>
                        </div>
                        {document.embeddingStatus !== 'PENDING' && (
                          <div className="flex items-center gap-1">
                            {getStatusIcon(document.embeddingStatus)}
                            <span className="text-sm text-gray-500">
                              Embeddings: {getStatusText(document.embeddingStatus)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-gray-400">
                          {formatDate(document.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {document._count?.embeddings && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {document._count.embeddings} chunks
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
