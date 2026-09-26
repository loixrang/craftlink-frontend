# Craftlink API Contract — v1

Status: FROZEN FOR INITIAL DEVELOPMENT

This file must be identical in the frontend and backend repositories. Do not silently rename endpoints, fields, roles, statuses, or response concepts.

## Conventions

- Base prefix: `/api/v1`
- JSON API
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

## Services

### POST `/api/v1/artisans/me/services`
### PATCH `/api/v1/artisans/me/services/:serviceId`
### DELETE `/api/v1/artisans/me/services/:serviceId`

Service: `id`, `categoryId`, `title`, `description`, optional `priceFrom`. Price is informational, not online payment.

## Portfolio

### POST `/api/v1/artisans/me/portfolio`
### DELETE `/api/v1/artisans/me/portfolio/:portfolioId`

Production media uses Cloudinary. Storage-management identifiers must not appear in ordinary public responses.

## Credentials

### POST `/api/v1/artisans/me/credentials`
### DELETE `/api/v1/artisans/me/credentials/:credentialId`

Credential metadata includes `id`, `title`, `issuer`, optional `issuedAt`, `verificationStatus`.
Statuses: `PENDING`, `VERIFIED`, `REJECTED`.

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
- GET `/api/v1/admin/reports`
- PATCH `/api/v1/admin/reports/:reportId`

## Health

### GET `/api/v1/health`
Suitable for Render health checks.

## Contract changes

If a real contract problem is found: do not silently invent a replacement. Document the reason in `DECISIONS.md`, deliberately update this file, record the effect in `CHANGELOG.md`, and synchronize the other repository before integration.
