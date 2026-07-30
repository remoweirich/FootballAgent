# Negotiation Overhaul — Reconciled Implementation Spec

Reconciles `football_negotiation_system_design.md` with the existing engine
(`js/agency.js`, `ui/js/screen-negotiations.js`, `js/simulation.js` morale).
This is the build plan for Roadmap **Phase 2**. Hand each pass to Claude Code in order.

---

## 0. Decisions locked (do not re-litigate)

1. **Agent fee eats wage room, not trust.** The club commits one implicit budget per deal;
   wage (W) and agent fee (F) trade off against it. A bigger F ⇒ lower W the club will accept.
   No direct trust/morale penalty for taking a fee.
2. **The player is punished indirectly and automatically.** A suppressed wage lowers
   `wageTarget` ([simulation.js:370](../js/simulation.js#L370)), so `morale.wage` drifts down on
   its own. **No new morale hook required.**
3. **Club budget stays implicit** — extend the existing `maxClubWage` ceiling, exactly as
   contracts already work. Do **not** model `B_max` or squad wage-parity (`W_cap`).
4. **Relationship stays 0–100** (`GameState.agency.relationships`, default 55). Remap the
   design's −100..+100 thresholds; never rescale the stored value.
5. **Scope = transfer + renewal flows.** Loan (role-only) and sponsor (menu-pick) are
   unchanged — the model doesn't fit them.
6. **Contract length stays 1–6** (age/role-capped by `maxContractTerm`), not 1–5.

---

## PART A — The keystone: shared package budget

Today `evaluateTransfer` ([agency.js:738](../js/agency.js#L738)) checks wage and fee against
**independent** ceilings (`maxWage`, `maxBonus`) — you can max both. The whole overhaul rests
on making them draw from one pot.

### A.1 The tradeoff formula (minimal, matches "raise fee → lower wage")

Keep today's anchors:
- `maxWage = maxClubWage(p, club) * termFactor` (weekly; already computed in `evaluateTransfer`)
- `feeCeil = clubBonusWillingness(p, club, wage, fee)` (absolute lump-sum cap — unchanged)

Add the deduction — the fee's amortized annual cost comes out of the wage room:

```js
// NEGO.FEE_TO_WAGE (tunable, start 1.0): €1 of amortized annual fee costs ~€1 of annual wage room.
// <1.0 = the club values its lump-sum cash more cheaply than wage; >1.0 = costlier.
const feeAnnual   = (pkg.bonus || 0) / term;                 // fee spread across the deal
const effMaxWage  = Math.max(wageFloor,
                     maxWage - NEGO.FEE_TO_WAGE * feeAnnual / 52);
```

Then the money test that replaces the separate `wageOk`/`bonusOk`:
- `bonusOk = (pkg.bonus||0) <= feeCeil` (absolute lump ceiling still applies)
- `wageOk  = pkg.wage <= effMaxWage`
- counter wage = `Math.min(pkg.wage, effMaxWage)`; counter bonus = `Math.min(pkg.bonus, feeCeil)`.

Result: at **F = 0**, `effMaxWage == maxWage` (today's behavior). As F climbs toward `feeCeil`,
the acceptable wage falls — so asking a fat fee visibly costs the player wage, which then costs
his morale via A.2. The player chooses where to sit on the frontier, exactly as intended.

> Optional Champion generosity (Part C): let the profile system *raise* the pool (a lower
> `FEE_TO_WAGE` or a small `+% effMaxWage`) when the agent waives fee for wage.

### A.2 Player punishment is already wired — document, don't build

`morale.wage` drifts toward `wageTarget = clamp(30 + (wage/benchWage)·50, 20, 95)` every week.
A fee-suppressed wage ⇒ lower ratio ⇒ lower target ⇒ wage-satisfaction erodes over the
following weeks. This is the entire "Parasite is self-punishing" loop. **No code.** (Optional
sharper feedback: a one-off `morale.wage` nudge at signing if the agreed wage undershoots
`Agency.offeredWage(p, club)` by >X% — add only if playtesting shows the drift is too slow.)

---

## PASS 1 — Package Score + Plan B Threat meter

Replaces the hard round cap (`round>=4 → final`, `round>=5 → reject`) with an accumulating
threat meter seeded by relationship. This is the emergent core; ship it first.

### 1.1 Persisted negotiation state (survives reload)

Today `Nego.ctx` is **UI-only in-memory** and dies on reload; the engine is stateless per call
(round is passed in). A threat meter and concession history must persist, so store them on the
**mail** (inbox is saved). Add `mail.offer.neg`:

```json
{
  "round": 1,
  "threat": 0.0,
  "profile": "NEUTRAL",
  "wInitial": 60000,                 // club's opening proposedWage — the R_wage denominator
  "history": [{ "w": 72000, "f": 300000 }]   // prior USER offers, newest last (for V_concess)
}
```

Initialize lazily in `Nego.proposePackage` / `Nego.negRenewWage`; read/write it there and in the
`Agency.evaluate*` functions (pass `neg` in, mutate, return). Keep `Nego.ctx` for transient
slider values only.

### 1.2 Threat init & accumulation (remap of design §2.2 + §5.1 to 0–100 rel)

```
threatInit(rel):   rel >= 78 -> 0 ;  30 < rel < 78 -> 8 ;  rel <= 30 -> 30
threatAccumMod(rel): rel >= 78 -> 0.7 ; neutral -> 1.0 ; rel <= 30 -> 1.5

each round (after evaluate, before accept check):
  neg.threat += NEGO.THREAT_BASE(=8) * profileMod * threatAccumMod(rel)
  if neg.threat >= 100 -> WALKOUT: status:'walkout', relationship -20, club signs alternative,
                          mail "we've moved on", clear the offer.
```

Keep a hard safety cap (`round >= 8`) so nothing loops forever. `profileMod` comes from Pass 2
(default 1.0 until then).

### 1.3 Package Score (design §3.1, lightweight)

Don't build a separate weighted scorer — the ceilings already encode value. Expose one number
for dialogue/threat tuning:

```
moneyUse = (pkg.wage*52 + (pkg.bonus||0)/term) / (effMaxWage*52 + feeCeil/term)   // ~1.0 at the frontier
```

Accept when `moneyUse <= 1` AND role acceptable. `>1` drives counter/close as today.

### 1.4 Touch list (Pass 1)
- `Agency.evaluateTransfer` — add `effMaxWage` (A.1), accept `neg`, run threat, return
  `walkout` status. Drop the `round>=5` reject.
- `Agency.negotiateWage` (renewal) — same threat model; drop the `round>=5` reject.
- `Agency.acceptTransfer` / `acceptRenewal` — relationship delta on conclusion (see §C.3).
- `ui/js/screen-negotiations.js` — `proposePackage`, `negRenewWage`: init/pass `neg`, render a
  **threat/tension cue** (the club's patience) and handle the `walkout` result.

---

## PASS 2 — Profile classifier + frontier tuning

The 2×2 (design §4). With A.1 in place, profiles no longer gate money or trust — they modulate
**threat velocity, dialogue tone, and end-of-deal relationship** only.

### 2.1 Metrics (design §3.2), computed from `neg`

```
R_greed  = (F / term) / (W * 52)          // amortized fee vs annual wage
R_wage   = W / neg.wInitial               // how far above the club's opening wage
V_concess= movement toward club's last counter across neg.history (0 = stubborn, 1 = met them)
```

### 2.2 Profiles → effects (reframed; no hidden money/trust penalty)

| Profile | Trigger (tune) | Effect here |
| :-- | :-- | :-- |
| **Parasite** | `R_greed > 0.25 && R_wage < 1.15` | `profileMod = 1.0`. Dialogue nudges "focus on his take-home." Rel delta **0**. (Self-punishing via A.2.) |
| **Champion** | `R_greed < 0.08 && R_wage > 1.25` | Club flexes the pool: `FEE_TO_WAGE ×0.85` or `effMaxWage +8%`. `profileMod = 0.5`. Rel **+6** on signing. |
| **Wildcat** | `R_wage > 1.35 && R_greed > 0.20 && V_concess < 0.1` | `profileMod = 3.0` (rapid walkout). Early hard ultimatum. Rel **−6**. |
| **Optimizer** | `term matches club pref && V_concess >= 0.3` | `profileMod = 0.6`. Clearer numeric hints in dialogue. |

Non-matching = `NEUTRAL`, `profileMod = 1.0`.

### 2.3 Touch list (Pass 2)
- New `Agency.classifyOffer(p, club, pkg, neg)` → `{ profile, rGreed, rWage, vConcess }`.
- Wire `profileMod` into Pass 1's threat step; apply Champion's pool flex in A.1.

---

## PASS 3 — Data-driven dialogue matrix

Design §7.2, using the existing workbook pipeline (consistent with `dialogue_lines.xlsx` →
`scripts/parse-dialogue-xlsx.mjs` → `js/dialogue-data.js`).

- New sheet `nego_lines`: columns `profile`, `threat_band` (low/med/high), `context`
  (transfer/renewal), `text`.
- Extend `parse-dialogue-xlsx.mjs` to emit a `negoLines` block; add a lookup
  `Agency.negLine(profile, threatBand, context)` with a safe fallback to today's inline strings.
- Replace the hard-coded `message` strings in `evaluateTransfer`/`negotiateWage` with lookups.
- **Writing style:** em dashes only rarely (see `[[writing-style]]` memory); club lines are
  terse and businesslike, warmer as relationship rises (mirror `greetingFor`).

---

## Relationship deltas at conclusion (design §5.2 → 0–100)

Same magnitudes, clamped 0–100 via `changeRelationship`:

```
AGREEMENT:  Champion +6 · Parasite 0 · Wildcat -6 · Neutral +2 ;  + fast-deal (rounds<=2) +4
WALKOUT:    -20
ULTIMATUM_REJECTED (club gave 'final', user re-pushed then it collapsed): -15
```
Parasite is **0**, not negative — per decision 1, the fee doesn't burn the bridge; the wage
tradeoff already did the work. Wildcat's penalty is for arrogance/non-credibility (behavior),
not the fee.

---

## Files touched (whole overhaul)

- `js/agency.js` — `evaluateTransfer`, `negotiateWage`, `acceptTransfer`, `acceptRenewal`,
  new `classifyOffer`, `negLine`, `NEGO` constant block.
- `ui/js/screen-negotiations.js` — `neg` state plumbing, threat/tension UI, walkout handling.
- `dialogue_lines.xlsx` + `scripts/parse-dialogue-xlsx.mjs` + `js/dialogue-data.js` (Pass 3).
- `js/simulation.js` — **no change** (wage-morale link is already there); optional signing nudge.
- Tests: extend `tests/` with a negotiation suite (frontier tradeoff, threat walkout, profile
  classification, relationship deltas).

## Explicitly unchanged
Loan & sponsor flows · 0–100 relationship scale · 1–6 term range · `wageCommission`/
`sponsorCommission` income model · morale dims `{club,time,wage,agent}`.

## Open calibration constants (playtest to tune)
`NEGO.FEE_TO_WAGE` (1.0) · `THREAT_BASE` (8) · `threatInit`/`AccumMod` bands · profile triggers
(§2.2) · Champion pool-flex size · relationship deltas.
