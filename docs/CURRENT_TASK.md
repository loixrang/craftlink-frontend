# Current Task

Status: COMPLETE
Feature: FE-DISC-001 - Category browsing.

Scope: Public API-backed categories at /artisans with URL selection and landing entry points.
Exclusions: Artisan results, search/filter execution, location and later features.
Acceptance: Service-layer fetch and TanStack Query; responsive accessible links using server IDs; direct navigation/history selection; loading/error/retry/empty/unavailable states; focused tests and required checks.

Verified 2026-09-28: All 119 tests pass (14 category cases) with npm.cmd test -- --maxWorkers=1. Lint, typecheck, production build and whitespace check pass. Fixed initial test-query ambiguity and new-file encoding failure. See CATEGORIES.md for behavior and response-shape assumptions. No live backend integration or browser visual inspection performed. FE-DISC-002 remains unstarted. No API contract or deployment changes.
