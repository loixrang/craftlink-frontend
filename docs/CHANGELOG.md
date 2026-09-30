# Changelog

### 2026-09-29 - FE-CUST-004

- Added completed-request review forms with validated 1–5 ratings and trimmed comments, exact authenticated review payloads, pending/duplicate protection, success acknowledgement across session navigation and public rating cache invalidation.
- Added deliberate eligibility/conflict/session/validation/rate-limit/uncertain-result handling while preserving inputs. Server remains authoritative for ownership and one review per request; documented missing eligibility metadata and backend implementation in REVIEWS.md.
- All 284 tests pass (28 added), lint, typecheck, production build and whitespace checks pass. Corrected a test-mock typing issue found by typecheck. HTTP is mocked; no live backend or visual browser verification.
- Marked FE-CUST-004 complete and preserved existing roadmap deferrals. No subsequent feature started; no API contract, dependency or deployment changes.

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

### 2026-09-29 - FE-CUST-002

- Added customer-only service request creation from public artisan profiles, preserving login return intent and using the existing public profile query for service selection.
- Added React Hook Form/Zod validation, exact bearer-authenticated POST payload, optional ISO date, pending/success/empty/error states and duplicate-submit protection without automatic retries. Updated dashboard guidance.
- Full suite passed 233 tests; final focused run passed 21 request tests including one subsequently added foreign-service case (234 cases total). Typecheck, lint, production build and whitespace checks pass. Tests caught and resolved a pending indicator race on duplicate submit events; React lint handler compliance and an edit encoding artifact were corrected.
- Documented behavior in CREATE_SERVICE_REQUEST.md. HTTP is mocked; live backend integration and visual browser checks were not performed.
- Marked FE-CUST-002 complete. FE-CUST-003 remains unstarted. No API contract, dependency or deployment changes.

### 2026-09-29 - FE-CUST-003

- Added customer request history and detail routes with pagination, all six current statuses, manual refresh, and loading/error/empty/missing states.
- Added validated bearer-authenticated collection queries scoped by customer, cancellation and failed-refresh handling. Details resolve through the existing collection endpoint. Linked dashboard and creation success to history; creation invalidates request queries.
- Added 22 focused tests and updated session routing expectations. All 256 tests, lint, typecheck, production build and whitespace checks pass.
- Documented provisional response fields and multi-page detail lookup in REQUEST_HISTORY.md. Backend requests are not implemented in the inspected sibling repository; live integration and visual browser checks were not performed.
- Marked FE-CUST-003 complete. FE-CUST-004 remains unstarted. No API contract, dependency or deployment changes.

### 2026-09-29 - FE-ART-001

- Added a protected artisan dashboard with authenticated account identity, read-only owner profile, location, experience, availability and public-profile link. Future management tools are labeled as coming soon; no fabricated metrics or dead tool links.
- Added validated, cancellable GET /artisans/me queries scoped by user ID, private-field stripping, missing-profile guidance and deliberate loading/refresh/error/retry behavior. Confirmed response fields and missing-profile code through read-only backend inspection.
- All 299 tests (15 new), lint, typecheck, production build and whitespace checks pass. Corrected the Badge prop caught by typecheck. Build reports a non-blocking main-chunk size warning (500.39 kB).
- Documented behavior in ARTISAN_DASHBOARD.md. HTTP is mocked; live integration and visual browser verification were not performed.
- Marked FE-ART-001 complete. No subsequent feature started; no API contract, dependency or deployment changes.

### 2026-09-29 - FE-ART-002

- Added protected artisan profile setup/editing, contact and image URL fields, manual/browser location and availability. Owner fields are validated and cached separately from the dashboard summary; late save completion cannot repopulate owner cache after leaving the page.
- Added service creation/editing/deletion with live categories, exact authenticated payloads, validation, confirmation, duplicate protection, preserved failure drafts and public-profile/discovery invalidation. Linked management from the dashboard.
- Confirmed backend field names and validation by read-only inspection. Documented behavior and integration limits in ARTISAN_MANAGEMENT.md; no contract, backend, dependency or deployment changes.
- All 318 tests pass (19 new), lint, typecheck, production build and whitespace checks pass. Corrected test selectors for required-field markers. Build retains a non-blocking main-chunk warning (517.10 kB). HTTP/geolocation are mocked; live backend and visual browser verification were not performed.
- Marked FE-ART-002 complete; preserved roadmap deferrals and stopped without beginning another feature.

### 2026-09-29 - FE-ART-003 investigation blocked

- Selected artisan portfolio/credential management and inspected the frontend and sibling backend before implementation.
- Found undefined upload bodies/transport in the frozen contract and unimplemented backend media/credential features; public detail currently returns empty arrays.
- Marked FE-ART-003 and CURRENT_TASK blocked, with evidence and unblock requirements in ARTISAN_MEDIA.md. Acceptance criteria remain unmet; no invented API payloads or application changes.
- Documentation whitespace check only; application tests not rerun. No subsequent feature started.

### 2026-09-29 - FE-ART-003 completed after contract update

