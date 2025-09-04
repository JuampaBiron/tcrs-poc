import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import { getUserRole } from "@/lib/auth-utils"
import { getRequestsTableData, getTotalRequestsCount } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, REQUEST_STATUS, isValidUserRole } from '@/constants'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Validar usuario y roles
    let userRole;
    try {
      userRole = getUserRole(session.user);
    } catch (error) {
      return NextResponse.json({ 
        error: 'User not authorized - not in any TCRS group' 
      }, { status: 403 })
    }

    // 3. Obtener parámetros del body
    const body = await request.json()
    const { role, email, filters } = body

    if (!role || !email) {
      return NextResponse.json({ 
        error: 'Missing required parameters: role and email' 
      }, { status: 400 })
    }

    if (!isValidUserRole(role) || role !== userRole || email !== session.user.email) {
      return NextResponse.json({ 
        error: 'Invalid role or authorization' 
      }, { status: 403 })
    }

    // 4. Verificar total de registros disponibles
    const totalCount = await getTotalRequestsCount(role, email)
    console.log(`📊 Total available records: ${totalCount}`)
    
    if (totalCount === 0) {
      return NextResponse.json({ 
        error: 'No data available for export' 
      }, { status: 400 })
    }

    // 5. Obtener datos completos usando getRequestsTableData
    const requests = await getRequestsTableData({
      userEmail: email,
      userRole: role
    })

    console.log(`📊 Retrieved ${requests.length} requests with full data`)

    // 6. Aplicar filtros
    const filteredRequests = requests.filter(req => {
      const matchesSearch = filters?.searchQuery ? 
        (req.requester?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
         req.company?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
         req.vendor?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
         req.po?.toLowerCase().includes(filters.searchQuery.toLowerCase())) : true
      
      const matchesStatus = filters?.status ? req.approverStatus === filters.status : true
      const matchesBranch = filters?.branch ? req.branch?.includes(filters.branch) : true
      
      return matchesSearch && matchesStatus && matchesBranch
    })

    if (filteredRequests.length === 0) {
      return NextResponse.json({ 
        error: 'No data to export with current filters',
        message: 'Try adjusting your filters or search criteria'
      }, { status: 400 })
    }

    // 7. Aplicar límite de exportación
    const EXPORT_LIMIT = 1000
    const limitApplied = filteredRequests.length > EXPORT_LIMIT
    const finalRequests = limitApplied ? filteredRequests.slice(0, EXPORT_LIMIT) : filteredRequests
    
    console.log(`✅ Exporting ${finalRequests.length} records to Excel ${limitApplied ? '(LIMITED)' : ''}`)

    // 8. Retornar archivo Excel con streaming
    const limitSuffix = limitApplied ? '-limited' : ''
    const filename = `tcrs-requests${limitSuffix}-${filters?.searchQuery ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await createStreamedExcel(finalRequests, controller, {
            totalAvailable: totalCount,
            limitApplied: limitApplied,
            exportLimit: EXPORT_LIMIT,
            role: role
          })
          controller.close()
        } catch (error) {
          console.error('❌ Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, { 
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('❌ Error exporting Excel data:', error)
    return NextResponse.json({ 
      error: 'Excel export failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// ===== FUNCIÓN DE CREACIÓN DE EXCEL CON STREAMING =====

interface ExcelMetadata {
  totalAvailable: number
  limitApplied: boolean
  exportLimit: number
  role: string
}

async function createStreamedExcel(
  requests: any[], 
  controller: ReadableStreamDefaultController<Uint8Array>,
  metadata?: ExcelMetadata
) {
  
  // ✅ Crear workbook básico
  const workbook = new ExcelJS.Workbook()
  
  // ✅ Crear hoja principal
  const worksheet = workbook.addWorksheet('TCRS Data')
  
  // ✅ Agregar información sobre limitación si aplica
  if (metadata?.limitApplied) {
    const infoSheet = workbook.addWorksheet('Export Info')
    
    // Headers de información
    infoSheet.getCell('A1').value = 'TCRS Export Information'
    infoSheet.getCell('A1').font = { bold: true, size: 16 }
    infoSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }
    
    // Información detallada
    infoSheet.getCell('A3').value = 'Export Date:'
    infoSheet.getCell('B3').value = new Date().toLocaleString()
    infoSheet.getCell('A4').value = 'User Role:'
    infoSheet.getCell('B4').value = metadata.role.toUpperCase()
    infoSheet.getCell('A5').value = 'Total Records Available:'
    infoSheet.getCell('B5').value = metadata.totalAvailable
    infoSheet.getCell('A6').value = 'Records Exported:'
    infoSheet.getCell('B6').value = Math.min(requests.length, metadata.exportLimit)
    infoSheet.getCell('A7').value = 'Export Limit Applied:'
    infoSheet.getCell('B7').value = metadata.limitApplied ? 'YES' : 'NO'
    
    if (metadata.limitApplied) {
      infoSheet.getCell('A9').value = '⚠️ NOTICE:'
      infoSheet.getCell('A9').font = { bold: true, color: { argb: 'FFFF6600' } }
      infoSheet.getCell('A10').value = `This export is limited to the ${metadata.exportLimit} most recent records.`
      infoSheet.getCell('A11').value = `${metadata.totalAvailable - metadata.exportLimit} older records were not included.`
      infoSheet.getCell('A12').value = 'Apply filters to export specific data subsets.'
    }
    
    // Ajustar anchos
    infoSheet.getColumn('A').width = 25
    infoSheet.getColumn('B').width = 40
  }

  // ✅ Preparar datos con los campos exactos que retorna getRequestsTableData
  const exportData = requests.map((req: any) => ({
    'Request ID': req.requestId || 'N/A',
    'Company': req.company || 'Unknown',
    'Branch': req.branch || 'Unknown', 
    'Vendor': req.vendor || 'Unknown',
    'PO': req.po || 'N/A',
    'Amount': req.amount || '0',
    'Currency': req.currency || 'N/A',
    'Submitted On': req.createdDate ? formatSimpleDate(req.createdDate) : 'N/A',
    'GL Coding Count': req.glCodingCount || 0,
    'Status': req.approverStatus || REQUEST_STATUS.PENDING,
    'Approved Date': req.approvedDate ? formatSimpleDate(req.approvedDate) : 'N/A',
    'Requester': req.requester || 'Unknown',
    'Assigned Approver': req.assignedApprover || 'Unassigned',
    'Created Date': req.requestCreatedDate ? formatSimpleDate(req.requestCreatedDate) : 'N/A'
  }))

  // ✅ Obtener headers
  const headers = Object.keys(exportData[0])
  
  // ✅ Agregar headers con fondo verde (primera fila)
  const headerRow = worksheet.getRow(1)
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    
    // ✅ Solo color verde de fondo para headers
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' } // Verde
    }
    
    // ✅ Texto blanco y bold para que se vea bien
    cell.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    }
  })
  
  // ✅ Agregar datos en lotes para optimizar memoria
  const BATCH_SIZE = 500 // Procesar de 500 en 500 filas
  for (let i = 0; i < exportData.length; i += BATCH_SIZE) {
    const batch = exportData.slice(i, i + BATCH_SIZE)
    
    batch.forEach((row, batchIndex) => {
      const rowIndex = i + batchIndex
      const excelRow = worksheet.getRow(rowIndex + 2) // Empezar en fila 2
      const values = Object.values(row)
      
      values.forEach((value, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1)
        cell.value = value
      })
    })
    
    // ✅ Pequeña pausa para evitar bloquear el event loop
    if (i % (BATCH_SIZE * 4) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  // ✅ Ajustar ancho de columnas automáticamente
  headers.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1)
    let maxLength = header.length
    
    // Calcular ancho basado en una muestra para optimizar
    const sampleSize = Math.min(100, exportData.length)
    for (let i = 0; i < sampleSize; i++) {
      const value = Object.values(exportData[i])[index]
      const valueLength = String(value).length
      if (valueLength > maxLength) {
        maxLength = valueLength
      }
    }
    
    // Establecer ancho (mínimo 10, máximo 50)
    column.width = Math.max(10, Math.min(50, maxLength + 2))
  })

  // ✅ Generar Excel en buffer pero enviarlo por chunks para optimizar memoria
  const buffer = await workbook.xlsx.writeBuffer()
  
  // ✅ Enviar el buffer por chunks en lugar de todo de una vez
  const CHUNK_SIZE = 64 * 1024 // 64KB chunks
  const uint8Buffer = new Uint8Array(buffer)
  
  for (let i = 0; i < uint8Buffer.length; i += CHUNK_SIZE) {
    const chunk = uint8Buffer.slice(i, i + CHUNK_SIZE)
    controller.enqueue(chunk)
    
    // Pequeña pausa para evitar bloquear el event loop
    if (i % (CHUNK_SIZE * 4) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
}

// ===== FUNCIONES AUXILIARES =====

function formatSimpleDate(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  // ✅ Formato MM/DD/YY para coincidir con la tabla UI
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  })
}