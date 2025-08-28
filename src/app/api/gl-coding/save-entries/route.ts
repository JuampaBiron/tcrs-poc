// src/app/api/gl-coding/save-entries/route.ts - MODIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { glCodingData, glCodingUploadedData } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// POST /api/gl-coding/save-entries - Guardar entradas en base de datos
export async function POST(request: NextRequest) {
  try {
    const { 
      requestId, 
      entries, 
      uploader, 
      source, 
      tempBlobUrl,      // ✅ NEW: URL temporal del Excel
      originalFileName  // ✅ NEW: Nombre original del archivo
    } = await request.json();

    if (!requestId || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, entries' },
        { status: 400 }
      );
    }

    // Final validation
    const validationErrors: string[] = [];
    
    entries.forEach((entry: any, index: number) => {
      if (!entry.accountCode) {
        validationErrors.push(`Entry ${index + 1}: Account code is required`);
      }
      if (!entry.facilityCode) {
        validationErrors.push(`Entry ${index + 1}: Facility code is required`);
      }
      if (!entry.amount || entry.amount <= 0) {
        validationErrors.push(`Entry ${index + 1}: Valid amount is required`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: validationErrors },
        { status: 400 }
      );
    }

    // Start transaction - delete existing entries for this request
    const uploadId = createId();
    
    // Delete existing GL coding data for this request
    await db.delete(glCodingData)
      .where(eq(glCodingData.uploadId, requestId));
    
    await db.delete(glCodingUploadedData)
      .where(eq(glCodingUploadedData.requestId, requestId));

    // ✅ MODIFIED: Create new upload record with blob URL support
    await db.insert(glCodingUploadedData).values({
      uploadId,
      requestId,
      uploader,
      uploadedFile: source === 'excel', // True for Excel, false for manual
      status: 'completed',
      blobUrl: tempBlobUrl || null,     // ✅ NEW: Store temporary blob URL
      createdDate: new Date(),
    });

    // Insert new GL coding entries
    const glEntries = entries.map((entry: any) => ({
      uploadId,
      accountCode: entry.accountCode,
      facilityCode: entry.facilityCode,
      taxCode: entry.taxCode || null,
      amount: entry.amount.toString(),
      equipment: entry.equipment || null,
      comments: entry.comments || null,
      createdDate: new Date(),
    }));

    await db.insert(glCodingData).values(glEntries);

    console.log(`✅ GL Coding entries saved: ${entries.length} entries`);
    if (tempBlobUrl) {
      console.log(`📎 Excel file stored temporarily at: ${tempBlobUrl}`);
    }

    return NextResponse.json({
      success: true,
      uploadId,
      entriesProcessed: entries.length,
      message: `Successfully saved ${entries.length} GL coding entries`,
      // ✅ NEW: Return blob info for potential future use
      blobInfo: tempBlobUrl ? {
        tempBlobUrl,
        originalFileName: originalFileName || 'unknown.xlsx',
        hasExcelFile: true
      } : {
        hasExcelFile: false
      }
    });

  } catch (error) {
    console.error('Error saving GL coding entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ NEW: Helper function to extract blob name from URL for future use
function extractBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    // Remove the leading slash and container name
    const pathParts = url.pathname.split('/');
    // Skip empty first element and container name, return the rest
    return pathParts.slice(2).join('/');
  } catch (error) {
    console.error('Error extracting blob name from URL:', error);
    // Fallback: return the URL as-is if parsing fails
    return blobUrl;
  }
}