# Craftlink Frontend

Craftlink is a responsive marketplace frontend for customers finding nearby artisans, artisans managing their work and requests, and administrators reviewing marketplace credentials. The application uses React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, and Lucide.

## Requirements

- Node.js 22.12 or newer
- npm
- A running Craftlink API for live marketplace data (see [API contract](docs/API_CONTRACT.md))

## Run locally

```sh
npm ci
```

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` if the API is not available at the frontend origin under `/api/v1`. For a local backend, use `http://localhost:3000/api/v1`. Vite reads this public build-time setting when it starts, so restart the dev server after changing it.

```sh
npm run dev
```

The default `/api/v1` setting supports a same-origin API or a local reverse proxy. If the backend uses a different origin, configure that origin for CORS. Never put credentials or private keys in `VITE_*` variables; Vite includes them in browser assets.

## Checks and production build

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

The production bundle is written to `dist/`. `npm run preview` serves that bundle locally; it does not start or proxy the API.

## Deploy to Vercel

Import this repository into Vercel with the project root set to the repository root. Vercel detects Vite; use `npm run build` as the build command and `dist` as the output directory. The checked-in `vercel.json` rewrites application paths to `index.html`, so direct visits and reloads on React Router routes reach the client application.

Set `VITE_API_BASE_URL` in Vercel's Production environment to the HTTPS API URL ending in `/api/v1`, for example `https://api.example.com/api/v1`. Set Preview and Development values as needed for their corresponding API environments. These variables are embedded at build time: redeploy after changing them. Production rejects non-HTTPS absolute API URLs. The frontend does not proxy, host, or configure the backend; configure backend CORS to allow the deployed frontend origins.

Do not configure an API secret as a Vercel frontend environment variable. Only browser-safe values belong in `VITE_*` variables. Keep backend secrets in the backend deployment.

## Project docs

- [Architecture and feature constraints](docs/ARCHITECTURE.md)
- [Frozen API contract](docs/API_CONTRACT.md)
- [Vercel and environment details](docs/DEPLOYMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Development decisions](docs/DECISIONS.md)
