# Craftlink API Contract — v1

Status: FROZEN FOR INITIAL DEVELOPMENT

This file must be identical in the frontend and backend repositories. Do not silently rename endpoints, fields, roles, statuses, or response concepts.

## Conventions

- Base prefix: `/api/v1`
- JSON responses; JSON request bodies except the multipart media uploads defined below.
- Roles: `CUSTOMER`, `ARTISAN`, `ADMIN`
- String IDs; ISO 8601 date/time strings
- Pagination default: page 1, limit 20
- Protected endpoints use Bearer JWT in V1 unless an explicitly documented synchronized decision changes authentication.
- Public responses never expose password hashes, secrets, private credential documents, or exact private coordinates unnecessarily.

Success:
```json
{"data": {}}
```

Collection:
```json
{"data":[],"pagination":{"page":1,"limit":20,"total":0,"totalPages":0}}
```

Error:
```json
{"error":{"code":"VALIDATION_ERROR","message":"Human-readable message","details":{}}}
```

## Auth

### POST `/api/v1/auth/register`
Body: `email`, `password`, `role` (`CUSTOMER` or `ARTISAN`; never public `ADMIN`).
Returns user summary + `accessToken`.

### POST `/api/v1/auth/login`
Body: `email`, `password`. Returns user summary + `accessToken`.

### GET `/api/v1/auth/me`
Protected. Returns current user.

## Categories

### GET `/api/v1/categories`
Public.

Initial categories: Electrical Services; Plumbing; Carpentry; Painting; Welding; Tailoring/Fashion Design; Automobile Repair; Appliance Repair; Phone/Computer Repair; Photography; Barbing/Hair Styling; Tiling; Furniture Making; AC/Refrigeration Services; General Maintenance.

## Artisan discovery

### GET `/api/v1/artisans`
Optional query: `q`, `categoryId`, `latitude`, `longitude`, `radiusKm`, `minRating`, `minExperience`, `availability`, `sort`, `page`, `limit`.

`sort`: `distance`, `rating`, `experience`, `newest`. Coordinates are required for distance sorting/filtering.

Each result contains public summary fields including `id`, `displayName`, `bio`, `yearsExperience`, `profileImageUrl`, `city`, `state`, `isAvailable`, `verificationStatus`, `averageRating`, `reviewCount`, nullable `distanceKm`, and `categories`.

### GET `/api/v1/artisans/:artisanId`
Public detail: profile, public contact methods, services, portfolio, safe credential metadata, rating/review summary. Do not return exact stored coordinates or private credential documents.

## Artisan self-service

### GET `/api/v1/artisans/me`
`ARTISAN` only.

### PUT `/api/v1/artisans/me`
`ARTISAN` only. Supports display name, bio, experience, phone, WhatsApp, city, state, optional latitude/longitude, availability, profile image.

`profileImageUrl` remains an optional HTTPS URL reference (max 2048 characters,
no embedded credentials). PUT is full replacement: omission/null clears it.
Resubmitting the current managed image URL retains it; changing/clearing it
queues the old managed image for deletion. External URLs are never fetched or
deleted. To upload a file, use the profile-image route below and retain its
returned URL in subsequent full profile PUT requests.

### POST `/api/v1/artisans/me/profile-image`
Active `ARTISAN` only, existing profile required. Multipart upload with exactly
one `file` part and no text fields, using the image rules below. Replaces the
current image; returns 200 `{"data":{"profileImageUrl":"https://..."}}`.
The old managed image is queued for deletion. Failed uploads preserve the old image.

### DELETE `/api/v1/artisans/me/profile-image`
Active `ARTISAN` only, existing profile required. No body (or empty JSON object).
Clears the reference and queues any managed image for deletion. Returns 200
`{"data":null}`, including when the existing profile already has no image.

## Services

### POST `/api/v1/artisans/me/services`
### PATCH `/api/v1/artisans/me/services/:serviceId`
### DELETE `/api/v1/artisans/me/services/:serviceId`

Service: `id`, `categoryId`, `title`, `description`, optional `priceFrom`. Price is informational, not online payment.

## Portfolio

### POST `/api/v1/artisans/me/portfolio`

Active `ARTISAN` only, existing profile required. Send `multipart/form-data`
with exactly one binary `file` part, required `title` (trimmed, 1-100 characters)
and optional `description` (trimmed, 0-2000 characters, default empty string).
Each field appears at most once. Unknown fields, extra files, and query
parameters are rejected. Do not send JSON/base64, URLs, owner IDs, storage IDs,
Cloudinary parameters or credentials. The browser must set the multipart
boundary (do not manually set Content-Type when sending FormData).

Accepted files: static JPEG (`image/jpeg`), PNG (`image/png`) or WebP
(`image/webp`), at most 5 MiB (5,242,880 bytes) and 25,000,000 decoded pixels.
The declared MIME must match decoded content; filenames/extensions are ignored.
Empty, corrupt, truncated, animated, SVG, GIF, video and document uploads are
rejected. The backend auto-orients and re-encodes to WebP, stripping metadata
(including EXIF/GPS). These same rules apply to profile-image uploads.

