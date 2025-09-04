// src/hooks/use-dashboard-data.ts
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserRole, Request, Stats } from '@/types'
import { apiClient } from '@/lib/api-client'
import { USER_ROLES } from '@/constants'

interface UseDashboardDataProps {
  userRole: UserRole | null  
  userEmail: string
}

// Interface específica para los datos que devuelve getMyRequestsWithDetails
interface MyRequestFromDB {
  requestId: string;
  requester: string;
  approverStatus: string;
  amount: number;
  company: string;
  branch: string;
  vendor: string;
  po: string;
  currency: string;
  createdDate: Date | string;
  assignedApprover: string;
}

// Hook optimizado con React Query para requests del usuario (My Requests)
// Retorna interfaz compatible con React Query pero con nombres familiares
export function useMyRequests(userEmail: string) {
  const query = useQuery({
    queryKey: ['my-requests', userEmail],
    queryFn: async () => {
      if (!userEmail) {
        console.log('useMyRequests: No email provided, returning empty array');
        return [];
      }

      console.log(`🔄 Fetching my requests for email: ${userEmail}`);

      const params = new URLSearchParams({ 
        email: userEmail 
      });

      const response = await fetch(`/api/requests/my-requests?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch my requests`);
      }

      const result = await response.json();
      console.log('🔍 Raw API response:', result);

      // Transformar los datos de DB al formato esperado por el componente
      const transformedRequests = (result.data?.requests || []).map((dbRequest: MyRequestFromDB) => ({
        id: dbRequest.requestId,
        title: `${dbRequest.vendor || 'Unknown Vendor'} - ${dbRequest.currency} ${dbRequest.amount || '0'}`,
        status: dbRequest.approverStatus || 'rejected',
        reviewer: dbRequest.assignedApprover || 'Unassigned',
        requester: dbRequest.requester || userEmail,
        submittedOn: typeof dbRequest.createdDate === 'string' 
          ? dbRequest.createdDate 
          : dbRequest.createdDate?.toISOString?.() || new Date().toISOString(),
        amount: dbRequest.amount?.toString() || '0',
        branch: dbRequest.branch || 'Unknown',
        // Campos adicionales necesarios para recrear la request
        requestId: dbRequest.requestId,
        vendor: dbRequest.vendor,
        po: dbRequest.po,
        currency: dbRequest.currency,
        company: dbRequest.company,
        tcrsCompany: false,
        approverStatus: dbRequest.approverStatus,
        createdDate: dbRequest.createdDate,
        assignedApprover: dbRequest.assignedApprover
      }));

      console.log(`✅ Successfully transformed ${transformedRequests.length} requests`);
      return transformedRequests;
    },
    enabled: !!userEmail,
    staleTime: 1000 * 60 * 2, // 2 minutos - requests propios cambian moderadamente
    gcTime: 1000 * 60 * 5, // 5 minutos en caché
    refetchOnWindowFocus: true, // Refrescar cuando el usuario regresa
    refetchOnMount: false,
    retry: 2,
  });

  // Retorna interfaz compatible con el código existente
  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
// Hook optimizado con React Query para requests rechazadas
export function useRejectedRequests(userEmail: string) {
  const query = useQuery({
    queryKey: ['rejected-requests', userEmail],
    queryFn: async () => {
      if (!userEmail) {
        console.log('useRejectedRequests: No email provided, returning empty array');
        return [];
      }

      console.log(`🔄 Fetching rejected requests for email: ${userEmail}`);

      const params = new URLSearchParams({ 
        email: userEmail,
        status: 'rejected'
      });

      const response = await fetch(`/api/requests/my-requests?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch rejected requests`);
      }

      const result = await response.json();

      // Transformar los datos igual que en useMyRequests
      const transformedRequests: Request[] = (result.data?.requests || []).map((dbRequest: MyRequestFromDB) => ({
        id: dbRequest.requestId,
        title: `${dbRequest.vendor || 'Unknown Vendor'} - ${dbRequest.currency} ${dbRequest.amount || '0'}`,
        status: dbRequest.approverStatus || 'rejected',
        reviewer: dbRequest.assignedApprover || 'Unassigned',
        requester: dbRequest.requester || userEmail,
        submittedOn: typeof dbRequest.createdDate === 'string' 
          ? dbRequest.createdDate 
          : dbRequest.createdDate?.toISOString?.() || new Date().toISOString(),
        amount: dbRequest.amount?.toString() || '0',
        branch: dbRequest.branch || 'Unknown',
        // Campos adicionales necesarios para recrear la request
        requestId: dbRequest.requestId,
        vendor: dbRequest.vendor,
        po: dbRequest.po,
        currency: dbRequest.currency,
        company: dbRequest.company,
        approverStatus: dbRequest.approverStatus,
        createdDate: dbRequest.createdDate,
        assignedApprover: dbRequest.assignedApprover
      }));

      console.log(`✅ Successfully transformed ${transformedRequests.length} rejected requests`);
      return transformedRequests;
    },
    enabled: !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutos - requests rechazadas cambian poco
    gcTime: 1000 * 60 * 10, // 10 minutos en caché
    refetchOnWindowFocus: false, // No necesario refrescar automáticamente
    refetchOnMount: false,
    retry: 2,
  });

  // Retorna interfaz compatible con el código existente
  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  } as const;
}

