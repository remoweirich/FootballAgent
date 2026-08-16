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
            tabs = [['tables', I18n.t('leagues.tables')], ...cups, ['po', I18n.t('leagues.playoffs')]];
            if (!tabs.some(([k]) => k === this.state.tab)) this.state.tab = 'tables';
        }
        const countryOpts = order.map(c => `<option value="${c}" ${country === c ? 'selected' : ''}>${c === 'Europe' ? '🇪🇺 ' + I18n.t('leagues.europe') : c}</option>`).join('');
        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <span class="hint">${GameState.league && GameState.league.finished ? I18n.t('leagues.seasonComplete') : I18n.t('leagues.seasonN', { label: GameState.seasonLabel() })}</span>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setCountry(this.value)">${countryOpts}</select>
        </div>
        <div class="tab-bar tab-bar--sticky" style="margin-bottom:var(--space-4);overflow-x:auto;white-space:nowrap">${tabs.map(([k, l]) => `<button class="tab ${this.state.tab === k ? 'is-active' : ''}" onclick="LeaguesScreen.setTab('${k}')">${l}</button>`).join('')}</div>
        <div id="lgSection"></div>`;
        this.renderSection();
    },
    setCountry(c) { this.state.country = c; this.state.tab = (c === 'Europe') ? null : 'tables'; this.state.division = null; this.state.euAutoTab = true; Router.refresh(); },
    setTab(t) { this.state.tab = t; if (this.state.country === 'Europe') this.state.euAutoTab = false; Router.refresh(); },   // a manual pick stops auto-following the phase
    setDivision(d) { this.state.division = d; this.state.leagueMd = null; this.renderSection(); },
    setLeagueView(v) { this.state.leagueView = v; this.state.leagueMd = null; this.renderSection(); },
    setLeagueMd(n) { this.state.leagueMd = n; this.renderSection(); },
    setCupView(v) { this.state.cupView = v; this.renderSection(); },
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
        return `<a class="gbtn" style="margin-top:var(--space-4)" href="${Router.link('comphist', compId)}"><i class="ti ti-history"></i>${I18n.t('leagues.compHistLink', { comp: compName(compId) })}</a>`;
    },

    renderSection() {
        const body = document.getElementById('lgSection'); if (!body) return;
        const country = this.state.country, tab = this.state.tab;
        if (country === 'Europe') {
            body.innerHTML = this.europeSection();
        } else if (tab === 'tables') {
            const divs = COUNTRY_DIVS[country];
            if (!divs.includes(this.state.division)) this.state.division = divs[0];
            const fixturesView = this.state.leagueView === 'fixtures';
            const toggle = `<div class="tab-bar" style="margin-bottom:var(--space-3)"><button class="tab ${!fixturesView ? 'is-active' : ''}" onclick="LeaguesScreen.setLeagueView('table')">${I18n.t('leagues.tableTab')}</button><button class="tab ${fixturesView ? 'is-active' : ''}" onclick="LeaguesScreen.setLeagueView('fixtures')">${I18n.t('leagues.fixturesTab')}</button></div>`;
            body.innerHTML = `<select class="select-input" style="margin-bottom:var(--space-4)" onchange="LeaguesScreen.setDivision(this.value)">
                ${divs.map(d => `<option value="${d}" ${this.state.division === d ? 'selected' : ''}>${COMPETITIONS[d].name}</option>`).join('')}</select>
                ${toggle}
                <div id="lgStandings">${fixturesView ? this.leagueFixtures(this.state.division) : this.standingsTable(this.state.division)}</div>${this.compHistLink(this.state.division)}`;
        } else if (tab === 'po') {
            body.innerHTML = this.playoffs(country);
        } else {
            const key = tab, label = (cups => { const f = cups.find(c => c[0] === tab); return f ? f[1] : tab; })(COUNTRY_CUPS[country] || []);
            const comp = GameState.league && GameState.league[key];
            const C = comp || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
            // the bracket becomes available once a knockout round of 16/8/4 teams (8/4/2 ties) has been drawn
            const bracketable = !!(C && C.results && C.results.some(r => [8, 4, 2].includes((r.ties || []).length)));
            const bracketView = bracketable && this.state.cupView === 'bracket';
            const toggle = bracketable ? `<div class="tab-bar" style="margin-bottom:var(--space-3)"><button class="tab ${!bracketView ? 'is-active' : ''}" onclick="LeaguesScreen.setCupView('rounds')">${I18n.t('leagues.cupRoundsTab')}</button><button class="tab ${bracketView ? 'is-active' : ''}" onclick="LeaguesScreen.setCupView('bracket')">${I18n.t('leagues.bracketTab')}</button></div>` : '';
            const bodyHtml = bracketView ? this.cupBracket(C) : ((comp && comp.groups) ? this.groupCup(key, label) : this.knockoutCup(key, label));
            body.innerHTML = toggle + bodyHtml + this.compHistLink(this.CUP_KEY_COMP[key]);
        }
    },

    ZONE_MAP: { 'zone-promote': 'zone-promote', 'zone-relegate': 'zone-relegate', 'zone-playoff': 'zone-po-up', 'zone-releg-up': 'zone-po-up', 'zone-releg-down': 'zone-po-down' },
    standingsTable(div) {
        if (!GameState.league || !GameState.league.tables[div]) return `<p class="muted">${I18n.t('leagues.noTable')}</p>`;
        // "Attend the Final": while a title decider in this division is an unwatched invitation, the
        // whole final round is hidden — show the pre-round table (a snapshot) and no champion.
        const hidden = typeof Attend !== 'undefined' && Attend.leagueRoundHidden(div);
        const note = hidden ? `<p class="hint" style="margin-bottom:var(--space-3)"><i class="ti ti-ticket"></i> ${I18n.t('leagues.finalHidden')}</p>` : '';
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
        return `${note}<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('nego.club')}</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>
            ${this.euHighlightLegend(euHL, euCupReserved)}
            <p class="hint" style="margin-top:var(--space-3)">${I18n.t('leagues.tableHint')}</p>`;
    },
    // legend for the European-place strips, showing only the tiers this table actually awards
    euHighlightLegend(euHL, cupReserved) {
        if (!euHL || typeof EUROPE_TAG_INFO === 'undefined') return '';
        const used = new Set(Object.values(euHL).map(t => t === 'UELcup' ? 'UEL' : t));
        const order = ['CHAMP', 'U', 'UCLq', 'UEL', 'UELq', 'UECL'];
        const items = order.filter(t => used.has(t)).map(t => `<span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:4px;height:14px;border-radius:1px;background:${EUROPE_TAG_INFO[t].color}"></span>${EUROPE_TAG_INFO[t].label}</span>`).join('');
        if (!items) return '';
        const cupNote = cupReserved ? `<div style="margin-top:4px">${I18n.t('leagues.cupNote')}</div>` : '';
        return `<div class="hint" style="margin-top:var(--space-3)"><strong>${I18n.t('leagues.euQualification')}</strong><div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:5px">${items}</div>${cupNote}<div style="margin-top:4px">${I18n.t('leagues.seeEurope')}</div></div>`;
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
            return `<div class="tie-block"><div class="fixture"><span class="fx-home">${lk(t.h)}</span><span class="fx-score muted" style="font-size:11px">${I18n.t('leagues.notPlayedYet')}</span><span class="fx-away">${lk(t.a)}</span></div></div>`;
        if (t.bye) return `<div class="tie-block"><div class="fixture"><span class="fx-home fx-win">${lk(t.h)}</span><span class="fx-score muted">${I18n.t('leagues.bye')}</span><span class="fx-away"></span></div></div>`;
        if (t.leg1) {
            const l1 = t.leg1, l2 = t.leg2;
            // decided on penalties (level on aggregate): show the definitive shootout score in red
            const penTag = t.pens ? ` <span style="color:var(--danger);font-size:9.5px;white-space:nowrap">(${I18n.t('leagues.pens')} ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
            const leg = (label, l, highlight) => {
                const hw = highlight && t.winner === l.h, aw = highlight && t.winner === l.a;
                return `<div class="fixture fixture--labeled"><span class="fx-label">${label}${highlight ? penTag : ''}</span><span class="fx-home ${hw ? 'fx-adv' : ''}">${lk(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away ${aw ? 'fx-adv' : ''}">${lk(l.a)}</span></div>`;
            };
            // a European knockout tie can be mid-round: leg 1 played, leg 2 still to come
            if (!l2) {
                const pending = `<div class="fixture fixture--labeled"><span class="fx-label">${I18n.t('leagues.leg2')}</span><span class="fx-home muted">${lk(l1.a)}</span><span class="fx-score muted">${I18n.t('leagues.toCome')}</span><span class="fx-away muted">${lk(l1.h)}</span></div>`;
                return `<div class="tie-block">${leg(I18n.t('leagues.leg1'), l1, false)}${pending}</div>`;
            }
            return `<div class="tie-block">${leg(I18n.t('leagues.leg1'), l1, false)}${leg(I18n.t('leagues.leg2'), l2, true)}</div>`;
        }
        const hw = t.winner === t.h, aw = t.winner === t.a;
        // single-match cup tie: penalties show the definitive shootout score, extra time a plain (ET)
        // — both in red, next to the result (the score already includes any ET goals)
        const penTag = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(${I18n.t('leagues.pens')} ${League.penFixPair(t.pens.h, t.pens.a).join('–')})</span>`
            : t.et ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(${I18n.t('leagues.etTag')})</span>` : '';
        return `<div class="tie-block"><div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(t.h)}</span><span class="fx-score">${t.hg}–${t.ag}${penTag}</span><span class="fx-away ${aw ? 'fx-win' : ''}">${lk(t.a)}</span></div></div>`;
    },
    cupBlurb(key) {
        const k = 'leagues.cupBlurb.' + key;
        const b = I18n.t(k);
        return b !== k ? `<p class="hint" style="margin-bottom:var(--space-4)">${b}</p>` : '';
    },
    knockoutCup(key, label) {
        const C = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        const blurb = this.cupBlurb(key);
        if (!C || !C.results || !C.results.length) return `${blurb}<p class="hint">${I18n.t('leagues.notKickedOff', { label })}</p>`;
        const winner = (C.winner && !(typeof Attend !== 'undefined' && Attend.cupWinnerHidden(C))) ? `<div class="result ok" style="text-align:center">${I18n.t('leagues.winnerLine', { club: UI.clubName(C.winner) })}</div>` : '';
        const rounds = C.results.slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${blurb}${winner}${rounds}`;
    },
    groupCup(key, label) {
        const K = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        const blurb = this.cupBlurb(key);
        if (!K || !K.groups) return `${blurb}<p class="hint">${I18n.t('leagues.notStarted', { label })}</p>`;
        const qual = key === 'llc' ? 2 : 1;   // how many per group are highlighted as qualifiers
        const winner = (K.winner && !(typeof Attend !== 'undefined' && Attend.cupWinnerHidden(K))) ? `<div class="result ok" style="text-align:center">${I18n.t('leagues.winnerLine', { club: UI.clubName(K.winner) })}</div>` : '';
        const groups = K.groups.map((g, i) => {
            const t = League._kSort(g.table);
            const rows = t.map((r, j) => `<div class="frow" style="${j < qual ? 'color:var(--state-good)' : ''}"><span class="frow__k">${UI.clubName(r.clubId)}</span><span class="frow__v">${r.P}p · ${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA} · ${r.Pts}pts</span></div>`).join('');
            return `<div class="fcard" style="padding:8px 12px"><div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);padding:4px 0">${I18n.t('leagues.groupN', { n: i + 1 })}</div>${rows}</div>`;
        }).join('');
        const ko = (K.results || []).slice().reverse().map(r => `<div class="section-label">${r.round} <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`).join('');
        return `${blurb}${winner}<div class="section-label">${I18n.t('leagues.groupStage')}</div>${groups}${ko ? `<div class="section-label" style="margin-top:var(--space-5)">${I18n.t('leagues.knockout')}</div>${ko}` : ''}`;
    },

    // ---- per-league fixtures, one matchday at a time (dropdown top-right) ----
    // Domestic leagues keep only the fixture schedule and the aggregate table (individual match
    // scores aren't stored), so this shows the pairings for every matchday; played matchdays are
    // tagged. The full round-robin already lives in GameState.league.schedule, so this is cheap.
    leagueFixtures(div) {
        const L = GameState.league, s = L && L.schedule && L.schedule[div];
        if (!s || !s.length) return `<p class="hint">${I18n.t('leagues.fixturesDraw')}</p>`;
        const total = s.length, done = (L.mdIndex && L.mdIndex[div]) || 0;
        let md = this.state.leagueMd; if (!md || md < 1 || md > total) md = Math.min(total, done + 1);
        // the final round is withheld while it holds an unwatched title/promotion decider you're invited to
        const finalHidden = md === total && typeof Attend !== 'undefined' && Attend.leagueRoundHidden(div);
        const played = md <= done && !finalHidden;
        const opts = Array.from({ length: total }, (_, i) => `<option value="${i + 1}" ${i + 1 === md ? 'selected' : ''}>${I18n.t('leagues.matchdayN', { n: i + 1 })}</option>`).join('');
        const note = finalHidden ? `<p class="hint" style="margin-bottom:var(--space-3)"><i class="ti ti-ticket"></i> ${I18n.t('leagues.finalHidden')}</p>` : '';
        const header = `<div class="flex-row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <div class="section-label" style="margin:0">${I18n.t('leagues.matchdayN', { n: md })}${played ? ` <span class="muted" style="font-weight:400">${I18n.t('leagues.playedTag')}</span>` : ''}</div>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setLeagueMd(+this.value)">${opts}</select></div>`;
        const lk = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const res = (!finalHidden && L.results && L.results[div] && L.results[div][md - 1]) || null;   // this season's stored scores, if any (withheld while the final round is a hidden decider)
        const fx = (s[md - 1] || []).map(([h, a], i) => {
            const sc = res && res[i];
            if (sc) {
                const hw = sc[0] > sc[1], aw = sc[1] > sc[0];
                return `<div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(h)}</span><span class="fx-score">${sc[0]}–${sc[1]}</span><span class="fx-away ${aw ? 'fx-win' : ''}">${lk(a)}</span></div>`;
            }
            return `<div class="fixture"><span class="fx-home">${lk(h)}</span><span class="fx-score muted">${I18n.t('livesim.vs')}</span><span class="fx-away">${lk(a)}</span></div>`;
        }).join('');
        return note + header + `<div class="fcard">${fx || `<p class="hint">${I18n.t('leagues.noFixtures')}</p>`}</div>`;
    },
    // ---- national-cup bracket (Round of 16 → final), mirroring the European bracket ----
    // Only kicks in once the field has narrowed to 16/8/4 (8/4/2 ties); each column is the round's
    // actual ties (winner highlighted), with placeholders for rounds not yet drawn.
    cupBracket(C) {
        if (!C || !C.results || !C.results.length) return `<p class="hint">${I18n.t('leagues.cupBracketLater')}</p>`;
        const byN = {};
        C.results.forEach(r => { const n = (r.ties || []).length; if (n === 8 || n === 4 || n === 2 || n === 1) byN[n] = r; });
        const start = byN[8] ? 8 : byN[4] ? 4 : byN[2] ? 2 : 0;
        if (!start) return `<p class="hint">${I18n.t('leagues.cupBracketLater')}</p>`;
        const pair = t => t.bye ? [t.h, null, t.h] : t.leg1 ? [t.leg1.h, t.leg1.a, t.winner] : [t.h, t.a, t.winner];
        const side = (id, winId) => {
            const win = id && winId && id === winId;
            const txt = id ? UI.clubName(id) : I18n.t('leagues.tbd');
            return `<div style="padding:6px 9px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${win ? 'font-weight:700;color:#16A34A' : (id ? '' : 'color:var(--text-secondary)')}">${txt}</div>`;
        };
        const box = (aid, bid, winId) => `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(aid, winId)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(bid, winId)}</div>`;
        const col = (title, cells) => `<div style="display:flex;flex-direction:column;min-width:150px;flex:none"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:470px">${cells}</div></div>`;
        const labelKey = { 8: 'r16Tab', 4: 'qfTab', 2: 'sfTab', 1: 'final' };
        const cols = [];
        for (let n = start; n >= 1; n = n / 2) {
            const r = byN[n];
            const cells = r ? r.ties.map(t => box(...pair(t))).join('') : Array.from({ length: n }, () => box(null, null, null)).join('');
            cols.push(col(I18n.t('leagues.' + labelKey[n]), cells));
        }
        return `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('leagues.everyPath')}</p>
            <div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:14px;min-width:max-content;padding:2px 2px 6px">${cols.join('')}</div></div>`;
    },

    // ---- play-offs (this season's own only — never a stale prior-season carryover) ----
    relegTie(t) {
        if (!t) return `<p class="muted">${I18n.t('leagues.notYet46')}</p>`;
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2;
        const pens = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(${I18n.t('leagues.pens')} ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        // an unwatched invited decider: keep leg 2, the aggregate and the winner hidden
        if (t._attendId && typeof Attend !== 'undefined' && Attend.isHidden(t._attendId))
            return `${leg(I18n.t('leagues.leg1'), l1)}<div class="fixture fixture--labeled"><span class="fx-label">${I18n.t('leagues.leg2')}</span><span class="fx-home">${nm(l2.h)}</span><span class="fx-score muted" style="font-size:11px">${I18n.t('leagues.notPlayedYet')}</span><span class="fx-away">${nm(l2.a)}</span></div>`;
        return `${leg(I18n.t('leagues.leg1'), l1)}${leg(I18n.t('leagues.leg2'), l2)}
            <div class="frow"><span class="frow__k">${I18n.t('leagues.aggregate')}</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}${pens}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('leagues.winnerLabel')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(t.winner)}</span></div>`;
    },
    playoffs(country) {
        if (country === 'Germany') {
            const G = GameState.league && GameState.league.germanReleg;
            if (!G) return `<p class="hint">${I18n.t('leagues.relegDecided46')}</p>`;
            return `<div class="section-label">Bundesliga / 2. Bundesliga</div><div class="fcard">${this.relegTie(G.top)}</div>
                <div class="section-label">2. Bundesliga / 3. Liga</div><div class="fcard">${this.relegTie(G.bottom)}</div>`;
        }
        if (country === 'Spain') {
            const P = GameState.league && GameState.league.playoffs;
            return ['LaLiga2', 'PrimeraSup', 'PrimeraInf', 'Segunda'].map(div => {
                const po = P && P[div];
                const title = `${I18n.t('leagues.promoPlayoff', { comp: COMPETITIONS[div].name })}`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.semis')}</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.final')}</div>${this.tie2Leg(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">${I18n.t('leagues.promoted')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
        }
        if (country === 'Switzerland') {
            const bar = GameState.league && GameState.league.swissBarrage;
            const barBlock = !bar
                ? `<div class="section-label">Barrage</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`
                : `<div class="section-label">Barrage — Super League / Challenge League</div><div class="fcard">${this.relegTie(bar.top)}</div>
                   <div class="section-label">Barrage — Challenge League / Promotion League</div><div class="fcard">${this.relegTie(bar.bottom)}</div>`;
            const P = GameState.league && GameState.league.playoffs;
            const poBlock = ['1.LigaCH', '2.LigaCH'].map(div => {
                const po = P && P[div];
                const title = `${I18n.t('leagues.promoPlayoff', { comp: COMPETITIONS[div].name })}`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                return `<div class="section-label">${title}</div><div class="fcard"><div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.semis')}</div>${(po.sf || []).map(t => this.tie2Leg(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.final')}</div>${this.tie2Leg(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">${I18n.t('leagues.promoted')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            return barBlock + poBlock;
        }
        if (country === 'France') {
            const P = GameState.league && GameState.league.playoffs;
            const bar = GameState.league && GameState.league.frenchBarrage;
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const brackets = ['Ligue2', 'Ligue3', 'Ligue4', 'Ligue5'].map(div => {
                const po = P && P[div];
                const title = `${I18n.t('leagues.promoPlayoff', { comp: COMPETITIONS[div].name })}`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                return `<div class="section-label">${title}</div><div class="fcard">${hd(I18n.t('leagues.round1'))}${this.tie(po.g1)}${hd(I18n.t('leagues.round2barrage'))}${this.tie(po.g2)}${po.winner ? `<div class="frow"><span class="frow__k">${I18n.t('leagues.intoBarrage')}</span><span class="frow__v" style="color:var(--info-text)">${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            const BAR = [['L1L2', 'Ligue 1 / Ligue 2'], ['L2L3', 'Ligue 2 / Ligue 3'], ['L3L4', 'Ligue 3 / Ligue 4'], ['L4L5', 'Ligue 4 / Ligue 5']];
            const barrages = BAR.map(([k, label]) => {
                const t = bar && bar[k];
                if (!t) return `<div class="section-label">${I18n.t('leagues.barrageLabel', { comp: label })}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                return `<div class="section-label">${I18n.t('leagues.barrageLabel', { comp: label })}</div><div class="fcard">${this.relegTie(t)}<p class="hint">${I18n.t('leagues.winnerHigherDiv')}</p></div>`;
            }).join('');
            return brackets + barrages;
        }
        if (country === 'Italy') {
            const P = GameState.league && GameState.league.playoffs;
            const pout = GameState.league && GameState.league.italianPlayout;
            const promo = ['SerieB', 'SerieC', 'SerieD'].map(div => {
                const po = P && P[div];
                const title = `${I18n.t('leagues.promoPlayoff', { comp: COMPETITIONS[div].name })}`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
                const qf = po.qf ? `${hd(I18n.t('leagues.qualifiers'))}${po.qf.map(t => this.tie(t)).join('')}` : '';
                return `<div class="section-label">${title}</div><div class="fcard">${qf}${hd(I18n.t('leagues.semis'))}${(po.sf || []).map(t => this.tie(t)).join('')}${hd(I18n.t('leagues.final'))}${this.tie(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">${I18n.t('leagues.promoted')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
            }).join('');
            const playout = ['SerieB', 'SerieC'].map(div => {
                const po = pout && pout[div];
                const title = `${I18n.t('leagues.relegPlayout', { comp: COMPETITIONS[div].name })}`;
                if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
                return `<div class="section-label">${title}</div><div class="fcard">${this.relegTie(po.tie)}<div class="frow"><span class="frow__k">${I18n.t('leagues.relegated')}</span><span class="frow__v" style="color:var(--state-bad)">▼ ${UI.clubName(po.relegated)}</span></div></div>`;
            }).join('');
            return promo + playout;
        }
        if (country === 'Portugal') {
            const PO = GameState.league && GameState.league.ptPlayoffs;
            if (!PO) return `<p class="hint">${I18n.t('leagues.promRelegDecided46')}</p>`;
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const block = (label, tie, note) => `<div class="section-label">${label}</div><div class="fcard">${this.relegTie(tie)}${note ? `<p class="hint">${note}</p>` : ''}</div>`;
            const lp = block(I18n.t('leagues.pt.lpLabel'), PO.lpPlayoff, I18n.t('leagues.pt.lpNote'));
            const lp2 = block(I18n.t('leagues.pt.lp2Label'), PO.lp2Playoff, I18n.t('leagues.pt.lp2Note'));
            let l3 = `<div class="section-label">${I18n.t('leagues.pt.l3Label')}</div><p class="hint">${I18n.t('leagues.pt.l3Decided')}</p>`;
            if (PO.liga3PO) {
                const p = PO.liga3PO;
                l3 = `<div class="section-label">${I18n.t('leagues.pt.l3Label')}</div><div class="fcard">${hd(I18n.t('leagues.pt.sfA'))}${this.relegTie(p.sfA)}${hd(I18n.t('leagues.pt.sfB'))}${this.relegTie(p.sfB)}${hd(I18n.t('leagues.pt.final'))}${this.relegTie(p.final)}${typeof Attend !== 'undefined' && Attend.poFinalHidden(p.final) ? '' : `<div class="frow"><span class="frow__k">${I18n.t('leagues.pt.intoLiga3')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(p.winner)}</span></div>`}</div>`;
            }
            return lp + lp2 + l3;
        }
        if (country === 'Belgium') {
            const PO = GameState.league && GameState.league.bePlayoffs;
            if (!PO) return `<p class="hint">${I18n.t('leagues.promRelegDecided46')}</p>`;
            const hd = t => `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${t}</div>`;
            const block = (label, tie, note) => `<div class="section-label">${label}</div><div class="fcard">${this.relegTie(tie)}${note ? `<p class="hint">${note}</p>` : ''}</div>`;
            const pro = block(I18n.t('leagues.be.proLabel'), PO.proPlayoff, I18n.t('leagues.be.proNote'));
            const cpl = block(I18n.t('leagues.be.cplLabel'), PO.cplPlayoff, I18n.t('leagues.be.cplNote'));
            let d1 = `<div class="section-label">${I18n.t('leagues.be.d1Label')}</div><p class="hint">${I18n.t('leagues.pt.l3Decided')}</p>`;
            if (PO.d1PO) {
                const p = PO.d1PO;
                d1 = `<div class="section-label">${I18n.t('leagues.be.d1Label')}</div><div class="fcard">${hd(I18n.t('leagues.be.sfA'))}${this.relegTie(p.sfA)}${hd(I18n.t('leagues.be.sfB'))}${this.relegTie(p.sfB)}${hd(I18n.t('leagues.be.final'))}${this.relegTie(p.final)}${typeof Attend !== 'undefined' && Attend.poFinalHidden(p.final) ? '' : `<div class="frow"><span class="frow__k">${I18n.t('leagues.be.intoD1')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(p.winner)}</span></div>`}</div>`;
            }
            return pro + cpl + d1;
        }
        const P = GameState.league && GameState.league.playoffs;
        const divs = (COUNTRY_DIVS[country] || []).slice(1);
        return divs.map(div => {
            const po = P && P[div];
            const title = `${I18n.t('leagues.promoPlayoff', { comp: COMPETITIONS[div].name })}`;
            if (!po) return `<div class="section-label">${title}</div><p class="hint">${I18n.t('leagues.notYet46')}</p>`;
            const elim = po.elim ? `<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.eliminators')}</div>${po.elim.map(t => this.tie(t)).join('')}` : '';
            return `<div class="section-label">${title}</div><div class="fcard">${elim}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.semis')}</div>${(po.sf || []).map(t => this.tie(t)).join('')}<div class="frow__k" style="padding:6px 0;font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('leagues.final')}</div>${this.tie(po.final)}${po.winner && !(typeof Attend !== 'undefined' && Attend.poFinalHidden(po.final)) ? `<div class="frow"><span class="frow__k">${I18n.t('leagues.promoted')}</span><span class="frow__v" style="color:var(--state-good)">🏆 ${UI.clubName(po.winner)}</span></div>` : ''}</div>`;
        }).join('');
    },
    tie2Leg(t) {
        if (!t) return '';
        const nm = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const l1 = t.leg1, l2 = t.leg2;
        const leg = (label, l) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home">${nm(l.h)}</span><span class="fx-score">${l.hg}–${l.ag}</span><span class="fx-away">${nm(l.a)}</span></div>`;
        // an unwatched invited play-off decider: leg 1 already happened, but keep leg 2 + aggregate hidden
        if (t._attendId && typeof Attend !== 'undefined' && Attend.isHidden(t._attendId)) {
            return `${leg(I18n.t('leagues.leg1'), l1)}<div class="fixture fixture--labeled"><span class="fx-label">${I18n.t('leagues.leg2')}</span><span class="fx-home">${nm(l2.h)}</span><span class="fx-score muted" style="font-size:11px">${I18n.t('leagues.notPlayedYet')}</span><span class="fx-away">${nm(l2.a)}</span></div>`;
        }
        const pens = t.pens ? ` <span style="color:var(--danger);font-size:11px;white-space:nowrap">(${I18n.t('leagues.pens')} ${League.penFixPair(t.pens.a, t.pens.b).join('–')})</span>` : '';
        return `${leg(I18n.t('leagues.leg1'), l1)}${leg(I18n.t('leagues.leg2'), l2)}<div class="frow"><span class="frow__k">Aggregate</span><span class="frow__v">${UI.clubName(t.a)} ${t.aggA}–${t.aggB} ${UI.clubName(t.b)}${pens}</span></div>`;
    },

    // ---- UEFA competitions (UCL / UEL / UECL) — global, not tied to the selected country ----
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
            return `<div class="fcard" style="padding:16px"><div class="section-label" style="margin-top:0">${I18n.t('leagues.euComps')}</div>
                <p class="muted">${I18n.t('leagues.euIntro', { next })}</p></div>`;
        }
        let comp = this.state.euComp; if (!ed.comps[comp]) comp = 'UCL';
        const c = ed.comps[comp];
        const live = GameState.league && GameState.league.europe;
        const seasonNote = live ? '' : `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('leagues.lastSeasonComps')}</p>`;
        const dd = `<select class="select-input" style="margin-bottom:var(--space-3)" onchange="LeaguesScreen.setEuComp(this.value)">${[['UCL', 'Champions League'], ['UEL', 'Europa League'], ['UECL', 'Conference League']].map(([k, l]) => `<option value="${k}" ${comp === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
        const icon = (typeof europeTrophyIcon === 'function') ? europeTrophyIcon(comp) : '🏆';
        const euHidden = c.ko && c.ko.final && c.ko.final._attendId && typeof Attend !== 'undefined' && Attend.isHidden(c.ko.final._attendId);
        const winner = (c.ko && c.ko.winner && !euHidden) ? `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">${icon} ${I18n.t('leagues.euWinnerLine', { comp: (COMPETITIONS[comp] || {}).name, club: UI.clubName(c.ko.winner) })}</div>` : '';
        const tabs = this.euTabs(c);
        let stage = this.state.tab; if (!tabs.some(t => t[0] === stage)) stage = this.euDefaultTab(c);
        return seasonNote + dd + winner + this.euStage(c, comp, stage) + this.compHistLink(comp);
    },
    euTabs(c) {
        const t = [];
        if (c.qual && c.qual.rounds.length) t.push(['qual', I18n.t('leagues.qualifiersTab')]);
        if (c.table) t.push(['lp', I18n.t('leagues.tableTab')]);
        if (c.schedule) t.push(['fixtures', I18n.t('leagues.fixturesTab')]);
        if (c.ko) {
            if (c.ko.po) t.push(['po', I18n.t('leagues.koPlayoffsTab')]);
            if (c.ko.r16) t.push(['r16', I18n.t('leagues.r16Tab')]);
            if (c.ko.qf) t.push(['qf', I18n.t('leagues.qfTab')]);
            if (c.ko.sf) t.push(['sf', I18n.t('leagues.sfTab')]);
            if (c.ko.final) t.push(['final', I18n.t('leagues.finalTab')]);
            if (c.ko.r16) t.push(['bracket', I18n.t('leagues.bracketTab')]);
        }
        return t.length ? t : [['qual', I18n.t('leagues.qualifiersTab')]];
    },
    euDefaultTab(c) {   // the current stage: latest knockout round, else the league phase, else qualifying
        if (c.ko) { for (const k of ['final', 'sf', 'qf', 'r16', 'po']) if (c.ko[k]) return k; }
        if (c.table) return 'lp';
        return 'qual';
    },
    euStage(c, comp, stage) {
        switch (stage) {
            case 'lp': return (c.table ? this.euTable(c) : `<p class="hint">${I18n.t('leagues.lpDrawNote')}</p>`) + (c.pots ? `<details style="margin-top:var(--space-4)"><summary class="section-label" style="cursor:pointer;list-style:revert">${I18n.t('leagues.seedingPots')}</summary>${this.euPots(c)}</details>` : '');
            case 'fixtures': return this.euFixtures(c);
            case 'po': return this.euRound(c, 'po', I18n.t('leagues.koPlayoffLabel'), this._euCal('knockoutPO', 34));
            case 'r16': return this.euRound(c, 'r16', I18n.t('leagues.r16Tab'), this._euCal('R16', 37));
            case 'qf': return this.euRound(c, 'qf', I18n.t('leagues.qfTab'), this._euCal('QF', 41));
            case 'sf': return this.euRound(c, 'sf', I18n.t('leagues.sfTab'), this._euCal('SF', 44));
            case 'final': return this.euFinalView(c);
            case 'bracket': return this.euBracketTree(c);
            case 'qual': default: {
                const firstWk = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.qualifying[comp] && EUROPE_DATA.qualifying[comp].rounds[0] && EUROPE_DATA.qualifying[comp].rounds[0].week) || 1;
                return `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('leagues.euBlurb.' + comp)}</p>` + (this.euQualifying(c) || `<p class="hint">${I18n.t('leagues.qualBegins', { wk: firstWk })}</p>`);
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
        if (!r) return `<p class="hint">${I18n.t('leagues.drawnWk', { label, wk })}</p>`;
        return `<div class="section-label">${label} <span class="muted" style="font-weight:400">${I18n.t('leagues.legsWk', { wk, wk1: wk + 1 })}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}</div>`;
    },
    euFinalView(c) {
        const f = c.ko && c.ko.final;
        const finalWk = this._euCal('final', 47);
        if (!f) return `<p class="hint">${I18n.t('leagues.finalNeutral', { wk: finalWk })}</p>`;
        return `<div class="section-label">${I18n.t('leagues.final')} <span class="muted" style="font-weight:400">${I18n.t('leagues.finalNeutralLabel', { wk: finalWk })}</span></div><div class="fcard">${this.tie({ h: f.a, a: f.b, hg: f.ag, ag: f.bg, winner: f.winner, pens: f.pens, et: f.et, _attendId: f._attendId })}</div>`;
    },
    // horizontal bracket from the Round of 16 to the final — every club's path, scroll to follow it
    euBracketTree(c) {
        if (!c.ko || !c.ko.r16) return `<p class="hint">${I18n.t('leagues.bracketDrawn')}</p>`;
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
        const cQF = [0, 1, 2, 3].map(i => box(w(r16, 2 * i), w(r16, 2 * i + 1), qf && qf.winners ? qf.winners[i] : null, I18n.t('leagues.r16winner'), I18n.t('leagues.r16winner'))).join('');
        const cSF = [0, 1].map(i => box(qf ? w(qf, 2 * i) : null, qf ? w(qf, 2 * i + 1) : null, sf && sf.winners ? sf.winners[i] : null, I18n.t('leagues.qfwinner'), I18n.t('leagues.qfwinner'))).join('');
        const cF = box(sf ? w(sf, 0) : null, sf ? w(sf, 1) : null, fin ? fin.winner : null, I18n.t('leagues.sfwinner'), I18n.t('leagues.sfwinner'));
        return `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('leagues.everyPath')}</p>
            <div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:14px;min-width:max-content;padding:2px 2px 6px">${col(I18n.t('leagues.r16Tab'), cR16)}${col(I18n.t('leagues.qfTab'), cQF)}${col(I18n.t('leagues.sfTab'), cSF)}${col(I18n.t('leagues.final'), cF)}</div></div>`;
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
            <span style="display:inline-flex;align-items:center;gap:5px">${dot('#16A34A')} ${I18n.t('leagues.legend1')}</span>
            <span style="display:inline-flex;align-items:center;gap:5px">${dot('#2563EB')} ${I18n.t('leagues.legend2')}</span>
            <span>${I18n.t('leagues.legend3')}</span></div>`;
        const done = c.ranked ? '' : `<p class="hint" style="margin-top:2px">${I18n.t('leagues.playedMd', { n: c.mdPlayed })}</p>`;
        const lpWeeks = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.calendar && EUROPE_DATA.calendar.leaguePhase) || [];
        const weeksNote = lpWeeks.length ? `<p class="hint" style="margin:0 0 var(--space-2)">${I18n.t('leagues.mdWeeks', { weeks: lpWeeks.join(', ') })}</p>` : '';
        return `<div class="section-label">${I18n.t('leagues.leaguePhase')}</div>${weeksNote}<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('nego.club')}</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>${legend}${done}`;
    },
    // League-phase fixtures, one matchday at a time (dropdown top-right). Shows results if played,
    // otherwise the drawn pairing — every club plays exactly once each matchday.
    euFixtures(c) {
        if (!c.schedule) return `<p class="hint">${I18n.t('leagues.fixturesDraw')}</p>`;
        let md = this.state.euMd; if (!md || md < 1 || md > 8) md = Math.max(1, c.mdPlayed || 1);
        const played = md <= (c.mdPlayed || 0);
        const lpWeeks = (typeof EUROPE_DATA !== 'undefined' && EUROPE_DATA.calendar && EUROPE_DATA.calendar.leaguePhase) || [];
        const wk = lpWeeks[md - 1];
        const header = `<div class="flex-row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-3)">
            <div class="section-label" style="margin:0">${I18n.t('leagues.matchdayN', { n: md })}${wk ? ` <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${wk}</span>` : ''}${played ? '' : ` <span class="muted" style="font-weight:400">${I18n.t('leagues.notPlayedYetTag')}</span>`}</div>
            <select class="select-input" style="width:auto" onchange="LeaguesScreen.setEuMd(+this.value)">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${n === md ? 'selected' : ''}>${I18n.t('leagues.matchdayN', { n })}${lpWeeks[n - 1] ? ' · ' + I18n.t('leagues.wkShort') + ' ' + lpWeeks[n - 1] : ''}</option>`).join('')}</select>
        </div>`;
        const list = played ? (c.mdResults[md - 1] || { matches: [] }).matches.map(x => [x.h, x.a, x.hg, x.ag]) : (c.schedule[md - 1] || []).map(([h, a]) => [h, a, null, null]);
        const lk = id => `<a href="${Router.link('clubs', id)}" style="color:inherit">${UI.clubName(id)}</a>`;
        const fx = list.map(([h, a, hg, ag]) => {
            const score = hg == null ? `<span class="fx-score muted">${I18n.t('livesim.vs')}</span>` : `<span class="fx-score">${hg}–${ag}</span>`;
            const hw = hg != null && hg > ag, aw = hg != null && ag > hg;
            return `<div class="fixture"><span class="fx-home ${hw ? 'fx-win' : ''}">${lk(h)}</span>${score}<span class="fx-away ${aw ? 'fx-win' : ''}">${lk(a)}</span></div>`;
        }).join('');
        return header + `<div class="fcard">${fx || `<p class="hint">${I18n.t('leagues.noFixtures')}</p>`}</div>`;
    },
    euPots(c) {
        return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${c.pots.map((p, i) => `<div class="fcard" style="padding:8px 12px"><div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);padding:4px 0">${I18n.t('leagues.potN', { n: i + 1 })}</div>${p.map(id => `<div class="frow" style="padding:2px 0"><span class="frow__k" style="font-size:12px">${UI.clubName(id)}</span><span class="frow__v muted" style="font-size:11px">${Europe.repOf(id)}</span></div>`).join('')}</div>`).join('')}</div>`;
    },
    euQualifying(c) {
        if (!c.qual || !c.qual.rounds.length) return '';
        return c.qual.rounds.map(r => `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('leagues.roundN', { n: r.round })} <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${r.week}</span></div><div class="fcard">${r.ties.map(t => this.tie(t)).join('')}${(r.byes || []).map(b => `<div class="tie-block"><div class="fixture"><span class="fx-home fx-win">${UI.clubName(b)}</span><span class="fx-score muted">${I18n.t('leagues.bye')}</span><span class="fx-away"></span></div></div>`).join('')}</div>`).join('');
    }
};
Router.register('leagues', { isMain: true, title: () => I18n.t('nav.leagues'), render(el) { LeaguesScreen.render(el); } });

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
        if (!comp) { el.innerHTML = `<div class="empty"><div class="empty__title">${I18n.t('leagues.unknownComp')}</div></div>`; return; }
        const ctx = this.ctx(compId);
        if (!['winners', 'players'].includes(ctx.tab)) ctx.tab = 'winners';
        const isCont = comp.type === 'cont';
        const icon = (isCont && typeof europeTrophyIcon === 'function' && europeTrophyIcon(compId)) || '<i class="ti ti-trophy" style="color:var(--gold);font-size:20px"></i>';
        const tabs = [['winners', I18n.t('leagues.winnersTab')], ['players', I18n.t('nav.clients')]];
        el.innerHTML = `
        <div class="flex-row" style="gap:8px;margin-bottom:var(--space-2)">${icon}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${comp.name}</span></div>
        <p class="hint" style="margin-bottom:var(--space-4)">${this.subtitle(comp.type)}</p>
        <div class="tab-bar tab-bar--sticky" style="margin-bottom:var(--space-4)">${tabs.map(([k, l]) => `<button class="tab ${ctx.tab === k ? 'is-active' : ''}" onclick="CompHistory.setTab('${compId}','${k}')">${l}</button>`).join('')}</div>
        <div id="comphistBody">${ctx.tab === 'winners' ? this.winnersHTML(compId) : this.playersHTML(compId)}</div>`;
    },
    setTab(compId, t) { this.ctx(compId).tab = t; Router.refresh(); },
    subtitle(type) {
        return type === 'cont' ? I18n.t('leagues.subCont')
            : type === 'cup' ? I18n.t('leagues.subCup')
                : I18n.t('leagues.subLeague');
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
        if (!w.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-trophy"></i></div><div class="empty__title">${I18n.t('leagues.noWinners')}</div><div class="empty__hint">${I18n.t('leagues.noWinnersSub')}</div></div>`;
        const tally = {}; w.forEach(x => tally[x.clubId] = (tally[x.clubId] || 0) + 1);
        const crest = cid => UI.crest(Clubs.getClubById(cid) || { name: UI.clubName(cid), colors: { primary: '#5A626D' } });
        const most = Object.entries(tally).sort((a, b) => b[1] - a[1] || UI.clubName(a[0]).localeCompare(UI.clubName(b[0]))).slice(0, 6)
            .map(([cid, n]) => `<a href="${Router.link('clubs', cid)}" class="frow" style="cursor:pointer"><span class="frow__k">${crest(cid)}${UI.clubName(cid)}</span><span class="frow__v">${I18n.t('leagues.titlesN', { n })}</span></a>`).join('');
        const roll = w.map(x => `<a href="${Router.link('clubs', x.clubId)}" class="frow" style="cursor:pointer"><span class="frow__k">${GameState.seasonLabelFor(x.year)}</span><span class="frow__v">${crest(x.clubId)}${UI.clubName(x.clubId)}</span></a>`).join('');
        return `<div class="section-label">${I18n.t('leagues.mostTitles')}</div><div class="fcard" style="margin-top:var(--space-2)">${most}</div>
            <div class="section-label" style="margin-top:var(--space-4)">${I18n.t('leagues.rollOfHonour')}</div><div class="fcard" style="margin-top:var(--space-2);max-height:420px;overflow-y:auto">${roll}</div>`;
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
        const sortBtn = `<button class="gbtn" onclick="CompHistory.pickSort('${compId}')"><i class="ti ti-arrows-sort"></i>${I18n.t('leagues.sort.' + ctx.sort)}<i class="ti ti-chevron-down" style="color:var(--text-faint)"></i></button>`;
        return `<div class="flex-row" style="justify-content:flex-end;margin-bottom:var(--space-3)">${sortBtn}</div><div id="comphistPlayers">${this.playerListHTML(rows, ctx)}</div>`;
    },
    playerListHTML(rows, ctx) {
        if (!rows.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-users"></i></div><div class="empty__title">${I18n.t('leagues.noClientsComp')}</div><div class="empty__hint">${I18n.t('leagues.noClientsCompSub')}</div></div>`;
        const disc = ['yellow', 'red'].includes(ctx.sort);
        return rows.map(r => {
            const gk = r.p.position === 'GK';
            const line = disc ? `<span class="card-chip card-chip--yellow"></span>${r.yellow} <span class="card-chip card-chip--red"></span>${r.red}` : `${gk ? r.cs + ' ' + I18n.t('common.csShort') : r.goals + ' ' + I18n.t('common.goalsShort')} · ${r.assists} ${I18n.t('common.assistsShort')}`;
            return `<a href="${Router.link('client', r.p.id)}" class="list-row" style="cursor:pointer">
                <div style="flex:1;min-width:0"><div class="row-title">${UI.flag(r.p.nationality)} ${r.p.name}</div><div class="row-sub">${r.p.position} · ${r.apps} ${I18n.t('common.appsShort')}${r.titles ? ` · <i class="ti ti-trophy" style="font-size:11px;color:var(--gold)"></i> ${r.titles}` : ''}</div></div>
                <div style="text-align:right;font-size:12px;color:var(--text-muted)">${line}<br>${UI.ratingText(r.avg)}</div></a>`;
        }).join('');
    },
    // same "stays open" sort picker used elsewhere (ClientHistory.pickSort)
    pickSort(compId) {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('clients.sortTitle')}</div>
            <div id="sortPickerBody">${this.sortPickerRows(compId)}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">${I18n.t('common.done')}</button>`);
    },
    sortPickerRows(compId) {
        const ctx = this.ctx(compId);
        return this.SORTS.map(([id, label]) => `<button class="list-row" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="CompHistory.setSort('${compId}','${id}')"><span style="flex:1;color:var(--text)">${I18n.t('leagues.sort.' + id)}</span>${ctx.sort === id ? `<i class="ti ${ctx.dir === 'asc' ? 'ti-sort-ascending' : 'ti-sort-descending'}" style="color:var(--accent)"></i>` : ''}</button>`).join('');
    },
    setSort(compId, id) {
        const ctx = this.ctx(compId);
        if (ctx.sort === id) ctx.dir = ctx.dir === 'asc' ? 'desc' : 'asc';
        else { ctx.sort = id; ctx.dir = id === 'name' ? 'asc' : 'desc'; }
        const body = document.getElementById('sortPickerBody'); if (body) body.innerHTML = this.sortPickerRows(compId);
        const list = document.getElementById('comphistPlayers'); if (list) list.innerHTML = this.playerListHTML(this.sortedPlayers(compId), ctx);
    }
};
Router.register('comphist', { isMain: false, parent: 'leagues', title: params => (COMPETITIONS[params[0]] || {}).name || I18n.t('leagues.competition'), render(el, params) { CompHistory.render(el, params[0]); } });
