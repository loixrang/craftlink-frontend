# Frontend Architecture

Purpose: responsive Craftlink public/customer marketplace plus artisan and admin dashboards.

Suggested organization:
```text
src/
  app/
  components/ui/
  components/layout/
  features/
  pages/
  routes/
  services/
  hooks/
  lib/
  schemas/
  types/
```
Create structure as needed; do not create empty architecture for appearance.

State: TanStack Query for server state; local React state for local interactions; minimal Context only when useful. No Redux by default.

Expected route families: `/`, `/login`, `/register`, `/artisans`, `/artisans/:artisanId`, `/customer/*`, `/artisan/*`, `/admin/*`.

Authentication follows the shared API contract. Keep API calls centralized and make route authorization role-aware.
