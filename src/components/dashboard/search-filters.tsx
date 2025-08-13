"use client"

import { useState } from "react"
import { Search, Filter, Download, X } from "lucide-react"

import { UserRole, FilterState } from "@/types"
import { FILTER_OPTIONS, USER_ROLES } from "@/constants"

interface SearchFiltersProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: FilterState) => void
  onExport: () => void
  userRole?: UserRole
  exportLoading?: boolean
}

export default function SearchFilters({ 
  onSearch, 
  onFilterChange, 
  onExport,
  userRole = USER_ROLES.REQUESTER,
  exportLoading = false
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    dateRange: "",
    amount: "",
    branch: ""
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = { status: "", dateRange: "", amount: "", branch: "" }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== "").length

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-yellow-400 border-yellow-400 text-black' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-black text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <button
            onClick={onExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Download className={`w-5 h-5 ${exportLoading ? 'animate-spin' : ''}`} />
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t-2 border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Filter Options</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All Status</option>
                {FILTER_OPTIONS.STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All Dates</option>
                {FILTER_OPTIONS.DATE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </label>
              <select
                value={filters.amount}
                onChange={(e) => handleFilterChange('amount', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All Amounts</option>
                {FILTER_OPTIONS.AMOUNTS.map((amount) => (
                  <option key={amount.value} value={amount.value}>
                    {amount.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-yellow-400 focus:outline-none"
              >
                <option value="">All Branches</option>
                {FILTER_OPTIONS.BRANCHES.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}