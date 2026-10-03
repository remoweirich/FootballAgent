# Live sim and match ratings — findings and proposals

Written 2026-10-03 from four screenshots plus measurement against the real code. Items 1–4 of that
batch are implemented; this covers **item 5** (what else the screenshots show) and **item 6**
(why ratings are so high). Nothing here is implemented yet — it is a list to argue with.

---

# Item 5 — what else the live sim gets wrong

## 5.1 The feed is mostly corners — **high**

Seven of the eleven visible lines in the 67' screenshot are "Ecke für …".

Measured: `CORNER_BASE 2 + CORNER_SPREAD 6` per side gives **4–14 corners a match, averaging 9**.
The event budget for real narrated beats is `min(9, max(3, 1 + clients×2 + 0..2))` — **3–9**. So
corners are roughly *half* of everything the player reads, and they carry no player, no stat and
no consequence.

They exist because the Statistik tab needs a corner count that matches the feed. That is a good
reason for the *number* to be right, not for every one to be a ticker line.

**Proposal.** Keep the count, stop printing the ticks. Corners become a silent counter, except the
1–2 that are already narrated as client events (`CORNER_EVENT_CHANCE`) and the occasional
follow-up. Reduce the written ones to at most 2–3 a match. This alone roughly halves feed noise.

## 5.2 Goals have no scorer — **high**

"60' Tor für FC Luzern U21." Nobody scored it.

Anonymous goals are goals by players the agent does not represent, so the engine never named them.
Item 4 now names the **keeper** when the agent is watching his own goalkeeper, which fixes the
worst case, but for everyone else the line is still faceless.

**Proposal.** Invent a plausible scorer name for the opposition from the existing name generator and
keep it stable for the match (so the same striker can score twice). It changes no stored data —
the goal already exists, it just gets a name. A match report that says who scored reads enormously
better than one that does not.

## 5.3 A client's attack is immediately followed by the opposition scoring — **high**

59' Leander Schweigler builds a move out of his own box, ending "SC Cham vier gegen vier". 60': a
goal for the other team. It reads as though his attack produced the opposition's goal.

Units are shuffled independently and then stamped with minutes, so nothing stops a client's
attacking beat landing one minute before a goal conceded by his side.

**Proposal.** When stamping minutes, forbid an anonymous goal for side X within 2 minutes *after*
an attacking beat by side Y. Cheap to add in `stampWindow`, and it removes a whole class of
nonsense readings.

## 5.4 Narration that leads nowhere — **high, partly fixed**

Schweigler's two big narrated passages and then "noch keine Statistik" at full time.

Item 4 fixes the *stat line* (he now finishes with shots/tackles/saves). It does **not** fix the
narrative promise: a three-line passage ending "four against four" that produces nothing at all.

**Proposal.** Give chains an explicit outcome line — "…and the shot is turned round the post",
"…but the final ball is overhit". The workbook already has end pieces; what is missing is that a
chain with no result tag currently just stops. A reader does not mind a move breaking down; they
mind not being told that it did.

## 5.5 Orphan fragments — **medium**

33': "Am ersten Pfosten verlängert, aber am zweiten ist niemand mitgegangen." No team, no player.
This is `CORNER_FOLLOW_LINES`, written to follow a corner line — but after the shuffle it can read
as a standalone entry.

**Proposal.** Fold the follow-up into its parent corner as one entry rather than a separate ticker
line, or prefix the team.

## 5.6 Senior football at 15 — **medium, engine not live sim**

From the history screen: 16 senior appearances in 28/29 and 48 in 29/30, when the player was 15
and 16 (he is 21 in 34/35). A 15-year-old playing 16 league games for a Swiss second-tier side is
implausible enough to notice.

**Proposal.** Check the minimum age for senior selection; if there is none, add one (16, with a
rarity gate below 17).

## 5.7 48–50 appearances in a season — **medium**

The same screen shows 50, 48, 48, 45, 44, 39. A 34-game league plus two cups plus Europe can
approach the high 40s, so this may be legitimate — but it is worth confirming against the actual
fixture count, because it inflates every per-season total including goals and cards.

## 5.8 Statistik is invented and ignores the feed — **medium, partly fixed**

`buildStats` derives shots, shots on target, fouls and possession from the scoreline alone. Item 4
floors team shots at the sum of the clients' shots, which was your explicit constraint, but the
rest is still unconnected: fouls bear no relation to the cards shown, possession bears no relation
to who had the chances.

**Proposal.** Derive fouls from the cards actually narrated (every card is a foul, plus a base),
and nudge possession toward the side with more narrated attacking beats.

