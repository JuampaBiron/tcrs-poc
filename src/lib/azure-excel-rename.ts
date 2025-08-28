// src/lib/azure-excel-rename.ts
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
 * Renames a temporary Excel file to its final name with request ID
 * @param tempBlobName - Current temporary blob name (e.g., "gl-coding/2025/08/TEMP-...")
 * @param requestId - Real request ID (e.g., "REQ-2025-001")
 * @param originalFileName - Original filename
 * @returns New blob URL
 */
export async function renameExcelWithRequestId(
  tempBlobName: string,
  requestId: string,
  originalFileName: string
): Promise<string> {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // ✅ Decode URL-encoded blob name
    const decodedTempBlobName = decodeURIComponent(tempBlobName);
    console.log(`🔍 Original Excel blob name: ${tempBlobName}`);
    console.log(`🔍 Decoded Excel blob name: ${decodedTempBlobName}`);
    
    // Extract year/month from temp path: "gl-coding/2025/08/TEMP-..."
    const pathParts = decodedTempBlobName.split('/');
    const year = pathParts[1];
    const month = pathParts[2];
    
    // Create new blob name with request ID - sanitize filename
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newBlobName = `gl-coding/${year}/${month}/${requestId}_${sanitizedFileName}`;
    
    console.log(`🔄 Renaming Excel: ${decodedTempBlobName} → ${newBlobName}`);
    
    // ✅ Use decoded blob name for source
    const sourceBlobClient = containerClient.getBlobClient(decodedTempBlobName);
    const targetBlobClient = containerClient.getBlobClient(newBlobName);
    
    // ✅ Check if source blob exists before attempting copy
    const sourceExists = await sourceBlobClient.exists();
    if (!sourceExists) {
      console.error(`❌ Source Excel blob not found: ${decodedTempBlobName}`);
      throw new Error(`Source Excel file not found: ${decodedTempBlobName}`);
    }
    
    // ✅ Copy blob to new location with request ID
    const copyOperation = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
    await copyOperation.pollUntilDone();
    
    // ✅ Verify the copy was successful
    const targetExists = await targetBlobClient.exists();
    if (!targetExists) {
      throw new Error('Excel file copy operation failed');
    }
    
    // ✅ Delete the temporary blob
    await sourceBlobClient.delete();
    console.log(`✅ Excel renamed successfully: ${newBlobName}`);
    
    // ✅ Return the new blob URL
    const newBlobUrl = targetBlobClient.url;
    return newBlobUrl;
    
  } catch (error) {
    console.error('❌ Error renaming Excel file:', error);
    throw new Error(`Failed to rename Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility function to extract blob name from full URL
 * @param blobUrl - Full blob URL
 * @returns Blob name only
 */
export function extractBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    // Remove the leading slash and container name
    const pathParts = url.pathname.split('/');
    // Skip empty first element and container name, return the rest
    return pathParts.slice(2).join('/');
  } catch (error) {
    console.error('Error extracting blob name from URL:', error);
    // Fallback: return the URL as-is if parsing fails
    return blobUrl;
  }
}