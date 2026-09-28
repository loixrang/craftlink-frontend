# Current Task

Status: COMPLETE
Feature: FE-DISC-004 - Browser geolocation with permission/fallback UX.

Scope: Explicit browser location request fills the existing manual coordinate form; Apply location submits through existing discovery state and API.
Acceptance: No automatic permission prompt; pending and success feedback; denial, unavailable, timeout, unsupported and insecure-context recovery with manual fallback; validate browser coordinates; ignore stale callbacks after edits, cancellation or navigation; preserve filters and optional radius; focused tests, typecheck, lint, full tests, build and whitespace check.
Exclusions: Geocoding, sorting/pagination, profile changes and subsequent features.

Verified 2026-09-28: All 162 tests pass (16 new geolocation cases), typecheck, lint, production build and whitespace check pass. Fixed the initial jsdom geolocation mock setup. See BROWSER_LOCATION.md for behavior and browser API limitations. Real browser permissions/device location, visual layout and live backend integration were not exercised. FE-DISC-005 remains unstarted. No API contract or deployment changes.
