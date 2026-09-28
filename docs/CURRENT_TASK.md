# Current Task

Status: COMPLETE
Feature: FE-DISC-006 - Artisan public profile.

Scope: Public detail service and responsive profile route with services, portfolio, safe credential metadata, rating summary, contacts and request CTA.
Acceptance: Validated public data; loading/error/not-found/empty states; safe contact/media links; no private fields; cancellable per-artisan queries; focused tests and full typecheck/lint/test/build/whitespace checks.
Exclusions: Request creation (FE-CUST-002), review submission, backend/API changes and subsequent features. Request CTA clearly indicates creation is not yet available.

Verified 2026-09-28: All 199 tests pass, including 16 new profile tests. Typecheck, lint, production build and whitespace checks pass. See ARTISAN_PROFILE.md for response assumptions and verification limits. Backend source was inspected read-only; live backend integration and browser visual inspection were not performed. Populated portfolio responses await backend confirmation. FE-CUST-001 remains unstarted. No API contract, dependency or deployment changes.
