# How offers are generated — current rules

Written up so the rules can be argued with. This describes the code **as it stands today**.
Companion to `reputation-design.md`.

> **§4 (form, trophies, relegation) is the 2026-09-28 revision.** Everything in it is new; the rest
> of the document is the behaviour that was already there. `tests/test_offer_interest.js` pins it.

Everything here lives in two places:

- `js/simulation.js` → `Sim._generateOffers()` — who gets approached, and how often
- `js/agency.js` → `playerValue`, `estimateFee`, `offeredWage`, `pickBuyer`, `maxRoleAt`,
  `buyerMaxFee` — what the offer actually says

There are **four** separate offer systems. They share almost nothing:

| System | Trigger | Covered in |
|---|---|---|
| Incoming transfer bids | weekly roll, contracted clients | §2–§5 |
| Free-agent contract offers | weekly roll, clients with no club | §6 |
| Loan offers | weekly roll, loan-listed clients | §7 |
| Agent-initiated (you tout him) | you press the button | §8 |

---

## 1. When offers are rolled at all

`_generateOffers` only runs when:

```
transfer window open (weeks 1–6 summer, 28–33 winter)  OR  week >= 48
```

Weeks 48–52 are the pre-window rumour period: bids do arrive, and they sit in your inbox as
early interest. So there are **17 rollable weeks** in a 52-week season, not 12.

A client is skipped entirely if **any** of these is true:

- he is injured
- he has announced this is his final season (`retiringThisSeason`) — clubs stop chasing, though
  you can still tout him yourself
- he is out on loan or with the reserves (`onLoanAt`)
- he changed clubs in this same window (`_txWindow`) — no fresh approaches until the next one

---

## 2. The chance a bid arrives — contracted clients

Three caps come first. No roll happens if:

- he already has **3 pending transfer offers** in the inbox
- he has a transfer already agreed and waiting to complete (`pendingTransfer`)
- he is inside the post-bidding cooldown (`_txOffersFrom`, see §5)

Then:

```
attract  = 10
           + min(20, league apps this season) × 0.5     →  0 … +10
           + (transfer-listed ? 22 : 0)
           + morale case bonus                          →  see below

chance   = min(0.26, 0.02 + attract / 320)
           × scarcity                                    ability tiers, below
           × relegation boost                            §4.3
           × mean buyer weight                           §4.1 — form and honours act HERE
```

Form is not a term in `attract`. It acts through the buyer pool instead — see §4.

**Morale case bonus** — a stage-2 escalation is public knowledge:

| case | bonus |
|---|---|
| wants more game time (stage ≥2) | +25 |
| wants to leave the club (stage ≥2) | +35 |
| any other dimension | 0 |

**`scarcity`** — the elite are approached far less often, because only a handful of clubs can
go there at all:

| ability | multiplier |
|---|---|
| ≥ 84 | ×0.30 |
| ≥ 80 | ×0.48 |
| ≥ 74 | ×0.68 |
| ≥ 68 | ×0.90 |
| else | ×1.00 |

### What that works out to, per rollable week

At a steady 6.51–7.00 season, so the form multiplier is 1.

| ability | 0 apps | 10 apps | 20 apps | 20 apps, listed |
|---|---|---|---|---|
| 55 | 5.1% | 6.7% | 8.3% | 14.9% |
| 65 | 5.1% | 6.7% | 8.3% | 14.9% |
| 70 | 4.6% | 6.0% | 7.4% | 13.4% |
| 75 | 3.5% | 4.5% | 5.6% | 10.1% |
| 82 | 2.5% | 3.2% | 4.0% | 7.1% |
| 86 | 1.5% | 2.0% | 2.5% | 4.5% |
| 92 | 1.5% | 2.0% | 2.5% | 4.5% |

### And what actually lands

Measured by driving the real engine: 8 clients per band, each at a club matching his level, on a
4-year deal, 4 seasons, inbox cleared each week so the pending caps never bind.

| client | bids per client per season |
|---|---|
| journeyman 55 | 1.03 |
| solid 65 | 1.06 |
| good 72 | 0.97 |
| very good 78 | 0.91 |
| star 84 | 0.63 |
| elite 90 | 0.53 |

