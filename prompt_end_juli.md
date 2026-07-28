# Football Agent Game — Bug & Feature Backlog

Prompt for Claude Code. Each item lists current (broken) behavior, expected behavior, and implementation notes. Items marked **[OPEN QUESTION]** need a decision before implementation — see the bottom of the file for the full list, or the inline note.

---

## A. Match Engine & Live Events

### A1. Finals go to extra time even when not level after 90'
**Bug.** In a recent simulated final, Basel led 3:2 after 90 minutes and the match still went to extra time.
**Expected:** Extra time (and penalties, if still level) should only trigger if the score is level at the end of the 90th minute. Check the final-match resolution logic — likely a flag isn't being read before deciding ET, or ET is unconditionally applied to all cup finals regardless of the score state.

### A2. Corner announcement not reflected in stats or follow-up events
**Bug.** When a live event message announces a corner, it doesn't increment the team's corner stat, and there's no downstream chance of a corner leading into a further event (shot, header, etc.).
**Expected:**
1. Any event piece tagged as a corner should increment that team's corner count in the live team-stats panel.
2. Any event that, in prose, suggests that a corner was won/conceded from the live event, should result in an actual corner in the stats.
3. There should be a probability that a corner announcement chains into a follow-up event (e.g., a shot-from-corner piece), similar to how other event chains work in the puzzle-chain system. (I would suggest 25% chance that an event is triggered).

### A3. "Assist" notification fired with no corresponding event or goal
**Bug.** Player received a notification saying they'd assisted a goal, but no live event occurred and no goal was scored in that match. Screenshots attached to this conversation.
**Action for Claude Code:** Needs repro investigation — check notification-dispatch code for any path that fires an assist notification independent of the actual goal-scoring event resolution (e.g., a stat-aggregation step running out of sync with the event/notification pipeline, or a leftover notification from a previous/simulated match not being cleared).

---

## B. Player Career / Progression

### B1. Career goals should never reference something the player already achieved
**Bug.** An 18-year-old Rennes talent who played for Rennes in Ligue 1 last season stated his ambition was "to play in a big five league" — despite Ligue 1 being a big-five league he's already playing in.
**Expected:** When generating/selecting a player's career ambition, exclude any goal that is already satisfied by the player's current or past clubs/leagues (e.g., "play in a top-5 league," "play Champions League," "play for a specific club" if already achieved there).

### B2. Players cite "return to where it all began" ambition for a club they never played for
**Bug.** Related to B1 — the ambition-generation logic sometimes picks a "boyhood club return" narrative pointing to a club with no actual history with that player.
**Expected:** This ambition type should only be eligible if the player has a genuine prior spell (youth or senior) at that club. Otherwise, exclude it from the ambition pool for that player.

### B3. Growth curve too flat — high-potential talents rarely reach their ceiling
**Issue.** Several 88+ potential talents haven't reached their rating despite time passing; growth feels artificially flattened.
**Expected direction:** Rather than growth always being quicker at lower ratings, there should be a chance element, which is at 20%, where a player can grow just as quickly from 85 to 86 as from 65 to 66. The flattening of the curve should remain, but some players should by random chance be able to not have this flattened curve.

### B4. Scouting: quality-to-outcome curve too generous / no ability-tier filter
**Issue.** At 85 reputation of the agency, I can always find 99 rated scouts — progression feels too fast. Also, scouting filters currently only cover age and region / nation, not target ability tier, or position. I suggest adding a filter for wanted position of a talent, and wanted potential and current ability range of a talent. Every additional filter reduces the likelihood of a scout finding a player that fits the criteria. Also, a 99-rated scout can easily find 2nd-division-level talents, e.g. those with a potential to be maybe 75 rated at most, but he should struggle to reliably find "international superstar"-tier players. A 99-rated scout is most likely to find those, as we defined before with the exact ability ranges that scouts can find, but he should not be guaranteed to find 2-3 players per report to fit that.

**Expected:**
1. Rebalance the reputation → scout-rating curve so it's not maxed out well before reputation cap (which should sit at above 100 if I am not wrong) and I don't always have 99 rated scouts available even though my agency is only at 85 rep.
2. Add an ability-tier filter to the scouting screen (e.g., 4th tier / third tier / top-league / international superstar (with the actual league names)) so the agent can direct scouts to search a specific tier. This makes it possible to scout for 4th tier talents with a 99 rated scout. These talents have low current abilities, and often not amazing potential. A 99-rated scout can find low current ability high potential talents for 4th tier teams more reliably than a 40 rated scout.
3. Scout success rate for a given tier should scale with scout quality — high scouts should be disproportionately better at finding top tiers, but even they shouldn't find superstar-tier talent reliably.


