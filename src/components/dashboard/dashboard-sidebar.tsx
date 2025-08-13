"use client"

import SignOutButton from "../common/sign-out-button"

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-30 sm:hidden">
      <div 
        className="absolute inset-0 bg-gray-600 opacity-75" 
        onClick={onClose}
        aria-label="Close sidebar"
      />
      <div className="relative flex flex-col w-64 h-full bg-white shadow-xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        </div>
        <nav className="flex-1 px-6 space-y-2" role="navigation">
          <a 
            href="#" 
            className="block px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-medium"
            aria-current="page"
          >
            Dashboard
          </a>
          <a 
            href="#" 
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            My Requests
          </a>
          <a 
            href="#" 
            className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Reports
          </a>
        </nav>
        <div className="p-6 border-t border-gray-200">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}