// src/hooks/use-pdf-upload.ts
import { useState, useCallback } from 'react';
import { API_ROUTES, UPLOAD_ERRORS } from '@/constants';

interface UploadResult {
  blobUrl: string;
  originalFileName: string;
  size: number;
  blobName: string;
  tempId: string;    // ← AGREGAR
  year?: number;     // ← AGREGAR (opcional)
  month?: number;    // ← AGREGAR (opcional)
}

interface UsePdfUploadReturn {
  uploadPdf: (file: File, context?: string) => Promise<UploadResult>; // ← Cambiar requestId por context opcional
  uploading: boolean;
  error: string | null;
  progress: number;
  clearError: () => void;
}

export function usePdfUpload(): UsePdfUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadPdf = useCallback(async (file: File, context: string = 'direct'): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', context); // ← CAMBIAR de requestId a context

      console.log('🔄 Uploading PDF to Azure Blob Storage...');

      const response = await fetch(API_ROUTES.UPLOAD_PDF, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || UPLOAD_ERRORS.UPLOAD_FAILED);
      }

      console.log('✅ PDF upload successful:', result.blobUrl);
      
      return {
        blobUrl: result.blobUrl,
        originalFileName: result.originalFileName,
        size: result.size,
        blobName: result.blobName,
        tempId: result.tempId || Date.now().toString(), // ← AGREGAR con fallback
        year: result.year,     // ← AGREGAR
        month: result.month,   // ← AGREGAR
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : UPLOAD_ERRORS.UPLOAD_FAILED;
      console.error('❌ PDF upload failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return {
    uploadPdf,
    uploading,
    error,
    progress,
    clearError,
  };
}