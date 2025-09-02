"use client";

import { useMyRequests } from "@/hooks/use-dashboard-data";
import { REQUEST_STATUS } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import StatusBadge from "@/components/ui/status-badge";
import { Eye, Edit2, FileText, Filter } from "lucide-react";
import { useState, useMemo } from "react";

// Type derivation from constants
type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

interface MyRequestsListProps {
  userEmail: string;
}

export default function MyRequestsList({ userEmail }: MyRequestsListProps) {
  const { data, isLoading, error, refetch } = useMyRequests(userEmail);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedRequests = useMemo(() => {
    console.log("🔍 [MyRequestsList] Raw data from hook:", data);
    
    if (!data || data.length === 0) {
      console.log("🔍 [MyRequestsList] No data available");
      return [];
    }

    // Filtrar por status
    const filtered = data.filter((req: any) => {
      // El hook ya transforma approverStatus a status, pero mantenemos ambas para compatibilidad
      const requestStatus = req.status || req.approverStatus || REQUEST_STATUS.PENDING;
      return statusFilter === "all" || requestStatus === statusFilter;
    });

    console.log(`🔍 [MyRequestsList] After filtering: ${filtered.length} requests`);

    // Ordenar
    const sorted = filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          // Usar tanto createdDate como submittedOn para compatibilidad
          const dateA = new Date(a.createdDate || a.submittedOn || '').getTime();
          const dateB = new Date(b.createdDate || b.submittedOn || '').getTime();
          comparison = dateA - dateB;
          break;
        case "status":
          const statusA = a.status || a.approverStatus || '';
          const statusB = b.status || b.approverStatus || '';
          comparison = statusA.localeCompare(statusB);
          break;
        case "amount":
          const amountA = parseFloat(a.amount || '0');
          const amountB = parseFloat(b.amount || '0');
          comparison = amountA - amountB;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    console.log(`🔍 [MyRequestsList] After sorting: ${sorted.length} requests`);
    return sorted;
  }, [data, statusFilter, sortBy, sortOrder]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // Helper para formatear el monto
  const formatAmount = (amount: string | number | undefined) => {
    if (!amount || isNaN(Number(amount))) return "—";
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper para formatear la fecha
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "—";
    }
  };

  console.log("🔍 [MyRequestsList] Render - isLoading:", isLoading, "error:", error, "dataLength:", data?.length);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading your requests..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load your requests." 
        onRetry={refetch}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Requests Found
        </h3>
        <p className="text-gray-600">
          You haven't created any requests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedRequests.length} of {data.length} requests
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RequestStatus | "all")
              }
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
              onClick={() => handleSort("date")}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === "date"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Date {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleSort("status")}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === "status"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Status {sortBy === "status" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleSort("amount")}
              className={`px-3 py-1 text-sm rounded-md ${
                sortBy === "amount"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Amount {sortBy === "amount" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {filteredAndSortedRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === "all"
              ? "No Requests Found"
              : `No ${statusFilter} Requests`}
          </h3>
          <p className="text-gray-600">
            {statusFilter === "all"
              ? "You haven't created any requests yet."
              : `You don't have any ${statusFilter.toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
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
                {filteredAndSortedRequests.map((req: any) => (
                  <tr key={req.id || req.requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {req.requestId || req.id || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.vendor || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.po || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.branch || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status || req.approverStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatAmount(req.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.currency || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.reviewer || req.assignedApprover || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(req.createdDate || req.submittedOn)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            console.log("View request:", req.requestId || req.id);
                            // TODO: Implementar navegación a detalle
                          }}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        {(req.status === REQUEST_STATUS.PENDING || req.approverStatus === REQUEST_STATUS.PENDING) && (
                          <button
                            onClick={() => {
                              console.log("Edit request:", req.requestId || req.id);
                              // TODO: Implementar edición
                            }}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}