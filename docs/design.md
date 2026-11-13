# Water.it — Design Doc

**Water.it** ("water it": watering is the one thing the app must get right) is a personal plant-tending app: a catalogue of your plants with care instructions, watering reminders, a care log, and a photo timeline of growth. Built as a PWA so it works as a website and installs on a phone's home screen.

Status: draft v0.11 (app name: Water.it)

### Decisions so far
- **Name:** Water.it, the same in English and Finnish. Leafline was considered but an app with that name already exists. Firebase project ID: **`water-it-95171`**, created 2026-11-12 — `water-it` was already taken, so the console appended a suffix. IDs are globally unique and permanent. The home-screen name `Water.it` comes from the manifest, so the suffix is only ever visible in the URL.
- **Platform:** PWA, used on iOS (iPhone), installed via Safari → Share → Add to Home Screen. A native iOS app is out of scope: it needs a Mac, Xcode and a paid Apple Developer account, and free sideloaded builds expire after 7 days.
- **UI framework:** Svelte (see 7.2).
- **Reminders in the MVP:** an in-app "needs watering" list shown when the app opens. No notifications at first. Push is a later, optional milestone.
- **Default watering mode:** "check soil" prompts; a fixed "water today" schedule is an optional per-plant setting.
- **Seasons:** calendar months for the MVP (growing season April–September by default), plus a per-plant "under grow light" flag.
- **Users and sync:** a handful of invited users (Niko, Niko's mum, maybe a few friends later), all on iPhone. Each has a fully separate account and plants; no shared households. Data lives in Firestore and syncs across devices; Firestore's offline cache keeps the app usable without a connection.
- **Plant-sitting:** while away, a user can share a time-limited link with a sitter, who sees care instructions and logs what they did without needing an account (see 4.7).
- **Firestore location:** `europe-north1` (Finland). The `(default)` database was created there on 2026-11-12; the location is now permanent.
- **Toolchain:** pnpm, Node 24 LTS, SvelteKit 3 (Vite 8, TS 6), ESLint + Prettier, Java 21+ for the Firebase emulators. See `open-decisions.md`.
- **UI kit:** shadcn-svelte (on Bits UI) with Tailwind v4; Lucide icons. shadcn's own colour variables are mapped onto the app's tokens, not the other way round (`open-decisions.md` C).
- **Languages:** English and Finnish from the start, via Paraglide JS (English source strings). Preset care texts carry both languages (`{ en, fi }`, see 8).
- **Dark mode:** supported from the start (decided 2026-11-12), following the phone's setting. See 9.1. The look follows the dark Edit plant mockup (decided 2026-11-13).
- **Care overrides** (decided 2026-11-13): a plant stores its preset id and only the care fields the owner changed; the rest is read from the preset, in the current language, on every render. See 6.
- **Tablet:** iPad layouts are designed (side rail, list + detail side by side) and the app frame is built for them from M1. See `screens.md` "Breakpoints".
- **Dates:** due dates stored as local calendar dates (`YYYY-MM-DD`); log times and share expiry as Firestore `Timestamp`. date-fns for date maths.
- **Infra:** everything on Firebase, one project and one CLI: Hosting, Auth, Firestore now; Cloud Storage, a scheduled Cloud Function and Cloud Messaging later (these need the Blaze plan, which keeps a no-cost tier). Vercel was considered; Firebase Hosting avoids the iOS sign-in workaround and a second platform.

---

## 1. Goals

- Know at a glance **which plants need attention today**.
- Keep a **catalogue** of each plant with its care needs (light, water, temperature, soil, repotting).
- Get **watering reminders** that fit how the plants are actually cared for.
- Keep a **photo timeline** per plant to see growth and recovery over time.
- Work **offline** and be fast on a phone.

## 2. Non-goals (for now)

- Social features, public profiles, open sign-up. (A few invited users is in scope; see 3.)
- Automatic plant identification from photos (could be a later add-on).
- Sensor/IoT integration (soil moisture sensors etc.).
- A public plant database. Species presets are a small, hand-curated starter set.

## 3. Users and context

A handful of invited users (the owner, the owner's mum, possibly a few friends), all on iPhone. Each user has their own plants and never sees anyone else's. The one exception is plant-sitting (4.7): a sitter, who may not be a user at all, temporarily sees the plants they're looking after. Mostly used on a phone, often in a quick "check the plants" moment. Plants live in a mix of spots (bright window, desk under a lamp, balcony in summer). Indoor winter conditions matter: low light, dry heating air, cold windowsills.

Key design principle: **plants differ, and conditions change by season.** The app should nudge you to *check* rather than blindly water on a fixed day.

---

## 4. Core features

### 4.1 Plant catalogue
Each plant has:
- Name / nickname, species, photo
- Location (e.g. "Kitchen window", "Desk lamp", "Balcony")
- Pot info: pot type (terracotta/plastic), size, drainage, top layer (e.g. clay pebbles)
- Acquired date and how (bought, cutting from a friend, propagated)
- Free-form notes (e.g. "cutting, still rooting, leaf drop normal")
- Health: `thriving`, `okay`, `recovering`, `struggling`, shown as a face badge with a text label
- Dormant (yes/no): a seasonal mode, separate from health. Pauses fertilizing and uses the resting check interval regardless of season
- Under grow light (yes/no): if yes, the plant uses the growing-season interval all year

### 4.2 Care profile (instructions)
A per-plant care profile, prefilled from a species preset and editable:

| Field | Example |
|---|---|
| Light | bright indirect; some direct sun OK |
| Watering style | `soak-and-dry` (water when soil is dry a few cm down) |
| Check interval (summer / winter) | 7 d / 14 d |
| Soil dry-down test | "skewer dry 3–4 cm down" |
| Temperature | comfortable 18–24 °C, damage below 10 °C |
| Humidity | low OK |
| Fertilizing | monthly in growing season, none in winter |
| Repot / soil refresh interval | every 2 years, spring |
| Watch-outs | overwatering, tap-water minerals, cold drafts |

Species presets for the starter set: Pilea peperomioides, Dracaena marginata, tree aloe, Crassula, Yucca (spineless), plus two generic fallbacks: "succulent" and "tropical foliage".

### 4.3 Reminders
Reminders are **"check soil"** prompts, with a quick action to log the result:
- *Watered*
- *Checked, still damp* (snoozes the next check and gently lengthens the interval)
- *Checked, very dry* (counts toward suggesting a shorter interval)
- *Skipped*

**MVP delivery:** these prompts appear as the "Needs watering" list on the Today screen when the app is opened. No notifications in the MVP (see 7.3).

Rules:
- Interval comes from the care profile, with **season adjustment** (growing season vs. winter, configurable months).
- The next check is counted **from the day the action was logged**, not from the original due date, so a late watering doesn't pull the next check too early.
- Optional per-plant **fixed schedule** ("water every N days") for plants with predictable needs; "check soil" stays the default.
- Adaptive tuning: if you repeatedly answer "still damp", suggest lengthening the interval; if "very dry", suggest shortening.
- Daily digest option: one notification per day listing what is due, instead of one per plant.
- Quiet hours.

Other recurring tasks (same engine): fertilize, rotate pot, wipe leaves, repot/refresh soil, check for pests, bring plants in / out for the season.

### 4.4 Care log
Timeline per plant of events: watered, fertilized, repotted, pruned (e.g. "cut dead tip"), moved, notes. Used for adaptive intervals and for the history view.

### 4.5 Photo timeline
- Add photos from camera or gallery, tagged with date and optional note.
- Per-plant gallery sorted by date.
- Side-by-side compare (first vs. latest, or pick any two).
- Optional time-lapse playback (slideshow of photos in order).
- Photo reminder, e.g. "monthly progress photo", with a faint overlay of the previous photo as an alignment guide.
- Images are downscaled on import (e.g. long edge 1600 px) with a small thumbnail to keep storage low.

### 4.6 Today view (home screen)
- "Due today" and "Overdue" lists with one-tap actions.
- Weekly overview.
- Alerts for seasonal tasks (e.g. "nights below 5 °C — keep tender plants indoors").

### 4.7 Plant-sitting
For when a user is away and someone else tends their plants.

**Owner flow:** Settings or Plants → "Going away" → pick dates, pick which plants (default: all), optionally add a sitter name and a message → the app creates a **share link** → send it via Messages/WhatsApp.

**Sitter view** (opens in any browser, no install, no account):
- Intro message from the owner, dates, the owner's contact.
- **"Today"** list: which plants to check or water today, worked out from the owner's schedule for the period. Plants that need nothing during the trip say so ("No water needed while I'm away"); succulents often won't need anything on a 1–2 week trip.
- One card per plant: photo, **where it is** ("left end of the living room window"), plain-language instructions, owner's note for the sitter ("water from the saucer", "it drops leaves, that's fine").
- Buttons: *Watered*, *Checked, still damp*, *Something looks wrong* (with an optional note and photo later).
- Wording is simpler than the owner's view: no intervals, statuses or settings.

**Owner while away:** sees the sitter's actions live in each plant's log, marked "by [sitter name]". Sitter actions update the schedule exactly like the owner's own logs.

**Ending:** the link stops working after the end date (plus one day of grace) or when the owner taps "Stop sharing". The owner can extend dates at any time.

**Why a link and not a sitter account:** the sitter is often not an app user (a neighbour or friend), and installing an app plus signing up for a one-week favour is too much. The link is an unguessable random token; anyone who has it can see the shared plants and log care during the dates, which is acceptable for houseplant data. If the sitter is also a user (e.g. mum), the same link just works for them too.

---

## 5. Screens

1. **Today** — due/overdue tasks, quick log buttons.
2. **Plants** — grid/list of plants with status badges.
3. **Plant detail** — header photo, care profile, tasks, log, photo timeline tabs.
4. **Add/Edit plant** — pick species preset, adjust profile, add photo.
5. **Photos** — global timeline and compare view.
6. **Settings** — notifications, seasons, quiet hours, units (metric default), backup/export, plant-sitting (active shares).
7. **Sitter view** — separate, account-free page at `/sit/{token}`: Today list and plant cards (see 4.7).

Mobile-first layout, bottom tab bar (Today / Plants / Photos / Settings), large tap targets, dark mode.

**Chosen screen designs (v1)** — canvas "Plant care app — screens" (claude.ai artifact):
- **Today:** one card per due plant with a large square blue *Watered* button (drop icon) for one-tap logging; *Still damp* and *Skip* as smaller buttons under a one-line check hint. Overdue cards get a red border and a warning icon. After logging, a status badge replaces the buttons: Watered (green, check), Still damp (yellow, clock), Skipped (red, cross), each with text and Undo. Swipe rows and a one-at-a-time "watering round" were considered and rejected (swipe needs instructions and has no skip; the round is too slow).
- **Plants:** single-column list rows: thumbnail with a health face badge (Thriving / Okay / Recovering / Struggling, always labelled), name, health label, next check, and labelled chips for general light and water needs (e.g. "Bright", "Little"). Not today's status.
- **Plant detail:** header photo, status and location chips, Care / Log / Photos tabs, next-check card, plain-language care profile with provenance, note for plant-sitters.
- **Sitter view:** designed, built in M4.
- Not designed yet: sign-in, Add/Edit plant, Settings, Photos tab, tablet two-pane layout.

---

## 6. Data model

Stored in **Cloud Firestore**, scoped per user:

```
users/{uid}                     Settings + profile
users/{uid}/plants/{plantId}    Plant (with embedded CareProfile)
users/{uid}/tasks/{taskId}      Task
users/{uid}/log/{entryId}       LogEntry (plantId field, indexed by plantId + at)
users/{uid}/photos/{photoId}    Photo metadata; image files in Cloud Storage (see 7.5)
shares/{token}                  Plant-sitting share: owner, dates, snapshot of shared plants
shares/{token}/log/{entryId}    Actions logged by the sitter
```

Security rules: a user can read and write only under `users/{their uid}`. Species presets stay a bundled read-only JSON file, not in the database.

**Care overrides** (decided 2026-11-13). A plant stores `speciesId` and only the care fields its owner has changed (`careOverrides`); the effective profile is the preset, in the current language, with those laid over it (`resolveCare` in `src/lib/plants/care-profile.ts`). Copying the whole profile into each plant was the alternative, and it would:
- freeze the care text in the language the plant was added in, so a Finnish user would read English care text;
- make the Edit form's "Edited" tag a guess (compare against a preset that may have been improved since);
- keep preset fixes from ever reaching plants already added.

Rules that follow from it: **preset ids are permanent** (a test pins them); each override key is all-or-nothing (`checkIntervalDays` holds both intervals); "Reset to preset" deletes the key, and editing a field back to the preset's value also deletes it. A plant with no preset ("Start from a blank profile") keeps its whole profile in `careOverrides` and shows no "Edited" tags. Text a user types is stored as typed — only preset text is translated.

**Shares.** Rules can't read a token from a URL, so the share is designed around that:
- The share document holds a **snapshot** of what the sitter needs (plant name, location, instructions, sitter note, schedule for the period, thumbnail path), copied from the owner's plants. The owner's app re-writes the snapshot whenever a shared plant is edited during the trip. The sitter never reads `users/...`.
- The token is the document ID (random, 128-bit). Rules allow `get` on `shares/{token}` while `now < expiresAt`. `list` is allowed only for the owner's own shares, so nobody can enumerate other people's tokens.
- The sitter view signs in with **Firebase Anonymous Auth** silently (free, no UI), so all writes are authenticated and App Check can be added later.
- Sitters can only **create** entries in `shares/{token}/log`, with a fixed set of fields, while the share is active. They can't edit or delete.
- The owner's app listens to the active shares' logs and copies each entry into `users/{uid}/log` (marked `by: sitter`), then reschedules tasks. No Cloud Function needed, so this works on the free plan.

```js
// firestore.rules (sketch)
match /shares/{token} {
  allow get: if request.time < resource.data.expiresAt
             || request.auth.uid == resource.data.ownerId;
  // Owners can query their own shares (query must filter ownerId == uid);
  // nobody can list other people's shares.
  allow list: if request.auth.uid == resource.data.ownerId;
  allow create, update, delete: if request.auth.uid == request.resource.data.ownerId
                                 || request.auth.uid == resource.data.ownerId;
  match /log/{entryId} {
    function share() { return get(/databases/$(database)/documents/shares/$(token)).data; }
    allow create: if request.auth != null
                  && request.time < share().expiresAt
                  && request.resource.data.keys().hasOnly(['plantId','kind','note','at','by'])
                  && request.resource.data.plantId in share().plantIds;
    allow read: if request.time < share().expiresAt
                || request.auth.uid == share().ownerId;
  }
}
```

Sketch in TypeScript:

```ts
type Plant = {
  id: string;
  name: string;
  sitterNote?: string;         // default note for plant-sitters
  speciesId?: string;          // preset id — permanent, see "Care overrides"
  location?: string;
  acquired?: string;           // month it arrived, YYYY-MM
  origin?: 'bought' | 'cutting' | 'propagated' | 'gift';
  pot?: {
    material?: 'plastic' | 'terracotta' | 'glazed';
    sizeCm?: number;
    topLayer?: 'soil' | 'pebbles' | 'gravel';   // 'soil' = nothing on top
  };
  health: 'thriving' | 'okay' | 'recovering' | 'struggling';
  dormant?: boolean;           // seasonal mode, not a health state
  underGrowLight?: boolean;    // use growing interval all year
  notes?: string;
  coverPhotoId?: string;
  careOverrides: Partial<CareProfile>;  // only what differs from the preset
  createdAt: Timestamp;
};

// The effective profile, as the UI reads it: preset (in the current
// language) + careOverrides. Never stored whole.
type CareProfile = {
  light: string;
  lightLevel: 'low' | 'medium' | 'bright'; // the same need as a value, for chips
  wateringStyle: 'soak-and-dry' | 'keep-moist' | 'sparse';
  checkIntervalDays: { growing: number; resting: number };
  fixedSchedule?: boolean;     // "water every N days" instead of "check soil"
  dryDownTest?: string;
  tempMinC?: number;
  tempComfortC?: [number, number];
  fertilize?: { intervalDays: number; growingOnly: boolean };
  repotIntervalMonths?: number;
  watchOuts?: string[];
};

type Task = {
  id: string;
  plantId: string;
  kind: 'check-water' | 'fertilize' | 'rotate' | 'repot' | 'photo'
      | 'wipe-leaves' | 'pest-check' | 'season-move' | 'custom';
  nextDue: string;             // local date, YYYY-MM-DD
  intervalDays?: number;       // recurring
  snoozedUntil?: string;       // local date, YYYY-MM-DD
};

type LogEntry = {
  id: string;
  plantId: string;
  at: Timestamp;
  kind: 'watered' | 'checked-damp' | 'checked-dry' | 'skipped'
      | 'fertilized' | 'repotted' | 'pruned' | 'moved' | 'note' | 'problem';
  note?: string;
  by?: { kind: 'owner' } | { kind: 'sitter'; name?: string; shareId: string };
};

type Share = {
  id: string;                  // = token
  ownerId: string;
  ownerName: string;
  ownerContact?: string;
  sitterName?: string;
  message?: string;
  startsAt: string;            // local date, YYYY-MM-DD
  expiresAt: Timestamp;        // end date + 1 day grace
  plantIds: string[];
  plants: SharedPlant[];       // snapshot, kept in sync by the owner's app
};

type SharedPlant = {
  plantId: string;
  name: string;
  location?: string;           // "where it is", written for someone who doesn't know the home
  thumbPath?: string;
  instructions: string;        // plain-language, generated from the care profile, editable
  sitterNote?: string;
  dueDates: string[];          // check/water days during the trip
};

type Photo = {
  id: string;
  plantId: string;
  takenAt: Timestamp;
  path: string;                // Cloud Storage path of the downscaled image
  thumbPath: string;
  note?: string;
};

type Settings = {
  language: 'en' | 'fi';
  growingMonths: number[];     // e.g. [4,5,6,7,8,9]
  quietHours?: { from: string; to: string };
  digestTime?: string;
  notificationsEnabled: boolean;
};
```

---

## 7. Architecture

### 7.1 Approach: PWA + Firebase
- Static SvelteKit build hosted on **Firebase Hosting**; no app server of our own.
- **Firebase Auth** for accounts, **Cloud Firestore** for data, with `persistentLocalCache` enabled so reads and writes work offline and sync when back online.
- **Service worker** caches the app shell for offline use (Workbox / `vite-plugin-pwa`).
- `manifest.webmanifest` with icons, `display: standalone`, theme colors.
- Request **persistent storage** (`navigator.storage.persist()`) so the offline cache isn't evicted. Losing it is no longer data loss (Firestore holds the data), only a slower start.

**Firebase plans:** Hosting (10 GB stored, 360 MB/day transfer), Auth and Firestore run on the free Spark plan. Cloud Storage (photos) and Cloud Functions (push cron) require the pay-as-you-go Blaze plan, which still includes a no-cost tier; upgrade at M3 and set a small budget alert.

### 7.2 Suggested stack
- **Svelte 5 + SvelteKit** with `adapter-static` (SPA mode), TypeScript. Firebase Hosting rewrites all routes to `index.html`.
- Firebase JS SDK (modular): Auth, Firestore, later Storage and Messaging. Firestore `onSnapshot` listeners wrapped as Svelte stores, so lists update live.
- Workbox via `@vite-pwa/sveltekit`
- Hosting: **Firebase Hosting** (classic Hosting, not App Hosting, since the app is static). Preview channels for testing builds on the phone before deploying.
- Firebase CLI + Emulator Suite (Hosting, Auth, Firestore, Storage, Functions) for local development.

Why Svelte: chosen over React (personal preference) and Vue (a close equivalent, also fine). For a small personal app the smaller ecosystem doesn't matter; Svelte's low boilerplate and small bundles do.

### 7.3 Reminders: the hard part
Browsers can't reliably fire scheduled notifications from a purely local app. The options:

| Option | Pros | Cons |
|---|---|---|
| **A. In-app due list only** | Zero infra, always works | No notification unless you open the app |
| **B. Web Push + small backend** | Real notifications, even when the app is closed | Needs a server, a cron job, VAPID keys, and stored push subscriptions |
| **C. Calendar export (.ics)** | Uses the phone's own reliable reminders | Static; doesn't adapt to "still damp" snoozes |
| **D. Notification Triggers API** | Fully local scheduling | Experimental, not widely supported |

**Plan:** ship **A** in the MVP (the in-app "Needs watering" list on open). **C** (calendar export) is optional in M2. **B** (push) is a later, optional milestone, and is much cheaper now that there is a backend:
- Store each device's push subscription token in Firestore (`users/{uid}/devices/{id}`).
- A **scheduled Cloud Function** (`onSchedule`, e.g. every morning Europe/Helsinki time) queries due tasks per user and sends one digest notification per user. Requires Blaze; usage stays well inside the free tier.
- Send via Firebase Cloud Messaging or the standard Web Push protocol with VAPID keys.

iOS notes:
- Home Screen web apps work in the EU (Apple reversed its iOS 17.4 plan to remove them in March 2024). Some guides still claim otherwise.
- Install via Safari → Share → Add to Home Screen; there is no automatic install prompt on iOS, so the app should show a one-time install hint.

Notes for B:
- On iOS, web push works only for a PWA **installed to the home screen** (iOS 16.4+), and permission must be requested after a user gesture.

### 7.4 Authentication
- Sign-in methods: **Google** and **email + password** (simplest for a non-technical user). Invite-only is enforced in the rules: every read and write under `users/{uid}` requires an `allowlist/{email}` document for the signed-in address, lower-cased. Anyone can create an account, but without an invite it can reach nothing, and the app shows a "no invite" screen instead of a wall of permission errors. There is no sign-up UI, and no account has to be created by hand. Invites are added in the Firebase console; `pnpm seed:dev` does the same for the emulator. Anonymous accounts (M4 plant-sitters) have no email claim, so the same check keeps them out of `users/`.
- **iOS gotcha 1 (Google sign-in):** Safari blocks the third-party storage that `signInWithRedirect` relies on when the app and `authDomain` are on different domains. On Firebase Hosting the fix is config only: serve the app from the same origin as `authDomain`. The two default domains are **not** interchangeable — `water-it-95171.firebaseapp.com` *is* the default `authDomain`, so redirect sign-in works there with no extra setup, while `water-it-95171.web.app` is a different origin and would need `authDomain` overridden to it. **So install the iPhone app from the `firebaseapp.com` URL.** This also constrains testing: preview channels are `<project>--<channel>-<hash>.web.app`, so they are fine for checking UI on the phone but sign-in will fail there — test sign-in on the live domain, or against the Auth emulator. Popups are unreliable in an installed iOS web app, so use redirect.
- **Dev gotcha (the same cause, locally):** run the dev server on **`127.0.0.1`**, not `localhost`, and open `http://127.0.0.1:5173`. The Auth emulator's redirect handler stashes the sign-in event in `sessionStorage` on its own origin (`127.0.0.1:9099`) and the SDK reads it back through an iframe served from the emulator. From `localhost` that iframe is cross-site, the browser gives it a partitioned `sessionStorage`, the event is never found, and Google sign-in redirects back to `/signin` with no error logged anywhere — and no account is created, because the Firebase user only exists once the app exchanges the credential. `vite.config.ts` pins `server.host`, so the URL Vite prints is the right one; both hosts still resolve on Windows, so the wrong URL stays possible if typed by hand. Email + password sign-in is unaffected, since it involves no redirect.
- **Dev project id gotcha:** the client must use the **emulators' own project id** in dev (`demo-water-it`), not `water-it-95171`. The Firestore emulator serves any project id as its own isolated database and ignores `singleProjectMode` (it logs "Ignoring unsupported arg: single_project_mode_error"), so a client asking for the production id gets a second, empty database **with no rules loaded, and therefore open access**. Nothing errors: reads come back empty and writes are never checked, so local testing proves nothing about `firestore.rules`. `firebase/client.ts` overrides `projectId` when `import.meta.env.DEV`, and `emulator-project.spec.ts` asserts the id matches the `emulators` script, the rules-test script and both seed scripts, because that is the thing that drifts.
- **PWA gotcha (service worker swallows the auth handler):** redirect sign-in navigates to `/__/auth/handler` on the app's *own* origin, and an SPA service worker registers a `NavigationRoute` that answers every navigation from the precached shell. The worker therefore intercepts the handler, the app boots in its place, `getRedirectResult()` finds no pending credential and the route guard returns to `/signin` — tapping "Sign in with Google" appears to do nothing, with no error anywhere. The fix is `navigateFallbackDenylist: [/^\/__\//]` in the `generateSW` options (`vite.config.ts`), which puts `{ denylist: [...] }` on the generated `NavigationRoute`. It only shows up in an installed or previewed build, never in `vite dev`, because `devOptions.enabled` is false. Verify after any PWA config change: the tail of `build/sw.js` must contain that denylist.
- **iOS gotcha 2 (email links):** a Home Screen web app has its own storage, separate from Safari. A magic sign-in link tapped in Mail opens in Safari and signs in there, not in the installed app. So avoid email-link sign-in; use password or Google.
- **Verified 2026-11-12** on the live site, in the app installed to the iPhone Home Screen from `water-it-95171.firebaseapp.com`: Google redirect sign-in completes and returns into the installed app, landing on a signed-in screen. iOS kept the cross-origin hop to Google inside the standalone container, so no popup fallback is needed. Two things had to be right at once — the install URL matching `authDomain` (gotcha 1) and the worker letting `/__/*` through (the PWA gotcha). Each failed silently on its own.
- Use `browserLocalPersistence` (the default) so users stay signed in.

### 7.5 Photos and backup
- Photos are downscaled on the device (long edge 1600 px + thumbnail), then uploaded to **Cloud Storage** under `users/{uid}/photos/`, with Storage rules matching Firestore's. For plant-sitting, Storage rules also allow reading a plant's thumbnail if an active share lists that plant (Storage rules can look up Firestore documents). Uploads made offline wait in a small local queue (IndexedDB) and upload when back online.
- Backup: Firestore is the source of truth. Keep an **export to zip** (JSON + photos) in Settings as a personal backup, but it's no longer critical.

---

## 8. Species preset format

Presets are a bundled JSON file, `src/lib/presets/presets.json`, easy to hand-edit and validated by a Valibot schema at startup and in tests (`src/lib/presets/index.ts`). Every text is `{ en, fi }`:

```json
{
  "id": "pilea-peperomioides",
  "kind": "species",
  "name": { "en": "Pilea", "fi": "Pilea" },
  "commonName": { "en": "Chinese money plant", "fi": "Kiinanpilea" },
  "scientificName": "Pilea peperomioides",
  "care": {
    "light": { "en": "Bright, indirect. Avoid hot afternoon sun.", "fi": "…" },
    "lightLevel": "bright",
    "wateringStyle": "soak-and-dry",
    "checkIntervalDays": { "growing": 7, "resting": 14 },
    "dryDownTest": { "en": "Top 2–3 cm of soil dry", "fi": "…" },
    "tempMinC": 10,
    "tempComfortC": [15, 24],
    "fertilize": { "intervalDays": 30, "growingOnly": true },
    "repotIntervalMonths": 24,
    "watchOuts": [{ "en": "Overwatering", "fi": "Liikakastelu" }]
  }
}
```

- `id` is **permanent** — plants point at it and read their care from it.
- `name` is the everyday short name the Add form prefills ("Pilea", "Dragon tree"); `commonName` the longer one shown on plant detail when it differs ("Chinese money plant"); `scientificName` is not translated.
- `kind: "generic"` presets (Succulent, Tropical foliage) appear under "Not sure? Start general" on the Add picker, with a one-line `description`, and have no scientific name.

Starter presets, all written (2026-11-13): Pilea (`pilea-peperomioides`), Dracaena marginata (`dracaena-marginata`), tree aloe (`aloidendron-barberae`), Crassula (`crassula-ovata`), spineless yucca (`yucca-gigantea`), plus generic `generic-succulent` and `generic-tropical-foliage`. The yucca-looking plant's species is unconfirmed; it's a good first test of photo identification. Presets are starting points; the user edits per plant.

### 8.1 Plant data sources

Goal: type a scientific name (or snap a photo) and get a prefilled care profile, without depending on any single provider. External data is a convenience layer on top of the bundled presets, not a replacement.

**Candidate sources** (limits as checked in Nov 2026; verify current terms before building):

| Source | Role | Notes |
|---|---|---|
| Bundled presets | Primary, offline | Hand-written JSON for the plants you actually own |
| Perenual API | Care data lookup by name | Free tier ~100 requests/day, non-commercial; free keys may cover only part of the species list and withhold some fields (care guides are paid) |
| Trefle API | Names, synonyms, taxonomy, sparse growth data | Free, attribution required; growth fields can be sparse and are not houseplant-oriented |
| Pl@ntNet API | Identify species from a photo | Free up to 500 identifications/day, attribution required; weaker on young plants and cuttings; needs internet |

**Fallback chain** when adding a plant:

1. Match the scientific name against bundled presets.
2. If no match, try Perenual, then Trefle, for whatever fields they return.
3. Fill every field still missing from sensible defaults, flagged as "unverified".
4. User reviews and edits before saving.

**Photo identification flow:** Add plant → "Identify from photo" → Pl@ntNet returns ranked species guesses with confidence → user picks one (or rejects all) → continues into the lookup chain above. Never auto-accept a guess; show confidence and let the user correct it.

**Field mapping.** Provider fields rarely match `CareProfile` exactly, so mapping goes through a small lookup table:

- Provider watering labels (e.g. frequent / average / minimum) → `wateringStyle` plus default `checkIntervalDays` per season.
- Sunlight labels → the `light` text.
- Anything the provider doesn't supply (dry-down test, temperature limits, repot interval, watch-outs) stays empty or falls back to a preset for the same genus.

**Provenance.** Track where each value came from so edits are never overwritten:

```ts
type FieldSource = 'preset' | 'perenual' | 'trefle' | 'default' | 'user';

type CareProfile = {
  // ...existing fields...
  sources?: Partial<Record<keyof CareProfile, FieldSource>>;
  fetchedAt?: string;          // ISO date of last external lookup
};
```

Rules: a lookup never overwrites a field with source `user`; re-fetching is a manual action ("Refresh from source").

**Caching and limits.**
- Cache each lookup result in IndexedDB keyed by scientific name; one API call per species, ever, unless refreshed.
- Handle rate limits and failures gracefully: show "lookup unavailable, using preset/defaults" and let the user continue.
- Offline: lookups are disabled, everything else works.

**API keys.** A static PWA exposes any key it ships with. For a personal-use app that is acceptable if the provider allows domain restrictions (Pl@ntNet does); otherwise route calls through a tiny serverless proxy that holds the key. A proxy becomes necessary if the app is ever shared with other people, since all users would share one daily quota.

**Attribution and licensing.** Add an About screen crediting Trefle and its listed data sources, and Pl@ntNet (with their required acknowledgement text/logo). Perenual's free tier is non-commercial, so revisit if the app is ever published or monetized.

**Early spike (do this before building the feature).** Get free keys and look up the starter species: Pilea, Dracaena marginata, tree aloe, Crassula, spineless yucca. Record which return usable watering and light data. This decides how much weight the lookup feature deserves versus just shipping more bundled presets.

---

## 9. UX details

- **One-tap logging** from the notification or the Today list.
- **Skewer/finger test hint** shown on the check prompt (for the plants that need it). For pots with a clay-pebble top layer, the hint is a skewer pushed below the pebbles, or lifting the pot to judge its weight; the finger test doesn't work through pebbles.
- Terracotta pots dry faster than plastic; the pot material can shorten the default interval slightly.
- **Status colors** that don't rely on color alone (icons + labels).
- **Empty states** that guide adding the first plant.
- **Undo** after logging an action.
- **Accessible**: sufficient contrast, labels on icon buttons, respects reduced motion.
- **Units**: Celsius, metric; dates in local format.
- **Language**: English or Finnish, picked from the phone's language on first launch and changeable in Settings.

### 9.1 Dark mode

Supported **from the start**, not retrofitted. By default the app follows the
phone's `prefers-color-scheme`. Settings → Appearance can force Light or Dark
(added 2026-11-13, partly to make testing both themes easy); the choice is
stored per device. The dark tokens are keyed on `<html data-theme="dark">`,
which an inline script in `src/app.html` sets before first paint (so a reload
never flashes the wrong theme) and `src/lib/theme.svelte.ts` keeps in step,
following the phone live while on Automatic.

Doing this from day one is mostly an architectural choice rather than extra
screens, and it has consequences worth writing down:

- **Tokens are semantic CSS custom properties**, not literal colours:
  `--color-bg`, `--color-surface`, `--color-primary` and so on, declared once
  for light and overridden inside a single `:root[data-theme='dark']` block. No component ever names a hex value, so the dark palette stays one
  file to edit instead of a change to every screen. This is the main reason to
  decide it now: retrofitting means touching every component.
- **Both palettes must satisfy the existing rules** in `screens.md`: text
  contrast ≥ 4.5:1, and status never carried by colour alone (icon + label).
  The second rule matters *more* in dark mode, where a dark surface compresses
  the difference between the status hues.
- **The status, health and chip colours each need a dark variant.** The light
  values are tuned for a pale sage background and will not pass contrast on a
  dark surface — they can't simply be reused.
- **The PWA shell carries two `theme-color` metas**, one per
  `prefers-color-scheme` (both set to the forced theme's colour when Settings
  forces one), plus CSS `color-scheme` per theme so the iOS status bar,
  scrollbars and form controls follow the theme. The web manifest can hold only
  one `theme_color`/`background_color` pair, so it carries the light values;
  iOS uses those for the Home Screen splash.
- **Plant photos are user content and are never dimmed, tinted or inverted.**
  A struggling plant should look the same in both themes.

The dark token values themselves belong in `screens.md` alongside the light
ones; see "Dark mode" there.

---

## 10. Privacy and security

- Data (plants, logs, photos) is stored in the user's Firebase project, readable only by its owner via security rules. No analytics.
- Exception: an active plant-sitting link exposes a snapshot of the shared plants (names, locations, instructions, thumbnails, owner's contact if given) to anyone holding the link, until it expires or is revoked. The owner sees this clearly when creating the link.
- Accounts are invite-only.
- Push tokens are stored per device and deleted on sign-out.

---

## 11. Milestones

**M1 — Catalogue (MVP core)**
- PWA shell, installable, offline
- Firebase project, Hosting, Auth (Google + email/password, `authDomain` = app domain), Firestore with security rules and offline cache
- Test sign-in in the installed iOS app early
- Add/edit plants, species presets, care profile view
- Notes
- Spike: test Perenual/Trefle lookups against the starter species (see 8.1)

**M2 — Tasks and log**
- Check-water tasks with seasonal intervals
- Today view ("Needs watering" list on open) with one-tap actions
- Care log, adaptive interval suggestions
- Calendar (.ics) export (optional)
- Lookup by scientific name with caching and provenance; optional "identify from photo" (Pl@ntNet)

**M3 — Photos**
- Add photos, downscaling, per-plant gallery
- Compare view, optional time-lapse
- Monthly photo reminder with ghost overlay

**M4 — Plant-sitting, backup and polish**
- "Going away" flow, share link, sitter view, sitter logs merged into the owner's log
- Export to zip
- Persistent storage request, settings, dark mode
- Onboard a second user (mum)
- Accessibility pass

**M5 — Push reminders (optional)**
- Scheduled Cloud Function, push tokens in Firestore, daily digest via Cloud Messaging
- iOS install flow guidance

---

## 12. Testing

- Unit tests for scheduling logic (season switch, snooze, adaptive interval).
- Security rules tests with the Firebase Emulator Suite: user A can't read user B's data; nobody can list another user's shares; expired shares can't be read or written; sitters can't edit or delete log entries or log for plants outside the share.
- Develop against the Firebase emulators (Auth, Firestore, Storage) locally.
- Manual PWA checks: Lighthouse PWA audit, install on Android and iOS, offline mode, airplane-mode logging.
- Photo import with large files to check downscaling and storage use.

## 13. Open questions

Resolved (see Decisions at the top): fixed schedule vs. check nudges, calendar vs. weather seasons, preset scope, sync (v0.3); multi-user (v0.4); all-Firebase infra (v0.5); separate accounts, iPhone only, plant-sitting via links (v0.6); toolchain, UI kit, EN+FI, Firestore location, date storage (v0.8); app name Water.it (v0.10).

Still open:
- Plant-sitting: should the sitter view include an "add photo" button for "something looks wrong"? (Needs Storage writes from anonymous users, so later.)
- Photos: upgrade to Blaze for Cloud Storage when M3 arrives, or keep photos on the device only at first?
- When to add push: with Firebase already in place it's cheap; revisit after living with the in-app list for a few weeks.
- Should cold-night alerts use a weather API (local forecast), or stay manual?
