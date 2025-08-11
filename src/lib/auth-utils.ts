import { User } from "next-auth"

export type UserRole = 'requester' | 'approver' | 'admin'

// Mock function to determine user role based on email
// In production, this would come from database or external system
export function getUserRole(user: User): UserRole {
  const email = user.email?.toLowerCase()
  
  if (!email) return 'requester'
  
  // Define role mapping based on email patterns
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
  const roleNames: Record<UserRole, string> = {
    'requester': 'Requester',
    'approver': 'Approver', 
    'admin': 'Administrator'
  }
  return roleNames[role] || 'User'
}

export function getRolePermissions(role: UserRole) {
  const permissions = {
    canCreateRequests: ['requester', 'admin'].includes(role),
    canApproveRequests: ['approver', 'admin'].includes(role),
    canViewAllRequests: ['admin'].includes(role),
    canManageUsers: ['admin'].includes(role),
    canExportData: ['approver', 'admin'].includes(role),
    canAccessReports: ['approver', 'admin'].includes(role)
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