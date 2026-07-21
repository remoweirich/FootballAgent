# Client Relationships & Dialogue — Design Document

Status: PROPOSAL (not yet implemented). Mechanism-level design, no code.

## Why this feature

Today every client interaction is a one-way mail or a button with a result banner. The player
reads *about* their clients; they never talk *to* them. The fix is not "more text" — it is a small
set of interlocking systems that make each client feel like a person you know:

1. a **dialogue scene engine** (short chat-style conversations with choices),
2. **personality** (each client has a voice and temperament that changes what works on him),
3. a **bond** score (career-long trust, distinct from weekly morale),
4. a **facts ledger** (things he told you, which the game remembers and pays off later).

Everything the user asked for (complaint talks, final-day promises, parties, retirement farewells,
favourite clubs, thank-you gifts, language courses) hangs off these four.

---

## Pillar 1 — The dialogue scene engine

A **scene** is a short conversation: 2–4 exchanges, chat-bubble UI, played full-screen like the
Attend invitations. Each beat is: client line → 2–4 reply choices → client response → (optional)
effect. Hard cap ~6 bubbles per scene; this is a football game, not a visual novel.

- **Data-driven**, like the live-sim workbook: line templates with slots (`{club}`, `{opponent}`,
  `{goals}`, `{agentName}`, `{firstName}`), organized in pools per (scene type × personality ×
  bond tier). The engine picks, fills, and tracks recently-used line ids so nothing repeats within
  a season.
- **Choices are not cosmetic and not obviously ranked.** The "right" answer depends on the
  client's personality (see Pillar 2). A hothead needs calming; hype him up and he storms out.
  A showman WANTS the hype. You learn what works by knowing your client — that is the skill loop.
- **Effects land on existing systems**: morale dims, the moraleCase stage, promises (the existing
  deadline machinery), bond (new), plus occasional money/reputation.
- **Pacing**: bubbles appear with the same "commentator" cadence as the live-sim lines (typing
  indicator, then the line). Skippable, like the live sim.
- UI: full-screen sheet, client's flag + initials as avatar, name header, choices as buttons
  pinned at the bottom. One scene at a time, queued if several trigger the same week.

## Pillar 2 — Personality

Each player gets a persistent **personality profile**, rolled at generation (and lazily for
existing saves):

| Axis | Poles | Mechanical bite |
|---|---|---|
| Temperament | hothead ↔ professional | hotheads escalate moraleCases faster, need "calm" replies; professionals resent flattery |
| Ego | showman ↔ humble | showmen want hype and public praise, love big sponsors; humble players prefer quiet loyalty |
| Roots | homebody ↔ adventurer | homebodies suffer abroad (see settling-in), dream of the boyhood club; adventurers get restless staying too long |
| Money | loyal ↔ mercenary | mercenaries respond to wage promises and bonuses; loyal players respond to respect and long deals |

- One primary trait + one secondary, so ~12 distinct voices — enough variety, small enough to
  write good line pools for.
- Personality is **hidden at signing** and revealed through interactions (each scene reveals a
  hint; a high-quality scout or a "get to know him" check-in reveals it faster). Shown on the
  client page once known: *"Hothead · Homebody"*.
- Personality also modulates existing systems: gift reception, morale decay rates, retirement
  postponement odds, willingness to move abroad, transfer-request likelihood.

## Pillar 3 — Bond (career-long trust)

`bond` 0–100 per client, separate from `morale.agent`:

- **Morale.agent** = his current mood about you (fast, weekly, already exists).
- **Bond** = everything you have been through together (slow, mostly earned at big moments,
  hard to lose, survives bad patches).

Earned by: kept promises (+), attended finals (+big), landing his dream move (+huge), gifts at
the *right* moment (+), consoling after a relegation/final defeat (+), years of service (+1/season).
Lost by: broken promises (−big), ignoring him for seasons (−), forcing moves he hated (−).

**Bond tiers unlock relationship behaviour** (the payoff):

| Tier | Name | What changes |
|---|---|---|
| 0–24 | Business | baseline — today's game |
| 25–49 | Trusted | he tells you his facts (favourite club, ambition) unprompted; complaint scenes start one stage calmer |
| 50–74 | Confidant | **player-initiated warmth**: thank-you gifts after big moments, invites you to his wedding, tips you off before agitating |
| 75–100 | Family | **referrals** (recommends a teammate as a new client lead), accepts lower commission without grumbling, will follow your advice against his own morale once per season, retirement testimonial invites you as guest of honour |

Bond is displayed as a subtle heart/handshake meter on the client page — visible progress is the
retention hook.

