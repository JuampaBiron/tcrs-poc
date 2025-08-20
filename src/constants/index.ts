// src/constants/index.ts

// Application constants
export const USER_ROLES = {
  REQUESTER: "requester",
  APPROVER: "approver",
  ADMIN: "admin",
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  PDF: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf'],
    MIME_TYPE: 'application/pdf'
  }
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
  DICTIONARIES: "/api/dictionaries",
  UPLOAD_PDF: "/api/invoices/upload-pdf",
} as const;

// Azure Blob Storage constants
export const AZURE_STORAGE = {
  CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME || 'invoices-pdf',
  BASE_URL: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
} as const;

// File upload error messages
export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_TYPE: 'Only PDF files are allowed',
  UPLOAD_FAILED: 'Failed to upload PDF to storage',
  NO_FILE: 'No file provided',
} as const;

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/",
  REQUEST: "/request",
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

// ✅ NUEVAS CONSTANTES: COMPANIES Y BRANCHES
export const COMPANIES = {
  TCRS: "TCRS",
  SITECH: "Sitech", 
  FUSED_CA: "Fused CA",
} as const;

export const CURRENCIES = {
  CAD: "CAD",
  USD: "USD", 
  EUR: "EUR",
} as const;

export const FILTER_OPTIONS = {
  COMPANIES: [
    { value: COMPANIES.TCRS, label: "TCRS" },
    { value: COMPANIES.SITECH, label: "Sitech" },
    { value: COMPANIES.FUSED_CA, label: "Fused CA" },
  ],
  BRANCHES: [
    { value: "branch1", label: "TCRS - Branch 1" },
    { value: "branch2", label: "TCRS - Branch 2" },
    { value: "branch3", label: "TCRS - Branch 3" },
    { value: "sitech", label: "Sitech" },
    { value: "fused-canada", label: "Fused-Canada" },
    { value: "fused-uk", label: "Fused-UK" },
  ],
  CURRENCIES: [
    { value: CURRENCIES.CAD, label: "Canadian Dollar (CAD)" },
    { value: CURRENCIES.USD, label: "US Dollar (USD)" },
    { value: CURRENCIES.EUR, label: "Euro (EUR)" },
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

// ✅ MINIMAL FALLBACKS PARA DESARROLLO (solo si falla la DB)
export const DICTIONARY_FALLBACKS = {
  companies: [
    { code: "TCRS", description: "TCRS" },
    { code: "Sitech", description: "Sitech" },
    { code: "Fused CA", description: "Fused CA" },
  ],
  branches: [
    { code: "Branch 1", description: "Branch 1" },
    { code: "Branch 2", description: "Branch 2" },
  ],
  currencies: [
    { code: CURRENCIES.CAD, name: "Canadian Dollar" },
    { code: CURRENCIES.USD, name: "US Dollar" },
    { code: CURRENCIES.EUR, name: "Euro" },
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

export const VALID_COMPANIES = [
  COMPANIES.TCRS,
  COMPANIES.SITECH,
  COMPANIES.FUSED_CA,
] as const;

export const VALID_CURRENCIES = [
  CURRENCIES.CAD,
  CURRENCIES.USD,
  CURRENCIES.EUR,
] as const;

// Helper functions for validation
export const isValidUserRole = (
  role: string | null | undefined
): role is (typeof USER_ROLES)[keyof typeof USER_ROLES] => {
  if (!role) {
    return false;
  }
  return VALID_USER_ROLES.includes(role as any);
};

export const isValidRequestStatus = (
  status: string | null | undefined
): status is (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS] => {
  if (!status) {
    return false;
  }
  return VALID_REQUEST_STATUSES.includes(status as any);
};

export const isValidCompany = (
  company: string | null | undefined
): company is (typeof COMPANIES)[keyof typeof COMPANIES] => {
  if (!company) {
    return false;
  }
  return VALID_COMPANIES.includes(company as any);
};

export const isValidCurrency = (
  currency: string | null | undefined
): currency is (typeof CURRENCIES)[keyof typeof CURRENCIES] => {
  if (!currency) {
    return false;
  }
  return VALID_CURRENCIES.includes(currency as any);
};