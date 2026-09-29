# Create service request - FE-CUST-002

Public artisan profiles link to `/customer/requests/new/:artisanId`. The existing customer guard preserves the login return path, withholds content during restoration and denies other roles. The form reuses the cancellable public profile query and only accepts a service belonging to that artisan. No services means an empty state; an unavailable artisan gets an advisory because the contract does not prohibit requests to them.

React Hook Form and Zod require a selected service and a trimmed, nonempty description. The optional calendar date is checked for real date validity and serialized as midnight UTC on that date under the contract's ISO date/time convention; no appointment time is promised. No undocumented length or future-date restrictions are imposed. The service sends only artisanId, serviceId, description and optional preferredDate to POST /service-requests with the session bearer token. Creation response fields are unspecified, so response data is discarded after the shared client validates success. Tokens, project details and response bodies are not retained as mutation variables/results.

Pending submissions disable controls and use an immediate guard against duplicate events. Automatic retries are disabled. Errors preserve inputs and explain validation, authorization, unavailable service, rate limiting and uncertain receipt after network/server failures. Success removes the form and explains that a request is not a confirmed booking. State resets when the customer or artisan changes. History, status changes and reviews remain separate roadmap features.

Verification uses mocked HTTP and covers exact payloads with/without date, customer access, login return intent, validation, foreign services, duplicate events, pending/success, error recovery, empty services and query cancellation. Live backend integration and visual browser layout were not performed. API contract, dependencies and deployment configuration are unchanged.

FE-CUST-003 update: Successful creation invalidates the signed-in customer's request queries and offers a request-history link. See REQUEST_HISTORY.md.