Returns 201 with exactly this item shape:
```json
{"data":{"id":"uuid","title":"Kitchen installation","description":"Completed cabinetry","imageUrl":"https://...","width":1200,"height":800,"createdAt":"2026-09-29T12:00:00.000Z"}}
```
Dimensions describe the stored, oriented image. Each successful POST creates a
new item; it is not idempotent. There is no portfolio edit endpoint in V1.

### DELETE `/api/v1/artisans/me/portfolio/:portfolioId`

Active `ARTISAN` only. `portfolioId` is a UUID. No body (or empty JSON object),
no query parameters. Ownership comes from the authenticated user. Missing and
other-owner IDs both return 404 `PORTFOLIO_NOT_FOUND`; repeat deletion returns
the same 404. Success returns 200 `{"data":null}` and immediately removes the
item from API reads. Managed storage deletion is durably queued and retried;
Cloudinary/CDN invalidation is asynchronous, so an old public URL may briefly
remain accessible. This public-media behavior does not apply to credentials.

Public GET `/api/v1/artisans/:artisanId` returns `portfolio` as an array of the
exact item shape above (without the `data` wrapper), newest `createdAt` first,
then ID ascending; empty portfolios return `[]`. Existing public account
visibility rules apply. Frontends can use this detail route to reload their
portfolio; no additional owner-list route is introduced.

All media mutations reject unknown queries and require Bearer JWT, an ACTIVE
account and ARTISAN role; ADMIN has no bypass. Errors use the standard envelope:
401 `UNAUTHENTICATED`; 403 `FORBIDDEN`/`ACCOUNT_SUSPENDED`; 404
`ARTISAN_PROFILE_NOT_FOUND` on upload/profile-image operations before profile
setup; 400 `VALIDATION_ERROR` for malformed multipart/fields/IDs; 400
`INVALID_IMAGE` for unsupported/mismatched/corrupt image content; 413
`PAYLOAD_TOO_LARGE` for files over 5 MiB; 415 `UNSUPPORTED_MEDIA_TYPE` for
non-multipart uploads or non-JSON deletion bodies; 409 `MEDIA_UPLOAD_EXPIRED` if an upload reservation
expires; 503 `MEDIA_UNAVAILABLE` for unavailable/unconfigured storage; generic
500 `INTERNAL_ERROR` for unexpected persistence failures. Mutations use no-store.

Production media uses server-side Cloudinary uploads behind a media service.
No direct browser-to-Cloudinary upload, unsigned preset, signing endpoint or
frontend Cloudinary secret is provided. Storage-management IDs and provider
responses are never separate public fields; image delivery URLs are public
and necessarily include their delivery path. Credentials remain a separate,
unimplemented private-document capability.

## Credentials

### POST `/api/v1/artisans/me/credentials`

Active `ARTISAN` only, existing profile required. Send `multipart/form-data`
with exactly one binary `file` part, required `title` (trimmed, 1-100 characters),
required `issuer` (trimmed, 1-100 characters), and optional `issuedAt` (ISO 8601
date string not in the future; omitted or empty string yields null).
Each field appears at most once. Unknown fields, extra files, and query
parameters are rejected. Do not send JSON/base64, URLs, owner IDs, storage IDs,
Cloudinary parameters or credentials. The browser must set the multipart
boundary (do not manually set Content-Type when sending FormData).

Accepted files: static JPEG (`image/jpeg`), PNG (`image/png`) or WebP
(`image/webp`), at most 5 MiB (5,242,880 bytes) and 25,000,000 decoded pixels.
The declared MIME must match decoded content; filenames/extensions are ignored.
Empty, corrupt, truncated, animated, SVG, GIF, video and document uploads are
rejected. The backend auto-orients and re-encodes to WebP, stripping metadata
(including EXIF/GPS). Initial `verificationStatus` is `PENDING`.

Returns 201 with exactly this item shape:
```json
{"data":{"id":"uuid","title":"Trade certificate","issuer":"Trade school","issuedAt":"2024-01-02T00:00:00.000Z","verificationStatus":"PENDING","createdAt":"2026-09-29T12:00:00.000Z"}}
```
Each successful POST creates a new credential record; it is not idempotent.
There is no credential edit endpoint in V1.

### GET `/api/v1/artisans/me/credentials`

Active `ARTISAN` only, existing profile required. No query parameters.
Returns 200 with an array of the owner's credentials in the item shape above,
ordered by newest `createdAt` first, then `id` ascending:
```json
{"data":[{"id":"uuid","title":"Trade certificate","issuer":"Trade school","issuedAt":"2024-01-02T00:00:00.000Z","verificationStatus":"PENDING","createdAt":"2026-09-29T12:00:00.000Z"}]}
```
Empty credentials return `{"data":[]}`.

### DELETE `/api/v1/artisans/me/credentials/:credentialId`

Active `ARTISAN` only. `credentialId` is a UUID. No body (or empty JSON object),
no query parameters. Ownership comes from the authenticated user. Missing and
other-owner IDs both return 404 `CREDENTIAL_NOT_FOUND`; repeat deletion returns
the same 404. Success returns 200 `{"data":null}` and immediately removes the
item from API reads. Managed storage deletion is durably queued and retried via
the media cleanup worker.

