# International football

National-team football for UEFA's 54 nations, plus placeholder pools for the rest of the world at
the World Cup. It starts in **2026-27** (after the 2026 World Cup); earlier seasons have none.

| File | What |
|---|---|
| `js/nations.js` | The 114 national teams: 54 UEFA + non-UEFA pools |
| `js/intl-config.js` | **Every number**: weeks, slots, allocations, hosts, pairings |
| `js/internationals.js` | The engine (`Internationals`) |
| `ui/js/screen-intl.js` | Competitions > International (read-only) |
| `tests/test_internationals.js`, `tests/test_intl_screen.js` | 22 seasons in strict mode, every host scenario, saves, the screen |

The calendar weeks around it are in `docs/international-football-spec.md`.

## Nations (`js/nations.js`)

Each nation has an `id` (stable, stored in saves), `name`, `nationality` (the player-nationality
string the team will pick from once call-ups exist; `null` where the game has no such players yet),
`confederation` and `reputation` (0–100, the club scale).

- **UEFA reputations are unique**, so the seeding ranking never needs a tie-break. Editing one may
  move a nation between Nations League leagues in a *new* game; existing saves keep their leagues.
- **`weight`** (non-UEFA only) is the chance of being drawn as a World Cup qualifier:
  `Math.exp((reputation - 60) / NATION_WEIGHT_SPREAD)`, stored per nation so it can be edited.
  `NATION_WEIGHT_SPREAD = 5`; raise it for more upsets. The weights lose their meaning once the other
  confederations get real qualifiers.
- Names follow the official spellings: Türkiye, Czechia, Republic of Ireland, Bosnia and
  Herzegovina, DR Congo. Player nationalities were renamed to match (save migration 8).

## The season cycle

`Internationals.seasonType(startYear)`: even start year = Nations League; odd = qualifiers, for a
EURO when `(startYear + 1) % 4 === 0`, otherwise a World Cup. The tournament is played at the end
of that season (weeks 49–52) and finishes in weeks 1–2 of the next; **it belongs to the season it
started in**. EURO size: 24 teams up to 2028, 32 from `EURO_32_FROM` (2032).

A week has two match slots, A and B; a team plays at most once per slot.

## State (`GameState.intl`, saved with the game)

| Field | What |
|---|---|
| `seeding` | 54 UEFA ids in seeding order: Nations League pots, qualifier leagues |
| `nlLeagues` | Nations League membership (A/B/C, 18 each) for the next edition |
| `hosts` | Hosts drawn so far (awarded hosts live in the config) |
| `seasons` | The current season and the previous one only (older ones are pruned) |
| `honours` | Roll of honour: NL / EURO / WC, with the final |
| `last` | The last week processed |
| `warnings` | The last 30 failed assertions (normally empty) |

About 18 KB for a full qualifying + EURO season.

**Catch-up.** `Internationals.sync()` runs every week from `Simulation.advanceWeek`, and processes
every week between `last` and now. That one mechanism covers a new game, a save from before this
feature (the migration calls it silently), and a save from 2025-26 (it starts at the rollover).
Weeks caught up never send a notification, and a previous season's competitions are never built.

**Safety.** Nothing in the engine can cost the player a week: the weekly call is wrapped, and a
failed assertion is logged and kept in `warnings`. Only `Internationals.STRICT = true` (the tests)
turns assertions into errors.

## Matches

Strength = reputation. Goals come from the club engine's `League.scoreGoals`; home advantage is
`HOME_ADVANTAGE` (6). A knockout level after 90 minutes plays extra time (same model as club cup
finals) then penalties. Two-legged ties: aggregate, no away goals, extra time and penalties in leg 2.

Tiebreakers: round-robin groups use points, head-to-head points, head-to-head GD, GD, GF, wins,
reputation. League 1 (not everyone meets): points, GD, GF, away goals, wins, reputation. Across
groups: points, GD, GF, wins, reputation.

The Home week card shows **International break** in `BREAK_WEEKS` (11–12, 17–18, 36–37), like it
shows the open transfer window; not in the summer tournament window.

`Internationals.onInternationalMatch(fixture)` is called once per match. It does nothing yet:
it is the hook for call-ups.

