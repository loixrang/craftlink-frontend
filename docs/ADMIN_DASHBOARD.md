# Admin dashboard and credential verification - FE-ADMIN-001

The protected `/admin` dashboard replaces the admin placeholder. Only authenticated ADMIN sessions mount the page; the server remains authoritative for active-account and role checks. No user, artisan, category or report management is included.

## Verified integration

Read-only inspection of the sibling backend's `docs/DECISIONS.md`, `src/modules/admin/{model,routes,repository}.ts` and `src/modules/media/cloudinary.ts` confirms completed BE-ADMIN-001 and BE-SEC-001. These published decisions supply the details omitted by the frozen contract's admin endpoint list. No endpoint, contract or backend changes were made.

- GET `/admin/stats` takes no query and returns users, artisans, serviceRequests, reviews and pendingCredentials as nonnegative integer totals. Counts include suspended accounts/records; artisan totals count ARTISAN-owned profiles. Pending credentials counts PENDING documents.
- GET `/admin/credentials` takes page/limit and optional verificationStatus. Page is 1-1000000; this UI uses limit 20. Default UI filter is PENDING; all statuses omits the API status filter. Results have id, artisanId, title, issuer, nullable issuedAt, verificationStatus, nullable documentUrl and createdAt. Ordering is newest createdAt, then ID. Suspended owners' credentials remain reviewable.
- PATCH `/admin/credentials/:credentialId` sends exactly `{verificationStatus}`. All three values PENDING/VERIFIED/REJECTED are permitted, including corrections and reopening. Same-status requests are idempotent server-side; concurrent writes use last committed write. Missing/deleted records return 404 CREDENTIAL_NOT_FOUND. There is no reviewer history or optimistic concurrency field in V1.
- Public verification is VERIFIED if any credential is verified; otherwise PENDING when there are no credentials or any pending credential; otherwise REJECTED. This is not an identity/background check.

The service validates statistics, credential fields, identifiers, dates, statuses, HTTPS URLs, filter matching and consistent pagination before caching. Unknown fields are stripped. Queries include bearer authentication, use cancellation signals and are scoped by authenticated admin ID. Filter/page state lives in the URL. Invalid filters do not fetch credentials; empty out-of-range pages offer first-page recovery.

## Documents and privacy

The backend returns a freshly signed five-minute private download URL or null for legacy/unconfigured storage. The UI offers an explicitly opened new-tab link with noreferrer/no-referrer, never an embedded preview. Only HTTPS URLs without embedded credentials are accepted. Null documents show replacement/refresh guidance. Links are disabled after four minutes measured from request start (or earlier provider expires_at), with a timer and activation-time guard. Refresh obtains fresh links; download failure also directs the reviewer to refresh. Provider-side expiry enforcement remains authoritative.

Signed links remain only in the active in-memory admin query. Credential query gcTime is zero, so navigation removes inactive credential queries; existing sign-out clears all caches. No signed URL is placed in browser storage, the app's route URL, mutation results or public caches. Opening a download can leave an external browser tab/download outside the app's control. Existing provider security/legacy replacement limitations are documented in backend SECURITY.md; this frontend does not migrate legacy documents.

## Writes and feedback

Status changes require explicit confirmation; cancellation does not write. A synchronous lock and pending controls prevent duplicate submits. Mutations never retry automatically. Every completed attempt refreshes the admin list/statistics and invalidates the affected public profile/discovery caches without inserting mutation responses. Success feedback remains visible when the record leaves the current filter. Failures explain authentication, permission, missing-record and conflict states; an explicit refresh is required before retry. Failed reads hide stale statistics/credential documents. Statistics and credential errors recover independently.

Semantic sections, labeled select, native buttons and links, readable status badges and live feedback use existing mobile-first tokens; lists and controls wrap on small screens. Focused tests cover authorization, payloads, confirmation/cancellation, duplicate prevention, refresh/invalidation, corrections, errors, filters/pagination, expiry/null documents, safe links, response validation, cache cleanup and cancellation.

Validation commands: `npm.cmd test -- --maxWorkers=1`, `npm.cmd run lint`, `npm.cmd run build` (includes typecheck), `git diff --check`. Tests mock HTTP. Live backend/Cloudinary integration and visual browser inspection are not covered.
