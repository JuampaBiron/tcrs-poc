import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES, REQUEST_STATUS } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { getMyRequestsWithDetails } from '@/db/queries';

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
    const email = searchParams.get('email');
    const statusFilter = searchParams.get('status');

    // Validar parámetros
    if (!email) {
      throw new ValidationError('Missing required parameter: email');
    }

    if (email !== userEmail && userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json({ 
        error: 'Email mismatch - can only access own data unless admin' 
      }, { status: 403 });
    }

    // Obtener requests usando la query centralizada
    let requests = await getMyRequestsWithDetails(email);
    console.log(`***********Fetched ${requests.length} requests for user: ${email}`);

    // Filtro por status si se proporciona
    if (statusFilter && statusFilter !== 'all') {
      const validStatuses = Object.values(REQUEST_STATUS);
      if (validStatuses.includes(statusFilter as any)) {
        requests = requests.filter(r => r.approverStatus === statusFilter);
      }
    }

    return createSuccessResponse({ requests });

  } catch (error) {
    console.error('❌ Error loading user requests:', error);
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    return createErrorResponse('Failed to load user requests', 500);
  }
}