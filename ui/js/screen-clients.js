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
            return { p, club, tot, hasOffer, hasSponsor, contractLeft: Agency.contractSeasonsLeft(p), repLeft, mor };
        });
    },
    filtered() {
        const rows = this.rows(), f = this.state.filter;
        if (f === 'offers') return rows.filter(r => r.hasOffer);
        if (f === 'sponsors') return rows.filter(r => r.hasSponsor);
        if (f === 'injury') return rows.filter(r => r.p.injury);
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
            sponsors: all.filter(r => r.hasSponsor).length, injury: all.filter(r => r.p.injury).length
        };
        const chip = (id, icon, label) => `<button class="cl-chip ${this.state.filter === id ? 'cl-on' : ''}" onclick="ClientsScreen.setFilter('${id}')"><i class="ti ${icon}" style="font-size:13px"></i>${label} <span class="cl-ct">${counts[id]}</span></button>`;

        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <a class="gbtn" href="#clienthist"><i class="ti ti-history"></i>History</a>
            <button class="gbtn" onclick="ClientsScreen.pickSort()"><i class="ti ti-arrows-sort"></i>${this.SORTS.find(s => s[0] === this.state.sort)[1]}<i class="ti ti-chevron-down" style="color:var(--text-faint)"></i></button>
        </div>
        <div class="chip-row" style="margin-bottom:var(--space-4)">
            ${chip('all', 'ti-users', 'All')}${chip('offers', 'ti-currency-euro', 'Offers')}${chip('sponsors', 'ti-tag', 'Sponsors')}${chip('injury', 'ti-bandage', 'Injury')}
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
        el.innerHTML = `<p class="hint" style="margin-bottom:var(--space-3)">Every player who has been your client — current, released or retired.</p>
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
Router.register('clienthist', { isMain: false, title: 'Client History', render(el) { ClientHistory.render(el); } });
