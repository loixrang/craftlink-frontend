# Admin artisan management - FE-ADMIN-003

The protected `/admin/artisans` directory lists artisan profile summaries for authenticated administrators. It supports URL-backed owner account status filters and standard pagination. The endpoint is read-only; profile or account changes are not performed here.

The page follows the published BE-ADMIN-003 decision, verified against the sibling backend admin model, route and repository. It sends only `page`, `limit` and optional `status` to GET `/admin/artisans`. Results are runtime-validated against the exact safe API contract allowlist, including profile ID, owner email/status, display name, experience, city/state, availability, derived credential verification, nullable rating, review count and profile creation time. Contact details, coordinates, bio, media identifiers and private credential documents are not requested or retained. Queries are scoped by administrator account and use cancellation.

Loading, refresh, API error, invalid-filter, empty and out-of-range page states are explicit. Suspended profiles remain listed by default and can be filtered. Active profiles link to their public detail page; suspended profiles do not expose that link because the public route hides suspended accounts. Verification and ratings are summaries, not independent safety or quality guarantees.

Focused tests cover authentication/role gating, exact request parameters and bearer auth, safe field validation, status filtering, pagination recovery and API errors. HTTP is mocked; live backend and visual browser verification are not performed.
