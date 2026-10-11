// ============================================================
//  Competitions > International: Nations Series (Nations League), European Qualifying, the final
//  tournaments, and calendar / hosts / roll of honour. Read-only over GameState.intl
//  (js/internationals.js) — it never creates or advances anything.
// ============================================================
const IntlScreen = {
    state: { nlLeague: 'A', qLeague: 1 },
    COL: { green: '#16A34A', light: '#86EFAC', blue: '#2563EB', amber: '#D97706', red: '#DC2626' },

    season() { return (typeof Internationals !== 'undefined') ? Internationals.currentSeason() : null; },
    nation(id) {
        const n = (typeof NATIONS_BY_ID !== 'undefined' && NATIONS_BY_ID[id]) || null;
        const name = n ? n.name : (id || '–');
        return `${UI.flag(name)} <span>${UI.esc(name)}</span>`;
    },
    // ---------------- tabs ----------------
    tabs() {
        const S = this.season(), t = [];
        if (S && S.type === 'NATIONS_LEAGUE') {
            t.push(['nl', compName('INTL_NL')]);
            if (S.qf) t.push(['nlko', I18n.t('intl.tab.knockouts')]);
        } else if (S) {
            t.push(['qual', compName('INTL_QUAL')]);
            if (S.po) t.push(['po', I18n.t('leagues.playoffs')]);
            if (S.tour) t.push(['tour', this.tourName(S)]);
        }
        t.push(['info', I18n.t('intl.tab.info')]);
        return t;
    },
    defaultTab() {
        const S = this.season(); if (!S) return 'info';
        if (S.type === 'NATIONS_LEAGUE') return (S.qf && GameState.week >= INTL_CONFIG.LEG1_WEEK) || (S.finals && S.finals.final) ? 'nlko' : 'nl';
        if (S.tour) return 'tour';
        if (S.po && GameState.week >= INTL_CONFIG.ROUND_DRAW_WEEK) return 'po';
        return 'qual';
    },
    tourName(S) { return compName(S.type === 'WORLD_CUP' ? 'INTL_WC' : 'INTL_EURO') + ' ' + (S.year + 1); },
    setNlLeague(L) { this.state.nlLeague = L; LeaguesScreen.renderSection(); },
    setQLeague(n) { this.state.qLeague = n; LeaguesScreen.renderSection(); },

    section(tab) {
        if (typeof Internationals === 'undefined') return '';
        const S = this.season();
        if (!GameState.intl) return `<div class="fcard" style="padding:16px"><p class="muted" style="margin:0">${I18n.t('intl.notYet', { season: GameState.seasonLabelFor(INTL_CONFIG.FIRST_SEASON) })}</p></div>` + this.info();
        if (tab === 'info' || !S) return (S ? '' : `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.drawWeek', { w: INTL_CONFIG.DRAW_WEEK })}</p>`) + this.info();
        const lastNote = S.year !== GameState.seasonStartYear && GameState.week > 2 ? `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('leagues.lastSeasonComps')}</p>` : '';
        switch (tab) {
            case 'nlko': return lastNote + this.nlKnockouts(S);
            case 'qual': return lastNote + this.qualifying(S);
            case 'po': return lastNote + this.playoffs(S);
            case 'tour': return lastNote + this.tournament(S);
            case 'nl': default: return lastNote + (S.type === 'NATIONS_LEAGUE' ? this.nlGroups(S) : this.qualifying(S));
        }
    },

    // ---------------- shared bits ----------------
    chips(items, cur, onclick) {
        return `<div class="tab-bar" style="margin-bottom:var(--space-3)">${items.map(([k, l]) => `<button class="tab ${k === cur ? 'is-active' : ''}" onclick="${onclick}('${k}')">${l}</button>`).join('')}</div>`;
    },
    // a group table; `zone(row, pos)` -> a colour for the left strip (or ''); `tag(id)` -> extra marker
    groupTable(g, mode, zone, tag) {
        const rows = Internationals.standings(g, mode);
        const body = rows.map((r, i) => {
            const z = zone ? zone(r, i + 1) : '';
            const first = z ? `<td style="border-left-color:${z}">${i + 1}</td>` : `<td>${i + 1}</td>`;
            return `<tr>${first}<td class="club-cell">${this.nation(r.id)}${tag ? tag(r.id) : ''}</td><td class="num">${r.P}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`;
        }).join('');
        return `<div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('intl.nation')}</th><th class="num">P</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${body}</tbody></table></div>`;
    },
    legend(items) {
        const dot = c => `<span style="display:inline-block;width:4px;height:14px;border-radius:1px;background:${c}"></span>`;
        return `<div class="hint" style="margin-top:var(--space-2);display:flex;gap:14px;flex-wrap:wrap">${items.map(([c, l]) => `<span style="display:inline-flex;align-items:center;gap:5px">${c ? dot(c) : ''} ${l}</span>`).join('')}</div>`;
    },
    score(f) {
        if (!f || f.hg == null) return `<span class="muted" style="font-size:var(--fs-xs)">${I18n.t('leagues.toCome')}</span>`;
        const tag = f.pens ? ` <span style="color:var(--danger);font-size:var(--fs-xs);white-space:nowrap">(${I18n.t('leagues.pens')} ${f.pens.h}–${f.pens.a})</span>`
            : f.et ? ` <span style="color:var(--danger);font-size:var(--fs-xs)">(${I18n.t('leagues.etTag')})</span>` : '';
        return `${f.hg}–${f.ag}${tag}`;
    },
    match(f) {
        if (!f) return '';
        const w = Internationals.winnerOf(f);
        return `<div class="tie-block"><div class="fixture"><span class="fx-home ${w && w === f.h ? 'fx-win' : ''}">${this.nation(f.h)}</span><span class="fx-score">${this.score(f)}</span><span class="fx-away ${w && w === f.a ? 'fx-win' : ''}">${this.nation(f.a)}</span></div></div>`;
    },
    // two-legged tie: `lo` at home in leg 1, `hi` in leg 2; aggregate once decided
    twoLeg(t) {
        const leg = (label, f, h, a) => `<div class="fixture fixture--labeled"><span class="fx-label">${label}</span><span class="fx-home ${t.winner && t.winner === h && f ? 'fx-adv' : ''}">${this.nation(h)}</span><span class="fx-score">${f ? this.score(f) : `<span class="muted" style="font-size:var(--fs-xs)">${I18n.t('leagues.toCome')}</span>`}</span><span class="fx-away ${t.winner && t.winner === a && f ? 'fx-adv' : ''}">${this.nation(a)}</span></div>`;
        // the aggregate, winner first, so it reads the same whichever leg's orientation you look at
        const aw = t.agg ? (t.winner === t.hi ? [t.agg[0], t.agg[1]] : [t.agg[1], t.agg[0]]) : null;
        const agg = t.agg ? `<div class="hint" style="text-align:center;margin:2px 0 0">${I18n.t('intl.aggregate', { score: `${this.nation(t.winner)} ${aw[0]}–${aw[1]}` })}</div>` : '';
        return `<div class="tie-block">${leg(I18n.t('leagues.leg1'), t.leg1, t.lo, t.hi)}${leg(I18n.t('leagues.leg2'), t.leg2, t.hi, t.lo)}${agg}</div>`;
    },
    // fixtures of a group, matchday by matchday, folded away under the table
    groupFixtures(g) {
        const mds = [...new Set(g.fx.map(f => f.md))].sort((a, b) => a - b);
        return `<details style="margin-top:var(--space-2)"><summary class="hint" style="cursor:pointer">${I18n.t('leagues.fixturesTab')}</summary>${mds.map(md => {
            const f0 = g.fx.find(f => f.md === md);
            return `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('leagues.matchdayN', { n: md })}${f0 && f0.w ? ` <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} ${f0.w}${f0.s === 'B' ? ' (B)' : ''}</span>` : ''}</div><div class="fcard">${g.fx.filter(f => f.md === md).map(f => this.match(f)).join('')}</div>`;
        }).join('')}</details>`;
    },

    // ---------------- Nations League ----------------
    nlGroups(S) {
        const L = S.leagues[this.state.nlLeague] ? this.state.nlLeague : 'A';
        const head = this.chips(['A', 'B', 'C'].map(k => [k, I18n.t('intl.leagueX', { x: k })]), L, 'IntlScreen.setNlLeague');
        const C = this.COL;
        const zone = (r, pos) => {
            if (L === 'A') return pos <= 2 ? C.green : pos === 3 ? C.light : pos === 5 ? C.amber : pos === 6 ? C.red : '';
            if (L === 'B') return pos === 1 ? C.green : pos === 2 ? C.blue : pos === 5 ? C.amber : pos === 6 ? C.red : '';
            return pos === 1 ? C.green : pos === 2 ? C.blue : '';
        };
        const legend = L === 'A' ? [[C.green, I18n.t('intl.zone.qf')], [C.light, I18n.t('intl.zone.qfThird')], [C.amber, I18n.t('intl.zone.relegPo')], [C.red, I18n.t('intl.zone.relegated')]]
            : L === 'B' ? [[C.green, I18n.t('intl.zone.promoted')], [C.blue, I18n.t('intl.zone.promoPo')], [C.amber, I18n.t('intl.zone.relegPo')], [C.red, I18n.t('intl.zone.relegated')]]
            : [[C.green, I18n.t('intl.zone.promoted')], [C.blue, I18n.t('intl.zone.promoPo')]];
        const groups = S.leagues[L].groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone)}${this.groupFixtures(g)}`).join('');
        return head + groups + this.legend(legend);
    },
    // Knockouts, league by league. League A: the quarter-finals -> Finals bracket (+ third place).
    // Every league: the promotion/relegation play-offs it takes part in, and who moves.
    nlKnockouts(S) {
        const L = ['A', 'B', 'C'].includes(this.state.nlLeague) ? this.state.nlLeague : 'A';
        let html = this.chips(['A', 'B', 'C'].map(k => [k, I18n.t('intl.leagueX', { x: k })]), L, 'IntlScreen.setNlLeague');
        if (!S.qf) return html + `<p class="hint">${I18n.t('intl.koDrawWeek', { w: INTL_CONFIG.ROUND_DRAW_WEEK })}</p>`;
        if (L === 'A') {
            if (S.result) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: compName('INTL_NL'), nation: this.nation(S.result.winner) })}</div>`;
            html += this.nlBracket(S);
            if (S.finals && S.finals.third) html += `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(S.finals.third)}</div>`;
        }
        const po = [];
        if (L !== 'C') po.push(['AB', 'A', 'B']);
        if (L !== 'A') po.push(['BC', 'B', 'C']);
        po.forEach(([k, up, down]) => {
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.promoPlayoffs', { up, down })} <span class="muted" style="font-weight:400">· ${I18n.t('intl.weeks', { a: INTL_CONFIG.LEG1_WEEK, b: INTL_CONFIG.LEG2_WEEK })}</span></div>`;
            html += `<div style="display:flex;flex-direction:column;gap:8px">${S.po[k].map(t => this.tieBox(t)).join('')}</div>`;
        });
        if (S.movement) {
            const M = S.movement, list = ids => ids.map(id => this.nation(id)).join(', ') || '–';
            const rows = L === 'A' ? [[I18n.t('intl.downToB'), M.relegated.A]]
                : L === 'B' ? [[I18n.t('intl.upToA'), M.promoted.B], [I18n.t('intl.downToC'), M.relegated.B]]
                : [[I18n.t('intl.upToB'), M.promoted.C]];
            html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.nextEdition')}</div><div class="fcard" style="padding:10px 12px;line-height:1.7">${rows.map(([l, ids]) => `<div>${l}: ${list(ids)}</div>`).join('')}</div>`;
        }
        return html;
    },
    // a two-legged tie as a bracket box: each side with its aggregate, the winner in green
    tieBox(t) {
        const done = !!t.leg2, agg = t.agg || [null, null];
        const goals = id => done ? (id === t.hi ? agg[0] : agg[1]) : (t.leg1 ? (id === t.leg1.h ? t.leg1.hg : t.leg1.ag) : '');
        const side = id => {
            const win = done && t.winner === id;
            return `<div style="padding:5px 8px;font-size:var(--fs-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;justify-content:space-between;gap:8px;${win ? 'font-weight:var(--weight-semibold);color:#16A34A' : ''}"><span>${this.nation(id)}</span><span>${goals(id)}</span></div>`;
        };
        const pens = t.leg2 && t.leg2.pens ? `<div class="muted" style="font-size:10px;text-align:center">${I18n.t('leagues.pens')} ${t.leg2.pens.h}–${t.leg2.pens.a}</div>` : '';
        const note = !t.leg1 ? '' : !done ? `<div class="muted" style="font-size:10px;text-align:center">${I18n.t('leagues.leg1')}</div>` : '';
        return `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(t.lo)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(t.hi)}${pens}${note}</div>`;
    },
    // League A: quarter-finals (two legs, aggregate) -> semi-finals -> final. The semi-final draw is
    // random, so once it is made the quarter-finals are re-ordered to sit next to their semi-final.
    nlBracket(S) {
        const F = S.finals;
        let qf = S.qf.slice();
        if (F) {
            const pos = id => F.sf.findIndex(m => m.h === id || m.a === id) * 2 + (F.sf.some(m => m.h === id) ? 0 : 1);
            qf.sort((a, b) => pos(a.winner) - pos(b.winner));
        }
        const sfBox = m => {
            const w = m && m.hg != null ? Internationals.winnerOf(m) : null;
            const side = id => `<div style="padding:5px 8px;font-size:var(--fs-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;justify-content:space-between;gap:8px;${w && w === id ? 'font-weight:var(--weight-semibold);color:#16A34A' : (id ? '' : 'color:var(--text-secondary)')}"><span>${id ? this.nation(id) : '–'}</span><span>${m && m.hg != null ? (id === m.h ? m.hg : m.ag) : ''}</span></div>`;
            const tag = m && m.pens ? `<div class="muted" style="font-size:10px;text-align:center">${I18n.t('leagues.pens')} ${m.pens.h}–${m.pens.a}</div>` : '';
            return `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(m && m.h)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(m && m.a)}${tag}</div>`;
        };
        const col = (title, cells) => `<div style="display:flex;flex-direction:column;min-width:160px;flex:none"><div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:420px">${cells}</div></div>`;
        const host = F ? ` <span class="muted" style="font-weight:400">· ${I18n.t('intl.hostedBy', { nation: this.nation(F.host) })} · ${I18n.t('leagues.wkShort')} ${INTL_CONFIG.NL_FINALS_WEEK}</span>` : '';
        return `<div class="section-label">${I18n.t('leagues.bracketTab')}${host}</div><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:12px;min-width:max-content;padding:2px 2px 6px">`
            + col(I18n.t('leagues.qfTab'), qf.map(t => this.tieBox(t)).join(''))
            + col(I18n.t('leagues.sfTab'), [0, 1].map(i => sfBox(F ? F.sf[i] : null)).join(''))
            + col(I18n.t('leagues.final'), sfBox(F ? F.final : null))
            + `</div></div>`;
    },

    // ---------------- European Qualifying ----------------
    qualifying(S) {
        const n = this.state.qLeague === 2 ? 2 : 1;
        const head = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.qualFor', { comp: this.tourName(S) })}</p>` + this.chips([['1', I18n.t('intl.leagueN', { n: 1 })], ['2', I18n.t('intl.leagueN', { n: 2 })]], String(n), 'IntlScreen.setQLeague');
        const C = this.COL, hosts = S.hosts || [];
        const Q = S.qual, inPaths = new Set(S.po ? S.po.paths.reduce((a, p) => a.concat(p.teams), []) : []);
        const qualified = new Set(Q ? [...Q.direct, ...Q.reserved, ...Q.auto] : []);
        const zone = r => qualified.has(r.id) ? C.green : inPaths.has(r.id) ? C.blue : '';
        const tag = id => hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
        const groups = (n === 1 ? S.l1 : S.l2).groups.map((g, i) => `<div class="section-label">${I18n.t('intl.groupX', { x: (n === 1 ? 'L1-' : 'L2-') + (i + 1) })}</div>${this.groupTable(g, n === 1 ? 'l1' : 'rr', zone, tag)}${this.groupFixtures(g)}`).join('');
        const note = Q ? '' : `<p class="hint" style="margin-top:var(--space-2)">${I18n.t('intl.zonesAfter', { w: INTL_CONFIG.GROUPS_DONE_WEEK })}</p>`;
        return head + groups + this.legend([[C.green, I18n.t('intl.zone.qualified')], [C.blue, I18n.t('intl.zone.playoffs')], ['', I18n.t('intl.zone.host')]]) + note;
    },
    playoffs(S) {
        let html = '';
        if (S.po) html += S.po.paths.map((p, i) => {
            const sf = p.sf ? p.sf.map(m => this.match(m)).join('') : p.teams.length === 4 ? [[0, 3], [1, 2]].map(([x, y]) => this.match({ h: p.teams[x], a: p.teams[y], hg: null })).join('') : '';
            return `<div class="section-label">${I18n.t('intl.pathN', { n: i + 1 })} <span class="muted" style="font-weight:400">· ${I18n.t('intl.weeks', { a: INTL_CONFIG.LEG1_WEEK, b: INTL_CONFIG.LEG2_WEEK })}</span></div>
                <div class="fcard">${sf}${p.final ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('leagues.final')}</div>${this.match(p.final)}` : ''}</div>`;
        }).join('');
        if (S.wc) {
            const conf = Object.keys(S.wc.direct).map(c => `<div style="margin-bottom:6px"><b>${c}</b>: ${S.wc.direct[c].map(id => this.nation(id)).join(', ')}</div>`).join('');
            html += `<div class="section-label">${I18n.t('intl.otherConfs')}</div><div class="fcard" style="padding:10px 12px;line-height:1.6">${conf}</div>`;
            const ic = S.wc.ic;
            html += `<div class="section-label">${I18n.t('intl.icPlayoff')}</div><div class="fcard">`
                + (ic.sf ? ic.sf.map(m => this.match(m)).join('') : [[0, 1], [2, 3]].map(([x, y]) => this.match({ h: ic.semis[x], a: ic.semis[y], hg: null })).join(''))
                + (ic.finals ? `<div class="hint" style="margin:6px 0 2px">${I18n.t('intl.icFinals')}</div>` + ic.finals.map(m => this.match(m)).join('') : `<div class="hint" style="margin:6px 0 2px">${I18n.t('intl.icSeeded', { a: this.nation(ic.seeds[0]), b: this.nation(ic.seeds[1]) })}</div>`)
                + `</div>`;
        }
        return html || `<p class="hint">${I18n.t('intl.koDrawWeek', { w: INTL_CONFIG.ROUND_DRAW_WEEK })}</p>`;
    },

    // ---------------- final tournaments ----------------
    tournament(S) {
        const T = S.tour, C = this.COL;
        let html = `<p class="hint" style="margin-bottom:var(--space-3)">${I18n.t('intl.tourInfo', { n: T.size, hosts: T.hosts.map(id => this.nation(id)).join(', ') || '–' })}</p>`;
        if (T.winner) html += `<div class="result ok" style="text-align:center;margin-bottom:var(--space-3)">🏆 ${I18n.t('intl.winnerLine', { comp: this.tourName(S), nation: this.nation(T.winner) })}</div>`;
        html += this.bracket(T);
        const thirdsIn = new Set(T.thirds || []), nThirds = T.size === 48 ? 8 : T.size === 24 ? 4 : 0;
        const zone = (r, pos) => pos <= 2 ? C.green : (pos === 3 && nThirds) ? (thirdsIn.size ? (thirdsIn.has(r.id) ? C.green : '') : C.light) : '';
        const hostTag = id => T.hosts.includes(id) ? ` <span class="pill" style="padding:0 5px;font-size:10px">H</span>` : '';
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('intl.groupStage')} <span class="muted" style="font-weight:400">· ${I18n.t('leagues.wkShort')} 49–51</span></div>`;
        html += T.groups.map(g => `<div class="section-label">${I18n.t('intl.groupX', { x: g.id })}</div>${this.groupTable(g, 'rr', zone, hostTag)}${this.groupFixtures(g)}`).join('');
        if (nThirds) {
            const rows = Internationals.crossRank(T.groups.map(g => Object.assign({ g: g.id }, Internationals.standings(g, 'rr')[2])));
            html += `<div class="section-label">${I18n.t('intl.bestThirds', { n: nThirds })}</div><div style="overflow-x:auto"><table class="standings"><thead><tr><th>#</th><th>${I18n.t('intl.nation')}</th><th class="num">${I18n.t('intl.grp')}</th><th class="num">GD</th><th class="num">Pts</th></tr></thead><tbody>${rows.map((r, i) =>
                `<tr><td style="${i < nThirds ? `border-left-color:${C.green}` : ''}">${i + 1}</td><td class="club-cell">${this.nation(r.id)}</td><td class="num">${r.g}</td><td class="num">${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="num" style="color:var(--text)">${r.Pts}</td></tr>`).join('')}</tbody></table></div>`;
        }
        return html + this.legend([[C.green, I18n.t('intl.zone.through')], ['', I18n.t('intl.zone.host')]]);
    },
    // The knockout tree, left to right. Rounds are put in TREE order (the two matches feeding a tie
    // sit next to each other), which for the World Cup / EURO 2028 is not the order they are stored in.
    bracket(T) {
        const K = T.ko;
        const first = T.size === 48 ? 'r32' : 'r16';
        if (!K[first]) return `<p class="hint">${I18n.t('intl.bracketAfterGroups')}</p>`;
        let order;
        if (T.size === 48) {
            const r16Src = [[0, 15], [1, 14], [2, 10], [3, 8], [4, 13], [5, 12], [6, 11], [7, 9]];
            const r16Order = [0, 2, 1, 3, 4, 6, 5, 7];
            order = { r32: r16Order.reduce((a, i) => a.concat(r16Src[i]), []), r16: r16Order };
        } else if (T.size === 24) order = { r16: [2, 0, 4, 5, 3, 1, 6, 7] };
        else order = { r16: [0, 1, 2, 3, 4, 5, 6, 7] };
        const cols = [];
        const pick = (arr, ord, n) => (ord || Array.from({ length: n }, (_, i) => i)).map(i => arr ? arr[i] : null);
        if (T.size === 48) cols.push([I18n.t('intl.r32'), pick(K.r32, order.r32, 16)]);
        cols.push([I18n.t('leagues.r16Tab'), pick(K.r16, order.r16, 8)]);
        cols.push([I18n.t('leagues.qfTab'), pick(K.qf, null, 4)]);
        cols.push([I18n.t('leagues.sfTab'), pick(K.sf, null, 2)]);
        cols.push([I18n.t('leagues.final'), [K.final || null]]);
        const side = (id, f, win) => `<div style="padding:5px 8px;font-size:var(--fs-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;justify-content:space-between;gap:8px;${win ? 'font-weight:var(--weight-semibold);color:#16A34A' : (id ? '' : 'color:var(--text-secondary)')}"><span>${id ? this.nation(id) : '–'}</span><span>${f && f.hg != null ? (id === f.h ? f.hg : f.ag) : ''}</span></div>`;
        const box = f => {
            const w = f ? Internationals.winnerOf(f) : null;
            const tag = f && f.pens ? `<div class="muted" style="font-size:10px;text-align:center">${I18n.t('leagues.pens')} ${f.pens.h}–${f.pens.a}</div>` : '';
            return `<div style="border:1px solid rgba(128,128,128,.28);border-radius:8px;overflow:hidden;background:rgba(128,128,128,.06)">${side(f && f.h, f, w && f && w === f.h)}<div style="border-top:1px solid rgba(128,128,128,.28)"></div>${side(f && f.a, f, w && f && w === f.a)}${tag}</div>`;
        };
        const tall = T.size === 48 ? 900 : 470;
        const col = ([title, list]) => `<div style="display:flex;flex-direction:column;min-width:160px;flex:none"><div style="font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:var(--tracking-caps);color:var(--text-secondary);text-align:center;margin-bottom:8px">${title}</div><div style="display:flex;flex-direction:column;justify-content:space-around;gap:8px;flex:1;min-height:${tall}px">${list.map(box).join('')}</div></div>`;
        const third = K.third ? `<div class="section-label" style="margin-top:var(--space-3)">${I18n.t('intl.third')}</div><div class="fcard">${this.match(K.third)}</div>` : '';
        return `<div class="section-label">${I18n.t('leagues.bracketTab')}</div><div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><div style="display:flex;gap:12px;min-width:max-content;padding:2px 2px 6px">${cols.map(col).join('')}</div></div>${third}`;
    },

    // ---------------- calendar, hosts, roll of honour ----------------
    info() {
        const C = INTL_CONFIG, I = GameState.intl, y = GameState.seasonStartYear;
        const type = (typeof Internationals !== 'undefined') ? Internationals.seasonType(y) : null;
        const nl = type === 'NATIONS_LEAGUE';
        const rows = [
            [C.DRAW_WEEK, I18n.t('intl.cal.draw')],
            ['11–12', I18n.t('intl.cal.w1')], ['17–18', I18n.t('intl.cal.w2')],
            [C.ROUND_DRAW_WEEK, I18n.t(nl ? 'intl.cal.nlDraw' : 'intl.cal.poDraw')],
            ['36–37', I18n.t(nl ? 'intl.cal.w3nl' : 'intl.cal.w3q')],
            [C.FINALS_DRAW_WEEK, I18n.t(nl ? 'intl.cal.finalsDraw' : 'intl.cal.tourDraw')],
            [nl ? C.NL_FINALS_WEEK : '49–2', I18n.t(nl ? 'intl.cal.nlFinals' : 'intl.cal.tournament')],
        ];
        let html = `<div class="section-label">${I18n.t('intl.calendar')} <span class="muted" style="font-weight:400">· ${GameState.seasonLabel()}</span></div>
            <div class="fcard">${rows.map(([w, t]) => `<div class="frow"><span class="frow__k">${I18n.t('leagues.wkShort')} ${w}</span><span class="frow__v" style="text-align:right">${t}</span></div>`).join('')}</div>`;
        const ups = (I && typeof Internationals !== 'undefined') ? Internationals.upcomingHosts() : [];
        if (ups.length) html += `<div class="section-label">${I18n.t('intl.hosts')}</div><div class="fcard">${ups.map(u => `<div class="frow"><span class="frow__k">${compName(u.key.startsWith('WC') ? 'INTL_WC' : 'INTL_EURO')} ${u.year}</span><span class="frow__v" style="text-align:right">${u.hosts.map(id => this.nation(id)).join(', ')}</span></div>`).join('')}</div>`;
        const H = I ? I.honours : { NL: [], EURO: [], WC: [] };
        const fin = r => r.final ? `<span class="muted" style="font-size:var(--fs-xs)">${this.nation(r.final.h)} ${this.score(r.final)} ${this.nation(r.final.a)}</span>` : '';
        const list = (title, arr, label) => `<div class="section-label">${title}</div><div class="fcard">${arr.length ? arr.slice().reverse().map(r =>
            `<div class="frow" style="flex-wrap:wrap;gap:4px"><span class="frow__k">${label(r)}</span><span class="frow__v" style="text-align:right">🏆 ${this.nation(r.winner)}<br>${fin(r)}</span></div>`).join('') : `<p class="muted" style="padding:10px 12px;margin:0">${I18n.t('intl.noWinners')}</p>`}</div>`;
        html += list(compName('INTL_WC'), H.WC, r => r.year);
        html += list(compName('INTL_EURO'), H.EURO, r => r.year);
        html += list(compName('INTL_NL'), H.NL, r => GameState.seasonLabelFor(r.season));
        return html;
    },
};
if (typeof window !== 'undefined') window.IntlScreen = IntlScreen;
