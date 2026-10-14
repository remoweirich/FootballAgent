# International football

National-team football for all 218 nations: every confederation plays its own competitions and
qualifies for the World Cup through them. It starts in **2026-27** (after the 2026 World Cup); earlier seasons have none.

| File | What |
|---|---|
| `js/nations.js` | The national teams (generated from `national_team_reputations.xlsx`) |
| `js/intl-config.js` | **Every number**: weeks, slots, allocations, hosts, pairings |
| `js/internationals.js` | The engine (`Internationals`), UEFA |
| `js/intl-americas.js`, `js/intl-caf.js`, `js/intl-afc.js` | The Americas, Africa, Asia and Oceania |
| `ui/js/screen-intl.js` (+ `-americas`, `-caf`, `-asia`) | Competitions > International (read-only) |
| `tests/test_internationals.js`, `test_intl_americas.js`, `test_intl_caf.js`, `test_intl_afc.js`, `test_intl_screen.js` | 22 seasons in strict mode, every host scenario, saves, the screen |

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
weeks 11, 12A, 12B, 17, 18A, 18B (one match in the first week of a window, two in the second). Week 19 draws:
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

`HOSTS` has the awarded ones (EURO 2028, WC 2030, EURO 2032, WC 2034, AFCON 2027, Asian Cup 2027);
an entry there always wins, also over a save's earlier draw. Every other tournament draws its hosts
in week 1, `HOST_DRAW_SEASONS_BEFORE_BY` seasons ahead, from its pot in `HOST_POTS` (EURO,
WORLD_CUP, COPA, AFCON, ANL_FINALS, ASIAN_CUP, OFC_NATIONS_CUP; the Gold Cup is always `GOLD_HOSTS`).

Each pot entry is one possible hosting, and one entry is drawn, all equally likely: `'ger'` hosts
alone, `['den', 'swe']` host together and only together. A nation may be in several entries. Rules
(`HOST_POT_RULES`, `hostPotEntries`): known ids of the right confederation (COPA: CONMEBOL or
CONCACAF; the World Cup: any FIFA member, at most `MAX_UEFA_HOSTS_WC` from UEFA), at most
`MAX_HOSTS` (3) nations per entry (`HOST_GROUP_MAX`: the ANL Finals 1 venue, the OFC Nations Cup 2).
A bad entry is skipped with a warning; `tests/test_intl_hosts.js` fails on one. An empty pot: one
host, weighted by reputation, from the confederation (anyone in FIFA for the World Cup). A save
keeps hosts it has already drawn (`intl.hosts`).

**Rotation** (`hostRest`, `pastHostings`): a confederation that hosted one of the last
`HOST_REST_WC_CONFEDERATION` (2) World Cups may not host the next; a nation that hosted one of the
last `HOST_REST_CONTINENTAL` (2) editions of a continental tournament may not host it (a, b, c, a
is fine). Every member of a pot entry must be free; if no entry is, the fallback draws from the
free nations. `HOST_HISTORY` holds the real pre-2026 hosts so the first draws know them. The Gold
Cup (always the USA) is exempt.

## Names

Shipped names are generic: Nations Series, European Qualifying, European Nations Cup, World Nations
Cup (`COMPETITIONS.INTL_*` in `js/league.js`). The real-names pack (`real-club-names.json`) restores
Nations League, European Qualifiers, EURO and World Cup.

## Nation data and reputation drift

`js/nations.js` is **generated** from `national_team_reputations.xlsx` by
`python scripts/import-nations-xlsx.py`: edit the workbook (std reputations, var modifiers) and
re-run. All 211 FIFA nations plus CONCACAF's six non-FIFA members (`fifaMember: false`: Nations
League and Gold Cup only, never the World Cup or its qualifiers). Russia is in the data but
`suspended` (no competition). Existing ids are kept so saves stay valid; the workbook's "United
States" / "Ivory Coast" are shown as USA / Côte d'Ivoire, the game's player spellings.

