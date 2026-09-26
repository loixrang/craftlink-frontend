# AGENTS.md — Craftlink Frontend

At every session start read, in order: this file, `docs/DECISIONS.md`, `docs/API_CONTRACT.md`, `docs/ROADMAP.md`, `docs/CURRENT_TASK.md`, then inspect the repository.

If CURRENT_TASK is UNASSIGNED or COMPLETE, select the first incomplete unblocked roadmap feature, mark it `[~]`, assign it in CURRENT_TASK, and work ONLY on it.

## Session boundary
One normal session = one feature ID. After implementation: run relevant checks/tests; fix failures caused by this feature; mark `[x]` only if acceptance criteria pass; append CHANGELOG; mark CURRENT_TASK COMPLETE; report; STOP. Never begin the next feature in the same normal session.

## Required stack
React + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + React Hook Form + Zod + Lucide. Do not add Redux without explicit approval.

## API
`docs/API_CONTRACT.md` is authoritative. Never invent endpoint names or silently alter payloads. Keep HTTP access in a dedicated client/service layer and server state in TanStack Query. Handle expected error states deliberately. Never put secrets in Vite client variables.

## UI
Build a polished, responsive, mobile-first service marketplace. Warm neutral/light surfaces, charcoal text, restrained amber/orange accent, accessible focus/contrast, coherent typography/spacing, subtle borders/shadows. Use Lucide icons, not emoji. Avoid excessive gradients, glass effects, giant radii, pointless animation, and making every section a card. Customer pages should be welcoming; dashboards can be denser.

## Product
Roles: CUSTOMER, ARTISAN, ADMIN. Both browser geolocation and manual location are supported. Customers can discover artisans, view appropriate contact methods, submit requests and leave eligible reviews. Artisans manage profile/services/portfolio/credentials/location/availability/requests. No payments, internal messaging, or OAuth in V1.

## Engineering
Use strict TypeScript; do not use `any` as an escape hatch. Prefer reusable components without premature abstraction. Represent loading/error/empty/success states. Use semantic accessible HTML. Add focused tests for important current-feature behaviour. Do not disable checks or refactor unrelated working code.

## Safety
Never force-push, rewrite history, reset unrelated user changes, delete user work, commit secrets, or modify deployment/CI outside the active feature.

Agents may update ROADMAP status, CURRENT_TASK, CHANGELOG and implementation notes. Product scope, architecture, API contract and security rules require a deliberate documented decision.
