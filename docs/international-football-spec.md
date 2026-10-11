# International football: specification

Status: calendar (step 1) and the competitions themselves (step 2, see docs/international.md) are built. Call-ups (2.1) and the international stats tab (2.3) are not.

## 1. Season calendar (implemented)

Three two-week international breaks, one winter-break week, and a slot for major tournaments.

| Weeks | What |
|---|---|
| 1–2 | Pre-season, no league. Tail end of a major tournament (see 3.2) |
| 3–10 | League |
| **11–12** | **International break 1** |
| 13–16 | League |
| **17–18** | **International break 2** |
| 19–26 | League |
| 27 | Winter break |
| 28–35 | League |
| **36–37** | **International break 3** |
| 38–45 | League (34-round leagues finish in week 43) |
| 46 | Promotion/relegation play-offs · **top-tier domestic cup finals** |
| 47 | Lower-tier domestic cup finals · all three European finals |
| 48 | Off-season |
| **49–52 (+ 1–2)** | **Major tournament slot** (European Championship, World Cup, Africa Cup, Asian Cup, Copa América…) |

### League rounds

36 league weeks: 3–10, 13–16, 19–26, 28–35, 38–45. Every league week plays one round; longer
leagues play a second round in fixed weeks (`LEAGUE_DOUBLE_WEEKS` in js/league.js):

| Season length | Second round in weeks | Last round |
|---|---|---|
| 34 | none (plays the first 34 league weeks) | 43 |
| 36 | none | 45 |
| 38 | 10, 14 | 45 |
| 42 | 9, 10, 14, 22, 30, 42 | 45 |
| 44 | 9, 10, 19, 23, 30, 34, 39, 43 | 45 |
| 46 | 7, 9, 10, 14, 20, 24, 29, 33, 40, 44 | 45 |

No league ever plays three rounds in one week. Any other length (created content) spreads its
extra rounds evenly over the league weeks.

### Domestic cups

| Round | Week |
|---|---|
| Round 1 | 4 |
| Round 2 | **8** (was 7) |
| Round 3 | 15 |
| R16 (QF in 64-team cups) | 26 |
| QF (128-team cups only) | 32 |
| SF | 38 |
| Final, **top-tier cup** | **46** |
| Final, lower-tier cups | 47 |

Top-tier cup = the cup first-division clubs play in, one per country: Dutch, English, German,
Spanish, Swiss, Italian, French, Portuguese and Belgian cups, the Liechtenstein Cup (Vaduz), and a
created country's higher cup. Lower-tier: Kleine Beker, Lower Leagues Cup, Landespokal, Copa
Federación, Cupa Bass, Coppa Compagno, Coupe National, Segunda Taça, Notre Coupe, created lower cups.

Side competitions: Lower Leagues Cup groups weeks 4 and 8, knockout weeks 10, 15, 26, 32, 38, 47.
Kleine Beker groups weeks 4, 8 and 16, knockout 26, 32, 38, 47. Liechtenstein Cup QF 32, SF 38,
final 46.

### European competitions

| Round | Week |
|---|---|
| Qualifying | 1–6 (unchanged) |
| League phase MD1–MD8 | 10, 15, 16, 19, 21, 25, 29, 31 |
| Knockout play-off | 34 / 35 |
| R16 | 38 / 39 |
| QF | 41 / 42 |
| SF | 44 / 45 |
| Final | 47 |

## 2. Agreed rules (not built yet)

### 2.1 Call-ups lock players out of club football
A player called up to his national team cannot be picked by his club while he is away. If his club
plays a European qualifier during weeks 1–2 (major tournament tail), he misses it.

### 2.2 Major tournaments straddle the season change
Tournaments run weeks 49–52 and 1–2. **International games played in weeks 1 and 2 count towards
the previous season.** The club does not matter for international stats, so a transfer or a
contract running out during the tournament changes nothing for them.

### 2.3 International stats on the player card
- Player card → History, and the agency history: below the trophies, a toggle at the top of the
  table switches between **Club** and **International** appearances.
- International view: one row per season with only international games, and below it the total
  stats summary table, which can also be split by competition.
- The toggle is disabled for a player who has never been called up, and becomes live after his
  first call-up.

## 3. Still to plan
The international competitions themselves: which nations, squads and call-up rules, qualifying
and tournament formats, friendlies in the breaks, how call-ups affect morale, form and value, and
what the agent gains from them.
