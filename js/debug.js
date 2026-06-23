// ============================================================================
// DEBUG TOOLS — temporary. To remove completely: delete this file and its
// <script src="js/debug.js"> tag in index.html. The one guarded reference in
// ui.js (UI.tabPotential) degrades to nothing when this file is absent.
// ============================================================================
const Debug = {
    setMoney(v) {
        const n = Math.round(+v);
        if (!isFinite(n)) return;
        GameState.agency.balance = n;
        GameState.save(); UI.refreshTopbar();
        if (UI.view === 'agency') UI.renderAgency();
    },
    setRep(v) {
        let n = Math.round(+v);
        if (!isFinite(n)) return;
        n = Math.max(0, Math.min(100, n));
        GameState.agency.reputation = n;
        GameState.save(); UI.refreshTopbar();
        if (UI.view === 'agency') UI.renderAgency();
        UI.renderPlayer && UI.view === 'clients' && UI.renderClients();
    },

    // block shown in the Finance tab (static — not auto-refreshed, so typing is never interrupted)
    financeControlsHTML() {
        const a = GameState.agency;
        return `<div class="panel debug-box">
            <strong>🛠 Debug</strong>
            <div class="debug-row"><label>Set money €</label><input type="number" id="dbgMoneyF" value="${Math.round(a.balance)}"><button class="btn-secondary sm" onclick="Debug.setMoney(document.getElementById('dbgMoneyF').value); UI.renderFinance()">Set</button></div>
            <div class="debug-row"><label>Add money €</label><input type="number" id="dbgAddF" value="10000"><button class="btn-secondary sm" onclick="Debug.addMoney(document.getElementById('dbgAddF').value); UI.renderFinance()">Add</button></div>
            <div class="debug-row"><label>Reputation</label><input type="number" id="dbgRepF" value="${Math.round(a.reputation)}" min="0" max="100"><button class="btn-secondary sm" onclick="Debug.setRep(document.getElementById('dbgRepF').value); UI.renderFinance()">Set</button></div>
        </div>`;
    },
    addMoney(v) { const n = Math.round(+v); if (!isFinite(n)) return; GameState.agency.balance += n; GameState.save(); UI.refreshTopbar(); },

    // injected inside the player "Potential" tab, next to the reveal button
    controlsHTML() {
        const a = GameState.agency;
        return `<div class="callout debug-box">
            <strong>🛠 Debug</strong>
            <div class="debug-row"><label>Money €</label><input type="number" id="dbgMoney" value="${Math.round(a.balance)}"><button class="btn-ghost sm" onclick="Debug.setMoney(document.getElementById('dbgMoney').value)">Set</button></div>
            <div class="debug-row"><label>Reputation</label><input type="number" id="dbgRep" value="${Math.round(a.reputation)}" min="0" max="100"><button class="btn-ghost sm" onclick="Debug.setRep(document.getElementById('dbgRep').value)">Set</button></div>
        </div>`;
    },

    // always-available floating panel
    initPanel() {
        if (document.getElementById('dbgPanel')) return;
        const el = document.createElement('div');
        el.id = 'dbgPanel';
        el.innerHTML = `<div class="dbg-title">🛠 Debug <button id="dbgClose" title="hide">×</button></div>
            <div class="debug-row"><label>€</label><input type="number" id="dbgMoneyG"><button class="btn-ghost sm" id="dbgMoneyBtn">Set</button></div>
            <div class="debug-row"><label>Rep</label><input type="number" id="dbgRepG" min="0" max="100"><button class="btn-ghost sm" id="dbgRepBtn">Set</button></div>`;
        document.body.appendChild(el);
        const sync = () => {
            try {
                const m = document.getElementById('dbgMoneyG'), r = document.getElementById('dbgRepG');
                if (m && document.activeElement !== m) m.value = Math.round(GameState.agency.balance);
                if (r && document.activeElement !== r) r.value = Math.round(GameState.agency.reputation);
            } catch (e) { }
        };
        document.getElementById('dbgMoneyBtn').addEventListener('click', () => this.setMoney(document.getElementById('dbgMoneyG').value));
        document.getElementById('dbgRepBtn').addEventListener('click', () => { this.setRep(document.getElementById('dbgRepG').value); });
        document.getElementById('dbgClose').addEventListener('click', () => el.classList.toggle('collapsed'));
        const obs = setInterval(sync, 1500); sync();
    }
};
if (typeof window !== 'undefined') {
    window.Debug = Debug;
    if (document.readyState !== 'loading') Debug.initPanel();
    else document.addEventListener('DOMContentLoaded', () => Debug.initPanel());
}
