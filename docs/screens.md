# Water.it — Screen spec (v1)

The chosen designs from the design canvas, written down so they can be built without the canvas. The mockup sources are in `docs/mockups/*.dc.html`: they use inline styles and a small templating format (`{{hole}}`, `<sc-for>`, `<sc-if>`) and don't run on their own, but the markup and styles are the exact reference for layout, spacing and colours. Example data in them is Niko's own plants.

Build mobile-first at **390 px** wide (iPhone), then the iPad layouts from the tablet mockups (see "Breakpoints").

| Mockup | Screen |
|---|---|
| `today.dc.html`, `tablet-today.dc.html` | Today, phone and iPad landscape |
| `today-caught-up.dc.html`, `tablet-today-caught-up.dc.html` | Today with nothing due ("All caught up"), phone and iPad landscape |
| `plants.dc.html`, `tablet-plants.dc.html` | Plants list |
| `plant-detail.dc.html`, `tablet-plant-detail.dc.html` | Plant detail (iPad: list + detail side by side) |
| `add-plant-species.dc.html` | Add plant, step 1: choose a species |
| `add-plant.dc.html` | Add plant, step 2: details |
| `edit-plant-dark.dc.html` | Edit plant — also **the reference for how dark mode looks** |
| `sitter.dc.html` | Sitter view (M4) |

## Breakpoints

Tailwind's defaults, chosen to land on the iPad's two orientations:

| Width | Device | Layout |
|---|---|---|
| < 768 (`base`) | iPhone | Bottom tab bar. One column everywhere. |
| ≥ 768 (`md`) | iPad portrait (820) | Side rail instead of the tab bar. Plants list in two columns, plant detail in two columns with a Back button. Today: "Coming up" goes below the cards. |
| ≥ 1024 (`lg`) | iPad landscape (1180) | Plants list in three columns. Plant detail gets the plant list as a 320 px column beside it, and loses Back. Today: cards in two columns with "Coming up" as a 300 px column on the right. |

The frame (tab bar or rail) is owned by `src/routes/(app)/+layout.svelte`; pages own only their own columns and padding (phone: 20 px sides, 56 top; `md`+: 32 px sides, 40 top).

## Design tokens

| Token | Value | Use |
|---|---|---|
| `bg` | `#F3F5F1` | App background (pale sage) |
| `surface` | `#FFFFFF` | Cards, rows, tab bar |
| `ink` | `#1B241F` | Primary text |
| `ink-2` | `#2E3933` | Body text |
| `muted` | `#45514A` | Secondary text |
| `muted-2` | `#5A665F` | Section labels, inactive tabs |
| `line` | `#E8ECE8` | Dividers inside cards |
| `border` | `#C9D3CC` | Outlined buttons, chips |
| `primary` | `#2F6B4F` | App's own controls (add button, active tab, leaf icons) |
| `water` | `#2B5F9E` | Watering actions only (Watered button, drop icons) |
| `danger` | `#C53030` border / `#9B1C1C` text | Overdue |
| `sun` | `#B7791F` icon / `#FBF3E4` bg / `#6B4510` text | Light chip |
| `water-chip` | `#2B5F9E` icon / `#E6EEF7` bg / `#1D3E63` text | Water chip |

Status colours (badge background / text):

| State | Background | Text | Icon |
|---|---|---|---|
| Watered | `#DDF0E2` | `#1F5A36` | check |
| Still damp | `#FCEFC7` | `#6E4B00` | clock |
| Skipped | `#FBE1DE` | `#9B1C1C` | x |

Health (face badge background / face + label colour):

| Health | Background | Colour | Mouth |
|---|---|---|---|
| Thriving | `#EAF3EC` | `#2F6B4F` | smile |
| Okay | `#ECEFEC` | `#45514A` | flat |
| Recovering | `#E6EEF7` | `#1D3E63` | slight smile |
| Struggling | `#FBEBD9` | `#8A3B06` | frown |

Form and control tokens (from the Add/Edit mockups; `layout.css` has both themes):

| Token | Light | Use |
|---|---|---|
| `field-bg` | `#FFFFFF` | Inside text fields |
| `field-border` | `#7E8A83` | Text field and search borders, 1.5 px. **Must clear 3:1** against the field and its surroundings: 3.27 on `bg`, 3.59 on `surface`. The mockup's `#8A968F` is 2.80 on `bg`, too faint where fields sit on the page (sign-in). The decorative `border` is never used for fields. |
| `placeholder` | `#5A665F` | Placeholder text |
| `link` | `#2F6B4F` | Text links ("Forgot password?", "Change") |
| `selected-bg` / `selected-border` | `#EAF3EC` / `#2F6B4F` | Chosen radio card or chip, the rail's active pill, the open plant in the iPad side list |
| `segment-bg` / `segment-selected` | `#E3E8E4` / `#FFFFFF` | Segmented controls (Care/Log/Photos, pot material, light) |
| `switch-off` | `#7E8A83` | Switch track when off (on is `primary`) |
| `edited-bg` / `edited-fg` | `#FCEFC7` / `#6E4B00` | "Edited" tag on a care field that differs from its preset |
| `danger` / `danger-border` | `#9B1C1C` / `#C53030` | Delete plant; the overdue card border |

- **Font:** Plus Jakarta Sans (400–800). Page title 34/800, card title 16–17/700, body 13–15, labels 11–13.
- **Radii:** cards 18, small buttons 10–12, big square button 18, chips/pills 999.
- **Spacing:** page padding 20 (top 56 under the status bar), gap between cards 10, card padding 10–12.
- **Shadow:** `0 1px 2px rgba(20,40,30,0.06)` on cards.
- **Icons:** Lucide, stroke style; drop icon filled for watering.

## Rules that apply everywhere

