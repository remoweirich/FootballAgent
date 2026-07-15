# European club competitions (UCL / UEL / UECL)

This is the model behind the three UEFA competitions. The full original brief is in
[`docs/europe-spec.md`](europe-spec.md); this file explains how it was implemented and how to tweak it.

## Files

| File | Role |
|---|---|
| `uefa_access_list.xlsx` | **Source of truth.** Three sheets (UCL/UEL/UECL): association ranks, club pools (reputation + likelihood), and the per-slot entry rules. |
| `scripts/parse-uefa-xlsx.mjs` | Build-time parser (zero dependencies — reads the xlsx zip with `node:zlib`). Regenerates the config. Run `node scripts/parse-uefa-xlsx.mjs`. |
| `js/europe-data.js` | **Generated** config. Do not edit by hand. |
| `js/europe.js` | The engine: `Europe` object + the `EUROPE_VIRTUAL_MAP` of pooled clubs. |
| `ui/js/screen-leagues.js` | The **Europe** tab (3 competitions) and the domestic top-division highlighting. |

The nine leagues with a real structure in the game — **England, Spain, Italy, Germany, France,
Netherlands, Portugal, Belgium, Switzerland** — are the *implemented* associations. Associations
ranked 10–55 are *pooled*: they have no simulated league, only a list of clubs (each with a
reputation and a likelihood of winning its league) that exist as **virtual clubs** (`eu:<country>:<club>`
ids) resolved through `findVirtualClub`, so all the normal match machinery works on them.

> **The spreadsheet overrides the brief where they disagree.** The brief's §1a summary text is wrong
> for the Netherlands/Portugal in a couple of places; the sheet (and this implementation) use: NL/PT —
> UCL direct 1st–2nd, UCL-qualifying (R5 seeded) 3rd, UEL direct 4th + cup, UEL-qualifying (R5 seeded)
> **5th**, UECL direct 6th. Belgium/Switzerland — UCL direct champion, UCL-qualifying 2nd, UEL direct =
> cup winner only, UEL-qualifying 3rd, UECL direct 4th.

## Entrants

Determined purely from the season that just ended — no randomness for the nine implemented countries.

- **Implemented** (`EUROPE_DATA.implemented`): each country has an ordered `slots` ladder tagged
  `U` (UCL league phase), `UCLq` (UCL qualifying R5 seeded), `UEL`/`UELcup` (UEL league phase),
  `UELq` (UEL qualifying R5 seeded), `UECL` (UECL league phase). The domestic cup winner takes the
  `UELcup` slot as an extra berth.
  - **Cup-overflow cascade:** if the cup winner already qualified through its league position, its UEL
    berth "drops down one place" — the country instead fields its top-*n* finishers shifted one tier
    down (`_tierMap` in `js/europe.js`). This is a general cascade, not a per-country special case.
- **Pooled** (`EUROPE_DATA.pools`): every season each pooled league is drawn as a weighted random
  ordering without replacement (Efraimidis–Spirakis, weight = likelihood); the cup winner is a
  separate weighted draw with `likelihood^0.5` (flatter — upsets are common). Each entry rule maps a
  finishing slot (or the cup) to a competition + qualifying round.

Reputation (implemented clubs use `club.reputation` 42–90; pooled clubs use the sheet value 42–81) is
used for **pot seeding and match simulation**; likelihood is used **only** for the draw above.

Liechtenstein has no league in the sheet; its UEL cup-winner berth is the **actual winner of the
Liechtensteiner Cup** (`GameState.league.lichcup`, played in the Swiss cups) — captured at rollover
and passed through as `cupWinners.Liechtenstein`, so it's whoever really won (usually **FC Vaduz** or
**USV Eschen/Mauren**, both real clubs in the Swiss league system, flagged `real: true` so
`EUROPE_VIRTUAL_MAP` never shadows them). If a pooled country ever has a real in-game cup result it is
used instead of a weighted draw.

## Qualifying

