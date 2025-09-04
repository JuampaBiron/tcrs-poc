// src/lib/blob-path-generator.ts
// OPTIMIZED HIERARCHICAL BLOB PATH GENERATOR

export interface BlobPathConfig {
  requestId: string
  company: string
  branch: string
  fileName: string
  createdDate?: Date
}

export interface TempBlobPathConfig {
  company: string
  branch: string
  fileName: string
  tempId: string
  createdDate?: Date
}

/**
 * Generates optimized blob path with hierarchical structure
 * Format: invoices/{company}/{branch}/{year}/{month}/{requestId}/{fileName}
 * 
 * Examples:
 * - invoices/finning-ca/toronto/2024/01/TCRS-2024-000123/INV-001.pdf
 * - invoices/finning-ca/vancouver/2024/01/TCRS-2024-000124/coding.xlsx
 * - invoices/finning-ca/toronto/2024/01/TCRS-2024-000123/receipt.jpg
 * - invoices/finning-ca/toronto/2024/01/TCRS-2024-000123/approval.tif
 */
export function generateOptimizedBlobPath(config: BlobPathConfig): string {
  const date = config.createdDate || new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  
  // Normalize company and branch for safe path components
  const safeCompany = sanitizePathComponent(config.company)
  const safeBranch = sanitizePathComponent(config.branch)
  const safeFileName = sanitizeFileName(config.fileName)
  
  // Build hierarchical path: invoices/company/branch/year/month/request-id/filename
  const fullPath = [
    'invoices',
    safeCompany,
    safeBranch,
    year.toString(),
    month.toString().padStart(2, '0'), // 01, 02, ..., 12
    config.requestId,
    safeFileName
  ].join('/')
  
  console.log(`📁 Generated optimized blob path: ${fullPath}`)
  
  return fullPath
}

/**
 * Generates temporary blob path for uploads before request ID is assigned
 * Format: temp/{company}/{branch}/{year}/{month}/{tempId}/{fileName}
 */
export function generateTempBlobPath(config: TempBlobPathConfig): string {
  const date = config.createdDate || new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  
  const safeCompany = sanitizePathComponent(config.company)
  const safeBranch = sanitizePathComponent(config.branch)
  const safeFileName = sanitizeFileName(config.fileName)
  
  const tempPath = [
    'temp',
    safeCompany,
    safeBranch,
    year.toString(),
    month.toString().padStart(2, '0'),
    config.tempId,
    safeFileName
  ].join('/')
  
  console.log(`🕐 Generated temporary blob path: ${tempPath}`)
  
  return tempPath
}

/**
 * Converts temporary path to final path when request ID is assigned
 */
export function convertTempToFinalPath(tempPath: string, requestId: string): string {
  // Extract components from temp path
  const pathParts = tempPath.split('/')
  
  if (pathParts[0] !== 'temp' || pathParts.length < 7) {
    throw new Error(`Invalid temp path format: ${tempPath}`)
  }
  
  // temp/finning-ca/toronto/2024/01/TEMP-123/file.pdf
  // ->
  // invoices/finning-ca/toronto/2024/01/TCRS-2024-000123/file.pdf
  
  const [, company, branch, year, month, , fileName] = pathParts
  
  const finalPath = [
    'invoices',
    company,
    branch,
    year,
    month,
    requestId,
    fileName
  ].join('/')
  
  console.log(`🔄 Converting temp to final path:`)
  console.log(`   Temp: ${tempPath}`)
  console.log(`   Final: ${finalPath}`)
  
  return finalPath
}

/**
 * Parses a blob path to extract its components
 */
