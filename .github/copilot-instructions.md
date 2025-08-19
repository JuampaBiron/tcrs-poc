# Copilot Instructions for TCRS POC

## 🏗️ Project Architecture
- **Frontend:** Next.js App Router (TypeScript, Tailwind CSS)
- **Backend:** Next.js API Routes (see `src/app/api/`)
- **Database:** Neon PostgreSQL, accessed via Drizzle ORM (`src/db/`)
- **Authentication:** NextAuth.js 5 with Microsoft Entra ID (`src/auth.ts`)
- **Component Structure:**
  - `src/components/ui/` — Reusable UI primitives (e.g., `LoadingSpinner`, `ErrorMessage`, `StatusBadge`)
  - `src/components/auth/` — Auth-related components
  - `src/components/common/` — Cross-domain shared components
  - `src/components/dashboard/` — Dashboard-specific business components
  - **NEVER** create components outside this structure
- **Constants:** All roles, statuses, and filter options are defined in `src/constants/index.ts`. Types in `src/types/` must derive from these constants.

## 🚨 CRITICAL CODING RULES
- **NEVER** use hardcoded role/status strings. Always import from `@/constants`.
- Types must derive from constants, not the other way around.
- Use validation helpers (`isValidUserRole`, `isValidRequestStatus`) from `@/constants` for all role/status checks.
- All security config (domains, emails, secrets) must be in environment variables, never hardcoded.
- **NO** direct API calls in components. Use custom hooks from `/src/hooks` and the centralized API client in `/src/lib/api-client`.
- **NEVER** fetch data directly in components; always use hooks (e.g., `useDashboardData`).
- **NO** inline type definitions for roles/statuses.
- **NO** deep relative imports (`../../../`). Use absolute imports from `@/`.

## 🧩 Developer Workflow
- **Start dev server:** `npm run dev`
- **Build:** `npm run build` (must pass without errors)
- **Lint:** `npm run lint`
- **Database:**
  - Generate migrations: `npm run db:generate`
  - Run migrations: `npm run db:migrate`
  - Seed: `npm run db:seed`
  - Reset: `npm run db:reset`
- **Testing:** (infra missing, see `CODE_REVIEW.md` for recommendations)

## 🔗 Integration & Data Flow
- **API routes** in `src/app/api/` handle all backend logic. Use centralized error/response helpers from `src/lib/error-handler`.
- **Role-based data access**: All API routes and queries must validate user role using constants and helpers.
- **Database queries**: Centralized in `src/db/queries.ts`. Never query directly in components.
- **Business logic**: Approval workflow, role-based access, and workflow tracking are handled in backend and surfaced via hooks.

## 🎨 UI/UX & Performance
- Use centralized UI components for status, loading, and error states.
- Keep components under 100 lines; split if larger.
- Use `useCallback`/`useMemo` for performance.
- Use dynamic imports for large components if needed.

## 🚫 FORBIDDEN PRACTICES
- Hardcoded roles/statuses/domains/emails
- Inline type definitions for roles/statuses
- Direct API calls in components
- Components over 100 lines
- Deep relative imports
- Client-side role authorization
- Unhandled errors or silent failures

## 💡 Quick Reference
- Update constants in `/src/constants` first; types auto-derive
- Use hooks for all data fetching
- Check `CLAUDE.md` and `CODE_REVIEW.md` for patterns and anti-patterns
- Always validate roles/statuses server-side
- Maintain folder structure and naming conventions

---

**If any section is unclear or incomplete, please ask for clarification or request more examples from the codebase.**
