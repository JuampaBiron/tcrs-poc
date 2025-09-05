// src/lib/blob-utils.ts - CENTRALIZED AZURE BLOB UTILITIES
import { BlobServiceClient, BlobClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { 
  generateOptimizedBlobPath, 
  generateTempBlobPath, 
  convertTempToFinalPath,
  parseBlobPath,
  getRequestFilePaths,
  type BlobPathConfig,
  type TempBlobPathConfig 
} from './blob-path-generator';

// ========================================
// AZURE BLOB SERVICE CLIENT
// ========================================

/**
 * Creates and returns Azure Blob Service Client
 * @returns BlobServiceClient instance
 */
export const getBlobServiceClient = (): BlobServiceClient => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials not configured');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
};

/**
 * Gets the container name from environment variables
 * @returns Container name
 */
export const getContainerName = (): string => {
  return process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
};

/**
 * Ensures container exists, creates it if it doesn't
 * @param containerName - Name of the container to ensure exists
 * @returns Container client
 */
export async function ensureContainerExists(containerName?: string): Promise<import('@azure/storage-blob').ContainerClient> {
  const blobServiceClient = getBlobServiceClient();
  const actualContainerName = containerName || getContainerName();
  const containerClient = blobServiceClient.getContainerClient(actualContainerName);
  
  console.log(`🔍 Checking if container exists: "${actualContainerName}"`);
  
  try {
    // Check if container exists
    const exists = await containerClient.exists();
    
    if (exists) {
      console.log(`✅ Container "${actualContainerName}" exists`);
      return containerClient;
    }
    
    console.log(`🆕 Container "${actualContainerName}" does not exist, creating...`);
    
    // Create container with appropriate access level
    await containerClient.create({
      access: 'blob' // Allow blob-level public read access
    });
    
    console.log(`✅ Container "${actualContainerName}" created successfully`);
    
    // Set container metadata for tracking
    await containerClient.setMetadata({
      purpose: 'tcrs-approval-system',
      createdBy: 'tcrs-system',
      createdDate: new Date().toISOString(),
      version: '1.0'
    });
    
    console.log(`📋 Container metadata set successfully`);
    
    return containerClient;
    
  } catch (error) {
    console.error(`❌ Failed to ensure container "${actualContainerName}" exists:`, error);
    
    // Check if it's a permissions error
    if (error && typeof error === 'object' && 'code' in error) {
      const azureError = error as any;
      
      switch (azureError.code) {
        case 'AuthorizationFailure':
          throw new Error(`Authorization failed for container "${actualContainerName}". Check Azure Storage credentials and permissions.`);
        case 'ContainerAlreadyExists':
          console.log(`ℹ️ Container "${actualContainerName}" was created by another process, continuing...`);
          return containerClient;
        case 'AccountNotFound':
          throw new Error(`Azure Storage account not found. Check AZURE_STORAGE_ACCOUNT_NAME configuration.`);
        default:
          throw new Error(`Failed to create container "${actualContainerName}": ${azureError.message || 'Unknown Azure error'}`);
      }
    }
    
    throw new Error(`Failed to ensure container exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets container client with automatic creation if it doesn't exist
 * @param containerName - Optional container name (uses default if not provided)
 * @returns Container client
 */
export async function getContainerClient(containerName?: string): Promise<import('@azure/storage-blob').ContainerClient> {
  return await ensureContainerExists(containerName);
}

// ========================================
// URL & BLOB NAME UTILITIES
// ========================================

/**
 * Extracts blob name from a full Azure Blob URL
 * @param blobUrl - Full blob URL (e.g., "https://storage.blob.core.windows.net/container/path/file.pdf")
 * @returns Blob name without container (e.g., "path/file.pdf")
 */
export function extractBlobNameFromUrl(blobUrl: string): string {
  console.log(`🔍 Extracting blob name from URL: "${blobUrl}"`);
  
  try {
    const url = new URL(blobUrl);
    
    // URL pathname format: /container-name/path/to/file.ext
    const pathParts = url.pathname.split('/');
    console.log(`📋 URL path parts: [${pathParts.join(', ')}]`);
    
    // Skip empty first element and container name, return the rest
    const blobName = pathParts.slice(2).join('/');
    console.log(`✅ Extracted blob name: "${blobName}"`);
    
    if (!blobName) {
      throw new Error('Could not extract blob name from URL path');
    }
    
    return blobName;
    
  } catch (error) {
    console.error('❌ Error extracting blob name from URL:', error);
    console.error(`📋 URL that failed: "${blobUrl}"`);
    
    // Fallback: return the URL as-is if parsing fails
    console.warn('⚠️ Using fallback: returning URL as blob name');
    return blobUrl;
  }
}

/**
 * Decodes URL-encoded blob name and logs the process
 * @param blobName - Potentially URL-encoded blob name
 * @returns Decoded blob name
 */
export function decodeBlobName(blobName: string): string {
  const decoded = decodeURIComponent(blobName);
  const needsDecoding = blobName !== decoded;
  
  console.log(`🔍 Blob name decoding:`);
  console.log(`   └── Original: "${blobName}"`);
  console.log(`   └── Decoded: "${decoded}"`);
  console.log(`   └── Needs decoding: ${needsDecoding ? 'Yes' : 'No'}`);
  
  return decoded;
}

// ========================================
// FILE NAME UTILITIES
// ========================================

/**
 * Sanitizes filename to be blob-friendly by replacing problematic characters
 * @param fileName - Original filename
 * @returns Sanitized filename safe for Azure Blob storage
 */
export function sanitizeFileName(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const needsSanitization = fileName !== sanitized;
  
  console.log(`🧹 Filename sanitization:`);
  console.log(`   └── Original: "${fileName}"`);
  console.log(`   └── Sanitized: "${sanitized}"`);
  console.log(`   └── Needs sanitization: ${needsSanitization ? 'Yes' : 'No'}`);
  
  return sanitized;
}

/**
 * Generates blob-friendly timestamp without special characters
 * @returns Timestamp string in format YYYYMMDD-HHMMSS-mmm
 */
export function generateBlobFriendlyTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const millisecond = String(now.getMilliseconds()).padStart(3, '0');
  
  // Format: YYYYMMDD-HHMMSS-mmm (blob-friendly, no special chars)
  const timestamp = `${year}${month}${day}-${hour}${minute}${second}-${millisecond}`;
  
  console.log(`⏰ Generated blob-friendly timestamp: "${timestamp}"`);
  return timestamp;
}

// ========================================
// PATH UTILITIES
// ========================================

/**
 * Extracts year and month from a blob path
 * @param blobName - Blob name with path (e.g., "invoices/2025/08/file.pdf")
 * @returns Object with year and month, or null if not extractable
 */
export function extractDateFromBlobPath(blobName: string): { year: string; month: string } | null {
  console.log(`📅 Extracting date from blob path: "${blobName}"`);
  
  try {
    const pathParts = blobName.split('/');
    console.log(`📋 Path parts: [${pathParts.join(', ')}]`);
    
    // Expected format: "type/YYYY/MM/filename" (e.g., "invoices/2025/08/file.pdf")
    if (pathParts.length >= 3) {
      const year = pathParts[1];
      const month = pathParts[2];
      
      // Validate year and month format
      if (/^\d{4}$/.test(year) && /^\d{2}$/.test(month)) {
        console.log(`✅ Extracted date: Year="${year}", Month="${month}"`);
        return { year, month };
      }
    }
    
    console.warn('⚠️ Could not extract valid date from blob path');
    return null;
    
  } catch (error) {
    console.error('❌ Error extracting date from blob path:', error);
    return null;
  }
}

/**
 * Constructs a new blob path with request ID
 * @param originalPath - Original blob path (e.g., "invoices/2025/08/TEMP-...")
 * @param requestId - Request ID to include in filename
 * @param fileName - Final filename
 * @param pathType - Type of path (e.g., "invoices", "gl-coding")
 * @returns New blob path
 */
export function constructRenamedBlobPath(
  originalPath: string,
  requestId: string,
  fileName: string,
  pathType: string = 'invoices'
): string {
  console.log(`🏗️ Constructing renamed blob path:`);
  console.log(`   └── Original path: "${originalPath}"`);
  console.log(`   └── Request ID: "${requestId}"`);
  console.log(`   └── Filename: "${fileName}"`);
  console.log(`   └── Path type: "${pathType}"`);
  
  let dateInfo = extractDateFromBlobPath(originalPath);
  
  if (!dateInfo) {
    console.warn('⚠️ Could not extract date info, using current date');
    const now = new Date();
    dateInfo = {
      year: now.getFullYear().toString(),
      month: String(now.getMonth() + 1).padStart(2, '0')
    };
  }
  
  const sanitizedFileName = sanitizeFileName(fileName);
  const newBlobPath = `${pathType}/${dateInfo.year}/${dateInfo.month}/${requestId}_${sanitizedFileName}`;
  
  console.log(`✅ Constructed new blob path: "${newBlobPath}"`);
  return newBlobPath;
}

// ========================================
// BLOB OPERATIONS
// ========================================

/**
 * Checks if a blob exists in Azure Storage
 * @param blobClient - Azure BlobClient instance
 * @param description - Description for logging (e.g., "source", "target")
 * @returns Promise<boolean>
 */
export async function checkBlobExists(blobClient: BlobClient, description: string = 'blob'): Promise<boolean> {
  console.log(`🔍 Checking if ${description} blob exists...`);
  console.log(`   └── Blob URL: ${blobClient.url}`);
  
  try {
    const exists = await blobClient.exists();
    console.log(`   └── ${description} exists: ${exists ? '✅ Yes' : '❌ No'}`);
    return exists;
    
  } catch (error) {
    console.error(`❌ Error checking if ${description} blob exists:`, error);
    return false;
  }
}

/**
 * Copies a blob from source to target location
 * @param sourceBlobClient - Source blob client
 * @param targetBlobClient - Target blob client
 * @returns Promise<void>
 */
export async function copyBlob(sourceBlobClient: BlobClient, targetBlobClient: BlobClient): Promise<void> {
  console.log(`📋 Starting blob copy operation...`);
  console.log(`   └── Source: ${sourceBlobClient.url}`);
  console.log(`   └── Target: ${targetBlobClient.url}`);
  
  const copyStartTime = Date.now();
  
  try {
    // Start copy operation
    console.log(`⏳ Initiating copy operation...`);
    const copyOperation = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
    
    // Wait for completion
    console.log(`⏳ Waiting for copy operation to complete...`);
    await copyOperation.pollUntilDone();
    
    const copyDuration = Date.now() - copyStartTime;
    console.log(`📋 Copy operation completed in ${copyDuration}ms`);
    
    // Verify copy result
    const copyResult = copyOperation.getResult();
    console.log(`📊 Copy result:`);
    console.log(`   └── Status: ${copyResult?.copyStatus || 'unknown'}`);
    console.log(`   └── Copy ID: ${copyResult?.copyId || 'N/A'}`);
    
    if (copyResult?.copyStatus !== 'success') {
      throw new Error(`Copy operation failed with status: ${copyResult?.copyStatus}`);
    }
    
    console.log(`✅ Blob copied successfully`);
    
  } catch (error) {
    const copyDuration = Date.now() - copyStartTime;
    console.error(`❌ Blob copy failed after ${copyDuration}ms:`, error);
    throw error;
  }
}

/**
 * Updates blob metadata with request association information
 * @param blobClient - Blob client to update
 * @param requestId - Request ID to associate
 * @param originalFileName - Original filename
 * @param operation - Type of operation (e.g., "rename", "associate")
 * @param additionalMetadata - Additional metadata to include
 */
export async function updateBlobMetadata(
  blobClient: BlobClient,
  requestId: string,
  originalFileName?: string,
  operation: string = 'associate',
  additionalMetadata: Record<string, string> = {}
): Promise<void> {
  console.log(`🏷️ Updating blob metadata...`);
  console.log(`   └── Blob URL: ${blobClient.url}`);
  console.log(`   └── Request ID: "${requestId}"`);
  console.log(`   └── Operation: "${operation}"`);
  
  try {
    // Get existing metadata if available
    let existingMetadata: Record<string, string> = {};
    
    try {
      const properties = await blobClient.getProperties();
      existingMetadata = properties.metadata || {};
      console.log(`📝 Found existing metadata: ${Object.keys(existingMetadata).length} keys`);
    } catch (error) {
      console.log(`📝 No existing metadata found (this is normal for new blobs)`);
    }
    
    // Prepare new metadata
    const newMetadata = {
      ...existingMetadata,
      status: 'associated',
      requestId: requestId,
      [`${operation}At`]: new Date().toISOString(),
      ...additionalMetadata
    };
    
    if (originalFileName) {
      newMetadata.originalFileName = originalFileName;
    }
    
    // Apply metadata
    await blobClient.setMetadata(newMetadata);
    
    console.log(`📝 Metadata updated successfully:`);
    Object.entries(newMetadata).forEach(([key, value]) => {
      console.log(`   └── ${key}: "${value}"`);
    });
    
  } catch (error) {
    console.error(`❌ Failed to update blob metadata:`, error);
    throw error;
  }
}

/**
 * Deletes a blob with verification
 * @param blobClient - Blob client to delete
 * @param description - Description for logging
 * @returns Promise<void>
 */
export async function deleteBlob(blobClient: BlobClient, description: string = 'blob'): Promise<void> {
  console.log(`🗑️ Deleting ${description}...`);
  console.log(`   └── Blob URL: ${blobClient.url}`);
  
  const deleteStartTime = Date.now();
  
  try {
    await blobClient.delete();
    const deleteDuration = Date.now() - deleteStartTime;
    console.log(`✅ ${description} deleted successfully in ${deleteDuration}ms`);
    
    // Verify deletion
    console.log(`🔍 Verifying ${description} is deleted...`);
    const stillExists = await blobClient.exists();
    console.log(`   └── ${description} exists after delete: ${stillExists ? '⚠️ Still exists!' : '✅ Deleted'}`);
    
    if (stillExists) {
      console.warn(`⚠️ Warning: ${description} still exists after delete operation`);
    }
    
  } catch (error) {
    const deleteDuration = Date.now() - deleteStartTime;
    console.error(`❌ Failed to delete ${description} after ${deleteDuration}ms:`, error);
    throw error;
  }
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validates blob rename parameters
 * @param tempBlobName - Temporary blob name
 * @param requestId - Request ID
 * @param originalFileName - Original filename
 * @param fileType - Type of file for validation
 */
export function validateRenameParameters(
  tempBlobName: string,
  requestId: string,
  originalFileName: string,
  fileType: string = 'file'
): void {
  console.log(`🔍 Validating ${fileType} rename parameters...`);
  
  const errors: string[] = [];
  
  if (!tempBlobName || tempBlobName.trim().length === 0) {
    errors.push('tempBlobName is required and cannot be empty');
  }
  
  if (!requestId || requestId.trim().length === 0) {
    errors.push('requestId is required and cannot be empty');
  }
  
  if (!originalFileName || originalFileName.trim().length === 0) {
    errors.push('originalFileName is required and cannot be empty');
  }
  
  // Validate request ID format (should start with REQ-)
  if (requestId && !requestId.startsWith('REQ-')) {
    console.warn(`⚠️ Request ID doesn't follow expected format: "${requestId}"`);
  }
  
  if (errors.length > 0) {
    console.error(`❌ Parameter validation failed for ${fileType}:`);
    errors.forEach(error => console.error(`   └── ${error}`));
    throw new Error(`${fileType} rename parameter validation failed: ${errors.join(', ')}`);
  }
  
  console.log(`✅ ${fileType} rename parameters are valid`);
}

// ========================================
// OPTIMIZED HIERARCHICAL BLOB OPERATIONS
// ========================================

/**
 * Creates a temporary blob with optimized hierarchical path structure
 * @param config - Temporary blob configuration
 * @param fileBuffer - File content buffer
 * @param contentType - MIME type of the file
 * @returns Blob URL and metadata
 */
export async function createOptimizedTempBlob(
  config: TempBlobPathConfig,
  fileBuffer: Buffer,
  contentType: string
): Promise<{
  blobUrl: string
  blobPath: string
  tempId: string
}> {
  console.log(`🚀 Creating optimized temporary blob...`)
  console.log(`📋 Config:`, config)
  
  try {
    const containerClient = await getContainerClient()
    
    // Generate optimized temp path
    const blobPath = generateTempBlobPath(config)
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
    
    // Upload with metadata
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { 
        blobContentType: contentType 
      },
      metadata: {
        isTemporary: 'true',
        company: config.company,
        branch: config.branch,
        tempId: config.tempId,
        uploadDate: new Date().toISOString(),
        originalFileName: config.fileName
      }
    })
    
    console.log(`✅ Optimized temporary blob created: ${blobPath}`)
    
    return {
      blobUrl: blockBlobClient.url,
      blobPath,
      tempId: config.tempId
    }
    
  } catch (error) {
    console.error(`❌ Failed to create optimized temporary blob:`, error)
    throw error
  }
}

