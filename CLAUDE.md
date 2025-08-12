# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL CODING RULES (MUST FOLLOW)

### 1. NEVER Use Hardcoded Values
- **FORBIDDEN**: Direct role strings like `'admin'`, `'pending'`, etc.
- **REQUIRED**: Always use constants from `/src/constants`
```typescript
// ✅ CORRECT
import { USER_ROLES, REQUEST_STATUS } from '@/constants'
case USER_ROLES.ADMIN:
if (status === REQUEST_STATUS.PENDING)

// ❌ WRONG - NEVER DO THIS
case 'admin':
if (status === 'pending')
```

### 2. Component Size Limits
- **Maximum 200 - 250 lines per component**
- If larger, split into smaller components
- Use custom hooks for complex logic

### 3. Security Rules
- **NO hardcoded domains, emails, or secrets**
- All security configs must be in environment variables
- Server-side validation ONLY for roles/permissions
- Use `isValidUserRole()` and `isValidRequestStatus()` from constants

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build production application (must pass without errors)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Database Management
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Full database reset (generate, migrate, seed)
- `npm run db:push` - Push schema changes to database

## 🏗️ MANDATORY Folder Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (LoadingSpinner, ErrorMessage, StatusBadge)
│   ├── auth/            # Authentication components (SignInButton, LoginRedirect, etc.)
│   ├── common/          # Cross-domain shared components (FinningLogo, SignOutButton)
│   └── dashboard/       # Dashboard-specific business components
├── constants/           # ALL constants, roles, statuses, validation functions
├── types/               # Shared TypeScript interfaces and types
├── lib/                 # Utilities (auth-utils, api-client, error-handler)
├── hooks/               # Custom React hooks (useDashboardData)
└── app/                 # Next.js App Router pages and API routes
```

**NEVER** create components outside this structure. **ALWAYS** follow this organization.

## Architecture Overview

### Authentication System
- Uses NextAuth.js 5 with Microsoft Entra ID provider
- Authentication configured in `src/auth.ts`
- **SECURITY**: Domain restrictions via `ALLOWED_EMAIL_DOMAINS` environment variable
- Role assignments via `ADMIN_EMAILS` and `APPROVER_EMAILS` environment variables
- Session management with Drizzle adapter for database persistence

### Database Architecture (PostgreSQL with Drizzle ORM)
- **NextAuth Tables**: Standard user, account, session, verification token tables
- **TCRS Business Domain**:
  - `approval_requests` - Core approval workflow requests
  - `invoice_data` - Invoice information linked to requests
  - `approver_list` - Authorized approvers with amount limits
  - `workflow_steps` & `workflow_history` - Detailed process tracking
  - `gl_coding_*` tables - GL coding data and file uploads
  - `tiff_file_generation` - File generation tracking

### Application Structure
- **Next.js 15 App Router** with TypeScript
- **Authentication Flow**:
  - Landing page (`src/app/page.tsx`) handles login
  - Dashboard (`src/app/dashboard/page.tsx`) for authenticated users
  - Middleware (`src/middleware.ts`) protects routes
- **NEW Component Architecture** (Updated):
  - `src/components/auth/` - Authentication components (moved from login-page)
  - `src/components/common/` - Shared cross-domain components
  - `src/components/ui/` - Reusable UI primitives
  - `src/components/dashboard/` - Dashboard-specific components
- **API Routes**:
  - `/api/auth/[...auth]` - NextAuth endpoints
  - `/api/requests` - Request management (with role validation)
  - `/api/stats` - Dashboard statistics (with role validation)
  - `/api/export` - Data export functionality

### Database Queries
- Centralized in `src/db/queries.ts`
- Role-based data filtering (requester, approver, admin views)
- Request lifecycle management functions
- Workflow tracking and audit trail queries

### Key Business Logic
- **Request Approval Flow**: Three-state approval process (pending → approved/rejected)
- **Role-Based Access**: Different views for requesters vs approvers
- **Workflow Tracking**: Detailed step-by-step process logging with performance metrics
- **File Management**: TIFF generation and GL coding file uploads

## 🛡️ Security & Environment Configuration

### Required Environment Variables
```env
# Authentication
AUTH_SECRET=your_nextauth_secret
AUTH_MICROSOFT_ENTRA_ID_ID=your_client_id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your_client_secret

# Security (CRITICAL - NO HARDCODING)
ALLOWED_EMAIL_DOMAINS=@domain1.com,@domain2.com
ADMIN_EMAILS=admin@domain.com,admin2@domain.com
APPROVER_EMAILS=manager@domain.com,approver@domain.com

