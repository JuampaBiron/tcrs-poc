"use client";

import { useState } from "react";
import { User } from "next-auth";
import { Check } from "lucide-react";
import InvoiceForm from "@/components/request/invoice-form";
import GLCodingForm from "@/components/request/gl-coding-form";
import MyRequestsList from "@/components/request/my-requests-list";
import ErrorMessage from "@/components/ui/error-message";
import { usePdfUpload } from "@/hooks/use-pdf-upload";
import { useGLDictionaries } from "@/hooks/use-gl-dictionaries";
import { useExcelUpload } from "@/hooks/use-excel-upload"; 
import ReviewInvoiceSummary from "@/components/request/review-invoice-summary";
import ReviewGLCodingSummary from "@/components/request/review-gl-coding-summary";
import ReviewAmountValidation from "@/components/request/review-amount-validation";
import ReviewActions from "@/components/request/review-actions";
import ProgressIndicator from "@/components/request/progress-indicator";
import type { InvoiceData, GLCodingEntry, ExcelUploadResult } from "@/types";
import { ERROR_MESSAGES, isValidPdfFile } from "@/constants";
import RequestCreationSelector from "@/components/request/request-creation-selector";
import { useRejectedRequests } from "@/hooks/use-dashboard-data";
import { REQUEST_STATUS } from "@/constants";
interface RequesterViewProps {
  userEmail: string;
  user: User;
}

