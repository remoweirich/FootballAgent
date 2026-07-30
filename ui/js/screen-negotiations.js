// ============================================================
//  Inbox list + mail detail: transfer / loan / renewal / sponsor
//  negotiations, and a generic viewer for news / summary mail.
// ============================================================
const Nego = { ctx: {} };

Nego.ctxFor = function (id) {
    if (!this.ctx[id]) this.ctx[id] = {};
    return this.ctx[id];
};

Nego.clubPosLine = function (clubId) {
    const r = (typeof League !== 'undefined' && League.clubPosition) ? League.clubPosition(clubId) : null;
    if (!r) return '';
    return ` · ${UI.ordinal(r.pos)}/${r.total}${r.played ? ` · ${r.pts}pts` : ''}`;
};

Nego.linkifyPlayers = function (html) {
    if (!html) return html;
    const cands = GameState.players.filter(p => p.agentId === 'me' || p.everClient || p.knownToAgent);
    const seen = new Set(); const list = [];
    cands.sort((a, b) => b.name.length - a.name.length).forEach(p => { if (p.name && !seen.has(p.name)) { seen.add(p.name); list.push(p); } });
    let out = html;
    list.forEach(p => {
        const esc = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('(^|[^\\w>])(' + esc + ')(?![\\w<])', 'g');
        out = out.replace(re, (mm, pre, nm) => `${pre}<a href="${Router.link('client', p.id)}" style="color:var(--accent-text)">${nm}</a>`);
    });
    return out;
};

