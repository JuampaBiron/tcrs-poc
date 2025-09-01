// src/app/(protected)/dashboard/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  apiClient,
  downloadFile,
  generateExportFilename,
} from "@/lib/api-client";
import { FilterState, Stats } from "@/types";
import { USER_ROLES } from "@/constants";

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
    status: "",
    dateRange: "",
    amount: "",
    branch: "",
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Cast session role to UserRole safely
  const userRole = session?.user?.role as UserRole;
  const userEmail = session?.user?.email || "";

  // Data fetching
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole: userRole || null,
    userEmail: userEmail,
  });

  // Filtered requests calculation
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      const matchesSearch = searchQuery ? 
        (request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (request.requester?.toLowerCase() || '').includes(searchQuery.toLowerCase())) : true;
      
      const matchesStatus = filters.status ? request.status === filters.status : true;
      const matchesBranch = filters.branch ? request.branch === filters.branch : true;
      
      const matchesAmount = filters.amount ? (() => {
        const amountMatch = request.title.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i);
        const amount = amountMatch ? 
          parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        
        switch (filters.amount) {
          case 'under1000': return amount < 1000;
          case '1000to5000': return amount >= 1000 && amount <= 5000;
          case 'over5000': return amount > 5000;
          default: return true;
        }
      })() : true;
      
      return matchesSearch && matchesStatus && matchesBranch && matchesAmount;
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
      status: "",
      dateRange: "",
      amount: "",
      branch: "",
    });
    setSearchQuery("");
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your approval requests</p>
      </div>

      {/* Dashboard Metrics */}
      <StatsCards userRole={userRole} stats={stats as Stats} />

      {/* Search and Filters */}
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
      />

      {/* Requests Table */}
      <RequestsTable 
        requests={filteredRequests || []}
        userRole={userRole}
        searchQuery={searchQuery}
        filters={filters}
        onRefresh={refetch}
      />
    </div>
  );
}