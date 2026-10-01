# Admin user management - FE-ADMIN-002

The protected `/admin/users` page provides account listing and ACTIVE/SUSPENDED status changes to authenticated ADMIN accounts. The backend remains authoritative for access, suspension enforcement and whether a status change is allowed.

## Contract integration

The user list uses GET `/admin/users` with page, limit 20, and optional role/status filters. Page and filters are URL-backed; filters reset pagination. Responses are runtime-validated against the safe `{id,email,role,status,createdAt}` shape and consistent collection pagination. No passwords, hashes, or user update timestamps are read or cached. List queries are scoped by admin account and TanStack Query cancellation applies.

Status changes use PATCH `/admin/users/:userId/status` with exactly `{status}`. Changes require confirmation, prevent duplicate submission, do not retry automatically and refresh the list/statistics after every attempt. The current administrator is shown without a suspend control; the backend also rejects self-suspension. Missing accounts, expired sessions, permission loss, validation failures and uncertain results receive explicit feedback.

List and status details mirror the completed BE-ADMIN-002 decision and are now included in the frontend API contract. All user-management responses are no-store on the backend. No live backend or visual browser verification was performed.

## Validation

Focused tests cover request parameters/authentication, safe response validation, self-suspension UI, confirmation and exact mutation payload, filtering/pagination, route authorization and update recovery. HTTP is mocked.