## Pillar 4 — The facts ledger ("what you know about him")

A per-client list of discovered facts, shown on his page and **referenced later by the game**:

- **Favourite club** (rolled at generation, biased to his home country's big clubs, occasionally
  his current club = boyhood-club story). Get him transferred there → dedicated thank-you scene,
  +huge bond, and the fact is marked *fulfilled* ("You made his dream move happen, 2027").
- **Ambition** (one of: play in a top-5 league, win a title, win a cup, play in Europe, reach N
  career goals, captain a club, play abroad, finish career at boyhood club). Becomes a visible
  goal on his page; fulfilling it = spotlight + bond; ignoring it for years feeds quiet
  resentment for adventurers/showmen.
- **Family status** (single / partner / kids — affects moves abroad and party scenes).
- **Hobby / superstition** (pure flavour + occasionally the right gift: give the golfer a golf
  weekend = gift lands as one tier higher).

Facts are discovered via the **Check in** action (Pillar 5A) or volunteered at bond thresholds.
This is the "the game remembered!" engine — every later scene template can reference known facts.

---

## The scenes (organized catalogue)

### A. Check in (player-initiated small talk) — the everyday verb
New action on the client page: **"Check in"**. One short scene: how's life, one question choice
(ask about family / ambitions / favourite club / the dressing room / nothing in particular).
- Reveals facts and personality hints; tiny morale.agent bump; resets the neglect clock
  (`_creditAgentAction` already exists for this).
- Cooldown ~3–4 weeks per client ("he's in the middle of training blocks") and diminishing
  returns, mirroring the gift anti-spam design — so it cannot be farmed.

### B. Complaint talks (upgrade of moraleCase stage 1)
Today a stage-1 case is a card with a "Make a promise" button. It becomes a scene:
- He states the complaint in his own voice (per personality).
- Choices: **listen** (safe, small calm), **promise** (opens the existing promise with deadline —
  unchanged machinery), **push back** ("you're wrong and here's why" — works on professionals at
  high bond, backfires hard on hotheads), **deflect** (buys 2 weeks, small resentment).
- Stage 2 ("demanding action") gets a tenser scene with fewer safe options. Stage 3 stays as-is —
  by then talking is over, which itself teaches the escalation system.
- Kept/broken promises get a 2-line follow-up scene instead of today's plain mail.

### C. Final-day rituals (wraps the existing Attend flow)
- **Pre-match** (fires when you tap Attend, before kickoff): dressing-room word with your client.
  Choices: calm / fire up / **promise a win bonus** (pick gift tier now; if they win, it auto-gifts
  at +50% effect and no diminishing penalty — "earned" gifts land better; if they lose, no cost).
  NO effect on the match result — the timeline is already banked and must stay deterministic.
  The effect lands on post-match morale/bond only. (Optionally a cosmetic nod: the live-sim
  choreographer may pick him for one extra narration line — flavour, not stats.)
- **Post-match, win**: party scene. Champagne, his key stat quoted from the actual timeline
  ("two goals in a final!"), choice: toast him publicly (showman++) / quiet word (humble++) /
  pick up the tab (−€, +bond). Trophy + attended + party = the biggest bond event in the game.
- **Post-match, loss**: consolation scene. Sit with him / give space / "we go again" speech.
  Right choice per personality converts a morale hit into a bond gain — losing together bonds
  harder than winning, if handled well. That's the football truth worth encoding.

### D. Career-arc moments (auto-triggered scenes, queued at week advance)
Fired from events the engine already tracks (stats, transfers, retirement):
- **First professional contract** (the promotion-to-senior flow just built) — short proud scene.
- **Debut / first senior goal / hat-trick** — match ball scene, one choice, small bond.
- **Milestones**: 100/250/500 apps, 50/100/200 goals — already in the records system; now each
  gets a 2-beat scene and a keepsake line in the facts ledger.
- **Transfer completion day**: he calls you after signing. If it was his favourite club or
  fulfilled an ambition, the big thank-you variant plays.
- **Serious injury** (long layoff, which injuries already model): visit him. Choices: arrange a
  specialist (−€, shaves a week off recovery — small, capped), just be there (+bond), send flowers
  (neutral). Comeback match after 8+ weeks out → short "good to be back" scene.
- **Relegation / title with his club**: shared low / high moment.
- **Retirement** (replaces the plain mail): a proper multi-beat farewell — career montage from his
  actual record (clubs, caps, goals, trophies — all queryable today), his thank-you shaped by
  final bond tier, your toast choice, and at Family tier his testimonial invitation. Then one
  epilogue: at high bond he may resurface once as a **retired-player contact** (a one-time free
  scouting tip or a warm door at his old club — flavour with a small mechanical gift).

