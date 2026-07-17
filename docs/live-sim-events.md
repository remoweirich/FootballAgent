# Live-sim events ("Attend the Final") — data findings

Analysis of `live_sim_events_v3.xlsx` against the engine, done before implementation.
Feature spec: `attend_the_final_prompt.md`. This file records what the workbook actually
contains and where it meets the existing code, so the analysis need not be redone.

## Reading the workbook

Unlike `uefa_access_list.xlsx` / `clubs_by_region.xlsx`, this workbook has **no
`xl/sharedStrings.xml`** — every string is inline (`<c t="inlineStr"><is><t>text</t></is></c>`).
`scripts/parse-uefa-xlsx.mjs` has a reusable zip reader but only understands the shared-string
table, so the import script needs an inline-string branch. Blank cells appear as `<c t="n"/>`
with no `<v>`. Sheets are `sheet1`=Sheet1, `sheet2`=Sheet2, `sheet3`=**Legend**.

Text contains HTML entities for curly quotes/ellipses (`&#8220;`, `&#8217;`, `&#8230;`) which
must be decoded at import time, not at runtime.

## Sheet1 — role codes

45 codes. **They map 1:1 onto the game's own `(position, styleRole)` pairs** in
`POSITION_ROLES` (js/scouting.js) — verified programmatically, no code is unmatched in either
direction. So `roleCode(player)` is a pure lookup from `p.position` + `p.styleRole`; there is no
need for a fallback role.

Note Sheet1's role names carry trailing spaces (`"sweeper_keeper "`) — trim on import.

## Sheet2 — event pieces

Data starts at row 4. Three independent column blocks:

| Block  | Key | Text | Codes | Weight | Tags |
|--------|-----|------|-------|--------|------|
| Start  | A   | B    | I     | AB     | —    |
| Middle | J   | K    | R     | AC     | —    |
| End    | S   | T    | AA    | AE     | AD   |

**420 pieces: 89 start, 84 middle, 247 end**, across 25 families `A`–`Y`. Every family has at
least one start, middle and end. No unrecognised role codes anywhere.

Weights: start 40–100, middle 20–100, end 2–100. Only the end block carries the rare tail
(2–8 = the one-in-a-season moments), which matches the Legend.

### Key grammar

- Bare letter (`A`) = base piece, fits any branch in its family.
- Letter+number (`A3`) = branch-specific; all numbered pieces in a chain must agree.
- Multi-key: **exactly one exists in the whole workbook** — end piece `A1/A3`, which fits either.
- Chains never cross families.

Reachability was checked for all 45 roles: every role has at least one chain where *every* piece
lists that role (the spec's preferred case). Range 33 (`CMPLM`) to 335 (`RWDRB`/`LWDRB`).
Families openable per role: 2–10. **No role is starved**, so the strict "every piece includes an
attending client" rule is viable as the default and the looser connective-text rule is a fallback
we may not need.

Goalkeeper starts are confined to families `O,P,Q,R,W,X` (3 GK codes only).

### Penalty families

- **N** = a client takes a penalty (17 outfield codes on the start pieces).
- **X** = a client keeper faces one (3 GK codes).

Both have full start/middle/end coverage.

### Placeholders

The literal strings to replace are the **whole token including the parenthetical**, not the bare
two letters:

| Token | Count | Replace with |
|---|---|---|
| `XY` | 148 | featured client's name |
| `yx (opposition team)` | 27 | opposing team name |
| `xy (player's team)` | 6 | client's team name |

### Who does XY refer to? — RESOLVED

**XY always names the piece's OWN player**: S in a start piece, M in a middle, E in an end.

This falls straight out of the data. XY appears in 88/89 starts but only 4/84 middles and 52/247
ends — a chain narrates one continuous action, and later pieces mostly say "he". So:

- a piece **containing XY** must bind to a client whose role code it lists;
- a piece **without XY** is connective — its actor is simply the previous piece's player.

Exactly one cell contradicted this. The `A1` middles are cut-backs ("he rolls it back gently to the
top of the box, where a teammate is arriving unmarked"), so the end's actor is a *different* player,
and the family carries two variants for it:

| End piece (A1) | Tags | Written for |
|---|---|---|
| "…Gooaaaal! … Sublime finish, and cleverly created by XY." | ~~`GOAL:E; ASSIST:M`~~ → `GOAL:T; ASSIST:E` | the finisher is **not** a client — so he goes unnamed and the commentary credits the creator |
| "where XY hits it first time on the half-volley… Goooal!" | `GOAL:E; ASSIST:M` | the finisher **is** a second client — both get named |
| "…Ooof! … XY will be disappointed that his teammate didn't manage to finish that." | (none) | creator named, no tags to reconcile — already consistent |

The first was tagged as though XY were the scorer, which is the opposite of what it reads as.
`GOAL:T; ASSIST:E` (a form the workbook already uses) says what the sentence actually means: an
unnamed team-mate scores, the client gets the assist. It is corrected at import time by `TAG_FIXES`
in `scripts/parse-live-sim-xlsx.mjs`, which throws if the cell stops matching, so it cannot rot.
**Fix the cell in the sheet and that entry can be deleted.**

Consequence for the engine: when an end piece has XY *and* its tags name two different refs
(`GOAL:E; ASSIST:M`), E should bind to a **different** client from M where one is available; with
only one client in the match it falls back to the same player and the self-assist is suppressed.

### Result tags (column AD)

86 of 247 end pieces carry tags; the rest are goalless outcomes with nothing to report.
Tags seen: `GOAL ASSIST OG YC Y2C RC PENWON PENCONC PENSAVE PENMISS`. Refs seen: `S M E O T`.

Most common combinations: `GOAL:E` (24), `GOAL:E; ASSIST:M` (18), `GOAL:E; ASSIST:S` (9),
`GOAL:O` (7). Also present and worth handling explicitly: `GOAL:T; ASSIST:E` (a client assists an
unnamed team-mate), `PENWON:T`, `OG:E`, `Y2C:E`, `PENMISS:E; PENSAVE:O`.

Row 3 of column AD is the header `"END RESULT"` — skip it (data starts at row 4).

## Engine integration points

- `League.playMatch(homeId, awayId, compId, homeAdv)` (js/league.js) is the single choke point:
  it draws `hg`/`ag` from `scoreGoals`, calls `assignStats` for **both** clubs, and returns
  `{hg, ag, winner}`. Every competition routes through it.
- `League.assignStats(clubId, compId, scored, conceded)` picks the XI, distributes goals/assists
  by position × ability × style bias, applies cards and ratings, and (since the form work) pushes
  each appearance onto the player's rolling `_recent` window. **An attended match must feed this
  same window or a client's form silently drifts.**
- Domestic cup final: `League.playCupTie(h, a, compId, isFinal=true)` — single match; if level
  after 90 it goes **straight to `_penScore()`**, there is no extra time anywhere in the engine.
- European final: `Europe._playFinal(ed, comp)` — single match, neutral venue (`homeAdv=false`).
- Promotion play-off final: `League._twoLeggedTie(a, b, 'PO')` — **two legs**, not one match.
