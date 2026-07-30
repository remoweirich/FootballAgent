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
        const soon = `<span class="set-soon">${I18n.t('common.comingSoon')}</span>`;
        // some glyphs aren't in the trimmed icon font — use inline SVG for those (sun/music/volume)
        const ic = cls => `<i class="ti ${cls} set-row__ico"></i>`;
        const svg = d => `<svg class="set-row__ico set-row__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
        const SUN = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
        const MUSIC = svg('<circle cx="6.5" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/><path d="M9 18V6l11-2v12"/>');
        const VOL = svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>');
        const VOLX = svg('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M22 9l-6 6M16 9l6 6"/>');
        // Music / SFX rows: a mute toggle + a compact 0–100 volume slider, backed by Sound.
        const aRow = (ch, iconHTML, label) => {
            const v = (typeof Sound !== 'undefined') ? Sound.vol(ch) : ((Sound && Sound.DEFAULT[ch]) || 70);
            const m = (typeof Sound !== 'undefined') ? Sound.muted(ch) : false;
            return `<div class="set-row set-row--static">${iconHTML}<span class="set-row__label">${label}</span>
                <button class="set-iconbtn${m ? ' is-off' : ''}" onclick="SettingsScreen.toggleMute('${ch}')" aria-label="${I18n.t('settings.mute')}">${m ? VOLX : VOL}</button>
                <input class="set-range" type="range" min="0" max="100" value="${v}" ${m ? 'disabled' : ''} oninput="SettingsScreen.setVol('${ch}',this.value)"></div>`;
        };
        const row = (iconHTML, label, right, onclick, dim) =>
            `<button class="set-row${dim ? ' set-row--dim' : ''}" ${onclick ? `onclick="${onclick}"` : 'disabled'}>
                ${iconHTML}<span class="set-row__label">${label}</span>${right || ''}</button>`;
        // Theme picker (System / Dark / Light) — a static row holding a segmented control.
        const tMode = (typeof Theme !== 'undefined') ? Theme.get() : 'dark';
        const tModes = (typeof Theme !== 'undefined') ? Theme.MODES : ['system', 'dark', 'light'];
        const tKey = { system: 'settings.themeSystem', dark: 'settings.themeDark', light: 'settings.themeLight' };
        const themeRow = `<div class="set-row set-row--static">${SUN}<span class="set-row__label">${I18n.t('settings.theme')}</span>
            <div class="set-seg">${tModes.map(m => `<button class="set-seg__btn${tMode === m ? ' is-on' : ''}" onclick="SettingsScreen.setTheme('${m}')">${I18n.t(tKey[m])}</button>`).join('')}</div></div>`;
        // Language picker — one segment per registered locale
        const langs = (typeof I18n !== 'undefined') ? I18n.available() : [{ code: 'en', name: 'English' }];
        const curLang = (typeof I18n !== 'undefined') ? I18n.locale : 'en';
        const WORLD = `<i class="ti ti-world set-row__ico"></i>`;
        const langRow = `<div class="set-row set-row--static">${WORLD}<span class="set-row__label">${I18n.t('settings.language')}</span>
            <div class="set-seg">${langs.map(l => `<button class="set-seg__btn${curLang === l.code ? ' is-on' : ''}" onclick="SettingsScreen.setLang('${l.code}')">${l.name}</button>`).join('')}</div></div>`;
        // Per-track enable/disable list (only shown when bundled music exists)
        const tracks = (typeof Sound !== 'undefined') ? Sound.allTracks() : [];
        const trackGroup = tracks.length ? `<div class="set-heading">${I18n.t('settings.musicTracks')}</div>
            <div class="set-group">${tracks.map(tk => {
                const on = Sound.trackEnabled(tk.file);
                return `<button class="set-row" onclick="SettingsScreen.toggleTrack('${encodeURIComponent(tk.file)}')">
                    <i class="ti ti-music set-row__ico"></i><span class="set-row__label">${UI.esc(tk.name)}</span>
                    <span class="set-check${on ? ' is-on' : ''}"></span></button>`;
            }).join('')}</div>` : '';
        document.getElementById('app').innerHTML = `<div class="set-wrap">
            <div class="set-bar">
                <button class="set-close" onclick="SettingsScreen.close()" aria-label="Close"><i class="ti ti-chevron-left" style="font-size:24px"></i></button>
                <span class="set-title">${I18n.t('common.settings')}</span>
            </div>
            <div class="set-body">
                <div class="set-group">
                    ${row(ic('ti-info-circle'), I18n.t('common.howToPlay'), '', 'SettingsScreen.help()')}
                    ${row(ic('ti-file-text'), I18n.t('settings.saveGame'), '', 'SettingsScreen.saveGame()')}
                    ${row(ic('ti-home'), I18n.t('settings.backToStart'), '', 'SettingsScreen.toStart()')}
                </div>

                <div class="set-heading">${I18n.t('settings.groupGame')}</div>
                <div class="set-group">
                    ${row(ic('ti-trophy'), I18n.t('settings.achievements'), soon, null, true)}
                    ${langRow}
                </div>

                <div class="set-heading">${I18n.t('settings.groupAppearance')}</div>
                <div class="set-group">
                    ${themeRow}
                    ${aRow('music', MUSIC, I18n.t('settings.music'))}
                    ${aRow('sfx', VOL, I18n.t('settings.sfx'))}
                </div>

                ${trackGroup}

                <div class="set-heading">${I18n.t('settings.groupAbout')}</div>
                <div class="set-group">
                    ${row(ic('ti-license'), I18n.t('settings.copyright'), '', "SettingsScreen.legal('copyright')")}
                    ${row(ic('ti-lock'), I18n.t('settings.privacy'), '', "SettingsScreen.legal('privacy')")}
                </div>
                <p class="set-ver">${I18n.t('settings.version')}</p>
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
    // re-render in place, keeping the scroll position (toggles live deep in the list — a full
    // show() would otherwise snap the page back to the top on every tap)
    _reshow() {
        const body = document.querySelector('.set-body');
        const y = body ? body.scrollTop : 0;
        this.show(this._from);
        const nb = document.querySelector('.set-body');
        if (nb) nb.scrollTop = y;
    },
    setTheme(mode) { if (typeof Theme !== 'undefined') Theme.set(mode); this._reshow(); },
    setLang(code) { if (typeof I18n !== 'undefined') I18n.set(code); this._reshow(); },
    setVol(ch, v) { if (typeof Sound !== 'undefined') Sound.setVol(ch, v); },
    toggleMute(ch) { if (typeof Sound !== 'undefined') Sound.toggleMuted(ch); this._reshow(); },
    toggleTrack(fileEnc) {
        const file = decodeURIComponent(fileEnc);
        if (typeof Sound !== 'undefined') Sound.setTrackEnabled(file, !Sound.trackEnabled(file));
        this._reshow();
    },

    // Name the current game. The multi-slot backend isn't in yet; for now this labels the running
    // autosave (the name rides along in the save) so the future Load screen has something to show.
    async saveGame() {
        const slots = (typeof GameState !== 'undefined' && GameState.listNamedSaves) ? await GameState.listNamedSaves() : [];
        const max = (typeof Storage !== 'undefined' && Storage.MAX_SLOTS) || 5;
        const cur = (typeof GameState !== 'undefined' && GameState.saveName) ? GameState.saveName : '';
        const chips = slots.length
            ? `<div class="set-chips">${slots.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)).map(s => `<button class="set-chip" onclick="SettingsScreen._useName(this)">${UI.esc(s.name)}</button>`).join('')}</div>`
            : '';
        this._overlay(I18n.t('settings.saveGame'), `
            <p class="set-note">${I18n.t('settings.saveNote', { max, used: slots.length })}</p>
            ${chips}
            <input id="setSaveName" class="text-input" type="text" maxlength="32" placeholder="${I18n.t('start.savePlaceholder')}" value="${UI.esc(cur)}" style="margin-top:10px">
            <button class="btn btn--primary" style="width:100%;margin-top:12px" onclick="SettingsScreen._doSave()">${I18n.t('common.save')}</button>`);
        setTimeout(() => { const el = document.getElementById('setSaveName'); if (el) el.focus(); }, 30);
    },
    _useName(btn) { const el = document.getElementById('setSaveName'); if (el) el.value = btn.textContent; },
    async _doSave() {
        const el = document.getElementById('setSaveName');
        const name = (el && el.value.trim()) || '';
        const res = (typeof GameState !== 'undefined' && GameState.createNamedSave)
            ? await GameState.createNamedSave(name)
            : { ok: false, message: I18n.t('settings.saveUnavailable') };
        this._closeOverlay();
        this._overlay(res.ok ? I18n.t('settings.saved') : I18n.t('settings.saveGame'), `<p class="set-note">${UI.esc(res.message || (res.ok ? I18n.t('settings.saved') : I18n.t('settings.couldNotSave')))}</p>`);
    },
    legal(which) {
        const body = which === 'privacy'
            ? `<p class="set-note">${I18n.t('settings.privacyBody')}</p>`
            : `<p class="set-note">${I18n.t('settings.copyrightBody')}</p>`;
        this._overlay(which === 'privacy' ? I18n.t('settings.privacy') : I18n.t('settings.copyright'), body);
    },

    _overlay(title, bodyHTML) {
        this._closeOverlay();
        const ov = document.createElement('div');
        ov.id = 'setOverlay'; ov.className = 'set-overlay';
        ov.innerHTML = `<div class="set-ovcard"><div class="set-ovtitle">${UI.esc(title)}</div>${bodyHTML}
            <button class="btn btn--ghost" style="width:100%;margin-top:14px" onclick="SettingsScreen._closeOverlay()">${I18n.t('common.close')}</button></div>`;
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
        .set-row--static{cursor:default}
        .set-seg{display:flex;gap:2px;background:var(--surface-raised);border:1px solid var(--line-strong);border-radius:999px;padding:2px;flex:none}
        .set-seg__btn{background:none;border:none;color:var(--text-muted);font:inherit;font-size:var(--fs-xs);font-weight:var(--weight-semibold);padding:5px 10px;border-radius:999px;cursor:pointer;white-space:nowrap}
        .set-seg__btn.is-on{background:var(--accent);color:var(--accent-ink)}
        .set-iconbtn{background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:2px;display:flex;flex:none}
        .set-iconbtn.is-off{color:var(--text-dim)}
        .set-range{-webkit-appearance:none;appearance:none;width:116px;flex:none;height:5px;border-radius:5px;background:var(--track);accent-color:var(--accent);margin:0}
        .set-range:disabled{opacity:.45}
        .set-range::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--accent);cursor:pointer}
        .set-range::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--accent);border:0;cursor:pointer}
        .set-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--line-strong);flex:none;position:relative}
        .set-check.is-on{background:var(--accent);border-color:var(--accent)}
        .set-check.is-on::after{content:"";position:absolute;left:6px;top:2px;width:4px;height:9px;border:solid var(--accent-ink);border-width:0 2px 2px 0;transform:rotate(45deg)}
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
