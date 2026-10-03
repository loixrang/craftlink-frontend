# Changelog

### 2026-10-03 - Unified artisan profile and photo save

- Fixed the artisan profile setup/edit form (`/artisan/profile`) requiring two separate save actions. The profile photo section had its own "Upload photo" button (labelled "Save profile and upload photo" for new profiles) that uploaded the staged file immediately through a separate mutation, while the bottom "Save profile" button only saved profile information and never touched the staged image.
- The photo section now only stages the image: selecting a file stores the `File` in frontend state, validates it with the existing `profileImageFileError` rules (non-empty JPEG/PNG/WebP, max 5 MiB) and shows an immediate local `URL.createObjectURL` preview in place of the "No photo" state. No upload happens on selection, and the separate upload button is removed. The existing "Remove photo" action is preserved.
- The single "Save profile" button is now the authoritative save action: it validates the form, saves the profile through `PUT /artisans/me` (retaining the current image URL), and when an image is staged uploads it through the existing `POST /artisans/me/profile-image` multipart endpoint, then refreshes the owner, public profile and discovery queries and shows one unified success state. The staged image is cleared only after both operations succeed.
- Honest partial-failure handling: if the profile saves but the image upload fails, the UI shows "Profile saved, but the photo could not be uploaded" instead of a false success, keeps the staged image for retry and refreshes the saved profile data. An invalid staged image is rejected before any request is made, and a failed profile save never triggers an upload.
- Loading and duplicate protection: the primary save button stays in a loading state ("Saving profile..." / "Uploading photo...") while either operation runs, the form fields and photo controls are disabled, and the existing lock prevents duplicate submissions/uploads.
- Backend preserved: no endpoint, payload or Cloudinary integration change. Uploads still go through the backend profile-image route as exactly one multipart `file` part with no manual Content-Type and no frontend Cloudinary access.
- Added `src/pages/ArtisanManagementPage.test.tsx` (11 tests): local staging without upload, removal of the separate upload action, new/existing profile with and without an image, invalid image rejection, validation-failure blocking, partial upload failure feedback, duplicate-submit protection and remove-photo preservation. Full suite (119 tests), lint, typecheck and the production build pass (pre-existing 594.91 kB chunk warning retained).

### 2026-10-02 - Nigerian Naira currency standardization

- Audited every monetary entry, display, validation, schema, type, payload and copy path in both repositories. `ArtisanService.priceFrom` (artisan service "starting price") is the only monetary field in the product; `minPrice`, `maxPrice`, `minBudget`, `maxBudget`, request/job budgets, hourly rates, fees and payment amounts do not exist, and there are no payments or escrow in V1. Discovery summaries, dashboards, requests, reviews and admin screens carry no monetary values.
- Added `src/constants/currency.ts` as the single currency-formatting entry point: `CURRENCY_CODE` (`NGN`), `CURRENCY_LOCALE` (`en-NG`), `CURRENCY_SYMBOL` (`₦`), `currencyFormatter(code)` and `formatCurrency(amount, code?)`. It wraps a cached `Intl.NumberFormat` with `style: 'currency'`, `minimumFractionDigits: 0` and `maximumFractionDigits: 2`, matching the backend's `Decimal(12,2)`: `formatCurrency(50000)` is `₦50,000`, whole amounts render without `.00`, stored minor units survive (`₦75,000.5`), and absent or non-finite amounts return an empty string. The optional `code` argument and the cached formatter map mean a future currency is a parameter change, not a rewrite of every component.
- Replaced every ambiguous monetary render. The landing page featured-artisan "Starting from" and the public artisan profile service list previously called `toLocaleString('en-NG')` and displayed bare `150,000`; the artisan service list interpolated the raw number and rendered `Starting price: 150000 (confirm currency)`. All three now use `formatCurrency`. No component concatenates `₦` itself.
- Made the service editor state its currency: the label is `Starting price (₦)` and the hint reads "Optional; enter the amount in Nigerian Naira. Leave empty for price on enquiry." The control still holds a numeric string, `serviceFormSchema` is unchanged, and `saveService` still sends a JSON number, so no `₦` or thousands separator reaches the API.
- Removed the now-obsolete "confirm the currency" wording from the artisan service list, service editor intro, public profile, and the `priceFrom` validation message, keeping the "confirm the final quote" guidance. Replaced the stale "no currency is invented" / "ask users to confirm currency" statements in `ARTISAN_MANAGEMENT.md` and `ARTISAN_PROFILE.md`.
- Documented the audit, the centralized formatter, the presentation/data separation and the backend findings in `docs/CURRENCY.md`, and recorded the NGN assumption in `docs/DECISIONS.md`.
- Backend: no currency field, column, parameter, model or validation exists in `craftlink-backend`, so NGN is an application-level display assumption. No migration, column, database type, endpoint, payload, seed or test fixture changed, no API contract edit was made (`API_CONTRACT.md` stays byte-identical to the backend copy), and no stored amount was multiplied, divided, converted or rescaled. No currency selector, exchange-rate call, conversion, user preference or multi-currency architecture was introduced. No layout, colour, routing, authentication, API or unrelated behavior changed and no dependency was added.
- Verification: 3 new formatter tests and 2 new public-profile rendering tests (108 total, all passing), plus lint, typecheck and the production build (pre-existing 595.01 kB chunk warning retained). `Intl.NumberFormat('en-NG', …)` output was confirmed in Node and through a jsdom render of the public profile. A browser visual pass in light/dark mode at mobile widths was not possible because no desktop browser is attached to this session; the only markup changes are text inside existing containers with the existing `tabular-nums` treatment.

