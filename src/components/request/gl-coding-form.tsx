// src/components/request/gl-coding-form.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check } from "lucide-react";
import GLCodingTable from "./gl-coding-table";
import ExcelUploadModal from "./excel-upload-modal";
import QuickActions from "./quick-actions";
import ErrorMessage from "@/components/ui/error-message";

interface GLCodingEntry {
  id?: string; // Agregar id opcional para tracking
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

export default function GLCodingFormImproved({ 
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

  // Estado para filas seleccionadas
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const [inputMode, setInputMode] = useState<'table' | 'excel'>('table');
  const [dictionaries, setDictionaries] = useState<Dictionaries>({
    accounts: [],
    facilities: [],
    taxCodes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Calculate amounts
  const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const remainingAmount = invoiceAmount - totalAmount;
  const amountsMatch = Math.abs(remainingAmount) < 0.01;

  // Load dictionaries on component mount
  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      const response = await fetch('/api/gl-coding/dictionaries');
      if (response.ok) {
        const data = await response.json();
        setDictionaries(data);
      }
    } catch (error) {
      console.error('Error loading dictionaries:', error);
      setError('Failed to load account and facility data');
    }
  };

  const handleSubmit = async () => {
    if (!amountsMatch) {
      setError('Total amounts must match invoice amount before submitting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate entries one more time
      const validationResponse = await fetch('/api/gl-coding/validate-amounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, invoiceAmount })
      });

      const validation = await validationResponse.json();
      
      if (!validation.isValid) {
        setError(validation.message);
        setLoading(false);
        return;
      }

      // Submit to parent component
      onSubmit(entries);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit GL coding data');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = (importedEntries: GLCodingEntry[]) => {
    // Asegurar que las entradas importadas tengan IDs únicos
    const entriesWithIds = importedEntries.map((entry, index) => ({
      ...entry,
      id: entry.id || `gl-import-${Date.now()}-${index}`
    }));
    
    setEntries(entriesWithIds);
    setSelectedRows(new Set()); // Limpiar selección
    setShowExcelModal(false);
    setInputMode('table');
    setError(null);
  };

  // Handler para cambios en las entradas que también limpia selecciones inválidas
  const handleEntriesChange = (newEntries: GLCodingEntry[]) => {
    // Asegurar que siempre hay al menos una entrada
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
    
    // Limpiar selecciones que ya no son válidas
    const maxIndex = finalEntries.length - 1;
    const validSelections = new Set(
      Array.from(selectedRows).filter(index => index <= maxIndex)
    );
    
    if (validSelections.size !== selectedRows.size) {
      setSelectedRows(validSelections);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-7xl mx-auto">
      {/* Header with Amount Summary */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">GL Coding Block</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Invoice Amount: <span className="font-medium">${invoiceAmount.toLocaleString()}</span>
          </div>
          <div className={`text-sm font-medium ${
            amountsMatch ? 'text-green-600' : 
            remainingAmount > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            Total: ${totalAmount.toLocaleString()} 
            {!amountsMatch && ` (${remainingAmount > 0 ? '+' : ''}${remainingAmount.toLocaleString()})`}
          </div>
        </div>
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
          Load Excel
        </button>
      </div>

      {/* Quick Actions */}
      <QuickActions
        entries={entries}
        onEntriesChange={handleEntriesChange}
        remainingAmount={remainingAmount}
        onError={setError}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
      />

      {/* Main Table */}
      <GLCodingTable
        entries={entries}
        onEntriesChange={handleEntriesChange}
        dictionaries={dictionaries}
        onError={setError}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
      />

      {/* Status Summary */}
      <div className={`mt-6 p-4 rounded-lg border ${
        amountsMatch ? 'bg-green-50 border-green-200' : 
        remainingAmount > 0 ? 'bg-yellow-50 border-yellow-200' : 
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {amountsMatch ? (
              <Check className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            )}
            <div>
              <p className={`font-medium ${
                amountsMatch ? 'text-green-800' : 
                remainingAmount > 0 ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {entries.length} entries - Total: ${totalAmount.toLocaleString()}
              </p>
              <p className={`text-sm ${
                amountsMatch ? 'text-green-600' : 
                remainingAmount > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {amountsMatch ? 'Amounts match!' : `Difference: $${remainingAmount.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Invoice: ${invoiceAmount.toLocaleString()}</div>
            <div>Progress: {Math.min(100, (totalAmount / invoiceAmount) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        <button 
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Invoice
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!amountsMatch || loading}
          className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
            amountsMatch && !loading
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Saving...' : 'Continue to Review'}
        </button>
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