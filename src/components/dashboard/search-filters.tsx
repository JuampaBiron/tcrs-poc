// src/components/dashboard/search-filters.tsx
"use client";

import { Search, Download, X, Calendar } from "lucide-react";
import { FilterState, UserRole } from "@/types";
import { REQUEST_STATUS, FILTER_OPTIONS } from "@/constants";
import { useState } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  onExport: () => void;
  onClearFilters: () => void;
  userRole: UserRole;
  exportLoading: boolean;
  requestsCount?: number;
  totalRequestsCount?: number;
  currentFilters: FilterState;
  uniqueCompanies: DropdownOption[];
  uniqueBranches: DropdownOption[];
}

export default function SearchFilters({
  onSearch,
  onFilterChange,
  onExport,
  onClearFilters,
  userRole,
  exportLoading,
  requestsCount = 0,
  totalRequestsCount,
  currentFilters,
  uniqueCompanies,
  uniqueBranches
}: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    onSearch("");
    onClearFilters();
  };

  // Verificar si hay filtros aplicados
  const hasActiveFilters = searchTerm || 
    currentFilters.requestId ||
    currentFilters.company ||
    currentFilters.branch ||
    currentFilters.status || 
    currentFilters.submittedOnFrom ||
    currentFilters.submittedOnTo ||
    currentFilters.dateRange || 
    currentFilters.amount;

  // Contar filtros activos
  const activeFiltersCount = [
    currentFilters.requestId,
    currentFilters.company,
    currentFilters.branch,
    currentFilters.status,
    currentFilters.submittedOnFrom,
    currentFilters.submittedOnTo,
    currentFilters.dateRange, 
    currentFilters.amount
  ].filter(Boolean).length + (searchTerm ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">

      {/* Filter Options - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Request ID</label>
          <input
            type="text"
            placeholder="Enter request ID..."
            value={currentFilters.requestId}
            onChange={(e) => handleFilterChange("requestId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <select 
            value={currentFilters.company}
            onChange={(e) => handleFilterChange("company", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(company => (
              <option key={company.value} value={company.value}>
                {company.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <select 
            value={currentFilters.branch}
            onChange={(e) => handleFilterChange("branch", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(branch => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Options - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            value={currentFilters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {FILTER_OPTIONS.STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Submitted From</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={currentFilters.submittedOnFrom}
              onChange={(e) => handleFilterChange("submittedOnFrom", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Submitted To</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={currentFilters.submittedOnTo}
              onChange={(e) => handleFilterChange("submittedOnTo", e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Footer with results count and actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {hasActiveFilters && totalRequestsCount ? (
              <>Showing {requestsCount} of {totalRequestsCount} requests</>
            ) : (
              <>Showing {requestsCount} requests</>
            )}
          </div>
          {hasActiveFilters && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X size={16} />
              <span>Clear Filters</span>
            </button>
          )}
          <button 
            onClick={onExport}
            disabled={exportLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title={hasActiveFilters ? `Export ${requestsCount} filtered requests` : `Export all ${requestsCount} requests`}
          >
            <Download size={16} />
            <span>
              {exportLoading 
                ? "Exporting..." 
                : hasActiveFilters 
                  ? `Export Filtered (${requestsCount})` 
                  : "Export All"
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}