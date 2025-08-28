// src/app/api/requests/create/route.ts - ENHANCED WITH EXCEL BLOB RENAME
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';
import { renameExcelWithRequestId } from '@/lib/azure-excel-rename'; // ✅ NEW IMPORT
import { trackRequestCreated } from '@/lib/workflow-tracker';
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
    
    // Step 2: Rename files with real requestId
    let renamedPdfUrl = null;
    let renamedExcelUrl = null;
    let filesProcessed = { pdf: false, excel: false };
    
    // ✅ Step 2a: Rename PDF if uploaded
    if (invoiceDataParsed.pdfUrl && invoiceDataParsed.pdfTempId) {
      try {
        console.log('🔄 Renaming PDF with real requestId...');
        renamedPdfUrl = await renamePdfWithRequestId(
          invoiceDataParsed.blobName,   // ← SOLUCIÓN: El blobName completo
          requestId,
          invoiceDataParsed.pdfOriginalName || `${requestId}.pdf`
        );
        
        // Update database with final PDF URL
        await updateRequestPdfUrl(requestId, renamedPdfUrl);
        filesProcessed.pdf = true;
        
        console.log('✅ PDF renamed and URL updated successfully');
        
      } catch (pdfError) {
        console.error('❌ PDF rename failed:', pdfError);
        // Continue processing, PDF error won't fail the request
      }
    }
    
    // ✅ Step 2b: NEW - Rename Excel if uploaded
    const excelInfo = await getExcelInfoFromDatabase(requestId);
    if (excelInfo && excelInfo.tempBlobUrl) {
      try {
        console.log('🔄 Renaming Excel with real requestId...');
        console.log(`📎 Excel temp URL: ${excelInfo.tempBlobUrl}`);
        
        // Extract blob name from URL
        const tempBlobName = extractBlobNameFromUrl(excelInfo.tempBlobUrl);
        
        renamedExcelUrl = await renameExcelWithRequestId(
          tempBlobName,
          requestId,
          excelInfo.originalFileName || `${requestId}.xlsx`
        );
        
        // Update database with final Excel URL
        await updateRequestExcelUrl(requestId, renamedExcelUrl);
        filesProcessed.excel = true;
        
        console.log('✅ Excel renamed and URL updated successfully');
        
      } catch (excelError) {
        console.error('❌ Excel rename failed:', excelError);
        // Continue processing, Excel error won't fail the request
      }
    }
    
    // Step 3: Prepare response based on files processed
    const response: any = {
      requestId,
      message: 'Request created successfully',
      filesProcessed
    };
    
    if (renamedPdfUrl) {
      response.pdfUrl = renamedPdfUrl;
    }
    
    if (renamedExcelUrl) {
      response.excelUrl = renamedExcelUrl;
    }
    
    // Add warnings if any files failed to process
    const warnings = [];
    if (invoiceDataParsed.pdfUrl && !filesProcessed.pdf) {
      warnings.push('PDF file may not be properly linked');
    }
    if (excelInfo?.tempBlobUrl && !filesProcessed.excel) {
      warnings.push('Excel file may not be properly linked');
    }
    
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    
    return createSuccessResponse(response);
    
  } catch (error) {
    console.error('❌ Request creation failed:', error);
    return handleApiError(error);
  }
}

// ✅ ENHANCED: Create request in database (existing function)
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
      
      // 2. Track workflow step - REQUEST CREATED
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
        uploadedFile: false, // Will be updated if there's an Excel file
        status: 'completed',
        blobUrl: null, // Will be updated if there's an Excel file
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

// ✅ EXISTING: Update PDF URL function
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

// ✅ NEW: Get Excel info from database
async function getExcelInfoFromDatabase(requestId: string): Promise<{
  tempBlobUrl: string | null;
  originalFileName: string | null;
  uploadId: string;
} | null> {
  try {
    const result = await db
      .select({
        blobUrl: glCodingUploadedData.blobUrl,
        uploadId: glCodingUploadedData.uploadId
      })
      .from(glCodingUploadedData)
      .where(eq(glCodingUploadedData.requestId, requestId))
      .limit(1);
      
    if (result.length === 0 || !result[0].blobUrl) {
      return null;
    }
    
    // Extract original filename from blob URL or use default
    const blobUrl = result[0].blobUrl;
    const urlParts = blobUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    // Remove TEMP- prefix to get original name
    const originalFileName = fileName.replace(/^TEMP-[^_]+_/, '');
    
    return {
      tempBlobUrl: blobUrl,
      originalFileName,
      uploadId: result[0].uploadId
    };
    
  } catch (error) {
    console.error('❌ Failed to get Excel info from database:', error);
    return null;
  }
}

// ✅ NEW: Update Excel URL in database
async function updateRequestExcelUrl(requestId: string, excelUrl: string): Promise<void> {
  try {
    // Update gl_coding_uploaded_data table with the final Excel URL
    await db
      .update(glCodingUploadedData)
      .set({ 
        blobUrl: excelUrl,
        uploadedFile: true, // Mark as having uploaded file
        modifiedDate: new Date()
      })
      .where(eq(glCodingUploadedData.requestId, requestId));
      
    console.log(`✅ Excel URL updated for request: ${requestId}`);
  } catch (error) {
    console.error('❌ Failed to update Excel URL:', error);
    throw new Error(`Failed to update Excel URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ NEW: Helper function to extract blob name from URL
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