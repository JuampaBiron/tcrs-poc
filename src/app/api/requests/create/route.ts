// src/app/api/requests/create/route.ts - Ejemplo de implementación

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const invoiceDataStr = formData.get('invoiceData') as string;
    const glCodingDataStr = formData.get('glCodingData') as string;
    const requester = formData.get('requester') as string;
    
    const invoiceData = JSON.parse(invoiceDataStr);
    const glCodingData = JSON.parse(glCodingDataStr);
    
    console.log('🔄 Creating request with invoice data:', invoiceData);
    
    // Step 1: Create request in database (get real requestId)
    const requestId = await createRequestInDatabase({
      invoiceData,
      glCodingData,
      requester
    });
    
    console.log(`✅ Request created with ID: ${requestId}`);
    
    // Step 2: If PDF was uploaded, rename it with real requestId
    if (invoiceData.pdfUrl && invoiceData.pdfTempId) {
      try {
        console.log('🔄 Renaming PDF with request ID...');
        
        // Extract temp blob name from URL
        const url = new URL(invoiceData.pdfUrl);
        const tempBlobName = url.pathname.substring(url.pathname.indexOf('invoices/'));
        
        // Rename PDF with real request ID
        const newPdfUrl = await renamePdfWithRequestId(
          tempBlobName,
          requestId,
          invoiceData.pdfOriginalName
        );
        
        // Update request with new PDF URL
        await updateRequestPdfUrl(requestId, newPdfUrl);
        
        console.log(`✅ PDF renamed and associated with request ${requestId}`);
        
      } catch (pdfError) {
        console.error('❌ Failed to rename PDF:', pdfError);
        // Request is still created, but PDF might have old name
        // Could implement retry logic or manual fix later
      }
    }
    
    return createSuccessResponse({
      requestId,
      message: 'Request created successfully'
    });
    
  } catch (error) {
    console.error('❌ Request creation failed:', error);
    return handleApiError(error); // ✅ Use handleApiError instead of createErrorResponse
  }
}

// Helper functions (you'd implement these based on your database schema)
async function createRequestInDatabase(data: any): Promise<string> {
  // Implementation depends on your database setup
  // Return the generated request ID (e.g., "REQ-2025-001")
  throw new Error('Implement database creation logic');
}

async function updateRequestPdfUrl(requestId: string, pdfUrl: string): Promise<void> {
  // Update the request record with the final PDF URL
  // Implementation depends on your database setup
  throw new Error('Implement database update logic');
}