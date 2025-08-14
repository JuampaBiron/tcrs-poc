// src/constants/index.ts
// Application constants
export const USER_ROLES = {
  REQUESTER: "requester",
  APPROVER: "approver",
  ADMIN: "admin",
} as const;
 
export const REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  IN_REVIEW: "in-review",
} as const;
 
export const API_ROUTES = {
  REQUESTS: "/api/requests",
  STATS: "/api/stats",
  EXPORT: "/api/export",
  AUTH: "/api/auth",
} as const;
 
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/",
} as const;
 
export const STATUS_COLORS = {
  [REQUEST_STATUS.PENDING]: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Pending",
  },
  [REQUEST_STATUS.IN_REVIEW]: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "In Review",
  },
  [REQUEST_STATUS.APPROVED]: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Approved",
  },
  [REQUEST_STATUS.REJECTED]: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Rejected",
  },
} as const;
 
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.REQUESTER]: "Requester",
  [USER_ROLES.APPROVER]: "Approver",
  [USER_ROLES.ADMIN]: "Administrator",
} as const;
 
export const DATE_FORMATS = {
  SHORT: "MM/dd/yy",
  LONG: "MMMM dd, yyyy",
  ISO: "yyyy-MM-dd",
} as const;
 
export const FILTER_OPTIONS = {
  BRANCHES: [
    { value: "branch1", label: "TCRS - Branch 1" },
    { value: "branch2", label: "TCRS - Branch 2" },
    { value: "branch3", label: "TCRS - Branch 3" },
    { value: "sitech", label: "Sitech" },
    { value: "fused-canada", label: "Fused-Canada" },
    { value: "fused-uk", label: "Fused-UK" },
  ],
  AMOUNTS: [
    { value: "0-1000", label: "$0 - $1,000" },
    { value: "1000-5000", label: "$1,000 - $5,000" },
    { value: "5000-10000", label: "$5,000 - $10,000" },
    { value: "10000+", label: "$10,000+" },
  ],
  DATE_RANGES: [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
  ],
  STATUSES: [
    { value: REQUEST_STATUS.PENDING, label: "Pending" },
    { value: REQUEST_STATUS.APPROVED, label: "Approved" },
    { value: REQUEST_STATUS.REJECTED, label: "Rejected" },
    { value: REQUEST_STATUS.IN_REVIEW, label: "In Review" },
  ],
} as const;
 
// Validation arrays for runtime checks
export const VALID_USER_ROLES = [
  USER_ROLES.REQUESTER,
  USER_ROLES.APPROVER,
  USER_ROLES.ADMIN,
] as const;
 
export const VALID_REQUEST_STATUSES = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.APPROVED,
  REQUEST_STATUS.REJECTED,
  REQUEST_STATUS.IN_REVIEW,
] as const;
 
// Helper functions for validation
export const isValidUserRole = (
  role: string | null | undefined
): role is (typeof USER_ROLES)[keyof typeof USER_ROLES] => {
  if (!role) {
    return false; // A null or undefined role is not a valid role.
  }
  return VALID_USER_ROLES.includes(
    role as (typeof USER_ROLES)[keyof typeof USER_ROLES]
  );
};
 
export const isValidRequestStatus = (
  status: string
): status is (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS] => {
  return VALID_REQUEST_STATUSES.includes(
    status as (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS]
  );
};
 
// CSS Classes for status styling (centralized)
export const STATUS_BADGE_CLASSES = {
  [REQUEST_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [REQUEST_STATUS.IN_REVIEW]: "bg-blue-100 text-blue-800",
  [REQUEST_STATUS.APPROVED]: "bg-green-100 text-green-800",
  [REQUEST_STATUS.REJECTED]: "bg-red-100 text-red-800",
} as const;
 
// Role-based styling
export const ROLE_BADGE_CLASSES = {
  [USER_ROLES.REQUESTER]: "bg-blue-100 text-blue-800",
  [USER_ROLES.APPROVER]: "bg-purple-100 text-purple-800",
  [USER_ROLES.ADMIN]: "bg-red-100 text-red-800",
} as const;
 
export const ERROR_MESSAGES = {
  GENERIC: "An unexpected error occurred. Please try again.",
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  VALIDATION: "Please check the provided information.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
} as const;
 
export const SUCCESS_MESSAGES = {
  REQUEST_APPROVED: "Request approved successfully",
  REQUEST_REJECTED: "Request rejected successfully",
  REQUEST_CREATED: "Request created successfully",
  DATA_EXPORTED: "Data exported successfully",
} as const;
 