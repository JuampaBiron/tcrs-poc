// src/lib/azure-pdf-rename.ts - REFACTORED VERSION USING BLOB-UTILS
import {
  getBlobServiceClient,
  getContainerName,
  decodeBlobName,
  constructRenamedBlobPath,
  checkBlobExists,
  copyBlob,
  updateBlobMetadata,
  deleteBlob,
  validateRenameParameters
} from './blob-utils';

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
  console.log('🔄 Starting PDF rename process...');
  console.log(`📋 Input parameters:`);
  console.log(`   └── tempBlobName: "${tempBlobName}"`);
  console.log(`   └── requestId: "${requestId}"`);
  console.log(`   └── originalFileName: "${originalFileName}"`);
  
  try {
    // ✅ Step 1: Validate parameters
    validateRenameParameters(tempBlobName, requestId, originalFileName, 'PDF');
    
    // ✅ Step 2: Setup Azure clients
    const blobServiceClient = getBlobServiceClient();
    const containerName = getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log(`🗂️  Using container: "${containerName}"`);
    
    // ✅ Step 3: Decode blob name
    const decodedTempBlobName = decodeBlobName(tempBlobName);
    
    // ✅ Step 4: Construct new blob path
    const newBlobName = constructRenamedBlobPath(
      decodedTempBlobName,
      requestId,
      originalFileName,
      'invoices'
    );
    
    console.log(`🔄 Renaming PDF: ${decodedTempBlobName} → ${newBlobName}`);
    
    // ✅ Step 5: Get blob clients
    const sourceBlobClient = containerClient.getBlobClient(decodedTempBlobName);
    const targetBlobClient = containerClient.getBlobClient(newBlobName);
    
    console.log(`🔗 Blob client URLs:`);
    console.log(`   └── Source URL: ${sourceBlobClient.url}`);
    console.log(`   └── Target URL: ${targetBlobClient.url}`);
    
    // ✅ Step 6: Verify source exists and check target
    const sourceExists = await checkBlobExists(sourceBlobClient, 'source PDF');
    if (!sourceExists) {
      throw new Error(`Source PDF blob does not exist: ${decodedTempBlobName}`);
    }
    
    const targetExists = await checkBlobExists(targetBlobClient, 'target PDF');
    if (targetExists) {
      console.warn(`⚠️ Target PDF blob already exists and will be overwritten: ${newBlobName}`);
    }
    
    // ✅ Step 7: Copy blob to new location
    await copyBlob(sourceBlobClient, targetBlobClient);
    
    // ✅ Step 8: Verify target exists after copy
    console.log(`🔍 Verifying target PDF blob exists after copy...`);
    const targetExistsAfterCopy = await checkBlobExists(targetBlobClient, 'target PDF after copy');
    if (!targetExistsAfterCopy) {
      throw new Error('Target PDF blob verification failed after copy operation');
    }
    
    // ✅ Step 9: Update metadata
    await updateBlobMetadata(
      targetBlobClient,
      requestId,
      originalFileName,
      'rename',
      {
        renamedFrom: decodedTempBlobName,
        fileType: 'pdf'
      }
    );
    
    // ✅ Step 10: Delete source blob
    await deleteBlob(sourceBlobClient, 'source PDF');
    
    // ✅ Step 11: Final verification
    console.log(`🔍 Final verification...`);
    const sourceExistsAfterDelete = await checkBlobExists(sourceBlobClient, 'source PDF after delete');
    const finalTargetExists = await checkBlobExists(targetBlobClient, 'final target PDF');
    
    if (sourceExistsAfterDelete) {
      console.warn(`⚠️ Warning: Source PDF still exists after delete operation`);
    }
    
    if (!finalTargetExists) {
      throw new Error('Final target PDF verification failed');
    }
    
    const newBlobUrl = targetBlobClient.url;
    console.log(`✅ PDF rename operation completed successfully!`);
    console.log(`📋 Final details:`);
    console.log(`   └── New blob URL: ${newBlobUrl}`);
    console.log(`   └── Request ID: ${requestId}`);
    console.log(`   └── Operation: PDF rename completed`);
    
    return newBlobUrl;
    
  } catch (error) {
    console.error('❌ PDF rename operation failed!');
    console.error(`📋 Error details:`);
    console.error(`   └── Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   └── Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`   └── Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`📋 Operation context:`);
    console.error(`   └── tempBlobName: "${tempBlobName}"`);
    console.error(`   └── requestId: "${requestId}"`);
    console.error(`   └── originalFileName: "${originalFileName}"`);
    
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
  console.log('🔗 Starting PDF association process...');
  console.log(`📋 Input parameters:`);
  console.log(`   └── blobName: "${blobName}"`);
  console.log(`   └── requestId: "${requestId}"`);
  
  try {
    // ✅ Step 1: Basic validation
    if (!blobName || blobName.trim().length === 0) {
      throw new Error('blobName is required for PDF association');
    }
    
    if (!requestId || requestId.trim().length === 0) {
      throw new Error('requestId is required for PDF association');
    }
    
    // ✅ Step 2: Setup Azure clients
    const blobServiceClient = getBlobServiceClient();
    const containerName = getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log(`🗂️  Using container: "${containerName}"`);
    
    // ✅ Step 3: Decode blob name and get client
    const decodedBlobName = decodeBlobName(blobName);
    const blobClient = containerClient.getBlobClient(decodedBlobName);
    
    console.log(`🔗 Blob URL: ${blobClient.url}`);
    
    // ✅ Step 4: Verify blob exists
    const blobExists = await checkBlobExists(blobClient, 'PDF to associate');
    if (!blobExists) {
      throw new Error(`PDF blob does not exist: ${decodedBlobName}`);
    }
    
    // ✅ Step 5: Update metadata for association
    await updateBlobMetadata(
      blobClient,
      requestId,
      undefined, // No originalFileName for association
      'associate',
      {
        associationType: 'pdf',
        operation: 'associate'
      }
    );
    
    console.log(`✅ PDF associated with request ${requestId}: ${decodedBlobName}`);
    
  } catch (error) {
    console.error('❌ PDF association failed!');
    console.error(`📋 Error details:`);
    console.error(`   └── Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   └── Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`📋 Operation context:`);
    console.error(`   └── blobName: "${blobName}"`);
    console.error(`   └── requestId: "${requestId}"`);
    
    throw error;
  }
}

/**
 * Utility function to get PDF blob information
 * @param blobName - Blob name to inspect
 * @returns PDF blob information
 */
export async function getPdfBlobInfo(blobName: string): Promise<{
  exists: boolean;
  url?: string;
  metadata?: Record<string, string>;
  size?: number;
  lastModified?: Date;
}> {
  console.log(`🔍 Getting PDF blob information for: "${blobName}"`);
  
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerName = getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const decodedBlobName = decodeBlobName(blobName);
    const blobClient = containerClient.getBlobClient(decodedBlobName);
    
    const exists = await checkBlobExists(blobClient, 'PDF info');
    
    if (!exists) {
      return { exists: false };
    }
    
    // Get properties and metadata
    console.log(`📋 Retrieving PDF blob properties...`);
    const properties = await blobClient.getProperties();
    
    const info = {
      exists: true,
      url: blobClient.url,
      metadata: properties.metadata || {},
      size: properties.contentLength,
      lastModified: properties.lastModified
    };
    
    console.log(`📋 PDF blob information:`);
    console.log(`   └── URL: ${info.url}`);
    console.log(`   └── Size: ${info.size} bytes`);
    console.log(`   └── Last modified: ${info.lastModified}`);
    console.log(`   └── Metadata keys: [${Object.keys(info.metadata).join(', ')}]`);
    
    return info;
    
  } catch (error) {
    console.error('❌ Failed to get PDF blob information:', error);
    throw error;
  }
}