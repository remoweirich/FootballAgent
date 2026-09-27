// ===================== Scouting: player roles, league tiers, scout reports =====================
// Easy to extend: add roles under a position, add descriptions to a role, add a country to LEAGUE_TIERS.
// {name} in a description is replaced with the player's name.

// Each role carries a play-style bias used by the match engine:
//   goalBias / assistBias  (1.0 = neutral). A "one-dimensional goal threat" scores a lot but rarely assists.
const POSITION_ROLES = {
    GK: [
        { id: 'shot_stopper', label: 'Reflex shot-stopper', goalBias: 0, assistBias: 0.1, desc: ['{name} is a lightning-quick shot-stopper who keeps his side in games with reaction saves, though his command of the box is a work in progress.', 'A reflex goalkeeper, {name} thrives on close-range saves but can be hesitant coming off his line.'] },
        { id: 'sweeper_keeper', label: 'Ball-playing sweeper-keeper', goalBias: 0, assistBias: 0.4, desc: ['{name} is comfortable with the ball at his feet and sweeps up behind a high line, a modern keeper in the making.', 'Confident in possession, {name} starts attacks from the back but the occasional rush of blood could cost him.'] },
        { id: 'commanding_keeper', label: 'Commanding goalkeeper', goalBias: 0, assistBias: 0.2, desc: ['{name} dominates his area and commands his defence with authority, though he is less comfortable with the ball at his feet.', 'A vocal and commanding presence, {name} marshals his defence well but can be caught out by quick passing moves.'] },
    ],
    CB: [
        { id: 'ball_playing', label: 'Ball-playing defender', goalBias: 0.6, assistBias: 1.1, desc: ['{name} reads the game well and steps out with the ball, comfortable starting moves from deep. He must add pace to cope with quick forwards.', 'Composed on the ball, {name} can pick a pass from defence, but is occasionally caught out positionally.'] },
        { id: 'aerial_dominator', label: 'Aerial dominator', goalBias: 1.2, assistBias: 0.4, desc: ['While physically dominant and an aerial presence, {name} is rather clumsy with his feet and will likely struggle with fast-paced professional football.', '{name} is a towering, no-nonsense defender who wins everything in the air, though his distribution is limited.'] },
        { id: 'pace_defender', label: 'Quick recovery defender', goalBias: 0.5, assistBias: 0.8, desc: ['{name} relies on recovery pace to defend space, a useful trait against fast attacks, but his decision-making needs refining.', 'Fast and aggressive, {name} loves to defend on the front foot, though he can be drawn out of position.'] },
        { id: 'defensive_leader', label: 'Defensive leader', goalBias: 0.3, assistBias: 0.3, desc: ['{name} is a vocal and commanding presence who marshals his defence well.', 'A no-nonsense defender, {name} reads the game well and organizes his backline. His calmness under pressure is a key asset.'] },
        { id: 'physical_defender', label: 'Physical defender', goalBias: 0.6, assistBias: 0.2, cardBias: 1.8, desc: ['{name} is a strong and physical defender who relishes duels, though he can be caught out by quicker attackers.', 'A tough and uncompromising centre-back, {name} wins battles with strength and aggression. His coolness needs improvement, as he can quickly gather cards'] },
    ],
    LB: [
        { id: 'attacking_fb', label: 'Attacking full-back', goalBias: 0.8, assistBias: 1.7, cardBias: 1.3, desc: ['{name} bombs forward relentlessly and whips in dangerous crosses, but leaves space in behind that smarter wingers exploit.', 'An adventurous full-back, {name} provides real width and end product, though his defending is raw.'] },
        { id: 'pace_fb', label: 'Pacey full-back', goalBias: 0.7, assistBias: 1.2, desc: ['{name} is a lightning-quick full-back who gets up and down the flank, though his final ball can be imprecise.', 'A speed merchant on the wing, {name} terrorizes opponents with pace. Technically, he could be refined.'] },
        { id: 'defensive_fb', label: 'Defensively solid full-back', goalBias: 0.2, assistBias: 0.7, cardBias: 0.8, desc: ['{name} is a disciplined, defensively sound full-back who rarely gets caught out, but offers little going forward.', 'Reliable and positionally sound, {name} keeps it simple — not flashy, but dependable.'] },
        { id: 'inverted_fb', label: 'Inverted full-back', goalBias: 0.8, assistBias: 1.0, desc: ['{name} is an inverted full-back who drifts inside to link play and create overloads, though he can be caught out defensively.', 'A modern full-back, {name} looks to contribute in midfield and attack, but his defensive positioning can be suspect.'] },
    ],
    RB: [
        { id: 'attacking_fb', label: 'Attacking full-back', goalBias: 0.8, assistBias: 1.7, cardBias: 1.3, desc: ['{name} bombs forward relentlessly and whips in dangerous crosses, but leaves space in behind that smarter wingers exploit.', 'An adventurous full-back, {name} provides real width and end product, though his defending is raw.'] },
        { id: 'pace_fb', label: 'Pacey full-back', goalBias: 0.7, assistBias: 1.2, desc: ['{name} is a lightning-quick full-back who gets up and down the flank, though his final ball can be imprecise.', 'A speed merchant on the wing, {name} terrorizes opponents with pace. Technically, he could be refined.'] },
        { id: 'defensive_fb', label: 'Defensively solid full-back', goalBias: 0.2, assistBias: 0.7, cardBias: 0.8, desc: ['{name} is a disciplined, defensively sound full-back who rarely gets caught out, but offers little going forward.', 'Reliable and positionally sound, {name} keeps it simple — not flashy, but dependable.'] },
        { id: 'inverted_fb', label: 'Inverted full-back', goalBias: 0.8, assistBias: 1.0, desc: ['{name} is an inverted full-back who drifts inside to link play and create overloads, though he can be caught out defensively.', 'A modern full-back, {name} looks to contribute in midfield and attack, but his defensive positioning can be suspect.'] },
    ],
    CDM: [
        { id: 'destroyer', label: 'Ball-winning destroyer', goalBias: 0.4, assistBias: 0.3, cardBias: 1.7, desc: ['{name} breaks up play with relish and protects his back four, a real screen — but his passing range is modest.', 'A combative holding midfielder, {name} loves a tackle, though he can over-commit.'] },
        { id: 'deep_playmaker', label: 'Deep-lying playmaker', goalBias: 0.5, assistBias: 1.6, desc: ['{name} dictates tempo from deep and sprays passes across the pitch, but lacks the legs to cover ground defensively.', 'A metronome in midfield, {name} keeps the ball moving, though he is vulnerable in physical battles.'] },
        { id: 'relentless_runner', label: 'Relentless runner', goalBias: 0.7, assistBias: 0.8, cardBias: 1.3, desc: ['{name} is a tireless midfielder who covers every blade of grass and contributes at both ends, though he lacks a defining skill.', 'A hard-working and well-rounded midfielder, {name} does a bit of everything, though he masters nothing yet.'] },
    ],
    CM: [
        { id: 'box_to_box', label: 'Box-to-box engine', goalBias: 1.0, assistBias: 1.0, desc: ['{name} is an all-action midfielder who covers every blade of grass and chips in at both ends, the engine of a team.', 'Tireless and well-rounded, {name} does a bit of everything, though he masters nothing yet.'] },
        { id: 'playmaker', label: 'Creative playmaker', goalBias: 0.7, assistBias: 1.8, desc: ['{name} is the creative hub, threading passes few others see — but he can drift out of contests and avoids the dirty work.', 'A gifted passer, {name} unlocks defences with vision, though his work rate is questioned.'] },
        { id: 'goal_threat_cm', label: 'Goal-scoring midfielder', goalBias: 1.5, assistBias: 0.7, desc: ['{name} times his runs into the box superbly and arrives to finish, a genuine goal threat from midfield, if defensively naive.', '{name} loves to get beyond the striker and score, though he neglects his defensive duties.'] },
        { id: 'aggressive_leader', label: 'Aggressive leader', goalBias: 0.4, assistBias: 0.4, desc: ['{name} is a vocal and commanding presence who marshals his midfield with authority.', 'A no-nonsense midfielder, {name} whose aggression breaks up opposition attacks before they come into effect. Unfortunately, he collects cards like there is a sticker album.'] },
        { id: 'technical_midfielder', label: 'Technical midfielder', goalBias: 0.8, assistBias: 1.5, desc: ['{name} is a technically gifted midfielder who can dribble and pass with flair, though he can be caught out defensively.', 'A creative and skillful midfielder, {name} can unlock defences with his technique and provide from dead ball situations.'] },
    ],
    CAM: [
        { id: 'creative_ten', label: 'Creative number ten', goalBias: 0.9, assistBias: 2.0, desc: ['A shifty and creative attacking force that aims to dribble past defenders and can create offensive highlights. Physically, {name} needs some developing.', '{name} is a classic playmaker who lives between the lines, conjuring chances — but he can be a passenger without the ball.'] },
        { id: 'shadow_striker', label: 'Shadow striker', goalBias: 1.8, assistBias: 0.5, desc: ['{name} plays off the striker and is a constant goal threat, ghosting into the box — though his link play can be selfish.', 'A second striker at heart, {name} hunts goals from the ten, but offers less in build-up.'] },
        { id: 'attacking_midfielder', label: 'Attacking midfielder', goalBias: 1.2, assistBias: 1.5, desc: ['{name} is a well-rounded attacking midfielder who contributes goals and assists alike, though he is still adding consistency.', 'Versatile and intelligent, {name} can drop deeper or move up if needed, but he is still developing his decision-making.'] },
        { id: 'Raumdeuter', label: 'Raumdeuter', goalBias: 1.6, assistBias: 1.0, desc: ['{name} is a Raumdeuter who roams the half-spaces and finds pockets of space to exploit, a modern attacking midfielder.', 'A clever and versatile attacker, {name} drifts into dangerous areas and contributes goals and assists alike. Deep and physical defenders cause issues for {name}.'] },
        { id: 'dribbler', label: 'Dribbler', goalBias: 1.0, assistBias: 1.3, cardBias: 0.7, desc: ['{name} is a tricky dribbler who takes on defenders, creates chances from nothing, and embarrasses opponents.', 'A skillful and unpredictable attacker, {name} thrives on beating players one-on-one, but his decision-making can be raw and he avoids physical battles.'] },
    ],
    LW: [
        { id: 'dribbler', label: 'Direct dribbler', goalBias: 1.1, assistBias: 1.2, cardBias: 0.7, desc: ['{name} is an electric dribbler who takes on his man and gets to the byline, thrilling but inconsistent with his final ball.', 'Quick and tricky, {name} beats defenders for fun, though his decision-making in the final third is raw.'] },
        { id: 'inside_forward', label: 'Inside forward', goalBias: 1.5, assistBias: 0.7, desc: ['{name} cuts inside onto his stronger foot and shoots on sight, a one-dimensional but lethal goal threat who rarely sets others up.', 'An inside forward who lives to score, {name} is direct and selfish in the best way, but contributes little build-up.'] },
        { id: 'winger', label: 'Winger', goalBias: 1.0, assistBias: 1.5, desc: ['{name} is a traditional winger who hugs the touchline and whips in dangerous crosses, though he can be predictable.', 'A classic wide player, {name} provides width and service into the box, but his end product can be inconsistent.'] },
        { id: 'wide_playmaker', label: 'Wide playmaker', goalBias: 0.8, assistBias: 1.8, desc: ['{name} is a wide playmaker who drifts inside to create and link play, though he can be caught out defensively.', 'A creative wide midfielder, {name} looks to orchestrate attacks from the flank, but his defensive work rate is questioned.'] },
        { id: 'pace_winger', label: 'Pacey winger', goalBias: 1.2, assistBias: 1.0, cardBias: 1.2, desc: ['{name} is a lightning-quick winger who stretches defences and gets in behind, though his final ball can be erratic.', 'A speed merchant on the wing, {name} terrorizes defenders with pace. Technically, he could be refined.'] },
    ],
    RW: [
        { id: 'dribbler', label: 'Direct dribbler', goalBias: 1.1, assistBias: 1.2, cardBias: 0.7, desc: ['{name} is an electric dribbler who takes on his man and gets to the byline, thrilling but inconsistent with his final ball.', 'Quick and tricky, {name} beats defenders for fun, though his decision-making in the final third is raw.'] },
        { id: 'inside_forward', label: 'Inside forward', goalBias: 1.5, assistBias: 0.7, desc: ['{name} cuts inside onto his stronger foot and shoots on sight, a one-dimensional but lethal goal threat who rarely sets others up.', 'An inside forward who lives to score, {name} is direct and selfish in the best way, but contributes little build-up.'] },
        { id: 'winger', label: 'Winger', goalBias: 1.0, assistBias: 1.5, desc: ['{name} is a traditional winger who hugs the touchline and whips in dangerous crosses, though he can be predictable.', 'A classic wide player, {name} provides width and service into the box, but his end product can be inconsistent.'] },
        { id: 'wide_playmaker', label: 'Wide playmaker', goalBias: 0.8, assistBias: 1.8, desc: ['{name} is a wide playmaker who drifts inside to create and link play, though he can be caught out defensively.', 'A creative wide midfielder, {name} looks to orchestrate attacks from the flank, but his defensive work rate is questioned.'] },
        { id: 'pace_winger', label: 'Pacey winger', goalBias: 1.2, assistBias: 1.0, cardBias: 1.2, desc: ['{name} is a lightning-quick winger who stretches defences and gets in behind, though his final ball can be erratic.', 'A speed merchant on the wing, {name} terrorizes defenders with pace. Technically, he could be refined.'] },
    ],
    ST: [
        { id: 'poacher', label: 'One-dimensional goal threat', goalBias: 1.8, assistBias: 0.3, desc: ['{name} is a pure poacher who lives in the box and finishes chances ruthlessly, but offers almost nothing in build-up and rarely assists.', 'A fox in the box, {name} smells goals like few others, though he is anonymous outside the penalty area.'] },
        { id: 'target_man', label: 'Target man', goalBias: 1.2, assistBias: 1.0, desc: ['{name} is a powerful target man who holds the ball up and brings others into play, though he lacks a yard of pace.', 'A handful for any defender, {name} battles, holds and finishes, but can look ponderous against a high line.'] },
        { id: 'complete_forward', label: 'Complete forward', goalBias: 1.3, assistBias: 1.2, desc: ['{name} both scores and creates, dropping deep to link and stretching defences in behind — a modern, well-rounded forward.', 'Versatile and intelligent, {name} contributes goals and assists alike, though he is still adding consistency.'] },
        { id: 'pace_forward', label: 'Pacey forward', goalBias: 1.5, assistBias: 0.5, desc: ['{name} is a lightning-quick forward who stretches defences and gets in behind, though he can be inconsistent with his finishing.', 'A speed merchant up front, {name} terrorizes defenders with pace. Technically, he could be refined. Seldomly assists, as his teammates cannot keep up with his pace.'] },
        { id: 'false_nine', label: 'False nine', goalBias: 0.9, assistBias: 1.8, desc: ['{name} drops deep to link play and create space for others, a modern false nine who is more of a creator than a finisher.', 'A clever and versatile forward, {name} contributes assists and link-up play, though he is less of a goal threat than a traditional striker.'] },
        { id: 'pressing_forward', label: 'Pressing forward', goalBias: 1.0, assistBias: 1.0, cardBias: 1.2, desc: ['{name} is a tireless forward who presses defenders and contributes at both ends, though he lacks a defining skill.', 'A hard-working and well-rounded forward, {name} does a bit of everything, though he masters nothing yet.'] },
    ],
};

