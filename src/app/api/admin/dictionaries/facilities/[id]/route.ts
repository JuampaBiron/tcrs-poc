// src/app/api/admin/dictionaries/facilities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { facility } from '@/db/schema'
import { USER_ROLES, isValidUserRole } from '@/constants'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'
import { auditFacilityUpdated, auditFacilityDeleted } from '@/lib/dictionary-audit'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT - Update facility
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

    const { id } = params // This is the facilityCode
    const body = await request.json()
    const {
      facilityDescription,
      facilityCombined,
      updatedBy
    } = body

    // Get current facility for audit trail
    const [currentFacility] = await db
      .select()
      .from(facility)
      .where(eq(facility.facilityCode, id))

    if (!currentFacility) {
      return createErrorResponse(new Error('Facility not found'), 404)
    }

    // Update facility with audit fields
    const [updatedFacility] = await db
      .update(facility)
      .set({
        facilityDescription,
        facilityCombined: facilityCombined || `${id} - ${facilityDescription || ''}`,
        updatedBy,
        modifiedDate: new Date()
      })
      .where(eq(facility.facilityCode, id))
      .returning()

    // Log to workflow history
    await auditFacilityUpdated(
      updatedFacility.facilityCode,
      updatedBy,
      currentFacility,
      updatedFacility,
      `Facility updated: ${id} - ${facilityDescription}`
    )

    // Console log for debugging
    console.log(`✏️ Facility updated by ${updatedBy}:`, {
      code: id,
      description: facilityDescription
    })

    return createSuccessResponse({ 
      data: updatedFacility,
      message: 'Facility updated successfully' 
    })
  } catch (error) {
    console.error('Error updating facility:', error)
    return createErrorResponse(error)
  }
}

// DELETE - Delete facility
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

    const { id } = params // This is the facilityCode
    const body = await request.json()
    const { deletedBy } = body

    // Get facility info before deletion for audit log
    const [facilityToDelete] = await db
      .select()
      .from(facility)
      .where(eq(facility.facilityCode, id))

    if (!facilityToDelete) {
      return createErrorResponse(new Error('Facility not found'), 404)
    }

    // Delete facility
    await db.delete(facility).where(eq(facility.facilityCode, id))

    // Log to workflow history
    await auditFacilityDeleted(
      facilityToDelete.facilityCode,
      deletedBy,
      facilityToDelete,
      `Facility deleted: ${facilityToDelete.facilityCode} - ${facilityToDelete.facilityDescription}`
    )

    // Console log for debugging
    console.log(`🗑️ Facility deleted by ${deletedBy}:`, {
      code: facilityToDelete.facilityCode,
      description: facilityToDelete.facilityDescription
    })

    return createSuccessResponse({ 
      message: 'Facility deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return createErrorResponse(error)
  }
}