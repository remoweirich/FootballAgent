// ============================================================
//  Live sim — client puzzle events ("Attend the Final")
// ============================================================
// Pure engine layer: assembles commentary chains from js/live-sim-data.js, binds clients to the
// pieces, and resolves the result tags into concrete match events. NO DOM access — the view layer
// renders what buildChain/resolveChain hand back. See docs/live-sim-events.md for the data.
//
// The one rule everything rests on: XY names the piece's OWN player (S in a start, M in a middle,
// E in an end). A piece containing XY must bind to a client whose role code it lists; a piece
// WITHOUT XY is connective — its actor is whoever the previous piece bound. That is not a
// convention imposed on the data, it is what the data does: 88 of 89 starts name someone, while
// 80 of 84 middles and 193 of 247 ends just say "he".
//
// Only clients are ever named. The refs O (an opponent) and T (a team-mate) exist in the tags but
// deliberately resolve to nobody: they move team-level stats and render as anonymous feed lines.

const LIVE_SIM = {
    MAX_MIDDLES: 2,          // start -> middle -> middle -> end at most
    SECOND_MIDDLE_CHANCE: 0.15,
    PENALTY_MATCH_RATE: 0.25,       // share of watched matches that see a spot kick
    PENALTY_CLIENT_WIN_CHANCE: 0.4, // of those, how often an attending client earns it vs a random award
    CORNER_BASE: 2, CORNER_SPREAD: 6,   // corners per side: 2..7
    CORNER_EVENT_CHANCE: 0.22,      // chance a corner is narrated as a client event, not just a tick
    CORNER_EVENT_MAX: 2,            // at most this many narrated corner events per match
    CORNER_FOLLOW_CHANCE: 0.25,     // chance a plain corner chains into a follow-up beat (header/shot, no goal)
    PLACEHOLDER_CLIENT: 'XY',
    PLACEHOLDER_TEAM: 'xy (player\'s team)',
    PLACEHOLDER_OPP: 'yx (opposition team)',
};

