# Registration — FE-AUTH-001

`/register` uses React Hook Form with a Zod resolver and a TanStack Query mutation. Customer is the default; native radio controls allow artisan selection. Public ADMIN registration is rejected by the schema.

`src/services/registration.ts` sends only `email`, `password` and `role` to the contract endpoint `POST /auth/register` through the shared API client. Password confirmation stays local. Email whitespace is trimmed; password whitespace is preserved. Validation requires a valid email, nonempty password and matching confirmation. The contract specifies no password length/complexity policy, so backend validation messages remain authoritative.

Pending submissions disable controls and announce progress; an additional synchronous guard prevents repeated submission. Failures preserve inputs for correction. Conflict, rate-limit, network and server errors have deliberate messages; other contract errors show their message without rendering raw details. Mutations never retry automatically.

Success clears the form and displays a login link. The returned token is discarded, mutation variables contain no credentials, and inactive mutations are garbage-collected immediately. No local/session storage or authenticated state is introduced. Login remains the FE-AUTH-002 placeholder; session restoration and guards belong to FE-AUTH-003.

Verification: 10 focused tests cover both roles, exact request payload, confirmation and required-field validation, focus, pending duplicate prevention, success, conflict/validation/rate-limit/server/network errors and corrected retries. The full 64-test suite, lint, typecheck, production build and whitespace checks pass. HTTP is mocked; live integration and visual browser inspection remain unverified.

Validation API reference: [Zod schema documentation](https://zod.dev/api?id=emails).