- Touch targets ≥ 44 px (small secondary buttons may be 36 px tall but keep 44 px total hit area where possible).
- Status is never colour alone: always icon + text label.
- Icon-only buttons have `aria-label`s.
- Text contrast ≥ 4.5:1 (the tokens above pass on their backgrounds).
- All UI text goes through i18n (English + Finnish).
- Every input shows a focus ring, even where the ring is drawn on its wrapper (search fields: `focus-within` outline).
- When a tap replaces the button under the finger (Watered → badge + Undo, Done, Undo → Watered), focus moves to the card's new main button rather than falling back to the top of the page: `keepFocus` (`src/lib/keep-focus.ts`) on the Today lists and the next-check card, with `data-refocus` on the button that should get it and `data-focus-key` on each Today card.

Accessibility pass (2026-11-14): code review plus a contrast check of every text/background token pair in light, dark and the scene variants (one miss, the dark-day scene eyebrow over the hills, fixed). Fixes: the focus behaviour above, plant-detail tabs 40 → 44 px, search focus rings. Already in place and checked: labels on every icon-only button, decorative art `aria-hidden`, real tablist on plant detail, form errors tied to fields with focus moved to the first, live regions for loading and summaries, `lang` set by Paraglide, pinch zoom allowed, opening animation shortened under Reduce Motion. Not done: an automated axe-core run, and iOS Larger Text (Dynamic Type), which a web app only follows if its type is built on `-apple-system-body`.

## Navigation

`src/lib/components/AppNav.svelte`, one component in two shapes. Four destinations in the same order: **Today** (drop), **Plants** (leaf), **Photos** (camera), **Settings** (gear).

- **Phone: bottom tab bar.** Fixed, 84 px tall incl. safe area (24 px or the home-indicator inset, whichever is larger), `surface` with a top `line` border. Active tab `primary` and bold; inactive `muted-2`. Label 11 px under a 24 px icon.
- **iPad (`md`+): side rail**, 96 px wide, full height, right border. App mark at the top: the app icon itself (`AppLogo`, the white drop with a sprout on `#316C4D`, from design/icons/logo.svg), 48 px with 14 px corners — not a plain Lucide drop, which is what it showed until 2026-11-14, then the four items: 24 px icon on a 56 × 32 pill, 12 px label, 64 px tall. The active item's pill is `selected-bg`.
- Photos is M3, so it is shown disabled ("Not built yet") rather than left out: the bar keeps its designed shape.
- The tab bar stays on plant detail too, unlike the phone detail mockup, which draws no bar. One way out of every screen beats a Back button that is the only exit.

## Today (home) — `docs/mockups/today.dc.html`

- Header: greeting line ("Good afternoon, Niko · Wed, Nov 11" on phones, the long date on the iPad; 13/600), title "Today", summary line ("4 to check · tap the drop when watered" / "All done for today."). At least 150 px tall so the cards start below the scene's ground line; on phones the text keeps 120 px clear on the right for the cacti. The name is the first word of the account's display name; email/password accounts have none, so it's just "Good afternoon · …". Morning 5–12, afternoon 12–18, evening 18–5 (`part-of-day.ts`).
- Cards on the phone get a second, softer shadow (`--shadow-raised`, Main board); the iPad cards keep the single one, as on TabletToday.
- **"Coming up"** headings carry a calendar icon (phone caught-up list and the iPad column). On the iPad (`lg`) the column's top padding is 138 px, so the list's top lines up with the first card (138 + 20 heading + 12 gap = 150 header + 20 gap).

### Today header scene (2026-11-14) — `today.dc.html`, `tablet-today.dc.html`, `today-evening*.dc.html`, `today-dark.dc.html`

A little scene behind the top of Today, both with checks and "All caught up": a pale sky band, the sun with a halo, three rounded cacti (two with "eyes") and a terracotta pot with a sprouting plant on a soft ground line that melts into the page, plus a couple of sprouts. `src/lib/components/today/TodayScene.svelte`, decorative (`aria-hidden`).

- **Evening** (from 18:00, with "Good evening"; fixed clock times on purpose, not real sunset, which would need the location — the scene is there to feel welcoming, not to be accurate. Niko, 2026-11-14): deep green sky, crescent moon, stars, darker cacti, no sprouts; the header text turns light (`--sc-eyebrow`/`--sc-title`/`--sc-summary`).
- **Dark theme:** day is a muted slate-blue sky with a warm sun and two faint clouds; evening a near-black green. Colours from the boards, as tokens on `data-scene` in layout.css.
- **Phone:** 270 px band, the cluster anchored to the right edge at its designed size. **iPad:** 250 px band laid out as on the 1084 px board from the content's left edge (cluster in the middle, a cloud on the right in daytime). The tablet evening isn't drawn; it uses the tablet layout with the evening colours and the phone's stars tiled across.
- Built in layers so no shape stretches: the sky is the container's background, the ground a full-width path (never narrower than the board, so the plant stays on the line), the sun, cacti and plant fixed-size SVG on top.

- One **card per plant due** (overdue first), vertical list:
  - Left column: 44 px rounded thumbnail, plant name (16/700), due line (12/700): "Today" in `#1D3E63`, or **"Overdue N days"** in `#9B1C1C` with a warning-triangle icon. Below: one-line check hint (13 px), e.g. "Skewer under the pebbles. Water if dry 2–3 cm down." Then two small buttons: **Still damp** (outlined) and **Skip** (text).
  - Right: a big **84 × 84 square Watered button**, `water` background, white filled drop icon (34 px) with a small "Watered" label. `aria-label="Watered <plant name>"`. This is the primary, fastest action.
  - **Overdue** cards have a 2 px `#C53030` border (otherwise a transparent 2 px border so heights match).
- After an action, the card stays in place and switches to its logged state:
  - The buttons are replaced by a **status badge** (pill: Watered / Still damp / Skipped, colours above) plus a line with what happens next ("Next check in 14 days" / "Checking again in 3 days" / "Back on the list tomorrow") and an **Undo** link.
  - The big square becomes a tinted square in the status colour with the status icon (check / clock / x).
  - The overdue border is removed.
