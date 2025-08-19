// src/components/request/invoice-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";

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

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  initialData?: InvoiceData | null;
}

interface Dictionary {
  companies: Array<{ code: string; description: string; }>;
  branches: Array<{ code: string; description: string; }>;
  currencies: Array<{ code: string; name: string; }>;
}

export default function InvoiceForm({ onSubmit, initialData }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceData>({
    company: initialData?.company || '',
    branch: initialData?.branch || '',
    tcrsCompany: initialData?.tcrsCompany || false,
    vendor: initialData?.vendor || '',
    po: initialData?.po || '',
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'CAD',
    pdfFile: initialData?.pdfFile,
  });

  const [dictionaries, setDictionaries] = useState<Dictionary>({
    companies: [],
    branches: [],
    currencies: [
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
    ]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load dictionaries on mount
  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      const response = await fetch('/api/dictionaries');
      if (!response.ok) {
        throw new Error('Failed to load dictionaries');
      }
      const data = await response.json();
      setDictionaries(prev => ({
        ...prev,
        companies: data.companies || [],
        branches: data.branches || [],
      }));
    } catch (err) {
      console.error('Error loading dictionaries:', err);
      // Use fallback data for development
      setDictionaries(prev => ({
        ...prev,
        companies: [
          { code: 'TCRS', description: 'TCRS Company' },
          { code: 'FINN', description: 'Finning Canada' },
          { code: 'SITECH', description: 'Sitech' },
        ],
        branches: [
          { code: 'BR001', description: 'Branch 1 - Toronto' },
          { code: 'BR002', description: 'Branch 2 - Vancouver' },
          { code: 'BR003', description: 'Branch 3 - Calgary' },
        ]
      }));
    }
  };

  const handleInputChange = (field: keyof InvoiceData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleFileUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      pdfFile: file
    }));
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      pdfFile: undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.company) {
      setError('Company is required');
      return;
    }
    if (!formData.branch) {
      setError('Branch is required');
      return;
    }
    if (!formData.vendor) {
      setError('Vendor is required');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Valid amount is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Information</h3>
      
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <select
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Company</option>
              {dictionaries.companies.map((company) => (
                <option key={company.code} value={company.code}>
                  {company.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <select
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Branch</option>
              {dictionaries.branches.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TCRS Company Checkbox */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.tcrsCompany}
              onChange={(e) => handleInputChange('tcrsCompany', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">TCRS Company</span>
          </label>
        </div>

        {/* Vendor and PO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor *
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO#
            </label>
            <input
              type="text"
              value={formData.po}
              onChange={(e) => handleInputChange('po', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PO number"
            />
          </div>
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount (including Tax) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dictionaries.currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice PDF
          </label>
          
          {!formData.pdfFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your PDF file here, or
              </p>
              <label className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 cursor-pointer">
                Browse Files
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">PDF files up to 10MB</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-900">{formData.pdfFile.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({Math.round(formData.pdfFile.size / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : 'Continue to GL Coding'}
          </button>
        </div>
      </form>
    </div>
  );
}