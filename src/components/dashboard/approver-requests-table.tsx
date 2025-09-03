'use client'

import { useState } from 'react'
import { User } from 'next-auth'
import { Request, UserRole } from '@/types'
import { USER_ROLES, REQUEST_STATUS, FILTER_OPTIONS } from '@/constants'
import { useApproverRequests, useGLCodingByRequestId } from '@/hooks/use-dashboard-data'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ErrorMessage from '@/components/ui/error-message'
import StatusBadge from '@/components/ui/status-badge'

interface ApproverRequestsTableProps {
  user: User
  userRole: UserRole
}

interface ApproverRequestDetailsModalProps {
  request: Request | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (requestId?: string) => void
  onReject?: (requestId?: string) => void
}

function ApproverRequestDetailsModal({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: ApproverRequestDetailsModalProps) {
  if (!isOpen || !request) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Request Information</h3>
            
            <div>
              <label className="font-medium text-gray-700">Request ID:</label>
              <p className="text-gray-900">{request.requestId}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Requester:</label>
              <p className="text-gray-900">{request.requester}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Status:</label>
              <div className="mt-1">
                <StatusBadge status={request.status} />
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">Submitted On:</label>
              <p className="text-gray-900">{new Date(request.submittedOn).toLocaleDateString()}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Assigned Approver:</label>
              <p className="text-gray-900">{request.assignedApprover || request.reviewer || 'Unassigned'}</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Invoice Information</h3>
            
            <div>
              <label className="font-medium text-gray-700">Vendor:</label>
              <p className="text-gray-900">{request.vendor || 'N/A'}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Amount:</label>
              <p className="text-gray-900 text-lg font-semibold">
                {request.currency} {request.amount}
              </p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Company:</label>
              <p className="text-gray-900">{request.company || 'N/A'}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">Branch:</label>
              <p className="text-gray-900">{request.branch || 'N/A'}</p>
            </div>

            <div>
              <label className="font-medium text-gray-700">PO Number:</label>
              <p className="text-gray-900">{request.po || 'N/A'}</p>
            </div>

            {(request as any).tcrsCompany !== undefined && (
              <div>
                <label className="font-medium text-gray-700">TCRS Company:</label>
                <p className="text-gray-900">{(request as any).tcrsCompany ? 'Yes' : 'No'}</p>
              </div>
            )}

            {(request as any).blobUrl && (
              <div>
                <label className="font-medium text-gray-700">Document:</label>
                <a 
                  href={(request as any).blobUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Invoice Document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* GL Coding Data Section */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg border-b pb-2 mb-4">GL Coding Information</h3>
          <GLCodingSection requestId={request.requestId} />
        </div>

        {/* Action Buttons */}
        {request.status === REQUEST_STATUS.PENDING && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={() => onReject && onReject(request.requestId)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove && onApprove(request.requestId)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Separate component for GL Coding data
function GLCodingSection({ requestId }: { requestId?: string }) {
  // This will use the existing useGLCodingByRequestId hook
  const { data: glCodingData, isLoading, error } = useGLCodingByRequestId(requestId || null)

  if (isLoading) return <LoadingSpinner size="sm" text="Loading GL coding data..." />
  if (error) return <ErrorMessage message={error} />
  
  if (!glCodingData || glCodingData.length === 0) {
    return <p className="text-gray-500 italic">No GL coding data available</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GL Code</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {glCodingData.map((entry: any, index: number) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-sm text-gray-900">{entry.company || 'N/A'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{entry.branch || 'N/A'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{entry.department || 'N/A'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{entry.glCode || 'N/A'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{entry.amount || 'N/A'}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{entry.description || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ApproverRequestsTable({ user, userRole }: ApproverRequestsTableProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const userEmail = user.email!
  const { data: requests, isLoading, error, refetch } = useApproverRequests(userEmail)

  // Filter requests based on status
  const filteredRequests = requests?.filter(request => {
    if (statusFilter === 'all') return true
    return request.status === statusFilter
  }) || []

  const handleRowClick = (request: Request) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
  }

  const handleApprove = async (requestId?: string) => {
    if (!requestId) return
    // TODO: Implement approve functionality
    console.log('Approving request:', requestId)
    // After successful approval, refetch data
    // refetch()
    handleCloseModal()
  }

  const handleReject = async (requestId?: string) => {
    if (!requestId) return
    // TODO: Implement reject functionality
    console.log('Rejecting request:', requestId)
    // After successful rejection, refetch data  
    // refetch()
    handleCloseModal()
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading assigned requests..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assigned Requests ({filteredRequests.length})</h2>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 bg-white"
        >
          {FILTER_OPTIONS.STATUSES.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No requests found for the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company/Branch
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr
                  key={request.id}
                  onClick={() => handleRowClick(request)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-500">ID: {request.requestId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.requester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {request.currency} {request.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.submittedOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{request.company}</div>
                      <div className="text-xs">{request.branch}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Details Modal */}
      <ApproverRequestDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}