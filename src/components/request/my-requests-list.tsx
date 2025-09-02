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
  const { data, isLoading, error } = useMyRequests(userEmail);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "status" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedRequests = useMemo(() => {
    if (!data) return [];
    return data
      .filter(
        (req: any) =>
          statusFilter === "all" || req.approverStatus === statusFilter
      )
      .sort((a: any, b: any) => {
        let comparison = 0;
        switch (sortBy) {
          case "date":
            comparison =
              new Date(a.createdDate).getTime() -
              new Date(b.createdDate).getTime();
            break;
          case "status":
            comparison = a.approverStatus.localeCompare(b.approverStatus);
            break;
          case "amount":
            comparison = parseFloat(a.amount) - parseFloat(b.amount);
            break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [data, statusFilter, sortBy, sortOrder]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load your requests." />;
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
                  <tr key={req.requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{req.requestId}</td>
                    <td className="px-6 py-4">{req.vendor || "—"}</td>
                    <td className="px-6 py-4">{req.po || "—"}</td>
                    <td className="px-6 py-4">{req.branch || "—"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.approverStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.amount && !isNaN(Number(req.amount))
                        ? Number(req.amount).toLocaleString("en-CA", { minimumFractionDigits: 2 })
                        : "0.00"}
                    </td>
                    <td className="px-6 py-4">{req.currency || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {req.assignedApprover || "Not assigned"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {req.createdDate
                        ? new Date(req.createdDate).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      {req.canEdit && req.approverStatus === REQUEST_STATUS.REJECTED && (
                        <button
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                      )}
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