// src/app/api/requests/create/route.ts - Implementación completa

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';
import { db, approvalRequests, invoiceData } from '@/db';
import { REQUEST_STATUS } from '@/constants';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const invoiceDataStr = formData.get('invoiceData') as string;
    const glCodingDataStr = formData.get('glCodingData') as string;
    const requester = formData.get('requester') as string;
    
    const invoiceDataParsed = JSON.parse(invoiceDataStr);
    const glCodingData = JSON.parse(glCodingDataStr);
    
    console.log('🔄 Creating request with invoice data:', invoiceDataParsed);
    
    // Step 1: Create request in database (get real requestId)
    const requestId = await createRequestInDatabase({
      invoiceData: invoiceDataParsed,
      glCodingData,
      requester
    });
    
    console.log(`✅ Request created with ID: ${requestId}`);
    
    // Step 2: If PDF was uploaded, rename it with real requestId
    if (invoiceDataParsed.pdfUrl && invoiceDataParsed.pdfTempId) {
      try {
        console.log('🔄 Renaming PDF with request ID...');
        
        // Extract temp blob name from URL
        const url = new URL(invoiceDataParsed.pdfUrl);
        const tempBlobName = url.pathname.substring(url.pathname.indexOf('invoices/'));
        
        // Rename PDF with real request ID
        const newPdfUrl = await renamePdfWithRequestId(
          tempBlobName,
          requestId,
          invoiceDataParsed.pdfOriginalName
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
    return handleApiError(error);
  }
}

// ✅ IMPLEMENTACIÓN DE FUNCIONES DE BASE DE DATOS
async function createRequestInDatabase(data: {
  invoiceData: any;
  glCodingData: any;
  requester: string;
}): Promise<string> {
  const { invoiceData, requester } = data;
  
  try {
    // Generate unique request ID
    const requestId = `REQ-${new Date().getFullYear()}-${createId()}`;
    
    // Start database transaction
    return await db.transaction(async (tx) => {
      // 1. Insert into approval_requests table
      await tx.insert(approvalRequests).values({
        requestId,
        requester,
        assignedApprover: null, // Will be assigned based on business logic
        approverStatus: REQUEST_STATUS.PENDING,
        comments: null,
        createdDate: new Date(),
        modifiedDate: null,
      });
      
      // 2. Insert into invoice_data table
      await tx.insert(invoiceData).values({
        invoiceId: createId(),
        requestId,
        company: invoiceData.company,
        tcrsCompany: invoiceData.tcrsCompany,
        branch: invoiceData.branch,
        vendor: invoiceData.vendor,
        po: invoiceData.po,
        amount: invoiceData.amount.toString(), // Convert to decimal string
        currency: invoiceData.currency,
        approver: null, // Will be assigned later
        blobUrl: invoiceData.pdfUrl || null,
        createdDate: new Date(),
        modifiedDate: null,
      });
      
      console.log(`✅ Database records created for request: ${requestId}`);
      return requestId;
    });
    
  } catch (error) {
    console.error('❌ Database insertion failed:', error);
    throw new Error(`Failed to create request in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function updateRequestPdfUrl(requestId: string, pdfUrl: string): Promise<void> {
  try {
    // Update invoice_data table with the final PDF URL
    await db
      .update(invoiceData)
      .set({ 
        blobUrl: pdfUrl,
        modifiedDate: new Date()
      })
      .where(eq(invoiceData.requestId, requestId));
      
    console.log(`✅ PDF URL updated for request: ${requestId}`);
  } catch (error) {
    console.error('❌ Failed to update PDF URL:', error);
    throw new Error(`Failed to update PDF URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}