# Current Task

Status: COMPLETE
Feature: FE-DISC-005 - Sorting, pagination and result states.

Scope: URL-backed contract sorting and page navigation in existing artisan discovery.
Acceptance: Supported sorts; distance requires valid applied coordinates; positive integer page validation; preserve filters during paging; reset page when sorting/filtering; history restoration; accessible bounded pagination; loading, error, empty and out-of-range recovery; focused tests, full tests, typecheck, lint, build and whitespace check.
Exclusions: Public profile and all subsequent features; API or deployment changes.

Verified 2026-09-28: All 183 tests pass (21 added cases), typecheck, lint and production build pass. Corrected the roadmap trailing blank line found by the whitespace check. See DISCOVERY_PAGINATION.md for behavior and verification limits. Live backend integration and browser visual inspection were not performed. FE-DISC-006 remains unstarted. No API contract, dependency or deployment changes.
