# Design foundation — FE-002

`src/index.css` owns the Tailwind theme and layered global styles. The Vite plugin compiles utilities; no separate Tailwind configuration or runtime CDN is needed. Integration follows the [Tailwind Vite guide](https://tailwindcss.com/docs/installation/using-vite).

The visual foundation is the "Craftlink Modern Marketplace" reference in `design/` (`DESIGN.md` tokens, `code.html` markup). `design/screen.png` could not be inspected, so `DESIGN.md` and `code.html` are authoritative for tokens, elevation, shape scale and component styling.

## Tokens and usage

| Purpose | Utilities |
| --- | --- |
| Page, raised and muted surfaces | `bg-canvas`, `bg-surface`, `bg-surface-muted` |
| Primary and secondary text | `text-ink`, `text-ink-muted` |
| Decorative dividers | `border-line` |
| Visible form-control boundaries | `border-control-border` |
| Primary action | `bg-accent text-on-accent hover:bg-accent-hover` |
| Accent text and links | `text-accent-text`, `hover:text-accent-text-hover` |
| Muted accent surfaces (badges, callouts, chips) | `bg-accent-soft text-accent-soft-ink` |
| Rating and ochre highlights | `text-amber`, `bg-amber` |
| Semantic feedback | `text-success`, `text-danger` |
| Focus ring | `focus-visible` outline, `focus-within:ring-[3px] focus-within:ring-accent/30` |
| Corners | `rounded-control` (0.5rem), `rounded-panel` (1rem), `rounded-modal` (1.5rem), `rounded-full` |
| Elevation | `shadow-card` (Level 1), `shadow-lift` (Level 2 hover), `shadow-float` (Level 3 overlays), `shadow-action` (buttons) |
| Content widths | `max-w-content` (80rem), `max-w-reading` (48rem) |

Level 1 cards use `rounded-panel border border-line bg-surface p-5 sm:p-6 shadow-card`; raise to `shadow-lift` on hover for interactive cards.

## Layout helpers

| Utility | Purpose |
| --- | --- |
| `.full-bleed` | Negative margins that cancel `AppShell` main padding (`px-4 py-8`, `sm:px-6 sm:py-12`, `lg:px-10 lg:py-16`) so a section can span the full viewport width. Keep these values in sync with `AppShell`. |

Theme custom properties are declared once in `@theme` using `light-dark()`, which LightningCSS compiles into a two-slot concatenation resolved by `:root.light`, `:root.dark` and `@media (prefers-color-scheme: dark)`. Never override `--color-*` (or `color-scheme`) inside a component class: doing so bypasses `light-dark()` and pins that subtree to one theme. A previous `.slate-band` helper did exactly that and forced the landing page permanently dark; it was removed, and the dark landing appearance now comes from the global dark tokens (`#141311` canvas, `#1C1A17` surface).

## Typography

`--font-display` is Plus Jakarta Sans for headings and controls; `--font-sans` is Inter for body copy. Both are loaded from Google Fonts via `<link>` tags with `preconnect` in `index.html`, replacing the previous system-only stack. `display=swap` keeps text visible while the webfont loads, and the stack falls back to `ui-sans-serif, system-ui` when fonts are unavailable.

`--text-display` (3.5rem/4rem/-0.03em/700) and `--text-headline` (2.5rem/3rem/-0.02em/700) are the two large display steps; smaller headings use Tailwind's rem scale with the negative tracking and Plus Jakarta Sans applied by the base heading rules. Body text is 1rem with 1.5 line height. Prices, ratings and dates use `tabular-nums`. Section eyebrows are `text-xs font-bold uppercase tracking-[0.04em] text-accent-text`.

White text on the dark amber accent and both ink colors on the light surfaces target WCAG AA normal-text contrast (4.5:1).

## Color tokens

The color tokens above are theme-aware: each uses `light-dark(<light>, <dark>)`, and `:root` sets `color-scheme: light dark`. The page follows `prefers-color-scheme` by default; adding `light` or `dark` to the root element forces that scheme. The header exposes an accessible toggle that stores the explicit choice in `localStorage` under `craftlink-theme`, and a small inline script in `index.html` applies it before first paint. Dark values are warm-neutral equivalents chosen to keep the same brand accent and AA contrast, so components need no `dark:` variants.

`--color-control-border` is deliberately stronger than the reference design's faint hairline (`light-dark(#8f877a, #6b6459)`) so form controls keep a 3:1 non-text boundary in both themes.

Spacing uses Tailwind's 0.25rem unit: prefer 4/6/8 for related groups and 10/16 for section space. Keep base layouts mobile-first, with 1rem gutters and `sm:px-6` at the default 40rem breakpoint. Use `md:` (48rem) and `lg:` (64rem) only when content needs them. Containers use full available width plus a maximum width; avoid fixed minimum viewport widths.

Tailwind Preflight supplies sizing, form-font and responsive-media resets. Base styles live in `@layer base` so utilities can override them. Links are underlined and use `--color-accent-text`; keyboard focus uses a 3px accent outline with a 2px offset and a system color in forced-color mode. Do not remove outlines or clip focus rings. Motion is limited to short hover transitions and `motion-safe:` utilities. Future interactive components must supply accessible labels, target sizes and states in their own feature.

Verification: run typecheck, lint, tests and build. Inspect the emitted CSS for theme utilities, responsive rules and focus styles; check color pairs numerically. The bootstrap render smoke test protects content semantics; jsdom does not validate browser layout.
