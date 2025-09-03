import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES, REQUEST_STATUS } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { db } from '@/db';
import { approvalRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RejectRequestBody {
  approver: string;
  comments?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    console.log('🔄 [API] Reject request endpoint hit for requestId:', params.requestId);

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      console.log('❌ [API] No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verificar que el usuario tenga rol de approver o admin
    let userRole;
    try {
      userRole = getUserRole(session.user);
      console.log('✅ [API] User role:', userRole);
    } catch (error) {
      console.log('❌ [API] User not in TCRS group:', session.user.email);
      return NextResponse.json({ 
        error: 'User not authorized - not in any TCRS group' 
      }, { status: 403 });
    }

    if (userRole !== USER_ROLES.APPROVER && userRole !== USER_ROLES.ADMIN) {
      console.log('❌ [API] Invalid role for reject request:', userRole);
      return NextResponse.json({ 
        error: 'Only approvers and admins can reject requests' 
      }, { status: 403 });
    }

    const userEmail = session.user.email!;
    const { requestId } = params;

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    // Parse request body
    const body: RejectRequestBody = await request.json();
    const { approver, comments = '' } = body;

    if (!approver) {
      throw new ValidationError('Approver email is required');
    }

    // Verificar que el approver coincida con el usuario autenticado
    if (approver !== userEmail) {
      console.log('❌ [API] Approver mismatch - user:', userEmail, 'requested:', approver);
      return NextResponse.json({ 
        error: 'Approver mismatch - can only reject with own credentials' 
      }, { status: 403 });
    }

    console.log('📋 [API] Rejecting request:', requestId, 'by approver:', approver);

    // Verificar que la request existe y está asignada al approver
    const existingRequest = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.requestId, requestId))
      .limit(1);

    if (existingRequest.length === 0) {
      console.log('❌ [API] Request not found:', requestId);
      return NextResponse.json({ 
        error: 'Request not found' 
      }, { status: 404 });
    }

    const request_data = existingRequest[0];

    // Verificar que esté asignada al approver (solo para approvers, admins pueden rechazar cualquiera)
    if (userRole === USER_ROLES.APPROVER && request_data.assignedApprover !== approver) {
      console.log('❌ [API] Request not assigned to this approver:', request_data.assignedApprover, 'vs', approver);
      return NextResponse.json({ 
        error: 'Request is not assigned to you' 
      }, { status: 403 });
    }

    // Verificar que no esté ya aprobada o rechazada
    if (request_data.approverStatus === REQUEST_STATUS.APPROVED) {
      return NextResponse.json({ 
        error: 'Request is already approved' 
      }, { status: 400 });
    }

    if (request_data.approverStatus === REQUEST_STATUS.REJECTED) {
      return NextResponse.json({ 
        error: 'Request is already rejected' 
      }, { status: 400 });
    }

    // Actualizar la request como rechazada
    const updateResult = await db
      .update(approvalRequests)
      .set({
        approverStatus: REQUEST_STATUS.REJECTED,
        comments: comments || 'Rejected',
        modifiedDate: new Date()
      })
      .where(eq(approvalRequests.requestId, requestId))
      .returning();

    if (updateResult.length === 0) {
      throw new Error('Failed to update request status');
    }

    console.log('✅ [API] Request rejected successfully:', requestId);

    return createSuccessResponse({ 
      success: true,
      requestId,
      status: REQUEST_STATUS.REJECTED,
      rejectedBy: approver,
      comments
    });

  } catch (error) {
    console.error('❌ [API] Error rejecting request:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [API] Error details:', errorMessage);
    
    return createErrorResponse('Failed to reject request', 500);
  }
}