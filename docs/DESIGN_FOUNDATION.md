# Design foundation — FE-002

`src/index.css` owns the Tailwind theme and layered global styles. The Vite plugin compiles utilities; no separate Tailwind configuration or runtime CDN is needed. Integration follows the [Tailwind Vite guide](https://tailwindcss.com/docs/installation/using-vite).

## Tokens and usage

| Purpose | Utilities |
| --- | --- |
| Page, raised and muted surfaces | `bg-canvas`, `bg-surface`, `bg-surface-muted` |
| Primary and secondary text | `text-ink`, `text-ink-muted` |
| Decorative dividers | `border-line` |
| Visible form-control boundaries | `border-control-border` |
| Primary action | `bg-accent text-on-accent hover:bg-accent-hover` |
| Subtle emphasis | `bg-accent-soft text-accent-hover` |
| Restrained corners and elevation | `rounded-control`, `rounded-panel`, `shadow-subtle` |
| Content widths | `max-w-content` (72rem), `max-w-reading` (48rem) |

Use the system sans stack without remote font dependencies. Body text is 1rem with 1.5 line height; headings have 1.2 line height and semibold weight. Set heading sizes explicitly with Tailwind's rem-based type scale. Secondary text remains readable; the light divider token is decorative, not a control boundary. White text on the dark amber accent and both ink colors on the light surfaces target WCAG AA normal-text contrast (4.5:1).

Spacing uses Tailwind's 0.25rem unit: prefer 4/6/8 for related groups and 10/16 for section space. Keep base layouts mobile-first, with 1rem gutters and `sm:px-6` at the default 40rem breakpoint. Use `md:` (48rem) and `lg:` (64rem) only when content needs them. Containers use full available width plus a maximum width; avoid fixed minimum viewport widths. The bootstrap screen demonstrates responsive gutters, spacing and heading sizes without adding feature UI.

Tailwind Preflight supplies sizing, form-font and responsive-media resets. Base styles live in `@layer base` so utilities can override them. Links are underlined; keyboard focus uses a 3px amber outline with a 3px offset and a system color in forced-color mode. Do not remove outlines or clip focus rings. No animation or smooth scrolling is introduced. Future interactive components must supply accessible labels, target sizes and states in their own feature.

Verification: run typecheck, lint, tests and build. Inspect the emitted CSS for theme utilities, responsive rules and focus styles; check color pairs numerically. The bootstrap render smoke test protects content semantics; jsdom does not validate browser layout.
