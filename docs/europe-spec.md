# Implement the European club competitions (UCL / UEL / UECL)

## Context

I'm attaching `uefa_access_list.xlsx` — three sheets (`UCL`, `UEL`, `UECL`). It is the **single source of truth** for who enters which competition, at which stage, and in which game week. Read it directly (openpyxl / SheetJS) rather than re-typing it, then commit the parsed result as a checked-in config module (e.g. `src/data/europe.js`) so the game never needs the spreadsheet at runtime.

Nine countries are fully implemented in the game with real league structures: **England, Spain, Italy, Germany, France, Netherlands, Portugal, Belgium, Switzerland**. Everything else (associations ranked 10–55 in the sheets) is *not* implemented — those countries have no simulated league, only a pool of clubs listed in the spreadsheet. Potentially some (Türkiye, Sweden) will be added to the game later on, make sure that that would be fairly easy to do. 

---

## 1. How teams get into the competitions

### 1a. Implemented countries (the nine)

Entrants are determined **purely by the final league table and domestic cup result of the season that just ended**. No randomness. The mapping is in rows 5–13 of each sheet, column D:

| Country | UCL | UEL | UECL |
|---|---|---|---|
| England | 1st–5th | 6th + FA Cup winner | 7th |
| Spain | 1st–5th | 6th + Copa del Rey winner | 7th |
| Italy | 1st–4th | 5th + Coppa Italia winner | 6th |
| Germany | 1st–4th | 5th + DFB-Pokal winner | 6th |
| France | 1st–3rd | 4th + Coupe de France winner | 5th |
| Netherlands | 1st–2nd | 3rd + KNVB Beker winner | 5th |
| Portugal | 1st–2nd | 3rd + Taça de Portugal winner | 5th |
| Belgium | 1st (champion) | Cup winner | 4th |
| Switzerland | 1st (champion) | Cup winner | 4th |

Plus these four go into **qualifying**, not straight into a league phase:
- Netherlands 3rd, Portugal 3rd, Belgium 2nd, Switzerland 2nd → **UCL qualifying, round 5, seeded**
- Netherlands 4th, Portugal 4th, Belgium 3rd, Switzerland 3rd → **UEL qualifying, round 5, seeded**

**Cup-winner overflow rule** (from the note in `UEL!G5:G6`): if a domestic cup winner has *already* qualified through its league position, the European place it would have taken **drops down one league place**. Example: Bayern win the Bundesliga and the DFB-Pokal → the UEL berths go to Bundesliga 5th *and* 6th, and the UECL berth goes to 7th. Implement this as a general cascade, not a special case, and apply it consistently in every implemented country.

### 1b. Non-implemented countries (associations 10–55)

For each of these, the spreadsheet gives (column D, rows 22–67 of the UCL sheet — the same club pools repeat on all three sheets):

- a pool of clubs,
- each with a **reputation** value,
- each with a **likelihood** — the probability that club finishes **1st** in its domestic league that season.

**Every season, run this for each non-implemented country:**

1. Take the club pool with its weights.
2. Draw a **weighted random ordering without replacement** (weighted sampling / Efraimidis–Spirakis, or repeated roulette-wheel draws removing the picked club each time). Weights = the listed likelihoods.
3. That ordering **is** the simulated final league table: index 0 = champion, index 1 = runner-up, index 2 = 3rd, etc.
4. Separately, draw a **domestic cup winner** from the same pool using the same weights, but flattened — cups are more random. Use `weight^0.5` renormalised, so favourites still win more often but upsets are common. The cup winner is drawn independently of the league order.
5. Cache the result for the season so every competition reads the same table.

Reputation is **static** (from the spreadsheet) and is used for pot seeding and match simulation. Likelihood is **only** used for the draw above.

### 1c. Entry rules for non-implemented countries

Column **C, rows 22–67** on each of the three sheets tells you exactly which finishing position from that simulated table enters which competition and at which round, and whether it is seeded. Parse this literally. Examples:

- `UCL!C22` (Türkiye): "1st place seeded in round 5, 2nd in round 3"
- `UEL!C22` (Türkiye): "Cupwinner seeded in round 5, 3rd place seeded in round 3"
- `UECL!C23` (Türkiye): "4th place seeded in round 4, 5th place in round 1"
- `UCL!C49` (Finland): "1st in round 1" (unseeded)
- `UCL!C53` (Liechtenstein): no national league — Liechtenstein enters **only** the UEL, via its cup winner (`UEL!C53`).

Because these strings are free text, **parse them into a structured config once**, then have a human-readable JSON/JS table in the repo (`{ association, competition, sourceSlot: 'league:1'|'league:3'|'cup', entryRound: 5, seeded: true }`). Do not re-parse strings at runtime.

---

## 2. Qualifying structure

