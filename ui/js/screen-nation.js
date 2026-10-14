// ============================================================
//  A national team (js/intl-callups.js): overview (reputation, skill level, the call-up bands,
//  titles with the real ones from before 2026, best-ever finishes, past tournaments, your clients
//  at it) and its matches of the last 104 weeks. Read-only.
// ============================================================
const NationScreen = {
    state: { tab: 'overview', mode: 'season', sort: 'apps' },
    // honours key -> competition (titles)
    TITLES: [['WC', 'INTL_WC'], ['EURO', 'INTL_EURO'], ['NL', 'INTL_NL'], ['COPA', 'INTL_COPA'], ['FINALISSIMA', 'INTL_FINALISSIMA'],
        ['GOLD', 'INTL_GOLD'], ['CNL_A', 'INTL_CNL'], ['AFCON', 'INTL_AFCON'], ['ANL', 'INTL_ANL'], ['AC', 'INTL_AC'], ['AFCNL', 'INTL_AFCNL'], ['ONC', 'INTL_ONC']],
    stageName(code) { return I18n.t('intl.stage.' + code); },
    // titles per competition: [{ comp, n, years }] (real ones before 2026 + the game's)
    titles(nid) {
        const I = GameState.intl, H = (I && I.honours) || {};
        const yearOf = r => r.year != null ? r.year : r.season;
        return this.TITLES.map(([key, comp]) => {
            const all = (typeof intlHistoryHonours === 'function' ? intlHistoryHonours(key) : []).concat(H[key] || []).filter(r => r.winner === nid);
            return { comp, n: all.length, years: all.map(yearOf).sort((a, b) => b - a), season: key === 'NL' || key === 'CNL_A' || key === 'AFCNL' };
        }).filter(t => t.n);
    },
    // best finish per competition: real titles / finals count, then the game's finishes
    bestEver(nid) {
        const order = Internationals.FINISH_ORDER, best = {};
        const take = (comp, stage, year) => {
            const b = best[comp];
            if (!b || order.indexOf(stage) < order.indexOf(b.stage)) best[comp] = { comp, stage, years: [year] };
            else if (b.stage === stage && !b.years.includes(year)) b.years.push(year);
        };
        if (typeof INTL_HISTORY !== 'undefined') this.TITLES.forEach(([key, comp]) => (INTL_HISTORY[key] || []).forEach(([y, w, r]) => {
            if (w === nid) take(comp, 'W', y); else if (r === nid) take(comp, 'F', y);
        }));
        Internationals.nationFinishes(nid).forEach(f => take(f.comp, f.stage, f.year));
        Object.values(best).forEach(b => b.years.sort((x, y) => y - x));
        return this.TITLES.map(t => best[t[1]]).filter(Boolean);
    },
    render(el, nid) {
        const n = NATIONS_BY_ID[nid];
        if (!n) { el.innerHTML = `<div class="empty">${I18n.t('nat.unknown')}</div>`; return; }
        if (Router.isFreshNav) this.state.tab = 'overview';
        const tab = this.state.tab;
        const y = GameState.seasonStartYear, rep = Internationals.repAt(nid, y);
        const head = `<div class="flex-row" style="margin-bottom:var(--space-4);gap:10px">${UI.flag(n.name)}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${UI.esc(n.name)}</span></div>
            <p class="hint" style="margin-top:-8px">${IntlScreen.confName(n.confederation)} · ${I18n.t('common.reputation')} ${Math.round(rep)}${Math.round(rep) !== n.reputation ? ` <span class="muted">(${n.reputation})</span>` : ''}${n.fifaMember === false ? ' · ' + I18n.t('nat.nonFifa') : ''}</p>`;
        const tabs = `<div class="tab-bar" style="margin:var(--space-3) 0 var(--space-4)">${[['overview', I18n.t('nat.tab.overview')], ['matches', I18n.t('nat.tab.matches')]].map(([k, l]) => `<button class="tab ${tab === k ? 'is-active' : ''}" onclick="NationScreen.setTab('${nid}','${k}')">${l}</button>`).join('')}</div>`;
        el.innerHTML = head + tabs + (tab === 'matches' ? this.matchesHTML(nid) : this.overviewHTML(nid));
    },
    overviewHTML(nid) {
        let html = '';
        // titles (each one links to its competition)
        const T = this.titles(nid);
        html += `<div class="section-label">${I18n.t('nat.titles')}</div>` + (T.length
            ? `<div class="chip-row" style="margin:var(--space-2) 0 var(--space-3)">${T.map(t => trophyLink(t.comp, `<span class="pill pill--gold"><i class="ti ti-trophy" style="font-size:13px"></i>${compName(t.comp)}${t.n > 1 ? ' ×' + t.n : ''}</span>`)).join('')}</div>`
            : `<p class="muted">${I18n.t('nat.noTitles')}</p>`);
        // best ever
        const best = this.bestEver(nid);
        if (best.length) html += `<div class="section-label">${I18n.t('nat.bestEver')}</div><div class="fcard" style="margin-top:var(--space-2)">${best.map(b =>
            `<div class="frow"><span class="frow__k">${trophyLink(b.comp, compName(b.comp))}</span><span class="frow__v"${b.stage === 'W' ? ' style="color:var(--gold)"' : ''}>${this.stageName(b.stage)}${b.years.length > 1 ? ' ×' + b.years.length : ''} <span class="muted">· ${b.years.slice(0, 3).join(', ')}${b.years.length > 3 ? ' …' : ''}</span></span></div>`).join('')}</div>`;
        // past performances: every tournament, and every Nations League edition with its league and position
        const past = this.pastPerformances(nid);
        html += `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('nat.past')}</div>` + (past.length
            ? `<div class="fcard" style="margin-top:var(--space-2);max-height:300px;overflow-y:auto">${past.map(r => `<div class="frow"><span class="frow__k">${trophyLink(r.comp, compName(r.comp))} ${r.label}</span><span class="frow__v"${r.won ? ' style="color:var(--gold)"' : ''}>${r.won ? '🏆 ' : ''}${r.text}</span></div>`).join('')}</div>`
            : `<p class="muted">${I18n.t('nat.noPast')}</p>`);
        return html + this.clientsHTML(nid);
    },
    NL_COMPS: { INTL_NL: 1, INTL_CNL: 1, INTL_AFCNL: 1 },
    // newest first: { comp, label (year or season), text, won, key (season start, for sorting) }
    pastPerformances(nid) {
        const out = {}, seasonal = c => !!this.NL_COMPS[c];
        Internationals.nationFinishes(nid).forEach(f => {
            const key = seasonal(f.comp) ? f.year : f.year - 1;
            out[f.comp + ':' + key] = { comp: f.comp, key, label: seasonal(f.comp) ? GameState.seasonLabelFor(f.year) : String(f.year), stage: f.stage };
        });
        (Internationals.nationNlPositions ? Internationals.nationNlPositions(nid) : []).forEach(r => {
            const k = r.comp + ':' + r.season, e = out[k] || (out[k] = { comp: r.comp, key: r.season, label: GameState.seasonLabelFor(r.season) });
            e.tier = r.comp === 'INTL_AFCNL' ? I18n.t('intl.divX', { n: r.tier }) : I18n.t('intl.leagueX', { x: r.tier });
            e.pos = r.pos;
        });
        return Object.values(out).sort((a, b) => b.key - a.key).map(e => {
            const bits = [];
            if (e.tier) bits.push(e.tier + ' · ' + (e.pos ? UI.ordinal(e.pos) : I18n.t('nat.seeded')));
            if (e.stage && (!e.tier || ['W', 'F', 'SF'].includes(e.stage))) bits.push(this.stageName(e.stage));
            return { comp: e.comp, label: e.label, text: bits.join(' · '), won: e.stage === 'W', key: e.key };
        });
    },
    // your clients at this national team: this season or all time, like a club page
    clientsHTML(nid) {
        const mode = this.state.mode, y = GameState.seasonStartYear, season = GameState.week <= 2 ? y - 1 : y;
        const sum = (p, yrs) => { const t = blankComp(); yrs.forEach(yy => Object.values((p.intlStats || {})[yy] || {}).forEach(c => addComp(t, c))); t.avg = t.apps ? t.ratingSum / t.apps : 0; return t; };
        const rows = [];
        GameState.players.forEach(p => {
            const now = p.agentId === 'me' && Internationals.withSquadNow(p) && Internationals.callupOf(p), nowHere = !!(now && now.nation === nid);
            if (p.intlNation !== nid && !nowHere) return;
            const agg = mode === 'season' ? sum(p, [season]) : sum(p, Object.keys(p.intlStats || {}));
            if (!agg.apps && !nowHere) return;
            rows.push({ p, agg, role: nowHere });
        });
        const S = { apps: (a, b) => b.agg.apps - a.agg.apps, goals: (a, b) => b.agg.goals - a.agg.goals, assists: (a, b) => b.agg.assists - a.agg.assists, avg: (a, b) => b.agg.avg - a.agg.avg };
        rows.sort((a, b) => (!!b.role - !!a.role) || (S[this.state.sort] || S.apps)(a, b));
        const list = rows.length ? rows.map(d => `<a href="${Router.link('client', d.p.id)}" class="frow" style="cursor:pointer;${d.role ? 'background:var(--accent-fill);border-radius:var(--radius-sm)' : ''}">
            <span class="frow__k">${UI.esc(d.p.name)}${d.role ? ` <span class="pill pill--accent" style="padding:1px 6px;font-size:10px">${I18n.t('nat.withSquad')}</span>` : ''}${d.p.retired ? ` <span class="pill" style="padding:1px 6px;font-size:10px">${I18n.t('club.retired')}</span>` : ''}</span>
            <span class="frow__v">${d.agg.apps} ${I18n.t('common.appsShort')} · ${d.agg.goals}${I18n.t('common.goalsShort')} · ${d.agg.assists}${I18n.t('common.assistsShort')} · ${UI.ratingText(d.agg.avg)}</span></a>`).join('')
            : `<p class="muted">${mode === 'season' ? I18n.t('nat.noneSeason') : I18n.t('nat.noneAll')}</p>`;
        const nid2 = UI.esc(nid);
        return `<div class="section-label" style="margin-top:var(--space-4)">${I18n.t('club.yourClients')}</div>
            <div class="chip-row" style="margin:var(--space-2) 0 var(--space-3)">
                <button class="htog ${mode === 'season' ? 'is-on' : ''}" onclick="NationScreen.setMode('${nid2}','season')">${I18n.t('club.currentSeason')}</button>
                <button class="htog ${mode === 'all' ? 'is-on' : ''}" onclick="NationScreen.setMode('${nid2}','all')">${I18n.t('club.allTime')}</button></div>
            <div class="chip-row" style="margin:0 0 var(--space-3)">${['apps', 'goals', 'assists', 'avg'].map(k => `<button class="htog ${this.state.sort === k ? 'is-on' : ''}" onclick="NationScreen.setSort('${nid2}','${k}')">${I18n.t({ apps: 'club.apps', goals: 'club.goals', assists: 'club.assists', avg: 'club.rating' }[k])}</button>`).join('')}</div>
            <div class="fcard">${list}</div>`;
    },
    // the fixtures already set (soonest first), then the last 104 weeks (newest first). A match a
    // client played in is marked, and opens what your clients did in it.
    matchesHTML(nid) {
        const up = Internationals.nationSchedule ? Internationals.nationSchedule(nid) : [];
        const list = Internationals.nationResults(nid);
        if (!list.length && !up.length) return `<p class="muted">${I18n.t('nat.noMatches')}</p>`;
        const meta = r => `<span class="muted" style="font-size:var(--fs-xs)">${GameState.seasonLabelFor(r.season)} · ${I18n.t('leagues.wkShort')} ${r.week} · ${(COMPETITIONS[r.comp] || {}).short || compName(r.comp)} · ${I18n.t('nat.venue.' + r.venue)}</span>`;
        let html = '';
        if (up.length) html += `<div class="section-label">${I18n.t('nat.upcoming')}</div><div class="fcard">${up.map(r => `<div class="frow" style="gap:8px"><span class="frow__k" style="min-width:0">${meta(r)}<br>${IntlScreen.nation(r.opp)}</span><span class="frow__v muted" style="white-space:nowrap">${I18n.t('leagues.toCome')}</span></div>`).join('')}</div>`;
        let lastSeason = null;
        list.forEach(r => {
            if (r.season !== lastSeason) { html += `${lastSeason == null ? '' : '</div>'}<div class="section-label" style="margin-top:var(--space-3)">${GameState.seasonLabelFor(r.season)}</div><div class="fcard">`; lastSeason = r.season; }
            const res = r.gf > r.ga ? 'W' : r.gf < r.ga ? 'L' : (r.tag && r.tag[0] === 'p' ? (+r.tag.slice(1).split('-')[0] > +r.tag.split('-')[1] ? 'W' : 'L') : 'D');
            const col = res === 'W' ? 'var(--success, #16A34A)' : res === 'L' ? 'var(--danger)' : 'var(--text-secondary)';
            const tag = r.tag ? (r.tag[0] === 'p' ? ` <span class="muted" style="font-size:var(--fs-xs)">(${I18n.t('leagues.pens')} ${r.tag.slice(1).replace('-', '–')})</span>` : ` <span class="muted" style="font-size:var(--fs-xs)">(${I18n.t('leagues.etTag')})</span>`) : '';
            const cl = r.clients && r.clients.length;
            const who = cl ? `<div style="font-size:var(--fs-xs);color:var(--info-text);margin-top:2px"><i class="ti ti-shirt" style="font-size:12px"></i> ${r.clients.map(c => UI.esc((GameState.getPlayer(c.id) || {}).name || '')).join(', ')}</div>` : '';
            const open = cl ? ` onclick="NationScreen.openMatch('${UI.esc(nid)}',${r.L},'${UI.esc(r.opp)}')" style="gap:8px;cursor:pointer"` : ' style="gap:8px"';
            html += `<div class="frow"${open}><span class="frow__k" style="min-width:0">${meta(r)}<br>${IntlScreen.nation(r.opp)}${who}</span>
                <span class="frow__v" style="color:${col};font-weight:var(--weight-semibold);white-space:nowrap">${r.gf}–${r.ga}${tag}${cl ? ' <i class="ti ti-chevron-right" style="color:var(--text-chevron)"></i>' : ''}</span></div>`;
        });
        if (list.length) html += '</div>';
        return html + `<p class="hint">${I18n.t('nat.matchesHint')}</p>`;
    },
    // what your clients did in one match (a sheet)
    openMatch(nid, L, opp) {
        const r = Internationals.nationResults(nid).find(x => x.L === L && x.opp === opp); if (!r) return;
        const card = c => c.card === 2 ? ' <span class="card-chip card-chip--red"></span>' : c.card === 1 ? ' <span class="card-chip card-chip--yellow"></span>' : '';
        const rows = r.clients.map(c => {
            const p = GameState.getPlayer(c.id); if (!p) return '';
            const gk = p.position === 'GK';
            return `<a href="${Router.link('client', p.id)}" class="frow" style="cursor:pointer" onclick="Router.closeSheet && Router.closeSheet()"><span class="frow__k">${UI.esc(p.name)} <span class="muted" style="font-size:var(--fs-xs)">${p.position} · ${c.full ? I18n.t('nat.started') : I18n.t('nat.sub')}</span></span>
                <span class="frow__v">${gk ? (r.ga === 0 ? I18n.t('nat.cleanSheet') + ' · ' : '') : c.g + ' ' + I18n.t('common.goalsShort') + ' · '}${c.a} ${I18n.t('common.assistsShort')} · ${UI.ratingText(c.rating)}${card(c)}</span></a>`;
        }).join('');
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${IntlScreen.nation(nid)} ${r.gf}–${r.ga} ${IntlScreen.nation(opp)}</div>
            <p class="hint" style="margin:0 0 var(--space-3)">${compName(r.comp)} · ${GameState.seasonLabelFor(r.season)} · ${I18n.t('leagues.wkShort')} ${r.week}</p>
            <div class="section-label">${I18n.t('nat.yourClientsGame')}</div><div class="fcard">${rows}</div>`);
    },
    setTab(nid, t) { this.state.tab = t; Router.refresh(); },
    setMode(nid, m) { this.state.mode = m; Router.refresh(); },
    setSort(nid, k) { this.state.sort = k; Router.refresh(); },

    // ---------------- a client's international career (player card, History tab) ----------------
    // rows open and close like the club history (closed by default)
    playerHistoryHTML(p) {
        const years = Object.keys(p.intlStats || {}).map(Number).sort((a, b) => b - a);
        const gk = p.position === 'GK', ex = ClientDetail.ctx(p.id).expanded;
        const line = t => `${t.apps} ${I18n.t('common.appsShort')} · ${gk ? (t.cs || 0) + ' ' + I18n.t('common.csShort') : t.goals + ' ' + I18n.t('common.goalsShort')} · ${t.assists} ${I18n.t('common.assistsShort')}`;
        const nat = p.intlNation ? IntlScreen.nation(p.intlNation) : '';
        const now = Internationals.withSquadNow(p) && Internationals.callupOf(p);
        let html = now ? `<div class="result ok" style="margin-bottom:var(--space-3)">${I18n.t('nat.withSquadOf', { nation: Internationals.name(now.nation) })}</div>` : '';
        const tr = {}; (p.intlTrophies || []).forEach(t => { tr[t.comp] = (tr[t.comp] || 0) + 1; });
        if (Object.keys(tr).length) html += `<div class="chip-row" style="margin-bottom:var(--space-3)">${Object.entries(tr).map(([c, n]) => trophyLink(c, `<span class="pill pill--gold"><i class="ti ti-trophy" style="font-size:12px"></i>${compName(c)}${n > 1 ? ' ×' + n : ''}</span>`)).join('')}</div>`;
        if (!years.length) return html + `<p class="muted">${I18n.t('nat.noCaps')}</p>`;
        const career = blankComp(), byComp = {};
        const row = (key, top, body) => {
            const open = !!ex[key];
            return `<div class="season-row ${open ? 'is-open' : ''}" onclick="ClientDetail.toggleSeason('${p.id}','${key}')"><div class="season-top">${top}<i class="ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}" style="margin-left:6px"></i></div>${open ? `<div class="season-body">${body}</div>` : ''}</div>`;
        };
        html += `<div class="fcard hist-list">` + years.map(y => {
            const t = blankComp();
            Object.entries(p.intlStats[y]).forEach(([cid, c]) => { addComp(t, c); addComp(career, c); byComp[cid] = addComp(byComp[cid] || blankComp(), c); });
            t.avg = t.apps ? t.ratingSum / t.apps : 0;
            const won = (p.intlTrophies || []).filter(x => x.season != null ? x.season === y : x.year === y + 1);
            const comps = Object.entries(p.intlStats[y]).map(([cid, c]) => `<div class="comp-row"><span>${compName(cid)}</span><span>${line(c)}</span></div>`).join('')
                + (won.length ? `<div class="comp-row" style="color:var(--gold)">${won.map(x => trophyLink(x.comp, '🏆 ' + compName(x.comp))).join(' · ')}</div>` : '');
            return row('i:' + y, `<div><span class="season-name">${nat}</span><div class="season-club">${GameState.seasonLabelFor(y)}${won.length ? ' <span class="hist-sym">🏆</span>' : ''}</div></div><span class="season-stat">${line(t)} · ${UI.ratingText(t.avg)}</span>`, `<div class="stint-comps">${comps}</div>`);
        }).join('');
        career.avg = career.apps ? career.ratingSum / career.apps : 0;
        html += row('i:career', `<span class="season-name">${I18n.t('cd.careerTotal')}</span><span class="season-stat">${line(career)} · ${UI.ratingText(career.avg)}</span>`,
            Object.entries(byComp).sort((a, b) => b[1].apps - a[1].apps).map(([cid, c]) => `<div class="comp-row"><span>${compName(cid)}</span><span>${line(c)}</span></div>`).join('')) + `</div>`;
        return html;
    },
    // total caps etc. of a client (records)
    intlTotal(p) { const t = blankComp(); Object.values(p.intlStats || {}).forEach(s => Object.values(s).forEach(c => addComp(t, c))); return t; },
};
Router.register('nation', { isMain: false, parent: 'leagues', title: p => (NATIONS_BY_ID[p[0]] || {}).name || I18n.t('nat.title'), render(el, params) { NationScreen.render(el, params[0]); } });
if (typeof window !== 'undefined') window.NationScreen = NationScreen;
