// src/app/(protected)/request/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { FilterState } from "@/types";
import { USER_ROLES } from "@/constants";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Components
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import RequestsTable from "@/components/dashboard/requests-table";
import SearchFilters from "@/components/dashboard/search-filters";

export default function RequestPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    dateRange: "",
    amount: "",
    branch: "",
  });

  // Cast session role to UserRole safely
  const userRole = session?.user?.role as UserRole;
  const userEmail = session?.user?.email || "";

  // Data fetching
  const { requests, loading, error, refetch } = useDashboardData({
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading requests..." />
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
        <h1 className="text-2xl font-bold text-gray-900">Requests View</h1>
        <p className="text-gray-600">Manage and review approval requests</p>
      </div>

      {/* Search and Filters */}
      <SearchFilters
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onExport={() => {}} // Empty function - no export in this view
        userRole={userRole}
        exportLoading={false} // No export loading
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