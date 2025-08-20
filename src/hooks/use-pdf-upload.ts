// src/hooks/use-pdf-upload.ts
import { useState, useCallback } from 'react';
import { API_ROUTES, UPLOAD_ERRORS } from '@/constants';

interface UploadResult {
  blobUrl: string;
  originalFileName: string;
  size: number;
  blobName: string;
}

interface UsePdfUploadReturn {
  uploadPdf: (file: File, requestId: string) => Promise<UploadResult>;
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

  const uploadPdf = useCallback(async (file: File, requestId: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('requestId', requestId);

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
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : UPLOAD_ERRORS.UPLOAD_FAILED;
      console.error('❌ PDF upload failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      // Reset progress after a short delay
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