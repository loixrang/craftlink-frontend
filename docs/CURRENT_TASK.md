# Current Task

Status: COMPLETE
Feature: FE-CUST-002 - Create service request.

Implemented: Customer-only request form linked from public artisan profiles; login return intent; artisan-owned service selection; trimmed description and optional validated ISO date; exact authenticated POST payload; loading/error/empty/pending/success feedback; duplicate-submit guard and no automatic retries.

Verified 2026-09-29: Full suite passed 233 tests; final focused run passed all 21 request tests, including one subsequently added foreign-service case (234 total cases now). Typecheck, lint, production build and whitespace checks pass. HTTP is mocked; live backend integration and browser visual inspection were not performed. See CREATE_SERVICE_REQUEST.md for behavior and limitations.

FE-CUST-003 remains unstarted. No history/detail/status, reviews, API contract, dependency or deployment changes.
