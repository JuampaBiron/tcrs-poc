import { NextRequest } from 'next/server'
import { getRequestStats, getRequestStatsByUser, getRequestStatsByApprover } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, isValidUserRole } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const email = searchParams.get('email')

    if (!role || !email) {
      throw new ValidationError('Missing required parameters: role and email')
    }

    if (!isValidUserRole(role)) {
      throw new ValidationError('Invalid role. Must be requester, approver, or admin')
    }

    let stats
    
    switch (role) {
      case USER_ROLES.REQUESTER:
        stats = await getRequestStatsByUser(email)
        break
      case USER_ROLES.APPROVER:
        stats = await getRequestStatsByApprover(email)
        break
      case USER_ROLES.ADMIN:
        stats = await getRequestStats()
        break
      default:
        throw new ValidationError('Invalid role')
    }

    return createSuccessResponse({ stats })

  } catch (error) {
    // Fallback stats on error
    if (error instanceof ValidationError) {
      return createErrorResponse(error)
    }
    
    console.error('Error fetching stats:', error)
    return createSuccessResponse({ 
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 } 
    })
  }
}