# Accessibility and responsive QA — FE-QA-001

## Review scope

Reviewed all implemented routes and the shared shell, form controls, and feedback components for landmark and heading structure, input names and error descriptions, keyboard access, focus visibility, touch target sizing, narrow-screen wrapping, and loading/error/empty/success feedback. The review used source inspection and the project’s jsdom tests; it did not use a live screen reader or browser viewport.

## Findings and changes

- Route changes previously left focus on the navigation link. `AppShell` now moves focus to the main landmark after a path change, closes the mobile menu on path changes (including browser history), and leaves focus undisturbed for query-only filter/pagination updates.
- Standalone artisan management and media dashboard links now have the shared 44px minimum touch target.
- Existing shell behavior provides a skip link, labeled navigation, current-page indication, mobile menu disclosure, Escape dismissal with focus return, and visible keyboard focus. Shared inputs associate labels, hints, and validation errors; feedback uses status/alert announcements.
- Route layouts use mobile-first spacing, wrapping controls and pagination, responsive grids, minimum-width guards, and break-word rules where user or server content can be long. Data-backed pages expose loading, retryable error, empty, and success states as applicable.

## Verification

- Added shell tests for the skip link, route focus, closing the mobile menu after navigation, Escape dismissal/focus return, and current-link indication.
- Full Vitest suite, ESLint, TypeScript checking through the production build, and `git diff --check` pass.
- Responsive behavior was reviewed in source and emitted CSS through the production build. Actual browser rendering at device widths, keyboard-only browser traversal, screen-reader announcements, and live API states still require manual browser verification.