Every qualifying tie is **two legs**, home-and-away, aggregate score, away goals **not** used, extra time then penalties if level. Winner advances, loser is eliminated or drops down (see below).

The round-by-round entry tables are in columns **H–M** of each sheet. Reproduce them exactly:

### UCL qualifying — game weeks 1–5, 5 rounds
| Week | Round | Unseeded in | Seeded in | Winners |
|---|---|---|---|---|
| 1 | R1 | 18 (champions of assoc. 37–55, excl. Liechtenstein) | — | 9 |
| 2 | R2 | 9 winners | 9 (champions of Iceland–Kazakhstan, ranks 28–36) | 9 |
| 3 | R3 | 9 winners | 9 (2nd of Türkiye–Denmark ranks 10–14, + champions of Slovenia–Bulgaria ranks 24–27) | 9 |
| 4 | R4 | 9 winners | 9 (champions of Norway–Ukraine, ranks 15–23) | 9 |
| 5 | R5 | 9 winners | 9 (NL 3rd, PT 3rd, BE 2nd, CH 2nd + champions of Türkiye–Denmark ranks 10–14) | 9 |

The **9 R5 winners enter the UCL league phase**. The **9 R5 losers drop into the UEL league phase**.
The **9 R3 losers drop into UECL qualifying round 2** (seeded). The **9 R4 losers drop into UEL qualifying round 4** (seeded). Losers of R1 and R2 are eliminated.

### UEL qualifying — game weeks 2–6, 5 rounds
| Week | Round | Unseeded in | Seeded in | Winners |
|---|---|---|---|---|
| 2 | R1 | 22 (runners-up of Bosnia–San Marino, ranks 34–55, + Liechtenstein cup winner) | — | 11 |
| 3 | R2 | 11 winners | 11 (2nd of Ukraine–Armenia, ranks 23–33) | 11 |
| 4 | R3 | 11 winners | 11 (2nd of Sweden–Croatia ranks 19–22, + 3rd of Türkiye–Cyprus ranks 10–16) | 11 |
| 5 | R4 | 11 winners | 11 (9 losers of UCL qualifying R4, + 2nd of Hungary & Scotland ranks 17–18) | 11 |
| 6 | R5 | 11 winners | 11 (NL 4th, PT 4th, BE 3rd, CH 3rd + cup winners of Türkiye–Cyprus ranks 10–16) | 11 |

The **11 R5 winners enter the UEL league phase**. The **11 R5 losers drop into the UECL league phase**.
The **11 R3 losers drop into UECL qualifying round 3** (seeded). The **11 R4 losers drop into UECL qualifying round 4** (seeded). Losers of R1 and R2 are eliminated.

### UECL qualifying — game weeks 3–6, 4 rounds
| Week | Round | Unseeded in | Seeded in | Winners |
|---|---|---|---|---|
| 3 | R1 | 32 (5th of Türkiye–Poland ranks 10–13, + 3rd of Bulgaria–San Marino ranks 27–55, excl. Liechtenstein) | — | 16 |
| 4 | R2 | 16 winners | 16 (9 losers of UCL qualifying R3, + 3rd of Austria–Slovakia ranks 20–26) | 16 |
| 5 | R3 | 16 winners | 16 (11 losers of UEL qualifying R3, + 4th of Norway/Cyprus and 3rd of Hungary/Scotland/Sweden, ranks 15–19) | 16 |
| 6 | R4 | 16 winners | 16 (11 losers of UEL qualifying R4, + 4th of Türkiye–Denmark, ranks 10–14) | 16 |

The **16 R4 winners enter the UECL league phase**. All UECL qualifying losers are eliminated.

