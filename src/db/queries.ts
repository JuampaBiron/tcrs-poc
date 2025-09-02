import { eq, desc, and, count, sql } from "drizzle-orm"
import { db, approvalRequests, workflowHistory, workflowSteps, invoiceData, glCodingUploadedData, glCodingData } from "./index"
import { USER_ROLES, REQUEST_STATUS } from "@/constants"
import { UserRole } from "@/types"
import { approverList } from './schema'
import { createId } from "@paralleldrive/cuid2"
import { trackRequestCreated } from "@/lib/workflow-tracker"

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

// ===== EXCEL & PDF REQUEST FLOW QUERIES =====

/**
 * Busca el approver adecuado para una request según company, branch y monto.
 */
export async function findApproverForRequest(company: string, branch: string, amount: number) {
  const approver = await db
    .select()
    .from(approverList)
    .where(
      and(
        eq(approverList.erp, company),
        eq(approverList.branch, branch),
        sql`${approverList.authorizedAmount} >= ${amount}`
      )
    )
    .orderBy(approverList.authorizedAmount)
    .limit(1);
    console.log('************ searching company:', company, typeof company);
    console.log('************ searching branch:', branch, typeof branch);
    console.log('************ searching amount:', amount, typeof amount);
    console.log('************ Found approver:', approver);
    
  return approver[0]?.emailAddress || null;
}

/**
 * Crea un request completo en la base de datos, incluyendo Excel info si existe y asignando el approver correcto.
 */
export async function createRequestInDatabase(data: {
  invoiceData: any;
  glCodingData: any[];
  requester: string;
  excelInfo?: { blobUrl: string; blobName: string; originalFileName: string } | null;
}): Promise<{ requestId: string; assignedApprover: string | null }> {
  const { invoiceData: invoiceFormData, glCodingData: glCodingEntries, requester, excelInfo } = data;

  // Validaciones previas
  if (!glCodingEntries || !Array.isArray(glCodingEntries) || glCodingEntries.length === 0) {
    throw new Error('GL-Coding data is required');
  }
  const validationErrors: string[] = [];
  glCodingEntries.forEach((entry: any, index: number) => {
    if (!entry.accountCode) validationErrors.push(`Entry ${index + 1}: Account code is required`);
    if (!entry.facilityCode) validationErrors.push(`Entry ${index + 1}: Facility code is required`);
    if (!entry.amount || entry.amount <= 0) validationErrors.push(`Entry ${index + 1}: Valid amount is required`);
  });
  if (validationErrors.length > 0) {
    throw new Error(`GL-Coding validation failed: ${validationErrors.join(', ')}`);
  }

  // Buscar approver antes de la transacción
  const approverEmail = await findApproverForRequest(
    invoiceFormData.company,
    invoiceFormData.branch,
    Number(invoiceFormData.amount)
  );

  // Transacción
  const requestId = `REQ-${new Date().getFullYear()}-${createId()}`;
  await db.transaction(async (tx) => {
    await tx.insert(approvalRequests).values({
      requestId,
      requester,
      assignedApprover: approverEmail,
      approverStatus: REQUEST_STATUS.PENDING,
      comments: null,
      createdDate: new Date(),
      modifiedDate: null,
    });

    await trackRequestCreated(tx, requestId, requester);

    await tx.insert(invoiceData).values({
      invoiceId: createId(),
      requestId,
      company: invoiceFormData.company,
      tcrsCompany: invoiceFormData.tcrsCompany,
      branch: invoiceFormData.branch,
      vendor: invoiceFormData.vendor,
      po: invoiceFormData.po,
      amount: invoiceFormData.amount.toString(),
      currency: invoiceFormData.currency,
      approver: approverEmail,
      blobUrl: invoiceFormData.pdfUrl || null,
      createdDate: new Date(),
      modifiedDate: null,
    });

    const uploadId = createId();
    await tx.insert(glCodingUploadedData).values({
      uploadId,
      requestId,
      uploader: requester,
      uploadedFile: !!excelInfo,
      status: 'completed',
      blobUrl: excelInfo?.blobUrl || null,
      createdDate: new Date(),
      modifiedDate: null,
    });

    const glEntries = glCodingEntries.map((entry: any) => ({
      uploadId,
      accountCode: entry.accountCode,
      facilityCode: entry.facilityCode,
      taxCode: entry.taxCode || null,
      amount: entry.amount.toString(),
      equipment: entry.equipment || null,
      comments: entry.comments || null,
      createdDate: new Date(),
      modifiedDate: null,
    }));

    await tx.insert(glCodingData).values(glEntries);
  });

  return { requestId, assignedApprover: approverEmail };
}

/**
 * Actualiza la URL final del PDF en la tabla invoice_data.
 */
export async function updateRequestPdfUrl(requestId: string, pdfUrl: string): Promise<void> {
  await db
    .update(invoiceData)
    .set({
      blobUrl: pdfUrl,
      modifiedDate: new Date(),
    })
    .where(eq(invoiceData.requestId, requestId));
}

/**
 * Obtiene la información temporal del Excel para un request.
 */
export async function getExcelInfoFromDatabase(requestId: string): Promise<{
  tempBlobUrl: string | null;
  originalFileName: string | null;
  uploadId: string;
} | null> {
  const result = await db
    .select({
      blobUrl: glCodingUploadedData.blobUrl,
      uploadId: glCodingUploadedData.uploadId,
    })
    .from(glCodingUploadedData)
    .where(eq(glCodingUploadedData.requestId, requestId))
    .limit(1);

  if (result.length === 0 || !result[0].blobUrl) {
    return null;
  }

  const blobUrl = result[0].blobUrl;
  const urlParts = blobUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const originalFileName = fileName.replace(/^TEMP-[^_]+_/, '');

  return {
    tempBlobUrl: blobUrl,
    originalFileName,
    uploadId: result[0].uploadId,
  };
}

/**
 * Actualiza la URL final del Excel en la tabla gl_coding_uploaded_data.
 */
export async function updateRequestExcelUrl(requestId: string, excelUrl: string): Promise<void> {
  await db
    .update(glCodingUploadedData)
    .set({
      blobUrl: excelUrl,
      uploadedFile: true,
      modifiedDate: new Date(),
    })
    .where(eq(glCodingUploadedData.requestId, requestId));
}

/**
 * Helper para extraer el blobName desde una URL de blob.
 */
export function extractBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    return pathParts.slice(2).join('/');
  } catch {
    return blobUrl;
  }
}

// Trae requests del usuario con datos auxiliares - TO BE USED ON MY REQUESTS
export async function getMyRequestsWithDetails(userEmail: string) {
  const rows = await db
    .select({
      requestId: approvalRequests.requestId,
      requester: approvalRequests.requester,
      approverStatus: approvalRequests.approverStatus,
      amount: invoiceData.amount,
      company: invoiceData.company,
      branch: invoiceData.branch,
      vendor: invoiceData.vendor,      
      po: invoiceData.po,              
      currency: invoiceData.currency,  
      createdDate: approvalRequests.createdDate,
      assignedApprover: approvalRequests.assignedApprover,
    })
    .from(approvalRequests)
    .leftJoin(invoiceData, eq(approvalRequests.requestId, invoiceData.requestId))
    .where(eq(approvalRequests.requester, userEmail))
    .orderBy(desc(approvalRequests.createdDate));
  console.log("🔎 [getMyRequestsWithDetails] user:", userEmail, "rows:", rows);

  return rows;
}

