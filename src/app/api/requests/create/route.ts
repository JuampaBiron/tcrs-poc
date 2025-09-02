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

    let initialExcelInfo = null;
    const excelUploadResultStr = formData.get('excelUploadResult') as string | null;
    
    if (excelUploadResultStr) {
      try {
        const excelUploadResult = JSON.parse(excelUploadResultStr);
        initialExcelInfo = {
          blobUrl: excelUploadResult.blobUrl,
          blobName: excelUploadResult.blobName,
          originalFileName: excelUploadResult.originalFileName
        };
      } catch (parseError) {
        console.error('❌ Failed to parse excelUploadResult:', parseError);
      }
    }

    // Step 1: Create request in database with GL-Coding data and Excel info
    const { requestId, assignedApprover } = await createRequestInDatabase({
      invoiceData: invoiceDataParsed,
      glCodingData: glCodingDataEntries,
      requester,
      excelInfo: initialExcelInfo
    });

    let renamedPdfUrl = null;
    let renamedExcelUrl = null;
    let filesProcessed = { pdf: false, excel: false };

    // Step 2a: Rename PDF if uploaded
    if (invoiceDataParsed.pdfUrl && invoiceDataParsed.pdfTempId) {
      try {
        renamedPdfUrl = await renamePdfWithRequestId(
          invoiceDataParsed.blobName,
          requestId,
          invoiceDataParsed.pdfOriginalName || `${requestId}.pdf`
        );
        await updateRequestPdfUrl(requestId, renamedPdfUrl);
        filesProcessed.pdf = true;
      } catch (pdfError) {
        console.error('❌ PDF rename failed:', pdfError);
      }
    }

    // Step 2b: Rename Excel if uploaded
    const dbExcelInfo = await getExcelInfoFromDatabase(requestId);
    if (dbExcelInfo && dbExcelInfo.tempBlobUrl) {
      try {
        const tempBlobName = extractBlobNameFromUrl(dbExcelInfo.tempBlobUrl);
        renamedExcelUrl = await renameExcelWithRequestId(
          tempBlobName,
          requestId,
          dbExcelInfo.originalFileName || `${requestId}.xlsx`
        );
        await updateRequestExcelUrl(requestId, renamedExcelUrl);
        filesProcessed.excel = true;
      } catch (excelError) {
        console.error('❌ Excel rename failed:', excelError);
      }
    }

    // Step 3: Prepare response
    const response: any = {
      requestId,
      assignedApprover,
      message: 'Request created successfully',
      filesProcessed
    };

    if (renamedPdfUrl) {
      response.pdfUrl = renamedPdfUrl;
    }
    if (renamedExcelUrl) {
      response.excelUrl = renamedExcelUrl;
    }

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