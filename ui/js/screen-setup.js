// ============================================================
//  First-run setup — picks a home country + names the agency,
//  then boots GameState.startNewGame(...) and the router.
//  Runs before any save exists, so it bypasses the Router shell.
// ============================================================
const Setup = {
    // Slide text is resolved at render time (I18n.t) so it follows the chosen language and never
    // freezes at file-load time (before I18n.init()). See _slideHTML.
    slides: [
        { icon: 'ti-briefcase', id: 'agent' },
        { icon: 'ti-zoom-scan', id: 'find' },
        { icon: 'ti-file-pencil', id: 'sign' },
        { icon: 'ti-currency-euro', id: 'gametime' },
        { icon: 'ti-building', id: 'clubs' },
        { icon: 'ti-heartbeat', id: 'happy' },
        { icon: 'ti-ticket', id: 'watch' },
        { icon: 'ti-arrows-transfer-up', id: 'grow' },
        { icon: 'ti-trophy', id: 'week' }
    ],
    idx: 0,

    // simple football-pentagon crest — the one expressive mark on this screen
    CREST: `<svg class="setup-crest" viewBox="0 0 28 28" aria-hidden="true" fill="none">
        <path d="M14 1.5 26 6.2v7.8c0 8-5.2 12.8-12 13.5-6.8-.7-12-5.5-12-13.5V6.2Z" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M14 8 19.7 12.15 17.53 18.85 10.47 18.85 8.3 12.15Z" fill="var(--accent)"/>
    </svg>`,

    show() {
        const countries = (typeof REGIONS_BY_COUNTRY !== 'undefined') ? Object.keys(REGIONS_BY_COUNTRY) : ['Netherlands'];
        const opts = countries.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('app').innerHTML = `<div class="setup-wrap">
            <button onclick="StartScreen.show()" aria-label="${I18n.t('setup.backToMenu')}" style="position:absolute;top:calc(env(safe-area-inset-top,0) + 12px);left:14px;background:none;border:none;color:var(--text-secondary);font:inherit;font-size:var(--fs-sm);cursor:pointer;display:flex;align-items:center;gap:2px;z-index:2"><i class="ti ti-chevron-left"></i>${I18n.t('setup.menu')}</button>
            <div class="setup-card">
            <div class="setup-brand">
                ${this.CREST}
                <div class="setup-brand__title">Football Agent Manager</div>
                <div class="setup-brand__tag">${I18n.t('start.tagline')}</div>
            </div>

            <label class="field-label"><i class="ti ti-briefcase"></i>${I18n.t('setup.agencyName')}</label>
            <input id="setupName" class="text-input" type="text" maxlength="32" placeholder="${I18n.t('setup.agencyPlaceholder')}" autocomplete="off" autocorrect="off" spellcheck="false">

            <label class="field-label"><i class="ti ti-user"></i>${I18n.t('setup.yourName')}</label>
            <input id="setupAgent" class="text-input" type="text" maxlength="32" placeholder="${I18n.t('setup.agentPlaceholder')}" autocomplete="off" autocorrect="off" spellcheck="false">

            <label class="field-label"><i class="ti ti-world"></i>${I18n.t('setup.homeCountry')}</label>
            <div class="select-wrap">
                <select id="setupCountry" class="select-input">${opts}</select>
                <i class="ti ti-chevron-down select-wrap__chevron"></i>
            </div>
            <p class="hint" style="margin-top:var(--space-3)">${I18n.t('setup.countryHint')}</p>

            <label class="field-label"><i class="ti ti-database"></i>${I18n.t('setup.database')}</label>
            <div class="select-wrap">
                <select id="setupDatabase" class="select-input"><option value="">${I18n.t('setup.dbStandard')}</option></select>
                <i class="ti ti-chevron-down select-wrap__chevron"></i>
            </div>
            <p class="hint" style="margin-top:var(--space-3)">${I18n.t('setup.dbHint')}</p>
        </div>
        <div class="setup-cta"><button class="btn btn--primary" id="setupStart" disabled><i class="ti ti-player-play"></i>${I18n.t('setup.start')}</button></div>
        </div>`;

        const nameEl = document.getElementById('setupName'), agentEl = document.getElementById('setupAgent'), startBtn = document.getElementById('setupStart');
        nameEl.value = agentEl.value = '';   // belt-and-braces: some browsers restore a field's last typed value
        // by id across page loads even without autocomplete data for this exact origin/field.
        startBtn.disabled = true;
        const refresh = () => { startBtn.disabled = !(nameEl.value.trim() && agentEl.value.trim()); };
        nameEl.addEventListener('input', refresh);
        agentEl.addEventListener('input', refresh);
        startBtn.addEventListener('click', () => this.start());
        this._loadDatabaseOptions();
        const dbSel = document.getElementById('setupDatabase');
        if (dbSel) dbSel.addEventListener('change', () => this._refreshCountryOptions(dbSel.value));
    },

    // When a database with created countries is selected, add its playable (regions-built) countries to
    // the home-country dropdown, so you can start your agency in a country you built.
    async _refreshCountryOptions(dbId) {
        const sel = document.getElementById('setupCountry'); if (!sel) return;
        const base = (typeof REGIONS_BY_COUNTRY !== 'undefined') ? Object.keys(REGIONS_BY_COUNTRY) : ['Netherlands'];
        let created = [];
        if (dbId && typeof Storage !== 'undefined' && Storage.getDatabase) {
            try {
                const db = await Storage.getDatabase(dbId);
                if (db && db.countries) created = Object.keys(db.countries).filter(c => {
                    const cc = db.countries[c];
                    return cc && cc.regions && cc.regions.length === 6 && cc.regions.every(r => (r.clubIds || []).length >= 2);
                });
            } catch (e) { created = []; }
        }
        const cur = sel.value, all = base.concat(created.filter(c => base.indexOf(c) < 0));
        sel.innerHTML = all.map(c => `<option value="${UI.esc(c)}">${UI.esc(c)}${created.indexOf(c) >= 0 ? ' ★' : ''}</option>`).join('');
        if (all.indexOf(cur) >= 0) sel.value = cur;
    },

    // Populate the Select Database dropdown from the player's saved customization databases (async —
    // IndexedDB). "Standard" (value "") is always first and is the default. See screen-customize.js.
    async _loadDatabaseOptions() {
        if (typeof Storage === 'undefined' || !Storage.listDatabases) return;
        let dbs = [];
        try { dbs = await Storage.listDatabases(); } catch (e) { dbs = []; }
        const sel = document.getElementById('setupDatabase');
        if (!sel || !dbs.length) return;
        sel.innerHTML = `<option value="">${I18n.t('setup.dbStandard')}</option>` +
            dbs.map(d => `<option value="${UI.esc(d.id)}">${UI.esc(d.name)}</option>`).join('');
    },

    // the how-to carousel markup, shared between first-run setup and the in-app help
    // sheet (opened from the '?' in the header) so both stay in sync off one slide list
    howtoHTML() {
        return `<div class="howto" id="howtoTrack">
                <div id="howtoSlide"></div>
                <div class="howto-nav">
                    <button class="howto-btn" id="htPrev" aria-label="${I18n.t('common.previous')}"><i class="ti ti-chevron-left"></i></button>
                    <div class="howto-dots" id="htDots"></div>
                    <button class="howto-btn" id="htNext" aria-label="${I18n.t('common.next')}"><i class="ti ti-chevron-right"></i></button>
                </div>
            </div>`;
    },
    wireHowto() {
        document.getElementById('htPrev').addEventListener('click', () => this.go(this.idx - 1));
        document.getElementById('htNext').addEventListener('click', () => this.go((this.idx + 1) % this.slides.length));
        this._wireSwipe();
    },

    // in-app help: same slides/carousel as first-run setup, reachable any time via the
    // '?' button in the header (see Router.helpButton()) — a returning player forgets
    // the mechanics faster than a new one reads them, and there was previously no way
    // back to this explanation once the first-run setup screen was dismissed
    openHelp() {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('common.howToPlay')}</div>${this.howtoHTML()}<button class="btn btn--ghost" style="width:100%;margin-top:var(--space-2)" onclick="Router.closeSheet()">${I18n.t('common.close')}</button>`);
        this.idx = 0;
        this._measureSlideHeight();
        this.renderSlide();
        this.wireHowto();
    },

    // Standalone version of the how-to for screens that live OUTSIDE the Router shell (Start, Settings),
    // where Router.sheet has no layer to render into: a self-contained overlay appended to <body>.
    openHelpOverlay(isIntro) {
        // the first-run intro marks itself seen the moment it appears, so it never auto-shows again
        if (isIntro && typeof Prefs !== 'undefined') Prefs.set('introSeen', true);
        let ov = document.getElementById('helpOverlay');
        if (ov) ov.remove();
        ov = document.createElement('div');
        ov.id = 'helpOverlay'; ov.className = 'help-overlay';
        ov.innerHTML = `<div class="help-overlay__card"><div class="help-overlay__title">${I18n.t('common.howToPlay')}</div>${this.howtoHTML()}<button class="btn btn--primary" style="width:100%;margin-top:12px" onclick="document.getElementById('helpOverlay').remove()">${isIntro ? I18n.t('setup.skipIntro') : I18n.t('common.close')}</button></div>`;
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
        if (!document.getElementById('helpOvCSS')) {
            const st = document.createElement('style'); st.id = 'helpOvCSS';
            st.textContent = `.help-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:90;padding:22px}
            .help-overlay__card{background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:20px;max-width:420px;width:100%;max-height:86vh;overflow-y:auto}
            .help-overlay__title{font-weight:var(--weight-semibold);font-size:var(--fs-lg);color:var(--text-bright);margin-bottom:10px;text-align:center}`;
            document.head.appendChild(st);
        }
        document.body.appendChild(ov);
        this.idx = 0;
        this._measureSlideHeight();
        this.renderSlide();
        this.wireHowto();
    },

    // every slide renders at a different natural height (title + body length vary), which made
    // the card jump size while paging; render each once off-DOM-visible to find the tallest and
    // pin #howtoSlide to that height so nothing shifts afterwards
    _measureSlideHeight() {
        const el = document.getElementById('howtoSlide');
        let max = 0;
        this.slides.forEach(s => {
            el.innerHTML = this._slideHTML(s);
            max = Math.max(max, el.offsetHeight);
        });
        el.style.minHeight = max + 'px';
    },
    _slideHTML(s) {
        return `<div class="howto-icon"><i class="ti ${s.icon}"></i></div><h3>${I18n.t('setup.' + s.id + '.title')}</h3><p>${I18n.t('setup.' + s.id + '.text')}</p>`;
    },

    go(i) {
        if (i < 0 || i >= this.slides.length) return;
        this.idx = i;
        this.renderSlide();
    },
    renderSlide() {
        const s = this.slides[this.idx];
        document.getElementById('howtoSlide').innerHTML = this._slideHTML(s);
        document.getElementById('htDots').innerHTML = this.slides.map((_, i) =>
            `<button class="ht-dot ${i === this.idx ? 'on' : ''}" data-i="${i}" aria-label="${I18n.t('setup.slideN', { n: i + 1 })}"></button>`).join('');
        document.getElementById('htDots').querySelectorAll('.ht-dot').forEach(d => d.addEventListener('click', () => this.go(+d.dataset.i)));
        document.getElementById('htPrev').disabled = this.idx === 0;
        document.getElementById('htNext').disabled = this.idx === this.slides.length - 1;
    },

    // swipe the how-to card left/right (pointer events cover touch + mouse in one API);
    // a horizontal-dominant drag past a small threshold pages the slide, no auto-advance
    _wireSwipe() {
        const track = document.getElementById('howtoTrack');
        let sx = 0, sy = 0, dragging = false;
        track.addEventListener('pointerdown', e => { dragging = true; sx = e.clientX; sy = e.clientY; });
        track.addEventListener('pointerup', e => {
            if (!dragging) return;
            dragging = false;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.go(this.idx + (dx < 0 ? 1 : -1));
        });
        track.addEventListener('pointercancel', () => { dragging = false; });
    },

    async start() {
        const name = document.getElementById('setupName').value.trim();
        const agent = document.getElementById('setupAgent').value.trim();
        if (!name || !agent) return;
        const country = document.getElementById('setupCountry').value;
        // resolve the chosen customization database (null = Standard) before booting the new game
        const dbSel = document.getElementById('setupDatabase');
        const dbId = dbSel ? dbSel.value : '';
        let database = null;
        if (dbId && typeof Storage !== 'undefined' && Storage.getDatabase) {
            try { database = await Storage.getDatabase(dbId); } catch (e) { database = null; }
        }
        GameState.startNewGame(country, name, agent, database);
        Main.afterLoad();
        // first time into a brand-new game: play the how-to full-screen (skippable). It stays reachable
        // afterwards from the Home screen and Settings. (Needs a real DOM — skipped in headless tests.)
        if (typeof document !== 'undefined' && typeof document.createElement === 'function' &&
            (typeof Prefs === 'undefined' || !Prefs.get('introSeen', false))) this.openHelpOverlay(true);
    }
};
