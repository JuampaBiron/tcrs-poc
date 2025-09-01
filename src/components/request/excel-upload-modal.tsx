// src/components/request/excel-upload-modal.tsx
"use client";

import { useState, useRef } from "react";
import { FileSpreadsheet, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { ExcelProcessor } from "@/lib/excel-processor";

interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

interface ExcelUploadModalProps {
  onImport: (entries: GLCodingEntry[], file: File) => void;  // ✅ MODIFIED: Now includes File
  onCancel: () => void;
}

interface ExcelPreviewData {
  entries: GLCodingEntry[];
  errors: string[];
  warnings: string[];
  fileName: string;
  totalAmount: number;
}

export default function ExcelUploadModal({ 
  onImport, 
  onCancel 
}: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ REFACTORED: Process Excel locally using ExcelProcessor
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('Only Excel files (.xlsx, .xls) are allowed');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setPreview(null);

    try {
      console.log('🔄 Processing Excel file locally:', selectedFile.name);
      
      // ✅ NEW: Use ExcelProcessor locally instead of API call
      const result = await ExcelProcessor.processFile(selectedFile);
      
      console.log('✅ Excel processed:', {
        entries: result.entries.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      setPreview({
        entries: result.entries || [],
        errors: result.errors || [],
        warnings: result.warnings || [],
        fileName: result.metadata.fileName || selectedFile.name,
        totalAmount: result.metadata.totalAmount || 0
      });
      
    } catch (error) {
      console.error('❌ Excel processing error:', error);
      alert(`Error processing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // ✅ MODIFIED: Pass both entries and file to parent
  const confirmImport = () => {
    if (preview && preview.errors.length === 0 && file) {
      onImport(preview.entries, file);  // ✅ Pass file too
      resetModal();
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Load Excel File</h3>
          </div>
          <button
            onClick={resetModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!file && (
            <>
              {/* Upload Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Required Excel Format</h4>
                <p className="text-sm text-blue-800 mb-2">
                  The Excel file must have these columns in exact order:
                </p>
                <div className="text-sm text-blue-700 font-mono bg-blue-100 p-3 rounded">
                  <div>A: Line</div>
                  <div>B: Acc code</div>
                  <div>C: Account Description</div>
                  <div>D: Facility</div>
                  <div>E: Facility Description</div>
                  <div>F: Tax Code</div>
                  <div>G: Amount</div>
                  <div>H: Equipment # (optional)</div>
                  <div>I: Comments (optional)</div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  * First row can contain headers (will be automatically skipped)
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Click to upload
                  </label>
                  {' '}or drag and drop
                </div>
                <p className="text-xs text-gray-500 mt-1">Excel files only (.xlsx, .xls)</p>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                />
              </div>
            </>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Processing Excel file...</p>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Filename:</span>
                    <span className="ml-2 font-mono">{preview.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Entries:</span>
                    <span className="ml-2 font-medium">{preview.entries.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">${preview.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      preview.errors.length === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {preview.errors.length === 0 ? 'Valid' : `${preview.errors.length} errors`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Validation Errors
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {preview.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Warnings
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {preview.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {preview.errors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Ready to Import
                  </h4>
                  <p className="text-sm text-green-700">
                    {preview.entries.length} entries processed successfully. Total amount: ${preview.totalAmount.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Data Preview Table */}
              {preview.entries.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Preview (First 10 entries)</h4>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">#</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Account</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Facility</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Tax Code</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-900">Amount</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Equipment</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-900">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.entries.slice(0, 10).map((entry, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2 font-mono">{entry.accountCode}</td>
                            <td className="px-3 py-2 font-mono">{entry.facilityCode}</td>
                            <td className="px-3 py-2">{entry.taxCode}</td>
                            <td className="px-3 py-2 text-right">${entry.amount.toLocaleString()}</td>
                            <td className="px-3 py-2">{entry.equipment}</td>
                            <td className="px-3 py-2">{entry.comments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.entries.length > 10 && (
                    <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600">
                      ... and {preview.entries.length - 10} more entries
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={resetModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          {preview && (
            <button
              onClick={confirmImport}
              disabled={preview.errors.length > 0}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                preview.errors.length === 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              Import {preview.entries.length} Entries
            </button>
          )}
        </div>
      </div>
    </div>
  );
}