// ============================================================
//  Scouting — recent finds (unsigned talent), your scouts and
//  their assignments, and the hiring market.
// ============================================================
const ScoutingScreen = {
    tab: 'finds',

    render(el) {
        el.innerHTML = `<div class="tab-bar" style="margin-bottom:var(--space-4)">
            ${[['finds', 'Finds'], ['scouts', 'Your scouts'], ['market', 'Hire']].map(([k, l]) => `<button class="tab ${this.tab === k ? 'is-active' : ''}" onclick="ScoutingScreen.setTab('${k}')">${l}</button>`).join('')}
        </div>
        <div id="scoutSection"></div>`;
        this.renderSection();
    },
    setTab(t) { this.tab = t; Router.refresh(); },
    renderSection() {
        const body = document.getElementById('scoutSection'); if (!body) return;
        if (this.tab === 'finds') body.innerHTML = this.finds();
        else if (this.tab === 'scouts') body.innerHTML = this.yourScouts();
        else body.innerHTML = this.market();
    },

    // ---------------- Finds (unsigned talent) ----------------
    finds() {
        const list = GameState.players.filter(p => p.knownToAgent && p.agentId == null && !p.dismissedTalent && !p.archived && p.age <= 22).sort((a, b) => b.ability - a.ability);
        if (!list.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-file-text"></i></div><div class="empty__title">No finds yet</div><div class="empty__hint">Reports land here once a scout finishes an assignment.</div><button class="btn btn--accent-outline btn--sm empty__cta" onclick="ScoutingScreen.setTab('market')"><i class="ti ti-user-plus"></i>Hire a scout</button></div>`;
        return `<p class="hint" style="margin-bottom:var(--space-4)">Young players you've come to know. Tap one to view him, or clear ones you're not chasing.</p>` +
            list.map(p => {
                const club = Clubs.getClubById(p.clubId);
                const isNew = p.discoveredWeek != null && (GameState.absWeek() - p.discoveredWeek) < 3;
                return `<a href="${Router.link('client', p.id)}" class="cl-card" style="display:block;position:relative">
                    <button onclick="event.preventDefault();event.stopPropagation();ScoutingScreen.remove('${p.id}')" style="position:absolute;top:8px;right:8px;background:none;border:0;color:var(--text-dim);font-size:16px;cursor:pointer;z-index:1" aria-label="Remove"><i class="ti ti-x"></i></button>
                    <div class="flex-row">
                        <div style="flex:1;min-width:0">
                            <div class="flex-row" style="gap:6px"><span class="cl-name">${UI.flag(p.nationality)} ${p.name}</span><span style="font-size:12px;color:var(--text-faint)">${p.age}y</span>${isNew ? '<span class="pill pill--accent" style="padding:1px 7px;font-size:10px">NEW</span>' : ''}</div>
                            <div class="cl-sub">${p.position} <span style="color:var(--text-chevron)">·</span> <span class="flex-row" style="gap:5px;display:inline-flex">${UI.crest(club)}${club ? club.name : '—'}</span></div>
                        </div>
                        ${UI.abilityBadge(p.ability)}
                    </div>
                </a>`;
            }).join('');
    },
    remove(id) { const p = GameState.getPlayer(id); if (p && p.agentId == null) { p.dismissedTalent = true; p.knownToAgent = false; GameState.save(); Router.refresh(); } },

    // ---------------- Your scouts ----------------
    yourScouts() {
        const ag = GameState.agency;
        if (!ag.scouts.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-user-plus"></i></div><div class="empty__title">No scouts hired</div><div class="empty__hint">Hire one to start finding talent.</div><button class="btn btn--accent-outline btn--sm empty__cta" onclick="ScoutingScreen.setTab('market')"><i class="ti ti-user-plus"></i>Hire a scout</button></div>`;
        const hc = GameState.homeCountry || 'Netherlands';
        const homeRegions = regionsForCountry(hc);
        const hasLic = Agency.hasIntlLicence();
        return `<p class="hint" style="margin-bottom:var(--space-4)">Assign a scout to a home region — or, with a licence, a foreign league. A report arrives every 6–7 weeks.</p>` +
            ag.scouts.map(s => {
                const scope = s.league ? `${(COMPETITIONS[s.league] || {}).name || s.league} · ${s.country}` : s.region ? regionName(s.region) : 'Unassigned';
                const regionOpts = homeRegions.map(r => `<option value="${r.id}" ${s.region === r.id ? 'selected' : ''}>${r.name} — ${UI.euro(Scouts.regionReportCost(r.id))}/report</option>`).join('');
                const intl = hasLic ? (() => {
                    const countries = Scouts.intlCountries();
                    const selC = (s.country && countries.includes(s.country)) ? s.country : countries[0];
                    return `<select class="select-input" id="intlC_${s.id}" onchange="ScoutingScreen.onIntlCountry('${s.id}')">${countries.map(c => `<option value="${c}" ${selC === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
                        <select class="select-input" id="intlL_${s.id}" style="margin-top:var(--space-2)">${this.intlLeagueOptions(selC, s.league, s.quality)}</select>
                        <button class="btn btn--accent-outline btn--sm" style="margin-top:var(--space-2);width:auto" onclick="ScoutingScreen.assignLeague('${s.id}')">Send abroad</button>`;
                })() : `<p class="hint">Buy an International Scouting Licence (Agency tab) to send scouts abroad.</p>`;
                return `<div class="card" style="margin-bottom:var(--space-3)">
                    <div class="flex-row" style="justify-content:space-between">
                        <div><div class="row-title">${s.name}</div><div class="row-sub">${s.title} · ${scope}</div></div>
                        ${UI.abilityBadge(s.quality)}
                    </div>
                    <div class="info-grid" style="margin:var(--space-3) 0">
                        <div class="info"><span>Wage</span><b>${UI.euro(s.weeklyCost)}/wk</b></div>
                        <div class="info"><span>Next report</span><b>${(s.region || s.league) ? '~' + s.weeksUntilFind + 'w' : 'idle'}</b></div>
                    </div>
                    <label class="field-label">Home region</label>
                    <select class="select-input" id="rg_${s.id}">${regionOpts}</select>
                    <div class="flex-row" style="margin:var(--space-2) 0 var(--space-3)">
                        <button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="ScoutingScreen.assignRegion('${s.id}')">${s.region ? 'Reassign' : 'Assign'}</button>
                        <button class="btn btn--ghost btn--sm" style="width:auto" onclick="ScoutingScreen.viewSelectedRegion('${s.id}')"><i class="ti ti-eye"></i>View clubs</button>
                    </div>
                    <label class="field-label">International</label>${intl}
                    <label class="field-label">Max talent age</label>
                    <select class="select-input" onchange="ScoutingScreen.setAge('${s.id}',this.value)">${[15, 16, 17, 18, 19, 20, 21, 22].map(a => `<option value="${a}" ${(s.maxTalentAge || 22) === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
                    <label class="field-label">Target position</label>
                    <select class="select-input" onchange="ScoutingScreen.setPos('${s.id}',this.value)"><option value="" ${!s.targetPos ? 'selected' : ''}>Any position</option>${(typeof POS_LIST !== 'undefined' ? POS_LIST : []).map(pos => `<option value="${pos}" ${s.targetPos === pos ? 'selected' : ''}>${pos}</option>`).join('')}</select>
                    <label class="field-label">Target level <span class="muted" style="font-weight:400">· narrows the search (fewer, more specific finds)</span></label>
                    <select class="select-input" onchange="ScoutingScreen.setTier('${s.id}',this.value)">${Object.entries(Scouts.TIERS).map(([k, t]) => `<option value="${k}" ${(s.targetTier || 'any') === k ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
                    <div class="flex-row" style="margin-top:var(--space-3)">
                        ${(s.region || s.league) ? `<button class="btn btn--ghost btn--sm" style="width:auto" onclick="ScoutingScreen.setIdle('${s.id}')"><i class="ti ti-x"></i>Set idle</button>` : ''}
                        <button class="btn btn--danger btn--sm" style="width:auto" onclick="ScoutingScreen.release('${s.id}')">Release</button>
                    </div>
                </div>`;
            }).join('') + `<div id="actionResult"></div>`;
    },
    intlLeagueOptions(country, selectedDiv, scoutQuality) {
        const divs = (COUNTRY_DIVS[country] || []);
        return divs.map(d => {
            const minQ = Scouts.minScoutQualityFor(d);
            const tooLow = scoutQuality != null && scoutQuality < minQ;
            return `<option value="${d}" ${selectedDiv === d ? 'selected' : ''} ${tooLow ? 'disabled' : ''}>${(COMPETITIONS[d] || {}).name || d} — ${UI.euro(Scouts.intlLeagueCost(d))}/report · needs ${minQ}${tooLow ? ' 🔒' : ''}</option>`;
        }).join('');
    },
    onIntlCountry(scoutId) {
        const c = document.getElementById('intlC_' + scoutId), l = document.getElementById('intlL_' + scoutId);
        const s = GameState.agency.scouts.find(x => x.id === scoutId);
        if (c && l) l.innerHTML = this.intlLeagueOptions(c.value, null, s ? s.quality : null);
    },
    assignLeague(scoutId) {
        const c = document.getElementById('intlC_' + scoutId), l = document.getElementById('intlL_' + scoutId);
        if (!c || !l) return;
        const r = Scouts.assignLeague(scoutId, c.value, l.value); GameState.save(); Router.refresh();
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    assignRegion(scoutId) {
        const sel = document.getElementById('rg_' + scoutId); if (!sel) return;
        const r = Scouts.assignRegion(scoutId, sel.value); GameState.save(); Router.refresh();
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    // deliberately does NOT refresh the screen: a full re-render would snap any *other*
    // pending dropdown (e.g. the region select) back to its last-saved value
    setAge(scoutId, age) { Scouts.setMaxAge(scoutId, +age); GameState.save(); },
    setPos(scoutId, pos) { Scouts.setPos(scoutId, pos); GameState.save(); },
    setTier(scoutId, tier) { Scouts.setTier(scoutId, tier); GameState.save(); },
    setIdle(scoutId) { const r = Scouts.setIdle(scoutId); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    release(scoutId) { Scouts.release(scoutId); GameState.save(); Router.refresh(); },

    // ---------------- Hiring market ----------------
    market() {
        const cat = Scouts.market();
        const rows = cat.map(o => `<div class="card" style="margin-bottom:var(--space-3)">
            <div class="flex-row" style="justify-content:space-between">
                <div><div class="row-title">${o.name}</div><div class="row-sub">${o.title}</div></div>
                ${UI.abilityBadge(o.quality)}
            </div>
            <div class="info-grid" style="margin:var(--space-3) 0">
                <div class="info"><span>Wage</span><b>${UI.euro(o.weeklyCost)}/wk</b></div>
                <div class="info"><span>Find quality</span><b>${o.quality < 18 ? 'Very low' : o.quality < 35 ? 'Low' : o.quality < 55 ? 'Decent' : 'High'}</b></div>
            </div>
            <button class="btn btn--primary" onclick='ScoutingScreen.hire(${JSON.stringify(o).replace(/'/g, "&#39;")})'>Hire</button>
        </div>`).join('');
        const hc = GameState.homeCountry || 'Netherlands';
        const regTable = regionsForCountry(hc).map(r => `<button class="frow" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="ScoutingScreen.showRegionClubs('${UI.esc(r.id)}')"><span class="frow__k">${regionName(r.id)} <span class="muted">${r.blurb || ''}</span></span><span class="frow__v flex-row" style="gap:5px">${UI.euro(Scouts.regionReportCost(r.id))} <i class="ti ti-chevron-right" style="color:var(--text-faint);font-size:13px"></i></span></button>`).join('');
        return `<p class="hint" style="margin-bottom:var(--space-4)">Better scouts only take you seriously as your reputation grows. This shortlist refreshes every 2 weeks.</p>
            ${rows}<div id="actionResult"></div>
            <div class="section-label" style="margin-top:var(--space-5)">${hc} region cost <span class="muted" style="font-weight:400">(per report · tap to see clubs)</span></div>
            <div class="fcard">${regTable}</div>`;
    },
    // clubs that live in a scouting region — the pool a scout posted there draws finds from
    showRegionClubs(regionId) {
        const clubs = Clubs.getClubsByRegion(regionId).slice().sort((a, b) => b.reputation - a.reputation);
        const rows = clubs.length
            ? clubs.map(c => `<a href="${Router.link('clubs', c.id)}" class="frow" style="cursor:pointer" onclick="Router.closeSheet()"><span class="frow__k flex-row" style="gap:8px">${UI.crest(c)}${c.name}</span><span class="frow__v muted">${c.divisionName || ''} · rep ${c.reputation}</span></a>`).join('')
            : '<p class="muted">No clubs are based in this region.</p>';
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${regionName(regionId)}</div>
            <p class="hint">${clubs.length} club${clubs.length === 1 ? '' : 's'} · ${UI.euro(Scouts.regionReportCost(regionId))} per scouting report</p>
            <div style="max-height:60vh;overflow-y:auto">${rows}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">Close</button>`);
    },
    viewSelectedRegion(scoutId) { const sel = document.getElementById('rg_' + scoutId); if (sel) this.showRegionClubs(sel.value); },
    hire(o) { const r = Scouts.hire(o); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); }
};
Router.register('scouting', { isMain: true, title: 'Scouting', render(el) { ScoutingScreen.render(el); } });
