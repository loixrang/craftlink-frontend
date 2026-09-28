# Artisan search - FE-DISC-002

The /artisans page now includes submitted keyword search, category links, minimum rating (0-5), nonnegative minimum experience and any/available/unavailable choices. URL parameters are the applied source of truth; drafts do not trigger requests. Applying filters resets page, category links retain numeric/availability filters and retain their previous behavior of clearing q. Clear all filters resets the query string. Back/forward and direct links restore controls and results. Landing q links execute keyword searches; category-name highlighting remains an existing visual hint, while explicit category links send server IDs.

GET /artisans uses the shared public client and TanStack Query under ['artisans', filters], forwards cancellation, and sends only q, categoryId, minRating, minExperience and availability. Invalid numeric/availability URL values are ignored with visible feedback. No credentials are sent. Location, sort and page parameters are not executed by this feature. The API default first page is displayed with an honest showing/total count; sorting and pagination controls remain FE-DISC-005.

Runtime validation checks the collection/pagination and contract-named summaries, rejecting duplicate IDs. Integration assumptions: categories are { id, name } objects; bio/city/state/profileImageUrl and averageRating may be null; verificationStatus uses PENDING/VERIFIED/REJECTED; availability query values are true/false. These nested/value details are not fully defined in the frozen contract and require live backend verification. No contract changes were made.

Results show name/profile link, service categories, location text, biography, experience, availability and rating/review count. Neutral avatar icons are used; image URLs, distance and verification are not rendered. The public profile route remains its existing placeholder pending FE-DISC-006. Loading, refresh, empty, malformed-response, network/server, 400 and 429 states include recovery. Cached same-filter data can remain visible with a refresh error; prior-filter data is not retained during a new search.

Focused tests cover public request construction, URL filters/history/reset, category integration, validation, cancellation, empty results and error/retry. Existing category tests isolate the results component to continue testing the category service independently. No browser visual inspection or live backend integration was performed.

## FE-DISC-003 extension

Manual location now adds validated latitude, longitude and optional radiusKm to discovery requests and query keys. Search/category changes preserve the applied location; clear-all removes it. See MANUAL_LOCATION.md for validation, URL behavior and the contract limitation on address lookup. Sorting and pagination controls remain deferred.

## FE-DISC-005 extension

Sorting and pagination are now implemented through the existing URL, service and query flow. See DISCOVERY_PAGINATION.md for sort requirements, page recovery and validation. Earlier deferred-sort/page notes above describe the original FE-DISC-002/003 scope.
