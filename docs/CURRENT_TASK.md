# Current Task

Status: COMPLETE
Feature: FE-AUTH-001 - Registration for customer/artisan with validation and API errors.

Scope: Registration form, contract registration service, TanStack mutation, accessible validation and pending/error/success states, focused tests.
Exclusions: Login, authenticated state/session persistence, route guards and subsequent features.
Acceptance: Only CUSTOMER/ARTISAN can register; submit the exact contract payload; validate email and required password with confirmation; handle API failures and prevent duplicate pending submissions; typecheck, lint, tests, build and whitespace checks pass.

Verified 2026-09-27: All 64 tests pass, including 10 registration tests. Lint, typecheck (via build), production build and git diff --check pass. Dependency install reports zero vulnerabilities. Tests use mocked HTTP; no live backend integration or browser visual inspection was performed. Password policy is enforced by the backend because the frozen contract does not define it. Tokens are discarded; registration success links to the existing login placeholder. FE-AUTH-002 remains unstarted. No API contract, architecture, product scope or deployment changes.
