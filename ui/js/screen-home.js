// ============================================================
//  Home screen — season header, finances, needs-attention triage,
//  client highlights, and the "Advance week" primary action.
// ============================================================
const Home = {};

Home.needsAttention = function () {
    const items = [];
    GameState.inbox.filter(m => !m.read && ['transfer', 'loan', 'renewal', 'sponsor'].includes(m.kind)).slice(0, 6).forEach(m => {
        items.push({
            icon: UI.kindIcon(m.kind), color: UI.kindColor(m.kind),
            title: I18n.t('home.attn.' + m.kind),
            sub: m.subject, go: `mail/${m.id}`
        });
    });
    Agency.clients().forEach(p => {
        if (p.injury) items.push({ icon: 'ti-bandage', color: 'var(--danger)', title: I18n.t('home.attn.injured'), sub: I18n.t('home.attn.injuredSub', { name: p.name, w: Math.ceil(p.injury.weeksOut) }), go: `client/${p.id}` });
        const seasonsLeft = Agency.contractSeasonsLeft(p);
        if (!Agency.isFreeAgent(p) && seasonsLeft <= 0 && !p.repExpired) items.push({ icon: 'ti-file-text', color: 'var(--warning)', title: I18n.t('home.attn.contractExpiring'), sub: I18n.t('home.attn.contractExpiringSub', { name: p.name, club: Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : '' }), go: `client/${p.id}` });
        // morale case ladder: new complaint / near-deadline promise / escalation / departure notice
        const c = p.moraleCase;
        if (c) {
            const aw = GameState.absWeek();
            const dimLabel = (ClientDetail.MORALE_DIM_LABEL[c.dim] || c.dim).toLowerCase();
            if (aw === c.sinceAbsWeek) {
                if (c.stage === 1) items.push({ icon: 'ti-flag', color: 'var(--info)', title: I18n.t('home.attn.newComplaint'), sub: I18n.t('home.attn.newComplaintSub', { name: p.name, dim: dimLabel }), go: `client/${p.id}` });
                else items.push({ icon: 'ti-trending-down', color: 'var(--warning)', title: I18n.t('home.attn.escalated'), sub: I18n.t('home.attn.escalatedSub', { name: p.name, dim: dimLabel }), go: `client/${p.id}` });
            }
            if (c.promise && c.promise.deadlineAbsWeek - aw <= 2) items.push({ icon: 'ti-calendar', color: 'var(--warning)', title: I18n.t('home.attn.promiseDeadline'), sub: I18n.t('home.attn.promiseSub', { name: p.name, w: Math.max(0, c.promise.deadlineAbsWeek - aw) }), go: `client/${p.id}` });
            if (c.dim === 'agent' && c.stage === 3 && p.repExpired) items.push({ icon: 'ti-user-x', color: 'var(--danger)', title: I18n.t('home.attn.departure'), sub: I18n.t('home.attn.departureSub', { name: p.name }), go: `client/${p.id}` });
        }
    });
    GameState.inbox.filter(m => !m.read && m.kind === 'news' && m.cat === 'injury').slice(0, 3).forEach(m => {
        items.push({ icon: 'ti-bandage', color: 'var(--danger)', title: I18n.t('home.attn.injuryNews'), sub: m.subject, go: `mail/${m.id}` });
    });
    GameState.inbox.filter(m => !m.read && m.kind === 'news' && m.subject.startsWith('Scout report')).slice(0, 3).forEach(m => {
        items.push({ icon: 'ti-search', color: 'var(--info)', title: I18n.t('home.attn.scoutReady'), sub: m.subject.replace('Scout report — ', ''), go: `mail/${m.id}` });
    });
    return items.slice(0, 6);
};

