# Feature: "Attend the Final" — live-simmed showpiece matches

Explore the codebase first to understand the existing architecture before writing any code. This is a vanilla JavaScript football agent management game (engine modules separated from a mobile-first UI layer, dark/mint design system, IndexedDB persistence, Android via Capacitor). Reuse existing systems wherever possible: match result simulation, season/cup processing, popup/modal patterns, and the design tokens. Do not introduce frameworks.

## Concept

I am a football agent. My clients are the ONLY named players in the entire game world. Opponents and teammates do not exist as entities and must never be named or generated. At season climaxes, a client's club invites me to attend the match in person. If I accept, I watch the match unfold in a new live-sim view instead of it being resolved by the normal quick sim.

## 1. Invitation trigger

At the appropriate point in season processing, BEFORE the match is simulated, check whether any of these is about to be played with at least one of my clients in the squad:

1. A domestic cup final
2. A European cup final
3. A promotion playoff final
4. A last-matchday league game where a client's team can still clinch the title

If so, show a popup (use the existing modal pattern): the club invites me to attend, naming the client(s), the competition, and the fixture (e.g. "FC Basel have reserved a seat for you: watch Luca Meier in the Cup Final against FC Zürich"). Two options: Attend / Decline. Decline resolves the match through the normal quick sim, no other consequences. If several qualifying matches occur on the same processing step, queue the popups one at a time. If multiple clients are involved in the same match (same team or opposite teams), one invitation covers them all and the live sim features all of them.

## 2. Live-sim view layout

A new full-screen view, consistent with the dark/mint design system:

- **Top third — scoreboard.** Competition name, both team names, current score, a running match clock (0'–90'+, injury time supported), and speed controls: pause, 1x, 2x, 4x, and "skip to full time". At 1x a match should take roughly 3–4 real minutes.
- **Bottom two thirds — feed and stats**, as tabs or stacked sections (choose what fits the existing mobile UI conventions):
  - **Event feed:** chronological ticker of match events with minute stamps. Generic events name only teams, never players ("GOAL — FC Zürich", "Yellow card — FC Basel", "Substitution — FC Zürich"). Client events are the exception (see §3) and should be visually distinct (highlight card, client name in accent color).
  - **Match stats:** possession, shots, shots on target, corners, fouls, cards. These drift plausibly over the course of the match rather than jumping at the end.
  - **Client panel:** one card per attending client: name, role, live match stats (goals, assists, shots, cards, plus role-appropriate counters) and a live match rating from 1.0–10.0 that starts around 6.0–6.5 and moves with their events and the flow of the game.

After the final whistle: a full-time summary (result, client ratings, their event highlights, trophy celebration if won), then return to the normal game flow.

## 3. Client puzzle events — the data

The commentary events for clients are data-driven from an Excel workbook (`live_sim_events_v3.xlsx`, in the repo / I will place it in the project). Write a one-off Node import script that converts it to a JSON asset bundled with the game; the runtime must read the JSON, never the xlsx.

**Sheet1** maps positions to roles and role codes (e.g. poacher = STPOA, sweeper_keeper = GKSWK). Every client has one role code.

**Sheet2** holds the event pieces in three independent column blocks, data starting at row 4:

| Block  | Key | Text | Role codes | Extra |
|--------|-----|------|-----------|-------|
| Start  | A   | B    | I         | AB = pick weight |
| Middle | J   | K    | R         | AC = pick weight |
| End    | S   | T    | AA        | AD = result tags, AE = pick weight |

**Sheet "Legend"** documents the result tags and weight semantics; read it and honor it.

Rules encoded in the data:

