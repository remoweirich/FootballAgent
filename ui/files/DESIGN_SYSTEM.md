# Football Agent Manager — Design System

Everything Claude Code needs to turn the mockups into consistent UI and wire it to the existing game logic. Three files:

| File | Purpose |
|---|---|
| `design-tokens.css` | All colours, spacing, radii, type, sizes as CSS variables. Import **first**. |
| `components.css` | Reusable component classes built on the tokens. Import **second**. |
| `DESIGN_SYSTEM.md` | This guide: colour systems, recipes, screen map, helpers, notes. |

Aesthetic in one line: **dark-first, mobile-first, one mint accent (`--accent`), calm surfaces with a single loud primary action per screen.** Green/red are reserved for meaning (promotion/relegation, good/bad state), *not* decoration.

---

## 1. Use with Claude Code

Paste this as your instruction, with the three files added to the repo:

> Add `design-tokens.css` and `components.css` to the project and import them globally (tokens first). Build the UI as a **mobile-first, dark-themed** single-page app using **only** these tokens and component classes — never hard-code a colour, spacing, radius or font size; always use `var(--…)`. Respect device safe areas with `env(safe-area-inset-*)`. Follow the navigation map and component recipes in `DESIGN_SYSTEM.md`. Wire each screen to the existing game state (clubs/players/scouts/agency modules) rather than mock data. Build in this order: (1) app shell — `.app-bar` + fixed `.bottom-nav` + a tiny router; (2) Home; (3) Clients list; (4) Client detail with its 7 tabs; (5) negotiations; (6) Agency; (7) Leagues; (8) Scouting. Keep it framework-free vanilla JS unless I say otherwise. Do **not** rely on `localStorage` for saves in the packaged app — plan for IndexedDB (web/PWA) or Capacitor Preferences/SQLite.

The near-black phone frame in the mockups is only the device bezel — it is **not** part of the app. The app background is `--bg`.

---

## 2. Colour systems that need logic

Most colours are plain tokens. These four are computed from data:

### Ability scale (player quality, 7 bands)
The badge colour encodes quality, low → high:

| Range | Token | Colour | Band |
|---|---|---|---|
| `< 15` | `--ability-1` | `#FF6B78` | red |
| `15–29` | `--ability-2` | `#F7973F` | orange |
| `30–44` | `--ability-3` | `#E7C33F` | yellow |
| `45–59` | `--ability-4` | `#B49AF6` | violet |
| `60–74` | `--ability-5` | `#5FA6F6` | blue |
| `75–84` | `--ability-6` | `#4ADE80` | green |
| `85+`  | `--ability-7` | `#15C07C` | dark green |

Render: `<span class="ability" style="--ab:var(--ability-6)">79</span>`. The `.ability` class derives the tinted background + border + text from `--ab` automatically.

```js
function abilityVar(a){
  if (a >= 85) return '--ability-7';
  if (a >= 75) return '--ability-6';
  if (a >= 60) return '--ability-5';
  if (a >= 45) return '--ability-4';
  if (a >= 30) return '--ability-3';
  if (a >= 15) return '--ability-2';
  return '--ability-1';
}
```

### Average match rating (traffic-light)
```js
function ratingVar(r){ return r >= 7.0 ? '--state-good' : r >= 6.5 ? '--state-mid' : '--state-bad'; }
```
Apply to the rating number's `color`.

### Morale — four dimensions, fixed order
The four dots / bars are always, left → right: **Club · Playing time · Wage · You (agent).** Each is coloured by its own level with the shared state tones: `--state-good` (happy) / `--state-mid` (unsettled) / `--state-bad` (unhappy). In the list it's four `.morale__dot`s; on the detail screen it's four `.bar`s out of 100 with a one-line explanation each. Keep the order fixed so players learn it.

### Standings zones (Leagues screen)
Direct promotion/relegation use the **full** tone; play-off places use the **lighter** tone so the two never blur:

| State | Token |
|---|---|
| Direct promotion | `--zone-promote` |
| Direct relegation | `--zone-relegate` |
| Promotion play-off (lighter) | `--zone-po-up` |
| Relegation play-off (lighter) | `--zone-po-down` |

