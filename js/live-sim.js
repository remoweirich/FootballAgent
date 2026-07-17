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
    PLACEHOLDER_CLIENT: 'XY',
    PLACEHOLDER_TEAM: 'xy (player\'s team)',
    PLACEHOLDER_OPP: 'yx (opposition team)',
};

const LiveSim = {
    _idx: null,

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
        }));
        this._idx = {
            roleCodes: D.roleCodes,
            start: prep(D.pieces.start), middle: prep(D.pieces.middle), end: prep(D.pieces.end),
        };
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
    pickWeighted(list, rnd = Math.random, weightOf = p => p.weight) {
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
    parseTags(str) {
        if (!str) return [];
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
    renderPiece(piece, player, ctx) {
        let t = piece.text;
        if (player) t = t.split(LIVE_SIM.PLACEHOLDER_CLIENT).join(player.name);
        t = t.split(LIVE_SIM.PLACEHOLDER_TEAM).join(ctx.teamName || '');
        t = t.split(LIVE_SIM.PLACEHOLDER_OPP).join(ctx.oppName || '');
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
    buildChain(trigger, clients, opts = {}) {
        const idx = this.init();
        const rnd = opts.rnd || Math.random;
        const code = this.roleCodeOf(trigger);
        if (!code) return null;
        const usedPieces = opts.usedPieces || new Set();
        const stale = p => usedPieces.has(p.id) ? 0.15 : 1;   // seen already: allowed, but unlikely

        const starts = idx.start.filter(p => p.codes.has(code));
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
        const middles = [];
        let cursor = start;
        const wantSecond = rnd() < LIVE_SIM.SECOND_MIDDLE_CHANCE;
        for (let i = 0; i < (wantSecond ? LIVE_SIM.MAX_MIDDLES : 1); i++) {
            // A second middle must be a DIFFERENT piece — several families (N, X, M) carry only one
            // middle per branch, so without this the chain reads the same line twice in a row.
            const pool = idx.middle.filter(p => middles.indexOf(p) < 0 &&
                this.keysLink(cursor.keys, p.keys) &&
                this._eligible(p, trigger, clients) &&
                this.chainBranch([start, ...middles, p].map(x => x.keys)));
            const m = this.pickWeighted(pool, rnd, p => p.weight * stale(p));
            if (!m) break;
            middles.push(m); cursor = m;
            // a second middle is only legal when both agree on the branch, which chainBranch checks
        }
        if (!middles.length) return null;

        const endPool = idx.end.filter(p => this.keysLink(cursor.keys, p.keys) &&
            this._eligible(p, trigger, clients) &&
            this.chainBranch([start, ...middles, p].map(x => x.keys)) &&
            (!opts.allow || opts.allow(p.tags, p)));
        const end = this.pickWeighted(endPool, rnd, p => p.weight * stale(p));
        if (!end) return null;

        return this._bind(start, middles, end, trigger, clients, rnd);
    },

    // A piece is usable if it either names nobody (connective — it just continues the last actor)
    // or lists a role code belonging to a client actually in this match.
    _eligible(piece, trigger, clients) {
        if (!piece.names) return true;
        return clients.some(c => { const rc = this.roleCodeOf(c); return rc && piece.codes.has(rc); });
    },

    // Bind an actor to every piece. Pieces that name someone take a client eligible for them;
    // pieces that don't simply carry the previous actor forward.
    _bind(start, middles, end, trigger, clients, rnd) {
        const pieces = [{ piece: start, player: trigger }];
        let last = trigger;
        for (const m of middles) {
            const player = m.names ? this._pickActor(m, clients, last, rnd, false) : last;
            pieces.push({ piece: m, player });
            last = player;
        }
        // When the end names someone AND its tags credit two different refs (GOAL:E + ASSIST:M),
        // prefer a client other than the assister — that is the "one client creates, another
        // finishes" case the data is written for. With only one client in the match it falls back
        // to the same player and resolveTags drops the self-assist.
        const wantsDistinct = end.names && /ASSIST:(M|S)/.test(end.tags) && /GOAL:E/.test(end.tags);
        const endPlayer = end.names ? this._pickActor(end, clients, last, rnd, wantsDistinct) : last;
        const endEntry = { piece: end, player: endPlayer };
        pieces.push(endEntry);
        return {
            pieces, end: endEntry,
            lastMiddle: middles.length ? pieces[pieces.length - 2] : pieces[0],
            trigger,
        };
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
};

if (typeof module !== 'undefined' && module.exports) module.exports = { LiveSim, LIVE_SIM };
