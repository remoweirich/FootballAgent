// ============================================================
//  Scouting — recent finds (unsigned talent), your scouts and
//  their assignments, and the hiring market.
// ============================================================
const ScoutingScreen = {
    tab: 'finds',

    render(el) {
        el.innerHTML = `<div class="tab-bar" style="margin-bottom:var(--space-4)">
            ${[['finds', I18n.t('scouting.tab.finds')], ['scouts', I18n.t('scouting.tab.scouts')], ['market', I18n.t('scouting.tab.market')]].map(([k, l]) => `<button class="tab ${this.tab === k ? 'is-active' : ''}" onclick="ScoutingScreen.setTab('${k}')">${l}</button>`).join('')}
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
        if (!list.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-file-text"></i></div><div class="empty__title">${I18n.t('scouting.noFinds')}</div><div class="empty__hint">${I18n.t('scouting.noFindsSub')}</div><button class="btn btn--accent-outline btn--sm empty__cta" onclick="ScoutingScreen.setTab('market')"><i class="ti ti-user-plus"></i>${I18n.t('scouting.hireScout')}</button></div>`;
        return `<p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('scouting.findsIntro')}</p>` +
            list.map(p => {
                const club = Clubs.getClubById(p.clubId);
                const isNew = p.discoveredWeek != null && (GameState.absWeek() - p.discoveredWeek) < 3;
                return `<a href="${Router.link('client', p.id)}" class="cl-card" style="display:block;position:relative">
                    <button onclick="event.preventDefault();event.stopPropagation();ScoutingScreen.remove('${p.id}')" style="position:absolute;top:8px;right:8px;background:none;border:0;color:var(--text-dim);font-size:16px;cursor:pointer;z-index:1" aria-label="${I18n.t('common.remove')}"><i class="ti ti-x"></i></button>
                    <div class="flex-row">
                        <div style="flex:1;min-width:0">
                            <div class="flex-row" style="gap:6px"><span class="cl-name">${UI.flag(p.nationality)} ${p.name}</span><span style="font-size:12px;color:var(--text-faint)">${p.age}y</span>${isNew ? `<span class="pill pill--accent" style="padding:1px 7px;font-size:10px">${I18n.t('scouting.new')}</span>` : ''}</div>
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
        if (!ag.scouts.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-user-plus"></i></div><div class="empty__title">${I18n.t('scouting.noScouts')}</div><div class="empty__hint">${I18n.t('scouting.noScoutsSub')}</div><button class="btn btn--accent-outline btn--sm empty__cta" onclick="ScoutingScreen.setTab('market')"><i class="ti ti-user-plus"></i>${I18n.t('scouting.hireScout')}</button></div>`;
        const hc = GameState.homeCountry || 'Netherlands';
        const homeRegions = regionsForCountry(hc);
        const hasLic = Agency.hasIntlLicence();
        return `<p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('scouting.scoutsIntro')}</p>` +
            ag.scouts.map(s => {
                const scope = s.league ? `${(COMPETITIONS[s.league] || {}).name || s.league} · ${s.country}` : s.region ? regionName(s.region) : I18n.t('scouting.unassigned');
                const regionOpts = homeRegions.map(r => `<option value="${r.id}" ${s.region === r.id ? 'selected' : ''}>${r.name} — ${UI.euro(Scouts.regionReportCost(r.id))}${I18n.t('scouting.perReport')}</option>`).join('');
                const intl = hasLic ? (() => {
                    const countries = Scouts.intlCountries();
                    const selC = (s.country && countries.includes(s.country)) ? s.country : countries[0];
                    return `<select class="select-input" id="intlC_${s.id}" onchange="ScoutingScreen.onIntlCountry('${s.id}')">${countries.map(c => `<option value="${c}" ${selC === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
                        <select class="select-input" id="intlL_${s.id}" style="margin-top:var(--space-2)">${this.intlLeagueOptions(selC, s.league, s.quality)}</select>
                        <button class="btn btn--accent-outline btn--sm" style="margin-top:var(--space-2);width:auto" onclick="ScoutingScreen.assignLeague('${s.id}')">${I18n.t('scouting.sendAbroad')}</button>`;
                })() : `<p class="hint">${I18n.t('scouting.needLicence')}</p>`;
                return `<div class="card" style="margin-bottom:var(--space-3)">
                    <div class="flex-row" style="justify-content:space-between">
                        <div><div class="row-title">${s.name}</div><div class="row-sub">${s.title} · ${scope}</div></div>
                        ${UI.abilityBadge(s.quality)}
                    </div>
                    <div class="info-grid" style="margin:var(--space-3) 0">
                        <div class="info"><span>${I18n.t('scouting.wage')}</span><b>${UI.euro(s.weeklyCost)}/wk</b></div>
                        <div class="info"><span>${I18n.t('scouting.nextReport')}</span><b>${(s.region || s.league) ? '~' + s.weeksUntilFind + 'w' : I18n.t('scouting.idle')}</b></div>
                    </div>
                    <label class="field-label">${I18n.t('scouting.homeRegion')}</label>
                    <select class="select-input" id="rg_${s.id}">${regionOpts}</select>
                    <div class="flex-row" style="margin:var(--space-2) 0 var(--space-3)">
                        <button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="ScoutingScreen.assignRegion('${s.id}')">${s.region ? I18n.t('scouting.reassign') : I18n.t('scouting.assign')}</button>
                        <button class="btn btn--ghost btn--sm" style="width:auto" onclick="ScoutingScreen.viewSelectedRegion('${s.id}')"><i class="ti ti-eye"></i>${I18n.t('scouting.viewClubs')}</button>
                    </div>
                    <label class="field-label">${I18n.t('scouting.international')}</label>${intl}
                    <label class="field-label">${I18n.t('scouting.maxAge')}</label>
                    <select class="select-input" onchange="ScoutingScreen.setAge('${s.id}',this.value)">${[15, 16, 17, 18, 19, 20, 21, 22].map(a => `<option value="${a}" ${(s.maxTalentAge || 22) === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
                    <label class="field-label">${I18n.t('scouting.targetPos')}</label>
                    <select class="select-input" onchange="ScoutingScreen.setPos('${s.id}',this.value)"><option value="" ${!s.targetPos ? 'selected' : ''}>${I18n.t('scouting.anyPosition')}</option>${(typeof POS_LIST !== 'undefined' ? POS_LIST : []).map(pos => `<option value="${pos}" ${s.targetPos === pos ? 'selected' : ''}>${pos}</option>`).join('')}</select>
                    <label class="field-label">${I18n.t('scouting.targetLevel')} <span class="muted" style="font-weight:400">${I18n.t('scouting.targetLevelHint')}</span></label>
                    <select class="select-input" onchange="ScoutingScreen.setTier('${s.id}',this.value)">${Object.entries(Scouts.TIERS).map(([k, t]) => `<option value="${k}" ${(s.targetTier || 'any') === k ? 'selected' : ''}>${Scouts.tierLabel(k)}</option>`).join('')}</select>
                    <div class="flex-row" style="margin-top:var(--space-3)">
                        ${(s.region || s.league) ? `<button class="btn btn--ghost btn--sm" style="width:auto" onclick="ScoutingScreen.setIdle('${s.id}')"><i class="ti ti-x"></i>${I18n.t('scouting.setIdle')}</button>` : ''}
                        <button class="btn btn--danger btn--sm" style="width:auto" onclick="ScoutingScreen.release('${s.id}')">${I18n.t('agency.release')}</button>
                    </div>
                </div>`;
            }).join('') + `<div id="actionResult"></div>`;
    },
    intlLeagueOptions(country, selectedDiv, scoutQuality) {
        const divs = (COUNTRY_DIVS[country] || []);
        return divs.map(d => {
            const minQ = Scouts.minScoutQualityFor(d);
            const tooLow = scoutQuality != null && scoutQuality < minQ;
            return `<option value="${d}" ${selectedDiv === d ? 'selected' : ''} ${tooLow ? 'disabled' : ''}>${(COMPETITIONS[d] || {}).name || d} — ${UI.euro(Scouts.intlLeagueCost(d))}${I18n.t('scouting.perReport')} · ${I18n.t('scouting.needsQ', { q: minQ })}${tooLow ? ' 🔒' : ''}</option>`;
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
                <div class="info"><span>${I18n.t('scouting.wage')}</span><b>${UI.euro(o.weeklyCost)}/wk</b></div>
                <div class="info"><span>${I18n.t('scouting.findQuality')}</span><b>${o.quality < 18 ? I18n.t('scouting.q.veryLow') : o.quality < 35 ? I18n.t('scouting.q.low') : o.quality < 55 ? I18n.t('scouting.q.decent') : I18n.t('scouting.q.high')}</b></div>
            </div>
            <button class="btn btn--primary" onclick='ScoutingScreen.hire(${JSON.stringify(o).replace(/'/g, "&#39;")})'>${I18n.t('agency.hire')}</button>
        </div>`).join('');
        const hc = GameState.homeCountry || 'Netherlands';
        const regTable = regionsForCountry(hc).map(r => `<button class="frow" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" onclick="ScoutingScreen.showRegionClubs('${UI.esc(r.id)}')"><span class="frow__k">${regionName(r.id)} <span class="muted">${r.blurb || ''}</span></span><span class="frow__v flex-row" style="gap:5px">${UI.euro(Scouts.regionReportCost(r.id))} <i class="ti ti-chevron-right" style="color:var(--text-faint);font-size:13px"></i></span></button>`).join('');
        return `<p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('scouting.marketIntro')}</p>
            ${rows}<div id="actionResult"></div>
            <div class="section-label" style="margin-top:var(--space-5)">${I18n.t('scouting.regionCost', { country: hc })} <span class="muted" style="font-weight:400">${I18n.t('scouting.regionCostHint')}</span></div>
            <div class="fcard">${regTable}</div>`;
    },
    // clubs that live in a scouting region — the pool a scout posted there draws finds from
    showRegionClubs(regionId) {
        const clubs = Clubs.getClubsByRegion(regionId).slice().sort((a, b) => b.reputation - a.reputation);
        const rows = clubs.length
            ? clubs.map(c => `<a href="${Router.link('clubs', c.id)}" class="frow" style="cursor:pointer" onclick="Router.closeSheet()"><span class="frow__k flex-row" style="gap:8px">${UI.crest(c)}${c.name}</span><span class="frow__v muted">${c.divisionName || ''} · ${I18n.t('agency.eff.rep')} ${c.reputation}</span></a>`).join('')
            : `<p class="muted">${I18n.t('scouting.noRegionClubs')}</p>`;
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${regionName(regionId)}</div>
            <p class="hint">${I18n.t('scouting.clubsN', { n: clubs.length })} · ${UI.euro(Scouts.regionReportCost(regionId))} ${I18n.t('scouting.perScoutingReport')}</p>
            <div style="max-height:60vh;overflow-y:auto">${rows}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">${I18n.t('common.close')}</button>`);
    },
    viewSelectedRegion(scoutId) { const sel = document.getElementById('rg_' + scoutId); if (sel) this.showRegionClubs(sel.value); },
    hire(o) { const r = Scouts.hire(o); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); }
};
Router.register('scouting', { isMain: true, title: () => I18n.t('nav.scouting'), render(el) { ScoutingScreen.render(el); } });
