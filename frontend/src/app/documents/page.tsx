'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import DocumentUpload from '@/components/documents/DocumentUpload';
import api from '@/lib/api';
import { Document } from '@/types';

export default function DocumentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated && !isLoading) {
      void api
        .get('/documents')
        .then((response) => {
          if (isMounted) {
            setDocuments(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching documents:', error);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Documentos
          </h1>
          <p className="text-gray-600">
            Sube documentos para que SupportMind AI pueda usarlos como contexto en las respuestas
          </p>
        </div>

        <DocumentUpload
          documents={documents}
          onDocumentsChange={fetchDocuments}
        />
      </main>
    </div>
  );
}
