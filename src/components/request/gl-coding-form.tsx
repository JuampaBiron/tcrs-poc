// src/components/request/gl-coding-form.tsx 
"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertCircle, Check, XCircle, AlertTriangle, FileX, Upload } from "lucide-react";
import GLCodingTable from "./gl-coding-table";
import ExcelUploadModal from "./excel-upload-modal";
import QuickActions from "./quick-actions";
import ErrorMessage from "@/components/ui/error-message";
import { useGLDictionaries } from "@/hooks/use-gl-dictionaries";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ExcelProcessor } from "@/lib/excel-processor";

interface GLCodingEntry {
  id?: string;
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

interface GLCodingFormProps {
  invoiceAmount: number;
  onSubmit: (data: { 
    entries: GLCodingEntry[], 
    excelFile?: File 
  }) => void;
  onBack: () => void;
  initialData?: GLCodingEntry[];
  externalLoading?: boolean; // New prop to control loading from parent
}

// Entry validation function
function validateGLEntry(entry: GLCodingEntry, index: number): string[] {
  const errors: string[] = [];
  const entryNum = index + 1;

  if (!entry.accountCode || entry.accountCode.trim().length === 0) {
    errors.push(`Entry ${entryNum}: Account code is required`);
  }

  if (!entry.facilityCode || entry.facilityCode.trim().length === 0) {
    errors.push(`Entry ${entryNum}: Facility code is required`);
  }

  if (entry.amount === null || entry.amount === undefined) {
    errors.push(`Entry ${entryNum}: Amount cannot be empty`);
  } else if (typeof entry.amount !== 'number' || isNaN(entry.amount)) {
    errors.push(`Entry ${entryNum}: Amount must be a valid number`);
  } else if (entry.amount <= 0) {
    errors.push(`Entry ${entryNum}: Amount must be greater than zero`);
  }

  return errors;
}

// Create empty entry helper
function createEmptyEntry(): GLCodingEntry {
  return {
    id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accountCode: '',
    facilityCode: '',
    taxCode: '',
    amount: 0,
    equipment: '',
    comments: ''
  };
}

export default function GLCodingForm({
  invoiceAmount,
  onSubmit,
  onBack,
  initialData = [],
  externalLoading = false
}: GLCodingFormProps) {
  // State
  const [entries, setEntries] = useState<GLCodingEntry[]>(
    initialData.length > 0 ? initialData : [createEmptyEntry()]
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [inputMode, setInputMode] = useState<'table' | 'excel'>('table');
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Excel file state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);

  // Hooks
  const dictionariesQuery = useGLDictionaries();
  const dictionaries = dictionariesQuery.data;
  const loadingDictionaries = dictionariesQuery.isLoading;
  const dictionariesError = dictionariesQuery.error;
  
  // Validation calculations
  const validationResults = useMemo(() => {
    const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const remainingAmount = invoiceAmount - totalAmount;
    const amountsMatch = Math.abs(remainingAmount) < 0.01;
    
    return {
      totalAmount,
      remainingAmount,
      amountsMatch
    };
  }, [entries, invoiceAmount]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    entries.forEach((entry, index) => {
      const entryErrors = validateGLEntry(entry, index);
      errors.push(...entryErrors);
    });
    return errors;
  }, [entries]);

  const isFormValid = useMemo(() => {
    return validationErrors.length === 0 && 
           validationResults.amountsMatch && 
           entries.length > 0;
  }, [validationErrors, validationResults, entries]);

