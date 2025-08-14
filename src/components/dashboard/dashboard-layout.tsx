// src/components/dashboard/dashboard-layout.tsx - Fix hydration
"use client"

import { useState, useEffect } from "react"
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
  
  // CRITICAL: Evitar hydration error con estado de autorización
  const [isClient, setIsClient] = useState(false)
  const [authorizationState, setAuthorizationState] = useState<{
    isAuthorized: boolean;
    userRole: UserRole | null;
    userContext: any;
    error?: string;
  }>({
    isAuthorized: false,
    userRole: null,
    userContext: null
  })

  // Verificar autorización solo en el cliente
  useEffect(() => {
    setIsClient(true)
    
    try {
      console.log('🔍 CLIENT: Checking authorization...')
      const userContext = getUserContext(user)
      
      setAuthorizationState({
        isAuthorized: true,
        userRole: userContext.role,
        userContext: userContext
      })
      
      console.log('✅ CLIENT: Authorization successful, role:', userContext.role)
    } catch (error) {
      console.log('❌ CLIENT: Authorization failed:', error)
      setAuthorizationState({
        isAuthorized: false,
        userRole: null,
        userContext: null,
        error: error instanceof Error ? error.message : 'Authorization failed'
      })
    }
  }, [user])

  // Hook de datos (se ejecuta solo si autorizado)
  const { requests, stats, loading, error, refetch } = useDashboardData({
    userRole: authorizationState.userRole,
    userEmail: user.email || ''
  })

  // Durante hydratación, mostrar loading
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Si no autorizado, mostrar página de acceso denegado
  if (!authorizationState.isAuthorized) {
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
            <strong>Error:</strong> {authorizationState.error}<br/>
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
  const { role: userRole, permissions } = authorizationState.userContext;

  console.log('User in dashboard-layout role:', userRole)

  // Event handlers (mantener igual...)
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
        return
      }
      
      if (result.data) {
        downloadFile(result.data, generateExportFilename())
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleCreateRequest = () => {
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