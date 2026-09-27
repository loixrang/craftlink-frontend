# Craftlink Frontend Roadmap

Markers: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked.

## Foundation
- [x] FE-001 — Initialize React + TypeScript + Vite and quality tooling. Acceptance: dev/build/typecheck/lint/test foundations work; sensible source structure; no feature UI.
- [ ] FE-002 — Configure Tailwind and Craftlink design tokens/global styles. Acceptance: typography, colors, spacing, focus and responsive foundations.
- [ ] FE-003 — Core UI primitives and application shell. Acceptance: navigation/layout plus reusable buttons, inputs, badges, surfaces and loading/error/empty patterns.
- [ ] FE-004 — Router, TanStack Query and API-client foundation. Acceptance: route skeleton, query provider and safe API base URL configuration.
- [ ] FE-005 — Public landing page. Acceptance: polished responsive landing/category/discovery CTAs without fabricated metrics/testimonials.

## Authentication
- [ ] FE-AUTH-001 — Registration for customer/artisan with validation and API errors.
- [ ] FE-AUTH-002 — Login and authenticated state.
- [ ] FE-AUTH-003 — Protected routes and role-aware navigation/session restoration.

## Discovery
- [ ] FE-DISC-001 — Category browsing.
- [ ] FE-DISC-002 — Artisan search/results and filters.
- [ ] FE-DISC-003 — Manual location.
- [ ] FE-DISC-004 — Browser geolocation with permission/fallback UX.
- [ ] FE-DISC-005 — Sorting, pagination and result states.
- [ ] FE-DISC-006 — Artisan public profile: services, portfolio, safe credentials, rating, contacts, request CTA.

## Customer
- [ ] FE-CUST-001 — Customer dashboard.
- [ ] FE-CUST-002 — Create service request.
- [ ] FE-CUST-003 — Request history/detail/status.
- [ ] FE-CUST-004 — Eligible review/rating.
- [ ] FE-CUST-005 — Account/profile basics.

## Artisan
- [ ] FE-ART-001 — Artisan dashboard.
- [ ] FE-ART-002 — Profile editing.
- [ ] FE-ART-003 — Services management.
- [ ] FE-ART-004 — Portfolio management/upload.
- [ ] FE-ART-005 — Credential management/upload/status.
- [ ] FE-ART-006 — Location and availability settings.
- [ ] FE-ART-007 — Incoming request management.

## Admin
- [ ] FE-ADMIN-001 — Dashboard/statistics.
- [ ] FE-ADMIN-002 — User management.
- [ ] FE-ADMIN-003 — Artisan management.
- [ ] FE-ADMIN-004 — Category management.
- [ ] FE-ADMIN-005 — Credential verification.
- [ ] FE-ADMIN-006 — Reports/moderation.

## Quality/production
- [ ] FE-QA-001 — Accessibility/keyboard pass.
- [ ] FE-QA-002 — Responsive/mobile QA.
- [ ] FE-QA-003 — Loading/error/empty-state consistency.
- [ ] FE-QA-004 — Critical-flow tests.
- [ ] FE-PROD-001 — Vercel production configuration.
- [ ] FE-PROD-002 — README, env example and final developer docs.
