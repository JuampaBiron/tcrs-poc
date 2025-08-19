// src/app/api/requests/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { db } from '@/db';
import { 
  approvalRequests, 
  approverList,
  workflowHistory 
} from '@/db/schema';
import { REQUEST_STATUS, USER_ROLES } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { eq, or } from 'drizzle-orm';

interface RejectRequestBody {
  approver: string;
  comments: string; // Required for rejection
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (userRole !== USER_ROLES.APPROVER && userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json({ 
        error: 'Only approvers and admins can reject requests' 
      }, { status: 403 });
    }

    const userEmail = session.user.email!;
    const requestId = params.id;

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    // Parsear body
    const body: RejectRequestBody = await request.json();
    
    if (!body.approver) {
      throw new ValidationError('Approver email is required');
    }

    if (!body.comments || body.comments.trim() === '') {
      throw new ValidationError('Rejection reason is required');
    }

    if (body.approver !== userEmail) {
      return NextResponse.json({ 
        error: 'Can only reject with your own email' 
      }, { status: 403 });
    }

    console.log(`Rejecting request ${requestId} by ${userEmail}`);

    // Verificar que la solicitud existe y está en estado que permite rechazo
    const existingRequest = await db
      .select({
        requestId: approvalRequests.requestId,
        requester: approvalRequests.requester,
        assignedApprover: approvalRequests.assignedApprover,
        approverStatus: approvalRequests.approverStatus
      })
      .from(approvalRequests)
      .where(eq(approvalRequests.requestId, requestId))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json({ 
        error: 'Request not found' 
      }, { status: 404 });
    }

    const request_data = existingRequest[0];

    // Verificar que la solicitud está en estado que permite rechazo
    if (request_data.approverStatus !== REQUEST_STATUS.PENDING && 
        request_data.approverStatus !== REQUEST_STATUS.IN_REVIEW) {
      return NextResponse.json({ 
        error: `Request cannot be rejected. Current status: ${request_data.approverStatus}` 
      }, { status: 400 });
    }

    // Verificar que el usuario tiene permisos para rechazar esta solicitud
    const canReject = await verifyRejectionPermissions(userEmail, request_data.assignedApprover);
    
    if (!canReject) {
      return NextResponse.json({ 
        error: 'You are not authorized to reject this request' 
      }, { status: 403 });
    }

    // Actualizar la solicitud en una transacción
    await db.transaction(async (tx) => {
      // 1. Actualizar ApprovalRequests
      await tx
        .update(approvalRequests)
        .set({
          approverStatus: REQUEST_STATUS.REJECTED,
          approvedDate: null, // No approved date for rejections
          modifiedDate: new Date(),
          comments: body.comments.trim()
        })
        .where(eq(approvalRequests.requestId, requestId));

      // 2. Registrar en WorkflowHistory (si existe la tabla)
      try {
        await tx.insert(workflowHistory).values({
          requestId: requestId,
          stepId: 'approval_rejected', // Esto debería existir en workflowSteps
          executedBy: userEmail,
          executedDate: new Date(),
          success: false, // false para rechazos
          errorCode: 'REJECTED_BY_APPROVER',
          duration: null,
          comments: body.comments.trim()
        });
      } catch (workflowError) {
        // Si no existe la tabla de workflow, continuar sin error
        console.warn('Workflow history not recorded:', workflowError);
      }
    });

    console.log(`✅ Request ${requestId} rejected by ${userEmail}`);

    // TODO: Aquí se podrían disparar notificaciones
    // - Email al requester con la razón del rechazo
    // - Notificación en el sistema
    // - Posible escalación o re-asignación

    return createSuccessResponse({
      requestId: requestId,
      status: REQUEST_STATUS.REJECTED,
      rejectedBy: userEmail,
      rejectedDate: new Date().toISOString(),
      rejectionReason: body.comments.trim(),
      message: 'Request rejected successfully'
    });

  } catch (error) {
    console.error('❌ Error rejecting request:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 'Validation failed', 400);
    }
    
    return createErrorResponse(
      'Failed to reject request',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

// Función para verificar permisos de rechazo (similar a aprobación)
async function verifyRejectionPermissions(
  userEmail: string, 
  assignedApprover: string | null
): Promise<boolean> {
  try {
    // Si el usuario es el approver asignado, puede rechazar
    if (assignedApprover === userEmail) {
      return true;
    }

    // Verificar si el usuario es backup approver
    const backupApproverRecords = await db
      .select({
        authorizedApprover: approverList.authorizedApprover
      })
      .from(approverList)
      .where(
        or(
          eq(approverList.backUpApprover, userEmail),
          eq(approverList.authorizedApprover, userEmail)
        )
      );

    // Si el usuario aparece como backup del approver asignado, puede rechazar
    const isBackupForAssigned = backupApproverRecords.some(
      record => record.authorizedApprover === assignedApprover
    );

    // O si el usuario es un approver autorizado en general
    const isAuthorizedApprover = backupApproverRecords.some(
      record => record.authorizedApprover === userEmail
    );

    return isBackupForAssigned || isAuthorizedApprover;

  } catch (error) {
    console.error('Error verifying rejection permissions:', error);
    return false;
  }
}