## Nations League (even start years)

Three leagues of 18 (3 groups of 6, 2 per pot), fixtures from the group-of-6 template, matchdays in
weeks 11A, 11B, 12A, 12B, 17, 18. Week 19 draws:
- **Quarter-finals** (League A): 3 winners, 3 runners-up, 2 best thirds, seeded 1–8 by group position
  then record; 1v8, 2v7, 3v6, 4v5; a same-group pairing swaps its lower seed with the next pairing's.
- **Promotion/relegation play-offs**: the upper league's 5th-placed v the lower league's runners-up,
  best upper v worst lower, avoiding last edition's pairings where possible.

Weeks 36–37: all two-legged ties (the higher seed / upper-league team hosts leg 2). Week 38: the
Finals host (best-seeded of the four) and the semi-final draw. Week 49: semis in slot A, third place
and final in slot B; the host has home advantage in its own matches only. Afterwards promotion,
relegation and the new seeding ranking (section 3.6 of the plan).

## European Qualifiers (odd start years)

League 1 = seeding ranks 1–36 (3 groups of 12, template from the plan), League 2 = 37–54 (3 groups
of 6). Hosts are spread over the groups as evenly as possible: **EURO 2028 has 4 hosts for 3
groups, so two of them share a group** (the plan's "separate groups" is impossible there).
`PROHIBITED_PAIRS` are never drawn together. Draws use randomised backtracking with restarts.

Week 18: qualification read off the tables (hosts skipped where they qualify automatically):

| Tournament | Direct | Play-off paths P |
|---|---|---|
| World Cup | top 4 non-host per League 1 group | 4 − UEFA hosts |
| EURO 2028 | top 6 per group + 2 best 7th; then up to 2 hosts that missed out take reserved places | 4 − reserved places used |
| EURO 2032+ | top 9 non-host per group + (3 − H) best 10th | 2 |

Play-off paths: 3 League 1 teams (the best 3P not qualified) and 1 League 2 team (group winners,
plus the best runner-up when P = 4) per path; semis week 36 (pot 1 v 4, pot 2 v 3), final week 37.

**Seeding after qualifiers** (`QUALIFIERS_RESEED`, a decision of mine): the plan says hosts' results
"count for the next seeding ranking", but only the Nations League rebuilds the ranking. So after the
qualifiers the ranking is re-ordered *within* each Nations League league by qualifier results;
league membership only ever changes through Nations League promotion/relegation. Set it to `false`
to keep the Nations League order untouched.

**World Cup, other confederations** (week 18): `WC_DIRECT` places per confederation, hosts deducted
from their own, drawn weighted without replacement (Efraimidis–Spirakis); the next draws are the
inter-confederation play-off entrants (`WC_IC_ENTRANTS`). The 2 strongest go straight to the two
finals; the other 4 play semis in week 36; finals week 37; neutral venue.

## Tournaments (draw week 38, played weeks 49–2)

4 pots by reputation, hosts first in pot 1 and in position 1 of their own groups. World Cup: at most
2 UEFA teams and 1 from each other confederation per group. Brackets exactly as in the plan
(sections 6 and 7); best third-placed teams are placed by randomised bipartite matching. Hosts get
home advantage in all their matches, except those listed in `md1Only` (WC 2030's South American
openers: matchday 1 only).

## Hosts

`HOSTS` has the awarded ones (EURO 2028, WC 2030, EURO 2032, WC 2034). From EURO 2036 / WC 2038
hosts are drawn in week 1 of the season before the qualifying season, from `HOST_POTS` (1–2 hosts,
`HOSTS_PER_TOURNAMENT`, at most `MAX_UEFA_HOSTS_WC` UEFA hosts at a World Cup). Until the pots are
filled: one host, weighted by reputation, from UEFA (EURO) or everyone (World Cup).

## Names

Shipped names are generic: Nations Series, European Qualifying, European Nations Cup, World Nations
Cup (`COMPETITIONS.INTL_*` in `js/league.js`). The real-names pack (`real-club-names.json`) restores
Nations League, European Qualifiers, EURO and World Cup.