Apply as a left border/bar on the position cell. (Per-country rules — Bundesliga relegation, Spanish 2-legged play-offs, etc. — already live in the game's league module; this is just the colour mapping.)

### Club chips & flags
Club identity = a small `.chip` circle filled with the club's colour (already in your club data). Nationality = a small flag: the mockups use 3 CSS bands (`.flag`), but for the real app use a proper set such as **flag-icons** (`https://cdn.jsdelivr.net/gh/lipis/flag-icons`) — `<span class="fi fi-de"></span>`.

---

## 3. Components (in `components.css`)

| Class | What it is |
|---|---|
| `.screen` | Page wrapper: dark bg, screen gutters, safe-area + bottom-nav padding. |
| `.app-bar` / `.nav-back` | Top bar. Main tabs: title + `.icon-btn` (Inbox). Detail screens: back chevron + title + Inbox. |
| `.icon-btn` + `.badge` | Round icon button with a notification count (the persistent Inbox). |
| `.bottom-nav` / `.nav-item` (`.is-active`) | Fixed 5-item bar. |
| `.tab-bar` / `.tab` (`.is-active`) | Horizontally scrollable tabs (client detail has 7). |
| `.card`, `.list-row`, `.section-label` | Core surfaces & lists. |
| `.metric` | Label + big value cell (dashboard, agency stats). |
| `.pill` (`--accent` / `--danger` / `--gold` / `--info`), `.count` | Status chips, filter counts. |
| `.btn` (`--primary` / `--accent-outline` / `--danger` / `--ghost` / `--sm`) | Buttons. One `--primary` per screen. |
| `.ability` (`.ability--lg`) | Colour-coded quality badge (see §2). |
| `.morale` / `.morale__dot`, `.bar` / `.bar__fill` | Morale dots and bars. |
| `.stat-strip` / `.stat` | Apps / goals / rating row. |
| `.slider` (`__fill` / `__handle`) | Wage & agent-fee controls. |
| `.segmented` / `.seg` (`.is-on`) | Role / length / duration selectors. |
| `.flag`, `.chip` | Nationality flag, club colour dot. |
| `.pic` (`--owned` / `--current` / `--locked`) | Pictogram box for upgrade categories & tiers. |
| `.tier` / `.tier__body` (`--current` / `--locked`) | One rung of an upgrade ladder. |

Icons: **Tabler Icons** (`<i class="ti ti-…"></i>`). Used in the mockups: `ti-inbox, ti-home, ti-users, ti-zoom-scan, ti-trophy, ti-briefcase, ti-chevron-left, ti-chevron-right, ti-chevron-down, ti-arrows-sort, ti-history, ti-file-text, ti-currency-euro, ti-bandage, ti-file-pencil, ti-tag, ti-send, ti-arrow-down, ti-arrow-up, ti-x, ti-check, ti-circle-check, ti-lock, ti-award, ti-broadcast, ti-car, ti-home-2, ti-world, ti-barbell, ti-users-group, ti-building, ti-building-skyscraper, ti-building-community, ti-building-arch`.

---

## 4. Navigation & screens

**Bottom nav (5):** `Leagues · Clients · Home · Scouting · Agency` — Home centred, active tab in `--accent`.
**Persistent:** the **Inbox** icon lives top-right on every screen (`.icon-btn` + `.badge`); it's a stream, not a tab.
**Header rule:** main tabs get title + Inbox; pushed detail screens get a back chevron + title (+ Inbox) and **no** bottom nav.

Screen map:
- **Home** — context-aware "Advance week" as the bottom primary action; finances (Balance / Reputation / last-week ±) up top; a "Needs attention" triage list; client highlights. Season header shows week+month and a transfer-window pill. *(Week 1 = 1 July, so weeks map July→June; windows are weeks 1–6 and 21–25.)*
- **Clients** — sortable card list (flag+position, name+age, club+role, ability, morale dots, apps · rating). Sort control + filter chips (All / Offers / Sponsors / Injury with counts) + Client history. Status icons on cards (offer €, injury bandage).
- **Client detail** — shared header (full name, flag + nationality, position, age, club · league, ability) + 7 scrollable tabs: **Overview** (offers list + reject-all, key info, season stats, action buttons), **Potential** (scout report, floor–ceiling on the ability scale, disclaimer), **Morale** (4 bars), **Injuries** (status, medical team, history), **Contract** (his terms + *your representation* + release), **Development** (ability line, wage **step** chart, transfer-fee bars — with gridlines), **History** (honours, all seasons, career totals toggled by club/competition).
- **Negotiations** (pushed from an offer "letter"; the collapsed letter shows the agreed fee): **Transfer** = one package (wage slider · role segmented · length segmented · agent-fee slider → *Propose package*); **Loan** = negotiated **separately**, role then duration, each with its own button; **Contract** = wage · role · duration → *Propose terms* (no fees). After proposing, show the club's counter and re-propose (the back-and-forth loop).
- **Agency** — 4 stats (Reputation / Clients / Scouts / Sponsor reach) + upgrade cards (Office, Vehicles, Properties, Int'l Scouting Licence, Equipment & Facilities, Staff). Each card opens a **tier ladder** (bottom→top): owned → current → buyable → locked, each tier a pictogram.
- **Leagues** — standings (5 columns: Pos · Club · P · GD · Pts), sticky header, **your clients' clubs highlighted**, zone colours (§2); plus cups & play-offs views.
- **Scouting** — your scouts, assignments, incoming reports, hiring market (same card/list patterns).

---

## 5. Interaction notes

- **Bottom sheets** for quick decisions (accept/reject/counter an offer, pick a club from "suggest to clubs", set a value) — keep the user in context instead of full page pushes.
- **Swipe actions** on a client row: open negotiation / suggest to clubs / arrange loan.
- **Context-aware primary button**: "3 tasks pending" when things need attention, "Advance to week N" when clear.
- **Destructive actions** (End representation, reject) sit at the bottom, in `--danger`, behind a confirm sheet.
- **Cost pills** read as affordable (`--accent` tint) or disabled/greyed when you can't pay.

---

## 6. Store-readiness

- **Dark theme is the design.** A light theme later = override surface + text tokens under `[data-theme="light"]`; components already use variables.
- **Packaging:** ship a PWA first (manifest + service worker — you already run client-side), then wrap with **Capacitor** for the App Store / Play Store.
- **Saves:** move off single-blob `localStorage` (the OS can evict it) to **IndexedDB** (web/PWA) or **Capacitor Preferences/SQLite** in the app. Do this before packaging.
- **Legal:** the mockups deliberately use fictional club/league names (e.g. "München FC", "Leeds City", "Primera Superior"). Keep club, league and cup names fictional (or provide an optional user-loaded real-names file); use your own SVG crests in club colours — never real logos. City names are fine.