export default function RequesterView({ userEmail, user }: RequesterViewProps) {
  const [currentStep, setCurrentStep] = useState<'invoice' | 'gl-coding' | 'validation' | 'submit'>('invoice');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [glCodingData, setGLCodingData] = useState<GLCodingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [excelUploadResult, setExcelUploadResult] = useState<ExcelUploadResult | null>(null); 
  const [showSelector, setShowSelector] = useState(true);
  const [selectedRejectedRequest, setSelectedRejectedRequest] = useState<any>(null);

  // PDF Upload hook
  const { uploadPdf, uploading: pdfUploading, error: pdfError } = usePdfUpload();
  const { uploadExcel, uploading: excelUploading, error: excelError } = useExcelUpload(); 

  // GL Dictionaries for summary display
  const { data: dictionaries } = useGLDictionaries();

  // Calculate totals for validation
  const invoiceTotal = invoiceData?.amount || 0;
  const glCodingTotal = glCodingData.reduce((sum, entry) => sum + entry.amount, 0);
  const amountsMatch = Math.abs(invoiceTotal - glCodingTotal) < 0.01;

  const handleInvoiceSubmit = (data: InvoiceData) => {
    if (!data.pdfFile) {
      setError(ERROR_MESSAGES.PDF_REQUIRED);
      return;
    }
    if (!isValidPdfFile(data.pdfFile)) {
      setError(ERROR_MESSAGES.PDF_INVALID_TYPE);
      return;
    }
    setInvoiceData(data);
    setCurrentStep('gl-coding');
    setError(null);
  };

  const handleGLCodingSubmit = async (data: { entries: GLCodingEntry[], excelFile?: File }) => {
    try {
      setGLCodingData(data.entries);

      if (data.excelFile) {
        console.log('🔄 Uploading Excel to Azure before proceeding...');
        const result = await uploadExcel(data.excelFile, 'temp');
        setExcelUploadResult(result);
        console.log('✅ Excel uploaded successfully:', result.blobUrl);
      } else {
        setExcelUploadResult(null);
      }

      setCurrentStep('validation');
      setError(null);
    } catch (err) {
      console.error('❌ Excel upload failed during GL submit:', err);
      setError(`Failed to upload Excel: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFinalSubmit = async () => {
  if (!invoiceData || !amountsMatch) {
    setError(ERROR_MESSAGES.AMOUNTS_MISMATCH);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    let pdfUploadResult = null;
    // Show creation selector first
    if (showSelector) {
      return (
        <RequestCreationSelector 
          userEmail={userEmail}
          onCreateNew={() => setShowSelector(false)}
          onCreateFromRejected={(rejectedRequest) => {
            setSelectedRejectedRequest(rejectedRequest);
            setShowSelector(false);
            
            // Pre-populate invoice data from rejected request
            const prePopulatedInvoiceData: InvoiceData = {
              company: rejectedRequest.company || '',
              branch: rejectedRequest.branch || '',
              tcrsCompany: rejectedRequest.tcrsCompany || false,
              vendor: rejectedRequest.vendor || '',
              po: rejectedRequest.po || '',
              amount: parseFloat(rejectedRequest.amount) || 0,
              currency: rejectedRequest.currency || 'CAD',
              pdfFile: undefined, // User will need to upload new PDF
            };
            
            setInvoiceData(prePopulatedInvoiceData);
            setCurrentStep('invoice');
            setError(null);
          }}
        />
      );
    }
    if (invoiceData.pdfFile) {
      try {
        pdfUploadResult = await uploadPdf(invoiceData.pdfFile, 'direct');
        if (!pdfUploadResult.blobName || !pdfUploadResult.tempId || !pdfUploadResult.blobUrl) {
          throw new Error(ERROR_MESSAGES.BLOB_NAME_MISSING);
        }
      } catch (pdfErr) {
        setError(`PDF upload failed: ${pdfErr instanceof Error ? pdfErr.message : ERROR_MESSAGES.GENERIC}`);
        return;
      }
    }

    const requestData = {
      ...invoiceData,
      pdfFile: undefined,
      pdfUrl: pdfUploadResult?.blobUrl,
      pdfOriginalName: pdfUploadResult?.originalFileName,
      pdfTempId: pdfUploadResult?.tempId,
      blobName: pdfUploadResult?.blobName,
    };

    const validationErrors: string[] = [];
    if (!requestData.company) validationErrors.push(ERROR_MESSAGES.COMPANY_REQUIRED);
    if (!requestData.branch) validationErrors.push(ERROR_MESSAGES.BRANCH_REQUIRED);
    if (!requestData.vendor) validationErrors.push(ERROR_MESSAGES.VENDOR_REQUIRED);
    if (!requestData.po) validationErrors.push(ERROR_MESSAGES.PO_REQUIRED);
    if (!requestData.amount || requestData.amount <= 0) validationErrors.push(ERROR_MESSAGES.AMOUNT_REQUIRED);
    if (!userEmail) validationErrors.push(ERROR_MESSAGES.USER_EMAIL_REQUIRED);
    if (!glCodingData || glCodingData.length === 0) validationErrors.push(ERROR_MESSAGES.GL_CODING_REQUIRED);
    if (pdfUploadResult) {
      if (!requestData.pdfUrl) validationErrors.push(ERROR_MESSAGES.PDF_URL_MISSING);
      if (!requestData.blobName) validationErrors.push(ERROR_MESSAGES.BLOB_NAME_MISSING);
      if (!requestData.pdfTempId) validationErrors.push(ERROR_MESSAGES.PDF_TEMP_ID_MISSING);
    }
    if (validationErrors.length > 0) {
      setError(`${ERROR_MESSAGES.REQUEST_VALIDATION_FAILED} ${validationErrors.join(', ')}`);
      return;
    }
      const formData = new FormData();
      formData.append('invoiceData', JSON.stringify(requestData));
      formData.append('glCodingData', JSON.stringify(glCodingData));
      formData.append('requester', userEmail);

      if (excelUploadResult) {
        formData.append('excelUploadResult', JSON.stringify(excelUploadResult)); 
      }

      const response = await fetch('/api/requests/create', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create request');
        return;
      }

      setSuccess(true);
      setCurrentStep('submit');

      setTimeout(() => {
        setCurrentStep('invoice');
        setInvoiceData(null);
        setGLCodingData([]);
        setExcelUploadResult(null); 
        setSelectedRejectedRequest(null);
        setShowSelector(true);
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInvoice = () => {
    setCurrentStep('invoice');
    setError(null);
  };

  const handleBackToGLCoding = () => {
    setCurrentStep('gl-coding');
    setError(null);
  };

  // Combined loading state
  const isSubmitting = loading || pdfUploading || excelUploading; 

  // Success screen
  if (success) {
    return (
      <div className="text-center py-12">
        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Created Successfully!</h3>
        <p className="text-gray-600 mb-4">Your request has been submitted for approval.</p>
        <div className="text-sm text-gray-500">
          <p>You can view the status of your request in the "My Requests" tab.</p>
          <p className="mt-1">Redirecting to invoice form in a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show creation selector first */}
      {showSelector && (
        <RequestCreationSelector 
          userEmail={userEmail}
          onCreateNew={() => setShowSelector(false)}
          onCreateFromRejected={(rejectedRequest: Request) => {
            setSelectedRejectedRequest(rejectedRequest);
            setShowSelector(false);

            // Pre-populate invoice data from rejected request
            const prePopulatedInvoiceData = {
              company: rejectedRequest.company || '',
              branch: rejectedRequest.branch || '',
              vendor: rejectedRequest.vendor || '',
              po: rejectedRequest.po || '',
              amount: parseFloat(rejectedRequest.amount as any) || 0,
              currency: rejectedRequest.currency || 'USD',
              tcrsCompany: rejectedRequest.tcrsCompany || '', // <-- Agregado
              pdfFile: null,
            };

            setInvoiceData(prePopulatedInvoiceData);
            setCurrentStep('invoice');
            setError(null);
          }}
        />
      )}

      {/* Show recreated request indicator */}
      {!showSelector && selectedRejectedRequest && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            📝 Recreating from rejected request: <strong>{selectedRejectedRequest.vendor}</strong> - {selectedRejectedRequest.currency} {selectedRejectedRequest.amount}
          </p>
        </div>
      )}

      {/* Success screen */}
      {!showSelector && success && (
        <div className="text-center py-12">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Created Successfully!</h3>
          <p className="text-gray-600 mb-4">Your request has been submitted for approval.</p>
          <div className="text-sm text-gray-500">
            <p>You can view the status of your request in the "My Requests" tab.</p>
            <p className="mt-1">Redirecting to invoice form in a moment...</p>
          </div>
        </div>
      )}

      {/* Form steps */}
      {!showSelector && !success && (
        <div className="max-w-1xl mx-auto bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Progress Indicator */}
          <ProgressIndicator currentStep={currentStep} />

          {/* Error Display */}
          {error && <ErrorMessage message={error} />}

          {/* Step Content */}
          {currentStep === 'invoice' && (
            <InvoiceForm 
              onSubmit={handleInvoiceSubmit} 
              initialData={invoiceData ?? undefined}
            />
          )}
          {/* Back to selector button */}
          {currentStep === 'invoice' && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setShowSelector(true);
                  setSelectedRejectedRequest(null);
                  setInvoiceData(null);
                  setError(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                ← Back to selection
              </button>
              {selectedRejectedRequest && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  From rejected request
                </span>
              )}
            </div>
          )}

          {currentStep === 'gl-coding' && (
            <GLCodingForm
              invoiceAmount={invoiceTotal}
              onSubmit={handleGLCodingSubmit}
              onBack={handleBackToInvoice}
            />
          )}

          {currentStep === 'validation' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Request</h3>

              {/* Invoice Summary */}
              <ReviewInvoiceSummary
                invoiceData={invoiceData}
                excelUploadResult={excelUploadResult}
                invoiceTotal={invoiceTotal}
              />

              {/* GL Coding Summary */}
              <ReviewGLCodingSummary
                glCodingData={glCodingData}
                dictionaries={dictionaries}
                glCodingTotal={glCodingTotal}
              />

              {/* Amount Validation */}
              <ReviewAmountValidation
                invoiceTotal={invoiceTotal}
                glCodingTotal={glCodingTotal}
              />

              {/* Action Buttons */}
              <ReviewActions
                onBack={handleBackToGLCoding}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
                amountsMatch={amountsMatch}
                pdfUploading={pdfUploading}
                excelUploading={excelUploading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}