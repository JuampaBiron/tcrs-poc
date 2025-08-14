// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import { getUserRole } from "@/lib/auth-utils"
import { getRequestStats, getRequestStatsByUser, getRequestStatsByApprover } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, isValidUserRole } from '@/constants'

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