So **roughly one bid per client per season**, tapering to about one every two seasons for the
elite. Note how flat that is across the whole mid-range: a 55 and a 78 are approached at nearly
the same rate. (Those figures predate §4 and are for an average-form client; form now swings the
total from 0.7 to 3.0 a season, §4.4.)

---

## 3. Who is allowed to bid

Candidate clubs must clear every one of these:

1. not his current club
2. `club.reputation` within **[ability − 6, ability + 16]**
   — the bottom drops to **ability − 14** if he is transfer-listed, and the top rises to
   **ability + 26** on a season over 8.00 (§4.1)
3. `buyerMaxFee(club) >= playerValue(p) × 0.55` — can afford him
4. not already holding another of **your** clients at the same position
5. no existing offer from that club for that player already in the inbox

### The affordability filter is currently dead

Measured pool sizes:

| client | value | in rep range | of those, can afford |
|---|---|---|---|
| 55 | €0.8m | 298 | 298 |
| 65 | €2.3m | 287 | 287 |
| 72 | €6.1m | 196 | 196 |
| 78 | €13.6m | 117 | 117 |
| 84 | €28.7m | 47 | 47 |
| 90 | €58.3m | 10 | 10 |

It never removes anybody. Any club whose reputation is within 16 of the player's ability can,
by construction, already fund 55% of his value. The rep window is doing all the work.

### Which of them actually bids — `pickBuyer`

Strongly domestic. `home` is the country of his **current club** (or `_lastCountry` for a free
agent):

```
crossProb = clamp(0.02 … 0.35, (ability − 45) / 120)
```

| ability | chance the bid is foreign |
|---|---|
| ≤ 47 | 2% |
| 55 | 8% |
| 65 | 17% |
| 75 | 25% |
| 85 | 33% |
| ≥ 87 | 35% |

Then a pick inside the chosen pool, **weighted by club quality** — see §4. (The free-agent and
loan paths still pass no weights and stay uniform.)

---

## 4. Form, trophies and relegation

All three work the same way: they change **which kind of club** is looking, and the chance of
anyone looking at all follows from that. Three tiers, relative to the player:

| tier | club reputation | what he would be there |
|---|---|---|
| **step up** | ability **+5 or more** | a squad or rotation player |
| **at level** | within **4** either way | walks into the side |
| **step down** | ability **−5 or less** | their star |

Each tier carries a weight. The roll's chance is scaled by the **mean** weight across the eligible
pool, and the buyer is then drawn **in proportion to its own** weight. Those two steps together
make each tier's rate of approaches proportional to *its own* weight and nothing else:

```
rate to tier t  =  base × n_t × w_t / N
```

So `step down: 1.15` really does mean smaller clubs circle 15% more often than normal — not
"relatively more once the others drop away". `tests/test_offer_interest.js` measures all fifteen
combinations against the table and they match to two decimals.

### 4.1 The form table

Rating is the current season once he has 10 games in it, otherwise last season.

| season rating | step up | at level | step down | fee | wage | window | quiet period |
|---|---|---|---|---|---|---|---|
| **over 8.00** | ×3.20 | ×1.70 | ×0.80 | ×1.30 | ×1.60 | **+10** | ×0.45 |
| 7.51 – 8.00 | ×2.20 | ×1.40 | ×0.90 | ×1.18 | ×1.30 | — | ×0.60 |
| 7.01 – 7.50 | ×1.35 | ×1.15 | ×1.00 | ×1.08 | ×1.10 | — | ×0.80 |
| 6.51 – 7.00 | ×1.00 | ×1.00 | ×1.00 | ×1.00 | ×1.00 | — | ×1.00 |
| 6.01 – 6.50 | ×0.55 | ×0.80 | ×1.00 | ×0.92 | ×0.95 | — | ×1.00 |
| **under 6.00** | ×0.10 | ×0.35 | ×1.15 | ×0.80 | ×0.88 | — | ×1.00 |

A rating sitting exactly on a boundary belongs to the band below it: 8.00 is "7.51–8.00".

- **window** stretches the top of the eligible-buyer range (normally ability+16). Only the best
  band opens it, so clubs plainly too good for him will take him as a squad player — `maxRoleAt`
  works out that he would be fringe there, which is exactly how it should read.
