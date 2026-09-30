# Core UI — FE-003

Import directly from `src/components/ui/` and `src/components/layout/`.

- `AppShell`: children plus navigation items `{ label, href }`; requires a React Router provider. Supplies header, navigation, skip link, main and footer. Router links determine current navigation automatically. Mobile navigation toggles below `md`; Escape inside closes it and focuses the trigger. Path changes close the mobile menu and move focus to the main landmark; query-only changes preserve control focus. See API_FOUNDATION.md for the FE-004 route skeleton.
- `Button`: primary/secondary/quiet variants, native props and refs. Defaults to `type="button"`. Set `pending` and meaningful text such as “Saving…” to disable activation and expose busy state.
- `Input`: required visible `label`, optional `hint` and `error`, native props and refs. Generates IDs, preserves caller descriptions and marks errors invalid. Callers own validation and submission announcements.
- `Badge`: neutral/accent emphasis; always describe status in text.
- `Surface`: optional bordered container; use plain sections where appropriate.
- `LoadingState`/`SuccessState`: polite announcements. `ErrorState`: alert and optional `onRetry`. `EmptyState`: title, description and action children. Lucide icons are decorative; feedback does not impose heading levels.

Keep one descriptive h1 in shell content. Use the existing design tokens and native controls.

Seven tests cover shell semantics, skip target, menu dismissal/focus, pending activation, input descriptions, retry and feedback content. Typecheck, lint and production build pass. Responsive visibility uses Tailwind utilities; jsdom does not verify actual layout. Browser visual inspection was not performed.
