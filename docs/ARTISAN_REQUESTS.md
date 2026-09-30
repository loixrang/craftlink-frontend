# Incoming service request management - FE-ART-004

The protected `/artisan/requests` page lists incoming requests with expandable project details, service title, preferred date and status. It is linked from the artisan dashboard. Native details/summary controls work with the keyboard. Layout and controls wrap on small screens; long text breaks within the content width.

## Backend dependency resolved (2026-09-30)

Read-only inspection confirms BE-REQ-001/002 are complete. Backend `docs/DECISIONS.md` now explicitly documents private request fields, pagination, PATCH payload, transitions and conflict semantics, corroborated by `src/modules/service-requests/{model,routes,transitions,repository}.ts`. These published decisions resolve the previous missing implementation/policy blocker without inventing endpoints or altering the frozen API contract. The earlier requirement to clarify undefined behavior is met by these backend decisions; no backend or contract edit is necessary.

GET `/service-requests/me` accepts page (1-1000000) and limit (20 here). Items contain id, customerId, artisanId, nullable serviceId, serviceTitle, description, nullable preferredDate, status, createdAt and updatedAt. The UI strips unused customerId and unknown fields before caching. Deleted services retain their title and request management remains available. Listing without a profile returns an empty collection. Results are ordered newest first, then ID ascending; pagination uses the standard collection envelope. Invalid URL pages do not fetch; invalid response shapes/pagination produce an error.

PATCH `/service-requests/:requestId/status` sends exactly `{status}` with a bearer token. ARTISAN actions: PENDING to ACCEPTED or DECLINED; ACCEPTED to IN_PROGRESS; IN_PROGRESS to COMPLETED. Other statuses have no actions. Each action requires confirmation; cancellation sends no request. The server enforces current account status, ownership and transitions and returns the updated private request. Missing/unowned IDs return 404 REQUEST_NOT_FOUND; invalid transitions return 409 INVALID_REQUEST_TRANSITION; concurrent state changes can return 409 REQUEST_STATE_CONFLICT. The UI handles authentication/access failures and conflicts explicitly, refreshes after mutation attempts and never automatically retries a mutation.

Queries are scoped to the authenticated artisan ID and consume cancellation signals. Mutation results are validated but never inserted into caches after navigation/sign-out. Status writes invalidate only that artisan's incoming queries. During writes, a synchronous lock and pending state prevent duplicate confirmation. On failure, the UI requires an explicit refresh before offering another action; failed refreshes hide stale requests. Loading, refreshing, error/retry, empty, out-of-range, success and terminal-status states are included.

## Validation

Focused mocked-HTTP tests cover payloads/authentication, allowed transitions, confirmation/cancellation, duplicate protection, refreshed status, access gating, pagination, malformed data, failures/retry and query cancellation. Run full tests, lint, typecheck (also included in build), production build and whitespace checks. Live API integration and visual browser verification are not covered. No later roadmap feature is included.
