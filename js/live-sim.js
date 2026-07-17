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
    // opts.credit: { player, tag } — the outcome MUST land on this client. Without it the actor
    //   binding is free to hand a GOAL:E to whichever eligible client it likes, which quietly
    //   awards a goal to someone whose budget was zero.
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

    // 3-9 client puzzle events, scaling with how many clients are on the pitch.
    eventBudget(nClients, rnd = Math.random) {
        return Math.min(9, Math.max(3, 1 + nClients * 2 + Math.floor(rnd() * 3)));
    },

    // Distinct minutes, spread rather than clustered: the match is cut into n slots and one minute
    // is drawn inside each, so events never land two-in-a-minute and never all arrive at once.
    spreadMinutes(n, first, last, rnd = Math.random) {
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
        const rnd = spec.rnd || Math.random;
        const minutes = spec.minutes || 90;
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

        // ---- assemble, then stamp minutes across however many events we actually produced
        const out = [];
        const used = new Set(), usedPieces = new Set();
        const noteChain = ch => { used.add(this.chainKey(ch)); ch.pieces.forEach(x => usedPieces.add(x.piece.id)); };

        const chainFor = (c, need) => {
            const mates = clients.filter(x => x.side === c.side).map(x => x.player);
            const allow = tags => this._tagsSatisfy(tags, need);
            const credit = { player: c.player, tag: need };
            for (let tries = 0; tries < 10; tries++) {
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

        for (const req of required) {
            // One chain can settle several requirements at once — a GOAL:E; ASSIST:M piece pays for
            // the scorer AND the assister. The ledger is the record of what is still owed, so an
            // outcome already paid for is skipped rather than narrated a second time.
            const bal = ledger.byClient.get(req.c.player);
            const key = req.need === 'Y2C' ? 'RC' : req.need;
            if (!bal || (bal[key] || 0) <= 0) continue;

            const ch = chainFor(req.c, req.need);
            const side = req.c.side;
            if (ch) noteChain(ch);
            else if (!this._spend([{ tag: req.need, player: req.c.player, anonymous: false, side: 'own' }], side, ledger)) continue;
            out.push({
                kind: 'chain', side, need: req.need, client: req.c.player, chain: ch,
                // A required outcome with no chain to carry it (a keeper's goal, say) still has to
                // be narrated — the engine awarded it, so it appears with plain commentary rather
                // than being silently dropped from the feed.
                lines: ch ? this.chainLines(ch, { teamName: nameOf(side), oppName: oppOf(side) })
                    : [this._plainLine(req.need, req.c.player, nameOf(side))],
                events: ch ? this.resolveTags(ch)
                    : [{ tag: req.need, ref: 'E', player: req.c.player, anonymous: false, side: 'own' }],
            });
        }
        // filler: puzzle events that change nothing at all, so the ledger stays authoritative.
        // Deliberately untagged rather than "tagged but harmless" — a piece that merely looks
        // neutral is how the penalty above slipped in.
        const neutral = tags => !tags;
        for (let i = required.length; i < target; i++) {
            const c = clients[Math.floor(rnd() * clients.length) % clients.length];
            if (!c) break;
            const mates = clients.filter(x => x.side === c.side).map(x => x.player);
            const ch = this.buildChain(c.player, mates, { allow: neutral, used, usedPieces, rnd });
            if (!ch) continue;
            noteChain(ch);
            out.push({
                kind: 'chain', side: c.side, need: null, client: c.player, chain: ch,
                lines: this.chainLines(ch, { teamName: nameOf(c.side), oppName: oppOf(c.side) }),
                events: this.resolveTags(ch),
            });
        }
        // whatever the scoreline still owes after the chains — a chain may already have spent an
        // anonymous goal (GOAL:T, "an unnamed team-mate finishes"), so read the ledger, not anonGoals
        for (const side of ['home', 'away'])
            for (let i = 0; i < ledger.anon[side]; i++)
                out.push({ kind: 'goal', side, client: null, lines: [`GOAL — ${nameOf(side)}`], events: [{ tag: 'GOAL', player: null, anonymous: true, side: 'own' }] });

        // shuffle so anonymous goals aren't all last, then stamp minutes in order
        for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
        const slots = this.spreadMinutes(out.length, 1, minutes, rnd);
        out.forEach((e, i) => { e.minute = slots[i] != null ? slots[i] : minutes; });
        out.sort((a, b) => a.minute - b.minute);
        return { events: out, minutes };
    },

    // Try to pay for everything a chain produces out of the ledger. All-or-nothing: on success the
    // ledger is debited and the chain is usable, on failure nothing is spent and the chain is
    // rejected. This is the single gate that keeps the feed and the stored stats identical.
    //
    // In-play penalties are not payable yet: PENWON/PENCONC are supposed to spawn a penalty
    // resolution (workbook families N and X), and until that exists a conceded penalty would be
    // narrated and then never taken, leaving the scoreboard wrong. Rejecting them here costs some
    // drama and keeps the invariant; they come back with the shootout work.
    _spend(events, side, ledger) {
        const other = side === 'home' ? 'away' : 'home';
        const debits = [], anonDebits = { home: 0, away: 0 };
        for (const e of events) {
            if (e.tag === 'PENWON' || e.tag === 'PENCONC' || e.tag === 'PENSAVE' || e.tag === 'PENMISS') return false;
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
};

if (typeof module !== 'undefined' && module.exports) module.exports = { LiveSim, LIVE_SIM };
