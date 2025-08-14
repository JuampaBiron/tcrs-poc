// src/components/dashboard/navigation-panel.tsx
"use client"

import { useState } from "react"
import { FileText, Settings, BarChart3 } from "lucide-react"
import { UserRole } from "@/types"
import { USER_ROLES } from "@/constants"

interface NavigationPanelProps {
  userRole: UserRole
  onViewChange?: (view: 'dashboard' | 'requests' | 'admin') => void
}

export default function NavigationPanel({ 
  userRole,
  onViewChange 
}: NavigationPanelProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'requests' | 'admin'>('dashboard')

  const handleViewChange = (view: 'dashboard' | 'requests' | 'admin') => {
    setActiveView(view)
    if (onViewChange) {
      onViewChange(view)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Dashboard Button */}
        <button
          onClick={() => handleViewChange('dashboard')}
          className={`flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none ${
            activeView === 'dashboard'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-6 h-6" />
          Dashboard
        </button>

        {/* Requests View Button */}
        <button
          onClick={() => handleViewChange('requests')}
          className={`flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none ${
            activeView === 'requests'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className="w-6 h-6" />
          Requests View
        </button>

        {/* Admin View Button - Only visible for Admin users */}
        {userRole === USER_ROLES.ADMIN && (
          <button
            onClick={() => handleViewChange('admin')}
            className={`flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none ${
              activeView === 'admin'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Settings className="w-6 h-6" />
            Admin View
          </button>
        )}
      </div>

      {/* Optional: View Status Indicator */}
      <div className="mt-4 text-sm text-gray-600">
        Current view: <span className="font-semibold capitalize">{activeView}</span>
        {userRole === USER_ROLES.ADMIN && (
          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
            Admin Access
          </span>
        )}
      </div>
    </div>
  )
}