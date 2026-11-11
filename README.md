# Water.it

A personal plant-care PWA: it tells you which plants to check today and makes
logging "Watered" a single tap. Installed on an iPhone home screen via Safari,
for a handful of invited users.

See [`CLAUDE.md`](./CLAUDE.md) for the working conventions, and
[`docs/design.md`](./docs/design.md) for the design doc and source of truth.

## Prerequisites

| Tool | Version                  | Why                                                          |
| ---- | ------------------------ | ------------------------------------------------------------ |
| Node | 24 (see `.node-version`) | `engineStrict` is on, so an older Node fails the install     |
| pnpm | 12.x                     | The only supported package manager; `packageManager` pins it |
| Java | 21+                      | Needed by the Firebase emulators, not by the app             |

```sh
pnpm install
```

## Commands

```sh
pnpm dev          # dev server on localhost:5173
pnpm build        # production build into build/
pnpm preview      # serve the production build locally
pnpm check        # svelte-check (types and Svelte diagnostics)
pnpm lint         # prettier --check + eslint
pnpm format       # prettier --write
pnpm test         # vitest, once
pnpm test:unit    # vitest in watch mode
```

## Shape of the project

- **SvelteKit 3 + Svelte 5** (runes), TypeScript, built by `adapter-static` as an
  SPA. There is no SSR: `src/routes/+layout.ts` sets `ssr = false` and every
  route is served from the `200.html` fallback.
- **Tailwind v4** via `@tailwindcss/vite`. Design tokens are specified in
  [`docs/screens.md`](./docs/screens.md).
- **Paraglide** for i18n, English source with Finnish alongside. Messages live
  in `messages/{en,fi}.json`; the compiled output in `src/lib/paraglide/` is
  generated and git-ignored. Locale resolution is
  `localStorage → preferredLanguage → baseLocale`, so the phone's language wins
  on first launch and a choice in Settings sticks. Locales are not in the URL.
- **pnpm settings** live in `pnpm-workspace.yaml`, not `package.json` or
  `.npmrc` — pnpm 12 no longer reads them from either. That file documents the
  denied dependency install scripts and the 24-hour supply-chain quarantine.

## Not wired up yet

Firebase (Hosting, Auth, Firestore), the PWA service worker and manifest,
shadcn-svelte components, and the M1 screens. The Firebase project itself has
to be created first — its ID and `europe-north1` location are permanent, so see
the "Ask before" section of `CLAUDE.md`.
