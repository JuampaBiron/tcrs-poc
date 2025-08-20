// src/components/request/requester-view.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { AlertCircle, FileText, Upload, DollarSign, Check } from "lucide-react";
import InvoiceForm from "./invoice-form";
import GLCodingForm from "./gl-coding-form";
import MyRequestsList from "./my-requests-list";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { usePdfUpload } from "@/hooks/use-pdf-upload";

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

  // PDF Upload hook
  const { uploadPdf, uploading: pdfUploading, error: pdfError } = usePdfUpload();

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

  const handleGLCodingSubmit = (data: GLCodingEntry[]) => {
    setGLCodingData(data);
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
        console.log('🔄 Uploading PDF before creating request...');
        try {
          // No need for requestId - use direct naming
          pdfUploadResult = await uploadPdf(invoiceData.pdfFile, 'direct');
          console.log('✅ PDF uploaded successfully:', pdfUploadResult.blobUrl);
        } catch (pdfErr) {
          console.error('❌ PDF upload failed:', pdfErr);
          setError(`PDF upload failed: ${pdfErr instanceof Error ? pdfErr.message : 'Unknown error'}`);
          return;
        }
      }

      // Step 2: Create request with PDF URL and temp ID
      const requestData = {
        ...invoiceData,
        // Remove File object and add blob URL + temp ID
        pdfFile: undefined,
        pdfUrl: pdfUploadResult?.blobUrl,
        pdfOriginalName: pdfUploadResult?.originalFileName,
        pdfTempId: pdfUploadResult?.tempId, // For later PDF renaming
      };

      const formData = new FormData();
      formData.append('invoiceData', JSON.stringify(requestData));
      formData.append('glCodingData', JSON.stringify(glCodingData));
      formData.append('requester', userEmail);

      console.log('🔄 Creating request with PDF URL...');

      const response = await fetch('/api/requests/create', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create request');
      }

      console.log('✅ Request created successfully with PDF');
      setSuccess(true);
      setCurrentStep('submit');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setCurrentStep('invoice');
        setInvoiceData(null);
        setGLCodingData([]);
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('❌ Request creation failed:', err);
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

  if (success) {
    return (
      <div className="text-center py-12">
        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Created Successfully!</h3>
        <p className="text-gray-600">Your request has been submitted for approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create New Request</h2>
          <div className="text-sm text-gray-500">
            Step {currentStep === 'invoice' ? 1 : currentStep === 'gl-coding' ? 2 : currentStep === 'validation' ? 3 : 4} of 3
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep === 'invoice' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'invoice' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {currentStep === 'invoice' ? '1' : <Check className="w-4 h-4" />}
            </div>
            <span className="ml-2 font-medium">Invoice Data</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full ${currentStep !== 'invoice' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          </div>
          
          <div className={`flex items-center ${
            currentStep === 'gl-coding' ? 'text-blue-600' : 
            currentStep === 'validation' || currentStep === 'submit' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'gl-coding' ? 'bg-blue-100' : 
              currentStep === 'validation' || currentStep === 'submit' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {currentStep === 'validation' || currentStep === 'submit' ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="ml-2 font-medium">GL Coding</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full ${currentStep === 'validation' || currentStep === 'submit' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          </div>
          
          <div className={`flex items-center ${currentStep === 'validation' ? 'text-blue-600' : currentStep === 'submit' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'validation' ? 'bg-blue-100' : currentStep === 'submit' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {currentStep === 'submit' ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <span className="ml-2 font-medium">Validation</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || pdfError) && (
        <ErrorMessage 
          message={error || pdfError || 'An error occurred'} 
          onRetry={() => {
            setError(null);
            // Clear any PDF errors as well
            if (pdfError) {
              // The hook will handle clearing its own error state
              console.log('Clearing error state');
            }
          }} 
        />
      )}

      {/* Step Content */}
      {currentStep === 'invoice' && (
        <InvoiceForm
          onSubmit={handleInvoiceSubmit}
          initialData={invoiceData}
        />
      )}

      {currentStep === 'gl-coding' && (
        <GLCodingForm
          invoiceAmount={invoiceTotal}
          onSubmit={handleGLCodingSubmit}
          onBack={handleBackToInvoice}
          initialData={glCodingData}
        />
      )}

      {currentStep === 'validation' && invoiceData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Review & Submit Request</h3>
          
          {/* Invoice Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Invoice Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Company:</span>
                  <span className="text-sm font-medium">{invoiceData.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Branch:</span>
                  <span className="text-sm font-medium">{invoiceData.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vendor:</span>
                  <span className="text-sm font-medium">{invoiceData.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">PO#:</span>
                  <span className="text-sm font-medium">{invoiceData.po || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-medium">{invoiceData.currency} {invoiceData.amount.toFixed(2)}</span>
                </div>
                {invoiceData.pdfFile && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">PDF:</span>
                    <span className="text-sm font-medium text-green-600">{invoiceData.pdfFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                GL Coding Summary
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Entries:</span>
                  <span className="text-sm font-medium">{glCodingData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">GL Coding Total:</span>
                  <span className="text-sm font-medium">{invoiceData.currency} {glCodingTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Invoice Total:</span>
                  <span className="text-sm font-medium">{invoiceData.currency} {invoiceTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">Status:</span>
                  <span className={`text-sm font-medium ${amountsMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {amountsMatch ? '✓ Amounts Match' : '✗ Amounts Mismatch'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Validation Alert */}
          {!amountsMatch && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Amount Mismatch</h4>
                  <p className="text-sm text-red-700 mt-1">
                    The GL coding total ({invoiceData.currency} {glCodingTotal.toFixed(2)}) does not match 
                    the invoice amount ({invoiceData.currency} {invoiceTotal.toFixed(2)}). 
                    Please review your entries before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}

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