### 2026-10-02 - Responsive UI repair pass

- Audited every route in a real browser at 320, 340, 360, 375, 390, 414, 430, 540, 768, 834, 1024, 1280 and 1440px in both light and dark themes (247 route/width combinations per theme), checking page-level horizontal overflow, content clipped by scroll containers, control content overflow and mobile navigation geometry.
- Rebuilt the mobile navigation in `AppShell`. The nav was a `w-full` flex sibling of the wordmark and menu trigger inside the non-wrapping header row, so opening it forced the row wider than the viewport: at 320px every link was clipped off-screen, "Find an artisan", "Admin dashboard" and "Sign out" wrapped onto two lines, the theme toggle and sign-out overlapped, and the page scrolled horizontally to 400px. It is now a full-width panel anchored below the header bar (`absolute inset-x-0 top-full` inside a `relative` row), opaque `bg-surface` with `border-b` and `shadow-float`, clamped to `calc(100dvh - 5rem)` with `overflow-y-auto overscroll-contain` so long admin navigation scrolls inside the panel instead of running past the viewport. The panel stacks the link list and the theme/sign-out row with `gap-3` instead of leaving them flush against each other.
- Moved the navigation collapse point from `md` to `lg`. With an administrator session the inline navigation needed 787px, so at 768px the header overflowed the page to 835px while the menu trigger was already hidden at `md`. Desktop navigation at 1024px and above is unchanged for anonymous, customer, artisan and administrator sessions.
- Fixed the landing page hero being clipped at 320-430px. `truncate` (`white-space: nowrap`) on the featured artisan name made the featured card's intrinsic minimum width 448px, so the single-column hero grid track grew past the viewport and the section's `overflow-hidden` cut off the badge, heading, body copy, search form and stats. The name is now `line-clamp-1`, the heading wraps only when the verification badge cannot fit beside it, the hero grid items are `min-w-0`, and the rating and "View profile" group wraps.
- Fixed the artisan profile editor overflowing at 320px: the file input's intrinsic width propagated through `Input`'s wrapper because the wrapper was a flex item without `min-w-0`, so the form, its section and the page column all exceeded the viewport. `Input`'s wrapper is now `min-w-0`, and the profile photo and its control column are `shrink-0`/`min-w-0` so the square preview cannot be distorted.
- Fixed the admin dashboard statistic values overrunning their tiles at 320px (`1,284` and `1,976` needed 86px in an 81px content box) with a mobile `text-2xl` step, restored at `sm:`.
- Added `min-w-0` to the remaining selects and the service textarea that lacked it, matching the convention already used in `ArtisanResults`, `ManualLocation` and `CreateServiceRequestPage`, so long option labels can no longer force horizontal overflow.
- Allowed the paired action groups in the artisan service list, the service deletion confirmation and the admin category form to wrap instead of overflowing at 320px.
- No route, API call, contract, authentication, session, query, mutation or business-logic change; no new dependency. Colours, type scale, spacing scale and the desktop visual identity are unchanged. Layout behaviour was verified in a real browser against a local mock of the documented API; jsdom still cannot validate layout, so the existing 103 tests are unchanged and pass, along with lint, typecheck and the production build (594.70 kB chunk warning retained).

### 2026-10-02 - Discovery location contract addition

