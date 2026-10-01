# Admin category management - FE-ADMIN-004

The protected `/admin/categories` page lists public `{id,name}` category summaries and supports category creation, rename and removal. Category reads share the `['categories']` TanStack Query cache with discovery and artisan service forms; successful mutations invalidate the shared cache so those consumers refresh.

Create sends exactly `{name}` to POST `/admin/categories`; rename sends exactly `{name}` to PATCH `/admin/categories/:categoryId`; both trim and validate names to 1–100 characters and validate `{id,name}` responses. Removal requires an explicit confirmation and sends DELETE with no body. The UI handles duplicate names, missing categories, expired sessions, permission loss, and categories still referenced by artisan services. The backend remains authoritative for uniqueness and references.

Focused tests cover request paths, methods, exact payloads, bearer authentication, runtime validation, create/rename/delete states, duplicate and in-use errors, and route role protection. HTTP is mocked; live backend and visual browser verification are not performed.
