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
      const formData = new FormData();
      
      // Add invoice data
      formData.append('invoiceData', JSON.stringify(invoiceData));
      formData.append('glCodingData', JSON.stringify(glCodingData));
      formData.append('requester', userEmail);
      
      // Add PDF file if present
      if (invoiceData.pdfFile) {
        formData.append('pdfFile', invoiceData.pdfFile);
      }

      const response = await fetch('/api/requests/create', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create request');
      }

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
            <span className="ml-2 font-medium">Review & Submit</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

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

      {currentStep === 'validation' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Review & Validation</h3>
          
          {/* Amount Validation */}
          <div className={`rounded-lg p-4 mb-6 ${amountsMatch ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {amountsMatch ? (
                <Check className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <div>
                <p className={`font-medium ${amountsMatch ? 'text-green-800' : 'text-red-800'}`}>
                  {amountsMatch ? 'Amounts Match' : 'Amount Mismatch'}
                </p>
                <p className={`text-sm ${amountsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  Invoice Total: ${invoiceTotal.toFixed(2)} | GL Coding Total: ${glCodingTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span>{invoiceData?.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span>{invoiceData?.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span>${invoiceData?.amount} {invoiceData?.currency}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">GL Coding Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries:</span>
                  <span>{glCodingData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span>${glCodingTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBackToGLCoding}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to GL Coding
            </button>
            
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!amountsMatch || loading}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
                amountsMatch && !loading 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? <LoadingSpinner /> : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}