// src/lib/workflow-tracker.ts
import { eq } from 'drizzle-orm';
import { db, workflowSteps, workflowHistory } from '@/db';
import { createId } from '@paralleldrive/cuid2';

// Type for database transaction
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Track a workflow step in the WorkflowHistory table
 * @param tx - Database transaction instance
 * @param requestId - The request ID being tracked
 * @param stepCode - The step code from WorkflowSteps table (e.g., 'request_created')
 * @param executedBy - Email of user who executed the step
 * @param options - Optional parameters for additional tracking info
 */
export async function trackWorkflowStep(
  tx: Transaction,
  requestId: string,
  stepCode: string,
  executedBy: string,
  options: {
    success?: boolean;
    errorCode?: string;
    notes?: string;
    duration?: number;
    robotJobId?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    previousValue?: string;
    newValue?: string;
  } = {}
): Promise<void> {
  try {
    // 1. Get the stepId from workflow_steps table using stepCode
    const step = await tx
      .select({ stepId: workflowSteps.stepId })
      .from(workflowSteps)
      .where(eq(workflowSteps.stepCode, stepCode))
      .limit(1);

    if (!step || step.length === 0) {
      throw new Error(`Workflow step with code '${stepCode}' not found in workflow_steps table`);
    }

    const stepId = step[0].stepId;

    // 2. Insert into workflow_history
    await tx.insert(workflowHistory).values({
      historyId: createId(),
      requestId,
      stepId,
      executedBy,
      executedDate: new Date(),
      duration: options.duration || null,
      success: options.success ?? true, // Default to true
      errorCode: options.errorCode || null,
      notes: options.notes || null,
      robotJobId: options.robotJobId || null,
      relatedEntityId: options.relatedEntityId || null,
      relatedEntityType: options.relatedEntityType || null,
      previousValue: options.previousValue || null,
      newValue: options.newValue || null,
    });

    console.log(`✅ Workflow step tracked: ${stepCode} (stepId: ${stepId}) for request: ${requestId}`);

  } catch (error) {
    console.error(`❌ Failed to track workflow step '${stepCode}':`, error);
    throw error; // Re-throw to fail the transaction
  }
}

/**
 * Convenience function for tracking request creation
 * @param tx - Database transaction instance
 * @param requestId - The request ID
 * @param requester - Email of the requester
 */
export async function trackRequestCreated(
  tx: Transaction,
  requestId: string,
  requester: string
): Promise<void> {
  return trackWorkflowStep(tx, requestId, 'request_created', requester, {
    notes: 'Request successfully created by user',
    relatedEntityType: 'approval_request',
    relatedEntityId: requestId
  });
}

/**
 * Standalone function to track workflow steps outside of existing transactions
 * Use this when you don't have an existing transaction
 * @param requestId - The request ID
 * @param stepCode - The step code
 * @param executedBy - Email of user who executed the step
 * @param options - Optional parameters
 */
export async function trackWorkflowStepStandalone(
  requestId: string,
  stepCode: string,
  executedBy: string,
  options: Parameters<typeof trackWorkflowStep>[4] = {}
): Promise<void> {
  return db.transaction(async (tx) => {
    await trackWorkflowStep(tx, requestId, stepCode, executedBy, options);
  });
}