const LiveSim = {
    _idx: null,

    // corner cues, matched against a start piece's prose (see init)
    CORNER_ATTACK_RE: /corner\s+(for|won)|up come the giants|plants the ball in the quadrant/i,
    CORNER_DEFEND_RE: /corner against/i,

    // ---------------------------------------------------------------- data indexing (once)
    // Called lazily; the JSON asset is parsed by the script tag, this just adds lookup structure.
    // Role codes become Sets so eligibility is O(1) instead of a scan of up to 22 strings.
    init(data) {
        if (this._idx && !data) return this._idx;
        const D = data || (typeof LIVE_SIM_DATA !== 'undefined' ? LIVE_SIM_DATA : null);
        if (!D) throw new Error('LIVE_SIM_DATA not loaded');
        const prep = list => list.map((p, i) => ({
            id: i, key: p.k, text: p.t, weight: p.w, tags: p.r || '',
            codes: new Set(p.c),
            keys: this.parseKey(p.k),
            names: p.t.indexOf(LIVE_SIM.PLACEHOLDER_CLIENT) >= 0,   // does this piece name its player?
            // corner cue, read from the prose so it survives the author reorganising families:
            // 'attack' = the client's team has the corner, 'defend' = they are defending one.
            corner: this.CORNER_ATTACK_RE.test(p.t) ? 'attack' : this.CORNER_DEFEND_RE.test(p.t) ? 'defend' : null,
        }));
        this._idx = {
            roleCodes: D.roleCodes,
            start: prep(D.pieces.start), middle: prep(D.pieces.middle), end: prep(D.pieces.end),
        };
        // Bucket by family. Chains never cross families, so scanning all 84 middles and 247 ends on
        // every attempt was ~10x the work needed — and buildTimeline makes thousands of attempts.
        const bucket = list => {
            const m = new Map();
            for (const p of list) for (const k of p.keys) {
                if (!m.has(k.fam)) m.set(k.fam, []);
                if (!m.get(k.fam).includes(p)) m.get(k.fam).push(p);
            }
            return m;
        };
        this._idx.middleByFam = bucket(this._idx.middle);
        this._idx.endByFam = bucket(this._idx.end);
        return this._idx;
    },

    // A client's role code, e.g. {position:'ST', styleRole:'poacher'} -> 'STPOA'. The workbook's
    // 45 codes map 1:1 onto POSITION_ROLES, so every client has exactly one and there is no
    // fallback to invent.
    roleCodeOf(p) {
        const byPos = this.init().roleCodes[p.position];
        return (byPos && byPos[p.styleRole]) || null;
    },

    // ---------------------------------------------------------------- key grammar (pure)
    // "A" -> base, fits any branch of family A. "A3" -> branch 3 only. "A1/A3" -> either.
    parseKey(k) {
        return String(k).split('/').map(s => s.trim()).filter(Boolean).map(s => {
            const m = s.match(/^([A-Z]+)(\d*)$/);
            if (!m) throw new Error(`live-sim: unparseable key "${k}"`);
            return { fam: m[1], br: m[2] ? +m[2] : null };
        });
    },
    // Two pieces can sit next to each other if some reading of each shares a family and agrees on
    // the branch. A base piece (br null) fits anything in its family.
    keysLink(a, b) {
        const A = Array.isArray(a) ? a : this.parseKey(a), B = Array.isArray(b) ? b : this.parseKey(b);
        return A.some(x => B.some(y => x.fam === y.fam && (x.br === null || y.br === null || x.br === y.br)));
    },
    // The branch a whole chain commits to: every numbered piece must agree on one number.
    // Returns { fam, br } (br null = an all-base chain), or null if the chain is illegal.
    // Pairwise linkage is not enough — A -> A1 -> A2 links pairwise via the base A but is invalid.
    chainBranch(keys) {
        const lists = keys.map(k => Array.isArray(k) ? k : this.parseKey(k));
        const fams = lists[0].map(x => x.fam);
        for (const fam of fams) {
            if (!lists.every(l => l.some(x => x.fam === fam))) continue;
            const brs = new Set();
            for (const l of lists) for (const x of l) if (x.fam === fam && x.br !== null) brs.add(x.br);
            if (!brs.size) return { fam, br: null };
            for (const br of brs) {
                // every piece must be able to read as this branch (or be a base piece)
                if (lists.every(l => l.some(x => x.fam === fam && (x.br === null || x.br === br)))) return { fam, br };
            }
        }
        return null;
    },

    // ---------------------------------------------------------------- weighted choice (pure)
    // rnd is injectable so tests can be deterministic. Weight 100 = standard, single digits =
    // the one-in-a-season stuff; respecting these is what keeps the rare pieces rare.
    pickWeighted(list, rnd = Rng.next, weightOf = p => p.weight) {
        if (!list || !list.length) return null;
        let total = 0;
        for (const p of list) total += Math.max(0, weightOf(p));
        if (total <= 0) return null;
        let r = rnd() * total;
        for (const p of list) { r -= Math.max(0, weightOf(p)); if (r <= 0) return p; }
        return list[list.length - 1];
    },

    // ---------------------------------------------------------------- tags (pure)
    // "GOAL:E; ASSIST:M" -> [{tag:'GOAL', ref:'E'}, {tag:'ASSIST', ref:'M'}]
    TAGS: ['GOAL', 'ASSIST', 'OG', 'YC', 'Y2C', 'RC', 'PENWON', 'PENCONC', 'PENSAVE', 'PENMISS'],
    REFS: ['S', 'M', 'E', 'O', 'T'],
    // Memoised: chain assembly runs this over the same few hundred tag strings tens of thousands
    // of times per match while filtering candidate end pieces, and re-splitting them dominated the
    // build. The result is treated as immutable — callers read it, never mutate it.
    _tagCache: new Map(),
    parseTags(str) {
        if (!str) return [];
        const hit = this._tagCache.get(str);
        if (hit) return hit;
        const out = this._parseTags(str);
        this._tagCache.set(str, out);
        return out;
    },
    _parseTags(str) {
        return String(str).split(';').map(s => s.trim()).filter(Boolean).map(entry => {
            const [tag, ref] = entry.split(':').map(x => (x || '').trim().toUpperCase());
            if (!this.TAGS.includes(tag)) throw new Error(`live-sim: unknown tag "${tag}" in "${str}"`);
            if (!this.REFS.includes(ref)) throw new Error(`live-sim: unknown ref "${ref}" in "${str}"`);
            return { tag, ref };
        });
    },

    // Turn a bound chain's end tags into concrete events.
    //   bound: { pieces:[{piece, player}], end } — player is a client object or null
    //   Returns [{ tag, player|null, anonymous:bool, side:'own'|'opp' }]
    // O and T never produce a player: opponents and team-mates do not exist in this game world.
    // A self-assist (S/M/E all landing on one client) is dropped rather than credited.
    resolveTags(bound) {
        const tags = this.parseTags(bound.end.piece.tags);
        if (!tags.length) return [];
        const byRef = {
            S: bound.pieces[0] ? bound.pieces[0].player : null,
            M: bound.lastMiddle ? bound.lastMiddle.player : null,   // the middle DIRECTLY before the end
            E: bound.end.player,
            O: null, T: null,
        };
        const out = [];
        for (const { tag, ref } of tags) {
            const player = (ref === 'O' || ref === 'T') ? null : byRef[ref] || null;
            // OG and PENCONC by our own player benefit the opposition; O-reffed tags are theirs.
            const side = (ref === 'O') ? 'opp' : 'own';
            out.push({ tag, ref, player, anonymous: !player, side });
        }
        // suppress a self-assist: the same client cannot set himself up
        const goal = out.find(e => e.tag === 'GOAL');
        const assist = out.find(e => e.tag === 'ASSIST');
        if (goal && assist && goal.player && assist.player && goal.player === assist.player)
            return out.filter(e => e !== assist);
        return out;
    },

    // ---------------------------------------------------------------- text rendering (pure)
    // Placeholders are whole tokens including the parenthetical — "yx (opposition team)", not "yx".
    // Team placeholders are matched by SHAPE, not exact wording: `xy (…)` is the client's team and
    // `yx (…)` the opposition, whatever sits inside the brackets — the workbook has "xy (player's
    // team)", "xy (players team)" and could grow more variants, and every one of them must resolve
    // or a raw placeholder leaks into the feed. Case-sensitive, so the client token `XY` (always
    // upper) can never be mistaken for a team token (always lower).
    PLACEHOLDER_TEAM_RE: /xy\s*\([^)]*\)/g,
    PLACEHOLDER_OPP_RE: /yx\s*\([^)]*\)/g,
    renderPiece(piece, player, ctx) {
        let t = piece.text;
        t = t.replace(this.PLACEHOLDER_OPP_RE, ctx.oppName || '');
        t = t.replace(this.PLACEHOLDER_TEAM_RE, ctx.teamName || '');
        if (player) t = t.split(LIVE_SIM.PLACEHOLDER_CLIENT).join(player.name);
        return t;
    },

    // ---------------------------------------------------------------- chain assembly
    // clients: the attending clients IN THIS MATCH on the same side, as
    //   [{ id, name, position, styleRole, clubId }]. `trigger` is the one the chain is built for;
    //   he must be eligible for the START (that is what makes the chain his).
    //
    // opts.used: a Set of "startId:middleIds:endId" already seen this match — an identical chain
    //   never repeats, and pieces already used are deprioritised.
    // opts.allow: predicate on the end piece's tags, so the timeline can ask for (say) a chain
    //   that does NOT score when the client's goal budget is spent. This is how the existing
    //   assignStats weighting stays in charge of who scores: chains are fitted to a budget, they
    //   do not invent goals.
    // opts.credit: { player, tag } — the outcome MUST land on this client. Without it the actor
    //   binding is free to hand a GOAL:E to whichever eligible client it likes, which quietly
    //   awards a goal to someone whose budget was zero.
    buildChain(trigger, clients, opts = {}) {
        const idx = this.init();
        const rnd = opts.rnd || Rng.next;
        const code = this.roleCodeOf(trigger);
        if (!code) return null;
        const usedPieces = opts.usedPieces || new Set();
        const stale = p => usedPieces.has(p.id) ? 0.15 : 1;   // seen already: allowed, but unlikely

        // opts.family pins the chain to one family — a spot kick has to come from N, not from
        // whatever else this client happens to be eligible for.
        //
        // N (a client takes a penalty) and X (a client keeper faces one) narrate a kick that has
        // already been awarded, so they are only ever reachable by asking for them BY NAME, from
        // _penaltyEvent. Leaving them in the general pool conjured penalties out of nowhere — every
        // match had one.
        // opts.startFilter further narrows the openers — the corner pass uses it to demand a corner
        // start piece, so a "corner" event actually reads like one.
        const starts = idx.start.filter(p => p.codes.has(code) &&
            (opts.family ? p.keys.some(k => k.fam === opts.family)
                : !p.keys.some(k => this.PEN_FAMILIES.includes(k.fam))) &&
            (!opts.startFilter || opts.startFilter(p)));
        for (let attempt = 0; attempt < 24; attempt++) {
            const start = this.pickWeighted(starts, rnd, p => p.weight * stale(p));
            if (!start) return null;
            const chain = this._growChain(start, trigger, clients, idx, rnd, stale, opts);
            if (chain && !(opts.used && opts.used.has(this.chainKey(chain)))) return chain;
        }
        return null;
    },

    chainKey(chain) { return chain.pieces.map(x => x.piece.id).join(':'); },

    _growChain(start, trigger, clients, idx, rnd, stale, opts) {
        // Middles/ends only have to be *linkable*; the branch is settled for the whole chain at
        // the end, because pairwise linkage alone would admit A -> A1 -> A2.
        const fam = start.keys[0].fam;
        const middlePool = idx.middleByFam.get(fam) || [], endPool0 = idx.endByFam.get(fam) || [];
        const middles = [];
        let cursor = start;
        const wantSecond = rnd() < LIVE_SIM.SECOND_MIDDLE_CHANCE;
        for (let i = 0; i < (wantSecond ? LIVE_SIM.MAX_MIDDLES : 1); i++) {
            // A second middle must be a DIFFERENT piece — several families (N, X, M) carry only one
            // middle per branch, so without this the chain reads the same line twice in a row.
            const pool = middlePool.filter(p => middles.indexOf(p) < 0 &&
                this.keysLink(cursor.keys, p.keys) &&
                this._eligible(p, trigger, clients) &&
                this.chainBranch([start, ...middles, p].map(x => x.keys)));
            const m = this.pickWeighted(pool, rnd, p => p.weight * stale(p));
            if (!m) break;
            middles.push(m); cursor = m;
            // a second middle is only legal when both agree on the branch, which chainBranch checks
        }
        if (!middles.length) return null;

        const endPool = endPool0.filter(p => this.keysLink(cursor.keys, p.keys) &&
            this._eligible(p, trigger, clients) &&
            this.chainBranch([start, ...middles, p].map(x => x.keys)) &&
            (!opts.allow || opts.allow(p.tags, p)));
        const end = this.pickWeighted(endPool, rnd, p => p.weight * stale(p));
        if (!end) return null;

        return this._bind(start, middles, end, trigger, clients, rnd, opts.credit);
    },

    // A piece is usable if it either names nobody (connective — it just continues the last actor)
    // or lists a role code belonging to a client actually in this match.
    _eligible(piece, trigger, clients) {
        if (!piece.names) return true;
        return clients.some(c => { const rc = this.roleCodeOf(c); return rc && piece.codes.has(rc); });
    },

    // Bind an actor to every piece. Pieces that name someone take a client eligible for them;
    // pieces that don't simply carry the previous actor forward.
    _bind(start, middles, end, trigger, clients, rnd, credit) {
        const pieces = [{ piece: start, player: trigger }];
        let last = trigger;
        for (const m of middles) {
            const player = m.names ? this._pickActor(m, clients, last, rnd, false) : last;
            pieces.push({ piece: m, player });
            last = player;
        }
        // Whoever the caller says must be credited wins the E slot outright — a required goal
        // belongs to the client the engine awarded it to, not to whoever the prose could fit.
        const creditRef = credit && this._refCarrying(end.tags, credit.tag);
        let endPlayer;
        if (creditRef === 'E' && end.names && end.codes.has(this.roleCodeOf(credit.player))) {
            endPlayer = credit.player;
        } else {
            // When the end names someone AND its tags credit two different refs (GOAL:E + ASSIST:M),
            // prefer a client other than the assister — that is the "one client creates, another
            // finishes" case the data is written for. With only one client in the match it falls back
            // to the same player and resolveTags drops the self-assist.
            const wantsDistinct = end.names && /ASSIST:(M|S)/.test(end.tags) && /GOAL:E/.test(end.tags);
            endPlayer = end.names ? this._pickActor(end, clients, last, rnd, wantsDistinct) : last;
        }
        const endEntry = { piece: end, player: endPlayer };
        pieces.push(endEntry);
        return {
            pieces, end: endEntry,
            lastMiddle: middles.length ? pieces[pieces.length - 2] : pieces[0],
            trigger,
        };
    },

    // Which ref (S/M/E) carries `tag` in an end piece's tag string — 'RC' also answers to Y2C,
    // since both send the same player off.
    _refCarrying(tags, tag) {
        if (!tags || !tag) return null;
        for (const e of this.parseTags(tags))
            if (e.tag === tag || (tag === 'RC' && e.tag === 'Y2C')) return e.ref;
        return null;
    },

    _pickActor(piece, clients, current, rnd, preferDistinct) {
        const eligible = clients.filter(c => { const rc = this.roleCodeOf(c); return rc && piece.codes.has(rc); });
        if (!eligible.length) return current;   // shouldn't happen (_eligible gates it), but never name nobody
        if (preferDistinct) {
            const others = eligible.filter(c => c !== current);
            if (others.length) return others[Math.floor(rnd() * others.length) % others.length];
        }
        // the actor carrying the move continues it where he can — that is what the prose assumes
        if (eligible.includes(current)) return current;
        return eligible[Math.floor(rnd() * eligible.length) % eligible.length];
    },

    // Full commentary text for a bound chain, one line per piece.
    chainLines(chain, ctx) {
        return chain.pieces.map(x => this.renderPiece(x.piece, x.player, ctx));
    },

    // ================================================================ timeline
    // ARCHITECTURE (the choice §4 of the spec asks to be stated): (b) pre-compute the result with
    // the existing engine, then choreograph a timeline that matches it. League.playMatch already
    // draws the score and hands assignStats' per-player detail back; this turns that detail into
    // minute-stamped commentary. Nothing here decides a goal — it only narrates one that the
    // existing position x ability x style weighting already awarded. That is what keeps an attended
    // match's stored stats bit-for-bit what a quick sim would have produced, and what stops the
    // heavily attack-flavoured event data from turning centre-backs into goalscorers.
    //
    // The cost of (b) is that a chain has to be found to fit a required outcome; where none exists
    // the goal still happened and is narrated plainly, so the invariant never bends to the prose.

    shuffled(list, rnd = Rng.next) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    },

    // 3-9 client puzzle events, scaling with how many clients are on the pitch.
    eventBudget(nClients, rnd = Rng.next) {
        return Math.min(9, Math.max(3, 1 + nClients * 2 + Math.floor(rnd() * 3)));
    },

    // Distinct minutes, spread rather than clustered: the match is cut into n slots and one minute
    // is drawn inside each, so events never land two-in-a-minute and never all arrive at once.
    spreadMinutes(n, first, last, rnd = Rng.next) {
        if (n <= 0) return [];
        const span = last - first + 1, out = new Set();
        const slot = span / n;
        for (let i = 0; i < n; i++) {
            const lo = first + Math.floor(i * slot), hi = first + Math.max(0, Math.ceil((i + 1) * slot) - 1);
            for (let tries = 0; tries < 12; tries++) {
                const m = lo + Math.floor(rnd() * Math.max(1, hi - lo + 1));
                if (!out.has(m)) { out.add(m); break; }
            }
        }
        // a slot can fail if it is a single minute already taken; top up anywhere free
        for (let m = first; out.size < n && m <= last; m++) out.add(m);
        return [...out].sort((a, b) => a - b);
    },

    // spec: {
    //   clients: [{ player, side:'home'|'away', goals, assists, yellow, red }]  (from assignStats)
    //   hg, ag, homeName, awayName, minutes (90 or 120), rnd
    // }
    // Returns { events: [...] } — minute-stamped, ordered, each either a client chain or an
    // anonymous team event. The caller replays it; the stats are already banked.
    buildTimeline(spec) {
        const rnd = spec.rnd || Rng.next;
        const minutes = spec.minutes || 90;
        // events are spread across regulation (or extra time if it produced goals); a pens match leaves
        // 90'→120' empty. Defaults to the full clock so ordinary matches are unaffected.
        const regMinutes = spec.regulation || minutes;
        const clients = (spec.clients || []).filter(c => c.player);
        const nameOf = side => side === 'home' ? spec.homeName : spec.awayName;
        const oppOf = side => side === 'home' ? spec.awayName : spec.homeName;

        // ---- what MUST be narrated, straight from the engine's own numbers
        const required = [];
        for (const c of clients) {
            for (let i = 0; i < (c.goals || 0); i++) required.push({ c, need: 'GOAL' });
            for (let i = 0; i < (c.assists || 0); i++) required.push({ c, need: 'ASSIST' });
            if (c.red) required.push({ c, need: 'RC' });
            else if (c.yellow) required.push({ c, need: 'YC' });
        }
        // anonymous goals: whatever the team scored that no attending client did
        const clientGoals = side => clients.filter(c => c.side === side).reduce((s, c) => s + (c.goals || 0), 0);
        const anonGoals = { home: Math.max(0, (spec.hg || 0) - clientGoals('home')), away: Math.max(0, (spec.ag || 0) - clientGoals('away')) };

        // ---- the ledger: everything the engine authorised, and nothing else.
        // A chain is picked for the outcome it DELIVERS, but end pieces carry whole tag sets, so
        // the one that gives a client his yellow may also concede a penalty, and a GOAL:E piece may
        // hand an assist to a team-mate who never earned one. Checking only the outcome we asked
        // for lets those extras through and silently desyncs the feed from the stored stats.
        // Every named event a chain produces must be drawn from this ledger or the chain is rejected.
        const ledger = { byClient: new Map(), anon: { home: anonGoals.home, away: anonGoals.away } };
        for (const c of clients)
            ledger.byClient.set(c.player, { GOAL: c.goals || 0, ASSIST: c.assists || 0, YC: c.yellow || 0, RC: c.red || 0 });

        const target = Math.max(this.eventBudget(clients.length, rnd), required.length);
        // spec §4: once a client is shown a red (or a second yellow) he features in no further
        // events. Populated as the card requirements are narrated (below), then every later stream
        // — filler, penalties, corners — skips him, and his dismissal is pinned to his last minute.
        const sentOff = new Set();
        const live = () => clients.filter(c => !sentOff.has(c.player));

        // ---- assemble, then stamp minutes across however many events we actually produced
        // Events are built as UNITS, not loose entries. A foul and the penalty it gives away are one
        // indivisible beat: the ordering shuffle below moves whole units, so the kick can never be
        // flung to the far side of the match from the offence that caused it.
        const units = [];
        const statAdjust = [];
        const used = new Set(), usedPieces = new Set();
        const noteChain = ch => { used.add(this.chainKey(ch)); ch.pieces.forEach(x => usedPieces.add(x.piece.id)); };
        const ctxFor = side => ({ teamName: nameOf(side), oppName: oppOf(side) });
        // Whether this match has a penalty at all is decided ONCE, up front, rather than falling out
        // of however many card and filler chains happen to carry a PENWON/PENCONC tag. Left to
        // emerge it was wildly out: every match had one. Deciding it here means the rate is the
        // rate, whatever the workbook is edited to contain later.
        let penaltyWanted = rnd() < LIVE_SIM.PENALTY_MATCH_RATE;
        const hasPenalty = () => units.some(u => u.some(e => e.kind === 'penalty'));
        // One is plenty: a card chain and a filler chain could otherwise each award one.
        const penOK = tags => {
            if (!tags) return true;
            const pen = this.parseTags(tags).some(e => e.tag === 'PENWON' || e.tag === 'PENCONC');
            return pen ? (penaltyWanted && !hasPenalty()) : true;
        };
        // A won or conceded penalty is a promise to the viewer: the kick gets taken, one minute after
        // the event that awarded it, and the scoreboard moves (or doesn't) accordingly. Never leave
        // one hanging — that was the old reason for refusing these chains outright.
        const pushWithPenalty = (ev, side) => {
            const unit = [ev];
            const forSide = this._penaltyFor(ev.events || [], side);
            if (forSide) unit.push(this._penaltyEvent(forSide, ledger, live(), rnd, ctxFor, statAdjust));
            units.push(unit);
        };
        const chainCount = () => units.reduce((n, u) => n + u.filter(e => e.kind === 'chain').length, 0);

        const chainFor = (c, need) => {
            const mates = clients.filter(x => x.side === c.side).map(x => x.player);
            const credit = { player: c.player, tag: need };
            // Two passes. A booking is usually just a booking, but for some roles the only card
            // ending the workbook offers is one that also gives away a penalty — so ask first for a
            // chain that does ONLY what was needed, and settle for the dramatic one if there is no
            // alternative. Without this a booked centre-back conceded a penalty every single time.
            const clean = tags => this._tagsSatisfy(tags, need) && !this.parseTags(tags).some(e => this.PEN_TAGS.includes(e.tag));
            const any = tags => this._tagsSatisfy(tags, need) && penOK(tags);
            for (let tries = 0; tries < 16; tries++) {
                const allow = tries < 10 ? clean : any;
                const ch = this.buildChain(c.player, mates, { allow, credit, used, usedPieces, rnd });
                if (!ch) continue;
                const ev = this.resolveTags(ch);
                // must DELIVER the outcome to this client (a GOAL:E bound to a team-mate is not his
                // goal), and must not smuggle in anything the engine did not authorise
                if (!ev.some(e => e.tag === need && e.player === c.player)) continue;
                if (this._spend(ev, c.side, ledger)) return ch;
            }
            return null;
        };

        const doRequired = req => {
            // One chain can settle several requirements at once — a GOAL:E; ASSIST:M piece pays for
            // the scorer AND the assister, and a converted penalty pays for the taker's goal. The
            // ledger is the record of what is still owed, so an outcome already paid for is skipped
            // rather than narrated a second time.
            const bal = ledger.byClient.get(req.c.player);
            const key = req.need === 'Y2C' ? 'RC' : req.need;
            if (!bal || (bal[key] || 0) <= 0) return;

            const ch = chainFor(req.c, req.need);
            const side = req.c.side;
            if (ch) noteChain(ch);
            else if (!this._spend([{ tag: req.need, player: req.c.player, anonymous: false, side: 'own' }], side, ledger)) return;
            if (req.need === 'RC' || req.need === 'Y2C') sentOff.add(req.c.player);   // no further events for him
            pushWithPenalty({
                kind: 'chain', side, need: req.need, client: req.c.player, chain: ch,
                // A required outcome with no chain to carry it (a keeper's goal, say) still has to
                // be narrated — the engine awarded it, so it appears with plain commentary rather
                // than being silently dropped from the feed.
                lines: ch ? this.chainLines(ch, ctxFor(side))
                    : [this._plainLine(req.need, req.c.player, nameOf(side))],
                events: ch ? this.resolveTags(ch)
                    : [{ tag: req.need, ref: 'E', player: req.c.player, anonymous: false, side: 'own' }],
            }, side);
        };
        // Filler: puzzle events that settle nothing on their own. Untagged pieces qualify, and so do
        // purely penalty-flavoured ones — those cost nothing and the kick that follows is narrated
        // and paid for like any other. Anything that scores or books someone is excluded: those are
        // the engine's to award, not the filler's.
        const neutral = tags => {
            if (!tags) return true;
            return this.parseTags(tags).every(e => this.PEN_TAGS.includes(e.tag)) && penOK(tags);
        };
        const fillTo = limit => {
            let guard = 0;
            while (chainCount() < limit && guard++ < 40) {
                const pool = live();
                const c = pool[Math.floor(rnd() * pool.length) % pool.length];
                if (!c) return;
                const mates = clients.filter(x => x.side === c.side).map(x => x.player);
                // corners are their own stream (below); keep them out of the core puzzle-event budget
                const ch = this.buildChain(c.player, mates, { allow: neutral, startFilter: p => !p.corner, used, usedPieces, rnd });
                if (!ch) continue;
                const ev = this.resolveTags(ch);
                if (!this._spend(ev, c.side, ledger)) continue;
                noteChain(ch);
                pushWithPenalty({
                    kind: 'chain', side: c.side, need: null, client: c.player, chain: ch,
                    lines: this.chainLines(ch, ctxFor(c.side)), events: ev,
                }, c.side);
            }
        };

        // ORDER MATTERS. Cards and filler go first because they are what awards penalties, and a
        // penalty can only be scored out of a goal the engine gave the taker. Narrating his goal in
        // open play first would leave the ledger empty by the time he steps up, so he would miss
        // every penalty he ever took. Goals and assists are narrated afterwards, out of whatever
        // the spot kicks left — a converted penalty simply IS his goal, and doRequired skips it.
        const cardReqs = required.filter(r => r.need === 'YC' || r.need === 'RC');
        const scoreReqs = required.filter(r => r.need === 'GOAL' || r.need === 'ASSIST');
        cardReqs.forEach(doRequired);
        // If this match is meant to have a penalty and no card chain happened to award one, award it
        // here — before the filler, so it counts toward the event budget rather than pushing the
        // match to a tenth event, and before the goals, so the taker's budget is intact and he can
        // convert. A penalty need NOT involve a client in how it came about: usually it is just a
        // clumsy challenge nobody attending caused; occasionally an attending client earns it.
        if (penaltyWanted && !hasPenalty()) {
            let awarded = false;
            if (rnd() < LIVE_SIM.PENALTY_CLIENT_WIN_CHANCE) {
                const awards = tags => !!tags && this.parseTags(tags).some(e => e.tag === 'PENWON' || e.tag === 'PENCONC');
                for (const c of this.shuffled(live(), rnd)) {
                    const mates = clients.filter(x => x.side === c.side).map(x => x.player);
                    const ch = this.buildChain(c.player, mates, { allow: awards, used, usedPieces, rnd });
                    if (!ch) continue;
                    const ev = this.resolveTags(ch);
                    if (!this._spend(ev, c.side, ledger)) continue;
                    noteChain(ch);
                    pushWithPenalty({ kind: 'chain', side: c.side, need: null, client: c.player, chain: ch,
                        lines: this.chainLines(ch, ctxFor(c.side)), events: ev }, c.side);
                    awarded = true; break;
                }
            }
            if (!awarded) {
                // a random spot kick: an unnamed player is brought down. The awarded side's client
                // still steps up to take it if the workbook lets him (see _penaltyEvent).
                const forSide = rnd() < 0.5 ? 'home' : 'away';
                units.push([
                    { kind: 'penalty-award', side: forSide, client: null, events: [],
                        lines: [`PENALTY to ${nameOf(forSide)}! A clumsy challenge brings a man down in the box.`] },
                    this._penaltyEvent(forSide, ledger, live(), rnd, ctxFor, statAdjust),
                ]);
            }
        }
        fillTo(Math.max(0, target - scoreReqs.length));
        // From here the goal budgets start being spent, so a penalty awarded now would likely have
        // nothing left to convert. Better none than a guaranteed miss.
        penaltyWanted = false;
        scoreReqs.forEach(doRequired);
        fillTo(target);
        // whatever the scoreline still owes after the chains — a chain may already have spent an
        // anonymous goal (GOAL:T, "an unnamed team-mate finishes"), so read the ledger, not anonGoals
        for (const side of ['home', 'away'])
            for (let i = 0; i < ledger.anon[side]; i++)
                units.push([{ kind: 'goal', side, client: null, lines: [`GOAL — ${nameOf(side)}`], events: [{ tag: 'GOAL', player: null, anonymous: true, side: 'own' }] }]);

        // ---- corners: a live stat that ticks up, and now and then the cue for a corner event.
        // The count must match what the feed shows, so first flag every chain already built that is
        // ITSELF a corner — a goal straight from a corner opens with "Corner for …" and has to tick
        // the counter too. `corner` on an event names the team that won it, counted exactly once.
        const cornerOwner = e => {
            const cue = e.chain && e.chain.pieces[0].piece.corner;
            if (!cue) return null;
            return cue === 'attack' ? e.side : (e.side === 'home' ? 'away' : 'home');
        };
        for (const u of units) for (const e of u) { const o = cornerOwner(e); if (o) e.corner = o; }

        // then top each side up to a realistic total with plain ticks, a few of which become a
        // client puzzle event (an attacker attacking one, or a defender clearing one against his
        // team) — never a guarantee. Corner events carry no result tags, so they never touch the
        // score; a header that actually goes in came through the goal path above.
        let cornerEvents = units.reduce((n, u) => n + u.filter(e => e.corner && e.kind === 'chain').length, 0);
        const flagged = { home: 0, away: 0 };
        for (const u of units) for (const e of u) if (e.corner) flagged[e.corner]++;
        for (const side of ['home', 'away']) {
            const target = LIVE_SIM.CORNER_BASE + Math.floor(rnd() * LIVE_SIM.CORNER_SPREAD);
            for (let have = flagged[side]; have < target; have++) {
                let ev = null;
                if (cornerEvents < LIVE_SIM.CORNER_EVENT_MAX && rnd() < LIVE_SIM.CORNER_EVENT_CHANCE)
                    ev = this._cornerEvent(side, live(), rnd, ctxFor, used, usedPieces);
                if (ev) cornerEvents += 1;
                const unit = [ev || { kind: 'corner', side, client: null, corner: side, events: [], lines: [`Corner — ${nameOf(side)}`] }];
                // a plain corner sometimes leads to something the moment after — a header or shot that
                // doesn't go in (goals are the engine's to award, so this is pure flavour, no score)
                if (!ev && rnd() < LIVE_SIM.CORNER_FOLLOW_CHANCE) unit.push(this._cornerFollow(side, rnd));
                units.push(unit);
            }
        }
        // definitive count: whatever carries a corner flag, so it can never drift from the feed
        const corners = { home: 0, away: 0 };
        for (const u of units) for (const e of u) if (e.corner) corners[e.corner]++;

        // Shuffle whole units so anonymous goals aren't all last, then stamp a minute per UNIT.
        // A penalty is taken the minute after it is given away, not whenever the next slot happens
        // to fall — so the follow-up takes its parent's minute + 1 rather than a slot of its own.
        const shuffledAll = this.shuffled(units, rnd);
        // A final settled in EXTRA TIME was level at 90': hold its extra-time goals back into the
        // 90'→minutes window so the score reads level at the whistle and the winner arrives after,
        // and keep everything else inside regulation. (etGoals is 0 for every ordinary match.)
        const otherSide = s => (s === 'home' ? 'away' : 'home');
        const goalSideOf = u => {
            for (const e of u) for (const ev of (e.events || [])) {
                if (ev.tag === 'GOAL') return ev.side === 'opp' ? otherSide(e.side) : e.side;
                if (ev.tag === 'OG') return ev.side === 'opp' ? e.side : otherSide(e.side);
            }
            return null;
        };
        let etH = (spec.etGoals && spec.etGoals.home) || 0, etA = (spec.etGoals && spec.etGoals.away) || 0;
        const etUnits = [];
        if (etH + etA > 0) for (const u of shuffledAll) {
            const gs = goalSideOf(u);
            if (gs === 'home' && etH > 0) { etUnits.push(u); etH--; }
            else if (gs === 'away' && etA > 0) { etUnits.push(u); etA--; }
        }
        const etSet = new Set(etUnits);
        const regUnits = shuffledAll.filter(u => !etSet.has(u));
        const out = [];
        // stamp a list of units across [lo, hi], leaving room for the longest unit's follow-up (a late
        // penalty still gets its minute+1 to land the kick on rather than clamping onto the award)
        const stampWindow = (list, lo, hi) => {
            if (!list.length) return;
            const maxSpan = list.reduce((m, u) => Math.max(m, u.length), 1);
            const slots = this.spreadMinutes(list.length, lo, Math.max(lo, hi - maxSpan), rnd);
            let prev = lo - 1;
            list.forEach((unit, i) => {
                const span = unit.length - 1;
                let m = Math.max(slots[i] != null ? slots[i] : hi - maxSpan, prev + 1);
                m = Math.min(m, hi - span);
                unit.forEach((e, k) => { e.minute = m + k; prev = e.minute; });
                out.push(...unit);
            });
        };
        stampWindow(regUnits, 1, regMinutes);
        stampWindow(etUnits, regMinutes + 1, minutes);

        // A sent-off client's dismissal must be his LAST appearance. He was already kept out of every
        // stream after his card, but his own goal or assist (scored before he walked) may have landed
        // at a later minute than the red. Permute the minutes AMONG his own events so the red takes
        // the latest — same minute set, so nothing collides and the scoreline is untouched.
        for (const player of sentOff) {
            const idxs = out.map((e, i) => i).filter(i => out[i].client === player || (out[i].events || []).some(ev => ev.player === player));
            const rcIdx = idxs.find(i => (out[i].events || []).some(ev => (ev.tag === 'RC' || ev.tag === 'Y2C') && ev.player === player));
            if (rcIdx == null || idxs.length < 2) continue;
            const mins = idxs.map(i => out[i].minute).sort((a, b) => a - b);
            const others = idxs.filter(i => i !== rcIdx).sort((a, b) => out[a].minute - out[b].minute);
            others.forEach((i, k) => out[i].minute = mins[k]);   // his other events take the earlier minutes
            out[rcIdx].minute = mins[mins.length - 1];           // the red takes the latest
        }
        // An assist must never appear before its goal: a standalone assist (one narrated apart from the
        // goal it set up — the goal itself being an anonymous team strike) can otherwise be stamped at an
        // earlier minute than that goal, reading as "assisted a goal" while the score is still blank.
        // Pair each side's standalone assists with its goals in order and pull any early one forward.
        const isPlainGoal = e => (e.events || []).some(ev => ev.tag === 'GOAL' && ev.side !== 'opp');
        const isLoneAssist = e => (e.events || []).some(ev => ev.tag === 'ASSIST') && !(e.events || []).some(ev => ev.tag === 'GOAL');
        for (const side of ['home', 'away']) {
            for (const a of out.filter(e => e.side === side && isLoneAssist(e))) {
                if (out.some(e => e.side === side && isPlainGoal(e) && e.minute <= a.minute)) continue;   // a goal already precedes it
                const later = out.filter(e => e.side === side && isPlainGoal(e) && e.minute > a.minute).sort((x, y) => x.minute - y.minute)[0];
                if (later) { const t = a.minute; a.minute = later.minute; later.minute = t; }   // swap: assist now trails a goal, minutes stay unique
            }
        }
        out.sort((a, b) => a.minute - b.minute);
        return { events: out, minutes, regulation: regMinutes, statAdjust, corners };
    },

    // A short follow-up beat after a corner: a header/shot that comes to nothing (no result tags, so
    // it never touches the banked score). Pure atmosphere, one line.
    CORNER_FOLLOW_LINES: [
        'The delivery picks out a head at the near post — flashed just wide!',
        'Met firmly six yards out, but it\'s straight at the keeper.',
        'Half-cleared to the edge, the drive back in is charged down.',
        'Whipped in and headed over the bar from close range.',
        'A scramble in the six-yard box — hacked off the line at the last!',
        'Flicked on at the front post, but nobody gambled at the back stick.',
    ],
    _cornerFollow(side, rnd) {
        return { kind: 'cornerfollow', side, client: null, events: [], lines: [this.CORNER_FOLLOW_LINES[Math.floor(rnd() * this.CORNER_FOLLOW_LINES.length)]] };
    },

    // A corner narrated as a client puzzle event. `won` is the team that has the corner. First try
    // an attacker on that team attacking it; failing that, a defender on the OTHER team clearing it.
    // Corner chains are strictly untagged, so they never touch the score. Returns an event, or null
    // if no eligible client / no corner chain could be built (in which case the caller ticks a plain
    // corner instead).
    _cornerEvent(won, clients, rnd, ctxFor, used, usedPieces) {
        const untagged = tags => !tags;
        const attempt = (who, cue) => {
            const side = clients.filter(c => c.side === who);
            const mates = side.map(c => c.player);
            for (const c of this.shuffled(side, rnd)) {
                const ch = this.buildChain(c.player, mates, {
                    allow: untagged, startFilter: p => p.corner === cue, used, usedPieces, rnd,
                });
                if (!ch) continue;
                used.add(this.chainKey(ch)); ch.pieces.forEach(x => usedPieces.add(x.piece.id));
                return { kind: 'chain', side: who, need: null, client: ch.pieces[0].player, chain: ch,
                    corner: won, lines: this.chainLines(ch, ctxFor(who)), events: [] };
            }
            return null;
        };
        const other = won === 'home' ? 'away' : 'home';
        return attempt(won, 'attack') || attempt(other, 'defend');
    },

    // Try to pay for everything a chain produces out of the ledger. All-or-nothing: on success the
    // ledger is debited and the chain is usable, on failure nothing is spent and the chain is
    // rejected. This is the single gate that keeps the feed and the stored stats identical.
    //
    // The PEN* tags cost nothing on their own — winning, conceding, saving or missing a penalty
    // moves no stat. PENWON/PENCONC do oblige the caller to narrate the kick that follows
    // (buildTimeline appends it), and any GOAL that comes out of it is paid for there.
    PEN_TAGS: ['PENWON', 'PENCONC', 'PENSAVE', 'PENMISS'],
    PEN_FAMILIES: ['N', 'X'],   // N = a client takes a penalty, X = a client keeper faces one
    _spend(events, side, ledger) {
        const other = side === 'home' ? 'away' : 'home';
        const debits = [], anonDebits = { home: 0, away: 0 };
        for (const e of events) {
            if (this.PEN_TAGS.includes(e.tag)) continue;
            if (e.player) {
                const bal = ledger.byClient.get(e.player);
                const key = e.tag === 'Y2C' ? 'RC' : e.tag;
                if (!bal || !(key in bal)) return false;             // a tag no budget can pay for
                debits.push([bal, key]);
            } else if (e.tag === 'GOAL' || e.tag === 'OG') {
                // an unnamed goal still moves the scoreboard: GOAL:T is ours, GOAL:O and any own
                // goal are the opposition's
                const who = (e.side === 'opp' || e.tag === 'OG') ? other : side;
                anonDebits[who] += 1;
            }
            // anonymous cards cost nothing: no player's record moves
        }
        // tally per (client, tag) so two goals in one chain can't both draw on a budget of one
        const tally = new Map();
        for (const [bal, key] of debits) {
            const m = tally.get(bal) || {}; m[key] = (m[key] || 0) + 1; tally.set(bal, m);
        }
        for (const [bal, m] of tally) for (const k of Object.keys(m)) if ((bal[k] || 0) < m[k]) return false;
        for (const s of ['home', 'away']) if (anonDebits[s] > ledger.anon[s]) return false;

        for (const [bal, m] of tally) for (const k of Object.keys(m)) bal[k] -= m[k];
        for (const s of ['home', 'away']) ledger.anon[s] -= anonDebits[s];
        return true;
    },

    // ---------------------------------------------------------------- penalties
    // Which side is about to take a spot kick, given a chain's tags. PENWON is for the winner's
    // team; PENCONC is against the conceder's. O flips the side, since it names an opponent.
    _penaltyFor(events, side) {
        const other = side === 'home' ? 'away' : 'home';
        for (const e of events) {
            if (e.tag === 'PENWON') return e.ref === 'O' ? other : side;
            if (e.tag === 'PENCONC') return e.ref === 'O' ? side : other;
        }
        return null;
    },

    // Clients on `side` the workbook is willing to hand a spot kick to (family N start pieces).
    penaltyTakers(clients, side) {
        const idx = this.init();
        const nStarts = idx.start.filter(p => p.keys.some(k => k.fam === 'N'));
        return clients.filter(c => c.side === side).filter(c => {
            const rc = this.roleCodeOf(c.player);
            return rc && nStarts.some(p => p.codes.has(rc));
        });
    },

    // Narrate the kick. A client the workbook lets take penalties ALWAYS takes it — that is the
    // point of the N family, and it keeps anonymous takers rare. Whether he scores is not his to
    // decide: if the engine gave him a goal he has not yet been shown scoring, this is it; if not,
    // he misses. The kick always resolves, so the scoreboard can never be left hanging.
    PEN_CONVERSION: 0.75,
    // Roughly three in four penalties are scored, and that has to hold for clients too — otherwise
    // your striker misses almost every spot kick of his career, which is the one thing a viewer
    // would notice immediately.
    //
    // A goal must exist to be scored, though. Usually the engine gave the taker one that has not
    // been narrated yet and the kick simply IS that goal. When it did not, he takes over one of his
    // team's anonymous goals instead: the scoreline, the winner and every downstream system see the
    // same numbers, and one goal moves from a nameless team-mate to the man who actually stepped up.
    // The transfer is reported in the timeline's `statAdjust` so the caller can bank it, and it is
    // the only place the live sim adds to a client's tally — the "finals can generate a tad more"
    // allowance. If the team scored nothing at all there is no goal to take over, and he misses.
    _penaltyEvent(forSide, ledger, clients, rnd, ctx, statAdjust) {
        const takers = this.penaltyTakers(clients, forSide);
        const taker = takers.find(c => (ledger.byClient.get(c.player) || {}).GOAL > 0) || takers[0];
        const mates = clients.filter(x => x.side === forSide).map(x => x.player);
        const team = ctx(forSide).teamName;

        if (taker) {
            const bal = ledger.byClient.get(taker.player) || {};
            const hasOwn = (bal.GOAL || 0) > 0;
            const wantGoal = (hasOwn || ledger.anon[forSide] > 0) && rnd() < this.PEN_CONVERSION;
            // borrow an anonymous goal up front so _spend can pay for it like any other; hand it
            // back untouched if no chain can be built
            const borrowed = wantGoal && !hasOwn;
            if (borrowed) { bal.GOAL = (bal.GOAL || 0) + 1; ledger.anon[forSide] -= 1; }

            const allow = tags => {
                const scores = this.parseTags(tags).some(e => e.tag === 'GOAL' && e.ref !== 'O');
                return wantGoal ? scores : !scores;
            };
            const credit = wantGoal ? { player: taker.player, tag: 'GOAL' } : null;
            for (let tries = 0; tries < 12; tries++) {
                const ch = this.buildChain(taker.player, mates, { allow, credit, rnd, family: 'N' });
                if (!ch) continue;
                const ev = this.resolveTags(ch);
                if (wantGoal && !ev.some(e => e.tag === 'GOAL' && e.player === taker.player)) continue;
                if (!this._spend(ev, forSide, ledger)) continue;
                if (borrowed) statAdjust.push({ player: taker.player, goals: 1 });
                return {
                    kind: 'penalty', side: forSide, client: taker.player, chain: ch,
                    lines: this.chainLines(ch, ctx(forSide)), events: ev,
                };
            }
            if (borrowed) { bal.GOAL -= 1; ledger.anon[forSide] += 1; }
        }
        // nobody nameable to take it: a short anonymous line, but it still resolves
        if (rnd() < this.PEN_CONVERSION && ledger.anon[forSide] > 0) {
            ledger.anon[forSide] -= 1;
            return { kind: 'penalty', side: forSide, client: null, chain: null,
                lines: [`Penalty to ${team}… and it's buried. GOAL — ${team}.`],
                events: [{ tag: 'GOAL', ref: 'T', player: null, anonymous: true, side: 'own' }] };
        }
        const saved = rnd() < 0.5;
        return { kind: 'penalty', side: forSide, client: null, chain: null,
            lines: [saved ? `Penalty to ${team}… and the keeper saves it!` : `Penalty to ${team}… and it's missed! Off the woodwork and away.`],
            events: [{ tag: saved ? 'PENSAVE' : 'PENMISS', ref: 'O', player: null, anonymous: true, side: 'opp' }] };
    },

    // Fallback commentary when the workbook has no chain that can carry a required outcome for
    // this role. Clients are the one thing this feature is allowed to name, so it still reads.
    _plainLine(need, player, teamName) {
        const what = { GOAL: 'GOAL', ASSIST: 'Assist', YC: 'Yellow card', RC: 'RED CARD' }[need] || need;
        return `${what} — ${player.name} (${teamName})`;
    },

    // Does an end piece's tags deliver `need` to the piece's own player?
    // GOAL/ASSIST must land on a named ref (S/M/E); O and T are anonymous and credit nobody.
    _tagsSatisfy(tags, need) {
        if (!tags) return false;
        const parsed = this.parseTags(tags);
        const named = e => e.ref === 'S' || e.ref === 'M' || e.ref === 'E';
        if (need === 'RC') return parsed.some(e => (e.tag === 'RC' || e.tag === 'Y2C') && named(e));
        return parsed.some(e => e.tag === need && named(e));
    },

    // ================================================================ invitations
    // A club's letter inviting the agent to attend the DECIDING leg of a two-legged promotion
    // play-off final. Pure text, no DOM. The five variants are chosen by the client's team's own
    // first-leg margin. `firstLeg` is that team's score: { scored, conceded }. `targetDivision` is
    // where they go if they win (caller supplies the wording, incl. any "the").
    playoffFinalInvite({ agentName, client, teamName, oppName, targetDivision, firstLeg }) {
        const s = (firstLeg && firstLeg.scored) | 0, c = (firstLeg && firstLeg.conceded) | 0;
        const diff = s - c, score = `${s}:${c}`;
        const div = targetDivision || 'the division above';
        let line;
        if (diff >= 3)
            line = `We looked quite comfortable when we beat them ${score} in the first leg, but we haven't won the tie yet! And I know ${client} will certainly want to play to impress.`;
        else if (diff >= 1)
            line = `The first leg was quite the nailbiter, with our narrow ${score} win giving us a bit of an edge for the return leg, but it is far from decided yet. With the help of ${client}, I am sure we will succeed!`;
        else if (diff === 0)
            line = `What a competitive game that ${score} draw was — we really had to put in the fight. I know our players are hot and hungry for the return leg, so come and watch us reach for promotion! Maybe ${client} will be the one to put us over the line.`;
        else if (diff >= -2)
            line = `With our narrow ${score} loss in the first leg, we will need to dig in and give it our all to overcome ${oppName}. Will ${client} be the one to bring us back into the tie? Come along and help us reach ${div}!`;
        else
            line = `I know it didn't look good when we lost ${score} in the first leg, but it's not over till it's over. I know our players have it in them, and maybe ${client} can prove to be a deciding factor in creating a historic remontada.`;
        return `Dear ${agentName || 'Sir/Madam'},\n\n`
            + `The season is reaching its climax, and ${client} is right in the thick of it. If you'd be interested, ${teamName} would like to invite you to come and watch the game.\n\n`
            + line;
    },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { LiveSim, LIVE_SIM };
