# Currency standardization (NGN)

Craftlink supports exactly one currency: Nigerian Naira. `NGN` is the ISO 4217
code, `₦` the symbol, and `en-NG` the display locale. Users never choose a
currency, and no monetary value is ever shown without its currency.

## Audited monetary surface

`priceFrom` (artisan service "starting price") is the only monetary field in
the product. `minPrice`, `maxPrice`, `minBudget`, `maxBudget`, request/job
budgets, artisan hourly rates, fees and payment amounts do not exist in either
repository; there are no payments or escrow in V1.

| Location | Stored/entered as | Rendered as |
| --- | --- | --- |
| `src/services/artisanProfile.ts` public detail validation | `priceFrom: number \| null` | unchanged, numeric |
| `src/services/artisanManagement.ts` service form schema and `POST`/`PATCH` payload | trimmed digit string, sent as `number \| null` | unchanged, numeric |
| `src/pages/LandingPage.tsx` featured artisan "Starting from" | `number \| null` | `₦150,000` or "On enquiry" |
| `src/pages/ArtisanProfilePage.tsx` public service list | `number` | `Starting price: ₦150,000` |
| `src/pages/ArtisanServices.tsx` artisan service list | `number` | `Starting price: ₦150,000` or "Price on enquiry" |
| `src/pages/ArtisanServices.tsx` service editor input | numeric string | label `Starting price (₦)`, hint naming Nigerian Naira |

Discovery summaries, the artisan dashboard, customer dashboards, request
creation, request detail/history, reviews, admin statistics, admin user and
artisan directories, categories and account pages contain no monetary values,
so nothing there is formatted. Counts, ratings, years of experience and
distances use plain number formatting and are not monetary.

## Centralized formatting

`src/constants/currency.ts` exports `CURRENCY_CODE`, `CURRENCY_LOCALE`,
`CURRENCY_SYMBOL`, `currencyFormatter(code)` and
`formatCurrency(amount, code?)`. It wraps `Intl.NumberFormat` with
`style: 'currency'`, `currency: 'NGN'`, `minimumFractionDigits: 0` and
`maximumFractionDigits: 2`, which matches the backend's `Decimal(12,2)` with
at most two decimal places: whole amounts render without `.00` and stored
minor units are preserved (`₦75,000.5`). Formatter instances are cached per
currency code, so the optional `code` argument is the single place a future
currency would be introduced; no component concatenates `₦` itself, and
`formatCurrency` accepts an optional code rather than hardcoding one. Absent
or non-finite amounts return an empty string instead of misleading currency
text.

## Backend and database

Read-only inspection of `craftlink-backend` found no `currency`, `NGN`, budget
or exchange-rate field, column, model or validation anywhere. `ArtisanService`
stores `priceFrom Decimal? @db.Decimal(12, 2)`, `GET /artisans/:artisanId`
serializes it with `.toNumber()`, and `priceFrom` is validated as a JSON
number from 0 through 9999999999.99. No migration, column, type change or
contract edit is needed or made; NGN is an application-level assumption.
Existing stored amounts were not multiplied, divided or converted, and no
seed, test fixture or demo value was altered.

## Presentation stays separate from data

The API still returns numeric amounts (`{"priceFrom": 50000}`). The frontend
formats for display only, and form values stay numeric internally: the `₦`
appears in the label and hint, never inside the submitted value.