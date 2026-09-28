# Agency reputation — design spec

Agreed 2026-09-28. This is the authority for how agency reputation moves. If the code and this
document disagree, one of them is a bug.

Not to be confused with **club** reputation (20–95, re-derived four times a season in
`League.normalizeReputations`). This document is only about the agency's own number.

---

## 1. What reputation is for

Reputation gates which prospects will sign with you (`Agency.SIGN_CONCESSION`) and how large a cut
they concede. It is the main measure of career progress, so it has to read as *earned*.

Three principles the revamp is built on:

1. **Deterministic.** The old rule was `3 + Rng.next() * 3` — the same action paid differently every
   time, so the rule could never be learned. Every rule here is a fixed number.
2. **Proportional to the achievement.** The old rule paid the same for moving a client from a 40-rep
   club to a 41-rep one as for 40 → 90. Rewards now scale with the size of the step.
3. **No free money.** Every repeatable action that does not represent progress pays ~0, so no
   sequence of moves can be farmed. See §6.

---

## 2. Gains and losses at a glance

| Event | Amount | Code |
|---|---|---|
| Transfer completed | see §3 | `agency.js` `_finalizeTransfer` |
| Free agent placed at a club | see §4 | `agency.js` `_finalizeTransfer` |
| Sign a new client | +0.3 | `agency.js` `signPlayer` |
| A client gains ability in a week | +0.05 × points | `simulation.js` weekly tick |
| A client's ambition fulfilled | +1 | `dialogue.js` |
| See a client into retirement, bond ≥ 50, once per player | **+3** | `dialogue.js` `resolveFarewell` |
| Sponsorship deal signed | **+0.2**, max **+3 per season** | `agency.js` `acceptSponsor` |
| A client quits over morale | **−5** | `simulation.js` `MORALE.DEPARTURE_AGENCY_REP` |
| A promise deadline passes unfulfilled | **−1** | `simulation.js` `MORALE.PROMISE_BROKEN_REP` |
| A contract expires with no new club found | **−0.5** | `simulation.js` season rollover |

Bold = changed or added in this revamp. Everything else is unchanged.

Reputation is clamped to `[0, Upgrades.repLimit()]` on every change (`Agency.bumpRep`). It never
decays on its own — it only moves on the events above.

---

## 3. Transfers

Let **d = destination club reputation − origin club reputation**.

### 3.1 Base, by size of the step

| d | Gain |
|---|---|
| ≥ +31 | +6 |
| +26 … +30 | +5 |
| +21 … +25 | +4 |
| +11 … +20 | +3 |
| +4 … +10 | +1 |
| −3 … +3 (sideways) | +0.5 |
| −4 … −10 | +0.15 |
| ≤ −11 | +0.05 |

Bands are evaluated with open boundaries (`d >= 4`, `d > -4`, …) so there is no gap between them
even if a reputation is ever fractional. The top band is open-ended: it covers the theoretical
maximum of 75 (club reputation is clamped to 20–95) and anything a custom country could produce.

A downward move still pays something, because getting a client game time at a smaller club is
legitimate agency work — just not an achievement.

### 3.2 Destination bonus — how big the new club is

| Destination reputation | Bonus |
|---|---|
| ≥ 86 | +2 |
| ≥ 76 | +1 |

**Mutually exclusive** (an 86+ club pays +2, not +3), and **only when d ≥ +4**. Without that
condition, shuffling a client between two elite clubs pays +2.5 one way and +1.5 back — +4 a round
trip, forever. Arriving at a big club is the achievement; being parked at one is not.

### 3.3 Foreign bonus — crossing a border

| Move | Bonus |
|---|---|
| Within one country | 0 |
| Crosses a border, destination is **not** your home country | +0.1 |
| Crosses a border, destination **is** your home country | +0.05 |

Home country is `GameState.agency.homeCountry`. Bringing someone home is easier than placing them
abroad, so it pays half. Applies regardless of direction — a step down in reputation that crosses a
border still crossed a border.

### 3.4 Top-five-league bonus — **once per client, ever**

+0.5 when **all** of the following hold:

- the destination is a **tier-1** division, and
- its country's `LEAGUE_TIERS[country].elo >= 1070`, and
- the **origin** was not itself a tier-1 division of such a country, and
- this client has never been paid this bonus before.

`elo >= 1070` currently selects exactly England (1090), Germany, Spain, Italy (1080) and France
(1070), with a clean gap to the next tier (1000). Deriving it from the existing elo data rather
than naming five leagues means it survives rebalancing, and a country added through Customize slots
in on its own merit. Tier 1 is required so a move to the German fourth division does not qualify.

