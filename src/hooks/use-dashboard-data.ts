import { useState, useEffect, useCallback } from 'react'
import { Request, Stats, UserRole } from '@/types'
import { apiClient } from '@/lib/api-client'

interface UseDashboardDataProps {
  userRole: UserRole
  userEmail: string
}

interface UseDashboardDataReturn {
  requests: Request[]
  stats: Stats
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardData({ 
  userRole, 
  userEmail 
}: UseDashboardDataProps): UseDashboardDataReturn {
  const [requests, setRequests] = useState<Request[]>([])
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch requests and stats in parallel
      const [requestsResult, statsResult] = await Promise.all([
        apiClient.getRequests(userRole, userEmail),
        apiClient.getStats(userRole, userEmail)
      ])

      // Handle requests
      if (requestsResult.error) {
        setError(requestsResult.error)
      } else if (requestsResult.data) {
        setRequests(requestsResult.data.requests || [])
      }

      // Handle stats
      if (statsResult.error && !requestsResult.error) {
        setError(statsResult.error)
      } else if (statsResult.data) {
        setStats(statsResult.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [userRole, userEmail])

  useEffect(() => {
    if (userRole && userEmail) {
      fetchData()
    }
  }, [fetchData, userRole, userEmail])

  return {
    requests,
    stats,
    loading,
    error,
    refetch: fetchData
  }
}