- Rejected alternatives (don't build): swipe rows, one-plant-at-a-time "watering round".

Built 2026-11-13 (phone layout; `src/routes/(app)/+page.svelte`, `TodayCard.svelte`), with these decisions:

- **What each answer does** (`schedule.ts`, tested): **Watered** → next check after the current season's interval, counted from today. **Still damp** → check again in a quarter of the interval, rounded down, at least 2 days (3 for a 14-day plant); the interval is **not** changed (Niko, 2026-11-13) — suggesting a longer one after repeated damp checks is the adaptive step, later. **Skip** → back tomorrow. Every answer also writes the current season's interval to the check, so a season change takes effect at the next answer.
- **Each answer is a log entry plus the check's new date, in one batch.** The entry keeps the check as it was (`check.before`), so **Undo** restores it and deletes the entry — from any device, after a reload too. Undo is offered for the rest of the day, while nothing else has moved the check since (`canUndo`).
- **Answered cards come from today's log**, not from memory: a plant watered this morning still shows "Watered" this afternoon. A plant shows as answered only if its check was due at the day's first answer, so watering early from plant detail doesn't put it on Today. "Still damp" then "Watered" on the same day is one card showing the latest.
- **Order:** by the date each check was due (answered ones by their old date), then name — so a card keeps its place when answered.
- `at` is the phone's clock, not a server timestamp: a pending server timestamp has no value offline, so "answered today" couldn't be known until the phone was back online.
- **"Today" moves on** at local midnight and when the app comes back to the foreground (`clock.svelte.ts`), because an installed iOS app can sit open for days. The Plants list uses the same clock.
- Seasons use the default April–September until there is a settings document.
- The thumbnail and name link to the plant. Still damp and Skip are 44 px tall rather than the mockup's 36 (touch target rule).
- Empty states, not designed: no plants → "Your plants' checks will show up here" + Add plant; nothing due → "Nothing to check today." plus "Next up: Pilea, Sat 21 Nov."
- **iPad**, built the same day: from `md` the cards are a two-column grid (aligned to the top, as drawn) laid out upright, with a wide Watered button at the end of the Still damp / Skip row; answered, the badge, next step and Undo share one row. "Coming up" sits below the cards in portrait and becomes the 300 px right column from `lg`. It lists the next five checks after today — answered plants reappear there at their new date — each "Check soil", or "Water" for a plant on a fixed schedule. Other task kinds join the list when they exist. Phones keep the one-line "Next up" instead.
- **Not yet:** "Checked, very dry", the cold-night banner. Interval suggestions are on plant detail (below), not on Today.

### Today — nothing due (`today-caught-up.dc.html`, `tablet-today-caught-up.dc.html`)

Niko's design for when nothing is left to answer, which is also what the app opens on most days. Built 2026-11-13:

- Summary "Nothing to water today." (or "All done for today." once something was answered today), then an **"All caught up"** card: a small drawn plant with a check (tokens `--illo-*`, so it follows dark mode), the heading, and "Last watering on Wednesday. Next up is Yucca, tomorrow." — or "Everything due today is done." on a day something was answered.
- **Answered cards stay under that card until midnight** (Niko, 2026-11-13), so Undo is still in reach; the next morning the screen is the design as drawn.
- **This week:** seven days from today with a drop on days with a check, a dot on the rest, and the week's count; iPad names the plants under the drop (two, then "+N more"), "Rest day" on empty days, "Done" on today once dealt with. **Only each plant's actual next check**, never a guessed repeat from its interval (Niko, 2026-11-13): dates move with every answer. Each day reads as one sentence to a screen reader.
- **Coming up:** on the phone a card of rows (thumbnail, name, "Check soil · Kitchen window", a day pill "Tomorrow" / "Mon" / "Wed 25"); on iPad the column's date tiles. Tomorrow is picked out in the water colours. "Check soil again" when the last answer was Still damp; "Water" for a fixed schedule. Rows open the plant.
- **Seasonal tip:** five bundled tips per season (growing / winter), one a day in turn, in the Paraglide messages (`tip_growing_*`, `tip_resting_*`). Drafted by Claude; Niko to read and edit.
- **"See all N plants"**: an outlined button on the phone, the link in the iPad column. On iPad the tip replaces the dates note in the column.
- "Last watering …" and "Check soil again" read the check's `lastAnswer` (design.md §6), written with every answer and restored by Undo. Checks answered before it existed don't have one, and the sentence then just says what's next.
- Not in v1 mockup but in the design doc: cold-night alert banner. Optional, below the cards.
- **iPad (`tablet-today.dc.html`):** the cards go into two columns, each card laid out vertically (name and due line, hint, then Still damp / Skip on the left and a wide Watered button on the right). A **"Coming up"** column (300 px) on the right lists the next few tasks of any kind — date block (weekday + day), plant, task ("Turn the pot", "Check soil") — with a "See all plants" link and the note "Dates move when you log something. A late watering pushes the next check later." In portrait it goes below the cards. Built with the Today view in M2.

## Fertilise and repot reminders (2026-11-14, no mockup)

Niko asked for both, each with its own colour and icon on Today.

- **Colours and icons:** fertilising is **violet** with a **flask** (liquid feed; `flask-conical`), repotting **terracotta** — the scene's pot — with a **plant pot** (`plant-pot`). Tokens `--rm-bg/fg/icon/fill` and `--on-rm` on `data-reminder`, light and dark; text 7:1+, the solid Done fill 6:1+, icons 4.3:1+. The log's Fertilised / Repotted badges use the same.
- **When:** worked out, not stored (`src/lib/plants/reminders.ts`, tested): from the care profile and the last time it was done (`lastDone` on a `fertilize-<plant>` / `repot-<plant>` task), or from the day the plant was added. So editing the profile, the season or dormancy apply at once, with nothing to migrate.
  - **Fertilise:** last time + interval. "Growing season only" moves a date outside the growing months to the first day of the next growing month — no winter reminders (all presets are growing-only, so the first ones arrive on 1 April). None while dormant; under a grow light all year.
  - **Repot:** last time + months, moved forward into spring (April–May), never earlier.
- **Today:** due reminders get their own cards after the water cards, laid out like them: icon tile in the reminder tint, name, "Fertilise · Due since Nov 9", the profile's rhythm ("Every 45 days."), **Later**, and a big **Done** square in the reminder fill (a wide Done button on the iPad). No red overdue border. Done logs Fertilised / Repotted now; the card then shows the badge, "Next on December 29" and **Undo** for the rest of the day. **Later** puts it off a week (repotting two). The summary says "N things to do today" when only reminders are left; the "All caught up" screen waits for both.
- **Coming up** lists reminders due within 14 days, with the reminder tile (phone) or a small icon on the "Fertilise · …" line (iPad). The week strip stays water-only.
- **Plant detail:** the Fertilizing and Repot rows end with "Next: Apr 1, 2027", or "Due since Apr 10." when it's already due.
- **Add to log** with Fertilised / Repotted resets the reminder too (to that day, unless something later was already logged). Every such entry keeps the reminder as it was (`reminder.before`), so Undo — or deleting the entry from the log, while nothing has changed it since — puts it back.
- `pnpm seed:plants` makes the Dracaena's fertilising (fed all year) and the Yucca's repotting due, for testing.

## Backdrops (2026-11-14) — `plants.dc.html`, `tablet-plants.dc.html`

Every signed-in screen except Today (which has its scene) and the sign-in screens gets the **rolling hills** at the bottom: soft rounded hills ("cacti") in two shades, a ground band and a few sprouts. `src/lib/components/HillsBackdrop.svelte`, decorative.

- Fixed to the bottom of the viewport behind the page (`z-index: -1`), so it stays put while the list scrolls over it: Plants, Settings, Add/Edit plant. From `md` it starts right of the rail. Phone drawing 390 × 430, iPad 1084 × 340, scaled to cover the width and anchored to the bottom.
- **Plant detail** draws them inside its content sheet instead, whose opaque background would hide the fixed one; the sheet reaches at least the bottom of the screen so they sit there on a short page too.
- **Dark:** not drawn in the design. Same shapes a few steps above the dark page background, so they stay quiet.
- **Cards get a 1 px edge** (`--card-edge`: `#d3dcd5` light, `#34403a` dark) on every screen with the hills — plant cards, Settings, Add/Edit plant, the species picker — because over the hills a card barely stands out: white on the pale hills is about 1.2:1, and in dark the card (`#1c221f`) and the hills (`#1e2822`) are nearly the same colour (Niko, 2026-11-14).

## Plants — `docs/mockups/plants.dc.html`

- Header: title "Plants", summary ("5 plants · 1 struggling"), 48 px square **Add plant** button (`primary`, plus icon, `aria-label="Add plant"`).
- **Single-column list rows** (white, radius 18, padding 12), each a link to the plant detail:
  - 68 px rounded thumbnail (photo; placeholder = tinted square with leaf icon) with a 32 px **health face badge** on its bottom-right corner (white 2.5 px ring).
  - Name (17/700), health label in the health colour (13/600), next check with a clock icon ("Check: Sat"; "Check: Overdue" in `#8A3B06`).
  - Two **labelled chips**: light (sun icon + "Bright" / "Medium" / "Low") and water (drop icon + "Little" / "Moderate" / "Lots"). These show the plant's **general** care needs from its care profile, not today's status.

Built 2026-11-12, with these decisions:

- The light chip reads `careProfile.lightLevel`, a field added for it. `careProfile.light` is a sentence for the Care tab and cannot be turned into a translatable one-word chip. The water chip needs no such field: it is derived from `wateringStyle` (`sparse` → Little, `soak-and-dry` → Moderate, `keep-moist` → Lots).
- "Check:" shows `Overdue` / `Today` / a weekday / `In N days`, switching to the day count from a week out, where a weekday name stops naming one day. Weekday names come from `Intl`, which abbreviates them correctly per locale (Finnish uses lower case, "la").
- Sorted by name, in the UI rather than in the Firestore query: Firestore orders strings by byte value, which files `Ä` after `Z` instead of after `A`.
- The Add button opens Add plant (since 2026-11-13). The empty state follows the tokens, since screens.md does not design one, and leads with "Add your first plant".
- **iPad (`tablet-plants.dc.html`), built 2026-11-13:** the same cards in a grid, two columns from `md`, three from `lg`. The header adds a 280 px **search** field (filters by name and location) and the Add button gains its label ("+ Add plant"). Search is iPad-only, as designed.
- The list's data lives in `src/routes/(app)/plants/+layout.svelte`, shared through context, so the list page and the iPad side list under plant detail use one listener.

## Plant detail — `docs/mockups/plant-detail.dc.html`

- Header photo, 300 px tall, with round 44 px Back and Edit buttons on top; content sheet overlaps the photo by 28 px with a rounded top. **The photo stays in place and the sheet scrolls up over it** (Niko, 2026-11-13); Back and Edit stay on top of both.
- Name (30/800), common + scientific name (italic), chips: health, location, pot ("Terracotta · clay pebbles").
- **Order on phones (changed 2026-11-14):** name and chips, then the next-check card, then the tabs. Niko: watering is the first thing to look at on a plant, so it comes before the tabs and stays there on every tab, rather than sitting under them on Care only as in the mockup. The iPad keeps the tablet mockup's layout (tabs beside the name, next check opening the Care tab's left column).
- Segmented tabs: **Care** / **Log** / **Photos** (Care designed; Log is a simple design of its own, below; Photos not yet).
- Next-check card: "Check overdue 2 days" / "Next check Sat", last watered + interval, **Watered** (water colour) and **Still damp** buttons.
- **Care profile** list: Light, Watering, Check test, Temperature, Fertilizing, Repot, Watch out. Small provenance line under it ("From the Pilea preset · edited by you: check test").
- **Note for plant-sitters** card.