**Seeding within a round:** seeded teams are drawn against unseeded teams only. Seeded teams play the second leg at home. If a round is ever short a team (e.g. a country's entrant is missing), give a bye to the highest-reputation seed and log a warning — do **not** silently drop a tie.

### Resulting league-phase composition (validate this — each must be exactly 36)
- **UCL**: 27 direct + 9 qualifying winners = 36
- **UEL**: 16 direct + 9 UCL R5 losers + 11 qualifying winners = 36
- **UECL**: 9 direct + 11 UEL R5 losers + 16 qualifying winners = 36

Add an assertion that fails loudly if any competition ≠ 36 teams, and that no club appears in two competitions in the same season.

---

## 3. League phase format — NOT in the spreadsheet, implement as specified here

All three competitions use the **identical** format.

**Pots (replaces UEFA's coefficient seeding entirely):**
1. Take the 36 qualified teams and sort by **reputation**, descending.
2. Pot 1 = the top 9, Pot 2 = the next 9, Pot 3 = the next 9, Pot 4 = the bottom 9.
3. **Constraint: at most 3 teams from the same league/division in any single pot.** This stops Pot 1 becoming five Premier League clubs.
   - Enforce it with a repair pass: after the reputation sort, walk pots 1→4. If a pot holds 4+ teams from one division, take the **lowest-reputation** offending team in that pot and swap it with the **highest-reputation** team in the next pot down that (a) is from a different division and (b) whose removal doesn't break that pot's constraint. Repeat until every pot is legal.
   - If no legal swap exists (pathological case), relax to 4 for that pot and log it. Don't infinite-loop.

**Draw:**
- Each team plays **8 matches**: **2 opponents from each pot** (2 × 4 pots), **one home and one away against each pot**. So 4 home, 4 away.
- **No two clubs from the same association may meet** in the league phase.
- A team can face **at most 2 clubs from any one other association**.
- Use a constrained random draw with backtracking (or a simple retry-until-valid loop with a cap of ~1000 attempts, then restart the whole draw).

**Table:** one single 36-team league table. 3 points for a win, 1 for a draw. Tiebreakers in order: points → goal difference → goals scored → goals scored away → wins → away wins → reputation.

**Qualification from the league phase:**
- **1st–8th** → straight to the Round of 16.
- **9th–24th** → knockout play-off round (two legs). 9th–16th are seeded, 17th–24th unseeded; seeds play the second leg at home.
- **25th–36th** → eliminated from Europe entirely (no drop-down between competitions after the league phase).

**Bracket:** after the play-off round, the 8 play-off winners join the top 8. Seed the R16 so that league-phase 1st–8th are drawn against play-off winners, with higher league-phase finishers getting home advantage in the second leg. Fix the bracket after the R16 draw so the path to the final is known.

---

## 4. Calendar (game weeks)

| Stage | Week(s) |
|---|---|
| Qualifying R1 | 1 (UCL), 2 (UEL), 3 (UECL) |
| Qualifying R2 | 2 / 3 / 4 |
| Qualifying R3 | 3 / 4 / 5 |
| Qualifying R4 | 4 / 5 / 6 |
| Qualifying R5 | 5 (UCL), 6 (UEL) — UECL has no R5 |
| League phase MD1–MD8 | **11, 16, 17, 19, 22, 24, 29, 31** |
| Knockout play-off (2 legs) | **34 & 35** |
| Round of 16 (2 legs) | **37 & 38** |
| Quarter-finals (2 legs) | **41 & 42** |
| Semi-finals (2 legs) | **44 & 45** |
| Final (single match, neutral venue) | **48** |

Both legs of a two-legged qualifying round happen inside the same game week (a midweek/second fixture slot), since each round occupies only one week. If the engine can't schedule two fixtures in one week, resolve the tie as a single aggregate simulation over two simulated legs and record both results.

Draws for each stage should resolve **before** the first fixture of that stage, so the player can see their bracket.

---

## 5. UI: league table highlighting

In the **top division of each of the nine implemented countries**, colour the league table rows by the European place that finishing position earns. Use a legend below the table.

| Meaning | Colour |
|---|---|
| **Champion (1st place)** | **dark green** — this is its own distinct, darkest shade |
| Other direct UCL league-phase place | medium green |
| UCL qualifying place (NL/PT 3rd, BE/CH 2nd) | light green |
| Direct UEL league-phase place | blue |
| UEL qualifying place (NL/PT 4th, BE/CH 3rd) | blue |
| Direct UECL league-phase place | light blue |
| Relegation places | existing red (unchanged) |

Suggested hexes (adjust to the existing palette): dark green `#14532D`, medium green `#16A34A`, light green `#86EFAC`, blue `#2563EB`, light blue `#93C5FD`, orange `#EA580C`. Ensure text contrast stays readable on the dark green row. Place a info key on the page of the table view with the colours explained.

The mapping must be **derived from the same config** that drives qualification (section 1a), not hardcoded per country twice — if I change Italy's UCL allocation, the highlighting must change with it. The cup-winner overflow rule means a row's colour can shift after the cup final; recompute the highlighting at that point rather than freezing it at the start of the season.

---

## 6. Deliverables

1. `src/data/europe.js` (or equivalent) — parsed config: association ranks, club pools with reputation + likelihood, entry-slot rules, round tables, calendar. Generated from the xlsx by a one-off script that you also commit (`scripts/parse-uefa-xlsx.mjs`) so it can be re-run when I edit the sheet.
2. Season engine: simulate non-implemented leagues + cups, build entry lists, run qualifying, build pots, run the draw, play the league phase, run the knockouts.
3. UI: competition tables/brackets, and the domestic-league highlighting from section 5.
4. Validation assertions (36 per competition, no duplicate clubs, pot constraint respected, every team plays exactly 8 league-phase matches with 4 home / 4 away).
5. A short `docs/europe.md` explaining the model, so I can tweak it later.

Keep it vanilla JS, consistent with the existing codebase. Don't add dependencies for the runtime; the xlsx parser is build-time only.

---
