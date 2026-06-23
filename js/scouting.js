// ===================== Scouting: player roles, league tiers, scout reports =====================
// Easy to extend: add roles under a position, add descriptions to a role, add a country to LEAGUE_TIERS.
// {name} in a description is replaced with the player's name.

// Each role carries a play-style bias used by the match engine:
//   goalBias / assistBias  (1.0 = neutral). A "one-dimensional goal threat" scores a lot but rarely assists.
const POSITION_ROLES = {
    GK: [
        { id: 'shot_stopper', label: 'Reflex shot-stopper', goalBias: 0, assistBias: 0.2, desc: ['{name} is a lightning-quick shot-stopper who keeps his side in games with reaction saves, though his command of the box is a work in progress.', 'A reflex goalkeeper, {name} thrives on close-range saves but can be hesitant coming off his line.'] },
        { id: 'sweeper_keeper', label: 'Ball-playing sweeper-keeper', goalBias: 0, assistBias: 0.6, desc: ['{name} is comfortable with the ball at his feet and sweeps up behind a high line, a modern keeper in the making.', 'Confident in possession, {name} starts attacks from the back but the occasional rush of blood costs him.'] },
    ],
    CB: [
        { id: 'ball_playing', label: 'Ball-playing defender', goalBias: 0.5, assistBias: 1.2, desc: ['{name} reads the game well and steps out with the ball, comfortable starting moves from deep. He must add pace to cope with quick forwards.', 'Composed on the ball, {name} can pick a pass from defence, but is occasionally caught out positionally.'] },
        { id: 'aerial_dominator', label: 'Aerial dominator', goalBias: 1.2, assistBias: 0.4, desc: ['While physically dominant and an aerial presence, {name} is rather clumsy with his feet and will likely struggle with fast-paced professional football.', '{name} is a towering, no-nonsense defender who wins everything in the air, though his distribution is limited.'] },
        { id: 'pace_defender', label: 'Quick recovery defender', goalBias: 0.5, assistBias: 0.7, desc: ['{name} relies on recovery pace to defend space, a useful trait against fast attacks, but his decision-making needs refining.', 'Fast and aggressive, {name} loves to defend on the front foot, though he can be drawn out of position.'] },
    ],
    LB: [
        { id: 'attacking_fb', label: 'Attacking full-back', goalBias: 0.6, assistBias: 1.5, desc: ['{name} bombs forward relentlessly and whips in dangerous crosses, but leaves space in behind that smarter wingers exploit.', 'An adventurous full-back, {name} provides real width and end product, though his defending is raw.'] },
        { id: 'defensive_fb', label: 'Defensively solid full-back', goalBias: 0.2, assistBias: 0.8, desc: ['{name} is a disciplined, defensively sound full-back who rarely gets caught out, but offers little going forward.', 'Reliable and positionally sound, {name} keeps it simple — not flashy, but dependable.'] },
    ],
    RB: [
        { id: 'attacking_fb', label: 'Attacking full-back', goalBias: 0.6, assistBias: 1.5, desc: ['{name} bombs forward relentlessly and whips in dangerous crosses, but leaves space in behind that smarter wingers exploit.', 'An adventurous full-back, {name} provides real width and end product, though his defending is raw.'] },
        { id: 'defensive_fb', label: 'Defensively solid full-back', goalBias: 0.2, assistBias: 0.8, desc: ['{name} is a disciplined, defensively sound full-back who rarely gets caught out, but offers little going forward.', 'Reliable and positionally sound, {name} keeps it simple — not flashy, but dependable.'] },
    ],
    CDM: [
        { id: 'destroyer', label: 'Ball-winning destroyer', goalBias: 0.4, assistBias: 0.6, desc: ['{name} breaks up play with relish and protects his back four, a real screen — but his passing range is modest.', 'A combative holding midfielder, {name} loves a tackle, though he can over-commit.'] },
        { id: 'deep_playmaker', label: 'Deep-lying playmaker', goalBias: 0.5, assistBias: 1.4, desc: ['{name} dictates tempo from deep and sprays passes across the pitch, but lacks the legs to cover ground defensively.', 'A metronome in midfield, {name} keeps the ball moving, though he is bullied in physical battles.'] },
    ],
    CM: [
        { id: 'box_to_box', label: 'Box-to-box engine', goalBias: 1.0, assistBias: 1.0, desc: ['{name} is an all-action midfielder who covers every blade of grass and chips in at both ends, the engine of a team.', 'Tireless and well-rounded, {name} does a bit of everything, though he masters nothing yet.'] },
        { id: 'playmaker', label: 'Creative playmaker', goalBias: 0.7, assistBias: 1.6, desc: ['{name} is the creative hub, threading passes few others see — but he can drift out of contests and avoids the dirty work.', 'A gifted passer, {name} unlocks defences with vision, though his work rate is questioned.'] },
        { id: 'goal_threat_cm', label: 'Goal-scoring midfielder', goalBias: 1.5, assistBias: 0.7, desc: ['{name} times his runs into the box superbly and arrives to finish, a genuine goal threat from midfield, if defensively naive.', '{name} loves to get beyond the striker and score, though he neglects his defensive duties.'] },
    ],
    CAM: [
        { id: 'creative_ten', label: 'Creative number ten', goalBias: 0.9, assistBias: 1.6, desc: ['A shifty and creative attacking force that aims to dribble past defenders and can create offensive highlights. Physically, {name} needs some developing.', '{name} is a classic playmaker who lives between the lines, conjuring chances — but he can be a passenger without the ball.'] },
        { id: 'shadow_striker', label: 'Shadow striker', goalBias: 1.5, assistBias: 0.8, desc: ['{name} plays off the striker and is a constant goal threat, ghosting into the box — though his link play can be selfish.', 'A second striker at heart, {name} hunts goals from the ten, but offers less in build-up.'] },
    ],
    LW: [
        { id: 'dribbler', label: 'Direct dribbler', goalBias: 1.1, assistBias: 1.2, desc: ['{name} is an electric dribbler who takes on his man and gets to the byline, thrilling but inconsistent with his final ball.', 'Quick and tricky, {name} beats defenders for fun, though his decision-making in the final third is raw.'] },
        { id: 'inside_forward', label: 'Inside forward', goalBias: 1.5, assistBias: 0.7, desc: ['{name} cuts inside onto his stronger foot and shoots on sight, a one-dimensional but lethal goal threat who rarely sets others up.', 'An inside forward who lives to score, {name} is direct and selfish in the best way, but contributes little build-up.'] },
    ],
    RW: [
        { id: 'dribbler', label: 'Direct dribbler', goalBias: 1.1, assistBias: 1.2, desc: ['{name} is an electric dribbler who takes on his man and gets to the byline, thrilling but inconsistent with his final ball.', 'Quick and tricky, {name} beats defenders for fun, though his decision-making in the final third is raw.'] },
        { id: 'inside_forward', label: 'Inside forward', goalBias: 1.5, assistBias: 0.7, desc: ['{name} cuts inside onto his stronger foot and shoots on sight, a one-dimensional but lethal goal threat who rarely sets others up.', 'An inside forward who lives to score, {name} is direct and selfish in the best way, but contributes little build-up.'] },
    ],
    ST: [
        { id: 'poacher', label: 'One-dimensional goal threat', goalBias: 1.7, assistBias: 0.3, desc: ['{name} is a pure poacher who lives in the box and finishes chances ruthlessly, but offers almost nothing in build-up and rarely assists.', 'A fox in the box, {name} smells goals like few others, though he is anonymous outside the penalty area.'] },
        { id: 'target_man', label: 'Target man', goalBias: 1.2, assistBias: 1.0, desc: ['{name} is a powerful target man who holds the ball up and brings others into play, though he lacks a yard of pace.', 'A handful for any defender, {name} battles, holds and finishes, but can look ponderous against a high line.'] },
        { id: 'complete_forward', label: 'Complete forward', goalBias: 1.3, assistBias: 1.2, desc: ['{name} both scores and creates, dropping deep to link and stretching defences in behind — a modern, well-rounded forward.', 'Versatile and intelligent, {name} contributes goals and assists alike, though he is still adding consistency.'] },
    ],
};