### E. Player-initiated warmth (bond ≥ 50, the reciprocity engine)
The relationship must flow both ways or it feels like a vending machine:
- **Thank-you gifts** after big moments he attributes to you (a watch, memorabilia, a holiday —
  small € or a displayed keepsake in the facts ledger).
- **Life invitations**: wedding, kid's christening (family fact required). Attend (a weekend, tiny
  cost) or send a gift; attending is the bond play.
- **Tip-offs**: at Confidant+ he warns you before opening a moraleCase ("gaffer's freezing me
  out — I'm not going public yet, but sort it") = a free week-0 stage before the machinery starts.
- **Referrals**: at Family tier, once per season at most, he recommends a teammate → that player
  becomes `knownToAgent` with a warm-intro signing bonus (relationship head start). New client
  acquisition through relationships — a genuinely new loop for the agency game.

### F. Concierge services (the agent as life-manager)
A small "Support" menu on the client page, each item costing money and feeding the new
**settling-in** mechanic for foreign transfers:
- **Settling-in**: a client who moves to a country with a different language starts "unsettled"
  for ~10–20 weeks: small morale drag and a small away-form drag (fits the existing form system).
  Homebodies suffer double; adventurers half.
- **Language course** (−€, halves settling time), **house hunting** (−€, removes the morale part),
  **fly the family over** (family fact required, big settling cut). Buying support = the agent
  doing his real job; it also earns bond.
- **Financial advisor** (small yearly −€): suppresses a rare "bad investment" news event that
  would tank a client's morale for weeks. Insurance you'll only notice when you skipped it.
- **Media training** (one-off −€): +1 sponsor slot quality tier or slightly better sponsor
  offers — ties into the existing sponsor system.

### G. Ambition contracts (light "objectives" layer)
Once an ambition fact is known, it appears on the client page with a progress hint ("Wants to
play in the Premier League — currently: Eredivisie"). No timer, no fail state except retirement.
Fulfil it → spotlight + big bond + reputation bump for the agency ("the agent who delivers").
This quietly gives every client a narrative arc the player can steer toward — the single
strongest "one more season" pull in the design.

---

## Anti-repetition & tone rules

- Line pools per (scene × personality × bond tier), slot-filled; a used-line log per client
  prevents any exact line repeating within ~30 scenes.
- Personality voice guides: hothead = short sentences, exclamation; professional = measured;
  showman = self-referential; humble = deflects praise. Written once per pool, reused everywhere.
- Rare "gem" lines (~5% roll) that reference ledger facts ("How's the golf handicap?") — cheap to
  write, disproportionate delight.
- Every scene ends in ≤6 bubbles. If a scene has no meaningful choice, it doesn't get made —
  a mail is fine for pure information.

## Economy & exploit guards

- Check-in cooldown + diminishing returns (mirror the gift design).
- Bond gains concentrated in *rare* events (finals, dream moves, farewells); everyday actions cap
  at trickle rates. Target: an attentive agent reaches Confidant with a client in ~3-4 seasons,
  Family only with a genuine career-long client.
- Win-bonus promise costs real gift money and only pays on a win — no free morale.
- Wrong dialogue choices genuinely cost (morale dips, case escalations) — reading your client
  matters, and personality knowledge is the counter.

## Persistence

Per player: `personality {primary, secondary, revealed}`, `bond`, `facts[]` (typed entries with
discovered/fulfilled state), `_scenesSeen[]` (recent line ids), `_sceneQueue[]` (pending scene
triggers), settling state on the player after a foreign move. All in the existing save shape;
lazily defaulted for old saves like declineAge already is.

## Phasing (each phase shippable alone)

1. **Foundation** — scene engine + chat UI + personality roll/reveal + bond score & tiers.
   Retrofit: complaint talks (B) and gift-reaction quotes route through scenes. The game
   immediately *feels* different with zero new content systems.
2. **The big moments** — final-day rituals (C: pre-match promise, party, consolation) and the
   retirement farewell (D). These are the emotional peaks and lean on Attend, which is fresh.
3. **Knowing them** — Check in (A), facts ledger, favourite club + dream-move thank-you,
   ambitions (G), remaining career-arc scenes (D).
4. **Reciprocity & services** — player gifts, invitations, tip-offs, referrals (E), settling-in +
   concierge menu (F).

Rough sizing: each phase is comparable to the Attend-the-Final build (engine module + UI screen +
content pools + tests). The content (line pools) is the long tail — the engine should land first
with modest pools and grow every batch.
