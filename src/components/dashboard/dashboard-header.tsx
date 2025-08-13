"use client"

import { User } from "next-auth"
import { Bell, HelpCircle, Menu, Settings, X } from "lucide-react"
import FinningLogo from "../ui/finning-logo"
import { getRoleDisplayName } from "@/lib/auth-utils"
import { UserRole } from "@/types"

interface DashboardHeaderProps {
  user: User
  userRole: UserRole
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function DashboardHeader({
  user,
  userRole,
  sidebarOpen,
  setSidebarOpen
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
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
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Help"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Settings"
            >
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
  )
}