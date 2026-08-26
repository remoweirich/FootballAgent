// ============================================================
//  Start screen — the launch menu shown before anything else.
//  Continue the most recent save, Load one of your saves, or
//  start a New game; plus Settings, How-to, and Customize.
//  A full-screen takeover (like Setup); runs outside the Router
//  shell, so it manages its own markup and its own help overlay.
// ============================================================
const StartScreen = {
    TITLE: 'Football Agency Simulator',   // working title — easy to change in one place

    // brand logo (shield badge); shared visual with Setup so branding stays consistent
    CREST: `<img src="assets/img/fa-logo.png" alt="" style="height:140px;width:auto;display:block;margin:0 auto">`,
    GEAR: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
    WAND: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m15 4 5 5L8 21l-5 1 1-5Z"/><path d="m14 5 5 5"/><path d="M19 3v2M21 8h-2"/></svg>`,
    BAG: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,

    async show() {
        this._auto = (typeof GameState !== 'undefined' && GameState.autosaveMeta) ? await GameState.autosaveMeta() : null;
        this._hasSave = !!this._auto;
        this._injectCSS();
        const saveLabel = this._saveLabel();
        document.getElementById('app').innerHTML = `<div class="ss-wrap"><div class="ss-inner">
            <div class="ss-brand">${this.CREST}<h1 class="ss-title">${UI.esc(this.TITLE)}</h1><div class="ss-tag">${I18n.t('start.tagline')}</div></div>
            <div class="ss-menu">
                <button class="ss-btn ss-btn--primary" id="ssContinue" ${this._hasSave ? '' : 'disabled'} onclick="StartScreen.resume()">
                    <span class="ss-btn__label">${I18n.t('start.continue')}</span>${this._hasSave && saveLabel ? `<span class="ss-btn__sub">${UI.esc(saveLabel)}</span>` : ''}
                </button>
                <div class="ss-row">
                    <button class="ss-btn" onclick="StartScreen.load()">${I18n.t('start.load')}</button>
                    <button class="ss-btn" onclick="StartScreen.newGame()">${I18n.t('start.new')}</button>
                </div>
            </div>
            <div class="ss-foot">
                <button class="ss-icon" onclick="StartScreen.settings()" aria-label="${I18n.t('common.settings')}">${this.GEAR}<span>${I18n.t('common.settings')}</span></button>
                <button class="ss-icon" onclick="StartScreen.help()" aria-label="${I18n.t('common.howToPlay')}"><span class="ss-q">?</span><span>${I18n.t('common.howToPlay')}</span></button>
                <button class="ss-icon" onclick="StartScreen.customize()" aria-label="${I18n.t('common.customize')}">${this.WAND}<span>${I18n.t('common.customize')}</span></button>
                <button class="ss-icon" onclick="StartScreen.store()" aria-label="${I18n.t('store.title')}">${this.BAG}<span>${I18n.t('store.title')}</span></button>
            </div>
        </div></div>`;
        // MUSIC DISABLED for now. Uncomment to bring the background playlist back.
        // if (typeof Sound !== 'undefined') Sound.startPlaylist();
    },

    // label under the Continue button, from the autosave summary read in show()
    _saveLabel() {
        const a = this._auto;
        if (!a) return I18n.t('start.continueEmpty');
        if (a.name) return a.name;
        return I18n.t('common.weekN', { n: a.week }) + (a.seasonLabel ? ' · ' + a.seasonLabel : '');
    },

    async resume() {
        if (!this._hasSave) return;
        if (typeof GameState.init === 'function') await GameState.init();
        Main.afterLoad();
    },
    newGame() {
        // single-save for now: warn before a New game overwrites a game in progress (guard goes away
        // once the multi-slot backend lands)
        if (this._hasSave) {
            this._overlay(I18n.t('start.newGame'), `<p class="ss-note">${I18n.t('start.newGameWarn')}</p>
                <div class="ss-row" style="margin-top:14px">
                    <button class="ss-btn" onclick="document.getElementById('ssOverlay').remove()">${I18n.t('common.cancel')}</button>
                    <button class="ss-btn ss-btn--primary" onclick="document.getElementById('ssOverlay').remove();Setup.show()">${I18n.t('start.overwriteStart')}</button>
                </div>`);
            return;
        }
        if (typeof Setup !== 'undefined') Setup.show();
    },

    // Load list: the rolling autosave (most recent) plus your manual named saves (up to 5).
    async load() {
        const auto = (typeof GameState !== 'undefined' && GameState.autosaveMeta) ? await GameState.autosaveMeta() : null;
        const slots = (typeof GameState !== 'undefined' && GameState.listNamedSaves) ? await GameState.listNamedSaves() : [];
        let rows = auto ? this._slotRow('auto', auto, true) : '';
        slots.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).forEach(s => rows += this._slotRow(s.id, s, false));
        if (!rows) rows = `<p class="ss-empty">${I18n.t('start.noSaves')}</p>`;
        this._overlay(I18n.t('start.loadGame'), `${rows}<p class="ss-note">${I18n.t('start.loadNote')}</p>`);
    },
    _slotRow(id, meta, isAuto) {
        const when = this._when(meta.savedAt);
        const title = isAuto ? (meta.name ? UI.esc(meta.name) + ' · ' + I18n.t('start.autosave') : I18n.t('start.autosave')) : UI.esc(meta.name || I18n.t('start.saveDefault'));
        const sub = `${meta.agency ? UI.esc(meta.agency) + ' · ' : ''}${I18n.t('common.weekN', { n: meta.week })}${meta.seasonLabel ? ' · ' + UI.esc(meta.seasonLabel) : ''}${when ? ' · ' + when : ''}`;
        const onclick = isAuto ? 'StartScreen.resume()' : `StartScreen.loadSlot('${id}')`;
        const del = isAuto ? '' : `<button class="ss-slotdel" onclick="event.stopPropagation();StartScreen.deleteSlot('${id}')" aria-label="${I18n.t('common.deleteSave')}">✕</button>`;
        return `<div class="ss-slot" onclick="${onclick}"><div class="ss-slotmain"><span class="ss-slot__name">${title}</span><span class="ss-slotsub">${sub}</span></div><span class="ss-slot__go">${I18n.t('common.play')}</span>${del}</div>`;
    },
    async loadSlot(id) {
        // if the current autosave holds progress not backed up to a slot, loading would discard it
        if (this._auto && this._auto.namedClean === false) { this._confirmReplace(id); return; }
        await this._doLoadSlot(id);
    },
    async _doLoadSlot(id) {
        if (typeof GameState === 'undefined' || !GameState.loadNamedSave) return;
        const ok = await GameState.loadNamedSave(id);
        const ov = document.getElementById('ssOverlay'); if (ov) ov.remove();
        if (ok) Main.afterLoad();
    },
    _confirmReplace(id) {
        const a = this._auto;
        const label = a && a.name ? a.name : (a ? I18n.t('common.weekN', { n: a.week }) + (a.seasonLabel ? ' · ' + a.seasonLabel : '') : '');
        this._overlay(I18n.t('start.loadGame'), `
            <p class="ss-note">${I18n.t('start.confirmReplaceNote', { label: UI.esc(label) })}</p>
            <div class="ss-stack">
                <button class="ss-btn ss-btn--primary" onclick="StartScreen._saveFirst('${id}')">${I18n.t('start.saveFirst')}</button>
                <button class="ss-btn" onclick="StartScreen._doLoadSlot('${id}')">${I18n.t('start.loadWithoutSaving')}</button>
                <button class="ss-btn" onclick="document.getElementById('ssOverlay').remove()">${I18n.t('common.cancel')}</button>
            </div>`);
    },
    // back up the current autosave to a named slot, then continue to the load
    async _saveFirst(id) {
        if (typeof GameState.init === 'function' && !GameState.agency) await GameState.init();   // ensure GameState = the autosave
        const slots = (typeof GameState.listNamedSaves === 'function') ? await GameState.listNamedSaves() : [];
        const max = (typeof Storage !== 'undefined' && Storage.MAX_SLOTS) || 5;
        const chips = slots.length
            ? `<div class="ss-chips">${slots.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).map(s => `<button class="ss-chip" onclick="StartScreen._useName(this)">${UI.esc(s.name)}</button>`).join('')}</div>`
            : '';
        this._overlay(I18n.t('start.saveCurrent'), `
            <p class="ss-note">${I18n.t('start.saveNameNote', { max, used: slots.length })}</p>
            ${chips}
            <input id="ssSaveName" class="text-input" type="text" maxlength="32" placeholder="${I18n.t('start.savePlaceholder')}" value="${UI.esc(GameState.saveName || '')}" style="margin-top:10px">
            <div id="ssSaveErr"></div>
            <button class="ss-btn ss-btn--primary" style="width:100%;margin-top:12px" onclick="StartScreen._saveFirstConfirm('${id}')">${I18n.t('start.saveThenLoad')}</button>`);
        setTimeout(() => { const el = document.getElementById('ssSaveName'); if (el) el.focus(); }, 30);
    },
    _useName(btn) { const el = document.getElementById('ssSaveName'); if (el) el.value = btn.textContent; },
    async _saveFirstConfirm(id) {
        const el = document.getElementById('ssSaveName');
        const name = (el && el.value.trim()) || '';
        const res = (typeof GameState.createNamedSave === 'function') ? await GameState.createNamedSave(name) : { ok: false, message: I18n.t('start.saveUnavailable') };
        if (!res.ok) { const e = document.getElementById('ssSaveErr'); if (e) e.innerHTML = `<p class="ss-note" style="color:var(--state-bad);margin-top:8px">${UI.esc(res.message)}</p>`; return; }
        await this._doLoadSlot(id);
    },
    async deleteSlot(id) {
        if (typeof GameState !== 'undefined' && GameState.deleteNamedSave) await GameState.deleteNamedSave(id);
        this.load();   // re-render the list
    },
    _when(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return new Date(ts).toLocaleDateString();
    },
    settings() { if (typeof SettingsScreen !== 'undefined') SettingsScreen.show('start'); },
    store() { if (typeof StoreScreen !== 'undefined') StoreScreen.show('start'); },
    help() { if (typeof Setup !== 'undefined' && Setup.openHelpOverlay) Setup.openHelpOverlay(); },
    customize() {
        if (typeof CustomizeScreen !== 'undefined') { CustomizeScreen.show(); return; }
        this._overlay(I18n.t('common.customize'), `<p class="ss-note">${I18n.t('start.customizeSoon')}</p>`);
    },

    // a lightweight self-contained overlay (no Router shell on this screen)
    _overlay(title, bodyHTML) {
        let ov = document.getElementById('ssOverlay');
        if (ov) ov.remove();
        ov = document.createElement('div');
        ov.id = 'ssOverlay'; ov.className = 'ss-overlay';
        ov.innerHTML = `<div class="ss-ovcard"><div class="ss-ovtitle">${UI.esc(title)}</div><div class="ss-ovbody">${bodyHTML}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:14px" onclick="document.getElementById('ssOverlay').remove()">${I18n.t('common.close')}</button></div>`;
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
        document.body.appendChild(ov);
    },

    _injectCSS() {
        if (document.getElementById('ssCSS')) return;
        const css = `
        .ss-wrap{position:fixed;inset:0;background:radial-gradient(120% 80% at 50% 0%, rgba(236,232,204,.10), transparent 60%),var(--bg);display:flex;align-items:center;justify-content:center;z-index:50;padding:calc(env(safe-area-inset-top,0) + 20px) 22px calc(env(safe-area-inset-bottom,0) + 20px)}
        .ss-inner{width:100%;max-width:400px;display:flex;flex-direction:column;min-height:min(560px,90vh)}
        .ss-brand{text-align:center;margin-top:8vh}
        .ss-title{font-size:26px;font-weight:var(--weight-bold);color:var(--text-bright);margin:14px 0 4px;letter-spacing:-.01em}
        .ss-tag{color:var(--text-muted);font-size:var(--fs-sm)}
        .ss-menu{margin-top:auto;display:flex;flex-direction:column;gap:12px}
        .ss-row{display:flex;gap:12px}
        .ss-btn{flex:1;background:var(--surface);border:1px solid var(--line-strong);color:var(--text);border-radius:14px;padding:15px 16px;font:inherit;font-weight:var(--weight-semibold);font-size:var(--fs-md);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}
        .ss-btn:active{background:var(--surface-raised)}
        .ss-btn:disabled{opacity:.45;cursor:default}
        .ss-btn--primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#04140c)}
        .ss-btn__sub{font-weight:var(--weight-regular);font-size:var(--fs-xs);opacity:.85}
        .ss-foot{display:flex;justify-content:space-around;gap:8px;margin-top:22px}
        .ss-icon{background:none;border:none;color:var(--text-secondary);display:flex;flex-direction:column;align-items:center;gap:5px;font:inherit;font-size:11px;cursor:pointer;padding:8px 10px;border-radius:12px}
        .ss-icon:active{background:var(--surface)}
        .ss-q{width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:var(--weight-bold);border:1.7px solid currentColor;border-radius:50%}
        .ss-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:70;padding:22px}
        .ss-ovcard{background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:20px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto}
        .ss-ovtitle{font-weight:var(--weight-semibold);font-size:var(--fs-lg);color:var(--text-bright);margin-bottom:12px}
        .ss-note{color:var(--text-muted);font-size:var(--fs-sm);line-height:1.5}
        .ss-empty{color:var(--text-dim);text-align:center;padding:16px 0}
        .ss-slot{width:100%;display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line-strong);border-radius:12px;padding:12px 14px;color:var(--text);font:inherit;cursor:pointer;margin-bottom:8px;text-align:left}
        .ss-slotmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
        .ss-slot__name{font-weight:var(--weight-semibold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ss-slotsub{color:var(--text-muted);font-size:var(--fs-xs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ss-slot__go{color:var(--accent);font-size:var(--fs-sm);font-weight:var(--weight-semibold);flex:none}
        .ss-slotdel{flex:none;background:none;border:none;color:var(--text-faint);font-size:15px;cursor:pointer;padding:4px 2px 4px 6px;line-height:1}
        .ss-slotdel:active{color:var(--state-bad)}
        .ss-stack{display:flex;flex-direction:column;gap:8px;margin-top:14px}
        .ss-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
        .ss-chip{background:var(--surface-raised);border:1px solid var(--line-strong);color:var(--text-secondary);border-radius:999px;padding:5px 12px;font:inherit;font-size:var(--fs-sm);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
        const el = document.createElement('style'); el.id = 'ssCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
