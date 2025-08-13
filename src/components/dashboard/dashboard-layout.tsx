"use client"

import { useState } from "react"
import { User } from "next-auth"
import { UserRole, FilterState } from "@/types"
import { getUserRole } from "@/lib/auth-utils"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { downloadFile, generateExportFilename, apiClient } from "@/lib/api-client"

// Components
import StatsCards from "./stats-cards"
import SearchFilters from "./search-filters"  
import RequestsTable from "./requests-table"
import CreateRequestButton from "./create-request-button"
import DashboardHeader from "./dashboard-header"
import DashboardSidebar from "./dashboard-sidebar"
import WelcomeSection from "./welcome-section"
import FinningLogo from "../ui/finning-logo"
import SignOutButton from "../ui/sign-out-button"
import LoadingSpinner from "../ui/loading-spinner"
import ErrorMessage from "../ui/error-message"

interface DashboardLayoutProps {
  user: User
}

export default function DashboardLayout({ user }: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({  
    status: "",
    dateRange: "",
    amount: "",
    branch: ""
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Get user role from email
  const userRole = getUserRole(user)
  console.log('User in dashboard-layout role:', userRole)

  // Use custom hook for data fetching
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole,
    userEmail: user.email || ''
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (newFilters: FilterState) => { 
    setFilters(newFilters)
  }

  const handleExport = async () => {
    if (!user.email) return
    
    try {
      setExportLoading(true)
      const result = await apiClient.exportData(userRole, user.email, filters)
      
      if (result.error) {
        console.error('Export failed:', result.error)
        // TODO: Show toast notification
        return
      }
      
      if (result.data) {
        downloadFile(result.data, generateExportFilename())
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error toast
    } finally {
      setExportLoading(false)
    }
  }

  const handleCreateRequest = () => {
    // TODO: Navigate to create request form
    console.log('Navigate to create request form')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage 
            message={error}
            onRetry={refetch}
          />
        </div>
      </div>
    )
  }

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
          stats={stats}
        />

        <StatsCards userRole={userRole} stats={stats} />

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
                <p className="text-xs text-gray-500">Powered by Sisua Digital</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <SignOutButton />
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}