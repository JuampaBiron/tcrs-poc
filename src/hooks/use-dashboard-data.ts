// src/hooks/use-dashboard-data.ts
import { useState, useEffect } from 'react'
import { UserRole, Request, Stats } from '@/types'
import { apiClient } from '@/lib/api-client'
import { USER_ROLES } from '@/constants'

interface UseDashboardDataProps {
  userRole: UserRole | null  
  userEmail: string
}
// Hook para requests del usuario actual (My Requests)
export function useMyRequests(userEmail: string) {
  const { requests, loading, error, refetch } = useDashboardData({
    userRole: USER_ROLES.REQUESTER,
    userEmail,
  });

  return {
    data: requests, // requests debe ser el array de requests del usuario
    isLoading: loading,
    error,
    refetch,
  };
}
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