- Added optional `state` and `city` query parameters to `GET /api/v1/artisans` in `docs/API_CONTRACT.md`, documented in `docs/DECISIONS.md`. `state` matches the artisan's stored state and `city` matches the stored city value (an LGA within that state); they filter administratively and are independent of the existing coordinate filters. `lga` is documented as a URL alias normalized to `city`, not a query parameter. This is additive: no endpoint, verb, payload or existing parameter was changed or removed.
- Rationale: the implemented discovery location control has always been a state plus city/LGA selector backed by `SUPPORTED_STATES`/`getLgasForState`, and artisan profiles store `city`/`state` as strings, so an administrative filter matches both sides honestly. Coordinate filters (`latitude`, `longitude`, `radiusKm`) remain in the contract as a backend capability and stay unused, so `sort=distance` remains unavailable and `distanceKm` is never rendered.
- Corrected documentation drift: `MANUAL_LOCATION.md` and `BROWSER_LOCATION.md` described coordinate entry and browser geolocation that do not exist in the code (`navigator.geolocation` is absent from `src/`), and the FE-DISC-003 note in `ARTISAN_SEARCH.md` described `radiusKm`. All three now describe the implementation; `BROWSER_LOCATION.md` records the absence of geolocation explicitly.
- No application code changed; the emitted request surface is unchanged and was verified against the contract. `ROADMAP.md` still marks FE-DISC-004 complete with no implementation, which needs a separate product decision. The sibling backend repository must be synchronized before integration.

### 2026-10-02 - Landing page theme fix

- Fixed the homepage rendering permanently in dark mode. The `.slate-band` helper added during the Stitch refresh re-declared every `--color-*` token with hardcoded dark hex values and set `color-scheme: dark`, which bypasses `light-dark()` and ignores both `:root.light`/`:root.dark` and `prefers-color-scheme`. The class wrapped the whole landing page, so the theme toggle had no effect on it.
- Removed `.slate-band` from `src/index.css` and the `slate-band` class from the landing page wrapper in `src/pages/LandingPage.tsx`. The charcoal dark appearance is unchanged because the helper's hardcoded values were identical to the global dark tokens; light mode now resolves the same markup through the shared theme tokens like every other page.
- Added `src/index.css.test.ts` to fail if theme colours are declared outside `@theme` or `color-scheme: dark` is forced on anything other than `:root.dark`. Corrected the `.slate-band` note in `docs/DESIGN_FOUNDATION.md`. No layout, copy, route, API, auth or business-logic changes.

### 2026-10-02 - Stitch design refresh

- Rebuilt the visual layer against the Google Stitch reference in `design/` while preserving all routes, API contracts, queries, mutations, auth and business logic. No feature was added or removed; only markup structure and class names changed.
- Rewrote `src/index.css` tokens to the reference palette and scale: canvas/surface/ink values, accent `#C2410C`, new `--color-accent-text`, `--color-amber`, `--color-success`, `--color-danger`, `--color-accent-soft-ink`, radii (`control` 0.5rem, `panel` 1rem, `modal` 1.5rem), `--container-content` 80rem, `--text-display`, `--text-headline`, plus-jakarta/Inter font pairs and a four-step elevation scale (`shadow-card`, `shadow-lift`, `shadow-float`, `shadow-action`) replacing `shadow-subtle`. Theme mechanism (`light-dark()` + `:root.light/.dark` + persisted toggle) is unchanged, so dark mode still follows `prefers-color-scheme` by default.
- Added `.slate-band` (charcoal `#141311` marketing band) and `.full-bleed` layout utilities to `src/index.css`; the landing page reproduces the reference dark hero, category grid, three-step "how it works", artisan call-to-action banner and header/footer using live API data rather than Stitch placeholders. The reference's escrow and direct-messaging claims were dropped because they are not part of the V1 product.
- Restyled `AppShell` (sticky blurred header, pill navigation, terracotta wordmark, compact footer), `ThemeToggle` and every route: discovery now uses the 4-column sticky category rail with an 8-column results feed, artisan profiles use Level-1 profile cards with a sticky contact aside, and customer/artisan/admin screens use consistent page headers, eyebrow labels, card surfaces, 48px controls and elevated list rows. Forms moved to 48px `min-h-12` controls with accent focus borders and `text-danger` validation text.
- Added the shared `src/components/ui/VerifiedBadge.tsx` used by discovery and artisan profiles; `Surface`, `Button`, `Badge`, `Input` and `Feedback` keep their existing props and variants. Loaded Plus Jakarta Sans and Inter from Google Fonts in `index.html` and updated `theme-color` per scheme.
- Intentional deviations from the reference: control borders stay stronger than the design's faint hairline to preserve a 3:1 non-text boundary; the footer omits link columns that would duplicate accessible link names asserted in `AppShell.test.tsx`; the hero location field is a select of supported LGAs rather than free text. `design/screen.png` could not be read, so `DESIGN.md` and `code.html` drove the work.
- All 99 tests pass; lint, typecheck and production build pass. Build reports the existing large-chunk warning (594.16 kB). HTTP is mocked; no live backend or browser visual verification was performed.

