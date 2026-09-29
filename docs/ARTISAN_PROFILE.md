# Artisan public profile - FE-DISC-006

The public `/artisans/:artisanId` route loads `GET /artisans/:artisanId` through the shared API client and a cancellable TanStack Query keyed by artisan ID. It sends no bearer token or cookies. Invalid path segments and the reserved `me` ID are rejected locally. Runtime validation checks the detail, matching ID, ratings, services and unique nested IDs; unknown fields are stripped before caching.

The responsive page presents biography, city/state, experience, availability, rating summary, services, portfolio, safe credential metadata and public phone/WhatsApp links. Empty sections explain missing content without fabricated claims. Credential verification describes each credential, not a blanket endorsement of the artisan. Images require absolute HTTPS URLs without embedded credentials, suppress referrers and have a failure fallback. Contact links accept only phone-number characters and bounded digit counts. No private documents, storage identifiers or coordinates are rendered. Loading, refresh, malformed-response, network/server, rate-limit and not-found states provide recovery. A failed refresh hides stale contact information.

The request CTA is disabled with an explicit coming-soon explanation; creating requests remains FE-CUST-002. No customer route, request mutation or authentication requirement is introduced for public profile browsing. The return link opens discovery; browser Back retains the previous discovery URL and filters.

## Integration details and limits

Read-only inspection of the sibling backend's `src/modules/artisans/detail.ts`, `detail-repository.ts` and Prisma schema confirmed the flat profile fields, `phone`, `whatsapp`, service fields, numeric nullable `priceFrom`, and empty portfolio/credential arrays. Unlike discovery summaries, detail responses do not contain categories or distance. The frontend does not require them. The contract does not define a currency, so starting prices explicitly ask users to confirm currency and the final quote.

The backend has not implemented populated portfolio or credential responses. Portfolio display provisionally expects `{ id, title, imageUrl, description? }`; confirm these nested names when that backend feature is implemented. Credential display uses the contract's `{ id, title, issuer, issuedAt?, verificationStatus }` metadata. Nullable optional fields are accepted. These assumptions are isolated in the detail service and tested with fixtures; populated media integration is not claimed. No API contract or backend files were changed.

Verification: 16 focused tests cover public requests, content and empty states, private-field stripping, unsafe URLs, failed images, HTTP/network recovery, malformed/mismatched data, reserved IDs, navigation isolation and cancellation. Full suite, typecheck, lint, production build and whitespace checks are required before completion. HTTP tests are mocked; live backend integration and browser visual inspection were not performed.

FE-CUST-002 update: The formerly disabled request CTA now links to the customer-only creation form. See CREATE_SERVICE_REQUEST.md. Public profile browsing remains anonymous.

FE-ART-003 update: The synchronized contract now defines populated portfolio items and safe credential metadata, resolving the provisional integration assumptions above. Artisan media management is implemented; see ARTISAN_MEDIA.md. Live media integration remains unverified.
