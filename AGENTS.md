## Development

- Use Node >=22.12.0 and npm; the lockfile is `package-lock.json`.
- Start the dev server with `astro dev --background`; manage it with `astro dev status`, `astro dev logs`, and `astro dev stop`.
- Verify changes with `npm run build`; there are no configured lint, test, or typecheck scripts.

## Architecture

- Astro + React integration lives in `astro.config.mjs`; Tailwind v4 is loaded through `@tailwindcss/vite`.
- Pages are in `src/pages/*.astro`; most pages wrap `src/components/Layout.astro`, which adds background, nav/sidebar, settings, i18n, and page transition behavior.
- Site/page content is mostly JSON-driven from `src/config/*.json`.
- Browser settings persist in `localStorage` via `src/lib/settings.ts`; language strings live in `src/i18n/en.json` and `src/i18n/zh.json`.

## Conventions

- Use the `@/*` alias for `src/*` when helpful; it is defined in `tsconfig.json`.
- Client-only React components should follow the existing Astro pattern, e.g. `client:only="react"`.
