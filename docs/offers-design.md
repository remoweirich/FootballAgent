# How offers are generated — current rules

Written up so the rules can be argued with. This describes the code **as it stands today**
(pre-change), not a proposal. Companion to `reputation-design.md`.

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
attract  = (10
            + min(20, league apps this season) × 0.5     →  0 … +10
            + (transfer-listed ? 22 : 0)
            + morale case bonus                          →  see below
           ) × perfValueMult
chance   = min(0.26, 0.02 + attract / 320) × scarcity
```

**`perfValueMult`** — recent season rating (this season if ≥10 apps, else last season):

| rating | multiplier |
|---|---|
| > 8.00 | ×1.25 |
| > 7.50 | ×1.15 |
| > 7.24 | ×1.08 |
| else | ×1.00 |

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

| ability | 0 apps | 10 apps | 20 apps | 20 apps, hot (7.5+) | 20 apps, hot, listed |
|---|---|---|---|---|---|
| 55 | 5.1% | 6.7% | 8.3% | 9.2% | 17.1% |
| 65 | 5.1% | 6.7% | 8.3% | 9.2% | 17.1% |
| 70 | 4.6% | 6.0% | 7.4% | 8.3% | 15.4% |
| 75 | 3.5% | 4.5% | 5.6% | 6.2% | 11.6% |
| 82 | 2.5% | 3.2% | 4.0% | 4.4% | 8.2% |
| 86 | 1.5% | 2.0% | 2.5% | 2.8% | 5.1% |
| 92 | 1.5% | 2.0% | 2.5% | 2.8% | 5.1% |

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
the same rate.

---

## 3. Who is allowed to bid

Candidate clubs must clear every one of these:

1. not his current club
2. `club.reputation` within **[ability − 6, ability + 16]**
   — widened to **[ability − 14, ability + 16]** if he is transfer-listed
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

Then a **uniform** pick inside the chosen pool. Nothing weights a bigger or better-matched club
above a worse one — among the 298 clubs eligible for a 55, every one is equally likely.

---

## 4. How many clubs bid at once

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

## 5. Then he goes quiet

After any bidding round:

```
_txOffersFrom = now + (ability >= 80 ? 18–35 weeks : 7–15 weeks)
```

This is the real reason the elite see so few bids — it stacks on top of `scarcity`. An 84-rated
star who draws one bid can be untouchable for most of two windows.

---

## 6. What the offer says

Three numbers, all computed at the moment the mail is created.

### Fee — `estimateFee(p, buyer)`

```
value = 380 × 1.15^ability                       steep in current ability
      → soft-capped:  300m × v / (v + 317m)      asymptote ~€300m
      × (1 + potGap × 0.045 × potWeight × potentialConfidence)
      × ageMult
      × perfValueMult                            up to ×1.25
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
     × perfWageMult                           >8.00 → 1.60, >7.50 → 1.25, >7.24 → 1.10
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

## 7. Free agents

A separate, much simpler path. Caps: fewer than **2** pending offers, then a flat **50%** per
rollable week — no form, no apps, no scarcity, no cooldown.

Candidate clubs: rep within **[ability − 10, ability + 14]**, no positional clash, no duplicate
offer. Fee is 0; the mail is a contract offer.

A free agent is therefore approached *far* more often than a contracted player of the same
ability — 50% a week against ~5–8%.

---

## 8. Loan offers

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

## 9. Touting him yourself — `shopPlayer`

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

## 10. Things worth questioning

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
2. **The mid-range is flat.** 55 through 72 all sit at ~1 bid per season. Ability barely changes
   how sought-after a client is until the scarcity tiers kick in at 68+.
3. **The affordability filter never fires** (§3). It reads as a safeguard and is actually inert.
4. **Appearances are capped at 20** and worth at most +10 on a base of 10 — a full season of
   football and a half-season are nearly the same signal.
5. **Buyers are picked uniformly.** A 55-rated journeyman is as likely to be approached by the
   best of his 298 eligible clubs as the worst. There is no "clubs that need your position" or
   "clubs chasing promotion" pull.
6. **Free agents get ~10× the interest** of a contracted player of the same ability (§7), and the
   free-agent path ignores form, age and appearances entirely.
7. **Elite clients go very quiet.** `scarcity` ×0.30 and an 18–35 week cooldown compound; 0.53
   bids per season for a 90 may be too few for the client you worked hardest to get.
8. **Nothing models squad need.** A club with four keepers bids for a keeper as readily as a club
   with none.
9. **No European-competition pull.** Qualifying for the Champions League does not make a club
   more active in the market.
10. **Potential is invisible to the bid roll.** `bigUpside` adds a *suitor* once a bid is already
    happening, but a 19-year-old with 95 potential is no likelier to be approached than a 19-year-old
    with 60.
