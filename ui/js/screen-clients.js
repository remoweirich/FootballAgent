// ============================================================
//  Clients — sortable/filterable list of represented players,
//  plus the Client History screen (every past & present client).
// ============================================================
const ClientsScreen = {
    state: { filter: 'all', sort: 'ability', dir: 'desc' },
    SORTS: [['ability', 'Ability'], ['age', 'Age'], ['apps', 'Appearances'], ['avg', 'Avg rating'], ['contract', 'Contract left'], ['morale', 'Morale'], ['wage', 'Wage'], ['repterm', 'Rep. term left']],

    rows() {
        const year = GameState.seasonStartYear;
        return Agency.clients().map(p => {
            const club = Clubs.getClubById(p.clubId);
            const tot = seasonTotals(p, year);
            const hasOffer = GameState.inbox.some(m => m.offer && m.offer.playerId === p.id && ['transfer', 'loan', 'renewal'].includes(m.kind));
            const hasSponsor = GameState.inbox.some(m => m.kind === 'sponsor' && m.offer && m.offer.playerId === p.id);
            // expired reps sort as the most urgent (lowest) value - the deal has already run out
            const repLeft = p.repExpired ? -1 : (p.repUntilSeason != null ? p.repUntilSeason - GameState.seasonStartYear : 0);
            const mor = (typeof moraleAvg === 'function' && p.morale) ? moraleAvg(p) : 0;
            const listed = !!(p.transferListed || p.loanListed);
            return { p, club, tot, hasOffer, hasSponsor, listed, contractLeft: Agency.contractSeasonsLeft(p), repLeft, mor };
        });
    },
    filtered() {
        const rows = this.rows(), f = this.state.filter;
        if (f === 'offers') return rows.filter(r => r.hasOffer);
        if (f === 'sponsors') return rows.filter(r => r.hasSponsor);
        if (f === 'injury') return rows.filter(r => r.p.injury);
        if (f === 'listed') return rows.filter(r => r.listed);
        return rows;
    },
    sorted() {
        const rows = this.filtered(), key = this.state.sort, dir = this.state.dir === 'asc' ? 1 : -1;
        const val = r => ({ ability: r.p.ability, age: r.p.age, apps: r.tot.apps, avg: r.tot.avg, contract: r.contractLeft, wage: r.p.wage, repterm: r.repLeft, morale: r.mor })[key];
        return rows.sort((a, b) => (val(a) - val(b)) * dir);
    },

    render(el) {
        const rows = this.sorted(), all = this.rows();
        const counts = {
            all: all.length, offers: all.filter(r => r.hasOffer).length,
            sponsors: all.filter(r => r.hasSponsor).length, injury: all.filter(r => r.p.injury).length,
            listed: all.filter(r => r.listed).length
        };
        const chip = (id, icon, label) => `<button class="cl-chip ${this.state.filter === id ? 'cl-on' : ''}" onclick="ClientsScreen.setFilter('${id}')"><i class="ti ${icon}" style="font-size:13px"></i>${label} <span class="cl-ct">${counts[id]}</span></button>`;

        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <a class="gbtn" href="#clienthist"><i class="ti ti-history"></i>History</a>
            <button class="gbtn" onclick="ClientsScreen.pickSort()"><i class="ti ti-arrows-sort"></i>${this.SORTS.find(s => s[0] === this.state.sort)[1]}<i class="ti ti-chevron-down" style="color:var(--text-faint)"></i></button>
        </div>
        <div class="chip-row" style="margin-bottom:var(--space-4)">
            ${chip('all', 'ti-users', 'All')}${chip('offers', 'ti-currency-euro', 'Offers')}${chip('sponsors', 'ti-tag', 'Sponsors')}${chip('injury', 'ti-bandage', 'Injury')}${chip('listed', 'ti-list-check', 'Listed')}
        </div>
        ${rows.length ? rows.map(r => this.card(r)).join('') : (all.length
            ? `<div class="empty"><div class="empty__icon"><i class="ti ti-filter-off"></i></div><div class="empty__title">No matches</div><div class="empty__hint">No clients match this filter.</div></div>`
            : `<div class="empty"><div class="empty__icon"><i class="ti ti-zoom-scan"></i></div><div class="empty__title">No clients yet</div><div class="empty__hint">Visit Scouting to find your first talent.</div><a class="btn btn--accent-outline btn--sm empty__cta" href="#scouting"><i class="ti ti-zoom-scan"></i>Open Scouting</a></div>`)}
        `;
    },
    card(r) {
        const p = r.p, club = r.club;
        const info = p.clubId ? UI.currentClubInfo(p) : null;
        const teamHTML = info ? (info.tag ? `<span style="color:var(--info-text)">${info.name} (${info.tag})</span>` : info.name) : 'Free agent';
        return `<a href="#client/${p.id}" class="cl-card">
            <div class="flex-row">
                <div style="flex:1;min-width:0">
                    <div class="flex-row" style="gap:6px">
                        <span class="cl-name">${UI.flag(p.nationality)} ${p.name}</span>
                        <span style="font-size:12px;color:var(--text-faint)">${p.age}y</span>
                        ${r.hasOffer ? '<i class="ti ti-currency-euro" style="font-size:14px;color:var(--accent)"></i>' : ''}
                        ${p.injury ? '<i class="ti ti-bandage" style="font-size:14px;color:var(--danger)"></i>' : ''}
                        ${p.retiringThisSeason ? '<span class="pill pill--gold" style="padding:1px 7px;font-size:10px">Retiring</span>' : ''}
                    </div>
                    <div class="cl-sub"><span class="flex-row" style="gap:5px">${UI.crest(info ? info.club : club)}${teamHTML}</span><span style="color:var(--text-chevron)">·</span><span>${roleLabel(p.squadRole, p.age)}</span></div>
                </div>
                <div class="flex-row" style="gap:3px;margin-right:9px">${this.moraleDots(p)}</div>
                ${UI.abilityBadge(p.ability)}
            </div>
            <div class="cl-stats">
                <div class="cl-st"><b>${r.tot.apps}</b><span>apps</span></div>
                <div class="cl-st"><b style="color:var(${UI.ratingVar(r.tot.avg)})">${r.tot.avg ? r.tot.avg.toFixed(1) : '—'}</b><span>rating</span></div>
                ${this.state.sort === 'repterm'
                ? `<div class="cl-st"><b style="${p.repExpired ? 'color:var(--danger)' : ''}">${p.repExpired ? 'Expired' : r.repLeft <= 0 ? 'Final yr' : r.repLeft + 1 + 'y'}</b><span>rep. left</span></div>`
                : `<div class="cl-st"><b>${p.retiringThisSeason ? 'Retiring' : Agency.isFreeAgent(p) ? 'Free' : r.contractLeft <= 0 ? 'Final yr' : r.contractLeft + 1 + 'y'}</b><span>contract</span></div>`}
                <div class="cl-st"><b>${Agency.isFreeAgent(p) ? '—' : '€' + (p.wage / 1000).toFixed(p.wage >= 10000 ? 0 : 1) + 'k'}</b><span>wage</span></div>
            </div>
        </a>`;
    },
    moraleDots(p) {
        const m = p.morale || {};
        return ['club', 'time', 'wage', 'agent'].map(k => `<span class="cl-md" style="background:var(${UI.moraleVar(m[k] || 0)})"></span>`).join('');
    },
    setFilter(f) { this.state.filter = f; Router.refresh(); },
    // Selecting an attribute applies it immediately (and re-sorts the list live, right
    // underneath) but leaves the sheet open — you often want to flip direction or try
    // another attribute right after, and having to re-open the picker for that was
    // annoying. Closing is a separate, deliberate step (tap "Done" or the backdrop).
    pickSort() {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Sort clients</div>
            <div id="sortPickerBody">${this.sortPickerRows()}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">Done</button>`);
    },
    sortPickerRows() {
        return this.SORTS.map(([id, label]) => `<button class="list-row" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="ClientsScreen.setSort('${id}')"><span style="flex:1;color:var(--text)">${label}</span>${this.state.sort === id ? `<i class="ti ${this.state.dir === 'asc' ? 'ti-sort-ascending' : 'ti-sort-descending'}" style="color:var(--accent)"></i>` : ''}</button>`).join('');
    },
    setSort(id) {
        if (this.state.sort === id) this.state.dir = this.state.dir === 'asc' ? 'desc' : 'asc';
        else { this.state.sort = id; this.state.dir = 'desc'; }
        const body = document.getElementById('sortPickerBody'); if (body) body.innerHTML = this.sortPickerRows();
        const screenBody = document.getElementById('screenBody'); if (screenBody) this.render(screenBody);
    }
};
Router.register('clients', { isMain: true, title: 'Clients', render(el) { ClientsScreen.render(el); } });

