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
    isMain: false, title: () => I18n.t('common.inbox'),
    render(el) {
        // a live "Attend the Final" window gets a banner at the top of the inbox linking to the overview
        const w = (typeof Attend !== 'undefined') ? Attend.window() : null;
        const banner = (w && w.finals.length) ? `<a class="list-row" href="${Router.link('attendfinals')}" style="cursor:pointer;background:var(--gold-tint);border:1px solid var(--gold-border);margin-bottom:var(--space-3)">
            <div class="row-ico" style="background:color-mix(in srgb, var(--gold) 16%, transparent);color:var(--gold)"><i class="ti ti-ticket"></i></div>
            <div style="flex:1;min-width:0"><div class="row-title">${I18n.t('nego.finalsToAttend')}</div><div class="row-sub">${I18n.t('nego.finalsSub', { n: w.finals.length, left: Attend.watchesLeft() })}</div></div>
            <i class="ti ti-chevron-right" style="color:var(--gold)"></i></a>` : '';
        if (!GameState.inbox.length && !banner) { el.innerHTML = `<div class="empty"><div class="empty__icon"><i class="ti ti-inbox"></i></div><div class="empty__title">${I18n.t('nego.inboxEmpty')}</div><div class="empty__hint">${I18n.t('nego.inboxEmptySub')}</div></div>`; return; }
        el.innerHTML = `<div class="flex-row" style="justify-content:space-between;margin-bottom:var(--space-4)">
            <span class="hint">${I18n.t('nego.msgCount', { n: GameState.inbox.length, unread: GameState.unreadCount() })}</span>
            <div class="flex-row" style="gap:6px"><button class="gbtn" onclick="NegoInbox.markAllRead()"><i class="ti ti-checks"></i>${I18n.t('nego.markAllRead')}</button><button class="gbtn" onclick="NegoInbox.dismissAll()"><i class="ti ti-trash"></i>${I18n.t('nego.dismissAll')}</button></div>
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
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('nego.dismissAllQ')}</div><p class="hint">${I18n.t('nego.dismissAllDesc')}</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button><button class="btn btn--danger" onclick="NegoInbox.doDismissAll()">${I18n.t('nego.dismissAll')}</button></div>`);
    },
    doDismissAll() { GameState.dismissAllMail(); GameState.save(); Router.closeSheet(); Router.refresh(); }
};

