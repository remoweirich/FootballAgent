// ============================================================
//  Leagues — standings (country + division), cups (per-country,
//  generalised into a knockout renderer and a group+knockout
//  renderer since the underlying data shapes repeat), and play-offs.
// ============================================================
const LeaguesScreen = {
    state: { country: null, tab: 'tables', division: null },

    render(el) {
        const countries = Object.keys(COUNTRY_DIVS);
        if (!this.state.country || !countries.includes(this.state.country)) this.state.country = countries[0];
        const country = this.state.country;
        const cups = COUNTRY_CUPS[country] || [];
        const tabs = [['tables', 'Tables'], ...cups, ['po', 'Play-offs']];
        if (!tabs.some(([k]) => k === this.state.tab)) this.state.tab = 'tables';

        const countryOpts = countries.map(c => `<option value="${c}" ${country === c ? 'selected' : ''}>${c}</option>`).join('');
        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <span class="hint">${GameState.league && GameState.league.finished ? 'Season complete' : 'Season ' + GameState.seasonLabel()}</span>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setCountry(this.value)">${countryOpts}</select>
        </div>
        <div class="tab-bar tab-bar--sticky" style="margin-bottom:var(--space-4)">${tabs.map(([k, l]) => `<button class="tab ${this.state.tab === k ? 'is-active' : ''}" onclick="LeaguesScreen.setTab('${k}')">${l}</button>`).join('')}</div>
        <div id="lgSection"></div>`;
        this.renderSection();
    },
    setCountry(c) { this.state.country = c; this.state.tab = 'tables'; this.state.division = null; Router.refresh(); },
    setTab(t) { this.state.tab = t; Router.refresh(); },
    setDivision(d) { this.state.division = d; this.renderSection(); },

    renderSection() {
        const body = document.getElementById('lgSection'); if (!body) return;
        const country = this.state.country, tab = this.state.tab;
        if (tab === 'tables') {
            const divs = COUNTRY_DIVS[country];
            if (!divs.includes(this.state.division)) this.state.division = divs[0];
            body.innerHTML = `<select class="select-input" style="margin-bottom:var(--space-4)" onchange="LeaguesScreen.setDivision(this.value)">
                ${divs.map(d => `<option value="${d}" ${this.state.division === d ? 'selected' : ''}>${COMPETITIONS[d].name}</option>`).join('')}</select>
                <div id="lgStandings">${this.standingsTable(this.state.division)}</div>`;
        } else if (tab === 'po') {
            body.innerHTML = this.playoffs(country);
        } else {
            const key = tab, label = (cups => { const f = cups.find(c => c[0] === tab); return f ? f[1] : tab; })(COUNTRY_CUPS[country] || []);
            const comp = GameState.league && GameState.league[key];
            body.innerHTML = (comp && comp.groups) ? this.groupCup(key, label) : this.knockoutCup(key, label);
        }
    },

    ZONE_MAP: { 'zone-promote': 'zone-promote', 'zone-relegate': 'zone-relegate', 'zone-playoff': 'zone-po-up', 'zone-releg-up': 'zone-po-up', 'zone-releg-down': 'zone-po-down' },
    standingsTable(div) {
        if (!GameState.league || !GameState.league.tables[div]) return '<p class="muted">No table yet.</p>';
        const rows = League.sortedTable(div);
        const champ = GameState.league.champions && GameState.league.champions[div];
        const country = divCountry(div);
        const ladder = COUNTRY_DIVS[country] || [];
        const tierIdx = ladder.indexOf(div);
        const relegate = tierIdx >= 0 && tierIdx < ladder.length - 1;
        const relCount = div === 'LEAGUE2' ? 2 : 3, n = rows.length;
        const pr = League.computeProRel();
        let mk = (pr && pr.marks && pr.marks[div]) || { green: [], blue: [] };
        if (!mk.green.length && !mk.blue.length && country === 'England') {
            const ids = rows.map(r => r.clubId);
            if (div === 'Natleague') mk = { green: ids.slice(0, 1), blue: ids.slice(1, 7) };
            else if (['CHAMP', 'LEAGUE1', 'LEAGUE2'].includes(div)) mk = { green: ids.slice(0, 2), blue: ids.slice(2, 6) };
        }
        const body = rows.map((r, i) => {
            const c = Clubs.getClubById(r.clubId);
            const myCount = GameState.players.filter(p => p.agentId === 'me' && (p.onLoanAt || p.clubId) === r.clubId).length;
            let zoneKey = '';
            if (country === 'Germany') zoneKey = { 'zone-relegate': 'zone-relegate', 'zone-releg-down': 'zone-releg-down' }[this._raw(country, div, i, n, 'german')] || this._raw(country, div, i, n, 'german');
            else if (country === 'Spain') zoneKey = this._raw(country, div, i, n, 'spanish');
            else if (country === 'Switzerland') zoneKey = this._raw(country, div, i, n, 'swiss');
            else if (relegate && i >= n - relCount) zoneKey = 'zone-relegate';
            else if (mk.green.includes(r.clubId)) zoneKey = 'zone-promote';
            else if (mk.blue.includes(r.clubId)) zoneKey = 'zone-playoff';
            const zoneCls = this.ZONE_MAP[zoneKey] || '';
            return `<tr class="${zoneCls}" onclick="location.hash='clubs/${encodeURIComponent(r.clubId)}'" style="cursor:pointer">
                <td>${i + 1}</td><td class="club-cell">${UI.crest(c)}${c ? c.name : r.clubId}${myCount ? ` <span class="pill pill--accent" style="padding:1px 6px">${myCount}</span>` : ''}${champ === r.clubId ? ' 🏆' : ''}</td>
                <td class="num">${r.P}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`;
        }).join('');
        return `<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>
            <p class="hint" style="margin-top:var(--space-3)">Direct promotion/relegation shown in full colour; play-off zones lighter. Tap a club for its honours and your players there.</p>`;
    },
    _raw(country, div, i, n, kind) {
        const pos = i + 1;
        if (kind === 'german') {
            if (div === 'BUNDES') return pos >= 17 ? 'zone-relegate' : (pos === 16 ? 'zone-releg-down' : '');
            if (div === '2BUNDES') return pos <= 2 ? 'zone-promote' : pos === 3 ? 'zone-releg-up' : pos >= 17 ? 'zone-relegate' : pos === 16 ? 'zone-releg-down' : '';
            if (div === '3LIGA') return pos <= 2 ? 'zone-promote' : pos === 3 ? 'zone-releg-up' : pos >= 17 ? 'zone-relegate' : '';
            if (div === 'REGIONAL1' || div === 'REGIONAL2') return pos <= 4 ? 'zone-promote' : pos >= 21 ? 'zone-relegate' : '';
            if (div === 'REGIONAL3') return pos <= 4 ? 'zone-promote' : '';
        } else if (kind === 'spanish') {
            if (div === 'LaLiga') return pos >= 18 ? 'zone-relegate' : '';
            if (div === 'LaLiga2') return pos <= 2 ? 'zone-promote' : pos <= 6 ? 'zone-releg-up' : pos >= 19 ? 'zone-relegate' : '';
            if (div === 'PrimeraSup' || div === 'PrimeraInf') return pos <= 3 ? 'zone-promote' : pos <= 7 ? 'zone-releg-up' : pos >= 19 ? 'zone-relegate' : '';
            if (div === 'Segunda') return pos <= 3 ? 'zone-promote' : pos <= 7 ? 'zone-releg-up' : '';
        } else if (kind === 'swiss') {
            if (div === 'SuperLeagueCH') return pos === 12 ? 'zone-relegate' : pos === 11 ? 'zone-releg-down' : '';
            if (div === 'ChallengeLeague') return pos === 1 ? 'zone-promote' : pos === 2 ? 'zone-releg-up' : pos === 10 ? 'zone-relegate' : pos === 9 ? 'zone-releg-down' : '';
            if (div === 'PromotionLeague') return pos === 1 ? 'zone-promote' : pos === 2 ? 'zone-releg-up' : pos >= 16 ? 'zone-relegate' : '';
            if (div === '1.LigaCH') return pos <= 2 ? 'zone-promote' : pos <= 6 ? 'zone-releg-up' : pos >= 21 ? 'zone-relegate' : '';
            if (div === '2.LigaCH') return pos <= 3 ? 'zone-promote' : pos <= 7 ? 'zone-releg-up' : '';
        }
        return '';
    },

    // Two-leg ties: rather than spelling out "Aggregate: X" and "Advances: Y" as two
    // extra lines under every tie, the advancing side's name is just highlighted (mint)
    // on the return-leg row itself — the scores are right there to add up if you want
    // to. Every tie (bye, single-match, or two-leg) is wrapped in .tie-block so
    // different fixtures in the same round get a clear separator between them.
    tie(t) {
        if (!t) return '';
        const lk = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        if (t.bye) return `<div class="tie-block"><div class="fixture"><span class="fx-home fx-win">${lk(t.h)}</span><span class="fx-score muted">bye</span><span class="fx-away"></span></div></div>`;
        if (t.leg1) {
            const l1 = t.leg1, l2 = t.leg2;
            const pensPill = t.pens ? ' <span class="pill pill--danger" style="padding:1px 6px;font-size:9.5px;margin-left:4px">pens</span>' : '';
            const leg = (label, l, highlight) => {
                const hw = highlight && t.winner === l.h, aw = highlight && t.winner === l.a;
                return `<div class="fixture fixture--labeled"><span class="fx-label">${label}${highlight ? pensPill : ''}</span><span class="fx-home ${hw ? 'fx-adv' : ''}">${lk(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away ${aw ? 'fx-adv' : ''}">${lk(l.a)}</span></div>`;
            };
            return `<div class="tie-block">${leg('Leg 1', l1, false)}${leg('Leg 2', l2, true)}</div>`;
        }
        const hw = t.winner === t.h, aw = t.winner === t.a;
        return `<div class="tie-block"><div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(t.h)}</span><span class="fx-score">${t.hg}–${t.ag}</span><span class="fx-away ${aw ? 'fx-win' : ''}">${lk(t.a)}</span></div></div>`;
    },
    knockoutCup(key, label) {
        const C = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        if (!C || !C.results || !C.results.length) return `<p class="hint">${label} hasn't kicked off yet.</p>`;
        const winner = C.winner ? `<div class="result ok" style="text-align:center">🏆 Winner: <strong>${UI.clubName(C.winner)}</strong></div>` : '';
        const rounds = C.results.slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· wk ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${winner}${rounds}`;
    },
    groupCup(key, label) {
        const K = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        if (!K || !K.groups) return `<p class="hint">${label} hasn't started yet.</p>`;
        const winner = K.winner ? `<div class="result ok" style="text-align:center">🏆 Winner: <strong>${UI.clubName(K.winner)}</strong></div>` : '';
        const groups = K.groups.map((g, i) => {
            const t = League._kSort(g.table);
            const rows = t.map((r, j) => `<div class="frow" style="${j === 0 ? 'color:var(--state-good)' : ''}"><span class="frow__k">${UI.clubName(r.clubId)}</span><span class="frow__v">${r.P}p · ${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA} · ${r.Pts}pts</span></div>`).join('');
            return `<div class="fcard" style="padding:8px 12px"><div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);padding:4px 0">Group ${i + 1}</div>${rows}</div>`;
        }).join('');
        const ko = (K.results || []).slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· wk ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${winner}<div class="section-label">Group stage</div>${groups}${ko ? `<div class="section-label" style="margin-top:var(--space-5)">Knockout</div>${ko}` : ''}`;
    },

    // ---- play-offs (this season's own only — never a stale prior-season carryover) ----
    relegTie(t) {
        if (!t) return '<p class="muted">Not yet played (week 46).</p>';
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2, pens = t.pens ? ' <span class="pill pill--danger">pens</span>' : '';
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        return `${leg('Leg 1', l1)}${leg('Leg 2', l2)}
            <div class="frow"><span class="frow__k">Aggregate${pens}</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}</span></div>
            <div class="frow"><span class="frow__k">Winner</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(t.winner)}</span></div>`;
    },
    playoffs(country) {
        if (country === 'Germany') {
            const G = GameState.league && GameState.league.germanReleg;
            if (!G) return '<p class="hint">Relegation play-offs are decided in week 46.</p>';
            return `<div class="section-label">Bundesliga / 2. Bundesliga</div><div class="fcard">${this.relegTie(G.top)}</div>
                <div class="section-label">2. Bundesliga / 3. Liga</div><div class="fcard">${this.relegTie(G.bottom)}</div>`;
        }
        if (country === 'Spain') {
            const P = GameState.league && GameState.league.playoffs;
            return ['LaLiga2', 'PrimeraSup', 'PrimeraInf', 'Segunda'].map(div => {
                const po = P && P[div];
                const title = `${COMPETITIONS[div].name} — promotion play-off`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie2Leg(po.final)}${po.winner ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
        }
        if (country === 'Switzerland') {
            const bar = GameState.league && GameState.league.swissBarrage;
            const barBlock = !bar
                ? `<div class="section-label">Barrage</div><p class="hint">Not yet played (week 46).</p>`
                : `<div class="section-label">Barrage — Super League / Challenge League</div><div class="fcard">${this.relegTie(bar.top)}</div>
                   <div class="section-label">Barrage — Challenge League / Promotion League</div><div class="fcard">${this.relegTie(bar.bottom)}</div>`;
            const P = GameState.league && GameState.league.playoffs;
            const poBlock = ['1.LigaCH', '2.LigaCH'].map(div => {
                const po = P && P[div];
                const title = `${COMPETITIONS[div].name} — promotion play-off`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie2Leg(po.final)}${po.winner ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            return barBlock + poBlock;
        }
        const P = GameState.league && GameState.league.playoffs;
        const divs = (COUNTRY_DIVS[country] || []).slice(1);
        return divs.map(div => {
            const po = P && P[div];
            const title = `${COMPETITIONS[div].name} — promotion play-off`;
            if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
            const elim = po.elim ? `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Eliminators</div>${po.elim.map(t => this.tie(t)).join('')}` : '';
            return `<div class="section-label">${title}</div><div class="fcard">${elim}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie(po.final)}${po.winner ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
        }).join('');
    },
    tie2Leg(t) {
        if (!t) return '';
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2, pens = t.pens ? ' <span class="pill pill--danger">pens</span>' : '';
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        return `${leg('Leg 1', l1)}${leg('Leg 2', l2)}<div class="frow"><span class="frow__k">Aggregate${pens}</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}</span></div>`;
    }
};
Router.register('leagues', { isMain: true, title: 'Leagues', render(el) { LeaguesScreen.render(el); } });