Router.register('home', {
    isMain: true, title: () => I18n.t('nav.home'),
    render(el) {
        const windowOpen = GameState.isTransferWindowOpen();
        const attention = Home.needsAttention();
        const clients = Agency.clients();
        const highlights = clients.slice().sort((a, b) => (seasonTotals(b, GameState.seasonStartYear).apps) - (seasonTotals(a, GameState.seasonStartYear).apps)).slice(0, 3);

        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:2px">
            <div>
                <div class="flex-row" style="gap:7px">
                    <span style="font-size:11.5px;color:var(--text-dim);letter-spacing:.02em">${I18n.t('home.season', { label: GameState.seasonLabel() })}</span>
                    ${windowOpen ? `<span class="pill pill--accent"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent)"></span>${I18n.t('home.windowOpen')}</span>` : ''}
                </div>
                <div style="font-size:var(--fs-xl);font-weight:var(--weight-semibold);margin-top:3px">${I18n.t('home.weekMonth', { w: GameState.week, month: UI.monthLabel(GameState.week, GameState.seasonStartYear) })}</div>
            </div>
        </div>

        <div class="section-label" style="margin:var(--space-5) 0 var(--space-2)">${I18n.t('home.needsAttention')}</div>
        ${attention.length ? attention.map(a => `
            <a class="list-row" href="#${a.go}" style="cursor:pointer">
                <div class="row-ico" style="background:color-mix(in srgb, ${a.color} 16%, transparent);color:${a.color}"><i class="ti ${a.icon}"></i></div>
                <div style="flex:1;min-width:0"><div class="row-title">${a.title}</div><div class="row-sub">${UI.esc(a.sub)}</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </a>`).join('') : `<div class="empty empty--inline"><div class="empty__icon"><i class="ti ti-circle-check"></i></div><div class="empty__title">${I18n.t('home.allClear')}</div><div class="empty__hint">${I18n.t('home.allClearSub')}</div></div>`}

        <div class="section-head">
            <span class="section-label">${I18n.t('home.yourClients')}</span>
            <span class="hint"><i class="ti ti-users" style="font-size:14px"></i> ${clients.length}/${Agency.capacity()}</span>
        </div>
        ${highlights.length ? highlights.map(p => {
            const club = Clubs.getClubById(p.clubId), tot = seasonTotals(p, GameState.seasonStartYear);
            return `<a class="list-row" href="#client/${p.id}" style="cursor:pointer">
                ${UI.crest(club)}
                <div style="flex:1;min-width:0"><div class="row-title">${p.name}</div><div class="row-sub">${p.position} · ${club ? club.name : I18n.t('common.freeAgent')}</div></div>
                <div style="font-size:12.5px;color:var(--text-muted);text-align:right">${tot.apps} ${I18n.t('common.appsShort')} · ${UI.ratingText(tot.avg)}</div>
            </a>`;
        }).join('') : `<div class="empty"><div class="empty__icon"><i class="ti ti-zoom-scan"></i></div><div class="empty__title">${I18n.t('home.noClients')}</div><div class="empty__hint">${I18n.t('home.noClientsSub')}</div><a class="btn btn--accent-outline btn--sm empty__cta" href="#scouting"><i class="ti ti-zoom-scan"></i>${I18n.t('home.openScouting')}</a></div>`}
        ${clients.length ? `<a class="list-row" href="#clients" style="cursor:pointer;justify-content:space-between"><span style="color:var(--accent-text);font-size:12.5px;font-weight:var(--weight-semibold)">${I18n.t('home.seeAll')}</span><i class="ti ti-chevron-right" style="color:var(--accent-text)"></i></a>` : ''}
        `;

        if (el.parentElement) el.parentElement.classList.add('screen--has-cta');
        const dock = document.createElement('div');
        dock.className = 'cta-dock';
        const nextWk = GameState.week + 1 > 52 ? 1 : GameState.week + 1;
        dock.innerHTML = `<button class="btn btn--primary"><span class="btn__stack">${I18n.t('home.advanceTo', { n: nextWk })}${attention.length ? `<small>${attention.length === 1 ? I18n.t('home.taskPending1', { n: attention.length }) : I18n.t('home.taskPendingN', { n: attention.length })}</small>` : ''}</span><i class="ti ti-player-play" style="font-size:20px"></i></button>`;
        dock.querySelector('button').onclick = () => Home.advance();
        el.appendChild(dock);
    }
});

Home.advance = function () {
    // If finals from this week are still unwatched, warn before advancing — moving on reveals their
    // results without you attending (the viewing window closes). See Attend.
    if (typeof Attend !== 'undefined' && Attend.hasUnwatched()) {
        const n = Attend.watchesLeft();
        Router.modal(`<div>
            <div style="font-size:30px;text-align:center;margin-bottom:var(--space-2)">🎟️</div>
            <h2 style="margin:0 0 var(--space-3);text-align:center">${I18n.t('home.finalsToWatch')}</h2>
            <p style="color:var(--text-secondary);line-height:1.6">${n === 1 ? I18n.t('home.finalsBody1', { n }) : I18n.t('home.finalsBodyN', { n })}</p>
            <div class="flex-row" style="margin-top:var(--space-5);gap:var(--space-3)">
                <a class="btn btn--primary" style="flex:1" href="${Router.link('attendfinals')}" onclick="Router.closeModal()">${I18n.t('home.watchThem')}</a>
                <button class="btn btn--ghost" style="flex:1" onclick="Router.closeModal(); Home._doAdvance()">${I18n.t('home.advanceAnyway')}</button>
            </div>
        </div>`);
        return;
    }
    Home._doAdvance();
};
Home._doAdvance = function () {
    const before = GameState.agency.balance;
    const res = Sim.advanceWeek();
    Router.lastWeekNet = GameState.agency.balance - before;
    Home._spotlights = res.spotlights || [];
    Home._pendingAttend = (res.attend || []).slice();   // finals the agent may watch this week
    const lines = res.events.map(e => `<div class="frow"><span class="frow__k">${e.text}</span></div>`).join('');
    // tap anywhere in the card to continue (not just the button) — lets you rattle through
    // several quiet weeks by tapping the same spot repeatedly
    Router.modal(`<div onclick="Home._afterSummary()" style="cursor:pointer">
        <h2 style="margin-top:0">${I18n.t('home.weekSummary', { w: GameState.week, season: GameState.seasonLabel() })}</h2>
        <div style="max-height:50vh;overflow-y:auto">${lines || `<p class="hint">${I18n.t('home.quietWeek')}</p>`}</div>
        <button class="btn btn--primary" style="margin-top:var(--space-5)">${I18n.t('common.continue')}</button>
    </div>`);
};

// after the week summary, walk through any "spotlight" moments one at a time (e.g. a client
// announcing his retirement) — richer than a plain log line, so they get their own pop-up
Home._afterSummary = function () {
    Router.closeModal();
    if (Home._spotlights && Home._spotlights.length) { Home._spotIndex = 0; Home._showSpotlight(); }
    else Home._startInvites();
};
Home._showSpotlight = function () {
    const list = Home._spotlights, i = Home._spotIndex;
    if (!list || i >= list.length) { Home._startInvites(); return; }
    const s = list[i];
    Router.modal(`<div onclick="Home._nextSpotlight()" style="text-align:center;cursor:pointer">
        <div style="font-size:38px;margin-bottom:var(--space-3)">${s.icon || '📣'}</div>
        <h2 style="margin:0 0 var(--space-3)">${UI.esc(s.title)}</h2>
        <p style="color:var(--text-secondary);font-style:italic;line-height:1.6">"${UI.esc(s.quote)}"</p>
        <div class="flex-row" style="margin-top:var(--space-5)">
            ${s.playerId ? `<a class="btn btn--ghost" href="${Router.link('client', s.playerId)}" onclick="event.stopPropagation()">${I18n.t('home.viewPlayer')}</a>` : ''}
            <button class="btn btn--primary">${i < list.length - 1 ? I18n.t('common.next') : I18n.t('common.continue')}</button>
        </div>
    </div>`);
};
Home._nextSpotlight = function () { Home._spotIndex++; Home._showSpotlight(); };

// ---- "Attend the Final" invitations ----
// Each invited final pops up full-screen so you're aware of it; you watch them from the inbox
// overview (up to three, least-prestigious first, no going back). The popups here only notify.
Home._startInvites = function () {
    Home._inviteIdx = 0;
    Home._showInvite();
};
Home._showInvite = function () {
    const list = Home._pendingAttend || [], i = Home._inviteIdx || 0;
    if (typeof Attend === 'undefined' || i >= list.length) { Router.closeModal(); Home._startFarewells(); return; }
    const inv = Attend.invitePayload(list[i]);
    const body = inv.body.split('\n').map(l => l.trim() ? `<p style="margin:0 0 var(--space-3);line-height:1.6">${UI.esc(l)}</p>` : '').join('');
    const last = i >= list.length - 1;
    Router.modal(`<div>
        <div style="font-size:30px;text-align:center;margin-bottom:var(--space-2)">🎟️</div>
        <h2 style="margin:0 0 var(--space-4);text-align:center">${UI.esc(inv.header)}</h2>
        <div style="color:var(--text-secondary);max-height:40vh;overflow-y:auto">${body}</div>
        <p class="hint" style="margin-top:var(--space-3)">${I18n.t('home.watchFromInbox')}</p>
        <div class="flex-row" style="margin-top:var(--space-4);gap:var(--space-3)">
            ${last ? `<a class="btn btn--primary" style="flex:1" href="${Router.link('attendfinals')}" onclick="Router.closeModal()">${I18n.t('home.openOverview')}</a>` : ''}
            <button class="btn ${last ? 'btn--ghost' : 'btn--primary'}" style="flex:1" onclick="Home._nextInvite()">${last ? I18n.t('common.close') : I18n.t('common.next')}</button>
        </div>
    </div>`);
};
Home._nextInvite = function () { Home._inviteIdx = (Home._inviteIdx || 0) + 1; Home._showInvite(); };

// ---- retirement farewells ----
// A retiring client earns a proper goodbye conversation, not just a mail. The queue is persisted
// on the agency (see Sim season rollover), so a farewell survives a mid-flow app close and plays
// on the next advance instead of silently disappearing.
Home._startFarewells = function () {
    const q = (GameState.agency && GameState.agency.pendingFarewells) || [];
    if (!q.length || typeof Dialogue === 'undefined' || typeof DialogueView === 'undefined') { Home._startMoments(); return; }
    const id = q.shift();
    GameState.save();
    const p = GameState.getPlayer(id);
    if (!p) { Home._startFarewells(); return; }
    DialogueView.show(Dialogue.buildFarewellScene(p), function () { GameState.save(); Home._startFarewells(); });
};

// ---- career-moment scenes ----
// Debuts, milestones, hat-tricks, transfer calls, dream moves, fulfilled ambitions, injury visits.
// Queued by the sim during the week (persisted on the agency), played here one after another.
Home._startMoments = function () {
    const q = (GameState.agency && GameState.agency.pendingScenes) || [];
    if (!q.length || typeof Dialogue === 'undefined' || typeof DialogueView === 'undefined') { Router.refresh(); return; }
    const entry = q.shift();
    GameState.save();
    const scene = Dialogue.buildMomentScene(entry);
    if (!scene) { Home._startMoments(); return; }   // player gone or archived: skip it
    DialogueView.show(scene, function () { GameState.save(); Home._startMoments(); });
};
