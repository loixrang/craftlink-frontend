# Current Task

Status: COMPLETE
Feature: FE-DISC-003 - Manual location.

Scope: Manual latitude/longitude and optional radius entry using the existing discovery API, URL-based applied state and clear-location control. The contract has no address/city geocoding endpoint.
Acceptance: Validate paired finite coordinates and positive optional radius; submit only contract fields; preserve other filters; reset page on location changes; restore direct links/history; explain malformed location URLs; accessible responsive controls; focused tests, typecheck, lint, full tests, build and whitespace check.
Exclusions: Browser geolocation, geocoding providers, sorting/pagination controls and subsequent features.

Verified 2026-09-28: All 146 tests pass (13 new manual-location cases), typecheck, lint, production build and whitespace check pass. Corrected test queries to use accessible field names. See MANUAL_LOCATION.md for behavior and the contract limitation on address lookup. No live backend integration or browser visual inspection performed. FE-DISC-004 remains unstarted. No API contract or deployment changes.
