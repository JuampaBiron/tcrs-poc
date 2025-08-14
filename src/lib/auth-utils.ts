// src/lib/auth-utils.ts
import { User } from "next-auth"
import { UserRole } from "@/types"
import { ROLE_DISPLAY_NAMES, USER_ROLES } from "@/constants"

// Group IDs from Entra ID (configurar en .env.local)
const TCRS_ADMIN_GROUP_ID = process.env.TCRS_ADMIN_GROUP_ID
const TCRS_APPROVER_GROUP_ID = process.env.TCRS_APPROVER_GROUP_ID
const TCRS_REQUESTER_GROUP_ID = process.env.TCRS_REQUESTER_GROUP_ID

/**
 * Determina el rol del usuario basado en los grupos de Entra ID
 * @param user - Usuario de NextAuth con groups
 * @returns UserRole
 */
export function getUserRole(user: User): UserRole {
  const userGroups = user.groups || []
  const email = user.email?.toLowerCase()
  
  console.log('User email:', email)
  console.log('User groups:', userGroups)
  console.log('Configured group IDs:', {
    admin: TCRS_ADMIN_GROUP_ID,
    approver: TCRS_APPROVER_GROUP_ID,
    requester: TCRS_REQUESTER_GROUP_ID
  })

  // Verificar configuración de grupos
  if (!TCRS_ADMIN_GROUP_ID || !TCRS_APPROVER_GROUP_ID || !TCRS_REQUESTER_GROUP_ID) {
    console.error('Group IDs not properly configured in environment variables')
    throw new Error('Group configuration missing - contact administrator')
  }

  // Determinar rol basado en grupos (prioridad: Admin > Approver > Requester)
  if (userGroups.includes(TCRS_ADMIN_GROUP_ID)) {
    console.log('User is admin via group:', TCRS_ADMIN_GROUP_ID)
    return USER_ROLES.ADMIN
  }
  
  if (userGroups.includes(TCRS_APPROVER_GROUP_ID)) {
    console.log('User is approver via group:', TCRS_APPROVER_GROUP_ID)
    return USER_ROLES.APPROVER
  }

  if (userGroups.includes(TCRS_REQUESTER_GROUP_ID)) {
    console.log('User is requester via group:', TCRS_REQUESTER_GROUP_ID)
    return USER_ROLES.REQUESTER
  }

  // Si no está en ningún grupo específico, denegar acceso
  console.log('User not in any TCRS group, access denied')
  throw new Error('User not authorized - not in any TCRS group')
}

/**
 * LEGACY: Función de fallback para roles basados en email
 * Esta función se puede remover después de completar la migración
 * @param user - Usuario de NextAuth
 * @returns UserRole
 */
function getUserRoleByEmail(user: User): UserRole {
  const email = user.email?.toLowerCase()
  console.log('LEGACY: Using email-based role assignment for:', email)

  if (!email) return USER_ROLES.REQUESTER
  
  // Environment-based role mapping for specific emails (LEGACY)
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const approverEmails = process.env.APPROVER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const requesterEmails = process.env.REQUESTER_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []

  if (adminEmails.includes(email)) {
    console.log('LEGACY: User is admin via email:', email)
    return USER_ROLES.ADMIN
  }
  
  if (approverEmails.includes(email)) {
    console.log('LEGACY: User is approver via email:', email)
    return USER_ROLES.APPROVER
  }

  if (requesterEmails.includes(email)) {
    console.log('LEGACY: User is requester via email:', email)
    return USER_ROLES.REQUESTER
  }

  return USER_ROLES.REQUESTER
}

/**
 * Verifica si un usuario pertenece a un grupo específico
 * @param user - Usuario de NextAuth
 * @param groupId - Object ID del grupo en Entra ID
 * @returns boolean
 */
export function userBelongsToGroup(user: User, groupId: string): boolean {
  const userGroups = user.groups || []
  return userGroups.includes(groupId)
}

/**
 * Obtiene todos los grupos del usuario
 * @param user - Usuario de NextAuth
 * @returns string[] - Array de Object IDs de grupos
 */
export function getUserGroups(user: User): string[] {
  return user.groups || []
}

/**
 * Verifica si el usuario tiene permisos de admin
 * @param user - Usuario de NextAuth
 * @returns boolean
 */
export function isAdmin(user: User): boolean {
  return TCRS_ADMIN_GROUP_ID ? userBelongsToGroup(user, TCRS_ADMIN_GROUP_ID) : false
}

/**
 * Verifica si el usuario tiene permisos de approver o admin
 * @param user - Usuario de NextAuth
 * @returns boolean
 */
export function canApprove(user: User): boolean {
  if (!TCRS_ADMIN_GROUP_ID || !TCRS_APPROVER_GROUP_ID) return false
  
  return userBelongsToGroup(user, TCRS_ADMIN_GROUP_ID) || 
         userBelongsToGroup(user, TCRS_APPROVER_GROUP_ID)
}

// Funciones existentes que permanecen igual
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
    image: user.image,
    groups: user.groups // Incluir groups en el contexto
  }
}