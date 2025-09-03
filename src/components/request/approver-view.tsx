// src/components/request/approver-view.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { Eye, Check, X, Clock, FileText, DollarSign, User as UserIcon } from "lucide-react";
import { REQUEST_STATUS, USER_ROLES } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import RequestDetailsModal from "./request-details-modal";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

interface PendingRequest {
  id: string;
  requestId: string;
  title: string;
  requester: string;
  amount: string;
  currency: string;
  submittedOn: string;
  branch: string;
  vendor: string;
  po?: string;
  status: RequestStatus;
  priority?: 'high' | 'medium' | 'low';
}

interface ApproverViewProps {
  userEmail: string;
  user: User;
  userRole: UserRole;
}

export default function ApproverView({ userEmail, user, userRole }: ApproverViewProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned'>('pending');

  useEffect(() => {
    loadPendingRequests();
  }, [userEmail, filter]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        role: userRole,
        email: userEmail,
        status: filter === 'pending' ? REQUEST_STATUS.PENDING : '',
        assignedOnly: filter === 'assigned' ? 'true' : 'false'
      });

      const response = await fetch(`/api/requests/pending?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load pending requests');
      }

      const data = await response.json();
      console.log('🔍 [Frontend] API Response:', data);
      console.log('🔍 [Frontend] Requests received:', data.data?.requests);
      setRequests(data.data?.requests || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    try {
      setActionLoading(requestId);
      setError(null);

      const response = await fetch(`/api/requests/${requestId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver: userEmail,
          comments: comments || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }

      // Refresh the requests list
      await loadPendingRequests();
      
      // Close modal if open
      setSelectedRequest(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (amount: string) => {
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (numAmount >= 10000) return 'text-red-600 bg-red-50';
    if (numAmount >= 5000) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    return `${currency} $${numAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
          <p className="text-sm text-gray-600 mt-1">
            {requests.length} request{requests.length !== 1 ? 's' : ''} requiring your attention
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">
            {filter === 'pending' ? 'No requests are pending approval at this time.' :
             'No requests found.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.requestId}
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.vendor}
                          </div>
                          {request.po && (
                            <div className="text-xs text-gray-500">
                              PO: {request.po}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {request.branch}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{request.requester}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.amount)}`}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        {formatAmount(request.amount, request.currency)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.submittedOn).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </button>
                      
                      <button
                        onClick={() => handleApproveReject(request.requestId, 'approve')}
                        disabled={actionLoading === request.requestId}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {actionLoading === request.requestId ? (
                          <LoadingSpinner />
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleApproveReject(request.requestId, 'reject')}
                        disabled={actionLoading === request.requestId}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={(comments) => handleApproveReject(selectedRequest.requestId, 'approve', comments)}
          onReject={(comments) => handleApproveReject(selectedRequest.requestId, 'reject', comments)}
          loading={actionLoading === selectedRequest.requestId}
        />
      )}
    </div>
  );
}