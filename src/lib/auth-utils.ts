// src/lib/auth-utils.ts
import { ROLE_DISPLAY_NAMES, USER_ROLES } from "@/constants";
import { UserRole } from "@/types";
import { User } from "next-auth";
 
// Group IDs from Entra ID (configurar en .env.local)
const TCRS_ADMIN_GROUP_ID = process.env.TCRS_ADMIN_GROUP_ID;
const TCRS_APPROVER_GROUP_ID = process.env.TCRS_APPROVER_GROUP_ID;
const TCRS_REQUESTER_GROUP_ID = process.env.TCRS_REQUESTER_GROUP_ID;
 
/**
 * Determina el rol del usuario basado en los grupos de Entra ID
 * @param user - Usuario de NextAuth con groups
 * @returns UserRole
 */
export function getUserRole(user: User): UserRole {
  // Get the group IDs from environment variables.
  const {
    TCRS_ADMIN_GROUP_ID,
    TCRS_APPROVER_GROUP_ID,
    TCRS_REQUESTER_GROUP_ID,
  } = process.env;
 
  // Check if all required variables are present. If not, throw a clear error.
  // This makes debugging deployment issues much easier.
  if (
    !TCRS_ADMIN_GROUP_ID ||
    !TCRS_APPROVER_GROUP_ID ||
    !TCRS_REQUESTER_GROUP_ID
  ) {
    console.error(
      "🔴 CRITICAL ERROR: Missing TCRS Group ID environment variables."
    );
    console.error(
      "Please ensure TCRS_ADMIN_GROUP_ID, TCRS_APPROVER_GROUP_ID, and TCRS_REQUESTER_GROUP_ID are set in your .env.local or deployment environment."
    );
    // This error will stop the process and be clearly visible in logs.
    throw new Error(
      "Server configuration error: Missing required application settings for user roles."
    );
  }
 
  const userGroups = user.groups || [];
  console.log(
    `🔍 Checking roles for user: ${user.email} with groups:`,
    userGroups.length
  );
 
  // Because of the check above, TypeScript now knows these variables are `string`.
  // The TypeScript errors on the .includes() calls will now be gone.
  if (userGroups.includes(TCRS_ADMIN_GROUP_ID)) {
    console.log(`✅ Role assigned: ADMIN for user ${user.email}`);
    return USER_ROLES.ADMIN;
  }
 
  if (userGroups.includes(TCRS_APPROVER_GROUP_ID)) {
    console.log(`✅ Role assigned: APPROVER for user ${user.email}`);
    return USER_ROLES.APPROVER;
  }
 
  if (userGroups.includes(TCRS_REQUESTER_GROUP_ID)) {
    console.log(`✅ Role assigned: REQUESTER for user ${user.email}`);
    return USER_ROLES.REQUESTER;
  }
 
  // If the user is in none of the required groups, deny access.
  console.warn(
    `🚫 User ${user.email} is not in any required TCRS group. Access denied.`
  );
  throw new Error(
    "User not authorized - not a member of any required TCRS group"
  );
}
 
/**
 * Verifica si un usuario pertenece a un grupo específico
 * @param user - Usuario de NextAuth
 * @param groupId - Object ID del grupo en Entra ID
 * @returns boolean
 */
export function userBelongsToGroup(user: User, groupId: string): boolean {
  const userGroups = user.groups || [];
  return userGroups.includes(groupId);
}
 
/**
 * Obtiene todos los grupos del usuario
 * @param user - Usuario de NextAuth
 * @returns string[] - Array de Object IDs de grupos
 */
export function getUserGroups(user: User): string[] {
  return user.groups || [];
}
 
/**
 * Verifica si el usuario tiene permisos de admin
 * @param user - Usuario de NextAuth
 * @returns boolean
 */
export function isAdmin(user: User): boolean {
  return TCRS_ADMIN_GROUP_ID
    ? userBelongsToGroup(user, TCRS_ADMIN_GROUP_ID)
    : false;
}
 
/**
 * Verifica si el usuario tiene permisos de approver o admin
 * @param user - Usuario de NextAuth
 * @returns boolean
 */
export function canApprove(user: User): boolean {
  if (!TCRS_ADMIN_GROUP_ID || !TCRS_APPROVER_GROUP_ID) return false;
 
  return (
    userBelongsToGroup(user, TCRS_ADMIN_GROUP_ID) ||
    userBelongsToGroup(user, TCRS_APPROVER_GROUP_ID)
  );
}
 
// Funciones existentes que permanecen igual
/**
 * Gets a user-friendly display name for a role.
 * @param role UserRole
 * @returns string
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || "User";
}
 
/**
 * Gets the permissions associated with a user role.
 * @param role UserRole
 * @returns UserPermissions object
 */
export function getRolePermissions(role: UserRole) {
  const permissions = {
    canCreateRequests: (
      [USER_ROLES.REQUESTER, USER_ROLES.ADMIN] as string[]
    ).includes(role),
    canApproveRequests: (
      [USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]
    ).includes(role),
    canViewAllRequests: ([USER_ROLES.ADMIN] as string[]).includes(role),
    canManageUsers: ([USER_ROLES.ADMIN] as string[]).includes(role),
    canExportData: (
      [USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]
    ).includes(role),
    canAccessReports: (
      [USER_ROLES.APPROVER, USER_ROLES.ADMIN] as string[]
    ).includes(role),
  };
  return permissions;
}
 
export function getHomeRoute(role: UserRole): string {
  // All roles go to dashboard for now
  return "/dashboard";
}
 
/**
 * Builds a user context object containing role, permissions, and user info.
 * @param user NextAuth User object
 * @returns UserContext object
 */
export function getUserContext(user: User) {
  const role = getUserRole(user);
  const permissions = getRolePermissions(role);
  const displayName = getRoleDisplayName(role);
 
  return {
    role,
    permissions,
    displayName,
    email: user.email,
    name: user.name,
    image: user.image,
    groups: user.groups,
  };
}