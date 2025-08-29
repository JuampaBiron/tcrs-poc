// src/components/request/gl-coding-form.tsx 
"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Check, XCircle, AlertTriangle } from "lucide-react";
import GLCodingTable from "./gl-coding-table";
import ExcelUploadModal from "./excel-upload-modal";
import QuickActions from "./quick-actions";
import ErrorMessage from "@/components/ui/error-message";
import { useGLDictionaries } from "@/hooks/use-gl-dictionaries";
import { useValidateGLAmounts } from "@/hooks/use-validate-gl-amounts";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface GLCodingEntry {
  id?: string;
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

interface GLCodingFormProps {
  invoiceAmount: number;
  onSubmit: (data: GLCodingEntry[]) => void;
  onBack: () => void;
  initialData?: GLCodingEntry[];
}

// ✅ Entry validation function
function validateGLEntry(entry: GLCodingEntry, index: number): string[] {
  const errors: string[] = [];
  const entryNum = index + 1;

  // Account code validation
  if (!entry.accountCode || entry.accountCode.trim().length === 0) {
    errors.push(`Entry ${entryNum}: Account code is required`);
  }

  // Facility code validation
  if (!entry.facilityCode || entry.facilityCode.trim().length === 0) {
    errors.push(`Entry ${entryNum}: Facility code is required`);
  }

  // Amount validation
  if (entry.amount === null || entry.amount === undefined) {
    errors.push(`Entry ${entryNum}: Amount cannot be empty`);
  } else if (typeof entry.amount !== 'number' || isNaN(entry.amount)) {
    errors.push(`Entry ${entryNum}: Amount must be a valid number`);
  } else if (entry.amount <= 0) {
    errors.push(`Entry ${entryNum}: Amount must be greater than zero`);
  }

  return errors;
}

export default function GLCodingForm({
  invoiceAmount,
  onSubmit,
  onBack,
  initialData = []
}: GLCodingFormProps) {
  const [entries, setEntries] = useState<GLCodingEntry[]>(
    initialData.length > 0 ? initialData : [{
      id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountCode: '',
      facilityCode: '',
      taxCode: '',
      amount: 0,
      equipment: '',
      comments: ''
    }]
  );
  const { data: dictionaries, isLoading: loadingDictionaries, error: dictionariesError } = useGLDictionaries();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [inputMode, setInputMode] = useState<'table' | 'excel'>('table');
  const [error, setError] = useState<string | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateGLAmounts = useValidateGLAmounts();

  // Comprehensive validation with memoization for performance
  const validationResults = useMemo(() => {
    const allErrors: string[] = [];
    const entryValidations: { [index: number]: string[] } = {};

    entries.forEach((entry, index) => {
      const entryErrors = validateGLEntry(entry, index);
      entryValidations[index] = entryErrors;
      allErrors.push(...entryErrors);
    });

    const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const remainingAmount = invoiceAmount - totalAmount;
    const amountsMatch = Math.abs(remainingAmount) < 0.01;
    const validEntries = entries.filter((_, index) => entryValidations[index].length === 0);

    return {
      allErrors,
      entryValidations,
      totalAmount,
      remainingAmount,
      amountsMatch,
      validEntries: validEntries.length,
      invalidEntries: entries.length - validEntries.length,
      hasValidationErrors: allErrors.length > 0,
      canSubmit: allErrors.length === 0 && amountsMatch
    };
  }, [entries, invoiceAmount]);

  const handleSubmit = async () => {
    if (!validationResults.canSubmit) {
      if (validationResults.hasValidationErrors) {
        setError(`Please fix ${validationResults.allErrors.length} validation error(s) before continuing`);
      } else if (!validationResults.amountsMatch) {
        setError('Total amounts must match invoice amount before continuing');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validation = await validateGLAmounts.mutateAsync({ entries, invoiceAmount });
      if (!validation.isValid) {
        setError(validation.message);
        setLoading(false);
        return;
      }
      onSubmit(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit GL coding data');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = (importedEntries: GLCodingEntry[]) => {
    const entriesWithIds = importedEntries.map((entry, index) => ({
      ...entry,
      id: entry.id || `gl-import-${Date.now()}-${index}`
    }));

    setEntries(entriesWithIds);
    setSelectedRows(new Set());
    setShowExcelModal(false);
    setInputMode('table');
    setError(null);
  };

  const handleEntriesChange = (newEntries: GLCodingEntry[]) => {
    const finalEntries = newEntries.length === 0
      ? [{
        id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accountCode: '',
        facilityCode: '',
        taxCode: '',
        amount: 0,
        equipment: '',
        comments: ''
      }]
      : newEntries;

    setEntries(finalEntries);

    // Clean up invalid selections
    const maxIndex = finalEntries.length - 1;
    const validSelections = new Set(
      Array.from(selectedRows).filter(index => index <= maxIndex)
    );

    if (validSelections.size !== selectedRows.size) {
      setSelectedRows(validSelections);
    }
  };

  // Handle loading and error states for dictionaries
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
                ({validationResults.remainingAmount > 0 ? '+' : ''}${validationResults.remainingAmount.toLocaleString()})
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Progress: {Math.min(100, (validationResults.totalAmount / invoiceAmount) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Validation Status Summary */}
      <div className="mb-6 p-4 rounded-lg border bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Entry Status
          </h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className={`flex items-center ${validationResults.validEntries > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <Check className="w-4 h-4 mr-1" />
              {validationResults.validEntries} valid
            </div>
            <div className={`flex items-center ${validationResults.invalidEntries > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              <XCircle className="w-4 h-4 mr-1" />
              {validationResults.invalidEntries} invalid
            </div>
            <div className={`flex items-center ${validationResults.amountsMatch ? 'text-green-600' : 'text-yellow-600'}`}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              {validationResults.amountsMatch ? 'Amounts match' : 'Amounts mismatch'}
            </div>
          </div>
        </div>

        {/* Error List */}
        {validationResults.hasValidationErrors && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-700">
              {validationResults.allErrors.length} error(s) found:
            </p>
            <div className="max-h-32 overflow-y-auto">
              {validationResults.allErrors.slice(0, 10).map((errorMsg, index) => (
                <div key={index} className="text-sm text-red-600 pl-4">
                  • {errorMsg}
                </div>
              ))}
              {validationResults.allErrors.length > 10 && (
                <div className="text-sm text-red-600 pl-4 font-medium">
                  ... and {validationResults.allErrors.length - 10} more error(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amount Status */}
        {!validationResults.amountsMatch && !validationResults.hasValidationErrors && (
          <div className="text-sm">
            <p className="text-yellow-700 font-medium">
              Amount adjustment needed:
            </p>
            <p className="text-yellow-600">
              {validationResults.remainingAmount > 0
                ? `Add $${validationResults.remainingAmount.toLocaleString()} more`
                : `Remove $${Math.abs(validationResults.remainingAmount).toLocaleString()}`}
            </p>
          </div>
        )}

        {/* Ready to submit */}
        {validationResults.canSubmit && (
          <div className="text-sm">
            <p className="text-green-700 font-medium flex items-center">
              <Check className="w-4 h-4 mr-1" />
              Ready to continue - all validations passed!
            </p>
          </div>
        )}
      </div>

      {/* Input Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInputMode('table')}
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
                  : `Difference: $${validationResults.remainingAmount.toLocaleString()}`}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Invoice: ${invoiceAmount.toLocaleString()}</div>
              <div>Progress: {Math.min(100, (validationResults.totalAmount / invoiceAmount) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Enhanced Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Invoice
        </button>

        <div className="flex items-center space-x-3">
          {/* Status indicator next to button */}
          {validationResults.hasValidationErrors && (
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="w-4 h-4 mr-1" />
              {validationResults.allErrors.length} error{validationResults.allErrors.length !== 1 ? 's' : ''}
            </div>
          )}

          {!validationResults.hasValidationErrors && !validationResults.amountsMatch && (
            <div className="flex items-center text-sm text-yellow-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Amounts don't match
            </div>
          )}

          {validationResults.canSubmit && (
            <div className="flex items-center text-sm text-green-600">
              <Check className="w-4 h-4 mr-1" />
              Ready
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!validationResults.canSubmit || loading}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              validationResults.canSubmit && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Validating...' :
              validationResults.hasValidationErrors ? `Fix ${validationResults.allErrors.length} error${validationResults.allErrors.length !== 1 ? 's' : ''} to continue` :
                !validationResults.amountsMatch ? 'Adjust amounts to continue' :
                  'Continue to Review'}
          </button>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <ExcelUploadModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onImport={handleExcelImport}
          dictionaries={dictionaries}
        />
      )}
    </div>
  );
}