Built 2026-11-12 (Care tab), with these decisions:

- **Watered / Still damp** (built with Today, 2026-11-13) use the same writes as the Today cards. Unlike Today they are always offered, due or not — watering early is real and restarts the interval. Once answered today, the card shows the same status badge, next step and Undo as Today. "Last watered 25 Oct · winter interval 14 days" (built with the Log tab, 2026-11-14) comes from the plant's log, or from the check's `lastAnswer` when the watering is older than the log page that's loaded; with no watering on record it shows just the interval. The season is resolved with the default growing months, as on Today.
- **Care rows with no data are dropped, not shown empty.** A plant added by hand will have only a couple of these filled in, and a column of blank values reads as a broken screen. Asserted in `labels.spec.ts` against the real compiled strings.
- Watering reads as one sentence built from `wateringStyle` plus the two intervals, and says "Water every N days" instead of "Check every N days" when `fixedSchedule` is set — a different instruction, not different wording. The season is **not** resolved: both intervals are named, because which one applies needs `Settings.growingMonths`, and there is no settings document yet.
- **Still missing:** the "Latest photo · 2 Nov" caption, which needs M3 photos (the header shows "No photo yet"); and the Photos tab, which is rendered `disabled` rather than hidden so the shape of the screen is honest.
- **Added 2026-11-13, with the presets:** the common + scientific name line ("Chinese money plant · *Pilea peperomioides*"; nothing for generic presets or a blank profile) and the provenance line ("From the Pilea preset · edited by you: check test"), which lists edited rows once each, lower-cased.
- **iPad (`tablet-plant-detail.dc.html`), built 2026-11-13.** From `md` the Care/Log/Photos tabs (300 px) sit beside the name block, and the content is two columns: next check and the sitter note on the left, the care profile on the right. Edit becomes a labelled pill. From `lg` the plant list sits beside the detail as a 320 px column (compact rows: 48 px thumbnail, name, "health · next check", the open plant highlighted with `selected-bg` and `aria-current`), Back disappears and the photo header drops to 220 px. The "Recent log" card in the left column (built 2026-11-14) shows the latest four entries — badge, note or "Next check …", date — and **Open full log** switches to the Log tab. iPad only, as designed; on a phone the Log tab is one tap away.
- Each section is its own component (`src/lib/components/plant/`), so the two layouts only rearrange them.

