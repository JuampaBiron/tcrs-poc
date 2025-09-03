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

// Enhanced Request interface for the requests table
export interface RequestTableData {
  requestId: string
  requester: string | null
  assignedApprover: string | null
  approverStatus: RequestStatus | null
  approvedDate: Date | null
  requestCreatedDate: Date | null
  // Invoice data fields
  company: string | null
  branch: string | null
  vendor: string | null
  po: string | null
  amount: string | null
  currency: string | null
  createdDate: Date | null // Submitted on date from invoice_data
  // GL coding count
  glCodingCount: number
}

// Enhanced Request interface with new fields
export interface Request {
  id: string
  requestId?: string
  title: string
  status: RequestStatus
  reviewer: string
  requester?: string
  submittedOn: string
  amount?: string
  branch: string
  // New enhanced fields
  company?: string
  vendor?: string
  po?: string
  currency?: string
  approverStatus?: RequestStatus
  approvedDate?: Date | null
  glCodingCount?: number
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

export interface InvoiceData {
  company: string;
  branch: string;
  tcrsCompany: boolean;
  vendor: string;
  po: string;
  amount: number;
  currency: string;
  // PDF handling - keep File for form, add URL for storage
  pdfFile?: File;           // For form handling (client-side)
  pdfUrl?: string;          // For database storage (blob URL)
  pdfOriginalName?: string; // Original filename for display
}

// Upload result from API
export interface PdfUploadResult {
  blobUrl: string;
  originalFileName: string;
  size: number;
  blobName: string;
}


export interface ExcelUploadResult {
  blobUrl: string;
  blobName: string;
  originalFileName: string;
  tempId: string;
  year?: number;
  month?: number;
}

export interface InvoiceData {
  company: string;
  branch: string;
  tcrsCompany: boolean;
  vendor: string;
  po: string;
  amount: number;
  currency: string;
  pdfFile?: File;
  pdfUrl?: string;
  pdfOriginalName?: string;
  pdfTempId?: string;
  blobName?: string;
}

export interface GLCodingEntry {
  accountCode: string;
  facilityCode: string;
  taxCode: string;
  amount: number;
  equipment: string;
  comments: string;
}

export interface DictionaryAccount {
  accountCode: string;
  accountCombined: string;
}

export interface DictionaryFacility {
  facilityCode: string;
  facilityCombined: string;
}