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

## Plant detail — `docs/mockups/plant-detail.dc.html`

- Header photo, 300 px tall, with round 44 px Back and Edit buttons on top; content sheet overlaps the photo by 28 px with a rounded top.
- Name (30/800), common + scientific name (italic), chips: health, location, pot ("Terracotta · clay pebbles").
- Segmented tabs: **Care** / **Log** / **Photos** (Care designed; Log and Photos not yet).
- Next-check card: "Check overdue 2 days" / "Next check Sat", last watered + interval, **Watered** (water colour) and **Still damp** buttons.
- **Care profile** list: Light, Watering, Check test, Temperature, Fertilizing, Repot, Watch out. Small provenance line under it ("From the Pilea preset · edited by you: check test").
- **Note for plant-sitters** card.

## Sitter view (M4, later) — `docs/mockups/sitter.dc.html`

Account-free page from the share link. No tab bar. Owner's message + "Message Niko" button, today's plants as large cards (photo, where it is, plain instructions, **I watered it** / **Still damp** / **Looks wrong**), done rows, "No water needed while Niko is away" chips, next visits, link expiry note.

## Not designed yet

Sign-in, Add/Edit plant, Settings, Photos tab, Log tab, empty states, dark mode, tablet two-pane layout. Follow the tokens and rules above; standard forms are fine for sign-in and Add/Edit.
