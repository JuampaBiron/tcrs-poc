// src/app/api/gl-coding/excel-upload/route.ts - MODIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import ExcelJS from 'exceljs';

// Azure Blob Storage client (reutilizando la lógica del PDF)
const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf';
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage credentials not configured');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return {
    client: BlobServiceClient.fromConnectionString(connectionString),
    containerName
  };
};

/**
 * Generate blob-friendly timestamp without special characters
 */
function generateBlobFriendlyTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const millisecond = String(now.getMilliseconds()).padStart(3, '0');
  
  // Format: YYYYMMDD-HHMMSS-mmm (blob-friendly, no special chars)
  return `${year}${month}${day}-${hour}${minute}${second}-${millisecond}`;
}

/**
 * Sanitize filename to be blob-friendly
 */
function sanitizeFileName(fileName: string): string {
  // Replace problematic characters with underscores
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

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

    // Process Excel file first
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'Excel file contains no worksheets' }, { status: 400 });
    }

    // Process rows (9 column format) - EXISTING LOGIC
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

    // ✅ NEW: Upload Excel file to blob storage if processing was successful
    let tempBlobUrl = null;
    let blobName = null;
    
    if (entries.length > 0) {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = generateBlobFriendlyTimestamp();
        const randomId = Math.random().toString(36).substr(2, 9);
        const sanitizedFileName = sanitizeFileName(file.name);
        
        // ✅ Blob name for GL Coding Excel files: gl-coding-xlsx/gl-coding/${year}/${month}/TEMP-*
        blobName = `gl-coding-xlsx/gl-coding/${year}/${month}/TEMP-${timestamp}_${sanitizedFileName}`;
        
        console.log(`📤 Uploading Excel to blob: ${blobName}`);
        
        // Upload to Azure Blob Storage
        const { client: blobServiceClient, containerName } = getBlobServiceClient();
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        await containerClient.createIfNotExists();
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Use the same arrayBuffer we already have
        const buffer = Buffer.from(arrayBuffer);
        
        await blockBlobClient.uploadData(buffer, {
          blobHTTPHeaders: {
            blobContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            blobContentDisposition: `attachment; filename="${file.name}"`,
          },
          metadata: {
            context: 'gl-coding-excel',
            originalFileName: file.name,
            uploadedAt: now.toISOString(),
            tempId: `${timestamp}_${randomId}`,
            status: 'temporary', // For cleanup
            year: year.toString(),
            month: month,
            entriesCount: entries.length.toString(),
            totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0).toString()
          },
        });
        
        tempBlobUrl = blockBlobClient.url;
        
        console.log(`✅ Excel uploaded to blob successfully: ${tempBlobUrl}`);
        
      } catch (blobError) {
        console.error('⚠️ Error uploading Excel to blob storage:', blobError);
        // Don't fail the entire request if blob upload fails, just log it
        // The processing results are still valid
      }
    }

    return NextResponse.json({
      success: true,
      preview: entries,
      validationErrors,
      totalEntries: entries.length,
      totalAmount: entries.reduce((sum, entry) => sum + entry.amount, 0),
      fileName: file.name,
      fileSize: file.size,
      // ✅ NEW: Include blob storage information
      tempBlobUrl, // URL of the uploaded Excel file (null if upload failed)
      blobName,    // Blob name for future reference (null if upload failed)
    });

  } catch (error) {
    console.error('❌ Excel processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}