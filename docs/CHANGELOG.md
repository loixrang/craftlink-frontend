# Changelog

Concise AI-assisted implementation history. Git remains the source of code history.

## Unreleased

### 2026-09-27 â€” FE-004

- Added React Router route skeletons for public/auth/dashboard families, router-aware shell navigation and not-found recovery.
- Added a stable TanStack Query provider with bounded transient-error query retries and no automatic mutation retries.
- Added a centralized typed JSON API client with validated public base URL configuration, contract envelopes/pagination, explicit bearer support, cancellation and normalized HTTP/network errors. Added .env.example and API_FOUNDATION.md usage notes.
- Verified all 49 tests, lint, typecheck, production build and diff whitespace check. Dependency installation audit: zero vulnerabilities. Tests mock HTTP; live backend integration and browser visual inspection were not performed.
- FE-005 remains unstarted. No API contract, product scope, architecture or deployment changes.

### 2026-09-27 â€” FE-003

- Added responsive header/navigation/main/footer, skip link, mobile menu disclosure and Escape focus restoration.
- Added typed buttons, labeled inputs, badges, surfaces and loading/error/empty/success feedback; installed Lucide. Documented usage in UI_COMPONENTS.md.
- Verified seven tests, lint, typecheck, production build and diff whitespace check. Installation audit: zero vulnerabilities. Browser visual/layout inspection was not performed.
- FE-004 remains unstarted. No API, product scope or architecture changes.

### 2026-09-27 Ã¢â‚¬â€ FE-001

- Initialized React 19, TypeScript 6 and Vite 8 with a minimal neutral application shell and no feature UI.
- Added strict TypeScript, ESLint with React Hooks/Fast Refresh rules, Vitest 5, jsdom and React Testing Library; added one passing render smoke test.
- Added locked dependencies, development/build/preview/typecheck/lint/test scripts, generated/private artifact ignores and local development instructions.
- Verified clean `npm.cmd ci` (zero reported vulnerabilities), typecheck, lint, tests and production build. Development server and production preview returned HTTP 200; Vite served the transformed React entry.
- FE-002 and subsequent features remain unstarted. No API or architecture changes.

### 2026-09-27 â€” FE-002

- Integrated Tailwind through its Vite plugin and locked build dependencies.
- Added semantic warm-neutral/charcoal/amber tokens, system typography, spacing, content widths, restrained radii/shadow, keyboard focus and forced-color support.
- Applied mobile-first utilities to the existing bootstrap screen and documented usage in DESIGN_FOUNDATION.md.
- Verified typecheck, lint, render smoke test (1 test), production build, emitted responsive/theme/focus CSS and numeric contrast ratios (normal text pairs exceed 4.5:1). Install reported zero audit vulnerabilities.
- No browser visual/layout inspection performed. FE-003 remains unstarted; no API, product scope or architecture changes.

### 2026-09-27 â€” FE-005

- Replaced the home placeholder with a responsive public landing page: hero/discovery CTAs, eight contract-listed service categories, three explanatory steps and artisan registration CTA.
- Used existing warm-neutral/amber design tokens, semantic sections, Lucide icons and keyboard-accessible links; no fabricated metrics, testimonials or verification claims.
- Category links preserve service names with the supported q search parameter. Discovery and registration remain placeholders owned by later features; no API integration added.
- Added five focused tests for landing semantics and CTA/category navigation, and updated shell route tests. All 54 tests, typecheck, lint, production build and whitespace check pass. Browser visual inspection was not performed.
- Marked FE-005 complete. FE-AUTH-001 remains unstarted; no API contract, product scope, architecture or deployment changes.
### 2026-09-27 — FE-AUTH-001