// ---- League tiers per country (relative to that country's pyramid). Add countries freely. ----
// `elo` is a rough country-strength rating; countries without an explicit `tiers` list inherit the
// Netherlands ladder shifted by their Elo gap (stronger country -> the same potential ranks lower).
const LEAGUE_TIERS = {
    Netherlands: {
        elo: 1000,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 85, label: 'International Regular' },
            { min: 78, label: 'Eredivisie Star' },
            { min: 70, label: 'Eredivisie Regular' },
            { min: 65, label: 'Eerste Divisie Star' },
            { min: 58, label: 'Eerste Divisie Regular' },
            { min: 52, label: 'Tweede Divisie Star' },
            { min: 45, label: 'Tweede Divisie Regular' },
            { min: 40, label: 'Derde Divisie Star' },
            { min: 33, label: 'Derde Divisie Regular' },
            { min: 25, label: 'Derde Divisie Sub' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    England: {
        elo: 1090,   // stronger pyramid: the 4th tier edges the Dutch 4th, the top flight beats the Eredivisie
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 85, label: 'Premier League Star' },
            { min: 77, label: 'Premier League Regular' },
            { min: 72, label: 'Championship Star' },
            { min: 67, label: 'Championship Regular' },
            { min: 62, label: 'League One Star' },
            { min: 57, label: 'League One Regular' },
            { min: 52, label: 'League Two Star' },
            { min: 47, label: 'League Two Regular' },
            { min: 42, label: 'National League Star' },
            { min: 37, label: 'National League Regular' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    Germany: {
        elo: 1080,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 84, label: 'Bundesliga Star' },
            { min: 76, label: 'Bundesliga Regular' },
            { min: 70, label: '2. Bundesliga Star' },
            { min: 65, label: '2. Bundesliga Regular' },
            { min: 59, label: '3. Liga Star' },
            { min: 54, label: '3. Liga Regular' },
            { min: 49, label: 'Regionalliga Star' },
            { min: 44, label: 'Regionalliga Regular' },
            { min: 39, label: 'Oberliga Star' },
            { min: 34, label: 'Oberliga Regular' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    Spain: {
        elo: 1080,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 84, label: 'La Liga Star' },
            { min: 76, label: 'La Liga Regular' },
            { min: 70, label: 'Segunda División Star' },
            { min: 65, label: 'Segunda División Regular' },
            { min: 59, label: 'Primera Federación Star' },
            { min: 54, label: 'Primera Federación Regular' },
            { min: 49, label: 'Segunda Federación Star' },
            { min: 44, label: 'Segunda Federación Regular' },
            { min: 39, label: 'Tercera Federación Star' },
            { min: 34, label: 'Tercera Federación Regular' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    France: {
        elo: 1070,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 85, label: 'International Regular' },
            { min: 81, label: 'Ligue 1 Star' },
            { min: 75, label: 'Ligue 1 Regular' },
            { min: 69, label: 'Ligue 2 Star' },
            { min: 63, label: 'Ligue 2 Regular' },
            { min: 58, label: 'National Star' },
            { min: 52, label: 'National Regular' },
            { min: 47, label: 'National 2 Star' },
            { min: 42, label: 'National 2 Regular' },
            { min: 37, label: 'National 3 Star' },
            { min: 32, label: 'National 3 Regular' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    Italy: {
        elo: 1080,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 84, label: 'Serie A Star' },
            { min: 76, label: 'Serie A Regular' },
            { min: 70, label: 'Serie B Star' },
            { min: 65, label: 'Serie B Regular' },
            { min: 59, label: 'Serie C Star' },
            { min: 54, label: 'Serie C Regular' },
            { min: 49, label: 'Serie D Star' },
            { min: 44, label: 'Serie D Regular' },
            { min: 39, label: 'Eccellenza Star' },
            { min: 34, label: 'Eccellenza Regular' },
            { min: 0, label: 'Amateur Star' },
        ],
    },
    Switzerland: {
        elo: 1000,
        tiers: [
            { min: 90, label: 'International Superstar' },
            { min: 85, label: 'International Regular' },
            { min: 75, label: 'Super League Star' },
            { min: 70, label: 'Super League Regular' },
            { min: 65, label: 'Challenge League Star' },
            { min: 58, label: 'Challenge League Regular' },
            { min: 52, label: '1. Liga Star' },
            { min: 45, label: '1. Liga Regular' },
            { min: 40, label: '2. Liga Star' },
            { min: 34, label: '2. Liga Regular' },
            { min: 25, label: '2. Liga Sub' },
            { min: 0, label: 'Amateur Star' },
        ],
    }
};

const Scouting = {
    rolesFor(pos) { return POSITION_ROLES[pos] || POSITION_ROLES.CM; },
    roleById(pos, id) { return this.rolesFor(pos).find(r => r.id === id) || this.rolesFor(pos)[0]; },
    assignRole(p) {
        const roles = this.rolesFor(p.position);
        return roles[Math.floor(Math.random() * roles.length)].id;
    },
    styleBias(p) {
        const r = p.styleRole ? this.roleById(p.position, p.styleRole) : this.rolesFor(p.position)[0];
        return { goal: r.goalBias != null ? r.goalBias : 1, assist: r.assistBias != null ? r.assistBias : 1 };
    },

    // tier label for a potential value, in a given country's pyramid
    tierLabel(pot, country = 'Netherlands') {
        const c = LEAGUE_TIERS[country];
        if (c && c.tiers) { for (const t of c.tiers) if (pot >= t.min) return t.label; return c.tiers[c.tiers.length - 1].label; }
        // unknown country: shift the Dutch ladder by the Elo gap (≈ 1 ability point per 10 Elo)
        const elo = (c && c.elo) || 1000;
        const shift = (elo - 1000) / 10;
        for (const t of LEAGUE_TIERS.Netherlands.tiers) if (pot - shift >= t.min) return t.label;
        return 'Amateur Star';
    },

    // scout accuracy: quality 5 -> up to ±30%, ~80 -> ~±10%, ~95 -> ~7%
    errorMargin(quality) { return Math.max(0.07, Math.min(0.30, 0.30 - (quality - 5) * 0.00256)); },

    // build a stable scouting report for a player (stored on p.report)
    generateReport(p, scoutQuality = 45) {
        if (!p.styleRole) p.styleRole = this.assignRole(p);
        const role = this.roleById(p.position, p.styleRole);
        const desc = role.desc[Math.floor(Math.random() * role.desc.length)].replace(/\{name\}/g, p.name);

        const margin = this.errorMargin(scoutQuality);
        // slightly more likely to over- than under-rate; magnitude uniform within the margin
        const sign = Math.random() < 0.55 ? 1 : -1;
        const mag = Math.random() * margin;
        let est = Math.round(p.potential * (1 + sign * mag));
        est = Math.max(25, Math.min(99, est));

        // floor gap ~ Normal(mean 8, sd 2.85): some players' floor is close to their ceiling, others far below
        let gap = Math.round(PlayerGen.gauss(8, 2.85));
        gap = Math.max(1, Math.min(28, gap));
        const floorEst = Math.max(20, est - gap);

        const country = (typeof getRegionForClub === 'function' && Clubs.getClubById(p.clubId))
            ? (Clubs.getClubById(p.clubId).country || 'Netherlands') : 'Netherlands';

        p.report = {
            scoutQuality, role: p.styleRole, roleLabel: role.label, desc,
            estPotential: est, ceiling: this.tierLabel(est, country), floor: this.tierLabel(floorEst, country),
            country
        };
        return p.report;
    },
    ensureReport(p) { return p.report || this.generateReport(p, p.scoutQuality || 45); },
};

if (typeof window !== 'undefined') { window.Scouting = Scouting; }
