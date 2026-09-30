# Router, query and API foundation — FE-004

`src/main.tsx` mounts `AppProviders` and `BrowserRouter`. `AppProviders` owns one QueryClient per mount. Tests can use `MemoryRouter` and a fresh provider to avoid shared history/cache. The shell uses router links and automatic active navigation.

`src/routes/AppRoutes.tsx` reserves `/`, `/login`, `/register`, `/artisans`, `/artisans/:artisanId`, `/customer/*`, `/artisan/*` and `/admin/*`, with an unknown-route recovery link. These are placeholders only. Dashboard placeholders expose no data; authentication, session restoration and role guards belong to FE-AUTH-003. No feature endpoints are called on startup.

## Configuration

Copy `.env.example` to `.env.local` when needed, then restart Vite. `VITE_API_BASE_URL` is public build-time configuration, never a secret. It defaults to `/api/v1`, which requires a same-origin backend or reverse proxy. For a separate local backend use, for example, `http://localhost:3000/api/v1`. Production absolute URLs must use HTTPS. Credentials, query strings, fragments and incorrect prefixes are rejected without echoing their contents. Cross-origin backends must permit the frontend origin through CORS. See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel rewrites and production environment setup.

## Service usage

Keep endpoint-specific calls in `src/services/`. Import `api`, then call `api.request<ApiResponse<T>>('/contract-path', { signal })` or use `CollectionResponse<T>` for a collection. Paths omit `/api/v1`; they must use slash-separated alphanumeric, hyphen or underscore segments. Supply filters through `query`, not a raw query string. Define endpoint data types when implementing that feature; generic types do not validate endpoint data at runtime.

The client preserves the `data` envelope and pagination, JSON-encodes supplied bodies, supports empty 204 responses and forwards AbortSignal. A bearer token is attached only when explicitly supplied via `accessToken`; this foundation neither stores nor logs tokens. Requests omit cookies and refuse redirects. URL/path validation prevents callers from overriding the configured API origin or prefix.

`ApiError` provides `status`, `code`, `message` and optional `details`. Contract HTTP errors retain these fields; non-JSON errors receive a generic message. Network failures use status 0 and `NETWORK_ERROR`; malformed success envelopes use `INVALID_RESPONSE`. Cancellation is propagated unchanged. Present expected errors through the existing feedback/form components in each feature; do not render raw response bodies or details indiscriminately.

Queries remain fresh for 30 seconds, with at most two retries for network/5xx API failures. Client errors and malformed responses are not retried. Mutations never retry automatically. Pass the query function's signal to the API client. Feature-specific cache keys, invalidation and authorization are added alongside their features.

Implementation references: [React Router routing](https://reactrouter.com/start/declarative/routing) and [TanStack QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient).

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and `git diff --check`. Focused tests cover route entry/navigation, unknown routes, stable query context/retry policy, base URL validation, request construction, envelopes, HTTP/network failures and cancellation. Tests use mocked fetch; live backend integration and browser visual inspection are not covered.
