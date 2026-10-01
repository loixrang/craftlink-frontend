# Current Task

Status: COMPLETE
Feature: FE-ADMIN-002 - User management.

Added protected ADMIN user management with URL-backed role/status filters, pagination, safe account fields and confirmed ACTIVE/SUSPENDED changes. Current-admin self-suspension is blocked in the UI and by the server. Mirrored the published BE-ADMIN-002 list/update contract in API_CONTRACT.md and documented the page in ADMIN_USERS.md.

Validation: all 88 tests pass; lint, typecheck, production build and git diff --check pass. Build reports the existing large-chunk warning (557.61 kB). HTTP is mocked; no live backend or browser visual verification was performed. No next feature started.
