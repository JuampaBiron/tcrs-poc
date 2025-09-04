// src/hooks/use-excel-upload.ts
"use client";

import { useState } from 'react';
import { API_ROUTES, FILE_UPLOAD, UPLOAD_ERRORS } from '@/constants';

interface ExcelUploadResult {
  blobUrl: string;
  blobName: string;
  originalFileName: string;
  tempId: string;
  year?: number;
  month?: number;
}

interface UseExcelUploadReturn {
  uploadExcel: (file: File, uploadType?: 'direct' | 'temp', company?: string, branch?: string) => Promise<ExcelUploadResult>;
  uploading: boolean;
  error: string | null;
  progress: number;
  clearError: () => void;
}

export function useExcelUpload(): UseExcelUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const clearError = () => {
    setError(null);
  };

  const uploadExcel = async (file: File, uploadType: 'direct' | 'temp' = 'temp', company?: string, branch?: string): Promise<ExcelUploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Client-side validation using constants
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        throw new Error(UPLOAD_ERRORS.INVALID_TYPE_EXCEL);
      }

      if (file.size > FILE_UPLOAD.EXCEL.MAX_SIZE) {
        throw new Error(UPLOAD_ERRORS.FILE_TOO_LARGE);
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      console.log('🔄 Starting Excel upload:', {
        fileName: file.name,
        fileSize: file.size,
        uploadType
      });

      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('uploadType', uploadType);
      formData.append('originalFileName', file.name);
      
      // Add company and branch if provided
      if (company) {
        formData.append('company', company);
      }
      if (branch) {
        formData.append('branch', branch);
      }

      const response = await fetch(API_ROUTES.UPLOAD_EXCEL, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Better error handling for empty or invalid responses
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText);
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('📄 Response text that failed to parse:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(result.error || UPLOAD_ERRORS.UPLOAD_FAILED);
      }

      console.log('✅ Excel upload successful:', result.data?.blobUrl);

      return {
        blobUrl: result.data.blobUrl,
        blobName: result.data.blobName,
        originalFileName: result.data.originalFileName,
        tempId: result.data.tempId || Date.now().toString(),
        year: result.data.year,
        month: result.data.month
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : UPLOAD_ERRORS.UPLOAD_FAILED;
      console.error('❌ Excel upload failed:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadExcel,
    uploading,
    error,
    progress,
    clearError
  };
}