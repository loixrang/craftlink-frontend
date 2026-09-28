# Category browsing - FE-DISC-001

The public /artisans route now browses categories from GET /api/v1/categories. The service uses the shared HTTP client, forwards cancellation and validates data as an array of objects with nonempty string id and name fields and unique IDs. Extra fields are discarded. The frozen contract names this endpoint but does not specify a field-level category response; this minimal shape is an integration assumption, not a contract change. Live compatibility has not been verified.

TanStack Query owns the categories cache under ['categories'], using the existing freshness and transient-error retry policy. The page handles initial loading, refresh, errors with manual retry, an empty collection and unavailable category IDs. Cached categories remain visible on refresh failure. No bearer token is sent.

Category links set categoryId using server IDs and URLSearchParams. Selecting or clearing a category removes q and page while retaining other parameters. Direct entry and browser history restore selection. Existing landing links use q with a category name; an exact match against loaded categories highlights it without guessing IDs. Unknown search text remains in the URL for future search implementation.

The responsive list uses semantic links, visible focus inherited from global styles, aria-current and a check icon for selection. Selected categories explicitly indicate that artisan listings are coming soon. This feature does not call the artisan search endpoint or implement FE-DISC-002.

Focused tests cover requests, cancellation, URL encoding, history, direct entry, landing-name resolution, reset, empty/unavailable states, retry and malformed responses. Browser layout and live backend integration are not covered.
