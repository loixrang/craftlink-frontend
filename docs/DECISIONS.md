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
