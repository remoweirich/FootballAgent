## v30 — Spain added as a full country
Spain is now a selectable home country and a scoutable foreign country, wired throughout exactly like Germany and England.

**Leagues (constant sizes):** La Liga 20, La Liga 2 22, Primera Superior 22, Primera Inferior 22, Segunda Federación 20 — held constant across seasons.

**Promotion / relegation.** La Liga: 18–20 down. La Liga 2: 1–2 up, 3–6 into two-legged play-offs (3 v 6 & 4 v 5, then a two-legged final) for the third promotion place, 19–22 down; max 2 reserve sides, and reserves cannot rise to La Liga (the place passes down). Primera Superior / Primera Inferior: 1–3 up, 4–7 into the same play-off (4 v 7 & 5 v 6), 19–22 down; max 4 reserve sides in Primera Superior. Segunda Federación: 1–3 up, 4–7 into the play-off, no relegation. All play-off ties are two-legged (home & away) and decided on penalties if level on aggregate, played in the same week as the other countries' play-offs.

**Standings markings.** Direct promotion/relegation places show the full-strength colour bar; promotion play-off places show a lighter shade.

**Cups (same weeks as the other countries, one round fewer — 64 clubs).** Copa del Rey: the 64 clubs of the top three divisions from round one, La Liga sides seeded (drawn away) and kept apart in round one. Copa Federación: the 64 clubs of the bottom three divisions, Primera Superior sides seeded (drawn away) and kept apart in round one. Both skip one cup weekend (week 32).

