# Water.it

A personal plant-care PWA for a handful of invited users (Niko, Niko's mum, maybe a few friends), all on iPhone. Its main job: tell you which plants to check today and make logging "Watered" a single tap. Also a plant catalogue with care instructions, a care log, and later a photo timeline and plant-sitting share links.

## Read first

- `docs/design.md` — the design doc and source of truth: features, data model, Firestore rules sketch, architecture, milestones. Update it when a decision changes.
- `docs/screens.md` — the chosen UI designs: tokens, components and per-screen spec.
- `docs/mockups/*.dc.html` — mockup sources for Today, Plants, Plant detail and the sitter view. Reference only; they don't run on their own.
- `docs/open-decisions.md` — technical choices with reasons; anything not yet decided is listed there.

## Stack (decided)

- SvelteKit 3 + Svelte 5 (runes), TypeScript, `adapter-static` as an SPA (no SSR). Node 24 LTS, **pnpm** only.
- Firebase: Hosting (classic, not App Hosting), Auth (Google + email/password, invite-only), Firestore in **`europe-north1`** with `persistentLocalCache` (multi-tab). Later: Cloud Storage, a scheduled Cloud Function, Cloud Messaging.
- UI: shadcn-svelte (Bits UI) + Tailwind v4, Lucide icons. Valibot for validation, date-fns for dates.
- i18n: Paraglide JS, English source strings plus Finnish.
- PWA: `@vite-pwa/sveltekit` with a "new version available, tap to reload" prompt (no auto-reload).
- Tooling: ESLint + Prettier, Vitest, `@firebase/rules-unit-testing` with the Firestore emulator. Java 21+ is needed for the emulators.

## Conventions

- **Mobile-first at 390 px.** Touch targets ≥ 44 px. Status is never colour alone: icon + label. Icon-only buttons get `aria-label`.
- **No hard-coded UI text.** Every user-facing string goes through Paraglide messages, in both `en` and `fi`.
- **Dates:** due dates are local calendar dates stored as `YYYY-MM-DD` strings; event times (`LogEntry.at`, `createdAt`, `expiresAt`) are Firestore `Timestamp`. Never store due dates as timestamps.
- **Health** is `thriving | okay | recovering | struggling`. **Dormant** is a separate boolean, not a health state.
- **Scheduling:** the next check is counted from the day the action was logged, not from the old due date. Keep scheduling logic in plain TS modules with Vitest tests (season switch, snooze, still-damp lengthening).
- **Data access:** a user reads and writes only under `users/{uid}`. `firestore.rules` and `firestore.indexes.json` live in the repo and are deployed from here, never edited in the console. Every rules change gets a rules test.
- **Local dev uses the Firebase emulators** (`connect*Emulator` when `import.meta.env.DEV`). Never point dev at the production project unless explicitly asked.
- **iOS sign-in:** use `signInWithRedirect` (not popups), with `authDomain` set to the domain the app is served from. No email-link sign-in: on iOS, Home Screen apps don't share storage with Safari.
- Use Svelte 5 runes (`$state`, `$derived`, classes in `.svelte.ts`) rather than legacy stores.

## Current milestone: M1 — Catalogue

PWA shell (installable, offline) → Firebase wiring + Auth + rules → Plants list, Plant detail (Care tab), Add/Edit plant, bundled species presets (Pilea, Dracaena marginata, tree aloe, Crassula, spineless yucca, generic succulent and tropical foliage). Test sign-in in the installed iPhone app early. See `docs/design.md` §11 for M2–M5.

## Ask before

- Creating or changing the Firebase project, its location or project ID (they're permanent), or upgrading to the Blaze plan.
- Deploying to the live Hosting site. Preview channels are fine.
- Adding a new dependency that isn't in the stack above.

## Commands

_Fill in after scaffolding (dev server, emulators, tests, lint, deploy)._
