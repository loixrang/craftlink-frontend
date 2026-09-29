# Request history/detail/status - FE-CUST-003

Customer-only routes `/customer/requests` and `/customer/requests/:requestId` display history and details. Dashboard and request-success links expose the history. All six contract statuses are shown as text. Status refresh is read-only: the contract does not specify allowed customer transitions or a PATCH body, so no cancellation or other status mutation is invented.

The service uses bearer-authenticated GET `/service-requests/me`, with page and limit (20) under the contract's pagination conventions. Queries are scoped by customer ID, forward cancellation, hide stale data on errors and use the existing session cache clearing. Creation invalidates that customer's request queries. Tokens never appear in keys or returned data. Invalid page URLs do not fetch; previous/next navigation uses URL state. Loading, refreshing, error/retry, empty, out-of-range page and missing detail states are provided.

There is no detail endpoint in the contract. Direct detail entry searches the customer's paginated collection until the ID is found or the collection is exhausted. This can require multiple requests for long histories; pagination is not a transactional snapshot, so concurrent changes may require refreshing. Requests belonging to another account are not fetched through a guessed ID endpoint.

## Response assumptions and integration limits

Read-only inspection of the sibling backend on 2026-09-29 found no service-request implementation or database model yet. The contract leaves collection item fields unspecified. The frontend's provisional runtime schema requires `id`, `artisanId`, `serviceId`, `description`, and a contract `status`; `preferredDate` is optional/nullable ISO date-time and `createdAt` is optional ISO date-time. Unknown fields are stripped. Pagination must match the requested page/limit, have consistent totals and unique item IDs. Invalid responses produce an error rather than fabricated request data. Service references are displayed because service titles and artisan names are not specified in this response. Confirm this shape with the backend before live integration; the frozen contract is unchanged.

Checks use mocked HTTP and cover authenticated requests, all statuses, list/detail navigation, direct detail lookup across pages, pagination, empty/missing states, errors/retry, malformed responses, failed refresh, cancellation, invalid URLs and role/session gating. No live backend or visual browser verification was performed. Reviews and account editing remain later features.
