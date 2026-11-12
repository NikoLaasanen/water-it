# Water.it — Screen spec (v1)

The chosen designs from the design canvas, written down so they can be built without the canvas. The mockup sources are in `docs/mockups/*.dc.html`: they use inline styles and a small templating format (`{{hole}}`, `<sc-for>`, `<sc-if>`) and don't run on their own, but the markup and styles are the exact reference for layout, spacing and colours. Example data in them is Niko's own plants.

Build mobile-first at **390 px** wide (iPhone). Tablets get the same layout, wider; a two-pane tablet layout is not designed yet.

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

## Bottom tab bar

Fixed, 84 px tall incl. safe area, white with top border `#E1E6E2`. Four tabs: **Today** (drop), **Plants** (leaf), **Photos** (camera), **Settings** (gear). Active tab `primary` and bold; inactive `muted-2`. Label 11 px under a 24 px icon.

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
- Not in v1 mockup but in the design doc: cold-night alert banner and a "Coming up" list. Optional, below the cards.

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
- **Rows are not links yet** and the Add button is disabled: both arrive with the screens behind them. Empty state follows the tokens, since screens.md does not design one.

## Plant detail — `docs/mockups/plant-detail.dc.html`

- Header photo, 300 px tall, with round 44 px Back and Edit buttons on top; content sheet overlaps the photo by 28 px with a rounded top.
- Name (30/800), common + scientific name (italic), chips: health, location, pot ("Terracotta · clay pebbles").
- Segmented tabs: **Care** / **Log** / **Photos** (Care designed; Log and Photos not yet).
- Next-check card: "Check overdue 2 days" / "Next check Sat", last watered + interval, **Watered** (water colour) and **Still damp** buttons.
- **Care profile** list: Light, Watering, Check test, Temperature, Fertilizing, Repot, Watch out. Small provenance line under it ("From the Pilea preset · edited by you: check test").
- **Note for plant-sitters** card.

Built 2026-11-12 (Care tab), with these decisions:

- **The Watered / Still damp buttons are not built.** Logging a check reschedules the plant, which is the scheduling work in M2, and the same two buttons are the primary action on the Today view. Built once with tests rather than wired up twice. The next-check card shows the status line only.
- **Care rows with no data are dropped, not shown empty.** A plant added by hand will have only a couple of these filled in, and a column of blank values reads as a broken screen. Asserted in `labels.spec.ts` against the real compiled strings.
- Watering reads as one sentence built from `wateringStyle` plus the two intervals, and says "Water every N days" instead of "Check every N days" when `fixedSchedule` is set — a different instruction, not different wording. The season is **not** resolved: both intervals are named, because which one applies needs `Settings.growingMonths`, and there is no settings document yet.
- **Still missing:** the common + scientific name line and the provenance line, both of which need the species presets; the "Latest photo · 2 Nov" caption, which needs M3 photos (the header shows "No photo yet"); and the Log and Photos tabs, which are rendered `disabled` rather than hidden so the shape of the screen is honest.
- The health chip reuses the list's `--health-*` tokens rather than the mockup's one-off `#1F4A36`, so health looks identical on both screens. The outline chips use `--border` rather than the mockup's `#D6DDD8`.
- New token `--segment-bg` for the tab track. In dark it goes **lighter** than the page where light mode goes darker: a recessed track is invisible on a dark background (1.01 against `--bg`). At `#2B342E` it is 1.41 against the page and 1.28 under the selected tab, slightly clearer than the light design's own 1.13 / 1.24. The selection never rests on that edge alone — weight, ink colour and `aria-selected` all carry it.

## Sitter view (M4, later) — `docs/mockups/sitter.dc.html`

Account-free page from the share link. No tab bar. Owner's message + "Message Niko" button, today's plants as large cards (photo, where it is, plain instructions, **I watered it** / **Still damp** / **Looks wrong**), done rows, "No water needed while Niko is away" chips, next visits, link expiry note.

## Dark mode

In scope from the start (design.md 9.1), following the phone's
`prefers-color-scheme` with no in-app toggle in M1.

Every token above is implemented as a semantic CSS custom property, so dark
mode is a second set of values for the same names — not a second set of
components. Build against the token names only, never a literal hex.

The dark values are picked by hand, not derived: the light palette's pale
tints with dark text would glare on a dark surface, so each pair inverts into
a deep tint carrying light text. Hues are kept so a plant reads the same in
both themes — green thriving, blue recovering, amber struggling.

Dark surface is `#1A211D`. Health `fg` is used twice — inside the face badge
and as the health label drawn straight on the card — so it is checked against
both.

| Token | Dark bg | Dark fg | fg on bg | fg on card |
|---|---|---|---|---|
| Health thriving | `#1E3A2A` | `#7FD0A0` | 6.75 | 8.94 |
| Health okay | `#2A322D` | `#B9C4BD` | 7.34 | 9.14 |
| Health recovering | `#1C3049` | `#93C0F0` | 7.04 | 8.63 |
| Health struggling | `#3A2415` | `#E8A87C` | 7.15 | 8.07 |
| Light chip | `#33291A` | `#E8C98A` (icon `#D9A944`) | 8.93 | 10.28 |
| Water chip | `#1C2D44` | `#A8C8EC` (icon `#7FAEE6`) | 8.05 | 9.49 |

Also dark: `--overdue` `#E8A87C` (the struggling colour, on the card), and
`--thumb-tint` `#22302A` behind the placeholder leaf.

Meaningful icons are held to ≥ 3:1 rather than 4.5:1 (WCAG 1.4.11): the sun
and drop glyphs clear 6.0 in dark. The light palette's own sun icon
(`#B7791F` on `#FBF3E4`) is the tightest value anywhere at 3.30.

**Still open:** the status colours (Watered / Still damp / Skipped). They
belong to the Today view and are picked when it is built.

## Not designed yet

Sign-in, Add/Edit plant, Settings, Photos tab, Log tab, empty states, tablet two-pane layout. Follow the tokens and rules above; standard forms are fine for sign-in and Add/Edit.