**Drift** (`Internationals.repAt`): every nation's reputation moves within
`[std - var, min(std + var, REP_CAP)]` on a wave of `DRIFT_PERIOD` (10) years with a random phase
per nation, plus `DRIFT_NOISE` (±0.5) a year. The wave is the difference of two sines, halved: it is
exactly 0 in 2026 (every nation starts at the workbook's std), never leaves ±1, and repeats every
10 years. It is deterministic per save (`intl.driftSeed`) and drives everything: match strength,
pots, seeding, host-draw weights. The Nations tab shows the current value and
its trend against the std.

## The Americas (`js/intl-americas.js`)

Built on the same engine (draws, tables, matches, knockouts, checks). Everything competitive runs
on the 8 **standard slots** `STD_SLOTS` = 11A, 12A, 12B, 17A, 18A, 18B, 36A, 37A (S1–S8), plus the
tournament window. Where a season stands in the four-year cycle is `startYear % 4`:

| % 4 | Season | CONMEBOL | CONCACAF | Tournament window |
|---|---|---|---|---|
| 2 | NL (after a WC) | friendlies | Nations League + Gold Cup prelims | Gold Cup |
| 3 | EURO | WC qualifiers MD1–8 | WC qualifiers R1 + R2, Copa play-in | Copa América |
| 0 | NL (before a WC) | WC qualifiers MD9–16 | Nations League + Gold Cup prelims | Gold Cup + Finalissima |
| 1 | WC | WC qualifiers MD17–18 | WC qualifiers R3 | World Cup |

- **CONMEBOL qualifiers**: 10 teams, double round-robin (circle method; home/away chosen so no team
  ever has three home or three away in a row; MD10–18 mirror MD1–9). Hosts play but are skipped:
  `6 − H` direct, then 1 to the inter-confederation play-off. Drawn in week 3 of the EURO season;
  kept in `intl.am.cycles['WC-2030']` until that World Cup.
- **CONCACAF qualifiers**: hosts sit out (`HOSTS_PLAY_QUALIFIERS`); N = 35 − H. R1: the lowest
  2(N − 30), two legs (S1, S2). R2: 30 teams, 6 groups of 5, single round-robin (S3–S7), R1 winners
  drawn in as placeholders. R3 (WC season): 12 teams, 3 groups of 4, double round-robin (S1–S6).
  Ranked winners, runners-up, thirds, fourths: `6 − H` direct, the next 2 to the play-off.
- **CONCACAF Nations League** (16 / 16 / 9): the first edition uses the real 2026/27 groups
  (`CNL_FIRST`); later editions are drawn from strength pots. League A: 4 seeds (the previous
  Finals four) straight to the quarter-finals, 2 groups of 6 Swiss-style (S1–S4), QF two legs
  (S5/S6), semis S7, third + final S8; 5th/6th relegated. Leagues B (4 × 4) and C (3 × 3) play
  double round-robins at centralised venues (only the hosting team has home advantage), then a
  championship (S7/S8). Promotion/relegation keeps 16/16/9.
- **Gold Cup**: 8 direct (League A's Finals four + League B's group winners) + 8 from a two-legged
  preliminary round (S7/S8, drawn week 19, paired 1v16 by strength). Host `GOLD_HOSTS` (USA, home
  advantage, no automatic place) in A1; 4 groups of 4, QF/SF/final, no third place.
- **Copa América**: 10 CONMEBOL + 6 CONCACAF: a CONCACAF host, the last Gold Cup's semi-finalists,
  then a one-match play-in (S8) between the best other Gold Cup teams. A save without a Gold Cup to
  read takes the strongest CONCACAF teams instead. At most 2 CONCACAF teams per group; quarter-finals,
  semi-finals and third place go straight to penalties, only the final has extra time.
- **World Cup**: CONMEBOL and CONCACAF places come from their qualifiers (a cycle a save joined
  half-way through falls back to reputation order); CAF, AFC and OFC from their own (see below).
  World Cup hosts are now drawn **two seasons before the World Cup season** (WC 2038 in 2035-36).
- **Finalissima**: EURO winner v Copa winner, week 50 of the following season, **slot B** (slot A is
  the Gold Cup's group matchday, which a CONCACAF Copa winner may be playing).
- **Friendlies**: after every standard slot, each nation without a competitive match plays with a
  probability by reputation (`FRIENDLY_PLAY_PROB`); opponents by |reputation difference| +
  confederation distance + noise, never one of its last 2 opponents. Stored compactly per season
  (`seasons[y].am.fr`), shown in a nation's match list. They count for nothing else yet (caps and
  form arrive with call-ups).

**Checks**: every slot's Americas match count against the plan's tables, and **no team plays twice
in one slot**, across every competition and the friendlies. **Saves** (migration 9): the Americas
catch up the current season only (own cursor `intl.am.last`), silently, without friendlies.

Generic names: North American Nations Series, North American Cup, South American Cup, South /
North American Qualifying, Continental Champions Match. Real names in `real-club-names.json`.

## Africa (`js/intl-caf.js`)

Same engine and the same 8 standard slots (S1–S8) as the Americas. The season's CAF programme is
`cafSeason(y)`: `CAF_SEASON_OVERRIDES[y]` if set, else `CAF_BY_POS[cyclePos(y)]`.

| % 4 | Season | CAF in the season | Tournament window |
|---|---|---|---|
| 2 | NL (after a WC) | Nations Series zones (`ANL`, from 2030-31) | Nations Series Finals (16) |
| 3 | EURO | AFCON qualifiers | AFCON (28) |
| 0 | NL (before a WC) | WC qualifiers MD1–8 | – |
| 1 | WC | WC qualifiers MD9–10, CAF play-off | World Cup |

**2026-27 is an override** (`CAF_SEASON_OVERRIDES = { 2026: 'AFCON' }`): AFCON qualifiers, then the
real AFCON 2027 in Kenya, Tanzania and Uganda (`HOSTS['AFCON-2027']`). AFCON 2028 follows in the
regular slot, so there are two AFCONs in a row. The first Nations Series is 2030-31 (`ANL_FROM`).

- **AFCON qualifiers** (`S.caf.afq`): the 12 weakest play a two-legged preliminary round (S1, S2).
  The winners are drawn into the groups as placeholders `PW1..PW6`, resolved at S3. 12 groups of 4
  from strength pots, double round-robin on S3–S8. Hosts play their group but are already in. The
  28: the hosts, the top 2 non-hosts per group, and the best `4 − H` non-host thirds.
- **AFCON tournament** (drawn week 38): 7 groups of 4, hosts in pot 1 and the first groups, home
  advantage for hosts. Round of 16: winners and runners-up plus the 2 best thirds, matched to the
  group B and D winners so no group meets again (`_matchThirds`). QF, SF, then third place and
  final on the last day (slot B). Honours in `intl.honours.AFCON`.
- **Nations Series** (`S.caf.anl`): four zones from the nation data (`zone`, set in
  `scripts/import-nations-xlsx.py`). North (6 teams): one single round-robin group on S1–S5 (MD1–5
  of the G6D template). West, East, Central & South (16 each): 4 groups of 4 from pots, double
  round-robin on S1–S6. Finals (16): North's top 2, the 12 group winners, the 2 best runners-up.
  Drawn week 38 into 4 groups, at most 2 per zone and the North teams apart, at a neutral venue
  (`ANLF-` host key, drawn a season ahead) with no home advantage. QF, SF, third place, final.
  Honours in `intl.honours.ANL`.
- **World Cup qualifiers** (`intl.caf.cycles['WC-2030'].q`, drawn in the NL-before season): the 54
  FIFA members, 6 pots of 9, 9 groups of 6, double round-robin. MD1–8 on S1–S8, MD9–10 on S1–S2 of
  the World Cup season. Hosts play but are skipped in the ranking (group winner = best non-host).
  The best `9 − H` winners qualify. The other `H` winners plus the best `4 − H` runners-up play the
  CAF play-off: semi-finals 1v4 and 2v3 by reputation at S3, final at S4, single neutral matches.
  Its winner is CAF's inter-confederation entrant. World Cup: CAF 9 including hosts.
- **Hosts**: AFCON from `HOST_POTS.AFCON`, the Finals venue from `HOST_POTS.ANL_FINALS` (see Hosts). Both are drawn
  one season ahead (`HOST_DRAW_SEASONS_BEFORE_BY`) from a pot or, while the pot is empty, weighted
  by reputation among CAF members, and listed with the other upcoming hosts.

**Checks**: `_cafCheck` compares every slot's CAF match count against `cafExpected` (section 7 of
the plan, e.g. 24 per AFCON qualifying slot, 27 per WC qualifying slot) and every tournament day
(AFCON 14/14/14/8/4/2+2, Finals 8/8/8/4/2/1+1). The no-team-twice-per-slot rule covers Africa too.
**Saves** (migration 10): Africa catches up the current season only (`intl.caf.last`), silently,
without friendlies, through the same `_catchUpRegion` as the Americas.

