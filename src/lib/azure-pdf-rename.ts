// src/lib/azure-pdf-rename.ts
import { BlobServiceClient } from '@azure/storage-blob';

const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials not configured');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
};

/**
 * Renames a temporary PDF to its final name with request ID
 * @param tempBlobName - Current temporary blob name (e.g., "invoices/2025/08/TEMP-...")
 * @param requestId - Real request ID (e.g., "REQ-2025-001")
 * @param originalFileName - Original filename
 * @returns New blob URL
 */
export async function renamePdfWithRequestId(
  tempBlobName: string,
  requestId: string,
  originalFileName: string
): Promise<string> {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Extract year/month from temp path: "invoices/2025/08/TEMP-..."
    const pathParts = tempBlobName.split('/');
    const year = pathParts[1];
    const month = pathParts[2];
    
    // Create new blob name with request ID
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newBlobName = `invoices/${year}/${month}/${requestId}_${sanitizedFileName}`;
    
    console.log(`🔄 Renaming PDF: ${tempBlobName} → ${newBlobName}`);
    
    // Get source blob
    const sourceBlobClient = containerClient.getBlobClient(tempBlobName);
    const targetBlobClient = containerClient.getBlobClient(newBlobName);
    
    // Copy blob to new location
    const copyOperation = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
    await copyOperation.pollUntilDone();
    
    // Update metadata to mark as associated
    await targetBlobClient.setMetadata({
      status: 'associated',
      requestId: requestId,
      originalFileName: originalFileName,
      renamedAt: new Date().toISOString(),
    });
    
    // Delete old temporary blob
    await sourceBlobClient.delete();
    
    const newBlobUrl = targetBlobClient.url;
    console.log(`✅ PDF renamed successfully: ${newBlobUrl}`);
    
    return newBlobUrl;
    
  } catch (error) {
    console.error('❌ Failed to rename PDF:', error);
    throw new Error(`Failed to rename PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates PDF metadata without renaming (if you prefer to keep temp names)
 * @param blobName - Current blob name
 * @param requestId - Request ID to associate with
 */
export async function associatePdfWithRequest(
  blobName: string,
  requestId: string
): Promise<void> {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const blobClient = containerClient.getBlobClient(blobName);
    
    // Get existing metadata
    const properties = await blobClient.getProperties();
    const existingMetadata = properties.metadata || {};
    
    // Update metadata
    await blobClient.setMetadata({
      ...existingMetadata,
      status: 'associated',
      requestId: requestId,
      associatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ PDF associated with request ${requestId}: ${blobName}`);
    
  } catch (error) {
    console.error('❌ Failed to associate PDF with request:', error);
    throw error;
  }
}