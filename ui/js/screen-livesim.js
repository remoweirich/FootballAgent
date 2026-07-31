// ============================================================
//  Live view — "Attend the Final"
// ============================================================
// A full-screen takeover (like Setup) that plays out a captured final as a running match: a
// scoreboard with a ticking clock and speed controls, a live event feed, drifting match stats
// (corners driven by the actual events), and a client panel with a live rating. The result is
// already banked — this replays LiveSim.buildTimeline(Attend.timelineSpec(match)), which matches the
// scoreline exactly. On full time it banks any converted-penalty goal (statAdjust) and hands back.
//
// The pure match math (score/stat/rating derivation) lives in static helpers with no DOM, so it is
// unit-testable; only _render / the clock loop touch the document.

const LiveView = {
    BASE_MS_PER_MIN: 730,    // 1x default: brisk (~90 minutes in ~66s), speed up from here to 2x/4x
    SLOWMO: 0.25,            // while an event narrates, the clock crawls at 25% of the default speed
    LINE_MS: 2000,           // real time between a chain's pieces revealing (start → middle → end) — paced to read
    GOAL_HOLD_MS: 2000,      // a goal freezes the clock this long and flashes the board (the celebration)
    PEN_MS: 950,             // real time between penalties in a shootout
    TICK_MS: 100,
    other: s => (s === 'home' ? 'away' : 'home'),

    // card/goal symbols for the feed tags and the panels
    TAG_SYM: { GOAL: '⚽', OG: '⚽', ASSIST: 'A', YC: '🟨', Y2C: '🟨🟥', RC: '🟥', PENMISS: '❌', PENSAVE: '🧤', PENWON: 'PK', PENCONC: 'PK' },
    tagSym(t) { return this.TAG_SYM[t] || t; },

    // ---------- pure helpers (no DOM) ----------
    // Goals this event puts on the board, per side. Sums across the timeline to exactly hg:ag.
    scoreDelta(e) {
        const d = { home: 0, away: 0 };
        for (const ev of e.events || []) {
            if (ev.tag === 'GOAL') d[ev.side === 'opp' ? LiveView.other(e.side) : e.side]++;
            else if (ev.tag === 'OG') d[ev.side === 'opp' ? e.side : LiveView.other(e.side)]++;
        }
        return d;
    },
    // Yellow/red this event shows for a client, per side (for the stat panel).
    cardDelta(e) {
        const d = { home: { y: 0, r: 0 }, away: { y: 0, r: 0 } };
        for (const ev of e.events || []) {
            if (!ev.player) continue;
            if (ev.tag === 'YC') d[e.side].y++;
            else if (ev.tag === 'RC' || ev.tag === 'Y2C') d[e.side].r++;
        }
        return d;
    },
    // Plausible full-match totals to drift toward. Corners are authoritative (from the timeline);
    // the rest are generated once and revealed in proportion to the clock so nothing jumps at the end.
    buildStats(match, timeline, rnd = Math.random) {
        const shots = { home: match.hg * 3 + 5 + Math.floor(rnd() * 7), away: match.ag * 3 + 5 + Math.floor(rnd() * 7) };
        const sot = {
            home: Math.min(shots.home, match.hg + 2 + Math.floor(rnd() * 4)),
            away: Math.min(shots.away, match.ag + 2 + Math.floor(rnd() * 4)),
        };
        const fouls = { home: 7 + Math.floor(rnd() * 8), away: 7 + Math.floor(rnd() * 8) };
        let pHome = 50 + (match.hg - match.ag) * 3 + Math.floor(rnd() * 11) - 5;
        pHome = Math.max(35, Math.min(65, pHome));
        return { shots, sot, fouls, possession: { home: pHome, away: 100 - pHome }, corners: timeline.corners || { home: 0, away: 0 } };
    },
    // ease-out so early minutes move a little faster than a flat line — reads as "settling down"
    _ease(p) { return 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 1.7); },
    // A drifting stat's shown value at progress p (0..1), never exceeding the final.
    statAt(final, p) { return Math.round(final * this._ease(p)); },
    // Possession drifts from 50/50 toward the final split.
    possAt(finalHome, p) { return Math.round(50 + (finalHome - 50) * this._ease(p)); },
    // A live rating: starts ~6.3, eases toward the engine's final rating as the match plays.
    ratingAt(finalRating, p) {
        const start = 6.3, r = start + ((finalRating != null ? finalRating : 6.5) - start) * this._ease(p);
        return Math.max(1, Math.min(10, r));
    },

    // ---------- lifecycle ----------
    show(match, onDone) {
        this.match = match;
        this.onDone = onDone || function () { };
        this.spec = Attend.timelineSpec(match);
        this.timeline = LiveSim.buildTimeline(this.spec);
        this.finalStats = this.buildStats(match, this.timeline);
        this.s = { clock: 0, speed: 1, paused: false, revealed: 0, done: false, reveal: null, phase: 'match' };
        this.score = { home: 0, away: 0 };
        this.pen = null; this._penDone = false;   // penalty shootout (two-leg / ET finals)
        this._endWhistled = false;                 // reset the final-whistle SFX guard per match
        this.feed = [];
        // running per-client tallies for the panel, keyed by playerId
        this.tally = {};
        for (const c of match.clients) if (c.played) this.tally[c.playerId] = { g: 0, a: 0, y: 0, r: 0, shots: 0 };
        this._renderShell();
        if (typeof Sound !== 'undefined') Sound.play('whistle1');   // kick-off
        this._timer = setInterval(() => this._tick(), this.TICK_MS);
    },

    _finish(applyAdjust = true) {
        if (this.s.done) return;
        this.s.done = true;
        clearInterval(this._timer);
        this.s.clock = this.timeline.minutes;
        // bank any converted-penalty goal the live sim moved to a client
        if (applyAdjust && typeof Attend !== 'undefined') Attend.applyStatAdjust(this.match, this.timeline.statAdjust);
        // stay on the tabbed view so the stats and the full event feed can still be browsed —
        // "jump to result" lands here too. Only the scoreboard controls change.
        this._paint();
    },

    _close() {
        clearInterval(this._timer); clearInterval(this._penTimer); clearTimeout(this._flashTimer);
        const done = this.onDone; this.onDone = function () { };
        done();
    },
    // Full-time button: before leaving, share the moment with your man — the party after a win,
    // the consolation after a defeat. This is also where a promised win bonus settles (see
    // Dialogue.buildPostmatchScene). Falls straight through when no client featured.
    _done() {
        const m = this.match;
        const feat = (typeof Dialogue !== 'undefined') ? Dialogue.featuredClient(m) : null;
        if (feat && typeof DialogueView !== 'undefined') {
            const won = m.winner === this._inviterId();
            const self = this;
            DialogueView.show(Dialogue.buildPostmatchScene(feat, m, won), function () { GameState.save(); self._close(); });
        } else this._close();
    },

    // ---------- clock ----------
    // Two modes. Normal: the clock runs at `speed × default`, and when it reaches an event the event
    // is added to the feed and (if it's a multi-piece chain) narration begins. Narrating: the clock
    // crawls at 25% of the default while the chain's start → middle → end pieces appear one at a
    // time, like live commentary; the goal/card only LANDS (score, stats) once the last piece shows.
    _tick() {
        const st = this.s;
        if (st.done || st.paused) return;
        const now = Date.now();
        const evs = this.timeline.events;

        // a goal just went in: hold the clock for the celebration, then carry on
        if (st.hold) { if (now < st.hold) { this._paint(); return; } st.hold = null; }

        if (st.reveal) {
            st.clock += (this.TICK_MS * this.SLOWMO) / this.BASE_MS_PER_MIN;   // slow-mo during an event
            if (now >= st.reveal.nextAt) {
                st.reveal.e._shown += 1;
                if (st.reveal.e._shown >= (st.reveal.e.lines || []).length) { this._land(st.reveal.e); st.reveal = null; }
                else st.reveal.nextAt = now + this.LINE_MS;
            }
            if (!st.reveal && st.clock >= this.timeline.minutes && st.revealed >= evs.length) { this._matchEnded(); return; }
            this._paint();
            return;
        }

        st.clock += (this.TICK_MS * st.speed) / this.BASE_MS_PER_MIN;
        if (st.revealed < evs.length && evs[st.revealed].minute <= Math.floor(st.clock)) {
            const e = evs[st.revealed]; st.revealed++;
            this.feed.unshift(e); e._shown = 1;
            if ((e.lines || []).length > 1) st.reveal = { e, nextAt: now + this.LINE_MS };   // narrate it out
            else this._land(e);                                                              // a one-liner lands at once
            this._paint();
            return;   // one event at a time
        }
        if (st.clock >= this.timeline.minutes && st.revealed >= evs.length) { this._matchEnded(); return; }
        if (st.clock > this.timeline.minutes) st.clock = this.timeline.minutes;
        this._paint();
    },

    // full time (or the end of extra time). If the tie was settled on penalties, play the shootout
    // before finishing; otherwise bank the result straight away.
    _matchEnded() {
        if (!this._endWhistled && typeof Sound !== 'undefined') { Sound.play('whistle2'); this._endWhistled = true; }   // final whistle
        if (this.match.pens && !this._penDone) { this._startShootout(); return; }
        this._finish();
    },

    // ---------- penalty shootout ----------
    _startShootout() {
        this._penDone = true;
        clearInterval(this._timer);
        this.s.clock = this.timeline.minutes;   // park the clock at 120'
        this.s.phase = 'shootout';
        const P = this.match.pens;
        // home/away tallies (pens may be stored {h,a} or {a,b}); repair to a scoreline that could
        // actually have happened, same as the banner/overview do
        const rawH = P.h != null ? P.h : P.a;
        const rawA = P.h != null ? P.a : P.b;
        const fixed = (typeof League !== 'undefined' && League.penFixPair) ? League.penFixPair(rawH, rawA) : [rawH, rawA];
        this.pen = { kicks: this._shootout(fixed[0], fixed[1]), i: 0, h: 0, a: 0 };
        this._paint();
        this._penTimer = setInterval(() => this._penTick(), this.PEN_MS);
    },
    _penTick() {
        const pen = this.pen;
        if (!pen || pen.i >= pen.kicks.length) { clearInterval(this._penTimer); this.s.phase = 'pendone'; this._finish(); return; }
        const k = pen.kicks[pen.i]; k.revealed = true; pen.i++;
        if (k.scored) { if (k.side === 'home') pen.h++; else pen.a++; }
        this._paint();
    },
    // A plausible kick-by-kick sequence that ends on the banked tallies (which side wins, and by how
    // much, is already decided — this is just the drama). Makes are front-loaded so the running score
    // stays believable and the shootout stops the instant it is mathematically settled.
    _shootout(fixH, fixA) {
        const kicks = [];
        const regH = Math.min(fixH, 5), regA = Math.min(fixA, 5);
        const homeWins = fixH > fixA;
        const patt = makes => Array.from({ length: 5 }, (_, i) => i < makes);
        const hPat = patt(regH), aPat = patt(regA);
        let h = 0, a = 0;
        for (let r = 0; r < 5; r++) {
            kicks.push({ side: 'home', scored: hPat[r] }); if (hPat[r]) h++;
            kicks.push({ side: 'away', scored: aPat[r] }); if (aPat[r]) a++;
            const rem = 5 - (r + 1);
            if (h > a + rem || a > h + rem) break;   // already settled — no more regulation kicks
        }
        // sudden death: regulation finished 5-5 (a tally above 5 says so); the winner takes one more
        if (fixH > 5 || fixA > 5) {
            const rounds = Math.max(fixH, fixA) - 5;
            for (let r = 0; r < rounds; r++) {
                const last = r === rounds - 1;
                kicks.push({ side: 'home', scored: homeWins ? true : !last });
                kicks.push({ side: 'away', scored: homeWins ? !last : true });
            }
        }
        return kicks;
    },

    // apply an event's effects to the scoreboard, stats and client tallies (the moment it "happens")
    _land(e) {
        const d = this.scoreDelta(e);
        this.score.home += d.home; this.score.away += d.away;
        // a goal freezes the clock for a beat and flashes the board — the celebration. Skipped while
        // fast-forwarding to the result (this._skipping) and once the match is already over.
        if ((d.home + d.away) > 0 && !this._skipping && !this.s.done) {
            this.s.hold = Date.now() + this.GOAL_HOLD_MS;
            this._goalFlash();
            if (typeof Sound !== 'undefined') Sound.play('goal');
        }
        for (const ev of e.events || []) {
            if (!ev.player) continue;
            const t = this.tally[ev.player.id]; if (!t) continue;
            if (ev.tag === 'GOAL') { t.g++; t.shots++; }
            else if (ev.tag === 'ASSIST') t.a++;
            else if (ev.tag === 'YC') t.y++;
            else if (ev.tag === 'RC' || ev.tag === 'Y2C') t.r++;
            else if (ev.tag === 'PENMISS') t.shots++;
        }
    },

    setSpeed(v) {
        if (this.s.done) return;
        this.s.paused = false; this.s.speed = v;
        this._paint();
    },
    togglePause() { if (this.s.done) return; this.s.paused = !this.s.paused; this._paint(); },
    skip() {
        if (this.s.done) return;
        this._skipping = true;   // no goal celebrations while fast-forwarding to the result
        const evs = this.timeline.events;
        // finish any half-narrated event, then reveal and land the rest at once
        if (this.s.reveal) { const e = this.s.reveal.e; e._shown = (e.lines || []).length; this._land(e); this.s.reveal = null; }
        while (this.s.revealed < evs.length) {
            const e = evs[this.s.revealed]; this.s.revealed++;
            this.feed.unshift(e); e._shown = (e.lines || []).length; this._land(e);
        }
        this._skipping = false; this.s.hold = null;
        this._finish();
    },

    // flash the scoreboard for the length of the goal hold (a class on the board element survives the
    // innerHTML repaints; the animation lives on .lv-nums — see _injectCSS)
    _goalFlash() {
        const b = document.getElementById('lvBoard'); if (!b) return;
        b.classList.remove('lv-goal'); void b.offsetWidth;   // restart the animation if goals come quick
        b.classList.add('lv-goal');
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => { const el = document.getElementById('lvBoard'); if (el) el.classList.remove('lv-goal'); }, this.GOAL_HOLD_MS);
    },

    // ---------- rendering ----------
    tab: 'feed',
    _setTab(t) { this.tab = t; this._paint(); },

    _renderShell() {
        const m = this.match, C = LiveView;
        document.getElementById('app').innerHTML = `<div class="lv-wrap">
            <div class="lv-board" id="lvBoard"></div>
            <div class="lv-tabs">
                <button class="lv-tab" data-t="feed" onclick="LiveView._setTab('feed')">${I18n.t('livesim.tab.feed')}</button>
                <button class="lv-tab" data-t="stats" onclick="LiveView._setTab('stats')">${I18n.t('livesim.tab.stats')}</button>
                <button class="lv-tab" data-t="clients" onclick="LiveView._setTab('clients')">${I18n.t('livesim.tab.clients')}</button>
            </div>
            <div class="lv-body" id="lvBody"></div>
        </div>`;
        this._injectCSS();
        this._boardSig = null; this._bodySig = null;   // force a fresh paint into the new shell
        this._paint();
    },

    _clockLabel() {
        const mins = this.timeline.minutes, c = Math.min(this.s.clock, mins);
        const shown = Math.floor(c);
        if (this.s.phase === 'shootout') return I18n.t('livesim.pens');
        if (this.s.done) return I18n.t('livesim.ft');
        if (shown >= 90 && mins === 90) return "90+" + Math.min(5, Math.max(1, shown - 89)) + "'";
        if (mins > 90 && shown >= 90) return I18n.t('livesim.etPrefix') + shown + "'";   // extra time
        return shown + "'";
    },

    // _tick() calls this ~10x/second, but the visible state changes far less often: the displayed
    // clock only steps once per simulated minute, the feed only on a new event or narration line,
    // and the scoreboard only on a goal. Split the paint into board + body, each guarded by a
    // signature of exactly what it renders, so an unchanged frame writes no innerHTML at all —
    // roughly an 85% cut in DOM churn over a full match, and the difference between smooth and
    // janky on a phone.
    _paint() {
        this._paintBoard();
        this._paintBody();
    },
    _paintBoard() {
        const b = document.getElementById('lvBoard'); if (!b) return;
        const st = this.s;
        const clockMin = Math.min(Math.floor(st.clock), this.timeline.minutes);
        const penSig = this.pen ? `|p${this.pen.i}-${this.pen.h}-${this.pen.a}` : '';
        const sig = `${clockMin}|${this.score.home}|${this.score.away}|${st.speed}|${st.paused}|${st.done}|${st.phase}${penSig}`;
        if (sig === this._boardSig) return;
        this._boardSig = sig;
        const m = this.match;
        const speedBtn = (v, lbl) => `<button class="lv-sp ${!st.paused && st.speed === v ? 'on' : ''}" onclick="LiveView.setSpeed(${v})">${lbl}</button>`;
        let ctrl, banner = '';
        if (st.done) {
            const won = m.winner === this._inviterId();
            const decided = m.pens ? I18n.t('livesim.pensScore', { score: League.penFixPair(m.pens.h != null ? m.pens.h : m.pens.a, m.pens.h != null ? m.pens.a : m.pens.b).join('–') }) : m.et ? I18n.t('livesim.afterET') : '';
            banner = `<div class="lv-ftbanner">${won ? '🏆 ' : ''}${I18n.t('livesim.fullTime')}${decided ? ` · <span style="color:var(--danger-text)">${decided}</span>` : ''}</div>`;
            ctrl = `<div class="lv-ctrl"><button class="btn btn--primary" style="flex:1" onclick="LiveView._done()">${I18n.t('livesim.leave')}</button></div>`;
        } else if (st.phase === 'shootout') {
            ctrl = '';   // the shootout plays itself out — no controls
        } else {
            ctrl = `<div class="lv-ctrl">
                <button class="lv-sp ${st.paused ? 'on' : ''}" onclick="LiveView.togglePause()"><i class="ti ti-player-pause"></i></button>
                ${speedBtn(1, '1×')}${speedBtn(2, '2×')}${speedBtn(4, '4×')}
                <button class="lv-sp" onclick="LiveView.skip()">${I18n.t('livesim.result')} ⏭</button>
            </div>`;
        }
        b.innerHTML = `
            <div class="lv-comp">${UI.esc(Attend._compTitle(m))}</div>
            <div class="lv-score">
                <span class="lv-team">${UI.esc(m.homeName)}</span>
                <span class="lv-nums">${this.score.home}<span class="lv-colon">:</span>${this.score.away}</span>
                <span class="lv-team lv-team--a">${UI.esc(m.awayName)}</span>
            </div>
            <div class="lv-clock">${this._clockLabel()}</div>
            ${this.pen ? this._penHTML() : ''}${banner}${ctrl}`;
    },
    // the shootout strip: a row of markers per side (⚽ scored, ✗ missed, ○ still to come) and a tally
    _penHTML() {
        const m = this.match, pen = this.pen;
        const marks = side => pen.kicks.filter(k => k.side === side)
            .map(k => `<span class="lv-penmk">${k.revealed ? (k.scored ? '⚽' : '❌') : '○'}</span>`).join('');
        const row = (name, side, tot) => `<div class="lv-penrow"><span class="lv-penteam">${UI.esc(name)}</span><span class="lv-penmks">${marks(side)}</span><span class="lv-pentot">${tot}</span></div>`;
        return `<div class="lv-pens"><div class="lv-penttl">${I18n.t('livesim.penaltyShootout')}</div>${row(m.homeName, 'home', pen.h)}${row(m.awayName, 'away', pen.a)}</div>`;
    },
    _paintBody() {
        document.querySelectorAll('.lv-tab').forEach(el => el.classList.toggle('on', el.dataset.t === this.tab));
        const body = document.getElementById('lvBody'); if (!body) return;
        const st = this.s, top = this.feed[0];
        const clockMin = Math.min(Math.floor(st.clock), this.timeline.minutes);
        // the feed only depends on which events have shown; the stats/clients tabs ease with the clock
        const sig = this.tab === 'feed'
            ? `feed|${st.revealed}|${st.done}|${this.feed.length}|${top ? top._shown : 0}`
            : `${this.tab}|${clockMin}|${st.revealed}|${st.done}|${this.score.home}-${this.score.away}`;
        if (sig === this._bodySig) return;
        this._bodySig = sig;
        body.innerHTML = this.tab === 'stats' ? this._statsHTML() : this.tab === 'clients' ? this._clientsHTML() : this._feedHTML();
    },

    _feedHTML() {
        if (!this.feed.length) return `<p class="lv-empty">${I18n.t('livesim.kickoff')}</p>`;
        return this.feed.map(e => {
            const client = e.client || (e.kind === 'chain' && e.chain && e.chain.pieces[0].player);
            const accent = client ? ' lv-ev--client' : '';
            const all = e.lines || [];
            const shown = e._shown != null ? e._shown : all.length;
            // the outcome symbol (goal/card) only appears once the move has fully played out
            const tags = shown >= all.length ? (e.events || []).filter(x => x.player).map(x => `<span class="lv-tagpill">${this.tagSym(x.tag)}</span>`).join('') : '';
            const lines = all.slice(0, shown).map(l => `<div class="lv-line">${UI.esc(l)}</div>`).join('');
            return `<div class="lv-ev${accent}"><div class="lv-min">${e.minute}'</div><div class="lv-evbody">${client ? `<div class="lv-evname">${UI.esc(client.name)} ${tags}</div>` : ''}${lines}</div></div>`;
        }).join('');
    },

    _statsHTML() {
        const p = this.s.clock / this.timeline.minutes, F = this.finalStats;
        // corners are the real revealed count; cards come from the landed client tallies
        const cor = { home: 0, away: 0 };
        for (const e of this.feed) if (e.corner && (e._shown == null || e._shown >= (e.lines || []).length)) cor[e.corner]++;
        const yr = { home: { y: 0, r: 0 }, away: { y: 0, r: 0 } };
        for (const c of this.match.clients) { const t = this.tally[c.playerId]; if (t) { yr[c.side].y += t.y; yr[c.side].r += t.r; } }
        const possH = this.possAt(F.possession.home, p);
        const row = (label, h, a) => `<div class="lv-strow"><span class="lv-stv">${h}</span><span class="lv-stl">${label}</span><span class="lv-stv">${a}</span></div>`;
        const bar = `<div class="lv-possbar"><div class="lv-possfill" style="width:${possH}%"></div></div>`;
        return `<div class="lv-stats">
            ${row(I18n.t('livesim.stat.possession'), possH + '%', (100 - possH) + '%')}${bar}
            ${row(I18n.t('livesim.stat.shots'), this.statAt(F.shots.home, p), this.statAt(F.shots.away, p))}
            ${row(I18n.t('livesim.stat.onTarget'), this.statAt(F.sot.home, p), this.statAt(F.sot.away, p))}
            ${row(I18n.t('livesim.stat.corners'), cor.home, cor.away)}
            ${row(I18n.t('livesim.stat.fouls'), this.statAt(F.fouls.home, p), this.statAt(F.fouls.away, p))}
            ${row('🟨', yr.home.y, yr.away.y)}
            ${row('🟥', yr.home.r, yr.away.r)}
        </div>`;
    },

    _clientsHTML() {
        const p = this.s.clock / this.timeline.minutes;
        const played = this.match.clients.filter(c => c.played);
        const benched = this.match.clients.filter(c => !c.played);
        const card = c => {
            const t = this.tally[c.playerId] || { g: 0, a: 0, y: 0, r: 0, shots: 0 };
            const r = this.ratingAt(c.rating, p);
            const rc = r >= 7 ? 'var(--state-good)' : r < 6.5 ? 'var(--state-bad)' : 'var(--text-secondary)';
            const badge = c.side === 'home' ? this.match.homeName : this.match.awayName;
            const line = [t.g ? `${t.g} ⚽` : '', t.a ? `${t.a} A` : '', t.shots ? `${t.shots} ${I18n.t('livesim.shotsShort')}` : '', t.y ? `🟨` : '', t.r ? `🟥` : ''].filter(Boolean).join(' · ') || I18n.t('livesim.noStatsYet');
            return `<div class="lv-cl"><div class="lv-clhead"><span class="lv-clname">${UI.esc(c.name)}</span><span class="lv-clrate" style="color:${rc}">${r.toFixed(1)}</span></div>
                <div class="lv-clsub">${UI.esc(c.position)} · ${UI.esc(badge)}</div>
                <div class="lv-clstat">${line}</div></div>`;
        };
        let html = played.map(card).join('');
        if (benched.length) html += `<div class="lv-benchnote">${I18n.t('livesim.didNotFeature', { names: benched.map(c => UI.esc(c.name)).join(', ') })}</div>`;
        return `<div class="lv-clients">${html || `<p class="lv-empty">${I18n.t('livesim.noClientsPitch')}</p>`}</div>`;
    },

    _inviterId() { const c = this.match.clients.find(x => x.side === 'home'); return c ? this.match.homeId : this.match.awayId; },

    _injectCSS() {
        if (document.getElementById('lvCSS')) return;
        const css = `
        .lv-wrap{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;z-index:60;overflow:hidden}
        .lv-board{padding:calc(env(safe-area-inset-top,0) + 16px) 16px 14px;background:var(--surface);border-bottom:1px solid var(--line);text-align:center}
        .lv-comp{font-size:var(--fs-xs);color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
        .lv-score{display:flex;align-items:center;justify-content:center;gap:10px}
        .lv-team{flex:1;font-size:var(--fs-sm);color:var(--text-secondary);text-align:right;line-height:1.2}
        .lv-team--a{text-align:left}
        .lv-nums{font-size:34px;font-weight:var(--weight-semibold);color:var(--text-bright);font-variant-numeric:tabular-nums;white-space:nowrap}
        .lv-goal .lv-nums{animation:lvGoal .4s ease-in-out 0s 5}
        @keyframes lvGoal{0%,100%{color:var(--text-bright);transform:scale(1)}50%{color:var(--accent);transform:scale(1.18)}}
        .lv-colon{margin:0 4px;color:var(--text-dim)}
        .lv-clock{margin-top:6px;font-size:var(--fs-sm);color:var(--accent);font-variant-numeric:tabular-nums}
        .lv-ftbanner{margin-top:8px;font-size:var(--fs-sm);color:var(--text-bright);font-weight:var(--weight-semibold)}
        .lv-pens{margin:10px auto 2px;max-width:340px;background:var(--surface-raised);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px}
        .lv-penttl{font-size:var(--fs-xs);color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
        .lv-penrow{display:flex;align-items:center;gap:8px;padding:2px 0}
        .lv-penteam{flex:none;width:84px;text-align:left;font-size:var(--fs-xs);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .lv-penmks{flex:1;display:flex;flex-wrap:wrap;gap:3px;font-size:13px;line-height:1}
        .lv-penmk{opacity:.9}
        .lv-pentot{flex:none;min-width:18px;text-align:right;font-weight:var(--weight-semibold);color:var(--text-bright);font-variant-numeric:tabular-nums}
        .lv-ctrl{display:flex;gap:6px;justify-content:center;margin-top:12px}
        .lv-sp{background:var(--surface-raised);border:1px solid var(--line);color:var(--text-secondary);border-radius:var(--radius-sm);padding:6px 10px;font-size:var(--fs-xs);cursor:pointer}
        .lv-sp.on{background:var(--accent-tint);border-color:var(--accent-border);color:var(--accent-text)}
        .lv-tabs{display:flex;border-bottom:1px solid var(--line);background:var(--surface)}
        .lv-tab{flex:1;background:none;border:none;color:var(--text-dim);padding:11px 0;font-size:var(--fs-sm);cursor:pointer;border-bottom:2px solid transparent}
        .lv-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
        .lv-body{flex:1;overflow-y:auto;padding:12px 14px calc(env(safe-area-inset-bottom,0) + 16px)}
        .lv-empty{color:var(--text-dim);text-align:center;padding:24px 0}
        .lv-ev{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-faint)}
        .lv-ev--client{background:var(--accent-tint);margin:0 -14px;padding:9px 14px;border-radius:var(--radius-sm);border-bottom:none}
        .lv-min{color:var(--text-dim);font-size:var(--fs-xs);font-variant-numeric:tabular-nums;min-width:26px;padding-top:2px}
        .lv-evbody{flex:1}
        .lv-evname{color:var(--accent-text);font-weight:var(--weight-semibold);font-size:var(--fs-sm);margin-bottom:2px}
        .lv-tagpill{background:var(--accent-fill);color:var(--accent-ink);border-radius:var(--radius-xs);padding:0 5px;font-size:10px;margin-left:4px}
        .lv-line{color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.5}
        .lv-stats{max-width:460px;margin:0 auto}
        .lv-strow{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
        .lv-stl{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.06em}
        .lv-stv{color:var(--text-bright);font-size:var(--fs-md);font-variant-numeric:tabular-nums;min-width:44px;text-align:center}
        .lv-possbar{height:6px;border-radius:3px;background:var(--surface-raised);overflow:hidden;margin:-4px 0 4px}
        .lv-possfill{height:100%;background:var(--accent);transition:width .4s ease}
        .lv-cl{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px}
        .lv-clhead{display:flex;justify-content:space-between;align-items:baseline}
        .lv-clname{font-weight:var(--weight-semibold);color:var(--text-bright)}
        .lv-clrate{font-size:var(--fs-lg);font-variant-numeric:tabular-nums}
        .lv-clsub{color:var(--text-dim);font-size:var(--fs-xs);margin-top:2px}
        .lv-clstat{color:var(--text-secondary);font-size:var(--fs-sm);margin-top:6px}
        .lv-benchnote{color:var(--text-dim);font-size:var(--fs-xs);font-style:italic;margin-top:6px}
        .lv-ft{align-items:center;justify-content:center}
        .lv-ftcard{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:28px 24px;max-width:400px;width:88%;text-align:center}
        .lv-fttrophy{font-size:42px;margin-bottom:8px}
        .lv-ftlabel{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em}
        .lv-ftscore{font-size:var(--fs-lg);color:var(--text-bright);font-weight:var(--weight-semibold);margin-top:8px}
        .lv-ftpens{color:var(--danger-text);font-size:var(--fs-sm);margin-top:6px}
        .lv-ftclients{margin-top:16px;text-align:left}
        .lv-ftcl{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line-faint);font-size:var(--fs-sm);color:var(--text-secondary)}`;
        const el = document.createElement('style'); el.id = 'lvCSS'; el.textContent = css; document.head.appendChild(el);
    },
};

