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
    CREST: `<img src="assets/img/fa-logo.webp" alt="" style="height:140px;width:auto;display:block;margin:0 auto">`,
    GEAR: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
    WAND: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m15 4 5 5L8 21l-5 1 1-5Z"/><path d="m14 5 5 5"/><path d="M19 3v2M21 8h-2"/></svg>`,
    BAG: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,

    // ---- supporter plaques -------------------------------------------------------------------
    // Shown above the logo for anyone who has bought a supporter pack, cheapest tier first, one row
    // each. Buying the same pack again shows "4x" in front of it rather than repeating the plaque.
    //
    // Returns the markup AND the block's height, because the caller has to shrink .ss-brand's top
    // margin by exactly that much to keep the logo still (see the CSS note).
    PLAQUE_H: 43,       // rendered plaque height in px; width follows the 3.67:1 artwork
    PLAQUE_GAP: 6,
    _plaquesHTML() {
        const M = (typeof Monetization !== 'undefined') ? Monetization : null;
        const list = (M && M.supporterPlaques) ? M.supporterPlaques() : [];
        if (!list.length) return { n: 0, height: 0, html: '' };
        const rows = list.map(p => {
            // The count sits OUTSIDE the plaque image so it never covers the artwork, and is sized
            // from the plaque height so it matches the lettering printed on it.
            // always emitted, empty for a single purchase, so the gutter reserves the same width on
            // every row and the plaques stay aligned with one another
            const times = `<span class="ss-plaque__x">${p.count > 1 ? p.count + 'x' : ''}</span>`;
            return `<div class="ss-plaque">${times}<img class="ss-plaque__img" src="assets/img/plaques/${p.slug}.webp" alt="${UI.esc(p.name)}" loading="eager"></div>`;
        }).join('');
        const height = list.length * this.PLAQUE_H + (list.length - 1) * this.PLAQUE_GAP;
        return {
            n: list.length, height, pull: this._plaquesPull(height),
            html: `<div class="ss-plaques" aria-label="${I18n.t('start.supporterPlaques')}">${rows}</div>`,
        };
    },
    // How far to lift the plaque block so the logo stays where a non-supporter sees it.
    //
    // This is only the OPENING BID — lifting by the block's full height is what keeps the logo
    // still, and _fitPlaques() below trims it afterwards if the screen turns out to be too short.
    // Estimating the available room from viewport arithmetic was tried first and got it wrong: the
    // real geometry depends on the rendered height of the menu and footer, which is not knowable
    // before layout. So: bid high, then measure.
    _plaquesPull(blockHeight) { return blockHeight + 10; },

    // Called straight after render. If the lift pushed the plaques off the top of the screen, give
    // back exactly the overshoot — the logo moves down by that much instead, which is the graceful
    // end of the trade and only happens when the screen genuinely cannot hold both.
    _fitPlaques() {
        if (typeof document === 'undefined') return;
        const el = document.querySelector('.ss-plaques');
        const inner = el && el.parentElement;
        const wrap = inner && inner.parentElement;
        if (!el || !wrap || !el.getBoundingClientRect) return;
        // .ss-wrap's top padding is calc(env(safe-area-inset-top) + 20px) — exactly the line content
        // must not cross. Read it COMPUTED: that resolves to real pixels, where reading a custom
        // property holding env() would hand back the unresolved token. The first attempt at this
        // read a --sat variable nothing defined, so the floor was 0 and the top plaque sat behind
        // the status bar on a real phone.
        const pad = parseFloat(getComputedStyle(wrap).paddingTop) || 0;
        const floor = wrap.getBoundingClientRect().top + pad;
        const top = el.getBoundingClientRect().top;
        if (top >= floor) return;
        const cur = parseFloat(inner.style.getPropertyValue('--ss-plaquepull')) || 0;
        inner.style.setProperty('--ss-plaquepull', Math.max(0, Math.round(cur - (floor - top))) + 'px');
    },

    async show() {
        this._auto = (typeof GameState !== 'undefined' && GameState.autosaveMeta) ? await GameState.autosaveMeta() : null;
        this._hasSave = !!this._auto;
        this._injectCSS();
        const saveLabel = this._saveLabel();
        const plaques = this._plaquesHTML();
        document.getElementById('app').innerHTML = `<div class="ss-wrap" data-screen="start"><div class="ss-inner${plaques.n ? ' ss-inner--plaques' : ''}" style="${plaques.n ? `--ss-plaquepull:${plaques.pull}px` : ''}">
            ${plaques.html}
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
        this._fitPlaques();   // trim the plaque lift if this screen is too short for it
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
        this._overlay(I18n.t('start.loadGame'), `${rows}<p class="ss-note">${I18n.t('start.loadNote')}</p>
            <button class="ss-btn" style="margin-top:10px" onclick="StartScreen.importSave()">${I18n.t('start.importSave')}</button>
            <div id="ssImportMsg"></div>`);
    },

    // ---- import an exported .fam ----
    // Lands as a NEW slot; the running career is never touched. <input type="file"> works in this
    // WebView (Capacitor's bridge supplies onShowFileChooser) — the logo and names importers in
    // Customize already rely on it.
    importSave() {
        const inp = document.createElement('input');
        inp.type = 'file';
        // Deliberately unfiltered. Capacitor's BridgeWebChromeClient.getValidTypes() turns each
        // accept entry into a MIME type via MimeTypeMap and DROPS anything it cannot resolve, so
        // a ".fam" entry vanishes and the picker is left filtering on the others — against which
        // a save registers as application/octet-stream and cannot be selected at all.
        // Validation is by content (SaveFile.unpack), so nothing is lost by accepting everything.
        inp.accept = '*/*';
        inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0];
            if (f) this._readImport(f);
        });
        inp.click();
    },
    _importMsg(html, cls) {
        const el = document.getElementById('ssImportMsg');
        if (el) el.innerHTML = html ? `<div class="result ${cls || 'info'}" style="margin-top:10px">${html}</div>` : '';
    },
    _readImport(file) {
        this._importMsg(I18n.t('start.importReading'));
        const reader = new FileReader();
        reader.onerror = () => this._importMsg(I18n.t('start.importUnreadable'), 'bad');
        reader.onload = async () => {
            try {
                const res = await SaveFile.unpack(String(reader.result || ''));
                if (!res.ok) { this._importMsg(I18n.t('start.importErr.' + res.error) || I18n.t('start.importBad'), 'bad'); return; }
                this._pending = res;
                this._previewImport(res);
            } catch (e) { this._importMsg(I18n.t('start.importBad'), 'bad'); }
        };
        reader.readAsText(file);
    },
    // Say what is in the file BEFORE it is committed to a slot, including the worlds it brings.
    _previewImport(res) {
        const g = (res.env && res.env.game) || {};
        const needs = (res.env && res.env.needs) || [];
        const line = (k, v) => v ? `<div class="frow"><span class="frow__k">${k}</span><span class="frow__v">${UI.esc(String(v))}</span></div>` : '';
        this._overlay(I18n.t('start.importTitle'), `
            <div class="fcard" style="margin-bottom:10px">
                ${line(I18n.t('start.importAgency'), g.agency)}
                ${line(I18n.t('start.importManager'), g.manager)}
                ${line(I18n.t('start.importCountry'), g.country)}
                ${line(I18n.t('start.importSeason'), g.season)}
                ${line(I18n.t('common.weekN', { n: g.week || 0 }), I18n.t('start.importClients', { n: g.clients || 0 }))}
                ${line(I18n.t('start.importExported'), res.env.exported ? new Date(res.env.exported).toLocaleDateString() : '')}
                ${needs.length ? line(I18n.t('start.importWorlds'), needs.join(', ')) : ''}
            </div>
            ${res.modified ? `<p class="ss-note">${I18n.t('start.importModified')}</p>` : ''}
            <p class="ss-note">${I18n.t('start.importNote')}</p>
            <div class="ss-stack">
                <button class="ss-btn ss-btn--primary" onclick="StartScreen._doImport()">${I18n.t('start.importConfirm')}</button>
                <button class="ss-btn" onclick="StartScreen.load()">${I18n.t('common.cancel')}</button>
            </div>`);
    },
    async _doImport() {
        const res = this._pending;
        if (!res) { this.load(); return; }
        const r = await GameState.importSave(res);
        if (!r.ok) {
            const msg = r.error === 'worldconflict' ? I18n.t('start.importConflict', { countries: (r.countries || []).join(', ') })
                : r.error === 'dbsfull' ? I18n.t('start.importDbsFull', { max: r.max })
                    : r.error === 'slotsfull' ? I18n.t('start.importSlotsFull', { max: r.max })
                        : I18n.t('start.importBad');
            this._overlay(I18n.t('start.importTitle'), `<p class="ss-note">${msg}</p>
                <div class="ss-stack"><button class="ss-btn" onclick="StartScreen.load()">${I18n.t('common.close')}</button></div>`);
            return;
        }
        this._pending = null;
        this._overlay(I18n.t('start.importTitle'), `
            <p class="ss-note">${I18n.t('start.importDone', { name: UI.esc(r.name) })}</p>
            <div class="ss-stack">
                <button class="ss-btn ss-btn--primary" onclick="StartScreen.loadSlot('${r.id}')">${I18n.t('start.importLoadNow')}</button>
                <button class="ss-btn" onclick="StartScreen.load()">${I18n.t('common.close')}</button>
            </div>`);
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
    // Deleting a save cannot be undone and the ✕ sits right next to the row you tap to load, so
    // it asks first and names the save it would remove.
    async deleteSlot(id) {
        const slots = (typeof GameState !== 'undefined' && GameState.listNamedSaves) ? await GameState.listNamedSaves() : [];
        const s = slots.find(x => x.id === id) || {};
        const label = s.name || I18n.t('start.saveDefault');
        const sub = [s.agency, s.week ? I18n.t('common.weekN', { n: s.week }) : '', s.seasonLabel].filter(Boolean).join(' · ');
        this._overlay(I18n.t('common.deleteSave'), `
            <p class="ss-note">${I18n.t('start.confirmDelete', { name: UI.esc(label) })}</p>
            ${sub ? `<p class="ss-note">${UI.esc(sub)}</p>` : ''}
            <div class="ss-stack">
                <button class="ss-btn" onclick="StartScreen.load()">${I18n.t('common.cancel')}</button>
                <button class="ss-btn ss-btn--primary" onclick="StartScreen._doDeleteSlot('${id}')">${I18n.t('common.delete')}</button>
            </div>`);
    },
    async _doDeleteSlot(id) {
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
        .ss-wrap{position:fixed;inset:0;background:radial-gradient(120% 80% at 50% 0%, rgba(236,232,204,.10), transparent 60%),var(--bg);display:flex;align-items:center;justify-content:center;z-index:50;padding:calc(env(safe-area-inset-top,0) + 20px) 22px calc(env(safe-area-inset-bottom,0) + 20px);overflow-y:auto}
        .ss-inner{width:100%;max-width:400px;display:flex;flex-direction:column;min-height:min(560px,90vh)}
        .ss-brand{text-align:center;margin-top:8vh}
        /* Supporter plaques sit above the logo, in the top third. They are pulled UP out of the
           flow (pulling the brand up instead just makes them collide with the logo), so the logo
           stays exactly where a non-supporter sees it. How far they can be pulled depends on how
           much empty space is actually above the logo, which varies with screen height — so the
           pull is measured in JS (_plaquesPull) rather than guessed at here. When there is not
           enough room, the remainder pushes the logo down instead of the plaques off the screen. */
        .ss-plaques{display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:10px;
                    margin-top:calc(-1 * var(--ss-plaquepull, 0px))}
        /* The PLAQUE is what gets centred. The count is taken out of the flow and hung to its
           left, so a "3x" never shifts its own plaque off-centre or out of line with the others.
           (A fixed-width gutter inside the row was tried first: it kept the plaques aligned with
           each other but centred the [count + plaque] pair, leaving every plaque sitting right of
           centre — visible on a device, invisible in the arithmetic.) */
        .ss-plaque{position:relative;display:flex;align-items:center;justify-content:center;height:43px}
        .ss-plaque__img{height:100%;width:auto;display:block}
        /* white, and about as tall as the lettering printed on the plaque art (~46% of its height,
           which test_supporter_plaques pins as a ratio so a resize cannot leave it out of scale) */
        .ss-plaque__x{position:absolute;right:100%;margin-right:8px;top:50%;transform:translateY(-50%);
                      color:#fff;font-weight:var(--weight-bold);font-size:20px;line-height:1;
                      white-space:nowrap;letter-spacing:-.01em;text-shadow:0 1px 3px rgba(0,0,0,.45)}
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
        .ss-icon{background:none;border:none;color:var(--text-secondary);display:flex;flex-direction:column;align-items:center;gap:5px;font:inherit;font-size:var(--fs-xs);cursor:pointer;padding:8px 10px;border-radius:12px}
        .ss-icon:active{background:var(--surface)}
        .ss-q{width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:var(--fs-xl);font-weight:var(--weight-bold);border:1.7px solid currentColor;border-radius:50%}
        .ss-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:118;padding:22px}
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
