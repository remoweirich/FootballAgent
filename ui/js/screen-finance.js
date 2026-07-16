// ============================================================
//  Finance — income/expenses by source (this season + all-time),
//  weekly run-rate, and debug controls (money, reputation).
// ============================================================
const FinanceScreen = {
    ORDER: ['Wage commission', 'Sponsoring', 'Transfer & loan bonuses', 'Scout wages', 'Scout reports', 'Office', 'Facilities & staff', 'Physio treatments', 'Specialists', 'Gifts & relationships', 'Release pay-outs', 'Upgrades'],

    rows(led) {
        const cats = this.ORDER.filter(c => led[c] != null).concat(Object.keys(led).filter(c => !this.ORDER.includes(c)));
        const income = cats.filter(c => led[c] > 0), expense = cats.filter(c => led[c] < 0);
        const line = (list, sign) => list.length ? list.map(c => `<div class="frow"><span class="frow__k">${c}</span><span class="frow__v" style="color:${sign > 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${sign > 0 ? '+' : '−'}${UI.euro(Math.abs(led[c]))}</span></div>`).join('') : `<p class="muted" style="padding:8px 0">None</p>`;
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
        <p class="hint" style="margin-bottom:var(--space-4)">Income & spending this season (${GameState.seasonLabel()}), by source.</p>

        <div class="section-label">Income</div>
        <div class="fcard">${cur.lineIn}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">Total income</span><span class="frow__v" style="color:var(--state-good)">+${UI.euro(cur.sumIn)}</span></div></div>

        <div class="section-label">Expenses</div>
        <div class="fcard">${cur.lineOut}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">Total expenses</span><span class="frow__v" style="color:var(--state-bad)">−${UI.euro(Math.abs(cur.sumOut))}</span></div></div>

        <div class="section-label">Net this season</div>
        <div class="fcard" style="padding:12px">
            <div style="font-size:var(--fs-3xl);font-weight:var(--weight-semibold);color:${netCur >= 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${netCur >= 0 ? '+' : '−'}${UI.euro(Math.abs(netCur))}</div>
            <p class="hint" style="margin:8px 0 0">Weekly run-rate: +${UI.euro(wkly.wageComm + wkly.sponsorComm)} commissions, −${UI.euro(wkly.scoutWages + wkly.office + wkly.facilities)} running costs (scouts ${UI.euro(wkly.scoutWages)} · office ${UI.euro(wkly.office)} · facilities/staff ${UI.euro(wkly.facilities)}).</p>
        </div>

        <div class="section-label" style="margin-top:var(--space-6)">All-time</div>
        <div class="section-label">Total income</div>
        <div class="fcard">${all.lineIn}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">All-time income</span><span class="frow__v" style="color:var(--state-good)">+${UI.euro(all.sumIn)}</span></div></div>
        <div class="section-label">Total expenses</div>
        <div class="fcard">${all.lineOut}<div class="frow" style="border-top:1px solid var(--line-strong)"><span class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text)">All-time expenses</span><span class="frow__v" style="color:var(--state-bad)">−${UI.euro(Math.abs(all.sumOut))}</span></div></div>
        <div class="fcard" style="padding:12px">
            <div class="frow__k" style="font-weight:var(--weight-semibold);color:var(--text);margin-bottom:4px">All-time net</div>
            <div style="font-size:var(--fs-3xl);font-weight:var(--weight-semibold);color:${netAll >= 0 ? 'var(--state-good)' : 'var(--state-bad)'}">${netAll >= 0 ? '+' : '−'}${UI.euro(Math.abs(netAll))}</div>
        </div>

        <div class="section-label" style="margin-top:var(--space-6)"><i class="ti ti-bug" style="margin-right:4px"></i>Developer</div>
        <div class="fcard" style="padding:12px">
            <div class="flex-row" style="justify-content:space-between;align-items:center;gap:12px">
                <div style="min-width:0"><div class="row-title">Debug mode</div><div class="row-sub">Reveals developer controls: edit balance &amp; reputation here, and a player's age &amp; true potential on his Potential tab.</div></div>
                <button class="btn ${GameState.debug ? 'btn--accent-outline' : 'btn--ghost'} btn--sm" style="width:auto;flex:none" onclick="FinanceScreen.toggleDebug()"><i class="ti ${GameState.debug ? 'ti-toggle-right' : 'ti-toggle-left'}"></i>${GameState.debug ? 'On' : 'Off'}</button>
            </div>
        </div>
        ${GameState.debug ? `<div class="fcard" style="padding:12px">
            <label class="field-label" style="margin-top:0">Set balance (€)</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgMoney" value="${Math.round(a.balance)}"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.setMoney()">Set</button></div>
            <label class="field-label">Add to balance (€)</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgAdd" value="10000"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.addMoney()">Add</button></div>
            <label class="field-label">Reputation (0–${Agency.repLimit()})</label>
            <div class="flex-row"><input class="text-input" type="number" id="dbgRep" min="0" max="${Agency.repLimit()}" value="${Math.round(a.reputation)}"><button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="FinanceScreen.setRep()">Set</button></div>
        </div>` : ''}
        <div id="actionResult"></div>`;
    },
    toggleDebug() {
        if (GameState.debug) { GameState.debug = false; GameState.save(); Router.refresh(); Router.result('Debug mode disabled.', 'ok'); return; }
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Enable debug mode?</div>
            <p class="hint">Are you sure you want to enable the debug mode? It unlocks developer controls to edit your balance and reputation, and to reveal &amp; change a player's age and true potential — handy for testing, but using them is effectively cheating.</p>
            <div class="flex-row" style="margin-top:var(--space-5)"><button class="btn btn--ghost" onclick="Router.closeSheet()">Cancel</button><button class="btn btn--primary" onclick="FinanceScreen.doEnableDebug()"><i class="ti ti-bug"></i>Enable</button></div>`);
    },
    doEnableDebug() { GameState.debug = true; GameState.save(); Router.closeSheet(); Router.refresh(); Router.result('Debug mode enabled.', 'ok'); },

    setMoney() {
        const n = Math.round(+document.getElementById('dbgMoney').value);
        if (!isFinite(n)) return;
        GameState.agency.balance = n; GameState.save();
        Router.refresh(); Router.result(`Balance set to ${UI.euro(n)}.`, 'ok');
    },
    addMoney() {
        const n = Math.round(+document.getElementById('dbgAdd').value);
        if (!isFinite(n)) return;
        GameState.agency.balance += n; GameState.save();
        Router.refresh(); Router.result(`${n >= 0 ? 'Added' : 'Removed'} ${UI.euro(Math.abs(n))}.`, 'ok');
    },
    setRep() {
        let n = Math.round(+document.getElementById('dbgRep').value);
        if (!isFinite(n)) return;
        n = Math.max(0, Math.min(Agency.repLimit(), n));
        GameState.agency.reputation = n; GameState.save();
        Router.refresh(); Router.result(`Reputation set to ${n}.`, 'ok');
    }
};
Router.register('finance', { isMain: false, parent: 'agency', title: 'Finance', render(el) { FinanceScreen.render(el); } });