// ============================================================
//  Attend overview — the inbox screen listing this week's finals
// ============================================================
// Lists the finals you're invited to, least reputable first. You attend up to three, forward only:
// watching a game reveals it and every earlier one and lets you no longer go back. Everything still
// unseen reveals when you advance the week (Attend.finalizeWindow).
const AttendOverview = {
    render(el) {
        const w = (typeof Attend !== 'undefined') ? Attend.window() : null;
        if (!w || !w.finals.length) { el.innerHTML = `<p class="hint" style="text-align:center;padding:28px 0">${I18n.t('livesim.noFinalsNow')}</p>`; return; }
        const left = Attend.watchesLeft();
        const rows = w.finals.map((m, i) => {
            const revealed = Attend.isRevealed(i), watchable = Attend.isWatchable(i);
            const comp = Attend._compTitle(m);
            const when = (m.day && m.time) ? `${m.day} · ${m.time}` : '';
            let action;
            if (revealed) {
                const note = m.pens ? I18n.t('livesim.pensNote', { score: League.penFixPair(m.pens.h != null ? m.pens.h : m.pens.a, m.pens.h != null ? m.pens.a : m.pens.b).join('–') }) : m.et ? I18n.t('livesim.etNote') : '';
                action = `<div class="lv-ov-res">${m.hg}–${m.ag}<span style="color:var(--danger-text);font-size:11px">${note}</span></div>`;
            } else if (watchable) {
                action = `<button class="btn btn--primary lv-ov-btn" onclick="AttendOverview.watch(${i})">${I18n.t('livesim.attend')}</button>`;
            } else {
                const reason = Attend.watchBlockReason(i) || I18n.t('livesim.inThePast');
                action = `<div class="lv-ov-locked"><i class="ti ti-lock"></i> ${reason}</div>`;
            }
            return `<div class="lv-ov-card">
                ${when ? `<div class="lv-ov-when">${when}</div>` : ''}
                <div class="lv-ov-fix">${UI.esc(m.homeName)} <span style="color:var(--text-dim)">${I18n.t('livesim.vs')}</span> ${UI.esc(m.awayName)}</div>
                <div class="lv-ov-comp">${UI.esc(comp)}</div>
                ${action}</div>`;
        }).join('');
        this._injectOverviewCSS();
        el.innerHTML = `<p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('livesim.overviewIntro', { n: w.finals.length, left })}</p>${rows}`;
    },
    watch(i) {
        const w = (typeof Attend !== 'undefined') ? Attend.window() : null;
        if (!w || !Attend.isWatchable(i) || typeof LiveView === 'undefined') return;
        const m = w.finals[i];
        const start = function () {
            LiveView.show(m, function () {
                Attend.watch(i); GameState.save();
                Router.go('attendfinals');   // rebuild the shell and land back on the overview
            });
        };
        // a word with your man in the dressing room first (calm him, fire him up, or promise a
        // win bonus) — pure relationship play, the banked result is untouched
        const feat = (typeof Dialogue !== 'undefined') ? Dialogue.featuredClient(m) : null;
        if (feat && typeof DialogueView !== 'undefined') DialogueView.show(Dialogue.buildPrematchScene(feat, m), start);
        else start();
    },
    _injectOverviewCSS() {
        if (document.getElementById('lvOvCSS')) return;
        const css = `
        .lv-ov-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px}
        .lv-ov-when{color:var(--accent-text);font-size:var(--fs-xs);font-weight:var(--weight-semibold);margin-bottom:3px}
        .lv-ov-fix{color:var(--text-bright);font-weight:var(--weight-semibold);line-height:1.3}
        .lv-ov-comp{color:var(--text-dim);font-size:var(--fs-xs);margin-top:2px;margin-bottom:10px}
        .lv-ov-btn{width:100%;padding:7px 0;font-size:var(--fs-sm)}
        .lv-ov-res{font-variant-numeric:tabular-nums;color:var(--text-bright);font-weight:var(--weight-semibold);font-size:var(--fs-md)}
        .lv-ov-locked{color:var(--text-dim);font-size:var(--fs-xs)}`;
        const el = document.createElement('style'); el.id = 'lvOvCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
Router.register('attendfinals', { isMain: false, parent: 'inbox', title: () => I18n.t('nego.finalsToAttend'), render(el) { AttendOverview.render(el); } });
