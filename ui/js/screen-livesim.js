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
    BASE_MS_PER_MIN: 2200,   // 1x: ~90 minutes in ~3.3 real minutes
    TICK_MS: 100,
    other: s => (s === 'home' ? 'away' : 'home'),

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
        this.s = { clock: 0, speed: 1, paused: false, revealed: 0, done: false, dwellUntil: 0 };
        this.score = { home: 0, away: 0 };
        this.feed = [];
        // running per-client tallies for the panel, keyed by playerId
        this.tally = {};
        for (const c of match.clients) if (c.played) this.tally[c.playerId] = { g: 0, a: 0, y: 0, r: 0, shots: 0 };
        this._renderShell();
        this._timer = setInterval(() => this._tick(), this.TICK_MS);
    },

    _finish(applyAdjust = true) {
        if (this.s.done) return;
        this.s.done = true;
        clearInterval(this._timer);
        this.s.clock = this.timeline.minutes;
        // bank any converted-penalty goal the live sim moved to a client
        if (applyAdjust && typeof Attend !== 'undefined') Attend.applyStatAdjust(this.match, this.timeline.statAdjust);
        this._renderFullTime();
    },

    _close() {
        clearInterval(this._timer);
        const done = this.onDone; this.onDone = function () { };
        done();
    },

    // ---------- clock ----------
    _tick() {
        const st = this.s;
        if (st.done || st.paused) return;
        const now = Date.now();
        if (now < st.dwellUntil) { return; }
        st.clock += (this.TICK_MS * st.speed) / this.BASE_MS_PER_MIN;
        const evs = this.timeline.events;
        // reveal one chain at a time so a multi-line event can be read before the next arrives
        while (st.revealed < evs.length && evs[st.revealed].minute <= Math.floor(st.clock)) {
            const e = evs[st.revealed];
            this._apply(e);
            st.revealed++;
            const lines = (e.lines || []).length;
            if (lines > 1) { st.dwellUntil = now + Math.min(900 + lines * 700, 3200) / st.speed; break; }
        }
        if (st.clock >= this.timeline.minutes && st.revealed >= evs.length) { this._finish(); return; }
        if (st.clock > this.timeline.minutes) st.clock = this.timeline.minutes;
        this._paint();
    },

    _apply(e) {
        const d = this.scoreDelta(e);
        this.score.home += d.home; this.score.away += d.away;
        this.feed.unshift(e);
        // client tallies
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
        this.s.paused = false; this.s.speed = v; this.s.dwellUntil = 0;
        this._paint();
    },
    togglePause() { if (this.s.done) return; this.s.paused = !this.s.paused; this.s.dwellUntil = 0; this._paint(); },
    skip() {
        if (this.s.done) return;
        const evs = this.timeline.events;
        while (this.s.revealed < evs.length) { this._apply(evs[this.s.revealed]); this.s.revealed++; }
        this._finish();
    },

    // ---------- rendering ----------
    tab: 'feed',
    _setTab(t) { this.tab = t; this._paint(); },

    _renderShell() {
        const m = this.match, C = LiveView;
        document.getElementById('app').innerHTML = `<div class="lv-wrap">
            <div class="lv-board" id="lvBoard"></div>
            <div class="lv-tabs">
                <button class="lv-tab" data-t="feed" onclick="LiveView._setTab('feed')">Feed</button>
                <button class="lv-tab" data-t="stats" onclick="LiveView._setTab('stats')">Stats</button>
                <button class="lv-tab" data-t="clients" onclick="LiveView._setTab('clients')">Clients</button>
            </div>
            <div class="lv-body" id="lvBody"></div>
        </div>`;
        this._injectCSS();
        this._paint();
    },

    _clockLabel() {
        const mins = this.timeline.minutes, c = Math.min(this.s.clock, mins);
        const shown = Math.floor(c);
        if (this.s.done) return "FT";
        if (shown >= 90 && mins === 90) return "90+" + Math.min(5, Math.max(1, shown - 89)) + "'";
        return shown + "'";
    },

    _paint() {
        if (this.s.done) return;   // full-time screen owns the DOM after finish
        const b = document.getElementById('lvBoard'); if (!b) return;
        const m = this.match, st = this.s;
        const speedBtn = (v, lbl) => `<button class="lv-sp ${!st.paused && st.speed === v ? 'on' : ''}" onclick="LiveView.setSpeed(${v})">${lbl}</button>`;
        b.innerHTML = `
            <div class="lv-comp">${UI.esc(this.match._compLabel || Attend._compTitle(m))}</div>
            <div class="lv-score">
                <span class="lv-team">${UI.esc(m.homeName)}</span>
                <span class="lv-nums">${this.score.home}<span class="lv-colon">:</span>${this.score.away}</span>
                <span class="lv-team lv-team--a">${UI.esc(m.awayName)}</span>
            </div>
            <div class="lv-clock">${this._clockLabel()}</div>
            <div class="lv-ctrl">
                <button class="lv-sp ${st.paused ? 'on' : ''}" onclick="LiveView.togglePause()"><i class="ti ti-player-pause"></i></button>
                ${speedBtn(1, '1×')}${speedBtn(2, '2×')}${speedBtn(4, '4×')}
                <button class="lv-sp" onclick="LiveView.skip()">Skip ⏭</button>
            </div>`;
        document.querySelectorAll('.lv-tab').forEach(el => el.classList.toggle('on', el.dataset.t === this.tab));
        const body = document.getElementById('lvBody'); if (!body) return;
        body.innerHTML = this.tab === 'stats' ? this._statsHTML() : this.tab === 'clients' ? this._clientsHTML() : this._feedHTML();
    },

    _feedHTML() {
        if (!this.feed.length) return `<p class="lv-empty">Kick-off…</p>`;
        return this.feed.map(e => {
            const client = e.client || (e.kind === 'chain' && e.chain && e.chain.pieces[0].player);
            const accent = client ? ' lv-ev--client' : '';
            const tags = (e.events || []).filter(x => x.player).map(x => `<span class="lv-tagpill">${x.tag}</span>`).join('');
            const lines = (e.lines || []).map(l => `<div class="lv-line">${UI.esc(l)}</div>`).join('');
            return `<div class="lv-ev${accent}"><div class="lv-min">${e.minute}'</div><div class="lv-evbody">${client ? `<div class="lv-evname">${UI.esc(client.name)} ${tags}</div>` : ''}${lines}</div></div>`;
        }).join('');
    },

    _statsHTML() {
        const p = this.s.clock / this.timeline.minutes, F = this.finalStats;
        // corners are the real revealed count, not an interpolation
        const cor = { home: 0, away: 0 };
        for (const e of this.feed) if (e.corner) cor[e.corner]++;
        const yr = { home: { y: 0, r: 0 }, away: { y: 0, r: 0 } };
        for (const e of this.feed) { const d = this.cardDelta(e); yr.home.y += d.home.y; yr.home.r += d.home.r; yr.away.y += d.away.y; yr.away.r += d.away.r; }
        const possH = this.possAt(F.possession.home, p);
        const row = (label, h, a) => `<div class="lv-strow"><span class="lv-stv">${h}</span><span class="lv-stl">${label}</span><span class="lv-stv">${a}</span></div>`;
        const bar = `<div class="lv-possbar"><div class="lv-possfill" style="width:${possH}%"></div></div>`;
        return `<div class="lv-stats">
            ${row('Possession', possH + '%', (100 - possH) + '%')}${bar}
            ${row('Shots', this.statAt(F.shots.home, p), this.statAt(F.shots.away, p))}
            ${row('On target', this.statAt(F.sot.home, p), this.statAt(F.sot.away, p))}
            ${row('Corners', cor.home, cor.away)}
            ${row('Fouls', this.statAt(F.fouls.home, p), this.statAt(F.fouls.away, p))}
            ${row('Yellow', yr.home.y, yr.away.y)}
            ${row('Red', yr.home.r, yr.away.r)}
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
            const line = [t.g ? `${t.g} G` : '', t.a ? `${t.a} A` : '', t.shots ? `${t.shots} sh` : '', t.y ? `${t.y} YC` : '', t.r ? `RC` : ''].filter(Boolean).join(' · ') || 'no stats yet';
            return `<div class="lv-cl"><div class="lv-clhead"><span class="lv-clname">${UI.esc(c.name)}</span><span class="lv-clrate" style="color:${rc}">${r.toFixed(1)}</span></div>
                <div class="lv-clsub">${UI.esc(c.position)} · ${UI.esc(badge)}</div>
                <div class="lv-clstat">${line}</div></div>`;
        };
        let html = played.map(card).join('');
        if (benched.length) html += `<div class="lv-benchnote">${benched.map(c => UI.esc(c.name)).join(', ')} did not feature.</div>`;
        return `<div class="lv-clients">${html || '<p class="lv-empty">No clients on the pitch.</p>'}</div>`;
    },

    _renderFullTime() {
        const m = this.match, won = m.winner === (this._inviterId());
        const pensLine = m.pens ? `<div class="lv-ftpens">Penalties: ${m.pens.h != null ? m.pens.h + '–' + m.pens.a : (m.pens.a + '–' + m.pens.b)}</div>`
            : m.et ? `<div class="lv-ftpens">After extra time</div>` : '';
        const clientLines = this.match.clients.filter(c => c.played).map(c => {
            const t = this.tally[c.playerId] || {};
            const bits = [t.g ? `${t.g} goal${t.g > 1 ? 's' : ''}` : '', t.a ? `${t.a} assist${t.a > 1 ? 's' : ''}` : '', c.rating != null ? `${c.rating.toFixed(1)} rating` : ''].filter(Boolean).join(', ');
            return `<div class="lv-ftcl"><span>${UI.esc(c.name)}</span><span class="muted">${bits || 'played'}</span></div>`;
        }).join('');
        document.getElementById('app').innerHTML = `<div class="lv-wrap lv-ft">
            <div class="lv-ftcard">
                ${won ? '<div class="lv-fttrophy">🏆</div>' : ''}
                <div class="lv-ftlabel">Full time</div>
                <div class="lv-ftscore">${UI.esc(m.homeName)} ${this.score.home}–${this.score.away} ${UI.esc(m.awayName)}</div>
                ${pensLine}
                <div class="lv-ftclients">${clientLines}</div>
                <button class="btn btn--primary" style="margin-top:var(--space-5);width:100%" onclick="LiveView._close()">Continue</button>
            </div>
        </div>`;
        this._injectCSS();
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
        .lv-colon{margin:0 4px;color:var(--text-dim)}
        .lv-clock{margin-top:6px;font-size:var(--fs-sm);color:var(--accent);font-variant-numeric:tabular-nums}
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
