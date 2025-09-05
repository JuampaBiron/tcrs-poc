// src/app/api/invoices/download-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES } from '@/constants';
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler';
import { generateBlobSASUrl } from '@/lib/blob-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API] PDF download endpoint hit');

    // Verify authentication
    const session = await auth();
    if (!session?.user) {
      console.log('❌ [API] No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user role (approvers and admins can download PDFs)
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
      console.log('❌ [API] Invalid role for PDF download:', userRole);
      return NextResponse.json({ 
        error: 'Only approvers and admins can download PDFs' 
      }, { status: 403 });
    }

    // Parse request body
    const { blobUrl, requestId } = await request.json();

    if (!blobUrl) {
      throw new ValidationError('blobUrl is required');
    }

    if (!requestId) {
      throw new ValidationError('requestId is required');
    }

    console.log('🔍 [API] Generating SAS URL for PDF download:', {
      requestId,
      userEmail: session.user.email,
      userRole
    });

    // Generate SAS URL (expires in 10 minutes for security)
    const sasUrl = await generateBlobSASUrl(blobUrl, 10);

    console.log('✅ [API] SAS URL generated successfully for request:', requestId);

    return createSuccessResponse({ 
      sasUrl,
      requestId,
      expiresIn: 10 // minutes
    });

  } catch (error) {
    console.error('❌ [API] Error generating PDF download URL:', error);
    
    if (error instanceof ValidationError) {
      return createErrorResponse(error.message, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [API] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name || 'Unknown'
    });
    
    return createErrorResponse('Failed to generate PDF download URL', 500);
  }
}