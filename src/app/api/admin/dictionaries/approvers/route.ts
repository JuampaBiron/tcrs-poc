// src/app/api/admin/dictionaries/approvers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { approverList } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditApproverCreated } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

// GET - Fetch all approvers
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return createErrorResponse(new Error('Authentication required'), 401)
    }

    const userRole = session.user.role
    if (!isValidUserRole(userRole) || userRole !== USER_ROLES.ADMIN) {
      return createErrorResponse(new Error('Admin access required'), 403)
    }

    const approvers = await db.select().from(approverList)
    
    return createSuccessResponse({ 
      data: approvers,
      message: `Retrieved ${approvers.length} approvers` 
    })
  } catch (error) {
    console.error('Error fetching approvers:', error)
    return createErrorResponse(error)
  }
}

// POST - Create new approver
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return createErrorResponse(new Error('Authentication required'), 401)
    }

    const userRole = session.user.role
    if (!isValidUserRole(userRole) || userRole !== USER_ROLES.ADMIN) {
      return createErrorResponse(new Error('Admin access required'), 403)
    }

    const body = await request.json()
    const {
      erp,
      branch,
      authorizedAmount,
      authorizedApprover,
      emailAddress,
      backUpApprover,
      backUpEmailAddress,
      createdBy
    } = body

    // Validate required fields
    if (!authorizedApprover || !branch) {
      return createErrorResponse(new Error('Authorized approver and branch are required'), 400)
    }

    // Insert new approver with audit fields
    const [newApprover] = await db.insert(approverList).values({
      erp,
      branch,
      authorizedAmount: authorizedAmount ? authorizedAmount.toString() : null,
      authorizedApprover,
      emailAddress,
      backUpApprover,
      backUpEmailAddress,
      createdBy,
      updatedBy: createdBy,
      createdDate: new Date(),
      modifiedDate: new Date()
    }).returning()

    // Log to workflow history
    await auditApproverCreated(
      newApprover.approverId,
      createdBy,
      newApprover,
      `Approver created: ${authorizedApprover} for branch ${branch}`
    )

    // Console log for debugging
    console.log(`✅ Approver created by ${createdBy}:`, {
      id: newApprover.approverId,
      approver: authorizedApprover,
      branch
    })

    return createSuccessResponse({ 
      data: newApprover,
      message: 'Approver created successfully' 
    })
  } catch (error) {
    console.error('Error creating approver:', error)
    return createErrorResponse(error)
  }
}