// src/components/dashboard/search-filters.tsx
"use client";

import { Search, Download, X } from "lucide-react";
import { FilterState, UserRole } from "@/types";
import { REQUEST_STATUS } from "@/constants";
import { useState } from "react";

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
  currentFilters
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
    currentFilters.status || 
    currentFilters.dateRange || 
    currentFilters.amount || 
    currentFilters.branch;

  // Contar filtros activos
  const activeFiltersCount = [
    currentFilters.status,
    currentFilters.dateRange, 
    currentFilters.amount,
    currentFilters.branch
  ].filter(Boolean).length + (searchTerm ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select 
            value={currentFilters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value={REQUEST_STATUS.APPROVED}>Approved</option>
            <option value={REQUEST_STATUS.PENDING}>Pending</option>
            <option value={REQUEST_STATUS.IN_REVIEW}>In Review</option>
            <option value={REQUEST_STATUS.REJECTED}>Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select 
            value={currentFilters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Dates</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last90days">Last 90 days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
          <select 
            value={currentFilters.amount}
            onChange={(e) => handleFilterChange("amount", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Amounts</option>
            <option value="under1000">Under $1,000</option>
            <option value="1000to5000">$1,000 - $5,000</option>
            <option value="over5000">Over $5,000</option>
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
            <option value="branch1">Branch 1</option>
            <option value="branch2">Branch 2</option>
            <option value="sitech">Sitech</option>
          </select>
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