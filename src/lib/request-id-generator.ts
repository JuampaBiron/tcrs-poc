// src/lib/request-id-generator.ts
import { desc, sql } from "drizzle-orm"
import { db, approvalRequests } from "@/db"

/**
 * Generates a unique Request ID as a 12-digit incremental number using PostgreSQL sequence
 * Example: 000000000001, 000000000123
 */
export async function generateRequestId(): Promise<string> {
  try {
    // Use PostgreSQL sequence for atomic increment
    const result = await db.execute(sql`SELECT nextval('request_id_sequence') as next_id`)
    
    if (result.rows.length === 0 || !result.rows[0].next_id) {
      throw new Error('Failed to get next sequence value')
    }
    
    const nextSerial = parseInt(result.rows[0].next_id as string, 10)
    
    // Format with 12-digit padding
    const requestId = nextSerial.toString().padStart(12, '0')
    
    console.log(`🆔 Generated Request ID: ${requestId} (sequence: ${nextSerial})`)
    
    return requestId
    
  } catch (error) {
    console.error('❌ Error generating Request ID:', error)
    
    // Fallback: use timestamp-based ID if sequence fails
    const timestamp = Date.now()
    const fallbackId = timestamp.toString().padStart(12, '0')
    
    console.log(`⚠️ Using fallback Request ID: ${fallbackId}`)
    
    return fallbackId
  }
}

/**
 * Validates if a Request ID follows the correct format (12 digits)
 */
export function isValidRequestId(requestId: string): boolean {
  const pattern = /^\d{12}$/
  return pattern.test(requestId)
}

/**
 * Converts Request ID to number (for sorting and comparison)
 */
export function getNumberFromRequestId(requestId: string): number | null {
  if (!isValidRequestId(requestId)) return null
  
  const num = parseInt(requestId, 10)
  return isNaN(num) ? null : num
}

/**
 * Optimized version of generateRequestId - uses the same sequence
 * (sequence already handles caching and optimization)
 * Use this for high-frequency request creation
 */
export async function generateRequestIdOptimized(): Promise<string> {
  // Since PostgreSQL sequence already handles optimization and caching,
  // we can just use the main function
  return generateRequestId()
}

/**
 * Gets the current sequence value without incrementing
 * Useful for debugging or status checks
 */
export async function getCurrentSequenceValue(): Promise<number | null> {
  try {
    const result = await db.execute(sql`SELECT currval('request_id_sequence') as current_id`)
    
    if (result.rows.length === 0 || !result.rows[0].current_id) {
      return null
    }
    
    return parseInt(result.rows[0].current_id as string, 10)
    
  } catch (error) {
    console.error('❌ Error getting current sequence value:', error)
    return null
  }
}

/**
 * Resets the sequence to a specific value
 * Use with caution - only for maintenance or migration purposes
 */
export async function resetSequenceTo(value: number): Promise<boolean> {
  try {
    await db.execute(sql`SELECT setval('request_id_sequence', ${value}, false)`)
    console.log(`🔄 Sequence reset to: ${value}`)
    return true
  } catch (error) {
    console.error('❌ Error resetting sequence:', error)
    return false
  }
}

/**
 * Clear cache - no-op since we're using sequence now
 * Kept for compatibility
 */
export function clearRequestIdCache(): void {
  console.log('🧹 Request ID cache cleared (no-op - using sequence)')
}