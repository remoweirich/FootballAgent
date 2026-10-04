# Scouting revamp — design plan

Three changes, in the order they should be built:

1. **The scout card** — move everything except the glanceable facts off the list and into a
   player-card-style detail screen with Overview / Assignment / History tabs.
2. **Contract negotiation on hire** — pick a minimum term, trade length against wage, pay to
   break it early.
3. **Age, growth and decline** — scouts have an age, get better, get worse, and retire.

Parts 2 and 3 both touch the scout data shape, so the migration is written once and covers both.

---

## 0. What exists today

| Thing | Where |
|---|---|
| Scout engine (hire, assign, brief, release, weekly `tick`) | [js/scouts.js](../js/scouts.js) |
| Scouting screen — Finds / Your scouts / Hire tabs | [ui/js/screen-scouting.js](../ui/js/screen-scouting.js) |
| Weekly wage drawn from the balance | [js/agency.js:1705](../js/agency.js#L1705) `weeklyExpenses()` |
| Weekly scout work, report mails | [js/simulation.js:243](../js/simulation.js#L243) |
| Save migration pipeline | [js/game-state.js:386](../js/game-state.js#L386) `SCHEMA_VERSION` / `MIGRATIONS` |
| Tutorial drives the scouting UI by CSS selector | [ui/js/walkthrough.js:414-427](../ui/js/walkthrough.js#L414-L427) |

A scout is a plain object on `GameState.agency.scouts`:

```js
{ id, name, title, quality, weeklyCost, region, league, country,
  weeksUntilFind, maxTalentAge, targetPos, targetTier }
```

`Your scouts` currently renders all of that inline: two info boxes, five dropdowns and four
buttons per scout. With the office upgrades allowing up to 12 scouts, that screen is unusable
long before you get there. That is the problem part 1 solves.

---

## 1. The scout card

### 1a. The collapsed list (`Scouting → Your scouts`)

Each scout becomes one tappable row — same shape as a client row on `Clients`, so the gesture is
already learned — linking to `#scout/<id>`. Nothing is editable on the list.

```
┌──────────────────────────────────────────────┐
│ Lukas Ferrari                    43y    ⟨52⟩ │
│ Senior scout                                 │
│ Scouting Ostschweiz                          │
│ €960/wk  ·  next report in 1w                │
└──────────────────────────────────────────────┘
```

Shown: name, role title, ability badge, age, status, wage, next report. Status is one of

- `Scouting <region>` — domestic assignment
- `Scouting <league> (<country>)` — international assignment
- `Roaming` — no assignment

"Roaming" replaces today's "Unassigned"/"Idle". An unassigned scout is not actually idle: he has a
3%/week chance of a stray find anywhere in the home country ([js/scouts.js:385](../js/scouts.js#L385)),
and "Roaming" says that where "Idle" actively contradicts it.

Everything else — region picker, league picker, view clubs, max talent age, target position,
target level, recall, release — leaves the list.

### 1b. The card

New screen, registered exactly like the client card so the hardware back button needs no changes:

```js
Router.register('scout', { isMain: false, parent: 'scouting', title: ..., render ... });
```

Header mirrors [ui/js/screen-client-detail.js:39-47](../ui/js/screen-client-detail.js#L39-L47)
one element at a time — a client has `name / nationality · position · age / club · league / badge`,
a scout gets:

```
Lukas Ferrari                                           ⟨52⟩
Senior scout  ·  43y
Scouting  ·  Ostschweiz
```

Then a sticky tab bar: **Overview · Assignment · History**. A fresh navigation always lands on
Overview (`Router.isFreshNav`), while `Router.refresh()` after an in-screen action leaves the tab
alone — the same rule the client card uses, and the reason its dropdowns don't snap back.

#### Overview tab

A four-box `info-grid`, matching the client card's Wage / Role / Contract / Status exactly:

| Box | Content |
|---|---|
| Wage | `€960/wk` |
| Contract | remaining minimum term — **years if > 52 weeks left, weeks if ≤ 52**, `Expired` at zero |
| Role | `Senior scout` |
| Region | `Ostschweiz`, or `Premier League (EN)` abroad, or `—` while roaming |

Below it, three buttons:

- **Create assignment** — switches to the Assignment tab. Hidden (not merely disabled) while he
  has an assignment, since Recall occupies that slot instead.
- **Recall from assignment** — cancels immediately, stays on Overview. Hidden while roaming.
- **Release scout** — opens a confirm modal (`Router.modal`, `data-back="close"` so hardware back
  cancels rather than confirms). The modal states the termination fee when one is owed.

#### Assignment tab

Reached either by the tab or by **Create assignment** — identical behaviour, the button only
switches tab.

```
Scope          [ Domestic ▾ ]            ← default Domestic

── domestic ──                  ── international ──
Region  [ Ostschweiz — €2,780/report ▾ ] Country [ Germany ▾ ]
  (eye) View clubs                       League  [ 2. Bundesliga — €9,620/report · needs 60 ▾ ]
                                           (eye) View clubs

── both ──
Max talent age   [ 19 ▾ ]
Target position  [ Any ▾ ]
Target level     [ top-division talent ▾ ]

        [ Set assignment ]
```

- Choosing **International** without a licence replaces the whole block with one line:
  *"Buy an International Scouting Licence (ISL) from the Agency tab to send scouts abroad."*
  No dropdowns, no button. If the licence lapsed and international scouting is *suspended*
  ([js/scouts.js:219](../js/scouts.js#L219)), that gets its own line instead — the existing
  suspension message, which is a different problem with a different fix.
- **View clubs** reuses `ScoutingScreen.showRegionClubs`; the international variant needs a new
  sibling listing `Clubs.getClubsByDivision(div)`, which is new behaviour — today you can only
  preview domestic regions.
- Once set, **every** control on the tab renders `disabled` and the button becomes
  **Recall from assignment**. That is the requested lock, and it has one consequence worth
  naming: re-briefing a working scout (just changing his target position, say) now costs a
  recall, and a recall resets `weeksUntilFind`. So changing your mind mid-search throws away the
  progress toward the next report. I think that is the right price — a brief you can flip for
  free every week isn't a brief — but it is a real change from today.
- The old **Reassign** button disappears. Changing region = Recall, then Set assignment.

#### History tab

An ability graph over the scout's career, via the same `UI.xyChart` the client's Development tab
uses ([ui/js/screen-client-detail.js:589](../ui/js/screen-client-detail.js#L589)), with age on the
x-axis and a 5-point y-grid.

This needs `scout.history.ability = [{ t: absWeek, value }]`, appended on every birthday where
ability changes, seeded with one entry at hire. Scouts on an existing save have no history, so
their graph reads *"No development recorded yet"* until their first birthday under the new build —
the same wording the client card already uses for a just-signed youngster.

### 1c. Title is now derived, not stored

`titleFor(quality)` already exists and the hire market already calls it. But `s.title` is frozen
at hire, so once part 3 lets ability move, a scout who grows from 51 to 55 would still read
"Lead scout" forever.

Fix: compute the title from current quality at render time, everywhere. `s.title` stays on the
object (old saves, the walkthrough's hardcoded demo scouts) but becomes display-only legacy.
The existing ladder is unchanged and already matches your example — 52 → Senior scout:

| Quality | Title |
|---|---|
| 70+ | Chief scout |
| 52–69 | Senior scout |
| 34–51 | Lead scout |
| 22–33 | Regional scout |
| < 22 | Local talent spotter |

---

## 2. Contract negotiation on hire

### The ladder

`Hire` no longer hires. It opens a negotiation sheet listing six minimum terms, each with its
weekly wage:

| Term | Weeks | Wage vs. 1 year |
|---|---|---|
| 3 months | 13 | **+30%** |
| 6 months | 26 | **+15%** |
| 1 year | 52 | — *(default selection)* |
| 18 months | 78 | **−5%** |
| 2 years | 104 | **−12%** |
| 3 years | 156 | **−20%** |

Plus a per-term random deviation of about ±4 percentage points, so the ladder is approximate
rather than a lookup table the player memorises. For the 52-rated scout in your example:

```
3 months   €1,250/wk      €16k over the term
6 months   €1,100/wk      €29k
1 year       €960/wk      €50k      ← default
18 months    €910/wk      €71k
2 years      €845/wk      €88k
3 years      €770/wk     €120k
```

The trade reads clearly: the long deal is cheaper every week and far more money committed.

**The deviation must be rolled once, at `makeOffer` time, and stored on the offer** as a
`quotes: { '13': 1250, '26': 1100, ... }` table. Rolling it at render time would reshuffle every
price each time the sheet repaints or the screen refreshes.

The market list keeps showing the 1-year wage, so the headline price is unchanged.

Beneath the ladder, an explanatory line:

> A minimum contract is what you owe him, not how long he stays. Release him before it runs out
> and you pay off the rest of the deal. Once it expires he keeps working for you — you can just
> let him go for nothing.

### Termination

- `scout.contractWeeks` = term length, `scout.contractUntil` = `absWeek() + term`.
- Remaining = `max(0, contractUntil - absWeek())`.
- Release while remaining > 0 ⇒ a termination fee, charged to the balance and logged to
  Finance under a new `Scout payoff` line.
- Release at remaining = 0 ⇒ free. The scout is **not** auto-released at expiry; he keeps working
  at the same wage indefinitely.
- The confirm modal always names the fee, or says there is none.

**Fee formula: the full remaining wages** (decided — see section 7). That is the only
figure that makes the commitment real, it needs no explaining, and it is self-balancing — the
early game's scouts cost nearly nothing a week (a quality-15 scout's wage rounds to ~€0), so the
fee only bites once you're hiring Chief scouts, by which point you can read the number before you
sign. The risk is a player who signs a 3-year chief scout for the discount, sours on him in month
two, and discovers he owes €1.2M.

### Compatibility

`Scouts.hire(offer, termWeeks)` — `termWeeks` defaults to 52 so the two existing callers
([tests/test_walkthrough.js:150](../tests/test_walkthrough.js#L150) and the market button) keep
working without a signature break.

---

## 3. Age, growth, decline, retirement

### Age at hire

`makeOffer` rolls an age in **25–60**, **loosely correlated with quality** (decided), so a
99-rated 26-year-old Chief scout is possible but unusual and most elite scouts read as
experienced. Age has no effect on wage.

### The curve

| Age | Per year |
|---|---|
| 25–34 | **+2** ability |
| 35–54 | **+1** ability |
| 55–64 | flat |
| 65–69 | **−1** |
| 70–79 | **−2** |
| 80–84 | **−3** |
| 85 | retires |

Total growth is capped at **+15 above his hire ability**, which is the binding constraint, not the
bands: a scout hired at 25 maxes out at ~32 and then coasts for 33 years. A scout hired at 40
reaches the same +15 at 55. Either way every scout has a peak, a long plateau, and a decline.

Decline is uncapped by comparison — 65→85 is **−40** — so a scout you keep to the end becomes
genuinely useless, which is the point: it creates the decision to let him go. Clamped to a floor
of 5 so the quality never goes negative.

Ability changes **never** change the wage. He is paid what he negotiated.

### Mechanics

Scouts get a `birthWeek` like players, so they age on their own week rather than all at once, and
the existing player-aging line at [js/simulation.js:175](../js/simulation.js#L175) is the model.

A new `Scouts.ageTick()`, called from the scout block in `Simulation`, returns a list of notes for
the caller to mail — rather than extending `Scouts.tick()`'s return shape, which `Simulation`
and the licence tests both read. It:

1. ages any scout whose `birthWeek` is this week,
2. applies growth or decline, clamped,
3. appends to `history.ability` if the value moved,
4. at 85, removes him and emits a retirement mail.

### Two knock-on consequences

- **Retirement mid-assignment.** He is simply removed; the assignment dies with him. The mail
  should say which region or league is now uncovered, so you aren't silently blind for six weeks.
- **A declining scout drops below his league's minimum quality.** `minScoutQualityFor` gates
  *taking* an international assignment but nothing re-checks it afterwards, so a scout who decays
  from 61 to 55 keeps working the Premier League forever. Resolved by degrading his finds rather
  than recalling him — see section 7.3.

---

## 4. Data model

New fields on a scout:

| Field | Type | Meaning |
|---|---|---|
| `age` | 25–60 at hire | current age |
| `birthWeek` | 1–52 | the week he ages |
| `hireQuality` | int | the +15 growth cap's baseline |
| `contractWeeks` | int | negotiated minimum term |
| `contractUntil` | absWeek | expiry; remaining = `max(0, until − now)` |
| `history.ability` | `[{t, value}]` | the History graph |

New fields on a market offer: `age`, `birthWeek`, `quotes`.

### Migration

A `{ to: 4 }` entry in `MIGRATIONS`, bumping `SCHEMA_VERSION` to 4:

- **Age** — scouts on an old save have none. Roll one in 25–60 using the same
  quality-correlated draw as a fresh offer, plus a `birthWeek`. Their recorded ability becomes
  their `hireQuality`, so they can still grow +15 from where they are.
- **Contract** — set `contractUntil = absWeek()`, i.e. **already expired**. Free to release. The
  alternative is retroactively handing every existing scout a 1-year deal the player never
  agreed to, which would charge a fee for a decision they didn't make.
- **History** — seed one entry at the current week and ability, so the graph has an anchor.
- **Persisted market offers.** `ag.scoutMarket` is saved, so a loaded save can hold offers with no
  `quotes` or `age`. Those have to be lazily filled on read, not just in the migration — the same
  problem the walkthrough's hardcoded `DEMO_SCOUTS` has ([ui/js/walkthrough.js:237](../ui/js/walkthrough.js#L237)),
  so one `_ensureOffer(o)` helper covers both.

---

## 5. What this breaks

### The walkthrough

The tutorial drives the real UI by CSS selector, and both scouting steps are aimed at markup that
is about to move:

| Step | Breaks how | Fix |
|---|---|---|
| `wt.scout.hireGemma` taps `[data-scout="wt_harris"] button` | the tap now opens the negotiation sheet instead of hiring | keep the selector, add a following step for the sheet's confirm button, and narrate the contract choice — it's a mechanic worth teaching |
| `wt.scout.assign` waits for a scout with `region === 'west-midlands'` | the region picker no longer exists on `Your scouts` | re-aim at the scout card: tap the row, then the Assignment tab. The `until` guard still works unchanged |

Also worth fixing while in there: `_briefGemma()` ([ui/js/walkthrough.js:517](../ui/js/walkthrough.js#L517))
sets `sc.position` and `sc.tier`, but the engine reads `targetPos` and `targetTier`. Her brief has
never actually applied — the tutorial says "any position, top-division, nobody over 19" and only
the age takes effect. Pre-existing, unrelated to this work, two words to fix.

### Tests

- `tests/test_scoutlicence.js:28` builds a scout literal by hand. It needs the new fields only if
  `ageTick` runs in that harness; defensive defaults keep it green either way.
- New: `test_scout_contracts.js` — the wage ladder is monotonic in term length, the fee equals the
  remaining wages, expiry zeroes it, release at expiry is free, `quotes` are stable across
  repeated reads.
- New: `test_scout_growth.js` — +15 cap holds from `hireQuality`, each decline band applies at the
  right age, retirement fires exactly at 85 with a mail, `history.ability` only grows when the
  value moves, the floor clamps.
- New: `test_scout_card.js` — tab routing, and that an assigned scout's Assignment controls all
  carry `disabled`.

A DOM-stub test proves the markup, not the render — that was the lesson from the language picker,
which passed its stub test the whole time it was invisible behind a z-index. So the card also gets
a headless-Chrome pass: a real screenshot of the card at phone width with a scout assigned, to
confirm the tabs, the locked controls and the graph actually paint.

### Translation

Seven complete languages × four layers. New strings land in the engine pack
(`js/i18n-<loc>.js`) for the mail and action messages, and the UI pack (`ui/js/i18n-<loc>.js`) for
the card. Estimate ~35 new keys:

- 6 term labels, the explanatory paragraph, the fee line, the release confirm
- Scope/Domestic/International, the ISL line, Set assignment / Recall / Create assignment
- Overview box labels, Roaming, Contract/Expired, the three tab names
- retirement mail subject + body, the "no development recorded" line

Register rule holds: the mails are written correspondence and stay formal; nothing here is spoken
dialogue.

---

## 6. Build order

1. **Scout card, no behaviour change.** Move the existing controls into the new screen, collapse
   the list, derive the title live. Fully playable at this point, nothing new to balance.
2. **Contract negotiation.** Engine first (`quotes`, `contractUntil`, the fee, `hire` signature),
   then the sheet, then the release modal.
3. **Age and the curve.** Migration, `ageTick`, the History tab, the retirement mail.
4. **Walkthrough re-point**, full suite, headless render check, build.

Each step is a commit that leaves the game working.

---

## 7. Decisions

Settled 2026-10-04:

1. **Termination fee — the full remaining wages.** Remaining weeks × weekly wage, no cap. The
   release confirm modal must therefore always print the figure prominently, because a 3-year
   Chief scout payoff runs past €1M and the player has to meet that number before confirming,
   not after.
2. **Age at hire — loosely correlated with quality.** Elite scouts skew older. Accepted side
   effect: a top scout is usually bought near his plateau, so the +15 growth is mostly something
   you get from developing a cheap young scout rather than from a marquee signing. That makes the
   young-and-promising scout a genuine strategy instead of a strictly worse buy.
3. **Decline below a league's minimum — degrade his finds, don't recall him.** No interruption,
   no mail. Implementation: international finds already run at
   `effQ = min(99, quality + leagueQualityBonus(league))` ([js/scouts.js:407](../js/scouts.js#L407));
   when `quality < minScoutQualityFor(league)`, subtract a penalty scaled to the shortfall before
   the league bonus applies, so a scout who decays from 61 to 55 in a league needing 60 keeps
   working but turns up visibly worse players.

   One addition, since the chosen option's weakness is that the player gets no signal: the
   scout card's Overview shows a quiet note under Region — *"below the standard for this
   league"* — when the gap is open. No mail, no forced action, but the information is
   findable rather than invisible. The player can then choose to move him or keep him.
