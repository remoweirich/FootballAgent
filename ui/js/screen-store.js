// ============================================================
//  Store — unlocks & support. Lists the products from Monetization.PRODUCTS with truthful
//  Buy/Owned state (uses Monetization.purchased(), so it stays honest even while DEV_UNLOCK_ALL
//  makes the game itself behave as fully unlocked). Buy/Restore route through Monetization, which
//  today grants locally via the dev provider and later through RevenueCat with zero changes here.
//  Reached from the Start-screen menu (alongside Settings / How-to / Customize) and from Settings.
// ============================================================
const StoreScreen = {
    GROUPS: [
        { head: 'store.bundles', ids: ['pro', 'sandbox'] },
        { head: 'store.individual', ids: ['remove_ads', 'insights', 'editor'] },
        { head: 'store.support', ids: ['supporter_2', 'supporter_5', 'supporter_10'] },
    ],
    _from: 'start',

    _M() { return (typeof Monetization !== 'undefined') ? Monetization : null; },
    isOwned(id) {
        const M = this._M(); if (!M) return false;
        const p = M.PRODUCTS[id]; if (!p) return false;
        if (p.tier) return M.supporterTier() >= p.tier;              // supporter: any tier at/below current reads as done
        return (p.grants || []).every(e => M.purchased(e));          // bundle/single: all its entitlements really owned
    },
    _card(id) {
        const M = this._M(), p = M.PRODUCTS[id];
        const owned = this.isOwned(id);
        return `<div class="st-card${owned ? ' st-card--owned' : ''}">
            <div class="st-cardmain">
                <div class="st-name">${I18n.t('store.' + id + '.name')}${p.bundle ? ` <span class="st-badge">${I18n.t('store.bundle')}</span>` : ''}</div>
                <div class="st-desc">${I18n.t('store.' + id + '.desc')}</div>
            </div>
            <div class="st-cardright">
                ${owned
                ? `<span class="st-owned"><i class="ti ti-check"></i> ${I18n.t('store.owned')}</span>`
                : `<button class="btn btn--primary btn--sm st-buy" onclick="StoreScreen.buy('${id}')">${UI.esc(M.priceOf(id))}</button>`}
            </div>
        </div>`;
    },
    show(from) {
        if (from) this._from = from;
        const M = this._M(); if (!M) return;
        this._css();
        const thanks = M.supporterTier() > 0 ? `<div class="st-thanks"><i class="ti ti-heart-filled"></i> ${I18n.t('store.thanks')}</div>` : '';
        const groups = this.GROUPS.map(g => `
            <div class="st-head">${I18n.t(g.head)}</div>
            ${g.head === 'store.support' ? thanks : ''}
            <div class="st-group">${g.ids.map(id => this._card(id)).join('')}</div>`).join('');
        document.getElementById('app').innerHTML = `<div class="st-wrap">
            <div class="st-bar">
                <button class="st-back" onclick="StoreScreen.back()" aria-label="${I18n.t('common.back')}"><i class="ti ti-chevron-left" style="font-size:24px"></i></button>
                <span class="st-title">${I18n.t('store.title')}</span>
            </div>
            <div class="st-body">
                <p class="st-intro">${I18n.t('store.intro')}</p>
                ${groups}
                <button class="btn btn--ghost st-restore" onclick="StoreScreen.restore()">${I18n.t('store.restore')}</button>
                <p class="st-note">${I18n.t('store.note')}</p>
            </div>
        </div>`;
    },
    back() {
        if (this._from === 'start') { if (typeof StartScreen !== 'undefined') StartScreen.show(); return; }
        if (typeof SettingsScreen !== 'undefined') SettingsScreen.show('game');
    },
    async buy(id) {
        const M = this._M(); if (!M) return;
        const res = await M.purchase(id);
        if (res && res.ok) { this.show(); this._toast(I18n.t('store.purchased')); }
        else if (res && res.error && res.error !== 'cancelled') this._toast(I18n.t('store.failed'));
    },
    async restore() {
        const M = this._M(); if (!M) return;
        const res = await M.restore();
        this.show();
        this._toast((res && res.ok) ? I18n.t('store.restored') : I18n.t('store.failed'));
    },

    _toast(msg) {
        let t = document.getElementById('stToast'); if (t) t.remove();
        t = document.createElement('div'); t.id = 'stToast'; t.className = 'st-toast'; t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add('st-toast--in'), 10);
        setTimeout(() => { t.classList.remove('st-toast--in'); setTimeout(() => t.remove(), 250); }, 2000);
    },
    _css() {
        if (document.getElementById('stCSS')) return;
        const css = `
        .st-wrap{position:fixed;inset:0;background:var(--bg);color:var(--text);z-index:57;display:flex;flex-direction:column}
        .st-bar{display:flex;align-items:center;gap:6px;padding:calc(env(safe-area-inset-top,0) + 10px) 12px 10px;border-bottom:.5px solid var(--line-strong);background:var(--surface)}
        .st-back{background:none;border:none;color:var(--text);cursor:pointer;padding:4px;display:flex}
        .st-title{font-weight:var(--weight-semibold);font-size:var(--fs-lg)}
        .st-body{flex:1;overflow-y:auto;padding:14px 14px calc(env(safe-area-inset-bottom,0) + 28px)}
        .st-intro{color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.5;margin:0 0 8px}
        .st-head{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;margin:18px 2px 8px}
        .st-group{display:flex;flex-direction:column;gap:10px}
        .st-card{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}
        .st-card--owned{opacity:.75}
        .st-cardmain{flex:1;min-width:0}
        .st-name{font-size:var(--fs-md);font-weight:var(--weight-semibold);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .st-badge{font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:var(--weight-bold);color:var(--accent-ink,#04140c);background:var(--accent);border-radius:999px;padding:2px 7px}
        .st-desc{color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.4;margin-top:3px}
        .st-cardright{flex:none}
        .st-buy{min-width:74px}
        .st-owned{display:inline-flex;align-items:center;gap:5px;color:var(--state-good);font-size:var(--fs-sm);font-weight:var(--weight-semibold)}
        .st-thanks{display:flex;align-items:center;gap:7px;color:var(--accent);font-size:var(--fs-sm);font-weight:var(--weight-medium);margin:0 2px 8px}
        .st-restore{width:100%;margin-top:20px}
        .st-note{color:var(--text-dim);font-size:var(--fs-xs);line-height:1.45;text-align:center;margin:12px 6px 0}
        .st-toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0) + 26px);transform:translate(-50%,14px);background:var(--text-bright);color:var(--bg);padding:10px 16px;border-radius:22px;font-size:var(--fs-sm);font-weight:var(--weight-medium);z-index:95;opacity:0;transition:opacity .2s,transform .2s;box-shadow:0 6px 20px rgba(0,0,0,.3);max-width:90vw;text-align:center}
        .st-toast--in{opacity:1;transform:translate(-50%,0)}`;
        const s = document.createElement('style'); s.id = 'stCSS'; s.textContent = css; document.head.appendChild(s);
    },
};