// ---------------- Inbox list ----------------
Router.register('inbox', {
    isMain: false, title: 'Inbox',
    render(el) {
        // a live "Attend the Final" window gets a banner at the top of the inbox linking to the overview
        const w = (typeof Attend !== 'undefined') ? Attend.window() : null;
        const banner = (w && w.finals.length) ? `<a class="list-row" href="${Router.link('attendfinals')}" style="cursor:pointer;background:var(--gold-tint);border:1px solid var(--gold-border);margin-bottom:var(--space-3)">
            <div class="row-ico" style="background:color-mix(in srgb, var(--gold) 16%, transparent);color:var(--gold)"><i class="ti ti-ticket"></i></div>
            <div style="flex:1;min-width:0"><div class="row-title">Finals to attend</div><div class="row-sub">${w.finals.length} invitation${w.finals.length > 1 ? 's' : ''} · ${Attend.watchesLeft()} left to watch</div></div>
            <i class="ti ti-chevron-right" style="color:var(--gold)"></i></a>` : '';
        if (!GameState.inbox.length && !banner) { el.innerHTML = '<div class="empty"><div class="empty__icon"><i class="ti ti-inbox"></i></div><div class="empty__title">Inbox empty</div><div class="empty__hint">Offers, scout reports, injuries and season reviews arrive here.</div></div>'; return; }
        el.innerHTML = `<div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <span class="hint">${GameState.inbox.length} message(s) · ${GameState.unreadCount()} unread</span>
            <div class="flex-row" style="gap:6px"><button class="gbtn" onclick="NegoInbox.markAllRead()"><i class="ti ti-checks"></i>Mark all read</button><button class="gbtn" onclick="NegoInbox.dismissAll()"><i class="ti ti-trash"></i>Dismiss all</button></div>
        </div>${banner}
        ${GameState.inbox.map(m => {
            const off = m.offer ? Nego.mailMeta(m) : '';
            // an invitation row opens the finals overview, not a mail detail
            const href = m.kind === 'attend' ? Router.link('attendfinals') : Router.link('mail', m.id);
            return `<a class="list-row" href="${href}" style="cursor:pointer;${m.read ? '' : 'background:var(--accent-fill)'}">
                <div class="row-ico" style="background:color-mix(in srgb, ${UI.kindColor(m.kind)} 16%, transparent);color:${UI.kindColor(m.kind)}"><i class="ti ${UI.kindIcon(m.kind)}"></i></div>
                <div style="flex:1;min-width:0"><div class="row-title">${UI.esc(m.subject)}</div><div class="row-sub">W${m.week} ${m.season}${off ? ' · ' + off : ''}</div></div>
                ${!m.read ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex:none"></span>' : ''}
            </a>`;
        }).join('')}`;
    }
});
Nego.mailMeta = function (m) {
    const p = GameState.getPlayer(m.offer.playerId); if (!p) return '';
    if (m.kind === 'transfer') return UI.euro(m.offer.transferFee);
    if (m.kind === 'sponsor') return '';
    if (m.kind === 'renewal') return UI.euro(m.offer.proposedWage) + '/wk';
    return '';
};
const NegoInbox = {
    markAllRead() { GameState.markAllRead(); GameState.save(); Router.refresh(); },
    dismissAll() {
        if (!GameState.inbox.length) return;
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Dismiss all messages?</div><p class="hint">Pending offers will be cleared too.</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">Cancel</button><button class="btn btn--danger" onclick="NegoInbox.doDismissAll()">Dismiss all</button></div>`);
    },
    doDismissAll() { GameState.dismissAllMail(); GameState.save(); Router.closeSheet(); Router.refresh(); }
};

// ---------------- Mail detail dispatcher ----------------
Router.register('mail', {
    isMain: false, title: p => { const m = GameState.inbox.find(x => x.id === p[0]); return m ? m.subject : 'Message'; },
    // a message about a player belongs UNDER that player: backing out of his offers lands on him
    parent: params => {
        const pid = Nego.playerIdOf(GameState.inbox.find(x => x.id === params[0]));
        return (pid && GameState.getPlayer(pid)) ? 'client/' + encodeURIComponent(pid) : 'inbox';
    },
    render(el, params) {
        const m = GameState.inbox.find(x => x.id === params[0]);
        // Backing into a message you already resolved (accepted a sponsorship, completed a transfer…)
        // shouldn't dump you on a dead "no longer available" screen — you know it's gone. Bounce
        // straight to the inbox instead.
        if (!m) { Router.back('inbox'); return; }
        m.read = true;
        if (m.kind === 'transfer') Nego.transfer(el, m);
        else if (m.kind === 'renewal') Nego.renewal(el, m);
        else if (m.kind === 'loan') Nego.loan(el, m);
        else if (m.kind === 'sponsor') Nego.sponsor(el, m);
        else Nego.generic(el, m);
        Nego.prependPlayerLink(el, m);   // every message about a player opens straight onto him
    }
});
// which player a message concerns (offers carry it directly; some news mail names him explicitly)
Nego.playerIdOf = function (m) { return (m && ((m.offer && m.offer.playerId) || m.playerId)) || null; };
// A tappable player header on top of any message about a player, so you can always jump to his page.
Nego.prependPlayerLink = function (el, m) {
    const pid = this.playerIdOf(m), p = pid && GameState.getPlayer(pid);
    if (!p || !el.innerHTML) return;
    const info = p.clubId ? UI.currentClubInfo(p) : null;
    el.insertAdjacentHTML('afterbegin', `<a class="list-row" href="${Router.link('client', p.id)}" style="cursor:pointer;margin-bottom:var(--space-4)">
        <div style="flex:1;min-width:0">
            <div class="row-title">${UI.flag(p.nationality)} ${p.name}</div>
            <div class="row-sub">${p.position} · ${p.age}y${info ? ' · ' + info.name : ''}</div>
        </div>${UI.abilityBadge(p.ability)}<i class="ti ti-chevron-right row-chev"></i></a>`);
};
// After resolving an offer you almost always want to look at the player it concerned — and it keeps
// the back button out of the pile of offers you just clicked through.
Nego.goPlayer = function (playerId) {
    if (playerId && GameState.getPlayer(playerId)) { Router.replace('client/' + encodeURIComponent(playerId)); }
    else Router.back('inbox');
};
Nego.generic = function (el, m) {
    el.innerHTML = `<p class="hint">W${m.week} ${m.season}</p>
        <div style="color:var(--text-secondary);line-height:1.6">${this.linkifyPlayers(m.body || '')}</div>
        <div class="flex-row" style="margin-top:var(--space-6)"><button class="btn btn--ghost" onclick="Nego.dismiss('${m.id}')"><i class="ti ti-trash"></i>Dismiss</button><button class="btn btn--primary" onclick="Router.back('inbox')">Close</button></div>`;
};
Nego.dismiss = function (id) {
    const pid = this.playerIdOf(GameState.inbox.find(m => m.id === id));
    GameState.removeMail(id); GameState.save(); this.goPlayer(pid);
};
Nego.reject = function (id) {
    const m = GameState.inbox.find(x => x.id === id) || {};
    const pid = this.playerIdOf(m);
    Agency.declineMail(m); GameState.save(); this.goPlayer(pid);
};

// ---------------- Transfer ----------------
Nego.transfer = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId), from = Clubs.getClubById(o.fromClubId);
    if (!p || !to) { this.dismiss(m.id); return; }
    const termCap = Agency.maxContractTerm(p, to);
    const c = this.ctxFor(m.id); if (!c.pkgRound) { c.pkgRound = 1; c.wage = o.proposedWage; c.role = o.role || 'rotation'; c.term = Math.min(3, termCap); c.bonus = 0; }
    const bonusMax = Math.max(Agency.maxSigningBonus(p, o.proposedWage), Agency.agentFeeCap(o.transferFee));
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    const fromLeague = Agency.isFreeAgent(p) || !from ? 'free agent (no club)' : `${from.name}, ${from.divisionName}`;
    const feeLine = Agency.isFreeAgent(p) ? 'Free transfer.' : `Agreed fee <strong>${UI.euro(o.transferFee)}</strong>.`;
    const others = GameState.inbox.filter(x => x.kind === 'transfer' && x.offer.playerId === p.id && x.id !== m.id);

    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(to.id)}"</p>
        <div class="fcard">
            <div class="frow"><span class="frow__k">Player's wage</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">Current club</span><span class="frow__v">${fromLeague}${this.clubPosLine(o.fromClubId)}</span></div>
            <div class="frow"><span class="frow__k">Current role</span><span class="frow__v">${Agency.isFreeAgent(p) ? '\u2014' : roleName(p)}</span></div>
            <div class="frow"><span class="frow__k">Bidding club</span><span class="frow__v">${to.name}, ${to.divisionName}${this.clubPosLine(to.id)}</span></div>
        </div>
        <p class="hint">${p.ability} OVR · ${p.age}y · ${feeLine}${o.initiatedByAgent ? ' · you pitched this' : ''}</p>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">Put your whole proposal on the table — wage, role, length and signing bonus together.</p>
        <label class="field-label">Wage at ${to.name}: <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">(your cut <span id="negoCutVal">${UI.euro(cut(c.wage))}</span>/wk)</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <label class="field-label">Squad role</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.role ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <label class="field-label">Contract length: <span id="negoTermVal" class="editable-val">${c.term}</span> season(s)${termCap < 6 ? ` <span class="muted">(max ${termCap} at his age, unless he's way too good for this squad)</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        <label class="field-label">Your agent's fee: <span id="negoBonusVal" class="editable-val">${UI.euro(c.bonus)}</span></label>
        <input class="range" type="range" min="0" max="${bonusMax}" step="${Math.max(10, Math.round(bonusMax / 50))}" value="${c.bonus}" oninput="Nego.slide('${m.id}','bonus',this.value)">
        ${others.length ? `<div class="result info">Competing bids: ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''} · ${roleLabel(x.offer.role || 'rotation', p.age)}</a>`).join(' · ')}</div>` : ''}
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>Reject</button>
            <button class="btn btn--primary" onclick="Nego.proposePackage('${m.id}')"><i class="ti ti-send"></i>Propose package</button>
        </div>
        <div id="actionResult"></div>`;
};
// Update state + only the specific label(s) affected — a full Router.refresh() on every
// drag tick would tear down and rebuild the whole screen mid-drag (breaking the slider,
// resetting scroll to the top, and generally feeling "stuck").
Nego.slide = function (id, key, val) {
    const c = this.ctxFor(id);
    if (key === 'role' || key === 'duration') { c[key] = val; return; }   // nothing else echoes these live
    if (key === 'loanRole') {
        c.loanRole = val;
        const m = GameState.inbox.find(x => x.id === id), p = m ? GameState.getPlayer(m.offer.playerId) : null;
        const el = document.getElementById('negoLoanRoleVal');
        if (el && p) el.textContent = roleLabel(c.loanRole, p.age);
        return;
    }
    c[key] = +val;
    const m = GameState.inbox.find(x => x.id === id), p = m ? GameState.getPlayer(m.offer.playerId) : null;
    if (key === 'wage' && p) {
        const wEl = document.getElementById('negoWageVal'); if (wEl) wEl.textContent = UI.euro(c.wage);
        const cutEl = document.getElementById('negoCutVal'); if (cutEl) cutEl.textContent = UI.euro(Math.round(c.wage * p.wageCommission / 100));
    } else if (key === 'term') {
        const tEl = document.getElementById('negoTermVal'); if (tEl) tEl.textContent = c.term;
    } else if (key === 'bonus') {
        const bEl = document.getElementById('negoBonusVal'); if (bEl) bEl.textContent = UI.euro(c.bonus);
    }
};
Nego.proposePackage = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), p = GameState.getPlayer(m.offer.playerId), club = Clubs.getClubById(m.offer.toClubId);
    const c = this.ctxFor(mailId);
    const pkg = { wage: c.wage, role: c.role, term: c.term, bonus: c.bonus, fee: m.offer.transferFee };
    const r = Agency.evaluateTransfer(p, club, pkg, c.pkgRound++);
    if (r.status === 'accept') {
        const pid = p.id;
        const ar = Agency.acceptTransfer(m, r.counter.wage, r.counter.role, r.counter.term, r.counter.bonus);
        GameState.save();
        if (typeof Sound !== 'undefined') Sound.play('cash');
        Router.result(`${r.message}<br><span class="muted">${ar.message}</span>`, 'ok');
        setTimeout(() => Nego.goPlayer(pid), 900);
    } else {
        const cc = r.counter; c.wage = cc.wage; c.role = cc.role; c.term = cc.term; c.bonus = cc.bonus;
        Router.refresh();
        Router.result(`${r.message}<br><span class="muted">Their package: ${UI.euro(cc.wage)}/wk · ${roleLabel(cc.role, p.age)} · ${cc.term}yr · ${UI.euro(cc.bonus)} bonus</span>`, r.status === 'close' ? 'info' : 'bad');
    }
};

