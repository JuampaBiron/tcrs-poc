// src/components/request/gl-coding-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

interface GLCodingFormProps {
  invoiceAmount: number;
  onSubmit: (data: GLCodingEntry[]) => void;
  onBack: () => void;
  initialData?: GLCodingEntry[];
}

interface Dictionaries {
  accounts: Array<{ accountCode: string; accountDescription: string; accountCombined: string; }>;
  facilities: Array<{ facilityCode: string; facilityDescription: string; facilityCombined: string; }>;
  taxCodes: Array<{ code: string; description: string; }>;
}

export default function GLCodingForm({ invoiceAmount, onSubmit, onBack, initialData = [] }: GLCodingFormProps) {
  const [entries, setEntries] = useState<GLCodingEntry[]>(
    initialData.length > 0 ? initialData : [{
      accountCode: '',
      facilityCode: '',
      taxCode: '',
      amount: 0,
      equipment: '',
      comments: ''
    }]
  );

  const [dictionaries, setDictionaries] = useState<Dictionaries>({
    accounts: [],
    facilities: [],
    taxCodes: [
      { code: 'HST', description: 'HST (13%)' },
      { code: 'GST', description: 'GST (5%)' },
      { code: 'PST', description: 'PST (Various)' },
      { code: 'EXEMPT', description: 'Tax Exempt' },
    ]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        accounts: data.accounts || [],
        facilities: data.facilities || [],
      }));
    } catch (err) {
      console.error('Error loading dictionaries:', err);
      // Use fallback data for development
      setDictionaries(prev => ({
        ...prev,
        accounts: [
          { accountCode: '1001', accountDescription: 'Office Supplies', accountCombined: '1001 - Office Supplies' },
          { accountCode: '1002', accountDescription: 'Equipment', accountCombined: '1002 - Equipment' },
          { accountCode: '1003', accountDescription: 'Services', accountCombined: '1003 - Services' },
        ],
        facilities: [
          { facilityCode: 'FAC001', facilityDescription: 'Toronto Main', facilityCombined: 'FAC001 - Toronto Main' },
          { facilityCode: 'FAC002', facilityDescription: 'Vancouver Office', facilityCombined: 'FAC002 - Vancouver Office' },
          { facilityCode: 'FAC003', facilityDescription: 'Calgary Branch', facilityCombined: 'FAC003 - Calgary Branch' },
        ]
      }));
    }
  };

  // Calculate totals
  const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const remainingAmount = invoiceAmount - totalAmount;
  const amountsMatch = Math.abs(remainingAmount) < 0.01;

  const addEntry = () => {
    setEntries(prev => [...prev, {
      accountCode: '',
      facilityCode: '',
      taxCode: '',
      amount: remainingAmount > 0 ? remainingAmount : 0,
      equipment: '',
      comments: ''
    }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof GLCodingEntry, value: any) => {
    setEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.accountCode) {
        setError(`Account is required for entry ${i + 1}`);
        return;
      }
      if (!entry.facilityCode) {
        setError(`Facility is required for entry ${i + 1}`);
        return;
      }
      if (!entry.amount || entry.amount <= 0) {
        setError(`Valid amount is required for entry ${i + 1}`);
        return;
      }
    }

    if (!amountsMatch) {
      setError(`Total GL coding amount ($${totalAmount.toFixed(2)}) must equal invoice amount ($${invoiceAmount.toFixed(2)})`);
      return;
    }

    onSubmit(entries);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">GL Coding Block</h3>
        <div className="text-sm text-gray-600">
          Invoice Amount: <span className="font-medium">${invoiceAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Amount Summary */}
      <div className={`rounded-lg p-4 mb-6 ${
        amountsMatch ? 'bg-green-50 border border-green-200' : 
        remainingAmount > 0 ? 'bg-yellow-50 border border-yellow-200' : 
        'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {!amountsMatch && <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />}
            <div>
              <p className={`font-medium ${
                amountsMatch ? 'text-green-800' : 
                remainingAmount > 0 ? 'text-yellow-800' : 'text-red-800'
              }`}>
                Total: ${totalAmount.toFixed(2)}
              </p>
              <p className={`text-sm ${
                amountsMatch ? 'text-green-600' : 
                remainingAmount > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {amountsMatch ? 'Amounts match!' : `Remaining: $${remainingAmount.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          {entries.map((entry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Entry {index + 1}</h4>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Account Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account *
                  </label>
                  <select
                    value={entry.accountCode}
                    onChange={(e) => updateEntry(index, 'accountCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select Account</option>
                    {dictionaries.accounts.map((account) => (
                      <option key={account.accountCode} value={account.accountCode}>
                        {account.accountCombined}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Facility Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility *
                  </label>
                  <select
                    value={entry.facilityCode}
                    onChange={(e) => updateEntry(index, 'facilityCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select Facility</option>
                    {dictionaries.facilities.map((facility) => (
                      <option key={facility.facilityCode} value={facility.facilityCode}>
                        {facility.facilityCombined}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tax Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Code
                  </label>
                  <select
                    value={entry.taxCode}
                    onChange={(e) => updateEntry(index, 'taxCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Tax Code</option>
                    {dictionaries.taxCodes.map((tax) => (
                      <option key={tax.code} value={tax.code}>
                        {tax.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entry.amount}
                    onChange={(e) => updateEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment
                  </label>
                  <input
                    type="text"
                    value={entry.equipment}
                    onChange={(e) => updateEntry(index, 'equipment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Equipment reference"
                  />
                </div>

                {/* Comments */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={entry.comments}
                    onChange={(e) => updateEntry(index, 'comments', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Additional comments or notes"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Entry Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add GL Coding Entry
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Invoice
          </button>
          
          <button
            type="submit"
            disabled={loading || !amountsMatch}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md ${
              amountsMatch && !loading 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? <LoadingSpinner /> : 'Continue to Review'}
          </button>
        </div>
      </form>
    </div>
  );
}