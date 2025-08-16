// src/types/index.ts
import { USER_ROLES, REQUEST_STATUS } from '@/constants'

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]

// ✅ NUEVOS TIPOS PARA EXPORTACIÓN CON FILTROS
export interface ExportFilters extends FilterState {
  searchQuery?: string;
}

export interface ExportParams {
  role: UserRole;
  email: string;
  filters: ExportFilters;
}

export interface ExportResponse {
  data?: Blob;
  error?: string;
  message?: string;
}

// Actualizar User interface para incluir groups
export interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  groups?: string[] // Nuevo: grupos de Entra ID
}

export interface UserContext {
  role: UserRole
  permissions: UserPermissions
  displayName: string
  email?: string | null
  name?: string | null
  image?: string | null
  groups?: string[] // Nuevo: incluir groups en contexto
}

// Resto de tipos existentes permanecen igual...
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

export interface DbApprovalRequest {
  requestId: string
  requester: string | null
  assignedApprover: string | null
  approverStatus: RequestStatus | null
  approvedDate: Date | null
  comments: string | null
  createdDate: Date | null
  modifiedDate: Date | null
}