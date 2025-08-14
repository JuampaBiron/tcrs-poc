"use client"

import { useState } from "react"
import { User } from "next-auth"
import { UserRole, FilterState } from "@/types"
import { getUserContext } from "@/lib/auth-utils"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { downloadFile, generateExportFilename, apiClient } from "@/lib/api-client"
import { signOut } from "next-auth/react"

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
  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({  
    status: "",
    dateRange: "",
    amount: "",
    branch: ""
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Verificar autorización y obtener rol (o null si no autorizado)
  let userRole: UserRole | null = null;
  let userContext;
  let isAuthorized = false;
  
  try {
    userContext = getUserContext(user);
    userRole = userContext.role;
    isAuthorized = true;
  } catch (error) {
    console.log('Authorization failed - user not in any TCRS group')
    // userRole permanece null, lo que evitará las llamadas API
  }

  // Hook SIEMPRE se ejecuta, pero con userRole=null no hará llamadas
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole, // null si no autorizado
    userEmail: user.email || ''
  })

  console.log('User role for API calls:', userRole)

  // Si no autorizado, mostrar página de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta aplicación. 
            Contacta al administrador para que te asigne a un grupo TCRS.
          </p>
          <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">
            <strong>Usuario:</strong> {user.email}<br/>
            <strong>Grupos necesarios:</strong> TCRS_Admin, TCRS_Approver, o TCRS_Requester
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Si llegamos aquí, el usuario está autorizado
  const { permissions } = userContext!;
  console.log('User in dashboard-layout role:', userRole)

  // Event handlers
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
      const result = await apiClient.exportData(userRole as UserRole, user.email, filters)
      
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  // Error state
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

  // Main dashboard render (solo para usuarios autorizados)
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={user}
        userRole={userRole as UserRole}
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
          userRole={userRole as UserRole}
          stats={stats}
        />

        <StatsCards userRole={userRole as UserRole} stats={stats} />

        <div className="mb-8">
          <CreateRequestButton 
            userRole={userRole as UserRole}
            onCreateRequest={handleCreateRequest}
          />
        </div>

        <SearchFilters 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          userRole={userRole as UserRole}
          exportLoading={exportLoading}
        />

        <RequestsTable 
          userRole={userRole as UserRole}
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