---

# Item 6 — why ratings are so high

## What the numbers actually are

The formula (`js/league.js`, `assignStats`):

```
6.55
  + levelGapRating(ability − club reputation)
  + resultBonus            win +0.55 · draw +0.05 · loss −0.40
  + goals × 1.35 + assists × 0.65
  + 0.60   clean sheet, if GK/CB/LB/RB
  − 0.45   conceded 3+, if GK/CB
  + gauss(0, 0.62)         per match
  + formBiasOf(p)          ONE draw for the whole season
  + moraleRatingMod        +0.10 … −0.30
  − 0.30   if settling in abroad
```

Simulated 4,000 seasons per profile:

| profile | mean | 10th–90th | seasons ≥ 7.50 | ≥ 8.00 |
|---|---|---|---|---|
| plain midfielder, at his club's level, no goals | **6.80** | 5.63 – 7.95 | 22% | 9% |
| centre-back at his level, winning side | **7.12** | 5.95 – 8.24 | 34% | 16% |
| **Hans Peter** (ST, +5 over his club, 10g+7a in 45) | **7.49** | 6.35 – 8.59 | 51% | 28% |
| star, +12 over his club, 20 goals in 34 | **8.44** | 7.40 – 9.40 | 88% | 72% |

**Hans Peter's 7.56–8.00 seasons are not a bug in the sense of a broken line of code.** They are
exactly what the formula produces for his profile. The problem is the formula.

## The four causes, in order of size

### A. The season-long form draw is enormous — **the biggest single cause**

```js
_formVal = gauss(0, formTrait > 0.2 ? 0.30 : 0.9)   // ONE draw, used in every match
```

It is drawn once per season and added to *every* match, so it never averages out. Measured across
40,000 players: 10th percentile **−1.14**, 90th **+1.12**. **15% of players are handed ≥ +0.90 for
an entire season; 4% get ≥ +1.50** — on a coin flip that has nothing to do with the player.

It also explains the *consistency* in your screenshot. `formTraitRoll` gives a 1-in-30 player a
permanent `formTrait ≈ +0.34` **and** cuts his season variance to 0.30. Hans Peter looks exactly
like that player: seven seasons between 7.56 and 8.00, never wobbling.

**Proposal.** Cut σ from 0.9 to ~0.30, and re-roll it 3–4 times a season instead of once. Two
gains: season averages stop being decided by one invisible dice roll, and clients get real
in-season form swings — which would feed straight into the form bands the offer system now reads
(`docs/offers-design.md` §4).

### B. The baseline is ~7.5, not the 6.6 the code intends

The comment says "holding your own at your own club's level is an unremarkable 6.6 season". It
isn't: a goalless midfielder at exactly his level already averages **6.80**, and a modest scorer at
+5 averages **7.49** before any luck. The positive terms stack on a base that was set as though
they did not exist.

**Proposal.** Drop the base from 6.55 to ~6.15, which puts the plain midfielder at ~6.4 and Hans
Peter at ~7.1 — still a good season, no longer a world-class one.

### C. Being better than your league is paid twice

A player who outclasses his division gets `levelGapRating` **and** scores more goals, each worth
1.35. For the star profile that is +0.75 and +0.79 — **+1.54 over base from one underlying fact**.

**Proposal.** Taper the goal bonus as the gap grows (a 20-goal season means less when you are 12
points better than everyone), or cut the goal weight to ~1.0 and let the gap carry it.

### D. Winning lifts everyone equally

`resultBonus` gives every player on the winning side +0.55 regardless of contribution — worth about
+0.25 a season to a squad player at a strong club.

**Proposal.** Halve it, or scale it by whether the player contributed (goal, assist or clean sheet).

## The design question underneath

Ratings are deliberately **relative to the club you play for**, not to football as a whole. That is
why a 37-rated 18-year-old in the 2. Regionalliga can average 7.64: he is five points better than
his team-mates, and the system is telling you so.

It is a defensible choice, and it makes lower-league saves readable. But it means a rating cannot
be compared across divisions, which is confusing when the same number appears on a Regionalliga
player and a Bundesliga one. If you would rather a 37-ability player *could not* average 8.0,
that is a different change from A–D: it needs an absolute ceiling that scales with ability, e.g.
cap the season average near `6.0 + ability/25`.

**My recommendation:** do **A** first and alone. It is one constant plus a re-roll, it removes the
largest distortion, and it adds in-season form the rest of the game can use. Then measure again
before touching B–D, because A will move every number in the table above.
