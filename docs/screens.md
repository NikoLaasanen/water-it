# Water.it — Screen spec (v1)

The chosen designs from the design canvas, written down so they can be built without the canvas. The mockup sources are in `docs/mockups/*.dc.html`: they use inline styles and a small templating format (`{{hole}}`, `<sc-for>`, `<sc-if>`) and don't run on their own, but the markup and styles are the exact reference for layout, spacing and colours. Example data in them is Niko's own plants.

Build mobile-first at **390 px** wide (iPhone), then the iPad layouts from the tablet mockups (see "Breakpoints").

| Mockup | Screen |
|---|---|
| `today.dc.html`, `tablet-today.dc.html` | Today, phone and iPad landscape |
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

## Navigation

`src/lib/components/AppNav.svelte`, one component in two shapes. Four destinations in the same order: **Today** (drop), **Plants** (leaf), **Photos** (camera), **Settings** (gear).

- **Phone: bottom tab bar.** Fixed, 84 px tall incl. safe area (24 px or the home-indicator inset, whichever is larger), `surface` with a top `line` border. Active tab `primary` and bold; inactive `muted-2`. Label 11 px under a 24 px icon.
- **iPad (`md`+): side rail**, 96 px wide, full height, right border. App mark (48 px `primary` square with the drop) at the top, then the four items: 24 px icon on a 56 × 32 pill, 12 px label, 64 px tall. The active item's pill is `selected-bg`.
- Photos is M3, so it is shown disabled ("Not built yet") rather than left out: the bar keeps its designed shape.
- The tab bar stays on plant detail too, unlike the phone detail mockup, which draws no bar. One way out of every screen beats a Back button that is the only exit.

## Today (home) — `docs/mockups/today.dc.html`

- Header: date line ("Wednesday 11 November", `muted-2`, 13/600), title "Today", summary line ("4 to check · tap the drop when watered" / "All done for today.").
- One **card per plant due** (overdue first), vertical list:
  - Left column: 44 px rounded thumbnail, plant name (16/700), due line (12/700): "Today" in `#1D3E63`, or **"Overdue N days"** in `#9B1C1C` with a warning-triangle icon. Below: one-line check hint (13 px), e.g. "Skewer under the pebbles. Water if dry 2–3 cm down." Then two small buttons: **Still damp** (outlined) and **Skip** (text).
  - Right: a big **84 × 84 square Watered button**, `water` background, white filled drop icon (34 px) with a small "Watered" label. `aria-label="Watered <plant name>"`. This is the primary, fastest action.
  - **Overdue** cards have a 2 px `#C53030` border (otherwise a transparent 2 px border so heights match).
- After an action, the card stays in place and switches to its logged state:
  - The buttons are replaced by a **status badge** (pill: Watered / Still damp / Skipped, colours above) plus a line with what happens next ("Next check in 14 days" / "Checking again in 3 days" / "Back on the list tomorrow") and an **Undo** link.
  - The big square becomes a tinted square in the status colour with the status icon (check / clock / x).
  - The overdue border is removed.
