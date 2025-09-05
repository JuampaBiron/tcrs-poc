// src/app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import { getUserRole } from "@/lib/auth-utils"
import { getRequestsByUser, getRequestsByApprover, getAllRequests, getRequestsTableData } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, REQUEST_STATUS, isValidUserRole } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // VALIDAR QUE EL USUARIO TENGA GRUPOS VÁLIDOS
    let userRole;
    try {
      userRole = getUserRole(session.user);
    } catch (error) {
      console.log('User not authorized - no TCRS groups:', session.user.email)
      return NextResponse.json({ 
        error: 'User not authorized - not in any TCRS group' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const email = searchParams.get('email')

    if (!role || !email) {
      throw new ValidationError('Missing required parameters: role and email')
    }

    if (!isValidUserRole(role)) {
      throw new ValidationError('Invalid role. Must be requester, approver, or admin')
    }

    // Verificar que el rol del parámetro coincida con el rol del usuario autenticado
    if (role !== userRole) {
      return NextResponse.json({ 
        error: 'Role mismatch - not authorized for this role' 
      }, { status: 403 })
    }

    // Verificar que el email coincida con el usuario autenticado
    if (email !== session.user.email) {
      return NextResponse.json({ 
        error: 'Email mismatch - can only access own data' 
      }, { status: 403 })
    }

    // Use the enhanced query that includes invoice data and GL coding count
    const requests = await getRequestsTableData({
      userEmail: email,
      userRole: role as any // Cast to UserRole type
    })

    // Transform data for frontend with enhanced fields
    const transformedRequests = requests.map(req => ({
      id: req.requestId,
      requestId: req.requestId,
      title: `${req.vendor || 'Unknown Vendor'} - ${req.currency || ''} ${req.amount || '0'}`,
      status: req.approverStatus || REQUEST_STATUS.PENDING,
      reviewer: req.assignedApprover || 'Unassigned',
      requester: req.requester || 'Unknown',
      submittedOn: req.createdDate ? new Date(req.createdDate).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: '2-digit'
      }) : 'Unknown',
      // Enhanced fields from joined tables
      company: req.company || 'Unknown',
      branch: req.branch || 'Unknown',
      vendor: req.vendor || 'Unknown',
      po: req.po || 'N/A',
      amount: req.amount || '0',
      currency: req.currency || '',
      approverStatus: req.approverStatus || REQUEST_STATUS.PENDING,
      assignedApprover: req.assignedApprover || 'Not Assigned',
      approvedDate: req.approvedDate,
      glCodingCount: req.glCodingCount || 0
    }))

    return createSuccessResponse({ requests: transformedRequests })

  } catch (error) {
    return createErrorResponse(error as Error)
  }
}

// Helper functions to extract data from comments
function extractBranch(comments: string): string {
  const branchMatch = comments.match(/(TCRS - Branch \d+|Sitech|Fused-[A-Za-z]+)/i)
  return branchMatch ? branchMatch[1] : 'Unknown Branch'
}

function extractAmount(comments: string): string {
  const amountMatch = comments.match(/\$[\d,]+(?:\.\d{2})?/i)
  return amountMatch ? amountMatch[0] : '$0'
}