// ---------------- Mail detail dispatcher ----------------
Router.register('mail', {
    isMain: false, title: p => { const m = GameState.inbox.find(x => x.id === p[0]); return m ? m.subject : I18n.t('nego.message'); },
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
        <div class="flex-row" style="margin-top:var(--space-6)"><button class="btn btn--ghost" onclick="Nego.dismiss('${m.id}')"><i class="ti ti-trash"></i>${I18n.t('nego.dismiss')}</button><button class="btn btn--primary" onclick="Router.back('inbox')">${I18n.t('common.close')}</button></div>`;
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
    const c = this.ctxFor(m.id); if (c.wage == null) { c.wage = o.proposedWage; c.role = o.role || 'rotation'; c.term = Math.min(3, termCap); c.bonus = 0; }
    const bonusMax = Math.max(Agency.maxSigningBonus(p, o.proposedWage), Agency.agentFeeCap(o.transferFee));
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    const fromLeague = Agency.isFreeAgent(p) || !from ? I18n.t('nego.freeAgentNoClub') : `${from.name}, ${from.divisionName}`;
    const feeLine = Agency.isFreeAgent(p) ? I18n.t('nego.freeTransfer') : I18n.t('nego.agreedFee', { fee: UI.euro(o.transferFee) });
    const others = GameState.inbox.filter(x => x.kind === 'transfer' && x.offer.playerId === p.id && x.id !== m.id);

    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(to.id)}"</p>
        <div class="fcard">
            <div class="frow"><span class="frow__k">${I18n.t('nego.playersWage')}</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentClub')}</span><span class="frow__v">${fromLeague}${this.clubPosLine(o.fromClubId)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentRole')}</span><span class="frow__v">${Agency.isFreeAgent(p) ? '\u2014' : roleName(p)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.biddingClub')}</span><span class="frow__v">${to.name}, ${to.divisionName}${this.clubPosLine(to.id)}</span></div>
        </div>
        <p class="hint">${p.ability} OVR · ${p.age}y · ${feeLine}${o.initiatedByAgent ? I18n.t('nego.youPitched') : ''}</p>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">${I18n.t('nego.transferIntro')}</p>
        <label class="field-label">${I18n.t('nego.wageAt', { club: to.name })} <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">${I18n.t('nego.yourCut', { cut: `<span id="negoCutVal">${UI.euro(cut(c.wage))}</span>` })}</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <label class="field-label">${I18n.t('nego.squadRole')}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.role ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <label class="field-label">${I18n.t('nego.contractLength')} <span id="negoTermVal" class="editable-val">${c.term}</span>${I18n.t('nego.seasonsSuffix')}${termCap < 6 ? ` <span class="muted">${I18n.t('nego.maxTerm', { cap: termCap })}</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        <label class="field-label">${I18n.t('nego.agentFee')} <span id="negoBonusVal" class="editable-val">${UI.euro(c.bonus)}</span></label>
        <input class="range" type="range" min="0" max="${bonusMax}" step="${Math.max(10, Math.round(bonusMax / 50))}" value="${c.bonus}" oninput="Nego.slide('${m.id}','bonus',this.value)">
        ${others.length ? `<div class="result info">${I18n.t('nego.competingBids')} ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''} · ${roleLabel(x.offer.role || 'rotation', p.age)}</a>`).join(' · ')}</div>` : ''}
        ${this.patienceCue(o.neg)}
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>${I18n.t('nego.reject')}</button>
            <button class="btn btn--primary" onclick="Nego.proposePackage('${m.id}')"><i class="ti ti-send"></i>${I18n.t('nego.proposePackage')}</button>
        </div>
        <div id="actionResult"></div>`;
};
// The club's dwindling patience with back-and-forth (Pass 1 threat meter). The bar shows how
// much room to keep haggling is left before the club walks; only rendered once a round is in.
Nego.patienceCue = function (neg) {
    if (!neg || !neg._init) return '';
    const t = Math.max(0, Math.min(100, neg.threat)), remain = 100 - t;
    const band = Agency.threatBand(t);
    const color = band === 'high' ? 'var(--danger)' : band === 'med' ? 'var(--gold)' : 'var(--ok)';
    const label = band === 'high' ? I18n.t('nego.patienceEdge') : band === 'med' ? I18n.t('nego.patienceCooling') : I18n.t('nego.patienceRelaxed');
    return `<div style="margin:var(--space-4) 0 var(--space-2)">
        <div class="flex-row" style="justify-content:space-between;font-size:var(--fs-sm)"><span class="muted">${I18n.t('nego.patience')}</span><span style="color:${color};font-weight:var(--weight-semibold)">${label}</span></div>
        <div style="height:6px;border-radius:3px;background:var(--line-strong);overflow:hidden;margin-top:5px"><div style="height:100%;width:${remain}%;background:${color};transition:width .3s"></div></div>
    </div>`;
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
    const m = GameState.inbox.find(x => x.id === mailId), o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.toClubId);
    const c = this.ctxFor(mailId);
    const pkg = { wage: c.wage, role: c.role, term: c.term, bonus: c.bonus, fee: o.transferFee };
    if (!o.neg) o.neg = Agency.initNeg(null, club, o.proposedWage);
    const r = Agency.evaluateTransfer(p, club, pkg, o.neg);
    o.neg = r.neg;
    if (r.status === 'walkout') {
        const pid = p.id;
        GameState.removeMail(m.id); GameState.save();
        Router.result(r.message, 'bad');
        setTimeout(() => Nego.goPlayer(pid), 1200);
        return;
    }
    if (r.status === 'accept') {
        const pid = p.id;
        const ar = Agency.acceptTransfer(m, r.counter.wage, r.counter.role, r.counter.term, r.counter.bonus);
        GameState.save();
        if (typeof Sound !== 'undefined') Sound.play('cash');
        Router.result(`${r.message}<br><span class="muted">${ar.message}</span>`, 'ok');
        setTimeout(() => Nego.goPlayer(pid), 900);
    } else {
        const cc = r.counter; c.wage = cc.wage; c.role = cc.role; c.term = cc.term; c.bonus = cc.bonus;
        GameState.save();   // persist the threat meter carried on o.neg
        Router.refresh();
        Router.result(`${r.message}<br><span class="muted">${I18n.t('nego.theirPackage', { wage: UI.euro(cc.wage), role: roleLabel(cc.role, p.age), term: cc.term, bonus: UI.euro(cc.bonus) })}</span>`, r.status === 'close' ? 'info' : 'bad');
    }
};

