// src/app/api/admin/dictionaries/facilities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { facility } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditFacilityCreated } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

// GET - Fetch all facilities
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

    const facilities = await db.select().from(facility)
    
    return createSuccessResponse({ 
      data: facilities,
      message: `Retrieved ${facilities.length} facilities` 
    })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return createErrorResponse(error)
  }
}

// POST - Create new facility
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
      facilityCode,
      facilityDescription,
      facilityCombined,
      createdBy
    } = body

    // Validate required fields
    if (!facilityCode) {
      return createErrorResponse(new Error('Facility code is required'), 400)
    }

    // Insert new facility with audit fields
    const [newFacility] = await db.insert(facility).values({
      facilityCode,
      facilityDescription,
      facilityCombined: facilityCombined || `${facilityCode} - ${facilityDescription || ''}`,
      createdBy,
      updatedBy: createdBy,
      createdDate: new Date(),
      modifiedDate: new Date()
    }).returning()

    // Log to workflow history
    await auditFacilityCreated(
      newFacility.facilityCode,
      createdBy,
      newFacility,
      `Facility created: ${facilityCode} - ${facilityDescription}`
    )

    // Console log for debugging
    console.log(`✅ Facility created by ${createdBy}:`, {
      code: facilityCode,
      description: facilityDescription
    })

    return createSuccessResponse({ 
      data: newFacility,
      message: 'Facility created successfully' 
    })
  } catch (error) {
    console.error('Error creating facility:', error)
    return createErrorResponse(error)
  }
}