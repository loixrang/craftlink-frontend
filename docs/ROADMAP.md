# Craftlink Frontend Roadmap

Markers:
`[ ]` not started
`[~]` in progress
`[x]` complete
`[!]` blocked
`[D]` deferred ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â not required for the current defense milestone; AI must skip this task when selecting the next feature.

## Foundation
- [x] FE-001 - Initialize React + TypeScript + Vite and quality tooling. Acceptance: dev/build/typecheck/lint/test foundations work; sensible source structure; no feature UI.
- [x] FE-002 - Configure Tailwind and Craftlink design tokens/global styles. Acceptance: typography, colors, spacing, focus and responsive foundations.
- [x] FE-003 - Core UI primitives and application shell. Acceptance: navigation/layout plus reusable buttons, inputs, badges, surfaces and loading/error/empty patterns.
- [x] FE-004 - Router, TanStack Query and API-client foundation. Acceptance: route skeleton, query provider and safe API base URL configuration.
- [x] FE-005 - Public landing page. Acceptance: polished responsive landing/category/discovery CTAs without fabricated metrics/testimonials.

## Authentication
- [x] FE-AUTH-001 - Registration for customer/artisan with validation and API errors.
- [x] FE-AUTH-002 - Login and authenticated state.
- [x] FE-AUTH-003 - Protected routes and role-aware navigation/session restoration.

## Discovery
- [x] FE-DISC-001 - Category browsing.
- [x] FE-DISC-002 - Artisan search/results and filters.
- [x] FE-DISC-003 - Manual location.
- [x] FE-DISC-004 - Browser geolocation with permission/fallback UX.
- [x] FE-DISC-005 - Sorting, pagination and result states.
- [x] FE-DISC-006 - Artisan public profile: services, portfolio, safe credentials, rating, contacts, request CTA.

## Customer
- [x] FE-CUST-001 - Customer dashboard.
- [x] FE-CUST-002 - Create service request.
- [x] FE-CUST-003 - Request history/detail/status.
- [x] FE-CUST-004 - Eligible review/rating.
- [D] FE-CUST-005 - Account/profile basics.

## Artisan
- [x] FE-ART-001 - Artisan dashboard.
- [x] FE-ART-002 - Artisan profile management: profile editing, services management, and location/availability settings.
- [x] FE-ART-003 - Artisan portfolio and credential management: portfolio uploads, credential uploads, and verification status.
- [x] FE-ART-004 - Incoming service request management.

## Admin
- [x] FE-ADMIN-001 - Admin dashboard/statistics and credential verification.
- [D] FE-ADMIN-002 - User management.
- [D] FE-ADMIN-003 - Artisan management.
- [D] FE-ADMIN-004 - Category management.
- [D] FE-ADMIN-005 - Reports/moderation.

## Quality/production
- [ ] FE-QA-001 - Accessibility/keyboard, responsive/mobile, and loading/error/empty-state QA pass.
- [D] FE-QA-002 - Critical-flow tests.
- [ ] FE-PROD-001 - Vercel production configuration, README, env example, and final developer docs.
