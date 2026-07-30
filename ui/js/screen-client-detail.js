// ============================================================
//  Client detail — header + 7 tabs (Overview, Potential, Morale,
//  Injuries, Contract, Development, History). Also serves scouted
//  prospects (not yet signed) and retired/released ex-clients,
//  which show a reduced tab set with no management actions.
// ============================================================
const ClientDetail = {
    state: {}, // per-player-id local UI state (expanded seasons, career mode, shop picker…)

    ctx(id) {
        if (!this.state[id]) this.state[id] = { tab: 'overview', expanded: {}, careerOpen: false, careerMode: 'club', shop: null };
        return this.state[id];
    },

    render(el, id) {
        const p = GameState.getPlayer(id);
        if (!p) { el.innerHTML = `<div class="empty">${I18n.t('cd.notFound')}</div>`; return; }
        const mine = p.agentId === 'me';
        const ctx = this.ctx(id);
        // a genuine (re-)entry into this player's screen always lands on Overview — no
        // memory of whatever tab was open last time; Router.refresh() (staying put after
        // an in-screen action) is not a re-entry and leaves the active tab alone
        if (Router.isFreshNav) ctx.tab = 'overview';
        const tabs = mine ? ['overview', 'potential', 'morale', 'injuries', 'contract', 'development', 'history']
            : ['overview', 'potential', 'development', 'history'];
        if (!tabs.includes(ctx.tab)) ctx.tab = 'overview';
        const curr = p.clubId ? UI.currentClubInfo(p) : null;
        const labels = { overview: I18n.t('cd.tab.overview'), potential: I18n.t('cd.tab.potential'), morale: I18n.t('cd.tab.morale'), injuries: I18n.t('cd.tab.injuries'), contract: I18n.t('cd.tab.contract'), development: I18n.t('cd.tab.development'), history: I18n.t('cd.tab.history') };

        let body = '';
        if (ctx.tab === 'overview') body = this.tabOverview(p, mine);
        else if (ctx.tab === 'potential') body = this.tabPotential(p);
        else if (ctx.tab === 'morale') body = this.tabMorale(p);
        else if (ctx.tab === 'injuries') body = this.tabInjuries(p);
        else if (ctx.tab === 'contract') body = this.tabContract(p);
        else if (ctx.tab === 'development') body = this.tabDevelopment(p);
        else if (ctx.tab === 'history') body = this.tabHistory(p);

        el.innerHTML = `
        <div class="flex-row" style="align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-4)">
            <div style="flex:1;min-width:0">
                <div class="flex-row" style="gap:8px"><span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${p.name}</span>${p.retired ? `<span class="pill" style="padding:2px 8px">${I18n.t('cd.retiredText')}</span>` : p.retiringThisSeason ? `<span class="pill pill--gold" style="padding:2px 8px">${I18n.t('cd.retiringText')}</span>` : ''}</div>
                <div class="cl-sub" style="margin-top:5px">${UI.flag(p.nationality)} ${p.nationality} <span style="color:var(--text-chevron)">·</span> ${p.position} <span style="color:var(--text-chevron)">·</span> ${p.age}y</div>
                <div class="cl-sub" style="margin-top:4px">${curr ? `${curr.club ? UI.crest(curr.club) : ''}${curr.club ? `<a href="${Router.link('clubs', curr.club.id)}" style="color:${curr.tag ? 'var(--info-text)' : 'var(--text-secondary)'}">${curr.name}</a>` : `<span style="color:var(--info-text)">${curr.name}</span>`}${curr.tag ? ` <span style="color:var(--info-text)">(${curr.tag})</span>` : ''} <span style="color:var(--text-chevron)">·</span> ${curr.club ? `<a href="#" onclick="event.preventDefault();LeaguesScreen.openFor('${curr.club.division}')" style="color:var(--text-secondary)">${curr.club.divisionName}</a>` : ''}${curr.parent ? ` <span style="color:var(--text-chevron)">·</span> <span style="color:var(--text-muted)">${I18n.t('cd.onLoanFrom', { parent: UI.esc(curr.parent) })}</span>` : ''}` : (p.freeAgent ? I18n.t('common.freeAgent') : (p.joiningClubId ? I18n.t('cd.joining', { club: UI.clubName(p.joiningClubId) }) : '—'))}</div>
            </div>
            ${UI.abilityBadge(p.ability, true)}
        </div>
        <div class="tab-bar tab-bar--sticky" style="margin:0 0 var(--space-4)">${tabs.map(t => `<button class="tab ${ctx.tab === t ? 'is-active' : ''}" onclick="ClientDetail.setTab('${id}','${t}')">${labels[t]}</button>`).join('')}</div>
        <div>${body}</div>
        <div id="actionResult"></div>`;
    },
    setTab(id, tab) { this.ctx(id).tab = tab; Router.refresh(); },

    // ---------------- Overview ----------------
    tabOverview(p, mine) {
        const club = Clubs.getClubById(p.clubId), tot = seasonTotals(p, GameState.seasonStartYear);
        const offers = GameState.inbox.filter(m => m.offer && m.offer.playerId === p.id);
        const rejectable = offers.filter(m => m.kind === 'transfer' || m.kind === 'loan').length;
        const offerHtml = offers.length ? `<div class="section-label" style="margin-top:var(--space-5)">${I18n.t('cd.openOffers')}</div>${offers.map(m =>
            `<a class="list-row" href="${Router.link('mail', m.id)}" style="cursor:pointer"><div class="row-ico" style="background:color-mix(in srgb, ${UI.kindColor(m.kind)} 16%, transparent);color:${UI.kindColor(m.kind)}"><i class="ti ${UI.kindIcon(m.kind)}"></i></div><div style="flex:1;min-width:0"><div class="row-title">${UI.esc(m.subject)}</div></div><i class="ti ti-chevron-right row-chev"></i></a>`).join('')}
            ${rejectable > 1 ? `<button class="btn btn--danger btn--sm" style="width:auto" onclick="ClientDetail.rejectAll('${p.id}')"><i class="ti ti-x"></i>${I18n.t('cd.rejectAllN', { n: rejectable })}</button>` : ''}` : '';

        const atReserve = isReserveClub(p.clubId);
        let statusRow = '';
        let actions = '';
        if (mine) {
            statusRow = `<div class="chip-row" style="margin-bottom:var(--space-4)">
                <button class="cl-chip ${p.transferListed ? 'cl-on' : ''}" onclick="ClientDetail.toggleTL('${p.id}')">${p.transferListed ? I18n.t('cd.transferListed') : I18n.t('cd.requestTL')}</button>
                ${p.loanListed ? `<span class="cl-chip cl-on">${I18n.t('cd.loanListed')}</span>` : ''}
                ${p.onLoanAt ? `<span class="cl-chip cl-on">${isU21Loan(p) ? I18n.t('cd.inU21', { club: UI.clubName(p.onLoanAt) }) : I18n.t('cd.onLoanClub', { club: UI.clubName(p.onLoanAt) })}</span>` : atReserve ? `<span class="cl-chip cl-on">${I18n.t('cd.reserveClub', { club: UI.clubName(p.clubId) })}</span>` : ''}
                ${p.settling ? `<span class="cl-chip cl-on">${I18n.t('cd.settlingAbroad', { w: p.settling.weeksLeft })}</span>` : ''}
                ${p.repExpired ? `<span class="cl-chip cl-on">${I18n.t('cd.repTermUp')}</span>` : ''}
            </div>`;
            let moveBtns = '';
            if (!p.onLoanAt) {
                moveBtns = `<button class="btn btn--accent-outline" onclick="ClientDetail.openShop('${p.id}')"><i class="ti ti-send"></i>${I18n.t('cd.shopToClubs')}</button>
                    <button class="btn btn--ghost" onclick="ClientDetail.reqLoan('${p.id}')"><i class="ti ti-tag"></i>${I18n.t('cd.requestLoan')}</button>
                    ${atReserve ? `<button class="btn btn--ghost" onclick="ClientDetail.reqPromote('${p.id}')"><i class="ti ti-arrow-up"></i>${I18n.t('cd.requestPromotion')}</button>` : `<button class="btn btn--ghost" onclick="ClientDetail.sendU21('${p.id}')"><i class="ti ti-arrow-down"></i>${I18n.t('cd.sendReserves')}</button>`}`;
            } else if (isU21Loan(p) || isReserveClub(p.onLoanAt)) {
                moveBtns = `<button class="btn btn--accent-outline" onclick="ClientDetail.reqU21Recall('${p.id}')"><i class="ti ti-arrow-up"></i>${I18n.t('cd.requestRecall', { club: UI.clubName(p.onLoanAt) })}</button>`;
            }
            const ci = (typeof Dialogue !== 'undefined') ? Dialogue.canCheckIn(p) : { ok: false };
            const checkinBtn = `<button class="btn btn--ghost" ${ci.ok ? '' : 'disabled'} onclick="ClientDetail.checkIn('${p.id}')"><i class="ti ti-message-circle"></i>${ci.ok ? I18n.t('cd.checkIn') : ci.reason === 'cooldown' ? I18n.t('cd.checkedInRecently', { w: ci.weeksLeft }) : I18n.t('cd.checkIn')}</button>`;
            actions = `<div class="gap-2" style="display:flex;flex-direction:column;margin-top:var(--space-4)">${moveBtns}${checkinBtn}<button class="btn btn--ghost" onclick="ClientDetail.reqRenewal('${p.id}')"><i class="ti ti-file-pencil"></i>${I18n.t('cd.renewalTalks')}</button></div>`;
        } else {
            const gate = Agency.canSign(p);
            actions = gate.ok
                ? `<button class="btn btn--primary" style="margin-top:var(--space-4)" onclick="ClientDetail.openSign('${p.id}')"><i class="ti ti-signature"></i>${I18n.t('cd.offerRep')}</button>`
                : `<div class="result info">${gate.reason}</div>`;
        }
        return `${statusRow}
            <div class="info-grid">
                <div class="info"><span>${I18n.t('cd.wage')}</span><b>${this.wageText(p)}</b></div>
                <div class="info"><span>${I18n.t('cd.role')}</span><b>${roleName(p)}</b></div>
                <div class="info"><span>${I18n.t('cd.contract')}</span><b>${this.contractText(p)}</b></div>
                <div class="info"><span>${I18n.t('cd.status')}</span><b>${p.injury ? I18n.t('cd.injured') : p.onLoanAt ? I18n.t('cd.onLoanStatus') : I18n.t('cd.available')}</b></div>
            </div>
            <div class="section-label" style="margin-top:var(--space-5)">${I18n.t('cd.thisSeason', { season: GameState.seasonLabel() })}</div>
            <div class="stat-strip fcard" style="padding:11px 4px">
                <div class="stat"><span class="stat__value">${tot.apps}</span><span class="stat__label">${I18n.t('cd.stat.apps')}</span></div>
                <div class="stat"><span class="stat__value">${p.position === 'GK' ? (tot.cs || 0) : tot.goals}</span><span class="stat__label">${p.position === 'GK' ? I18n.t('cd.stat.cleanSheets') : I18n.t('cd.stat.goals')}</span></div>
                <div class="stat"><span class="stat__value">${tot.assists}</span><span class="stat__label">${I18n.t('cd.stat.assists')}</span></div>
                <div class="stat"><span class="stat__value" style="color:var(--warning)">${tot.yellow}</span><span class="stat__label">${I18n.t('cd.stat.yellow')}</span></div>
                <div class="stat"><span class="stat__value">${tot.red}</span><span class="stat__label">${I18n.t('cd.stat.red')}</span></div>
                <div class="stat"><span class="stat__value">${UI.ratingText(tot.avg)}</span><span class="stat__label">${I18n.t('cd.stat.avg')}</span></div>
            </div>
            ${offerHtml}${actions}`;
    },
    // a club-less player draws no wage at all — never show a stale figure as if he's still earning it
    wageText(p) { return Agency.isFreeAgent(p) ? `<span class="muted">${I18n.t('cd.noClub')}</span>` : `${UI.euro(p.wage)}/wk`; },
    contractText(p) {
        if (p.retired) return I18n.t('cd.retiredText');
        if (p.retiringThisSeason) return I18n.t('cd.retiringText');
        if (Agency.isFreeAgent(p)) return I18n.t('common.freeAgent');
        if (p.joiningClubId) return I18n.t('cd.joining', { club: UI.clubName(p.joiningClubId) });
        const left = Agency.contractSeasonsLeft(p);
        return left <= 0 ? I18n.t('cd.finalYear') : I18n.t('cd.until', { season: GameState.seasonLabelFor(p.contractUntilSeason) });
    },
    rejectAll(id) {
        GameState.inbox = GameState.inbox.filter(m => !(m.offer && m.offer.playerId === id && (m.kind === 'transfer' || m.kind === 'loan')));
        GameState.save(); Router.refresh();
    },
    toggleTL(id) {
        const p = GameState.getPlayer(id);
        if (p.transferListed) { Agency.toggleTransferList(p); GameState.save(); Router.refresh(); return; }
        const r = Agency.requestTransferListing(p); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    reqLoan(id) { const r = Agency.requestLoan(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    sendU21(id) {
        const p = GameState.getPlayer(id), reserve = reserveClubFor(p.clubId), dest = reserve ? reserve.name : youthTeamName(p.clubId);
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.sendDownQ', { name: p.name })}</div>
            <p class="hint">${reserve ? I18n.t('cd.sendReserveHint') : I18n.t('cd.sendYouthHint')}</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button><button class="btn btn--primary" onclick="ClientDetail.doSendU21('${id}')">${I18n.t('cd.sendTo', { dest })}</button></div>`);
    },
    doSendU21(id) { Router.closeSheet(); const r = Agency.sendToU21(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqPromote(id) { const r = Agency.requestPromotion(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqU21Recall(id) { const r = Agency.requestU21Recall(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    reqRenewal(id) { const r = Agency.requestRenewalTalks(GameState.getPlayer(id)); GameState.save(); if (r.ok && Router.refresh) Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    checkIn(id) {
        const p = GameState.getPlayer(id);
        const gate = Dialogue.canCheckIn(p);
        if (!gate.ok) { Router.result(gate.reason === 'cooldown' ? I18n.t('cd.checkedInMsg', { name: p.name, w: gate.weeksLeft }) : I18n.t('cd.notRightNow'), 'bad'); return; }
        DialogueView.show(Dialogue.buildCheckinScene(p), () => { GameState.save(); Router.refresh(); });
    },

    // ---- shop to any club, any country, one or several at once ----
    openShop(id) { this.ctx(id).shop = { country: (Clubs.getClubById(GameState.getPlayer(id).clubId) || {}).country || GameState.homeCountry || 'Netherlands', selected: new Set(), mode: 'transfer' }; this.renderShop(id); },
    renderShop(id) {
        const p = GameState.getPlayer(id), shop = this.ctx(id).shop;
        const canLoan = Agency.canLoanShop(p);
        if (shop.mode === 'loan' && !canLoan) shop.mode = 'transfer';
        const countries = Object.keys(COUNTRY_DIVS);
        const tabs = countries.map(c => `<button class="htog ${shop.country === c ? 'is-on' : ''}" onclick="ClientDetail.setShopCountry('${id}','${c}')">${c}</button>`).join('');
        const count = shop.selected.size;
        const loan = shop.mode === 'loan';
        // transfer / loan segmented toggle — loan only offered once the club has sanctioned a loan
        const modeToggle = `<div class="chip-row" style="margin:var(--space-3) 0 0">
            <button class="htog ${!loan ? 'is-on' : ''}" onclick="ClientDetail.setShopMode('${id}','transfer')">${I18n.t('cd.transfer')}</button>
            <button class="htog ${loan ? 'is-on' : ''}" ${canLoan ? '' : 'disabled'} onclick="ClientDetail.setShopMode('${id}','loan')">${I18n.t('cd.loan')}</button>
        </div>`;
        const hint = loan ? I18n.t('cd.shopLoanHint') : I18n.t('cd.shopTransferHint');
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.shopTitle', { name: p.name })}</div>
            ${modeToggle}
            <p class="hint" style="margin-top:var(--space-2)">${hint}</p>
            <div class="chip-row" style="margin:var(--space-2) 0 var(--space-3)">${tabs}</div>
            <div style="max-height:38vh;overflow-y:auto" id="shopClubList">${this.shopClubListHTML(id)}</div>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button><button class="btn btn--primary" id="shopPitchBtn" ${count ? '' : 'disabled'} onclick="ClientDetail.doShop('${id}')">${loan ? I18n.t('cd.loanPitchTo', { count }) : I18n.t('cd.pitchTo', { count })}</button></div>
            <div id="actionResult"></div>`);
    },
    setShopMode(id, mode) { this.ctx(id).shop.mode = mode; this.renderShop(id); },
    // rendered separately from the sheet chrome so toggling a checkbox / picking "all" only
    // ever replaces this list, never the whole sheet — otherwise every click reset your scroll
    // position back to the top of a potentially long club list
    shopClubListHTML(id) {
        const p = GameState.getPlayer(id), shop = this.ctx(id).shop;
        return (COUNTRY_DIVS[shop.country] || []).map(div => {
            const clubs = Clubs.getClubsByDivision(div).filter(c => c.id !== p.clubId).sort((a, b) => b.reputation - a.reputation);
            if (!clubs.length) return '';
            const allSelected = clubs.every(c => shop.selected.has(c.id));
            const rows = clubs.map(c => `<label class="comp-row" style="cursor:pointer"><span class="flex-row" style="gap:8px"><input type="checkbox" ${shop.selected.has(c.id) ? 'checked' : ''} onchange="ClientDetail.toggleShopClub('${id}','${UI.esc(c.id)}')">${c.name}</span><span class="muted">${I18n.t('agency.eff.rep')} ${c.reputation}</span></label>`).join('');
            return `<div class="section-head" style="margin-top:var(--space-3);margin-bottom:0">
                <span class="section-label">${COMPETITIONS[div].name}</span>
                <button class="gbtn" style="padding:3px 9px;font-size:11px" onclick="ClientDetail.toggleShopDivision('${id}','${div}')">${allSelected ? I18n.t('cd.deselectAll') : I18n.t('cd.pitchToAll')}</button>
                </div>${rows}`;
        }).join('');
    },
    setShopCountry(id, c) { this.ctx(id).shop.country = c; this.renderShop(id); },
    toggleShopClub(id, clubId) {
        const sel = this.ctx(id).shop.selected;
        if (sel.has(clubId)) sel.delete(clubId); else sel.add(clubId);
        this.updateShopPitchBtn(id);
    },
    toggleShopDivision(id, div) {
        const p = GameState.getPlayer(id), shop = this.ctx(id).shop;
        const clubs = Clubs.getClubsByDivision(div).filter(c => c.id !== p.clubId);
        const allSelected = clubs.length && clubs.every(c => shop.selected.has(c.id));
        clubs.forEach(c => { if (allSelected) shop.selected.delete(c.id); else shop.selected.add(c.id); });
        const list = document.getElementById('shopClubList'); if (list) list.innerHTML = this.shopClubListHTML(id);
        this.updateShopPitchBtn(id);
    },
    updateShopPitchBtn(id) {
        const shop = this.ctx(id).shop, count = shop.selected.size;
        const btn = document.getElementById('shopPitchBtn');
        if (btn) { btn.disabled = !count; btn.textContent = shop.mode === 'loan' ? I18n.t('cd.loanPitchTo', { count }) : I18n.t('cd.pitchTo', { count }); }
    },
    doShop(id) {
        const shop = this.ctx(id).shop, targets = Array.from(shop.selected);
        if (!targets.length) return;
        const p = GameState.getPlayer(id);
        const loan = shop.mode === 'loan';
        const lines = targets.map(cid => (loan ? Agency.shopPlayerLoan(p, cid) : Agency.shopPlayer(p, cid)).message);
        GameState.save();
        shop.selected = new Set();
        this.renderShop(id);
        Router.result(lines.join('<br>'), 'info');
    },

    // ---- sign representation (multi-round) ----
    openSign(id) {
        const p = GameState.getPlayer(id);
        this.ctx(id).sign = { wage: 10, sponsor: 10, term: 3, round: 1 };
        this.renderSign(id);
    },
    renderSign(id) {
        const p = GameState.getPlayer(id), s = this.ctx(id).sign;
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.offerRepTitle', { name: p.name })}</div>
            <p class="hint">${I18n.t('cd.signHint')}</p>
            <label class="field-label">${I18n.t('cd.wageCut')} <span id="signWageVal" class="editable-val">${s.wage}</span>%</label><input class="range" type="range" min="1" max="25" value="${s.wage}" oninput="ClientDetail.signSlide('${id}','wage',this.value)">
            <label class="field-label">${I18n.t('cd.sponsorCut')} <span id="signSponsorVal" class="editable-val">${s.sponsor}</span>%</label><input class="range" type="range" min="1" max="25" value="${s.sponsor}" oninput="ClientDetail.signSlide('${id}','sponsor',this.value)">
            <label class="field-label">${I18n.t('cd.repLength')} <span id="signTermVal" class="editable-val">${s.term}</span>${I18n.t('nego.seasonsSuffix')}</label><input class="range" type="range" min="1" max="10" value="${s.term}" oninput="ClientDetail.signSlide('${id}','term',this.value)">
            <button class="btn btn--primary" style="margin-top:var(--space-5)" onclick="ClientDetail.proposeSign('${id}')"><i class="ti ti-send"></i>${I18n.t('cd.proposeTerms')}</button>
            <div id="actionResult"></div>`);
    },
    // update state + just the label text — re-rendering the sheet on every drag tick would
    // destroy and recreate the <input type=range> mid-drag, which is what made it "jump back"
    signSlide(id, key, val) {
        this.ctx(id).sign[key] = +val;
        const map = { wage: 'signWageVal', sponsor: 'signSponsorVal', term: 'signTermVal' };
        const el = document.getElementById(map[key]);
        if (el) el.textContent = val;
    },
    proposeSign(id) {
        const p = GameState.getPlayer(id), s = this.ctx(id).sign;
        const r = Agency.negotiateSign(p, s.wage, s.sponsor, s.term, s.round++);
        if (r.status === 'accept') {
            Agency.signPlayer(p, s.wage, s.sponsor, s.term); GameState.save();
            Router.closeSheet(); Router.go(`client/${id}`);
        } else if (r.status === 'walk') {
            Router.result(r.message, 'bad'); GameState.save();
        } else {
            if (r.counter) { s.wage = r.counter.suggestWage != null ? Math.round(r.counter.suggestWage) : s.wage; s.sponsor = r.counter.suggestSponsor != null ? Math.round(r.counter.suggestSponsor) : s.sponsor; }
            this.renderSign(id);
            Router.result(r.message, 'info');
        }
    },

    // ---------------- Potential ----------------
    tabPotential(p) {
        const r = Scouting.ensureReport(p);
        return `<h3 style="margin-top:0">${I18n.t('cd.scoutingReport')}</h3>
            <p style="color:var(--text-secondary);line-height:1.5">${r.desc}</p>
            <div class="fcard"><div class="frow"><span class="frow__k">${I18n.t('cd.ceiling')}</span><span class="frow__v" style="color:var(--state-good)">${r.ceiling}</span></div><div class="frow"><span class="frow__k">${I18n.t('cd.floor')}</span><span class="frow__v" style="color:var(--danger)">${r.floor}</span></div></div>
            <p class="hint">${I18n.t('cd.estimatesHint', { country: r.country })}</p>
            ${GameState.debug ? `<div class="section-label" style="margin-top:var(--space-6)"><i class="ti ti-bug" style="margin-right:4px"></i>${I18n.t('cd.debug')}</div>
            <div class="fcard" style="padding:12px">
                <label class="field-label" style="margin-top:0">${I18n.t('cd.ageLabel')} <span class="muted">${p.everClient ? I18n.t('cd.retiresNote', { age: p.retireAge }) : I18n.t('cd.retiresNoteUntracked', { age: p.retireAge })}</span></label>
                <div class="flex-row"><input class="text-input" type="number" id="dbgAge" min="15" max="45" value="${p.age}"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="ClientDetail.setAge('${p.id}')">${I18n.t('common.set')}</button></div>
                <div class="frow" style="margin-top:var(--space-3);border-top:1px solid var(--line-strong);padding-top:10px"><span class="frow__k">${I18n.t('cd.truePotential')} <span class="muted">${I18n.t('cd.abilityCap')}</span></span><span class="frow__v" style="color:var(--state-good)">${p.potential}</span></div>
            </div>` : ''}`;
    },
    setAge(id) {
        const p = GameState.getPlayer(id);
        const n = Math.round(+document.getElementById('dbgAge').value);
        if (!isFinite(n) || n < 1) return;
        p.age = n;
        GameState.save(); Router.refresh();
        Router.result(I18n.t('cd.ageSet', { name: p.name, n }), 'ok');
    },

    // ---------------- Morale ----------------
    dimLabel(dim) { return I18n.t('cd.dim.' + dim); },
    tabMorale(p) {
        const m = p.morale || {};
        const hist = p._moraleHist || [];
        const rows = [['club', I18n.t('cd.dim.club'), I18n.t('cd.dimHint.club')],
        ['time', I18n.t('cd.dim.time'), I18n.t('cd.dimHint.time')], ['wage', I18n.t('cd.dim.wage'), I18n.t('cd.dimHint.wage')],
        ['agent', I18n.t('cd.dim.agent'), I18n.t('cd.dimHint.agent')]];
        const trend = (k, v) => {
            if (!hist.length) return '';
            const then = hist[0][k];
            const d = v - then;
            if (Math.abs(d) < 2) return '';   // steady - no icon rather than a borrowed one that doesn't fit
            const up = d > 0;
            return `<i class="ti ${up ? 'ti-trending-up' : 'ti-trending-down'}" style="color:var(${up ? '--state-good' : '--state-bad'});font-size:13px" title="${up ? '+' : ''}${Math.round(d)} ${I18n.t('cd.vs4Weeks')}"></i>`;
        };
        const bars = rows.map(([k, label, hint]) => {
            const v = Math.round(m[k] || 0);
            return `<div style="margin-bottom:15px">
                <div class="flex-row" style="justify-content:space-between;margin-bottom:6px"><span style="font-size:13.5px;font-weight:var(--weight-semibold)">${label}</span><span class="flex-row" style="gap:5px"><span style="font-size:12.5px;font-weight:var(--weight-semibold);color:var(${UI.moraleVar(v)})">${v}</span>${trend(k, v)}</span></div>
                <div class="bar"><div class="bar__fill" style="width:${v}%;background:var(${UI.moraleVar(v)})"></div></div>
                <div class="hint" style="margin-top:6px">${hint}</div>
            </div>`;
        }).join('');
        return bars + this.moraleCaseCard(p) + `<div class="fcard" style="padding:11px 12px;font-size:var(--fs-sm);color:var(--text-muted);line-height:1.5;margin-bottom:var(--space-5)">${I18n.t('cd.moraleNote')}</div>` + this.bondBlock(p) + this.moraleAgentBlock(p) + this.supportBlock(p);
    },
    moraleCaseCard(p) {
        const c = p.moraleCase; if (!c) return '';
        const aw = GameState.absWeek();
        const stageLabel = { 1: I18n.t('cd.stage.1'), 2: I18n.t('cd.stage.2'), 3: I18n.t('cd.stage.3') }[c.stage] || I18n.t('cd.stageN', { n: c.stage });
        const stageColor = c.stage >= 3 ? 'var(--danger)' : c.stage === 2 ? 'var(--warning)' : 'var(--info)';
        let body = `<div class="hint">${I18n.t('cd.unhappyAbout', { name: p.name, dim: this.dimLabel(c.dim).toLowerCase() })}</div>`;
        if (c.promise) {
            const weeksLeft = Math.max(0, Math.ceil((c.promise.deadlineAbsWeek - aw)));
            const typeLabel = { move: I18n.t('cd.promiseType.move'), newContract: I18n.t('cd.promiseType.newContract'), playingTime: I18n.t('cd.promiseType.playingTime'), renegotiateRep: I18n.t('cd.promiseType.renegotiateRep') }[c.promise.type] || c.promise.type;
            body += `<div class="frow"><span class="frow__k"><i class="ti ti-signature"></i>${I18n.t('cd.promise')}</span><span class="frow__v">${I18n.t('cd.youll', { type: typeLabel })}</span></div>
                <div class="frow"><span class="frow__k"><i class="ti ti-calendar"></i>${I18n.t('cd.deadline')}</span><span class="frow__v" style="${weeksLeft <= 2 ? 'color:var(--danger)' : ''}">${I18n.t('cd.weeksLeft', { w: weeksLeft })}</span></div>`;
        }
        if (c.stage <= 2) {
            // a real conversation (chat scene), not a button that pats him on the head. The promise
            // shortcut stays for stage 1: some things you settle without the full sit-down.
            const cd = p._talkCooldownAbs != null ? Math.max(0, MORALE.TALK_COOLDOWN_WEEKS - (aw - p._talkCooldownAbs)) : 0;
            body += `<div class="flex-row" style="margin-top:var(--space-3)">
                <button class="btn btn--ghost btn--sm" ${cd > 0 ? 'disabled' : ''} onclick="ClientDetail.talkToClient('${p.id}')"><i class="ti ti-message-circle"></i>${cd > 0 ? I18n.t('cd.talkedRecently', { w: Math.ceil(cd) }) : I18n.t('cd.talkToHim')}</button>
                ${c.stage === 1 && !c.promise ? `<button class="btn btn--accent-outline btn--sm" onclick="ClientDetail.openPromiseSheet('${p.id}')"><i class="ti ti-signature"></i>${I18n.t('cd.makePromise')}</button>` : ''}
            </div>`;
            if (c.stage === 2 && !c.promise) body += `<div class="hint" style="margin-top:4px">${I18n.t('cd.takenFurther')}</div>`;
        }
        return `<div class="section-label" style="margin-top:var(--space-2)">${I18n.t('cd.openCase')}</div>
            <div class="fcard" style="margin-bottom:var(--space-5)">
                <div class="frow"><span class="frow__k"><i class="ti ti-flag" style="color:${stageColor}"></i>${I18n.t('cd.status')}</span><span class="frow__v" style="color:${stageColor}">${stageLabel}</span></div>
                ${body}
            </div>`;
    },
    talkToClient(id) {
        const p = GameState.getPlayer(id);
        const gate = Dialogue.canTalk(p);
        if (!gate.ok) { Router.result(gate.reason === 'cooldown' ? I18n.t('cd.spokeRecently', { name: p.name, w: gate.weeksLeft }) : I18n.t('cd.nothingToTalk', { name: p.name }), 'bad'); return; }
        DialogueView.show(Dialogue.buildComplaintScene(p), () => { GameState.save(); Router.refresh(); });
    },
    openPromiseSheet(id) {
        const p = GameState.getPlayer(id);
        const types = Agency.validPromiseTypes(p);
        const labels = { move: [I18n.t('cd.promiseOpt.move.title'), I18n.t('cd.promiseOpt.move.desc')], newContract: [I18n.t('cd.promiseOpt.newContract.title'), I18n.t('cd.promiseOpt.newContract.desc')], playingTime: [I18n.t('cd.promiseOpt.playingTime.title'), I18n.t('cd.promiseOpt.playingTime.desc')], renegotiateRep: [I18n.t('cd.promiseOpt.renegotiateRep.title'), I18n.t('cd.promiseOpt.renegotiateRep.desc')] };
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.promiseTitle', { name: p.name })}</div>
            <p class="hint">${I18n.t('cd.promiseHint')}</p>
            ${types.length ? types.map(t => `<button class="btn btn--ghost" style="width:100%;justify-content:flex-start;text-align:left;margin-bottom:8px" onclick="ClientDetail.doPromise('${id}','${t}')"><div><div style="font-weight:var(--weight-semibold)">${(labels[t] || [t])[0]}</div><div class="hint">${(labels[t] || ['', ''])[1]}</div></div></button>`).join('') : `<p class="muted">${I18n.t('cd.noPromiseFits')}</p>`}
            <button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button>`);
    },
    doPromise(id, type) {
        const r = Agency.makePromise(GameState.getPlayer(id), type);
        GameState.save(); Router.closeSheet(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    // gifts + agent relationship actions live here (moved off the Contract tab, which is
    // facts-only) since they're all levers against the same morale.agent dimension
    // career-long trust, distinct from this month's mood; grown at big shared moments
    bondBlock(p) {
        const bond = Dialogue.bondOf(p), tier = Dialogue.tierOf(bond);
        const next = Dialogue.TIERS.slice().reverse().find(([min]) => min > bond);
        const persona = Dialogue.knownPersona(p);
        const tierCol = bond >= 75 ? 'var(--gold)' : bond >= 50 ? 'var(--accent)' : bond >= 25 ? 'var(--info-text)' : 'var(--text-muted)';
        return `<div class="section-label">${I18n.t('cd.yourBond')}</div>
            <div class="fcard" style="margin-bottom:var(--space-4)">
                <div class="frow"><span class="frow__k"><i class="ti ti-heart-handshake" style="color:${tierCol}"></i>${tier}</span>
                    <span class="frow__v muted">${next ? I18n.t('cd.toNextTier', { n: next[0] - bond, tier: next[1] }) : I18n.t('cd.closeAsItGets')}</span></div>
                <div style="height:6px;border-radius:3px;background:var(--line-strong);margin:2px 0 9px;overflow:hidden">
                    <div style="height:100%;width:${bond}%;background:${tierCol};border-radius:3px"></div>
                </div>
                <div class="frow"><span class="frow__k"><i class="ti ti-user-search"></i>${I18n.t('cd.personality')}</span>
                    <span class="frow__v">${persona || `<span class="muted">${I18n.t('cd.stillGettingToKnow')}</span>`}</span></div>
                ${this.factsRows(p)}
            </div>`;
    },
    // "What you know about him" — facts he has told you (Check in / volunteered at tier upgrades).
    // Undiscovered facts show as a nudge to ask, fulfilled ones as little career keepsakes.
    factsRows(p) {
        if (typeof Dialogue === 'undefined') return '';
        const f = Dialogue.ensureFacts(p);
        const ask = `<span class="muted">${I18n.t('cd.askSometime')}</span>`;
        const rows = [];
        const fav = f.favClub;
        rows.push(['ti-heart', I18n.t('cd.boyhoodClub'), fav.discovered
            ? `${UI.clubName(fav.clubId)}${fav.fulfilled ? ' <span style="color:var(--gold)">✓ ' + I18n.t('cd.dreamMove') + (fav.year ? ', ' + GameState.seasonLabelFor(fav.year) : '') + '</span>' : ''}`
            : ask]);
        const amb = f.ambition;
        rows.push(['ti-target-arrow', I18n.t('cd.ambition'), amb.discovered
            ? `${UI.esc(Dialogue.ambitionText(p))} <span class="${amb.fulfilled ? '' : 'muted'}" style="${amb.fulfilled ? 'color:var(--gold)' : ''}">· ${UI.esc(Dialogue.ambitionProgress(p))}</span>`
            : ask]);
        rows.push(['ti-home-heart', I18n.t('cd.life'), f.family.discovered
            ? (f.family.status === 'single' ? I18n.t('cd.family.single') : f.family.status === 'partner' ? I18n.t('cd.family.partner') : I18n.t('cd.family.kids')) + (f.hobby.discovered ? ` · ${I18n.t('cd.into', { hobby: UI.esc(f.hobby.name) })}` : '')
            : ask]);
        (f.keepsakes || []).forEach(k => rows.push(['ti-gift', I18n.t('cd.fromHim'), `${UI.esc(k.text)} <span class="muted">(${GameState.seasonLabelFor(k.year)})</span>`]));
        return rows.map(([ico, k, v]) => `<div class="frow"><span class="frow__k"><i class="ti ${ico}"></i>${k}</span><span class="frow__v">${v}</span></div>`).join('');
    },
    // Concierge: the agent as life-manager. Settling-in support appears only while it can help;
    // the financial advisor is a 1–5 season contract (only worth it for the reckless types); media
    // training is one-off.
    supportBlock(p) {
        if (typeof Dialogue === 'undefined') return '';
        const S = Dialogue.SERVICES, s = p.settling;
        const btn = (kind, state) => {
            const svc = S[kind];
            return `<button class="btn btn--ghost btn--sm" ${state ? 'disabled' : ''} onclick="ClientDetail.support('${p.id}','${kind}')"><i class="ti ti-lifebuoy"></i>${svc.label} · ${state || UI.euro(svc.cost)}</button>`;
        };
        let settle = '';
        if (s) {
            settle = `<div class="hint" style="margin-bottom:var(--space-2)">${I18n.t('cd.settleHint', { w: s.weeksLeft, mood: s.morale ? I18n.t('cd.andMood') : '' })}</div>
                <div class="flex-row" style="flex-wrap:wrap;margin-bottom:var(--space-3)">
                    ${btn('language', s.services.language ? I18n.t('cd.done') : null)}
                    ${btn('house', !s.morale ? I18n.t('cd.done') : null)}
                    ${btn('family', s.services.family ? I18n.t('cd.done') : null)}
                </div>`;
        }
        // financial advisor: multi-year contract. Flag the risk only once you actually know he's loose
        // with money; otherwise it's just available with no nudge.
        const engaged = Dialogue.advisorEngaged(p);
        const through = engaged ? GameState.seasonLabelFor(p._finAdvisorUntil - 1) : null;
        const riskHint = (!engaged && Dialogue.moneyRiskKnown(p))
            ? `<div class="hint" style="color:var(--warning);margin-bottom:var(--space-2)">⚠ ${I18n.t('cd.moneyRiskHint', { name: p.name })}</div>` : '';
        const advisorLine = engaged
            ? `<button class="btn btn--ghost btn--sm" onclick="ClientDetail.advisorSheet('${p.id}')"><i class="ti ti-shield-check"></i>${I18n.t('cd.advisorCovered', { through })}</button>`
            : `<button class="btn btn--ghost btn--sm" onclick="ClientDetail.advisorSheet('${p.id}')"><i class="ti ti-shield"></i>${I18n.t('cd.advisorFrom', { cost: UI.euro(Dialogue.advisorCost(1)) })}</button>`;
        return `<div class="section-label">${I18n.t('cd.supportServices')}</div>
            ${settle}${riskHint}
            <div class="flex-row" style="flex-wrap:wrap;margin-bottom:var(--space-4)">
                ${advisorLine}
                ${btn('media', p._mediaTrained ? I18n.t('cd.done') : null)}
            </div>`;
    },
    support(id, kind) {
        const r = Dialogue.buyService(GameState.getPlayer(id), kind);
        GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    // pick how many seasons of financial-advisor cover to buy (or add)
    advisorSheet(id) {
        const p = GameState.getPlayer(id);
        const engaged = Dialogue.advisorEngaged(p);
        const rows = [1, 2, 3, 4, 5].map(y => {
            const cost = Dialogue.advisorCost(y);
            const afford = GameState.agency.balance >= cost;
            return `<button class="btn btn--ghost" style="width:100%;justify-content:space-between;margin-bottom:8px" ${afford ? '' : 'disabled'} onclick="ClientDetail.doAdvisor('${id}',${y})"><span>${I18n.t('clienthist.seasonsN', { n: y })}</span><span>${UI.euro(cost)}</span></button>`;
        }).join('');
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.advisorTitle', { name: p.name })}</div>
            <p class="hint">${engaged ? I18n.t('cd.advisorHintEngaged', { through: GameState.seasonLabelFor(p._finAdvisorUntil - 1) }) : I18n.t('cd.advisorHint')}</p>
            ${rows}
            <button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button>`);
    },
    doAdvisor(id, years) {
        Router.closeSheet();
        const r = Dialogue.hireAdvisor(GameState.getPlayer(id), years);
        GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    moraleAgentBlock(p) {
        const refusing = p.moraleCase && p.moraleCase.dim === 'agent' && p.moraleCase.stage >= 3;
        const tierBtn = (tier, label) => {
            const cost = Agency.giftCost(tier, p);
            const ready = Agency.giftTierReady(p, tier);
            const disabled = refusing || !ready;
            let note = '';
            if (refusing) note = I18n.t('cd.refusesGifts');
            else if (!ready) note = I18n.t('cd.onCooldown');
            return `<button class="btn btn--ghost btn--sm" ${disabled ? 'disabled' : ''} onclick="ClientDetail.gift('${p.id}','${tier}')"><i class="ti ti-gift"></i>${label} · ${UI.euro(cost)}${note ? ` (${note})` : ''}</button>`;
        };
        return `<div class="section-label">${I18n.t('cd.agentRelationship')}</div>
            <div class="flex-row" style="margin-bottom:var(--space-4);flex-wrap:wrap">
                ${tierBtn('small', I18n.t('cd.gift.small'))}
                ${tierBtn('medium', I18n.t('cd.gift.medium'))}
                ${tierBtn('large', I18n.t('cd.gift.large'))}
            </div>`;
    },

    // ---------------- Injuries ----------------
    tabInjuries(p) {
        let cur = `<div class="result ok">${I18n.t('cd.fullyFit')}</div>`;
        if (p.injury) {
            const aw = GameState.absWeek();
            const canPhysio = p.injury.treatedWeek !== aw;
            const canSpec = !p.injury.specialistUsed && p.injury.treatedWeek !== aw;
            cur = `<div class="fcard"><div class="frow"><span class="frow__k">${I18n.t('cd.injury')}</span><span class="frow__v">${p.injury.type}</span></div><div class="frow"><span class="frow__k">${I18n.t('cd.outFor')}</span><span class="frow__v">${I18n.t('cd.outForWeeks', { w: Math.round(p.injury.weeksOut * 2) / 2 })}</span></div></div>
                <div class="flex-row">
                    <button class="btn btn--accent-outline" ${canPhysio ? '' : 'disabled'} onclick="ClientDetail.physio('${p.id}')"><i class="ti ti-first-aid-kit"></i>${I18n.t('cd.physioBtn')}</button>
                    <button class="btn btn--ghost" ${canSpec ? '' : 'disabled'} onclick="ClientDetail.specialist('${p.id}')"><i class="ti ti-stethoscope"></i>${I18n.t('cd.specialistBtn')}</button>
                </div>`;
        }
        const hist = (p.injuryHistory || []).slice().reverse();
        return `${cur}<div class="section-label" style="margin-top:var(--space-5)">${I18n.t('cd.tab.history')}</div>
            ${hist.length ? hist.map(h => `<div class="frow"><span class="frow__k">${h.season}</span><span class="frow__v">${h.type} · ${h.weeks}w</span></div>`).join('') : `<p class="muted">${I18n.t('cd.noInjuries')}</p>`}`;
    },
    physio(id) { const r = Agency.treatPhysio(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    specialist(id) { const r = Agency.treatSpecialist(GameState.getPlayer(id)); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },

    // ---------------- Contract ----------------
    tabContract(p) {
        const club = Clubs.getClubById(p.clubId);
        const sponsors = p.sponsorDeals || [];
        const releaseFee = Agency.releaseFee(p);
        return `<div class="section-label">${I18n.t('cd.clubContract')}</div>
            <div class="fcard">
                <div class="frow"><span class="frow__k"><i class="ti ti-currency-euro"></i>${I18n.t('cd.wage')}</span><span class="frow__v">${this.wageText(p)}</span></div>
                <div class="frow"><span class="frow__k"><i class="ti ti-calendar"></i>${I18n.t('cd.untilLabel')}</span><span class="frow__v" style="${p.retiringThisSeason || Agency.contractSeasonsLeft(p) <= 0 ? 'color:var(--danger)' : ''}">${this.contractText(p)}</span></div>
                <div class="frow"><span class="frow__k"><i class="ti ti-shirt"></i>${I18n.t('cd.role')}</span><span class="frow__v">${roleName(p)}</span></div>
                <div class="frow"><span class="frow__k"><i class="ti ti-building"></i>${I18n.t('nego.club')}</span><span class="frow__v">${club ? club.name : '—'}</span></div>
            </div>
            <div class="section-label">${I18n.t('cd.yourRep')}</div>
            <div class="info-grid" style="margin-bottom:var(--space-3)">
                <div class="info"><span>${I18n.t('cd.wageCutLabel')}</span><b>${p.wageCommission}%</b></div>
                <div class="info"><span>${I18n.t('cd.sponsorCutLabel')}</span><b>${p.sponsorCommission}%</b></div>
                <div class="info"><span>${I18n.t('cd.repUntil')}</span><b>${p.repExpired ? I18n.t('clients.expired') : GameState.seasonLabelFor(p.repUntilSeason)}</b></div>
                <div class="info"><span>${I18n.t('cd.weeklyIncome')}</span><b style="color:var(--state-good)">${Agency.isFreeAgent(p) ? '€0' : UI.euro(Math.round(p.wage * p.wageCommission / 100))}</b></div>
            </div>
            <button class="btn btn--accent-outline" onclick="ClientDetail.reqRenewal('${p.id}')"><i class="ti ti-file-pencil"></i>${I18n.t('cd.requestRenewalClub')}</button>
            <div class="section-label" style="margin-top:var(--space-5)">${I18n.t('cd.activeSponsors')}</div>
            <div class="fcard" style="margin-bottom:var(--space-5)">${sponsors.length ? sponsors.map(d => `<div class="frow"><span class="frow__k">${d.company}</span><span class="frow__v">${UI.euro(d.weekly)}/wk · ${I18n.t('cd.to')} ${GameState.seasonLabelFor(d.untilSeason)}</span></div>`).join('') : `<div class="empty empty--inline"><div class="empty__icon"><i class="ti ti-tag"></i></div><div class="empty__hint">${I18n.t('cd.noSponsors')}</div></div>`}</div>
            <button class="btn btn--danger" onclick="ClientDetail.release('${p.id}')"><i class="ti ti-user-x"></i>${I18n.t('cd.endRep', { fee: UI.euro(releaseFee) })}</button>`;
    },
    gift(id, tier) {
        const p = GameState.getPlayer(id);
        const r = Agency.giveGift(p, tier); GameState.save();
        // a successful gift plays out as a short conversation; failures stay a plain banner
        if (r.ok && r.scene && typeof DialogueView !== 'undefined') {
            DialogueView.show(Dialogue.buildGiftScene(p, r.tier, r.diminished), () => { GameState.save(); Router.refresh(); });
            return;
        }
        Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    release(id) {
        const p = GameState.getPlayer(id), fee = Agency.releaseFee(p);
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('cd.releaseQ', { name: p.name })}</div>
            <p class="hint">${I18n.t('cd.releaseDesc', { fee: UI.euro(fee) })}</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button><button class="btn btn--danger" onclick="ClientDetail.doRelease('${id}')">${I18n.t('cd.release')}</button></div>`);
    },
    doRelease(id) {
        const r = Agency.releasePlayer(GameState.getPlayer(id)); GameState.save(); Router.closeSheet();
        if (r.ok) Router.go('clients'); else Router.result(r.message, 'bad');
    },

    // ---------------- Development ----------------
    tabDevelopment(p) {
        if (!p.history || !(p.history.ability || []).length) return `<p class="muted">${I18n.t('cd.noDevelopment')}</p>`;
        const now = GameState.absWeek();
        const tOf = h => (h.t != null ? h.t : Math.round((h.age != null ? h.age : p.age) * 52));
        const ageAt = t => p.age - (now - t) / 52;
        const abil = (p.history.ability || []).slice();
        if (!abil.length || abil[abil.length - 1].value !== p.ability) abil.push({ t: now, value: p.ability });
        const wage = (p.history.wage || []).slice();
        if (!wage.length || wage[wage.length - 1].value !== p.wage) wage.push({ t: now, value: p.wage });
        const fees = (p.history.fees || []).map(h => ({ x: tOf(h), y: h.value }));
        const ax = abil.map(h => ({ x: tOf(h), y: h.value }));
        const wx = wage.map(h => ({ x: tOf(h), y: h.value }));
        const xMin = Math.min(ax[0].x, wx[0].x, fees.length ? fees[0].x : ax[0].x);
        const xMax = now + 4;
        const yearTicks = [];
        for (let a = Math.floor(ageAt(xMin)); a <= Math.ceil(ageAt(xMax)); a++) {
            const t = now - (p.age - a) * 52;
            if (t >= xMin - 1 && t <= xMax + 1) yearTicks.push({ v: t, label: a + 'y' });
        }
        // Every year keeps its gridline, but only every Nth is labelled — a veteran's 18-year
        // career otherwise prints "16y17y18y..." on top of itself. Strided from the end so the
        // current age is always the one that's written out.
        const stride = Math.max(1, Math.ceil(yearTicks.length / 7));
        yearTicks.forEach((tk, i) => { if ((yearTicks.length - 1 - i) % stride !== 0) tk.label = ''; });
        const aLo = Math.min(...ax.map(d => d.y)), aHi = Math.max(...ax.map(d => d.y));
        let yLo = Math.max(1, Math.floor((aLo - 2) / 5) * 5);
        let yHi = Math.min(99, Math.ceil((aHi + 2) / 5) * 5);
        if (yHi - yLo < 20) yHi = Math.min(99, yLo + 20);
        if (yHi - yLo < 20) yLo = Math.max(1, yHi - 20);
        // Wage: a rounded axis with only ~4 gridlines and compact "€11k" labels — the old fixed
        // €1,000 step drew a dozen overlapping lines, and the full "€12,000" labels were clipped.
        const wA = UI.niceAxis(Math.min(...wx.map(d => d.y)), Math.max(...wx.map(d => d.y)), 4);

        const abilityChart = UI.xyChart(ax, 'var(--info)', { xMin, xMax, xTicks: yearTicks, yMin: yLo, yMax: yHi, yStep: 5, fmtY: v => Math.round(v) });
        const wageChart = UI.xyChart(wx, 'var(--warning)', { xMin, xMax, xTicks: yearTicks, yMin: wA.min, yMax: wA.max, yStep: wA.step, fmtY: v => UI.eabbr(v) });
        let feeChart = `<p class="muted">${I18n.t('cd.noTransfers')}</p>`;
        if (fees.length) {
            const fHi0 = Math.max(...fees.map(d => d.y));
            const fA = UI.niceAxis(0, fHi0 || 1, 4);   // fees always start at 0; compact labels so they never clip
            feeChart = UI.xyChart(fees, 'var(--info-text)', { xMin, xMax, xTicks: yearTicks, yMin: 0, yMax: fA.max, yStep: fA.step, fmtY: v => UI.eabbr(v), dotsOnly: fees.length < 2 });
        }
        return `<div class="chart-card"><div class="chart-head"><span class="chart-title">${I18n.t('cd.chartAbility')}</span><span class="chart-value" style="color:var(--info)">${p.ability} <span class="chart-unit">${I18n.t('cd.now')}</span></span></div>${abilityChart}</div>
            <div class="chart-card"><div class="chart-head"><span class="chart-title">${I18n.t('cd.chartWage')}</span><span class="chart-value" style="color:var(--warning)">${UI.euro(p.wage)} <span class="chart-unit">/w</span></span></div>${wageChart}</div>
            <div class="chart-card"><div class="chart-head"><span class="chart-title">${I18n.t('cd.chartFees')}</span></div>${feeChart}</div>`;
    },

    // ---------------- History ----------------
    // Club-first hierarchy: the club is the large, primary line (it's what you actually
    // scan for in a career history), the season is the small subtitle underneath — the
    // reverse of showing the season as the headline. Open (expanded) rows and their
    // nested per-competition detail get progressively lighter/darker shades of the same
    // surface tokens .screen already uses, so "which level am I looking at" is legible
    // without introducing new colours.
    tabHistory(p) {
        const years = Object.keys(p.stats || {}).map(Number).sort((a, b) => b - a);
        if (!years.length) return `<p class="muted">${I18n.t('cd.noMatches')}</p>`;
        const gk = p.position === 'GK';
        const gOrCs = o => gk ? `${o.cs || 0} ${I18n.t('common.csShort')}` : `${o.goals} ${I18n.t('common.goalsShort')}`;
        const ctx = this.ctx(p.id);
        const honours = this.honoursLine(p);

        // One row per (season, club) STINT, not one merged row per season — a
        // mid-season transfer means two clubs played for in the same season, and each
        // gets its own entry (e.g. "Manchester United 26/27" and "Real Madrid 26/27")
        // rather than being silently combined under whichever club he ended up at.
        const rows = [];
        years.forEach(y => { seasonStints(p, y).forEach(st => rows.push({ y, st })); });
        rows.sort((a, b) => b.y - a.y || (b.st.order || 0) - (a.st.order || 0));
        const seasonBlocks = rows.map(({ y, st }) => {
            const rowKey = `${y}:${st.clubId}${st.loan ? '#L' : ''}`;
            const open = ctx.expanded[rowKey];
            // trophies carry a clubId, so a title is only shown on the stint that
            // actually earned it, not just whichever stint happens to end the season
            const troph = (p.trophies || []).filter(tr => tr.year === y && tr.clubId === st.clubId);
            const t = st.totals;
            const cards = `<span class="card-chip card-chip--yellow"></span>${t.yellow} <span class="card-chip card-chip--red"></span>${t.red}`;
            const totLine = `${t.apps} ${I18n.t('common.appsShort')} · ${gOrCs(t)} · ${t.assists} ${I18n.t('common.assistsShort')} · ${cards} · ${UI.ratingText(t.avg)}`;
            // the division shown must be where the club played THAT season, not its current one:
            // derive it from the league competition recorded in this stint (a club plays a single
            // division per season, so there's exactly one league comp among a stint's comps)
            const leagueCid = Object.keys(st.comps).find(cid => _isLeagueComp(cid));
            const divLabel = leagueCid ? compName(leagueCid) : '';
            // club name stands alone on its own line; the league moves down next to the season
            const nameLabel = this.clubLink(st.clubId, UI.clubLabel(st.clubId, st.loan, st.youth));
            const seasonLine = `${GameState.seasonLabelFor(y)}${divLabel ? ' · ' + divLabel : ''}`;
            let inner = '';
            if (open) {
                const comps = `<div class="stint-comps">${Object.entries(st.comps).map(([cid, c]) => `<div class="comp-row"><span>${compName(cid)}</span><span>${c.apps} ${I18n.t('common.appsShort')} · ${gk ? (c.cs || 0) + ' ' + I18n.t('common.csShort') : c.goals + ' ' + I18n.t('common.goalsShort')} · ${c.assists} ${I18n.t('common.assistsShort')}</span></div>`).join('')}</div>`;
                const trophyMark = tr => (typeof europeTrophyIcon === 'function' && europeTrophyIcon(tr.compId)) || '<span class="hist-sym">🏆</span>';
                inner = '<div class="season-body">' + comps + (troph.length ? `<div class="comp-row" style="color:var(--gold)">${troph.map(tr => `${trophyMark(tr)} ${compName(tr.compId)}`).join(' · ')}</div>` : '') + '</div>';
            }
            return `<div class="season-row ${open ? 'is-open' : ''}" onclick="ClientDetail.toggleSeason('${p.id}','${rowKey}')">
                <div class="season-top"><div><span class="season-name">${nameLabel}</span><div class="season-club">${seasonLine} ${troph.length ? '<span class="hist-sym">🏆</span>' : ''}</div></div><span class="season-stat">${totLine}<br><i class="ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}"></i></span></div>${inner}</div>`;
        }).join('');

        const ct = careerTotal(p), careerOpen = ctx.careerOpen, mode = ctx.careerMode;
        let careerInner = '';
        if (careerOpen) {
            const toggle = `<div class="chip-row" style="margin-bottom:var(--space-3)"><button class="htog ${mode === 'club' ? 'is-on' : ''}" onclick="event.stopPropagation();ClientDetail.setCareerMode('${p.id}','club')">${I18n.t('cd.byClub')}</button><button class="htog ${mode === 'comp' ? 'is-on' : ''}" onclick="event.stopPropagation();ClientDetail.setCareerMode('${p.id}','comp')">${I18n.t('cd.byComp')}</button></div>`;
            let rows;
            if (mode === 'club') {
                rows = careerByClub(p).sort((a, b) => b.agg.apps - a.agg.apps).map(m =>
                    `<div class="comp-row"><span>${this.clubLink(m.clubId, UI.clubLabel(m.clubId, m.loanEver, m.youth))}</span><span>${m.agg.apps} ${I18n.t('common.appsShort')} · ${gOrCs(m.agg)} · ${m.agg.assists} ${I18n.t('common.assistsShort')}</span></div>`).join('');
            } else {
                rows = careerByComp(p).sort((a, b) => b.agg.apps - a.agg.apps).map(m =>
                    `<div class="comp-row"><span>${compName(m.compId)}${m.youth ? ` <span class="muted">${I18n.t('cd.youthMuted')}</span>` : ''}</span><span>${m.agg.apps} ${I18n.t('common.appsShort')} · ${gOrCs(m.agg)} · ${m.agg.assists} ${I18n.t('common.assistsShort')}</span></div>`).join('');
            }
            careerInner = toggle + rows;
        }
        const careerBlock = `<div class="season-row ${careerOpen ? 'is-open' : ''}" onclick="ClientDetail.toggleCareer('${p.id}')">
            <div class="season-top"><span class="season-name">${I18n.t('cd.careerTotal')} <span class="muted">${I18n.t('cd.senior')}</span></span><span class="season-stat">${ct.apps} ${I18n.t('common.appsShort')} · ${gOrCs(ct)} · ${ct.assists} ${I18n.t('common.assistsShort')}<br><i class="ti ${careerOpen ? 'ti-chevron-up' : 'ti-chevron-down'}"></i></span></div>
            ${careerOpen ? `<div class="season-body">${careerInner}</div>` : ''}</div>`;
        return honours + `<div class="fcard hist-list">${seasonBlocks}${careerBlock}</div><p class="hint">${I18n.t('cd.youthNote')}</p>`;
    },
    clubLink(clubId, html) {
        if (!Clubs.getClubById(clubId)) return html;
        return `<a href="${Router.link('clubs', clubId)}" onclick="event.stopPropagation()" class="hist-link">${html}</a>`;
    },
    honoursLine(p) {
        const parts = [];
        const tr = {};
        (p.trophies || []).forEach(t => tr[t.compId] = (tr[t.compId] || 0) + 1);
        Object.keys(tr).forEach(cid => { const ic = (typeof europeTrophyIcon === 'function' && europeTrophyIcon(cid)) || '<i class="ti ti-trophy" style="font-size:12px"></i>'; parts.push(`<span class="pill pill--gold">${ic}${compName(cid)}${tr[cid] > 1 ? ' ×' + tr[cid] : ''}</span>`); });
        const mv = {};
        (p.movements || []).forEach(m => { const k = m.type + ':' + m.division; mv[k] = (mv[k] || 0) + 1; });
        Object.keys(mv).forEach(k => {
            const [type, div] = k.split(':');
            parts.push(`<span class="pill ${type === 'promo' ? 'pill--accent' : 'pill--danger'}"><i class="ti ${type === 'promo' ? 'ti-arrow-up-right' : 'ti-arrow-down-right'}" style="font-size:12px"></i>${compName(div)}${mv[k] > 1 ? ' ×' + mv[k] : ''}</span>`);
        });
        return parts.length ? `<div class="chip-row" style="margin-bottom:var(--space-4)">${parts.join('')}</div>` : '';
    },
    toggleSeason(id, rowKey) { const c = this.ctx(id); c.expanded[rowKey] = !c.expanded[rowKey]; Router.refresh(); },
    toggleCareer(id) { this.ctx(id).careerOpen = !this.ctx(id).careerOpen; Router.refresh(); },
    setCareerMode(id, m) { const c = this.ctx(id); c.careerMode = m; c.careerOpen = true; Router.refresh(); }
};
Router.register('client', { isMain: false, parent: 'clients', title: p => (GameState.getPlayer(p[0]) || {}).name || I18n.t('cd.player'), render(el, params) { ClientDetail.render(el, params[0]); } });