- **quiet period** scales the 7–15 week gap after a bidding round (§6). It only ever *shortens*.
  Letting a bad season lengthen it was tried and reverted: the gap applies to every tier at once,
  so slowing the clock dragged the smaller clubs down with the big ones — measured at ×1.30, a bad
  season cut interest from lesser clubs by 36% when the table promises a 15% rise.
- **fee and wage** now cut both ways. A bad season costs him 20% of his value and 12% of his wage;
  before this revision form could only ever help.
- A player with **no real sample** — a youth prospect, a signing who has not featured, fewer than
  5 appearances — reads as **steady**, never as bad. He has not played badly; he has not played.

### 4.2 Trophies

A medal counts for **52 weeks from the day it was won** (`aw` on the trophy entry), and only if he
made **20 or more senior league appearances** that season. Reserve football never records a trophy
at all. Honours only move the **step-up** weight — they make bigger clubs look, and leave clubs at
his level or below indifferent.

| won in the last 52 weeks | step up |
|---|---|
| league title | ×1.15 |
| domestic cup | ×1.10 |
| European trophy | ×1.15 **on top of either** |

League and cup do **not** stack with each other — the bigger one wins. Two league titles inside
one window do not double up. A league-and-Europe double is ×1.32.

### 4.3 Relegation

Triggers when, in the last 52 weeks, he **was relegated**, played **20+ senior league games**, and
is rated **at least as high as the club that went down with him**. Then:

- every club in the division he just left is weighted **×5.0 / (1 + 0.12 × how far above him it
  is)** — hard, and tilted toward that division's *modest* clubs rather than its title contenders
- interest overall rises **×1.45**

The second part is not decoration. `pickBuyer` already favours his own country, so most of his
suitors were in that division anyway — measured, the pool weight alone moved his total by about 5%
and merely reshuffled who bid. The ×1.45 is what makes it mean *more* offers, which is the point: a
player too good for the tier he has dropped into is suddenly a wanted man.

### 4.4 What it does, measured

Real engine, ability 70, 20 clients per band, 6 seasons, form held fixed:

| form | bids per season | vs steady | from a better club | at level | from a lesser club |
|---|---|---|---|---|---|
| bad 5.5 | 0.87 | −42% | 18% | 49% | 33% |
| poor 6.3 | 1.47 | −2% | 27% | 52% | 21% |
| steady 6.8 | 1.49 | — | 28% | 55% | 17% |
| good 7.3 | 1.91 | +28% | 34% | 49% | 16% |
| great 7.8 | 2.30 | +54% | 32% | 51% | 17% |
| superb 8.4 | 2.86 | +92% | 48% | 41% | 11% |

**The middle of the table is compressed, and that is worth knowing.** The quiet period after a
bidding round is 7–15 weeks against 17 rollable weeks in a season, so a mid-table client is
*cooldown-limited*, not chance-limited: he is already getting a bid as fast as the gap allows.
Raising his chance from 5.7% to 7.4% therefore changes almost nothing, which is why 6.01–6.50
measures −2% instead of the −20% its weights imply. The effect only bites where the gap stops
being the binding constraint — at the bottom, where the chance is genuinely tiny, and at the top,
where the quiet period is itself shortened.

Which clubs come for him is **not** compressed: that is set purely by the weighted draw and
follows the table exactly at every band.

If the mid-range should separate more, the knob is the base quiet period in
`Sim._generateOffers` (7–15 weeks, 18–35 for the elite), not the form weights.

---

## 5. How many clubs bid at once

A bidding war is assembled from flat +1s:

```
suitors = 1
  +1 if ability − (his club's reputation) > 10        (outgrowing his club)
  +1 if apps >= 6 and season rating > 7.5             (hot form)
  +1 if (potential − ability) >= 15 and age <= 23     (big upside prospect)
capped at min(3 − pending offers, candidates available)
```

So a maximum of **3 simultaneous bids**, and only an outgrowing, in-form young prospect gets
there. Each suitor is drawn with its own `pickBuyer` call, so a three-way race can mix countries.

---

## 6. Then he goes quiet

After any bidding round:

```
_txOffersFrom = now + (ability >= 80 ? 18–35 weeks : 7–15 weeks)
```

This is the real reason the elite see so few bids — it stacks on top of `scarcity`. An 84-rated
star who draws one bid can be untouchable for most of two windows.

