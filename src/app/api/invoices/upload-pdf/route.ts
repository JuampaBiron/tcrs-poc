// src/app/api/invoices/upload-pdf/route.ts - HIERARCHICAL VERSION
import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { FILE_UPLOAD, UPLOAD_ERRORS } from '@/constants';
import { generateTempBlobPath } from '@/lib/blob-path-generator';

// Azure Blob Storage client
const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices';
  
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
 * ✅ IMPROVED: Generate blob-friendly timestamp without special characters
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
  
  // Format: YYYYMMDD-HHMMSS-mmm (blob-friendly, no special chars)
  return `${year}${month}${day}-${hour}${minute}${second}-${millisecond}`;
}

/**
 * ✅ IMPROVED: Sanitize filename to be blob-friendly
 */
function sanitizeFileName(fileName: string): string {
  // Replace problematic characters with underscores
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function POST(request: NextRequest) {
  console.log('🚀 PDF Upload API hit!');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context = formData.get('context') as string || 'direct';
    const company = formData.get('company') as string || 'finning-ca';
    const branch = formData.get('branch') as string || 'default';
    
    console.log(`📋 Upload parameters - Company: "${company}", Branch: "${branch}"`);
    
    // Validation
    if (!file) {
      throw new ValidationError(UPLOAD_ERRORS.NO_FILE);
    }
    
    if (file.type !== FILE_UPLOAD.PDF.MIME_TYPE) {
      throw new ValidationError(UPLOAD_ERRORS.INVALID_TYPE_PDF);
    }
    
    if (file.size > FILE_UPLOAD.PDF.MAX_SIZE) {
      throw new ValidationError(UPLOAD_ERRORS.FILE_TOO_LARGE);
    }
    
    if (!company) {
      throw new ValidationError('Company information is required');
    }
    
    if (!branch) {
      throw new ValidationError('Branch information is required');
    }
    
    // ✅ HIERARCHICAL: Generate hierarchical blob path using new structure
    const now = new Date();
    const timestamp = generateBlobFriendlyTimestamp(); // No special characters
    const randomId = Math.random().toString(36).substr(2, 9);
    const tempId = `TEMP-${timestamp}-${randomId}`;
    const sanitizedFileName = sanitizeFileName(file.name);
    
    // Use new hierarchical structure: temp/{company}/{branch}/{year}/{month}/{tempId}/{fileName}
    const blobName = generateTempBlobPath({
      company,
      branch,
      fileName: sanitizedFileName,
      tempId,
      createdDate: now
    });
    
    console.log(`📤 Uploading PDF: ${blobName}`);
    
    // Upload to Azure Blob Storage
    const { client: blobServiceClient, containerName } = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    await containerClient.createIfNotExists();
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
        blobContentDisposition: `attachment; filename="${file.name}"`,
      },
      metadata: {
        context: context,
        originalFileName: file.name,
        uploadedAt: now.toISOString(),
        tempId,
        status: 'temporary', // For cleanup
        company,
        branch,
      },
    });
    
    const blobUrl = blockBlobClient.url;
    
    console.log(`✅ PDF uploaded successfully: ${blobUrl}`);
    console.log(`📋 Blob name for future reference: ${blobName}`);
    
    return createSuccessResponse({
      blobUrl,
      originalFileName: file.name,
      size: file.size,
      blobName, // ✅ HIERARCHICAL: Return hierarchical blob name
      tempId,
      company,
      branch,
    });
    
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error);
    }
    
    return createErrorResponse(
      new Error(`${UPLOAD_ERRORS.UPLOAD_FAILED}: ${(error as Error).message}`)
    );
  }
}