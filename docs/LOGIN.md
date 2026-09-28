# Login and authenticated state — FE-AUTH-002

FE-AUTH-003 update: see SESSION.md and DECISIONS.md. Tab-scoped token persistence, verified restoration, role navigation and guards now replace the reload-to-anonymous behavior described in this historical feature record.

`/login` uses React Hook Form, Zod and a TanStack mutation. It trims email whitespace, preserves passwords exactly, validates required fields and sends only email/password to `POST /auth/login` through the shared API client. Pending submissions disable inputs and a synchronous guard prevents duplicates. Invalid credentials, account restrictions, validation, rate limiting, network and server failures have deliberate feedback and allow retries without automatic resubmission.

The service validates the returned `data.user` (id, email, CUSTOMER/ARTISAN/ADMIN role) and nonempty `data.accessToken` before authenticating. Unknown response fields are discarded. Tests use this user-summary shape; live backend compatibility remains unverified because the frozen contract describes the summary without a field-level response example.

`AppProviders` owns the in-memory session. `useAuth()` exposes session, signIn and signOut to descendants. Endpoint services can receive `session.accessToken` explicitly through the existing API client's bearer option. Sign-in and sign-out clear the query/mutation cache to prevent reuse across identities. Login credentials and returned sessions are not stored as mutation variables/results, logged or written to browser storage. The login success view shows the account email, discovery link and sign-out button.

Client navigation retains the session; a full reload starts anonymous. Persistence/restoration, protected routes and role-aware navigation belong to FE-AUTH-003. Registration continues to lead to login. Sign-out is local because the contract defines no logout endpoint; it does not revoke the backend token.

Verification: all 79 tests pass, including 15 new login tests covering validation/focus, exact payload, all roles, pending duplicates, expected errors/retries, malformed responses, navigation, cache clearing, storage avoidance and remount behavior. Lint, typecheck, production build and whitespace checks pass. HTTP is mocked; live backend integration and browser visual inspection were not performed.
