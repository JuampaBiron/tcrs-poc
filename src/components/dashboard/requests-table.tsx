"use client"

import { useState } from "react"
import { Eye, CheckCircle, XCircle, Clock, User, Calendar, DollarSign } from "lucide-react"

interface Request {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected' | 'in-review'
  reviewer: string
  submittedOn: string
  amount?: string
  vendor?: string
  branch: string
  requester?: string
}

interface RequestsTableProps {
  userRole?: 'requester' | 'approver' | 'admin'
  searchQuery?: string
  filters?: any
}

export default function RequestsTable({ 
  userRole = 'requester',
  searchQuery = "",
  filters = {}
}: RequestsTableProps) {
  
  // Mock data - esto vendría de la base de datos
  const [requests] = useState<Request[]>([
    {
      id: "REQ-001",
      title: "TCRS - Branch 1 - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review",
      reviewer: "Manager 1",
      submittedOn: "03/10/25",
      amount: "$2,500",
      vendor: "Vendor A",
      branch: "TCRS - Branch 1"
    },
    {
      id: "REQ-002", 
      title: "Sitech - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review",
      reviewer: "Manager1, Manager 2",
      submittedOn: "03/07/25", 
      amount: "$1,800",
      vendor: "Vendor B",
      branch: "Sitech"
    },
    {
      id: "REQ-003",
      title: "TCRS - Branch 2 - Vendor # - PO # - Invoice Amount - Currency", 
      status: "in-review",
      reviewer: "Manager 2",
      submittedOn: "03/06/25",
      amount: "$4,200",
      vendor: "Vendor C", 
      branch: "TCRS - Branch 2"
    },
    {
      id: "REQ-004",
      title: "Fused-Canada - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review", 
      reviewer: "Manager 3",
      submittedOn: "03/06/25",
      amount: "$3,100",
      vendor: "Vendor D",
      branch: "Fused-Canada"
    },
    {
      id: "REQ-005",
      title: "Fused-UK - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review",
      reviewer: "Manager2, Manager 3", 
      submittedOn: "02/28/25",
      amount: "$5,600",
      vendor: "Vendor E",
      branch: "Fused-UK"
    },
    {
      id: "REQ-006",
      title: "TCRS - Branch 3 - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review",
      reviewer: "Manager 1",
      submittedOn: "03/02/25", 
      amount: "$890",
      vendor: "Vendor F",
      branch: "TCRS - Branch 3"
    },
    {
      id: "REQ-007",
      title: "TCRS - Branch 1 - Vendor # - PO # - Invoice Amount - Currency",
      status: "in-review",
      reviewer: "Manager 2", 
      submittedOn: "03/03/25",
      amount: "$7,200",
      vendor: "Vendor G",
      branch: "TCRS - Branch 1"
    }
  ])

  const getStatusBadge = (status: Request['status']) => {
    const badges = {
      'pending': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending'
      },
      'in-review': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: <Eye className="w-4 h-4" />,
        label: 'In Review'
      },
      'approved': { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Approved'
      },
      'rejected': { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: <XCircle className="w-4 h-4" />,
        label: 'Rejected'
      }
    }
    
    const badge = badges[status]
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const handleViewRequest = (requestId: string) => {
    // TODO: Navigate to request detail view
    console.log('View request:', requestId)
  }

  const handleApproveRequest = (requestId: string) => {
    // TODO: Approve request logic
    console.log('Approve request:', requestId) 
  }

  const handleRejectRequest = (requestId: string) => {
    // TODO: Reject request logic
    console.log('Reject request:', requestId)
  }

  // Filter requests based on search and filters
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === "" || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.branch.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !filters.status || request.status === filters.status
    const matchesBranch = !filters.branch || request.branch.toLowerCase().includes(filters.branch.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesBranch
  })

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {userRole === 'approver' ? 'Pending Requests' : userRole === 'admin' ? 'All Requests' : 'My Requests'}
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
                {userRole === 'requester' ? 'Reviewer' : 'Requester'}
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
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{request.reviewer}</div>
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
                    
                    {userRole === 'approver' && request.status === 'in-review' && (
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
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}