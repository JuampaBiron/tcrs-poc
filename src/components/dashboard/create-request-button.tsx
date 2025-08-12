"use client"

import { useState } from "react"
import { Plus, FileText, Upload, Send } from "lucide-react"
import { UserRole } from "@/types"
import { USER_ROLES } from "@/constants"

interface CreateRequestButtonProps {
  userRole?: UserRole
  onCreateRequest?: () => void
}

export default function CreateRequestButton({ 
  userRole = USER_ROLES.REQUESTER,
  onCreateRequest 
}: CreateRequestButtonProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)

  const handleCreateRequest = () => {
    if (onCreateRequest) {
      onCreateRequest()
    } else {
      // TODO: Navigate to create request form
      console.log('Navigate to create request form')
    }
  }

  const handleBulkUpload = () => {
    // TODO: Handle bulk upload functionality  
    console.log('Handle bulk upload')
  }

  const handleTemplateDownload = () => {
    // TODO: Download template file
    console.log('Download template')
  }

  // Only show create button for requesters and admins
  if (userRole === USER_ROLES.APPROVER) {
    return null
  }

  return (
    <div className="relative">
      {/* Main Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <button
          onClick={handleCreateRequest}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-none"
        >
          <Plus className="w-6 h-6" />
          Create New Request
        </button>

        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-6 rounded-xl transition-colors border-2 border-gray-200 hover:border-gray-300 w-full sm:w-auto"
          >
            <FileText className="w-5 h-5" />
            Quick Actions
            <svg 
              className={`w-4 h-4 transition-transform ${showQuickActions ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showQuickActions && (
            <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-64 mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 z-10">
              <div className="p-2">
                <button
                  onClick={handleBulkUpload}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Bulk Upload</div>
                    <div className="text-sm text-gray-500">Upload multiple requests via Excel</div>
                  </div>
                </button>
                
                <button
                  onClick={handleTemplateDownload}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Download Template</div>
                    <div className="text-sm text-gray-500">Get Excel template for bulk uploads</div>
                  </div>
                </button>

                <hr className="my-2 border-gray-200" />
                
                <button
                  onClick={() => console.log('View submitted requests')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">My Submitted Requests</div>
                    <div className="text-sm text-gray-500">View all your submitted requests</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-3 text-sm text-gray-600 text-center sm:text-left">
        <span className="flex items-center gap-1 justify-center sm:justify-start">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Ready to submit invoice approval requests
        </span>
      </div>

      {/* Click outside to close dropdown */}
      {showQuickActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </div>
  )
}