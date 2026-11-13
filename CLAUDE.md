# Water.it

A personal plant-care PWA for a handful of invited users (Niko, Niko's mum, maybe a few friends), all on iPhone. Its main job: tell you which plants to check today and make logging "Watered" a single tap. Also a plant catalogue with care instructions, a care log, and later a photo timeline and plant-sitting share links.

## Read first

- `docs/design.md` — the design doc and source of truth: features, data model, Firestore rules sketch, architecture, milestones. Update it when a decision changes.
- `docs/screens.md` — the chosen UI designs: tokens, components and per-screen spec.
- `docs/mockups/*.dc.html` — mockup sources: Today, Plants, Plant detail, Add plant (two steps), Edit plant (drawn dark — the reference for dark mode), the sitter view, and iPad versions of Today, Plants and Plant detail. Reference only; they don't run on their own.
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
- **Care profiles:** a plant stores `speciesId` plus `careOverrides` (only the fields its owner changed), never a full copy. Read a plant's profile through `careOf()` / `resolveCare()`. Preset ids in `src/lib/presets/presets.json` are permanent; preset text is `{ en, fi }`.
- **Layout:** pages under `src/routes/(app)/` don't set their own outer width or navigation; the frame (bottom tab bar on phones, side rail from `md`) is `(app)/+layout.svelte`. Breakpoints `md` = iPad portrait, `lg` = iPad landscape (screens.md "Breakpoints").

## Current milestone: M1 — Catalogue

PWA shell (installable, offline) → Firebase wiring + Auth + rules → Plants list, Plant detail (Care tab), Add/Edit plant, bundled species presets (Pilea, Dracaena marginata, tree aloe, Crassula, spineless yucca, generic succulent and tropical foliage). Test sign-in in the installed iPhone app early.

Status 2026-11-13: all of the above is built and live, plus the iPad layouts and Settings (language, appearance). Changing an existing plant's species was added the same day. The Perenual/Trefle lookup spike is postponed (Niko, 2026-11-13); next up is M2's Today page, to start using the app in practice. See `docs/design.md` §11 for M2–M5.

## Ask before

- Creating or changing the Firebase project, its location or project ID (they're permanent), or upgrading to the Blaze plan.
- Deploying to the live Hosting site. Preview channels are fine.
- Adding a new dependency that isn't in the stack above.

## Costs

The project runs on the **free Spark plan** and must stay there until M3. **Say
so explicitly, before doing the work, whenever a decision or step would change
what the project costs** — moving to Blaze, enabling a billable API or service,
a paid domain, anything with a per-use price, or a change that materially
raises usage of a metered free tier (Hosting's 360 MB/day transfer, Firestore's
daily read/write quota). Name the cost and the trigger; don't fold it into a
longer explanation and don't assume a free tier still covers it. Known upcoming
costs are listed in `docs/design.md` §7.1 and `docs/open-decisions.md`.

## Commands

Firebase project: **`water-it-95171`** (`europe-north1`). Install the iPhone app from
**`https://water-it-95171.firebaseapp.com`** — not the `.web.app` twin, because
`signInWithRedirect` needs the app and `authDomain` on the same origin (design.md §7.4).

| Command                                                              | What it does                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                                                           | Vite dev server, on **<http://127.0.0.1:5173>** — open that, never `localhost`, or Google sign-in silently bounces back to /signin (design.md 7.4 "Dev gotcha"). Expects `pnpm emulators` running in another terminal.                                       |
| `pnpm seed:dev [email]`                                              | Put an email on the invite allowlist in the Firestore emulator. Needed before you can sign in locally, because invite-only is enforced in the rules and the emulator starts empty.                                                                           |
| `pnpm seed:plants [email]`                                           | Put the five mockup plants and their checks in the emulator, for a signed-in emulator user. Quicker than adding them by hand; re-run after a data-model change. Sign in locally once first, so the account is there to attach them to.                       |
| `pnpm emulators`                                                     | Auth + Firestore emulators on the `demo-water-it` project, UI at <http://127.0.0.1:4000>. Imports and re-exports `.firebase/seed`, so test data survives a restart.                                                                                          |
| `pnpm test`                                                          | Unit tests (Vitest, `src/**`).                                                                                                                                                                                                                               |
| `pnpm test:rules`                                                    | Firestore rules tests. Starts its own Firestore emulator on port 8080, so it needs Java, and fails with "port taken" while `pnpm emulators` is running — stop that first. Never point these tests at the dev emulator: they wipe the database between tests. |
| `pnpm test:all`                                                      | Both of the above.                                                                                                                                                                                                                                           |
| `pnpm check`                                                         | `svelte-check` type checking.                                                                                                                                                                                                                                |
| `pnpm lint` / `pnpm format`                                          | Prettier + ESLint.                                                                                                                                                                                                                                           |
| `pnpm build` / `pnpm preview`                                        | Static build into `build/`.                                                                                                                                                                                                                                  |
| `pnpm exec firebase deploy --only firestore:rules,firestore:indexes` | Deploy rules and indexes. The only way they should ever change.                                                                                                                                                                                              |
| `pnpm exec firebase hosting:channel:deploy <name>`                   | Preview channel. Fine without asking — but it's a `*.web.app` URL, so **sign-in won't work there**; use it for UI only.                                                                                                                                      |
| `pnpm exec firebase deploy --only hosting`                           | Deploy to live. **Ask first.**                                                                                                                                                                                                                               |

The Hosting emulator **ignores the `headers` block in `firebase.json`** (verified:
even a `**` catch-all header never appears in a response). The `no-cache` on
`sw.js`/`200.html` and the immutable caching for `_app/immutable/**` can therefore
only be checked against a deploy — do it with `curl -sI` after any change to the
`headers` block, because a missing `no-cache` on `sw.js` is what strands an
installed app on an old version. Confirmed on the first live deploy
(2026-11-12): `sw.js`, `200.html` and `manifest.webmanifest` all `no-cache`,
`_app/immutable/**` `public, max-age=31536000, immutable`, and `/`, `/signin`,
`/plants/pilea` and `/settings/deep/route` all return the identical SPA shell.

Emulators need Java 21+ (installed: Microsoft OpenJDK 21). The `demo-` project prefix
means the emulators never touch the real project and work offline and signed out.
