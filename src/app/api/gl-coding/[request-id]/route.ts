import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { getGLCodingDataByRequestId } from '@/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "request-id": string }> }
) {
  try {
    console.log('🔄 [API] gl-coding/[requestId] endpoint hit');

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
      console.log('❌ [API] Invalid role for gl-coding access:', userRole);
      return NextResponse.json({ 
        error: 'Only requesters and admins can access GL coding data' 
      }, { status: 403 });
    }

    const { "request-id": requestId } = await params;
    
    if (!requestId) {
      throw new ValidationError('Missing required parameter: requestId');
    }

    console.log('🔍 [API] Fetching GL coding data for requestId:', requestId);

    // Obtener datos de GL Coding
    const glCodingEntries = await getGLCodingDataByRequestId(requestId);
    
    console.log(`✅ [API] Found ${glCodingEntries.length} GL coding entries for request: ${requestId}`);

    return createSuccessResponse({ 
      glCodingEntries,
      requestId,
      total: glCodingEntries.length
    });

  } catch (error) {
    console.error('❌ [API] Error loading GL coding data:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(`Failed to load GL coding data: ${errorMessage}`, 500);
  }
}