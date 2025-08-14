// src/components/dashboard/requests-table.tsx
"use client";

import { Eye } from "lucide-react";
import { FilterState, UserRole, Request, RequestStatus } from "@/types";
import { REQUEST_STATUS } from "@/constants";
import { useMemo } from "react";

interface RequestsTableProps {
  userRole: UserRole;
  requests: Request[];
  searchQuery: string;
  filters: FilterState;
  onRefresh: () => void;
}

export default function RequestsTable({
  userRole,
  requests,
  searchQuery,
  filters,
  onRefresh
}: RequestsTableProps) {
  // Usar requests reales del prop en lugar de datos de ejemplo
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           request.requester?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filters.status || request.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filters, requests]);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case REQUEST_STATUS.APPROVED: return 'bg-green-100 text-green-800';
      case REQUEST_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
      case REQUEST_STATUS.IN_REVIEW: return 'bg-blue-100 text-blue-800';
      case REQUEST_STATUS.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case REQUEST_STATUS.APPROVED: return 'Approved';
      case REQUEST_STATUS.PENDING: return 'Pending';
      case REQUEST_STATUS.IN_REVIEW: return 'In Review';
      case REQUEST_STATUS.REJECTED: return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">All Requests</h3>
        <p className="text-sm text-gray-600 mt-1">A complete view</p>
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
                Requester
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
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{request.title}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.requester || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.submittedOn}</td>
                <td className="px-6 py-4">
                  <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                    <Eye size={14} />
                    <span className="text-xs">View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No requests found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}