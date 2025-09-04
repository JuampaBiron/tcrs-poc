// src/lib/request-id-generator.ts
import { desc, sql } from "drizzle-orm"
import { db, approvalRequests } from "@/db"

/**
 * Generates a unique Request ID in format: TCRS-YYYY-NNNNNN
 * Example: TCRS-2024-000001, TCRS-2024-000123
 */
export async function generateRequestId(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  try {
    // Get the last request ID for current year
    const lastRequest = await db
      .select({ requestId: approvalRequests.requestId })
      .from(approvalRequests)
      .where(sql`${approvalRequests.requestId} LIKE ${`TCRS-${currentYear}-%`}`)
      .orderBy(desc(approvalRequests.createdDate))
      .limit(1)
    
    let nextSerial = 1
    
    if (lastRequest.length > 0 && lastRequest[0].requestId) {
      // Extract serial number from last ID: TCRS-2024-000123 -> 000123
      const parts = lastRequest[0].requestId.split('-')
      if (parts.length === 3) {
        const serialPart = parts[2]
        const currentSerial = parseInt(serialPart, 10)
        if (!isNaN(currentSerial)) {
          nextSerial = currentSerial + 1
        }
      }
    }
    
    // Format with 6-digit padding
    const paddedSerial = nextSerial.toString().padStart(6, '0')
    
    const requestId = `TCRS-${currentYear}-${paddedSerial}`
    
    console.log(`🆔 Generated Request ID: ${requestId}`)
    
    return requestId
    
  } catch (error) {
    console.error('❌ Error generating Request ID:', error)
    
    // Fallback: use timestamp-based ID if database query fails
    const timestamp = Date.now().toString().slice(-6)
    const fallbackId = `TCRS-${currentYear}-${timestamp}`
    
    console.log(`⚠️ Using fallback Request ID: ${fallbackId}`)
    
    return fallbackId
  }
}

/**
 * Validates if a Request ID follows the correct format
 */
export function isValidRequestId(requestId: string): boolean {
  const pattern = /^TCRS-\d{4}-\d{6}$/
  return pattern.test(requestId)
}

/**
 * Extracts year from Request ID
 */
export function getYearFromRequestId(requestId: string): number | null {
  if (!isValidRequestId(requestId)) return null
  
  const parts = requestId.split('-')
  const year = parseInt(parts[1], 10)
  
  return isNaN(year) ? null : year
}

/**
 * Extracts serial number from Request ID
 */
export function getSerialFromRequestId(requestId: string): number | null {
  if (!isValidRequestId(requestId)) return null
  
  const parts = requestId.split('-')
  const serial = parseInt(parts[2], 10)
  
  return isNaN(serial) ? null : serial
}

/**
 * Cache for last serial numbers to optimize frequent generations
 * Reset cache when year changes
 */
const serialCache = new Map<number, number>()

/**
 * Optimized version of generateRequestId with caching
 * Use this for high-frequency request creation
 */
export async function generateRequestIdOptimized(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  try {
    // Check if we have cached serial for current year
    if (!serialCache.has(currentYear)) {
      const lastSerial = await getLastSerialForYear(currentYear)
      serialCache.set(currentYear, lastSerial)
    }
    
    // Increment and cache new serial
    const nextSerial = serialCache.get(currentYear)! + 1
    serialCache.set(currentYear, nextSerial)
    
    // Format with 6-digit padding
    const paddedSerial = nextSerial.toString().padStart(6, '0')
    const requestId = `TCRS-${currentYear}-${paddedSerial}`
    
    console.log(`🆔 Generated Request ID (cached): ${requestId}`)
    
    return requestId
    
  } catch (error) {
    console.error('❌ Error in optimized Request ID generation:', error)
    
    // Fallback to regular generation
    return generateRequestId()
  }
}

/**
 * Helper function to get last serial number for a specific year
 */
async function getLastSerialForYear(year: number): Promise<number> {
  try {
    const lastRequest = await db
      .select({ requestId: approvalRequests.requestId })
      .from(approvalRequests)
      .where(sql`${approvalRequests.requestId} LIKE ${`TCRS-${year}-%`}`)
      .orderBy(desc(approvalRequests.createdDate))
      .limit(1)
    
    if (lastRequest.length === 0 || !lastRequest[0].requestId) {
      return 0 // Start from 1 (will be incremented)
    }
    
    const parts = lastRequest[0].requestId.split('-')
    if (parts.length !== 3) return 0
    
    const serialPart = parts[2]
    const currentSerial = parseInt(serialPart, 10)
    
    return isNaN(currentSerial) ? 0 : currentSerial
    
  } catch (error) {
    console.error('❌ Error getting last serial for year:', year, error)
    return 0
  }
}

/**
 * Clear cache - useful for testing or year transitions
 */
export function clearRequestIdCache(): void {
  serialCache.clear()
  console.log('🧹 Request ID cache cleared')
}