# Database
DATABASE_URL=your_postgresql_connection_string
```

### Security Rules for Development
1. **NEVER** commit hardcoded domains or emails
2. **ALWAYS** validate user roles server-side
3. **USE** environment variables for all security configs
4. **VALIDATE** all API inputs with TypeScript guards

## 📋 Data Management Rules

### Constants Usage (MANDATORY)
```typescript
// ALWAYS import and use constants
import { 
  USER_ROLES, 
  REQUEST_STATUS, 
  FILTER_OPTIONS,
  isValidUserRole,
  isValidRequestStatus 
} from '@/constants'

// Components should use FILTER_OPTIONS for dropdowns
{FILTER_OPTIONS.STATUSES.map(status => (
  <option key={status.value} value={status.value}>
    {status.label}
  </option>
))}
```

### API Development Pattern
```typescript
// ALWAYS use this pattern for API routes
import { createSuccessResponse, createErrorResponse, ValidationError } from '@/lib/error-handler'
import { USER_ROLES, isValidUserRole } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    // Validate inputs
    if (!isValidUserRole(role)) {
      throw new ValidationError('Invalid role')
    }
    
    // Use constants for role checking
    switch (role) {
      case USER_ROLES.ADMIN:
        // logic
        break
    }
    
    return createSuccessResponse({ data })
  } catch (error) {
    return createErrorResponse(error)
  }
}
```

## 🧩 Component Development Rules

### Component Structure
```typescript
// ALWAYS follow this import order:
// 1. External libraries
import { useState } from 'react'
import { User } from 'next-auth'

// 2. Internal types and constants
import { UserRole, FilterState } from '@/types'
import { USER_ROLES, STATUS_COLORS } from '@/constants'

// 3. Utilities and services  
import { getUserRole } from '@/lib/auth-utils'
import { apiClient } from '@/lib/api-client'

// 4. Components (ui -> common -> specific)
import LoadingSpinner from '@/components/ui/loading-spinner'
import FinningLogo from '@/components/common/finning-logo'
```

### Data Fetching Rules
- **NEVER** fetch data directly in components
- **ALWAYS** use custom hooks from `/src/hooks`
- **USE** centralized API client from `/src/lib/api-client`

```typescript
// ✅ CORRECT
const { data, loading, error, refetch } = useDashboardData({ userRole, userEmail })

// ❌ WRONG
useEffect(() => {
  fetch('/api/endpoint').then(...)
}, [])
```

### Error Handling
- **NEVER** use `window.location.reload()`
- **ALWAYS** provide user feedback for errors
- **USE** loading states for async operations
- **IMPLEMENT** retry mechanisms

## 🎨 UI/UX Standards

### Status Display
```typescript
// ALWAYS use centralized status badge
import StatusBadge from '@/components/ui/status-badge'
<StatusBadge status={request.status} />

// NEVER create inline status display
```

### Loading & Error States
```typescript
// ALWAYS use centralized components
import LoadingSpinner from '@/components/ui/loading-spinner'
import ErrorMessage from '@/components/ui/error-message'

if (loading) return <LoadingSpinner size="lg" text="Loading..." />
if (error) return <ErrorMessage message={error} onRetry={refetch} />
```

## 🚀 Performance Requirements

### Component Performance
- Components must be under 100 lines
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive calculations
- Implement proper dependency arrays

### Bundle Optimization
- Import only needed utilities
- Use dynamic imports for large components
- Keep components small and focused

## ✅ Quality Assurance

### Build Requirements
- `npm run build` must pass without TypeScript errors
- Only warnings allowed (no critical errors)
- All imports must resolve correctly

### Code Quality
- ESLint configuration with Next.js rules
- TypeScript strict mode enabled
- Consistent naming conventions
- Proper error boundaries

## 🚫 FORBIDDEN Practices

- ❌ Hardcoded roles: `'admin'`, `'pending'`, etc.
- ❌ Components over 100 lines
- ❌ Direct API calls in components
- ❌ `window.location.reload()` for updates
- ❌ Unhandled errors or silent failures
- ❌ Mixed folder organization
- ❌ Deep relative imports (`../../../`)
- ❌ Hardcoded security values
- ❌ Client-side role authorization

## 💡 Quick Reference

### When Adding New Features
1. Check if constants need updates (`/src/constants`)
2. Add TypeScript types (`/src/types`)
3. Create reusable components in correct folder
4. Use custom hooks for data fetching
5. Implement proper error handling
6. Test with `npm run build`

### When Fixing Issues
1. Check CODE_REVIEW.md for known patterns
2. Use centralized constants and utilities
3. Follow security rules
4. Maintain folder structure
5. Keep components small and focused

**This project prioritizes security, maintainability, and developer experience. Always follow these patterns for consistent, scalable code.**