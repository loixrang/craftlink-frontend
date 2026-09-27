# Current Task

Status: COMPLETE
Feature: FE-004 - Router, TanStack Query and API-client foundation

Objective: Establish route skeletons, the shared query provider and a safe centralized API client.
Scope: Expected route families and not-found screen, router-aware shell navigation, query defaults, validated public API base URL, typed JSON requests/errors and focused tests.
Exclusions: Landing page, authentication/session state, role guards, feature API integration and deployment configuration.
Acceptance: Route skeleton and client-side navigation work; query provider is available; API base configuration is safe; focused tests, typecheck, lint and production build pass.

Verified 2026-09-27: All 49 tests, lint, typecheck, production build and diff whitespace check pass. Dependency installation reports zero vulnerabilities. See API_FOUNDATION.md for setup and usage. Tests use mocked HTTP; live backend integration and browser visual inspection were not performed. FE-005 remains unstarted; no API contract, product scope, architecture or deployment changes.
