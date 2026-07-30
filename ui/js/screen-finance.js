// ============================================================
//  Finance — income/expenses by source (this season + all-time),
//  weekly run-rate, and debug controls (money, reputation).
// ============================================================
const FinanceScreen = {
    ORDER: ['Wage commission', 'Sponsoring', 'Transfer & loan bonuses', 'Scout wages', 'Scout reports', 'Office', 'Facilities & staff', 'Physio treatments', 'Specialists', 'Gifts & relationships', 'Release pay-outs', 'Upgrades'],

    // The ledger keys stay English (they're data); this maps a category to its localized label,
    // falling back to the raw key for any category not in the finance.cat.* set.
    catLabel(c) {
        const k = 'finance.cat.' + String(c).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const t = I18n.t(k);
        return t === k ? c : t;
    },

    rows(led) {
        const cats = this.ORDER.filter(c => led[c] != null).concat(Object.keys(led).filter(c => !this.ORDER.includes(c)));
        const income = cats.filter(c => led[c] > 0), expense = cats.filter(c => led[c] < 0);
        const line = (list, sign) => list.length ? list.map(c => `<div class="frow"><span class="frow__k">${this.catLabel(c)}</span><span class="frow__v" style="color:${sign > 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${sign > 0 ? '+' : '−'}${UI.euro(Math.abs(led[c]))}</span></div>`).join('') : `<p class="muted" style="padding:8px 0">${I18n.t('common.none')}</p>`;
        const sumIn = income.reduce((s, c) => s + led[c], 0), sumOut = expense.reduce((s, c) => s + led[c], 0);
        return { income, expense, sumIn, sumOut, lineIn: line(income, 1), lineOut: line(expense, -1) };
    },

    render(el) {
        const a = GameState.agency;
        const cur = this.rows(a.ledger || {});
        const all = this.rows(a.ledgerAll || {});
        const wkly = Agency.weeklyBreakdown();
        const netCur = cur.sumIn + cur.sumOut, netAll = all.sumIn + all.sumOut;

        el.innerHTML = `
        <p class="hint" style="margin-bottom:var(--space-4)">${I18n.t('finance.subtitle', { season: GameState.seasonLabel() })}</p>

        <div class="section-label">${I18n.t('finance.income')}</div>
        <div class="fcard">${cur.lineIn}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('finance.totalIncome')}</span><span class="frow__v" style="color:var(--state-good)">+${UI.euro(cur.sumIn)}</span></div></div>

        <div class="section-label">${I18n.t('finance.expenses')}</div>
        <div class="fcard">${cur.lineOut}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('finance.totalExpenses')}</span><span class="frow__v" style="color:var(--state-bad)">−${UI.euro(Math.abs(cur.sumOut))}</span></div></div>

        <div class="section-label">${I18n.t('finance.netSeason')}</div>
        <div class="fcard" style="padding:12px">
            <div style="font-size:var(--fs-3xl);font-weight:var(--weight-semibold);color:${netCur >= 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${netCur >= 0 ? '+' : '−'}${UI.euro(Math.abs(netCur))}</div>
            <p class="hint" style="margin:8px 0 0">${I18n.t('finance.runRate', { comm: UI.euro(wkly.wageComm + wkly.sponsorComm), costs: UI.euro(wkly.scoutWages + wkly.office + wkly.facilities), scouts: UI.euro(wkly.scoutWages), office: UI.euro(wkly.office), facilities: UI.euro(wkly.facilities) })}</p>
        </div>

        <div class="section-label" style="margin-top:var(--space-6)">${I18n.t('finance.allTime')}</div>
        <div class="section-label">${I18n.t('finance.totalIncome')}</div>
        <div class="fcard">${all.lineIn}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('finance.allTimeIncome')}</span><span class="frow__v" style="color:var(--state-good)">+${UI.euro(all.sumIn)}</span></div></div>
        <div class="section-label">${I18n.t('finance.totalExpenses')}</div>
        <div class="fcard">${all.lineOut}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">${I18n.t('finance.allTimeExpenses')}</span><span class="frow__v" style="color:var(--state-bad)">−${UI.euro(Math.abs(all.sumOut))}</span></div></div>
        <div class="fcard" style="padding:12px">
            <div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);margin-bottom:4px">${I18n.t('finance.allTimeNet')}</div>
            <div style="font-size:var(--fs-3xl);font-weight:var(--weight-semibold);color:${netAll >= 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${netAll >= 0 ? '+' : '−'}${UI.euro(Math.abs(netAll))}</div>
        </div>

        <div class="section-label" style="margin-top:var(--space-6)"><i class="ti ti-bug" style="margin-right:4px"></i>${I18n.t('finance.developer')}</div>
        <div class="fcard" style="padding:12px">
            <div class="flex-row" style="justify-content:space-between;align-items:center;gap:12px">
                <div style="min-width:0"><div class="row-title">${I18n.t('finance.debugMode')}</div><div class="row-sub">${I18n.t('finance.debugDesc')}</div></div>
                <button class="btn ${GameState.debug ? 'btn--accent-outline' : 'btn--ghost'} btn--sm" style="width:auto;flex:none" onclick="FinanceScreen.toggleDebug()"><i class="ti ${GameState.debug ? 'ti-toggle-right' : 'ti-toggle-left'}"></i>${GameState.debug ? I18n.t('common.on') : I18n.t('common.off')}</button>
            </div>
        </div>
        ${GameState.debug ? `<div class="fcard" style="padding:12px">
            <label class="field-label" style="margin-top:0">${I18n.t('finance.setBalance')}</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgMoney" value="${Math.round(a.balance)}"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.setMoney()">${I18n.t('common.set')}</button></div>
            <label class="field-label">${I18n.t('finance.addBalance')}</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgAdd" value="10000"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.addMoney()">${I18n.t('common.add')}</button></div>
            <label class="field-label">${I18n.t('finance.reputationRange', { max: Agency.repLimit() })}</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgRep" min="0" max="${Agency.repLimit()}" value="${Math.round(a.reputation)}"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.setRep()">${I18n.t('common.set')}</button></div>
        </div>` : ''}
        <div id="actionResult"></div>`;
    },
    toggleDebug() {
        if (GameState.debug) { GameState.debug = false; GameState.save(); Router.refresh(); Router.result(I18n.t('finance.debugOff'), 'ok'); return; }
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('finance.enableDebugQ')}</div>
            <p class="hint">${I18n.t('finance.enableDebugDesc')}</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button><button class="btn btn--primary" onclick="FinanceScreen.doEnableDebug()"><i class="ti ti-bug"></i>${I18n.t('common.enable')}</button></div>`);
    },
    doEnableDebug() { GameState.debug = true; GameState.save(); Router.closeSheet(); Router.refresh(); Router.result(I18n.t('finance.debugOn'), 'ok'); },

    setMoney() {
        const n = Math.round(+document.getElementById('dbgMoney').value);
        if (!isFinite(n)) return;
        GameState.agency.balance = n; GameState.save();
        Router.refresh(); Router.result(I18n.t('finance.balanceSet', { v: UI.euro(n) }), 'ok');
    },
    addMoney() {
        const n = Math.round(+document.getElementById('dbgAdd').value);
        if (!isFinite(n)) return;
        GameState.agency.balance += n; GameState.save();
        Router.refresh(); Router.result(n >= 0 ? I18n.t('finance.added', { v: UI.euro(Math.abs(n)) }) : I18n.t('finance.removed', { v: UI.euro(Math.abs(n)) }), 'ok');
    },
    setRep() {
        let n = Math.round(+document.getElementById('dbgRep').value);
        if (!isFinite(n)) return;
        n = Math.max(0, Math.min(Agency.repLimit(), n));
        GameState.agency.reputation = n; GameState.save();
        Router.refresh(); Router.result(I18n.t('finance.repSet', { n }), 'ok');
    }
};
Router.register('finance', { isMain: false, parent: 'agency', title: () => I18n.t('finance.title'), render(el) { FinanceScreen.render(el); } });