### Interval suggestions (built 2026-11-14, no mockup)

design.md §4.3 "Adaptive tuning". A card under the next-check card (so above the tabs on phones, in the Care tab's left column on the iPad), coloured like the seasonal tip (`chip-sun-*`): advice, not a warning. Lightbulb + "SUGGESTION", one sentence, **Change to N days** (primary) and **Keep N days** (outlined), and "You can change it later in Edit."

- **Longer:** "The soil was still damp before each of the last 3 waterings. Check every 17 days in winter, instead of 14?" — when each of the last 3 rounds (watering to watering) had at least one Still damp.
- **Shorter:** "You watered early the last 3 times. Check every 5 days in the growing season, instead of 7?" — when each of the last 3 waterings came before its check was due, with no damp answer. "Checked, very dry" isn't built, so watering early is the evidence used.
- The suggested interval is the **median real gap** between those waterings. Bounds 2–120 days.
- Only answers given under the current season's interval count, so a season change, an edit or an accepted suggestion starts the count over. **Keep** stores the day on the check (`suggestionKeptOn`); answers up to then no longer count, so it comes back only after 3 new rounds say the same. Fixed-schedule plants get none.
- **Change** writes the new interval for the current season into `careOverrides.checkIntervalDays` (removed again if it equals the preset's, as in Edit) and, if the plant was last watered, moves the check by the difference; after a Still damp or Skip the snooze stays and the new interval starts at the next watering. The Edit form then shows the interval as Edited.
- **Plant detail only, not Today:** Today would need every plant's recent log, a few hundred extra reads each time the app opens, against the Spark plan's daily quota. Plant detail already loads the plant's log for the Log tab.
- Logic in `src/lib/plants/interval-suggestion.ts`, tested. `pnpm seed:plants` gives the Pilea a history that triggers a "longer" suggestion.

### Log tab (built 2026-11-14, no mockup)

Not a screen people open often, so there is no full mockup (Niko, 2026-11-14); it follows the tokens and the Recent log card.

- The plant's whole log, newest first, as **one card per month** under a section heading ("NOVEMBER 2026"). Each row: the day (number over short weekday), the **kind badge**, a detail line, and the time logged on the right.
- **Badges** are icon + word. Watered (check), Still damp (clock) and Skipped (×) use the Today status colours; every other kind (fertilised, repotted, note, problem…) is neutral `segment-bg` / `muted`, like the mockup's "Photo" row. Only the three check answers are written today; the rest are ready for later.
- **Detail line:** for Watered and Still damp, where the check moved ("Next check Sat, Nov 21"); Skip has none (it's simply back tomorrow). An entry's note, if any, shows under it.
- **30 entries at a time**, with a **Show older** button when there are more. One listener (`PlantLog`, `plantId + at desc` index) feeds the Log tab, Recent log and "Last watered".
- The open tab is in the URL (`?tab=log`), replaced rather than pushed, so a reload keeps it and Back still leaves the plant. Roving tabindex: Tab reaches the open tab, arrow keys switch.
- Empty state: "Nothing logged yet. Watered, Still damp and Skip land here."
- On the iPad the list is one column, at most 640 px wide.
- **Add to log** button at the top of the tab (and **+ Add** in the iPad Recent log card) opens the hand-logging flow below.
- **Hand-added entries** show a delete button (trash, 44 px, with a confirmation dialog: "Delete this entry?") where check answers show their time. Check answers are taken back with Undo instead. A hand-added entry's time isn't shown: one logged for an earlier day is stored at midday and has no real time.
- Not built: editing an entry (delete and add it again).

### Add to log (built 2026-11-14, no mockup)

Care done by hand. `src/routes/(flow)/plants/[id]/log/new`, a full-screen flow like Edit plant; Niko asked for a simple design.

- Header: **Cancel** · "Add to log" with "For Pilea" under it · **Save**. One form card, then a big **Add to log** button.
- **What did you do?** — chips: Fertilised, Repotted, Pruned, Moved, Note, Problem. **Watering isn't offered**: it goes through the check buttons, so the schedule has one way in.
- **When** — a date input, today by default, no future days. Today's entries get the current time; an earlier day is stored at 12:00.
- **Note** — optional, except for Note. Problem gets the hint "What does it look like? Yellow leaves, pests, a soft stem…". Up to 500 characters.
- **Moved** asks "Where did it go?" instead, prefilled with the plant's current spot, with the other spots as chips; saving also changes the plant's location, in the same batch. The new spot is stored as the entry's note (followed by any note typed).
- Rules in `src/lib/plants/manual-log.ts` (tested), writes in `log-writes.ts`.
- The health chip reuses the list's `--health-*` tokens rather than the mockup's one-off `#1F4A36`, so health looks identical on both screens. The outline chips use `--border` rather than the mockup's `#D6DDD8`.
- New token `--segment-bg` for the tab track. In dark it goes **lighter** than the page where light mode goes darker: a recessed track is invisible on a dark background (1.01 against `--bg`). At `#2B342E` it is 1.41 against the page and 1.28 under the selected tab, slightly clearer than the light design's own 1.13 / 1.24. The selection never rests on that edge alone — weight, ink colour and `aria-selected` all carry it.

## Add plant — `add-plant-species.dc.html`, `add-plant.dc.html`

Two steps, full screen, no tab bar.

**Step 1 — "What plant is it?"** Close (×) top left, "Step 1 of 2". Search field ("Search, e.g. pilea or money plant"). **Identify from a photo** (dashed card; M2, hidden until then). **Presets**: one card of rows — short name (16/700), scientific name in italics, light and water chips, chevron. **Not sure? Start general**: two cards side by side, Succulent and Tropical foliage, each with a one-line description. **Start from a blank profile** link. The lists come straight from `src/lib/presets/presets.json` (`kind: species` vs `generic`).

Step 1 built 2026-11-13 (`src/routes/(flow)/plants/new`):

- Add plant lives in a `(flow)` route group with no tab bar or rail; on an iPad it stays a centred column (`max-w-xl`) instead of stretching.
- Each choice is a link to `/plants/new/<preset id>` (or `/plants/new/blank`), so Back from step 2 and a reload keep the choice.
- Search matches short, common and scientific names **in both languages** ("money plant" works in a Finnish UI), every word must match. The general starting points stay visible whatever is typed, as the fallback when search finds nothing.
- The Add buttons on the Plants list (phone and iPad) and in the iPad side list now open it; the empty Plants list gets an "Add your first plant" button.

**Step 2 — "Your Pilea".** Back to step 1, "Step 2 of 2". Sections, each a white card:

- **Add a photo** (dashed, optional; M3, hidden until then). **Name** (prefilled with the preset's short name; hint "What you call it. Shown on Today and in the plant list."). **Species** row ("Pilea · *Pilea peperomioides*", **Change** link back to step 1). **Where is it?** with chips of the locations the user's other plants already use (derived from the plants, not stored separately).
- **How is it doing?** Four radio cards in a 2 × 2 grid, face + label, coloured with the health tokens when chosen.
- **Pot**: Material segmented (Plastic / Terracotta / Glazed), Top layer segmented (Soil / Clay pebbles / Gravel) with a hint that reacts to both ("Terracotta dries faster. Pebbles hide the soil, so check with a skewer."), Pot size (optional, number, "cm across").
- **Watering**: "Filled in from the Pilea preset…". Reminder type radio cards (**Check the soil** — recommended / **Fixed schedule**). Check every (or Water every): two steppers, Growing season (Apr–Sep) and Winter (Oct–Mar), labelled from `Settings.growingMonths`. **How to check** text field. Switches: **Under a grow light**, **Resting (dormant)**.
- **More care details** (collapsed): Light segmented (Bright / Medium / Low) + Light notes; Lowest temp; Comfortable range; Fertilizing; Repot; Watch out for. Each field preset-filled shows a small "From preset" label.
- **About this plant (optional)**: How did you get it (chips Bought / Cutting / Propagated / Gift), When ("e.g. June 2024"), Notes, Note for plant-sitters ("Shown on the share link…").
- **Add plant** (56 px, `primary`), and under it "First check: Wed 18 Nov. You can change everything later." (today + the season's interval).

Decided 2026-11-13, before building:

- **Structured inputs where the mockup shows free text.** Fertilizing, Repot and Comfortable are stored as numbers (design.md §6) and drive reminders, sitter instructions and Finnish text, so the form uses steppers and a min–max pair rather than the mockup's text fields: Fertilizing = "every N days" + "growing season only" switch; Repot = "every N months"; Comfortable = two numbers in °C. **Watch out for** is a list editor (one line per item), not one textarea.
- **When** is month precision (`YYYY-MM`): a month + year picker.
- **"From preset" / "Edited".** A field is "Edited" exactly when it is in the plant's `careOverrides` (design.md §6). Editing a field back to the preset's value removes the override. **Reset to preset** deletes it.
- Photo and Identify-from-photo are hidden until M3 / M2, not shown disabled: on a form, a control that does nothing is a trap.

Step 2 built 2026-11-13 (`src/routes/(flow)/plants/new/[preset]`, form body `PlantFormFields.svelte`, logic `plant-form.svelte.ts`):

- **Saving** writes the plant and its first `check-water` task (`check-water-<plantId>`) in one batch, then opens the new plant, replacing the form in history so Back can't add it twice. The write lands in the offline cache at once; nothing waits for the server.
- **First check** = today + the interval for today's season (dormant → winter interval; grow light → growing interval; otherwise the calendar). `src/lib/plants/schedule.ts`, with tests.
- **Added to the mockup: Water needs** (Little / Moderate / Lots) beside Light under "More care details". Presets supply it, but a blank profile had no way to set the water chip.
- **Validation** (Valibot) runs on submit: name required (≤ 60), intervals 1–120 days, pot 1–200 cm, temperatures −10…45 °C, comfortable range both-or-neither and lower first, fertilizing 1–365 days, repotting 1–120 months. Errors appear under their field, and focus moves to the first one; "More care details" opens by itself if the problem is inside it.
- **"From preset" / "Edited"** tags show on every care field when there is a preset (on Add as well as Edit), with **Reset to preset** under edited ones. Clearing a field the preset fills stores it as cleared (`null`), so the preset's text doesn't come back.
- **No "Note for plant-sitters" yet** (Niko, 2026-11-13): it is left out of the form and off plant detail until plant-sitting lands in M4, though `sitterNote` stays in the data model and Edit carries an existing note through untouched.
- Form controls: native radios for the segmented controls, health cards and reminder type; shadcn Switch (with a local 52 × 32 size) and Collapsible. Number fields use `inputmode="numeric"`; "When" is `<input type="month">`.

## Edit plant — `edit-plant-dark.dc.html`

The Add form, prefilled, with three differences: a header with **Cancel** · "Edit plant" · **Save**; edited care fields carry an **Edited** tag (`edited-bg`/`edited-fg`) and a **Reset to preset** link under them; and at the bottom **Save changes** plus an outlined **Delete plant** (`danger`), with "Deleting removes its log and photos too. You'll be asked to confirm." Delete removes the plant's tasks and log entries as well, in one batch.

The board is drawn in dark theme, and is the reference for the dark palette (see "Dark mode").

Built 2026-11-13 (`src/routes/(flow)/plants/[id]/edit`):

- Opened from the Edit button on plant detail (round on phones, labelled pill on iPad). The form is built once from the first snapshot, so a sync from another device can't wipe what's being typed.
- **Cancel and Save go back** to plant detail when that's where Edit was opened from (so Back never reopens the form); opened directly, they replace the form with plant detail.
- **Save** updates the plant in one batch with its check. Cleared fields are deleted, and `careOverrides` is replaced whole, so a reset override really disappears. If the interval for today's season changed, the next check moves by the difference, which keeps it counted from the last check (`rescheduleForNewInterval`, tested); it can become overdue, which is then true. A plant with no check (older data) gets one, from today.
- **Delete plant** opens a confirmation dialog ("Delete Pilea?" · Delete / Keep it). Confirming removes the plant, its tasks and its log entries in one batch and returns to the Plants list. The confirm button uses `--danger-fill` / `--on-danger`: white text on dark mode's `#E5776B` is only 2.92, so dark mode puts dark text on it (6.13).
- **Change species** (built 2026-11-13): **Change** on the species row opens the same picker as Add step 1 (`SpeciesPicker.svelte`) over the form, with the current choice ticked, under "Change species" and a note on what happens. It is a shallow-routing entry, so Back or the iOS swipe returns to the form. Picking a preset restarts the care fields from it (old overrides are dropped) and keeps name, health, pot, location and notes; a name still equal to the old preset's default follows the new one. Picking blank keeps the current care as the plant's own profile. Nothing is written until Save, so Cancel discards the change; on Save the next check moves if the interval changed, as with any edit.

## Opening animation

Chosen 2026-11-14 from four drafts ("Ripple reveal"). Installed app only, on a cold start:

1. iOS shows its launch image: the logo on `#316C4D` green, sized to 65 % of the screen's shorter side (`pwa-splash.config.ts`, 40 images in `static/splash/`). One version for light and dark.
2. `src/app.html` takes over from that exact frame: the logo pulses once and two rings spread out (~0.5 s).
3. When the app is ready (Today has its plants, or the sign-in page is up; `#lib/splash.ts`), a circle opens from the centre onto it. The intro never adds waiting, and after 4 s it opens regardless.

Reduce Motion: no pulse or rings, just a fade. Try it in a browser with `?splash` on any URL. The logo is `design/icons/logo.svg`, a vector trace of `app-icon.png`; regenerate the launch images with `pnpm generate-splash`.

## Sign-in

Not on the canvas. Built from the tokens, revised after review on 2026-11-13:

- **Continue with Google** uses Google's branded button: the standard four-colour "G" in Google's Light theme (white, `#747775` border, `#1F1F1F` text) in light mode and their Dark theme (`#131314`, `#8E918F`, `#E3E3E3`, the "G" on a white disc) in dark mode. Google's own colours, as `--google-*` tokens. Their guidelines name Google Sans Medium; we can't bundle it, so the app font at medium weight stands in.
- Fields use `field-border` (3:1). The password field has a **show/hide toggle** (eye icon, `aria-pressed`) inside its border.
- **Forgot password?** → `/signin/reset`: one email field, then a neutral confirmation ("If there's an account for …, a reset link is on its way") plus a note that Google accounts have no password to reset. Firebase sends the email and hosts the reset page.
- Under the title: "Water.it is invite-only. **Ask Niko for an invite.**" The no-invite screen says the same.
- Autofill: `autocomplete="current-password"` on the password, `username` on the email (the token Apple and the HTML spec specify for a login identifier, which pairs the two fields as one saved login).

## Settings

Not designed. For now:

- **Display**: **Language** (Automatic / English / Suomi) and **Appearance** (Automatic / Light / Dark), each a segmented control (`SegmentedChoice.svelte`, native radios — the same control the Add form will use for pot material and light). Automatic follows the phone. Changing language reloads the app (that is how Paraglide switches). Both are stored per device for now; `Settings.language` moves to Firestore with the settings document.
- **Backup**: one line on what the file holds, and **Save a backup** (download icon). The tap reads everything under `users/{uid}` and opens the share sheet (Save to Files, AirDrop, Mail…); on a desktop without file sharing it downloads instead. If the browser refuses the share sheet because the tap is too long ago, the button becomes "Your backup is ready" + **Save the file**, whose tap is fresh. Below a divider, **Offline data on this device**: "Kept, even when the device runs low on space" or "The device may clear it… Nothing is lost", from `navigator.storage.persist()` (asked once per launch, silently, in `(app)/+layout.svelte`); hidden where the browser can't tell.
- **Account**: "Signed in as …" and **Sign out**.

Growing season and notifications join later.

The language names are endonyms ("English", "Suomi") in both languages.

## Sitter view (M4, later) — `docs/mockups/sitter.dc.html`

Account-free page from the share link. No tab bar. Owner's message + "Message Niko" button, today's plants as large cards (photo, where it is, plain instructions, **I watered it** / **Still damp** / **Looks wrong**), done rows, "No water needed while Niko is away" chips, next visits, link expiry note.

## Dark mode

In scope from the start (design.md 9.1), following the phone's
`prefers-color-scheme` unless Settings → Appearance forces Light or Dark.

Every token above is implemented as a semantic CSS custom property, so dark
mode is a second set of values for the same names — not a second set of
components. Build against the token names only, never a literal hex.

**The look is set by `edit-plant-dark.dc.html`**, the one board drawn in dark:
a near-black green page, slightly lifted cards, fields sunk below the card,
and pale tints for text. Its values are taken as they are, with one fix
(the off switch); where it has no value — water, chips, overdue — one is
picked in the same spirit. Light tints with dark text would glare on a dark
surface, so each pair inverts into a deep tint carrying light text, keeping
the hue: green thriving, blue recovering, amber struggling.

| Token | Dark | Checked |
|---|---|---|
| `bg` / `surface` | `#121614` / `#1C221F` | — |
| `ink` / `ink-2` | `#E9EEEA` / `#CDD5D0` | 13.78 / 10.80 on card |
| `muted` / `muted-2` | `#A3AEA8` / `#97A29C` | 7.07 / 6.14 on card |
| `line` / `border` | `#2A322E` / `#3E4843` | decorative only |
| `field-bg` / `field-border` | `#151A17` / `#6F7C76` | border 3.71 on card, 4.04 on field, 4.19 on page |
| `primary` / `on-primary` | `#74C495` / `#0E2A1B` | 7.38 text on fill |
| `link` | `#8FD3A8` | 9.28 on card |
| `segment-bg` / `segment-selected` | `#262D29` / `#3A443F` | ink 8.60 on selected; edges 1.29 / 1.40, quiet as in light, so selection is also weight, ink and `aria-selected` |
| `selected-bg` / `selected-border` | `#1F3528` / `#74C495` | border 7.76 on card |
| `switch-off` | `#6F7C76` | 3.71 — the mockup's `#5E6A64` is 2.87, under 3:1 |
| `edited-bg` / `edited-fg` | `#3A3015` / `#F0D37A` | 8.86 |
| `danger` / `danger-border` | `#F2A39B` / `#E5776B` | 8.08 on card / 6.24 on page |
| `water` / `on-water` | `#86B4EA` / `#0B1D30` | 7.50 on card / 7.89 |
| `overdue` | `#F2B077` | 8.67 on card (the struggling colour) |
| `thumb-tint` | `#22302A` | leaf 6.61 on it |

Health `fg` is used twice — inside the face badge and as the health label
drawn straight on the card — so it is checked against both.

| Token | Dark bg | Dark fg | fg on bg | fg on card |
|---|---|---|---|---|
| Health thriving | `#1F3528` | `#8FD3A8` | 7.54 | 9.28 |
| Health okay | `#2A302C` | `#C2CBC5` | 8.12 | 9.74 |
| Health recovering | `#1E2C3D` | `#A9C8EE` | 8.22 | 9.39 |
| Health struggling | `#3A2716` | `#F2B077` | 7.59 | 8.67 |
| Light chip | `#33291A` | `#E8C98A` (icon `#D9A944`) | 8.93 | 10.13 |
| Water chip | `#1C2D44` | `#A8C8EC` (icon `#7FAEE6`) | 8.05 | 9.35 |

Meaningful icons and field borders are held to ≥ 3:1 rather than 4.5:1 (WCAG
1.4.11): the sun and drop glyphs clear 6.0 in dark. The light palette's own
sun icon (`#B7791F` on `#FBF3E4`) is the tightest icon anywhere at 3.30.

Status colours in dark (added with Today, 2026-11-13), reusing the thriving,
edited and danger hues. Each is only drawn on its own background:

| Status | Dark bg | Dark fg | fg on bg | Light fg on bg |
|---|---|---|---|---|
| Watered | `#1F3528` | `#8FD3A8` | 7.54 | 6.85 |
| Still damp | `#3A3015` | `#F0D37A` | 8.86 | 6.86 |
| Skipped | `#3A1F1C` | `#F2A39B` | 7.53 | 6.57 |

## Not designed yet

Settings beyond the account, Photos tab, empty states. Follow the tokens and rules above.
