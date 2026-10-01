# Current Task

Status: COMPLETE
Feature: FE-CUST-005 - Account/profile basics.

Selected as the first incomplete, unblocked roadmap feature. Added a protected customer account page for verified email and customer role, linked it from customer navigation and the dashboard, and documented the API boundary in CUSTOMER_ACCOUNT.md. The frozen contract has no customer profile update endpoint, so the page does not invent editable fields or API operations.

Validation: all 84 tests pass, lint, typecheck, production build, and git diff --check pass. Build reports the existing main-chunk size warning (549.99 kB). No live backend or browser visual verification was performed. No next feature started.
