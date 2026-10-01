# Current Task

Status: COMPLETE
Feature: FE-ADMIN-003 - Artisan management.

Added a protected ADMIN artisan directory at `/admin/artisans` with URL-backed owner account status filtering, pagination, safe runtime-validated profile summaries, and explicit loading/error/empty states. Active artisans link to their public profiles. The integration follows the published BE-ADMIN-003 GET contract; no mutations were added. Documented the contract integration and page behavior.

Validation: all 93 tests pass; lint, typecheck, production build, and `git diff --check` pass. Build reports the large-chunk warning (563.89 kB). HTTP is mocked; no live backend or browser visual verification was performed. No next feature started.
