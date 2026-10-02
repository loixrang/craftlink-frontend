# Core UI — FE-003

Import directly from `src/components/ui/` and `src/components/layout/`.

- `AppShell`: children plus navigation items `{ label, href }`; requires a React Router provider. Supplies header, navigation, skip link, main and footer. Router links determine current navigation automatically. Mobile navigation toggles below `md`; Escape inside closes it and focuses the trigger. Path changes close the mobile menu and move focus to the main landmark; query-only changes preserve control focus. See API_FOUNDATION.md for the FE-004 route skeleton. The header is sticky with a blurred canvas background, the wordmark is terracotta, navigation items are pill links, and the footer is brand, tagline and copyright (no duplicate link columns, so every route keeps a single accessible link name). Main padding is `px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16`; `.full-bleed` in `index.css` cancels exactly these values.
- `Button`: primary/secondary/quiet variants, native props and refs. Defaults to `type="button"`. Pill radius, 44px minimum target, terracotta primary with `shadow-action` and a `-1px` hover lift. Set `pending` and meaningful text such as “Saving…” to disable activation and expose busy state.
- `Input`: required visible `label`, optional `hint` and `error`, native props and refs. Generates IDs, preserves caller descriptions and marks errors invalid. 48px height, `rounded-control`, accent border on focus and `text-danger` error text. Callers own validation and submission announcements.
- `Badge`: neutral/accent emphasis; pill shape, ochre (`accent-soft`) fill for accent tone. Always describe status in text.
- `VerifiedBadge`: `verified` boolean renders a forest-green check pill (`Verified pro`) or a muted unverified pill (`Verification pending`).
- `Surface`: optional bordered container with `shadow-card`; use plain sections where appropriate.
- `LoadingState`/`SuccessState`: polite announcements. `ErrorState`: alert and optional `onRetry`. `EmptyState`: title, description and action children. Lucide icons are decorative; feedback does not impose heading levels.

Keep one descriptive h1 in shell content. Use the existing design tokens and native controls. The reference design in `design/` governs appearance; existing tests in `AppShell.test.tsx` and `ThemeToggle.test.tsx` constrain link names and theme behaviour.

Seven tests cover shell semantics, skip target, menu dismissal/focus, pending activation, input descriptions, retry and feedback content. Typecheck, lint and production build pass. Responsive visibility uses Tailwind utilities; jsdom does not verify actual layout. Browser visual inspection was not performed.
