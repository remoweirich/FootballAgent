// ============================================================
//  Sandbox editor — the top-tier ("Full Editor") unlock. Lets the player rewrite their own game
//  state: agency finances + reputation, and each client's name / age / ability / potential.
//  Gated by Monetization.owns('sandbox'); reached from Settings (in-game only). Self-contained
//  styles + overlay so it doesn't depend on any other screen's CSS.
// ============================================================
const Sandbox = {
    show() {
        if (typeof Monetization !== 'undefined' && !Monetization.owns('sandbox')) { this.back(); return; }
        this._css();
        const a = (typeof GameState !== 'undefined' && GameState.agency) || {};
        const clients = (typeof Agency !== 'undefined' && Agency.clients) ? Agency.clients() : [];
        const rows = clients.length ? clients.map(p => `
            <button class="sbx-row" onclick="Sandbox.editClient('${p.id}')">
                <span class="sbx-rowmain"><span class="sbx-name">${UI.esc(p.name)}</span>
                <span class="sbx-sub">${I18n.t('sandbox.ageAbil', { age: p.age, abil: p.ability, pot: p.potential })}</span></span>
                <i class="ti ti-chevron-right" style="color:var(--text-dim)"></i>
            </button>`).join('') : `<p class="sbx-empty">${I18n.t('sandbox.noClients')}</p>`;
        document.getElementById('app').innerHTML = `<div class="sbx-wrap">
            <div class="sbx-bar">
                <button class="sbx-back" onclick="Sandbox.back()" aria-label="${I18n.t('common.back')}"><i class="ti ti-chevron-left" style="font-size:24px"></i></button>
                <span class="sbx-title">${I18n.t('sandbox.title')}</span>
            </div>
            <div class="sbx-body">
                <p class="sbx-note">${I18n.t('sandbox.note')}</p>
                <div class="sbx-head">${I18n.t('sandbox.agency')}</div>
                <div class="sbx-card">
                    <label class="sbx-lbl">${I18n.t('sandbox.balance')}</label>
                    <div class="sbx-inrow"><input id="sbxBal" class="text-input" type="number" value="${Math.round(a.balance || 0)}"><button class="btn btn--primary btn--sm" style="width:auto" onclick="Sandbox.setBalance()">${I18n.t('common.set')}</button></div>
                    <label class="sbx-lbl" style="margin-top:12px">${I18n.t('sandbox.reputation')} <span class="muted">0–100</span></label>
                    <div class="sbx-inrow"><input id="sbxRep" class="text-input" type="number" min="0" max="100" value="${Math.round(a.reputation || 0)}"><button class="btn btn--primary btn--sm" style="width:auto" onclick="Sandbox.setRep()">${I18n.t('common.set')}</button></div>
                </div>
                <div class="sbx-head">${I18n.t('sandbox.clients')}</div>
                <div class="sbx-list">${rows}</div>
            </div>
        </div>`;
    },
    back() { if (typeof SettingsScreen !== 'undefined') SettingsScreen.show(); },

    setBalance() {
        const v = Math.round(+document.getElementById('sbxBal').value);
        if (!isFinite(v)) return;
        GameState.agency.balance = v; GameState.save();
        this._toast(I18n.t('sandbox.saved'));
    },
    setRep() {
        let v = Math.round(+document.getElementById('sbxRep').value);
        if (!isFinite(v)) return;
        GameState.agency.reputation = Math.max(0, Math.min(100, v)); GameState.save();
        this._toast(I18n.t('sandbox.saved'));
    },

    editClient(id) {
        const p = GameState.getPlayer(id); if (!p) return;
        const roles = (typeof Scouting !== 'undefined' && Scouting.rolesFor) ? Scouting.rolesFor(p.position) : [];
        const styleOpts = roles.map(r => `<option value="${r.id}" ${p.styleRole === r.id ? 'selected' : ''}>${UI.esc(r.label)}</option>`).join('');
        const m = p.morale || { club: 70, time: 70, wage: 70, agent: 70 };
        const mInput = (k) => `<div class="sbx-mcell"><span class="sbx-msub">${I18n.t('cd.dim.' + k)}</span><input id="sbxMor_${k}" class="text-input" type="number" min="0" max="100" value="${Math.round(m[k])}"></div>`;
        this._overlay(`
            <div class="sbx-ovtitle">${UI.esc(p.name)}</div>
            <label class="sbx-lbl">${I18n.t('sandbox.name')}</label>
            <input id="sbxName" class="text-input" type="text" maxlength="32" value="${UI.esc(p.name)}">
            <label class="sbx-lbl" style="margin-top:10px">${I18n.t('sandbox.age')} <span class="muted">15–45</span></label>
            <input id="sbxAge" class="text-input" type="number" min="15" max="45" value="${p.age}">
            <label class="sbx-lbl" style="margin-top:10px">${I18n.t('sandbox.ability')} <span class="muted">1–99</span></label>
            <input id="sbxAbil" class="text-input" type="number" min="1" max="99" value="${p.ability}">
            <label class="sbx-lbl" style="margin-top:10px">${I18n.t('sandbox.potential')} <span class="muted">1–99</span></label>
            <input id="sbxPot" class="text-input" type="number" min="1" max="99" value="${p.potential}">
            <label class="sbx-lbl" style="margin-top:10px">${I18n.t('sandbox.profile')} <span class="muted">${UI.esc(p.position)}</span></label>
            <select id="sbxStyle" class="text-input select-input">${styleOpts || `<option value="">—</option>`}</select>
            <label class="sbx-lbl" style="margin-top:12px">${I18n.t('sandbox.morale')} <span class="muted">0–100</span></label>
            <div class="sbx-morgrid">${mInput('club')}${mInput('time')}${mInput('wage')}${mInput('agent')}</div>
            <label class="sbx-check"><input id="sbxMorLock" type="checkbox" ${p.moraleLock ? 'checked' : ''}><span>${I18n.t('sandbox.lockMorale')}</span></label>
            <div class="sbx-ovrow">
                <button class="btn btn--ghost" onclick="Sandbox._close()">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" onclick="Sandbox.saveClient('${id}')">${I18n.t('common.save')}</button>
            </div>`);
    },
    saveClient(id) {
        const p = GameState.getPlayer(id); if (!p) return;
        const name = (document.getElementById('sbxName').value || '').trim();
        const age = Math.round(+document.getElementById('sbxAge').value);
        let abil = Math.round(+document.getElementById('sbxAbil').value);
        let pot = Math.round(+document.getElementById('sbxPot').value);
        if (name) p.name = name.slice(0, 32);
        if (isFinite(age)) p.age = Math.max(15, Math.min(45, age));
        if (isFinite(abil)) { abil = Math.max(1, Math.min(99, abil)); p.ability = abil; if (p.peakAbility != null) p.peakAbility = Math.max(p.peakAbility, abil); }
        if (isFinite(pot)) { pot = Math.max(1, Math.min(99, pot)); p.potential = Math.max(pot, p.ability); }   // ceiling can't sit below current ability
        const style = document.getElementById('sbxStyle');
        if (style && style.value) p.styleRole = style.value;
        if (!p.morale) p.morale = { club: 70, time: 70, wage: 70, agent: 70 };
        ['club', 'time', 'wage', 'agent'].forEach(k => {
            const el = document.getElementById('sbxMor_' + k);
            if (el) { const v = Math.round(+el.value); if (isFinite(v)) p.morale[k] = Math.max(0, Math.min(100, v)); }
        });
        const lockEl = document.getElementById('sbxMorLock');
        // moraleLock holds the frozen values (or null): the weekly morale pass re-asserts them, so a
        // locked client's mood never drifts, complains or escalates until it's unlocked here again.
        p.moraleLock = (lockEl && lockEl.checked) ? { club: p.morale.club, time: p.morale.time, wage: p.morale.wage, agent: p.morale.agent } : null;
        GameState.save();
        this._close(); this.show();
        this._toast(I18n.t('sandbox.saved'));
    },

    // ---- self-contained overlay + toast ----
    _overlay(html) {
        this._close();
        const o = document.createElement('div');
        o.id = 'sbxOverlay'; o.className = 'sbx-overlay';
        o.innerHTML = `<div class="sbx-ovcard">${html}</div>`;
        o.addEventListener('click', e => { if (e.target === o) Sandbox._close(); });
        document.body.appendChild(o);
    },
    _close() { const o = document.getElementById('sbxOverlay'); if (o) o.remove(); },
    _toast(msg) {
        let t = document.getElementById('sbxToast'); if (t) t.remove();
        t = document.createElement('div'); t.id = 'sbxToast'; t.className = 'sbx-toast'; t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('sbx-toast--in'), 10);
        setTimeout(() => { t.classList.remove('sbx-toast--in'); setTimeout(() => t.remove(), 250); }, 1800);
    },
    _css() {
        if (document.getElementById('sbxCSS')) return;
        const css = `
        .sbx-wrap{position:fixed;inset:0;background:var(--bg);color:var(--text);z-index:56;display:flex;flex-direction:column}
        .sbx-bar{display:flex;align-items:center;gap:6px;padding:calc(env(safe-area-inset-top,0) + 10px) 12px 10px;border-bottom:.5px solid var(--line-strong);background:var(--surface)}
        .sbx-back{background:none;border:none;color:var(--text);cursor:pointer;padding:4px;display:flex}
        .sbx-title{font-weight:var(--weight-semibold);font-size:var(--fs-lg)}
        .sbx-body{flex:1;overflow-y:auto;padding:14px 14px calc(env(safe-area-inset-bottom,0) + 24px)}
        .sbx-note{color:var(--text-secondary);font-size:var(--fs-sm);margin:0 0 14px;line-height:1.45}
        .sbx-head{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;margin:16px 2px 7px}
        .sbx-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}
        .sbx-lbl{display:block;color:var(--text-secondary);font-size:var(--fs-sm);margin:0 0 6px}
        .sbx-inrow{display:flex;gap:8px;align-items:center}
        .sbx-inrow .text-input{flex:1}
        .sbx-list{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
        .sbx-row{width:100%;display:flex;align-items:center;gap:10px;background:none;border:none;border-bottom:.5px solid var(--line-faint);color:var(--text);font:inherit;padding:12px 14px;cursor:pointer;text-align:left}
        .sbx-list .sbx-row:last-child{border-bottom:none}
        .sbx-rowmain{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
        .sbx-name{font-size:var(--fs-md);font-weight:var(--weight-medium)}
        .sbx-sub{font-size:var(--fs-xs);color:var(--text-dim)}
        .sbx-empty{color:var(--text-dim);padding:14px;text-align:center}
        .sbx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:80;padding:22px}
        .sbx-ovcard{background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:18px;max-width:400px;width:100%;max-height:88vh;overflow-y:auto}
        .sbx-ovtitle{font-weight:var(--weight-semibold);font-size:var(--fs-lg);margin-bottom:12px}
        .sbx-morgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .sbx-mcell{display:flex;flex-direction:column;gap:3px}
        .sbx-msub{font-size:var(--fs-xs);color:var(--text-dim)}
        .sbx-check{display:flex;align-items:center;gap:8px;margin-top:12px;color:var(--text-secondary);font-size:var(--fs-sm);cursor:pointer}
        .sbx-check input{width:17px;height:17px}
        .sbx-ovrow{display:flex;gap:10px;margin-top:16px}
        .sbx-ovrow .btn{flex:1}
        .sbx-toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0) + 26px);transform:translate(-50%,14px);background:var(--text-bright);color:var(--bg);padding:10px 16px;border-radius:22px;font-size:var(--fs-sm);font-weight:var(--weight-medium);z-index:95;opacity:0;transition:opacity .2s,transform .2s;box-shadow:0 6px 20px rgba(0,0,0,.3)}
        .sbx-toast--in{opacity:1;transform:translate(-50%,0)}`;
        const s = document.createElement('style'); s.id = 'sbxCSS'; s.textContent = css; document.head.appendChild(s);
    },
};