// ---- League tiers per country (relative to that country's pyramid). Add countries freely. ----
// `elo` is a rough country-strength rating; countries without an explicit `tiers` list inherit the
// Netherlands ladder shifted by their Elo gap (stronger country -> the same potential ranks lower).
const LEAGUE_TIERS = {
    Netherlands: {
        elo: 1000,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, rank: 'intlRegular' },
            { min: 78, comp: 'ERE', rank: 'star' },
            { min: 70, comp: 'ERE', rank: 'regular' },
            { min: 65, comp: 'EED', rank: 'star' },
            { min: 58, comp: 'EED', rank: 'regular' },
            { min: 52, comp: 'TWD', rank: 'star' },
            { min: 45, comp: 'TWD', rank: 'regular' },
            { min: 40, comp: 'DRD', rank: 'star' },
            { min: 33, comp: 'DRD', rank: 'regular' },
            { min: 25, comp: 'DRD', rank: 'sub' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    England: {
        elo: 1090,   // stronger pyramid: the 4th tier edges the Dutch 4th, the top flight beats the Eredivisie
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, comp: 'PREM', rank: 'star' },
            { min: 77, comp: 'PREM', rank: 'regular' },
            { min: 72, comp: 'CHAMP', rank: 'star' },
            { min: 67, comp: 'CHAMP', rank: 'regular' },
            { min: 62, comp: 'LEAGUE1', rank: 'star' },
            { min: 57, comp: 'LEAGUE1', rank: 'regular' },
            { min: 52, comp: 'LEAGUE2', rank: 'star' },
            { min: 47, comp: 'LEAGUE2', rank: 'regular' },
            { min: 42, comp: 'Natleague', rank: 'star' },
            { min: 37, comp: 'Natleague', rank: 'regular' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Germany: {
        elo: 1080,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 84, comp: 'BUNDES', rank: 'star' },
            { min: 76, comp: 'BUNDES', rank: 'regular' },
            { min: 70, comp: '2BUNDES', rank: 'star' },
            { min: 65, comp: '2BUNDES', rank: 'regular' },
            { min: 59, comp: '3LIGA', rank: 'star' },
            { min: 54, comp: '3LIGA', rank: 'regular' },
            { min: 49, comp: 'REGIONAL1', rank: 'star' },
            { min: 44, comp: 'REGIONAL1', rank: 'regular' },
            { min: 39, comp: 'REGIONAL2', rank: 'star' },
            { min: 34, comp: 'REGIONAL2', rank: 'regular' },
            { min: 30, comp: 'REGIONAL3', rank: 'star' },
            { min: 24, comp: 'REGIONAL3', rank: 'regular' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Spain: {
        elo: 1080,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 84, comp: 'LaLiga', rank: 'star' },
            { min: 76, comp: 'LaLiga', rank: 'regular' },
            { min: 70, comp: 'LaLiga2', rank: 'star' },
            { min: 65, comp: 'LaLiga2', rank: 'regular' },
            { min: 59, comp: 'PrimeraSup', rank: 'star' },
            { min: 54, comp: 'PrimeraSup', rank: 'regular' },
            { min: 49, comp: 'PrimeraInf', rank: 'star' },
            { min: 43, comp: 'PrimeraInf', rank: 'regular' },
            { min: 38, comp: 'Segunda', rank: 'star' },
            { min: 31, comp: 'Segunda', rank: 'regular' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    France: {
        elo: 1070,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, rank: 'intlRegular' },
            { min: 81, comp: 'Ligue1', rank: 'star' },
            { min: 75, comp: 'Ligue1', rank: 'regular' },
            { min: 69, comp: 'Ligue2', rank: 'star' },
            { min: 63, comp: 'Ligue2', rank: 'regular' },
            { min: 58, comp: 'Ligue3', rank: 'star' },
            { min: 52, comp: 'Ligue3', rank: 'regular' },
            { min: 47, comp: 'Ligue4', rank: 'star' },
            { min: 42, comp: 'Ligue4', rank: 'regular' },
            { min: 37, comp: 'Ligue5', rank: 'star' },
            { min: 32, comp: 'Ligue5', rank: 'regular' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Italy: {
        elo: 1080,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 84, comp: 'SerieA', rank: 'star' },
            { min: 76, comp: 'SerieA', rank: 'regular' },
            { min: 70, comp: 'SerieB', rank: 'star' },
            { min: 65, comp: 'SerieB', rank: 'regular' },
            { min: 59, comp: 'SerieC', rank: 'star' },
            { min: 54, comp: 'SerieC', rank: 'regular' },
            { min: 49, comp: 'SerieD', rank: 'star' },
            { min: 44, comp: 'SerieD', rank: 'regular' },
            { min: 39, rank: 'regionalStar' },
            { min: 34, rank: 'regionalRegular' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Switzerland: {
        elo: 1000,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, rank: 'intlRegular' },
            { min: 75, comp: 'SuperLeagueCH', rank: 'star' },
            { min: 70, comp: 'SuperLeagueCH', rank: 'regular' },
            { min: 60, comp: 'ChallengeLeague', rank: 'star' },
            { min: 54, comp: 'ChallengeLeague', rank: 'regular' },
            { min: 45, comp: 'PromotionLeague', rank: 'star' },
            { min: 38, comp: 'PromotionLeague', rank: 'regular' },
            { min: 30, comp: '1.LigaCH', rank: 'star' },
            { min: 25, comp: '1.LigaCH', rank: 'regular' },
            { min: 21, comp: '2.LigaCH', rank: 'regular' },
            { min: 15, comp: '2.LigaCH', rank: 'sub' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Portugal: {
        elo: 1000,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, rank: 'intlRegular' },
            { min: 78, comp: 'LigaPortugal', rank: 'star' },
            { min: 70, comp: 'LigaPortugal', rank: 'regular' },
            { min: 65, comp: 'LigaPortugal2', rank: 'star' },
            { min: 58, comp: 'LigaPortugal2', rank: 'regular' },
            { min: 50, comp: 'Liga3', rank: 'star' },
            { min: 43, comp: 'Liga3', rank: 'regular' },
            { min: 35, comp: 'Liga4', rank: 'star' },
            { min: 28, comp: 'Liga4', rank: 'regular' },
            { min: 21, comp: 'Liga4', rank: 'sub' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
    Belgium: {
        elo: 1000,
        tiers: [
            { min: 90, rank: 'intlSuperstar' },
            { min: 85, rank: 'intlRegular' },
            { min: 76, comp: 'JupilerProLeague', rank: 'star' },
            { min: 70, comp: 'JupilerProLeague', rank: 'regular' },
            { min: 64, comp: 'ChallengerProLeague', rank: 'star' },
            { min: 57, comp: 'ChallengerProLeague', rank: 'regular' },
            { min: 49, comp: 'BelgianDivision1', rank: 'star' },
            { min: 43, comp: 'BelgianDivision1', rank: 'regular' },
            { min: 35, comp: 'BelgianDivision2', rank: 'star' },
            { min: 28, comp: 'BelgianDivision2', rank: 'regular' },
            { min: 21, comp: 'BelgianDivision2', rank: 'sub' },
            { min: 0, rank: 'amateurStar' },
        ],
    },
};

const Scouting = {
    rolesFor(pos) { return POSITION_ROLES[pos] || POSITION_ROLES.CM; },
    roleById(pos, id) { return this.rolesFor(pos).find(r => r.id === id) || this.rolesFor(pos)[0]; },
    assignRole(p) {
        const roles = this.rolesFor(p.position);
        return roles[Math.floor(Rng.next() * roles.length)].id;
    },
    styleBias(p) {
        const r = p.styleRole ? this.roleById(p.position, p.styleRole) : this.rolesFor(p.position)[0];
        return { goal: r.goalBias != null ? r.goalBias : 1, assist: r.assistBias != null ? r.assistBias : 1, card: r.cardBias != null ? r.cardBias : 1 };
    },

    // A tier's display text, composed from the competition's CURRENT name plus a localised rank.
    // It used to be a hardcoded English string per entry ('Eredivisie Star'), which was both
    // untranslatable and a hole in the un-copyrighting work: competitions ship generic
    // ('Dutch First Division') with real names restored only by the optional real-club-names pack,
    // and the scout report was quietly bypassing all of it.
    rankText(t) {
        if (!t) return '';
        const comp = t.comp && typeof compName === 'function' ? compName(t.comp) : null;
        return comp
            ? this._t('scout.rank.' + t.rank, { comp }, '{comp} ' + t.rank)
            : this._t('scout.rank.' + t.rank, null, t.rank);
    },
    // I18n when it is loaded, the English text otherwise, so the headless engine tests still read.
    _t(key, vars, en) {
        if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, vars);
        return String(en).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    },
    // tier label for a potential value, in a given country's pyramid
    tierLabel(pot, country = 'Netherlands') {
        const c = LEAGUE_TIERS[country];
        if (c && c.tiers) {
            for (const t of c.tiers) if (pot >= t.min) return this.rankText(t);
            return this.rankText(c.tiers[c.tiers.length - 1]);
        }
        // unknown country: shift the Dutch ladder by the Elo gap (≈ 1 ability point per 10 Elo)
        const elo = (c && c.elo) || 1000;
        const shift = (elo - 1000) / 10;
        const nl = LEAGUE_TIERS.Netherlands.tiers;
        for (const t of nl) if (pot - shift >= t.min) return this.rankText(t);
        return this.rankText(nl[nl.length - 1]);
    },

    // scout accuracy: quality 5 -> up to ±30%, ~80 -> ~±10%, ~95 -> ~7%
    errorMargin(quality) { return Math.max(0.07, Math.min(0.30, 0.30 - (quality - 5) * 0.00256)); },

    // ---- reading a report -------------------------------------------------------------------
    // Everything below resolves at READ time rather than being frozen at scout time. The report
    // used to store the finished English sentence and tier strings, so a player who scouted in
    // English and then switched to German kept English reports for the life of the save.
    //
    // Reports written by an older build carry those resolved strings instead of the index fields.
    // ceilingFor/floorFor fall back to them, because the potentials they were derived from were
    // never stored. descFor does NOT: it prefers the role's own (translatable) sentence, since
    // that is equivalent flavour text for the same role and the stored copy is English-only.
    roleFor(p) {
        const r = p.report;
        return this.roleById(p.position, (r && r.role) || p.styleRole);
    },
    // One id ('dribbler') reads differently per position, so its key carries the position and the
    // generic key is the fallback. Takes the role object so the Sandbox can label a whole list.
    roleLabelOf(role, position) {
        if (!role) return '';
        const byPos = 'scout.role.' + role.id + '.' + position;
        const viaPos = this._t(byPos, null, null);
        if (viaPos && viaPos !== byPos) return viaPos;
        return this._t('scout.role.' + role.id, null, role.label);
    },
    roleLabelFor(p) { return this.roleLabelOf(this.roleFor(p), p.position); },
    descFor(p) {
        const r = p.report, role = this.roleFor(p);
        if (!role) return (r && r.desc) || '';
        const i = (r && typeof r.descIdx === 'number') ? r.descIdx : 0;
        const en = role.desc[Math.min(i, role.desc.length - 1)] || (r && r.desc) || '';
        const key = 'scout.desc.' + role.id + '.d' + (i + 1);
        const out = this._t(key, null, null);
        const text = (out && out !== key) ? out : en;
        return String(text).replace(/\{name\}/g, p.name);
    },
    ceilingFor(p) {
        const r = p.report; if (!r) return '';
        return typeof r.estPotential === 'number' ? this.tierLabel(r.estPotential, r.country) : (r.ceiling || '');
    },
    floorFor(p) {
        const r = p.report; if (!r) return '';
        return typeof r.floorPotential === 'number' ? this.tierLabel(r.floorPotential, r.country) : (r.floor || '');
    },

    // build a stable scouting report for a player (stored on p.report)
    generateReport(p, scoutQuality = 45) {
        if (!p.styleRole) p.styleRole = this.assignRole(p);
        const role = this.roleById(p.position, p.styleRole);
        const descIdx = Math.floor(Rng.next() * role.desc.length);

        const margin = this.errorMargin(scoutQuality);
        // slightly more likely to over- than under-rate; magnitude uniform within the margin
        const sign = Rng.next() < 0.55 ? 1 : -1;
        const mag = Rng.next() * margin;
        let est = Math.round(p.potential * (1 + sign * mag));
        est = Math.max(25, Math.min(99, est));

        // floor gap ~ Normal(mean 8, sd 2.85): some players' floor is close to their ceiling, others far below
        let gap = Math.round(PlayerGen.gauss(8, 2.85));
        gap = Math.max(1, Math.min(28, gap));
        const floorEst = Math.max(20, est - gap);

        const country = (typeof getRegionForClub === 'function' && Clubs.getClubById(p.clubId))
            ? (Clubs.getClubById(p.clubId).country || 'Netherlands') : 'Netherlands';

        // Indices and numbers only — no resolved prose. See the accessors above.
        p.report = {
            scoutQuality, role: p.styleRole, descIdx,
            estPotential: est, floorPotential: floorEst,
            country
        };
        return p.report;
    },
    ensureReport(p) { return p.report || this.generateReport(p, p.scoutQuality || 45); },
};

if (typeof window !== 'undefined') { window.Scouting = Scouting; }
