// src/app/api/gl-coding/save-entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { glCodingData, glCodingUploadedData } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// POST /api/gl-coding/save-entries - Guardar entradas en base de datos
export async function POST(request: NextRequest) {
  try {
    const { requestId, entries, uploader, source } = await request.json();

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

    // Create new upload record
    await db.insert(glCodingUploadedData).values({
      uploadId,
      requestId,
      uploader,
      uploadedFile: source === 'excel', // True for Excel, false for manual
      status: 'completed',
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

    return NextResponse.json({
      success: true,
      uploadId,
      entriesProcessed: entries.length,
      message: `Successfully saved ${entries.length} GL coding entries`
    });

  } catch (error) {
    console.error('Error saving GL coding entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