A single week-driven state machine (`Europe.step`) across weeks 1–6, defined by `EUROPE_DATA.qualifying`.
Every tie is two legs, aggregate, penalties if level (both legs resolve inside the round's one week).
A fresh entrant at round ≥ 2 is a **seed** (drawn against a previous-round winner); round 1 is all
unseeded, paired among themselves. Losers either drop into a specific round of a lower competition (as
seeds) or are eliminated:

- UCL R3 losers → UECL Q R2; R4 losers → UEL Q R4; R5 losers → UEL league phase.
- UEL R3 losers → UECL Q R3; R4 losers → UECL Q R4; R5 losers → UECL league phase.
- UECL losers are eliminated.

Resulting league phases (asserted): **UCL** 27 direct + 9 qualifiers; **UEL** 16 direct + 9 UCL-R5
losers + 11 qualifiers; **UECL** 9 direct + 11 UEL-R5 losers + 16 qualifiers = **36 each**.

## League phase (identical for all three)

- **Pots:** the 36 clubs sorted by reputation into four pots of nine, then a repair pass enforces
  **≤ 3 clubs from one association per pot** (swap the lowest offender down a pot).
- **Draw:** each club plays **8 games** — two versus a club from each pot, one home and one away
  (4 home / 4 away). No two clubs from the same association meet; at most 2 from any one other
  association. Built with a fail-first (minimum-remaining-values) randomised draw with restart.
- **Schedule:** the 144 fixtures are spread over **8 matchdays, each a perfect round** — every club
  plays exactly once per matchday, so all clubs are always on the same game count. This is an
  8-edge-colouring of the fixture graph (`_colorSchedule`, backtracking + MRV); if a draw can't be
  8-coloured it's redrawn, and the same-association rule is relaxed only if no schedulable draw exists
  with it on (in practice it never needs relaxing).
- **Table:** one 36-club table. Tie-breakers: points → GD → GF → away goals → wins → away wins →
  reputation.
- **Cut:** 1st–8th → Round of 16; 9th–24th → knockout play-off (9–16 seeded); 25th–36th eliminated.

## Knockouts

Play-off round → Round of 16 → QF → SF → Final. All two-legged except the single-match neutral
**final**; higher league-phase finishers host the second leg. Each tie is **split across its two
calendar weeks**: leg 1 (lower seed at home) in the first, leg 2 + the aggregate decision (penalties
if level) in the second — `_koLeg1` / `_koLeg2`, a round is `{ ties, winners: null-until-leg2 }`.

- **Play-off ladder** (fixed): 9th v 24th, 10th v 23rd, 11th v 22nd, … 16th v 17th; the higher seed
  hosts the second leg.
- **Round of 16:** the top 8 are seeded and the 8 play-off winners are **drawn to them at random**
  (each seed hosts the second leg). From there the bracket is fixed, so seeds 1 and 2 can only meet
  in the final.

## Calendar

Qualifying weeks 1–6 (both legs of a qualifying round inside its single week); league phase MD1–8 in
weeks 11, 16, 17, 19, 22, 24, 29, 31; play-off 34 & 35, R16 37 & 38, QF 41 & 42, SF 44 & 45,
**final 47**. (The brief lists the final in week 48, but the game crowns its season at the 47→48
boundary and weeks 48–52 are a dead off-season, so the final is pulled to 47.)

## Lifecycle wiring

- **New game** (`GameState.startNewGame`): season 1 has **no** European competitions (there's no
  finished season to seed entrants from) — the Leagues → Europe view shows a disclaimer.
  `Europe.syntheticStandings()` is kept available if we ever want to pre-populate season 1 instead.
- **Rollover** (`Simulation._rollNewSeason`): the finished tables + cup winners are captured *before*
  promotion/relegation, and the first/next edition is built *after* `setupSeason` (so competitions
  start in season 2 and every season after).
- **Weekly** (`League.simulateWeek`): `Europe.step(week)` runs every week.
- **Snapshot** (`Simulation._finishSeason`): the finished edition is kept in `lastSeasonReport.europe`.

## UI

**Europe is its own entry in the Leagues country dropdown** (ordered: home country → Europe → the
rest). Selecting it puts **UCL/UEL/UECL in the division dropdown** (default UCL) and turns the main
tab bar into the **stages**: *Qualifiers* → *Table* → *Fixtures* → *Knockout Play-offs* → *Round of
16* → … → *Final*, plus a horizontally scrollable **Bracket** (every club's path from the R16 to the
final). The *Table* marks qualification with a left-edge strip (1st–8th green = R16, 9th–24th blue =
play-off). The *Fixtures* tab shows one matchday at a time (dropdown, matchdays 1–8) with results if
played or the drawn pairing if not. The tab auto-follows the live phase (`euDefaultTab` +
`state.euAutoTab`) until you pick one manually.

The top division of each implemented country marks its rows with a **colour strip on the leading
edge** (left of the position number, like promotion/relegation) for the European place each finishing
position earns — champion darkest — with a legend, derived from the **same** `Europe.highlightMap`
config and recomputed each render. The domestic cup winner's UEL berth is **reserved** (not shown on
a league team) until the cup is decided; only when an already-qualified club wins the cup does the
"drops to the league" cascade appear (`forDisplay` in `_tierMap`; entrant-building still fills the
slot to keep the field at 36).

## Trophies & stats

The three finals award trophies via the existing `League.finishSeason` / `awardTrophy` path (run at
the 47→48 rollover, after the week-47 finals). Winning clubs get a `clubHistory` honours entry (real
clubs via the normal division loop; pooled/virtual winners recorded explicitly), and any tracked
player (client / ex-client / scouted prospect) with appearances at the winner gets the title in
`p.trophies` — surfaced in the client history view, the agency-wide Client History, and the club's
honours. Each competition has a **distinct trophy silhouette** (`europeTrophyIcon`): UCL a big-eared
cup, UEL a handleless chalice, UECL a wide shallow bowl. Per-match player stats (apps, goals, ratings)
are bucketed by competition through `assignStats(clubId, 'UCL'|'UEL'|'UECL', …)`, exactly like the
domestic leagues and cups, so European appearances show up in the usual per-competition breakdowns.

## Tweaking

- **Club pools / reputations / likelihoods / entry slots:** edit the spreadsheet, re-run the parser.
- **Berth layout of an implemented country, qualifying ladder, or calendar:** edit the `IMPLEMENTED`,
  `QUALIFYING`, or `CALENDAR` constants in `scripts/parse-uefa-xlsx.mjs`, re-run the parser.
- **Adding a country later (e.g. Türkiye, Sweden):** give it a real league in the game, then move it
  from `pools` to `implemented` with a `slots` ladder. The engine and UI need no other changes.

## Not included (by design)

The competitions are simulated, displayed, and award trophies + player stats. There is still **no
prize money** wired to European results (the brief didn't ask for it) — easy to add later, since a
club "in Europe" is queryable from the edition on `GameState.league.europe`.

## Validation

`Europe.validate(edition)` asserts each competition has exactly 36 clubs, no club appears in two
competitions, pots respect ≤ 3 per association, and every club has 8 fixtures (4 home, 2 per pot, no
same-association opponents). It's exercised by the test harnesses under the scratchpad and can be
called live (it logs into `edition.warnings`).
