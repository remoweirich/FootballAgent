## v19 changes
- Adopted the updated role set in scouting.js (new play-style roles and additional country league ladders).
- Added a per-role card bias to the match engine: more aggressive roles pick up bookings faster. Biases — physical_defender 1.8, destroyer 1.7, relentless_runner 1.3, attacking_fb 1.3, pressing_forward 1.2, pace_winger 1.2, defensive_fb 0.8, dribbler 0.7; every other role is neutral (1.0).
- Suspensions: reaching 5 yellow cards in a season earns a one-match ban (and again at 10, 15, …), and a red card is an immediate one-match ban. A banned player sits the next match out and picks up no appearance for it. Booking counts reset each season.

## v18 changes
1. The client morale indicator is now a properly coloured smiley (red frown / amber neutral / light-green smile / dark-green grin) drawn as an icon, with no number shown.
2. Loans can now be accepted at any time of year, not just during a transfer window (the accept button and durations are always available).
3. Squad role now genuinely drives playing time: a Star Player features in nearly every game, a Starter most games, a Rotation player around half, and a Hot Prospect / Fringe player only occasionally.
4. When you accept or reject an offer, the My Clients list (e.g. filtered by offers) refreshes immediately, so a handled player drops out of the filter.
5. Development reworked so regular game time at a good level actually pays off: players who play often now usually reach their potential, while those who rarely play or are frequently injured may fall short.
6. Fixed drifting league sizes — promotions now always match relegations (exactly three each), so the Eredivisie stays at its set size and lower divisions don't balloon.
7. The league calendar has breaks: no matches in the opening two weeks, and international breaks (no league games) in weeks 10–12, 17–18 and 27–28. Cup rounds still run.
8. Only players aged 21 or under can be dropped to a youth/U21 side; real reserve (Jong) teams can still field older players, and you can now request loans for a player who is currently in your U21.
9. Transfer and loan negotiations now show the current league table position of both the player's club and the interested club.

## v17 changes
1. My Clients has attention filters: All, Transfer/loan/contract offers, Sponsor offers, and Injuries — each chip shows a count, so you can jump straight to who needs you.
2. The Career total (senior) listing now shows clean sheets for goalkeepers instead of goals (in the total line and the by-club / by-competition breakdowns).
3. The "Hot Prospect" role label now only applies to players under 23; the same role tier reads "Fringe" for older players.
4. Cup appearances are included in a player's all-time History (career total); only youth (U21) games are excluded there.
5. Scouts now find players with abilities that genuinely vary across the given range — driven by age, potential and chance — instead of clustering at a fixed value.
6. Each client card now shows a colour-coded morale smiley (red frown under 30, orange neutral 31–55, light-green smile 56–75, dark-green grin above 75) without opening the player. You can sort clients by Happiness, and every sort option can now be reversed (high→low or low→high). When a client's overall morale drops below 30 he gets in touch, unhappy about whatever bothers him most (club, wage, playing time or your representation).
7. In a player's History, the season header now shows the club and league larger and clearly, with the season label beside it at the same size.

