// ============================================================
//  Scout card — header + tabs (Overview, Assignment), laid out
//  to match the client card so the two read as the same kind of
//  screen. Everything that used to sit inline on "Your scouts"
//  lives here; that list is now just glanceable rows.
// ============================================================
const ScoutCard = {
    state: {},

    ctx(id) {
        if (!this.state[id]) this.state[id] = { tab: 'overview', scope: null };
        return this.state[id];
    },
    get(id) { return ((GameState.agency && GameState.agency.scouts) || []).find(s => s.id === id); },

    // ---- shared presentation helpers (the scouting list renders rows with these too) ----

    // Title tracks CURRENT quality rather than the value frozen on the object at hire: once a
    // scout's ability can move, a stored title goes stale and a grown scout reads as his old self.
    title(s) { return Scouts.titleFor(s.quality); },
    leagueName(div) { return (COMPETITIONS[div] || {}).name || div; },

    // "Scouting Ostschweiz" / "Scouting Premier League (Germany)" / "Roaming".
    // An unassigned scout is NOT idle — he still turns up the odd find anywhere at home
    // (see Scouts.tick's idle branch) — so the status says Roaming, which is what he does.
    statusText(s) {
        if (s.league) return I18n.t('sc.statusLeague', { league: this.leagueName(s.league), country: s.country || '' });
        if (s.region) return I18n.t('sc.statusRegion', { region: regionName(s.region) });
        return I18n.t('sc.roaming');
    },
    // just the scope word for the header's second line
    statusWord(s) { return (s.region || s.league) ? I18n.t('sc.scouting') : I18n.t('sc.roaming'); },
    // the place, for the header line and the Overview box
    placeText(s) {
        if (s.league) return `${this.leagueName(s.league)} (${s.country || ''})`;
        if (s.region) return regionName(s.region);
        return '—';
    },
    assigned(s) { return !!(s.region || s.league); },

    // Contract remaining: years once there is more than a season to run, weeks inside the last
    // one. Only meaningful once contracts exist (step 2) — until then a scout has no contractUntil
    // and the box is left out entirely rather than printing a hollow zero.
    contractWeeksLeft(s) {
        if (s.contractUntil == null) return null;
        return Math.max(0, s.contractUntil - GameState.absWeek());
    },
    contractText(s) {
        const w = this.contractWeeksLeft(s);
        if (w == null) return null;
        if (w <= 0) return I18n.t('sc.contractExpired');
        if (w > 52) return I18n.t('sc.contractYears', { n: (w / 52).toFixed(1).replace(/\.0$/, '') });
        return I18n.t('sc.contractWeeks', { n: w });
    },

    // ---------------- render ----------------
    render(el, id) {
        const s = this.get(id);
        if (!s) { el.innerHTML = `<div class="empty">${I18n.t('sc.notFound')}</div>`; return; }
        const ctx = this.ctx(id);
        // A genuine (re-)entry lands on Overview; Router.refresh() after an in-screen action is
        // not a re-entry and leaves the open tab alone. Same rule as the client card.
        if (Router.isFreshNav) { ctx.tab = 'overview'; ctx.scope = null; }
        if (ctx.scope == null) ctx.scope = s.league ? 'international' : 'domestic';
        const tabs = ['overview', 'assignment'];
        if (!tabs.includes(ctx.tab)) ctx.tab = 'overview';
        const labels = { overview: I18n.t('sc.tab.overview'), assignment: I18n.t('sc.tab.assignment') };

        const body = ctx.tab === 'overview' ? this.tabOverview(s) : this.tabAssignment(s);
        const sep = `<span style="color:var(--text-chevron)">·</span>`;

        el.innerHTML = `
        <div class="flex-row" style="align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-4)">
            <div style="flex:1;min-width:0">
                <div class="flex-row" style="gap:8px"><span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${UI.esc(s.name)}</span></div>
                <div class="cl-sub" style="margin-top:5px">${UI.esc(this.title(s))}${s.age != null ? ` ${sep} ${s.age}y` : ''}</div>
                <div class="cl-sub" style="margin-top:4px">${this.statusWord(s)} ${sep} ${UI.esc(this.placeText(s))}</div>
            </div>
            ${UI.abilityBadge(s.quality, true)}
        </div>
        <div class="tab-bar tab-bar--sticky" style="margin:0 0 var(--space-4)">${tabs.map(t => `<button class="tab ${ctx.tab === t ? 'is-active' : ''}" onclick="ScoutCard.setTab('${id}','${t}')">${labels[t]}</button>`).join('')}</div>
        <div>${body}</div>
        <div id="actionResult"></div>`;
    },
    setTab(id, tab) { this.ctx(id).tab = tab; Router.refresh(); },

    // ---------------- Overview ----------------
    // Wage / Contract / Role / Region, mirroring the client card's four-box grid. Contract is
    // dropped until contracts exist, so the grid is 3 boxes in step 1 and 4 from step 2 on.
    tabOverview(s) {
        const contract = this.contractText(s);
        const on = this.assigned(s);
        const boxes = [
            `<div class="info"><span>${I18n.t('scouting.wage')}</span><b>${UI.euro(s.weeklyCost)}/wk</b></div>`,
            contract ? `<div class="info"><span>${I18n.t('sc.contract')}</span><b>${contract}</b></div>` : '',
            `<div class="info"><span>${I18n.t('sc.role')}</span><b>${UI.esc(this.title(s))}</b></div>`,
            `<div class="info"><span>${I18n.t('sc.region')}</span><b>${UI.esc(this.placeText(s))}</b></div>`,
        ].filter(Boolean).join('');

        const nextReport = on
            ? `<div class="info"><span>${I18n.t('scouting.nextReport')}</span><b>${I18n.t('sc.inWeeks', { n: s.weeksUntilFind })}</b></div>`
            : '';

        return `<div class="info-grid">${boxes}${nextReport}</div>
            <div class="gap-2" style="display:flex;flex-direction:column;margin-top:var(--space-4)">
                ${on
                ? `<button class="btn btn--accent-outline" onclick="ScoutCard.recall('${s.id}')"><i class="ti ti-x"></i>${I18n.t('sc.recall')}</button>`
                : `<button class="btn btn--accent-outline" onclick="ScoutCard.setTab('${s.id}','assignment')"><i class="ti ti-map-2"></i>${I18n.t('sc.createAssignment')}</button>`}
                <button class="btn btn--danger" onclick="ScoutCard.confirmRelease('${s.id}')"><i class="ti ti-user-x"></i>${I18n.t('sc.release')}</button>
            </div>`;
    },

    // ---------------- Assignment ----------------
    tabAssignment(s) {
        const ctx = this.ctx(s.id);
        const on = this.assigned(s);
        const dis = on ? 'disabled' : '';
        const scopeSel = `<label class="field-label">${I18n.t('sc.scope')}</label>
            <select class="select-input" ${dis} onchange="ScoutCard.setScope('${s.id}',this.value)">
                <option value="domestic" ${ctx.scope === 'domestic' ? 'selected' : ''}>${I18n.t('sc.domestic')}</option>
                <option value="international" ${ctx.scope === 'international' ? 'selected' : ''}>${I18n.t('sc.international')}</option>
            </select>`;

        return `${scopeSel}
            <div id="scScope">${this.scopeBlock(s)}</div>
            <label class="field-label">${I18n.t('scouting.maxAge')}</label>
            <select class="select-input" ${dis} onchange="ScoutCard.setAge('${s.id}',this.value)">${[15, 16, 17, 18, 19, 20, 21, 22].map(a => `<option value="${a}" ${(s.maxTalentAge || 22) === a ? 'selected' : ''}>${a}</option>`).join('')}</select>
            <label class="field-label">${I18n.t('scouting.targetPos')}</label>
            <select class="select-input" ${dis} onchange="ScoutCard.setPos('${s.id}',this.value)"><option value="" ${!s.targetPos ? 'selected' : ''}>${I18n.t('scouting.anyPosition')}</option>${(typeof POS_LIST !== 'undefined' ? POS_LIST : []).map(pos => `<option value="${pos}" ${s.targetPos === pos ? 'selected' : ''}>${pos}</option>`).join('')}</select>
            <label class="field-label">${I18n.t('scouting.targetLevel')} <span class="muted" style="font-weight:400">${I18n.t('scouting.targetLevelHint')}</span></label>
            <select class="select-input" ${dis} onchange="ScoutCard.setTier('${s.id}',this.value)">${Object.entries(Scouts.TIERS).map(([k]) => `<option value="${k}" ${(s.targetTier || 'any') === k ? 'selected' : ''}>${UI.esc(Scouts.tierLabel(k))}</option>`).join('')}</select>
            <div style="margin-top:var(--space-4)">
                ${on
                ? `<button class="btn btn--accent-outline" style="width:100%" onclick="ScoutCard.recall('${s.id}')"><i class="ti ti-x"></i>${I18n.t('sc.recall')}</button>
                   <p class="hint" style="margin-top:var(--space-2)">${I18n.t('sc.lockedHint')}</p>`
                : `<button class="btn btn--primary" style="width:100%" onclick="ScoutCard.setAssignment('${s.id}')">${I18n.t('sc.setAssignment')}</button>`}
            </div>`;
    },

    // the part of the Assignment tab that differs between home and abroad
    scopeBlock(s) {
        const ctx = this.ctx(s.id);
        const on = this.assigned(s);
        const dis = on ? 'disabled' : '';
        if (ctx.scope === 'international') {
            // A lapsed licence and no licence at all are different problems with different fixes,
            // so they get different lines — and neither shows pickers you cannot use.
            if (typeof Agency !== 'undefined' && Agency.intlSuspended && Agency.intlSuspended())
                return `<p class="hint">${I18n.t('scouts.err.intlSuspended', { weeks: Agency.intlSuspendWeeksLeft() })}</p>`;
            if (typeof Agency === 'undefined' || !Agency.hasIntlLicence())
                return `<p class="hint">${I18n.t('sc.needISL')}</p>`;
            const countries = Scouts.intlCountries();
            const selC = (s.country && countries.includes(s.country)) ? s.country : countries[0];
            return `<label class="field-label">${I18n.t('sc.country')}</label>
                <select class="select-input" id="scIntlC_${s.id}" ${dis} onchange="ScoutCard.onCountry('${s.id}')">${countries.map(c => `<option value="${c}" ${selC === c ? 'selected' : ''}>${UI.esc(c)}</option>`).join('')}</select>
                <label class="field-label">${I18n.t('sc.league')}</label>
                <select class="select-input" id="scIntlL_${s.id}" ${dis}>${ScoutingScreen.intlLeagueOptions(selC, s.league, s.quality)}</select>
                <button class="btn btn--ghost btn--sm" style="width:auto;margin-top:var(--space-2)" onclick="ScoutCard.viewLeagueClubs('${s.id}')"><i class="ti ti-eye"></i>${I18n.t('scouting.viewClubs')}</button>`;
        }
        const hc = GameState.homeCountry || 'Netherlands';
        const opts = regionsForCountry(hc).map(r => `<option value="${r.id}" ${s.region === r.id ? 'selected' : ''}>${UI.esc(r.name)} — ${UI.euro(Scouts.regionReportCost(r.id))}${I18n.t('scouting.perReport')}</option>`).join('');
        return `<label class="field-label">${I18n.t('sc.region')}</label>
            <select class="select-input" id="scRg_${s.id}" ${dis}>${opts}</select>
            <button class="btn btn--ghost btn--sm" style="width:auto;margin-top:var(--space-2)" onclick="ScoutCard.viewRegionClubs('${s.id}')"><i class="ti ti-eye"></i>${I18n.t('scouting.viewClubs')}</button>`;
    },

    // Swap only the scope block: a full re-render would snap the age/position/level dropdowns
    // back to their saved values mid-edit, which is the bug the old screen's comment warns about.
    setScope(id, scope) {
        this.ctx(id).scope = scope;
        const host = document.getElementById('scScope');
        const s = this.get(id);
        if (host && s) host.innerHTML = this.scopeBlock(s);
    },
    onCountry(id) {
        const c = document.getElementById('scIntlC_' + id), l = document.getElementById('scIntlL_' + id);
        const s = this.get(id);
        if (c && l && s) l.innerHTML = ScoutingScreen.intlLeagueOptions(c.value, null, s.quality);
    },

    // these save straight away and deliberately do NOT refresh (see setScope)
    setAge(id, age) { Scouts.setMaxAge(id, +age); GameState.save(); },
    setPos(id, pos) { Scouts.setPos(id, pos); GameState.save(); },
    setTier(id, tier) { Scouts.setTier(id, tier); GameState.save(); },

    setAssignment(id) {
        const ctx = this.ctx(id);
        let r;
        if (ctx.scope === 'international') {
            const c = document.getElementById('scIntlC_' + id), l = document.getElementById('scIntlL_' + id);
            if (!c || !l) return;
            r = Scouts.assignLeague(id, c.value, l.value);
        } else {
            const sel = document.getElementById('scRg_' + id);
            if (!sel) return;
            r = Scouts.assignRegion(id, sel.value);
        }
        GameState.save(); Router.refresh();
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    recall(id) {
        const r = Scouts.setIdle(id);
        GameState.save(); Router.refresh();
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },

    viewRegionClubs(id) { const sel = document.getElementById('scRg_' + id); if (sel) ScoutingScreen.showRegionClubs(sel.value); },
    viewLeagueClubs(id) { const sel = document.getElementById('scIntlL_' + id); if (sel) this.showLeagueClubs(sel.value); },

    // the league pool a scout posted abroad draws finds from — the international twin of
    // ScoutingScreen.showRegionClubs, which until now had no equivalent
    showLeagueClubs(div) {
        const clubs = Clubs.getClubsByDivision(div).slice().sort((a, b) => b.reputation - a.reputation);
        const rows = clubs.length
            ? clubs.map(c => `<a href="${Router.link('clubs', c.id)}" class="frow" style="cursor:pointer" onclick="Router.closeSheet()"><span class="frow__k flex-row" style="gap:8px">${UI.crest(c)}${UI.esc(c.name)}</span><span class="frow__v muted">${I18n.t('agency.eff.rep')} ${c.reputation}</span></a>`).join('')
            : `<p class="muted">${I18n.t('sc.noLeagueClubs')}</p>`;
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${UI.esc(this.leagueName(div))}</div>
            <p class="hint">${I18n.t('scouting.clubsN', { n: clubs.length })} · ${UI.euro(Scouts.intlLeagueCost(div))} ${I18n.t('scouting.perScoutingReport')}</p>
            <div style="max-height:60vh;overflow-y:auto">${rows}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-3)" onclick="Router.closeSheet()">${I18n.t('common.close')}</button>`);
    },

    // data-back="close" so the hardware back button cancels the release instead of confirming it
    confirmRelease(id) {
        const s = this.get(id); if (!s) return;
        Router.modal(`<div data-back="close">
            <h2 style="margin:0 0 var(--space-3);font-size:var(--fs-xl)">${I18n.t('sc.releaseTitle', { name: UI.esc(s.name) })}</h2>
            <p style="color:var(--text-secondary);line-height:1.5;margin:0 0 var(--space-5)">${I18n.t('sc.releaseBody')}</p>
            <div style="display:flex;gap:var(--space-3)">
                <button class="btn btn--ghost" style="flex:1" onclick="Router.closeModal()">${I18n.t('common.cancel')}</button>
                <button class="btn btn--danger" style="flex:1" onclick="ScoutCard.doRelease('${id}')">${I18n.t('agency.release')}</button>
            </div></div>`);
    },
    doRelease(id) {
        Router.closeModal();
        Scouts.release(id); GameState.save();
        delete this.state[id];
        // the scout is gone, so this card would 404 on a back press — replace the entry
        Router.replace('scouting');
    }
};

Router.register('scout', {
    isMain: false, parent: 'scouting',
    title: p => { const s = ScoutCard.get(p[0]); return s ? s.name : I18n.t('sc.scout'); },
    render(el, params) { ScoutCard.render(el, params[0]); }
});
