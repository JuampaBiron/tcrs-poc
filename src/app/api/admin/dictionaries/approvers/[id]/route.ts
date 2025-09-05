// src/app/api/admin/dictionaries/approvers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { approverList } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditApproverUpdated, auditApproverDeleted } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT - Update approver
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

    const { id } = params
    const body = await request.json()
    const {
      erp,
      branch,
      authorizedAmount,
      authorizedApprover,
      emailAddress,
      backUpApprover,
      backUpEmailAddress,
      updatedBy
    } = body

    // Validate required fields
    if (!authorizedApprover || !branch) {
      return createErrorResponse(new Error('Authorized approver and branch are required'), 400)
    }

    // Get current approver for audit trail
    const [currentApprover] = await db
      .select()
      .from(approverList)
      .where(eq(approverList.approverId, id))

    if (!currentApprover) {
      return createErrorResponse(new Error('Approver not found'), 404)
    }

    // Update approver with audit fields
    const [updatedApprover] = await db
      .update(approverList)
      .set({
        erp,
        branch,
        authorizedAmount: authorizedAmount ? authorizedAmount.toString() : null,
        authorizedApprover,
        emailAddress,
        backUpApprover,
        backUpEmailAddress,
        updatedBy,
        modifiedDate: new Date()
      })
      .where(eq(approverList.approverId, id))
      .returning()

    // Log to workflow history
    await auditApproverUpdated(
      updatedApprover.approverId,
      updatedBy,
      currentApprover,
      updatedApprover,
      `Approver updated: ${authorizedApprover} for branch ${branch}`
    )

    // Console log for debugging
    console.log(`✏️ Approver updated by ${updatedBy}:`, {
      id: updatedApprover.approverId,
      approver: authorizedApprover,
      branch
    })

    return createSuccessResponse({ 
      data: updatedApprover,
      message: 'Approver updated successfully' 
    })
  } catch (error) {
    console.error('Error updating approver:', error)
    return createErrorResponse(error)
  }
}

// DELETE - Delete approver
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

    const { id } = params
    const body = await request.json()
    const { deletedBy } = body

    // Get approver info before deletion for audit log
    const [approverToDelete] = await db
      .select()
      .from(approverList)
      .where(eq(approverList.approverId, id))

    if (!approverToDelete) {
      return createErrorResponse(new Error('Approver not found'), 404)
    }

    // Delete approver
    await db.delete(approverList).where(eq(approverList.approverId, id))

    // Log to workflow history
    await auditApproverDeleted(
      approverToDelete.approverId,
      deletedBy,
      approverToDelete,
      `Approver deleted: ${approverToDelete.authorizedApprover} from branch ${approverToDelete.branch}`
    )

    // Console log for debugging
    console.log(`🗑️ Approver deleted by ${deletedBy}:`, {
      id: approverToDelete.approverId,
      approver: approverToDelete.authorizedApprover,
      branch: approverToDelete.branch
    })

    return createSuccessResponse({ 
      message: 'Approver deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting approver:', error)
    return createErrorResponse(error)
  }
}