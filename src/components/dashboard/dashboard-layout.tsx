// src/components/dashboard/dashboard-layout.tsx
"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  apiClient,
  downloadFile,
  generateExportFilename,
} from "@/lib/api-client";
import { FilterState, Stats, UserRole } from "@/types";
import { USER_ROLES } from "@/constants";
import { User } from "next-auth";
import { useState, useMemo } from "react";

// Components
import ErrorMessage from "../ui/error-message";
import LoadingSpinner from "../ui/loading-spinner";
import NewSidebar from "./dashboard-sidebar";
import RequestsTable from "./requests-table";
import SearchFilters from "./search-filters";
import StatsCards from "./stats-cards";

interface DashboardLayoutProps {
  user: User & { role: UserRole };
}

export default function DashboardLayout({ user }: DashboardLayoutProps) {
  // State management
  const [activeView, setActiveView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    dateRange: "",
    amount: "",
    branch: "",
  });
  const [exportLoading, setExportLoading] = useState(false);

  const userRole = user.role;

  // Data fetching
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole: userRole,
    userEmail: user.email || "",
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
    if (!user.email) return;
    
    setExportLoading(true);
    try {
      const exportFilters = {
        ...filters,
        searchQuery: searchQuery
      };
      
      const result = await apiClient.exportData(userRole, user.email, exportFilters);

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

  const handleCreateRequest = () => {
    console.log("Navigate to create request form");
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* New Sidebar */}
      <NewSidebar 
        user={user}
        userRole={userRole}
        activeView={activeView}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Panel */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-80'
      }`}>
        <div className="p-6">
          {activeView === "dashboard" && (
            <>
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
            </>
          )}

          {activeView === "requests" && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Requests View</h3>
              <p className="text-gray-600">This page will be implemented with separate routing based on user roles.</p>
            </div>
          )}

          {activeView === "admin" && userRole === USER_ROLES.ADMIN && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin View</h3>
              <p className="text-gray-600">Administrative panel will be implemented with separate routing based on user roles.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}