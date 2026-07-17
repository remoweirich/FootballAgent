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
            title: ({ transfer: 'Transfer offer', loan: 'Loan offer', renewal: 'Renewal terms', sponsor: 'Sponsorship offer' })[m.kind],
            sub: m.subject, go: `mail/${m.id}`
        });
    });
    Agency.clients().forEach(p => {
        if (p.injury) items.push({ icon: 'ti-bandage', color: 'var(--danger)', title: 'Injured', sub: `${p.name} · out ~${Math.ceil(p.injury.weeksOut)}w`, go: `client/${p.id}` });
        const seasonsLeft = Agency.contractSeasonsLeft(p);
        if (!Agency.isFreeAgent(p) && seasonsLeft <= 0 && !p.repExpired) items.push({ icon: 'ti-file-text', color: 'var(--warning)', title: 'Contract expiring', sub: `${p.name} · ${Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : ''} · expires end of season`, go: `client/${p.id}` });
        // morale case ladder: new complaint / near-deadline promise / escalation / departure notice
        const c = p.moraleCase;
        if (c) {
            const aw = GameState.absWeek();
            const dimLabel = (ClientDetail.MORALE_DIM_LABEL[c.dim] || c.dim).toLowerCase();
            if (aw === c.sinceAbsWeek) {
                if (c.stage === 1) items.push({ icon: 'ti-flag', color: 'var(--info)', title: 'New complaint', sub: `${p.name} is unhappy about ${dimLabel}`, go: `client/${p.id}` });
                else items.push({ icon: 'ti-trending-down', color: 'var(--warning)', title: 'Complaint escalated', sub: `${p.name} is taking ${dimLabel} further`, go: `client/${p.id}` });
            }
            if (c.promise && c.promise.deadlineAbsWeek - aw <= 2) items.push({ icon: 'ti-calendar', color: 'var(--warning)', title: 'Promise deadline soon', sub: `${p.name} · ${Math.max(0, c.promise.deadlineAbsWeek - aw)}w left`, go: `client/${p.id}` });
            if (c.dim === 'agent' && c.stage === 3 && p.repExpired) items.push({ icon: 'ti-user-x', color: 'var(--danger)', title: 'Departure notice', sub: `${p.name} will leave your agency soon`, go: `client/${p.id}` });
        }
    });
    GameState.inbox.filter(m => !m.read && m.kind === 'news' && m.cat === 'injury').slice(0, 3).forEach(m => {
        items.push({ icon: 'ti-bandage', color: 'var(--danger)', title: 'Injury news', sub: m.subject, go: `mail/${m.id}` });
    });
    GameState.inbox.filter(m => !m.read && m.kind === 'news' && m.subject.startsWith('Scout report')).slice(0, 3).forEach(m => {
        items.push({ icon: 'ti-search', color: 'var(--info)', title: 'Scout report ready', sub: m.subject.replace('Scout report — ', ''), go: `mail/${m.id}` });
    });
    return items.slice(0, 6);
};

Router.register('home', {
    isMain: true, title: 'Home',
    render(el) {
        const windowOpen = GameState.isTransferWindowOpen();
        const attention = Home.needsAttention();
        const clients = Agency.clients();
        const highlights = clients.slice().sort((a, b) => (seasonTotals(b, GameState.seasonStartYear).apps) - (seasonTotals(a, GameState.seasonStartYear).apps)).slice(0, 3);

        el.innerHTML = `
        <div class="flex-row" style="justify-content:space-between;margin-bottom:2px">
            <div>
                <div class="flex-row" style="gap:7px">
                    <span style="font-size:11.5px;color:var(--text-dim);letter-spacing:.02em">Season ${GameState.seasonLabel()}</span>
                    ${windowOpen ? `<span class="pill pill--accent"><span style="width:6px;height:6px;border-radius:50%;background:var(--accent)"></span>Window open</span>` : ''}
                </div>
                <div style="font-size:var(--fs-xl);font-weight:var(--weight-semibold);margin-top:3px">Week ${GameState.week} · ${UI.monthLabel(GameState.week, GameState.seasonStartYear)}</div>
            </div>
        </div>

        <div class="section-label" style="margin:var(--space-5) 0 var(--space-2)">Needs attention</div>
        ${attention.length ? attention.map(a => `
            <a class="list-row" href="#${a.go}" style="cursor:pointer">
                <div class="row-ico" style="background:color-mix(in srgb, ${a.color} 16%, transparent);color:${a.color}"><i class="ti ${a.icon}"></i></div>
                <div style="flex:1;min-width:0"><div class="row-title">${a.title}</div><div class="row-sub">${UI.esc(a.sub)}</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </a>`).join('') : `<div class="empty empty--inline"><div class="empty__icon"><i class="ti ti-circle-check"></i></div><div class="empty__title">All clear</div><div class="empty__hint">Nothing needs your attention this week.</div></div>`}

        <div class="section-head">
            <span class="section-label">Your clients</span>
            <span class="hint"><i class="ti ti-users" style="font-size:14px"></i> ${clients.length}/${Agency.capacity()}</span>
        </div>
        ${highlights.length ? highlights.map(p => {
            const club = Clubs.getClubById(p.clubId), tot = seasonTotals(p, GameState.seasonStartYear);
            return `<a class="list-row" href="#client/${p.id}" style="cursor:pointer">
                ${UI.crest(club)}
                <div style="flex:1;min-width:0"><div class="row-title">${p.name}</div><div class="row-sub">${p.position} · ${club ? club.name : 'Free agent'}</div></div>
                <div style="font-size:12.5px;color:var(--text-muted);text-align:right">${tot.apps} apps · ${UI.ratingText(tot.avg)}</div>
            </a>`;
        }).join('') : `<div class="empty"><div class="empty__icon"><i class="ti ti-zoom-scan"></i></div><div class="empty__title">No clients yet</div><div class="empty__hint">Send a scout out to find your first talent.</div><a class="btn btn--accent-outline btn--sm empty__cta" href="#scouting"><i class="ti ti-zoom-scan"></i>Open Scouting</a></div>`}
        ${clients.length ? `<a class="list-row" href="#clients" style="cursor:pointer;justify-content:space-between"><span style="color:var(--accent-text);font-size:12.5px;font-weight:var(--weight-semibold)">See all clients</span><i class="ti ti-chevron-right" style="color:var(--accent-text)"></i></a>` : ''}
        `;

        if (el.parentElement) el.parentElement.classList.add('screen--has-cta');
        const dock = document.createElement('div');
        dock.className = 'cta-dock';
        dock.innerHTML = `<button class="btn btn--primary"><span class="btn__stack">Advance to week ${GameState.week + 1 > 52 ? 1 : GameState.week + 1}${attention.length ? `<small>${attention.length} task${attention.length === 1 ? '' : 's'} pending</small>` : ''}</span><i class="ti ti-player-play" style="font-size:20px"></i></button>`;
        dock.querySelector('button').onclick = () => Home.advance();
        el.appendChild(dock);
    }
});

