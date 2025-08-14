// src/types/next-auth.d.ts
// Extiende los tipos de NextAuth para incluir groups
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      groups?: string[] // Agregar groups al session
    }
  }

  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    groups?: string[] // Agregar groups al user
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    groups?: string[] // Agregar groups al JWT token
  }
}

// src/types/index.ts - Actualizar tipos existentes
import { USER_ROLES, REQUEST_STATUS } from '@/constants'

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]

// Hook interface que permite userRole null para usuarios no autorizados
export interface UseDashboardDataProps {
  userRole: UserRole | null  // null = usuario no autorizado
  userEmail: string
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