/**
 * Moves temporary blob to final hierarchical location
 * @param tempBlobPath - Temporary blob path
 * @param requestId - Final request ID
 * @param company - Company name
 * @param branch - Branch name
 * @returns Final blob URL and path
 */
export async function moveToFinalOptimizedLocation(
  tempBlobPath: string,
  requestId: string,
  company: string,
  branch: string
): Promise<{
  finalBlobUrl: string
  finalBlobPath: string
}> {
  console.log(`🔄 Moving temporary blob to optimized final location...`)
  console.log(`   Temp path: ${tempBlobPath}`)
  console.log(`   Request ID: ${requestId}`)
  console.log(`   Company: ${company}`)
  console.log(`   Branch: ${branch}`)
  
  try {
    const containerClient = await getContainerClient()
    
    // Parse temp path to get file info
    const tempInfo = parseBlobPath(tempBlobPath)
    
    if (!tempInfo.isTemp) {
      throw new Error(`Path is not a temporary path: ${tempBlobPath}`)
    }
    
    // Generate final optimized path
    const finalConfig: BlobPathConfig = {
      requestId,
      company,
      branch,
      fileName: tempInfo.fileName,
      createdDate: new Date(tempInfo.year, tempInfo.month - 1)
    }
    
    const finalBlobPath = generateOptimizedBlobPath(finalConfig)
    
    // Get blob clients
    const tempBlobClient = containerClient.getBlobClient(tempBlobPath)
    const finalBlobClient = containerClient.getBlobClient(finalBlobPath)
    
    // Check if temp blob exists
    const tempExists = await checkBlobExists(tempBlobClient)
    if (!tempExists) {
      throw new Error(`Temporary blob not found: ${tempBlobPath}`)
    }
    
    // Copy to final location
    await copyBlob(tempBlobClient, finalBlobClient)
    
    // Update metadata for final blob
    await updateBlobMetadata(finalBlobClient, requestId, tempInfo.fileName, 'finalized', {
      company,
      branch,
      convertedFrom: tempBlobPath,
      finalizedDate: new Date().toISOString()
    })
    
    // Delete temporary blob
    await deleteBlob(tempBlobClient)
    
    console.log(`✅ Blob moved to optimized final location: ${finalBlobPath}`)
    
    return {
      finalBlobUrl: finalBlobClient.url,
      finalBlobPath
    }
    
  } catch (error) {
    console.error(`❌ Failed to move blob to optimized final location:`, error)
    throw error
  }
}