**UI** (`ui/js/screen-intl-caf.js`, confederation "Africa"): AFCON (bracket, groups, best thirds,
qualifying groups with qualified / best third / host markers, preliminary round), the Nations
Series (a chip per zone plus Finals: who got there, the venue, bracket and groups), World Cup
qualifying (play-off, ranking of winners and runners-up, 9 groups), and AFCON + Nations Series on
the roll of honour.

Generic names: African Nations Cup, African Cup Qualifying, African Nations Series, African
Qualifying. Real names in `real-club-names.json`.

## Asia and Oceania (`js/intl-afc.js`)

Same engine and standard slots (S1–S8). What a season holds is `afcSeason(y)` / `ofcSeason(y)`:
overrides first (`AFC_SEASON_OVERRIDES`), else `AFC_BY_POS` / `OFC_BY_POS` by cycle position.
Per-season state is on `seasons[y].ao`; the Nations League World Cup edition and OFC qualifying
(both feed one World Cup) are on `intl.ao.cycles['WC-2030']`; `intl.ao.div` holds the three
divisions for the next edition and `intl.ao.acQual` the Asian Cup field.

| % 4 | Season | AFC | AFC summer | OFC | OFC summer |
|---|---|---|---|---|---|
| 2 | NL (after a WC) | Nations League, Asian Cup edition | NL Finals (week 49) | – | – |
| 3 | EURO | – | Asian Cup (24) | Nations Cup qualifying | OFC Nations Cup (8) |
| 0 | NL (before a WC) | Nations League, WC edition MD1–8 | – | WC qualifiers R1–R3 | – |
| 1 | WC | NL WC edition MD9–10, AFC play-off | World Cup | – | World Cup |

