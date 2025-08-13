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

    // Transform data for export - ✅ Usar modifiedDate en lugar de updatedDate
    const exportData = requests.map(req => ({
      'Request ID': req.requestId,
      'Description': req.comments || 'No description', 
      'Status': req.approverStatus || REQUEST_STATUS.PENDING,
      'Requester': req.requester || 'Unknown',
      'Assigned Approver': req.assignedApprover || 'Unassigned',
      'Created Date': req.createdDate ? new Date(req.createdDate).toLocaleDateString() : 'Unknown',
      'Modified Date': req.modifiedDate ? new Date(req.modifiedDate).toLocaleDateString() : 'N/A' // ✅ Corregido
    }))

    // Create CSV content - ✅ Mejor manejo de tipos
    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 400 })
    }

    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '' // ✅ Tipo seguro
          // Escapar comillas y envolver en comillas si contiene comas o comillas
          const stringValue = String(value)
          const needsQuotes = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          if (needsQuotes) {
            return `"${stringValue.replace(/"/g, '""')}"` // Escapar comillas dobles
          }
          return stringValue
        }).join(',')
      )
    ].join('\n')

    console.log(`✅ Exporting ${exportData.length} records`)

    // Return CSV as downloadable response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tcrs-requests-${new Date().toISOString().split('T')[0]}.csv"`
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