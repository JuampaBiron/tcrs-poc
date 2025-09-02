import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES, REQUEST_STATUS } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { getMyRequestsWithDetails } from '@/db/queries';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API] my-requests endpoint hit');

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      console.log('❌ [API] No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verificar que el usuario tenga rol apropiado
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

    if (userRole !== USER_ROLES.REQUESTER && userRole !== USER_ROLES.ADMIN) {
      console.log('❌ [API] Invalid role for my-requests:', userRole);
      return NextResponse.json({ 
        error: 'Only requesters and admins can view user requests' 
      }, { status: 403 });
    }

    const userEmail = session.user.email!;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const statusFilter = searchParams.get('status');

    console.log('🔍 [API] Params - email:', email, 'statusFilter:', statusFilter, 'userEmail:', userEmail);

    // Validar parámetros
    if (!email) {
      throw new ValidationError('Missing required parameter: email');
    }

    // Solo admins pueden ver requests de otros usuarios
    if (email !== userEmail && userRole !== USER_ROLES.ADMIN) {
      console.log('❌ [API] Email mismatch - user:', userEmail, 'requested:', email);
      return NextResponse.json({ 
        error: 'Email mismatch - can only access own data unless admin' 
      }, { status: 403 });
    }

    // Obtener requests usando la query centralizada
    console.log('📋 [API] Calling getMyRequestsWithDetails for:', email);
    let requests = await getMyRequestsWithDetails(email);
    console.log(`✅ [API] Fetched ${requests.length} requests for user: ${email}`);
    
    // Log de sample de datos para debugging
    if (requests.length > 0) {
      console.log('🔍 [API] Sample request structure:', {
        requestId: requests[0].requestId,
        approverStatus: requests[0].approverStatus,
        amount: requests[0].amount,
        vendor: requests[0].vendor,
        createdDate: requests[0].createdDate,
        hasAllFields: !!(requests[0].requestId && requests[0].approverStatus)
      });
    }

    // Filtro por status si se proporciona
    if (statusFilter && statusFilter !== 'all') {
      const validStatuses = Object.values(REQUEST_STATUS);
      console.log('🔍 [API] Applying status filter:', statusFilter, 'Valid statuses:', validStatuses);
      
      if (validStatuses.includes(statusFilter as any)) {
        const initialCount = requests.length;
        requests = requests.filter(r => r.approverStatus === statusFilter);
        console.log(`🔍 [API] Filtered from ${initialCount} to ${requests.length} requests`);
      } else {
        console.log('⚠️ [API] Invalid status filter:', statusFilter);
      }
    }

    console.log(`🎉 [API] Returning ${requests.length} requests`);
    
    // Retornar con estructura consistente
    return createSuccessResponse({ 
      requests,
      total: requests.length,
      email: email,
      appliedFilters: {
        status: statusFilter || 'all'
      }
    });

  } catch (error) {
    console.error('❌ [API] Error loading user requests:', error);
    
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
    
    return createErrorResponse('Failed to load user requests', 500);
  }
}