/**
 * Gets all blobs for a specific request using hierarchical structure
 * @param requestId - Request ID
 * @param company - Company name
 * @param branch - Branch name
 * @param year - Optional year filter
 * @param month - Optional month filter
 * @returns Object with categorized blob URLs
 */
export async function getRequestBlobs(
  requestId: string,
  company: string,
  branch: string,
  year?: number,
  month?: number
): Promise<{
  allFiles: string[]
}> {
  console.log(`📁 Getting all blobs for request: ${requestId}`)
  
  try {
    const containerClient = await getContainerClient()
    
    // Get request file paths
    const paths = getRequestFilePaths(requestId, company, branch, year, month)
    
    const result = {
      allFiles: [] as string[]
    }
    
    // List blobs with request prefix
    const blobIterator = containerClient.listBlobsFlat({
      prefix: paths.basePath
    })
    
    for await (const blob of blobIterator) {
      const fullUrl = `${containerClient.url}/${blob.name}`
      result.allFiles.push(fullUrl)
    }
    
    console.log(`📊 Found blobs for ${requestId}: ${result.allFiles.length} files`)
    
    return result
    
  } catch (error) {
    console.error(`❌ Failed to get request blobs:`, error)
    throw error
  }
}

/**
 * Creates a blob with optimized hierarchical path
 * @param config - Blob path configuration
 * @param fileBuffer - File content buffer
 * @param contentType - MIME type of the file
 * @returns Blob URL and path
 */
