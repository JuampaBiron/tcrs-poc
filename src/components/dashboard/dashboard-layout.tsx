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
import DashboardHeader from "./dashboard-header";
import DashboardSidebar from "./dashboard-sidebar";
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

  // ✅ CALCULAR REQUESTS FILTRADOS para mostrar el número correcto
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      const matchesSearch = searchQuery ? 
        (request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (request.requester?.toLowerCase() || '').includes(searchQuery.toLowerCase())) : true;
      
      const matchesStatus = filters.status ? request.status === filters.status : true;
      const matchesBranch = filters.branch ? request.branch === filters.branch : true;
      
      // Para amount, necesitamos extraer el monto del título (como en el backend)
      const matchesAmount = filters.amount ? (() => {
        const amountMatch = request.title.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        
        switch (filters.amount) {
          case 'under1000':
            return amount < 1000;
          case '1000to5000':
            return amount >= 1000 && amount <= 5000;
          case 'over5000':
            return amount > 5000;
          default:
            return true;
        }
      })() : true;
      
      return matchesSearch && matchesStatus && matchesBranch && matchesAmount;
    });
  }, [requests, searchQuery, filters]);

  // Handlers
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

    try {
      setExportLoading(true);
      
      // Crear objeto de filtros extendido que incluye la búsqueda
      const exportFilters = {
        ...filters,
        searchQuery: searchQuery
      };
      
      // Nota: Necesitarás actualizar la función apiClient.exportData 
      // para aceptar searchQuery como parte de los filtros
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader user={user} userRole={userRole} />

      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          activeView={activeView}
          onViewChange={handleViewChange}
          userRole={userRole}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeView === "dashboard" && (
            <>
              {/* Dashboard Metrics */}
              <StatsCards userRole={userRole} stats={stats as Stats} />

              {/* Search and Filters */}
              <SearchFilters
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onExport={handleExport}
                onClearFilters={handleClearFilters}
                userRole={userRole}
                exportLoading={exportLoading}
                requestsCount={filteredRequests.length}
                totalRequestsCount={requests?.length || 0}
                currentFilters={filters}
              />

              {/* Requests Table */}
              <RequestsTable
                userRole={userRole}
                requests={filteredRequests}
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
              <p className="text-gray-600">Esta vista se implementará próximamente.</p>
            </div>
          )}

          {activeView === "admin" && userRole === USER_ROLES.ADMIN && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin View</h3>
              <p className="text-gray-600">Panel de administración disponible próximamente.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}