// Hook optimizado con React Query para requests asignadas al approver
export function useApproverRequests(approverEmail: string) {
  const query = useQuery({
    queryKey: ['approver-requests', approverEmail],
    queryFn: async () => {
      if (!approverEmail) {
        console.log('useApproverRequests: No email provided, returning empty array');
        return [];
      }

      console.log(`🔄 Fetching approver requests for email: ${approverEmail}`);

      const params = new URLSearchParams({ 
        email: approverEmail 
      });

      const response = await fetch(`/api/requests/approver-requests?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch approver requests`);
      }

      const result = await response.json();
      console.log('🔍 Raw approver API response:', result);

      // Transformar los datos de DB al formato esperado por el componente
      const transformedRequests = (result.data?.requests || []).map((dbRequest: any) => ({
        id: dbRequest.requestId,
        title: `${dbRequest.vendor || 'Unknown Vendor'} - ${dbRequest.currency} ${dbRequest.amount || '0'}`,
        status: dbRequest.approverStatus || 'pending',
        reviewer: dbRequest.assignedApprover || approverEmail,
        requester: dbRequest.requester || 'Unknown',
        submittedOn: typeof dbRequest.createdDate === 'string' 
          ? dbRequest.createdDate 
          : dbRequest.createdDate?.toISOString?.() || new Date().toISOString(),
        amount: dbRequest.amount?.toString() || '0',
        branch: dbRequest.branch || 'Unknown',
        // Campos adicionales para approvers
        requestId: dbRequest.requestId,
        vendor: dbRequest.vendor,
        po: dbRequest.po,
        currency: dbRequest.currency,
        company: dbRequest.company,
        approverStatus: dbRequest.approverStatus,
        createdDate: dbRequest.createdDate,
        assignedApprover: dbRequest.assignedApprover,
        // Campos adicionales de invoice disponibles en el schema
        tcrsCompany: dbRequest.tcrsCompany,
        blobUrl: dbRequest.blobUrl
      }));

      console.log(`✅ Successfully transformed ${transformedRequests.length} approver requests`);
      return transformedRequests;
    },
    enabled: !!approverEmail,
    staleTime: 1000 * 60 * 1, // 1 minuto - requests de approver necesitan estar frescos
    gcTime: 1000 * 60 * 3, // 3 minutos en caché
    refetchOnWindowFocus: true, // Importante para approvers - necesitan datos actuales
    refetchOnMount: false,
    retry: 2,
  });

  // Retorna interfaz compatible con el código existente
  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  } as const;
}

// Hook optimizado con React Query para dashboard data
export function useDashboardData({ userRole, userEmail }: UseDashboardDataProps) {
  // Hook para requests con React Query
  const requestsQuery = useQuery({
    queryKey: ['dashboard-requests', userRole, userEmail],
    queryFn: async () => {
      if (!userRole || !userEmail) {
        throw new Error('User role or email missing')
      }
      console.log(`🔄 Fetching requests for role: ${userRole}, email: ${userEmail}`)
      const result = await apiClient.getRequests(userRole, userEmail)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data?.requests || []
    },
    enabled: !!(userRole && userEmail),
    staleTime: 1000 * 60 * 5, // 5 minutos - datos del dashboard se actualizan moderadamente
    gcTime: 1000 * 60 * 10, // 10 minutos en caché
    refetchOnWindowFocus: true, // Sí refrescar en focus para dashboard (datos importantes)
    refetchOnMount: false, // No refrescar si ya hay datos cached
    retry: 2,
  })

  // Hook para stats con React Query
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', userRole, userEmail],
    queryFn: async () => {
      if (!userRole || !userEmail) {
        throw new Error('User role or email missing')
      }
      console.log(`🔄 Fetching stats for role: ${userRole}, email: ${userEmail}`)
      const result = await apiClient.getStats(userRole, userEmail)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 }
    },
    enabled: !!(userRole && userEmail),
    staleTime: 1000 * 60 * 3, // 3 minutos - stats cambian más frecuentemente
    gcTime: 1000 * 60 * 8, // 8 minutos en caché
    refetchOnWindowFocus: true, // Sí refrescar stats en focus
    refetchOnMount: false,
    retry: 2,
  })

  // Combinar loading states
  const loading = requestsQuery.isLoading || statsQuery.isLoading
  
  // Combinar error states
  const error = requestsQuery.error?.message || statsQuery.error?.message || null

  // Función de refetch combinada
  const refetch = () => {
    requestsQuery.refetch()
    statsQuery.refetch()
  }

  return {
    requests: requestsQuery.data || [],
    stats: statsQuery.data || { total: 0, pending: 0, approved: 0, rejected: 0 },
    loading,
    error,
    refetch
  }
}

// Hook optimizado con React Query para GL Coding data de una request
export function useGLCodingByRequestId(requestId: string | null) {
  const query = useQuery({
    queryKey: ['gl-coding', requestId],
    queryFn: async () => {
      if (!requestId) {
        console.log('useGLCodingByRequestId: No requestId provided, returning empty array');
        return [];
      }

      console.log(`🔄 Fetching GL coding data for requestId: ${requestId}`);

      const response = await fetch(`/api/gl-coding/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch GL coding data`);
      }

      const result = await response.json();
      console.log(`✅ Successfully fetched ${result.data?.glCodingEntries?.length || 0} GL coding entries`);
      
      return result.data?.glCodingEntries || [];
    },
    enabled: !!requestId,
    staleTime: 1000 * 60 * 10, // 10 minutos - GL coding data cambia raramente
    gcTime: 1000 * 60 * 20, // 20 minutos en caché
    refetchOnWindowFocus: false, // No necesario refrescar GL coding automáticamente
    refetchOnMount: false,
    retry: 2,
  });

  // Retorna interfaz compatible con el código existente
  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  } as const;
}