// ---------------- Renewal ----------------
Nego.renewal = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
    if (!p || !club) { this.dismiss(m.id); return; }
    const termCap = Agency.maxContractTerm(p, club);
    const c = this.ctxFor(m.id); if (c.wage == null) { c.wage = o.proposedWage; c.role = p.squadRole; c.term = Math.min(o.proposedTermSeasons, termCap); c.wageRound = 1; }
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(club.id)}"</p>
        <div class="fcard">
            <div class="frow"><span class="frow__k">Current wage</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">Club</span><span class="frow__v">${club.name}, ${club.divisionName}${this.clubPosLine(club.id)}</span></div>
            <div class="frow"><span class="frow__k">Role · until</span><span class="frow__v">${roleName(p)} · ${GameState.seasonLabelFor(p.contractUntilSeason)}</span></div>
        </div>
        <label class="field-label">Wage: <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">(your cut <span id="negoCutVal">${UI.euro(cut(c.wage))}</span>/wk, ${p.wageCommission}%)</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <button class="btn btn--accent-outline btn--sm" style="margin:var(--space-2) 0 var(--space-4);width:auto" onclick="Nego.negRenewWage('${m.id}')"><i class="ti ti-send"></i>Put it to the club</button>
        <div id="wageMsg"></div>
        <label class="field-label">Squad role at ${club.name}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.role ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <label class="field-label">Contract length: <span id="negoTermVal" class="editable-val">${c.term}</span> season(s)${termCap < 6 ? ` <span class="muted">(max ${termCap} at his age, unless he's way too good for this squad)</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>Decline</button>
            <button class="btn btn--primary" onclick="Nego.acceptRenewal('${m.id}')"><i class="ti ti-check"></i>Accept renewal</button>
        </div>
        <div id="actionResult"></div>`;
};
Nego.negRenewWage = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), p = GameState.getPlayer(m.offer.playerId), club = Clubs.getClubById(m.offer.clubId);
    const c = this.ctxFor(mailId);
    const r = Agency.negotiateWage(p, club, c.wage, c.wageRound++, c.lastWageCounter);
    if (r.status === 'counter') { c.wage = r.counter; c.lastWageCounter = r.counter; }
    Router.refresh();
    document.getElementById('wageMsg').innerHTML = `<div class="hint" style="margin:-8px 0 var(--space-3)">"${r.message}"</div>`;
};
Nego.acceptRenewal = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), c = this.ctxFor(mailId);
    const pid = this.playerIdOf(m);
    const r = Agency.acceptRenewal(m, c.wage, c.role, c.term);
    GameState.save();
    if (r.ok && typeof Sound !== 'undefined') Sound.play('cash');
    Router.result(r.message, r.ok ? 'ok' : 'bad');
    if (r.ok) setTimeout(() => Nego.goPlayer(pid), 900);
};

