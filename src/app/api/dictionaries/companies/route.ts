// src/app/api/dictionaries/companies/route.ts
import { NextResponse } from 'next/server'
import { getAvailableCompanies } from '@/db/queries'
import { createSuccessResponse, createErrorResponse } from '@/lib/error-handler'

export async function GET() {
  try {
    console.log('🏢 Fetching companies from approver_list...')
    
    const companies = await getAvailableCompanies()
    
    console.log(`✅ Found ${companies.length} companies:`, companies.map(c => c.code))
    
    return createSuccessResponse({ companies })
  } catch (error) {
    console.error('❌ Error fetching companies:', error)
    return createErrorResponse(error as Error)
  }
}