export async function createOptimizedBlob(
  config: BlobPathConfig,
  fileBuffer: Buffer,
  contentType: string
): Promise<{
  blobUrl: string
  blobPath: string
}> {
  console.log(`🚀 Creating optimized blob...`)
  
  try {
    const containerClient = await getContainerClient()
    
    // Generate optimized path
    const blobPath = generateOptimizedBlobPath(config)
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
    
    // Upload with comprehensive metadata
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { 
        blobContentType: contentType 
      },
      metadata: {
        requestId: config.requestId,
        company: config.company,
        branch: config.branch,
        originalFileName: config.fileName,
        uploadDate: (config.createdDate || new Date()).toISOString(),
        isTemporary: 'false'
      }
    })
    
    console.log(`✅ Optimized blob created: ${blobPath}`)
    
    return {
      blobUrl: blockBlobClient.url,
      blobPath
    }
    
  } catch (error) {
    console.error(`❌ Failed to create optimized blob:`, error)
    throw error
  }
}

// ========================================
// SAS URL GENERATION
// ========================================

/**
 * Generates a SAS URL for secure blob access
 * @param blobUrl - Full blob URL
 * @param expirationMinutes - Minutes until URL expires (default: 60)
 * @returns Signed URL with SAS token
 */
export async function generateBlobSASUrl(
  blobUrl: string, 
  expirationMinutes: number = 60
): Promise<string> {
  console.log(`🔐 Generating SAS URL for blob access...`)
  console.log(`   └── Blob URL: ${blobUrl}`)
  console.log(`   └── Expiration: ${expirationMinutes} minutes`)
  
  try {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = getContainerName();
    
    if (!accountName || !accountKey) {
      throw new Error('Azure Storage credentials not configured for SAS generation');
    }
    
    // Extract blob name from URL
    const blobName = extractBlobNameFromUrl(blobUrl);
    console.log(`   └── Blob name: ${blobName}`)
    
    // Create credentials
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Set expiration time
    const startsOn = new Date();
    const expiresOn = new Date(startsOn.getTime() + (expirationMinutes * 60 * 1000));
    
    // Generate SAS token with read permissions
    const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // Read permission only
      startsOn,
      expiresOn,
    }, sharedKeyCredential).toString();
    
    const sasUrl = `${blobUrl}?${sasToken}`;
    
    console.log(`✅ SAS URL generated successfully`)
    console.log(`   └── Expires at: ${expiresOn.toISOString()}`)
    
    return sasUrl;
    
  } catch (error) {
    console.error(`❌ Failed to generate SAS URL:`, error)
    throw error
  }
}