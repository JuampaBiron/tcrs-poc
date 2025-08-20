// src/app/api/requests/create/route.ts - FINAL FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';
import { 
  db, 
  approvalRequests, 
  invoiceData, 
  glCodingUploadedData, 
  glCodingData 
} from '@/db';
import { eq } from 'drizzle-orm';
import { REQUEST_STATUS } from '@/constants';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const invoiceDataStr = formData.get('invoiceData') as string;
    const glCodingDataStr = formData.get('glCodingData') as string;
    const requester = formData.get('requester') as string;
    
    const invoiceDataParsed = JSON.parse(invoiceDataStr);
    const glCodingDataEntries = JSON.parse(glCodingDataStr);
    
    console.log('🔄 Creating request with invoice data:', invoiceDataParsed);
    console.log('🔄 GL Coding entries count:', glCodingDataEntries.length);
    
    // Step 1: Create request in database with GL-Coding data (get real requestId)
    const requestId = await createRequestInDatabase({
      invoiceData: invoiceDataParsed,
      glCodingData: glCodingDataEntries,
      requester
    });
    
    console.log(`✅ Request created with ID: ${requestId}`);
    
    // Step 2: If PDF was uploaded, rename it with real requestId
    if (invoiceDataParsed.pdfUrl && invoiceDataParsed.pdfTempId) {
      try {
        console.log('🔄 Renaming PDF with request ID...');
        
        // ✅ FIX: Use blobName directly if available (from improved upload), 
        // otherwise extract from URL
        let tempBlobName;
        if (invoiceDataParsed.blobName) {
          // Use direct blob name (preferred - no URL parsing needed)
          tempBlobName = invoiceDataParsed.blobName;
          console.log(`🔍 Using direct blob name: ${tempBlobName}`);
        } else {
          // Fallback: extract from URL and decode
          const url = new URL(invoiceDataParsed.pdfUrl);
          const urlPath = url.pathname.substring(url.pathname.indexOf('invoices/'));
          tempBlobName = decodeURIComponent(urlPath);
          console.log(`🔍 Extracted from URL: ${urlPath} → ${tempBlobName}`);
        }
        
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

// ✅ ENHANCED IMPLEMENTATION - NOW INCLUDES GL-CODING DATA
async function createRequestInDatabase(data: {
  invoiceData: any;
  glCodingData: any[];
  requester: string;
}): Promise<string> {
  const { invoiceData: invoiceFormData, glCodingData: glCodingEntries, requester } = data;
  
  try {
    // Generate unique request ID
    const requestId = `REQ-${new Date().getFullYear()}-${createId()}`;
    
    // Validate GL-Coding entries before starting transaction
    if (!glCodingEntries || !Array.isArray(glCodingEntries) || glCodingEntries.length === 0) {
      throw new Error('GL-Coding data is required');
    }

    // Validate each GL-Coding entry
    const validationErrors: string[] = [];
    glCodingEntries.forEach((entry: any, index: number) => {
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
      throw new Error(`GL-Coding validation failed: ${validationErrors.join(', ')}`);
    }

    // Start database transaction - ALL OPERATIONS TOGETHER
    return await db.transaction(async (tx) => {
      console.log('🔄 Starting database transaction...');
      
      // 1. Insert into ApprovalRequests table
      await tx.insert(approvalRequests).values({
        requestId,
        requester,
        assignedApprover: null, // Will be assigned based on business logic
        approverStatus: REQUEST_STATUS.PENDING,
        comments: null,
        createdDate: new Date(),
        modifiedDate: null,
      });
      console.log('✅ ApprovalRequest created');
      
      // 2. Insert into InvoiceData table
      await tx.insert(invoiceData).values({
        invoiceId: createId(),
        requestId,
        company: invoiceFormData.company,
        tcrsCompany: invoiceFormData.tcrsCompany,
        branch: invoiceFormData.branch,
        vendor: invoiceFormData.vendor,
        po: invoiceFormData.po,
        amount: invoiceFormData.amount.toString(), // Convert to decimal string
        currency: invoiceFormData.currency,
        approver: null, // Will be assigned later
        blobUrl: invoiceFormData.pdfUrl || null,
        createdDate: new Date(),
        modifiedDate: null,
      });
      console.log('✅ InvoiceData created');

      // 3. Create GLCodingUploadedData record
      const uploadId = createId();
      await tx.insert(glCodingUploadedData).values({
        uploadId,
        requestId,
        uploader: requester,
        uploadedFile: false, // False for manual form entry
        status: 'completed',
        blobUrl: null, // No file for manual entry
        createdDate: new Date(),
        modifiedDate: null,
      });
      console.log('✅ GLCodingUploadedData created');

      // 4. Insert GL-Coding entries
      const glEntries = glCodingEntries.map((entry: any) => ({
        uploadId,
        accountCode: entry.accountCode,
        facilityCode: entry.facilityCode,
        taxCode: entry.taxCode || null,
        amount: entry.amount.toString(), // Convert to decimal string
        equipment: entry.equipment || null,
        comments: entry.comments || null,
        createdDate: new Date(),
        modifiedDate: null,
      }));

      await tx.insert(glCodingData).values(glEntries);
      console.log(`✅ ${glEntries.length} GLCodingData entries created`);
      
      console.log(`✅ Database transaction completed for request: ${requestId}`);
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