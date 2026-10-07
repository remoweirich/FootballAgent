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

// The offering/bidding club, as a line you can read AND tap through to: its name links to the club
// page, and its reputation is spelled out so you can judge whether the move is a step up or down.
Nego.clubLine = function (club) {
    return `<a href="${Router.link('clubs', club.id)}" style="color:inherit;text-decoration:underline;text-underline-offset:2px">${UI.esc(club.name)}</a>, ${club.divisionName} · ${I18n.t('common.reputation')} ${club.reputation}${this.clubPosLine(club.id)}`;
};

// Player names in a mail's text become links to the player. Names are NOT unique (hundreds of
// players share one with someone), so a name alone cannot say who is meant: a mail that knows
// which players it is about lists their ids (m.playerIds, or the one player of playerIdOf), and
// those always win. The n-th time a name appears links to the n-th listed player of that name, so
// even two namesakes in one scout report each get their own link. A name the mail does not list
// falls back to the first known player who has it.
Nego.linkifyPlayers = function (html, m) {
    if (!html) return html;
    const byName = new Map();   // name -> players, in the order that name's mentions should link to
    const ids = (m && m.playerIds) || [this.playerIdOf(m)];
    ids.forEach(id => {
        const p = id && GameState.getPlayer(id);
        if (!p || !p.name) return;
        if (!byName.has(p.name)) byName.set(p.name, []);
        byName.get(p.name).push(p);
    });
    GameState.players.forEach(p => {
        if (p.name && !byName.has(p.name) && (p.agentId === 'me' || p.everClient || p.knownToAgent)) byName.set(p.name, [p]);
    });
    let out = html;
    // longest names first, so "Joe Smithson" is linked before "Joe Smith" could bite into it
    [...byName.keys()].sort((a, b) => b.length - a.length).forEach(name => {
        const list = byName.get(name);
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('(^|[^\\w>])(' + esc + ')(?![\\w<])', 'g');
        let n = 0;
        out = out.replace(re, (mm, pre, nm) => {
            const p = list[Math.min(n++, list.length - 1)];
            return `${pre}<a href="${Router.link('client', p.id)}" style="color:var(--accent-text)">${nm}</a>`;
        });
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
        <div data-wt="inbox-list">${GameState.inbox.map(m => {
            const off = m.offer ? Nego.mailMeta(m) : '';
            // an invitation row opens the finals overview, not a mail detail
            const href = m.kind === 'attend' ? Router.link('attendfinals') : Router.link('mail', m.id);
            return `<a class="list-row" href="${href}" style="cursor:pointer;${m.read ? '' : 'background:var(--accent-fill)'}">
                <div class="row-ico" style="background:color-mix(in srgb, ${UI.kindColor(m.kind)} 16%, transparent);color:${UI.kindColor(m.kind)}"><i class="ti ${UI.kindIcon(m.kind)}"></i></div>
                <div style="flex:1;min-width:0"><div class="row-title">${UI.esc(m.subject)}</div><div class="row-sub">W${m.week} ${m.season}${off ? ' · ' + off : ''}</div></div>
                ${!m.read ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex:none"></span>' : ''}
            </a>`;
        }).join('')}</div>`;
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
            <div class="row-title">${UI.flag(p.nationality)} ${UI.esc(p.name)}</div>
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
        <div style="color:var(--text-secondary);line-height:1.6">${this.linkifyPlayers(m.body || '', m)}</div>
        <div class="flex-row" style="margin-top:var(--space-6)"><button class="btn btn--ghost" onclick="Nego.dismiss('${m.id}')"><i class="ti ti-trash"></i>${I18n.t('nego.dismiss')}</button><button class="btn btn--primary" onclick="Router.back('inbox')">${I18n.t('common.close')}</button></div>`;
};
Nego.dismiss = function (id) {
    const mail = GameState.inbox.find(m => m.id === id);
    const pid = this.playerIdOf(mail);
    // binning the mail would lose the offer just as surely as rejecting it
    if (mail && mail.kind === 'loan' && typeof Walkthrough !== 'undefined'
        && Walkthrough.blocksLoanReject(pid, false)) return Walkthrough.refuseLoanReject();
    GameState.removeMail(id); GameState.save(); this.goPlayer(pid);
};
Nego.reject = function (id) {
    const m = GameState.inbox.find(x => x.id === id) || {};
    const pid = this.playerIdOf(m);
    // the walkthrough needs one loan accepted before it can finish
    if (m.kind === 'loan' && typeof Walkthrough !== 'undefined'
        && Walkthrough.blocksLoanReject(pid, false)) return Walkthrough.refuseLoanReject();
    Agency.declineMail(m); GameState.save(); this.goPlayer(pid);
};

// ---------------- Transfer ----------------
Nego.transfer = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId), from = Clubs.getClubById(o.fromClubId);
    if (!p || !to) { this.dismiss(m.id); return; }
    const termCap = Agency.maxContractTerm(p, to);
    const bonusMax = Math.max(Agency.maxSigningBonus(p, o.proposedWage), Agency.agentFeeCap(o.transferFee));
    const c = this.ctxFor(m.id);
    if (c.wage == null) Object.assign(c, o.agreed || { wage: o.proposedWage, role: o.role || 'rotation', cupKeeper: false, term: Math.min(3, termCap), bonus: 0 });
    c._bonusStep = Math.max(10, Math.round(bonusMax / 50));
    if (!o.agreed) this.agree(m, c);   // the club's opening offer is the first thing it has agreed to
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    const fromLeague = Agency.isFreeAgent(p) || !from ? I18n.t('nego.freeAgentNoClub') : `${UI.esc(from.name)}, ${from.divisionName}`;
    const feeLine = Agency.isFreeAgent(p) ? I18n.t('nego.freeTransfer') : I18n.t('nego.agreedFee', { fee: UI.euro(o.transferFee) });
    const others = GameState.inbox.filter(x => x.kind === 'transfer' && x.offer.playerId === p.id && x.id !== m.id);

    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(to.id)}"</p>
        <div style="margin:6px 0 var(--space-3)">${UI.relBadge(to.id)}</div>
        <div class="fcard">
            <div class="frow"><span class="frow__k">${I18n.t('nego.playersWage')}</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentClub')}</span><span class="frow__v">${fromLeague}${this.clubPosLine(o.fromClubId)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentRole')}</span><span class="frow__v">${Agency.isFreeAgent(p) ? '\u2014' : roleName(p)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.biddingClub')}</span><span class="frow__v">${this.clubLine(to)}</span></div>
        </div>
        <p class="hint">${p.ability} OVR · ${p.age}y · ${feeLine}${o.initiatedByAgent ? I18n.t('nego.youPitched') : ''}</p>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">${I18n.t('nego.transferIntro')}</p>
        <label class="field-label">${I18n.t('nego.wageAt', { club: to.name })} <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">${I18n.t('nego.yourCut', { cut: `<span id="negoCutVal">${UI.euro(cut(c.wage))}</span>` })}</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <label class="field-label">${I18n.t('nego.squadRole')}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${this.roleOptionsHtml(p, c.role, c.cupKeeper)}</select>
        <label class="field-label">${I18n.t('nego.contractLength')} <span id="negoTermVal" class="editable-val">${c.term}</span>${I18n.t('nego.seasonsSuffix')}${termCap < 6 ? ` <span class="muted">${I18n.t('nego.maxTerm', { cap: termCap })}</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        <label class="field-label">${I18n.t('nego.agentFee')} <span id="negoBonusVal" class="editable-val">${UI.euro(c.bonus)}</span></label>
        <input class="range" type="range" min="0" max="${bonusMax}" step="${c._bonusStep}" value="${c.bonus}" oninput="Nego.slide('${m.id}','bonus',this.value)">
        ${others.length ? `<div class="result info">${I18n.t('nego.competingBids')} ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''} · ${roleLabel(x.offer.role || 'rotation', p.age, p.position)}</a>`).join(' · ')}</div>` : ''}
        ${this.patienceCue(o.neg)}
        ${this.actionsHtml(m, 'nego.reject', 'nego.acceptTransfer')}`;
};

// ---------------- Agreed terms ----------------
// Accept only ever signs terms the club has said yes to: its opening offer, or a package it agreed
// to (or countered with) after "Suggest terms". Touch a slider, the role or the length and Accept
// greys out; put them back exactly and it lights up again. The agreed package lives on the offer,
// so it survives a reload, and Accept signs THAT package, never whatever the controls happen to say.
Nego.AGREED_KEYS = {
    transfer: ['wage', 'role', 'cupKeeper', 'term', 'bonus'],
    renewal: ['wage', 'role', 'cupKeeper', 'term'],
    loan: ['loanRole', 'loanCup', 'duration'],
};
Nego.agree = function (m, c) {
    const a = {};
    this.AGREED_KEYS[m.kind].forEach(k => { a[k] = c[k]; });
    m.offer.agreed = a;
};
Nego.matchesAgreed = function (m, c) {
    const a = m && m.offer && m.offer.agreed;
    if (!a) return false;
    return this.AGREED_KEYS[m.kind].every(k => {
        // a slider lands on its own notches (wage in 10s), so an agreed figure between two notches
        // counts as matched at the nearest one: "put it back" has to be something a thumb can do
        if (k === 'wage') return Math.abs(c.wage - a.wage) <= 5;
        if (k === 'bonus') return Math.abs(c.bonus - a.bonus) <= (c._bonusStep || 10) / 2;
        if (k === 'cupKeeper' || k === 'loanCup') return !!c[k] === !!a[k];
        return String(c[k]) === String(a[k]);   // select values arrive as strings
    });
};
// Decline + Suggest terms side by side, Accept full width beneath them. Suggest is pointless (and
// would only cost patience) while the controls already show agreed terms, so the two buttons are
// never live at once.
Nego.actionsHtml = function (m, rejectKey, acceptKey, canAccept = true) {
    const c = this.ctxFor(m.id), ok = this.matchesAgreed(m, c);
    return `${c.reply ? `<div class="result ${c.reply.cls}">${c.reply.msg}</div>` : ''}
        <div class="flex-row" style="margin-top:var(--space-5)">
            <button class="btn btn--danger" onclick="Nego.reject('${m.id}')"><i class="ti ti-x"></i>${I18n.t(rejectKey)}</button>
            <button id="negoSuggest" class="btn btn--accent-outline" onclick="Nego.suggest('${m.id}')" ${ok ? 'disabled' : ''}><i class="ti ti-send"></i>${I18n.t('nego.suggestTerms')}</button>
        </div>
        ${canAccept ? `<button id="negoAccept" class="btn btn--primary" style="margin-top:var(--space-3)" onclick="Nego.accept('${m.id}')" ${ok ? '' : 'disabled'}><i class="ti ti-check"></i>${I18n.t(acceptKey)}</button>
        <p id="negoLocked" class="hint" style="margin-top:6px;${ok ? 'display:none' : ''}">${I18n.t('nego.acceptLocked')}</p>` : ''}
        <div id="actionResult"></div>`;
};
Nego.syncAgreed = function (id) {
    const m = GameState.inbox.find(x => x.id === id);
    if (!m || !m.offer) return;
    const ok = this.matchesAgreed(m, this.ctxFor(id));
    const acc = document.getElementById('negoAccept'), sug = document.getElementById('negoSuggest'), note = document.getElementById('negoLocked');
    if (acc) acc.disabled = !ok;
    if (sug) sug.disabled = ok;
    if (note) note.style.display = ok ? 'none' : '';
};
Nego.suggest = function (id) {
    const m = GameState.inbox.find(x => x.id === id);
    if (!m) return;
    if (m.kind === 'transfer') this.suggestTransfer(id);
    else if (m.kind === 'renewal') this.suggestRenewal(id);
    else if (m.kind === 'loan') this.suggestLoan(id);
};
Nego.accept = function (id) {
    const m = GameState.inbox.find(x => x.id === id);
    // the button is greyed out whenever this fails; this is the belt to its braces
    if (!m || !this.matchesAgreed(m, this.ctxFor(id))) return;
    if (m.kind === 'transfer') this.acceptTransfer(id);
    else if (m.kind === 'renewal') this.acceptRenewal(id);
    else if (m.kind === 'loan') this.acceptLoan(id);
};
// the club walked: the offer is gone, show why and move on to the player
Nego.walkout = function (m, message) {
    const pid = this.playerIdOf(m);
    GameState.removeMail(m.id); GameState.save();
    Router.result(message, 'bad');
    setTimeout(() => Nego.goPlayer(pid), 1200);
};
// a deal signed (or refused at the last check): the result, then on to the player
Nego.concluded = function (m, r) {
    const pid = this.playerIdOf(m);
    GameState.save();
    if (r.ok && typeof Sound !== 'undefined') Sound.play('cash');
    Router.result(r.message, r.ok ? 'ok' : 'bad');
    if (r.ok) setTimeout(() => Nego.goPlayer(pid), 900);
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
// Role dropdown <option>s for a player. Goalkeepers get their depth-chart names (First Choice,
// Back Up, Star Player…) plus a Cup Goalkeeper slot (a Back Up who takes the cup ties); outfield
// players get the plain tier list. The '__cup__' value maps to role 'rotation' + a cup-keeper flag.
Nego.roleOptionsHtml = function (p, selRole, selCup) {
    const gk = p.position === 'GK';
    const sel = (gk && selCup) ? '__cup__' : selRole;
    const opts = [];
    ROLE_ORDER.forEach(r => {
        opts.push([r, roleLabel(r, p.age, p.position, false)]);
        if (gk && r === 'rotation') opts.push(['__cup__', roleLabel('rotation', p.age, 'GK', true)]);
    });
    return opts.map(o => `<option value="${o[0]}" ${o[0] === sel ? 'selected' : ''}>${o[1]}</option>`).join('');
};
// every change re-checks the controls against the agreed terms (see Nego.syncAgreed)
Nego.slide = function (id, key, val) {
    this._slide(id, key, val);
    this.syncAgreed(id);
};
Nego._slide = function (id, key, val) {
    const c = this.ctxFor(id);
    if (key === 'duration') { c.duration = val; return; }
    // the goalkeeper "Cup Goalkeeper" option is a Back Up (rotation) flagged to play the cup ties
    if (key === 'role') {
        if (val === '__cup__') { c.role = 'rotation'; c.cupKeeper = true; } else { c.role = val; c.cupKeeper = false; }
        return;
    }
    if (key === 'loanRole') {
        if (val === '__cup__') { c.loanRole = 'rotation'; c.loanCup = true; } else { c.loanRole = val; c.loanCup = false; }
        const m = GameState.inbox.find(x => x.id === id), p = m ? GameState.getPlayer(m.offer.playerId) : null;
        const el = document.getElementById('negoLoanRoleVal');
        if (el && p) el.textContent = roleLabel(c.loanRole, p.age, p.position, c.loanCup);
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
// The club answers with a package it will sign: yours if it said yes, its own counter if not.
// Either way that package becomes the agreed one and goes into the controls, ready to accept.
Nego.suggestTransfer = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.toClubId);
    const c = this.ctxFor(mailId);
    const pkg = { wage: c.wage, role: c.role, term: c.term, bonus: c.bonus, fee: o.transferFee };
    if (!o.neg) o.neg = Agency.initNeg(null, club, o.proposedWage);
    const r = Agency.evaluateTransfer(p, club, pkg, o.neg);
    o.neg = r.neg;
    if (r.status === 'walkout') return this.walkout(m, r.message);
    const cc = r.counter; c.wage = cc.wage; c.role = cc.role; c.term = cc.term; c.bonus = cc.bonus;
    if (cc.role !== 'rotation') c.cupKeeper = false;   // Cup Goalkeeper only holds if the club still sees him as a Back Up
    this.agree(m, c);
    c.reply = r.status === 'accept' ? { msg: r.message, cls: 'ok' }
        : { msg: `${r.message}<br><span class="muted">${I18n.t('nego.theirPackage', { wage: UI.euro(cc.wage), role: roleLabel(cc.role, p.age, p.position, c.cupKeeper), term: cc.term, bonus: UI.euro(cc.bonus) })}</span>`, cls: r.status === 'close' ? 'info' : 'bad' };
    GameState.save();   // persist the threat meter carried on o.neg, and the agreed package
    Router.refresh();
};
Nego.acceptTransfer = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), a = m.offer.agreed;
    this.concluded(m, Agency.acceptTransfer(m, a.wage, a.role, a.term, a.bonus, { cupKeeper: a.cupKeeper }));
};

// ---------------- Renewal ----------------
Nego.renewal = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
    if (!p || !club) { this.dismiss(m.id); return; }
    const termCap = Agency.maxContractTerm(p, club);
    const c = this.ctxFor(m.id);
    if (c.wage == null) {
        // the club offers him his current role, unless he has outgrown its view of him: then the
        // most it will give, so its own opening offer is always one it would actually sign
        const role = Agency.roleAcceptable(p, club, p.squadRole) ? p.squadRole : Agency.clubRoleCeiling(p, club);
        Object.assign(c, o.agreed || { wage: o.proposedWage, role, cupKeeper: role === p.squadRole && !!p.cupKeeper, term: Math.min(o.proposedTermSeasons || 2, termCap) });
    }
    if (!o.agreed) this.agree(m, c);
    const wageMax = Math.max(o.proposedWage * 3, p.wage * 3, 3000);
    const cut = w => Math.round(w * p.wageCommission / 100);
    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(club.id)}"</p>
        <div style="margin:6px 0 var(--space-3)">${UI.relBadge(club.id)}</div>
        <div class="fcard">
            <div class="frow"><span class="frow__k">${I18n.t('nego.currentWage')}</span><span class="frow__v">${UI.euro(p.wage)}/wk</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.club')}</span><span class="frow__v">${UI.esc(club.name)}, ${club.divisionName}${this.clubPosLine(club.id)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.roleUntil')}</span><span class="frow__v">${roleName(p)} · ${GameState.seasonLabelFor(p.contractUntilSeason)}</span></div>
        </div>
        <label class="field-label">${I18n.t('nego.wage')} <span id="negoWageVal" class="editable-val">${UI.euro(c.wage)}</span>/wk <span class="muted">${I18n.t('nego.yourCutPct', { cut: `<span id="negoCutVal">${UI.euro(cut(c.wage))}</span>`, pct: p.wageCommission })}</span></label>
        <input class="range" type="range" min="${o.proposedWage}" max="${wageMax}" step="10" value="${c.wage}" oninput="Nego.slide('${m.id}','wage',this.value)">
        <label class="field-label">${I18n.t('nego.squadRoleAt', { club: club.name })}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','role',this.value)">${this.roleOptionsHtml(p, c.role, c.cupKeeper)}</select>
        <label class="field-label">${I18n.t('nego.contractLength')} <span id="negoTermVal" class="editable-val">${c.term}</span>${I18n.t('nego.seasonsSuffix')}${termCap < 6 ? ` <span class="muted">${I18n.t('nego.maxTerm', { cap: termCap })}</span>` : ''}</label>
        <input class="range" type="range" min="1" max="${termCap}" value="${c.term}" oninput="Nego.slide('${m.id}','term',this.value)">
        ${this.patienceCue(o.neg)}
        ${this.actionsHtml(m, 'nego.decline', 'nego.acceptRenewal')}`;
};
// wage, role and length go to the club together; it answers with a package it will sign
Nego.suggestRenewal = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), o = m.offer, p = GameState.getPlayer(o.playerId), club = Clubs.getClubById(o.clubId);
    const c = this.ctxFor(mailId);
    if (!o.neg) o.neg = Agency.initNeg(null, club, o.proposedWage);
    const r = Agency.evaluateRenewal(p, club, { wage: c.wage, role: c.role, term: c.term }, o.neg, o.proposedWage);
    o.neg = r.neg;
    if (r.status === 'walkout') return this.walkout(m, r.message);
    const cc = r.counter; c.wage = cc.wage; c.role = cc.role; c.term = cc.term;
    if (cc.role !== 'rotation') c.cupKeeper = false;
    this.agree(m, c);
    c.reply = { msg: `"${r.message}"`, cls: r.status === 'accept' ? 'ok' : 'info' };
    GameState.save();   // persist the threat meter carried on o.neg, and the agreed package
    Router.refresh();
};
Nego.acceptRenewal = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), a = m.offer.agreed;
    this.concluded(m, Agency.acceptRenewal(m, a.wage, a.role, a.term, { cupKeeper: a.cupKeeper }));
};

