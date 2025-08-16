// Reemplazar src/app/api/export/route.ts con esta versión corregida:

import { NextRequest, NextResponse } from 'next/server'
import { getRequestsByUser, getRequestsByApprover, getAllRequests } from '@/db/queries'
import { USER_ROLES, REQUEST_STATUS } from '@/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, email, filters } = body

    if (!role || !email) {
      return NextResponse.json({ error: 'Missing role or email' }, { status: 400 })
    }

    console.log(`📋 Exporting data for ${role}: ${email}`)
    console.log(`🔍 Applied filters:`, filters)

    // 1. Obtener todos los requests según el rol
    let requests
    
    switch (role) {
      case USER_ROLES.REQUESTER:
        requests = await getRequestsByUser(email)
        break
      case USER_ROLES.APPROVER:
        requests = await getRequestsByApprover(email)
        break
      case USER_ROLES.ADMIN:
        requests = await getAllRequests()
        break
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 2. ✅ APLICAR FILTROS A LOS DATOS (esto faltaba!)
    let filteredRequests = requests

    // Filtrar por searchQuery si existe
    if (filters?.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase()
      filteredRequests = filteredRequests.filter(req => {
        const title = (req.comments || '').toLowerCase()
        const requester = (req.requester || '').toLowerCase()
        return title.includes(searchTerm) || requester.includes(searchTerm)
      })
    }

    // Filtrar por status si existe
    if (filters?.status) {
      filteredRequests = filteredRequests.filter(req => 
        (req.approverStatus || REQUEST_STATUS.PENDING) === filters.status
      )
    }

    // Filtrar por branch si existe
    if (filters?.branch) {
      filteredRequests = filteredRequests.filter(req => {
        const comments = req.comments || ''
        // Extraer branch del campo comments (como está implementado actualmente)
        const branchMatch = comments.match(/(TCRS - Branch \d+|Sitech|Fused-[A-Za-z]+)/i)
        const branch = branchMatch ? branchMatch[1] : 'Unknown Branch'
        
        // Mapear filtros del frontend a valores reales
        const branchMappings: { [key: string]: string } = {
          'branch1': 'TCRS - Branch 1',
          'branch2': 'TCRS - Branch 2', 
          'sitech': 'Sitech',
          'fused-canada': 'Fused-Canada'
        }
        
        const expectedBranch = branchMappings[filters.branch.toLowerCase()] || filters.branch
        return branch.toLowerCase().includes(expectedBranch.toLowerCase())
      })
    }

    // Filtrar por dateRange si existe
    if (filters?.dateRange && filteredRequests.length > 0) {
      const now = new Date()
      let cutoffDate: Date
      
      switch (filters.dateRange) {
        case 'last7days':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last90days':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0) // No filtrar
      }
      
      filteredRequests = filteredRequests.filter(req => {
        const createdDate = req.createdDate ? new Date(req.createdDate) : new Date(0)
        return createdDate >= cutoffDate
      })
    }

    // Filtrar por amount si existe (necesita extraer el monto del comments)
    if (filters?.amount) {
      filteredRequests = filteredRequests.filter(req => {
        const comments = req.comments || ''
        // Extraer monto del campo comments
        const amountMatch = comments.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i)
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0
        
        switch (filters.amount) {
          case 'under1000':
            return amount < 1000
          case '1000to5000':
            return amount >= 1000 && amount <= 5000
          case 'over5000':
            return amount > 5000
          default:
            return true
        }
      })
    }

    console.log(`📊 Original records: ${requests.length}, Filtered records: ${filteredRequests.length}`)

    // 3. Transform data for export
    const exportData = filteredRequests.map(req => ({
      'Request ID': req.requestId,
      'Description': req.comments || 'No description', 
      'Status': req.approverStatus || REQUEST_STATUS.PENDING,
      'Requester': req.requester || 'Unknown',
      'Assigned Approver': req.assignedApprover || 'Unassigned',
      'Created Date': req.createdDate ? new Date(req.createdDate).toLocaleDateString() : 'Unknown',
      'Modified Date': req.modifiedDate ? new Date(req.modifiedDate).toLocaleDateString() : 'N/A'
    }))

    // 4. Create CSV content
    if (exportData.length === 0) {
      return NextResponse.json({ 
        error: 'No data to export with current filters',
        message: 'Try adjusting your filters or search criteria'
      }, { status: 400 })
    }

    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          const stringValue = String(value)
          const needsQuotes = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          if (needsQuotes) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ].join('\n')

    console.log(`✅ Exporting ${exportData.length} filtered records`)

    // 5. Return filtered CSV
    const filename = `tcrs-requests-${filters?.searchQuery ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('❌ Error exporting data:', error)
    return NextResponse.json({ 
      error: 'Export failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}