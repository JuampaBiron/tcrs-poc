"use client"

import { useState, useEffect } from "react"
import { User } from "next-auth"
import StatsCards from "./stats-cards"
import SearchFilters, { FilterState } from "./search-filters"  
import RequestsTable from "./requests-table"
import CreateRequestButton from "./create-request-button"
import FinningLogo from "../login-page/finning-logo"
import SignOutButton from "../login-page/sign-out-button"
import { Settings, Bell, HelpCircle, Menu, X } from "lucide-react"
import { getUserRole, getRoleDisplayName } from "@/lib/auth-utils"

interface DashboardLayoutProps {
  user: User
}

type UserRole = 'requester' | 'approver' | 'admin'



export default function DashboardLayout({ user }: DashboardLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({  
    status: "",
    dateRange: "",
    amount: "",
    branch: ""
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  // Get user role from email
  const userRole = getUserRole(user)

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [userRole, user.email])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch requests based on user role
      const requestsResponse = await fetch(`/api/requests?role=${userRole}&email=${user.email}`)
      const requestsData = await requestsResponse.json()
      
      // Fetch stats based on user role  
      const statsResponse = await fetch(`/api/stats?role=${userRole}&email=${user.email}`)
      const statsData = await statsResponse.json()
      
      setRequests(requestsData.requests || [])
      setStats(statsData.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to empty data
      setRequests([])
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (newFilters: FilterState) => { 
    setFilters(newFilters)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userRole, email: user.email, filters })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tcrs-requests-${new Date().toISOString().split('T')[0]}.xlsx`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleCreateRequest = () => {
    // TODO: Navigate to create request form
    console.log('Navigate to create request form')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <FinningLogo />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">TCRS Approval System</h1>
                <p className="text-sm text-gray-600">Invoice Approval Dashboard</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <HelpCircle className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-6 h-6" />
              </button>
              
              {/* User info */}
              <div className="flex items-center gap-3 pl-4 border-l-2 border-gray-200">
                {user.image && (
                  <img 
                    src={user.image} 
                    alt={user.name || "User"} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 h-full bg-white shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            </div>
            <nav className="flex-1 px-6 space-y-2">
              <a href="#" className="block px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-medium">
                Dashboard
              </a>
              <a href="#" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                My Requests
              </a>
              <a href="#" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                Reports
              </a>
            </nav>
            <div className="p-6 border-t border-gray-200">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-6 text-black">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-black/80">
              {userRole === 'approver' 
                ? `You have ${stats.pending} pending requests waiting for your review.`
                : userRole === 'admin'
                ? `System overview: ${stats.total} total requests this period.`
                : `You have ${stats.pending} requests pending approval.`
              }
            </p>
          </div>
        </div>

        {/* Stats Cards - Real Data */}
        <StatsCards userRole={userRole} stats={stats} />

        {/* Create Request Button */}
        <div className="mb-8">
          <CreateRequestButton 
            userRole={userRole}
            onCreateRequest={handleCreateRequest}
          />
        </div>

        {/* Search and Filters */}
        <SearchFilters 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          userRole={userRole}
        />

        {/* Requests Table - Real Data */}
        <RequestsTable 
          userRole={userRole}
          requests={requests}
          searchQuery={searchQuery}
          filters={filters}
        />

        {/* Footer */}
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