- **Chain assembly:** an event is a chain of start → middle → end, optionally start → middle → middle → end (max two middles; use a second middle only occasionally, ~15% of chains, and only when both middles share the same branch number). Pieces chain only within the same key letter (the "family"). A bare letter is a base piece and fits anything in its family; a letter+number (e.g. A3) is branch-specific: all numbered pieces in one chain must agree on the number. Multi-keys like `A1/A3` fit either branch. Valid: A→A1→A, A→A1→A1. Invalid: A→A1→A2.
- **Eligibility:** a piece can feature a client only if the client's role code is in its code list. The client must appear in the START piece for the chain to trigger for them; later pieces may feature a different client if one is eligible and in the same match, otherwise the same client continues through the chain (pieces whose codes don't include any present client are still usable as connective text ONLY if the piece's actor is the same player continuing the action — when in doubt, prefer chains where every piece's codes include an attending client).
- **Weights (columns AB/AC/AE):** relative pick weights among eligible pieces at each step. 100 = standard, single digits = outrageous rarities (overhead kicks, panenkas, taunting). Respect them; the rare stuff should feel rare.
- **Placeholders in the text:** `XY` → the featured client's name; `xy (player's team)` → the client's team name; `yx (opposition team)` → the opposing team name.
- **Result tags (column AD):** semicolon-separated `TAG:REF` entries on end pieces, e.g. `GOAL:E; ASSIST:M`. Tags: GOAL, ASSIST, OG, YC, Y2C, RC, PENWON, PENCONC, PENSAVE, PENMISS. References: S/M/E = the player featured in that piece of this chain; O = an opposition player; T = a teammate. **Because opponents and teammates do not exist: O and T never produce a name.** They resolve to anonymous phrasing in the feed ("Yellow card — FC Zürich", "an opposing defender is sent off") and to team-level stat changes only. If S/M/E all resolved to the same client, suppress the self-assist.

## 4. Simulation consistency — hard invariants

- The final result of an attended match must feed back into season processing (trophies, promotion, title, client career stats, and any downstream systems) exactly as a quick-simmed result would. Inspect how the quick sim hands results over and use the same path.
- Everything shown must be internally consistent: if a client event ends with `GOAL:E`, the scoreboard, the feed, the match stats, the client's stats, and the stored result all reflect that goal by that client at that minute. Same for cards (a Y2C or RC client plays no further events), own goals (credited to the other team's score), and penalties (PENWON/PENCONC spawn a penalty resolution; the workbook's N family covers a client taking one and the X family a client keeper facing one — use them when the involved player is a client, otherwise resolve it generically).
- Choose the integration architecture yourself after reading the existing sim code, but state the choice in a short comment: either (a) minute-by-minute simulation that produces the result live, or (b) pre-compute the result with the existing engine and choreograph a timeline that matches it. Whichever you pick, the invariants above are non-negotiable.
- 3–9 client puzzle events per match in total (scale within that range with the number of attending clients), spread across the 90 minutes, never two in the same minute. Do not repeat an identical chain within one match; deprioritize pieces already used.

## 5. Quality bar

- Engine logic (chain builder, weighting, tag resolution, timeline) lives in the engine layer with no DOM access; the view layer only renders. Unit-testable pure functions for: key compatibility, chain assembly, weighted selection, tag parsing/resolution.
- Write tests for the chain rules (base/numbered/multi-key cases from §3) and for tag resolution including O/T anonymization and self-assist suppression.
- Persist mid-match state well enough that closing the app during a live sim doesn't corrupt the season (simplest acceptable: on interruption, resolve the match via quick sim).
- Performance: the JSON asset loads once; no per-tick allocations that would jank a mid-range Android phone.
- Match the existing dark/mint design tokens; no new colors or fonts.

## Acceptance checklist

1. Popup appears before cup finals, European finals, promotion playoff finals, and last-day title deciders involving a client; never otherwise; decline = normal sim.
2. Live view shows score, running clock, speed controls (pause/1x/2x/4x/skip), team stats, client stats and live rating.
3. Only clients are ever named anywhere in the feature. Multiple clients, including on opposite teams, all appear.
4. 3–9 puzzle events per match, chains obey the key rules, weights respected, placeholders replaced, rare pieces demonstrably rarer.
5. Result tags drive scoreboard/stats/report consistently; O/T stay anonymous.
6. The attended match's result flows into the season exactly like a quick-simmed one.
