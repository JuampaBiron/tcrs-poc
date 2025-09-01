// src/app/api/gl-coding/upload-excel/route.ts
import { NextRequest } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { FILE_UPLOAD, UPLOAD_ERRORS } from '@/constants';

// ✅ CONSISTENT: Inline Azure functions (same pattern as PDF)
const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials not configured');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return {
    client: BlobServiceClient.fromConnectionString(connectionString),
    containerName
  };
};

/**
 * ✅ CONSISTENT: Generate blob-friendly timestamp (same as PDF)
 */
function generateBlobFriendlyTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const millisecond = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}${month}${day}-${hour}${minute}${second}-${millisecond}`;
}

/**
 * ✅ CONSISTENT: Sanitize filename (same as PDF)
 */
function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function POST(request: NextRequest) {
  console.log('🚀 Excel Upload API hit!');
  
  try {
    const formData = await request.formData();
    const file = formData.get('excelFile') as File;
    const uploadType = formData.get('uploadType') as string || 'temp';
    const originalFileName = formData.get('originalFileName') as string;
    
    // Validation
    if (!file) {
      throw new ValidationError(UPLOAD_ERRORS.NO_FILE);
    }
    
    if (!originalFileName) {
      throw new ValidationError('Original filename is required');
    }
    
    // Validate file type using constants
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      throw new ValidationError(UPLOAD_ERRORS.INVALID_TYPE_EXCEL);
    }
    
    // Validate file size using constants
    if (file.size > FILE_UPLOAD.EXCEL.MAX_SIZE) {
      throw new ValidationError(UPLOAD_ERRORS.FILE_TOO_LARGE);
    }
    
    // ✅ CONSISTENT: Generate blob-friendly names (same pattern as PDF)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = generateBlobFriendlyTimestamp();
    const randomId = Math.random().toString(36).substr(2, 9);
    const sanitizedFileName = sanitizeFileName(originalFileName);
    
    // ✅ CONSISTENT: gl-coding path instead of invoices
    const blobName = `gl-coding/${year}/${month}/TEMP-${timestamp}_${sanitizedFileName}`;
    
    console.log(`📤 Uploading Excel: ${blobName}`);
    
    // Upload to Azure Blob Storage
    const { client: blobServiceClient, containerName } = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    await containerClient.createIfNotExists();
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type || FILE_UPLOAD.EXCEL.XLSX_MIME_TYPE,
        blobContentDisposition: `attachment; filename="${originalFileName}"`,
      },
      metadata: {
        uploadType: uploadType,
        originalFileName: originalFileName,
        uploadedAt: now.toISOString(),
        tempId: `${timestamp}_${randomId}`,
        status: 'temporary', // For cleanup
        year: year.toString(),
        month: month,
        contentType: 'gl-coding',
        purpose: 'gl-coding-data'
      },
    });
    
    const blobUrl = blockBlobClient.url;
    
    console.log(`✅ Excel uploaded successfully: ${blobUrl}`);
    console.log(`📋 Blob name for future reference: ${blobName}`);
    
    return createSuccessResponse({
      blobUrl,
      originalFileName: originalFileName,
      size: file.size,
      blobName, // ✅ CONSISTENT: Return actual blob name
      tempId: `${timestamp}_${randomId}`,
      year: year,
      month: parseInt(month),
    });
    
  } catch (error) {
    console.error('❌ Excel upload error:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }
    
    return createErrorResponse(
      new Error(`${UPLOAD_ERRORS.UPLOAD_FAILED}: ${(error as Error).message}`)
    );
  }
}