# Frontend deployment and environment configuration

## Environment variables

`VITE_API_BASE_URL` is the only frontend environment variable currently read by the application. It is public build-time configuration, not a secret. The default `/api/v1` targets a same-origin backend or reverse proxy. An absolute URL must end in `/api/v1`; production builds accept only HTTPS origins. The API client rejects credentials, query strings, fragments, and other API prefixes.

Use `.env.local` for local overrides. The committed `.env.example` contains the safe same-origin default. For a separate local API, set `VITE_API_BASE_URL=http://localhost:3000/api/v1`. Restart Vite after changing the value. For hosted builds, define the variable in the deployment platform's build environment and rebuild after changes.

Because Vite exposes `VITE_*` values to browser code, never store passwords, tokens, signing keys, or other secrets in them. The frontend omits cookies from API requests. A cross-origin API must allow the frontend origin through its CORS policy.

## Vercel

The project uses Vite's standard production build: `npm run build`, with output in `dist`. `vercel.json` rewrites incoming paths to `/index.html`, supporting direct navigation and reloads for React Router routes such as `/artisans`, `/customer/requests`, `/artisan/media`, and `/admin`.

The production build also emits `/robots.txt` and `/sitemap.xml`. Set `VITE_SITE_URL` to the canonical HTTPS frontend origin in Vercel Production (without a path or trailing slash) when using a custom domain. Otherwise the build uses Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, then falls back to `https://craftlink.loixrang.com/`. The sitemap lists the landing and artisan discovery routes; public profile URLs are API-backed and cannot be enumerated at build time. Login, registration, and authenticated routes are excluded from the sitemap, receive a Vercel `X-Robots-Tag: noindex, nofollow` response header, and set matching client metadata. Public route titles, descriptions, and canonical links are updated client-side; this Vite SPA does not server-render route content.

Configure the Vercel project with the repository root as its root directory, `npm run build` as its build command, and `dist` as its output directory. Set `VITE_API_BASE_URL` to the deployed HTTPS backend URL ending in `/api/v1` for Production, Preview, and Development as appropriate. Preview deployments should use a backend configured to permit their origin. The frontend deployment does not create an API proxy or deploy the backend.

Use `npm run preview` to inspect the built frontend locally. Preview serves static assets and client routes; API functionality still requires a reachable backend.

## Local verification

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Tests mock network requests and do not verify backend reachability, Vercel configuration in a deployed project, or browser-level visual behavior.
