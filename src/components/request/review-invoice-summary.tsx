"use client";

import React from "react";

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

interface ExcelUploadResult {
  blobUrl: string;
  blobName: string;
  originalFileName: string;
  tempId: string;
  year?: number;
  month?: number;
}

interface ReviewInvoiceSummaryProps {
  invoiceData: InvoiceData | null;
  excelUploadResult: ExcelUploadResult | null;
  invoiceTotal: number;
}

const ReviewInvoiceSummary: React.FC<ReviewInvoiceSummaryProps> = ({
  invoiceData,
  excelUploadResult,
  invoiceTotal,
}) => {
  if (!invoiceData) return null;

  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">Invoice Details</h4>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Company:</span>
          <span className="font-medium">{invoiceData.company}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Branch:</span>
          <span className="font-medium">{invoiceData.branch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Vendor:</span>
          <span className="font-medium">{invoiceData.vendor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">PO:</span>
          <span className="font-medium">{invoiceData.po}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">
            ${invoiceTotal.toFixed(2)} {invoiceData.currency}
          </span>
        </div>
        {invoiceData.pdfFile && (
          <div className="flex justify-between">
            <span className="text-gray-600">PDF:</span>
            <span className="font-medium">{invoiceData.pdfFile.name}</span>
          </div>
        )}
        {excelUploadResult && (
          <div className="flex justify-between">
            <span className="text-gray-600">Excel:</span>
            <span className="font-medium">{excelUploadResult.originalFileName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewInvoiceSummary;