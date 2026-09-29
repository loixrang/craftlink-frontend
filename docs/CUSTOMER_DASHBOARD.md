# Customer dashboard - FE-CUST-001

The existing protected `/customer/*` route now renders a responsive customer home. The role guard withholds the page during session restoration, redirects anonymous visitors to login and denies artisan/admin accounts. The account summary uses only the authenticated user's email and customer role; no new account fields or endpoint assumptions are introduced.

The labeled search form sends a trimmed keyword to `/artisans?q=...`; blank searches open unfiltered discovery. Category shortcuts use server IDs encoded with URLSearchParams. Categories share the existing `['categories']` TanStack Query cache and validated GET `/categories` service, forward cancellation and never send the session token to that public endpoint. The page includes initial loading, refresh, error/retry and empty states. Failed refreshes hide stale category links while search and browse remain usable.

The layout uses existing neutral/amber tokens, a single h1, labeled sections, native form controls, Lucide icons, visible focus styling and mobile-first grids. Long account emails and category names wrap. Location guidance leads users to the existing discovery location controls without collecting location on dashboard entry.

Request creation and tracking are explicitly described as coming soon. This feature does not fetch request activity, invent counts, add request/history/review/account-editing routes or display a misleading zero-request state. Those workflows remain assigned to subsequent customer features. The existing customer wildcard behavior is retained until those routes are implemented.

Verification covers account display, public category fetching, keyword/category navigation, blank searches, empty/error/retry/refresh states, cancellation and role/session gating. Run the full tests with `npm.cmd test -- --maxWorkers=1`, plus lint, typecheck (also run by build), production build and `git diff --check`. HTTP is mocked; real browser layout and live backend integration are not verified by these tests.

FE-CUST-002 update: Dashboard guidance now directs customers to Request a service on artisan profiles. Request tracking remains upcoming. See CREATE_SERVICE_REQUEST.md.
