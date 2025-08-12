import { User } from "next-auth"
import { UserRole } from "@/types"
import { ROLE_DISPLAY_NAMES, USER_ROLES } from "@/constants"

// WARNING: This is a temporary implementation for POC
// In production, user roles should be fetched from database
export function getUserRole(user: User): UserRole {
  const email = user.email?.toLowerCase()
  
  if (!email) return 'requester'
  
  // Environment-based role mapping for specific emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const approverEmails = process.env.APPROVER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  
  if (adminEmails.includes(email)) {
    return 'admin'
  }
  
  if (approverEmails.includes(email)) {
    return 'approver'
  }
  
  // Fallback to pattern-based detection (less secure)
  if (email.includes('admin') || email.includes('administrator')) {
    return 'admin'
  }
  
  if (email.includes('manager') || email.includes('approver')) {
    return 'approver'
  }
  
  // Default role
  return 'requester'
}

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || 'User'
}

export function getRolePermissions(role: UserRole) {
  const permissions = {
    canCreateRequests: ([USER_ROLES.REQUESTER, USER_ROLES.ADMIN] as string[]).includes(role),
    canApproveRequests: ([USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]).includes(role),
    canViewAllRequests: ([USER_ROLES.ADMIN] as string[]).includes(role),
    canManageUsers: ([USER_ROLES.ADMIN] as string[]).includes(role),
    canExportData: ([USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]).includes(role),
    canAccessReports: ([USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]).includes(role)
  }
  
  return permissions
}

export function getHomeRoute(role: UserRole): string {
  // All roles go to dashboard for now
  return '/dashboard'
}

// Helper to get user-specific data based on role
export function getUserContext(user: User) {
  const role = getUserRole(user)
  const permissions = getRolePermissions(role)
  const displayName = getRoleDisplayName(role)
  
  return {
    role,
    permissions,
    displayName,
    email: user.email,
    name: user.name,
    image: user.image
  }
}