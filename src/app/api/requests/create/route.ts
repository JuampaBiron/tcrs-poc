import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { renamePdfWithRequestId } from '@/lib/azure-pdf-rename';
import { renameExcelWithRequestId } from '@/lib/azure-excel-rename';
import {
  createRequestInDatabase,
  updateRequestPdfUrl,
  getExcelInfoFromDatabase,
  updateRequestExcelUrl,
  extractBlobNameFromUrl
} from '@/db/queries';

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

    // ✅ NEW: Extract Excel file information if present
    let initialExcelInfo = null;
    const excelFile = formData.get('excelFile') as File | null;
    if (excelFile) {
      console.log('📎 Excel file detected:', excelFile.name, 'Size:', excelFile.size, 'bytes');
      initialExcelInfo = {
        blobUrl: `TEMP-excel-${Date.now()}-${excelFile.name}`, // Temporal placeholder
        blobName: excelFile.name,
        originalFileName: excelFile.name
      };
      console.log('✅ Excel info constructed:', initialExcelInfo);
    } else {
      console.log('📎 No Excel file provided in FormData');
    }

    // Step 1: Create request in database with GL-Coding data and Excel info
    const requestId = await createRequestInDatabase({
      invoiceData: invoiceDataParsed,
      glCodingData: glCodingDataEntries,
      requester,
      excelInfo: initialExcelInfo  // ✅ NOW PASSING EXCEL INFO
    });

    console.log(`✅ Request created with ID: ${requestId}`);

    // Step 2: Rename files with real requestId
    let renamedPdfUrl = null;
    let renamedExcelUrl = null;
    let filesProcessed = { pdf: false, excel: false };

    // Step 2a: Rename PDF if uploaded
    if (invoiceDataParsed.pdfUrl && invoiceDataParsed.pdfTempId) {
      try {
        console.log('🔄 Renaming PDF with real requestId...');
        renamedPdfUrl = await renamePdfWithRequestId(
          invoiceDataParsed.blobName,
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

    // Step 2b: Rename Excel if uploaded
    const dbExcelInfo = await getExcelInfoFromDatabase(requestId);
    if (dbExcelInfo && dbExcelInfo.tempBlobUrl) {
      try {
        console.log('🔄 Renaming Excel with real requestId...');
        console.log(`📎 Excel temp URL: ${dbExcelInfo.tempBlobUrl}`);

        // Extract blob name from URL
        const tempBlobName = extractBlobNameFromUrl(dbExcelInfo.tempBlobUrl);

        renamedExcelUrl = await renameExcelWithRequestId(
          tempBlobName,
          requestId,
          dbExcelInfo.originalFileName || `${requestId}.xlsx`
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
    if (dbExcelInfo?.tempBlobUrl && !filesProcessed.excel) {
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