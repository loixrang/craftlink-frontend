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