- Added customer/artisan registration with React Hook Form, Zod validation, password confirmation and accessible native controls using existing design tokens.
- Added the contract registration service and TanStack mutation with exact payload fields, duplicate-submit protection, pending/success states and deliberate conflict/validation/rate-limit/network/server error handling.
- Credentials are not stored as mutation variables; returned tokens are discarded. Login/session state remains for later features. Documented behavior and contract password-policy limits in REGISTRATION.md.
- Verified all 64 tests (10 registration tests), lint, typecheck, production build and git diff --check. Dependency installation reported zero vulnerabilities. Mocked HTTP only; live backend integration and visual browser inspection were not performed.
- Marked FE-AUTH-001 complete. FE-AUTH-002 remains unstarted. No API contract, architecture, product scope or deployment changes.
### 2026-09-27 — FE-AUTH-002

- Added validated login with the exact contract payload, accessible pending/error/success states, duplicate prevention and corrected retries.
- Added runtime login-response validation and shared in-memory authentication for all three roles. Navigation retains the session; local sign-out clears authentication and server-state caches. Tokens and passwords are not written to browser storage or mutation results.
- Added 15 focused tests; all 79 tests, lint, typecheck and production build pass. Documented behavior and response-shape assumptions in LOGIN.md. HTTP is mocked; live backend integration and browser visual inspection were not performed.
- Marked FE-AUTH-002 complete. Session restoration, route guards and role-aware navigation remain in unstarted FE-AUTH-003. No API contract, architecture, product scope or deployment changes.

### 2026-09-28 - FE-AUTH-003

- Protected customer/artisan/admin route families with exact-role checks, anonymous login redirects, safe return paths and access-denied recovery.
- Added role-aware dashboard navigation, shell sign-out and verified tab-scoped session restoration through GET /auth/me. Rejected tokens are removed; temporary failures offer retry/sign-out; logout cancels pending restoration and clears storage/cache.
- Documented the deliberate sessionStorage bearer-token decision in DECISIONS.md and behavior/response assumptions in SESSION.md. No API contract changes; dashboard content remains placeholders.
- Verified all 105 tests (26 added cases), lint, typecheck, production build and whitespace checks. Initial parallel test workers timed out; npm.cmd test -- --maxWorkers=1 passed. Mocked HTTP now uses a fixed API base independent of local environment configuration. No live integration or browser visual inspection performed.
- Marked FE-AUTH-003 complete. FE-DISC-001 remains unstarted.

### 2026-09-28 - FE-DISC-001

- Replaced the discovery placeholder with responsive public category browsing through GET /categories, the shared service layer and TanStack Query.
- Added validated category data, URL-based server-ID selection, landing-name resolution, history/direct-entry support, clear selection and loading/refresh/error/retry/empty/unavailable states.
- Added 14 focused tests. All 119 tests, lint, typecheck, production build and whitespace check pass after correcting test-query ambiguity and new-file encoding.
- Documented behavior and the minimal category-response assumption in CATEGORIES.md. Mocked HTTP only; live backend integration and browser visual inspection were not performed.
- Marked FE-DISC-001 complete. Artisan search/results remain in unstarted FE-DISC-002. No API contract, architecture, product scope or deployment changes.

### 2026-09-28 - FE-DISC-002

- Added public API-backed artisan summaries and submitted keyword/category/rating/experience/availability filtering with URL restoration, history and clear controls.
- Added validated collection service, cancellable TanStack queries, responsive accessible results and loading/refresh/empty/error/retry handling. Profile links use the existing placeholder route.
- Added 14 focused tests including category-to-results integration. All 133 tests, lint, typecheck, production build and whitespace check pass after correcting strict test array access and file whitespace.
- Documented response assumptions and default-first-page scope in ARTISAN_SEARCH.md. No live backend integration or browser visual inspection performed.
- Marked FE-DISC-002 complete. FE-DISC-003 remains unstarted. No API contract, architecture, product scope or deployment changes.

### 2026-09-28 - FE-DISC-003

