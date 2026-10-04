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
                    <button onclick="event.preventDefault();event.stopPropagation();ScoutingScreen.remove('${p.id}')" style="position:absolute;top:8px;right:8px;background:none;border:0;color:var(--text-dim);font-size:var(--fs-xl);cursor:pointer;z-index:1" aria-label="${I18n.t('common.remove')}"><i class="ti ti-x"></i></button>
                    <div class="flex-row">
                        <div style="flex:1;min-width:0">
                            <div class="flex-row" style="gap:6px"><span class="cl-name">${UI.flag(p.nationality)} ${UI.esc(p.name)}</span><span style="font-size:var(--fs-sm);color:var(--text-faint)">${p.age}y</span>${isNew ? `<span class="pill pill--accent" style="padding:1px 7px;font-size:10px">${I18n.t('scouting.new')}</span>` : ''}</div>
                            <div class="cl-sub">${p.position} <span style="color:var(--text-chevron)">·</span> <span class="flex-row" style="gap:5px;display:inline-flex">${UI.crest(club)}${club ? club.name : '—'}</span></div>
                        </div>
                        ${UI.abilityBadge(p.ability)}
                    </div>
                </a>`;
            }).join('');
    },
    remove(id) { const p = GameState.getPlayer(id); if (p && p.agentId == null) { p.dismissedTalent = true; p.knownToAgent = false; GameState.save(); Router.refresh(); } },

    // ---------------- Your scouts ----------------
    // One glanceable row per scout, tapping through to his card — the same shape as a client
    // row. Everything editable (region, league, brief, recall, release) now lives on the card:
    // with offices allowing up to 12 scouts, the old inline form per scout was unusable.
    yourScouts() {
        const ag = GameState.agency;
        if (!ag.scouts.length) return `<div class="empty"><div class="empty__icon"><i class="ti ti-user-plus"></i></div><div class="empty__title">${I18n.t('scouting.noScouts')}</div><div class="empty__hint">${I18n.t('scouting.noScoutsSub')}</div><button class="btn btn--accent-outline btn--sm empty__cta" onclick="ScoutingScreen.setTab('market')"><i class="ti ti-user-plus"></i>${I18n.t('scouting.hireScout')}</button></div>`;
        const sep = `<span style="color:var(--text-chevron)">·</span>`;
        return `<p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('scouting.scoutsIntro')}</p>` +
            ag.scouts.map(s => {
                const on = !!(s.region || s.league);
                const contract = ScoutCard.contractText(s);
                return `<a href="${Router.link('scout', s.id)}" class="cl-card" style="display:block" data-scout-row="${s.id}">
                    <div class="flex-row">
                        <div style="flex:1;min-width:0">
                            <div class="flex-row" style="gap:6px"><span class="cl-name">${UI.esc(s.name)}</span>${s.age != null ? `<span style="font-size:var(--fs-sm);color:var(--text-faint)">${s.age}y</span>` : ''}</div>
                            <div class="cl-sub">${UI.esc(ScoutCard.title(s))}</div>
                            <div class="cl-sub">${UI.esc(ScoutCard.statusText(s))}</div>
                            <div class="cl-sub" style="color:var(--text-faint)">${UI.euro(s.weeklyCost)}/wk ${sep} ${on ? I18n.t('sc.nextReportIn', { n: s.weeksUntilFind }) : I18n.t('sc.noAssignment')}${contract ? ` ${sep} ${contract}` : ''}</div>
                        </div>
                        ${UI.abilityBadge(s.quality)}
                    </div>
                </a>`;
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
    // Assigning, briefing, recalling and releasing all moved to the scout card
    // (ui/js/screen-scout.js). intlLeagueOptions and showRegionClubs stay because the card
    // and the Hire tab's region table both still render through them.

    // ---------------- Hiring market ----------------
    market() {
        const cat = Scouts.market();
        const rows = cat.map(o => `<div class="card" style="margin-bottom:var(--space-3)" data-scout="${o.id}">
            <div class="flex-row" style="justify-content:space-between">
                <div><div class="row-title">${UI.esc(o.name)}</div><div class="row-sub">${UI.esc(ScoutCard.title(o))}</div></div>
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
            <div data-wt="scout-regions"><div class="section-label" style="margin-top:var(--space-5)">${I18n.t('scouting.regionCost', { country: hc })} <span class="muted" style="font-weight:400">${I18n.t('scouting.regionCostHint')}</span></div>
            <div class="fcard">${regTable}</div></div>`;
    },
    // clubs that live in a scouting region — the pool a scout posted there draws finds from
    showRegionClubs(regionId) {
        const clubs = Clubs.getClubsByRegion(regionId).slice().sort((a, b) => b.reputation - a.reputation);
        const rows = clubs.length
            ? clubs.map(c => `<a href="${Router.link('clubs', c.id)}" class="frow" style="cursor:pointer" onclick="Router.closeSheet()"><span class="frow__k flex-row" style="gap:8px">${UI.crest(c)}${UI.esc(c.name)}</span><span class="frow__v muted">${c.divisionName || ''} · ${I18n.t('agency.eff.rep')} ${c.reputation}</span></a>`).join('')
            : `<p class="muted">${I18n.t('scouting.noRegionClubs')}</p>`;
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${regionName(regionId)}</div>
            <p class="hint">${I18n.t('scouting.clubsN', { n: clubs.length })} · ${UI.euro(Scouts.regionReportCost(regionId))} ${I18n.t('scouting.perScoutingReport')}</p>
            <div style="max-height:60vh;overflow-y:auto">${rows}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">${I18n.t('common.close')}</button>`);
    },
    hire(o) { const r = Scouts.hire(o); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); }
};
Router.register('scouting', { isMain: true, title: () => I18n.t('nav.scouting'), render(el) { ScoutingScreen.render(el); } });