Home.advance = function () {
    const before = GameState.agency.balance;
    const res = Sim.advanceWeek();
    Router.lastWeekNet = GameState.agency.balance - before;
    Home._spotlights = res.spotlights || [];
    Home._pendingAttend = (res.attend || []).slice();   // finals the agent may watch this week
    const lines = res.events.map(e => `<div class="frow"><span class="frow__k">${e.text}</span></div>`).join('');
    // tap anywhere in the card to continue (not just the button) — lets you rattle through
    // several quiet weeks by tapping the same spot repeatedly
    Router.modal(`<div onclick="Home._afterSummary()" style="cursor:pointer">
        <h2 style="margin-top:0">Week ${GameState.week} — ${GameState.seasonLabel()}</h2>
        <div style="max-height:50vh;overflow-y:auto">${lines || '<p class="hint">A quiet week.</p>'}</div>
        <button class="btn btn--primary" style="margin-top:var(--space-5)">Continue</button>
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
            ${s.playerId ? `<a class="btn btn--ghost" href="${Router.link('client', s.playerId)}" onclick="event.stopPropagation()">View player</a>` : ''}
            <button class="btn btn--primary">${i < list.length - 1 ? 'Next' : 'Continue'}</button>
        </div>
    </div>`);
};
Home._nextSpotlight = function () { Home._spotIndex++; Home._showSpotlight(); };

// ---- "Attend the Final" invitations: walk through them one at a time after the spotlights ----
Home._startInvites = function () {
    Home._inviteIdx = 0;
    Home._showInvite();
};
Home._showInvite = function () {
    const list = Home._pendingAttend || [], i = Home._inviteIdx || 0;
    if (typeof Attend === 'undefined' || i >= list.length) { Router.closeModal(); Router.refresh(); return; }
    const inv = Attend.invitePayload(list[i]);
    const body = inv.body.split('\n').map(l => l.trim() ? `<p style="margin:0 0 var(--space-3);line-height:1.6">${UI.esc(l)}</p>` : '').join('');
    Router.modal(`<div>
        <div style="font-size:30px;text-align:center;margin-bottom:var(--space-2)">🎟️</div>
        <h2 style="margin:0 0 var(--space-4);text-align:center">${UI.esc(inv.header)}</h2>
        <div style="color:var(--text-secondary);max-height:44vh;overflow-y:auto">${body}</div>
        <div class="flex-row" style="margin-top:var(--space-5);gap:var(--space-3)">
            <button class="btn btn--ghost" style="flex:1" onclick="Home._declineInvite()">Decline</button>
            <button class="btn btn--primary" style="flex:1" onclick="Home._acceptInvite()">Attend</button>
        </div>
    </div>`);
};
Home._declineInvite = function () { Home._inviteIdx = (Home._inviteIdx || 0) + 1; Home._showInvite(); };
Home._acceptInvite = function () {
    const m = (Home._pendingAttend || [])[Home._inviteIdx || 0];
    if (!m || typeof LiveView === 'undefined') { Home._declineInvite(); return; }
    Router.closeModal();
    LiveView.show(m, function () {
        Router.refresh();                        // LiveView took over #app; rebuild the shell
        Home._inviteIdx = (Home._inviteIdx || 0) + 1;
        Home._showInvite();
    });
};
