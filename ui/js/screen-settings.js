// ============================================================
//  Settings — reachable from the top-bar gear in-game, and from
//  the Start screen. A full-screen takeover. Holds the how-to
//  (migrated off the old '?'), Save game, Back to start, the
//  legal text, and placeholders for features still to come.
// ============================================================
const SettingsScreen = {
    _from: 'game',   // 'game' → Close returns to the current screen; 'start' → back to the start menu

    show(from) {
        this._from = from || 'game';
        this._injectCSS();
        const soon = `<span class="set-soon">Coming soon</span>`;
        // some glyphs aren't in the trimmed icon font — use inline SVG for those (sun/music/volume)
        const ic = cls => `<i class="ti ${cls} set-row__ico"></i>`;
        const svg = d => `<svg class="set-row__ico set-row__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
        const SUN = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
        const MUSIC = svg('<circle cx="6.5" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/><path d="M9 18V6l11-2v12"/>');
        const VOL = svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>');
        const row = (iconHTML, label, right, onclick, dim) =>
            `<button class="set-row${dim ? ' set-row--dim' : ''}" ${onclick ? `onclick="${onclick}"` : 'disabled'}>
                ${iconHTML}<span class="set-row__label">${label}</span>${right || ''}</button>`;
        document.getElementById('app').innerHTML = `<div class="set-wrap">
            <div class="set-bar">
                <button class="set-close" onclick="SettingsScreen.close()" aria-label="Close"><i class="ti ti-chevron-left" style="font-size:24px"></i></button>
                <span class="set-title">Settings</span>
            </div>
            <div class="set-body">
                <div class="set-group">
                    ${row(ic('ti-info-circle'), 'How to play', '', 'SettingsScreen.help()')}
                    ${row(ic('ti-file-text'), 'Save game', '', 'SettingsScreen.saveGame()')}
                    ${row(ic('ti-home'), 'Back to start screen', '', 'SettingsScreen.toStart()')}
                </div>

                <div class="set-heading">Game</div>
                <div class="set-group">
                    ${row(ic('ti-trophy'), 'Achievements', soon, null, true)}
                    ${row(ic('ti-world'), 'Language', `<span class="set-val">English</span>` + soon, null, true)}
                </div>

                <div class="set-heading">Appearance &amp; sound</div>
                <div class="set-group">
                    ${row(SUN, 'Light mode', soon, null, true)}
                    ${row(MUSIC, 'Music', soon, null, true)}
                    ${row(VOL, 'Sound effects', soon, null, true)}
                </div>

                <div class="set-heading">About</div>
                <div class="set-group">
                    ${row(ic('ti-license'), 'Copyright', '', "SettingsScreen.legal('copyright')")}
                    ${row(ic('ti-lock'), 'Privacy policy', '', "SettingsScreen.legal('privacy')")}
                </div>
                <p class="set-ver">Football Agency Simulator · prototype build</p>
            </div>
        </div>`;
    },

    close() {
        if (this._from === 'start') { if (typeof StartScreen !== 'undefined') StartScreen.show(); return; }
        if (typeof Router !== 'undefined' && Router.refresh) Router.refresh();   // back to the screen we came from
    },
    toStart() {
        // the game autosaves continuously, so leaving to the menu is always safe
        if (typeof GameState !== 'undefined' && GameState.save) GameState.save();
        if (typeof StartScreen !== 'undefined') StartScreen.show();
    },
    help() { if (typeof Setup !== 'undefined' && Setup.openHelpOverlay) Setup.openHelpOverlay(); },

    // Name the current game. The multi-slot backend isn't in yet; for now this labels the running
    // autosave (the name rides along in the save) so the future Load screen has something to show.
    async saveGame() {
        const slots = (typeof GameState !== 'undefined' && GameState.listNamedSaves) ? await GameState.listNamedSaves() : [];
        const max = (typeof Storage !== 'undefined' && Storage.MAX_SLOTS) || 5;
        const cur = (typeof GameState !== 'undefined' && GameState.saveName) ? GameState.saveName : '';
        const chips = slots.length
            ? `<div class="set-chips">${slots.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).map(s => `<button class="set-chip" onclick="SettingsScreen._useName(this)">${UI.esc(s.name)}</button>`).join('')}</div>`
            : '';
        this._overlay('Save game', `
            <p class="set-note">Name this save. Tap an existing name to overwrite it. You can keep up to ${max} (${slots.length} used).</p>
            ${chips}
            <input id="setSaveName" class="text-input" type="text" maxlength="32" placeholder="e.g. Ajax Rebuild" value="${UI.esc(cur)}" style="margin-top:10px">
            <button class="btn btn--primary" style="width:100%;margin-top:12px" onclick="SettingsScreen._doSave()">Save</button>`);
        setTimeout(() => { const el = document.getElementById('setSaveName'); if (el) el.focus(); }, 30);
    },
    _useName(btn) { const el = document.getElementById('setSaveName'); if (el) el.value = btn.textContent; },
    async _doSave() {
        const el = document.getElementById('setSaveName');
        const name = (el && el.value.trim()) || '';
        const res = (typeof GameState !== 'undefined' && GameState.createNamedSave)
            ? await GameState.createNamedSave(name)
            : { ok: false, message: 'Saving is unavailable here.' };
        this._closeOverlay();
        this._overlay(res.ok ? 'Saved' : 'Save game', `<p class="set-note">${UI.esc(res.message || (res.ok ? 'Saved.' : 'Could not save.'))}</p>`);
    },
    legal(which) {
        const body = which === 'privacy'
            ? `<p class="set-note">This game runs entirely on your device. It does not collect, transmit, or share any personal data. Your save games live only in this app's local storage and never leave the device. There are no accounts, no analytics, and no third-party trackers.</p>`
            : `<p class="set-note">Football Agency Simulator — prototype. All game code and text © its author. Club, league, and competition names are placeholders and are not affiliated with, endorsed by, or licensed from any real organisation; they can be replaced with your own name packs via Customize (coming soon).</p>`;
        this._overlay(which === 'privacy' ? 'Privacy policy' : 'Copyright', body);
    },

    _overlay(title, bodyHTML) {
        this._closeOverlay();
        const ov = document.createElement('div');
        ov.id = 'setOverlay'; ov.className = 'set-overlay';
        ov.innerHTML = `<div class="set-ovcard"><div class="set-ovtitle">${UI.esc(title)}</div>${bodyHTML}
            <button class="btn btn--ghost" style="width:100%;margin-top:14px" onclick="SettingsScreen._closeOverlay()">Close</button></div>`;
        ov.addEventListener('click', e => { if (e.target === ov) SettingsScreen._closeOverlay(); });
        document.body.appendChild(ov);
    },
    _closeOverlay() { const ov = document.getElementById('setOverlay'); if (ov) ov.remove(); },

    _injectCSS() {
        if (document.getElementById('setCSS')) return;
        const css = `
        .set-wrap{position:fixed;inset:0;background:var(--bg);z-index:55;display:flex;flex-direction:column}
        .set-bar{display:flex;align-items:center;gap:6px;padding:calc(env(safe-area-inset-top,0) + 10px) 12px 10px;border-bottom:.5px solid var(--line-strong);background:var(--surface)}
        .set-close{background:none;border:none;color:var(--text);cursor:pointer;padding:4px;display:flex}
        .set-title{font-weight:var(--weight-semibold);font-size:var(--fs-lg)}
        .set-body{flex:1;overflow-y:auto;padding:14px 14px calc(env(safe-area-inset-bottom,0) + 24px)}
        .set-heading{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;margin:18px 4px 7px}
        .set-group{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
        .set-row{width:100%;display:flex;align-items:center;gap:12px;background:none;border:none;border-bottom:.5px solid var(--line-faint);color:var(--text);font:inherit;font-size:var(--fs-md);padding:14px 14px;cursor:pointer;text-align:left}
        .set-group .set-row:last-child{border-bottom:none}
        .set-row:active:not(:disabled){background:var(--surface-raised)}
        .set-row:disabled{cursor:default}
        .set-row--dim .set-row__label,.set-row--dim .set-row__ico{opacity:.6}
        .set-row__ico{font-size:20px;color:var(--text-secondary);width:22px;text-align:center}
        .set-row__svg{width:20px;height:20px}
        .set-row__label{flex:1}
        .set-val{color:var(--text-muted);font-size:var(--fs-sm);margin-right:8px}
        .set-soon{color:var(--accent-text,var(--accent));background:var(--accent-tint,rgba(52,211,153,.12));font-size:10px;font-weight:var(--weight-semibold);padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
        .set-ver{color:var(--text-faint);font-size:var(--fs-xs);text-align:center;margin-top:22px}
        .set-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:80;padding:22px}
        .set-ovcard{background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:20px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto}
        .set-ovtitle{font-weight:var(--weight-semibold);font-size:var(--fs-lg);color:var(--text-bright);margin-bottom:10px}
        .set-note{color:var(--text-muted);font-size:var(--fs-sm);line-height:1.55}
        .set-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
        .set-chip{background:var(--surface-raised);border:1px solid var(--line-strong);color:var(--text-secondary);border-radius:999px;padding:5px 12px;font:inherit;font-size:var(--fs-sm);cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .set-chip:active{background:var(--accent-tint,rgba(52,211,153,.12));color:var(--accent-text,var(--accent))}`;
        const el = document.createElement('style'); el.id = 'setCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
