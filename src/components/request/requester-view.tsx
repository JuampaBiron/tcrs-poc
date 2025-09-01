"use client";

import { useState } from "react";
import { User } from "next-auth";
import { AlertCircle, FileText, Upload, DollarSign, Check } from "lucide-react";
import InvoiceForm from "./invoice-form";
import GLCodingForm from "./gl-coding-form";
import MyRequestsList from "./my-requests-list";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { usePdfUpload } from "@/hooks/use-pdf-upload";
import { useGLDictionaries } from "@/hooks/use-gl-dictionaries";

interface RequesterViewProps {
  mode: 'create' | 'list';
  userEmail: string;
  user: User;
}

interface InvoiceData {
  company: string;
  branch: string;
  tcrsCompany: boolean;
  vendor: string;
  po: string;
  amount: number;
  currency: string;
  pdfFile?: File;
  pdfUrl?: string;
  pdfOriginalName?: string;
  pdfTempId?: string;
  blobName?: string; 
}

interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

export default function RequesterView({ mode, userEmail, user }: RequesterViewProps) {
  const [currentStep, setCurrentStep] = useState<'invoice' | 'gl-coding' | 'validation' | 'submit'>('invoice');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [glCodingData, setGLCodingData] = useState<GLCodingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // PDF Upload hook
  const { uploadPdf, uploading: pdfUploading, error: pdfError } = usePdfUpload();

  // GL Dictionaries for summary display
  const { data: dictionaries } = useGLDictionaries();

  // Show list view
  if (mode === 'list') {
    return <MyRequestsList userEmail={userEmail} />;
  }

  // Calculate totals for validation
  const invoiceTotal = invoiceData?.amount || 0;
  const glCodingTotal = glCodingData.reduce((sum, entry) => sum + entry.amount, 0);
  const amountsMatch = Math.abs(invoiceTotal - glCodingTotal) < 0.01;

  const handleInvoiceSubmit = (data: InvoiceData) => {
    setInvoiceData(data);
    setCurrentStep('gl-coding');
    setError(null);
  };

  const handleGLCodingSubmit = (data: { entries: GLCodingEntry[], excelFile?: File }) => {
    setGLCodingData(data.entries);
    setExcelFile(data.excelFile || null);
    setCurrentStep('validation');
    setError(null);
  };

  const handleFinalSubmit = async () => {
    if (!invoiceData || !amountsMatch) {
      setError('Cannot submit: amounts do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let pdfUploadResult = null;

      // Step 1: Upload PDF if present
      if (invoiceData.pdfFile) {
        try {
          pdfUploadResult = await uploadPdf(invoiceData.pdfFile, 'direct');
          if (!pdfUploadResult.blobName || !pdfUploadResult.tempId || !pdfUploadResult.blobUrl) {
            throw new Error('PDF upload result missing required fields');
          }
        } catch (pdfErr) {
          setError(`PDF upload failed: ${pdfErr instanceof Error ? pdfErr.message : 'Unknown error'}`);
          return;
        }
      }

      // Step 2: Create request with PDF URL and blob information
      const requestData = {
        ...invoiceData,
        pdfFile: undefined,
        pdfUrl: pdfUploadResult?.blobUrl,
        pdfOriginalName: pdfUploadResult?.originalFileName,
        pdfTempId: pdfUploadResult?.tempId,
        blobName: pdfUploadResult?.blobName,
      };

      const validationErrors: string[] = [];
      if (!requestData.company) validationErrors.push('Company is required');
      if (!requestData.branch) validationErrors.push('Branch is required');
      if (!requestData.vendor) validationErrors.push('Vendor is required');
      if (!requestData.po) validationErrors.push('PO is required');
      if (!requestData.amount || requestData.amount <= 0) validationErrors.push('Valid amount is required');
      if (!userEmail) validationErrors.push('User email is required');
      if (!glCodingData || glCodingData.length === 0) validationErrors.push('GL Coding data is required');
      if (pdfUploadResult) {
        if (!requestData.pdfUrl) validationErrors.push('PDF URL missing after upload');
        if (!requestData.blobName) validationErrors.push('Blob name missing after upload');
        if (!requestData.pdfTempId) validationErrors.push('PDF temp ID missing after upload');
      }
      if (validationErrors.length > 0) {
        setError(`Request validation failed: ${validationErrors.join(', ')}`);
        return;
      }

      const formData = new FormData();
      formData.append('invoiceData', JSON.stringify(requestData));
      formData.append('glCodingData', JSON.stringify(glCodingData));
      formData.append('requester', userEmail);

      if (excelFile) {
        formData.append('excelFile', excelFile);
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
        setExcelFile(null);
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
  const isSubmitting = loading || pdfUploading;

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
    <div className="max-w-1xl mx-auto bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create New Request</h2>
          <div className="text-sm text-gray-500">
            Step {currentStep === 'invoice' ? 1 : currentStep === 'gl-coding' ? 2 : currentStep === 'validation' ? 3 : 4} of 3
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep === 'invoice' ? 'text-blue-600' : 'text-gray-400'}`}>
            <FileText className="w-5 h-5 mr-2" />
            Invoice Details
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center ${currentStep === 'gl-coding' ? 'text-blue-600' : 'text-gray-400'}`}>
            <DollarSign className="w-5 h-5 mr-2" />
            GL Coding
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div className={`flex items-center ${currentStep === 'validation' ? 'text-blue-600' : 'text-gray-400'}`}>
            <Upload className="w-5 h-5 mr-2" />
            Review & Submit
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Step Content */}
      {currentStep === 'invoice' && (
        <InvoiceForm onSubmit={handleInvoiceSubmit} />
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
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Invoice Details</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Company:</span>
                <span className="font-medium">{invoiceData?.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-medium">{invoiceData?.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendor:</span>
                <span className="font-medium">{invoiceData?.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PO:</span>
                <span className="font-medium">{invoiceData?.po}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${invoiceTotal.toFixed(2)} {invoiceData?.currency}</span>
              </div>
              {invoiceData?.pdfFile && (
                <div className="flex justify-between">
                  <span className="text-gray-600">PDF:</span>
                  <span className="font-medium">{invoiceData.pdfFile.name}</span>
                </div>
              )}
              {excelFile && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Excel:</span>
                  <span className="font-medium">{excelFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* GL Coding Summary */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">GL Coding ({glCodingData.length} entries)</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 mb-3">
                {glCodingData.map((entry, index) => {
                  const account = dictionaries?.accounts.find((a: { accountCode: string; accountCombined: string }) => a.accountCode === entry.accountCode);
                  const facility = dictionaries?.facilities.find((f: { facilityCode: string; facilityCombined: string }) => f.facilityCode === entry.facilityCode);
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {account?.accountCombined || entry.accountCode} - {facility?.facilityCombined || entry.facilityCode}
                      </span>
                      <span className="font-medium">${entry.amount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total GL Coding:</span>
                <span>${glCodingTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Amount Validation */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg ${amountsMatch ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {amountsMatch ? (
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className={`font-medium ${amountsMatch ? 'text-green-800' : 'text-red-800'}`}>
                    {amountsMatch ? 'Amounts Match' : 'Amount Mismatch'}
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Invoice: ${invoiceTotal.toFixed(2)} | GL Coding: ${glCodingTotal.toFixed(2)}
                    {!amountsMatch && ` | Difference: ${Math.abs(invoiceTotal - glCodingTotal).toFixed(2)}`}
                  </p>
                  {!amountsMatch && (
                    <p className="text-sm text-red-600 mt-1">
                      Please review your entries before submitting.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleBackToGLCoding}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back to GL Coding
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || !amountsMatch}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>{pdfUploading ? 'Uploading PDF...' : 'Creating Request...'}</span>
                </div>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}