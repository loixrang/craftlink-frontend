# Current Task

Status: COMPLETE
Feature: FE-CUST-001 - Customer dashboard.

Scope: Replace the protected customer dashboard placeholder with a responsive welcome, verified account summary, artisan search and live category shortcuts.
Acceptance: Customer-only access; discovery links preserve search/category intent; account information comes from the authenticated session; categories use the existing cancellable service/query with loading, refresh, error/retry and empty states; accessible mobile-first layout; focused tests and full typecheck/lint/test/build/whitespace checks.
Exclusions: Request creation, history/detail/status, reviews, account editing, other role dashboards, backend/API and deployment changes. Explain upcoming request functionality without fabricated activity or counts.

Verified 2026-09-28: All 213 tests pass, including 14 new dashboard cases. Lint, typecheck, production build and whitespace checks pass. See CUSTOMER_DASHBOARD.md for implementation scope and verification limits. HTTP is mocked; live backend integration and browser visual inspection were not performed. FE-CUST-002 remains unstarted. No API contract, dependency or deployment changes.
