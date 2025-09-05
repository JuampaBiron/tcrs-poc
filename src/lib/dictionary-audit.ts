// src/lib/dictionary-audit.ts
import { db } from '@/db'
import { workflowHistory, workflowSteps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { DICTIONARY_WORKFLOW_STEPS } from '@/db/dictionary-workflow-steps'

export interface DictionaryAuditParams {
  action: 'CREATED' | 'UPDATED' | 'DELETED'
  entityType: 'APPROVER' | 'ACCOUNT' | 'FACILITY'
  entityId: string
  executedBy: string
  previousValue?: any
  newValue?: any
  notes?: string
}

// Dictionary audit logging utility
export async function logDictionaryAction({
  action,
  entityType,
  entityId,
  executedBy,
  previousValue = null,
  newValue = null,
  notes = null
}: DictionaryAuditParams) {
  try {
    const startTime = Date.now()
    
    // Map action and entity to workflow step code
    const stepCode = `DICT_${entityType}_${action}`
    
    // Get the workflow step by code
    const [step] = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.stepCode, stepCode))
      .limit(1)
    
    if (!step) {
      console.warn(`Workflow step not found for code: ${stepCode}`)
      return null
    }
    
    const executedDate = new Date()
    const duration = Date.now() - startTime
    
    // Create workflow history entry
    const [historyEntry] = await db
      .insert(workflowHistory)
      .values({
        requestId: `DICT-${entityType}-${entityId}`, // Virtual request ID for dictionary actions
        stepId: step.stepId,
        executedBy,
        executedDate,
        duration,
        success: true,
        errorCode: null,
        notes: notes || `Dictionary ${action.toLowerCase()}: ${entityType.toLowerCase()} ${entityId}`,
        robotJobId: null,
        relatedEntityId: entityId,
        relatedEntityType: `DICTIONARY_${entityType}`,
        previousValue: previousValue ? JSON.stringify(previousValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null
      })
      .returning()
    
    console.log(`✅ Dictionary audit logged:`, {
      stepCode,
      entityType,
      entityId,
      executedBy,
      action,
      historyId: historyEntry.historyId
    })
    
    return historyEntry
    
  } catch (error) {
    console.error('❌ Failed to log dictionary action:', error)
    return null
  }
}

// Convenience functions for specific actions
export const auditApproverCreated = (entityId: string, executedBy: string, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'CREATED',
    entityType: 'APPROVER', 
    entityId,
    executedBy,
    newValue,
    notes
  })

export const auditApproverUpdated = (entityId: string, executedBy: string, previousValue: any, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'UPDATED',
    entityType: 'APPROVER',
    entityId,
    executedBy,
    previousValue,
    newValue,
    notes
  })

export const auditApproverDeleted = (entityId: string, executedBy: string, previousValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'DELETED',
    entityType: 'APPROVER',
    entityId,
    executedBy,
    previousValue,
    notes
  })

export const auditAccountCreated = (entityId: string, executedBy: string, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'CREATED',
    entityType: 'ACCOUNT',
    entityId,
    executedBy,
    newValue,
    notes
  })

export const auditAccountUpdated = (entityId: string, executedBy: string, previousValue: any, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'UPDATED',
    entityType: 'ACCOUNT',
    entityId,
    executedBy,
    previousValue,
    newValue,
    notes
  })

export const auditAccountDeleted = (entityId: string, executedBy: string, previousValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'DELETED',
    entityType: 'ACCOUNT',
    entityId,
    executedBy,
    previousValue,
    notes
  })

export const auditFacilityCreated = (entityId: string, executedBy: string, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'CREATED',
    entityType: 'FACILITY',
    entityId,
    executedBy,
    newValue,
    notes
  })

export const auditFacilityUpdated = (entityId: string, executedBy: string, previousValue: any, newValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'UPDATED',
    entityType: 'FACILITY',
    entityId,
    executedBy,
    previousValue,
    newValue,
    notes
  })

export const auditFacilityDeleted = (entityId: string, executedBy: string, previousValue: any, notes?: string) =>
  logDictionaryAction({
    action: 'DELETED',
    entityType: 'FACILITY',
    entityId,
    executedBy,
    previousValue,
    notes
  })