// ---------------- Loan ----------------
Nego.loan = function (el, m) {
    const o = m.offer, p = GameState.getPlayer(o.playerId), to = Clubs.getClubById(o.toClubId);
    if (!p || !to) { this.dismiss(m.id); return; }
    const c = this.ctxFor(m.id);
    if (!c.loanRole) { Object.assign(c, o.agreed || { loanRole: o.role || 'starter', loanCup: false }); c.loanRound = 1; }
    const others = GameState.inbox.filter(x => x.kind === 'loan' && x.offer.playerId === p.id && x.id !== m.id);
    const durOpts = Agency.loanDurationOptions(p);
    const inWindow = durOpts.length > 0;
    // his own contract with the current club is too short for any loan length at all - distinct
    // from "no window open" (which loanDurationOptions() always has *some* answer for)
    const contractTooShort = durOpts.length === 0 && Agency.loanDurationOptions().length > 0;
    // the lengths on offer move with the calendar: one agreed (or picked) weeks ago may be gone
    const offered = code => durOpts.some(d => String(d.code) === String(code));
    if (inWindow && !offered(c.duration)) c.duration = durOpts[0].code;
    if (inWindow && o.agreed && !offered(o.agreed.duration)) o.agreed.duration = durOpts[0].code;
    if (!o.agreed) this.agree(m, c);
    el.innerHTML = `<p style="font-style:italic;color:var(--text-secondary)">"${Agency.greetingFor(to.id)}"</p>
        <div style="margin:6px 0 var(--space-3)">${UI.relBadge(to.id)}</div>
        <div class="fcard">
            <div class="frow"><span class="frow__k">${I18n.t('nego.club')}</span><span class="frow__v">${this.clubLine(to)}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.from')}</span><span class="frow__v">${p.clubId ? (Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : '') : ''}</span></div>
            <div class="frow"><span class="frow__k">${I18n.t('nego.theyPropose')}</span><span class="frow__v">${roleLabel(o.role || 'starter', p.age, p.position)}</span></div>
        </div>
        <p style="color:var(--text-secondary);font-size:var(--fs-sm)">${I18n.t('nego.loanIntro')}</p>
        <label class="field-label">${I18n.t('nego.askForRole')} <span id="negoLoanRoleVal" style="color:var(--accent-text)">${roleLabel(c.loanRole, p.age, p.position, c.loanCup)}</span> ${I18n.t('nego.roleAgreed')}</label>
        <select class="select-input" onchange="Nego.slide('${m.id}','loanRole',this.value)">${this.roleOptionsHtml(p, c.loanRole, c.loanCup)}</select>
        ${others.length ? `<div class="result info">${I18n.t('nego.otherClubsAfter', { name: p.name })} ${others.map(x => `<a href="${Router.link('mail', x.id)}" style="color:var(--info-text)">${Clubs.getClubById(x.offer.toClubId) ? Clubs.getClubById(x.offer.toClubId).name : ''}</a>`).join(' · ')}</div>` : ''}
        ${inWindow ? `<label class="field-label">${I18n.t('nego.loanDuration')}</label><select class="select-input" onchange="Nego.slide('${m.id}','duration',this.value)">${durOpts.map((d, i) => `<option value="${d.code}" ${d.code === c.duration ? 'selected' : ''}>${Agency.durLabel(d.label)}</option>`).join('')}</select>` : contractTooShort ? `<div class="result info">${I18n.t('nego.loanContractShort', { name: p.name, club: Clubs.getClubById(p.clubId) ? Clubs.getClubById(p.clubId).name : I18n.t('nego.hisClub') })}</div>` : `<div class="result info">${I18n.t('nego.loanWindowOnly')}</div>`}
        ${this.actionsHtml(m, 'nego.decline', 'nego.acceptLoan', inWindow)}`;
};
// The role goes to the club; the length is the agent's pick from the lengths the window allows.
// A yes holds the role AND the length on screen; a no puts the club's role in the dropdown.
Nego.suggestLoan = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), p = GameState.getPlayer(m.offer.playerId), club = Clubs.getClubById(m.offer.toClubId);
    const c = this.ctxFor(mailId), a = m.offer.agreed;
    // only the length changed: the club already agreed this role, so it is not haggled (or
    // re-rolled) a second time
    const r = (a && a.loanRole === c.loanRole && !!a.loanCup === !!c.loanCup)
        ? { status: 'accept', role: c.loanRole, message: I18n.t('nego.loanRole.accept', { name: p.name, role: roleLabel(c.loanRole, p.age, p.position, c.loanCup) }) }
        : Agency.negotiateLoanRole(p, club, c.loanRole, c.loanRound++);
    if (r.status !== 'accept') { c.loanRole = r.role; c.loanCup = false; }
    this.agree(m, c);
    c.reply = { msg: `"${r.message}"`, cls: r.status === 'accept' ? 'ok' : 'info' };
    GameState.save();
    Router.refresh();
};
Nego.acceptLoan = function (mailId) {
    const m = GameState.inbox.find(x => x.id === mailId), a = m.offer.agreed;
    this.concluded(m, Agency.acceptLoanOffer(m, a.loanRole, a.duration, a.loanCup));
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