## v16 changes
1. Finance tab now also shows all-time totals (income, expenses and net across every season), below the current-season breakdown.
2. Development graphs fixed and reworked: the line no longer zig-zags (career time is now a single monotonic axis). The ability view shows a ~20-point window that widens if a player improves more; the wage chart has headroom below the lowest wage and a grid stepped by level (€500 under €5k, €1,000 from €5–15k, €5,000 above); the transfer-fee chart has a full grid; and every age year is marked with a faint vertical line.
3. You can now negotiate transfers and loans in weeks 48–52; the move is treated as a next-season deal, so the two-club-per-season limit doesn't block it.
4. Client History now counts only senior league appearances (the four pro leagues) — U21 and cup games are excluded from those totals (you still see everything in the player's detail view).
5. The player History tab and Client History now show an honours line like the clubs do: 🏆 trophies with counts, a green ▲ for promotions and a red ▼ for relegations (e.g. 🏆 KNVB Beker ×3 · 🏆 Eerste Divisie ×2 · ▲ Tweede Divisie · ▼ Eredivisie).
6. Loans can be arranged at any point in the season, not only during transfer windows.
7. Sponsorship deals rescaled to be realistic and tied to level: local ~€50/wk (Derde regulars, >25 league games), regional ~€200/wk (Tweede >25, Eerste >5), national ~€1,000/wk (Eerste regulars, all Eredivisie, and strong young talents), international ~€10,000/wk (Eredivisie players rated 80+), worldwide ~€50,000/wk (90+). Shorter deals usually pay more per week, but occasionally the longest is the most lucrative — and loyal servants or players in red-hot form (avg > 7.5) can land outsized offers.
8. Good performances now help development more: a strong recent average rating gives a real boost, so a hot streak (≈8.0 over ~10 games) adds noticeable ability.

## v15 changes
1. In History, the league shown beside each season's club is now the league the club played in THAT season (e.g. Derde Divisie), not its current division.
2. If a scout's report comes due but he finds no one, you now get a message saying so. A wider max-age range makes finds more likely (and a touch more plentiful).
3. Fixed "phantom" offers: a freshly-arrived offer can no longer expire in the same week it appeared, so the week-summary line always matches a real inbox item.
4. Sending a player to the U21/reserves now needs the club's consent — they reply "We agree…" or "We disagree…" (they resist dropping players they rate).
5. You can now actually haggle the wage upward in transfer and contract talks — clubs will pay clearly above their opening offer (relationship helps), not just hold firm or go lower.
6. After requesting a loan you only get the club's answer right away; the interested clubs' offers arrive the following week (loan-listing works the same way).
7. Loan offers no longer all come as "rotation" — weaker clubs offer a bigger role (up to key) when the player is good enough, and the clubs that come in are more varied.
8. The age-based development slowdown is flatter: ×1.85 under 18, ×1.5 under 21, ×1.25 under 24, ×1.1 under 26, ×1.0 at 26+ (the high-ability slowdown still applies on top).

## v14 changes — negotiations overhaul
- Representation talks are now a back-and-forth where the player answers in his own words, e.g. "I don't want to give you that much of my wages for only four years of guaranteed representation." You can respond with more years or a smaller cut. Stronger players (relative to your agency's reputation) hold out for better terms. If you can't agree after four offers he loses interest for 5–10 weeks — approach him in that time and you'll just hear "I don't want to talk with you right now."
- Fixed players being re-approached right after a transfer: once a player has changed clubs in a window, no further transfer offers come for him until the next window.
- Transfer & contract talks are now a single package — you propose wage, role, length and signing bonus together and the club replies with one improved counter (or tells you it's almost there), instead of haggling each item separately. A shorter contract can free the club to offer a higher wage.
- Clubs speak up more. When you request a loan, the parent club first tells you (by inbox message) whether it will sanction the move; if so, interested clubs' offers arrive the following week rather than instantly. Likewise, asking a club to transfer-list a player gives you their answer first, with offers following a week later — a bit more true to life.

## v13 changes
- Client History is now its own top-level tab in the main navigation (no longer tucked inside Leagues).
- The player Contract tab now lists active sponsor deals (sponsor, weekly amount, annual amount and the season the deal runs until), so you keep an overview of sponsorship commitments.
- In the Talent tab, players found within the last 3 weeks carry a small "NEW" badge so fresh finds are easy to spot.
- New Finance tab in the main navigation: income and expenses broken down by source (wage commission, sponsoring, transfer & loan bonuses, scout wages, scout reports, office, facilities & staff, physio treatments, specialists, gifts, release pay-outs, upgrades), with season totals, net, and the current weekly run-rate. The debug money/reputation controls live here too — and they no longer snap back while you're typing (the panel won't overwrite a field you're editing).

## v12 changes
- New youth players now enter the world ONLY through your scouts. Retiring NPCs are no longer replaced by an auto-generated youngster, and NPCs no longer retire at all — only your (ever-)clients retire, so the Client History stays meaningful.
- Fixed talents being stuck at potential 70 (and even below their own current ability). Potential is now always at least the player's current ability and scales properly above 70.
- Scout quality now governs the calibre of talent found, by tier: e.g. a sub-20 scout finds ~5–20 ability / up to 60 potential; a ~65 scout finds ~30–55 ability / up to 95 potential; only 90+ scouts can unearth 50–80 ability / up to 99 potential. Mega-talents come with some regularity for elite scouts but are never guaranteed; weaker scouts find less often, judge more poorly, and sometimes return with a single player or empty-handed.
- The best Dutch talents now average ~65 ability at 15–16, ~70 at 17, ~75 at 18, with very rare outliers (a ~80-rated 17-year-old appears in well under 1% of a top scout's reports).
- Development is slower again and gets much slower toward the top of the scale: a young talent can climb ~20→28 in a season, but a 90-rated player only inches upward — the gaps between ability points widen near the ceiling.

## v11 changes
- DEBUG (temporary): a floating panel (bottom-left) and a block inside each player's Potential tab let you set Money and Reputation directly. To remove later: delete js/debug.js and its <script> tag in index.html.
- Players retire between 34 and 41. The retirement season is drawn from a normal distribution (mean 37, sd 1.553) and shaped by playing time: a player who makes more than 15 appearances in his intended final season carries on one more year (up to 3 times). At the start of his final season he writes to thank you and explain why he's stopping; if he plays on, he tells you again at season's end.
- Retired players (and clients you release) no longer appear as players or talents but are never forgotten: a new "Client History" tab under Competitions lists every player who has been your client — past and present — with name, nationality, position and full career stats (apps, goals/clean sheets, assists, yellows, reds, average rating, seasons active). It's sortable on every column (A–Z and Z–A) and filterable by Goalkeepers / Defenders / Midfielders / Attackers. Click a player to open his card showing History, Injuries, Development and Potential.
- Sponsors now approach at any point in the season (not just the off-season). Higher-potential players attract interest earlier, better players get better deals, and a long-serving club legend (30+, 6+ seasons at one club) lands noticeably stronger local/regional deals.

## v9 changes
1. A club's all-time list only tags a player "(Loan)" if he was *only ever* loaned there; once permanently signed the tag is gone.
2. In History, each season header shows the club + league where the player ended that season; expanding still lists every club and competition.
3. Forwards pick up fewer cards and goalkeepers almost none. Keepers now show clean sheets (not goals); assists for keepers are extremely rare.
4. My-clients list is sortable by ability, age, average rating, appearances, contract remaining and wage.
5. Players now have individual birthdays instead of all ageing at the season break (week 1 = 1 July); a player ages on his birthday week.
6. Players develop noticeably faster, so prospects close the gap to their potential more realistically.
7. Fixed nationalities showing a globe instead of a flag (Morocco, Turkey, Suriname, Kosovo, Cape Verde, Albania, and more now have flags).
8. Match ratings are higher and more dynamic: a one-goal game is ~7.5+, multiple goals/assists push toward 9 and above.
9. Fewer injuries overall.
10. Loan game-time is now negotiable: ask above the club's comfort level and they may dig in or, with a good relationship and persistence, eventually relent — sometimes they stay stubborn.
11. You can ask a club to transfer-list your player (they may agree — more offers follow — or refuse). Clubs may also list players themselves when they no longer count on them.
12. More room to push wages in negotiations.
13. Transfer fees are much lower, especially at the bottom of the pyramid (a 4th-tier move is in the low five figures, not six).
14. An idle scout on your payroll still spots 1–2 players a season, anywhere in the country.
15. You can remove talents you're not chasing from the Talent list (✕).
16. Each scout has a configurable maximum talent age (15–22).
17. Scout suggestions scale with your reputation: three options, never below quality 15, with the occasional stand-out available.

## v8 changes
1. Inbox: "Mark all as read" and "Dismiss all" buttons. The inbox nav badge is now split by type — 📄 contract (transfers, loans, renewals, sponsors), 🩹 injuries, 📈 development, ● general — so you see e.g. "📄2 🩹1 ●1" at a glance.
2. Scouting reports: every talent has a "Potential" tab with a written assessment tied to a position role, plus a Ceiling and Floor estimate phrased in the country's league pyramid (Netherlands ladder included; an England ladder shows how to extend, with a light Elo shift). Estimates carry scout error — a quality-5 scout is up to ±30% out, the best scout ~7%, with a slight lean toward over-rating. Floor gaps are normally distributed (mean 8, sd 2.85). A "Reveal true potential" debug button is included. Roles also shape play style (a one-dimensional poacher scores but rarely assists). Edit roles/descriptions and league ladders in js/scouting.js.
3. Injuries: two treatments in the Injuries tab — Physio (−0.5 week, once per week, €1,000) and Specialist (halves remaining time, once per injury, €15,000). You can't do both in the same week.
4. Equipment, Facilities & Staff (Agency tab, buy in any order): Resistance Bands, Dumbbells, Treadmills, Strength Machine, First-Aid Kit, Gym, Swimming Pool, Training Ground, Medical Center — each affecting development speed, injury risk and/or reputation, some with weekly costs or yearly expiry. Hire up to 5 Physios and 5 Personal Trainers (weekly wage); they restock their consumable every year and can be released.

## v7 changes
1. "Final year" now appears only in the contract's actual last season; otherwise the card shows "until 27/28".
2. Loaned-out players can't be transferred and get no offers while away; max one transfer per transfer window, and one renewal per season.
3. Reputation now has a limit (starts at 20, shown as e.g. 16/20). Raise it — and your client/scout limits — by buying upgrades.
   - Vehicles (buy in order): Company Car, Sports Car, Limousine, Helicopter, Yacht, Private Jet — each adds rep & client limit and cuts scouting costs.
   - Properties (buy in order): Wohnwagen, Appartment, House, Luxury Penthouse, Mansion, Skyscraper — each adds rep & client limit.
4. New Office system (15 levels, Home Office I → Iconic Office III) under the Agency tab. Each office has a weekly running cost, a scout cap, a sponsor reach (Local → World Wide), +1 rep limit and +1 client limit per level. Moving in costs four weeks' rent up front.
5. Sponsors approach each eligible client once a year (off-season) with three offers that trade off weekly pay, a yearly lump sum and length — your cut is shown behind each amount. Company names are drawn from an editable per-country, per-level list (Netherlands included); extend it in js/upgrades.js.

New "Agency" tab: offices, vehicles and properties with artwork and one-click upgrades.

## v6 changes
1. History: clubs within a season now read newest-on-top, oldest-at-the-bottom.
2. Sending a player to the U21/reserves now draws a club reaction; clubs may recall him mid-season (notification), after which he features occasionally.
3. Clubs no longer rubber-stamp the role or signing bonus you ask for — over-ambitious roles and large bonuses get knocked back.
4. At the end of the season (week 48) players come out of the U21 and back from ending loans to their parent club, ready for pre-season business.
5. A reserve side can't be promoted into its first team's division; when a promotion/play-off slot is skipped it passes to the next eligible club, and the green/blue table markings follow the actual eligible places.
6. Fixed: players returning from a U21 season no longer almost always start — they come back as a fringe option.
7. Out-of-contract players become free agents (free transfer, morale hit) and attract contract offers; cards now show contract length (red in the final year / free agent) without opening the player; commissions are no longer always on the card.
8. Transfer/renewal talks: a relationship-based greeting, the player's current wage and both clubs' leagues, no club ceiling shown (demand what you like), worded club responses, and the wage line shows your weekly cut, e.g. €590/wk (€59/wk (10%)).
9. A player can represent at most two senior clubs per season (youth/reserve sides don't count) — no transfer ping-pong.


# ⚽ Football Agent Manager — Prototype v3

You are a football agent. Sign young players, develop them through loans and
transfers, negotiate their contracts and sponsorships, and grow your agency's
reputation. Time advances one calendar week at a time; matches are simulated so
your players accumulate real games, goals, assists, cards and ratings.

## Run
```bash
cd football-agent-game
python3 -m http.server 8000      # open http://localhost:8000
```
Old save from a previous build? Clear it once:
```js
localStorage.clear(); location.reload();   // save key is fam_proto_v3
```

## What's new in v3
- **Realistic development curve** — every player has a hidden peak age (GKs peak
  latest). They improve toward potential through their mid/late 20s, then decline.
  Playing time (especially loans) drives growth.
- **Wages are decoupled from ability** — a wage only changes on a new contract
  (signing, renewal or transfer), never week to week.
- **Contracts measured in seasons** — e.g. "until end of 27/28".
- **Multi-step negotiations** — when you propose representation terms (or a wage),
  the player/club can counter, and you can re-propose or accept their terms.
- **Rich player profile** with sub-tabs:
  - *Overview* — bio, this-season stats (apps/goals/assists/cards/avg rating),
    open offers, transfer-list and loan-list toggles.
  - *Morale* — colour-coded bars for club, playing time, wage and you (the agent).
  - *Injuries* — current status, treatments (stub) and injury history.
  - *Contract* — wage, term, role, renewal request, sponsorship offers, your
    commission, gifts (boost agent morale) and releasing a client (you pay out the
    contract: wage × remaining weeks × your commission).
  - *Development* — line charts for ability, wage and transfer fees achieved.
  - *History* — per-season totals; tap a season to expand the breakdown by
    competition (Eredivisie, KNVB Beker, Champions League, Johan Cruijff Schaal).
    Trophies are collected here.
- **Pitch a player to ANY club** — even one far above his level; they simply won't
  respond.
- **Inbox** (replaces the old offers tab) — transfer, loan, renewal and sponsorship
  offers plus development news, injuries and an end-of-season review. Unanswered
  offers fade; eager clubs come back with improved bids.
- **Leagues tab** — pick a country and division to see the live table (final tables
  in weeks 46–52). Each row shows your relationship with the club (coloured dot) and
  how many of your players are registered there.

## Season structure
| Weeks | Phase |
|------|-------|
| 1–6 | Season + transfer window open |
| 7–20 | Season, window closed |
| 21–25 | Season + transfer window open |
| 26–45 | Season, window closed |
| 46–52 | Off-season (no games; final tables visible; pre-negotiation only) |

## Files
- `js/players.js` — player model, generation, development curve
- `js/clubs.js` — 74 Dutch clubs across 4 divisions
- `js/league.js` — competitions, fixtures, match simulation, standings, trophies
- `js/agency.js` — reputation, money, clients, relationships, all negotiations
- `js/scouts.js` — scout catalogue + weekly finds
- `js/simulation.js` — the weekly engine (matches, development, morale, injuries, inbox)
- `js/game-state.js` — time, season phases, inbox, save/load
- `js/ui.js` — all views and the tabbed player profile
- `js/names-data.js` — names (69 countries) + regional scouting

## Console helpers
```js
Agency.clients()             // your players
GameState.inbox              // messages
League.sortedTable('ERE')    // current Eredivisie table
Sim.advanceWeek()            // step a week
```

## Known simplifications (to refine later)
- The mobile/Android UI is not final — this build is functional, not the final look.
- Cup/continental fixtures are abstracted (knockout rounds on fixed weeks).
- Transfers complete immediately when accepted during a window.
- No NPC-to-NPC transfers yet; squads are static apart from your dealings.
- National-team matches not yet included.

## v3.1 update
- Match ratings recalibrated (10 = perfect, ~7 = a good game) and colour-coded throughout: red <6, amber 6–7, light-green 7–8, dark-green 8–9, blue >9.
- History tab now groups each season by club (with "(Loan)" / "(U21)" tags), supports multiple clubs per season, expands to a per-competition breakdown, and ends in an expandable **Career total** you can view by club or by competition.
- Loans now work by **clubs coming to you** with offers (compare playing time in the inbox), plus a **Send to U21** option for players too raw for a senior loan — U21 games show in history but don't count toward senior appearances.
- Clubs are clickable again (from the Leagues table): see their honours and finishing history, and a sortable list of **your** clients who played there (tap a name to open the profile). Squads aren't fully exposed, and a club won't stockpile your players in one position.
- Development now rewards being **challenged**: playing above your level develops you faster, dominating a weak league slower — but minutes still matter most.
- Players prefer **longer representation deals** — offer more seasons (up to 10) to justify a bigger commission. After the term is up they stay on and can be released for free.
- **Squad role is negotiable** in transfer, renewal and loan offers.
- Ability chart plots every change across the whole career (y-axis spans ≥40 so small gains aren't exaggerated); the wage chart is a step line that only moves on a new contract.

*Still deferred:* promotion/relegation and European-place indicators.

## v4 update
- Roles renamed (Youth, Hot Prospect, Rotation, Starter, Star Player); Starter and Star Player both play as much as possible.
- Your U21 is now named per club, Dutch-style: e.g. **Jong TEC**.
- Scouts differ much more by quality, and each report (every 6–7 weeks) turns up **2–3** talents — a quality-24 scout finds ~20–30-rated players (the odd dud, more often better) where a quality-6 scout finds weak ones. Hire a scout for his wage, then **assign him to a region** (one-off fee; better regions cost more). Talents only join clubs in that region, with the best landing at the region's biggest clubs (Ajax, PSV…), exceptions aside. Regions: Noord, Oost, Noord-Holland, Middelland, Zuid, Zuid-Holland.
- **Contract length** is negotiable in transfer and renewal talks; **loan duration** (0.5–2 seasons) is negotiable too. Loans only start in a transfer window; a winter loan runs 0.5 or 1.5 seasons, a summer loan any length.
- **Promotion & relegation**: 3 direct down per league (not Derde), 2 direct up (not Eredivisie) plus a **promotion play-off** (places 3–6, week 46, higher seed at home). Tables show the promotion/play-off/relegation zones; play-off results are viewable.
- **Two viewable cups**: the **KNVB Beker** (tiers 2–4 from round 1, Eredivisie enters at the Round of 32) and **De kleine Beker** (Tweede+Derde in 12 mixed groups of 3 → last 16). Bracket and group results are in the Competitions tab.
- Your transfer **commission is fixed** at what you first negotiated — on a transfer you only agree wage, role, contract length and your **signing bonus** (Handgeld, up to 1/10 of annual wage).
- Development chart x-axis now grows with age; the wage chart is a straight line (not smoothed).

*Still deferred:* the Champions League and other continental competitions.

## v5 fixes
- **Roles are fully negotiable** in transfer and renewal talks — the dropdown always offers Youth → Star Player, and the role you pick is the role he signs for (no hidden ceiling).
- Renewal talks now show his **current wage, role and contract end** up front.
- **Cup and play-off** team names are clickable (open the club page), as are the kleine-Beker group tables.
- **Club pages list every registered client**, including those with no senior games: youth-only spells show a **(Youth)** tag with 0 senior apps; a registered player with no games at all simply shows 0.
- **Current-season average rating** is shown on every client and talent card, so you can gauge form and potential before opening the profile. Ratings now spread more by ability (better players average clearly higher, with week-to-week swings), and **U21 ratings are higher** so your best youngsters stand out against weaker reserve-league opposition.
- Development charts: the **ability axis has a gridline every 5 points** (5, 10, 15…); the **wage heading shows the current effective wage**.
- History tab lists a season's clubs in **chronological order** when he played for more than one.
- **Scouting-region fees now range €600–€2,600 per report** (charged when a report arrives; assigning a scout to a region is free).
- **Reserve sides ("Jong …"):** an Eredivisie player can be sent down to his club's reserve side (e.g. Ajax → Jong Ajax) and feature in their Eerste-Divisie games; from the reserves you can **request a promotion** back up. A player already at a reserve side can't be pushed down again.
- **Promotion limits:** reserve sides can't be promoted to the Eredivisie, the Tweede holds at most 5 reserve sides and the Derde at most 4. A reserve side that earns a spot it can't take has it passed to the next club, marked with a **\*** footnote under the table; such sides are excluded from the relevant play-off and get no green highlight. The promotion bar is now wider and the play-off blue lighter.