// ---------------- Client History ----------------
const ClientHistory = {
    state: { pos: 'all', sort: 'apps', dir: 'desc' },
    POSGROUP: { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', LW: 'ATT', RW: 'ATT', ST: 'ATT' },
    SORTS: [['apps', 'Games'], ['goals', 'Goals'], ['assists', 'Assists'], ['avg', 'Avg rating'], ['seasons', 'Seasons'], ['titles', 'Titles'], ['yellow', 'Yellow cards'], ['red', 'Red cards']],
    rows() {
        return GameState.players.filter(p => p.everClient).map(p => {
            const c = careerLeagueTotal(p);
            return {
                p, grp: this.POSGROUP[p.position] || 'MID', apps: c.apps, goals: c.goals, cs: c.cs || 0, assists: c.assists,
                yellow: c.yellow, red: c.red, titles: (p.trophies || []).length,
                avg: c.avg, seasons: seasonsActiveLeague(p),
                status: p.archived ? (p.retired ? 'Retired' : 'Archived') : (p.agentId === 'me' ? 'Active' : 'Ex-client')
            };
        }).filter(r => this.state.pos === 'all' || r.grp === this.state.pos);
    },
    sorted() {
        const dir = this.state.dir === 'asc' ? 1 : -1;
        return this.rows().sort((a, b) => (a[this.state.sort] - b[this.state.sort]) * dir);
    },
    render(el) {
        const rows = this.sorted();
        const posBtns = [['all', 'All'], ['GK', 'GK'], ['DEF', 'DEF'], ['MID', 'MID'], ['ATT', 'ATT']]
            .map(([id, l]) => `<button class="htog ${this.state.pos === id ? 'is-on' : ''}" onclick="ClientHistory.setPos('${id}')">${l}</button>`).join('');
        el.innerHTML = `<div class="flex-row" style="justify-content:space-between;align-items:center;margin-bottom:var(--space-3);gap:var(--space-2)">
            <p class="hint" style="margin:0">Every player who has been your client — current, released or retired.</p>
            <a class="gbtn" href="#records" style="flex:none"><i class="ti ti-award"></i>Records</a>
        </div>
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4);flex-wrap:wrap;gap:var(--space-2)">
            <div class="chip-row">${posBtns}</div>
            <button class="gbtn" onclick="ClientHistory.pickSort()" style="flex:none"><i class="ti ti-arrows-sort"></i>${this.SORTS.find(s => s[0] === this.state.sort)[1]}<i class="ti ti-chevron-down" style="color:var(--text-faint)"></i></button>
        </div>
        <div id="clientHistBody">${this.rowsHTML(rows)}</div>`;
    },
    rowsHTML(rows) {
        return rows.length ? rows.map(r => this.row(r)).join('') : '<div class="empty"><div class="empty__icon"><i class="ti ti-history"></i></div><div class="empty__title">No history yet</div><div class="empty__hint">Sign players and their careers will be recorded here.</div></div>';
    },
    // normally shows goals+assists; sorting by yellow/red swaps them in instead, since
    // scanning for discipline stats while goals/assists sit there unrelated is noisy
    row(r) {
        const disc = ['yellow', 'red'].includes(this.state.sort);
        const line2 = disc ? `<span class="card-chip card-chip--yellow"></span>${r.yellow} <span class="card-chip card-chip--red"></span>${r.red}` : `${r.p.position === 'GK' ? r.cs + ' cs' : r.goals + ' g'} · ${r.assists} a`;
        return `<a href="#client/${r.p.id}" class="list-row" style="cursor:pointer">
            <div style="flex:1;min-width:0"><div class="row-title">${UI.flag(r.p.nationality)} ${r.p.name}</div><div class="row-sub">${r.p.position} · ${r.seasons} season(s) · <span class="pill" style="padding:1px 7px;font-size:10.5px">${r.status}</span>${r.titles ? ` · <i class="ti ti-trophy" style="font-size:11px;color:var(--gold)"></i> ${r.titles}` : ''}</div></div>
            <div style="text-align:right;font-size:12px;color:var(--text-muted)">${r.apps} apps · ${line2}<br>${UI.ratingText(r.avg)}</div>
        </a>`;
    },
    setPos(id) { this.state.pos = id; Router.refresh(); },
    // same "stays open" picker as ClientsScreen.pickSort() — see the comment there
    pickSort() {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Sort history</div>
            <div id="sortPickerBody">${this.sortPickerRows()}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">Done</button>`);
    },
    sortPickerRows() {
        return this.SORTS.map(([id, label]) => `<button class="list-row" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="ClientHistory.setSort('${id}')"><span style="flex:1;color:var(--text)">${label}</span>${this.state.sort === id ? `<i class="ti ${this.state.dir === 'asc' ? 'ti-sort-ascending' : 'ti-sort-descending'}" style="color:var(--accent)"></i>` : ''}</button>`).join('');
    },
    setSort(id) {
        if (this.state.sort === id) this.state.dir = this.state.dir === 'asc' ? 'desc' : 'asc';
        else { this.state.sort = id; this.state.dir = 'desc'; }
        const body = document.getElementById('sortPickerBody'); if (body) body.innerHTML = this.sortPickerRows();
        const screenBody = document.getElementById('screenBody'); if (screenBody) this.render(screenBody);
    }
};
Router.register('clienthist', { isMain: false, parent: 'clients', title: 'Client History', render(el) { ClientHistory.render(el); } });

// ---------------- Client Records ----------------
// The headline marks set by any of your clients (past or present) — presented as a clean
// leaderboard of single-best records, each linking to the player who holds it.
const ClientRecords = {
    render(el) {
        const players = GameState.players.filter(p => p.everClient);
        if (!players.length) { el.innerHTML = `<div class="empty"><div class="empty__icon"><i class="ti ti-award"></i></div><div class="empty__title">No records yet</div><div class="empty__hint">Sign and develop clients and their record-setting marks appear here.</div></div>`; return; }
        const recs = this.compute(players);
        el.innerHTML = `<p class="hint" style="margin-bottom:var(--space-4)">The best single marks set by any of your clients — past or present. Tap one to open the holder.</p>
            <div style="display:grid;grid-template-columns:1fr;gap:var(--space-2)">${recs.map(r => this.card(r)).join('')}</div>`;
    },
    card(r) {
        return `<a href="${Router.link('client', r.p.id)}" class="fcard" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:11px 14px">
            <div style="min-width:0"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:var(--text-secondary)">${r.label}</div><div style="font-size:13.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.flag(r.p.nationality)} ${r.p.name}${r.sub ? ` <span class="muted">· ${r.sub}</span>` : ''}</div></div>
            <div style="font-size:var(--fs-xl);font-weight:var(--weight-semibold);color:var(--gold);flex:none;margin-left:12px">${r.value}</div></a>`;
    },
    compute(players) {
        const mk = (label, valFn, fmt) => {   // record held by the player with the LARGEST value
            let bp = null, bv = -Infinity, bex = null;
            players.forEach(p => { const r = valFn(p); if (r && r.val > bv) { bv = r.val; bp = p; bex = r.extra || null; } });
            return bp ? { label, p: bp, value: fmt(bv), sub: bex } : null;
        };
        const mkMin = (label, valFn, fmt) => {   // record held by the player with the SMALLEST value (e.g. youngest)
            let bp = null, bv = Infinity, bex = null;
            players.forEach(p => { const r = valFn(p); if (r && r.val < bv) { bv = r.val; bp = p; bex = r.extra || null; } });
            return bp ? { label, p: bp, value: fmt(bv), sub: bex } : null;
        };
        const seasonMax = key => p => { let v = 0, y = null; Object.keys(p.stats || {}).forEach(yy => { const t = seasonTotals(p, +yy); if (t[key] > v) { v = t[key]; y = +yy; } }); return v > 0 ? { val: v, extra: y != null ? GameState.seasonLabelFor(y) : null } : null; };
        const careerKey = key => p => { const t = careerTotal(p); return t[key] > 0 ? { val: t[key] } : null; };
        const moves = (p, type) => { const n = (p.movements || []).filter(m => m.type === type).length; return n > 0 ? { val: n } : null; };
        // a league title in any non-top division is itself a promotion (the champion goes up) — it isn't
        // recorded as a promo "movement" (that would double up with the trophy arrow on the player page),
        // so add those titles to the promotions tally here. Youth-league titles never count (can't go up).
        const isTopDiv = div => { const c = divCountry(div); return !!(COUNTRY_DIVS[c] && COUNTRY_DIVS[c][0] === div); };
        const promoCount = p => (p.movements || []).filter(m => m.type === 'promo').length
            + (p.trophies || []).filter(t => _isLeagueComp(t.compId) && !isYouthComp(t.compId) && !isTopDiv(t.compId)).length;
        // age in a past season (integer years; ages step by season)
        const ageIn = (p, y) => (p.age || 0) - (GameState.seasonStartYear - y);
        const scoringYears = p => Object.keys(p.stats || {}).map(Number).filter(y => seasonTotals(p, y).goals > 0);
        // senior (non-youth, non-reserve) years with real appearances, grouped by club
        const seniorYearsByClub = p => {
            const byClub = {};
            Object.keys(p.stats || {}).forEach(yy => seasonStints(p, +yy).forEach(st => {
                if (st.youth || isReserveClub(st.clubId)) return;
                let apps = 0; Object.values(st.comps).forEach(c => apps += c.apps || 0);
                if (apps > 0) (byClub[st.clubId] = byClub[st.clubId] || new Set()).add(+yy);
            }));
            return byClub;
        };
        const num = v => UI.money(v), euro = v => UI.euro(v), yrs = v => v + 'y';
        return [
            mk('Most goals in a season', seasonMax('goals'), num),
            mk('Most assists in a season', seasonMax('assists'), num),
            mk('Most goal involvements', p => { const t = careerTotal(p); const v = t.goals + t.assists; return v > 0 ? { val: v } : null; }, num),
            mk('Most trophies', p => { const n = (p.trophies || []).length; return n > 0 ? { val: n } : null; }, num),
            mk('Most goals', careerKey('goals'), num),
            mk('Most assists', careerKey('assists'), num),
            mk('Most appearances', careerKey('apps'), num),
            mk('Most clean sheets', careerKey('cs'), num),
            mk('Highest average rating', p => { const t = careerTotal(p); return t.apps >= 20 ? { val: Math.round(t.avg * 100) / 100, extra: t.apps + ' apps' } : null; }, v => v.toFixed(2)),
            mk('Most yellow cards', careerKey('yellow'), num),
            mk('Most red cards', careerKey('red'), num),
            mk('Highest wage', p => { let m = p.wage || 0; ((p.history && p.history.wage) || []).forEach(h => { if (h.value > m) m = h.value; }); return m > 0 ? { val: m } : null; }, euro),
            mk('Highest sponsor income', p => { const active = (p.sponsorDeals || []).reduce((a, d) => a + (d.weekly || 0), 0); const v = Math.max(p.sponsorIncome || 0, active); return v > 0 ? { val: v } : null; }, v => euro(v) + '/wk'),
            mk('Highest transfer fee', p => { let m = 0; ((p.history && p.history.fees) || []).forEach(h => { if (h.value > m) m = h.value; }); return m > 0 ? { val: m } : null; }, euro),
            mk('Most seasons', p => { const n = seasonsActiveLeague(p); return n > 0 ? { val: n } : null; }, num),
            mk('Most clubs played for', p => { const n = Object.keys(seniorYearsByClub(p)).length; return n > 0 ? { val: n } : null; }, num),
            mk('Longest spell at one club', p => {
                let best = 0, club = null;
                Object.entries(seniorYearsByClub(p)).forEach(([cid, yset]) => {
                    const ys = Array.from(yset).sort((a, b) => a - b);
                    let run = ys.length ? 1 : 0, mx = run;
                    for (let i = 1; i < ys.length; i++) { run = ys[i] === ys[i - 1] + 1 ? run + 1 : 1; if (run > mx) mx = run; }
                    if (mx > best) { best = mx; club = cid; }
                });
                return best > 0 ? { val: best, extra: UI.clubName(club) } : null;
            }, v => v + (v === 1 ? ' season' : ' seasons')),
            mk('Most promotions', p => { const n = promoCount(p); return n > 0 ? { val: n } : null; }, num),
            mk('Most relegations', p => moves(p, 'releg'), num),
            mkMin('Youngest goalscorer', p => { const ys = scoringYears(p); if (!ys.length) return null; let by = ys[0], ba = ageIn(p, ys[0]); ys.forEach(y => { const a = ageIn(p, y); if (a < ba) { ba = a; by = y; } }); return { val: ba, extra: GameState.seasonLabelFor(by) }; }, yrs),
            mk('Oldest goalscorer', p => { const ys = scoringYears(p); if (!ys.length) return null; let by = ys[0], ba = ageIn(p, ys[0]); ys.forEach(y => { const a = ageIn(p, y); if (a > ba) { ba = a; by = y; } }); return { val: ba, extra: GameState.seasonLabelFor(by) }; }, yrs),
        ].filter(Boolean);
    }
};
Router.register('records', { isMain: false, parent: 'clienthist', title: 'Records', render(el) { ClientRecords.render(el); } });
