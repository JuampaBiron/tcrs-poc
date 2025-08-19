// src/components/request/my-requests-list.tsx
"use client";

import { useState, useEffect } from "react";
import { Edit2, Eye, Clock, CheckCircle, XCircle, FileText, Filter } from "lucide-react";
import { REQUEST_STATUS } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Type derivation from constants
type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

interface MyRequest {
  id: string;
  requestId: string;
  title: string;
  vendor: string;
  amount: string;
  currency: string;
  status: RequestStatus;
  assignedApprover?: string;
  submittedOn: string;
  lastUpdate: string;
  canEdit: boolean;
  branch: string;
  po?: string;
}

interface MyRequestsListProps {
  userEmail: string;
}

export default function MyRequestsList({ userEmail }: MyRequestsListProps) {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadMyRequests();
  }, [userEmail]);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        role: 'requester',
        email: userEmail,
      });

      const response = await fetch(`/api/requests/my-requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load your requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: RequestStatus) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          text: 'Pending'
        };
      case REQUEST_STATUS.APPROVED:
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Approved'
        };
      case REQUEST_STATUS.REJECTED:
        return {
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          text: 'Rejected'
        };
      case REQUEST_STATUS.IN_REVIEW:
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Eye,
          text: 'In Review'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          text: status
        };
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    return `${currency} $${numAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;
  };

  const filteredAndSortedRequests = requests
    .filter(request => statusFilter === 'all' || request.status === statusFilter)
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.submittedOn).getTime() - new Date(b.submittedOn).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'amount':
          const amountA = parseFloat(a.amount.replace(/[^\d.-]/g, ''));
          const amountB = parseFloat(b.amount.replace(/[^\d.-]/g, ''));
          comparison = amountA - amountB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedRequests.length} of {requests.length} requests
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value={REQUEST_STATUS.PENDING}>Pending</option>
              <option value={REQUEST_STATUS.IN_REVIEW}>In Review</option>
              <option value={REQUEST_STATUS.APPROVED}>Approved</option>
              <option value={REQUEST_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleSort('date')}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('status')}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'status' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Status {sortBy === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('amount')}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Requests List */}
      {filteredAndSortedRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No Requests Found' : `No ${getStatusConfig(statusFilter as RequestStatus).text} Requests`}
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? "You haven't created any requests yet." 
              : `You don't have any ${getStatusConfig(statusFilter as RequestStatus).text.toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.requestId}
                          </div>
                          <div className="text-sm text-gray-600">{request.vendor}</div>
                          {request.po && (
                            <div className="text-xs text-gray-500">PO: {request.po}</div>
                          )}
                          <div className="text-xs text-gray-500">{request.branch}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.text}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatAmount(request.amount, request.currency)}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {request.assignedApprover || 'Not assigned'}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(request.submittedOn).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                        
                        {request.canEdit && request.status === REQUEST_STATUS.REJECTED && (
                          <button
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}