  // Excel import handler
  const handleExcelImport = useCallback(async (importedEntries: GLCodingEntry[], file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Processing Excel file locally:', file.name);
      const result = await ExcelProcessor.processFile(file);
      
      if (result.errors.length > 0) {
        setError(`Excel validation errors: ${result.errors.join(', ')}`);
        return;
      }
      
      // Add unique IDs to entries
      const entriesWithIds = result.entries.map((entry, index) => ({
        ...entry,
        id: `excel-import-${Date.now()}-${index}`
      }));
      
      // Update state
      setEntries(entriesWithIds);
      setExcelFile(file);
      setExcelFileName(file.name);
      setSelectedRows(new Set());
      setShowExcelModal(false);
      setInputMode('excel');
      
      console.log(`Excel processed locally: ${result.entries.length} entries from ${file.name}`);
      
    } catch (err) {
      console.error('Local Excel processing failed:', err);
      setError(`Failed to process Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEntriesChange = useCallback((newEntries: GLCodingEntry[]) => {
    const finalEntries = newEntries.length === 0 ? [createEmptyEntry()] : newEntries;
    setEntries(finalEntries);

    // Clean up invalid selections
    const maxIndex = finalEntries.length - 1;
    const validSelections = new Set(
      Array.from(selectedRows).filter(index => index <= maxIndex)
    );

    if (validSelections.size !== selectedRows.size) {
      setSelectedRows(validSelections);
    }
  }, [selectedRows]);

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setError(null);
    
    console.log('Submitting GL coding data:', {
      entriesCount: entries.length,
      hasExcelFile: !!excelFile,
      excelFileName: excelFileName
    });

    // Let parent handle loading state and navigation
    onSubmit({ 
      entries: entries,
      excelFile: excelFile || undefined
    });
  }, [entries, excelFile, isFormValid, onSubmit, excelFileName]);

  // Clear Excel data
  const clearExcelData = useCallback(() => {
    setExcelFile(null);
    setExcelFileName(null);
    setEntries([createEmptyEntry()]);
    setSelectedRows(new Set());
    setInputMode('table');
    setError(null);
  }, []);

  // Loading and error states
  if (loadingDictionaries) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (dictionariesError) {
    return (
      <ErrorMessage message="Could not load GL dictionaries. Please try again later." />
    );
  }

  if (!dictionaries) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-7xl mx-auto">
      {/* Header with Enhanced Amount Summary */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-gray-900">GL Coding Block</h3>
        <div className="text-right space-y-1">
          <div className="text-sm text-gray-600">
            Invoice Amount: <span className="font-medium">${invoiceAmount.toLocaleString()}</span>
          </div>
          <div className={`text-sm font-medium ${
            validationResults.amountsMatch ? 'text-green-600' :
              validationResults.remainingAmount > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            Total: ${validationResults.totalAmount.toLocaleString()}
            {!validationResults.amountsMatch && (
              <span className="ml-1">
                ({validationResults.remainingAmount > 0 ? 
                  `$${validationResults.remainingAmount.toLocaleString()} remaining` : 
                  `$${Math.abs(validationResults.remainingAmount).toLocaleString()} over`})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {validationResults.amountsMatch ? (
              <div className="flex items-center text-green-600">
                <Check size={16} className="mr-1" />
                <span className="text-xs">Amounts Match</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle size={16} className="mr-1" />
                <span className="text-xs">Amounts Don't Match</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excel file indicator */}
      {excelFile && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-blue-600" />
            <span className="text-blue-600 font-medium">Excel File:</span>
            <span className="text-blue-800">{excelFileName}</span>
            <button
              onClick={clearExcelData}
              className="ml-auto flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm transition-colors"
            >
              <FileX size={14} />
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* Input Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setInputMode('table');
            if (!excelFile) {
              setEntries([createEmptyEntry()]);
            }
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            inputMode === 'table'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          Manual Table
        </button>
        <button
          onClick={() => {
            setInputMode('excel');
            setShowExcelModal(true);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            inputMode === 'excel'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
        >
          Import from Excel
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* GL Coding Table */}
        <GLCodingTable
          entries={entries}
          onEntriesChange={handleEntriesChange}
          dictionaries={dictionaries}
          onError={setError}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
        />

        {/* Quick Actions */}
        <QuickActions
          entries={entries}
          onEntriesChange={handleEntriesChange}
          remainingAmount={validationResults.remainingAmount}
          onError={setError}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
        />

        {/* Enhanced Progress Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className={`font-medium ${
                validationResults.amountsMatch ? 'text-green-800' :
                  validationResults.remainingAmount > 0 ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {entries.length} entries - Total: ${validationResults.totalAmount.toLocaleString()}
              </p>
              <p className={`text-sm ${
                validationResults.amountsMatch ? 'text-green-600' :
                  validationResults.remainingAmount > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {validationResults.amountsMatch
                  ? 'Amounts match perfectly!'
                  : validationResults.remainingAmount > 0
                    ? `Need to add $${validationResults.remainingAmount.toLocaleString()} more`
                    : `Reduce by $${Math.abs(validationResults.remainingAmount).toLocaleString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {validationResults.amountsMatch ? (
                <div className="flex items-center text-green-600">
                  <Check size={20} className="mr-1" />
                  <span className="font-medium">Ready</span>
                </div>
              ) : validationResults.remainingAmount > 0 ? (
                <div className="flex items-center text-yellow-600">
                  <AlertTriangle size={20} className="mr-1" />
                  <span className="font-medium">Incomplete</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle size={20} className="mr-1" />
                  <span className="font-medium">Over Budget</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-medium mb-2 flex items-center">
              <XCircle size={16} className="mr-2" />
              Validation Errors
            </h4>
            <ul className="text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Invoice
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || loading || externalLoading}
            className={`px-6 py-2 rounded-md font-medium flex items-center justify-center gap-2 ${
              isFormValid && !loading && !externalLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {(loading || externalLoading) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {externalLoading ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              'Continue to Validation'
            )}
          </button>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <ExcelUploadModal
          onImport={handleExcelImport}
          onCancel={() => setShowExcelModal(false)}
        />
      )}
    </div>
  );
}