// ---------------- Loan ----------------
Nego.loan = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId);
    if (!p || !to) { this.dismiss(m.id); return; }
    const c = this.ctxFor(m.id); if (!c.loanRole) { c.loanRole = o.role || 'starter'; c.loanRound = 1; }
    const others = GameState.inbox.filter(x => x.kind === 'loan' && x.offer.playerId === p.id && x.id !== m.id);
    const durOpts = Agency.loanDurationOptions(p);
    const inWindow = durOpts.length > 0;
    // his own contract with the current club is too short for any loan length at all - distinct
    // from "no window open" (which loanDurationOptions() always has *some* answer for)
    const contractTooShort = durOpts.length === 0 && Agency.loanDurationOptions().length > 0;
    if (inWindow && !c.duration) c.duration = durOpts[0].code;
    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(to.id)}"</p>
        <div class="fcard">
            <div class="frow"><span class="frow__k">Club</span><span class="frow__v">${to.name}, ${to.divisionName}${this.clubPosLine(to.id)}</span></div>
            <div class="frow"><span class="frow__k">From</span><span class="frow__v">${p.clubId ? (Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : '') : ''}</span></div>
            <div class="frow"><span class="frow__k">They propose</span><span class="frow__v">${roleLabel(o.role || 'starter', p.age)}</span></div>
        </div>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">Push for more game time — they may dig in, or give in if you persist and they trust you.</p>
        <label class="field-label">Ask for role: <span id="negoLoanRoleVal" style="color:var(--accent-text)">${roleLabel(c.loanRole, p.age)}</span> agreed</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','loanRole',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.loanRole ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <button class="btn btn--accent-outline btn--sm" style="margin:var(--space-2) 0 var(--space-4);width:auto" onclick="Nego.negLoanRole('${m.id}')"><i class="ti ti-send"></i>Put it to the club</button>
        <div id="loanMsg"></div>
        ${others.length ? `<div class="result info">Other clubs after ${p.name}: ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''}</a>`).join(' · ')}</div>` : ''}
        ${inWindow ? `<label class="field-label">Loan duration</label><select class="select-input" onchange="Nego.slide('${m.id}','duration',this.value)">${durOpts.map((d, i) => `<option value="${d.code}" ${d.code === c.duration ? 'selected' : ''}>${d.label}</option>`).join('')}</select>` : contractTooShort ? `<div class="result info">${p.name}'s contract with ${Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : 'his club'} doesn't leave room for a loan of any length.</div>` : `<div class="result info">Loans can only be completed during a transfer window (weeks 1–6 or 28–33).</div>`}
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>Decline</button>
            ${inWindow ? `<button class="btn btn--primary" onclick="Nego.acceptLoan('${m.id}')"><i class="ti ti-check"></i>Accept loan</button>` : ''}
        </div>
        <div id="actionResult"></div>`;
};
Nego.negLoanRole = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), p = GameState.getPlayer(m.offer.playerId), club = Clubs.getClubById(m.offer.toClubId);
    const c = this.ctxFor(mailId);
    const r = Agency.negotiateLoanRole(p, club, c.loanRole, c.loanRound++);
    if (ROLE_ORDER.indexOf(r.role) > ROLE_ORDER.indexOf(c.loanRole) || r.status === 'accept') c.loanRole = r.role;
    Router.refresh();
    document.getElementById('loanMsg').innerHTML = `<div class="hint" style="margin:-8px 0 var(--space-3)">"${r.message}"</div>`;
};
Nego.acceptLoan = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), c = this.ctxFor(mailId);
    const pid = this.playerIdOf(m);
    const r = Agency.acceptLoanOffer(m, c.loanRole, c.duration);
    GameState.save();
    Router.result(r.message, r.ok ? 'ok' : 'bad');
    if (r.ok) setTimeout(() => Nego.goPlayer(pid), 900);
};

