// src/app/api/admin/dictionaries/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { accountsMaster } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditAccountCreated } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

// GET - Fetch all accounts
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

    const accounts = await db.select().from(accountsMaster)
    
    return createSuccessResponse({ 
      data: accounts,
      message: `Retrieved ${accounts.length} accounts` 
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return createErrorResponse(error)
  }
}

// POST - Create new account
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
      accountCode,
      accountDescription,
      accountCombined,
      createdBy
    } = body

    // Validate required fields
    if (!accountCode) {
      return createErrorResponse(new Error('Account code is required'), 400)
    }

    // Insert new account with audit fields
    const [newAccount] = await db.insert(accountsMaster).values({
      accountCode,
      accountDescription,
      accountCombined: accountCombined || `${accountCode} - ${accountDescription || ''}`,
      createdBy,
      updatedBy: createdBy,
      createdDate: new Date(),
      modifiedDate: new Date()
    }).returning()

    // Log to workflow history
    await auditAccountCreated(
      newAccount.accountCode,
      createdBy,
      newAccount,
      `Account created: ${accountCode} - ${accountDescription}`
    )

    // Console log for debugging
    console.log(`✅ Account created by ${createdBy}:`, {
      code: accountCode,
      description: accountDescription
    })

    return createSuccessResponse({ 
      data: newAccount,
      message: 'Account created successfully' 
    })
  } catch (error) {
    console.error('Error creating account:', error)
    return createErrorResponse(error)
  }
}