**Overrides**: 2026-27 plays the real Asian Cup 2027 (Saudi Arabia, the real groups in
`AC_2027_GROUPS`, no qualifying), moved to the summer window like every continental tournament.
2027-28 has no AFC competition (the next Asian Cup is 2032). The first Nations League is the World
Cup edition of 2028-29, from the real-life placement `AFCNL_FIRST` (18 / 18 / 11, fixed, not
recomputed from reputations). The Northern Mariana Islands are an AFC member outside FIFA: AFC
competitions only.

- **Nations League, Asian Cup edition**: Divisions 1 and 2 are the UEFA Nations League A/B format
  (3 groups of 6, the G6 template, S1–S6). Division 3: groups of 4, 4 and 3, double round-robin
  (G4D / G3D, S1–S6). Division 1: top 2 + 2 best thirds to two-legged quarter-finals (S7/S8), then
  Finals in week 49 (semis slot A, third place + final slot B, neutral). Promotion/relegation:
  winners up, 6th-placed down, upper 5th v lower runners-up over two legs (S7/S8), for 1/2 and
  2/3. Asian Cup field: all of Division 1 (hosts included), hosts outside it (H_out), then the best
  `6 − H_out` non-host Division 2 teams by position, then record. Honours in `honours.AFCNL`.
