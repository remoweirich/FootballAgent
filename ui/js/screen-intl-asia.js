// ============================================================
//  Competitions > International, Asia and Oceania (js/intl-afc.js): the AFC Nations League
//  (Divisions 1-3, knockouts or the AFC play-off), the Asian Cup, OFC World Cup qualifying and the
//  OFC Nations Cup. Read-only, like the rest of IntlScreen.
// ============================================================
Object.assign(IntlScreen, {
    AO_CONFS: ['AFC', 'OFC'],
    isAo(conf) { return this.AO_CONFS.includes(conf); },
    // the World Cup cycle running now (or the last one, until the World Cup is over)
    aoCycle() {
        const I = GameState.intl; if (!I || !I.ao) return null;
        const keys = Object.keys(I.ao.cycles).sort(), y = GameState.seasonStartYear;
        const k = keys.find(k => +k.slice(3) >= y + (GameState.week <= 2 ? 0 : 1)) || keys[keys.length - 1];
        return k ? Object.assign({ key: k, year: +k.slice(3) }, I.ao.cycles[k]) : null;
    },
    // the Nations League edition to show: this season's Asian Cup edition, else the World Cup edition
    afcNl() {
        const S = this.season(), cyc = this.aoCycle();
        if (S && S.ao && S.ao.nl) return S.ao.nl;
        return cyc && cyc.nl ? cyc.nl : null;
    },
    aoTabs(conf) {
        const S = this.season(), t = [], cyc = this.aoCycle(), ao = S && S.ao;
        if (conf === 'AFC') {
            if (this.afcNl()) t.push(['afcnl', compName('INTL_AFCNL')]);
            if (ao && ao.ac) t.push(['ac', compName('INTL_AC') + ' ' + (S.year + 1)]);
        } else {
            if (cyc && cyc.ofc) t.push(['ofcq', I18n.t('intl.tab.wcq')]);
            if (ao && ao.onc) t.push(['onc', compName('INTL_ONC') + ' ' + (S.year + 1)]);
        }
        // the World Cup tournament itself is shown under World (IntlScreen.worldTabs)
        t.push(['teams', I18n.t('intl.tab.teams')]);
        t.push(['info', I18n.t('intl.tab.info')]);
        return t;
    },
    aoDefault(conf) {
        const tabs = this.aoTabs(conf).map(t => t[0]), wk = GameState.week, tourOn = wk >= 49 || wk <= 2;
        if (tourOn && tabs.includes('tour')) return 'tour';
        const order = conf === 'AFC' ? (tourOn ? ['ac', 'afcnl'] : ['afcnl', 'ac']) : (tourOn ? ['onc', 'ofcq'] : ['ofcq', 'onc']);
        return order.find(k => tabs.includes(k)) || 'teams';
    },
    aoSection(conf, tab) {
        const S = this.season();
        switch (tab) {
            case 'afcnl': return this.afcNlView();
            case 'ac': return S && S.ao && S.ao.ac ? this.acView(S) : '';
            case 'ofcq': return this.ofcqView();
            case 'onc': return S && S.ao && S.ao.onc ? this.oncView(S) : '';
            case 'tour': return S && S.tour ? this.tournament(S) : '';
            case 'info': return this.info(conf);
            default: return this.confTeams(conf);
        }
    },
    setAfcView(v) { this.state.afcView = v; LeaguesScreen.renderSection(); },
    hTag(hosts) { return id => hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : ''; },

    // ---------------- AFC Nations League ----------------
    afcNlView() {
        const N = this.afcNl(); if (!N) return '';
        const C = this.COL, ac = N.ed === 'AC';
        const views = [['1', I18n.t('intl.divX', { n: 1 })], ['2', I18n.t('intl.divX', { n: 2 })], ['3', I18n.t('intl.divX', { n: 3 })],
            ['KO', ac ? I18n.t('intl.tab.knockouts') : I18n.t('intl.afcPlayoff')]];
        const v = views.some(x => x[0] === this.state.afcView) ? this.state.afcView : '1';
        const hint = ac ? I18n.t('intl.afcnlHintAC', { comp: compName('INTL_AC'), year: N.year + 2 })
            : I18n.t('intl.afcnlHintWC', { comp: compName('INTL_WC'), year: N.year + 2, n: INTL_CONFIG.AFC_WC_DIRECT - N.hosts.length });
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${hint}</p>` + this.chips(views, v, 'IntlScreen.setAfcView');
        if (v === 'KO') return html + (ac ? this.afcNlKo(N) : this.afcPlayoffView(N));
        const d = +v - 1, tag = this.hTag(N.hosts);
        const qf = new Set(N.qf ? N.qf.reduce((a, t) => a.concat([t.hi, t.lo]), []) : []);
        const acIn = new Set(N.acQual ? N.acQual.div2 : []);
        const direct = new Set(N.ranking ? N.ranking.direct : []), po = new Set(N.playoff ? N.playoff.teams : []);
        const zone = (r, pos) => {
            if (d === 0) {
                if (ac) return N.qf ? (qf.has(r.id) ? C.green : pos === 5 ? C.amber : pos === 6 ? C.red : '') : pos <= 2 ? C.green : pos === 3 ? C.light : pos === 5 ? C.amber : pos === 6 ? C.red : '';
                return direct.has(r.id) ? C.green : po.has(r.id) ? C.blue : pos === 6 ? C.red : '';
            }
            if (d === 1) {
                if (ac) return pos === 1 ? C.green : pos === 2 ? C.blue : pos === 5 ? C.amber : pos === 6 ? C.red : '';
                return pos === 1 ? C.green : pos === 6 ? C.red : '';
            }
            return pos === 1 ? C.green : ac && pos === 2 ? C.blue : '';
        };
        const acTag = id => tag(id) + (d === 1 && acIn.has(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">${I18n.t('intl.acShort')}</span>` : '');
        html += N.divs[d].groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone, acTag)}${this.groupFixtures(g)}`).join('');
        const L = [];
        if (d === 0 && ac) L.push([C.green, I18n.t('intl.zone.qf')], [C.light, I18n.t('intl.zone.qfThird')], [C.amber, I18n.t('intl.zone.relegPo')], [C.red, I18n.t('intl.zone.relegated')]);
        if (d === 0 && !ac) L.push([C.green, I18n.t('intl.wcqDirect')], [C.blue, I18n.t('intl.afcPlayoff')], [C.red, I18n.t('intl.zone.relegated')]);
        if (d === 1) L.push([C.green, I18n.t('intl.zone.promoted')]); if (d === 1 && ac) L.push([C.blue, I18n.t('intl.zone.promoPo')], [C.amber, I18n.t('intl.zone.relegPo')]);
        if (d === 1) L.push([C.red, I18n.t('intl.zone.relegated')]);
        if (d === 2) L.push([C.green, I18n.t('intl.zone.promoted')]); if (d === 2 && ac) L.push([C.blue, I18n.t('intl.zone.promoPo')]);
        L.push(['', I18n.t('intl.zone.host')]);
        if (d === 0 && ac) L.push(['', I18n.t('intl.acAllDiv1', { comp: compName('INTL_AC') })]);
        if (d === 1 && ac) L.push(['', I18n.t('intl.acTag', { comp: compName('INTL_AC') })]);
        return html + this.legend(L) + this.afcMovement(N, d);
    },
    afcMovement(N, d) {
        if (!N.movement) return '';
        const M = N.movement, list = ids => (ids || []).map(id => this.nation(id)).join(', ') || '–';
        const rows = [];
        if (d > 0) rows.push([I18n.t('intl.upToDiv', { n: d }), M.up[d]]);
        if (d < 2) rows.push([I18n.t('intl.downToDiv', { n: d + 2 }), M.down[d]]);
        return `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.nextEdition')}</div><div class="fcard" style="padding:10px 12px;line-height:1.7">${rows.map(([l, ids]) => `<div>${l}: ${list(ids)}</div>`).join('')}</div>`;
    },
    // Asian Cup edition: Division 1 bracket (QF two legs -> Finals), the promotion play-offs
    afcNlKo(N) {
        if (!N.qf) return `<p class="hint">${I18n.t('intl.zonesAfter', { w: INTL_CONFIG.STD_SLOTS[INTL_CONFIG.AFCNL_GROUP_SLOTS.slice(-1)[0] - 1][0] })}</p>`;
        let html = '';
        if (N.result) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_AFCNL'), nation: this.nation(N.result.winner) })}</div>`;
        html += this.nlBracket({ qf: N.qf, finals: N.finals });
        if (N.finals && N.finals.third) html += `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(N.finals.third)}</div>`;
        const [a, b] = INTL_CONFIG.AFCNL_KO_SLOTS.map(i => INTL_CONFIG.STD_SLOTS[i - 1][0]);
        [['d12', 1, 2], ['d23', 2, 3]].forEach(([k, up, down]) => {
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.divPlayoffs', { up, down })} <span class="muted" style="font-weight:400">· ${I18n.t('intl.weeks', { a, b })}</span></div>`;
            html += `<div style="display:flex;flex-direction:column;gap:8px">${N.po[k].map(t => this.tieBox(t)).join('')}</div>`;
        });
        return html;
    },
    // World Cup edition: the ranking of Division 1 and the AFC play-off (single round-robin)
    afcPlayoffView(N) {
        if (!N.ranking) return `<p class="hint">${I18n.t('intl.afcPoPending')}</p>`;
        const C = this.COL, direct = new Set(N.ranking.direct);
        let html = `<div class="section-label">${I18n.t('intl.afcRanking')}</div><div class="fcard" style="padding:6px 12px">${N.ranking.order.slice(0, N.ranking.direct.length + 4).map((id, i) =>
            `<div class="frow"><span class="frow__k">${i + 1}. ${this.nation(id)}</span><span class="frow__v">${direct.has(id) ? '✅' : '↗'}</span></div>`).join('')}</div>`;
        const res = N.result;
        const zone = (r, p) => p <= INTL_CONFIG.AFC_PLAYOFF_THROUGH ? C.green : p === INTL_CONFIG.AFC_PLAYOFF_THROUGH + 1 ? C.blue : '';
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.afcPlayoff')}</div>${this.groupTable(N.playoff, 'rr', zone)}${this.groupFixtures(N.playoff)}`;
        html += this.legend([[C.green, I18n.t('intl.wcqDirect')], [C.blue, I18n.t('intl.icPlayoff')]]);
        if (res) html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.wcqDirect')}</div><div class="fcard" style="padding:8px 12px;line-height:1.7">${N.hosts.concat(res.direct).map(id => this.nation(id)).join(', ')}</div>`;
        return html;
    },

    // ---------------- Asian Cup ----------------
    acView(S) {
        const A = S.ao.ac, T = A.tour, C = this.COL;
        let html = '';
        if (T && T.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_AC') + ' ' + (S.year + 1), nation: this.nation(T.winner) })}</div>`;
        html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: 24, hosts: A.hosts.map(id => this.nation(id)).join(', ') })}${A.fixed ? ' · ' + I18n.t('intl.acRealDraw') : ''}</p>`;
        if (!T) {
            return html + `<p class="hint">${I18n.t('intl.acDrawWeek', { w: INTL_CONFIG.FINALS_DRAW_WEEK })}</p><div class="section-label">${I18n.t('intl.acField')}</div><div class="fcard" style="padding:8px 12px;line-height:1.7">${A.teams.map(id => this.nation(id)).join(', ')}</div>`;
        }
        html += this.bracket(T);
        const thirdsIn = new Set(T.thirds || []);
        const zone = (r, p) => p <= 2 ? C.green : p === 3 ? (thirdsIn.size ? (thirdsIn.has(r.id) ? C.green : '') : C.light) : '';
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.groupStage')}</div>` + T.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone, this.hTag(T.hosts))}${this.groupFixtures(g)}`).join('');
        if (T.groups[0].fx.some(f => f.hg != null)) html += this.thirdsTable(T, 4);
        return html + this.legend([[C.green, I18n.t('intl.zone.through')], [C.light, I18n.t('intl.zone.bestThird')], ['', I18n.t('intl.zone.host')]]);
    },
    thirdsTable(T, n) {
        const C = this.COL;
        const rows = Internationals.crossRank(T.groups.map(g => Object.assign({ g: g.id }, Internationals.standings(g, 'rr')[2])));
        return `<div class="section-label">${I18n.t('intl.bestThirds', { n })}</div><div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('intl.nation')}</th><th class="num">${I18n.t('intl.grp')}</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${rows.map((r, i) =>
            `<tr><td style="${i < n ? `border-left-color:${C.green}` : ''}">${i + 1}</td><td class="club-cell">${this.nation(r.id)}</td><td class="num">${r.g}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`).join('')}</tbody></table></div>`;
    },

    // ---------------- OFC ----------------
    ofcqView() {
        const cyc = this.aoCycle(); if (!cyc || !cyc.ofc) return '';
        const Q = cyc.ofc, C = this.COL;
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t(Q.hosts.length ? 'intl.ofcqHintHost' : 'intl.ofcqHint', { comp: compName('INTL_WC'), year: cyc.year })}</p>`;
        if (Q.result) html += `<div class="fcard" style="padding:8px 12px;line-height:1.7;margin-bottom:var(--space-3)">${Q.result.direct.length ? `<div>${I18n.t('intl.wcqDirect')}: ${this.nation(Q.result.direct[0])}</div>` : ''}<div>${I18n.t('intl.wcqIcEntrants')}: ${this.nation(Q.result.po[0])}</div></div>`;
        if (Q.r3) html += `<div class="section-label">${I18n.t('intl.roundN', { n: 3 })}</div><div class="fcard">${Q.r3.sf.map(m => this.match(m)).join('')}${Q.r3.final ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('leagues.final')}</div>${this.match(Q.r3.final)}` : ''}</div>`;
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.roundN', { n: 2 })}</div>` + Q.r2.groups.map(g => g.fx
            ? `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', (r, p) => p <= 2 ? C.green : '')}${this.groupFixtures(g)}`
            : `<div class="fcard" style="padding:8px 12px">${g.teams.map(t => t === 'R1W' ? I18n.t('intl.r1WinnerOne') : this.nation(t)).join(', ')}</div>`).join('');
        const R1 = Q.r1;
        if (R1.teams.length > 1) html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.roundN', { n: 1 })}</div><div class="fcard">${(R1.sf || []).map(m => this.match(m)).join('')}${R1.final ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('leagues.final')}</div>${this.match(R1.final)}` : ''}${!R1.sf && !R1.final ? `<div style="padding:8px 12px">${R1.teams.map(id => this.nation(id)).join(', ')}</div>` : ''}</div>`;
        return html;
    },
    oncView(S) {
        const N = S.ao.onc, T = N.tour, C = this.COL;
        let html = '';
        if (T && T.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_ONC') + ' ' + (S.year + 1), nation: this.nation(T.winner) })}</div>`;
        html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: 8, hosts: N.hosts.map(id => this.nation(id)).join(', ') })}</p>`;
        if (T) {
            const K = T.ko;
            if (K.sf) html += `<div class="section-label">${I18n.t('leagues.sfTab')}</div><div class="fcard">${K.sf.map(m => this.match(m)).join('')}</div>`;
            if (K.final) html += `<div class="section-label">${I18n.t('leagues.final')}</div><div class="fcard">${this.match(K.final)}</div><div class="section-label">${I18n.t('intl.third')}</div><div class="fcard">${this.match(K.third)}</div>`;
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.groupStage')}</div>` + T.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', (r, p) => p <= 2 ? C.green : '', this.hTag(T.hosts))}${this.groupFixtures(g)}`).join('');
        }
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.oncQual')}</div><p class="hint" style="margin-bottom:var(--space-2)">${I18n.t('intl.oncQualHint')}</p>${this.groupTable(N.q, 'rr', (r, p) => p === 1 ? C.green : '')}${this.groupFixtures(N.q)}`;
        return html;
    },
});
if (typeof window !== 'undefined') window.IntlScreen = IntlScreen;
