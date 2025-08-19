// src/components/request/admin-view.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { REQUEST_STATUS } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Type derivation from constants
type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inReview: number;
  totalAmount: number;
  avgProcessingTime: number;
  activeApprovers: number;
}

interface RequestSummary {
  id: string;
  requestId: string;
  requester: string;
  assignedApprover?: string;
  amount: string;
  currency: string;
  status: RequestStatus;
  submittedOn: string;
  lastUpdate: string;
  vendor: string;
  branch: string;
  priority: 'high' | 'medium' | 'low';
}

interface AdminViewProps {
  userEmail: string;
  user: User;
}

export default function AdminView({ userEmail, user }: AdminViewProps) {
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inReview: 0,
    totalAmount: 0,
    avgProcessingTime: 0,
    activeApprovers: 0
  });
  
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [userEmail, statusFilter, dateRange]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        role: 'admin',
        email: userEmail,
        status: statusFilter === 'all' ? '' : statusFilter,
        dateRange: dateRange
      });

      // Load stats and requests in parallel
      const [statsResponse, requestsResponse] = await Promise.all([
        fetch(`/api/admin/stats?${params}`),
        fetch(`/api/admin/requests?${params}`)
      ]);

      if (!statsResponse.ok || !requestsResponse.ok) {
        throw new Error('Failed to load admin data');
      }

      const [statsData, requestsData] = await Promise.all([
        statsResponse.json(),
        requestsResponse.json()
      ]);

      setStats(statsData.stats || stats);
      setRequests(requestsData.requests || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        role: 'admin',
        email: userEmail,
        status: statusFilter === 'all' ? '' : statusFilter,
        dateRange: dateRange,
        format: 'excel'
      });

      const response = await fetch(`/api/admin/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requests-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const getStatusConfig = (status: RequestStatus) => {
    switch (status) {
      case REQUEST_STATUS.PENDING:
        return { color: 'text-yellow-600 bg-yellow-50', icon: Clock };
      case REQUEST_STATUS.APPROVED:
        return { color: 'text-green-600 bg-green-50', icon: CheckCircle };
      case REQUEST_STATUS.REJECTED:
        return { color: 'text-red-600 bg-red-50', icon: XCircle };
      case REQUEST_STATUS.IN_REVIEW:
        return { color: 'text-blue-600 bg-blue-50', icon: Clock };
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: Clock };
    }
  };

  const getPriorityColor = (amount: string) => {
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (numAmount >= 10000) return 'border-l-red-500';
    if (numAmount >= 5000) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  const formatAmount = (amount: string | number, currency: string = 'CAD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    return `${currency} $${numAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            System overview and request management
          </p>
        </div>

        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatAmount(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Processing</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgProcessingTime}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Status Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">{stats.inReview}</div>
            <div className="text-sm text-gray-500">In Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value={REQUEST_STATUS.PENDING}>Pending</option>
            <option value={REQUEST_STATUS.IN_REVIEW}>In Review</option>
            <option value={REQUEST_STATUS.APPROVED}>Approved</option>
            <option value={REQUEST_STATUS.REJECTED}>Rejected</option>
          </select>
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">All Requests</h4>
          <p className="text-sm text-gray-600 mt-1">
            {requests.length} requests found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-gray-50 border-l-4 ${getPriorityColor(request.amount)}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.requestId}
                        </div>
                        <div className="text-sm text-gray-600">{request.vendor}</div>
                        <div className="text-xs text-gray-500">{request.branch}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.requester}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {request.assignedApprover || 'Not assigned'}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatAmount(request.amount, request.currency)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {request.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.submittedOn).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              No requests match the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}