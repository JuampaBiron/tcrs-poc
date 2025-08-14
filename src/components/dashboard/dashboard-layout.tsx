// src\components\dashboard\dashboard-layout.tsx
"use client";
 
import { useDashboardData } from "@/hooks/use-dashboard-data";
import {
  apiClient,
  downloadFile,
  generateExportFilename,
} from "@/lib/api-client";
import { FilterState, Stats, UserRole } from "@/types";
import { User } from "next-auth";
import { useState } from "react";
 
// Components
import ErrorMessage from "../ui/error-message";
import FinningLogo from "../ui/finning-logo";
import LoadingSpinner from "../ui/loading-spinner";
import SignOutButton from "../ui/sign-out-button";
import CreateRequestButton from "./create-request-button";
import DashboardHeader from "./dashboard-header";
import DashboardSidebar from "./dashboard-sidebar";
import RequestsTable from "./requests-table";
import SearchFilters from "./search-filters";
import StatsCards from "./stats-cards";
import WelcomeSection from "./welcome-section";
 
// The user object from the session now includes the role.
// We must update our types to reflect this.
interface DashboardLayoutProps {
  user: User & { role: UserRole };
}
 
export default function DashboardLayout({ user }: DashboardLayoutProps) {
  // State management for UI, not for auth
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    dateRange: "",
    amount: "",
    branch: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
 
  // Get user role directly from the prop! No more hooks or state.
  const userRole = user.role;
 
  // Hook de datos uses the role directly.
  // It won't run until the role is available, which is immediately.
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole: userRole,
    userEmail: user.email || "",
  });
 
  // No more `isClient` or `authorizationState` checks are needed here.
  // The parent server component has already handled it.
 
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
 
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
 
  const handleExport = async () => {
    if (!user.email) return;
 
    try {
      setExportLoading(true);
      const result = await apiClient.exportData(userRole, user.email, filters);
 
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
      <DashboardHeader
        user={user}
        userRole={userRole}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
 
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
 
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSection
          user={user}
          userRole={userRole}
          stats={stats as Stats}
        />
 
        <StatsCards userRole={userRole} stats={stats as Stats} />
 
        <div className="mb-8">
          <CreateRequestButton
            userRole={userRole}
            onCreateRequest={handleCreateRequest}
          />
        </div>
 
        <SearchFilters
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          userRole={userRole}
          exportLoading={exportLoading}
        />
 
        <RequestsTable
          userRole={userRole}
          requests={requests}
          searchQuery={searchQuery}
          filters={filters}
          onRefresh={refetch}
        />
 
        <footer className="mt-12 pt-8 border-t-2 border-gray-200 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <FinningLogo />
              <div className="text-left">
                <p className="text-sm text-gray-600">TCRS Approval System</p>
                <p className="text-xs text-gray-500">
                  Powered by Sisua Digital
                </p>
              </div>
            </div>
 
            <div className="flex gap-4">
              <SignOutButton />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}