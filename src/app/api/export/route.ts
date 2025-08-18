// Archivo: src/app/api/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@/auth"
import { getUserRole } from "@/lib/auth-utils"
import { getRequestsByUser, getRequestsByApprover, getAllRequests } from '@/db/queries'
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, REQUEST_STATUS, isValidUserRole } from '@/constants'
import ExcelJS from 'exceljs' // ✅ Import ExcelJS

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

    // 4. Obtener datos según el rol
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
        throw new ValidationError('Invalid role')
    }

    // 5. Aplicar filtros
    const filteredRequests = requests.filter(req => {
      const matchesSearch = filters?.searchQuery ? 
        (req.comments?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
         req.requester?.toLowerCase().includes(filters.searchQuery.toLowerCase())) : true
      
      const matchesStatus = filters?.status ? req.approverStatus === filters.status : true
      const matchesBranch = filters?.branch ? 
        extractBranch(req.comments || '').includes(filters.branch) : true
      
      return matchesSearch && matchesStatus && matchesBranch
    })

    if (filteredRequests.length === 0) {
      return NextResponse.json({ 
        error: 'No data to export with current filters',
        message: 'Try adjusting your filters or search criteria'
      }, { status: 400 })
    }

    // 6. ✅ CREAR EXCEL SIMPLE
    const excelBuffer = await createSimpleExcel(filteredRequests)

    console.log(`✅ Exporting ${filteredRequests.length} records to simple Excel`)

    // 7. ✅ RETORNAR ARCHIVO EXCEL
    const filename = `tcrs-requests-${filters?.searchQuery ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
    
    // ✅ FIX: Use Uint8Array.from() to create a web-compatible ArrayBuffer from the Node.js Buffer
    return new NextResponse(Uint8Array.from(excelBuffer), { 
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-cache',
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

// ===== FUNCIÓN SIMPLE DE CREACIÓN DE EXCEL =====

async function createSimpleExcel(requests: any[]): Promise<Buffer> {
  
  // ✅ Crear workbook básico
  const workbook = new ExcelJS.Workbook()
  
  // ✅ Crear una sola hoja llamada "Base"
  const worksheet = workbook.addWorksheet('Base')

  // ✅ Preparar datos simples
  const exportData = requests.map(req => ({
    'Request ID': req.requestId,
    'Description': req.comments || 'No description',
    'Status': req.approverStatus || REQUEST_STATUS.PENDING,
    'Requester': req.requester || 'Unknown',
    'Assigned Approver': req.assignedApprover || 'Unassigned',
    'Created Date': req.createdDate ? formatSimpleDate(req.createdDate) : '',
    'Modified Date': req.modifiedDate ? formatSimpleDate(req.modifiedDate) : '',
    'Branch': extractBranch(req.comments || ''),
    'Amount': extractAmount(req.comments || ''),
    'Currency': extractCurrency(req.comments || 'CAD')
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
  
  // ✅ Agregar datos (sin formato especial)
  exportData.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(rowIndex + 2) // Empezar en fila 2
    const values = Object.values(row)
    
    values.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      cell.value = value
      // ✅ Sin formato especial, solo el valor
    })
  })

  // ✅ Ajustar ancho de columnas automáticamente
  headers.forEach((header, index) => {
    const column = worksheet.getColumn(index + 1)
    let maxLength = header.length
    
    // Calcular ancho basado en contenido
    exportData.forEach(row => {
      const value = Object.values(row)[index]
      const valueLength = String(value).length
      if (valueLength > maxLength) {
        maxLength = valueLength
      }
    })
    
    // Establecer ancho (mínimo 10, máximo 50)
    column.width = Math.max(10, Math.min(50, maxLength + 2))
  })

  // ✅ Generar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ===== FUNCIONES AUXILIARES SIMPLES =====

function formatSimpleDate(date: Date | string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  // ✅ Formato simple DD/MM/YYYY
  return d.toLocaleDateString('es-CL')
}

function extractBranch(comments: string): string {
  const branchMatch = comments.match(/(TCRS - Branch \d+|Sitech|Fused-[A-Za-z]+)/i)
  return branchMatch ? branchMatch[1] : 'Unknown'
}

function extractAmount(comments: string): string {
  const amountMatch = comments.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i)
  return amountMatch ? amountMatch[1] : 'N/A'
}

function extractCurrency(comments: string): string {
  const currencyMatch = comments.match(/\$[0-9,]+(?:\.[0-9]{2})?\s+([A-Z]{3})/i)
  return currencyMatch ? currencyMatch[1] : 'CAD'
}