- Resumed after the supplied contract and backend implementations defined portfolio/credential multipart uploads. Added artisan-only media management and dashboard navigation.
- Added exact authenticated multipart payloads, private-field stripping, owner credential status, portfolio display, file/date validation, duplicate protection, deletion confirmation, cache refresh and deliberate failure states. Preserved JSON client behavior.
- All 21 tests currently available in this checkout pass; lint, typecheck, production build and whitespace checks pass. Earlier sessions' test files are absent from this checkout. Build retains the non-blocking chunk-size warning (523.00 kB). HTTP is mocked; live uploads and visual browser verification were not performed.
- Minimally corrected an existing unused location import and replaced profile watch with useWatch to clear pre-existing check failures. No dependencies, backend, contract content or deployment changes.
- Documented behavior in ARTISAN_MEDIA.md, marked FE-ART-003 complete and stopped without starting the next feature.

### 2026-09-29 - FE-ART-004 investigation blocked

- Selected incoming service request management and inspected frontend request code, relevant docs and the sibling backend.
- Confirmed missing request implementation and undefined status mutation payload/artisan transition rules. Marked the feature and CURRENT_TASK blocked; documented evidence and unblock requirements in ARTISAN_REQUESTS.md.
- Acceptance criteria remain unmet. No application, backend, contract, dependency or deployment changes; no subsequent feature started.
- Documentation whitespace check only; application tests were not rerun.

### 2026-09-30 - FE-ART-004 completed

- Rechecked the previously blocked feature: BE-REQ-001/002 are now implemented and backend decisions explicitly define the formerly missing request details. Documented the verified integration policy; no frozen contract or backend edits required.
- Added artisan-only incoming requests with paginated listing, expandable project details, preserved titles for removed services, permitted accept/decline/start/complete actions and confirmation. Linked from the dashboard.
- Added account-scoped cancellable queries, runtime response validation, unused/private-field stripping, duplicate protection, explicit mutation errors and refresh after status attempts. Terminal requests expose no actions; failed refreshes hide stale data.
- All 47 tests pass (26 new); lint, typecheck through production build, build and whitespace checks pass. Build retains a non-blocking 531.34 kB chunk warning. HTTP is mocked; live backend integration and visual browser verification were not performed.
- Marked FE-ART-004 and CURRENT_TASK complete. Preserved existing tracking history; no subsequent feature started.

### 2026-09-30 - FE-ADMIN-001 completed

- Replaced the protected admin placeholder with server-backed marketplace statistics and credential verification. Added URL-backed status filters, pagination, safe metadata, private document availability/expiry guidance, confirmed verification/rejection/reopening and independent loading/error/empty/success states.
- Verified backend BE-ADMIN-001/BE-SEC-001 integration details; documented them in ADMIN_DASHBOARD.md and DECISIONS.md without changing the API contract or backend. Signed document links are admin-only, short-lived and excluded from mutation/public caches; inactive credential queries are removed.
- Added validated authenticated services, account-scoped cancellable queries, duplicate-submit prevention, explicit write errors and refresh/invalidation of statistics, credentials and public verification. Deferred administration features remain untouched.
- All 75 tests pass (28 new); lint, typecheck through production build, build and whitespace checks pass. Corrected a new-file encoding issue and the expiry test's timer setup during validation. Build retains the non-blocking chunk-size warning (542.58 kB). HTTP is mocked; live backend/Cloudinary integration and visual browser verification were not performed.
- Marked FE-ADMIN-001 and CURRENT_TASK complete and stopped. No subsequent feature, dependency or deployment changes.

### 2026-09-30 - FE-QA-001 completed

- Audited implemented routes and shared UI for keyboard navigation/focus, form labeling and error associations, touch targets, responsive patterns, and data loading/error/empty/success feedback. Documented findings and browser-only limits in ACCESSIBILITY_QA.md.
- AppShell now focuses the main landmark after path navigation and closes the mobile menu on route changes while preserving focus for query-only changes. Two standalone artisan dashboard links now meet the 44px minimum target.
- Added five AppShell tests for skip navigation, route focus, mobile-menu closure/Escape return, and current navigation. All 80 tests pass; lint, typecheck via build, production build, and whitespace checks pass. Build retains the non-blocking 542.82 kB chunk warning.
- Marked FE-QA-001 complete. FE-PROD-001 remains unstarted. No API, product scope, backend, dependency, or deployment changes; real-browser, screen-reader, and live-API verification were not performed.

### 2026-09-30 - FE-PROD-001 completed

- Added Vercel SPA rewrites so React Router paths load directly, plus README setup/check/deploy instructions and focused deployment documentation.
- Clarified public build-time API URL examples and HTTPS production requirements; documented Vercel build settings, backend CORS, preview environments, and the absence of a frontend API proxy. No API, backend, dependency, or product behavior changes.
- All 80 tests pass; lint, typecheck, production build, and whitespace checks pass. Build retains the non-blocking 542.82 kB main-chunk warning. No live Vercel deployment or backend connectivity verification performed.
- Marked FE-PROD-001 and CURRENT_TASK complete. No subsequent feature started.