---

## 7. What the offer says

Three numbers, all computed at the moment the mail is created.

### Fee — `estimateFee(p, buyer)`

```
value = 380 × 1.15^ability                       steep in current ability
      → soft-capped:  300m × v / (v + 317m)      asymptote ~€300m
      × (1 + potGap × 0.045 × potWeight × potentialConfidence)
      × ageMult
      × form value multiplier                    x0.80 … x1.30  (§4.1)
      × (0.78 + min(4, contract years left) × 0.11)

fee   = value
      × buyerFactor
      × (stage-2 "wants out" case ? 0.85 : 1)
      capped at buyerMaxFee(buyer)
      rounded to €10k (€1k below €50k), floor €500
```

**`potWeight`** — upside is worth most in the young: age ≤21 → 1.3, ≤25 → 0.8, ≤28 → 0.4,
else 0.15.

**`ageMult`**, relative to a 26-year-old:

| age | ×
|---|---|
| ≤19 | 1.35 |
| ≤21 | 1.25 |
| ≤23 | 1.12 |
| 24–26 | 1.00 |
| 27–28 | 0.80 |
| 29–30 | 0.72 |
| 31 | 0.65 |
| 32 | 0.55 |
| 33 | 0.45 |
| 34 | 0.35 |
| 35 | 0.20 |
| 36 | 0.10 |
| 37+ | 0.05 |

**`buyerFactor`** — a big club pays more for the same player:

```
rep >= 45 :  0.72 + rep / 150          (rep 45 → 1.02,  rep 90 → 1.32)
rep <  45 :  max(0.04, (rep/45)^4.5 × 1.02)   — collapses fast for amateur clubs
```

**`buyerMaxFee`** — the hard ceiling, from the buyer's league and its own standing:

```
factor = max(0.04, 0.5 + (rep − 45) / 55)
       × (rep > 80 ? 1 + (rep − 80) × 0.4 : 1)      superclub escalator
cap    = leagueCap(division) × factor
```

`leagueCap` is a hand-tuned table per division (Premier League €95m, Bundesliga €60m,
La Liga/Serie A €75m, Eredivisie €24m, Dutch Derde Divisie €60k, …).

**Bosman**: `isPreContractFree` — once the winter window shuts in his final contract season, the
fee is **0**.

### Wage — `offeredWage(p, buyer)`

```
wage = PlayerGen.wageFor(ability, buyer.reputation)
     × wagePotentialFactor(p)                wonderkid premium
     × countryWageMult(buyer) × jitter        league tendency × (0.90 … 1.18)
     × form wage multiplier                   x0.88 … x1.60  (§4.1)
     → capYouthWage(age, rep, potential)
     floor €30, rounded to €10
```

The jitter is deliberate: an English suitor *usually* outpays a Portuguese one for the same
player, but not on every single bid. Loyalty is **not** applied — that only exists for re-signing
at his own club.

### Role — `maxRoleAt(p, buyer)`

By `ability − buyer.reputation`:

| gap | role |
|---|---|
| ≥ +4 | key |
| ≥ −1 | starter |
| ≥ −8 | rotation |
| ≥ −16 | fringe |
| else | youth |

### Inbox lifetime

- **agent-initiated** (you touted him): `persistence: 1`, `ttl: 2` weeks
- **single incoming bid**: `persistence: 0 or 1` (coin flip), `ttl: 1–3` weeks
- **each bid in a multi-club race**: same as a single bid, rolled per club
- **free-agent contract offer**: `persistence: 0`, `ttl: 3` weeks

---

## 8. Free agents

A separate, much simpler path. Caps: fewer than **2** pending offers, then a flat **50%** per
rollable week — no form, no apps, no scarcity, no cooldown.

Candidate clubs: rep within **[ability − 10, ability + 14]**, no positional clash, no duplicate
offer. Fee is 0; the mail is a contract offer.

A free agent is therefore approached *far* more often than a contracted player of the same
ability — 50% a week against ~5–8%.

---

## 9. Loan offers

Only for clients who are `loanListed`, not already out, and past `_loanOffersFrom`. One loan
offer may exist at a time.

```
appeal = clamp(0.08 … 0.55, (ability − 35) / 80 + (22 − age) × 0.02)
```