### 2026-10-02 - Dark theme

- Added a dark theme by making the existing semantic `@theme` tokens in `src/index.css` theme-aware with `light-dark()`, so all existing surfaces, text, borders, controls and accent states adapt without component restyling. Light values are unchanged.
- Respects `prefers-color-scheme` by default via `color-scheme: light dark`; an explicit choice is stored under `craftlink-theme` and applied before first paint by a small inline script in `index.html` to avoid a flash of the wrong theme.
- Added an accessible icon toggle to the existing header navigation that switches and persists light/dark. Added focused toggle tests; all 99 tests, lint, typecheck and production build pass. No API, routing, auth or business-logic changes.

### 2026-10-01 - FE-ADMIN-004 completed

- Added protected `/admin/categories` management for listing, creating, renaming and confirming deletion of service categories. The UI validates the published BE-ADMIN-004 request/response shapes and handles duplicate names, service references, missing categories, expired sessions and permission loss.
- Successful mutations invalidate the shared `['categories']` cache used by public discovery and artisan service forms. Added focused contract, UI, error-state and role-guard tests; documented category administration behavior and mirrored the backend decision/API details.
- All 97 tests pass with one worker; lint, typecheck, production build and `git diff --check` pass. Build reports the large-chunk warning (571.13 kB). HTTP is mocked; no live backend or browser visual verification was performed.
- Marked FE-ADMIN-004 and CURRENT_TASK complete. No subsequent feature started.

### 2026-10-01 - FE-ADMIN-003 completed

- Added the protected `/admin/artisans` directory with URL-backed owner status filtering, pagination, safe profile summary validation, and deliberate loading/error/empty states. Active artisan profiles link to their public detail page; suspended profiles remain listed without exposing an unavailable public link.
- Mirrored published BE-ADMIN-003 list details in API_CONTRACT.md and documented the frontend behavior in ADMIN_ARTISANS.md. Added focused service, UI, filtering, pagination, privacy, and role-gating tests.
- All 93 tests pass; lint, typecheck, production build, and `git diff --check` pass. Build reports the large main-chunk warning (563.89 kB). HTTP is mocked; no live backend or visual browser verification was performed.
- Marked FE-ADMIN-003 and CURRENT_TASK complete. No subsequent feature started.

### 2026-10-01 - FE-ADMIN-002 completed

- Added a protected `/admin/users` page for account listing, role/status filtering, pagination and confirmed account suspension/reactivation. Runtime response validation limits the UI/cache to documented safe account fields; the current administrator cannot suspend themselves.
- Mirrored the completed backend BE-ADMIN-002 contract details in API_CONTRACT.md and documented behavior in ADMIN_USERS.md. Added focused authorization, payload, filtering, pagination, confirmation and error validation coverage.
- All 88 tests pass; lint, typecheck, production build and `git diff --check` pass. Build reports the large main-chunk warning (557.61 kB). HTTP is mocked; no live backend or visual browser verification was performed.
- Marked FE-ADMIN-002 and CURRENT_TASK complete. No subsequent feature started.

### 2026-10-01 - FE-CUST-005 completed

- Added a protected customer account page showing the verified account email and role, with links from customer navigation and the dashboard. Documented that profile editing awaits a contract-defined customer endpoint; no API operation or payload was invented.
- Added focused coverage for displayed identity, navigation and anonymous/wrong-role access. All 84 tests pass; lint, typecheck, production build and whitespace checks pass. Build reports the existing 549.99 kB main-chunk warning. HTTP is not used by this page; no live backend or browser visual verification was performed.
- Marked FE-CUST-005 and CURRENT_TASK complete. No subsequent feature started.

### 2026-09-30 - SEO discoverability

- Added build-generated robots and sitemap files, canonical production-origin configuration, social metadata, route-specific titles and descriptions, and `noindex` metadata for non-public routes. The sitemap includes the landing and artisan discovery pages; API-backed individual profiles are omitted because IDs are not available at build time.
- Verified robots, sitemap XML, homepage and an artisan deep route through Vite preview (all HTTP 200); standard production build, Vercel JSON parsing, and `git diff --check` pass. Build reports only the existing large-chunk warning.

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
