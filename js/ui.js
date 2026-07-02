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

    // first-run screen: pick a home country + name the agency before the world is generated
    showSetup() {
        const countries = (typeof REGIONS_BY_COUNTRY !== 'undefined') ? Object.keys(REGIONS_BY_COUNTRY) : ['Netherlands'];
        const opts = countries.map(c => `<option value="${c}">${c}</option>`).join('');
        const slides = [
            { icon: '🤝', title: "You're a football agent", text: "You don't manage a club — you build a stable of players. Discover talents, sign them as clients, and earn a cut of their wages and sponsorship deals as their careers take off." },
            { icon: '🕵️', title: 'Find the talent', text: "Hire scouts and post them to a region at home (or, with an International Scouting Licence, to a foreign league). Every few weeks they report young prospects. Better scouts — and stronger leagues — turn up better players." },
            { icon: '✍️', title: 'Sign your clients', text: "Approach a prospect to represent him, then negotiate his move and contract: the club, the role, the wage. From then on you collect commission on his wage and sponsorships every single week." },
            { icon: '📈', title: 'Game time makes them grow', text: "Players improve mainly by playing. Steer your youngsters to the right club and role — or out on loan — so they get regular minutes and approach their potential. Rising ability means bigger contracts, bigger fees and a bigger cut for you." },
            { icon: '🏢', title: 'Grow your agency', text: "Wins and big moves build your reputation, which unlocks bigger clients, more scouts and better facilities. Reinvest your commission in Agency upgrades to develop players faster and scout further afield." },
            { icon: '🗓️', title: 'Play week by week', text: "Hit “Advance week” to roll matches, offers, development and scouting forward. Deals happen in the transfer windows (weeks 1–6 and 21–25). Keep an eye on your inbox for offers, scout reports and the end-of-season review." }
        ];
        const el = document.createElement('div');
        el.id = 'setupOverlay'; el.className = 'setup-overlay';
        el.innerHTML = `<div class="setup-card">
            <h1>⚽ Football Agent Manager</h1>
            <div class="howto">
                <div class="howto-label">How to play</div>
                <div class="howto-slide" id="howtoSlide"></div>
                <div class="howto-nav">
                    <button class="howto-btn" id="htPrev" aria-label="Previous">◀</button>
                    <div class="howto-dots" id="htDots"></div>
                    <button class="howto-btn" id="htNext" aria-label="Next">▶</button>
                </div>
            </div>
            <div class="setup-form">
                <label class="field-label">Agency name</label>
                <input id="setupName" class="setup-input" type="text" maxlength="32" placeholder="e.g. Oranje Sports Management" />
                <label class="field-label">Home country</label>
                <select id="setupCountry" class="filter-select wide">${opts}</select>
                <p class="hint">Your home country sets the talents you start with and the regions your scouts can cover. You can unlock other countries later with an International Scouting Licence.</p>
                <button class="btn-primary lg" id="setupStart">Start your agency ▶</button>
            </div>
        </div>`;
        document.body.appendChild(el);

        // how-to slideshow
        let idx = 0;
        const renderSlide = () => {
            const s = slides[idx];
            document.getElementById('howtoSlide').innerHTML = `<div class="howto-icon">${s.icon}</div><h3>${s.title}</h3><p>${s.text}</p>`;
            const dots = document.getElementById('htDots');
            dots.innerHTML = slides.map((_, i) => `<span class="ht-dot ${i === idx ? 'on' : ''}" data-i="${i}"></span>`).join('');
            dots.querySelectorAll('.ht-dot').forEach(d => d.addEventListener('click', () => { idx = +d.dataset.i; renderSlide(); }));
            document.getElementById('htPrev').disabled = idx === 0;
            const next = document.getElementById('htNext');
            next.textContent = idx === slides.length - 1 ? '↻' : '▶';
            next.title = idx === slides.length - 1 ? 'Back to start' : 'Next';
        };
        document.getElementById('htPrev').addEventListener('click', () => { if (idx > 0) { idx--; renderSlide(); } });
        document.getElementById('htNext').addEventListener('click', () => { idx = (idx + 1) % slides.length; renderSlide(); });
        renderSlide();

        document.getElementById('setupStart').addEventListener('click', () => {
            const name = document.getElementById('setupName').value;
            const country = document.getElementById('setupCountry').value;
            GameState.startNewGame(country, name);
            el.remove();
            this.init();
        });
    },

    // ---------- formatting ----------
    money(n) { return Math.round(n || 0).toLocaleString('en-US'); },
    abilityClass(a) { return a >= 80 ? 'ability-elite' : a >= 65 ? 'ability-great' : a >= 50 ? 'ability-good' : a >= 35 ? 'ability-average' : 'ability-low'; },
    relClass(r) { return r >= 65 ? 'rel-good' : r >= 45 ? 'rel-ok' : 'rel-bad'; },
    moraleColor(v) { return v >= 66 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444'; },
    clubPosLine(clubId) {
        const r = (typeof League !== 'undefined' && League.clubPosition) ? League.clubPosition(clubId) : null;
        if (!r) return '';
        const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
        return ` <span class="pos-tag" title="${r.divName} table">${ord(r.pos)}/${r.total}${r.played ? ` · ${r.pts}pts` : ''}</span>`;
    },
    moraleAvg(p) { const m = p.morale || {}; return Math.round(((m.club || 0) + (m.time || 0) + (m.wage || 0) + (m.agent || 0)) / 4); },
    moraleSmiley(p) {
        const v = this.moraleAvg(p);
        let color, mouth, label;
        if (v < 30) { color = '#ef4444'; mouth = 'M6 13 Q10 10 14 13'; label = 'Unhappy'; }            // frown
        else if (v <= 55) { color = '#f59e0b'; mouth = 'M6 12.5 L14 12.5'; label = 'Restless'; }        // neutral
        else if (v <= 75) { color = '#4ade80'; mouth = 'M6 11.5 Q10 14.5 14 11.5'; label = 'Content'; }  // smile
        else { color = '#15803d'; mouth = 'M5.5 11 Q10 15.5 14.5 11'; label = 'Delighted'; }             // big smile
        return `<span class="morale-smiley" title="Morale: ${label}"><svg viewBox="0 0 20 20" width="22" height="22" aria-label="${label}">
            <circle cx="10" cy="10" r="9" fill="${color}"/>
            <circle cx="7" cy="8" r="1.3" fill="#fff"/><circle cx="13" cy="8" r="1.3" fill="#fff"/>
            <path d="${mouth}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></span>`;
    },
    contractText(p) { return p.contractUntilSeason ? 'until end of ' + GameState.seasonLabelFor(p.contractUntilSeason) : '—'; },
    // a player who signed in the off-season is shown as "joining X" until the new season starts
    clubStatusName(p, withDiv) {
        if (p._joinSeason && p._joinSeason > GameState.seasonStartYear && p.joiningClubId) {
            const c = Clubs.getClubById(p.joiningClubId);
            return c ? 'joining ' + c.name : 'joining a new club';
        }
        const c = Clubs.getClubById(p.clubId);
        if (!c) return 'Free agent';
        return withDiv ? `${c.name} (${c.divisionName})` : c.name;
    },
    ratingClass(v) { if (!v) return ''; return v < 6 ? 'rating-red' : v < 7 ? 'rating-yellow' : v < 8 ? 'rating-lgreen' : v < 9 ? 'rating-dgreen' : 'rating-blue'; },
    rating(v) { return v ? `<span class="rating ${this.ratingClass(v)}">${v.toFixed(2)}</span>` : '<span class="muted">—</span>'; },
    clubName(id) {
        if (typeof id === 'string' && id.indexOf('u21') === 0) { const parent = id.split(':')[1], c = parent && Clubs.getClubById(parent); return c ? youthTeamName(c) : 'U21'; }
        const c = Clubs.getClubById(id); if (c) return c.name;
        if (typeof League !== 'undefined' && League.teamName) return League.teamName(id);
        return id;
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
           scouts: () => this.renderScouts(), agency: () => this.renderAgency(), inbox: () => this.renderInbox(), leagues: () => this.renderLeagues(),
           clienthist: () => this.renderClientHistory(), finance: () => this.renderFinance() }[this.view] || (() => {}))();
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
        const dir = this._clientDir || 'desc';
        const filter = this._clientFilter || 'all';
        const tot = p => seasonTotals(p, GameState.seasonStartYear);
        // attention helpers
        const hasOffer = p => GameState.inbox.some(m => (m.kind === 'transfer' || m.kind === 'loan' || m.kind === 'renewal') && m.offer && m.offer.playerId === p.id);
        const hasSponsor = p => GameState.inbox.some(m => m.kind === 'sponsor' && m.offer && m.offer.playerId === p.id);
        const isInjured = p => !!p.injury;
        const filters = { all: () => true, offers: hasOffer, sponsor: hasSponsor, injured: isInjured };
        // sort VALUES (higher = "more"); direction applied afterwards
        const vals = {
            ability: p => p.ability,
            age: p => p.age,
            rating: p => tot(p).avg,
            apps: p => tot(p).apps,
            contract: p => Agency.contractSeasonsLeft(p),
            wage: p => p.wage,
            morale: p => this.moraleAvg(p),
        };
        const vf = vals[sort] || vals.ability;
        const shown = clients.filter(filters[filter] || filters.all);
        const sorted = shown.slice().sort((a, b) => dir === 'desc' ? vf(b) - vf(a) : vf(a) - vf(b));

        const opt = (k, l) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${l}</option>`;
        const chip = (k, l) => {
            const counts = { offers: clients.filter(hasOffer).length, sponsor: clients.filter(hasSponsor).length, injured: clients.filter(isInjured).length };
            const n = k === 'all' ? clients.length : counts[k];
            return `<button class="chip-toggle ${filter === k ? 'on' : ''}" onclick="UI.setClientFilter('${k}')">${l}${n ? ` <span class="chip-count">${n}</span>` : ''}</button>`;
        };
        body.innerHTML = `<div class="view-header"><div><h2>My clients</h2><p class="muted">${clients.length}/${Agency.capacity()} represented</p></div>
            <div class="sort-bar">Sort: <select class="filter-select" onchange="UI.setClientSort(this.value)">
                ${opt('ability', 'Ability')}${opt('age', 'Age')}${opt('rating', 'Avg rating')}${opt('apps', 'Appearances')}${opt('contract', 'Contract left')}${opt('wage', 'Wage')}${opt('morale', 'Happiness')}
            </select><button class="btn-secondary sm dir-toggle" title="Reverse order" onclick="UI.toggleClientDir()">${dir === 'desc' ? '▼ High→Low' : '▲ Low→High'}</button></div></div>
            <div class="filter-chips">Show: ${chip('all', 'All')}${chip('offers', 'Transfer / loan / contract')}${chip('sponsor', 'Sponsor offers')}${chip('injured', 'Injuries')}</div>
            ${sorted.length ? `<div class="cards-grid">${sorted.map(p => this.playerCard(p, true)).join('')}</div>` : '<div class="empty"><p class="muted">No clients match this filter right now.</p></div>'}`;
        body.querySelectorAll('[data-player]').forEach(el => el.addEventListener('click', () => this.openPlayer(el.dataset.player)));
    },
    setClientSort(v) { if (this._clientSort === v) { this.toggleClientDir(); return; } this._clientSort = v; this._clientDir = (v === 'age' || v === 'contract') ? 'asc' : 'desc'; this.renderClients(); },
    toggleClientDir() { this._clientDir = (this._clientDir || 'desc') === 'desc' ? 'asc' : 'desc'; this.renderClients(); },
    setClientFilter(f) { this._clientFilter = f; this.renderClients(); },

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
                <div class="card-sub">${p.nationalityFlag} ${p.position} · ${p.age}y · ${this.clubStatusName(p)}</div></div>
                <div class="card-head-right">${mine ? `<div class="card-morale">${this.moraleSmiley(p)}</div>` : ''}<div class="ovr ${this.abilityClass(p.ability)}">${p.ability}</div></div></div>
            <div class="card-rows">
                <div><span class="k">Role</span><span class="v">${roleLabel(p.squadRole, p.age)}</span></div>
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
        const list = GameState.players.filter(p => p.knownToAgent && p.agentId == null && !p.dismissedTalent && !p.archived && p.age <= 22).sort((a, b) => b.ability - a.ability);
        const body = document.getElementById('talentView');
        body.innerHTML = `<div class="view-header"><h2>Talent</h2><p class="muted">Young players you've come to know. Tap one to view him, or use ✕ to clear ones you're not chasing.</p></div>
            <div class="cards-grid">${list.length ? list.map(p => { const isNew = p.discoveredWeek != null && (GameState.absWeek() - p.discoveredWeek) < 3; return `<div class="talent-wrap">${this.playerCard(p, false)}${isNew ? '<span class="new-badge" title="Recently found">NEW</span>' : ''}<button class="talent-remove" title="Remove from list" onclick="event.stopPropagation();UI.removeTalent('${p.id}')">✕</button></div>`; }).join('') : '<div class="empty"><p>No known players yet.</p><p class="muted">Hire a scout to start finding talent.</p></div>'}</div>`;
        body.querySelectorAll('[data-player]').forEach(el => el.addEventListener('click', () => this.openPlayer(el.dataset.player)));
    },
    removeTalent(id) {
        const p = GameState.getPlayer(id);
        if (p && p.agentId == null) { p.dismissedTalent = true; p.knownToAgent = false; GameState.save(); this.renderTalent(); }
    },

    // ---------- Scouts ----------
    renderScouts() {
        const ag = GameState.agency;
        const hc = GameState.homeCountry || 'Netherlands';
        const homeRegions = regionsForCountry(hc);
        const hasLic = Agency.hasIntlLicence();
        const active = ag.scouts.map(s => {
            const scopePill = s.league
                ? `<span class="pill">🌍 ${(COMPETITIONS[s.league] || {}).name || s.league} · ${s.country}</span>`
                : s.region ? `<span class="pill">${regionName(s.region)}</span>` : '<span class="pill pill-warn">Unassigned</span>';
            const regionAssign = `<div class="assign-row"><select id="rg_${s.id}" class="filter-select">${homeRegions.map(r => `<option value="${r.id}" ${s.region === r.id ? 'selected' : ''}>${r.name} — €${this.money(Scouts.regionReportCost(r.id))}/report</option>`).join('')}</select>
                <button class="btn-secondary sm" onclick="UI.assignScoutRegion('${s.id}')">${s.region ? 'Reassign' : 'Assign'}</button></div>`;
            let intlAssign = '';
            if (hasLic) {
                const countries = Scouts.intlCountries();
                const selC = (s.country && countries.includes(s.country)) ? s.country : countries[0];
                const cOpts = countries.map(c => `<option value="${c}" ${selC === c ? 'selected' : ''}>${c}</option>`).join('');
                intlAssign = `<div class="assign-row intl"><span class="cap">🌍 International</span></div>
                    <div class="assign-row"><select id="intlC_${s.id}" class="filter-select" onchange="UI.onIntlCountry('${s.id}')">${cOpts}</select>
                    <select id="intlL_${s.id}" class="filter-select">${this._intlLeagueOptions(selC, s.league, s.quality)}</select>
                    <button class="btn-secondary sm" onclick="UI.assignScoutLeague('${s.id}')">Send</button></div>`;
            } else {
                intlAssign = `<div class="assign-row"><span class="hint">🌍 International scouting needs a licence (Agency tab).</span></div>`;
            }
            const ageSel = `<div class="assign-row"><label class="cap">Max talent age</label><select class="filter-select" onchange="UI.setScoutAge('${s.id}', this.value)">${[15, 16, 17, 18, 19, 20, 21, 22].map(a => `<option value="${a}" ${(s.maxTalentAge || 22) === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>`;
            const assigned = s.region || s.league;
            return `<div class="card"><div class="card-head"><div><div class="card-title">${s.name}</div><div class="card-sub">${s.title} · ${scopePill}</div></div><div class="ovr ${this.abilityClass(s.quality)}">${s.quality}</div></div>
                <div class="card-rows"><div><span class="k">Wage</span><span class="v">€${this.money(s.weeklyCost)}/wk</span></div><div><span class="k">Next report</span><span class="v">${assigned ? ('~' + s.weeksUntilFind + ' wk') : 'idle · spots ~1–2/yr'}</span></div></div>
                ${regionAssign}${intlAssign}${ageSel}
                <button class="btn-ghost danger" onclick="UI.releaseScout('${s.id}')">Release</button></div>`;
        }).join('') || '<div class="empty"><p>No scouts hired.</p></div>';
        const cat = Scouts.market().map(o => `<div class="card"><div class="card-head"><div><div class="card-title">${o.name}</div><div class="card-sub">${o.title}</div></div><div class="ovr ${this.abilityClass(o.quality)}">${o.quality}</div></div>
            <div class="card-rows"><div><span class="k">Wage</span><span class="v">€${this.money(o.weeklyCost)}/wk</span></div><div><span class="k">Find quality</span><span class="v">${o.quality < 18 ? 'Very low' : o.quality < 35 ? 'Low' : o.quality < 55 ? 'Decent' : 'High'}</span></div></div>
            <button class="btn-primary" onclick='UI.hireScout(${JSON.stringify(o).replace(/'/g, "&#39;")})'>Hire</button></div>`).join('');
        const regTable = homeRegions.map(r => `<div class="comp-row"><span>${regionName(r.id)} <span class="muted">${r.blurb}</span></span><span>€${this.money(Scouts.regionReportCost(r.id))}</span></div>`).join('');
        const licLine = hasLic
            ? `<p class="hint">🌍 International Scouting Licence active (${Agency.intlLicenceWeeksLeft()} weeks left). Assign an unassigned scout to a foreign league above.</p>`
            : `<p class="hint">🌍 Buy an International Scouting Licence in the Agency tab to send scouts abroad (by league).</p>`;
        document.getElementById('scoutsView').innerHTML = `<div class="view-header"><h2>Scouts</h2><p class="muted">Hire a scout, then assign him to a home region — or, with a licence, to a foreign league. A report (2–3 talents) arrives every 6–7 weeks and costs a per-region/league fee; a scout's quality drives how good they are.</p></div>
            <div class="panel"><h3>Your scouts · €${this.money(Agency.weeklyExpenses())}/wk</h3>${licLine}<div class="cards-grid">${active}</div></div>
            <div class="panel"><h3>Available to hire</h3><p class="hint">Better scouts only take you seriously as your reputation grows. This shortlist refreshes every 2 weeks — a scout you hire isn't replaced until the next refresh.</p><div class="cards-grid">${cat}</div></div>
            <div class="panel"><h3>${hc} region cost <span class="muted">(per report)</span></h3><p class="hint">Assigning a scout is free; you pay this fee each time he delivers a report. A scout only finds players in his region, and stronger talents land at that region's bigger clubs (with exceptions). Prestigious regions cost more.</p><div class="comp-break">${regTable}</div></div>`;
    },
    _intlLeagueOptions(country, selectedDiv, scoutQuality) {
        const divs = (typeof COUNTRY_DIVS !== 'undefined' && COUNTRY_DIVS[country]) || [];
        return divs.map(d => {
            const minQ = Scouts.minScoutQualityFor(d);
            const tooLow = scoutQuality != null && scoutQuality < minQ;
            return `<option value="${d}" ${selectedDiv === d ? 'selected' : ''} ${tooLow ? 'disabled' : ''}>${(COMPETITIONS[d] || {}).name || d} — €${this.money(Scouts.intlLeagueCost(d))}/report · needs ${minQ}${tooLow ? ' 🔒' : ''}</option>`;
        }).join('');
    },
    onIntlCountry(scoutId) {
        const c = document.getElementById('intlC_' + scoutId); const l = document.getElementById('intlL_' + scoutId);
        const s = GameState.agency.scouts.find(x => x.id === scoutId);
        if (c && l) l.innerHTML = this._intlLeagueOptions(c.value, null, s ? s.quality : null);
    },
    assignScoutLeague(scoutId) {
        const c = document.getElementById('intlC_' + scoutId), l = document.getElementById('intlL_' + scoutId);
        if (!c || !l) return;
        const r = Scouts.assignLeague(scoutId, c.value, l.value); GameState.save(); this.refreshTopbar(); this.renderScouts();
        if (!r.ok) alert(r.message);
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
            <div class="panel"><h3>🌍 International Scouting Licence</h3>${(() => {
                const has = Agency.hasIntlLicence();
                const status = has ? `<span class="pill">Active · ${Agency.intlLicenceWeeksLeft()} weeks left</span>` : `<span class="pill pill-warn">Not held</span>`;
                return `<div class="upg-grid"><div class="upg-card ${has ? 'owned' : ''}"><div class="upg-body">
                    <div class="upg-name">International Scouting Licence ${status}</div>
                    <div class="upg-meta">Lets you send unassigned scouts abroad to scout foreign leagues (by league, not region). Valid 3 seasons (156 weeks).</div>
                    <button class="btn-primary sm" onclick="UI.buyIntlLicence()">${has ? 'Extend' : 'Buy'} — €${this.money(Agency.INTL_LICENCE_COST)}</button>
                </div></div></div>`;
            })()}</div>
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
    buyIntlLicence() { const r = Agency.buyIntlLicence(); GameState.save(); this.refreshTopbar(); this.renderAgency(); alert(r.message); },

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
    rejectPlayerOffers(pid) {
        const p = GameState.getPlayer(pid);
        const offers = GameState.inbox.filter(m => (m.kind === 'transfer' || m.kind === 'loan') && m.offer && m.offer.playerId === pid);
        if (!offers.length) return;
        if (!confirm(`Reject all ${offers.length} transfer/loan offer(s) for ${p ? p.name : 'this player'}? Sponsor and renewal offers are kept.`)) return;
        offers.forEach(m => GameState.removeMail(m.id));
        GameState.save(); this.refreshTopbar(); this.renderPlayer();
    },
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
            <div class="mail-body">${this.linkifyPlayers(m.body || '')}</div>
            <div class="modal-actions"><button class="btn-secondary" onclick="UI.dismissMail('${m.id}')">Dismiss</button><button class="btn-primary" onclick="UI.closeModal()">Close</button></div>`);
    },
    // make player names inside an email body tappable (links to the player's card)
    linkifyPlayers(html) {
        if (!html) return html;
        const cands = GameState.players.filter(p => p.agentId === 'me' || p.everClient || p.knownToAgent);
        const seen = new Set(); const list = [];
        cands.sort((a, b) => b.name.length - a.name.length).forEach(p => { if (p.name && !seen.has(p.name)) { seen.add(p.name); list.push(p); } });
        let out = html;
        list.forEach(p => {
            const esc = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp('(^|[^\\w>])(' + esc + ')(?![\\w<])', 'g');
            out = out.replace(re, (mm, pre, nm) => `${pre}<span class="pl-link" onclick="UI.openPlayer('${p.id}')">${nm}</span>`);
        });
        return out;
    },
    dismissMail(id) { GameState.removeMail(id); GameState.save(); this.refreshTopbar(); this.closeModal(); if (this.view === 'inbox') this.renderInbox(); },

    mailTransfer(m) {
        const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId), from = Clubs.getClubById(o.fromClubId);
        if (!p || !to) { this.dismissMail(m.id); return; }
        this._ctx = { mailId: m.id, pkgRound: 1, agreed: null };
        const bonusMax = Math.max(Agency.maxSigningBonus(p, o.proposedWage), Agency.agentFeeCap(o.transferFee));
        const cut = w => Math.round(w * p.wageCommission / 100);
        const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
        const fromLeague = Agency.isFreeAgent(p) || !from ? 'free agent (no club)' : `${from.name}, ${from.divisionName}`;
        const feeLine = Agency.isFreeAgent(p) ? 'Free transfer (he is a free agent).' : `Agreed fee <strong>€${this.money(o.transferFee)}</strong>.`;
        this.openModal(`<h2>🔄 ${p.name} → ${to.name}</h2>
            <p class="greet">“${Agency.greetingFor(to.id)}”</p>
            <div class="callout neg-facts">
                <div><span class="k">Player's current wage</span><span class="v">€${this.money(p.wage)}/wk</span></div>
                <div><span class="k">Current club</span><span class="v">${fromLeague}${this.clubPosLine(o.fromClubId)}</span></div>
                <div><span class="k">Bidding club</span><span class="v">${to.name}, ${to.divisionName}${this.clubPosLine(to.id)}</span></div>
            </div>
            <p class="muted">${p.ability} OVR · ${p.age}y · ${feeLine}${o.initiatedByAgent ? ' · you pitched this' : ''}</p>
            <p>Put your whole proposal on the table — wage, role, length and signing bonus together. They'll answer with one improved counter, or tell you it's almost there. (A shorter contract can free up more wage.)</p>
            <div class="slider-block"><label>Wage at ${to.name}: <strong id="wgVal">€${this.money(o.proposedWage)}/wk</strong> <span class="cap">(your cut: €<span id="wgCut">${this.money(cut(o.proposedWage))}</span>/wk)</span></label>
                <input type="range" id="wgSlider" min="${o.proposedWage}" max="${wageMax}" step="10" value="${o.proposedWage}"></div>
            <div class="slider-block"><label>Squad role <span class="cap">(more minutes = faster development)</span></label>
                <select id="roleSel" class="filter-select wide">${ROLE_ORDER.map(r => `<option value="${r}" ${r === (o.role || 'rotation') ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>
            <div class="slider-block"><label>Contract length: <strong id="tmVal">3</strong> season(s)</label><input type="range" id="tmSlider" min="1" max="6" value="3"></div>
            <div class="slider-block"><label>Your agent's fee (Handgeld): <span class="cap">(up to €5m on big transfers)</span> €<strong id="sbVal">0</strong></label><input type="range" id="sbSlider" min="0" max="${bonusMax}" step="${Math.max(10, Math.round(bonusMax / 50))}" value="0"></div>
            ${(() => { const others = GameState.inbox.filter(x => x.kind === 'transfer' && x.offer.playerId === p.id && x.id !== m.id); return others.length ? `<div class="callout">Competing bids: ${others.map(x => `<a href="#" onclick="UI.openMail('${x.id}');return false;">${Clubs.getClubById(x.offer.toClubId)?.name} · ${ROLE_LABEL[x.offer.role || 'rotation']}</a>`).join(' · ')}</div>` : ''; })()}
            <div class="modal-actions"><button class="btn-ghost danger" onclick="UI.rejectMail('${m.id}')">Reject</button><button class="btn-secondary" onclick="UI.proposePackage('${to.id}')">Propose package</button></div>
            <div id="modalResult"></div>`);
        document.getElementById('tmSlider').addEventListener('input', e => document.getElementById('tmVal').textContent = e.target.value);
        document.getElementById('sbSlider').addEventListener('input', e => document.getElementById('sbVal').textContent = this.money(+e.target.value));
        document.getElementById('wgSlider').addEventListener('input', e => { const w = +e.target.value; document.getElementById('wgVal').textContent = '€' + this.money(w) + '/wk'; document.getElementById('wgCut').textContent = this.money(cut(w)); });
    },
    _readPkg() {
        return {
            wage: +document.getElementById('wgSlider').value,
            role: document.getElementById('roleSel').value,
            term: +document.getElementById('tmSlider').value,
            bonus: +document.getElementById('sbSlider').value
        };
    },
    proposePackage(clubId) {
        const club = Clubs.getClubById(clubId), m = GameState.inbox.find(x => x.id === this._ctx.mailId), p = GameState.getPlayer(m.offer.playerId);
        const pkg = this._readPkg();
        pkg.fee = m.offer.transferFee;
        const r = Agency.evaluateTransfer(p, club, pkg, this._ctx.pkgRound++);
        const res = document.getElementById('modalResult');
        const c = r.counter;
        const pkgLine = `€${this.money(c.wage)}/wk · ${ROLE_LABEL[c.role]} · ${c.term}yr · €${this.money(c.bonus)} bonus`;
        if (r.status === 'accept') {
            const ar = Agency.acceptTransfer(m, c.wage, c.role, c.term, c.bonus); GameState.save(); this.refreshTopbar();
            res.innerHTML = `<div class="result ok">${r.message}<br><span class="muted">${ar.message}</span></div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView('clients')">Done</button></div>`;
        } else {
            const label = r.status === 'final' ? 'Accept final package' : (r.status === 'close' ? 'Accept their package' : 'Accept their package');
            res.innerHTML = `<div class="result ${r.status === 'close' ? 'info' : 'bad'}">${r.message}<br><span class="muted">Their package: ${pkgLine}</span></div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="UI.acceptPackage('${clubId}',${c.wage},'${c.role}',${c.term},${c.bonus})">${label}</button>
                    <span class="cap">…or adjust the sliders and propose again.</span>
                </div>`;
        }
    },
    acceptPackage(clubId, wage, role, term, bonus) {
        const m = GameState.inbox.find(x => x.id === this._ctx.mailId); if (!m) return this.closeModal();
        const r = Agency.acceptTransfer(m, wage, role, term, bonus); GameState.save(); this.refreshTopbar();
        document.getElementById('modalResult').innerHTML = `<div class="result ${r.ok ? 'ok' : 'bad'}">${r.message}</div>${r.ok ? '<div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView(\'clients\')">Done</button></div>' : ''}`;
    },
    doAcceptTransfer(mailId) {   // kept for any legacy callers
        const m = GameState.inbox.find(x => x.id === mailId); if (!m) return this.closeModal();
        const pkg = this._readPkg();
        const r = Agency.acceptTransfer(m, pkg.wage, pkg.role, pkg.term, pkg.bonus);
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
                <div><span class="k">Club</span><span class="v">${club.name}, ${club.divisionName}${this.clubPosLine(club.id)}</span></div>
                <div><span class="k">Role · until</span><span class="v">${roleLabel(p.squadRole, p.age)} · ${GameState.seasonLabelFor(p.contractUntilSeason)}</span></div>
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
            <p class="muted">${to.name} (${to.divisionName})${this.clubPosLine(to.id)}${p.clubId ? ` · from ${Clubs.getClubById(p.clubId)?.name || ''}${this.clubPosLine(p.clubId)}` : ''} · they propose: <strong>${ROLE_LABEL[offered]}</strong></p>
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
    openHistoryPlayer(id) { this._ctx = { playerId: id, tab: 'history', expanded: {}, histView: true }; this.renderPlayer(); },
    setTab(tab) { this._ctx.tab = tab; this.renderPlayer(); },
    renderPlayer() {
        const p = GameState.getPlayer(this._ctx.playerId); if (!p) return;
        const mine = p.agentId === 'me';
        const histView = !!this._ctx.histView;
        const tabs = histView ? ['history', 'injuries', 'development', 'potential']
            : (mine ? ['overview', 'potential', 'morale', 'injuries', 'contract', 'development', 'history'] : ['overview', 'potential', 'development', 'history']);
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
            <p class="muted">${p.nationalityFlag} ${p.nationality} · ${p.position} · ${p.age}y · ${this.clubStatusName(p, true)}</p></div>
            <div class="ovr lg ${this.abilityClass(p.ability)}">${p.ability}</div></div>
            <div class="tabbar">${tabBar}</div><div class="tab-body">${bodyHtml}</div><div id="modalResult"></div>`);
    },

    tabOverview(p, mine) {
        const club = Clubs.getClubById(p.clubId), tot = seasonTotals(p, GameState.seasonStartYear);
        const offers = GameState.inbox.filter(m => m.offer && m.offer.playerId === p.id);
        const rejectable = offers.filter(m => m.kind === 'transfer' || m.kind === 'loan').length;
        const offerHtml = offers.length ? `<h3>Open offers</h3><div class="offer-mini-list">${offers.map(m =>
            `<div class="offer-mini"><span>${KIND_ICON[m.kind]} ${m.subject}</span><button class="btn-secondary sm" onclick="UI.openMail('${m.id}')">Open</button></div>`).join('')}</div>${rejectable > 1 ? `<div class="offer-reject-all"><button class="btn-ghost sm danger" onclick="UI.rejectPlayerOffers('${p.id}')">Reject all ${rejectable} transfer/loan offers</button></div>` : ''}` : '';
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
                <div class="detail-stat"><div class="ds-label">Role</div><div class="ds-value sm">${roleLabel(p.squadRole, p.age)}</div></div>
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
            ${reveal}
            ${typeof Debug !== 'undefined' ? Debug.controlsHTML() : ''}`;
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
        let loanHtml = '';
        if (p.onLoanAt && !isU21Loan(p)) {
            const borrower = Clubs.getClubById(p.onLoanAt);
            const dur = p.loanMid ? `until the winter window of ${GameState.seasonLabelFor(p.loanUntilSeason)}` : `until the end of ${GameState.seasonLabelFor(p.loanUntilSeason)}`;
            loanHtml = `<h3>Loan spell</h3>
                <div class="detail-grid">
                    <div class="detail-stat"><div class="ds-label">On loan at</div><div class="ds-value sm">${borrower ? borrower.name : this.clubName(p.onLoanAt)}</div></div>
                    <div class="detail-stat"><div class="ds-label">Duration</div><div class="ds-value sm">${dur}</div></div>
                    <div class="detail-stat"><div class="ds-label">Role there</div><div class="ds-value sm">${ROLE_LABEL[p.loanRole] || roleLabel(p.loanRole, p.age)}</div></div>
                    <div class="detail-stat"><div class="ds-label">Parent club</div><div class="ds-value sm">${club ? club.name : '—'}</div></div>
                </div>`;
        }
        const sponsors = GameState.inbox.filter(m => m.kind === 'sponsor' && m.offer.playerId === p.id);
        const sponsorHtml = sponsors.length ? `<h3>Sponsorship offers</h3>${sponsors.map(m => `<div class="offer-mini"><span>💰 ${(SPONSOR_LABEL[m.offer.level] || 'Sponsor')} interest — ${(m.offer.options ? m.offer.options.length : 1)} option(s)</span><button class="btn-secondary sm" onclick="UI.openMail('${m.id}')">Review</button></div>`).join('')}` : '';
        const deals = (p.sponsorDeals || []).filter(d => d.untilSeason >= GameState.seasonStartYear);
        const activeSponsorHtml = deals.length
            ? `<h3>Active sponsor deals</h3><table class="fin-table"><thead><tr><th>Sponsor</th><th>Per week</th><th>Annual</th><th>Until</th></tr></thead><tbody>${deals.map(d => `<tr><td>${d.company}</td><td>€${this.money(d.weekly)}</td><td>€${this.money(d.annual || 0)}</td><td>end of ${GameState.seasonLabelFor(d.untilSeason)}</td></tr>`).join('')}</tbody></table>`
            : '<h3>Active sponsor deals</h3><p class="muted">No sponsor deals signed yet.</p>';
        const listBtn = p.transferListed
            ? `<span class="pill pill-list">Transfer-listed</span>`
            : `<button class="btn-secondary" onclick="UI.reqTransferList('${p.id}')">Ask ${club ? club.name : 'club'} to transfer-list ${p.name}</button>`;
        const fee = Agency.releaseFee(p);
        return `${loanHtml}<div class="detail-grid">
                <div class="detail-stat"><div class="ds-label">Wage</div><div class="ds-value">€${this.money(p.wage)}<span class="sc-unit">/wk</span></div></div>
                <div class="detail-stat"><div class="ds-label">Until</div><div class="ds-value sm">${this.contractText(p)}</div></div>
                <div class="detail-stat"><div class="ds-label">Role</div><div class="ds-value sm">${roleLabel(p.squadRole, p.age)}</div></div>
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
            ${activeSponsorHtml}
            ${sponsorHtml}
            <h3>Gifts <span class="muted">(boost agent morale — pricier for top earners)</span></h3>
            <div class="action-row">
                <button class="btn-secondary" onclick="UI.gift('${p.id}','small')">Small · €${this.money(Agency.giftCost('small', p))}</button>
                <button class="btn-secondary" onclick="UI.gift('${p.id}','medium')">Medium · €${this.money(Agency.giftCost('medium', p))}</button>
                <button class="btn-secondary" onclick="UI.gift('${p.id}','large')">Large · €${this.money(Agency.giftCost('large', p))}</button>
            </div>
            <h3>End representation</h3>
            <p class="hint">${p.repExpired ? 'His representation term has run its course — you can release him at <strong>no cost</strong>.' : `Releasing a client before the term ends means buying out the contract: wage × remaining weeks × your commission = <strong>€${this.money(fee)}</strong>. Once the term is up, release becomes free.`}</p>
            <div class="action-row"><button class="btn-ghost danger" onclick="UI.release('${p.id}')">Release ${p.name} (€${this.money(fee)})</button></div>`;
    },

    tabDevelopment(p) {
        const now = GameState.absWeek();
        const tOf = h => (h.t != null ? h.t : Math.round((h.age != null ? h.age : p.age) * 52)); // back-compat
        const ageAt = t => p.age - (now - t) / 52;

        const abil = (p.history.ability || []).slice();
        if (!abil.length || abil[abil.length - 1].value !== p.ability) abil.push({ t: now, value: p.ability });
        const wage = (p.history.wage || []).slice();
        if (!wage.length || wage[wage.length - 1].value !== p.wage) wage.push({ t: now, value: p.wage });
        const fees = (p.history.fees || []).map(h => ({ x: tOf(h), y: h.value }));

        const ax = abil.map(h => ({ x: tOf(h), y: h.value }));
        const wx = wage.map(h => ({ x: tOf(h), y: h.value }));
        const xMin = Math.min(ax[0].x, wx[0].x, fees.length ? fees[0].x : ax[0].x);
        const xMax = now + 4;                                   // a little breathing room on the right
        // vertical gridline + label at each integer age year within range
        const yearTicks = [];
        for (let a = Math.floor(ageAt(xMin)); a <= Math.ceil(ageAt(xMax)); a++) {
            const t = now - (p.age - a) * 52;
            if (t >= xMin - 1 && t <= xMax + 1) yearTicks.push({ v: t, label: a + 'y' });
        }

        // --- Ability: ~20-point window that grows if he's improved more ---
        const aLo = Math.min(...ax.map(d => d.y)), aHi = Math.max(...ax.map(d => d.y));
        const span = Math.max(20, Math.ceil((aHi - aLo + 4) / 5) * 5);
        let yLo = Math.max(1, Math.floor((aLo - 2) / 5) * 5);
        let yHi = Math.min(99, yLo + span);
        if (yHi - yLo < span) yLo = Math.max(1, yHi - span);

        // --- Wage: grid step by level, with headroom below the lowest wage ---
        const wHi0 = Math.max(...wx.map(d => d.y)), wLo0 = Math.min(...wx.map(d => d.y));
        const wStep = wHi0 < 5000 ? 500 : wHi0 < 15000 ? 1000 : 5000;
        const wLo = Math.max(0, Math.floor(wLo0 / wStep) * wStep - wStep);   // space under the first wage
        const wHi = Math.ceil((wHi0 + wStep * 0.4) / wStep) * wStep;

        const abilityChart = this.xyChart(ax, '#2563eb', {
            xMin, xMax, xTicks: yearTicks, yMin: yLo, yMax: yHi, yStep: 5,
            fmtY: v => Math.round(v)
        });
        const wageChart = this.xyChart(wx, '#10b981', {
            xMin, xMax, xTicks: yearTicks, yMin: wLo, yMax: wHi, yStep: wStep,
            fmtY: v => '€' + this.money(v)
        });
        let feeChart = '<p class="muted">No transfers yet.</p>';
        if (fees.length) {
            const fHi0 = Math.max(...fees.map(d => d.y));
            const fStep = this._niceStep(fHi0);
            feeChart = this.xyChart(fees, '#8b5cf6', {
                xMin, xMax, xTicks: yearTicks, yMin: 0, yMax: Math.ceil((fHi0 + fStep * 0.4) / fStep) * fStep, yStep: fStep,
                fmtY: v => '€' + this.money(v), dotsOnly: fees.length < 2
            });
        }
        return `<h3>Ability <span class="muted">(over career)</span></h3>${abilityChart}
            <h3>Wage <span class="muted">(€/wk) — now €${this.money(p.wage)}</span></h3>${wageChart}
            <h3>Transfer fees achieved</h3>${feeChart}
            <p class="hint">A faint line marks each age year. The ability window spans ~20 points and widens if he develops further.</p>`;
    },
    _niceStep(hi) {
        const targets = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
        for (const t of targets) if (hi / t <= 5) return t;
        return 5000000;
    },

    _seasonLeagueName(st) {
        if (!st || !st.comps) return '';
        for (const k of Object.keys(st.comps)) {
            const c = COMPETITIONS[k] || COMPETITIONS[(k + '').toUpperCase()];
            if (c && c.type === 'league' && (st.comps[k].apps || 0) > 0) return c.name;
        }
        // fall back to any league comp present even with 0 apps
        for (const k of Object.keys(st.comps)) {
            const c = COMPETITIONS[k] || COMPETITIONS[(k + '').toUpperCase()];
            if (c && c.type === 'league') return c.name;
        }
        return '';
    },
    honoursLine(p) {
        const parts = [];
        const tr = {};
        (p.trophies || []).forEach(t => { tr[t.compId] = (tr[t.compId] || 0) + 1; });
        Object.keys(tr).forEach(cid => parts.push(`🏆 ${compName(cid)}${tr[cid] > 1 ? ' ×' + tr[cid] : ''}`));
        const mv = {};
        (p.movements || []).forEach(m => { const k = m.type + ':' + m.division; mv[k] = (mv[k] || 0) + 1; });
        Object.keys(mv).forEach(k => {
            const [type, div] = k.split(':');
            const arrow = type === 'promo' ? '<span class="promo">▲</span>' : '<span class="releg">▼</span>';
            parts.push(`${arrow} ${compName(div)}${mv[k] > 1 ? ' ×' + mv[k] : ''}`);
        });
        return parts.length ? `<div class="honours">${parts.join(' &nbsp; ')}</div>` : '';
    },
    tabHistory(p) {
        const years = Object.keys(p.stats || {}).map(Number).sort((a, b) => b - a);
        if (!years.length) return '<p class="muted">No matches played yet.</p>';
        const gkP = p.position === 'GK';
        const gOrCsP = o => gkP ? `${o.cs || 0} cs` : `${o.goals} g`;
        const seasonBlocks = years.map(y => {
            const stints = seasonStints(p, y), t = seasonTotals(p, y), open = this._ctx.expanded[y];
            const troph = (p.trophies || []).filter(tr => tr.year === y);
            const gk = p.position === 'GK';
            const gOrCs = (o) => gk ? `${o.cs || 0} cs` : `${o.goals} g`;
            const totLine = `${t.apps} apps · ${gOrCs(t)} · ${t.assists} a · ${t.yellow}🟨 ${t.red}🟥 · ${this.rating(t.avg)}`;
            const endStint = stints[stints.length - 1];
            const endClub = endStint ? Clubs.getClubById(endStint.clubId) : null;
            const seasonLeague = this._seasonLeagueName(endStint);
            const endLabel = endStint ? `${this.clubName(endStint.clubId)}${seasonLeague ? ', ' + seasonLeague : (endClub ? ', ' + endClub.divisionName : '')}` : '';
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
                <span class="season-name"><span class="season-yr">${GameState.seasonLabelFor(y)} ${troph.length ? '🏆' : ''}</span>${endLabel ? `<span class="season-club">${endLabel}</span>` : ''}</span>
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
                    return `<div class="comp-row" ${click}><span class="comp-name">${this.clubLabel(m.clubId, m.loanEver, m.youth)}</span><span>${m.agg.apps} apps · ${gOrCsP(m.agg)} · ${m.agg.assists} a · ${this.rating(m.agg.avg)}</span></div>`;
                }).join('');
            } else {
                rows = careerByComp(p).sort((a, b) => b.agg.apps - a.agg.apps).map(m =>
                    `<div class="comp-row"><span class="comp-name">${compName(m.compId)}${m.youth ? ' <span class="loan-tag">youth</span>' : ''}</span><span>${m.agg.apps} apps · ${gOrCsP(m.agg)} · ${m.agg.assists} a · ${this.rating(m.agg.avg)}</span></div>`).join('');
            }
            careerInner = `<div class="comp-break">${toggle}${rows}</div>`;
        }
        const careerBlock = `<div class="season-block career"><div class="season-master" onclick="UI.toggleCareer()">
            <span class="season-name">Career total <span class="muted">(senior)</span></span>
            <span class="season-tot">${ct.apps} apps · ${gOrCsP(ct)} · ${ct.assists} a · ${this.rating(ct.avg)}</span>
            <span class="caret">${careerOpen ? '▾' : '▸'}</span></div>${careerInner}</div>`;
        return this.honoursLine(p) + seasonBlocks + careerBlock + '<p class="hint">Youth (U21) games are shown but excluded from senior totals.</p>';
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
    reqTransferList(id) { const r = Agency.requestTransferListing(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    toggleLL(id) { Agency.toggleLoanList(GameState.getPlayer(id)); GameState.save(); this.renderPlayer(); },
    reqLoan(id) { const r = Agency.requestLoan(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    sendU21(id) { const p = GameState.getPlayer(id); const reserve = reserveClubFor(p.clubId); const dest = reserve ? reserve.name : youthTeamName(p.clubId); if (!confirm(`Send ${p.name} to ${dest}? ${reserve ? "He'll feature in their league games and return to the senior side at season's end." : "He plays youth-league games (good for development) until the end of the season; these don't count toward senior appearances."}`)) return; const r = Agency.sendToU21(p); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqPromote(id) { const r = Agency.requestPromotion(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.renderPlayer(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqRenewal(id) { const r = Agency.requestRenewalTalks(GameState.getPlayer(id)); GameState.save(); this.refreshTopbar(); this.result(r.message, r.ok ? 'ok' : 'bad'); },
    gift(id, tier) { const r = Agency.giveGift(GameState.getPlayer(id), tier); GameState.save(); this.refreshTopbar(); this.renderPlayer(); alert(r.message); },
    release(id) {
        const p = GameState.getPlayer(id), fee = Agency.releaseFee(p);
        if (fee > GameState.agency.balance) { alert(`You can't afford to release ${p.name}. Buying out the contract costs €${this.money(fee)}, but your balance is €${this.money(GameState.agency.balance)}.`); return; }
        if (!confirm(`Release ${p.name}? You'll pay €${this.money(fee)} to buy out the contract.`)) return;
        const r = Agency.releasePlayer(p); GameState.save(); this.refreshTopbar();
        if (r.ok) { this.closeModal(); this.switchView('clients'); } else alert(r.message);
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
        if (r.status === 'accept') {
            Agency.signPlayer(p, w, s, t); GameState.save(); this.refreshTopbar();
            res.innerHTML = `<div class="result ok">${r.message}<br><span class="muted">${p.name} signed — ${w}% wage / ${s}% sponsor for ${t} season(s).</span></div><div class="modal-actions"><button class="btn-primary" onclick="UI.closeModal();UI.switchView('clients')">View clients</button></div>`;
        } else if (r.status === 'cold') {
            res.innerHTML = `<div class="result bad">${r.message}</div>`;
        } else if (r.status === 'walk') {
            res.innerHTML = `<div class="result bad">${r.message}<br><span class="muted">${p.name} won't talk terms for about ${r.weeks} weeks.</span></div><div class="modal-actions"><button class="btn-secondary" onclick="UI.closeModal()">Leave it</button></div>`;
        } else {
            const c = r.counter;
            const sugg = c.suggestTerm && c.suggestTerm > c.term
                ? `<br>💡 At <strong>${c.suggestTerm} seasons</strong> he'd take up to <strong>${c.suggestWage}%</strong> wage / <strong>${c.suggestSponsor}%</strong> sponsor.` : '';
            res.innerHTML = `<div class="result bad">${r.message}<br><span class="muted">At ${c.term} season(s) he'll accept at most <strong>${c.wage}%</strong> wage / <strong>${c.sponsor}%</strong> sponsor.</span>${sugg}</div>
                <div class="modal-actions">
                    ${c.suggestTerm && c.suggestTerm > c.term ? `<button class="btn-secondary" onclick="UI.bumpTerm(${c.suggestTerm})">Offer ${c.suggestTerm} seasons</button>` : ''}
                    <button class="btn-primary" onclick="UI.acceptSignCounter('${p.id}',${c.wage},${c.sponsor},${c.term})">Meet him at ${c.wage}%/${c.sponsor}% · ${c.term}y</button>
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
        const countries = (typeof COUNTRY_DIVS !== 'undefined') ? Object.keys(COUNTRY_DIVS) : ['Netherlands'];
        const country = this.filters.lgCountry && countries.includes(this.filters.lgCountry) ? this.filters.lgCountry : countries[0];
        this.filters.lgCountry = country;
        const cups = (typeof COUNTRY_CUPS !== 'undefined' && COUNTRY_CUPS[country]) || [];
        const tabs = [['tables', 'Tables'], ...cups, ['po', 'Play-offs']];
        let tab = this.filters.leagueTab || 'tables';
        if (!tabs.some(([k]) => k === tab)) { tab = 'tables'; this.filters.leagueTab = 'tables'; }
        const countrySel = `<select id="lgCountry" class="filter-select">${countries.map(c => `<option ${country === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`;
        const tabBar = tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'active' : ''}" onclick="UI.setLeagueTab('${k}')">${l}</button>`).join('');
        let section = '';
        if (tab === 'tables') {
            const divs = (typeof COUNTRY_DIVS !== 'undefined' && COUNTRY_DIVS[country]) || ['ERE', 'EED', 'TWD', 'DRD'];
            if (!divs.includes(this.filters.division)) this.filters.division = divs[0];
            const divOpts = divs.map(d => `<option value="${d}" ${this.filters.division === d ? 'selected' : ''}>${COMPETITIONS[d].name}</option>`).join('');
            section = `<div class="controls"><select id="lgDivision" class="filter-select">${divOpts}</select></div><div id="standings" class="panel">${this.standingsTable(this.filters.division)}</div>`;
        } else if (tab === 'beker') section = this.cupBekerView();
        else if (tab === 'kbek') section = this.cupKleineView();
        else if (tab === 'facup') section = this.cupFACupView();
        else if (tab === 'llc') section = this.cupLLCView();
        else if (tab === 'dfb') section = this.cupDFBView();
        else if (tab === 'lpokal') section = this.cupLandespokalView();
        else if (tab === 'cdr') section = this.cupCDRView();
        else if (tab === 'cfed') section = this.cupCFEDView();
        else section = this.playoffsView();
        const finished = GameState.league && GameState.league.finished;
        body.innerHTML = `<div class="view-header"><div class="vh-row"><h2>Competitions</h2>${countrySel}</div><p class="muted">${finished ? 'Season ' + GameState.seasonLabel() + ' — complete' : 'Season ' + GameState.seasonLabel()}</p></div>
            <div class="tabbar">${tabBar}</div>${section}`;
        const cSel = document.getElementById('lgCountry');
        if (cSel) cSel.addEventListener('change', e => { this.filters.lgCountry = e.target.value; this.filters.division = null; this.filters.leagueTab = 'tables'; this.renderLeagues(); });
        if (tab === 'tables') {
            const dSel = document.getElementById('lgDivision');
            if (dSel) dSel.addEventListener('change', e => { this.filters.division = e.target.value; document.getElementById('standings').innerHTML = this.standingsTable(this.filters.division); });
        }
    },
    setLeagueTab(t) { this.filters.leagueTab = t; this.renderLeagues(); },
    setClientHistSort(key) {
        const f = this.filters; if (f.chSort === key) f.chDir = (f.chDir === 'asc' ? 'desc' : 'asc'); else { f.chSort = key; f.chDir = (key === 'name' || key === 'position' ? 'asc' : 'desc'); }
        this.renderClientHistory();
    },
    setClientHistPos(p) { this.filters.chPos = p; this.renderClientHistory(); },
    renderFinance() {
        const a = GameState.agency;
        const led = a.ledger || {};
        const order = ['Wage commission', 'Sponsoring', 'Transfer & loan bonuses', 'Scout wages', 'Scout reports', 'Office', 'Facilities & staff', 'Physio treatments', 'Specialists', 'Gifts & relationships', 'Release pay-outs', 'Upgrades'];
        const cats = order.filter(c => led[c] != null).concat(Object.keys(led).filter(c => !order.includes(c)));
        const income = cats.filter(c => led[c] > 0), expense = cats.filter(c => led[c] < 0);
        const sumIn = income.reduce((s, c) => s + led[c], 0), sumOut = expense.reduce((s, c) => s + led[c], 0);
        const wkly = Agency.weeklyBreakdown();
        const rows = (list, sign) => list.length ? list.map(c => `<tr><td>${c}</td><td class="num ${sign > 0 ? 'pos' : 'neg'}">${sign > 0 ? '+' : '−'}€${this.money(Math.abs(led[c]))}</td></tr>`).join('') : `<tr><td class="muted" colspan="2">None yet this season</td></tr>`;
        document.getElementById('financeView').innerHTML = `
            <div class="view-header"><h2>Finance</h2><p class="muted">Income & spending this season (${GameState.seasonLabel()}), by source. Balance: <strong>€${this.money(a.balance)}</strong></p></div>
            <div class="fin-grid">
                <div class="panel"><h3 class="pos">Income</h3><table class="fin-table"><tbody>${rows(income, 1)}</tbody><tfoot><tr><td>Total income</td><td class="num pos">+€${this.money(sumIn)}</td></tr></tfoot></table></div>
                <div class="panel"><h3 class="neg">Expenses</h3><table class="fin-table"><tbody>${rows(expense, -1)}</tbody><tfoot><tr><td>Total expenses</td><td class="num neg">−€${this.money(Math.abs(sumOut))}</td></tr></tfoot></table></div>
            </div>
            <div class="panel"><h3>Net this season</h3><p class="${sumIn + sumOut >= 0 ? 'pos' : 'neg'}" style="font-size:1.3rem;font-weight:700">${sumIn + sumOut >= 0 ? '+' : '−'}€${this.money(Math.abs(sumIn + sumOut))}</p>
            <p class="muted">Current weekly run-rate: +€${this.money(wkly.wageComm + wkly.sponsorComm)} commissions, −€${this.money(wkly.scoutWages + wkly.office + wkly.facilities)} running costs (scouts €${this.money(wkly.scoutWages)} · office €${this.money(wkly.office)} · facilities/staff €${this.money(wkly.facilities)}).</p></div>
            ${(() => {
                const all = a.ledgerAll || {};
                const cAll = order.filter(c => all[c] != null).concat(Object.keys(all).filter(c => !order.includes(c)));
                const inAll = cAll.filter(c => all[c] > 0), exAll = cAll.filter(c => all[c] < 0);
                const tIn = inAll.reduce((s, c) => s + all[c], 0), tOut = exAll.reduce((s, c) => s + all[c], 0);
                const rowsAll = (list, sign) => list.length ? list.map(c => `<tr><td>${c}</td><td class="num ${sign > 0 ? 'pos' : 'neg'}">${sign > 0 ? '+' : '−'}€${this.money(Math.abs(all[c]))}</td></tr>`).join('') : `<tr><td class="muted" colspan="2">None</td></tr>`;
                return `<div class="view-header" style="margin-top:18px"><h3>All-time</h3></div>
                <div class="fin-grid">
                    <div class="panel"><h3 class="pos">Total income</h3><table class="fin-table"><tbody>${rowsAll(inAll, 1)}</tbody><tfoot><tr><td>All-time income</td><td class="num pos">+€${this.money(tIn)}</td></tr></tfoot></table></div>
                    <div class="panel"><h3 class="neg">Total expenses</h3><table class="fin-table"><tbody>${rowsAll(exAll, -1)}</tbody><tfoot><tr><td>All-time expenses</td><td class="num neg">−€${this.money(Math.abs(tOut))}</td></tr></tfoot></table></div>
                </div>
                <div class="panel"><h3>All-time net</h3><p class="${tIn + tOut >= 0 ? 'pos' : 'neg'}" style="font-size:1.3rem;font-weight:700">${tIn + tOut >= 0 ? '+' : '−'}€${this.money(Math.abs(tIn + tOut))}</p></div>`;
            })()}
            ${typeof Debug !== 'undefined' ? Debug.financeControlsHTML() : ''}`;
    },
    renderClientHistory() {
        document.getElementById('clienthistView').innerHTML =
            `<div class="view-header"><h2>Client History</h2><p class="muted">Every player who has been your client — current, released or retired. Updated each season.</p></div>${this.clientHistoryView()}`;
    },
    clientHistoryView() {
        const POSGROUP = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', LW: 'ATT', RW: 'ATT', ST: 'ATT' };
        const posFilter = this.filters.chPos || 'all';
        const rows = GameState.players.filter(p => p.everClient).map(p => {
            const c = careerLeagueTotal(p);
            return { p, name: p.name, nat: p.nationality, flag: p.nationalityFlag, position: p.position, grp: POSGROUP[p.position] || 'MID',
                apps: c.apps, goals: c.goals, cs: c.cs || 0, assists: c.assists, yellow: c.yellow, red: c.red, avg: c.avg,
                seasons: seasonsActiveLeague(p), status: p.archived ? (p.retired ? 'Retired' : 'Archived') : (p.agentId === 'me' ? 'Active' : 'Ex-client') };
        }).filter(r => posFilter === 'all' || r.grp === posFilter);
        if (!rows.length) return '<p class="muted">No clients yet — sign players and their careers will be recorded here.</p>';
        const key = this.filters.chSort || 'apps', dir = this.filters.chDir || 'desc';
        rows.sort((a, b) => { let x = a[key], y = b[key]; if (typeof x === 'string') { x = x.toLowerCase(); y = y.toLowerCase(); return dir === 'asc' ? (x < y ? -1 : x > y ? 1 : 0) : (x > y ? -1 : x < y ? 1 : 0); } return dir === 'asc' ? x - y : y - x; });
        const arrow = k => this.filters.chSort === k ? (dir === 'asc' ? ' ▲' : ' ▼') : '';
        const th = (k, l) => `<th onclick="UI.setClientHistSort('${k}')" style="cursor:pointer">${l}${arrow(k)}</th>`;
        const posBtns = [['all', 'All'], ['GK', 'Goalkeepers'], ['DEF', 'Defenders'], ['MID', 'Midfielders'], ['ATT', 'Attackers']]
            .map(([k, l]) => `<button class="chip-toggle ${posFilter === k ? 'on' : ''}" onclick="UI.setClientHistPos('${k}')">${l}</button>`).join('');
        const body = rows.map(r => `<tr onclick="UI.openHistoryPlayer('${r.p.id}')" style="cursor:pointer">
            <td class="club">${r.flag} ${r.name}</td><td>${r.position}</td><td>${r.nat}</td>
            <td>${r.apps}</td><td>${r.p.position === 'GK' ? r.cs : r.goals}</td><td>${r.assists}</td>
            <td class="yellow">${r.yellow}</td><td>${r.red}</td><td class="pts">${r.avg ? r.avg.toFixed(2) : '—'}</td><td>${r.seasons}</td>
            <td><span class="pill">${r.status}</span></td></tr>`).join('');
        return `<div class="controls">${posBtns}</div>
            <table class="standings"><thead><tr>${th('name', 'Player')}${th('position', 'Pos')}${th('nat', 'Nat')}${th('apps', 'Apps')}<th onclick="UI.setClientHistSort('goals')" style="cursor:pointer">Gls/CS${arrow('goals')}</th>${th('assists', 'Ast')}${th('yellow', 'Y')}${th('red', 'R')}${th('avg', 'Avg')}${th('seasons', 'Seasons')}<th>Status</th></tr></thead><tbody>${body}</tbody></table>
            <p class="hint">Tap a player to revisit his career. Updated each season; includes your current clients too.</p>`;
    },

    _germanZone(div, pos) {
        // direct promotion/relegation = full shade; Relegation play-off spots = lighter shade
        if (div === 'BUNDES') { if (pos >= 17) return 'zone-relegate'; if (pos === 16) return 'zone-releg-down'; return ''; }
        if (div === '2BUNDES') { if (pos <= 2) return 'zone-promote'; if (pos === 3) return 'zone-releg-up'; if (pos >= 17) return 'zone-relegate'; if (pos === 16) return 'zone-releg-down'; return ''; }
        if (div === '3LIGA') { if (pos <= 2) return 'zone-promote'; if (pos === 3) return 'zone-releg-up'; if (pos >= 17) return 'zone-relegate'; return ''; }
        if (div === 'REGIONAL1' || div === 'REGIONAL2') { if (pos <= 4) return 'zone-promote'; if (pos >= 21) return 'zone-relegate'; return ''; }
        if (div === 'REGIONAL3') { if (pos <= 4) return 'zone-promote'; return ''; }
        return '';
    },
    _germanLegend(div) {
        const P = '<span class="lg-pro">promote</span>', R = '<span class="lg-rel">relegate</span>', RP = '<span class="lg-relplay">Relegation</span>';
        if (div === 'BUNDES') return `17–18 ${R} · 16th ${RP}`;
        if (div === '2BUNDES') return `1–2 ${P} · 3rd ${RP} · 16th ${RP} · 17–18 ${R}`;
        if (div === '3LIGA') return `1–2 ${P} · 3rd ${RP} · 17–20 ${R}`;
        if (div === 'REGIONAL1' || div === 'REGIONAL2') return `1–4 ${P} · 21–24 ${R}`;
        if (div === 'REGIONAL3') return `1–4 ${P}`;
        return '';
    },
    _spanishZone(div, pos) {
        // direct promotion/relegation = full shade; promotion play-off spots = lighter shade
        if (div === 'LaLiga') { if (pos >= 18) return 'zone-relegate'; return ''; }
        if (div === 'LaLiga2') { if (pos <= 2) return 'zone-promote'; if (pos <= 6) return 'zone-releg-up'; if (pos >= 19) return 'zone-relegate'; return ''; }
        if (div === 'PrimeraSup' || div === 'PrimeraInf') { if (pos <= 3) return 'zone-promote'; if (pos <= 7) return 'zone-releg-up'; if (pos >= 19) return 'zone-relegate'; return ''; }
        if (div === 'Segunda') { if (pos <= 3) return 'zone-promote'; if (pos <= 7) return 'zone-releg-up'; return ''; }
        return '';
    },
    _spanishLegend(div) {
        const P = '<span class="lg-pro">promote</span>', R = '<span class="lg-rel">relegate</span>', PL = '<span class="lg-playup">play-offs</span>';
        if (div === 'LaLiga') return `18–20 ${R}`;
        if (div === 'LaLiga2') return `1–2 ${P} · 3–6 ${PL} · 19–22 ${R}`;
        if (div === 'PrimeraSup' || div === 'PrimeraInf') return `1–3 ${P} · 4–7 ${PL} · 19–22 ${R}`;
        if (div === 'Segunda') return `1–3 ${P} · 4–7 ${PL}`;
        return '';
    },
    standingsTable(div) {
        if (!GameState.league || !GameState.league.tables[div]) return '<p class="muted">No table yet.</p>';
        const rows = League.sortedTable(div);
        const champ = GameState.league.champions && GameState.league.champions[div];
        const ladder = (typeof COUNTRY_DIVS !== 'undefined' && COUNTRY_DIVS[divCountry(div)]) || ['ERE', 'EED', 'TWD', 'DRD'];
        const tierIdx = ladder.indexOf(div);
        const promote = tierIdx > 0, relegate = tierIdx >= 0 && tierIdx < ladder.length - 1;
        const relCount = div === 'LEAGUE2' ? 2 : 3, n = rows.length;
        const isY = id => isReserveClub(id);
        const pr = League.computeProRel();
        let mk = (pr && pr.marks && pr.marks[div]) || { green: [], blue: [] };
        // English divisions: computeProRel only marks the Dutch ladder, so derive promotion/play-off zones here
        if (!mk.green.length && !mk.blue.length && divCountry(div) === 'England') {
            const ids = rows.map(r => r.clubId);
            if (div === 'Natleague') mk = { green: ids.slice(0, 1), blue: ids.slice(1, 7) };       // 1 up, 2–7 play-off
            else if (['CHAMP', 'LEAGUE1', 'LEAGUE2'].includes(div)) mk = { green: ids.slice(0, 2), blue: ids.slice(2, 6) }; // top 2 up, 3–6 play-off
        }
        const deniedSet = new Set((pr && pr.notes ? pr.notes.filter(nn => nn.div === div) : []).map(nn => nn.clubId));
        const footnotes = [];
        const body = rows.map((r, i) => {
            const c = Clubs.getClubById(r.clubId);
            const myCount = GameState.players.filter(p => p.agentId === 'me' && (p.onLoanAt || p.clubId) === r.clubId).length;
            const rel = Agency.relationship(r.clubId);
            const gd = r.GF - r.GA;
            let zone = '';
            if (divCountry(div) === 'Germany') zone = this._germanZone(div, i + 1, n);
            else if (divCountry(div) === 'Spain') zone = this._spanishZone(div, i + 1);
            else if (relegate && i >= n - relCount) zone = 'zone-relegate';
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
        const engPromo = divCountry(div) === 'England';
        const promoTxt = engPromo ? (div === 'Natleague' ? '<span class="lg-pro">Champion promotes</span> <span class="lg-po">2–7 play-off</span>' : '<span class="lg-pro">Top 2 promote</span> <span class="lg-po">3–6 play-off</span>') : '<span class="lg-pro">Top 2 promote</span> <span class="lg-po">3–6 play-off</span>';
        const legend = (divCountry(div) === 'Germany')
            ? `<div class="zone-legend">${this._germanLegend(div)}</div>`
            : (divCountry(div) === 'Spain')
            ? `<div class="zone-legend">${this._spanishLegend(div)}</div>`
            : `<div class="zone-legend">${promote ? promoTxt : ''}${relegate ? ` <span class="lg-rel">Bottom ${relCount} relegate</span>` : ''}</div>`;
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
    cupFACupView() {
        const F = (GameState.league && GameState.league.facup) || (GameState.lastSeasonReport && GameState.lastSeasonReport.facup);
        if (!F || !F.results || !F.results.length) return '<div class="panel"><p class="muted">The FA Cup hasn\'t kicked off yet — the first round is in week 4.</p></div>';
        const winner = F.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(F.winner)}</strong></div>` : '';
        const rounds = F.results.slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<p class="hint">All 116 English clubs plus 12 non-league guest clubs (128 in total) are drawn from round one; rounds in weeks 4, 7, 15, 26, 32, 38 and 47.</p>${rounds}</div>`;
    },
    cupLLCView() {
        const C = (GameState.league && GameState.league.llc) || (GameState.lastSeasonReport && GameState.lastSeasonReport.llc);
        if (!C || !C.groups) return '<div class="panel"><p class="muted">The Lower Leagues Cup hasn\'t started yet — group games are in weeks 4 and 7.</p></div>';
        const winner = C.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(C.winner)}</strong></div>` : '';
        const groups = C.groups.map((g, i) => {
            const t = League._kSort(g.table);
            const rows = t.map((r, j) => `<tr class="${j === 0 ? 'zone-promote' : ''}" onclick="UI.openClub('${r.clubId}')" style="cursor:pointer"><td class="club">${this.clubName(r.clubId)}</td><td>${r.P}</td><td>${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td class="pts">${r.Pts}</td></tr>`).join('');
            return `<div class="kgroup"><h4>Group ${i + 1}</h4><table class="standings mini"><thead><tr><th>Club</th><th>P</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }).join('');
        const ko = (C.results || []).slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<h3>Group stage <span class="muted">(32 groups of 3 — National League to Championship)</span></h3><p class="hint">Each club plays the other two once (weeks 4 & 7); the 32 group winners go into a drawn knockout (R32 wk15, then 26/32/38, final wk46).</p><div class="kgroups">${groups}</div>${ko ? `<h3>Knockout</h3>${ko}` : ''}</div>`;
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
    cupDFBView() {
        const D = (GameState.league && GameState.league.dfb) || (GameState.lastSeasonReport && GameState.lastSeasonReport.dfb);
        if (!D || !D.results || !D.results.length) return '<div class="panel"><p class="muted">The DFB Pokal kicks off in week 4.</p></div>';
        const winner = D.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(D.winner)}</strong></div>` : '';
        const rounds = D.results.slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<p class="hint">All 128 German clubs will enter the competition in the first round. Teams from the Bundesliga, 2. Bundesliga and 3. Liga are seeded (as the away team) and will not face each other in the first round. Rounds will take place in weeks 4, 7, 15, 26, 32, 38 and 47.</p>${rounds}</div>`;
    },
    cupLandespokalView() {
        const P = (GameState.league && GameState.league.lpokal) || (GameState.lastSeasonReport && GameState.lastSeasonReport.lpokal);
        if (!P || !P.results || !P.results.length) return '<div class="panel"><p class="muted">The Landespokal kicks off in week 4.</p></div>';
        const winner = P.winner ? `<div class="cup-winner">🏆 Winner: <strong>${this.clubName(P.winner)}</strong></div>` : '';
        const rounds = P.results.slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<p class="hint">The 48 clubs in the 1st and 2nd Regionalliga will play two rounds (Weeks 4 & 7); the 12 remaining teams will be drawn together with the 20 teams from the 3. Liga from the round of 32 (Week 15) onwards. Further rounds will take place in Weeks 26, 32, 38 and 47.</p>${rounds}</div>`;
    },
    _relegTie(t, upLabel, downLabel) {
        if (!t) return '<p class="muted">Not yet played (week 46).</p>';
        const nm = id => `<span class="tie-club" onclick="UI.openClub('${id}')" style="cursor:pointer">${this.clubName(id)}</span>`;
        const l1 = t.leg1, l2 = t.leg2;
        const pens = t.pens ? ` <span class="pill pill-warn">i.E.</span>` : '';
        return `<div class="cup-round">
            <div class="tie"><span>${nm(l1.h)}</span><span class="tie-score">${l1.hg}–${l1.ag}</span><span>${nm(l1.a)}</span></div>
            <div class="tie"><span>${nm(l2.h)}</span><span class="tie-score">${l2.hg}–${l2.ag}</span><span>${nm(l2.a)}</span></div>
            <div class="comp-row"><span>Gesamt</span><span>${this.clubName(t.a)} ${t.aggA}–${t.aggB} ${this.clubName(t.b)}${pens}</span></div>
            <div class="cup-winner">✅ ${upLabel}: <strong>${this.clubName(t.winner)}</strong></div></div>`;
    },
    _spanishCupView(key, title, hint) {
        const C = (GameState.league && GameState.league[key]) || (GameState.lastSeasonReport && GameState.lastSeasonReport[key]);
        if (!C || !C.results || !C.results.length) return `<div class="panel"><p class="muted">${title} starts its first round in week 4.</p></div>`;
        const winner = C.winner ? `<div class="Winner">🏆 Campeón: <strong>${this.clubName(C.winner)}</strong></div>` : '';
        const rounds = C.results.slice().reverse().map(r => `<div class="cup-round"><h4>${r.round} <span class="muted">· wk ${r.week}</span></h4>${r.ties.map(t => this._tie(t)).join('')}</div>`).join('');
        return `<div class="panel">${winner}<p class="hint">${hint}</p>${rounds}</div>`;
    },
    cupCDRView() {
        return this._spanishCupView('cdr', 'Copa del Rey', 'All 64 clubs in the top three divisions enter the first round. La Liga clubs are seeded (they play away) and cannot face each other in the first round. Rounds take place in weeks 4, 7, 15, 26, 38 and 47.');
    },
    cupCFEDView() {
        return this._spanishCupView('cfed', 'Copa Federación', 'The 64 clubs from the bottom three divisions enter the first round. Clubs in the Primera Superior are seeded (they play away) and cannot face each other in the first round. Rounds take place in weeks 4, 7, 15, 26, 38 and 47.');
    },
    _germanPlayoffsView() {
        const G = (GameState.league && GameState.league.playoffs && GameState.league.playoffs._done) ? GameState.league.germanReleg : (GameState.lastSeasonReport && GameState.lastSeasonReport.germanReleg);
        const nm = id => this.clubName(id);
        let releg;
        if (!G) releg = '<div class="po-block"><h4>Relegation</h4><p class="muted">Not yet played (Week 46).</p></div>';
        else releg = `<div class="po-block"><h4>Relegation Bundesliga / 2. Bundesliga</h4>${this._relegTie(G.top, 'Bundesliga', '2. Bundesliga')}</div>
            <div class="po-block"><h4>Relegation 2. Bundesliga / 3. Liga</h4>${this._relegTie(G.bottom, '2. Bundesliga', '3. Liga')}</div>`;
        const lr = GameState.lastSeasonReport || {};
        let prBlock = '';
        if (lr.prorelGer) {
            const g = lr.prorelGer;
            const up16 = g.b2_3Up ? ' (+ Relegations-Sieger)' : '', dn16 = g.buli16Down ? ' (inkl. Relegation)' : '';
            prBlock = `<div class="panel"><h3>Auf- &amp; Abstieg</h3>
                <div class="comp-row"><span>⬆️ To the Bundesliga</span><span>${g.buliUpDirect.map(nm).join(', ')}${up16}</span></div>
                <div class="comp-row"><span>⬇️ From the Bundesliga</span><span>${g.buliDown.map(nm).join(', ')}${dn16}</span></div>
                <div class="comp-row"><span>⬆️ To the 2. Bundesliga</span><span>${g.l3UpDirect.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From the 2. Bundesliga</span><span>${g.b2DownDirect.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To the 3. Liga</span><span>${g.rl1Up.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From the 3. Liga</span><span>${g.l3DownDirect.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To the 1. Regionalliga</span><span>${g.rl2Up.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From the 1. Regionalliga</span><span>${g.rl1Down.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To the 2. Regionalliga</span><span>${g.rl3Up.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From the 2. Regionalliga</span><span>${g.rl2Down.map(nm).join(', ')}</span></div></div>`;
        }
        return `<div class="panel"><p class="hint">Relegation play-offs (Week 46): 16th-placed Bundesliga side v 3rd-placed 2. Bundesliga side and 16th-placed 2. Bundesliga side v 3rd-placed 3. Liga side, each over two legs; in the event of a draw, the tie will be decided by a penalty shoot-out. Reserve teams cannot be promoted to the 2. Bundesliga (the place is passed on).</p>${releg}</div>${prBlock}`;
    },
    _spanishPlayoffsView() {
        const P = (GameState.league && GameState.league.playoffs && GameState.league.playoffs._done) ? GameState.league.playoffs : (GameState.lastSeasonReport && GameState.lastSeasonReport.playoffs);
        const nm = id => this.clubName(id);
        const lk = id => `<span class="tie-club" onclick="UI.openClub('${id}')" style="cursor:pointer">${this.clubName(id)}</span>`;
        const poTie = t => {
            if (!t) return '';
            const l1 = t.leg1, l2 = t.leg2, pens = t.pens ? ' <span class="pill pill-warn">pen.</span>' : '';
            return `<div class="cup-round">
                <div class="tie"><span>${lk(l1.h)}</span><span class="tie-score">${l1.hg}–${l1.ag}</span><span>${lk(l1.a)}</span></div>
                <div class="tie"><span>${lk(l2.h)}</span><span class="tie-score">${l2.hg}–${l2.ag}</span><span>${lk(l2.a)}</span></div>
                <div class="comp-row"><span>Global</span><span>${this.clubName(t.a)} ${t.aggA}–${t.aggB} ${this.clubName(t.b)}${pens}</span></div></div>`;
        };
        let blocks = '';
        ['LaLiga2', 'PrimeraSup', 'PrimeraInf', 'Segunda'].forEach(div => {
            const po = P && P[div];
            const title = `${COMPETITIONS[div] ? COMPETITIONS[div].name : div} — promotion play-off`;
            if (!po) { blocks += `<div class="po-block"><h4>${title}</h4><p class="muted">Not yet played (week 46).</p></div>`; return; }
            blocks += `<div class="po-block"><h4>${title}</h4>
                <div class="cup-round"><h5>Semifinales</h5>${(po.sf || []).map(poTie).join('')}</div>
                <div class="cup-round"><h5>Final</h5>${poTie(po.final)}</div>
                <div class="cup-winner">⬆️ Asciende: <strong>${nm(po.winner)}</strong></div></div>`;
        });
        const lr = GameState.lastSeasonReport || {};
        let prBlock = '';
        if (lr.prorelEsp) {
            const e = lr.prorelEsp;
            prBlock = `<div class="panel"><h3>Ascensos y descensos</h3>
                <div class="comp-row"><span>⬆️ To La Liga</span><span>${e.l2Promote.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From La Liga</span><span>${e.llDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To La Liga 2</span><span>${e.psPromote.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From La Liga 2</span><span>${e.l2Down.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Primera Superior</span><span>${e.piPromote.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Primera Superior</span><span>${e.psDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Primera Inferior</span><span>${e.sgPromote.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Primera Inferior</span><span>${e.piDown.map(nm).join(', ')}</span></div></div>`;
        }
        return `<div class="panel"><p class="hint">Promotion play-offs (week 46): semi-finals and final played over two legs (home and away), with a penalty shoot-out in the event of a draw. Reserve teams cannot be promoted to La Liga (the place goes to the next team in the running).</p>${blocks}</div>${prBlock}`;
    },
    playoffsView() {
        const country = this.filters.lgCountry || 'Netherlands';
        if (country === 'Germany') return this._germanPlayoffsView();
        if (country === 'Spain') return this._spanishPlayoffsView();
        const P = (GameState.league && GameState.league.playoffs && GameState.league.playoffs._done) ? GameState.league.playoffs : (GameState.lastSeasonReport && GameState.lastSeasonReport.playoffs);
        const divs = ((typeof COUNTRY_DIVS !== 'undefined' && COUNTRY_DIVS[country]) || []).filter((d, i) => i > 0); // skip top tier
        let blocks = '';
        divs.forEach(div => {
            const po = P && P[div];
            const title = `${COMPETITIONS[div] ? COMPETITIONS[div].name : div} — promotion play-off`;
            if (!po) { blocks += `<div class="po-block"><h4>${title}</h4><p class="muted">Not played yet (week 46).</p></div>`; return; }
            const elim = po.elim ? `<div class="cup-round"><h5>Eliminators</h5>${po.elim.map(t => this._tie(t)).join('')}</div>` : '';
            blocks += `<div class="po-block"><h4>${title}</h4>
                ${elim}
                <div class="cup-round"><h5>Semi-finals</h5>${(po.sf || []).map(t => this._tie(t)).join('')}</div>
                <div class="cup-round"><h5>Final</h5>${this._tie(po.final)}</div>
                <div class="cup-winner">⬆️ Promoted: <strong>${this.clubName(po.winner)}</strong></div></div>`;
        });
        const lr = GameState.lastSeasonReport || {};
        let prBlock = '';
        const nm = id => this.clubName(id);
        if (country === 'Netherlands' && lr.prorel) {
            const pr = lr.prorel;
            prBlock = `<div class="panel"><h3>Promotion &amp; relegation</h3>
                <div class="comp-row"><span>⬆️ To Eredivisie</span><span>${pr.eedUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Eredivisie</span><span>${pr.ereDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Eerste</span><span>${pr.twdUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Eerste</span><span>${pr.eedDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Tweede</span><span>${pr.drdUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Tweede</span><span>${pr.twdDown.map(nm).join(', ')}</span></div></div>`;
        } else if (country === 'England' && lr.prorelEng) {
            const e = lr.prorelEng;
            prBlock = `<div class="panel"><h3>Promotion &amp; relegation</h3>
                <div class="comp-row"><span>⬆️ To Premier League</span><span>${e.champUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Premier League</span><span>${e.premDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To Championship</span><span>${e.l1Up.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From Championship</span><span>${e.champDown.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To League One</span><span>${e.l2Up.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From League One</span><span>${e.l1Down.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬆️ To League Two</span><span>${e.nlUp.map(nm).join(', ')}</span></div>
                <div class="comp-row"><span>⬇️ From League Two</span><span>${e.l2Down.map(nm).join(', ')}</span></div></div>`;
        }
        const hint = country === 'England'
            ? 'Championship, League One and League Two: places 3–6 contest a play-off for the last promotion spot. National League: places 2–7, with 2 &amp; 3 seeded to the semi-finals.'
            : 'Places 3–6 contest a play-off (week 46) for the third promotion spot; the higher seed plays at home (3 v 6, 4 v 5, then the final).';
        return `<div class="panel"><p class="hint">${hint}</p>${blocks}</div>${prBlock}`;
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
        const W = 320, H = 132, padL = 52, padR = 12, padT = 12, padB = 24;
        const xMin = opts.xMin != null ? opts.xMin : points[0].x;
        const xMax = opts.xMax != null ? opts.xMax : (points[points.length - 1].x || xMin + 1);
        const xSpan = xMax > xMin ? (xMax - xMin) : 1;
        let lo = opts.yMin, hi = opts.yMax;
        if (lo == null || hi == null) {
            const ys = points.map(p => p.y); lo = lo != null ? lo : Math.min(...ys); hi = hi != null ? hi : Math.max(...ys);
            if (lo === hi) { lo -= 1; hi += 1; }
        }
        if (lo >= hi) hi = lo + (opts.yStep || 10);
        const X = v => padL + (W - padL - padR) * Math.max(0, Math.min(1, (v - xMin) / xSpan));
        const Y = v => padT + (H - padT - padB) * (1 - Math.max(0, Math.min(1, (v - lo) / (hi - lo))));
        const fmtY = opts.fmtY || (v => v);

        let grid = '', ylabels = '', xgrid = '', xlabels = '';
        // y gridlines + labels
        if (opts.yStep) {
            const start = Math.ceil(lo / opts.yStep) * opts.yStep;
            for (let v = start; v <= hi + 1e-6; v += opts.yStep) {
                const yy = Y(v);
                grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}" class="grid"/>`;
                ylabels += `<text x="${padL - 6}" y="${(yy + 3).toFixed(1)}" class="cy-lbl" text-anchor="end">${fmtY(v)}</text>`;
            }
        } else {
            ylabels = `<text x="${padL - 6}" y="${(Y(hi) + 4).toFixed(1)}" class="cy-lbl" text-anchor="end">${fmtY(hi)}</text><text x="${padL - 6}" y="${Y(lo).toFixed(1)}" class="cy-lbl" text-anchor="end">${fmtY(lo)}</text>`;
        }
        // x gridlines (faint, per year) + labels
        const xticks = opts.xTicks || [{ v: xMin, label: '' }, { v: (xMin + xMax) / 2, label: '' }, { v: xMax, label: '' }];
        xticks.forEach(tk => {
            const xx = X(tk.v);
            xgrid += `<line x1="${xx.toFixed(1)}" y1="${padT}" x2="${xx.toFixed(1)}" y2="${H - padB}" class="grid"/>`;
            if (tk.label) xlabels += `<text x="${xx.toFixed(1)}" y="${H - 7}" class="cx-lbl" text-anchor="middle">${tk.label}</text>`;
        });

        const dots = points.map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${color}"/>`).join('');
        let path = '';
        if (points.length >= 2 && !opts.dotsOnly) {
            path = `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>`;
        }
        return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${grid}${xgrid}<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" class="axis"/>
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
    closeModal() { document.getElementById('modal').classList.remove('active'); if (this.view === 'clients' && document.getElementById('clientsView')) this.renderClients(); },
    result(msg, kind) { const el = document.getElementById('modalResult'); if (el) el.innerHTML = `<div class="result ${kind}">${msg}</div>`; }
};
