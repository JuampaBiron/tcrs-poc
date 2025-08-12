"use client"

import { useMemo } from "react"
import { Eye, CheckCircle, XCircle, User, Calendar, DollarSign } from "lucide-react"
import { Request, UserRole, FilterState } from "@/types"
import { apiClient } from "@/lib/api-client"
import { USER_ROLES, REQUEST_STATUS } from "@/constants"
import StatusBadge from "../ui/status-badge"

interface RequestsTableProps {
  userRole?: UserRole
  requests: Request[]
  searchQuery?: string
  filters?: FilterState
  onRefresh?: () => void
}

export default function RequestsTable({ 
  userRole = USER_ROLES.REQUESTER,
  requests = [],
  searchQuery = "",
  filters = { status: "", dateRange: "", amount: "", branch: "" },
  onRefresh
}: RequestsTableProps) {

  const handleViewRequest = (requestId: string) => {
    // TODO: Navigate to request detail view
    console.log('View request:', requestId)
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await apiClient.approveRequest(requestId)
      
      if (result.error) {
        console.error('Error approving request:', result.error)
        // TODO: Show error toast
        return
      }

      // Refresh data instead of page reload
      if (onRefresh) {
        onRefresh()
      }
      // TODO: Show success toast
    } catch (error) {
      console.error('Error approving request:', error)
      // TODO: Show error toast
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      const result = await apiClient.rejectRequest(requestId, reason)
      
      if (result.error) {
        console.error('Error rejecting request:', result.error)
        // TODO: Show error toast
        return
      }

      // Refresh data instead of page reload  
      if (onRefresh) {
        onRefresh()
      }
      // TODO: Show success toast
    } catch (error) {
      console.error('Error rejecting request:', error)
      // TODO: Show error toast
    }
  }

  // Filter requests based on search and filters
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchQuery === "" || 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.branch.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = !filters.status || request.status === filters.status
      const matchesBranch = !filters.branch || request.branch.toLowerCase().includes(filters.branch.toLowerCase())
      
      return matchesSearch && matchesStatus && matchesBranch
    })
  }, [requests, searchQuery, filters])

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {userRole === USER_ROLES.APPROVER ? 'Pending Requests' : userRole === USER_ROLES.ADMIN ? 'All Requests' : 'My Requests'}
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {userRole === USER_ROLES.REQUESTER ? 'Reviewer' : 'Requester'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {request.title}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {request.amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {request.amount}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {request.branch}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {userRole === USER_ROLES.REQUESTER ? request.reviewer : request.requester || request.reviewer}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {request.submittedOn}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewRequest(request.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    
                    {userRole === USER_ROLES.APPROVER && request.status === REQUEST_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {requests.length === 0 
                ? "No requests available. Create your first request to get started!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}