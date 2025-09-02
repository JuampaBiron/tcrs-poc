// src/hooks/use-dashboard-data.ts
import { useState, useEffect } from 'react'
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

// Hook específico para requests del usuario (My Requests)
export function useMyRequests(userEmail: string) {
  const [data, setData] = useState<Request[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyRequests = async () => {
    if (!userEmail) {
      console.log('useMyRequests: No email provided, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔄 Fetching my requests for email: ${userEmail}`);

      // Llamar directamente al endpoint específico de my-requests
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
      const transformedRequests: Request[] = (result.data?.requests || []).map((dbRequest: MyRequestFromDB) => ({
        id: dbRequest.requestId,
        title: `${dbRequest.vendor || 'Unknown Vendor'} - ${dbRequest.currency} ${dbRequest.amount || '0'}`, // Crear título sintético
        status: dbRequest.approverStatus || 'pending',
        reviewer: dbRequest.assignedApprover || 'Unassigned',
        requester: dbRequest.requester || userEmail,
        submittedOn: typeof dbRequest.createdDate === 'string' 
          ? dbRequest.createdDate 
          : dbRequest.createdDate?.toISOString?.() || new Date().toISOString(),
        amount: dbRequest.amount?.toString() || '0',
        branch: dbRequest.branch || 'Unknown',
        // Campos adicionales para mantener compatibilidad con my-requests-list.tsx
        requestId: dbRequest.requestId,
        vendor: dbRequest.vendor,
        po: dbRequest.po,
        currency: dbRequest.currency,
        company: dbRequest.company,
        approverStatus: dbRequest.approverStatus,
        createdDate: dbRequest.createdDate,
        assignedApprover: dbRequest.assignedApprover
      }));

      console.log(`✅ Successfully transformed ${transformedRequests.length} requests`);
      setData(transformedRequests);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch my requests';
      console.error('❌ Error fetching my requests:', errorMessage);
      setError(errorMessage);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [userEmail]);

  const refetch = () => {
    fetchMyRequests();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// Hook genérico para dashboard data (sin cambios)
export function useDashboardData({ userRole, userEmail }: UseDashboardDataProps) {
  const [requests, setRequests] = useState<Request[]>([])  // Tipar correctamente
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)  // false por defecto
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    // SI userRole es null, NO hacer llamadas
    if (!userRole || !userEmail) {
      console.log('Skipping API calls - user not authorized or missing data')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching data for role: ${userRole}, email: ${userEmail}`)

      // Llamadas paralelas
      const [requestsResult, statsResult] = await Promise.all([
        apiClient.getRequests(userRole, userEmail),
        apiClient.getStats(userRole, userEmail)
      ])

      // Manejar errores de requests
      if (requestsResult.error) {
        throw new Error(`Requests error: ${requestsResult.error}`)
      }

      // Manejar errores de stats  
      if (statsResult.error) {
        throw new Error(`Stats error: ${statsResult.error}`)
      }

      // Actualizar estado con datos exitosos
      setRequests(requestsResult.data?.requests || [])
      setStats(statsResult.data?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      console.error('Dashboard data fetch error:', errorMessage)
      setError(errorMessage)
      
      // Set default empty state on error
      setRequests([])
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userRole, userEmail]) // Se ejecuta cuando cambian, pero si userRole=null no hace nada

  const refetch = () => {
    fetchData()
  }

  return {
    requests,
    stats,
    loading,
    error,
    refetch
  }
}