Public GET `/api/v1/artisans/:artisanId` returns `credentials` as an array of
safe public metadata items (excluding `documentUrl`, `storageId`, and `createdAt`),
newest `createdAt` first, then ID ascending; empty credentials return `[]`:
```json
[{"id":"uuid","title":"Trade certificate","issuer":"Trade school","issuedAt":"2024-01-02T00:00:00.000Z","verificationStatus":"PENDING"}]
```
Private document URLs, Cloudinary storage identifiers, and credentials are
never exposed through public artisan responses. Statuses: `PENDING`, `VERIFIED`,
`REJECTED`.

All credential mutations reject unknown queries and require Bearer JWT, an ACTIVE
account and ARTISAN role; ADMIN has no bypass. Errors use the standard envelope:
401 `UNAUTHENTICATED`; 403 `FORBIDDEN`/`ACCOUNT_SUSPENDED`; 404
`ARTISAN_PROFILE_NOT_FOUND` on operations before profile setup; 404
`CREDENTIAL_NOT_FOUND` on deletion of missing/unowned credentials; 400
`VALIDATION_ERROR` for malformed multipart/fields/IDs/dates; 400 `INVALID_IMAGE`
for unsupported/mismatched/corrupt image content; 413 `PAYLOAD_TOO_LARGE` for
files over 5 MiB; 415 `UNSUPPORTED_MEDIA_TYPE` for non-multipart uploads or
non-JSON deletion bodies; 409 `MEDIA_UPLOAD_EXPIRED` if an upload reservation
expires; 503 `MEDIA_UNAVAILABLE` for unavailable/unconfigured storage; generic
500 `INTERNAL_ERROR` for unexpected persistence failures. Mutations use no-store.

## Service requests

Statuses: `PENDING`, `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

### POST `/api/v1/service-requests`
`CUSTOMER` only. Body: `artisanId`, `serviceId`, `description`, optional `preferredDate`.

### GET `/api/v1/service-requests/me`
Returns requests relevant to authenticated customer/artisan.

### PATCH `/api/v1/service-requests/:requestId/status`
Enforce role, ownership and valid state transitions server-side.

## Reviews

### POST `/api/v1/reviews`
`CUSTOMER` only. Body: `serviceRequestId`, rating 1–5, comment. Only eligible completed requests; one review per request.

### GET `/api/v1/artisans/:artisanId/reviews`
Public, paginated.

## Admin

All `/api/v1/admin/*` require `ADMIN`.

- GET `/api/v1/admin/stats`
- GET `/api/v1/admin/users`
- PATCH `/api/v1/admin/users/:userId/status`
- GET `/api/v1/admin/artisans`
- POST `/api/v1/admin/categories`
- PATCH `/api/v1/admin/categories/:categoryId`
- DELETE `/api/v1/admin/categories/:categoryId`
- GET `/api/v1/admin/credentials`
- PATCH `/api/v1/admin/credentials/:credentialId`

`GET /api/v1/admin/users` accepts only `page` (default 1, max 1,000,000),
`limit` (default 20, max 100), `role` (`CUSTOMER`, `ARTISAN`, `ADMIN`), and
`status` (`ACTIVE`, `SUSPENDED`). Filters combine with AND. Results are ordered
by newest `createdAt`, then ID ascending, and return `{id,email,role,status,createdAt}`
with ISO timestamps in the standard collection envelope. Counts and rows use
one repeatable-read snapshot.

`PATCH /api/v1/admin/users/:userId/status` accepts a UUID and exactly
`{"status":"ACTIVE"}` or `{"status":"SUSPENDED"}`, with no query fields.
It returns `{id,email,role,status,createdAt}`. Repeating the current status is
successful. Missing users return 404 `USER_NOT_FOUND`; an administrator cannot
suspend their own account and receives 409 `SELF_SUSPENSION_NOT_ALLOWED`.
Both endpoints require a current ACTIVE ADMIN and use no-store.

`GET /api/v1/admin/artisans` accepts only `page` (default 1, max 1,000,000),
`limit` (default 20, max 100), and optional owner account `status`
(`ACTIVE`/`SUSPENDED`). It lists artisan profiles regardless of account status,
ordered newest profile first then ID ascending, with counts and rows from one
repeatable-read snapshot. Items contain only `{id,email,accountStatus,
displayName,yearsExperience,city,state,isAvailable,verificationStatus,
averageRating,reviewCount,createdAt}`. Credential verification is the derived
summary documented in BE-ADMIN-001. Coordinates, contact methods, bio, image
storage identifiers and credential documents are excluded. The route requires
a current ACTIVE ADMIN and uses no-store.
- GET `/api/v1/admin/reports`
- PATCH `/api/v1/admin/reports/:reportId`

## Health

### GET `/api/v1/health`
Suitable for Render health checks.

## Contract changes

If a real contract problem is found: do not silently invent a replacement. Document the reason in `DECISIONS.md`, deliberately update this file, record the effect in `CHANGELOG.md`, and synchronize the other repository before integration.