export function parseBlobPath(blobPath: string): {
  isTemp: boolean
  year: number
  month: number
  company: string
  branch: string
  requestId?: string
  tempId?: string
  fileName: string
  basePath: string
} {
  const pathParts = blobPath.split('/')
  
  if (pathParts.length < 7) {
    throw new Error(`Invalid blob path format: ${blobPath}`)
  }
  
  const isTemp = pathParts[0] === 'temp'
  
  if (isTemp) {
    // temp/company/branch/year/month/tempId/fileName
    const [rootDir, company, branch, year, month, tempId, fileName] = pathParts
    
    return {
      isTemp: true,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      company: decodeURIComponent(company),
      branch: decodeURIComponent(branch),
      tempId,
      fileName: decodeURIComponent(fileName),
      basePath: pathParts.slice(0, -1).join('/')
    }
  } else {
    // invoices/company/branch/year/month/requestId/fileName
    const [rootDir, company, branch, year, month, requestId, fileName] = pathParts
    
    return {
      isTemp: false,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      company: decodeURIComponent(company),
      branch: decodeURIComponent(branch),
      requestId,
      fileName: decodeURIComponent(fileName),
      basePath: pathParts.slice(0, -1).join('/')
    }
  }
}

/**
 * Gets all file paths for a specific request
 */
export function getRequestFilePaths(requestId: string, company: string, branch: string, year?: number, month?: number): {
  basePath: string
} {
  const date = new Date()
  const currentYear = year || date.getFullYear()
  const currentMonth = month || (date.getMonth() + 1)
  
  const safeCompany = sanitizePathComponent(company)
  const safeBranch = sanitizePathComponent(branch)
  
  const basePath = [
    'invoices',
    safeCompany,
    safeBranch,
    currentYear.toString(),
    currentMonth.toString().padStart(2, '0'),
    requestId
  ].join('/')
  
  return {
    basePath
  }
}

/**
 * Generates search prefix for listing blobs by criteria
 */
export function generateSearchPrefix(criteria: {
  year?: number
  month?: number
  company?: string
  branch?: string
  requestId?: string
}): string {
  const parts = ['invoices']
  
  if (criteria.company) {
    parts.push(sanitizePathComponent(criteria.company))
    
    if (criteria.branch) {
      parts.push(sanitizePathComponent(criteria.branch))
      
      if (criteria.year) {
        parts.push(criteria.year.toString())
        
        if (criteria.month) {
          parts.push(criteria.month.toString().padStart(2, '0'))
          
          if (criteria.requestId) {
            parts.push(criteria.requestId)
          }
        }
      }
    }
  }
  
  const prefix = parts.join('/') + '/'
  console.log(`🔍 Generated search prefix: ${prefix}`)
  
  return prefix
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Sanitizes a path component (company, branch) for safe URL usage
 */
function sanitizePathComponent(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Spaces to dashes
    .replace(/[^a-z0-9-._]/g, '')   // Remove special chars except dash, dot, underscore
    .replace(/-+/g, '-')            // Multiple dashes to single
    .replace(/^-|-$/g, '')          // Remove leading/trailing dashes
    .slice(0, 50)                   // Limit length
}

/**
 * Sanitizes filename while preserving extension
 */
function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  
  if (lastDotIndex === -1) {
    // No extension
    return sanitizePathComponent(fileName)
  }
  
  const name = fileName.substring(0, lastDotIndex)
  const extension = fileName.substring(lastDotIndex + 1)
  
  const safeName = sanitizePathComponent(name)
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  return `${safeName}.${safeExtension}`
}

/**
 * Validates blob path configuration
 */
export function validateBlobPathConfig(config: BlobPathConfig): void {
  const errors: string[] = []
  
  if (!config.requestId || !config.requestId.trim()) {
    errors.push('Request ID is required')
  }
  
  if (!config.company || !config.company.trim()) {
    errors.push('Company is required')
  }
  
  if (!config.branch || !config.branch.trim()) {
    errors.push('Branch is required')
  }
  
  if (!config.fileName || !config.fileName.trim()) {
    errors.push('File name is required')
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid blob path configuration: ${errors.join(', ')}`)
  }
}

/**
 * Cache for frequently used paths to improve performance
 */
class BlobPathCache {
  private static cache = new Map<string, string>()
  private static readonly CACHE_TTL = 3600000 // 1 hour
  
  static get(key: string): string | undefined {
    return this.cache.get(key)
  }
  
  static set(key: string, value: string): void {
    this.cache.set(key, value)
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key)
    }, this.CACHE_TTL)
  }
  
  static clear(): void {
    this.cache.clear()
  }
}

export { BlobPathCache }