- Rejected alternatives (don't build): swipe rows, one-plant-at-a-time "watering round".
- Not in v1 mockup but in the design doc: cold-night alert banner. Optional, below the cards.
- **iPad (`tablet-today.dc.html`):** the cards go into two columns, each card laid out vertically (name and due line, hint, then Still damp / Skip on the left and a wide Watered button on the right). A **"Coming up"** column (300 px) on the right lists the next few tasks of any kind — date block (weekday + day), plant, task ("Turn the pot", "Check soil") — with a "See all plants" link and the note "Dates move when you log something. A late watering pushes the next check later." In portrait it goes below the cards. Built with the Today view in M2.

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
- The Add button is disabled until Add/Edit exists. Empty state follows the tokens, since screens.md does not design one.
- **iPad (`tablet-plants.dc.html`), built 2026-11-13:** the same cards in a grid, two columns from `md`, three from `lg`. The header adds a 280 px **search** field (filters by name and location) and the Add button gains its label ("+ Add plant"). Search is iPad-only, as designed.
- The list's data lives in `src/routes/(app)/plants/+layout.svelte`, shared through context, so the list page and the iPad side list under plant detail use one listener.

## Plant detail — `docs/mockups/plant-detail.dc.html`

- Header photo, 300 px tall, with round 44 px Back and Edit buttons on top; content sheet overlaps the photo by 28 px with a rounded top. **The photo stays in place and the sheet scrolls up over it** (Niko, 2026-11-13); Back and Edit stay on top of both.
- Name (30/800), common + scientific name (italic), chips: health, location, pot ("Terracotta · clay pebbles").
- Segmented tabs: **Care** / **Log** / **Photos** (Care designed; Log and Photos not yet).
- Next-check card: "Check overdue 2 days" / "Next check Sat", last watered + interval, **Watered** (water colour) and **Still damp** buttons.
- **Care profile** list: Light, Watering, Check test, Temperature, Fertilizing, Repot, Watch out. Small provenance line under it ("From the Pilea preset · edited by you: check test").
- **Note for plant-sitters** card.

Built 2026-11-12 (Care tab), with these decisions:

- **The Watered / Still damp buttons are not built.** Logging a check reschedules the plant, which is the scheduling work in M2, and the same two buttons are the primary action on the Today view. Built once with tests rather than wired up twice. The next-check card shows the status line only.
- **Care rows with no data are dropped, not shown empty.** A plant added by hand will have only a couple of these filled in, and a column of blank values reads as a broken screen. Asserted in `labels.spec.ts` against the real compiled strings.
- Watering reads as one sentence built from `wateringStyle` plus the two intervals, and says "Water every N days" instead of "Check every N days" when `fixedSchedule` is set — a different instruction, not different wording. The season is **not** resolved: both intervals are named, because which one applies needs `Settings.growingMonths`, and there is no settings document yet.
- **Still missing:** the "Latest photo · 2 Nov" caption, which needs M3 photos (the header shows "No photo yet"); and the Log and Photos tabs, which are rendered `disabled` rather than hidden so the shape of the screen is honest.
- **Added 2026-11-13, with the presets:** the common + scientific name line ("Chinese money plant · *Pilea peperomioides*"; nothing for generic presets or a blank profile) and the provenance line ("From the Pilea preset · edited by you: check test"), which lists edited rows once each, lower-cased.
- **iPad (`tablet-plant-detail.dc.html`), built 2026-11-13.** From `md` the Care/Log/Photos tabs (300 px) sit beside the name block, and the content is two columns: next check and the sitter note on the left, the care profile on the right. Edit becomes a labelled pill. From `lg` the plant list sits beside the detail as a 320 px column (compact rows: 48 px thumbnail, name, "health · next check", the open plant highlighted with `selected-bg` and `aria-current`), Back disappears and the photo header drops to 220 px. The "Recent log" card in the left column waits for M2.
- Each section is its own component (`src/lib/components/plant/`), so the two layouts only rearrange them.
- The health chip reuses the list's `--health-*` tokens rather than the mockup's one-off `#1F4A36`, so health looks identical on both screens. The outline chips use `--border` rather than the mockup's `#D6DDD8`.
- New token `--segment-bg` for the tab track. In dark it goes **lighter** than the page where light mode goes darker: a recessed track is invisible on a dark background (1.01 against `--bg`). At `#2B342E` it is 1.41 against the page and 1.28 under the selected tab, slightly clearer than the light design's own 1.13 / 1.24. The selection never rests on that edge alone — weight, ink colour and `aria-selected` all carry it.

## Add plant — `add-plant-species.dc.html`, `add-plant.dc.html`

Two steps, full screen, no tab bar.

**Step 1 — "What plant is it?"** Close (×) top left, "Step 1 of 2". Search field ("Search, e.g. pilea or money plant"). **Identify from a photo** (dashed card; M2, hidden until then). **Presets**: one card of rows — short name (16/700), scientific name in italics, light and water chips, chevron. **Not sure? Start general**: two cards side by side, Succulent and Tropical foliage, each with a one-line description. **Start from a blank profile** link. The lists come straight from `src/lib/presets/presets.json` (`kind: species` vs `generic`).

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

## Edit plant — `edit-plant-dark.dc.html`

The Add form, prefilled, with three differences: a header with **Cancel** · "Edit plant" · **Save**; edited care fields carry an **Edited** tag (`edited-bg`/`edited-fg`) and a **Reset to preset** link under them; and at the bottom **Save changes** plus an outlined **Delete plant** (`danger`), with "Deleting removes its log and photos too. You'll be asked to confirm." Delete removes the plant's tasks and log entries as well, in one batch.

The board is drawn in dark theme, and is the reference for the dark palette (see "Dark mode").

## Sign-in

Not on the canvas. Built from the tokens, revised after review on 2026-11-13:

- **Continue with Google** uses Google's branded button: the standard four-colour "G" in Google's Light theme (white, `#747775` border, `#1F1F1F` text) in light mode and their Dark theme (`#131314`, `#8E918F`, `#E3E3E3`, the "G" on a white disc) in dark mode. Google's own colours, as `--google-*` tokens. Their guidelines name Google Sans Medium; we can't bundle it, so the app font at medium weight stands in.
- Fields use `field-border` (3:1). The password field has a **show/hide toggle** (eye icon, `aria-pressed`) inside its border.
- **Forgot password?** → `/signin/reset`: one email field, then a neutral confirmation ("If there's an account for …, a reset link is on its way") plus a note that Google accounts have no password to reset. Firebase sends the email and hosts the reset page.
- Under the title: "Water.it is invite-only. **Ask Niko for an invite.**" The no-invite screen says the same.
- Autofill: `autocomplete="current-password"` on the password, `username` on the email (the token Apple and the HTML spec specify for a login identifier, which pairs the two fields as one saved login).

## Settings

Not designed. For now only **Account**: "Signed in as …" and **Sign out** (moved here from the old home placeholder). Language, growing season and notifications join later.

## Sitter view (M4, later) — `docs/mockups/sitter.dc.html`

Account-free page from the share link. No tab bar. Owner's message + "Message Niko" button, today's plants as large cards (photo, where it is, plain instructions, **I watered it** / **Still damp** / **Looks wrong**), done rows, "No water needed while Niko is away" chips, next visits, link expiry note.

## Dark mode

In scope from the start (design.md 9.1), following the phone's
`prefers-color-scheme` with no in-app toggle in M1.

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

**Still open:** the status colours (Watered / Still damp / Skipped). They
belong to the Today view and are picked when it is built.

## Not designed yet

Settings beyond the account, Photos tab, Log tab, empty states. Follow the tokens and rules above.