- Added manual latitude/longitude and optional radius filtering with shared Zod validation, React Hook Form, accessible field errors and explicit apply/clear controls.
- Integrated contract location parameters into existing public discovery queries, preserving other filters and supporting URL/history restoration, page reset and invalid-link feedback. Documented coordinate URL visibility and the absence of an address lookup endpoint in MANUAL_LOCATION.md.
- Verified all 146 tests (13 added cases), typecheck, lint, production build and whitespace check. Initial new-test label queries were corrected to use accessible names. HTTP is mocked; live integration and browser visual inspection were not performed.
- Marked FE-DISC-003 complete. FE-DISC-004 remains unstarted. No API contract, architecture, product scope or deployment changes.

### 2026-09-28 - FE-DISC-004

- Added explicitly requested browser geolocation to the existing location form, with pending/cancel/success feedback and review-before-apply behavior. Existing radius and discovery filters are retained.
- Added manual fallback for permission denial, unavailable position, timeout, unsupported browsers, insecure contexts and invalid results. Obsolete callbacks cannot overwrite manual edits, cleared state or navigation.
- Added 16 focused tests; all 162 tests, typecheck, lint, production build and whitespace check pass. Corrected the initial jsdom geolocation mock setup. Documented behavior in BROWSER_LOCATION.md; real browser permissions/device location, visual layout and live backend integration were not exercised.
- Marked FE-DISC-004 complete. FE-DISC-005 remains unstarted. No API contract, architecture, product scope or deployment changes.

### 2026-09-28 - FE-DISC-005

- Added URL-backed default/distance/rating/experience/newest ordering and previous/next pagination with boundary states and filter preservation. Distance sorting requires applied valid coordinates; sort/filter changes reset page and browser history restores selections/results.
- Added invalid-link feedback, empty-page recovery, first-page reset and safe/consistent pagination-response validation. Existing loading, refresh, cancellation and retry behavior applies to distinct sort/page query keys.
- Added 21 focused cases; all 183 tests, typecheck, lint and production build pass. Corrected a trailing blank line found by the whitespace check. Documented behavior in DISCOVERY_PAGINATION.md. HTTP is mocked; live backend integration and browser visual inspection were not performed.
- Marked FE-DISC-005 complete. FE-DISC-006 remains unstarted. No API contract, dependency, architecture or deployment changes.

### 2026-09-28 - FE-DISC-006

- Replaced the public profile placeholder with responsive biography, location, availability, experience, rating summary, services, portfolio, safe credential metadata and public phone/WhatsApp contacts.
- Added validated cancellable per-artisan queries, private-field stripping, safe contact/image links, image fallback and loading/error/not-found/empty states. Request CTA explicitly indicates that creation is coming in FE-CUST-002.
- Confirmed current detail fields through read-only backend source inspection. Documented provisional populated portfolio shape, currency handling and integration limits in ARTISAN_PROFILE.md. No backend or API contract changes.
- Verified all 199 tests (16 new cases), typecheck, lint, production build and whitespace checks. HTTP is mocked; live integration and browser visual inspection were not performed.
- Marked FE-DISC-006 complete. FE-CUST-001 remains unstarted. No dependency or deployment changes.

### 2026-09-28 - FE-CUST-001

- Replaced the customer dashboard placeholder with a responsive welcome, authenticated account summary, artisan search, live category shortcuts and project guidance.
- Reused the protected customer route, validated category service and shared cancellable TanStack Query cache. Added loading, refresh, error/retry and empty states; search remains available when categories fail. Request creation and tracking are explicitly coming soon, without fabricated activity counts.
- Added 14 focused tests for account display, search/category navigation, response states, cancellation and access controls. All 213 tests, lint, typecheck, production build and whitespace checks pass. Corrected an ambiguous status query in the initial focused test run.
- Documented behavior in CUSTOMER_DASHBOARD.md. HTTP is mocked; live integration and browser visual inspection were not performed.
- Marked FE-CUST-001 complete. FE-CUST-002 remains unstarted. No API contract, dependency or deployment changes.
