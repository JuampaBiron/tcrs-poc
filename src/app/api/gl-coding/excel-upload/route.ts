// src/app/api/gl-coding/excel-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

function parseExcelAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === 'object' && 'result' in value) {
    return parseExcelAmount(value.result);
  }
  return 0;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Excel Upload API hit!');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Only Excel files (.xlsx, .xls) are allowed' }, { status: 400 });
    }

    // Process Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'Excel file contains no worksheets' }, { status: 400 });
    }

    // Process rows (9 column format)
    const entries: any[] = [];
    const validationErrors: string[] = [];

    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header

      const rowData = {
        line: row.getCell(1).text?.trim() || '',
        accountCode: row.getCell(2).text?.trim() || '',
        accountDescription: row.getCell(3).text?.trim() || '',
        facilityCode: row.getCell(4).text?.trim() || '',
        facilityDescription: row.getCell(5).text?.trim() || '',
        taxCode: row.getCell(6).text?.trim() || '',
        amount: parseExcelAmount(row.getCell(7).value),
        equipment: row.getCell(8).text?.trim() || '',
        comments: row.getCell(9).text?.trim() || ''
      };

      // Skip empty rows
      if (!rowData.accountCode && !rowData.facilityCode && !rowData.amount) {
        return;
      }

      // Basic validation (NO dictionary validation)
      const rowNum = rowNumber - 1;
      if (!rowData.accountCode) {
        validationErrors.push(`Row ${rowNum}: Account Code is required`);
      }
      if (!rowData.facilityCode) {
        validationErrors.push(`Row ${rowNum}: Facility Code is required`);
      }
      if (!rowData.amount || rowData.amount <= 0) {
        validationErrors.push(`Row ${rowNum}: Valid amount is required`);
      }

      entries.push({
        accountCode: rowData.accountCode,
        facilityCode: rowData.facilityCode,
        taxCode: rowData.taxCode,
        amount: rowData.amount,
        equipment: rowData.equipment,
        comments: rowData.comments
      });
    });

    console.log(`📊 Processed ${entries.length} entries from Excel`);

    return NextResponse.json({
      success: true,
      preview: entries,
      validationErrors,
      totalEntries: entries.length,
      totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0),
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error('❌ Excel processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}