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

### A. ~~The season-long form draw is enormous~~ — **WRONG, corrected 2026-10-03**

**This was my error and it is worth recording.** I reported that `_formVal = gauss(0, 0.9)` gave a
season swing with 10th/90th percentiles of −1.14/+1.12, and that 15% of players were handed ≥ +0.90
for a whole year. I measured that with a Box–Muller normal in my own probe.

`PlayerGen.gauss(mean, sd)` is **not** a normal distribution:

```js
gauss(mean, sd) { const r = (Rng.next() + Rng.next() + Rng.next()) / 3; return mean + (r - 0.5) * 2 * sd; }
```

It is a bounded triangular draw whose true standard deviation is **sd/3**, and which can never
leave ±sd. Measured over 400k draws, `gauss(0, 0.9)` has SD **0.30**, deciles −0.39/+0.39, and
**0.00%** of draws reach +0.90. The season-long form swing was about a third of what I claimed and
was never the dominant term.

The implementation confirmed it. Narrowing the swing and re-rolling it four times a season moved
the share of seasons ≥ 8.00 from 4.9% to 4.2% — inside the seed-to-seed noise band of 2.7 — while
measured season-to-season variation fell from 0.345 to 0.242. In other words it changed the thing
that was already small and left the complaint untouched. It also broke a property the suite
rightly pins (`test_batch5`): a player at his own level must still be able to have a career year,
and the best of 150 such seasons fell to 7.40.

**Reverted in full.** `formBiasOf` is back to its original behaviour, now carrying a comment about
the gauss trap so the next person does not repeat this.

The in-season re-roll is still a good idea — runs of form inside a season are exactly what the
offer bands want to read — but keyed off **appearances**, not the calendar. Keyed off
`GameState.week` it degenerates whenever a caller does not advance the clock, which is how
`test_batch5` ended up drawing one oversized bias instead of four small ones.

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

**Revised recommendation (2026-10-03).** A is dead — see the correction above. The ratings are
high because of the **mean**, not the spread, so the fix is **B**, and B is the one change I was
most cautious about because it moves everything downstream.

Costed, for when you want it:

* base 6.55 → ~6.10, which puts the plain midfielder near 6.4 and Hans Peter near 7.1
* `levelGapRating` and the goal weight are what carry the rest; C can follow if B is not enough
* **growth must be recentred with it.** The development multiplier is
  `1 + (seasonAvg − 6.9) × 0.45`. Drop the mean by 0.45 and leave the 6.9 pivot alone and
  development slows by roughly 18% across the board — exactly the collateral damage to avoid. The
  pivot moves to ~6.45 with the base.
* `MORALE.HOT_FORM_AVG_RATING` (7.50) gates a +15/+30/+20 morale injection. Measured: when the
  share of seasons clearing 7.50 fell from 29.5% to 22.5%, end-of-career morale fell 4.8 points.
  It has to move with the distribution, and there is a feedback loop — morale feeds
  `moraleRatingMod`, which feeds the rating — so it needs re-measuring, not just arithmetic.
* `HOT_RATING` (7.60, js/league.js) gates squad-role promotion, and through it playing time.
* **Not** `Agency.FORM_BANDS`, and **not** the extra-suitor rule: those are written in terms of the
  rating you see on screen, and fewer players reaching 7.50 is the point.

The harness for all of this is in the scratchpad (`rating-impact.js`): three seeds × five seasons ×
forty clients, reporting the rating distribution next to growth, appearances and morale, with a
seed-noise band so a real change can be told from luck. Anything that touches ratings should be run
through it before and after.


---

# Implemented 2026-10-04 — the rating recalibration

Done, measured over 3 seeds x 5 seasons x 40 clients, against the same harness
(`rating-impact.js`), which reports growth, appearances and morale next to the ratings with a
seed-noise band so a real change can be told from luck.

| | before | after | noise band |
|---|---|---|---|
| mean season average | 7.23 | **7.04** | 0.08 |
| % of seasons >= 7.50 (the hot-form gate) | 31.6% | **16.3%** | 8.4 |
| ability gained per season | 1.93 | 1.94 | within noise |
| appearances per season | 31.2 | 30.2 | within noise |
| morale at the end | 47.2 | 46.8 | within noise |

**What changed**

* `RATING_BASE` 6.55 -> 6.35 and `RATING_PER_GOAL` 1.35 -> 1.00, both named constants now. They
  move together: cutting the base alone leaves a scorer's season inflated, because outclassing
  your league is already paid once through `levelGapRating` and then again through the goals that
  outclassing produces.
* The development pivot moved 6.9 -> 6.70 with it. It reads the season AVERAGE, so lowering every
  rating without moving the pivot would have slowed development across the whole game by ~9% as a
  side effect.
* A second tier on the season-end form bonus (`GOOD_FORM_AVG_RATING` 7.05, at
  `GOOD_FORM_SHARE` 0.60 strength). The full +15/+30/+20 stays gated at 7.50 and stays rare, as
  asked. The tier exists because that bonus had been ~a third of the morale economy's income at
  its old firing rate; without it, measured end-of-career morale fell 8.5 points purely as a
  side effect of making hot form rare.

**The two rare players**

`formTraitRoll(potential)` now has three outcomes:

| | chance | lift | result |
|---|---|---|---|
| generational | 1 in 100 of players with potential >= 85 (~1 in 1,100 overall) | +1.62 | mean 8.59, **99% of careers 8.0+ every season** |
| consistently excellent | 1 in 40 of anyone | +0.98 | mean 7.94, **92% of careers 7.5+ every season** |
| everyone else | — | ~0 | mean 7.04, 11% of seasons reach 7.5, never a whole career |

The lifts look large against a 7.00 average because the bar is "every season", not "on average":
a season average still carries ~0.29 of spread from results, goals and the form draw, so clearing
7.50 nineteen years in twenty needs a mean nearer 8.0.

**One thing that could not be satisfied as stated.** "An average season should be 7.0" and "a
striker with 16 goals in 34 games would be about right" cannot both hold: with the mean at 7.0, a
16-goal striker lands at ~7.45, and the only way to bring him to 7.0 is to make goals worth
roughly nothing. The population mean was taken as the target, since it is the directly measurable
one; a 16-goal season now reads as clearly good rather than elite (it was ~7.81).

**Still open:** `levelGapRating` and the win bonus (C and D above) are untouched. If a 7.45 for 16
goals still reads high, the next lever is the goal weight again, or tapering the level-gap reward
for players who are also scoring.
