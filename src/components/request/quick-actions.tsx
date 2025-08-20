// src/components/request/quick-actions.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

interface GLCodingEntry {
  id?: string;
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
  selectedRows: Set<number>;
  onSelectedRowsChange: (selected: Set<number>) => void;
}

export default function QuickActions({ 
  entries, 
  onEntriesChange, 
  remainingAmount, 
  onError,
  selectedRows,
  onSelectedRowsChange
}: QuickActionsProps) {
  
  const addEntry = useCallback(() => {
    const newEntry: GLCodingEntry = {
      id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountCode: '',
      facilityCode: '',
      taxCode: '',
      amount: remainingAmount > 0 ? remainingAmount : 0,
      equipment: '',
      comments: ''
    };
    
    onEntriesChange([...entries, newEntry]);
    onError(null);
  }, [entries, onEntriesChange, remainingAmount, onError]);

  const removeSelectedEntries = useCallback(() => {
    if (selectedRows.size === 0) {
      onError('No rows selected');
      return;
    }

    if (entries.length - selectedRows.size < 1) {
      onError('Cannot delete all entries. At least one entry is required.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedRows.size} selected row(s)?`);
    
    if (confirmed) {
      // Ordenar índices de mayor a menor para eliminar correctamente
      const sortedIndices = Array.from(selectedRows).sort((a, b) => b - a);
      const updatedEntries = [...entries];
      
      sortedIndices.forEach(index => {
        updatedEntries.splice(index, 1);
      });
      
      onEntriesChange(updatedEntries);
      onSelectedRowsChange(new Set()); // Limpiar selección
      onError(null);
    }
  }, [entries, selectedRows, onEntriesChange, onSelectedRowsChange, onError]);

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
          disabled={entries.length <= 1 || selectedRows.size === 0}
          className="flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete Selected ({selectedRows.size})
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