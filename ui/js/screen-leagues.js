// ============================================================
//  Leagues — standings (country + division), cups (per-country,
//  generalised into a knockout renderer and a group+knockout
//  renderer since the underlying data shapes repeat), and play-offs.
// ============================================================
const LeaguesScreen = {
    state: { country: null, tab: 'tables', division: null, euComp: 'UCL', euAutoTab: true, euMd: null },

    // Country selector order: home country first (default), then Europe, then the rest in a fixed order.
    countryList() {
        const home = (GameState.homeCountry && COUNTRY_DIVS[GameState.homeCountry]) ? GameState.homeCountry : Object.keys(COUNTRY_DIVS)[0];
        const fixed = ['England', 'Germany', 'Spain', 'Italy', 'France', 'Netherlands', 'Portugal', 'Switzerland', 'Belgium'];
        const list = [home];
        if (typeof Europe !== 'undefined') list.push('Europe');
        return list.concat(fixed.filter(c => c !== home));
    },
    render(el) {
        const order = this.countryList();
        if (!this.state.country || !order.includes(this.state.country)) this.state.country = order[0];
        const country = this.state.country, isEurope = country === 'Europe';
        let tabs;
        if (isEurope) {
            tabs = this.euPhaseTabs();
            if (this.state.euAutoTab) this.state.tab = this.euCurrentDefault();          // follow the live phase
            else if (!tabs.some(([k]) => k === this.state.tab)) this.state.tab = this.euCurrentDefault();
        } else {
            const cups = COUNTRY_CUPS[country] || [];
            tabs = [['tables', 'Tables'], ...cups, ['po', 'Play-offs']];
            if (!tabs.some(([k]) => k === this.state.tab)) this.state.tab = 'tables';
        }
        const countryOpts = order.map(c => `<option value="${c}" ${country === c ? 'selected' : ''}>${c === 'Europe' ? '🇪🇺 Europe' : c}</option>`).join('');
        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <span class="hint">${GameState.league && GameState.league.finished ? 'Season complete' : 'Season ' + GameState.seasonLabel()}</span>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setCountry(this.value)">${countryOpts}</select>
        </div>
        <div class="tab-bar tab-bar--sticky" style="margin-bottom:var(--space-4);overflow-x:auto;white-space:nowrap">${tabs.map(([k, l]) => `<button class="tab ${this.state.tab === k ? 'is-active' : ''}" onclick="LeaguesScreen.setTab('${k}')">${l}</button>`).join('')}</div>
        <div id="lgSection"></div>`;
        this.renderSection();
    },
    setCountry(c) { this.state.country = c; this.state.tab = (c === 'Europe') ? null : 'tables'; this.state.division = null; this.state.euAutoTab = true; Router.refresh(); },
    setTab(t) { this.state.tab = t; if (this.state.country === 'Europe') this.state.euAutoTab = false; Router.refresh(); },   // a manual pick stops auto-following the phase
    setDivision(d) { this.state.division = d; this.renderSection(); },
    setEuComp(k) { this.state.euComp = k; Router.refresh(); },   // phases are synchronised across comps, so keep the current tab
    setEuMd(n) { this.state.euMd = n; this.renderSection(); },
    // deep-link into this screen for a domestic division (used from the club page's competition link)
    openFor(div) {
        const country = (typeof divCountry === 'function') ? divCountry(div) : null;
        if (country && COUNTRY_DIVS[country]) { this.state.country = country; this.state.division = div; this.state.tab = 'tables'; this.state.euAutoTab = true; }
        Router.go('leagues');
    },
    // lowercase per-country cup key (COUNTRY_CUPS / GameState.league) -> uppercase COMPETITIONS id
    CUP_KEY_COMP: {
        beker: 'BEKER', kbek: 'KBEK', facup: 'FACUP', llc: 'LLC', dfb: 'DFB', lpokal: 'LPOKAL',
        cdr: 'CDR', cfed: 'CFED', schwcup: 'SCHWCUP', cupabass: 'CUPABASS', lichcup: 'LICHCUP',
        coppaitalia: 'COPPA', coppacompagno: 'COPPACOMP', tacaportugal: 'TACAPT', segundataca: 'SEGTACA',
        belgiancup: 'BELCUP', notrecoupe: 'NOTRECOUPE', coupefrance: 'COUPEFR', coupenational: 'COUPENAT'
    },
    // "<competition> history" button linking to the standalone winners/players history page
    compHistLink(compId) {
        if (!compId) return '';
        return `<a class="gbtn" style="margin-top:var(--space-4)" href="${Router.link('comphist', compId)}"><i class="ti ti-history"></i>${compName(compId)} history</a>`;
    },

    renderSection() {
        const body = document.getElementById('lgSection'); if (!body) return;
        const country = this.state.country, tab = this.state.tab;
        if (country === 'Europe') {
            body.innerHTML = this.europeSection();
        } else if (tab === 'tables') {
            const divs = COUNTRY_DIVS[country];
            if (!divs.includes(this.state.division)) this.state.division = divs[0];
            body.innerHTML = `<select class="select-input" style="margin-bottom:var(--space-4)" onchange="LeaguesScreen.setDivision(this.value)">
                ${divs.map(d => `<option value="${d}" ${this.state.division === d ? 'selected' : ''}>${COMPETITIONS[d].name}</option>`).join('')}</select>
                <div id="lgStandings">${this.standingsTable(this.state.division)}</div>${this.compHistLink(this.state.division)}`;
        } else if (tab === 'po') {
            body.innerHTML = this.playoffs(country);
        } else {
            const key = tab, label = (cups => { const f = cups.find(c => c[0] === tab); return f ? f[1] : tab; })(COUNTRY_CUPS[country] || []);
            const comp = GameState.league && GameState.league[key];
            body.innerHTML = ((comp && comp.groups) ? this.groupCup(key, label) : this.knockoutCup(key, label)) + this.compHistLink(this.CUP_KEY_COMP[key]);
        }
    },

    ZONE_MAP: { 'zone-promote': 'zone-promote', 'zone-relegate': 'zone-relegate', 'zone-playoff': 'zone-po-up', 'zone-releg-up': 'zone-po-up', 'zone-releg-down': 'zone-po-down' },
    standingsTable(div) {
        if (!GameState.league || !GameState.league.tables[div]) return '<p class="muted">No table yet.</p>';
        // "Attend the Final": while a title decider in this division is an unwatched invitation, the
        // whole final round is hidden — show the pre-round table (a snapshot) and no champion.
        const hidden = typeof Attend !== 'undefined' && Attend.leagueRoundHidden(div);
        const note = hidden ? `<p class="hint" style="margin-bottom:var(--space-3)"><i class="ti ti-ticket"></i> Final matchday hidden — attend it from your inbox to see how the title is decided.</p>` : '';
        const rows = hidden ? (Attend.leagueSnapshot(div) || League.sortedTable(div)) : League.sortedTable(div);
        const champ = hidden ? null : (GameState.league.champions && GameState.league.champions[div]);
        const country = divCountry(div);
        const ladder = COUNTRY_DIVS[country] || [];
        const tierIdx = ladder.indexOf(div);
        const relegate = tierIdx >= 0 && tierIdx < ladder.length - 1;
        const relCount = div === 'LEAGUE2' ? 2 : 3, n = rows.length;
        // European-place highlighting (section 5): only the top flight of an implemented association,
        // driven by the same config as qualification. The cup winner is read live, so a row's colour
        // updates automatically once the domestic cup final is played (the overflow cascade shifts).
        const impl = (typeof EUROPE_DATA !== 'undefined') ? EUROPE_DATA.implemented[country] : null;
        let euHL = null, euCupReserved = false;
        if (impl && impl.div === div && typeof Europe !== 'undefined') {
            const cupObj = GameState.league && GameState.league[impl.cupKey];
            // while the cup final is an unwatched invitation, keep its winner out of the Europe-berth
            // highlight too — otherwise the table quietly reveals who won it
            const cupWinner = (cupObj && cupObj.winner && !(typeof Attend !== 'undefined' && Attend.cupWinnerHidden(cupObj))) ? cupObj.winner : null;
            const ids = rows.map(r => r.clubId);
            euHL = Europe.highlightMap(country, ids, cupWinner);
            euCupReserved = Europe.cupBerthReserved(country, ids, cupWinner);
        }
        const pr = League.computeProRel();
        let mk = hidden ? { green: [], blue: [] } : ((pr && pr.marks && pr.marks[div]) || { green: [], blue: [] });
        if (!hidden && !mk.green.length && !mk.blue.length && country === 'England') {
            const ids = rows.map(r => r.clubId);
            if (div === 'Natleague') mk = { green: ids.slice(0, 1), blue: ids.slice(1, 7) };
            else if (['CHAMP', 'LEAGUE1', 'LEAGUE2'].includes(div)) mk = { green: ids.slice(0, 2), blue: ids.slice(2, 6) };
        }
        const body = rows.map((r, i) => {
            const c = Clubs.getClubById(r.clubId);
            const myCount = GameState.players.filter(p => p.agentId === 'me' && (p.onLoanAt || p.clubId) === r.clubId).length;
            let zoneKey = '';
            if (hidden) zoneKey = '';   // don't colour promotion/relegation from the (hidden) final round
            else if (country === 'Germany') zoneKey = { 'zone-relegate': 'zone-relegate', 'zone-releg-down': 'zone-releg-down' }[this._raw(country, div, i, n, 'german')] || this._raw(country, div, i, n, 'german');
            else if (country === 'Spain') zoneKey = this._raw(country, div, i, n, 'spanish');
            else if (country === 'Switzerland') zoneKey = this._raw(country, div, i, n, 'swiss');
            else if (country === 'Italy') zoneKey = this._raw(country, div, i, n, 'italian');
            else if (country === 'France') zoneKey = this._raw(country, div, i, n, 'french');
            else if (relegate && i >= n - relCount) zoneKey = 'zone-relegate';
            else if (mk.green.includes(r.clubId)) zoneKey = 'zone-promote';
            else if (mk.blue.includes(r.clubId)) zoneKey = 'zone-playoff';
            const euTag = euHL ? euHL[r.clubId] : null;
            const euInfo = euTag && typeof EUROPE_TAG_INFO !== 'undefined' ? EUROPE_TAG_INFO[euTag] : null;
            const zoneCls = euInfo ? '' : (this.ZONE_MAP[zoneKey] || '');   // European left-bar replaces the promo/releg bar on that row
            // European place shown as a colour strip on the leading edge (left of the position number), like promo/relegation
            const firstTd = euInfo ? `<td style="border-left-color:${euInfo.color}">${i + 1}</td>` : `<td>${i + 1}</td>`;
            return `<tr class="${zoneCls}" onclick="location.hash='clubs/${encodeURIComponent(r.clubId)}'" style="cursor:pointer">
                ${firstTd}<td class="club-cell">${UI.crest(c)}${c ? c.name : r.clubId}${myCount ? ` <span class="pill pill--accent" style="padding:1px 6px">${myCount}</span>` : ''}${champ === r.clubId ? ' 🏆' : ''}</td>
                <td class="num">${r.P}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`;
        }).join('');
        return `${note}<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>
            ${this.euHighlightLegend(euHL, euCupReserved)}
            <p class="hint" style="margin-top:var(--space-3)">Direct promotion/relegation shown in full colour; play-off zones lighter. Tap a club for its honours and your players there.</p>`;
    },
    // legend for the European-place strips, showing only the tiers this table actually awards
    euHighlightLegend(euHL, cupReserved) {
        if (!euHL || typeof EUROPE_TAG_INFO === 'undefined') return '';
        const used = new Set(Object.values(euHL).map(t => t === 'UELcup' ? 'UEL' : t));
        const order = ['CHAMP', 'U', 'UCLq', 'UEL', 'UELq', 'UECL'];
        const items = order.filter(t => used.has(t)).map(t => `<span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:4px;height:14px;border-radius:1px;background:${EUROPE_TAG_INFO[t].color}"></span>${EUROPE_TAG_INFO[t].label}</span>`).join('');
        if (!items) return '';
        const cupNote = cupReserved ? '<div style="margin-top:4px">The domestic cup winner also earns a Europa League place — it only drops to the next league position if a club that has already qualified wins the cup.</div>' : '';
        return `<div class="hint" style="margin-top:var(--space-3)"><strong>European qualification</strong><div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:5px">${items}</div>${cupNote}<div style="margin-top:4px">See the <em>Europe</em> section (in the country dropdown) for the draws, tables and knockouts.</div></div>`;
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
        } else if (kind === 'italian') {
            // full colour = direct up/down; light green = promotion play-off; light red = relegation play-out
            if (div === 'SerieA') return pos >= 18 ? 'zone-relegate' : '';
            if (div === 'SerieB') return pos <= 2 ? 'zone-promote' : pos <= 8 ? 'zone-releg-up' : pos >= 18 ? 'zone-relegate' : (pos === 16 || pos === 17) ? 'zone-releg-down' : '';
            if (div === 'SerieC') return pos <= 3 ? 'zone-promote' : pos <= 9 ? 'zone-releg-up' : pos >= 22 ? 'zone-relegate' : (pos === 20 || pos === 21) ? 'zone-releg-down' : '';
            if (div === 'SerieD') return pos <= 3 ? 'zone-promote' : pos <= 9 ? 'zone-releg-up' : '';
        } else if (kind === 'french') {
            // full colour = direct up/down; light green = promotion play-off bracket; light red = barrage
            if (div === 'Ligue1') return pos >= 17 ? 'zone-relegate' : pos === 16 ? 'zone-releg-down' : '';
            if (div === 'Ligue2') return pos <= 2 ? 'zone-promote' : pos <= 5 ? 'zone-releg-up' : pos >= 17 ? 'zone-relegate' : pos === 16 ? 'zone-releg-down' : '';
            if (div === 'Ligue3') return pos <= 2 ? 'zone-promote' : pos <= 5 ? 'zone-releg-up' : pos >= 16 ? 'zone-relegate' : pos === 15 ? 'zone-releg-down' : '';
            if (div === 'Ligue4') return pos <= 3 ? 'zone-promote' : pos <= 6 ? 'zone-releg-up' : pos >= 19 ? 'zone-relegate' : pos === 18 ? 'zone-releg-down' : '';
            if (div === 'Ligue5') return pos <= 4 ? 'zone-promote' : pos <= 7 ? 'zone-releg-up' : '';
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
        // "Attend the Final": a final you're invited to but haven't watched keeps its result hidden
        // so the Competitions tab can't spoil it (see Attend / the inbox overview).
        if (t._attendId && typeof Attend !== 'undefined' && Attend.isHidden(t._attendId))
            return `<div class="tie-block"><div class="fixture"><span class="fx-home">${lk(t.h)}</span><span class="fx-score muted" style="font-size:11px">not played yet</span><span class="fx-away">${lk(t.a)}</span></div></div>`;
        if (t.bye) return `<div class="tie-block"><div class="fixture"><span class="fx-home fx-win">${lk(t.h)}</span><span class="fx-score muted">bye</span><span class="fx-away"></span></div></div>`;
        if (t.leg1) {
            const l1 = t.leg1, l2 = t.leg2;
            // decided on penalties (level on aggregate): show the definitive shootout score in red
            const penTag = t.pens ? ` <span style="color:var(--danger);font-size:9.5px;white-space:nowrap">(pens ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
            const leg = (label, l, highlight) => {
                const hw = highlight && t.winner === l.h, aw = highlight && t.winner === l.a;
                return `<div class="fixture fixture--labeled"><span class="fx-label">${label}${highlight ? penTag : ''}</span><span class="fx-home ${hw ? 'fx-adv' : ''}">${lk(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away ${aw ? 'fx-adv' : ''}">${lk(l.a)}</span></div>`;
            };
            // a European knockout tie can be mid-round: leg 1 played, leg 2 still to come
            if (!l2) {
                const pending = `<div class="fixture fixture--labeled"><span class="fx-label">Leg 2</span><span class="fx-home muted">${lk(l1.a)}</span><span class="fx-score muted">· to come ·</span><span class="fx-away muted">${lk(l1.h)}</span></div>`;
                return `<div class="tie-block">${leg('Leg 1', l1, false)}${pending}</div>`;
            }
            return `<div class="tie-block">${leg('Leg 1', l1, false)}${leg('Leg 2', l2, true)}</div>`;
        }
        const hw = t.winner === t.h, aw = t.winner === t.a;
        // single-match cup tie: penalties show the definitive shootout score, extra time a plain (ET)
        // — both in red, next to the result (the score already includes any ET goals)
        const penTag = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(pens ${League.penFixPair(t.pens.h, t.pens.a).join('–')})</span>`
            : t.et ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(ET)</span>` : '';
        return `<div class="tie-block"><div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(t.h)}</span><span class="fx-score">${t.hg}–${t.ag}${penTag}</span><span class="fx-away ${aw ? 'fx-win' : ''}">${lk(t.a)}</span></div></div>`;
    },
    // brief English explanation shown at the top of every cup view, keyed by competition
    CUP_BLURB: {
        beker: 'Clubs from tiers 2–4 (56 in all) start in round one; the 18 Eredivisie clubs join at the Round of 32. Every tie is a single match with the lower-ranked side at home. Rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        kbek: 'The lower-division clubs are split into twelve mixed groups of three (group games in weeks 4, 7 and 16). The twelve group winners plus the four best runners-up form the last 16, then a straight knockout to the final in week 47.',
        facup: 'All 116 English league clubs plus 12 non-league guest clubs — 128 in total — are drawn together from round one. Single-match knockout (lower-ranked side at home), with rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        llc: 'The 24 National League clubs are drawn into eight groups of three and play each other once (weeks 4 & 7). The top two of each group — 16 clubs — join the 48 League One and League Two clubs for a 64-team knockout: Round of 64 in week 11, then weeks 15, 26, 32, 38 and the final in week 47.',
        dfb: 'All 128 German clubs enter in round one. Bundesliga, 2. Bundesliga and 3. Liga sides are seeded — drawn away and kept apart in round one. Single-match rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        lpokal: 'The 48 clubs of the 1st and 2nd Regionalliga play two qualifying rounds (weeks 4 & 7); the 12 survivors join the 20 clubs of the 3. Liga at the Round of 32 (week 15). Further rounds in weeks 26, 32, 38 and 47.',
        cdr: 'All 64 clubs from the top three divisions enter round one. La Liga clubs are seeded — drawn away and kept apart in round one. Single-match rounds in weeks 4, 7, 15, 26, 38 and 47.',
        cfed: 'The 64 clubs from the bottom three divisions contest this cup. Primera Superior clubs are seeded — drawn away and kept apart in round one. Rounds in weeks 4, 7, 15, 26, 38 and 47.',
        schwcup: 'Round one pits the 1. Liga (drawn away) against the 2. Liga; the 24 winners then meet the Super League (seeded, away), Challenge League and Promotion League — 64 clubs in all. Reserve teams, Vaduz and Eschen/Mauren are replaced by virtual amateur sides. Rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        cupabass: '64 clubs from the Promotion League, 1. Liga and 2. Liga (minus Eschen/Mauren and one random reserve side). Promotion League clubs are seeded and drawn away. Rounds in weeks 4, 7, 15, 26, 38 and 47.',
        lichcup: 'Vaduz, Eschen/Mauren and six Liechtenstein amateur clubs. The quarter-finals and semi-finals are two-legged; the final is a single match. Played in weeks 32, 38 and 47.',
        coppaitalia: 'All 64 clubs from Serie A, B and C enter round one. Serie A clubs are seeded — drawn away and kept apart in round one. Single-match rounds in weeks 4, 7, 15, 26, 38 and 47.',
        coppacompagno: 'The 64 clubs from Serie B, C and D. Serie B clubs are seeded — drawn away and kept apart in round one. Rounds in weeks 4, 7, 15, 26, 38 and 47.',
        coupefrance: '128 entrants — the 100 clubs of Ligue 1 to 5 plus 28 amateur guest clubs — are drawn together from round one. The higher-division side is always drawn away. Single-match rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        coupenational: 'The 64 clubs of Ligue 3, 4 and 5, drawn together from round one. The higher-division side is always drawn away. Rounds in weeks 4, 7, 15, 26, 38 and 47.',
        tacaportugal: 'The 24 Liga 4 clubs meet in a preliminary round; the 12 winners join the 52 non-reserve clubs of the top three divisions for a 64-team knockout. The 18 Primeira Liga clubs are seeded in the first round (drawn away, kept apart). B/U21 sides are excluded. Rounds in weeks 4, 7, 15, 26, 32, 38 and 47.',
        segundataca: 'The 62 clubs of Liga Portugal 2, Liga 3 and Liga 4 (B sides included) are joined by two amateur guest clubs for a clean 64-team knockout. Rounds in weeks 4, 7, 15, 26, 38 and 47.',
        belgiancup: 'The 24 Belgian Division 2 clubs play eight groups of three (one game against each, in week 4). The 8 group winners join the 56 clubs of the top three divisions for a 64-team knockout. The 18 Jupiler Pro League clubs are seeded in the first round (drawn away, kept apart). Knockout rounds in weeks 7, 15, 26, 32, 38 and 47.',
        notrecoupe: 'The 62 clubs of the Challenger Pro League, Belgian Division 1 and Division 2 (B sides included) are joined by two amateur guest clubs for a clean 64-team knockout. Rounds in weeks 4, 7, 15, 26, 38 and 47.'
    },
    cupBlurb(key) {
        const b = this.CUP_BLURB[key];
        return b ? `<p class="hint" style="margin-bottom:var(--space-4)">${b}</p>` : '';
    },
    knockoutCup(key, label) {
        const C = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        const blurb = this.cupBlurb(key);
        if (!C || !C.results || !C.results.length) return `${blurb}<p class="hint">${label} hasn't kicked off yet.</p>`;
        const winner = (C.winner && !(typeof Attend !== 'undefined' && Attend.cupWinnerHidden(C))) ? `<div class="result ok" style="text-align:center">🏆 Winner: <strong>${UI.clubName(C.winner)}</strong></div>` : '';
        const rounds = C.results.slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· wk ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${blurb}${winner}${rounds}`;
    },
    groupCup(key, label) {
        const K = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        const blurb = this.cupBlurb(key);
        if (!K || !K.groups) return `${blurb}<p class="hint">${label} hasn't started yet.</p>`;
        const qual = key === 'llc' ? 2 : 1;   // how many per group are highlighted as qualifiers
        const winner = (K.winner && !(typeof Attend !== 'undefined' && Attend.cupWinnerHidden(K))) ? `<div class="result ok" style="text-align:center">🏆 Winner: <strong>${UI.clubName(K.winner)}</strong></div>` : '';
        const groups = K.groups.map((g, i) => {
            const t = League._kSort(g.table);
            const rows = t.map((r, j) => `<div class="frow" style="${j < qual ? 'color:var(--state-good)' : ''}"><span class="frow__k">${UI.clubName(r.clubId)}</span><span class="frow__v">${r.P}p · ${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA} · ${r.Pts}pts</span></div>`).join('');
            return `<div class="fcard" style="padding:8px 12px"><div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);padding:4px 0">Group ${i + 1}</div>${rows}</div>`;
        }).join('');
        const ko = (K.results || []).slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· wk ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${blurb}${winner}<div class="section-label">Group stage</div>${groups}${ko ? `<div class="section-label" style="margin-top:var(--space-5)">Knockout</div>${ko}` : ''}`;
    },

    // ---- play-offs (this season's own only — never a stale prior-season carryover) ----
    relegTie(t) {
        if (!t) return '<p class="muted">Not yet played (week 46).</p>';
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2;
        const pens = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(pens ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        // an unwatched invited decider: keep leg 2, the aggregate and the winner hidden
        if (t._attendId && typeof Attend !== 'undefined' && Attend.isHidden(t._attendId))
            return `${leg('Leg 1', l1)}<div class="fixture fixture--labeled"><span class="fx-label">Leg 2</span><span class="fx-home">${nm(l2.h)}</span><span class="fx-score muted" style="font-size:11px">not played yet</span><span class="fx-away">${nm(l2.a)}</span></div>`;
        return `${leg('Leg 1', l1)}${leg('Leg 2', l2)}
            <div class="frow"><span class="frow__k">Aggregate</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}${pens}</span></div>
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
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie2Leg(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
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
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie2Leg(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            return barBlock + poBlock;
        }
        if (country === 'France') {
            const P = GameState.league && GameState.league.playoffs;
            const bar = GameState.league && GameState.league.frenchBarrage;
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const brackets = ['Ligue2', 'Ligue3', 'Ligue4', 'Ligue5'].map(div => {
                const po = P && P[div];
                const title = `${COMPETITIONS[div].name} — promotion play-off`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
                return `<div class="section-label">${title}</div><div class="fcard">${hd('Round 1')}${this.tie(po.g1)}${hd('Round 2 (barrage qualifier)')}${this.tie(po.g2)}${po.winner ? `<div class="frow"><span class="frow__k">Into the barrage</span><span class="frow__v" style="color:var(--info-text)">${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            const BAR = [['L1L2', 'Ligue 1 / Ligue 2'], ['L2L3', 'Ligue 2 / Ligue 3'], ['L3L4', 'Ligue 3 / Ligue 4'], ['L4L5', 'Ligue 4 / Ligue 5']];
            const barrages = BAR.map(([k, label]) => {
                const t = bar && bar[k];
                if (!t) return `<div class="section-label">${label} barrage</div><p class="hint">Not yet played (week 46).</p>`;
                return `<div class="section-label">${label} barrage</div><div class="fcard">${this.relegTie(t)}<p class="hint">Winner plays in the higher division next season.</p></div>`;
            }).join('');
            return brackets + barrages;
        }
        if (country === 'Italy') {
            const P = GameState.league && GameState.league.playoffs;
            const pout = GameState.league && GameState.league.italianPlayout;
            const promo = ['SerieB', 'SerieC', 'SerieD'].map(div => {
                const po = P && P[div];
                const title = `${COMPETITIONS[div].name} — promotion play-off`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
                const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
                const qf = po.qf ? `${hd('Qualifiers')}${po.qf.map(t => this.tie(t)).join('')}` : '';
                return `<div class="section-label">${title}</div><div class="fcard">${qf}${hd('Semi-finals')}${(po.sf || []).map(t => this.tie(t)).join('')}${hd('Final')}${this.tie(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            const playout = ['SerieB', 'SerieC'].map(div => {
                const po = pout && pout[div];
                const title = `${COMPETITIONS[div].name} — relegation play-out`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
                return `<div class="section-label">${title}</div><div class="fcard">${this.relegTie(po.tie)}<div class="frow"><span class="frow__k">Relegated</span><span class="frow__v" style="color:var(--state-bad)">▼ ${UI.clubName(po.relegated)}</span></div></div>`;
            }).join('');
            return promo + playout;
        }
        if (country === 'Portugal') {
            const PO = GameState.league && GameState.league.ptPlayoffs;
            if (!PO) return '<p class="hint">Promotion/relegation play-offs are decided in week 46.</p>';
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const block = (label, tie, note) => `<div class="section-label">${label}</div><div class="fcard">${this.relegTie(tie)}${note ? `<p class="hint">${note}</p>` : ''}</div>`;
            const lp = block('Liga Portugal play-off', PO.lpPlayoff, 'Primeira Liga 16th vs Liga Portugal 2 3rd — the winner plays in the Primeira Liga next season.');
            const lp2 = block('Liga Portugal 2 play-off', PO.lp2Playoff, 'Liga Portugal 2 16th vs Liga 3 3rd — the winner plays in Liga Portugal 2 next season.');
            let l3 = `<div class="section-label">Liga 3 play-off</div><p class="hint">Decided in week 46.</p>`;
            if (PO.liga3PO) {
                const p = PO.liga3PO;
                l3 = `<div class="section-label">Liga 3 play-off</div><div class="fcard">${hd('Semi-final A — Liga 4 3rd v 4th')}${this.relegTie(p.sfA)}${hd('Semi-final B — Liga 3 17th v 18th')}${this.relegTie(p.sfB)}${hd('Final — loser of SF-B v winner of SF-A')}${this.relegTie(p.final)}${typeof Attend !== 'undefined' && Attend.poFinalHidden(p.final) ? '' : `<div class="frow"><span class="frow__k">Into Liga 3</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(p.winner)}</span></div>`}</div>`;
            }
            return lp + lp2 + l3;
        }
        if (country === 'Belgium') {
            const PO = GameState.league && GameState.league.bePlayoffs;
            if (!PO) return '<p class="hint">Promotion/relegation play-offs are decided in week 46.</p>';
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const block = (label, tie, note) => `<div class="section-label">${label}</div><div class="fcard">${this.relegTie(tie)}${note ? `<p class="hint">${note}</p>` : ''}</div>`;
            const pro = block('Pro League play-off', PO.proPlayoff, 'Pro League 16th vs Challenger Pro League 3rd — the winner plays in the Pro League next season.');
            const cpl = block('Challenger Pro League play-off', PO.cplPlayoff, 'Challenger Pro League 16th vs Belgian Division 1 3rd — the winner plays in the Challenger Pro League next season.');
            let d1 = `<div class="section-label">Belgian Division 1 play-off</div><p class="hint">Decided in week 46.</p>`;
            if (PO.d1PO) {
                const p = PO.d1PO;
                d1 = `<div class="section-label">Belgian Division 1 play-off</div><div class="fcard">${hd('Semi-final A — Division 2 3rd v 4th')}${this.relegTie(p.sfA)}${hd('Semi-final B — Division 1 17th v 18th')}${this.relegTie(p.sfB)}${hd('Final — loser of SF-B v winner of SF-A')}${this.relegTie(p.final)}${typeof Attend !== 'undefined' && Attend.poFinalHidden(p.final) ? '' : `<div class="frow"><span class="frow__k">Into Belgian Division 1</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(p.winner)}</span></div>`}</div>`;
            }
            return pro + cpl + d1;
        }
        const P = GameState.league && GameState.league.playoffs;
        const divs = (COUNTRY_DIVS[country] || []).slice(1);
        return divs.map(div => {
            const po = P && P[div];
            const title = `${COMPETITIONS[div].name} — promotion play-off`;
            if (!po) return `<div class="section-label">${title}</div><p class="hint">Not yet played (week 46).</p>`;
            const elim = po.elim ? `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Eliminators</div>${po.elim.map(t => this.tie(t)).join('')}` : '';
            return `<div class="section-label">${title}</div><div class="fcard">${elim}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Semi-finals</div>${(po.sf || []).map(t => this.tie(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">Final</div>${this.tie(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">Promoted</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
        }).join('');
    },
    tie2Leg(t) {
        if (!t) return '';
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2;
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        // an unwatched invited play-off decider: leg 1 already happened, but keep leg 2 + aggregate hidden
        if (t._attendId && typeof Attend !== 'undefined' && Attend.isHidden(t._attendId)) {
            return `${leg('Leg 1', l1)}<div class="fixture fixture--labeled"><span class="fx-label">Leg 2</span><span class="fx-home">${nm(l2.h)}</span><span class="fx-score muted" style="font-size:11px">not played yet</span><span class="fx-away">${nm(l2.a)}</span></div>`;
        }
        const pens = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(pens ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
        return `${leg('Leg 1', l1)}${leg('Leg 2', l2)}<div class="frow"><span class="frow__k">Aggregate</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}${pens}</span></div>`;
    },

    // ---- UEFA competitions (UCL / UEL / UECL) — global, not tied to the selected country ----
    EU_BLURB: {
        UCL: 'The Champions League. 36 clubs in one league phase: eight games each — two against a club from each seeding pot, one home and one away. 1st–8th advance straight to the Round of 16; 9th–24th contest a two-legged knockout play-off; 25th–36th are eliminated. Qualifying runs weeks 1–5, the league phase across weeks 11–31, and the knockouts from week 34 to the final in week 47.',
        UEL: 'The Europa League. Same 36-club league-phase format as the Champions League. It is made up of 16 direct entrants, the 9 clubs knocked out of the last Champions League qualifying round, and 11 qualifying winners. Qualifying runs weeks 2–6; 1st–8th reach the Round of 16 directly, 9th–24th play a knockout play-off.',
        UECL: "The Conference League — Europe's third tier — uses the identical 36-club format. It gathers 9 direct entrants, the 11 clubs dropping out of the last Europa League qualifying round, and 16 qualifying winners. Qualifying runs weeks 3–6.",
    },
    // Europe as a "country": UCL/UEL/UECL live in the division dropdown, and the main tab bar is the
    // stage list (Qualifiers / Table / each knockout round / Bracket), auto-following the live phase.
    currentEurope() {
        if (typeof Europe === 'undefined') return null;
        return (GameState.league && GameState.league.europe) || (GameState.lastSeasonReport && GameState.lastSeasonReport.europe) || null;
    },
    euActiveComp() {
        const ed = this.currentEurope(); if (!ed) return null;
        let comp = this.state.euComp; if (!ed.comps[comp]) comp = 'UCL';
        return ed.comps[comp];
    },
    euPhaseTabs() { const c = this.euActiveComp(); return c ? this.euTabs(c) : []; },
    euCurrentDefault() { const c = this.euActiveComp(); return c ? this.euDefaultTab(c) : 'qual'; },
    europeSection() {
        const ed = this.currentEurope();
        if (!ed) {   // season 1: the competitions haven't been seeded yet
            const next = GameState.seasonLabelFor(GameState.seasonStartYear + 1);
            return `<div class="fcard" style="padding:16px"><div class="section-label" style="margin-top:0">European competitions</div>
                <p class="muted">The Champions League, Europa League and Conference League begin next season (${next}). Their line-ups are seeded from this season's final league tables and domestic cup winners, so there's nothing to contest in your first campaign — check back once the new season starts.</p></div>`;
        }
        let comp = this.state.euComp; if (!ed.comps[comp]) comp = 'UCL';
        const c = ed.comps[comp];
        const live = GameState.league && GameState.league.europe;
        const seasonNote = live ? '' : '<p class="hint" style="margin-bottom:var(--space-3)">Showing last season\'s competitions.</p>';
        const dd = `<select class="select-input" style="margin-bottom:var(--space-3)" onchange="LeaguesScreen.setEuComp(this.value)">${[['UCL', 'Champions League'], ['UEL', 'Europa League'], ['UECL', 'Conference League']].map(([k, l]) => `<option value="${k}" ${comp === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
        const icon = (typeof europeTrophyIcon === 'function') ? europeTrophyIcon(comp) : '🏆';
        const euHidden = c.ko && c.ko.final && c.ko.final._attendId && typeof Attend !== 'undefined' && Attend.isHidden(c.ko.final._attendId);
        const winner = (c.ko && c.ko.winner && !euHidden) ? `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">${icon} ${(COMPETITIONS[comp] || {}).name} winner: <strong>${UI.clubName(c.ko.winner)}</strong></div>` : '';
        const tabs = this.euTabs(c);
        let stage = this.state.tab; if (!tabs.some(t => t[0] === stage)) stage = this.euDefaultTab(c);
        return seasonNote + dd + winner + this.euStage(c, comp, stage) + this.compHistLink(comp);
    },
    euTabs(c) {
        const t = [];
        if (c.qual && c.qual.rounds.length) t.push(['qual', 'Qualifiers']);
        if (c.table) t.push(['lp', 'Table']);
        if (c.schedule) t.push(['fixtures', 'Fixtures']);
        if (c.ko) {
            if (c.ko.po) t.push(['po', 'Knockout Play-offs']);
            if (c.ko.r16) t.push(['r16', 'Round of 16']);
            if (c.ko.qf) t.push(['qf', 'Quarter-finals']);
            if (c.ko.sf) t.push(['sf', 'Semi-finals']);
            if (c.ko.final) t.push(['final', 'Final']);
            if (c.ko.r16) t.push(['bracket', 'Bracket']);
        }
        return t.length ? t : [['qual', 'Qualifiers']];
    },
    euDefaultTab(c) {   // the current stage: latest knockout round, else the league phase, else qualifying
        if (c.ko) { for (const k of ['final', 'sf', 'qf', 'r16', 'po']) if (c.ko[k]) return k; }
        if (c.table) return 'lp';
        return 'qual';
    },
    euStage(c, comp, stage) {
        switch (stage) {
            case 'lp': return (c.table ? this.euTable(c) : '<p class="hint">The league-phase draw is made after qualifying (week 11).</p>') + (c.pots ? `<details style="margin-top:var(--space-4)"><summary class="section-label" style="cursor:pointer;list-style:revert">Seeding pots</summary>${this.euPots(c)}</details>` : '');
            case 'fixtures': return this.euFixtures(c);
            case 'po': return this.euRound(c, 'po', 'Knockout play-off', this._euCal('knockoutPO', 34));
            case 'r16': return this.euRound(c, 'r16', 'Round of 16', this._euCal('R16', 37));
            case 'qf': return this.euRound(c, 'qf', 'Quarter-finals', this._euCal('QF', 41));
            case 'sf': return this.euRound(c, 'sf', 'Semi-finals', this._euCal('SF', 44));
            case 'final': return this.euFinalView(c);
            case 'bracket': return this.euBracketTree(c);
            case 'qual': default: {
                const firstWk = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.qualifying[comp] && EUROPE_DATA.qualifying[comp].rounds[0] && EUROPE_DATA.qualifying[comp].rounds[0].week) || 1;
                return `<p class="hint" style="margin-bottom:var(--space-3)">${this.EU_BLURB[comp]}</p>` + (this.euQualifying(c) || `<p class="hint">Qualifying begins in week ${firstWk}.</p>`);
            }
        }
    },
    // a knockout round's first-leg week from EUROPE_DATA.calendar (fallback to the historical default)
    _euCal(key, fallback) {
        const cal = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.calendar) || {};
        const v = cal[key];
        return Array.isArray(v) ? v[0] : (v != null ? v : fallback);
    },
    euRound(c, key, label, wk) {
        const r = c.ko && c.ko[key];
        if (!r) return `<p class="hint">${label} is drawn in week ${wk}.</p>`;
        return `<div class="section-label">${label} <span class="muted" style="font-weight:400">· legs wk ${wk} &amp; ${wk + 1}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`;
    },
    euFinalView(c) {
        const f = c.ko && c.ko.final;
        const finalWk = this._euCal('final', 47);
        if (!f) return `<p class="hint">The final is a single match at a neutral venue in week ${finalWk}.</p>`;
        return `<div class="section-label">Final <span class="muted" style="font-weight:400">· neutral venue · wk ${finalWk}</span></div><div class="fcard">${this.tie({ h: f.a, a: f.b, hg: f.ag, ag: f.bg, winner: f.winner, pens: f.pens, et: f.et, _attendId: f._attendId })}</div>`;
    },
    // horizontal bracket from the Round of 16 to the final — every club's path, scroll to follow it
    euBracketTree(c) {
        if (!c.ko || !c.ko.r16) return '<p class="hint">The bracket is drawn once the Round of 16 is set (week 37).</p>';
        const w = (r, i) => r && r.winners ? r.winners[i] : null;
        const r16 = c.ko.r16, qf = c.ko.qf, sf = c.ko.sf, fin = c.ko.final;
        const side = (id, ph, winId) => {
            const win = id && winId && id === winId;
            const txt = id ? UI.clubName(id) : ph;
            return `<div style="padding:6px 9px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${win ? 'font-weight:700;color:#16A34A' : (id ? '' : 'color:var(--text-secondary)')}">${txt}</div>`;
        };
        const box = (aid, bid, winId, aPh, bPh) => `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(aid, aPh, winId)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(bid, bPh, winId)}</div>`;
        const col = (title, cells) => `<div style="display:flex;flex-direction:column;min-width:148px;flex:none"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:470px">${cells}</div></div>`;
        const cR16 = r16.ties.map(t => box(t.a, t.b, t.winner)).join('');
        const cQF = [0, 1, 2, 3].map(i => box(w(r16, 2 * i), w(r16, 2 * i + 1), qf && qf.winners ? qf.winners[i] : null, 'R16 winner', 'R16 winner')).join('');
        const cSF = [0, 1].map(i => box(qf ? w(qf, 2 * i) : null, qf ? w(qf, 2 * i + 1) : null, sf && sf.winners ? sf.winners[i] : null, 'QF winner', 'QF winner')).join('');
        const cF = box(sf ? w(sf, 0) : null, sf ? w(sf, 1) : null, fin ? fin.winner : null, 'SF winner', 'SF winner');
        return `<p class="hint" style="margin-bottom:var(--space-3)">Every club's path from the Round of 16 to the final — scroll sideways to follow it.</p>
            <div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:14px;min-width:max-content;padding:2px 2px 6px">${col('Round of 16', cR16)}${col('Quarter-finals', cQF)}${col('Semi-finals', cSF)}${col('Final', cF)}</div></div>`;
    },
    euClubCell(id) {
        const real = Clubs.getClubById(id);
        const crest = UI.crest(real || { name: UI.clubName(id), colors: { primary: '#5A626D' } });
        const assoc = (typeof Europe !== 'undefined') ? Europe.assocOf(id) : '';
        return `${crest}<span>${UI.clubName(id)}</span>${assoc ? ` <span class="muted" style="font-size:10px">${assoc}</span>` : ''}`;
    },
    euTable(c) {
        const cmp = (a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || b.GFa - a.GFa || b.W - a.W || b.Wa - a.Wa || Europe.repOf(b.clubId) - Europe.repOf(a.clubId);
        const rows = c.ranked ? c.ranked.map(id => c.table.find(r => r.clubId === id)) : c.table.slice().sort(cmp);
        const body = rows.map((r, i) => {
            const bar = i < 8 ? '#16A34A' : i < 24 ? '#2563EB' : '';   // qualification shown as a left-edge strip, like league tables
            const firstTd = bar ? `<td style="border-left-color:${bar}">${i + 1}</td>` : `<td>${i + 1}</td>`;
            return `<tr onclick="location.hash='clubs/${encodeURIComponent(r.clubId)}'" style="cursor:pointer">
                ${firstTd}<td class="club-cell">${this.euClubCell(r.clubId)}</td><td class="num">${r.P}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`;
        }).join('');
        const dot = col => `<span style="display:inline-block;width:4px;height:14px;border-radius:1px;background:${col}"></span>`;
        const legend = `<div class="hint" style="margin-top:var(--space-3);display:flex;gap:14px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:5px">${dot('#16A34A')} 1st–8th · Round of 16</span>
            <span style="display:inline-flex;align-items:center;gap:5px">${dot('#2563EB')} 9th–24th · knockout play-off</span>
            <span>25th–36th · eliminated</span></div>`;
        const done = c.ranked ? '' : `<p class="hint" style="margin-top:2px">Played ${c.mdPlayed}/8 matchdays.</p>`;
        const lpWeeks = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.calendar && EUROPE_DATA.calendar.leaguePhase) || [];
        const weeksNote = lpWeeks.length ? `<p class="hint" style="margin:0 0 var(--space-2)">Matchdays 1–8 play in weeks ${lpWeeks.join(', ')}.</p>` : '';
        return `<div class="section-label">League phase</div>${weeksNote}<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>Club</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>${legend}${done}`;
    },
    // League-phase fixtures, one matchday at a time (dropdown top-right). Shows results if played,
    // otherwise the drawn pairing — every club plays exactly once each matchday.
    euFixtures(c) {
        if (!c.schedule) return '<p class="hint">Fixtures appear once the league-phase draw is made (week 11).</p>';
        let md = this.state.euMd; if (!md || md < 1 || md > 8) md = Math.max(1, c.mdPlayed || 1);
        const played = md <= (c.mdPlayed || 0);
        const lpWeeks = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.calendar && EUROPE_DATA.calendar.leaguePhase) || [];
        const wk = lpWeeks[md - 1];
        const header = `<div class="flex-row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <div class="section-label" style="margin:0">Matchday ${md}${wk ? ` <span class="muted" style="font-weight:400">· wk ${wk}</span>` : ''}${played ? '' : ' <span class="muted" style="font-weight:400">· not played yet</span>'}</div>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setEuMd(+this.value)">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${n === md ? 'selected' : ''}>Matchday ${n}${lpWeeks[n - 1] ? ' · wk ' + lpWeeks[n - 1] : ''}</option>`).join('')}</select>
        </div>`;
        const list = played ? (c.mdResults[md - 1] || { matches: [] }).matches.map(x => [x.h, x.a, x.hg, x.ag]) : (c.schedule[md - 1] || []).map(([h, a]) => [h, a, null, null]);
        const lk = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const fx = list.map(([h, a, hg, ag]) => {
            const score = hg == null ? '<span class="fx-score muted">vs</span>' : `<span class="fx-score">${hg}–${ag}</span>`;
            const hw = hg != null && hg > ag, aw = hg != null && ag > hg;
            return `<div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(h)}</span>${score}<span class="fx-away ${aw ? 'fx-win' : ''}">${lk(a)}</span></div>`;
        }).join('');
        return header + `<div class="fcard">${fx || '<p class="hint">No fixtures.</p>'}</div>`;
    },
    euPots(c) {
        return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${c.pots.map((p, i) => `<div class="fcard" style="padding:8px 12px"><div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);padding:4px 0">Pot ${i + 1}</div>${p.map(id => `<div class="frow" style="padding:2px 0"><span class="frow__k" style="font-size:12px">${UI.clubName(id)}</span><span class="frow__v muted" style="font-size:11px">${Europe.repOf(id)}</span></div>`).join('')}</div>`).join('')}</div>`;
    },
    euQualifying(c) {
        if (!c.qual || !c.qual.rounds.length) return '';
        return c.qual.rounds.map(r => `<div class="section-label" style="margin-top:var(--space-3)">Round ${r.round} <span class="muted" style="font-weight:400">· wk ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}${(r.byes || []).map(b => `<div class="tie-block"><div class="fixture"><span class="fx-home fx-win">${UI.clubName(b)}</span><span class="fx-score muted">bye</span><span class="fx-away"></span></div></div>`).join('')}</div>`).join('');
    }
};
Router.register('leagues', { isMain: true, title: 'Leagues', render(el) { LeaguesScreen.render(el); } });

// ============================================================
//  Competition history — one page per competition (league, cup or
//  European cup): a Winners roll of honour and a sortable list of
//  every client who has featured in it.
// ============================================================
const CompHistory = {
    state: {},   // per-competition UI state
    SORTS: [['apps', 'Games'], ['goals', 'Goals'], ['assists', 'Assists'], ['cs', 'Clean sheets'], ['avg', 'Avg rating'], ['titles', 'Trophies'], ['yellow', 'Yellow cards'], ['red', 'Red cards'], ['name', 'Name (A–Z)']],
    ctx(compId) { if (!this.state[compId]) this.state[compId] = { tab: 'winners', sort: 'apps', dir: 'desc' }; return this.state[compId]; },

    render(el, compId) {
        const comp = COMPETITIONS[compId];
        if (!comp) { el.innerHTML = '<div class="empty"><div class="empty__title">Unknown competition</div></div>'; return; }
        const ctx = this.ctx(compId);
        if (!['winners', 'players'].includes(ctx.tab)) ctx.tab = 'winners';
        const isCont = comp.type === 'cont';
        const icon = (isCont && typeof europeTrophyIcon === 'function' && europeTrophyIcon(compId)) || '<i class="ti ti-trophy" style="color:var(--gold);font-size:20px"></i>';
        const tabs = [['winners', 'Winners'], ['players', 'Clients']];
        el.innerHTML = `
        <div class="flex-row" style="gap:8px;margin-bottom:var(--space-2)">${icon}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${comp.name}</span></div>
        <p class="hint" style="margin-bottom:var(--space-4)">${this.subtitle(comp.type)}</p>
        <div class="tab-bar tab-bar--sticky" style="margin-bottom:var(--space-4)">${tabs.map(([k, l]) => `<button class="tab ${ctx.tab === k ? 'is-active' : ''}" onclick="CompHistory.setTab('${compId}','${k}')">${l}</button>`).join('')}</div>
        <div id="comphistBody">${ctx.tab === 'winners' ? this.winnersHTML(compId) : this.playersHTML(compId)}</div>`;
    },
    setTab(compId, t) { this.ctx(compId).tab = t; Router.refresh(); },
    subtitle(type) {
        return type === 'cont' ? 'Roll of honour and every client who has featured in the competition.'
            : type === 'cup' ? 'Past cup winners and every client who has featured in the competition.'
                : 'Champions and every client who has played in the division.';
    },

    // ---- winners ----
    winnersOf(compId) {
        const isLeague = _isLeagueComp(compId);
        const out = [];
        Object.entries(GameState.clubHistory || {}).forEach(([clubId, arr]) => (arr || []).forEach(h => {
            const win = isLeague ? (h.division === compId && h.position === 1) : ((h.trophies || []).includes(compId) || (h.division === compId && h.position === 1));
            if (win) out.push({ year: h.year, clubId });
        }));
        const seen = new Set(), dedup = [];
        out.sort((a, b) => b.year - a.year).forEach(w => { const k = w.year + ':' + w.clubId; if (!seen.has(k)) { seen.add(k); dedup.push(w); } });
        return dedup;
    },
    winnersHTML(compId) {
        const w = this.winnersOf(compId);
        if (!w.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-trophy"></i></div><div class="empty__title">No winners yet</div><div class="empty__hint">This competition hasn't been decided in a completed season yet.</div></div>`;
        const tally = {}; w.forEach(x => tally[x.clubId] = (tally[x.clubId] || 0) + 1);
        const crest = cid => UI.crest(Clubs.getClubById(cid) || { name: UI.clubName(cid), colors: { primary: '#5A626D' } });
        const most = Object.entries(tally).sort((a, b) => b[1] - a[1] || UI.clubName(a[0]).localeCompare(UI.clubName(b[0]))).slice(0, 6)
            .map(([cid, n]) => `<a href="${Router.link('clubs', cid)}" class="frow" style="cursor:pointer"><span class="frow__k">${crest(cid)}${UI.clubName(cid)}</span><span class="frow__v">${n} title${n > 1 ? 's' : ''}</span></a>`).join('');
        const roll = w.map(x => `<a href="${Router.link('clubs', x.clubId)}" class="frow" style="cursor:pointer"><span class="frow__k">${GameState.seasonLabelFor(x.year)}</span><span class="frow__v">${crest(x.clubId)}${UI.clubName(x.clubId)}</span></a>`).join('');
        return `<div class="section-label">Most titles</div><div class="fcard" style="margin-top:var(--space-2)">${most}</div>
            <div class="section-label" style="margin-top:var(--space-4)">Roll of honour</div><div class="fcard" style="margin-top:var(--space-2);max-height:420px;overflow-y:auto">${roll}</div>`;
    },

    // ---- clients who featured ----
    playerRows(compId) {
        return GameState.players.filter(p => p.everClient).map(p => {
            const m = careerByComp(p).find(x => x.compId === compId);
            if (!m || !m.agg.apps) return null;
            const a = m.agg;
            return { p, name: p.name, apps: a.apps, goals: a.goals, assists: a.assists, cs: a.cs || 0, yellow: a.yellow, red: a.red, avg: a.avg, titles: (p.trophies || []).filter(t => t.compId === compId).length };
        }).filter(Boolean);
    },
    sortedPlayers(compId) {
        const ctx = this.ctx(compId), dir = ctx.dir === 'asc' ? 1 : -1, rows = this.playerRows(compId);
        if (ctx.sort === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name) * dir);
        return rows.sort((a, b) => ((a[ctx.sort] || 0) - (b[ctx.sort] || 0)) * dir);
    },
    playersHTML(compId) {
        const ctx = this.ctx(compId), rows = this.sortedPlayers(compId);
        const sortBtn = `<button class="gbtn" onclick="CompHistory.pickSort('${compId}')"><i class="ti ti-arrows-sort"></i>${this.SORTS.find(s => s[0] === ctx.sort)[1]}<i class="ti ti-chevron-down" style="color:var(--text-faint)"></i></button>`;
        return `<div class="flex-row" style="justify-content:flex-end;margin-bottom:var(--space-3)">${sortBtn}</div><div id="comphistPlayers">${this.playerListHTML(rows, ctx)}</div>`;
    },
    playerListHTML(rows, ctx) {
        if (!rows.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-users"></i></div><div class="empty__title">No clients yet</div><div class="empty__hint">None of your clients (past or present) have featured in this competition.</div></div>`;
        const disc = ['yellow', 'red'].includes(ctx.sort);
        return rows.map(r => {
            const gk = r.p.position === 'GK';
            const line = disc ? `<span class="card-chip card-chip--yellow"></span>${r.yellow} <span class="card-chip card-chip--red"></span>${r.red}` : `${gk ? r.cs + ' cs' : r.goals + ' g'} · ${r.assists} a`;
            return `<a href="${Router.link('client', r.p.id)}" class="list-row" style="cursor:pointer">
                <div style="flex:1;min-width:0"><div class="row-title">${UI.flag(r.p.nationality)} ${r.p.name}</div><div class="row-sub">${r.p.position} · ${r.apps} apps${r.titles ? ` · <i class="ti ti-trophy" style="font-size:11px;color:var(--gold)"></i> ${r.titles}` : ''}</div></div>
                <div style="text-align:right;font-size:12px;color:var(--text-muted)">${line}<br>${UI.ratingText(r.avg)}</div></a>`;
        }).join('');
    },
    // same "stays open" sort picker used elsewhere (ClientHistory.pickSort)
    pickSort(compId) {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Sort clients</div>
            <div id="sortPickerBody">${this.sortPickerRows(compId)}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">Done</button>`);
    },
    sortPickerRows(compId) {
        const ctx = this.ctx(compId);
        return this.SORTS.map(([id, label]) => `<button class="list-row" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="CompHistory.setSort('${compId}','${id}')"><span style="flex:1;color:var(--text)">${label}</span>${ctx.sort === id ? `<i class="ti ${ctx.dir === 'asc' ? 'ti-sort-ascending' : 'ti-sort-descending'}" style="color:var(--accent)"></i>` : ''}</button>`).join('');
    },
    setSort(compId, id) {
        const ctx = this.ctx(compId);
        if (ctx.sort === id) ctx.dir = ctx.dir === 'asc' ? 'desc' : 'asc';
        else { ctx.sort = id; ctx.dir = id === 'name' ? 'asc' : 'desc'; }
        const body = document.getElementById('sortPickerBody'); if (body) body.innerHTML = this.sortPickerRows(compId);
        const list = document.getElementById('comphistPlayers'); if (list) list.innerHTML = this.playerListHTML(this.sortedPlayers(compId), ctx);
    }
};
Router.register('comphist', { isMain: false, parent: 'leagues', title: params => (COMPETITIONS[params[0]] || {}).name || 'Competition', render(el, params) { CompHistory.render(el, params[0]); } });
