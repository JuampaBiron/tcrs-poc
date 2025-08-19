import { eq, desc, and, count, sql } from "drizzle-orm"
import { db, approvalRequests, workflowHistory, workflowSteps } from "./index"
import { USER_ROLES, REQUEST_STATUS } from "@/constants"
import { UserRole } from "@/types"
import { approverList } from './schema'

// ===== DICTIONARY QUERIES =====

/**
 * Get all unique companies (ERPs) from approver_list
 */
export async function getAvailableCompanies() {
  try {
    const companies = await db
      .selectDistinct({
        code: approverList.erp,
        description: approverList.erp, // Using same value for both for now
      })
      .from(approverList)
      .where(sql`${approverList.erp} IS NOT NULL AND ${approverList.erp} != ''`)
      .orderBy(approverList.erp)

    return companies.map(company => ({
      code: company.code || '',
      description: company.description || ''
    }))
  } catch (error) {
    console.error('Error fetching companies from approver_list:', error)
    throw new Error('Failed to fetch companies')
  }
}

/**
 * Get all unique branches for a specific company (ERP) from approver_list
 */
export async function getAvailableBranches(companyErp: string) {
  try {
    if (!companyErp) {
      throw new Error('Company ERP is required')
    }

    const branches = await db
      .selectDistinct({
        code: approverList.branch,
        description: approverList.branch, // Using same value for both for now
      })
      .from(approverList)
      .where(sql`${approverList.erp} = ${companyErp} AND ${approverList.branch} IS NOT NULL AND ${approverList.branch} != ''`)
      .orderBy(approverList.branch)

    return branches.map(branch => ({
      code: branch.code || '',
      description: branch.description || ''
    }))
  } catch (error) {
    console.error(`Error fetching branches for company ${companyErp}:`, error)
    throw new Error('Failed to fetch branches')
  }
}

/**
 * Get all available currencies (static data for now)
 */
export async function getAvailableCurrencies() {
  // Static currencies - could be moved to database later if needed
  return [
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
  ]
}

/**
 * Validate if a company-branch combination exists in approver_list
 */
export async function validateCompanyBranchCombination(companyErp: string, branch: string) {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(approverList)
      .where(sql`${approverList.erp} = ${companyErp} AND ${approverList.branch} = ${branch}`)

    return Number(result[0]?.count) > 0
  } catch (error) {
    console.error('Error validating company-branch combination:', error)
    return false
  }
}

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
    pending: stats.find(s => s.status === REQUEST_STATUS.PENDING)?.count || 0,
    approved: stats.find(s => s.status === REQUEST_STATUS.APPROVED)?.count || 0,
    rejected: stats.find(s => s.status === REQUEST_STATUS.REJECTED)?.count || 0
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
    pending: stats.find(s => s.status === REQUEST_STATUS.PENDING)?.count || 0,
    approved: stats.find(s => s.status === REQUEST_STATUS.APPROVED)?.count || 0,
    rejected: stats.find(s => s.status === REQUEST_STATUS.REJECTED)?.count || 0
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

  const pendingCount = stats.find(s => s.status === REQUEST_STATUS.PENDING)?.count || 0
  const approvedCount = stats.find(s => s.status === REQUEST_STATUS.APPROVED)?.count || 0
  const rejectedCount = stats.find(s => s.status === REQUEST_STATUS.REJECTED)?.count || 0

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
      approverStatus: REQUEST_STATUS.PENDING
    })
    .returning()

  return request
}

export async function updateRequestStatus(
  requestId: string, 
  status: typeof REQUEST_STATUS.APPROVED | typeof REQUEST_STATUS.REJECTED,
  comments?: string
) {
  const [request] = await db
    .update(approvalRequests)
    .set({
      approverStatus: status,
      approvedDate: status === REQUEST_STATUS.APPROVED ? new Date() : null,
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
  userRole?: UserRole
}) {
  const conditions = []

  // Filter by user role
  if (params.userEmail && params.userRole) {
    if (params.userRole === USER_ROLES.REQUESTER) {
      conditions.push(eq(approvalRequests.requester, params.userEmail))
    } else if (params.userRole === USER_ROLES.APPROVER) {
      conditions.push(eq(approvalRequests.assignedApprover, params.userEmail))
    }
    // Admin sees all requests (no filter)
  }

  // Filter by status
  if (params.status) {
    conditions.push(eq(approvalRequests.approverStatus, params.status as typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]))
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