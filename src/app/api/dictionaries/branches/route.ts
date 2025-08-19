// src/app/api/dictionaries/branches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAvailableBranches } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const erp = searchParams.get('erp')
    
    if (!erp) {
      throw new ValidationError('ERP parameter is required')
    }
    
    console.log(`🏗️ Fetching branches for company: ${erp}`)
    
    const branches = await getAvailableBranches(erp)
    
    console.log(`✅ Found ${branches.length} branches for ${erp}:`, branches.map(b => b.code))
    
    return createSuccessResponse({ branches })
  } catch (error) {
    console.error('❌ Error fetching branches:', error)
    return createErrorResponse(error as Error)
  }
}