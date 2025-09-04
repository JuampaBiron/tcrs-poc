// src/components/request/invoice-form.tsx
"use client";

import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { DICTIONARY_FALLBACKS } from "@/constants";
import { useCompanies } from "@/hooks/use-companies";
import { useBranches } from "@/hooks/use-branches";

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
  pdfTempId?: string;
  pdfOriginalName?: string;
  blobName?: string;
}

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  initialData?: Partial<InvoiceData>;
  uploadPdf?: (file: File, context?: string, company?: string, branch?: string) => Promise<any>;
  pdfUploading?: boolean;
  pdfError?: string | null;
}

interface DictionaryItem {
  code: string;
  description: string;
}

interface CurrencyItem {
  code: string;
  name: string;
}

export default function InvoiceForm({ onSubmit, initialData, uploadPdf, pdfUploading, pdfError }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceData>({
    company: initialData?.company || '',
    branch: initialData?.branch || '',
    tcrsCompany: initialData?.tcrsCompany || false,
    vendor: initialData?.vendor || '',
    po: initialData?.po || '',
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'CAD',
    pdfFile: undefined,
  });

  const [currencies] = useState<CurrencyItem[]>([...DICTIONARY_FALLBACKS.currencies]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pdfUploadResult, setPdfUploadResult] = useState<any>(null);

  // Usar hook para obtener companies (sin fallback)
  const { data: companies, isLoading: loadingCompanies, error: companiesError } = useCompanies();

  // Usar hook para obtener branches según la company seleccionada
  const { data: branches = [], isLoading: loadingBranches, error: branchesError } = useBranches(formData.company);

  // Helper para saber si la compañía seleccionada es TCRS
  const isTcrsCompany = (() => {
    if (!formData.company || !companies) return false;
    const selected = companies.find((c: DictionaryItem) => c.code === formData.company);
    // Puedes ajustar la lógica según tu base de datos: por code o description
    return selected?.description?.toUpperCase().includes("TCRS") || selected?.code?.toUpperCase() === "TCRS";
  })();

  const handleInputChange = (field: keyof InvoiceData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Si cambia la company, resetea branch y setea tcrsCompany según la selección
      if (field === 'company' && value !== prev.company) {
        newData.branch = '';
        // Buscar la compañía seleccionada
        const selected = companies?.find((c: DictionaryItem) => c.code === value);
        newData.tcrsCompany =
          selected?.description?.toUpperCase().includes("TCRS") ||
          selected?.code?.toUpperCase() === "TCRS";
      }
      return newData;
    });

    if (error) {
      setError(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Store file locally first
    handleInputChange('pdfFile', file);

    // Upload to Azure if uploadPdf function is provided and company/branch are selected
    if (uploadPdf && formData.company && formData.branch) {
      try {
        console.log('🔄 Uploading PDF as temporary...');
        const result = await uploadPdf(file, 'temp', formData.company, formData.branch);
        setPdfUploadResult(result);
        
        // Update form data with upload result
        setFormData(prev => ({
          ...prev,
          pdfUrl: result.blobUrl,
          pdfTempId: result.tempId,
          pdfOriginalName: result.originalFileName,
          blobName: result.blobName
        }));

        console.log('✅ PDF uploaded successfully as temporary:', result.blobUrl);
      } catch (uploadError) {
        console.error('❌ PDF temporary upload failed:', uploadError);
        // Don't prevent form submission, keep file locally
      }
    } else if (uploadPdf) {
      console.log('⚠️ PDF file selected but company/branch not set, will upload later');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
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

    // Forzamos tcrsCompany antes de enviar, por si acaso
    const selected = companies?.find((c: DictionaryItem) => c.code === formData.company);
    const tcrsCompany =
      selected?.description?.toUpperCase().includes("TCRS") ||
      selected?.code?.toUpperCase() === "TCRS";

    onSubmit({ ...formData, tcrsCompany });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Information</h3>

      {(error || pdfError) && <ErrorMessage message={error || pdfError || ''} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company and Branch Selection (Cascade) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <div className="relative">
              <select
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={loadingCompanies}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                  {loadingCompanies
                    ? "Loading companies..."
                    : companiesError
                    ? "Error loading companies"
                    : "Select Company"}
                </option>
                {companies && companies.map((company: DictionaryItem) => (
                  <option key={company.code} value={company.code}>
                    {company.description}
                  </option>
                ))}
              </select>
              {loadingCompanies && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {companiesError && (
              <p className="text-xs text-red-600 mt-1">
                Could not load companies. Please try again later.
              </p>
            )}
          </div>

          {/* Branch Dropdown (Dependent on Company) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <div className="relative">
              <select
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                disabled={!formData.company || loadingBranches}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                  {!formData.company
                    ? "Select Company first"
                    : loadingBranches
                    ? "Loading branches..."
                    : branchesError
                    ? "Error loading branches"
                    : "Select Branch"
                  }
                </option>
                {branches.map((branch: DictionaryItem) => (
                  <option key={branch.code} value={branch.code}>
                    {branch.description}
                  </option>
                ))}
              </select>
              {loadingBranches && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {!formData.company && (
              <p className="text-xs text-gray-500 mt-1">Please select a company first</p>
            )}
            {branchesError && (
              <p className="text-xs text-red-600 mt-1">
                Could not load branches. Please try again later.
              </p>
            )}
          </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PO number"
            />
          </div>
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
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
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {pdfUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600">Uploading PDF...</span>
              </div>
            ) : formData.pdfFile ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">{formData.pdfFile.name}</span>
                {pdfUploadResult && (
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('pdfFile', undefined);
                    setPdfUploadResult(null);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop your PDF here, or{' '}
                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || loadingCompanies || loadingBranches}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}