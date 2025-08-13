import { User } from "next-auth"
import { UserRole } from "@/types"
import { ROLE_DISPLAY_NAMES, USER_ROLES } from "@/constants"

// WARNING: This is a temporary implementation for POC
// In production, user roles should be fetched from database
export function getUserRole(user: User): UserRole {
  const email = user.email?.toLowerCase()
  console.log('User email:', email)

  if (!email) return USER_ROLES.REQUESTER
  
  // Environment-based role mapping for specific emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const approverEmails = process.env.APPROVER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const requesterEmails = process.env.REQUESTER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []

  if (adminEmails.includes(email)) {
    console.log('User is admin:', email)
    return USER_ROLES.ADMIN
  }
  
  if (approverEmails.includes(email)) {
    console.log('User is approver:', email)
    return USER_ROLES.APPROVER
  }

  if (requesterEmails.includes(email)) {
    console.log('User is requester:', email)
    return USER_ROLES.REQUESTER
  }

  // Default role
  return USER_ROLES.REQUESTER
}

export function getRoleDisplayName(role: UserRole): string {
  console.log('User role:', role)
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