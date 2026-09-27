# Changelog

Concise AI-assisted implementation history. Git remains the source of code history.

## Unreleased

### 2026-09-27 — FE-004

- Added React Router route skeletons for public/auth/dashboard families, router-aware shell navigation and not-found recovery.
- Added a stable TanStack Query provider with bounded transient-error query retries and no automatic mutation retries.
- Added a centralized typed JSON API client with validated public base URL configuration, contract envelopes/pagination, explicit bearer support, cancellation and normalized HTTP/network errors. Added .env.example and API_FOUNDATION.md usage notes.
- Verified all 49 tests, lint, typecheck, production build and diff whitespace check. Dependency installation audit: zero vulnerabilities. Tests mock HTTP; live backend integration and browser visual inspection were not performed.
- FE-005 remains unstarted. No API contract, product scope, architecture or deployment changes.

### 2026-09-27 — FE-003

- Added responsive header/navigation/main/footer, skip link, mobile menu disclosure and Escape focus restoration.
- Added typed buttons, labeled inputs, badges, surfaces and loading/error/empty/success feedback; installed Lucide. Documented usage in UI_COMPONENTS.md.
- Verified seven tests, lint, typecheck, production build and diff whitespace check. Installation audit: zero vulnerabilities. Browser visual/layout inspection was not performed.
- FE-004 remains unstarted. No API, product scope or architecture changes.

### 2026-09-27 â€” FE-001

- Initialized React 19, TypeScript 6 and Vite 8 with a minimal neutral application shell and no feature UI.
- Added strict TypeScript, ESLint with React Hooks/Fast Refresh rules, Vitest 5, jsdom and React Testing Library; added one passing render smoke test.
- Added locked dependencies, development/build/preview/typecheck/lint/test scripts, generated/private artifact ignores and local development instructions.
- Verified clean `npm.cmd ci` (zero reported vulnerabilities), typecheck, lint, tests and production build. Development server and production preview returned HTTP 200; Vite served the transformed React entry.
- FE-002 and subsequent features remain unstarted. No API or architecture changes.

### 2026-09-27 — FE-002

- Integrated Tailwind through its Vite plugin and locked build dependencies.
- Added semantic warm-neutral/charcoal/amber tokens, system typography, spacing, content widths, restrained radii/shadow, keyboard focus and forced-color support.
- Applied mobile-first utilities to the existing bootstrap screen and documented usage in DESIGN_FOUNDATION.md.
- Verified typecheck, lint, render smoke test (1 test), production build, emitted responsive/theme/focus CSS and numeric contrast ratios (normal text pairs exceed 4.5:1). Install reported zero audit vulnerabilities.
- No browser visual/layout inspection performed. FE-003 remains unstarted; no API, product scope or architecture changes.

### 2026-09-27 — FE-005

- Replaced the home placeholder with a responsive public landing page: hero/discovery CTAs, eight contract-listed service categories, three explanatory steps and artisan registration CTA.
- Used existing warm-neutral/amber design tokens, semantic sections, Lucide icons and keyboard-accessible links; no fabricated metrics, testimonials or verification claims.
- Category links preserve service names with the supported q search parameter. Discovery and registration remain placeholders owned by later features; no API integration added.
- Added five focused tests for landing semantics and CTA/category navigation, and updated shell route tests. All 54 tests, typecheck, lint, production build and whitespace check pass. Browser visual inspection was not performed.
- Marked FE-005 complete. FE-AUTH-001 remains unstarted; no API contract, product scope, architecture or deployment changes.
### 2026-09-27 � FE-AUTH-001

- Added customer/artisan registration with React Hook Form, Zod validation, password confirmation and accessible native controls using existing design tokens.
- Added the contract registration service and TanStack mutation with exact payload fields, duplicate-submit protection, pending/success states and deliberate conflict/validation/rate-limit/network/server error handling.
- Credentials are not stored as mutation variables; returned tokens are discarded. Login/session state remains for later features. Documented behavior and contract password-policy limits in REGISTRATION.md.
- Verified all 64 tests (10 registration tests), lint, typecheck, production build and git diff --check. Dependency installation reported zero vulnerabilities. Mocked HTTP only; live backend integration and visual browser inspection were not performed.
- Marked FE-AUTH-001 complete. FE-AUTH-002 remains unstarted. No API contract, architecture, product scope or deployment changes.