// ---------------- Renewal ----------------
Nego.renewal = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
    if (!p || !club) { this.dismiss(m.id); return; }
    const termCap = Agency.maxContractTerm(p, club);
    const c = this.ctxFor(m.id); if (c.wage == null) { c.wage = o.proposedWage; c.role = p.squadRole; c.term = Math.min(o.proposedTermSeasons, termCap); }
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(club.id)}"</p>
        <div class="fcard">
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentWage')}</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.club')}</span><span class="frow__v">${club.name}, ${club.divisionName}${this.clubPosLine(club.id)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.roleUntil')}</span><span class="frow__v">${roleName(p)} · ${GameState.seasonLabelFor(p.contractUntilSeason)}</span></div>
        </div>
        <label class="field-label">${I18n.t('nego.wage')} <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">${I18n.t('nego.yourCutPct', { cut: `<span id="negoCutVal">${UI.euro(cut(c.wage))}</span>`, pct: p.wageCommission })}</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <button class="btn btn--accent-outline btn--sm" style="margin:var(--space-2) 0 var(--space-4);width:auto" onclick="Nego.negRenewWage('${m.id}')"><i class="ti ti-send"></i>${I18n.t('nego.putToClub')}</button>
        <div id="wageMsg"></div>
        ${this.patienceCue(o.neg)}
        <label class="field-label">${I18n.t('nego.squadRoleAt', { club: club.name })}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.role ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <label class="field-label">${I18n.t('nego.contractLength')} <span id="negoTermVal" class="editable-val">${c.term}</span>${I18n.t('nego.seasonsSuffix')}${termCap < 6 ? ` <span class="muted">${I18n.t('nego.maxTerm', { cap: termCap })}</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>${I18n.t('nego.decline')}</button>
            <button class="btn btn--primary" onclick="Nego.acceptRenewal('${m.id}')"><i class="ti ti-check"></i>${I18n.t('nego.acceptRenewal')}</button>
        </div>
        <div id="actionResult"></div>`;
};
Nego.negRenewWage = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
    const c = this.ctxFor(mailId);
    if (!o.neg) o.neg = Agency.initNeg(null, club, o.proposedWage);
    const r = Agency.negotiateWage(p, club, c.wage, o.neg);
    o.neg = r.neg;
    if (r.status === 'walkout') {
        const pid = this.playerIdOf(m);
        GameState.removeMail(m.id); GameState.save();
        Router.result(r.message, 'bad');
        setTimeout(() => Nego.goPlayer(pid), 1200);
        return;
    }
    if (r.status === 'counter') c.wage = r.counter;
    GameState.save();   // persist the threat meter carried on o.neg
    Router.refresh();
    const msgEl = document.getElementById('wageMsg');
    if (msgEl) msgEl.innerHTML = `<div class="hint" style="margin:-8px 0 var(--space-3)">"${r.message}"</div>`;
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
            <div class="frow"><span class="frow__k">${I18n.t('nego.club')}</span><span class="frow__v">${to.name}, ${to.divisionName}${this.clubPosLine(to.id)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.from')}</span><span class="frow__v">${p.clubId ? (Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : '') : ''}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.theyPropose')}</span><span class="frow__v">${roleLabel(o.role || 'starter', p.age)}</span></div>
        </div>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">${I18n.t('nego.loanIntro')}</p>
        <label class="field-label">${I18n.t('nego.askForRole')} <span id="negoLoanRoleVal" style="color:var(--accent-text)">${roleLabel(c.loanRole, p.age)}</span> ${I18n.t('nego.roleAgreed')}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','loanRole',this.value)">${ROLE_ORDER.map(r => `<option value="${r}" ${r === c.loanRole ? 'selected' : ''}>${roleLabel(r, p.age)}</option>`).join('')}</select>
        <button class="btn btn--accent-outline btn--sm" style="margin:var(--space-2) 0 var(--space-4);width:auto" onclick="Nego.negLoanRole('${m.id}')"><i class="ti ti-send"></i>${I18n.t('nego.putToClub')}</button>
        <div id="loanMsg"></div>
        ${others.length ? `<div class="result info">${I18n.t('nego.otherClubsAfter', { name: p.name })} ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''}</a>`).join(' · ')}</div>` : ''}
        ${inWindow ? `<label class="field-label">${I18n.t('nego.loanDuration')}</label><select class="select-input" onchange="Nego.slide('${m.id}','duration',this.value)">${durOpts.map((d, i) => `<option value="${d.code}" ${d.code === c.duration ? 'selected' : ''}>${Agency.durLabel(d.label)}</option>`).join('')}</select>` : contractTooShort ? `<div class="result info">${I18n.t('nego.loanContractShort', { name: p.name, club: Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : I18n.t('nego.hisClub') })}</div>` : `<div class="result info">${I18n.t('nego.loanWindowOnly')}</div>`}
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>${I18n.t('nego.decline')}</button>
            ${inWindow ? `<button class="btn btn--primary" onclick="Nego.acceptLoan('${m.id}')"><i class="ti ti-check"></i>${I18n.t('nego.acceptLoan')}</button>` : ''}
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
    el.innerHTML = `<p class="hint">${(SPONSOR_LABEL[o.level] || I18n.t('nego.sponsorWord'))} ${I18n.t('nego.sponsorIntro', { comm })}</p>
        ${opts.map((opt, i) => {
        const wCut = Math.round(opt.weekly * comm / 100), aCut = Math.round((opt.annual || 0) * comm / 100);
        return `<div class="fcard"${opt.standout ? ' style="border-color:var(--accent)"' : ''}>
                <div class="frow" style="border-bottom:.5px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${opt.company}${opt.standout ? ` <span class="pill pill--accent" style="font-size:10px">${I18n.t('nego.standoutOffer')}</span>` : ''}</span></div>
                <div class="frow"><span class="frow__k">${I18n.t('nego.weekly')}</span><span class="frow__v">${UI.euro(opt.weekly)}/wk <span class="muted">${I18n.t('nego.cutWk', { cut: UI.euro(wCut) })}</span></span></div>
                <div class="frow"><span class="frow__k">${I18n.t('nego.annualLump')}</span><span class="frow__v">${UI.euro(opt.annual || 0)}/yr <span class="muted">${I18n.t('nego.cutYr', { cut: UI.euro(aCut) })}</span></span></div>
                <div class="frow"><span class="frow__k">${I18n.t('nego.term')}</span><span class="frow__v">${I18n.t('clienthist.seasonsN', { n: opt.termSeasons })}</span></div>
                <div style="padding:8px 0"><button class="btn btn--primary btn--sm" onclick="Nego.acceptSponsor('${m.id}',${i})"><i class="ti ti-signature"></i>${I18n.t('nego.signThis')}</button></div>
            </div>`;
    }).join('')}
        <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>${I18n.t('nego.declineAll')}</button>
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
