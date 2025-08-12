// Shared types for the TCRS application

export type UserRole = 'requester' | 'approver' | 'admin'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'in-review'

export interface Request {
  id: string
  title: string
  status: RequestStatus
  reviewer: string
  requester?: string
  submittedOn: string
  amount?: string
  branch: string
}

export interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface FilterState {
  status: string
  dateRange: string
  amount: string
  branch: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface UserContext {
  role: UserRole
  permissions: UserPermissions
  displayName: string
  email?: string | null
  name?: string | null
  image?: string | null
}

export interface UserPermissions {
  canCreateRequests: boolean
  canApproveRequests: boolean
  canViewAllRequests: boolean
  canManageUsers: boolean
  canExportData: boolean
  canAccessReports: boolean
}

export interface ApprovalRequest {
  requestId: string
  requester?: string | null
  assignedApprover?: string | null
  approverStatus?: RequestStatus
  approvedDate?: Date | null
  comments?: string | null
  createdDate?: Date
  modifiedDate?: Date | null
}

// Database types (matching schema)
export interface DbApprovalRequest {
  requestId: string
  requester: string | null
  assignedApprover: string | null
  approverStatus: 'pending' | 'approved' | 'rejected' | null
  approvedDate: Date | null
  comments: string | null
  createdDate: Date | null
  modifiedDate: Date | null
}