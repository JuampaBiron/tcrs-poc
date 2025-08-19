// src/components/request/quick-actions.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

interface QuickActionsProps {
  entries: GLCodingEntry[];
  onEntriesChange: (entries: GLCodingEntry[]) => void;
  remainingAmount: number;
  onError: (error: string | null) => void;
}

export default function QuickActions({ 
  entries, 
  onEntriesChange, 
  remainingAmount, 
  onError 
}: QuickActionsProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const addEntry = () => {
    const newEntry: GLCodingEntry = {
      accountCode: '',
      facilityCode: '',
      taxCode: '',
      amount: remainingAmount > 0 ? remainingAmount : 0,
      equipment: '',
      comments: ''
    };
    
    onEntriesChange([...entries, newEntry]);
    onError(null);
  };

  const removeSelectedEntries = () => {
    // Get selected rows from DOM (simplified approach)
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const selectedIndices: number[] = [];
    
    checkboxes.forEach((checkbox, index) => {
      // Skip the "select all" checkbox (first one)
      if (index > 0) {
        selectedIndices.push(index - 1);
      }
    });

    if (selectedIndices.length === 0) {
      onError('No rows selected');
      return;
    }

    if (entries.length - selectedIndices.length < 1) {
      onError('Cannot delete all entries. At least one entry is required.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIndices.length} selected row(s)?`);
    
    if (confirmed) {
      const updatedEntries = entries.filter((_, index) => !selectedIndices.includes(index));
      onEntriesChange(updatedEntries);
      onError(null);
      
      // Clear all checkboxes
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach(checkbox => {
        (checkbox as HTMLInputElement).checked = false;
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* Primary Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={addEntry}
          className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Entry
        </button>

        <button
          onClick={removeSelectedEntries}
          disabled={entries.length <= 1}
          className="flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete Selected
        </button>
      </div>

      {/* Info Display */}
      <div className="ml-auto flex items-center text-xs text-gray-600 bg-white px-2 py-1 rounded border">
        <span className="font-medium">{entries.length}</span>
        <span className="ml-1">
          {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        {remainingAmount > 0 && (
          <span className="ml-2 text-orange-600">
            Remaining: ${remainingAmount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}