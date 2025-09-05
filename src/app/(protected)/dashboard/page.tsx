// src/app/(protected)/dashboard/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { RefreshCcw } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  apiClient,
  downloadFile,
  generateExportFilename,
} from "@/lib/api-client";
import { FilterState, Stats } from "@/types";
import { USER_ROLES, REQUEST_STATUS } from "@/constants";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Components
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import RequestsTable from "@/components/dashboard/requests-table";
import SearchFilters from "@/components/dashboard/search-filters";
import StatsCards from "@/components/dashboard/stats-cards";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    requestId: "",
    company: "",
    branch: "",
    status: REQUEST_STATUS.PENDING,
    submittedOnFrom: "",
    submittedOnTo: "",
    // Legacy fields (keeping for compatibility)
    dateRange: "",
    amount: "",
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cast session role to UserRole safely
  const userRole = session?.user?.role as UserRole;
  const userEmail = session?.user?.email || "";

  // Data fetching
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole: userRole || null,
    userEmail: userEmail,
  });

  // Extract unique values for dropdown filters
  const uniqueCompanies = useMemo(() => {
    if (!requests) return [];
    const companies = [...new Set(
      requests
        .map(r => r.company)
        .filter((company): company is string => Boolean(company))
    )];
    return companies.map(company => ({ value: company, label: company }));
  }, [requests]);

  const uniqueBranches = useMemo(() => {
    if (!requests) return [];
    const branches = [...new Set(
      requests
        .map(r => r.branch)
        .filter((branch): branch is string => Boolean(branch))
    )];
    return branches.map(branch => ({ value: branch, label: branch }));
  }, [requests]);

  // Filtered requests calculation
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      // Search query filter
      const matchesSearch = searchQuery ? 
        (request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (request.requester?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
         (request.requestId?.toLowerCase() || '').includes(searchQuery.toLowerCase())) : true;
      
      // Request ID filter
      const matchesRequestId = filters.requestId ? 
        (request.requestId?.toLowerCase() || '').includes(filters.requestId.toLowerCase()) : true;
      
      // Company filter
      const matchesCompany = filters.company ? request.company === filters.company : true;
      
      // Branch filter
      const matchesBranch = filters.branch ? request.branch === filters.branch : true;
      
      // Status filter
      const matchesStatus = filters.status ? request.status === filters.status : true;
      
      // Date range filter (submitted on)
      const matchesDateRange = (() => {
        if (!filters.submittedOnFrom && !filters.submittedOnTo) return true;
        
        const requestDate = new Date(request.createdDate || request.submittedOn);
        const fromDate = filters.submittedOnFrom ? new Date(filters.submittedOnFrom) : null;
        const toDate = filters.submittedOnTo ? new Date(filters.submittedOnTo + 'T23:59:59') : null;
        
        if (fromDate && requestDate < fromDate) return false;
        if (toDate && requestDate > toDate) return false;
        
        return true;
      })();
      
      // Legacy amount filter (keeping for compatibility)
      const matchesAmount = filters.amount ? (() => {
        const amountMatch = request.title?.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i) || 
                           request.amount?.match(/\$?([0-9,]+(?:\.[0-9]{2})?)/i);
        const amount = amountMatch ? 
          parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        
        switch (filters.amount) {
          case 'under1000': return amount < 1000;
          case '1000to5000': return amount >= 1000 && amount <= 5000;
          case 'over5000': return amount > 5000;
          default: return true;
        }
      })() : true;
      
      return matchesSearch && matchesRequestId && matchesCompany && 
             matchesBranch && matchesStatus && matchesDateRange && matchesAmount;
    });
  }, [requests, searchQuery, filters]);

  // Event handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      requestId: "",
      company: "",
      branch: "",
      status: REQUEST_STATUS.PENDING, // Reset to default pending status
      submittedOnFrom: "",
      submittedOnTo: "",
      // Legacy fields (keeping for compatibility)
      dateRange: "",
      amount: "",
    });
    setSearchQuery("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing dashboard data...');
      await refetch();
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!userEmail || !userRole) return;
    
    setExportLoading(true);
    try {
      const exportFilters = {
        ...filters,
        searchQuery: searchQuery
      };
      
      const result = await apiClient.exportData(userRole, userEmail, exportFilters);

      if (result.error) {
        console.error("Export failed:", result.error);
        return;
      }

      if (result.data) {
        downloadFile(result.data, generateExportFilename());
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!session?.user || !userRole) {
    return (
      <div className="p-6">
        <ErrorMessage message="Authentication required" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Overview of approval requests in the system
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard data"
          >
            <RefreshCcw 
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Dashboard Metrics - Show for all roles */}
      <StatsCards userRole={userRole} stats={stats as Stats} />

      {/* Same View for All Roles */}
      <>
        {/* Search and Filters - For all roles */}
        <SearchFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
          userRole={userRole}
          exportLoading={exportLoading}
          requestsCount={filteredRequests?.length || 0}
          totalRequestsCount={requests?.length || 0}
          currentFilters={filters}
          uniqueCompanies={uniqueCompanies}
          uniqueBranches={uniqueBranches}
        />

        {/* Requests Table - For all roles */}
        <RequestsTable 
          requests={filteredRequests || []}
          userRole={userRole}
          searchQuery={searchQuery}
          filters={filters}
          onRefresh={refetch}
        />
      </>
    </div>
  );
}