Both the origin check and the once-ever flag are needed:

| Sequence | Pays |
|---|---|
| Basel → Schalke → Sunderland → Paris | only **Basel → Schalke** |
| Sign a client already at Schalke, then Schalke → Sunderland | **nothing** (origin already top-5) |
| Bayern → 2. Bundesliga → Bayern | the **return leg** (his first move *into* a top-5 division) |

**Promotion never pays it.** The bonus lives in the transfer path; a club being promoted around the
client is not something the agent did.

### 3.5 Worked examples

```
Rotterdam Blue (62) -> a 78-rep club, same country
  +3     d = +16
  +1     destination >= 76
  ---
  +4.0

A 50-rep domestic club -> a 90-rep foreign top-flight club, client's first time in a big five league
  +6     d = +40
  +2     destination >= 86
  +0.1   crosses a border, destination is not home
  +0.5   first entry into a top-five division
  ---
  +8.6      the ceiling. Unreachable early: no 90-rep club wants a client you can sign at rep 12.

Ajax (85) -> a 70-rep English top-flight club
  +0.05  d = -15
  +0.1   crosses a border
  +0.5   first entry into a top-five division
  ---
  +0.65     a reputation drop but a real step up in league quality, which is the point of 3.4
```

---

## 4. Free agents

A client whose contract expired without a new club (`p.freeAgent`, `p.clubId === null`).

- Losing him to free agency costs **−0.5** at season rollover.
- Placing him at a club pays a flat **+0.2** — no band (there is no origin reputation to compare),
  and no destination-size bonus.
- He **is** eligible for the foreign (§3.3) and top-five (§3.4) bonuses, judged against his
  **last club** (`p.lastClubId`).

So the economics of letting a contract lapse:

| Outcome | Net |
|---|---|
| Placed at a club in the same country | −0.3 |
| Placed abroad | −0.2 |
| Placed abroad, and it is his first top-five division | **+0.3** |

Letting a deal run out is meant to hurt. The only way it comes out ahead is if the gamble lands
somewhere genuinely better than where he was.

---

## 5. New persisted state

| Field | Where | Purpose |
|---|---|---|
| `p.lastClubId` | player | the club he left, so a free-agent placement can still judge §3.3/§3.4 |
| `p.topFiveBonusPaid` | player | the once-per-client flag for §3.4 |
| `agency.repFromSponsors` | agency | running total for the +3/season sponsorship cap; reset at rollover |

Players and the agency are persisted wholesale, so no save-schema change is needed — each field
just needs a sane default when absent, so existing saves keep working.

---

## 6. Exploits this design closes

| Exploit | Closed by |
|---|---|
| Shuttling a client between two equal clubs for the old flat +1 | sideways pays +0.5, downward +0.15/+0.05 |
| Shuttling between two elite clubs for the destination bonus | destination bonus requires d ≥ +4 (§3.2) |
| Re-entering a top-five league repeatedly | once per client, ever (§3.4) |
| Farming promotion into a top-five league | transfers only (§3.4) |

---

## 7. Display

- **Agency tab box**: two decimals, e.g. `19.97/20`. Reputation moves in steps as small as +0.05
  (weekly development), which were previously invisible.
- **Top bar**: whole numbers, unchanged.

---

## 8. Known consequences, accepted

- **The −0.5 for expired contracts fires in bulk at season rollover.** Three contracts lapsing the
  same summer is −1.5 at once, with no warning beyond the contract dates.
- **The cap bites earlier in relative terms.** A new game starts at reputation 12 with a cap of 20
  (Home Office I, no vehicle, no property). Under the old rules two transfers hit that ceiling and
  everything beyond was discarded; under these rules it takes roughly eight, which is the intent.
  Raising the cap still requires buying a vehicle (€25k) or property (€18k).
- **−5 for a walkout is severe but earned.** A client needs 4 consecutive bad weeks to open a case,
  6 more to reach stage 2, 6 more to stage 3, then 8 weeks' grace — about half a season of warnings.
  There is no death spiral: `div4Star` has `floor: 0`, so someone will always sign. Dropping below
  15 does close off the `div3Star` tier and visibly narrows the talent pool.
- **+5 and +6 transfer bands are multi-season payoffs, not market cleverness.** A club only bids
  within `[ability − 10, ability + 14]`, a 24-point window, so a single transfer cannot produce
  d > 25. Reaching those bands means developing a player until the window itself has moved up.