**Reserve sides** are identified by a "B" in the club id (which isn't always shown in the name, e.g. Real Madrid Castilla, Bilbao Athletic, Valencia Mestalla).

**Money.** Spanish transfer budgets and wages sit between England and Germany. Spanish scout names added.

**Club colours.** Audited Spanish club colours and corrected the clearly-wrong ones (e.g. Real Madrid white, Celta Vigo sky blue, Elche green, Córdoba green, Eibar maroon-blue, Alcorcón yellow, Cartagena black-white, Pontevedra maroon, Valencia white-orange). Reserve (B) sides inherit their parent club's colours.

## v29 — Germany added as a full country
Germany is now a selectable home country and a scoutable foreign country, wired throughout exactly like England and the Netherlands.

**Leagues (constant sizes):** Bundesliga 18, 2. Bundesliga 18, 3. Liga 20, and 1./2./3. Regionalliga 24 each — held constant across seasons.

**Promotion / relegation.** Bundesliga: 17–18 down, 16th into the Relegation. 2. Bundesliga: 1–2 up, 3rd into a Relegation for a top-flight place, 17–18 down, 16th into a Relegation against the 3. Liga. 3. Liga: 1–2 up, 3rd into a Relegation, 17–20 down; reserve teams cannot rise into the 2. Bundesliga (the spot passes down). Regionalligen: 1–4 up, 21–24 down, with reserve-team caps per league (max 3 in the 3. Liga, max 5 in the 1./2. Regionalliga) — when a cap is reached, a reserve side's promotion spot passes to the next eligible club. The Relegation ties are two-legged (home & away) and decided on penalties if level on aggregate, played in the same week as the other countries' play-offs.

**Standings markings.** Direct promotion/relegation places show the full-strength colour bar; Relegation play-off places show a lighter shade, so the two are easy to tell apart.

**Cups (same weeks as the other countries).** DFB Pokal: all 128 German clubs from round one, with Bundesliga/2. Bundesliga/3. Liga sides seeded (drawn away) and kept apart in round one, then a straight knockout. Landespokal: the 48 Regionalliga clubs play two rounds; the 12 survivors join the 20 3.-Liga clubs from the round of 32 onward.

**Money.** German transfer budgets and wages sit between England and the Netherlands. German scout names added.

**Club colours.** Audited club colours across all three countries and corrected the clearly-wrong ones (e.g. Preußen Münster green, Osnabrück purple, Greuther Fürth green, Alemannia Aachen black-yellow, Erzgebirge Aue purple, Plymouth Argyle green, Bradford City claret-amber, Newport County amber). Reserve/second teams now inherit their parent club's colours.

## v28 changes — transfer system overhaul
1. Leagues no longer bid alike. Each club's maximum outlay now depends on its league's wealth and its own standing: the Premier League can fund huge fees (weak PREM sides still reach €40m+, big ones €120m+), while the Eredivisie tops out around €28m and lower leagues far less. The same star costs far more from a rich buyer than a modest one.
2. Fees now reflect potential, age and contract length, not just current ability. A young player with a high ceiling is worth far more than an older player at the same rating; more years left on the deal raises the fee. The ability→fee curve is steep, so €60m+ moves (ability 84+) are genuinely rare while €20m moves are common — and elite players no longer get fresh bids every window (an 88-rated star sees roughly one approach every few seasons; a solid pro several a season).
3. Transfers now carry an Agent's Fee instead of the small wage-based signing bonus: it scales with the deal (5% of the fee) up to €5,000,000 on €100m+ transfers. Contract renewals are unchanged.
4. The "reject all offers" button moved from the inbox to the player card, under that player's Open-offers list, so you clear the offers for one specific player you're not selling.

## v27 changes — fixes batch
1. English promotion/relegation verified and hardened. The movement itself was already correct (bottom 3 down, top 2 + play-off winner up, mid-table untouched, stable division sizes over many seasons); to stop promoted/relegated sides from yo-yoing so it *looks* random, clubs now drift slightly in reputation when they go up (+2) or down (−2).
2. Commission ceilings rebalanced. A balanced talent now sits around 8–15%; standout talents (strong relative to your agency's reputation) concede less; weaker players tolerate more, but the cap is 18% wage / 20% sponsorship, so 25% is no longer reachable — and a "normal-good" player won't rubber-stamp a huge cut just because you're famous. Longer contracts still buy a little extra tolerance, but only a little.
3. Nationality variety greatly increased. Scouted players are now ~68% from the club's own country, ~21% from nearby/diaspora nations and ~11% a full wildcard drawn from the whole 77-nation database, so the many defined nations now show up regularly.
4. Loan-listed players are no longer guaranteed a loan offer. Interest is rolled per cycle based on the player's appeal, with genuine dry spells — sometimes no club comes in at all for a while.
5. New "Reject all offers" button in the inbox: clears all pending transfer and loan offers in one click while keeping scout reports, renewals and other messages.
6. Loaned-out players now feature according to the role their loan deal secured. A youth prospect loaned out as a star now plays like a star at the loan club (previously his parent-club role suppressed his minutes).
7. Offer screens show the offering/relevant club's league and current table position (e.g. "Wolves, Championship · 1st/24 · 23pts"), now including the renewal screen for consistency.

## v26 changes
- Added a clickable "How to play" guide to the start screen (where you pick your home country and name your agency): six short slides explaining the core idea — you're an agent who finds talents, signs them as clients, earns commission, develops players through game time, and grows the agency's reputation week by week. Navigate with the arrows or the dots; it loops back to the start.

## v25 changes — fixes batch
1. KNVB Beker fixed: only Dutch clubs take part (English sides were wrongly drawn in). The Dutch and English cups are now strictly separate.
2. Match pacing eased: the opening league weeks now play a single matchday each instead of jumping two at a time, and fixtures stay on a smooth pace afterwards (leagues still finish on schedule). Rotation players now clearly play less than starters (about half as many games) rather than near-starter minutes.
3. Player development slowed further (roughly halved again): an ideal young regular now gains about 5–7 ability over a full season, so agency development upgrades matter again.
4. Scouts now need a minimum quality to work a foreign league: 65 for the top tier, 60 for the second, 50 for the third, 40 for the fourth and 30 for the fifth. A scout below the threshold can't be assigned there.
5. The season review now summarises your home country's title race, cups and play-offs (not always the Dutch ones), and additionally calls out any of your clients — including those playing abroad — who win silverware or are promoted/relegated. Client promotions and relegations are now listed in the review.

## v24 changes — fixes batch
1. Player development reworked: progression is now paced by playing time, form, the gap to potential and genuine week-to-week randomness, capped at ~11 ability across a full season and spread evenly through it (no more "+1 every two weeks" or a big start-of-season jump that then stalls). Regulars who play a lot can still reach their potential over a few seasons; benchwarmers gain very little. Injuries are slightly more frequent and cost development time.
2. English youth sides are now named "Club U21" (e.g. "Arsenal U21") instead of "Jong Club"; Dutch sides keep the "Jong X" name.
3. English play-offs fixed: the semi-final and eliminator ties now actually show the two clubs (previously blank). Championship/League One/League Two: 3 v 6 and 4 v 5. National League: eliminators 4 v 7 and 5 v 6; the 4 v 7 winner meets 3rd and the 5 v 6 winner meets 2nd in the semis, then the final decides the last promotion spot.
4. Honours and recent finishes are now tracked for every nation (England included), not just the Netherlands — and any future nation is covered automatically.
5. A transfer agreed in the off-season (weeks 49–52) now shows the player as "joining X" until the new season starts, and no fresh approaches arrive until the winter window (week 21) rather than week 1.
6. Player names inside emails are now tappable and open the player's card.
7. "Ask the club to transfer-list X" now works — the club gives a clear yes/no response (the handler was missing entirely).
8. English league tables now mark the promotion, play-off and relegation zones (and the champion), just like the Dutch tables.

## v23 changes — pick your home country + international scouting
- New game setup: before kick-off you now choose a home country and name your agency on a start screen. (Existing saves keep playing; clear local storage to see the setup screen.)
- Your home country shapes the start: your initial known talents are all from that country, and your scouts can only be assigned to that country's scouting regions.
- England is now selectable as a home nation, with nine scouting regions defined (Greater London, North West, South East, West Midlands, North East, Yorkshire & the Humber, East Midlands, South West, East of England) and English scout names. Talents found in a region play for that region's clubs, just like in the Netherlands. Region report costs scale with the prestige of each region's clubs.
- International scouting: buy an International Scouting Licence in the Agency tab (€20,000, valid 3 seasons / 156 weeks). With a licence, an unassigned scout can be sent abroad — you pick a country (for now the other of England/Netherlands) and a specific league to scout (international scouting is by league, not region).
- International report costs are tiered off your dearest home region (travel + prestige): roughly 1.5× for the lowest league, ~2.5× for the next two, 3× for the second tier and 5× for the top flight.
- A talent's calibre still depends on the scout, but stronger leagues (higher Elo/reputation) let the same scout unearth great talents more often — scouting the Premier League turns up better prospects than the Dutch lower leagues. English clubs also pay higher wages than Dutch clubs.
- This framework is built to extend: more countries and leagues can be added later and will plug straight into the home-country selection and international scouting.

## v22 changes — fixes batch
1. Promotion/relegation arrows now work for every country (England included) and any future league: a client's ▲/▼ is derived generically from his club's tier change between seasons, not from hard-coded Dutch divisions.
2. The Leagues tab now has a top-level country selector; the cup tabs shown depend on the chosen country (Netherlands → KNVB Beker, kleine Beker; England → FA Cup, Lower Leagues Cup). Play-offs and tables are also country-scoped. Adding a country later only needs an entry in COUNTRY_CUPS.
3. Transfer interest now strongly prefers the player's own country; cross-border bids are rare, and rarer the lower the player's level (Urk bids for a TEC player far sooner than Carlisle would).
4. Players out on loan now appear under the borrowing club in the league table (red dot), not their parent club.
5. Gifts now cost relative to the player's wage (top earners are pricier to please), and the player gives spoken pop-up feedback that scales with how generous the gift was.
6. While the agency is in the red, your best client (by ability, then wage) loses 1 morale per week, explained by a story-style inbox email rather than a technical note. A fresh email is sent each time you fall back into the red.
7. The scout shortlist refreshes only every 2 weeks instead of on every visit; hiring a scout leaves that slot empty until the next refresh.
8. A player whose club contract has expired (a free agent) earns you no wage commission until he signs somewhere new — sponsorship income still pays.
9. Releasing a client you can't afford to buy out is now blocked with a pop-up explaining the shortfall.
10. A loaned-out player's loan terms are now visible on his Contract tab: borrowing club, duration, and his role there.

## v21 changes — English football integrated (stage 2: cups)
- FA Cup added: all 116 English clubs plus 12 non-league guest clubs (Hashtag United, Truro City, Fylde, Kidderminster, Macclesfield, Hemel Hempstead, Maidenhead United, Ebbsfleet, Slough, Chesham, Salisbury, Dagenham & Redbridge) make 128 entrants, drawn from round one and played through the bracket in weeks 4, 7, 15, 26, 32, 38 and 47. The 12 guest clubs exist only in the FA Cup — they can't be scouted or signed and have no squads (their strength tracks their reputation, ~20–21).
- Lower Leagues Cup added: the 96 clubs from National League up to Championship are drawn into 32 groups of three, each club playing the other two once (weeks 4 & 7). The 32 group winners go into a drawn knockout — round of 32 (week 15), then weeks 26/32/38 and the final in week 46.
- Both cups run in parallel with the Dutch KNVB Beker and kleine Beker, are rebuilt fresh each season, and award trophies to the winning club's players. FA Cup and Lower Leagues Cup appearances count toward players' all-time (career) totals like other cups.
- Leagues tab: two new tabs (FA Cup, Lower Leagues Cup) show the live draw, group tables and bracket.

## v20 changes — English football integrated (stage 1: leagues)
- Adopted the expanded clubs.js: the 116 English clubs across five divisions are now part of the world (the broken "C'Ship'" id was normalised to CHAMP).
- The league engine is now country-aware. Both pyramids run in parallel each season: Netherlands (Eredivisie → Derde Divisie) and England (Premier League 20, Championship 24, League One 24, League Two 24, National League 24). Larger 24-team divisions play occasional midweek rounds so every league still finishes on schedule (including the new break weeks).
- English promotion/relegation implemented with the exact rules and play-offs:
  - Premier League: bottom 3 down.
  - Championship / League One: top 2 up, play-off for places 3–6, bottom 3 down.
  - League Two: top 2 up, play-off for places 3–6, bottom 2 down.
  - National League: champion up, then a six-team play-off for places 2–7 (2 & 3 seeded straight to the semi-finals, 4 v 7 and 5 v 6 eliminators, then semis and a final) for the second promotion spot.
  Promotions always match relegations, so every division keeps its size season after season.
- Leagues tab: a country selector now lets you switch between the Netherlands and England and view that country's division tables, with tier-correct promotion/relegation/play-off zones.

### Coming next (stage 2)
The two English cups are the next step and will be built and tested on their own: the FA Cup (all 116 English clubs plus 12 virtual non-transferable clubs, fully drawn from round 1 through the bracket, weeks 4/7/15/26/32/38/47) and the Lower Leagues Cup (the 96 clubs from National League to Championship in 32 groups of three, group winners into a drawn round of 32 and bracket; groups in weeks 4 & 7, then 15/26/32/38/46).

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
