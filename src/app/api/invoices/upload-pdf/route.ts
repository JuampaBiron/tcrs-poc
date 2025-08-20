// src/app/api/invoices/upload-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { FILE_UPLOAD, UPLOAD_ERRORS } from '@/constants';

// Azure Blob Storage client
const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials not configured');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
};

export async function POST(request: NextRequest) {
  console.log('🚀 PDF Upload API hit!');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const context = formData.get('context') as string || 'direct'; // ← CAMBIAR requestId por context
    
    // Validation
    if (!file) {
      throw new ValidationError(UPLOAD_ERRORS.NO_FILE);
    }
    
    // Validate file type
    if (file.type !== FILE_UPLOAD.PDF.MIME_TYPE) {
      throw new ValidationError(UPLOAD_ERRORS.INVALID_TYPE);
    }
    
    // Validate file size
    if (file.size > FILE_UPLOAD.PDF.MAX_SIZE) {
      throw new ValidationError(UPLOAD_ERRORS.FILE_TOO_LARGE);
    }
    
    // Generate unique blob name (simple approach)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substr(2, 9);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `invoices/${timestamp}_${randomId}_${sanitizedFileName}`;
    
    console.log(`📤 Uploading PDF: ${blobName}`);
    
    // Upload to Azure Blob Storage
    const blobServiceClient = getBlobServiceClient();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists (private by default)
    await containerClient.createIfNotExists();
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload with metadata
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
        blobContentDisposition: `attachment; filename="${file.name}"`,
      },
      metadata: {
        context: context,                    // ← CAMBIAR de requestId
        originalFileName: file.name,
        uploadedAt: new Date().toISOString(),
        tempId: `${timestamp}_${randomId}`,  // ← AGREGAR tempId
      },
    });
    
    const blobUrl = blockBlobClient.url;
    
    console.log(`✅ PDF uploaded successfully: ${blobUrl}`);
    
    return createSuccessResponse({
      blobUrl,
      originalFileName: file.name,
      size: file.size,
      blobName,
      tempId: `${timestamp}_${randomId}`, // ← AGREGAR tempId en respuesta
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