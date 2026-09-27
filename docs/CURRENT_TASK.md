# Current Task

Status: COMPLETE
Feature: FE-AUTH-002 - Login and authenticated state.

Scope: Login form/service, shared in-memory authentication, sign-out and focused tests.
Exclusions: Persistence/restoration, role-aware navigation and route guards (FE-AUTH-003).
Acceptance: Exact login payload; accessible validation and pending/error/success states; all roles; navigation retains session; logout clears session/cache; no credentials in browser storage or mutation results; all checks pass.

Verified 2026-09-27: All 79 tests pass (15 new login/authentication tests), along with lint, typecheck and production build. Final whitespace check recorded with completion. HTTP is mocked; no live backend integration or browser visual inspection performed. See LOGIN.md for response-shape assumptions and session behavior. FE-AUTH-003 remains unstarted. No API contract, architecture, product scope or deployment changes.
