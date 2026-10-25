// ============================================================
//  Competitions > International, the Americas (js/intl-americas.js): South America (World Cup
//  qualifying table, Copa América) and North & Central America (Nations League A/B/C, Gold Cup
//  with its preliminary round, World Cup qualifying R1-R3). Plus a nation's match list (with
//  friendlies) for every confederation. Read-only, like the rest of IntlScreen.
// ============================================================
Object.assign(IntlScreen, {
    AM_CONFS: ['CONMEBOL', 'CONCACAF'],
    isAm(conf) { return this.AM_CONFS.includes(conf); },
    am() { const I = GameState.intl; return (I && I.am) || null; },
    // the World Cup qualifying cycle running now (or the last one, until the World Cup is over)
    cycle() {
        const A = this.am(); if (!A) return null;
        const keys = Object.keys(A.cycles).sort();
        const y = GameState.seasonStartYear;
        const k = keys.find(k => +k.slice(3) >= y + (GameState.week <= 2 ? 0 : 1)) || keys[keys.length - 1];
        return k ? Object.assign({ key: k, year: +k.slice(3) }, A.cycles[k]) : null;
    },
    amTabs(conf) {
        const S = this.season(), t = [], cyc = this.cycle();
        if (conf === 'CONMEBOL') {
            if (cyc && cyc.cm) t.push(['cmq', I18n.t('intl.tab.wcq')]);
            if (S && S.am && S.am.copa) t.push(['copa', compName('INTL_COPA') + ' ' + (S.year + 1)]);
        } else {
            if (S && S.am && S.am.cnl) t.push(['cnl', compName('INTL_CNL')]);
            if (S && S.am && S.am.gold) t.push(['gold', compName('INTL_GOLD') + ' ' + (S.year + 1)]);
            if (cyc && cyc.cc) t.push(['ccq', I18n.t('intl.tab.wcq')]);
        }
        // the World Cup tournament itself is shown under World (IntlScreen.worldTabs)
        t.push(['teams', I18n.t('intl.tab.teams')]);
        t.push(['info', I18n.t('intl.tab.info')]);
        return t;
    },
    amDefault(conf) {
        const S = this.season(), tabs = this.amTabs(conf).map(t => t[0]);
        const wk = GameState.week, tourOn = wk >= 49 || wk <= 2;
        if (tabs.includes('tour') && tourOn) return 'tour';
        if (conf === 'CONMEBOL') return tourOn && tabs.includes('copa') ? 'copa' : tabs.includes('cmq') ? 'cmq' : tabs.includes('copa') ? 'copa' : 'teams';
        if (tabs.includes('gold') && (tourOn || wk >= INTL_CONFIG.ROUND_DRAW_WEEK && S && S.am.gold && S.am.gold.prelims && wk >= 36)) return 'gold';
        return tabs.includes('cnl') ? 'cnl' : tabs.includes('ccq') ? 'ccq' : 'teams';
    },
    amSection(conf, tab) {
        const S = this.season();
        switch (tab) {
            case 'cmq': return this.cmqView();
            case 'copa': return this.copaView(S);
            case 'cnl': return this.cnlView(S);
            case 'gold': return this.goldView(S);
            case 'ccq': return this.ccqView();
            case 'tour': return S && S.tour ? this.tournament(S) : '';
            case 'info': return this.info(conf);
            default: return this.confTeams(conf);
        }
    },
    setCnlView(v) { this.state.cnlView = v; LeaguesScreen.renderSection(); },

    // ---------------- CONMEBOL qualifying: one table ----------------
    cmqView() {
        const cyc = this.cycle(); if (!cyc || !cyc.cm) return '';
        const cm = cyc.cm, H = cm.hosts.length, C = this.COL;
        const rows = Internationals.cmqTable(cm);
        let direct = 0, po = 0;
        const zone = r => {
            if (cm.hosts.includes(r.id)) return '';
            if (direct < INTL_CONFIG.CMQ_DIRECT - H) { direct++; return C.green; }
            if (po < INTL_CONFIG.CMQ_PLAYOFF) { po++; return C.blue; }
            return '';
        };
        const played = cm.fx.filter(f => f.hg != null).length;
        const body = rows.map((r, i) => {
            const z = zone(r);
            return `<tr><td style="${z ? `border-left-color:${z}` : ''}">${i + 1}</td><td class="club-cell">${this.nation(r.id)}${cm.hosts.includes(r.id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : ''}</td><td class="num">${r.P}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`;
        }).join('');
        const mds = [...new Set(cm.fx.map(f => f.md))].sort((a, b) => a - b);
        const fixtures = `<details style="margin-top:var(--space-2)"><summary class="hint" style="cursor:pointer">${I18n.t('leagues.fixturesTab')}</summary>${mds.map(md => {
            const f0 = cm.fx.find(f => f.md === md);
            return `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('leagues.matchdayN', { n: md })} <span class="muted" style="font-weight:400">· ${GameState.seasonLabelFor(f0.y)} · ${I18n.t('leagues.wkShort')} ${f0.w}${f0.s === 'B' ? ' (B)' : ''}</span></div><div class="fcard">${cm.fx.filter(f => f.md === md).map(f => this.match(f)).join('')}</div>`;
        }).join('')}</details>`;
        return `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.cmqHint', { comp: compName('INTL_WC'), year: cyc.year, n: played })}</p>
            <div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('intl.nation')}</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>
            ${this.legend([[C.green, I18n.t('intl.wcqDirect')], [C.blue, I18n.t('intl.icPlayoff')], ['', I18n.t('intl.zone.host')]])}${fixtures}`;
    },

    // ---------------- Copa América ----------------
    copaView(S) {
        const P = S.am.copa, C = this.COL;
        let html = '';
        if (P.tour && P.tour.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_COPA') + ' ' + (S.year + 1), nation: this.nation(P.tour.winner) })}</div>`;
        html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: 16, hosts: P.hosts.map(id => this.nation(id)).join(', ') })}</p>`;
        if (P.tour) html += this.amBracket(P.tour) + this.amGroups(P.tour);
        const G = this.am() && this.am().lastGold;
        const semis = P.cc.filter(id => !P.hosts.includes(id));
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.copaEntrants')}</div><div class="fcard" style="padding:8px 12px;line-height:1.7">
            <div><b>${this.confName('CONMEBOL')}</b>: ${P.cm.map(id => this.nation(id)).join(', ')}</div>
            ${P.hosts.filter(id => Internationals.conf(id) === 'CONCACAF').length ? `<div><b>${I18n.t('intl.zone.host')}</b>: ${P.hosts.filter(id => Internationals.conf(id) === 'CONCACAF').map(id => this.nation(id)).join(', ')}</div>` : ''}
            <div><b>${P.fromGold ? I18n.t('intl.copaFromGold', { comp: compName('INTL_GOLD'), year: S.year }) : I18n.t('intl.copaByRep')}</b>: ${semis.map(id => this.nation(id)).join(', ')}</div></div>`;
        if (P.playin.length) html += `<div class="section-label">${I18n.t('intl.copaPlayin')} <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${INTL_CONFIG.STD_SLOTS[INTL_CONFIG.COPA_PLAYIN_SLOT - 1][0]}</span></div><div class="fcard">${P.playin.map(t => this.match(t.fx || { h: t.hi, a: t.lo, hg: null })).join('')}</div>`;
        return html;
    },

    // ---------------- CONCACAF Nations League ----------------
    cnlView(S) {
        const N = S.am.cnl, C = this.COL;
        const L = ['A', 'B', 'C'].includes(this.state.nlLeague) ? this.state.nlLeague : 'A';
        let html = this.chips(['A', 'B', 'C'].map(k => [k, I18n.t('intl.leagueX', { x: k })]), L, 'IntlScreen.setNlLeague');
        const X = N[L];
        if (X.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_CNL') + ' · ' + I18n.t('intl.leagueX', { x: L }), nation: this.nation(X.winner) })}</div>`;
        // knockouts first once they exist
        if (L === 'A') {
            html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.qfSeeds', { list: N.seeds.map(id => this.nation(id)).join(', ') })}</p>`;
            if (N.A.qf) html += this.cnlBracket(N);
        } else if (X.sf) {
            html += `<div class="section-label">${I18n.t('intl.championship')}</div><div class="fcard">${X.sf.map(m => this.match(m)).join('')}${X.final ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('leagues.final')}</div>${this.match(X.final)}<div class="hint" style="margin:6px 0 2px">${I18n.t('intl.third')}</div>${this.match(X.third)}` : ''}</div>`;
        }
        const zone = (r, pos) => L === 'A' ? (pos <= 2 ? C.green : pos <= 4 ? C.amber : C.red)
            : L === 'B' ? (pos === 1 ? C.green : pos === 2 ? C.amber : pos === 4 ? C.red : '')
            : (pos === 1 ? C.green : pos === 2 ? C.light : '');
        const legend = L === 'A' ? [[C.green, I18n.t('intl.zone.qf')], [C.amber, I18n.t('intl.zone.cupPrelim', { comp: compName('INTL_GOLD') })], [C.red, I18n.t('intl.zone.relegated')]]
            : L === 'B' ? [[C.green, I18n.t('intl.zone.champUp', { comp: compName('INTL_GOLD') })], [C.amber, I18n.t('intl.zone.cupPrelim', { comp: compName('INTL_GOLD') })], [C.red, I18n.t('intl.zone.relegated')]]
            : [[C.green, I18n.t('intl.zone.champC')], [C.light, I18n.t('intl.zone.bestRunnerUp')]];
        html += X.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone)}${this.groupFixtures(g)}`).join('') + this.legend(legend);
        if (N.movement) {
            const M = N.movement, list = ids => ids.map(id => this.nation(id)).join(', ') || '–';
            const rows = L === 'A' ? [[I18n.t('intl.downToB'), M.downB]] : L === 'B' ? [[I18n.t('intl.upToA'), M.upA], [I18n.t('intl.downToC'), M.downC]] : [[I18n.t('intl.upToB'), M.upB]];
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.nextEdition')}</div><div class="fcard" style="padding:10px 12px;line-height:1.7">${rows.map(([l, ids]) => `<div>${l}: ${list(ids)}</div>`).join('')}</div>`;
        }
        return html;
    },
    // League A: quarter-finals (seed v group qualifier, two legs) -> semi-finals -> final
    cnlBracket(N) {
        const A = N.A;
        const order = [0, 3, 1, 2];   // the seed 1 and seed 4 ties meet in a semi-final, 2 and 3 in the other
        const sfBox = m => this.koBox(m);
        const col = (title, cells, h) => `<div style="display:flex;flex-direction:column;min-width:160px;flex:none"><div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:${h}px">${cells}</div></div>`;
        return `<div class="section-label">${I18n.t('leagues.bracketTab')}</div><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:12px;min-width:max-content;padding:2px 2px 6px">`
            + col(I18n.t('leagues.qfTab'), order.map(i => this.tieBox(A.qf[i])).join(''), 420)
            + col(I18n.t('leagues.sfTab'), [0, 1].map(i => sfBox(A.sf ? A.sf[i] : null)).join(''), 420)
            + col(I18n.t('leagues.final'), sfBox(A.final || null), 420)
            + `</div></div>${A.third ? `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(A.third)}</div>` : ''}`;
    },
    koBox(m) {
        const w = m && m.hg != null ? Internationals.winnerOf(m) : null;
        const side = id => `<div style="padding:5px 8px;font-size:var(--fs-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;justify-content:space-between;gap:8px;${w && w === id ? 'font-weight:var(--weight-semibold);color:#16A34A' : (id ? '' : 'color:var(--text-secondary)')}"><span>${id ? this.nation(id) : '–'}</span><span>${m && m.hg != null ? (id === m.h ? m.hg : m.ag) : ''}</span></div>`;
        const tag = m && m.pens ? `<div class="muted" style="font-size:10px;text-align:center">${I18n.t('leagues.pens')} ${m.pens.h}–${m.pens.a}</div>` : '';
        return `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(m && m.h)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(m && m.a)}${tag}</div>`;
    },

    // ---------------- Gold Cup ----------------
    goldView(S) {
        const G = S.am.gold;
        let html = '';
        if (G.tour && G.tour.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_GOLD') + ' ' + (S.year + 1), nation: this.nation(G.tour.winner) })}</div>`;
        if (G.tour) html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: 16, hosts: G.tour.hosts.map(id => this.nation(id)).join(', ') || '–' })}</p>` + this.amBracket(G.tour) + this.amGroups(G.tour);
        if (G.prelims) html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.prelims')} <span class="muted" style="font-weight:400">· ${I18n.t('intl.weeks', { a: 36, b: 37 })}</span></div><div class="fcard">${G.prelims.map(t => this.twoLeg(t)).join('')}</div>`;
        else html += `<p class="hint">${I18n.t('intl.koDrawWeek', { w: INTL_CONFIG.ROUND_DRAW_WEEK })}</p>`;
        if (G.direct) html += `<div class="section-label">${I18n.t('intl.wcqDirect')}</div><div class="fcard" style="padding:8px 12px;line-height:1.7">${G.direct.map(id => this.nation(id)).join(', ')}</div>`;
        return html;
    },

    // ---------------- CONCACAF qualifying ----------------
    ccqView() {
        const cyc = this.cycle(); if (!cyc || !cyc.cc) return '';
        const cc = cyc.cc, C = this.COL;
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.ccqHint', { comp: compName('INTL_WC'), year: cyc.year })}</p>`;
        if (cc.r3) {
            const direct = new Set(cc.result ? cc.result.direct : []), po = new Set(cc.result ? cc.result.po : []);
            const zone = (r, pos) => cc.result ? (direct.has(r.id) ? C.green : po.has(r.id) ? C.blue : '') : (pos <= 2 ? C.green : pos === 3 ? C.light : '');
            html += `<div class="section-label">${I18n.t('intl.roundN', { n: 3 })}</div>` + cc.r3.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone)}${this.groupFixtures(g)}`).join('')
                + this.legend([[C.green, I18n.t('intl.wcqDirect')], [C.blue, I18n.t('intl.icPlayoff')]]);
        }
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.roundN', { n: 2 })}</div>` + cc.r2.groups.map(g => {
            if (!g.fx) return `<div class="fcard" style="padding:8px 12px">${g.teams.map(t => /^R1W/.test(t) ? I18n.t('intl.r1Winner', { n: t.slice(3) }) : this.nation(t)).join(', ')}</div>`;
            return `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', (r, p) => p <= 2 ? C.green : '')}${this.groupFixtures(g)}`;
        }).join('');
        if (cc.r1.length) html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.roundN', { n: 1 })}</div><div class="fcard">${cc.r1.map(t => this.twoLeg(t)).join('')}</div>`;
        return html;
    },

    // ---------------- 16-team tournaments: groups + bracket ----------------
    amGroups(T) {
        const C = this.COL;
        const hostTag = id => T.hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
        return `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.groupStage')}</div>` + T.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', (r, p) => p <= 2 ? C.green : '', hostTag)}${this.groupFixtures(g)}`).join('');
    },
    amBracket(T) {
        const K = T.ko;
        if (!K.qf) return `<p class="hint">${I18n.t('intl.bracketAfterGroups')}</p>`;
        const col = (title, list) => `<div style="display:flex;flex-direction:column;min-width:160px;flex:none"><div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:420px">${list.map(m => this.koBox(m)).join('')}</div></div>`;
        return `<div class="section-label">${I18n.t('leagues.bracketTab')}</div><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:12px;min-width:max-content;padding:2px 2px 6px">`
            + col(I18n.t('leagues.qfTab'), K.qf) + col(I18n.t('leagues.sfTab'), K.sf || [null, null]) + col(I18n.t('leagues.final'), [K.final || null])
            + `</div></div>${K.third ? `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(K.third)}</div>` : ''}`;
    },

    // ---------------- a nation's page (ui/js/screen-nation.js) ----------------
    openNation(id) { Router.go('nation/' + encodeURIComponent(id)); },
});
if (typeof window !== 'undefined') window.IntlScreen = IntlScreen;
