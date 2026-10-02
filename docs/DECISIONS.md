# Craftlink Architecture Decisions

These decisions are constraints unless the user explicitly changes them.

- Product: **Craftlink**, a marketplace connecting customers with nearby skilled artisans.
- Roles: `CUSTOMER`, `ARTISAN`, `ADMIN`.
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Lucide.
- Backend: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, Zod.
- Authentication V1: email/password. No Google/OAuth unless explicitly requested.
- Location: support both browser geolocation and manual location. Permission denial must have a manual fallback.
- Interaction: customers may view appropriate public contact methods and submit service requests.
- No internal messaging in V1.
- No payments/escrow in V1.
- Media: Cloudinary for production uploads, behind a small service abstraction.
- Deployment: frontend Vercel; backend Render; database PostgreSQL.
- API: REST under `/api/v1`; `API_CONTRACT.md` is authoritative.
- One normal Codex session implements one roadmap feature only, then tests, documents, reports, and stops.
- A feature is complete only when its acceptance criteria and relevant checks pass.
- Do not introduce GraphQL, Redux, WebSockets, microservices, payments, chat, AI recommendations, or major new infrastructure without explicit approval.
- Never expose secrets, password hashes, raw auth tokens in logs, exact private coordinates unnecessarily, or private credential documents.
- Visual direction: warm neutral/light surfaces, dark charcoal typography, restrained amber/orange accent, accessible contrast, generous whitespace, subtle borders and restrained shadows. Avoid excessive gradients, glassmorphism, decorative clutter, emoji icons, and giant rounded cards.

## 2026-09-28 - FE-AUTH-003 session restoration

Persist only the V1 bearer token in tab-scoped sessionStorage for reload restoration; never persist passwords or trusted user/role data. Verify through GET /auth/me before restoring access. Unavailable storage falls back to in-memory login. This replaces FE-AUTH-002 reload-to-anonymous behavior. Session storage is accessible to same-origin JavaScript, including XSS; it is not an HttpOnly cookie. No refresh/logout endpoint or cookie authentication is introduced. Sign-out removes storage and clears caches. Backend authorization remains authoritative. No API contract changes.

## 2026-09-30 - FE-ART-004 request integration

Adopt the already documented BE-REQ-001/002 details from the sibling backend DECISIONS.md, verified against its implementation. Artisan status mutations send exactly {status}; permitted transitions are PENDING to ACCEPTED/DECLINED, ACCEPTED to IN_PROGRESS and IN_PROGRESS to COMPLETED. Listing uses standard page/limit pagination and the private request shape, including nullable serviceId and a preserved serviceTitle. Server ownership/transition checks remain authoritative; the frontend validates responses, strips unused participant identity, confirms writes and refreshes after attempts. This resolves the prior missing-policy blocker using published backend decisions, with no frozen endpoint/field changes. See ARTISAN_REQUESTS.md for errors and integration details.

## 2026-09-30 - FE-ADMIN-001 admin integration

Adopt published backend BE-ADMIN-001 and BE-SEC-001 details, verified against admin routes/models/repository and the Cloudinary provider. Admin statistics and credential listing use the documented fields/pagination; verification PATCH sends exactly {verificationStatus}, supports all three statuses and uses the backend's last-committed-write policy. Private documentUrl is nullable and otherwise a signed five-minute download link, never a permanent public asset. Frontend links expire conservatively, remain in active admin memory only and are excluded from mutation/public caches. This resolves undefined admin integration details without changing the frozen contract or backend. See ADMIN_DASHBOARD.md for policy, states, privacy and validation limits.

## 2026-10-01 - FE-ADMIN-003 artisan management

Adopt the published BE-ADMIN-003 decision, verified against the sibling backend admin model, route, and repository. The protected artisan directory uses only GET `/admin/artisans`, optional owner account status filtering, bounded pagination, and the exact safe item allowlist recorded in API_CONTRACT.md. The endpoint is read-only; this feature adds no mutation behavior or contract fields. See ADMIN_ARTISANS.md for presentation and validation behavior.

## 2026-10-01 - FE-ADMIN-002 user management

Mirror the completed backend BE-ADMIN-002 decision, verified against its admin model/routes/repository. The frontend API contract now records the published list fields, filters, pagination and exact status mutation payload, including self-suspension protection and USER_NOT_FOUND. No endpoint or behavior is invented or changed. See ADMIN_USERS.md for the UI integration.

## 2026-10-01 - FE-ADMIN-004 category management

Mirror the completed backend BE-ADMIN-004 decision, verified against its admin model/routes/repository. Category create/rename/delete use the published strict request and response shapes, duplicate/in-use/missing errors, and active-admin guard. Category administration details are synchronized into API_CONTRACT.md. No endpoint, payload or persistence behavior is invented or changed. See ADMIN_CATEGORIES.md for UI behavior.

## 2026-10-02 - Discovery location filters by state and city

Discovery location is administrative, not geometric. `GET /api/v1/artisans` accepts optional `state` and `city` query parameters, added to the contract alongside the existing parameters. `state` matches the artisan's stored state and `city` matches the artisan's stored city value, which is a local government area within that state. The frontend sends `state` on every discovery request and sends `city` only when a city is selected. `lga` is a URL alias accepted when reading discovery links; it is normalized to `city` before the request and is never sent as a query parameter.

Rationale: the shipped location control is a state plus city/LGA selector driven by `SUPPORTED_STATES` and `getLgasForState` in `src/constants/locations.ts`, and artisan profiles store `city` and `state` as plain strings, so an administrative filter is the honest match for both sides. Coordinate filtering via `latitude`, `longitude` and `radiusKm` remains in the contract as a backend capability and is unused by this frontend, so `sort=distance` stays unavailable exactly as it already was, and the optional `distanceKm` summary field stays unused.

This corrects a documented drift rather than choosing between two designs: `MANUAL_LOCATION.md` and `BROWSER_LOCATION.md` described coordinate entry and browser geolocation that no longer exist in the code, while the implemented control has always been a city/LGA selector. Those documents, and the FE-DISC-003/FE-DISC-004 notes in `ARTISAN_SEARCH.md`, are corrected to match the implementation.

Consequences: no endpoint, verb, payload or existing query parameter is changed or removed; this is purely additive. The sibling backend repository must be synchronized before integration. If the backend does not accept `state` and `city`, discovery requests would be rejected under strict query validation or the filters would be silently ignored. `ROADMAP.md` still marks FE-DISC-004 (browser geolocation) complete although no geolocation code exists; that marker needs a separate product decision and is deliberately left unchanged here.
