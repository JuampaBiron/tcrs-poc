// src/lib/azure-excel-rename.ts - REFACTORED VERSION USING BLOB-UTILS
import {
  getBlobServiceClient,
  getContainerName,
  decodeBlobName,
  constructRenamedBlobPath,
  checkBlobExists,
  copyBlob,
  updateBlobMetadata,
  deleteBlob,
  validateRenameParameters,
  extractBlobNameFromUrl
} from './blob-utils';

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
  console.log('🔄 Starting Excel rename process...');
  console.log(`📋 Input parameters:`);
  console.log(`   └── tempBlobName: "${tempBlobName}"`);
  console.log(`   └── requestId: "${requestId}"`);
  console.log(`   └── originalFileName: "${originalFileName}"`);
  
  try {
    // ✅ Step 1: Validate parameters
    validateRenameParameters(tempBlobName, requestId, originalFileName, 'Excel');
    
    // ✅ Step 2: Setup Azure clients
    const blobServiceClient = getBlobServiceClient();
    const containerName = getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log(`🗂️  Using container: "${containerName}"`);
    
    // ✅ Step 3: Decode blob name
    const decodedTempBlobName = decodeBlobName(tempBlobName);
    
    // ✅ Step 4: Construct new blob path for GL Coding Excel files
    const newBlobName = constructRenamedBlobPath(
      decodedTempBlobName,
      requestId,
      originalFileName,
      'gl-coding' // Different path type for Excel files
    );
    
    console.log(`🔄 Renaming Excel: ${decodedTempBlobName} → ${newBlobName}`);
    
    // ✅ Step 5: Get blob clients
    const sourceBlobClient = containerClient.getBlobClient(decodedTempBlobName);
    const targetBlobClient = containerClient.getBlobClient(newBlobName);
    
    console.log(`🔗 Blob client URLs:`);
    console.log(`   └── Source URL: ${sourceBlobClient.url}`);
    console.log(`   └── Target URL: ${targetBlobClient.url}`);
    
    // ✅ Step 6: Verify source exists and check target
    const sourceExists = await checkBlobExists(sourceBlobClient, 'source Excel');
    if (!sourceExists) {
      throw new Error(`Source Excel blob does not exist: ${decodedTempBlobName}`);
    }
    
    const targetExists = await checkBlobExists(targetBlobClient, 'target Excel');
    if (targetExists) {
      console.warn(`⚠️ Target Excel blob already exists and will be overwritten: ${newBlobName}`);
    }
    
    // ✅ Step 7: Copy blob to new location
    await copyBlob(sourceBlobClient, targetBlobClient);
    
    // ✅ Step 8: Verify target exists after copy
    console.log(`🔍 Verifying target Excel blob exists after copy...`);
    const targetExistsAfterCopy = await checkBlobExists(targetBlobClient, 'target Excel after copy');
    if (!targetExistsAfterCopy) {
      throw new Error('Target Excel blob verification failed after copy operation');
    }
    
    // ✅ Step 9: Update metadata with GL Coding specific information
    await updateBlobMetadata(
      targetBlobClient,
      requestId,
      originalFileName,
      'rename',
      {
        renamedFrom: decodedTempBlobName,
        fileType: 'excel',
        contentType: 'gl-coding',
        purpose: 'gl-coding-data'
      }
    );
    
    // ✅ Step 10: Delete source blob
    await deleteBlob(sourceBlobClient, 'source Excel');
    
    // ✅ Step 11: Final verification
    console.log(`🔍 Final verification...`);
    const sourceExistsAfterDelete = await checkBlobExists(sourceBlobClient, 'source Excel after delete');
    const finalTargetExists = await checkBlobExists(targetBlobClient, 'final target Excel');
    
    if (sourceExistsAfterDelete) {
      console.warn(`⚠️ Warning: Source Excel still exists after delete operation`);
    }
    
    if (!finalTargetExists) {
      throw new Error('Final target Excel verification failed');
    }
    
    const newBlobUrl = targetBlobClient.url;
    console.log(`✅ Excel rename operation completed successfully!`);
    console.log(`📋 Final details:`);
    console.log(`   └── New blob URL: ${newBlobUrl}`);
    console.log(`   └── Request ID: ${requestId}`);
    console.log(`   └── Operation: Excel GL Coding rename completed`);
    
    return newBlobUrl;
    
  } catch (error) {
    console.error('❌ Excel rename operation failed!');
    console.error(`📋 Error details:`);
    console.error(`   └── Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`   └── Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`   └── Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`📋 Operation context:`);
    console.error(`   └── tempBlobName: "${tempBlobName}"`);
    console.error(`   └── requestId: "${requestId}"`);
    console.error(`   └── originalFileName: "${originalFileName}"`);
    
    throw new Error(`Failed to rename Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Associates an Excel file with a request without renaming
 * @param blobName - Current blob name
 * @param requestId - Request ID to associate with
 */
export async function associateExcelWithRequest(
  blobName: string,
  requestId: string
): Promise<void> {
  console.log('🔗 Starting Excel association process...');
  console.log(`📋 Input parameters:`);
  console.log(`   └── blobName: "${blobName}"`);
  console.log(`   └── requestId: "${requestId}"`);
  
  try {
    // ✅ Step 1: Basic validation
    if (!blobName || blobName.trim().length === 0) {
      throw new Error('blobName is required for Excel association');
    }
    
    if (!requestId || requestId.trim().length === 0) {
      throw new Error('requestId is required for Excel association');
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
    const blobExists = await checkBlobExists(blobClient, 'Excel to associate');
    if (!blobExists) {
      throw new Error(`Excel blob does not exist: ${decodedBlobName}`);
    }
    
    // ✅ Step 5: Update metadata for association
    await updateBlobMetadata(
      blobClient,
      requestId,
      undefined, // No originalFileName for association
      'associate',
      {
        associationType: 'excel',
        contentType: 'gl-coding',
        purpose: 'gl-coding-data',
        operation: 'associate'
      }
    );
    
    console.log(`✅ Excel associated with request ${requestId}: ${decodedBlobName}`);
    
  } catch (error) {
    console.error('❌ Excel association failed!');
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
 * Utility function to get Excel blob information
 * @param blobName - Blob name to inspect
 * @returns Excel blob information including GL Coding specific data
 */
export async function getExcelBlobInfo(blobName: string): Promise<{
  exists: boolean;
  url?: string;
  metadata?: Record<string, string>;
  size?: number;
  lastModified?: Date;
  glCodingInfo?: {
    entriesCount?: number;
    totalAmount?: number;
    purpose?: string;
  };
}> {
  console.log(`🔍 Getting Excel blob information for: "${blobName}"`);
  
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerName = getContainerName();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const decodedBlobName = decodeBlobName(blobName);
    const blobClient = containerClient.getBlobClient(decodedBlobName);
    
    const exists = await checkBlobExists(blobClient, 'Excel info');
    
    if (!exists) {
      return { exists: false };
    }
    
    // Get properties and metadata
    console.log(`📋 Retrieving Excel blob properties...`);
    const properties = await blobClient.getProperties();
    
    const metadata = properties.metadata || {};
    
    // Extract GL Coding specific information from metadata
    const glCodingInfo = {
      entriesCount: metadata.entriesCount ? parseInt(metadata.entriesCount, 10) : undefined,
      totalAmount: metadata.totalAmount ? parseFloat(metadata.totalAmount) : undefined,
      purpose: metadata.purpose || metadata.contentType
    };
    
    const info = {
      exists: true,
      url: blobClient.url,
      metadata,
      size: properties.contentLength,
      lastModified: properties.lastModified,
      glCodingInfo
    };
    
    console.log(`📋 Excel blob information:`);
    console.log(`   └── URL: ${info.url}`);
    console.log(`   └── Size: ${info.size} bytes`);
    console.log(`   └── Last modified: ${info.lastModified}`);
    console.log(`   └── Metadata keys: [${Object.keys(info.metadata).join(', ')}]`);
    console.log(`   └── GL Coding entries: ${glCodingInfo.entriesCount || 'unknown'}`);
    console.log(`   └── GL Coding total: $${glCodingInfo.totalAmount || 'unknown'}`);
    
    return info;
    
  } catch (error) {
    console.error('❌ Failed to get Excel blob information:', error);
    throw error;
  }
}

/**
 * Re-export the utility function for backward compatibility
 * This function was originally defined in this file
 */
export { extractBlobNameFromUrl };

/**
 * Processes GL Coding Excel data and extracts summary information
 * @param blobName - Excel blob name to process
 * @returns Summary information about GL Coding entries
 */
export async function processGLCodingExcelSummary(blobName: string): Promise<{
  totalEntries: number;
  totalAmount: number;
  accountCodes: string[];
  facilityCodes: string[];
  isValid: boolean;
  validationErrors: string[];
}> {
  console.log(`📊 Processing GL Coding Excel summary for: "${blobName}"`);
  
  try {
    const blobInfo = await getExcelBlobInfo(blobName);
    
    if (!blobInfo.exists) {
      throw new Error(`Excel blob does not exist: ${blobName}`);
    }
    
    const metadata = blobInfo.metadata || {};
    
    // Extract summary from metadata (populated during upload)
    const summary = {
      totalEntries: metadata.entriesCount ? parseInt(metadata.entriesCount, 10) : 0,
      totalAmount: metadata.totalAmount ? parseFloat(metadata.totalAmount) : 0,
      accountCodes: [] as string[], // Would need to be populated during upload processing
      facilityCodes: [] as string[], // Would need to be populated during upload processing
      isValid: true,
      validationErrors: [] as string[]
    };
    
    // Basic validation
    if (summary.totalEntries === 0) {
      summary.isValid = false;
      summary.validationErrors.push('No GL Coding entries found in Excel file');
    }
    
    if (summary.totalAmount <= 0) {
      summary.isValid = false;
      summary.validationErrors.push('Total amount must be greater than zero');
    }
    
    console.log(`📊 GL Coding summary:`);
    console.log(`   └── Total entries: ${summary.totalEntries}`);
    console.log(`   └── Total amount: $${summary.totalAmount.toFixed(2)}`);
    console.log(`   └── Is valid: ${summary.isValid ? '✅' : '❌'}`);
    
    if (summary.validationErrors.length > 0) {
      console.log(`   └── Validation errors: ${summary.validationErrors.length}`);
      summary.validationErrors.forEach(error => {
        console.log(`      └── ${error}`);
      });
    }
    
    return summary;
    
  } catch (error) {
    console.error('❌ Failed to process GL Coding Excel summary:', error);
    throw error;
  }
}