- **Nations League, World Cup edition**: Divisions 1 and 2 in 3 groups of 6, double round-robin
  (G6D): MD1–8 on S1–S8, MD9–10 on S1–S2 of the World Cup season. Division 3 as above. Then direct
  promotion/relegation only. World Cup: non-host Division 1 teams ranked across groups (position,
  then record): the first `6 − H` qualify, the next 4 play the AFC play-off, a single round-robin at
  a neutral venue on S3–S5 (G4D MD1–3): top 2 to the World Cup, 3rd to the inter-confederation
  play-off. Division 2 and 3 teams cannot reach the World Cup.
- **Asian Cup** (drawn week 38): the EURO 24 format and bracket (`_firstKnockout`), 4 pots of 6,
  hosts in pot 1 and group A, home advantage for hosts, no third place. 51 matches. Hosts are drawn
  two seasons ahead (`AC-` key; pot `HOST_POTS.ASIAN_CUP`, else 1 AFC nation weighted by reputation).
  Honours in `honours.AC`.
- **OFC World Cup qualifiers** (hosts sit out): R1, a neutral knockout of the `(11 − H) − 7`
  weakest (4: semis S1 + final S2; 3: the top seed has a bye; 2: final only). R2: 8 teams in 2
  groups of 4 from pots (2 / 4 / 1 + the R1 winner), single round-robin on S3–S5. R3: neutral
  semis (1A v 2B, 1B v 2A) on S7, final on S8. No OFC host: winner direct, runner-up to the
  inter-confederation play-off; with an OFC host the winner goes to that play-off.
- **OFC Nations Cup** (EURO seasons, first 2028): qualifying = the 4 weakest non-hosts, a single
  round-robin at one venue on S1–S3, the winner joins the hosts and the 7 − H others. Finals: 2
  groups of 4, semis (week 52), third place + final (week 1). 16 matches. Honours in `honours.ONC`.
- **World Cup**: every confederation now qualifies through its own competitions (`_wcResult`); the
  weighted placeholder pools are gone. A save that joined in the middle of a qualifying cycle (its
  first season was never played) takes that confederation's strongest non-hosts by reputation and is
  flagged `S.wcFallback`. Asserted: UEFA 16, CONMEBOL 6, CONCACAF 6, CAF 9, AFC 8, OFC 1 (hosts
  included) and 6 inter-confederation entrants (CONCACAF 2, CONMEBOL 1, CAF 1, AFC 1, OFC 1).

**Checks**: `_aoCheck` compares every slot's AFC + OFC match count with `aoExpected` (section 6 of
the plan) and every tournament day (Asian Cup 12/12/12/8/4/2+1, OFC Nations Cup 4/4/4/2/1+1).
Divisions stay 18/18/11 after every promotion step. **Saves** (migration 11): AFC and OFC catch up
the current season only (`intl.ao.last`), silently, without friendlies; a 2026-27 save gets the
Asian Cup 2027 only.

**UI** (`ui/js/screen-intl-asia.js`, confederations "Asia" and "Oceania"): the Nations League
(one chip per division plus Knockouts / AFC play-off, zone colours, H for hosts, AC for Division 2
teams through to the Asian Cup, who moves up and down), the Asian Cup (bracket, groups, best
thirds), OFC qualifying (R3, R2 groups, R1) and the OFC Nations Cup (knockouts, groups,
qualifying). Roll of honour: Asian Cup, Nations League, OFC Nations Cup.

Generic names: Asian Nations Series, Asian Nations Cup, Asian Qualifying, Oceania Qualifying,
Oceania Nations Cup, Oceania Cup Qualifying. Real names in `real-club-names.json`.

## Global calendar

Every confederation by cycle position (`startYear % 4`). Season = weeks 3–48 on the standard slots;
summer = the tournament window, weeks 49–2.

