// src/components/request/excel-upload-modal.tsx
"use client";

import { useState, useRef } from "react";
import { FileSpreadsheet, Upload, X, AlertCircle, CheckCircle } from "lucide-react";

interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

interface Dictionaries {
  accounts: Array<{ accountCode: string; accountDescription: string; accountCombined: string; }>;
  facilities: Array<{ facilityCode: string; facilityDescription: string; facilityCombined: string; }>;
  taxCodes: Array<{ code: string; description: string; }>;
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: GLCodingEntry[]) => void;
  dictionaries: Dictionaries;
}

interface ExcelPreviewData {
  entries: GLCodingEntry[];
  errors: string[];
  warnings: string[];
  fileName: string;
  totalAmount: number;
}
export const runtime = "nodejs";
export default function ExcelUploadModal({ 
  isOpen, 
  onClose, 
  onImport, 
  dictionaries 
}: ExcelUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('requestId', 'temp-preview'); // Temporary for preview
      formData.append('uploader', 'current-user');
      console.log('Uploading file:', selectedFile);
      console.log('FormData:', formData);

      const response = await fetch('/api/gl-coding/excel-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setPreview({
          entries: result.preview || [],
          errors: result.validationErrors || [],
          warnings: [],
          fileName: result.fileName || selectedFile.name,
          totalAmount: result.totalAmount || 0
        });
      } else {
        alert(result.error || 'Error processing Excel file');
        setFile(null);
      }
    } catch (error) {
      console.error('Error uploading Excel:', error);
      alert('Error processing Excel file');
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

  const confirmImport = () => {
    if (preview && preview.errors.length === 0) {
      onImport(preview.entries);
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
    onClose();
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
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag your Excel file here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to select file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </button>
              </div>
            </>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing Excel file...</p>
            </div>
          )}

          {/* Preview Results */}
          {preview && !isProcessing && (
            <div>
              {/* File Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{preview.fileName}</p>
                    <p className="text-sm text-gray-600">
                      {preview.entries.length} entries found - 
                      Total: ${preview.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change file
                  </button>
                </div>
              </div>

              {/* Validation Results */}
              {preview.errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <h4 className="font-medium text-red-900">
                      Errors found ({preview.errors.length})
                    </h4>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.errors.length === 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="font-medium text-green-900">
                      File validated successfully - Ready to import
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Data Preview</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left border-b">#</th>
                        <th className="px-3 py-2 text-left border-b">Acc Code</th>
                        <th className="px-3 py-2 text-left border-b">Facility</th>
                        <th className="px-3 py-2 text-left border-b">Tax Code</th>
                        <th className="px-3 py-2 text-left border-b">Amount</th>
                        <th className="px-3 py-2 text-left border-b">Equipment #</th>
                        <th className="px-3 py-2 text-left border-b">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.entries.map((entry, index) => (
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
              </div>
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