# Artisan profile management - FE-ART-002

The artisan-only `/artisan/profile` route provides profile setup/editing, contact details, profile image URL, experience, location, availability and service create/edit/delete. The dashboard links to it. Portfolio/credential uploads and incoming request management remain separate roadmap features.

Owner reads and PUT writes use `/artisans/me`. A separate user-scoped query retains only the editable owner fields, including coordinates needed by the owner form; the dashboard's existing summary cache still strips private fields. Nothing is written to browser storage or URL parameters. A save completing after the editor unmounts cannot repopulate the owner cache. Existing session handling clears caches on sign-out.

Manual city/state are required; paired coordinates are optional. Browser location runs only on explicit activation and fills a draft, with permission/error/manual fallback. Manual changes, cancellation, clearing, submission and unmount invalidate old callbacks. Coordinates reach the API only on Save profile. Clearing optional contacts, image URL and coordinates sends nulls. Profile saves invalidate dashboard, public profile and discovery queries.

Services are read from the contract's public profile endpoint, because there is no separate service-list endpoint. POST/PATCH/DELETE use the authenticated `/artisans/me/services` routes. Category selection uses the existing category query. Forms preserve drafts on failures, prevent concurrent submissions, and distinguish session, validation, conflict, rate-limit and uncertain-result errors. Deletion requires an inline confirmation. Successful changes invalidate the public profile/service list and discovery cache. Prices allow two decimal places and are informational; no currency is invented.

Read-only inspection of sibling backend `profile.ts`, `location.ts`, `services.ts` and their routers confirmed field names, nullable clearing, limits, missing-profile handling, PUT upsert behavior and service mutation payloads. No backend or API contract files changed. Backend ownership and authorization remain authoritative.

Verification uses mocked HTTP and geolocation: profile payloads/setup/validation, mutation errors, duplicate protection, service mutations/confirmation/refresh, empty categories/services, owner load recovery/cancellation, stale save completion, browser draft/fallback/stale callbacks, and role gating. Live backend integration and visual browser verification were not performed. The production build retains the existing non-blocking chunk-size warning.