| | appeal |
|---|---|
| 19-year-old, ability 50 | 25% |
| 22-year-old, ability 60 | 31% |
| 26-year-old, ability 70 | 36% |
| 30-year-old, ability 55 | 9% |

On a hit: the destination is a club at or below `parent.reputation + 2` that would give him at
least a fringe role, weighted toward the parent club's own country; then a 3–7 week cooldown.
On a miss: a **6–15 week** dry spell. Missing is the common case, and it is meant to feel like one.

---

## 10. Touting him yourself — `shopPlayer`

Not a roll, a button, and the rules are different again:

1. Per-club cooldown, so you cannot spam one club.
2. If he is **not** transfer-listed, a 50% chance the club mentions it to his current club →
   **relationship −15**, once per window per player no matter how many clubs you pitch.
3. Hard passes:
   - `perceived < target.reputation − 6` → "don't need a player like him"
     (`perceived = ability + 0.5 × max(0, potentialRead − ability)`, where the read is
     `potential ± 8` — the club misjudges his ceiling)
   - ability ≥ 94 **and** `value × 0.6 > buyerMaxFee` → can't afford the fee
   - free agent, wage-tight, ability ≥ 94, 30% → can't afford the wages
4. Otherwise a flat bite chance: **30%**, or **42%** if transfer-listed.

A wage-tight club that bites anyway offers what it *can* pay (85–95% of its max), rather than
walking away.

---

## 11. Things worth questioning

Not recommendations, just the places where the current rules do something that may not be
intended.

1. **Agency reputation has no effect at all.** Nothing in the offer chain reads it —
   `_generateOffers`, `pickBuyer`, `estimateFee`, `playerValue`, `offeredWage`, `_offerObj`,
   `maxRoleAt`, `buyerMaxFee`. A 50-rep agent and a 5-rep agent get identical interest in
   identical clients.

   Agency reputation is used in exactly three places, all about **you** rather than your clients:
   `signConcession` (who will agree to sign with you), `maxTransferCommission` (your cut of a
   transfer) and `maxCommissions` (your representation cut, desktop UI only). Given the
   reputation revamp, this is the obvious gap.
2. **The mid-range is flat.** 55 through 72 all sit at ~1 bid per season at average form. Ability
   barely changes how sought-after a client is until the scarcity tiers kick in at 68+.
3. **The affordability filter never fires** (§3). It reads as a safeguard and is actually inert.
4. **Appearances are capped at 20** and worth at most +10 on a base of 10 — a full season of
   football and a half-season are nearly the same signal. Note this is the same number as
   `REGULAR_APPS`, the bar for a trophy or relegation to count, but the two are unrelated.
5. **Free agents ignore form entirely** (§8) and are approached far more often than a contracted
   player of the same ability — a flat 50% a week against 5–8%. §4 does not touch that path.
6. **Elite clients go very quiet.** `scarcity` ×0.30 and an 18–35 week cooldown compound; 0.53
   bids per season for a 90 at average form. A great season now lifts that (the quiet period
   scales too), but it may still be too few for the client you worked hardest to get.
7. **Nothing models squad need.** A club with four keepers bids for a keeper as readily as a club
   with none.
8. **No European-competition pull.** Qualifying for the Champions League does not make a club
   more active in the market — though *winning* one now makes its players more wanted (§4.2).
9. **Potential is invisible to the bid roll.** `bigUpside` adds a *suitor* once a bid is already
   happening, but a 19-year-old with 95 potential is no likelier to be approached than a
   19-year-old with 60.
10. **The quiet period caps the mid-range** (§4.4). Because it binds before the chance does, form
    changes in the middle bands barely move the number of offers. Shortening the base 7–15 weeks
    would let §4's weights show through on the total as well as on the mix.

### Resolved by the 2026-09-28 revision

- ~~Buyers are picked uniformly~~ — now weighted by club quality (§4).
- ~~Form is a single +25% on value and nothing else~~ — now a six-band table driving interest,
  fee, wage, the eligible-buyer window and the quiet period, with a downside as well as an upside.
- ~~Winning things does nothing~~ — league, cup and European trophies make bigger clubs look (§4.2).
- ~~Relegation does nothing~~ — the division he left comes back for him (§4.3).