---

## C. Contracts & Club Relations

### C1. Renewal offer doesn't appear until navigating away and back
**Bug.** After requesting a contract renewal, the resulting offer only shows up after backing out of the screen and returning to it — it should appear immediately.
**Fix:** Likely a missing UI refresh/re-render trigger after the renewal request resolves; the underlying state is probably updated correctly but the view isn't re-reading it until remount.

### C2. Club refuses renewal citing "not part of plans," but also refuses to transfer-list the same player
**Bug (logical contradiction).** A club can currently say they don't want to renew because they're not planning around the player, while simultaneously refusing to transfer-list him because "he's too important."
**Expected:** These two stances must be mutually exclusive. If a club states it isn't planning with a player, transfer-listing should be permitted. Add a consistency check between the renewal-refusal reason and the transfer-list-refusal reason so they can't contradict each other.

### C3. Sponsor deal variance — occasional standout offer
**Feature request.** Sponsor deals currently feel too uniform; I want occasional deals that are noticeably better than the norm. With a 10% chance one of the three deals is noticably better and offers 25% more money.

---

## D. Player Identity & Display

### D1. Match invite doesn't reflect actual club per player
**Bug.** If Servette play Basel in a cup final and Jens has clients on both sides, the invite currently lists all players as playing for the same club (and you only get an invite from this one club). The club where more of your clients play should be the one to send the invite, and list all the players that play only for them. The other clients, that play for the opposition club from the view of the inviting club, should be listed separately from the invite below, for example with an informatory: (XY and xy also play in this game, but for club 2)
**Expected:** Each player on the invite should be labeled with their actual club for that match.

### D2. Ratings tab on the live sim view doesn't show which club a player plays for
**Feature.** Add the player's club as a visible field/label in the ratings tab in the live sim view, so that we can tell which player plays for which club. Also put their position if it isn't there already.

### D3. Player overview: league name should be clickable
**Feature.** On the player overview screen, clicking the league name should navigate to/open that league's view.

### D4. Goalkeepers need distinct role names and mechanics
**Feature.** GK is a separate from outfield roles:
- **Youth** — essentially never plays (same rarity as outfield Youth).
- **Hot Prospect / Fringe** — plays very seldom (same rarity as outfield equivalent).
- **Back Up** — plays up to 10% of games, i.e., fewer than ~9 appearances per season.
- **Cup Goalkeeper** — plays all of the clubs cup games (domestic cup, european cup), (this role is only given to GK's that are just below the required ability for a club (within 4 ability points) and also only seldomly (33%))
- **First Choice** — starts every week.
- **Star Player** — starts every week plus bonuses: higher wage, never gets transfer-listed by the club, (and any other bonuses the existing outfield Star Player role already has — mirror those).

**Implementation note:** Reuse the existing outfield role-tier appearance-share logic where possible, just renamed and gated to the GK position, with Star Player inheriting whatever special-status bonuses already exist for outfield Star Players.

### D5. Loan players — parent club not visible anywhere
**Feature.** Surface the parent (owning) club somewhere in the UI for any player currently out on loan — e.g., on the player contract view.

### D6. Family status should be re-askable yearly
**Feature.** Family status currently seems to be static/one-time. Since it changes over time, the agent should be able to ask about it again once per year (per player, presumably on an annual cadence tied to save-game time).

### D7. Language course logic needs refinement
**Bug/Feature.** Currently doesn't account for:
- Whether the player has already played in a country where that language is spoken (should already know it / not need the course, or need less time).
- Whether the player already speaks the language due to nationality (e.g., a Swiss-French player already speaking French).
**Expected:** Cross-check a player's nationality and club history (past countries played in) against the language before offering/requiring a course for it.
For simplicity we assume a player to speak each national language, and base language course requirements and "settling in" buffs on that. England (English), Germany (German), France (French), Spain (Spanish), Italy (Italian), Portugal (Portuguese), Netherlands (Dutch), Belgium (French, Dutch), Switzerland (French, German, Italian). A player that already speaks a language has a lower settling in time (75% lower)

---

## E. UI/UX Polish

### E1. Low contrast on name text in chat/conversation screens
**Bug.** The player name in conversation chats is hard to read against the background — needs higher contrast (check color token being used, likely too close to background in the dark theme).

### E2. Swipe gesture doesn't work on scrollable items
**Bug.** Swipe-to-action gestures don't register when tried on list items that are inside a scrollable container.
**Likely cause:** Gesture recognizer conflict — the scroll container is capturing the touch/pointer events before the swipe handler gets them. Needs a gesture-priority fix (e.g., direction-locking so a horizontal swipe wins over vertical scroll capture, or a scroll-lock during an active horizontal drag).


