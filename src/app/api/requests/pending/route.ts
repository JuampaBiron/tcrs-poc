import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES, REQUEST_STATUS } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { getApproverRequestsWithDetails } from '@/db/queries';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API] pending requests endpoint hit');

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
      console.log('❌ [API] Invalid role for pending requests:', userRole);
      return NextResponse.json({ 
        error: 'Only approvers and admins can view pending requests' 
      }, { status: 403 });
    }

    const userEmail = session.user.email!;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || userEmail;
    const statusFilter = searchParams.get('status') || 'pending';
    //const assignedOnly = searchParams.get('assignedOnly') === 'true';

    console.log('🔍 [API] Params - email:', email, 'statusFilter:', statusFilter, 'userEmail:', userEmail);

    // Solo admins pueden ver requests de otros approvers
    if (email !== userEmail && userRole !== USER_ROLES.ADMIN) {
      console.log('❌ [API] Email mismatch - user:', userEmail, 'requested:', email);
      return NextResponse.json({ 
        error: 'Email mismatch - can only access own assigned requests unless admin' 
      }, { status: 403 });
    }

    // Obtener requests asignadas al approver
    console.log('📋 [API] Calling getApproverRequestsWithDetails for:', email);
    let requests = await getApproverRequestsWithDetails(email);
    console.log('🔍 [API] Raw requests from DB:', requests.length, 'requests found');
    
    // Log de cada request encontrada
    requests.forEach((req, index) => {
      console.log(`🔍 [API] Request ${index + 1}:`, {
        requestId: req.requestId,
        assignedApprover: req.assignedApprover,
        approverStatus: req.approverStatus,
        requester: req.requester
      });
    });

    // Filtrar por status si se proporciona
    if (statusFilter && statusFilter !== 'all') {
      console.log(`🔍 [API] Filtering requests by status: ${statusFilter}`);
      requests = requests.filter(request => {
        const status = request.approverStatus?.toLowerCase();
        return status === statusFilter.toLowerCase();
      });
      console.log(`✅ [API] Filtered to ${requests.length} requests with status: ${statusFilter}`);
    }

    console.log(`✅ [API] Fetched ${requests.length} pending requests for approver: ${email}`);
    
    // Log de sample de datos para debugging
    if (requests.length > 0) {
      console.log('🔍 [API] Sample request structure:', {
        requestId: requests[0].requestId,
        requester: requests[0].requester,
        approverStatus: requests[0].approverStatus,
        amount: requests[0].amount,
        vendor: requests[0].vendor,
        company: requests[0].company,
        createdDate: requests[0].createdDate,
        hasAllFields: !!(requests[0].requestId && requests[0].requester)
      });
    }

    // Transformar datos para ApproverView
    const transformedRequests = requests.map((dbRequest: any) => ({
      id: dbRequest.requestId,
      requestId: dbRequest.requestId,
      title: `${dbRequest.vendor || 'Unknown Vendor'} - ${dbRequest.currency} ${dbRequest.amount || '0'}`,
      requester: dbRequest.requester || 'Unknown',
      amount: dbRequest.amount?.toString() || '0',
      currency: dbRequest.currency || 'CAD',
      submittedOn: typeof dbRequest.createdDate === 'string' 
        ? dbRequest.createdDate 
        : dbRequest.createdDate?.toISOString?.() || new Date().toISOString(),
      branch: dbRequest.branch || 'Unknown',
      vendor: dbRequest.vendor || 'Unknown',
      po: dbRequest.po || '',
      status: dbRequest.approverStatus || REQUEST_STATUS.PENDING,
      priority: 'medium' as const
    }));

    console.log(`🎉 [API] Returning ${transformedRequests.length} transformed pending requests`);
    
    // Retornar con estructura que espera ApproverView
    return createSuccessResponse({ 
      requests: transformedRequests,
      total: transformedRequests.length,
      assignedTo: email,
      appliedFilters: {
        status: statusFilter
        //assignedOnly
      }
    });

  } catch (error) {
    console.error('❌ [API] Error loading pending requests:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    
    // Log más detallado del error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('❌ [API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name || 'Unknown'
    });
    
    return createErrorResponse('Failed to load pending requests', 500);
  }
}