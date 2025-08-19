// src/app/api/requests/my-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { db } from '@/db';
import { 
  approvalRequests, 
  invoiceData 
} from '@/db/schema';
import { REQUEST_STATUS, USER_ROLES } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verificar que el usuario tenga rol apropiado
    let userRole;
    try {
      userRole = getUserRole(session.user);
    } catch (error) {
      return NextResponse.json({ 
        error: 'User not authorized - not in any TCRS group' 
      }, { status: 403 });
    }

    if (userRole !== USER_ROLES.REQUESTER && userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json({ 
        error: 'Only requesters and admins can view user requests' 
      }, { status: 403 });
    }

    const userEmail = session.user.email!;
    const { searchParams } = new URL(request.url);
    
    const role = searchParams.get('role');
    const email = searchParams.get('email');
    const statusFilter = searchParams.get('status');

    // Validar parámetros
    if (!role || !email) {
      throw new ValidationError('Missing required parameters: role and email');
    }

    if (email !== userEmail && userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json({ 
        error: 'Email mismatch - can only access own data unless admin' 
      }, { status: 403 });
    }

    console.log(`Loading requests for user: ${email}, role: ${userRole}, statusFilter: ${statusFilter}`);

    // Construir condiciones de filtro
    let whereConditions: any[] = [
      eq(approvalRequests.requester, email)
    ];

    // Filtro por status si se proporciona
    if (statusFilter && statusFilter !== 'all') {
      // Validar que el statusFilter sea un valor válido de REQUEST_STATUS
      const validStatuses = Object.values(REQUEST_STATUS);
      if (validStatuses.includes(statusFilter as any)) {
        whereConditions.push(eq(approvalRequests.approverStatus, statusFilter as typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]));
      }
    }

    // Ejecutar query con JOIN para obtener datos del invoice
    const userRequests = await db
      .select({
        // ApprovalRequests fields
        requestId: approvalRequests.requestId,
        requester: approvalRequests.requester,
        assignedApprover: approvalRequests.assignedApprover,
        approverStatus: approvalRequests.approverStatus,
        approvedDate: approvalRequests.approvedDate,
        comments: approvalRequests.comments,
        createdDate: approvalRequests.createdDate,
        modifiedDate: approvalRequests.modifiedDate,
        
        // InvoiceData fields
        company: invoiceData.company,
        branch: invoiceData.branch,
        vendor: invoiceData.vendor,
        po: invoiceData.po,
        amount: invoiceData.amount,
        currency: invoiceData.currency
      })
      .from(approvalRequests)
      .innerJoin(invoiceData, eq(approvalRequests.requestId, invoiceData.requestId))
      .where(and(...whereConditions))
      .orderBy(desc(approvalRequests.createdDate)); // Más recientes primero

    // Transformar datos para el frontend
    const transformedRequests = userRequests.map(req => ({
      id: req.requestId,
      requestId: req.requestId,
      title: req.comments || `Invoice from ${req.vendor}`,
      vendor: req.vendor || 'Unknown Vendor',
      po: req.po,
      amount: req.amount || '0',
      currency: req.currency || 'CAD',
      status: req.approverStatus || REQUEST_STATUS.PENDING,
      assignedApprover: req.assignedApprover,
      branch: req.branch || 'Unknown Branch',
      submittedOn: req.createdDate?.toISOString() || new Date().toISOString(),
      lastUpdate: req.modifiedDate?.toISOString() || req.createdDate?.toISOString() || new Date().toISOString(),
      
      // Determinar si se puede editar - solo si está rechazada
      canEdit: req.approverStatus === REQUEST_STATUS.REJECTED,
      
      // Información adicional
      isApproved: req.approverStatus === REQUEST_STATUS.APPROVED,
      isRejected: req.approverStatus === REQUEST_STATUS.REJECTED,
      isPending: req.approverStatus === REQUEST_STATUS.PENDING,
      approvedDate: req.approvedDate?.toISOString() || null
    }));

    // Calcular estadísticas
    const stats = {
      total: transformedRequests.length,
      pending: transformedRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length,
      inReview: transformedRequests.filter(r => r.status === REQUEST_STATUS.IN_REVIEW).length,
      approved: transformedRequests.filter(r => r.status === REQUEST_STATUS.APPROVED).length,
      rejected: transformedRequests.filter(r => r.status === REQUEST_STATUS.REJECTED).length
    };

    console.log(`✅ Found ${transformedRequests.length} requests for ${email}`);
    console.log(`📊 Stats: ${stats.pending} pending, ${stats.approved} approved, ${stats.rejected} rejected`);

    return createSuccessResponse({
      requests: transformedRequests,
      stats: stats,
      filters: {
        status: statusFilter || 'all',
        email: email
      }
    });

  } catch (error) {
    console.error('❌ Error loading user requests:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Failed to load user requests', 500);
  }
}