| % 4 | Season type | UEFA | CONMEBOL | CONCACAF | CAF | AFC | OFC |
|---|---|---|---|---|---|---|---|
| 2 | NL after a WC | Nations League · NL Finals | friendlies | Nations League · **Gold Cup** | Nations League zones · **ANL Finals** | NL (Asian Cup ed.) · NL Finals | – |
| 3 | EURO | EURO qualifiers · **EURO** | WCQ MD1–8 · **Copa América** | WCQ R1–R2 · Copa | AFCON qualifiers · **AFCON** | – · **Asian Cup** | NC qualifying · **OFC Nations Cup** |
| 0 | NL before a WC | Nations League · NL Finals | WCQ MD9–16 · Finalissima | Nations League · **Gold Cup** | WCQ MD1–8 | NL (WC ed.) MD1–8 | WCQ R1–R3 |
| 1 | WC | WC qualifiers · **World Cup** | WCQ MD17–18 | WCQ R3 | WCQ MD9–10, CAF play-off | NL MD9–10, AFC play-off | – |

The inter-confederation play-off is in weeks 36/37 of the World Cup season. One-offs: 2026-27 plays
AFCON 2027 and Asian Cup 2027; 2027-28 has no AFC competition; the African Nations League starts
2030-31, the AFC Nations League 2028-29.

## Call-ups (`js/intl-callups.js`)

Only the agent's clients are modelled; every other player of a national team is virtual, at its
reputation. Numbers are in the `CALLUP_*` block of `js/intl-config.js`.

**Bands.** Skill level **S = min(reputation, 86) + 2** (the drifting current reputation). Star:
S+3 and up. Starter: S−3 to S+2. Rotation: S−4 down to S − round(9 − 4t). Reserve: the next
round(7 − 3t) points. Below that: not called up. `t = clamp(log10(population in m) / 2, 0, 1)`,
so 0 at 1m and below, 1 at 100m and above. Iceland (rep 69, 0.4m): star 74+, starter 68–73,
rotation 62–67, reserve 55–61. 100m+: rotation S−4/−5, reserve S−6 to −9.

**Caps (clients only).** Per position the first `CALLUP_XI_POS` (GK, RB, LB 1; ST, RW, LW, CAM,
CDM 2; CM, CB 3) keep their role, the next is rotation at best, the one after reserve at best,
anyone further misses out (four Icelandic RBs of 75/74/74/74: star, rotation, reserve, out).
Starters + stars then: at most 5 defenders, 4 midfielders, 3 attackers, 10 outfielders; the
lowest-rated extra drops to rotation. Reserves: at most one per line (GK, defence, midfield,
attack), the best-rated; a client rated in the reserve band is only picked by chance
(`CALLUP_RESERVE_CHANCE`): 75% at 22 or younger, 15% at 23+ if he has been called up before, 1% if
never. Clubs use the same starter limits among your clients (`Agency._xiBlocked`, in `maxRoleAt` and
the negotiable role ceiling): a second star-level right-back at a club can only join as rotation.
Squad limits: 23, per position (`CALLUP_POS_MAX`), per group
(the 2 wildcards: 9 defenders, 8 midfielders, 7 attackers at most), 3 keepers. Eligible: age 16+,
not injured, nationality with a national team.

**Playing time.** Star 100%, starter 90%, rotation 50%, reserve 10% of matches; keepers: first
choice 100% / 90%, back-up 10%, third keeper 0.1% (one keeper per match: client keepers share the
slot in role order). Clients get goals, assists, cards and a rating like in club matches
(`p.intlStats[season][comp]`, `p.intlNation`); international minutes count for development.

**Windows.** Squads are named the week before each window (weeks 10, 16, 35, 48; one mail) and
hold until the next: 11–12, 17–18, 36–37, 49–2. `intl.cu` holds the current window. The summer
window only names squads for nations that play in it (`_summerNations`: the tournaments, both
Nations League Finals, the Finalissima). A save that
never got the call-up is given it silently the first time a match needs it.

**Strength.** A national team plays at rep + Σ max(0, ability − rep)/11 over its called-up
starters and stars (the club formula), only for matches inside that window.

