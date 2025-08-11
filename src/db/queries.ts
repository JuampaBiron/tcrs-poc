import { eq, desc, and, count, sql } from "drizzle-orm"
import { db, approvalRequests, workflowHistory, workflowSteps } from "./index"

// ===== DASHBOARD QUERIES =====

export async function getRequestsByUser(userEmail: string) {
  return await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.requester, userEmail))
    .orderBy(desc(approvalRequests.createdDate))
}

export async function getRequestsByApprover(approverEmail: string) {
  return await db
    .select()
    .from(approvalRequests)
    .where(eq(approvalRequests.assignedApprover, approverEmail))
    .orderBy(desc(approvalRequests.createdDate))
}

export async function getAllRequests() {
  return await db
    .select()
    .from(approvalRequests)
    .orderBy(desc(approvalRequests.createdDate))
}

// ===== STATISTICS QUERIES =====

export async function getRequestStats() {
  const stats = await db
    .select({
      status: approvalRequests.approverStatus,
      count: count()
    })
    .from(approvalRequests)
    .groupBy(approvalRequests.approverStatus)

  return {
    total: stats.reduce((sum, stat) => sum + stat.count, 0),
    pending: stats.find(s => s.status === 'pending')?.count || 0,
    approved: stats.find(s => s.status === 'approved')?.count || 0,
    rejected: stats.find(s => s.status === 'rejected')?.count || 0
  }
}

export async function getRequestStatsByUser(userEmail: string) {
  const stats = await db
    .select({
      status: approvalRequests.approverStatus,
      count: count()
    })
    .from(approvalRequests)
    .where(eq(approvalRequests.requester, userEmail))
    .groupBy(approvalRequests.approverStatus)

  return {
    total: stats.reduce((sum, stat) => sum + stat.count, 0),
    pending: stats.find(s => s.status === 'pending')?.count || 0,
    approved: stats.find(s => s.status === 'approved')?.count || 0,
    rejected: stats.find(s => s.status === 'rejected')?.count || 0
  }
}

export async function getRequestStatsByApprover(approverEmail: string) {
  const stats = await db
    .select({
      status: approvalRequests.approverStatus,
      count: count()
    })
    .from(approvalRequests)
    .where(eq(approvalRequests.assignedApprover, approverEmail))
    .groupBy(approvalRequests.approverStatus)

  const pendingCount = stats.find(s => s.status === 'pending')?.count || 0
  const approvedCount = stats.find(s => s.status === 'approved')?.count || 0
  const rejectedCount = stats.find(s => s.status === 'rejected')?.count || 0

  return {
    total: pendingCount + approvedCount + rejectedCount,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    toReview: pendingCount // Alias for approver context
  }
}

// ===== WORKFLOW QUERIES =====

export async function getWorkflowHistory(requestId: string) {
  return await db
    .select({
      history: workflowHistory,
      step: workflowSteps
    })
    .from(workflowHistory)
    .innerJoin(workflowSteps, eq(workflowHistory.stepId, workflowSteps.stepId))
    .where(eq(workflowHistory.requestId, requestId))
    .orderBy(desc(workflowHistory.executedDate))
}

export async function getWorkflowStepsByCategory(category?: string) {
  if (category) {
    return await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.stepCategory, category))
      .orderBy(workflowSteps.stepOrder)
  }
  
  return await db
    .select()
    .from(workflowSteps)
    .orderBy(workflowSteps.stepOrder)
}

// ===== REQUEST MUTATIONS =====

export async function createApprovalRequest(data: {
  requester: string
  assignedApprover: string
  comments?: string
}) {
  const [request] = await db
    .insert(approvalRequests)
    .values({
      ...data,
      approverStatus: 'pending'
    })
    .returning()

  return request
}

export async function updateRequestStatus(
  requestId: string, 
  status: 'approved' | 'rejected',
  comments?: string
) {
  const [request] = await db
    .update(approvalRequests)
    .set({
      approverStatus: status,
      approvedDate: status === 'approved' ? new Date() : null,
      comments,
      modifiedDate: new Date()
    })
    .where(eq(approvalRequests.requestId, requestId))
    .returning()

  return request
}

// ===== WORKFLOW MUTATIONS =====

export async function logWorkflowStep(data: {
  requestId: string
  stepCode: string
  executedBy?: string
  success?: boolean
  duration?: number
  notes?: string
  errorCode?: string
}) {
  // Get step ID from code
  const [step] = await db
    .select({ stepId: workflowSteps.stepId })
    .from(workflowSteps)
    .where(eq(workflowSteps.stepCode, data.stepCode))

  if (!step) {
    throw new Error(`Workflow step not found: ${data.stepCode}`)
  }

  const [history] = await db
    .insert(workflowHistory)
    .values({
      requestId: data.requestId,
      stepId: step.stepId,
      executedBy: data.executedBy,
      executedDate: new Date(),
      success: data.success ?? true,
      duration: data.duration,
      notes: data.notes,
      errorCode: data.errorCode
    })
    .returning()

  return history
}

// ===== SEARCH & FILTER QUERIES (FIXED) =====

export async function searchRequests(params: {
  query?: string
  status?: string
  userEmail?: string
  userRole?: 'requester' | 'approver' | 'admin'
}) {
  const conditions = []

  // Filter by user role
  if (params.userEmail && params.userRole) {
    if (params.userRole === 'requester') {
      conditions.push(eq(approvalRequests.requester, params.userEmail))
    } else if (params.userRole === 'approver') {
      conditions.push(eq(approvalRequests.assignedApprover, params.userEmail))
    }
    // Admin sees all requests (no filter)
  }

  // Filter by status
  if (params.status) {
    conditions.push(eq(approvalRequests.approverStatus, params.status as any))
  }

  // Text search (basic implementation)
  if (params.query) {
    conditions.push(
      sql`${approvalRequests.comments} ILIKE ${`%${params.query}%`}`
    )
  }

  // Build final query
  if (conditions.length > 0) {
    return await db
      .select()
      .from(approvalRequests)
      .where(and(...conditions))
      .orderBy(desc(approvalRequests.createdDate))
  }

  return await db
    .select()
    .from(approvalRequests)
    .orderBy(desc(approvalRequests.createdDate))
}