// src/app/api/requests/create/route.ts - ENHANCED WITH WORKFLOW TRACKING
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';
import { trackRequestCreated } from '@/lib/workflow-tracker'; // ✅ NEW IMPORT
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
        console.log('🔄 Renaming PDF with real requestId...');
        const renamedPdfUrl = await renamePdfWithRequestId(
          invoiceDataParsed.pdfTempId,
          requestId,
          invoiceDataParsed.blobName || `${requestId}.pdf`
        );
        
        // Step 3: Update database with final PDF URL
        await updateRequestPdfUrl(requestId, renamedPdfUrl);
        
        console.log('✅ PDF renamed and URL updated successfully');
        
        return createSuccessResponse({
          requestId,
          message: 'Request created successfully with PDF',
          pdfUrl: renamedPdfUrl
        });
        
      } catch (pdfError) {
        console.error('❌ PDF rename failed, but request was created:', pdfError);
        
        // Request was created but PDF rename failed - still success
        return createSuccessResponse({
          requestId,
          message: 'Request created successfully, but PDF processing had issues',
          warning: 'PDF file may not be properly linked'
        });
      }
    }
    
    // No PDF case - just return success
    return createSuccessResponse({
      requestId,
      message: 'Request created successfully'
    });
    
  } catch (error) {
    console.error('❌ Request creation failed:', error);
    return handleApiError(error);
  }
}

// ✅ ENHANCED IMPLEMENTATION - NOW INCLUDES GL-CODING DATA + WORKFLOW TRACKING
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
      
      // 🔥 2. Track workflow step - REQUEST CREATED
      await trackRequestCreated(tx, requestId, requester);
      console.log('✅ Workflow step tracked: request_created');
      
      // 3. Insert into InvoiceData table
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

      // 4. Create GLCodingUploadedData record
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

      // 5. Insert GL-Coding entries
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