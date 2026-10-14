// ============================================================
//  Competitions > International, Africa (js/intl-caf.js): AFCON (qualifiers, tournament,
//  bracket), the African Nations League (zones + Finals) and CAF World Cup qualifying (9 groups,
//  the cross-group ranking, the CAF play-off). Read-only, like the rest of IntlScreen.
// ============================================================
Object.assign(IntlScreen, {
    cafCycle() {
        const I = GameState.intl; if (!I || !I.caf) return null;
        const keys = Object.keys(I.caf.cycles).sort(), y = GameState.seasonStartYear;
        const k = keys.find(k => +k.slice(3) >= y + (GameState.week <= 2 ? 0 : 1)) || keys[keys.length - 1];
        return k ? Object.assign({ key: k, year: +k.slice(3) }, I.caf.cycles[k]) : null;
    },
    cafTabs() {
        const S = this.season(), t = [], cyc = this.cafCycle();
        if (S && S.caf && S.caf.afq) t.push(['afcon', compName('INTL_AFCON') + ' ' + (S.year + 1)]);
        if (S && S.caf && S.caf.anl) t.push(['anl', compName('INTL_ANL')]);
        if (cyc && cyc.q) t.push(['cafq', I18n.t('intl.tab.wcq')]);
        if (S && S.type === 'WORLD_CUP' && S.tour) t.push(['tour', this.tourName(S)]);
        t.push(['teams', I18n.t('intl.tab.teams')]);
        t.push(['info', I18n.t('intl.tab.info')]);
        return t;
    },
    cafDefault() {
        const tabs = this.cafTabs().map(t => t[0]), wk = GameState.week, tourOn = wk >= 49 || wk <= 2;
        if (tourOn && tabs.includes('tour')) return 'tour';
        return ['afcon', 'anl', 'cafq', 'teams'].find(k => tabs.includes(k));
    },
    cafSection(tab) {
        const S = this.season();
        switch (tab) {
            case 'afcon': return this.afconView(S);
            case 'anl': return this.anlView(S);
            case 'cafq': return this.cafqView();
            case 'tour': return S && S.tour ? this.tournament(S) : '';
            case 'info': return this.info('CAF');
            default: return this.confTeams('CAF');
        }
    },
    setAnlView(v) { this.state.anlView = v; LeaguesScreen.renderSection(); },

    // ---------------- AFCON ----------------
    afconView(S) {
        const Q = S.caf.afq, C = this.COL, T = Q.tour;
        let html = '';
        if (T && T.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_AFCON') + ' ' + (S.year + 1), nation: this.nation(T.winner) })}</div>`;
        html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: 28, hosts: Q.hosts.map(id => this.nation(id)).join(', ') })}</p>`;
        if (T) {
            html += this.cafBracket(T);
            const hostTag = id => T.hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
            const thirdsIn = new Set(T.thirds || []);
            const zone = (r, p) => p <= 2 ? C.green : p === 3 ? (thirdsIn.size ? (thirdsIn.has(r.id) ? C.green : '') : C.light) : '';
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.groupStage')}</div>` + T.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone, hostTag)}${this.groupFixtures(g)}`).join('');
            if (T.groups[0].fx.some(f => f.hg != null)) {
                const rows = Internationals.crossRank(T.groups.map(g => Object.assign({ g: g.id }, Internationals.standings(g, 'rr')[2])));
                html += `<div class="section-label">${I18n.t('intl.bestThirds', { n: INTL_CONFIG.AFCON_R16_THIRDS })}</div><div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('intl.nation')}</th><th class="num">${I18n.t('intl.grp')}</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${rows.map((r, i) =>
                    `<tr><td style="${i < INTL_CONFIG.AFCON_R16_THIRDS ? `border-left-color:${C.green}` : ''}">${i + 1}</td><td class="club-cell">${this.nation(r.id)}</td><td class="num">${r.g}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`).join('')}</tbody></table></div>`;
            }
        }
        // qualifying
        const QQ = Q.qualified, direct = new Set(QQ ? QQ.direct : []), thirds = new Set(QQ ? QQ.thirds : []);
        const qZone = (r, p) => direct.has(r.id) ? C.green : thirds.has(r.id) ? C.light : (!QQ && p <= 2 && !Q.hosts.includes(r.id) ? C.green : '');
        const H = id => Q.hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
        html += `<div class="section-label" style="margin-top:var(--space-5)">${I18n.t('intl.afconQual')}</div><p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.afqHint', { comp: compName('INTL_AFCON') + ' ' + (S.year + 1), n: Math.max(0, INTL_CONFIG.AFCON_THIRDS - Q.hosts.length) })}</p>`;
        html += Q.groups.map(g => g.fx ? `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', qZone, H)}${this.groupFixtures(g)}`
            : `<div class="fcard" style="padding:8px 12px">${g.teams.map(t => /^PW\d+$/.test(t) ? I18n.t('intl.r1Winner', { n: t.slice(2) }) : this.nation(t)).join(', ')}</div>`).join('');
        html += this.legend([[C.green, I18n.t('intl.zone.qualified')], [C.light, I18n.t('intl.zone.bestThird')], ['', I18n.t('intl.zone.host')]]);
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.prelims')}</div><div class="fcard">${Q.prelim.map(t => this.twoLeg(t)).join('')}</div>`;
        return html;
    },
    // Round of 16 -> final; M1/M2 feed QF1 and so on, so the stored order is already the tree order
    cafBracket(T) {
        const K = T.ko;
        if (!K.r16) return `<p class="hint">${I18n.t('intl.bracketAfterGroups')}</p>`;
        const col = (title, list, h) => `<div style="display:flex;flex-direction:column;min-width:160px;flex:none"><div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:${h}px">${list.map(m => this.koBox(m)).join('')}</div></div>`;
        return `<div class="section-label">${I18n.t('leagues.bracketTab')}</div><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:12px;min-width:max-content;padding:2px 2px 6px">`
            + col(I18n.t('leagues.r16Tab'), K.r16, 640) + col(I18n.t('leagues.qfTab'), K.qf || [null, null, null, null], 640)
            + col(I18n.t('leagues.sfTab'), K.sf || [null, null], 640) + col(I18n.t('leagues.final'), [K.final || null], 640)
            + `</div></div>${K.third ? `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(K.third)}</div>` : ''}`;
    },

    // ---------------- African Nations League ----------------
    anlView(S) {
        const A = S.caf.anl, C = this.COL;
        const views = INTL_CONFIG.ANL_ZONES.map(z => [z, I18n.t('intl.anlZone.' + z)]).concat([['FINALS', I18n.t('intl.anlFinals')]]);
        const v = views.some(x => x[0] === this.state.anlView) ? this.state.anlView : (A.tour ? 'FINALS' : 'NORTH');
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.anlHint')}</p>` + this.chips(views, v, 'IntlScreen.setAnlView');
        if (v === 'FINALS') {
            if (A.tour && A.tour.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_ANL'), nation: this.nation(A.tour.winner) })}</div>`;
            if (A.host) html += `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.anlVenue', { nation: this.nation(A.host) })}</p>`;
            if (A.tour) html += this.amBracket(A.tour) + this.amGroups(A.tour);
            const Q = A.qualified;
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.anlFinalsIn')}</div>`
                + (Q ? `<div class="fcard" style="padding:8px 12px;line-height:1.7"><div><b>${I18n.t('intl.anlZone.NORTH')}</b>: ${Q.north.map(id => this.nation(id)).join(', ')}</div><div><b>${I18n.t('intl.groupWinners')}</b>: ${Q.winners.map(id => this.nation(id)).join(', ')}</div><div><b>${I18n.t('intl.runnersUp')}</b>: ${Q.runners.map(id => this.nation(id)).join(', ')}</div></div>`
                    : `<p class="hint">${I18n.t('intl.zonesAfter', { w: INTL_CONFIG.STD_SLOTS[INTL_CONFIG.ANL_BIG_SLOTS.slice(-1)[0] - 1][0] })}</p>`);
            return html;
        }
        const Z = A.zones.find(z => z.id === v), Q = A.qualified;
        const inF = new Set(Q ? Q.north.concat(Q.winners, Q.runners) : []);
        const zone = (r, p) => Q ? (inF.has(r.id) ? C.green : '') : (v === 'NORTH' ? (p <= 2 ? C.green : '') : (p === 1 ? C.green : p === 2 ? C.light : ''));
        html += Z.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone)}${this.groupFixtures(g)}`).join('');
        return html + this.legend([[C.green, I18n.t('intl.anlFinalsIn')], [C.light, I18n.t('intl.anlRunnerUp')]]);
    },

    // ---------------- CAF World Cup qualifying ----------------
    cafqView() {
        const cyc = this.cafCycle(); if (!cyc || !cyc.q) return '';
        const q = cyc.q, C = this.COL, H = q.hosts.length;
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.cafqHint', { comp: compName('INTL_WC'), year: cyc.year, n: INTL_CONFIG.CAFQ_DIRECT - H })}</p>`;
        const direct = new Set(q.result ? q.result.direct : []), po = new Set(q.playoff ? q.playoff.teams : []);
        const tag = id => q.hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
        if (q.playoff) {
            html += `<div class="section-label">${I18n.t('intl.cafPlayoff')}</div><div class="fcard">`
                + (q.playoff.sf ? q.playoff.sf.map(m => this.match(m)).join('') : [[0, 3], [1, 2]].map(([x, y]) => this.match({ h: q.playoff.teams[x], a: q.playoff.teams[y], hg: null })).join(''))
                + (q.playoff.final ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('leagues.final')}</div>${this.match(q.playoff.final)}` : '') + `</div>`;
        }
        if (q.ranking) {
            const rk = (title, ids) => `<div class="section-label">${title}</div><div class="fcard" style="padding:6px 12px">${ids.map((id, i) => `<div class="frow"><span class="frow__k">${i + 1}. ${this.nation(id)}</span><span class="frow__v">${direct.has(id) ? '✅' : po.has(id) ? '↗' : ''}</span></div>`).join('')}</div>`;
            html += rk(I18n.t('intl.groupWinners'), q.ranking.winners) + rk(I18n.t('intl.runnersUp'), q.ranking.runners.slice(0, 4));
        }
        const zone = (r, p) => q.result ? (direct.has(r.id) ? C.green : po.has(r.id) ? C.blue : '') : (p === 1 ? C.green : p === 2 ? C.light : '');
        html += q.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone, tag)}${this.groupFixtures(g)}`).join('');
        return html + this.legend([[C.green, I18n.t('intl.wcqDirect')], [C.blue, I18n.t('intl.cafPlayoff')], ['', I18n.t('intl.zone.host')]]);
    },
});
if (typeof window !== 'undefined') window.IntlScreen = IntlScreen;
