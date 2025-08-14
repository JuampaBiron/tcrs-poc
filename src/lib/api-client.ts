import { ApiResponse, Request, Stats, UserRole, FilterState } from '@/types'
import { API_ROUTES } from '@/constants'
import { safeApiCall } from './error-handler'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    return safeApiCall<T>(() =>
      fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: defaultHeaders
      })
    )
  }

  // Requests API
  async getRequests(role: UserRole, email: string): Promise<{ data: { requests: Request[] } | null; error: string | null }> {
    console.log('=== API CLIENT DEBUG ===')
    console.log('apiClient role parameter:', role)
    console.log('apiClient email parameter:', email)
    const params = new URLSearchParams({ role, email })
    console.log('Final URL params:', params.toString())
    return this.makeRequest<{ requests: Request[] }>(`${API_ROUTES.REQUESTS}?${params}`)
  }

  async approveRequest(requestId: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
    return this.makeRequest<{ success: boolean }>('/api/requests/approve', {
      method: 'POST',
      body: JSON.stringify({ requestId })
    })
  }

  async rejectRequest(requestId: string, reason: string): Promise<{ data: { success: boolean } | null; error: string | null }> {
    return this.makeRequest<{ success: boolean }>('/api/requests/reject', {
      method: 'POST',
      body: JSON.stringify({ requestId, reason })
    })
  }

  // Stats API
  async getStats(role: UserRole, email: string): Promise<{ data: { stats: Stats } | null; error: string | null }> {
    const params = new URLSearchParams({ role, email })
    return this.makeRequest<{ stats: Stats }>(`${API_ROUTES.STATS}?${params}`)
  }

  // Export API
  async exportData(
    role: UserRole, 
    email: string, 
    filters: FilterState
  ): Promise<{ data: Blob | null; error: string | null }> {
    try {
      const response = await fetch(API_ROUTES.EXPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, email, filters })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          data: null,
          error: errorData.error || 'Export failed'
        }
      }

      const blob = await response.blob()
      return {
        data: blob,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  // Search API
  async searchRequests(params: {
    query?: string
    status?: string
    userEmail?: string
    userRole?: UserRole
  }): Promise<{ data: { requests: Request[] } | null; error: string | null }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value)
      }
    })

    return this.makeRequest<{ requests: Request[] }>(`/api/requests/search?${searchParams}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Helper functions for common operations
export async function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export function generateExportFilename(type: string = 'requests'): string {
  const date = new Date().toISOString().split('T')[0]
  return `tcrs-${type}-${date}.csv`
}