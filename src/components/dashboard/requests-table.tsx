"use client";

import { Eye, ArrowUp, ArrowDown } from "lucide-react";
import { FilterState, UserRole, Request, RequestStatus } from "@/types";
import { REQUEST_STATUS } from "@/constants";
import { useMemo, useState } from "react";

interface RequestsTableProps {
  userRole: UserRole;
  requests: Request[];
  searchQuery: string;
  filters: FilterState;
  onRefresh: () => void;
}

// Define el tipo para la configuración de ordenación
interface SortConfig {
  key: keyof Request | null;
  direction: 'asc' | 'desc';
}

export default function RequestsTable({
  userRole,
  requests,
  searchQuery,
  filters,
  onRefresh
}: RequestsTableProps) {
  // Estado para la configuración de ordenación
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // Función para manejar el clic en los encabezados de la tabla
  const handleSort = (key: keyof Request) => {
    let direction: 'asc' | 'desc' = 'asc';
    // Si la columna actual es la misma, cambia la dirección
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    // Actualiza el estado con la nueva configuración de ordenación
    setSortConfig({ key, direction });
  };

  // Usar useMemo para filtrar y ordenar los datos
  const sortedAndFilteredRequests = useMemo(() => {
    // 1. Filtrar los datos primero
    const filtered = requests.filter(request => {
      const matchesSearch = searchQuery === '' || 
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.po?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filters.status || request.status === filters.status;
      const matchesBranch = !filters.branch || request.branch === filters.branch;
      return matchesSearch && matchesStatus && matchesBranch;
    });

    // 2. Ordenar los datos filtrados
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        let comparison = 0;
        // Lógica de comparación basada en el tipo de dato
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          // Fallback para otros tipos, como fechas
          const dateA = new Date(aValue as any);
          const dateB = new Date(bValue as any);
          comparison = dateA.getTime() - dateB.getTime();
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [searchQuery, filters, requests, sortConfig]);

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

  // Función auxiliar para mostrar el icono de ordenación
  const getSortIcon = (key: keyof Request) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Requests Overview</h3>
        <p className="text-sm text-gray-600 mt-1">Complete request details with invoice data and GL coding information</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('company')}>
                <div className="flex items-center">
                  Company
                  {getSortIcon('company')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('branch')}>
                <div className="flex items-center">
                  Branch
                  {getSortIcon('branch')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('vendor')}>
                <div className="flex items-center">
                  Vendor
                  {getSortIcon('vendor')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('po')}>
                <div className="flex items-center">
                  PO
                  {getSortIcon('po')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('amount')}>
                <div className="flex items-center">
                  Amount
                  {getSortIcon('amount')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('currency')}>
                <div className="flex items-center">
                  Currency
                  {getSortIcon('currency')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('submittedOn')}>
                <div className="flex items-center">
                  Submitted On
                  {getSortIcon('submittedOn')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('glCodingCount')}>
                <div className="flex items-center">
                  GL Coding Count
                  {getSortIcon('glCodingCount')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('status')}>
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('approvedDate')}>
                <div className="flex items-center">
                  Approved Date
                  {getSortIcon('approvedDate')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{request.company || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.branch || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.vendor || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.po || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.amount || '0'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.currency || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.submittedOn}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.glCodingCount || 0}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {request.approvedDate ? new Date(request.approvedDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                  }) : 'N/A'}
                </td>
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

      {sortedAndFilteredRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No requests found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}