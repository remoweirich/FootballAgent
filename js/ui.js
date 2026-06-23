// ============================================================
//  UI Controller (v3)
// ============================================================
const KIND_ICON = { transfer: '🔄', loan: '🔁', renewal: '📝', sponsor: '💰', news: '📰', summary: '🏁', info: 'ℹ️' };

const UI = {
    view: 'dashboard',
    filters: { country: 'Netherlands', division: 'ERE' },
    _ctx: {},

    init() {
        document.querySelectorAll('.nav-item').forEach(i =>
            i.addEventListener('click', e => { e.preventDefault(); this.switchView(i.dataset.view); }));
        document.getElementById('advanceBtn').addEventListener('click', () => this.advanceWeek());
        document.getElementById('resetBtn').addEventListener('click', () => GameState.reset());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') this.closeModal(); });
        this.refreshTopbar();
        this.renderActive();
    },

    // ---------- formatting ----------
    money(n) { return Math.round(n || 0).toLocaleString('en-US'); },
    abilityClass(a) { return a >= 80 ? 'ability-elite' : a >= 65 ? 'ability-great' : a >= 50 ? 'ability-good' : a >= 35 ? 'ability-average' : 'ability-low'; },
    relClass(r) { return r >= 65 ? 'rel-good' : r >= 45 ? 'rel-ok' : 'rel-bad'; },
    moraleColor(v) { return v >= 66 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444'; },
    contractText(p) { return p.contractUntilSeason ? 'until end of ' + GameState.seasonLabelFor(p.contractUntilSeason) : '—'; },
    ratingClass(v) { if (!v) return ''; return v < 6 ? 'rating-red' : v < 7 ? 'rating-yellow' : v < 8 ? 'rating-lgreen' : v < 9 ? 'rating-dgreen' : 'rating-blue'; },
    rating(v) { return v ? `<span class="rating ${this.ratingClass(v)}">${v.toFixed(2)}</span>` : '<span class="muted">—</span>'; },
    clubName(id) {
        if (typeof id === 'string' && id.indexOf('u21') === 0) { const parent = id.split(':')[1], c = parent && Clubs.getClubById(parent); return c ? 'Jong ' + c.name : 'U21'; }
        const c = Clubs.getClubById(id); return c ? c.name : id;
    },
    clubLabel(clubId, loan, youth) { const n = this.clubName(clubId); if (youth) return n; return loan ? `${n} <span class="loan-tag">(Loan)</span>` : n; },

    // ---------- chrome ----------
    refreshTopbar() {
        const ag = GameState.agency;
        document.getElementById('tbWeek').textContent = GameState.week;
        document.getElementById('tbSeason').textContent = GameState.seasonLabel();
        document.getElementById('tbBalance').textContent = '€' + this.money(ag.balance);
        document.getElementById('tbRep').textContent = Math.round(ag.reputation) + '/' + Agency.repLimit();
        const badge = document.getElementById('phaseBadge');
        badge.textContent = GameState.phaseLabel();
        badge.className = 'phase-badge ' + (GameState.isTransferWindowOpen() ? 'phase-open' : GameState.isOffSeason() ? 'phase-off' : 'phase-closed');
        const ib = document.getElementById('inboxBadge');
        const n = GameState.unreadCount();
        ib.style.display = n ? 'inline-flex' : 'none';
        ib.innerHTML = this.inboxBadgeHtml();
    },
    mailCategory(m) {
        if (['transfer', 'loan', 'renewal', 'sponsor'].includes(m.kind)) return 'contract';
        if (m.cat === 'injury' || (m.kind === 'news' && /injur|fit again/i.test(m.subject || ''))) return 'injury';
        if (m.cat === 'dev' || (m.kind === 'news' && /develop|breakthrough|progress/i.test(m.subject || ''))) return 'dev';
        return 'general';
    },
    inboxBadgeHtml() {
        const unread = GameState.inbox.filter(m => !m.read);
        if (!unread.length) return '';
        const c = { contract: 0, injury: 0, dev: 0, general: 0 };
        unread.forEach(m => c[this.mailCategory(m)]++);
        const ic = { contract: '📄', injury: '🩹', dev: '📈', general: '●' };
        return ['contract', 'injury', 'dev', 'general'].filter(k => c[k]).map(k => `<span class="nb-chip" title="${k}">${ic[k]}${c[k]}</span>`).join('');
    },

    switchView(name) {
        this.view = name;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.view === name));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(name + 'View').classList.add('active');
        this.renderActive();
    },
    renderActive() {
        ({ dashboard: () => this.renderDashboard(), clients: () => this.renderClients(), talent: () => this.renderTalent(),
           scouts: () => this.renderScouts(), agency: () => this.renderAgency(), inbox: () => this.renderInbox(), leagues: () => this.renderLeagues() }[this.view] || (() => {}))();
    },

    advanceWeek() {
        const r = Sim.advanceWeek();
        this.refreshTopbar(); this.renderActive();
        this.showWeekSummary(r.events, r);
    },
    showWeekSummary(events, r) {
        const items = events.length ? events.map(e => `<li class="log-${e.type}">${e.text}</li>`).join('') : '<li class="log-info">A quiet week.</li>';
        this.openModal(`<h2>Week ${GameState.week} — ${GameState.seasonLabel()}</h2>
            <p class="muted">${GameState.phaseLabel()}${r.seasonFinished ? ' · Season finished' : ''}${r.rolledSeason ? ' · New season!' : ''}</p>
            <ul class="event-list">${items}</ul>
            <div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal()">Continue</button>
            ${GameState.unreadCount() ? `<button class="btn-secondary" onclick="UI.closeModal();UI.switchView('inbox')">Open inbox (${GameState.unreadCount()})</button>` : ''}</div>`);
    },

    // ---------- Dashboard ----------
    renderDashboard() {
        const ag = GameState.agency, income = Agency.weeklyIncome(), expenses = Agency.weeklyExpenses(), net = income - expenses;
        const clients = Agency.clients(), unread = GameState.unreadCount();
        const log = GameState.log.slice(0, 12).map(l => `<li class="log-${l.type}"><span class="log-meta">W${l.week} ${l.season}</span> ${l.text}</li>`).join('')
            || '<li class="log-info">No activity yet. Sign a prospect from Talent, or hire a scout.</li>';
        document.getElementById('dashboardView').innerHTML = `
            <div class="view-header"><h2>Dashboard</h2><p class="muted">${ag.name} · ${GameState.phaseLabel()}</p></div>
            <div class="stat-cards">
                <div class="stat-card"><div class="sc-label">Balance</div><div class="sc-value">€${this.money(ag.balance)}</div></div>
                <div class="stat-card"><div class="sc-label">Weekly net</div><div class="sc-value ${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : '−'}€${this.money(Math.abs(net))}</div><div class="sc-sub">+€${this.money(income)} in · −€${this.money(expenses)} scouts</div></div>
                <div class="stat-card"><div class="sc-label">Reputation</div><div class="sc-value">${Math.round(ag.reputation)}<span class="sc-unit">/${Agency.repLimit()}</span></div></div>
                <div class="stat-card"><div class="sc-label">Clients</div><div class="sc-value">${clients.length}<span class="sc-unit">/${Agency.capacity()}</span></div><div class="sc-sub">${ag.scouts.length} scout(s)</div></div>
            </div>
            ${unread ? `<div class="callout callout-offer">📨 ${unread} unread message(s). <a href="#" onclick="UI.switchView('inbox');return false;">Open inbox</a></div>` : ''}
            <div class="panel"><h3>Season timeline</h3>${this.calendarStrip()}
                <div class="legend"><span><i class="sw sw-open"></i> Transfer window</span><span><i class="sw sw-season"></i> Season (games)</span><span><i class="sw sw-off"></i> Off-season</span><span><i class="sw sw-now"></i> This week</span></div>
            </div>
            <div class="panel"><h3>Recent activity</h3><ul class="log-list">${log}</ul></div>`;
    },
    calendarStrip() {
        let c = '';
        for (let w = 1; w <= 52; w++) {
            let cls = GameState.isTransferWindowOpen(w) ? 'cal-open' : GameState.isSeasonActive(w) ? 'cal-season' : 'cal-off';
            if (w === GameState.week) cls += ' cal-now';
            c += `<div class="cal-cell ${cls}" title="Week ${w}"></div>`;
        }
        return `<div class="cal-strip">${c}</div>`;
    },

    // ---------- Clients ----------
    renderClients() {
        const clients = Agency.clients(), body = document.getElementById('clientsView');
        if (!clients.length) {
            body.innerHTML = `<div class="view-header"><h2>My clients</h2></div><div class="empty"><p>You don't represent anyone yet.</p><p class="muted">Visit <a href="#" onclick="UI.switchView('talent');return false;">Talent</a> to approach a prospect, or hire a <a href="#" onclick="UI.switchView('scouts');return false;">scout</a>.</p></div>`;
            return;
        }
        const sort = this._clientSort || 'ability';
        const tot = p => seasonTotals(p, GameState.seasonStartYear);
        const sorters = {
            ability: (a, b) => b.ability - a.ability,
            age: (a, b) => a.age - b.age,
            rating: (a, b) => tot(b).avg - tot(a).avg,
            apps: (a, b) => tot(b).apps - tot(a).apps,
            contract: (a, b) => Agency.contractSeasonsLeft(a) - Agency.contractSeasonsLeft(b),
            wage: (a, b) => b.wage - a.wage,
        };
        const sorted = clients.slice().sort(sorters[sort] || sorters.ability);
        const opt = (k, l) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${l}</option>`;
        body.innerHTML = `<div class="view-header"><div><h2>My clients</h2><p class="muted">${clients.length}/${Agency.capacity()} represented</p></div>
            <div class="sort-bar">Sort: <select class="filter-select" onchange="UI.setClientSort(this.value)">
                ${opt('ability', 'Ability')}${opt('age', 'Age')}${opt('rating', 'Avg rating')}${opt('apps', 'Appearances')}${opt('contract', 'Contract left')}${opt('wage', 'Wage')}
            </select></div></div>
            <div class="cards-grid">${sorted.map(p => this.playerCard(p, true)).join('')}</div>`;
        body.querySelectorAll('[data-player]').forEach(el => el.addEventListener('click', () => this.openPlayer(el.dataset.player)));
    },
    setClientSort(v) { this._clientSort = v; this.renderClients(); },

    playerCard(p, mine) {
        const club = Clubs.getClubById(p.clubId);
        const tot = seasonTotals(p, GameState.seasonStartYear);
        const inc = Math.round(p.wage * p.wageCommission / 100) + Math.round(p.sponsorIncome * p.sponsorCommission / 100);
        const badges = [];
        if (p.onLoanAt) badges.push(`<span class="pill pill-loan">Loan: ${Clubs.getClubById(p.onLoanAt)?.name || '—'}</span>`);
        if (p.transferListed) badges.push('<span class="pill pill-list">Transfer-listed</span>');
        if (p.loanListed) badges.push('<span class="pill pill-list">Loan-listed</span>');
        if (p.injury) badges.push(`<span class="pill pill-injury">🩹 ${p.injury.type} (${p.injury.weeksOut}w)</span>`);
        return `<div class="card" data-player="${p.id}">
            <div class="card-head"><div><div class="card-title">${p.name}</div>
                <div class="card-sub">${p.nationalityFlag} ${p.position} · ${p.age}y · ${club ? club.name : 'Free agent'}</div></div>
                <div class="ovr ${this.abilityClass(p.ability)}">${p.ability}</div></div>
            <div class="card-rows">
                <div><span class="k">Role</span><span class="v">${ROLE_LABEL[p.squadRole] || p.squadRole}</span></div>
                <div><span class="k">Contract</span><span class="v">${this.contractCell(p)}</span></div>
                ${mine ? `<div><span class="k">Income</span><span class="v">€${this.money(inc)}/wk</span></div>` : `<div><span class="k">Wage</span><span class="v">€${this.money(p.wage)}/wk</span></div>`}
                <div><span class="k">${p.position === 'GK' ? 'Apps · CS · Ast' : 'Apps · Gls · Ast'}</span><span class="v">${tot.apps} · ${p.position === 'GK' ? (tot.cs || 0) : tot.goals} · ${tot.assists}</span></div>
                <div><span class="k">Avg rating</span><span class="v">${this.rating(tot.avg)}</span></div>
            </div>${badges.length ? `<div class="badge-row">${badges.join('')}</div>` : ''}</div>`;
    },
    contractCell(p) {
        if (Agency.isFreeAgent(p)) return '<span class="contract-free">Free agent</span>';
        const left = Agency.contractSeasonsLeft(p);   // contractUntilSeason - seasonStartYear
        if (left <= 0) return '<span class="contract-final">Final year</span>';
        return `until ${GameState.seasonLabelFor(p.contractUntilSeason)}`;
    },

    // ---------- Talent (known prospects) ----------
    renderTalent() {
        const list = GameState.players.filter(p => p.knownToAgent && p.agentId == null && !p.dismissedTalent && p.age <= 22).sort((a, b) => b.ability - a.ability);
        const body = document.getElementById('talentView');
        body.innerHTML = `<div class="view-header"><h2>Talent</h2><p class="muted">Young players you've come to know. Tap one to view him, or use ✕ to clear ones you're not chasing.</p></div>
            <div class="cards-grid">${list.length ? list.map(p => `<div class="talent-wrap">${this.playerCard(p, false)}<button class="talent-remove" title="Remove from list" onclick="event.stopPropagation();UI.removeTalent('${p.id}')">✕</button></div>`).join('') : '<div class="empty"><p>No known players yet.</p><p class="muted">Hire a scout to start finding talent.</p></div>'}</div>`;
        body.querySelectorAll('[data-player]').forEach(el => el.addEventListener('click', () => this.openPlayer(el.dataset.player)));
    },
    removeTalent(id) {
        const p = GameState.getPlayer(id);
        if (p && p.agentId == null) { p.dismissedTalent = true; p.knownToAgent = false; GameState.save(); this.renderTalent(); }
    },

    // ---------- Scouts ----------
    renderScouts() {
        const ag = GameState.agency;
        const active = ag.scouts.map(s => {
            const reg = s.region ? `<span class="pill">${regionName(s.region)}</span>` : '<span class="pill pill-warn">Unassigned</span>';
            const assign = `<div class="assign-row"><select id="rg_${s.id}" class="filter-select">${REGIONS.map(r => `<option value="${r.id}" ${s.region === r.id ? 'selected' : ''}>${r.name} — €${this.money(Scouts.regionReportCost(r.id))}/report</option>`).join('')}</select>
                <button class="btn-secondary sm" onclick="UI.assignScoutRegion('${s.id}')">${s.region ? 'Reassign' : 'Assign'}</button></div>`;
            const ageSel = `<div class="assign-row"><label class="cap">Max talent age</label><select class="filter-select" onchange="UI.setScoutAge('${s.id}', this.value)">${[15, 16, 17, 18, 19, 20, 21, 22].map(a => `<option value="${a}" ${(s.maxTalentAge || 22) === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>`;
            return `<div class="card"><div class="card-head"><div><div class="card-title">${s.name}</div><div class="card-sub">${s.title} · ${reg}</div></div><div class="ovr ${this.abilityClass(s.quality)}">${s.quality}</div></div>
                <div class="card-rows"><div><span class="k">Wage</span><span class="v">€${this.money(s.weeklyCost)}/wk</span></div><div><span class="k">Next report</span><span class="v">${s.region ? ('~' + s.weeksUntilFind + ' wk') : 'idle · spots ~1–2/yr'}</span></div></div>
                ${assign}${ageSel}
                <button class="btn-ghost danger" onclick="UI.releaseScout('${s.id}')">Release</button></div>`;
        }).join('') || '<div class="empty"><p>No scouts hired.</p></div>';
        const cat = Scouts.catalogue().map(o => `<div class="card"><div class="card-head"><div><div class="card-title">${o.name}</div><div class="card-sub">${o.title}</div></div><div class="ovr ${this.abilityClass(o.quality)}">${o.quality}</div></div>
            <div class="card-rows"><div><span class="k">Wage</span><span class="v">€${this.money(o.weeklyCost)}/wk</span></div><div><span class="k">Find quality</span><span class="v">${o.quality < 18 ? 'Very low' : o.quality < 35 ? 'Low' : o.quality < 55 ? 'Decent' : 'High'}</span></div></div>
            <button class="btn-primary" onclick='UI.hireScout(${JSON.stringify(o).replace(/'/g, "&#39;")})'>Hire</button></div>`).join('');
        const regTable = REGIONS.map(r => `<div class="comp-row"><span>${regionName(r.id)} <span class="muted">${r.blurb}</span></span><span>€${this.money(Scouts.regionReportCost(r.id))}</span></div>`).join('');
        document.getElementById('scoutsView').innerHTML = `<div class="view-header"><h2>Scouts</h2><p class="muted">Hire a scout for his weekly wage, then assign him to a region. A report (2–3 talents) arrives every 6–7 weeks and costs a per-region fee; a scout's quality drives how good they are.</p></div>
            <div class="panel"><h3>Your scouts · €${this.money(Agency.weeklyExpenses())}/wk</h3><div class="cards-grid">${active}</div></div>
            <div class="panel"><h3>Available to hire</h3><p class="hint">Better scouts only take you seriously as your reputation grows.</p><div class="cards-grid">${cat}</div></div>
            <div class="panel"><h3>Region cost <span class="muted">(per report)</span></h3><p class="hint">Assigning a scout is free; you pay this fee each time he delivers a report. A scout only finds players in his region, and stronger talents land at that region's bigger clubs (with exceptions). Prestigious regions cost more.</p><div class="comp-break">${regTable}</div></div>`;
    },
    assignScoutRegion(scoutId) {
        const sel = document.getElementById('rg_' + scoutId); if (!sel) return;
        const r = Scouts.assignRegion(scoutId, sel.value); GameState.save(); this.refreshTopbar(); this.renderScouts();
        if (!r.ok) alert(r.message);
    },
    setScoutAge(scoutId, age) { Scouts.setMaxAge(scoutId, +age); GameState.save(); this.renderScouts(); },
    hireScout(o) { const r = Scouts.hire(o); GameState.save(); this.refreshTopbar(); this.renderScouts(); if (!r.ok) alert(r.message); },
    releaseScout(id) { Scouts.release(id); GameState.save(); this.refreshTopbar(); this.renderScouts(); },

    // ---------- Agency (offices, vehicles, properties) ----------
    renderAgency() {
        const ag = GameState.agency, body = document.getElementById('agencyView');
        const off = Upgrades.office(), nextOff = Upgrades.nextOffice();
        const sl = SPONSOR_LABEL[Upgrades.sponsorLevel()];
        const fmtEff = (rep, pl, sc) => [rep ? `+${rep} rep limit` : '', pl ? `+${pl} client limit` : '', sc ? `−${Math.round(sc * 100)}% scouting` : ''].filter(Boolean).join(' · ');

        const officeCard = `<div class="upg-card owned">
            ${Upgrades.art('office', off.id)}
            <div class="upg-body"><div class="upg-name">${off.name} <span class="pill">current</span></div>
            <div class="upg-meta">Rep limit ${off.repLimit} · up to ${off.maxScouts} scout(s) · ${sl} sponsors · €${this.money(off.weekly)}/wk</div></div></div>`;
        const officeNext = nextOff ? `<div class="upg-card">
            ${Upgrades.art('office', nextOff.id)}
            <div class="upg-body"><div class="upg-name">${nextOff.name}</div>
            <div class="upg-meta">Rep limit ${nextOff.repLimit} · up to ${nextOff.maxScouts} scout(s) · ${SPONSOR_LABEL[nextOff.sponsor]} sponsors · +1 client limit · €${this.money(nextOff.weekly)}/wk</div>
            <button class="btn-primary sm" onclick="UI.upgradeOffice()">Move in — fit-out €${this.money(nextOff.weekly * 4)}</button></div></div>` : '<p class="muted">You run the very best office there is.</p>';

        const vNext = Upgrades.nextVehicle();
        const vehOwned = Upgrades.ownedVehicles().map(v => `<div class="upg-card owned mini">${Upgrades.art('vehicle', v.id)}<div class="upg-body"><div class="upg-name">${v.name} <span class="pill">owned</span></div></div></div>`).join('');
        const vehNext = vNext ? `<div class="upg-card">${Upgrades.art('vehicle', vNext.id)}<div class="upg-body"><div class="upg-name">${vNext.name}</div>
            <div class="upg-meta">${fmtEff(vNext.repLimit, vNext.players, vNext.scoutDiscount)}</div>
            <button class="btn-primary sm" onclick="UI.buyVehicle()">Buy — €${this.money(vNext.price)}</button></div></div>` : '<p class="muted">Full garage — you own the Private Jet.</p>';

        const pNext = Upgrades.nextProperty();
        const propOwned = Upgrades.ownedProperties().map(p => `<div class="upg-card owned mini">${Upgrades.art('property', p.id)}<div class="upg-body"><div class="upg-name">${p.name} <span class="pill">owned</span></div></div></div>`).join('');
        const propNext = pNext ? `<div class="upg-card">${Upgrades.art('property', pNext.id)}<div class="upg-body"><div class="upg-name">${pNext.name}</div>
            <div class="upg-meta">${fmtEff(pNext.repLimit, pNext.players, 0)}</div>
            <button class="btn-primary sm" onclick="UI.buyProperty()">Buy — €${this.money(pNext.price)}</button></div></div>` : '<p class="muted">You own the Skyscraper — nothing grander to buy.</p>';

        body.innerHTML = `<div class="view-header"><h2>Agency</h2><p class="muted">Grow your standing. Reputation can't climb past your limit until you upgrade.</p></div>
            <div class="agency-stats">
                <div class="stat-card"><div class="sc-label">Reputation</div><div class="sc-value">${Math.round(ag.reputation)}<span class="sc-unit">/${Agency.repLimit()}</span></div></div>
                <div class="stat-card"><div class="sc-label">Clients</div><div class="sc-value">${Agency.clients().length}<span class="sc-unit">/${Agency.capacity()}</span></div></div>
                <div class="stat-card"><div class="sc-label">Scouts</div><div class="sc-value">${ag.scouts.length}<span class="sc-unit">/${Upgrades.maxScouts()}</span></div></div>
                <div class="stat-card"><div class="sc-label">Sponsor reach</div><div class="sc-value sm">${sl}</div></div>
            </div>
            <div class="panel"><h3>🏢 Office <span class="muted">(weekly running cost)</span></h3><div class="upg-grid">${officeCard}${officeNext}</div></div>
            <div class="panel"><h3>🚗 Vehicles <span class="muted">(buy in order)</span></h3><div class="upg-grid">${vehOwned}${vehNext}</div></div>
            <div class="panel"><h3>🏠 Properties <span class="muted">(buy in order)</span></h3><div class="upg-grid">${propOwned}${propNext}</div></div>
            <div class="panel"><h3>🏋️ Equipment & Facilities <span class="muted">(buy in any order)</span></h3><div class="upg-grid">${this.equipCards()}</div></div>
            <div class="panel"><h3>🧑‍⚕️ Staff</h3><div class="upg-grid">${this.staffCards()}</div></div>`;
    },
    equipCards() {
        return EQUIPMENT.map(e => {
            const owned = Upgrades.ownsEquip(e.id);
            const eff = [e.dev ? `+${e.dev}% dev` : '', e.injury ? `${e.injury > 0 ? '+' : ''}${e.injury}% injury` : '', e.rep ? `+${e.rep} rep` : '', e.weekly ? `€${this.money(e.weekly)}/wk` : '', e.expires ? `expires ${e.expires}y` : ''].filter(Boolean).join(' · ');
            return `<div class="upg-card ${owned ? 'owned' : ''} mini">
                <div class="upg-body"><div class="upg-name">${e.name} ${owned ? '<span class="pill">owned</span>' : ''}</div>
                <div class="upg-meta">${eff}</div>
                ${owned ? '' : `<button class="btn-primary sm" onclick="UI.buyEquip('${e.id}')">Buy — €${this.money(e.price)}</button>`}</div></div>`;
        }).join('');
    },
    staffCards() {
        return STAFF.map(s => {
            const n = Upgrades.staffCount(s.id);
            const eff = [s.dev ? `+${s.dev}% dev` : '', s.injury ? `${s.injury}% injury` : '', s.rep ? `+${s.rep} rep` : '', `restocks ${s.yearlyName}/yr`].filter(Boolean).join(' · ');
            return `<div class="upg-card mini">
                <div class="upg-body"><div class="upg-name">${s.name} <span class="pill">${n}/${s.max}</span></div>
                <div class="upg-meta">€${this.money(s.weekly)}/wk · ${eff}</div>
                <div class="treat-row"><button class="btn-primary sm" ${n >= s.max ? 'disabled' : ''} onclick="UI.hireStaff('${s.id}')">Hire</button>
                <button class="btn-ghost sm" ${n <= 0 ? 'disabled' : ''} onclick="UI.releaseStaff('${s.id}')">Release</button></div></div></div>`;
        }).join('');
    },
    buyEquip(id) { const r = Upgrades.buyEquip(id); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },
    hireStaff(id) { const r = Upgrades.hireStaff(id); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },
    releaseStaff(id) { const r = Upgrades.releaseStaff(id); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },
    buyVehicle() { const r = Upgrades.buyVehicle(); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },
    buyProperty() { const r = Upgrades.buyProperty(); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },
    upgradeOffice() { const r = Upgrades.upgradeOffice(); GameState.save(); this.refreshTopbar(); this.renderAgency(); if (!r.ok) alert(r.message); },

    // ---------- Inbox ----------
    renderInbox() {
        const body = document.getElementById('inboxView');
        if (!GameState.inbox.length) { body.innerHTML = `<div class="view-header"><h2>Inbox</h2></div><div class="empty"><p>Inbox empty.</p><p class="muted">Offers, scout reports, injuries and season reviews arrive here.</p></div>`; return; }
        const rows = GameState.inbox.map(m => {
            const off = m.offer ? this.mailMeta(m) : '';
            return `<div class="mail-row ${m.read ? '' : 'unread'}" data-mail="${m.id}">
                <span class="mail-icon">${KIND_ICON[m.kind] || 'ℹ️'}</span>
                <span class="mail-main"><span class="mail-subject">${m.subject}</span><span class="mail-sub">W${m.week} ${m.season}${off ? ' · ' + off : ''}</span></span>
                ${m.read ? '' : '<span class="mail-dot"></span>'}</div>`;
        }).join('');
        body.innerHTML = `<div class="view-header"><div><h2>Inbox</h2><p class="muted">${GameState.inbox.length} message(s) · ${GameState.unreadCount()} unread</p></div>
            <div class="inbox-actions"><button class="btn-secondary sm" onclick="UI.markAllRead()">Mark all as read</button><button class="btn-ghost sm danger" onclick="UI.dismissAll()">Dismiss all</button></div></div>
            <div class="mail-list">${rows}</div>`;
        body.querySelectorAll('[data-mail]').forEach(el => el.addEventListener('click', () => this.openMail(el.dataset.mail)));
    },
    markAllRead() { GameState.markAllRead(); GameState.save(); this.refreshTopbar(); this.renderInbox(); },
    dismissAll() { if (!GameState.inbox.length) return; if (confirm('Dismiss all messages? Pending offers will be cleared too.')) { GameState.dismissAllMail(); GameState.save(); this.refreshTopbar(); this.renderInbox(); } },
    mailMeta(m) {
        const p = GameState.getPlayer(m.offer.playerId); if (!p) return '';
        if (m.kind === 'transfer') return `€${this.money(m.offer.transferFee)}`;
        if (m.kind === 'sponsor') return `€${this.money(m.offer.weeklyAmount)}/wk`;
        if (m.kind === 'renewal') return `€${this.money(m.offer.proposedWage)}/wk`;
        return '';
    },

    openMail(id) {
        const m = GameState.inbox.find(x => x.id === id); if (!m) return;
        m.read = true; this.refreshTopbar();
        if (m.kind === 'transfer') return this.mailTransfer(m);
        if (m.kind === 'renewal') return this.mailRenewal(m);
        if (m.kind === 'loan') return this.mailLoan(m);
        if (m.kind === 'sponsor') return this.mailSponsor(m);
        // news / summary / info
        this.openModal(`<h2>${KIND_ICON[m.kind] || 'ℹ️'} ${m.subject}</h2><p class="muted">W${m.week} ${m.season}</p>
            <div class="mail-body">${m.body || ''}</div>
            <div class="modal-actions"><button class="btn-secondary" onclick="UI.dismissMail('${m.id}')">Dismiss</button><button class="btn-primary" onclick="UI.closeModal()">Close</button></div>`);
    },
    dismissMail(id) { GameState.removeMail(id); GameState.save(); this.refreshTopbar(); this.closeModal(); if (this.view === 'inbox') this.renderInbox(); },

    mailTransfer(m) {
        const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId), from = Clubs.getClubById(o.fromClubId);
        if (!p || !to) { this.dismissMail(m.id); return; }
        this._ctx = { mailId: m.id, agreedWage: o.proposedWage, wageRound: 1 };
        const bonusMax = Agency.maxSigningBonus(p, o.proposedWage);
        const cut = w => Math.round(w * p.wageCommission / 100);
        const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
        const fromLeague = Agency.isFreeAgent(p) || !from ? 'free agent (no club)' : `${from.name}, ${from.divisionName}`;
        const feeLine = Agency.isFreeAgent(p) ? 'Free transfer (he is a free agent).' : `Agreed fee <strong>€${this.money(o.transferFee)}</strong>.`;
        this.openModal(`<h2>🔄 ${p.name} → ${to.name}</h2>
            <p class="greet">“${Agency.greetingFor(to.id)}”</p>
            <div class="callout neg-facts">
                <div><span class="k">Player's current wage</span><span class="v">€${this.money(p.wage)}/wk</span></div>
                <div><span class="k">Current club</span><span class="v">${fromLeague}</span></div>
                <div><span class="k">Bidding club</span><span class="v">${to.name}, ${to.divisionName}</span></div>
            </div>
            <p class="muted">${p.ability} OVR · ${p.age}y · ${feeLine}${o.initiatedByAgent ? ' · you pitched this' : ''}</p>
            <p>Demand whatever wage you like — the club will push back if it's too much.</p>
            <div class="slider-block"><label>Wage at ${to.name}: <strong id="wgVal">€${this.money(o.proposedWage)}/wk</strong> <span class="cap">(your cut: €<span id="wgCut">${this.money(cut(o.proposedWage))}</span>/wk (${p.wageCommission}%))</span></label>
                <input type="range" id="wgSlider" min="${o.proposedWage}" max="${wageMax}" step="10" value="${o.proposedWage}">
                <button class="btn-secondary sm" onclick="UI.negWage('${to.id}')">Put it to the club</button> <span id="wgMsg" class="inline-msg"></span></div>
            <div class="slider-block"><label>Squad role at ${to.name} <span class="cap">(more minutes = faster development)</span></label>
                <select id="roleSel" class="filter-select wide">${ROLE_ORDER.map(r => `<option value="${r}" ${r === (o.role || 'rotation') ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
            <div class="slider-block"><label>Contract length: <strong id="tmVal">3</strong> season(s)</label><input type="range" id="tmSlider" min="1" max="6" value="3"></div>
            <div class="slider-block"><label>Your signing bonus (Handgeld): €<strong id="sbVal">0</strong></label><input type="range" id="sbSlider" min="0" max="${bonusMax}" step="${Math.max(10, Math.round(bonusMax / 50))}" value="0"></div>
            ${(() => { const others = GameState.inbox.filter(x => x.kind === 'transfer' && x.offer.playerId === p.id && x.id !== m.id); return others.length ? `<div class="callout">Competing bids: ${others.map(x => `<a href="#" onclick="UI.openMail('${x.id}');return false;">${Clubs.getClubById(x.offer.toClubId)?.name} · ${ROLE_LABEL[x.offer.role || 'rotation']}</a>`).join(' · ')}</div>` : ''; })()}
            <div class="modal-actions"><button class="btn-ghost danger" onclick="UI.rejectMail('${m.id}')">Reject</button><button class="btn-primary" onclick="UI.doAcceptTransfer('${m.id}')">Accept & complete</button></div>
            <div id="modalResult"></div>`);
        document.getElementById('tmSlider').addEventListener('input', e => document.getElementById('tmVal').textContent = e.target.value);
        document.getElementById('sbSlider').addEventListener('input', e => document.getElementById('sbVal').textContent = this.money(+e.target.value));
        document.getElementById('wgSlider').addEventListener('input', e => { const w = +e.target.value; document.getElementById('wgVal').textContent = '€' + this.money(w) + '/wk'; document.getElementById('wgCut').textContent = this.money(cut(w)); });
    },
    negWage(clubId) {
        const club = Clubs.getClubById(clubId), p = GameState.getPlayer(GameState.inbox.find(m => m.id === this._ctx.mailId).offer.playerId);
        const req = +document.getElementById('wgSlider').value;
        const r = Agency.negotiateWage(p, club, req, this._ctx.wageRound++);
        const msg = document.getElementById('wgMsg');
        const setWage = w => { document.getElementById('wgSlider').value = w; document.getElementById('wgVal').textContent = '€' + this.money(w) + '/wk'; document.getElementById('wgCut').textContent = this.money(Math.round(w * p.wageCommission / 100)); };
        if (r.status === 'accept') { this._ctx.agreedWage = req; msg.innerHTML = `<span class="ok-text">“${r.message}”</span>`; }
        else if (r.status === 'counter') { this._ctx.agreedWage = r.counter; setWage(r.counter); msg.innerHTML = `<span class="bad-text">“${r.message}”</span>`; }
        else { msg.innerHTML = `<span class="bad-text">“${r.message}”</span>`; }
    },
    doAcceptTransfer(mailId) {
        const m = GameState.inbox.find(x => x.id === mailId); if (!m) return this.closeModal();
        const role = document.getElementById('roleSel') ? document.getElementById('roleSel').value : null;
        const term = +document.getElementById('tmSlider').value;
        const bonus = +document.getElementById('sbSlider').value;
        const r = Agency.acceptTransfer(m, this._ctx.agreedWage, role, term, bonus);
        GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ${r.ok ? 'ok' : 'bad'}">${r.message}</div>${r.ok ? '<div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView(\'clients\')">Done</button></div>' : ''}`;
    },

    mailRenewal(m) {
        const o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
        if (!p || !club) { this.dismissMail(m.id); return; }
        this._ctx = { mailId: m.id, agreedWage: o.proposedWage, wageRound: 1 };
        const cut = w => Math.round(w * p.wageCommission / 100);
        const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
        this.openModal(`<h2>📝 Renewal — ${p.name}</h2>
            <p class="greet">“${Agency.greetingFor(club.id)}”</p>
            <div class="callout neg-facts">
                <div><span class="k">Current wage</span><span class="v">€${this.money(p.wage)}/wk</span></div>
                <div><span class="k">Club</span><span class="v">${club.name}, ${club.divisionName}</span></div>
                <div><span class="k">Role · until</span><span class="v">${ROLE_LABEL[p.squadRole] || p.squadRole} · ${GameState.seasonLabelFor(p.contractUntilSeason)}</span></div>
            </div>
            <p>Push for whatever wage you like — the club will say if it's too much.</p>
            <div class="slider-block"><label>Wage: <strong id="wgVal">€${this.money(o.proposedWage)}/wk</strong> <span class="cap">(your cut: €<span id="wgCut">${this.money(cut(o.proposedWage))}</span>/wk (${p.wageCommission}%))</span></label>
                <input type="range" id="wgSlider" min="${o.proposedWage}" max="${wageMax}" step="10" value="${o.proposedWage}">
                <button class="btn-secondary sm" onclick="UI.negRenewWage('${club.id}')">Put it to the club</button> <span id="wgMsg" class="inline-msg"></span></div>
            <div class="slider-block"><label>Squad role at ${club.name}</label>
                <select id="roleSel" class="filter-select wide">${ROLE_ORDER.map(r => `<option value="${r}" ${r === p.squadRole ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
            <div class="slider-block"><label>Contract length: <strong id="tmVal">${o.proposedTermSeasons}</strong> season(s)</label><input type="range" id="tmSlider" min="1" max="6" value="${o.proposedTermSeasons}"></div>
            <div class="modal-actions"><button class="btn-ghost danger" onclick="UI.rejectMail('${m.id}')">Decline</button><button class="btn-primary" onclick="UI.doAcceptRenewal('${m.id}')">Accept renewal</button></div>
            <div id="modalResult"></div>`);
        document.getElementById('wgSlider').addEventListener('input', e => { const w = +e.target.value; document.getElementById('wgVal').textContent = '€' + this.money(w) + '/wk'; document.getElementById('wgCut').textContent = this.money(cut(w)); });
        document.getElementById('tmSlider').addEventListener('input', e => document.getElementById('tmVal').textContent = e.target.value);
    },
    negRenewWage(clubId) {
        const club = Clubs.getClubById(clubId), m = GameState.inbox.find(x => x.id === this._ctx.mailId), p = GameState.getPlayer(m.offer.playerId);
        const req = +document.getElementById('wgSlider').value, r = Agency.negotiateWage(p, club, req, this._ctx.wageRound++);
        const msg = document.getElementById('wgMsg');
        const setWage = w => { document.getElementById('wgSlider').value = w; document.getElementById('wgVal').textContent = '€' + this.money(w) + '/wk'; document.getElementById('wgCut').textContent = this.money(Math.round(w * p.wageCommission / 100)); };
        if (r.status === 'accept') { this._ctx.agreedWage = req; msg.innerHTML = `<span class="ok-text">“${r.message}”</span>`; }
        else if (r.status === 'counter') { this._ctx.agreedWage = r.counter; setWage(r.counter); msg.innerHTML = `<span class="bad-text">“${r.message}”</span>`; }
        else { msg.innerHTML = `<span class="bad-text">“${r.message}”</span>`; }
    },
    doAcceptRenewal(mailId) {
        const m = GameState.inbox.find(x => x.id === mailId); if (!m) return this.closeModal();
        const r = Agency.acceptRenewal(m, this._ctx.agreedWage, document.getElementById('roleSel') ? document.getElementById('roleSel').value : null, +document.getElementById('tmSlider').value); GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ${r.ok ? 'ok' : 'bad'}">${r.message}</div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.renderInbox()">Close</button></div>`;
    },

    mailLoan(m) {
        const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId);
        if (!p || !to) { this.dismissMail(m.id); return; }
        const offered = o.role || 'starter';
        this._ctx = { loanMailId: m.id, loanRole: offered, loanRound: 1 };   // loanRole = role the club has agreed to so far
        const others = GameState.inbox.filter(x => x.kind === 'loan' && x.offer.playerId === p.id && x.id !== m.id);
        const compare = others.length ? `<div class="callout">Other clubs after ${p.name}: ${others.map(x => `<a href="#" onclick="UI.openMail('${x.id}');return false;">${Clubs.getClubById(x.offer.toClubId)?.name} (${ROLE_LABEL[x.offer.role || 'starter']})</a>`).join(' · ')}</div>` : '';
        const durOpts = Agency.loanDurationOptions();
        const inWindow = durOpts.length > 0;
        const durBlock = inWindow
            ? `<div class="slider-block"><label>Loan duration</label><select id="durSel" class="filter-select wide">${durOpts.map((d, i) => `<option value="${d.code}" ${i === 0 ? 'selected' : ''}>${d.label}</option>`).join('')}</select></div>`
            : `<div class="result info">Loans can only be completed during a transfer window (weeks 1–6 or 21–25).</div>`;
        const acceptBtn = inWindow ? `<button class="btn-primary" onclick="UI.doAcceptLoan('${m.id}')">Accept loan</button>` : '';
        this.openModal(`<h2>🔁 Loan — ${p.name}</h2>
            <p class="greet">“${Agency.greetingFor(to.id)}”</p>
            <p class="muted">${to.name} (${to.divisionName}) · they propose: <strong>${ROLE_LABEL[offered]}</strong></p>
            <p>Push for more game time — they may dig in, or give in if you persist and they trust you.</p>
            <div class="slider-block"><label>Ask for role: <strong id="lrAgreed">${ROLE_LABEL[offered]}</strong> agreed</label>
                <select id="roleSel" class="filter-select wide">${ROLE_ORDER.map(r => `<option value="${r}" ${r === offered ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select>
                <button class="btn-secondary sm" onclick="UI.negLoanRole('${to.id}')">Put it to the club</button> <span id="lrMsg" class="inline-msg"></span></div>
            ${compare}
            ${durBlock}
            <div class="modal-actions"><button class="btn-ghost danger" onclick="UI.rejectMail('${m.id}')">Decline</button>${acceptBtn}</div><div id="modalResult"></div>`);
    },
    negLoanRole(clubId) {
        const club = Clubs.getClubById(clubId), m = GameState.inbox.find(x => x.id === this._ctx.loanMailId), p = GameState.getPlayer(m.offer.playerId);
        const requested = document.getElementById('roleSel').value;
        const r = Agency.negotiateLoanRole(p, club, requested, this._ctx.loanRound++);
        const msg = document.getElementById('lrMsg'), agreedEl = document.getElementById('lrAgreed');
        if (r.status === 'accept') { this._ctx.loanRole = r.role; agreedEl.textContent = ROLE_LABEL[r.role]; msg.innerHTML = `<span class="ok-text">“${r.message}”</span>`; }
        else { if (ROLE_ORDER.indexOf(r.role) > ROLE_ORDER.indexOf(this._ctx.loanRole)) { this._ctx.loanRole = r.role; agreedEl.textContent = ROLE_LABEL[r.role]; } msg.innerHTML = `<span class="bad-text">“${r.message}”</span>`; }
    },
    doAcceptLoan(mailId) {
        const m = GameState.inbox.find(x => x.id === mailId); if (!m) return this.closeModal();
        const role = this._ctx.loanRole || (document.getElementById('roleSel') ? document.getElementById('roleSel').value : null);
        const code = document.getElementById('durSel') ? document.getElementById('durSel').value : null;
        const r = Agency.acceptLoanOffer(m, role, code); GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ${r.ok ? 'ok' : 'bad'}">${r.message}</div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.renderInbox()">Close</button></div>`;
    },

    mailSponsor(m) {
        const o = m.offer, p = GameState.getPlayer(o.playerId);
        if (!p) { this.dismissMail(m.id); return; }
        const opts = o.options || [{ company: o.sponsorName, weekly: o.weeklyAmount, annual: 0, termSeasons: o.termSeasons || 1 }];
        const comm = p.sponsorCommission;
        const cards = opts.map((opt, i) => {
            const wCut = Math.round(opt.weekly * comm / 100), aCut = Math.round((opt.annual || 0) * comm / 100);
            return `<div class="sponsor-opt">
                <div class="so-head">${opt.company}</div>
                <div class="so-line"><span>Weekly</span><strong>€${this.money(opt.weekly)}/wk</strong> <span class="cap">(your cut €${this.money(wCut)}/wk (${comm}%))</span></div>
                <div class="so-line"><span>Yearly</span><strong>€${this.money(opt.annual || 0)}/yr</strong> <span class="cap">(your cut €${this.money(aCut)}/yr)</span></div>
                <div class="so-line"><span>Term</span><strong>${opt.termSeasons} season(s)</strong></div>
                <button class="btn-primary sm" onclick="UI.doAcceptSponsor('${m.id}',${i})">Sign this one</button></div>`;
        }).join('');
        this.openModal(`<h2>💰 Sponsorship — ${p.name}</h2>
            <p class="muted">${SPONSOR_LABEL[o.level] || 'Sponsor'} interest · pick one offer. Your ${comm}% sponsor commission is shown behind each amount.</p>
            <div class="sponsor-grid">${cards}</div>
            <div class="modal-actions"><button class="btn-ghost danger" onclick="UI.rejectMail('${m.id}')">Decline all</button></div><div id="modalResult"></div>`);
    },
    doAcceptSponsor(mailId, optionIndex = 0) {
        const m = GameState.inbox.find(x => x.id === mailId); if (!m) return this.closeModal();
        const r = Agency.acceptSponsor(m, optionIndex); GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ${r.ok ? 'ok' : 'bad'}">${r.message}</div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.renderInbox()">Close</button></div>`;
    },
    rejectMail(id) { Agency.declineMail(GameState.inbox.find(m => m.id === id) || {}); GameState.save(); this.refreshTopbar(); this.closeModal(); if (this.view === 'inbox') this.renderInbox(); },

    // ============================================================
    //  Player detail (tabbed)
    // ============================================================
    openPlayer(id) { this._ctx = { playerId: id, tab: 'overview', expanded: {} }; this.renderPlayer(); },
    setTab(tab) { this._ctx.tab = tab; this.renderPlayer(); },
    renderPlayer() {
        const p = GameState.getPlayer(this._ctx.playerId); if (!p) return;
        const mine = p.agentId === 'me';
        const tabs = mine ? ['overview', 'potential', 'morale', 'injuries', 'contract', 'development', 'history'] : ['overview', 'potential', 'development', 'history'];
        const labels = { overview: 'Overview', potential: 'Potential', morale: 'Morale', injuries: 'Injuries', contract: 'Contract', development: 'Development', history: 'History' };
        const tabBar = tabs.map(t => `<button class="tab ${this._ctx.tab === t ? 'active' : ''}" onclick="UI.setTab('${t}')">${labels[t]}</button>`).join('');
        let bodyHtml = '';
        if (this._ctx.tab === 'overview') bodyHtml = this.tabOverview(p, mine);
        else if (this._ctx.tab === 'potential') bodyHtml = this.tabPotential(p);
        else if (this._ctx.tab === 'morale') bodyHtml = this.tabMorale(p);
        else if (this._ctx.tab === 'injuries') bodyHtml = this.tabInjuries(p);
        else if (this._ctx.tab === 'contract') bodyHtml = this.tabContract(p);
        else if (this._ctx.tab === 'development') bodyHtml = this.tabDevelopment(p);
        else if (this._ctx.tab === 'history') bodyHtml = this.tabHistory(p);
        const club = Clubs.getClubById(p.clubId);
        this.openModal(`<div class="pl-head"><div><h2>${p.name}</h2>
            <p class="muted">${p.nationalityFlag} ${p.nationality} · ${p.position} · ${p.age}y · ${club ? club.name + ' (' + club.divisionName + ')' : 'Free agent'}</p></div>
            <div class="ovr lg ${this.abilityClass(p.ability)}">${p.ability}</div></div>
            <div class="tabbar">${tabBar}</div><div class="tab-body">${bodyHtml}</div><div id="modalResult"></div>`);
    },

    tabOverview(p, mine) {
        const club = Clubs.getClubById(p.clubId), tot = seasonTotals(p, GameState.seasonStartYear);
        const offers = GameState.inbox.filter(m => m.offer && m.offer.playerId === p.id);
        const offerHtml = offers.length ? `<h3>Open offers</h3><div class="offer-mini-list">${offers.map(m =>
            `<div class="offer-mini"><span>${KIND_ICON[m.kind]} ${m.subject}</span><button class="btn-secondary sm" onclick="UI.openMail('${m.id}')">Open</button></div>`).join('')}</div>` : '';
        const atReserve = isReserveClub(p.clubId);
        const status = mine ? `<div class="status-row">
            <button class="chip-toggle ${p.transferListed ? 'on' : ''}" onclick="UI.toggleTL('${p.id}')">${p.transferListed ? '✓ Transfer-listed (click to remove)' : 'Request transfer-listing'}</button>
            <button class="chip-toggle ${p.loanListed ? 'on' : ''}" onclick="UI.toggleLL('${p.id}')">${p.loanListed ? '✓ Loan-listed' : 'Not loan-listed'}</button>
            ${p.onLoanAt ? `<span class="chip-toggle on">${isU21Loan(p) ? 'In' : 'On loan:'} ${this.clubName(p.onLoanAt)}</span>` : atReserve ? `<span class="chip-toggle on">Reserve side: ${this.clubName(p.clubId)}</span>` : ''}
            ${p.repExpired ? '<span class="chip-toggle on">Rep term up · free release</span>' : ''}</div>` : '';
        let action = '';
        if (mine) {
            let moveBtns = '';
            if (!p.onLoanAt) {
                moveBtns = `<button class="btn-secondary" onclick="UI.openShop('${p.id}')">Shop to clubs</button> <button class="btn-secondary" onclick="UI.reqLoan('${p.id}')">Request loan</button> `;
                moveBtns += atReserve
                    ? `<button class="btn-secondary" onclick="UI.reqPromote('${p.id}')">Request promotion</button>`
                    : `<button class="btn-secondary" onclick="UI.sendU21('${p.id}')">Send to reserves/U21</button>`;
            }
            action = `<div class="action-row">${moveBtns}<button class="btn-secondary" onclick="UI.reqRenewal('${p.id}')">Renewal talks</button></div>`;
        } else {
            const gate = Agency.canSign(p);
            action = gate.ok ? `<div class="action-row"><button class="btn-primary" onclick="UI.openSign('${p.id}')">Offer representation</button></div>`
                : `<div class="result info">${gate.reason}</div>`;
        }
        return `${status}
            <div class="detail-grid">
                <div class="detail-stat"><div class="ds-label">Wage</div><div class="ds-value">€${this.money(p.wage)}<span class="sc-unit">/wk</span></div></div>
                <div class="detail-stat"><div class="ds-label">Role</div><div class="ds-value sm">${ROLE_LABEL[p.squadRole] || p.squadRole}</div></div>
                <div class="detail-stat"><div class="ds-label">Contract</div><div class="ds-value sm">${this.contractText(p)}</div></div>
                <div class="detail-stat"><div class="ds-label">Status</div><div class="ds-value sm">${p.injury ? '🩹 Injured' : p.onLoanAt ? 'On loan' : 'Available'}</div></div>
            </div>
            <h3>This season (${GameState.seasonLabel()})</h3>
            <div class="statline">
                <div class="st"><div class="st-v">${tot.apps}</div><div class="st-l">Apps</div></div>
                <div class="st"><div class="st-v">${p.position === 'GK' ? (tot.cs || 0) : tot.goals}</div><div class="st-l">${p.position === 'GK' ? 'Clean sheets' : 'Goals'}</div></div>
                <div class="st"><div class="st-v">${tot.assists}</div><div class="st-l">Assists</div></div>
                <div class="st"><div class="st-v yellow">${tot.yellow}</div><div class="st-l">Yellow</div></div>
                <div class="st"><div class="st-v">${tot.red}</div><div class="st-l">Red</div></div>
                <div class="st"><div class="st-v">${this.rating(tot.avg)}</div><div class="st-l">Avg rating</div></div>
            </div>
            ${offerHtml}${action}`;
    },

    tabPotential(p) {
        const r = Scouting.ensureReport(p);
        const reveal = this._ctx.revealPot === p.id
            ? `<div class="callout"><strong>True values (debug):</strong> potential ${p.potential}, current ${p.ability}, style role "${Scouting.roleById(p.position, p.styleRole).label}". Scout estimated potential ${r.estPotential} (quality ${Math.round(r.scoutQuality)}, ±${Math.round(Scouting.errorMargin(r.scoutQuality) * 100)}%).</div>`
            : `<div class="modal-actions"><button class="btn-ghost sm" onclick="UI.revealPot('${p.id}')">🔍 Reveal true potential (debug)</button></div>`;
        return `<h3>Scouting report</h3>
            <p class="scout-desc">${r.desc}</p>
            <div class="ceiling-floor">
                <div class="cf-row"><span class="cf-k">Ceiling</span><span class="cf-v cf-ceil">${r.ceiling}</span></div>
                <div class="cf-row"><span class="cf-k">Floor</span><span class="cf-v cf-floor">${r.floor}</span></div>
            </div>
            <p class="hint">Estimates are relative to ${r.country}'s pyramid and only as good as the scout — weaker scouts are wider of the mark.</p>
            ${reveal}`;
    },
    revealPot(id) { this._ctx.revealPot = id; this.renderPlayer(); },
    tabMorale(p) {
        const m = p.morale, rows = [['club', 'Club', 'Happiness at the club (low if the club is below his level)'],
            ['time', 'Playing time', 'Satisfaction with minutes played'], ['wage', 'Wage', 'How fairly paid he feels'],
            ['agent', 'You (agent)', 'How he feels about your representation — raise it with gifts and good deals']];
        return `<h3>Morale</h3><div class="bars">${rows.map(([k, label, hint]) => {
            const v = Math.round(m[k]); return `<div class="bar-row"><div class="bar-label">${label}<span class="bar-hint">${hint}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${this.moraleColor(v)}"></div></div><div class="bar-val">${v}</div></div>`;
        }).join('')}</div><p class="hint">Morale shifts gradually as circumstances change. Low agent morale makes a player more likely to leave when his representation deal ends.</p>`;
    },

    tabInjuries(p) {
        let cur;
        if (p.injury) {
            const aw = GameState.absWeek();
            const treatedThisWeek = p.injury.treatedWeek === aw;
            const specUsed = p.injury.specialistUsed;
            const physBtn = `<button class="btn-secondary sm" ${treatedThisWeek ? 'disabled' : ''} onclick="UI.doPhysio('${p.id}')">Physio — €1,000 <span class="cap">(−0.5 wk, once/wk)</span></button>`;
            const specBtn = `<button class="btn-secondary sm" ${treatedThisWeek || specUsed ? 'disabled' : ''} onclick="UI.doSpecialist('${p.id}')">Specialist — €15,000 <span class="cap">(halves recovery, once/injury)</span></button>`;
            cur = `<div class="result bad">🩹 ${p.injury.type} — out ~${(Math.round(p.injury.weeksOut * 2) / 2)} more week(s).</div>
                <h3>Treatments</h3>
                <p class="muted">Rest is automatic. Speed things up:</p>
                <div class="treat-row">${physBtn}${specBtn}</div>
                ${treatedThisWeek ? '<p class="hint">Already treated this week — try again next week.</p>' : ''}
                ${specUsed ? '<p class="hint">The specialist has already been used for this injury.</p>' : ''}
                <div id="treatResult"></div>`;
        } else {
            cur = `<div class="result ok">Fully fit.</div>`;
        }
        const hist = (p.injuryHistory || []).length ? `<h3>History</h3><ul class="plain-list">${p.injuryHistory.slice().reverse().map(h => `<li>${h.season}: ${h.type} (${h.weeks} wk)</li>`).join('')}</ul>` : '<p class="muted">No past injuries recorded.</p>';
        return cur + hist;
    },
    doPhysio(id) { const p = GameState.getPlayer(id); const r = Agency.treatPhysio(p); GameState.save(); this.refreshTopbar(); this.renderPlayer(); if (!r.ok) alert(r.message); },
    doSpecialist(id) { const p = GameState.getPlayer(id); const r = Agency.treatSpecialist(p); GameState.save(); this.refreshTopbar(); this.renderPlayer(); if (!r.ok) alert(r.message); },

    tabContract(p) {
        const club = Clubs.getClubById(p.clubId);
        const sponsors = GameState.inbox.filter(m => m.kind === 'sponsor' && m.offer.playerId === p.id);
        const sponsorHtml = sponsors.length ? `<h3>Sponsorship offers</h3>${sponsors.map(m => `<div class="offer-mini"><span>💰 ${(SPONSOR_LABEL[m.offer.level] || 'Sponsor')} interest — ${(m.offer.options ? m.offer.options.length : 1)} option(s)</span><button class="btn-secondary sm" onclick="UI.openMail('${m.id}')">Review</button></div>`).join('')}` : '';
        const listBtn = p.transferListed
            ? `<span class="pill pill-list">Transfer-listed</span>`
            : `<button class="btn-secondary" onclick="UI.reqTransferList('${p.id}')">Ask ${club ? club.name : 'club'} to transfer-list ${p.name}</button>`;
        const fee = Agency.releaseFee(p);
        return `<div class="detail-grid">
                <div class="detail-stat"><div class="ds-label">Wage</div><div class="ds-value">€${this.money(p.wage)}<span class="sc-unit">/wk</span></div></div>
                <div class="detail-stat"><div class="ds-label">Until</div><div class="ds-value sm">${this.contractText(p)}</div></div>
                <div class="detail-stat"><div class="ds-label">Role</div><div class="ds-value sm">${ROLE_LABEL[p.squadRole]}</div></div>
                <div class="detail-stat"><div class="ds-label">Sponsor</div><div class="ds-value">€${this.money(p.sponsorIncome)}<span class="sc-unit">/wk</span></div></div>
            </div>
            <h3>Your representation</h3>
            <div class="detail-grid">
                <div class="detail-stat"><div class="ds-label">Wage cut</div><div class="ds-value">${p.wageCommission}%</div></div>
                <div class="detail-stat"><div class="ds-label">Sponsor cut</div><div class="ds-value">${p.sponsorCommission}%</div></div>
                <div class="detail-stat"><div class="ds-label">Rep until</div><div class="ds-value sm">${p.repExpired ? 'term up · free release' : (p.repUntilSeason ? 'end of ' + GameState.seasonLabelFor(p.repUntilSeason) : '—')}</div></div>
                <div class="detail-stat"><div class="ds-label">Weekly income</div><div class="ds-value">€${this.money(Math.round(p.wage * p.wageCommission / 100) + Math.round(p.sponsorIncome * p.sponsorCommission / 100))}</div></div>
            </div>
            <div class="action-row"><button class="btn-secondary" onclick="UI.reqRenewal('${p.id}')">Request renewal with ${club ? club.name : 'club'}</button></div>
            <div class="action-row">${listBtn}</div>
            ${sponsorHtml}
            <h3>Gifts <span class="muted">(boost agent morale)</span></h3>
            <div class="action-row">
                <button class="btn-secondary" onclick="UI.gift('${p.id}','small')">Small · €${this.money(Agency.giftCost('small'))}</button>
                <button class="btn-secondary" onclick="UI.gift('${p.id}','medium')">Medium · €${this.money(Agency.giftCost('medium'))}</button>
                <button class="btn-secondary" onclick="UI.gift('${p.id}','large')">Large · €${this.money(Agency.giftCost('large'))}</button>
            </div>
            <h3>End representation</h3>
            <p class="hint">${p.repExpired ? 'His representation term has run its course — you can release him at <strong>no cost</strong>.' : `Releasing a client before the term ends means buying out the contract: wage × remaining weeks × your commission = <strong>€${this.money(fee)}</strong>. Once the term is up, release becomes free.`}</p>
            <div class="action-row"><button class="btn-ghost danger" onclick="UI.release('${p.id}')">Release ${p.name} (€${this.money(fee)})</button></div>`;
    },

    tabDevelopment(p) {
        const abil = (p.history.ability || []).slice();
        if (!abil.length || abil[abil.length - 1].value !== p.ability) abil.push({ age: careerAge(p), value: p.ability });
        const wage = (p.history.wage || []).slice();
        if (!wage.length || wage[wage.length - 1].value !== p.wage) wage.push({ age: careerAge(p), value: p.wage });
        const fees = (p.history.fees || []).map(h => ({ x: h.age, y: h.value }));
        const careerEnd = Math.ceil(p.age) + 1;
        const ax = abil.map(h => ({ x: h.age, y: h.value }));
        const wx = wage.map(h => ({ x: h.age, y: h.value }));
        return `<h3>Ability <span class="muted">(over career)</span></h3>${this.xyChart(ax, '#2563eb', { fmtY: v => Math.round(v), fmtX: v => Math.round(v) + 'y', minYSpan: 40, yClampLo: 1, yClampHi: 99, xMin: Math.floor(ax[0].x), xMax: careerEnd, smooth: true, yTickStep: 5 })}
            <h3>Wage <span class="muted">(€/wk) — now €${this.money(p.wage)}</span></h3>${this.xyChart(wx, '#10b981', { fmtY: v => '€' + this.money(v), fmtX: v => Math.round(v) + 'y', xMin: Math.floor(wx[0].x), xMax: careerEnd })}
            <h3>Transfer fees achieved</h3>${fees.length ? this.xyChart(fees, '#8b5cf6', { fmtY: v => '€' + this.money(v), fmtX: v => Math.round(v) + 'y', xMin: Math.floor(fees[0].x), xMax: careerEnd }) : '<p class="muted">No transfers yet.</p>'}
            <p class="hint">The x-axis grows as he ages; the wage line is straight (not smoothed) so contract jumps stay visible.</p>`;
    },

    tabHistory(p) {
        const years = Object.keys(p.stats || {}).map(Number).sort((a, b) => b - a);
        if (!years.length) return '<p class="muted">No matches played yet.</p>';
        const seasonBlocks = years.map(y => {
            const stints = seasonStints(p, y), t = seasonTotals(p, y), open = this._ctx.expanded[y];
            const troph = (p.trophies || []).filter(tr => tr.year === y);
            const gk = p.position === 'GK';
            const gOrCs = (o) => gk ? `${o.cs || 0} cs` : `${o.goals} g`;
            const totLine = `${t.apps} apps · ${gOrCs(t)} · ${t.assists} a · ${t.yellow}🟨 ${t.red}🟥 · ${this.rating(t.avg)}`;
            const endStint = stints[stints.length - 1];
            const endClub = endStint ? Clubs.getClubById(endStint.clubId) : null;
            const endLabel = endStint ? `${this.clubName(endStint.clubId)}${endClub ? ', ' + endClub.divisionName : ''}` : '';
            let inner = '';
            if (open) {
                inner = '<div class="comp-break">' + stints.slice().reverse().map(st => {
                    const head = `<div class="stint-head"><span class="comp-name">${this.clubLabel(st.clubId, st.loan, st.youth)}</span><span>${st.totals.apps} apps · ${gOrCs(st.totals)} · ${st.totals.assists} a · ${this.rating(st.totals.avg)}</span></div>`;
                    const comps = Object.entries(st.comps).map(([cid, c]) => {
                        const avg = c.apps ? c.ratingSum / c.apps : 0;
                        return `<div class="comp-row"><span>${compName(cid)}</span><span>${c.apps} apps · ${gk ? (c.cs || 0) + ' cs' : c.goals + ' g'} · ${c.assists} a · ${c.yellow}🟨 ${c.red}🟥 · ${this.rating(avg)}</span></div>`;
                    }).join('');
                    return head + comps;
                }).join('') + (troph.length ? `<div class="comp-row troph">🏆 ${troph.map(tr => compName(tr.compId)).join(', ')}</div>` : '') + '</div>';
            }
            return `<div class="season-block"><div class="season-master" onclick="UI.toggleSeason(${y})">
                <span class="season-name">${GameState.seasonLabelFor(y)} ${troph.length ? '🏆' : ''}<span class="season-end-club">${endLabel}</span></span>
                <span class="season-tot">${totLine}</span><span class="caret">${open ? '▾' : '▸'}</span></div>${inner}</div>`;
        }).join('');

        const ct = careerTotal(p), careerOpen = this._ctx.careerOpen, mode = this._ctx.careerMode || 'club';
        let careerInner = '';
        if (careerOpen) {
            const toggle = `<div class="status-row"><button class="chip-toggle ${mode === 'club' ? 'on' : ''}" onclick="UI.setCareerMode('club')">By club</button><button class="chip-toggle ${mode === 'comp' ? 'on' : ''}" onclick="UI.setCareerMode('comp')">By competition</button></div>`;
            let rows;
            if (mode === 'club') {
                rows = careerByClub(p).sort((a, b) => b.agg.apps - a.agg.apps).map(m => {
                    const click = Clubs.getClubById(m.clubId) ? `onclick="UI.openClub('${m.clubId}')" style="cursor:pointer"` : '';
                    return `<div class="comp-row" ${click}><span class="comp-name">${this.clubLabel(m.clubId, m.loanEver, m.youth)}</span><span>${m.agg.apps} apps · ${m.agg.goals} g · ${m.agg.assists} a · ${this.rating(m.agg.avg)}</span></div>`;
                }).join('');
            } else {
                rows = careerByComp(p).sort((a, b) => b.agg.apps - a.agg.apps).map(m =>
                    `<div class="comp-row"><span class="comp-name">${compName(m.compId)}${m.youth ? ' <span class="loan-tag">youth</span>' : ''}</span><span>${m.agg.apps} apps · ${m.agg.goals} g · ${m.agg.assists} a · ${this.rating(m.agg.avg)}</span></div>`).join('');
            }
            careerInner = `<div class="comp-break">${toggle}${rows}</div>`;
        }
        const careerBlock = `<div class="season-block career"><div class="season-master" onclick="UI.toggleCareer()">
            <span class="season-name">Career total <span class="muted">(senior)</span></span>
            <span class="season-tot">${ct.apps} apps · ${ct.goals} g · ${ct.assists} a · ${this.rating(ct.avg)}</span>
            <span class="caret">${careerOpen ? '▾' : '▸'}</span></div>${careerInner}</div>`;
        return seasonBlocks + careerBlock + '<p class="hint">Youth (U21) games are shown but excluded from senior totals.</p>';
    },
    toggleSeason(y) { this._ctx.expanded[y] = !this._ctx.expanded[y]; this.renderPlayer(); },
    toggleCareer() { this._ctx.careerOpen = !this._ctx.careerOpen; this.renderPlayer(); },
    setCareerMode(m) { this._ctx.careerMode = m; this._ctx.careerOpen = true; this.renderPlayer(); },

    // ---- player actions ----
    toggleTL(id) {
        const p = GameState.getPlayer(id);
        if (p.transferListed) { Agency.toggleTransferList(p); GameState.save(); this.renderPlayer(); return; }
        const r = Agency.requestTransferListing(p); GameState.save(); this.refreshTopbar(); this.renderPlayer();
        if (!r.ok) alert(r.message);
    },
    toggleLL(id) { Agency.toggleLoanList(GameState.getPlayer(id)); GameState.save(); this.renderPlayer(); },
    reqLoan(id) { const r = Agency.requestLoan(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    sendU21(id) { const p = GameState.getPlayer(id); const reserve = reserveClubFor(p.clubId); const dest = reserve ? reserve.name : 'Jong ' + (Clubs.getClubById(p.clubId)?.name || ''); if (!confirm(`Send ${p.name} to ${dest}? ${reserve ? "He'll feature in their league games and return to the senior side at season's end." : "He plays youth-league games (good for development) until the end of the season; these don't count toward senior appearances."}`)) return; const r = Agency.sendToU21(p); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqPromote(id) { const r = Agency.requestPromotion(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqRenewal(id) { const r = Agency.requestRenewalTalks(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    gift(id, tier) { const r = Agency.giveGift(GameState.getPlayer(id), tier); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    release(id) {
        const p = GameState.getPlayer(id), fee = Agency.releaseFee(p);
        if (!confirm(`Release ${p.name}? You'll pay €${this.money(fee)} to buy out the contract.`)) return;
        const r = Agency.releasePlayer(p); GameState.save(); this.refreshTopbar();
        if (r.ok) { this.closeModal(); this.switchView('clients'); } else this.result(r.message, 'bad');
    },

    // ---- shop to ANY club ----
    openShop(id) {
        const p = GameState.getPlayer(id);
        const byDiv = { ERE: [], EED: [], TWD: [], DRD: [] };
        Clubs.allClubs.filter(c => c.id !== p.clubId).forEach(c => byDiv[c.division]?.push(c));
        const groups = Object.entries(byDiv).map(([div, cs]) => `<optgroup label="${COMPETITIONS[div].name}">${cs.sort((a, b) => b.reputation - a.reputation).map(c => `<option value="${c.id}">${c.name} (rep ${c.reputation})</option>`).join('')}</optgroup>`).join('');
        this.openModal(`<h2>Shop ${p.name}</h2><p class="muted">Pitch him to any club — even one far above his level (they simply won't respond). 50% chance the parent club hears about it.</p>
            <label class="field-label">Target club</label><select id="shopTarget" class="filter-select wide">${groups}</select>
            <div class="modal-actions"><button class="btn-secondary" onclick="UI.openPlayer('${p.id}')">Back</button><button class="btn-primary" onclick="UI.doShop('${p.id}')">Pitch player</button></div><div id="modalResult"></div>`);
    },
    doShop(id) {
        const r = Agency.shopPlayer(GameState.getPlayer(id), document.getElementById('shopTarget').value);
        GameState.save(); this.refreshTopbar();
        this.result(r.message, r.ok ? (r.interested ? 'ok' : 'info') : 'bad');
    },

    // ---- sign negotiation (multi-step) ----
    openSign(id) {
        const p = GameState.getPlayer(id), gate = Agency.canSign(p);
        if (!gate.ok) { this.result(gate.reason, 'bad'); return; }
        this._ctx.signRound = 1;
        const max = Agency.maxCommissions(p);
        this.openModal(`<h2>Offer representation — ${p.name}</h2>
            <p class="muted">${p.nationalityFlag} ${p.position} · ${p.age}y · ${p.ability} OVR</p>
            <p>Agree your commission on his <strong>wage</strong> and <strong>sponsorship</strong> (0–25% each) and a <strong>term</strong>. Players accept a bigger cut for a <em>longer</em> commitment — offer more years to win them over.</p>
            <div class="slider-block"><label>Wage commission: <strong id="wVal">8</strong>%</label><input type="range" id="wSl" min="0" max="25" value="8"></div>
            <div class="slider-block"><label>Sponsor commission: <strong id="sVal">10</strong>%</label><input type="range" id="sSl" min="0" max="25" value="10"></div>
            <div class="slider-block"><label>Representation term: <strong id="tVal">3</strong> season(s)</label><input type="range" id="tSl" min="1" max="10" value="3"></div>
            <div class="proj" id="sproj"></div>
            <div class="modal-actions"><button class="btn-secondary" onclick="UI.openPlayer('${p.id}')">Cancel</button><button class="btn-primary" onclick="UI.proposeSign('${p.id}')">Propose deal</button></div>
            <div id="modalResult"></div>`);
        const upd = () => {
            document.getElementById('wVal').textContent = document.getElementById('wSl').value;
            document.getElementById('sVal').textContent = document.getElementById('sSl').value;
            document.getElementById('tVal').textContent = document.getElementById('tSl').value;
            const inc = Math.round(p.wage * document.getElementById('wSl').value / 100) + Math.round(p.sponsorIncome * document.getElementById('sSl').value / 100);
            document.getElementById('sproj').innerHTML = `Projected income: <strong>€${this.money(inc)}/wk</strong> (wage €${this.money(p.wage)}, sponsor €${this.money(p.sponsorIncome)}).`;
        };
        ['wSl', 'sSl', 'tSl'].forEach(i => document.getElementById(i).addEventListener('input', upd)); upd();
    },
    proposeSign(id) {
        const p = GameState.getPlayer(id);
        const w = +document.getElementById('wSl').value, s = +document.getElementById('sSl').value, t = +document.getElementById('tSl').value;
        const r = Agency.negotiateSign(p, w, s, t, this._ctx.signRound++);
        const res = document.getElementById('modalResult');
        if (r.status === 'accept') { Agency.signPlayer(p, w, s, t); GameState.save(); this.refreshTopbar();
            res.innerHTML = `<div class="result ok">${p.name} agreed! ${w}% wage / ${s}% sponsor for ${t} season(s).</div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView('clients')">View clients</button></div>`;
        } else if (r.status === 'walk') {
            res.innerHTML = `<div class="result bad">${p.name} feels you're not negotiating in good faith and walks away for now.</div>`;
        } else {
            const c = r.counter;
            const sugg = c.suggestTerm && c.suggestTerm > c.term
                ? `<br>💡 Offer <strong>${c.suggestTerm} seasons</strong> and he'll accept up to <strong>${c.suggestWage}%</strong> wage / <strong>${c.suggestSponsor}%</strong> sponsor.` : '';
            res.innerHTML = `<div class="result bad">At ${c.term} season(s) he'll accept at most <strong>${c.wage}%</strong> wage / <strong>${c.sponsor}%</strong> sponsor.${sugg}</div>
                <div class="modal-actions">
                    ${c.suggestTerm && c.suggestTerm > c.term ? `<button class="btn-secondary" onclick="UI.bumpTerm(${c.suggestTerm})">Offer ${c.suggestTerm} seasons</button>` : ''}
                    <button class="btn-primary" onclick="UI.acceptSignCounter('${p.id}',${c.wage},${c.sponsor},${c.term})">Accept ${c.wage}%/${c.sponsor}% · ${c.term}y</button>
                </div>`;
        }
    },
    bumpTerm(t) {
        const sl = document.getElementById('tSl'); if (!sl) return;
        sl.value = t; document.getElementById('tVal').textContent = t;
        const res = document.getElementById('modalResult'); if (res) res.innerHTML = `<div class="result info">Term set to ${t} seasons. Click “Propose deal” again to offer it.</div>`;
    },
    acceptSignCounter(id, w, s, t) {
        const p = GameState.getPlayer(id); Agency.signPlayer(p, w, s, t); GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ok">${p.name} signed at ${w}% / ${s}% for ${t} season(s).</div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView('clients')">View clients</button></div>`;
    },

    // ============================================================
    //  Competitions: tables, cups, play-offs
    // ============================================================
    renderLeagues() {
        const body = document.getElementById('leaguesView');
        const tab = this.filters.leagueTab || 'tables';
        const tabs = [['tables', 'Tables'], ['beker', 'KNVB Beker'], ['kbek', 'De kleine Beker'], ['po', 'Play-offs']];
        const tabBar = tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'active' : ''}" onclick="UI.setLeagueTab('${k}')">${l}</button>`).join('');
        let section = '';
        if (tab === 'tables') {
            const divOpts = ['ERE', 'EED', 'TWD', 'DRD'].map(d => `<option value="${d}" ${this.filters.division === d ? 'selected' : ''}>${COMPETITIONS[d].name}</option>`).join('');
            section = `<div class="controls"><select id="lgCountry" class="filter-select"><option>Netherlands</option></select><select id="lgDivision" class="filter-select">${divOpts}</select></div><div id="standings" class="panel">${this.standingsTable(this.filters.division)}</div>`;
        } else if (tab === 'beker') section = this.cupBekerView();
        else if (tab === 'kbek') section = this.cupKleineView();
        else section = this.playoffsView();
        const finished = GameState.league && GameState.league.finished;
        body.innerHTML = `<div class="view-header"><h2>Competitions</h2><p class="muted">${finished ? 'Season ' + GameState.seasonLabel() + ' — complete' : 'Season ' + GameState.seasonLabel()}</p></div>
            <div class="tabbar">${tabBar}</div>${section}`;
        if (tab === 'tables') document.getElementById('lgDivision').addEventListener('change', e => { this.filters.division = e.target.value; document.getElementById('standings').innerHTML = this.standingsTable(this.filters.division); });
    },
    setLeagueTab(t) { this.filters.leagueTab = t; this.renderLeagues(); },

    standingsTable(div) {
        if (!GameState.league || !GameState.league.tables[div]) return '<p class="muted">No table yet.</p>';
        const rows = League.sortedTable(div);
        const champ = GameState.league.champions && GameState.league.champions[div];
        const promote = div !== 'ERE', relegate = div !== 'DRD', n = rows.length;
        const isY = id => isReserveClub(id);
        const pr = League.computeProRel();
        const mk = (pr && pr.marks && pr.marks[div]) || { green: [], blue: [] };
        const deniedSet = new Set((pr && pr.notes ? pr.notes.filter(nn => nn.div === div) : []).map(nn => nn.clubId));
        const footnotes = [];
        const body = rows.map((r, i) => {
            const c = Clubs.getClubById(r.clubId);
            const myCount = GameState.players.filter(p => p.agentId === 'me' && p.clubId === r.clubId).length;
            const rel = Agency.relationship(r.clubId);
            const gd = r.GF - r.GA;
            let zone = '';
            if (relegate && i >= n - 3) zone = 'zone-relegate';
            else if (mk.green.includes(r.clubId)) zone = 'zone-promote';
            else if (mk.blue.includes(r.clubId)) zone = 'zone-playoff';
            const denied = deniedSet.has(r.clubId);
            if (denied) footnotes.push(c ? c.name : r.clubId);
            return `<tr class="${myCount ? 'has-mine' : ''} ${champ === r.clubId ? 'is-champ' : ''} ${zone}" onclick="UI.openClub('${r.clubId}')" style="cursor:pointer">
                <td class="pos">${i + 1}</td>
                <td class="club"><span class="rel-dot ${this.relClass(rel)}" title="Relationship ${rel}"></span>${c ? c.name : r.clubId}${denied ? ' *' : ''}${champ === r.clubId ? ' 🏆' : ''}</td>
                <td>${myCount ? `<span class="mine-badge">${myCount}</span>` : ''}</td>
                <td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${gd > 0 ? '+' : ''}${gd}</td><td class="pts">${r.Pts}</td></tr>`;
        }).join('');
        const legend = `<div class="zone-legend">${promote ? '<span class="lg-pro">Top 2 promote</span> <span class="lg-po">3–6 play-off</span>' : ''}${relegate ? ' <span class="lg-rel">Bottom 3 relegate</span>' : ''}</div>`;
        const foot = footnotes.length ? `<p class="table-foot">* ${[...new Set(footnotes)].join(', ')} ${footnotes.length > 1 ? 'are reserve sides and cannot be promoted' : 'is a reserve side and cannot be promoted'} ${div === 'EED' ? 'to the Eredivisie' : 'into the same division as their first team / past the reserve-team cap'}; the spot passes to the next eligible club.</p>` : '';
        return `<table class="standings"><thead><tr><th>#</th><th>Club</th><th title="Your players">You</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${body}</tbody></table>
            ${legend}${foot}<p class="hint">Tap a club for its honours and your players there.</p>`;
    },

    _tie(t) {
        if (!t) return '';
        const lk = id => `<span class="tie-club" onclick="UI.openClub('${id}')" style="cursor:pointer">${this.clubName(id)}</span>`;
        if (t.bye) return `<div class="tie">${lk(t.h)}<span class="muted">bye</span></div>`;
        const hw = t.winner === t.h, aw = t.winner === t.a;
        return `<div class="tie"><span class="${hw ? 'tie-win' : ''}">${lk(t.h)}</span><span class="tie-score">${t.hg}–${t.ag}</span><span class="${aw ? 'tie-win' : ''}">${lk(t.a)}</span></div>`;
    },
    cupBekerView() {
        const B = (GameState.league && GameState.league.beker) || (GameState.lastSeasonReport && GameState.lastSeasonReport.beker);
        if (!B || !B.results || !B.results.length) return '<div class="panel"><p class="muted">The KNVB Beker hasn\'t kicked off yet — the first round is in week 4.</p></div>';
        const winner = B.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(B.winner)}</strong></div>` : '';
        const rounds = B.results.slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<p class="hint">Tiers 2–4 (56 clubs) start in round 1; the 18 Eredivisie clubs enter at the Round of 32.</p>${rounds}</div>`;
    },
    cupKleineView() {
        const K = (GameState.league && GameState.league.kbek) || (GameState.lastSeasonReport && GameState.lastSeasonReport.kbek);
        if (!K || !K.groups) return '<div class="panel"><p class="muted">De kleine Beker hasn\'t started yet — group games are in weeks 4, 7 and 16.</p></div>';
        const winner = K.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(K.winner)}</strong></div>` : '';
        const groups = K.groups.map((g, i) => {
            const t = League._kSort(g.table);
            const rows = t.map((r, j) => `<tr class="${j === 0 ? 'zone-promote' : ''}" onclick="UI.openClub('${r.clubId}')" style="cursor:pointer"><td class="club">${this.clubName(r.clubId)}</td><td>${r.P}</td><td>${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="pts">${r.Pts}</td></tr>`).join('');
            return `<div class="kgroup"><h4>Group ${i + 1}</h4><table class="standings mini"><thead><tr><th>Club</th><th>P</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }).join('');
        const ko = (K.results || []).slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<h3>Group stage <span class="muted">(12 mixed groups of 3)</span></h3><p class="hint">12 group winners + the 4 best runners-up reach the last 16.</p><div class="kgroups">${groups}</div>${ko ? `<h3>Knockout</h3>${ko}` : ''}</div>`;
    },
    playoffsView() {
        const P = (GameState.league && GameState.league.playoffs && GameState.league.playoffs._done) ? GameState.league.playoffs : (GameState.lastSeasonReport && GameState.lastSeasonReport.playoffs);
        const pr = GameState.lastSeasonReport && GameState.lastSeasonReport.prorel;
        let blocks = '';
        ['EED', 'TWD', 'DRD'].forEach(div => {
            const po = P && P[div];
            if (!po) { blocks += `<div class="po-block"><h4>${COMPETITIONS[div].name} — promotion play-off</h4><p class="muted">Not played yet (week 46).</p></div>`; return; }
            blocks += `<div class="po-block"><h4>${COMPETITIONS[div].name} — promotion play-off</h4>
                <div class="cup-round"><h5>Semi-finals</h5>${po.sf.map(t => this._tie(t)).join('')}</div>
                <div class="cup-round"><h5>Final</h5>${this._tie(po.final)}</div>
                <div class="cup-winner">⬆️ Promoted: <strong>${this.clubName(po.winner)}</strong></div></div>`;
        });
        let prBlock = '';
        if (pr) {
            const nm = id => this.clubName(id);
            prBlock = `<div class="panel"><h3>Promotion &amp; relegation</h3>
                <div class="comp-row"><span>⬆️ To Eredivisie</span><span>${pr.eedUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Eredivisie</span><span>${pr.ereDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Eerste</span><span>${pr.twdUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Eerste</span><span>${pr.eedDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Tweede</span><span>${pr.drdUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Tweede</span><span>${pr.twdDown.map(nm).join(', ')}</span></div></div>`;
        }
        return `<div class="panel"><p class="hint">Places 3–6 contest a play-off (week 46) for the third promotion spot; the higher seed plays at home (3 v 6, 4 v 5, then the final).</p>${blocks}</div>${prBlock}`;
    },

    // ---- club detail (honours + your clients there; no full squad) ----
    ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); },
    openClub(clubId, sort) {
        const c = Clubs.getClubById(clubId); if (!c) return;
        sort = sort || 'apps';
        const hist = (GameState.clubHistory && GameState.clubHistory[clubId]) || [];
        const titleCount = {};
        hist.forEach(h => (h.trophies || []).forEach(t => titleCount[t] = (titleCount[t] || 0) + 1));
        const honours = Object.keys(titleCount).length ? Object.entries(titleCount).map(([t, n]) => `<span class="pill pill-troph">🏆 ${compName(t)} ×${n}</span>`).join(' ') : '<span class="muted">No major honours recorded yet.</span>';
        const finishes = hist.length ? hist.slice().reverse().slice(0, 8).map(h => `<div class="comp-row"><span>${GameState.seasonLabelFor(h.year)} · ${COMPETITIONS[h.division].short}</span><span>${h.position === 1 ? '🥇 ' : ''}${this.ordinal(h.position)}${(h.trophies || []).length ? ' · 🏆 ' + h.trophies.map(t => COMPETITIONS[t].short).join(', ') : ''}</span></div>`).join('') : '<p class="muted">No completed seasons yet.</p>';

        const rowsData = [];
        GameState.players.filter(p => p.agentId === 'me').forEach(p => {
            const byClub = careerByClub(p);
            const senior = byClub.find(m => m.clubId === clubId);
            const youth = byClub.find(m => m.clubId === 'u21:' + clubId);
            const registeredHere = p.clubId === clubId;
            if (!senior && !youth && !registeredHere) return;
            let agg, youthOnly = false;
            if (senior && senior.agg.apps > 0) { agg = senior.agg; }
            else if (youth && youth.agg.apps > 0) { agg = { apps: 0, goals: 0, assists: 0, ratingSum: 0, avg: youth.agg.avg }; youthOnly = true; }
            else { agg = { apps: 0, goals: 0, assists: 0, ratingSum: 0, avg: 0 }; }
            const stints = []; Object.values(p.stats || {}).forEach(yr => Object.values(yr).forEach(st => { if (st.clubId === clubId) stints.push(st); }));
            const permanentEver = stints.some(st => !st.loan) || (p.clubId === clubId && p.onLoanAt !== clubId);
            const loanedEver = stints.some(st => st.loan) || (p.onLoanAt === clubId);
            rowsData.push({ p, agg, youthOnly, loan: loanedEver && !permanentEver, tro: (p.trophies || []).filter(tr => tr.clubId === clubId).length });
        });
        const sorters = { apps: (a, b) => b.agg.apps - a.agg.apps, goals: (a, b) => b.agg.goals - a.agg.goals, assists: (a, b) => b.agg.assists - a.agg.assists, avg: (a, b) => b.agg.avg - a.agg.avg, troph: (a, b) => b.tro - a.tro };
        rowsData.sort(sorters[sort] || sorters.apps);
        const clientRows = rowsData.length ? rowsData.map(d => `<tr onclick="UI.openPlayer('${d.p.id}')" style="cursor:pointer">
            <td class="club">${d.p.name}${d.youthOnly ? ' <span class="loan-tag">(Youth)</span>' : ''}${d.loan ? ' <span class="loan-tag">(loan)</span>' : ''}</td>
            <td>${d.agg.apps}</td><td>${d.agg.goals}</td><td>${d.agg.assists}</td><td>${d.agg.avg ? this.rating(d.agg.avg) : '<span class="muted">—</span>'}</td><td>${d.tro ? '🏆' + d.tro : '—'}</td></tr>`).join('')
            : '<tr><td colspan="6" class="muted">None of your clients are at this club.</td></tr>';
        const hc = (k, l) => `<th onclick="UI.openClub('${clubId}','${k}')" style="cursor:pointer">${l}${sort === k ? ' ▾' : ''}</th>`;
        this.openModal(`<h2>${c.name}</h2><p class="muted">${c.divisionName} · reputation ${c.reputation}</p>
            <h3>Honours</h3><div class="badge-row">${honours}</div>
            <h3>Recent finishes</h3><div class="comp-break">${finishes}</div>
            <h3>Your clients at ${c.name}</h3>
            <table class="standings"><thead><tr><th>Player</th>${hc('apps', 'Apps')}${hc('goals', 'G')}${hc('assists', 'A')}${hc('avg', 'Avg')}${hc('troph', '🏆')}</tr></thead><tbody>${clientRows}</tbody></table>
            <p class="hint">Players registered here are shown, including those with only youth (U21) games — tagged <span class="loan-tag">(Youth)</span> with 0 senior apps. Tap a name to open the profile.</p>`);
    },

    // ============================================================
    //  Charts (inline SVG line chart)
    // ============================================================
    // flexible chart: points [{x,y}]; opts {fmtX,fmtY,step,smooth,minYSpan,yClampLo,yClampHi,xMin,xMax}
    xyChart(points, color, opts = {}) {
        if (!points || !points.length) return '<p class="muted">No data yet.</p>';
        points = points.slice().sort((a, b) => a.x - b.x);
        const W = 320, H = 122, padL = 44, padR = 12, padT = 12, padB = 24;
        const xMin = opts.xMin != null ? opts.xMin : points[0].x;
        const xMax = opts.xMax != null ? opts.xMax : (points[points.length - 1].x || xMin + 1);
        const xSpan = xMax > xMin ? (xMax - xMin) : 1;
        let ys = points.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys);
        if (opts.minYSpan && (hi - lo) < opts.minYSpan) { const mid = (hi + lo) / 2; lo = mid - opts.minYSpan / 2; hi = mid + opts.minYSpan / 2; }
        if (lo === hi) { lo -= 1; hi += 1; }
        if (opts.yClampLo != null) lo = Math.max(opts.yClampLo, lo);
        if (opts.yClampHi != null) hi = Math.min(opts.yClampHi, hi);
        if (lo >= hi) hi = lo + (opts.minYSpan || 10);
        const X = v => padL + (W - padL - padR) * Math.max(0, Math.min(1, (v - xMin) / xSpan));
        const Y = v => padT + (H - padT - padB) * (1 - (v - lo) / (hi - lo));
        const fmtY = opts.fmtY || (v => v), fmtX = opts.fmtX || (v => v);
        const dots = points.map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${color}"/>`).join('');
        let path = '';
        if (points.length >= 2) {
            if (opts.step) {
                let d = `M ${X(points[0].x).toFixed(1)} ${Y(points[0].y).toFixed(1)}`;
                for (let i = 1; i < points.length; i++) d += ` L ${X(points[i].x).toFixed(1)} ${Y(points[i - 1].y).toFixed(1)} L ${X(points[i].x).toFixed(1)} ${Y(points[i].y).toFixed(1)}`;
                d += ` L ${X(xMax).toFixed(1)} ${Y(points[points.length - 1].y).toFixed(1)}`;
                path = `<path d="${d}" fill="none" stroke="${color}" stroke-width="2"/>`;
            } else if (opts.smooth) {
                path = `<path d="${this._smoothPath(points.map(p => ({ x: X(p.x), y: Y(p.y) })))}" fill="none" stroke="${color}" stroke-width="2"/>`;
            } else {
                path = `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>`;
            }
        }
        const ticks = [xMin, (xMin + xMax) / 2, xMax];
        const xlabels = ticks.map(t => `<text x="${X(t).toFixed(1)}" y="${H - 7}" class="cx-lbl" text-anchor="middle">${fmtX(t)}</text>`).join('');
        let grid = '', ylabels = '';
        if (opts.yTickStep) {
            const step = opts.yTickStep, start = Math.ceil(lo / step) * step;
            for (let v = start; v <= hi + 1e-9; v += step) {
                const yy = Y(v);
                grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}" class="grid"/>`;
                ylabels += `<text x="4" y="${(yy + 3).toFixed(1)}" class="cy-lbl">${fmtY(v)}</text>`;
            }
        } else {
            ylabels = `<text x="4" y="${(Y(hi) + 4).toFixed(1)}" class="cy-lbl">${fmtY(hi)}</text><text x="4" y="${Y(lo).toFixed(1)}" class="cy-lbl">${fmtY(lo)}</text>`;
        }
        return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${grid}<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" class="axis"/>
            <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" class="axis"/>
            ${path}${dots}${xlabels}${ylabels}</svg>`;
    },
    _smoothPath(pts) {
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
            const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        return d;
    },

    // ---------- modal helpers ----------
    openModal(html) { document.getElementById('modalBody').innerHTML = html; document.getElementById('modal').classList.add('active'); },
    closeModal() { document.getElementById('modal').classList.remove('active'); },
    result(msg, kind) { const el = document.getElementById('modalResult'); if (el) el.innerHTML = `<div class="result ${kind}">${msg}</div>`; }
};
