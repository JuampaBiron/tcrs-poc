// src/app/api/admin/dictionaries/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { accountsMaster } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditAccountUpdated, auditAccountDeleted } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT - Update account
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return createErrorResponse(new Error('Authentication required'), 401)
    }

    const userRole = session.user.role
    if (!isValidUserRole(userRole) || userRole !== USER_ROLES.ADMIN) {
      return createErrorResponse(new Error('Admin access required'), 403)
    }

    const { id } = params // This is the accountCode
    const body = await request.json()
    const {
      accountDescription,
      accountCombined,
      updatedBy
    } = body

    // Get current account for audit trail
    const [currentAccount] = await db
      .select()
      .from(accountsMaster)
      .where(eq(accountsMaster.accountCode, id))

    if (!currentAccount) {
      return createErrorResponse(new Error('Account not found'), 404)
    }

    // Update account with audit fields
    const [updatedAccount] = await db
      .update(accountsMaster)
      .set({
        accountDescription,
        accountCombined: accountCombined || `${id} - ${accountDescription || ''}`,
        updatedBy,
        modifiedDate: new Date()
      })
      .where(eq(accountsMaster.accountCode, id))
      .returning()

    // Log to workflow history
    await auditAccountUpdated(
      updatedAccount.accountCode,
      updatedBy,
      currentAccount,
      updatedAccount,
      `Account updated: ${id} - ${accountDescription}`
    )

    // Console log for debugging
    console.log(`✏️ Account updated by ${updatedBy}:`, {
      code: id,
      description: accountDescription
    })

    return createSuccessResponse({ 
      data: updatedAccount,
      message: 'Account updated successfully' 
    })
  } catch (error) {
    console.error('Error updating account:', error)
    return createErrorResponse(error)
  }
}

// DELETE - Delete account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return createErrorResponse(new Error('Authentication required'), 401)
    }

    const userRole = session.user.role
    if (!isValidUserRole(userRole) || userRole !== USER_ROLES.ADMIN) {
      return createErrorResponse(new Error('Admin access required'), 403)
    }

    const { id } = params // This is the accountCode
    const body = await request.json()
    const { deletedBy } = body

    // Get account info before deletion for audit log
    const [accountToDelete] = await db
      .select()
      .from(accountsMaster)
      .where(eq(accountsMaster.accountCode, id))

    if (!accountToDelete) {
      return createErrorResponse(new Error('Account not found'), 404)
    }

    // Delete account
    await db.delete(accountsMaster).where(eq(accountsMaster.accountCode, id))

    // Log to workflow history
    await auditAccountDeleted(
      accountToDelete.accountCode,
      deletedBy,
      accountToDelete,
      `Account deleted: ${accountToDelete.accountCode} - ${accountToDelete.accountDescription}`
    )

    // Console log for debugging
    console.log(`🗑️ Account deleted by ${deletedBy}:`, {
      code: accountToDelete.accountCode,
      description: accountToDelete.accountDescription
    })

    return createSuccessResponse({ 
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return createErrorResponse(error)
  }
}