// ---------------- Sponsor ----------------
Nego.sponsor = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId);
    if (!p) { this.dismiss(m.id); return; }
    const opts = o.options || [{ company: o.sponsorName, weekly: o.weeklyAmount, annual: 0, termSeasons: o.termSeasons || 1 }];
    const comm = p.sponsorCommission;
    el.innerHTML = `<p class="hint">${(SPONSOR_LABEL[o.level] || 'Sponsor')} interest — pick one. It's steady weekly income against a bigger up-front lump sum. Your ${comm}% cut is shown behind each amount.</p>
        ${opts.map((opt, i) => {
        const wCut = Math.round(opt.weekly * comm / 100), aCut = Math.round((opt.annual || 0) * comm / 100);
        return `<div class="fcard"${opt.standout ? ' style="border-color:var(--accent)"' : ''}>
                <div class="frow" style="border-bottom:.5px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${opt.company}${opt.standout ? ' <span class="pill pill--accent" style="font-size:10px">standout offer</span>' : ''}</span></div>
                <div class="frow"><span class="frow__k">Weekly</span><span class="frow__v">${UI.euro(opt.weekly)}/wk <span class="muted">(cut ${UI.euro(wCut)}/wk)</span></span></div>
                <div class="frow"><span class="frow__k">Annual lump sum</span><span class="frow__v">${UI.euro(opt.annual || 0)}/yr <span class="muted">(cut ${UI.euro(aCut)}/yr)</span></span></div>
                <div class="frow"><span class="frow__k">Term</span><span class="frow__v">${opt.termSeasons} season(s)</span></div>
                <div style="padding:8px 0"><button class="btn btn--primary btn--sm" onclick="Nego.acceptSponsor('${m.id}',${i})"><i class="ti ti-signature"></i>Sign this one</button></div>
            </div>`;
    }).join('')}
        <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>Decline all</button>
        <div id="actionResult"></div>`;
};
Nego.acceptSponsor = function (mailId, optionIndex) {
    const m = GameState.inbox.find(x => x.id === mailId);
    const pid = this.playerIdOf(m);
    const r = Agency.acceptSponsor(m, optionIndex);
    GameState.save();
    if (r.ok && typeof Sound !== 'undefined') Sound.play('cash');
    Router.result(r.message, r.ok ? 'ok' : 'bad');
    if (r.ok) setTimeout(() => Nego.goPlayer(pid), 900);
};
