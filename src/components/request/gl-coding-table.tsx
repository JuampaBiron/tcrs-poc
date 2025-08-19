// src/components/request/gl-coding-table.tsx
"use client";

import { useState } from "react";

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

interface GLCodingTableProps {
  entries: GLCodingEntry[];
  onEntriesChange: (entries: GLCodingEntry[]) => void;
  dictionaries: Dictionaries;
  onError: (error: string | null) => void;
}

export default function GLCodingTable({ 
  entries, 
  onEntriesChange, 
  dictionaries, 
  onError 
}: GLCodingTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchFilters, setSearchFilters] = useState({
    account: '',
    facility: '',
    taxCode: ''
  });

  const updateEntry = (index: number, field: keyof GLCodingEntry, value: any) => {
    const newEntries = entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    );
    onEntriesChange(newEntries);
    onError(null);
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === entries.length && entries.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(entries.map((_, i) => i)));
    }
  };

  // Filter dictionaries based on search
  const filteredAccounts = dictionaries.accounts;
  const filteredFacilities = dictionaries.facilities;
  const filteredTaxCodes = dictionaries.taxCodes;

  // Export selected rows for parent component
  const getSelectedRows = () => Array.from(selectedRows);

  return (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {/* Select All Checkbox */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              <input
                type="checkbox"
                checked={selectedRows.size === entries.length && entries.length > 0}
                onChange={toggleSelectAll}
                className="rounded"
              />
            </th>
            
            {/* Row Number */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              #
            </th>
            
            {/* Account with Search */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Account *
              
            </th>
            
            {/* Facility with Search */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Facility *
              
            </th>
            
            {/* Tax Code with Search */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Tax Code
              
            </th>
            
            {/* Amount */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Amount *
            </th>
            
            {/* Equipment */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Equipment #
            </th>
            
            {/* Comments */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Comments
            </th>
          </tr>
        </thead>
        
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr 
              key={index} 
              className={`hover:bg-gray-50 ${selectedRows.has(index) ? 'bg-blue-50' : ''}`}
            >
              {/* Row Checkbox */}
              <td className="px-3 py-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedRows.has(index)}
                  onChange={() => toggleRowSelection(index)}
                  className="rounded"
                />
              </td>
              
              {/* Row Number */}
              <td className="px-3 py-2 text-sm text-gray-900 border-b font-medium">
                {index + 1}
              </td>
              
              {/* Account Dropdown */}
              <td className="px-3 py-2 border-b">
                <select
                  value={entry.accountCode}
                  onChange={(e) => updateEntry(index, 'accountCode', e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    !entry.accountCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Account</option>
                  {filteredAccounts.map((account) => (
                    <option key={account.accountCode} value={account.accountCode}>
                      {account.accountCombined}
                    </option>
                  ))}
                </select>
              </td>
              
              {/* Facility Dropdown */}
              <td className="px-3 py-2 border-b">
                <select
                  value={entry.facilityCode}
                  onChange={(e) => updateEntry(index, 'facilityCode', e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    !entry.facilityCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Facility</option>
                  {filteredFacilities.map((facility) => (
                    <option key={facility.facilityCode} value={facility.facilityCode}>
                      {facility.facilityCombined}
                    </option>
                  ))}
                </select>
              </td>
              
              {/* Tax Code Dropdown */}
              <td className="px-3 py-2 border-b">
                <select
                  value={entry.taxCode}
                  onChange={(e) => updateEntry(index, 'taxCode', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Tax</option>
                  {filteredTaxCodes.map((tax) => (
                    <option key={tax.code} value={tax.code}>
                      {tax.code}
                    </option>
                  ))}
                </select>
              </td>
              
              {/* Amount Input */}
              <td className="px-3 py-2 border-b">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={entry.amount || ''}
                  onChange={(e) => updateEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                  className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    !entry.amount || entry.amount <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
              </td>
              
              {/* Equipment Input */}
              <td className="px-3 py-2 border-b">
                <input
                  type="text"
                  value={entry.equipment}
                  onChange={(e) => updateEntry(index, 'equipment', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Equipment #"
                />
              </td>
              
              {/* Comments Input */}
              <td className="px-3 py-2 border-b">
                <input
                  type="text"
                  value={entry.comments}
                  onChange={(e) => updateEntry(index, 'comments', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Comments"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Row Selection Info */}
      {selectedRows.size > 0 && (
        <div className="mt-2 text-sm text-blue-600">
          {selectedRows.size} row(s) selected
        </div>
      )}
      
      {/* Export Selected Rows Data for Parent Component */}
      <div style={{ display: 'none' }}>
        {JSON.stringify({ selectedRows: getSelectedRows() })}
      </div>
    </div>
  );
}