**Away with the national team.** A called-up client whose nation plays in a week misses his club's
matches that week. In practice: the summer tournaments in weeks 1–2, during the European
qualifiers (internationals are processed before club football each week). That week only, his club
plays without what he adds to it (`awayClientsPenalty`: max(0, ability − anchor)/11); nothing is
stored. Inter-confederation play-off appearances are recorded as `INTL_WCPO`, not World Cup.

**Nation page** (`ui/js/screen-nation.js`, route `nation/<id>`; every nation name links to it):
reputation, titles (the real ones before 2026 from
`js/intl-history.js` + the game's), best ever per competition, every tournament played
(`intl.fin`, recorded when each tournament ends: W, F, SF, QF, R16, R32, GS), your clients at it
(this season / all time). Matches: the last 104 weeks, friendlies included (`intl.res`, one shared
list, each match once, with a competition code table `intl.rc` kept in the save).

**Never shown to the player:** the skill level, the bands and a client's squad role (nobody is told
in real life whether he will play every game). Squad membership is shown ("In the squad"), and the
call-up mail only names who is in. "With national squad" (nation page, player card status) only
shows during a window's weeks, never in between. Caps are only shown for clients.

**Player card:** caps as the fourth item next to the age: "No caps" before a first call-up
(`p.intlCalled`), then the count to this week (0 for a squad member who has not played); a
Club / International toggle on History, with his international titles (`p.intlTrophies`: every
client in the winner's squad). **Agency records:** most caps, international goals, assists, clean
sheets for country, goals at one World Nations Cup, international trophies.

## Schedule (`js/intl-schedule.js`)

**Pre-filled knockout rounds.** At the end of every processed week (`_weekly`) the next round of
every knockout is filled in as soon as its teams are known, with its week and slot: tournament
brackets (EURO, World Cup, Copa, Gold Cup, AFCON, Asian Cup, OFC Nations Cup, African Nations
Series Finals), the Nations League Finals, CONCACAF Nations League semis and finals, the qualifier
play-off paths, the inter-confederation play-off, the CAF play-off and OFC Rounds 1 and 3. The
tournament days then play exactly those fixtures (the pairings are the same functions; the AFCON
Round of 16 is drawn once, by `_afconR16`, after the groups). A test checks every announced fixture
is played that week by the same teams.

**Known fixtures.** `knownFixtures()` lists every fixture already set (groups, both legs of drawn
ties, pre-filled rounds, arranged friendlies); a nation's page shows them under "Coming up".

**Friendlies** (`_arrangeFriendlies`): arranged `FRIENDLY_SCHEDULE_AHEAD` (3) weeks before each break
(weeks 8, 14, 33), played in the first slot of each break week. Only nations with no competitive
match in that break take part; a match that comes up later in the same slot calls a friendly off.
Never the same pair within 104 weeks; `FRIENDLY_CROSS_SHARE` (0.6) of pairings against another
confederation; the opponent is one of the `FRIENDLY_PICK_FROM` (8) closest in reputation (+ noise,
+ distance), weighted to the closest. Pending friendlies: `intl.fs`.

**Nations League positions** (`intl.nlp`): every team's group position per edition (UEFA League A-C,
CONCACAF A-C with the seeds marked, AFC Division 1-3 in both editions), shown on a nation's page as
"League A · 6th" next to its Finals result.

**Host boost:** a tournament (and a Nations League Finals) has no home advantage at all, every
match is neutral; a host plays its own tournament at +`TOURNAMENT_HOST_BOOST` (2), and that is the
only edge. Qualifiers and Nations League group games keep the home advantage. **Clients in a match:** every logged match keeps what each client did in it (goals,
assists, rating, card, started); a nation's match list marks those games and opens the stats.
**Achievements:** international debut, 50 / 100 / 150 caps, 50 / 100 international goals, a Nations
League, a continental championship, the World Nations Cup. **Call-ups** appear in the week summary
and, while the mail is unread, under Needs attention.
