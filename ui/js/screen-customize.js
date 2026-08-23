// ============================================================
//  Customize — build a "database" (an id-keyed overlay on the
//  stock club world) that a new game can be started on. Edit
//  club names, colours, logos, reputations and starting
//  divisions per country, with a size/B-team validation gate.
//
//  Full-screen takeover outside the Router shell (like Start /
//  Setup); manages its own markup, overlays and CSS. The overlay
//  model + storage live in js/clubs.js (applyDatabase) and
//  js/storage.js (listDatabases/getDatabase/putDatabase). See
//  the plan in the Customize feature notes.
// ============================================================
const CustomizeScreen = {
    db: null,               // working database { id, name, createdAt, updatedAt, overrides:{ id:{name,colors,reputation,logo,division} } }
    country: null,          // country whose editor is open
    division: null,         // tier id currently shown in the editor
    _snapshot: null,        // overrides clone taken when a country editor opens (for Cancel)
    _lpFired: false,        // a long-press just fired — swallow the click that follows

    LOGO_MAX_PX: 128,
    LOGO_MAX_BYTES: 10 * 1024,

    // ---------- entry ----------
    async show() {
        this._injectCSS();
        // Guarantee a clean day-one base: a game played earlier this session may have left a different
        // overlay on Clubs.allClubs. We never mutate Clubs here (the editor previews via clubView), so
        // this keeps getClubById() returning stock values for the overlay to sit on top of.
        if (typeof Clubs !== 'undefined' && Clubs.init) Clubs.init();
        if (typeof League !== 'undefined') League._dayOneReserveCount = null;   // recompute caps against the clean base
        this.db = null; this.country = null; this.division = null;
        await this._chooser();
    },
    exit() { if (typeof StartScreen !== 'undefined') StartScreen.show(); },

    // ---------- database chooser ----------
    async _chooser() {
        let dbs = [];
        try { dbs = await Storage.listDatabases(); } catch (e) { dbs = []; }
        const rows = dbs.length ? dbs.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map(d =>
            `<div class="cx-item" data-act="loaddb" data-id="${UI.esc(d.id)}">
                <div class="cx-item__main"><span class="cx-item__name">${UI.esc(d.name)}</span>
                <span class="cx-item__sub">${I18n.t('customize.dbClubs', { n: (d.clubs || 0) })}${d.updatedAt ? ' · ' + this._when(d.updatedAt) : ''}</span></div>
                <button class="cx-del" data-act="deldb" data-id="${UI.esc(d.id)}" aria-label="${I18n.t('common.delete')}">✕</button>
            </div>`).join('') : `<p class="cx-empty">${I18n.t('customize.noDbs')}</p>`;
        const full = dbs.length >= (Storage.MAX_DBS || 3);
        const body = `
            <p class="cx-note">${I18n.t('customize.chooserNote', { max: (Storage.MAX_DBS || 3) })}</p>
            <button class="btn btn--primary cx-wide" data-act="newdb">${I18n.t('customize.createNew')}</button>
            <div class="cx-listhead">${I18n.t('customize.yourDbs')}</div>
            <div class="cx-list">${rows}</div>
            ${full ? `<p class="cx-note cx-note--warn">${I18n.t('customize.dbsFull', { max: (Storage.MAX_DBS || 3) })}</p>` : ''}`;
        this._screen(I18n.t('common.customize'), body, () => this.exit());
        this._delegate();
    },
    _newDb(overwriteId) {
        // if at the cap and not overwriting, force the player to pick one to replace
        Storage.listDatabases().then(dbs => {
            const atCap = dbs.length >= (Storage.MAX_DBS || 3);
            const overwriteRows = (atCap && !overwriteId)
                ? `<p class="cx-note">${I18n.t('customize.overwritePick')}</p>` +
                  dbs.map(d => `<button class="cx-btn cx-btn--pick" data-act="pickoverwrite" data-id="${UI.esc(d.id)}">${UI.esc(d.name)}</button>`).join('')
                : '';
            this._overlay(I18n.t('customize.createNew'), `
                ${overwriteRows}
                <label class="field-label">${I18n.t('customize.dbName')}</label>
                <input id="cxDbName" class="text-input" type="text" maxlength="28" placeholder="${I18n.t('customize.dbNamePlaceholder')}">
                <div id="cxDbErr"></div>
                <button class="btn btn--primary cx-wide" style="margin-top:12px" data-act="createconfirm"${overwriteId ? ` data-id="${UI.esc(overwriteId)}"` : ''}${(atCap && !overwriteId) ? ' disabled' : ''}>${I18n.t('customize.create')}</button>`);
            this._delegate(this._ov());
            setTimeout(() => { const el = document.getElementById('cxDbName'); if (el) el.focus(); }, 30);
        });
    },
    async _doCreate(name, overwriteId) {
        const nm = (name || '').trim();
        const err = document.getElementById('cxDbErr');
        if (!nm) { if (err) err.innerHTML = `<p class="cx-err">${I18n.t('customize.nameRequired')}</p>`; return; }
        const dbs = await Storage.listDatabases();
        if (!overwriteId && dbs.length >= (Storage.MAX_DBS || 3)) { if (err) err.innerHTML = `<p class="cx-err">${I18n.t('customize.dbsFull', { max: (Storage.MAX_DBS || 3) })}</p>`; return; }
        const id = overwriteId || ('db' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36));
        const now = Date.now();
        const created = overwriteId ? (dbs.find(d => d.id === overwriteId) || {}).createdAt || now : now;
        this.db = { id, name: nm, createdAt: created, updatedAt: now, overrides: {}, competitions: {}, countries: {} };
        await Storage.putDatabase(id, this.db, this._meta());
        this._closeOverlay();
        this.menu();
    },
    async _loadDb(id) {
        let d = null;
        try { d = await Storage.getDatabase(id); } catch (e) { d = null; }
        if (!d) { this._toast(I18n.t('customize.loadFailed')); return; }
        if (!d.overrides) d.overrides = {};
        if (!d.competitions) d.competitions = {};
        if (!d.countries) d.countries = {};
        this.db = d;
        this.menu();
    },
    async _deleteDb(id) {
        await Storage.deleteDatabase(id);
        this._chooser();
    },

    // ---------- entry menu (after a db is active) ----------
    menu() {
        this._live = false;   // leaving any mid-save logo-import flow behind
        const body = `
            <div class="cx-dbtag">${I18n.t('customize.editing', { name: UI.esc(this.db.name) })}</div>
            <button class="btn btn--primary cx-wide cx-menu" data-act="countries">
                <i class="ti ti-adjustments"></i><span>${I18n.t('customize.editCountries')}</span></button>
            <button class="btn btn--ghost cx-wide cx-menu" data-act="addcountry">
                <i class="ti ti-plus"></i><span>${I18n.t('customize.addCountry')}</span></button>
            <button class="btn btn--ghost cx-wide" style="margin-top:18px" data-act="savedb">${I18n.t('customize.saveDb', { name: UI.esc(this.db.name) })}</button>`;
        this._screen(this.db.name, body, () => this._chooser());
        this._delegate();
    },

    // ---------- country list ----------
    countryList() {
        const countries = (typeof LEAGUES_DATA !== 'undefined') ? Object.keys(LEAGUES_DATA) : [];
        const rows = countries.map(c => {
            const edits = this._countryEditCount(c);
            return `<div class="cx-item" data-act="opencountry" data-id="${UI.esc(c)}">
                <div class="cx-item__main"><span class="cx-item__name">${UI.esc(c)}</span>
                <span class="cx-item__sub">${I18n.t('customize.tiersN', { n: LEAGUES_DATA[c].tiers.length })}${edits ? ' · ' + I18n.t('customize.editsN', { n: edits }) : ''}</span></div>
                <span class="cx-item__go">›</span>
            </div>`;
        }).join('');
        const body = `
            <div class="cx-list">${rows}</div>
            <button class="btn btn--primary cx-wide" style="margin-top:16px" data-act="savedb">${I18n.t('customize.saveDb', { name: UI.esc(this.db.name) })}</button>`;
        this._screen(I18n.t('customize.editCountries'), body, () => this.menu());
        this._delegate();
    },

    // ---------- league editor ----------
    openCountry(country) {
        this.country = country;
        this.division = LEAGUES_DATA[country].tiers[0].id;
        this._snapshot = JSON.stringify(this.db.overrides);   // for Cancel
        this._renderEditor();
    },
    _renderEditor() {
        const created = this._created;
        const tiers = this._tiersOf(this.country);
        const opts = tiers.map(t => `<option value="${UI.esc(t.id)}"${t.id === this.division ? ' selected' : ''}>${UI.esc(this._compName(t.id))}</option>`).join('');
        const gate = !(typeof GameState !== 'undefined' && GameState.canEditGameState);
        const toolbar = `
            <div class="cx-toolbar">
                <div class="select-wrap cx-selwrap">
                    <select id="cxDivSel" class="select-input">${opts}</select>
                    <i class="ti ti-chevron-down select-wrap__chevron"></i>
                </div>
            </div>
            <div class="cx-tools">
                <button class="cx-toolbtn" data-act="compnames"><i class="ti ti-pencil"></i>${I18n.t('customize.competitionNames')}</button>
                <button class="cx-toolbtn" data-act="impnames"><i class="ti ti-file-text"></i>${I18n.t('customize.importNames')}</button>
                <button class="cx-toolbtn" data-act="implogos"><i class="ti ti-photo"></i>${I18n.t('customize.importLogos')}</button>
                <button class="cx-toolbtn" data-act="exporttpl"><i class="ti ti-download"></i>${I18n.t('customize.exportTemplate')}</button>
            </div>`;
        const rows = this._divisionRows(this.division, gate);
        const body = `
            ${toolbar}
            <div id="cxBanner">${this._sizeBanner()}</div>
            <div class="cx-tablewrap"><div class="cx-table" id="cxTable">${rows}</div></div>
            <div class="cx-editfoot">
                <button class="btn btn--ghost" data-act="${created ? 'cancelcreated' : 'cancelcountry'}">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="${created ? 'savecreated' : 'savecountry'}">${I18n.t('customize.saveCountry', { name: UI.esc(this.country) })}</button>
            </div>`;
        this._screen(this.country, body, () => created ? this._confirmLeaveCreated() : this._confirmLeaveCountry());
        const sel = document.getElementById('cxDivSel');
        if (sel) sel.addEventListener('change', () => { this.division = sel.value; this._refreshTable(); });
        this._delegate();
        this._wireRows();
        this._explain(created ? 'buildLeague' : 'editFeatured', I18n.t(created ? 'customize.explainBuild' : 'customize.explainFeatured'));
    },
    // current display name of a competition (created division/cup, or a featured league/cup override)
    _compName(divId) {
        if (this._created) {
            const i = this._created.divIds.indexOf(divId);
            if (i >= 0) return this._created.divNames[i];
            const cu = this._created.cups;
            if (cu && cu.higher.id === divId) return cu.higher.name;
            if (cu && cu.lower.id === divId) return cu.lower.name;
        }
        const ov = this.db.competitions && this.db.competitions[divId];
        if (ov && ov.name) return ov.name;
        return (typeof COMPETITIONS !== 'undefined' && COMPETITIONS[divId] && COMPETITIONS[divId].name) || (Clubs.DIV_NAMES && Clubs.DIV_NAMES[divId]) || divId;
    },
    _refreshTable() {
        const gate = !(typeof GameState !== 'undefined' && GameState.canEditGameState);
        const t = document.getElementById('cxTable');
        if (t) { t.innerHTML = this._divisionRows(this.division, gate); this._wireRows(); }
        const b = document.getElementById('cxBanner');
        if (b) b.innerHTML = this._sizeBanner();   // moving a club can put another division off-size — list them all
    },
    // warns about EVERY off-size division in the country (a swap makes both the source + destination wrong)
    _sizeBanner() {
        const bad = this._tiersOf(this.country).map(t => {
            const n = this._membersOf(this.country, t.id).length;
            const exp = this._created ? this._createdDivSize(t.id) : Clubs.staticDivSize(t.id);
            return (exp != null && n !== exp) ? UI.esc(this._compName(t.id)) + ': ' + n + '/' + exp : null;
        }).filter(Boolean);
        return bad.length ? `<div class="cx-sizebanner"><b>${I18n.t('customize.sizesOff')}</b> ${bad.join(' · ')}</div>` : '';
    },
    _divisionRows(divId, gate) {
        const created = this._created;
        const list = this._membersOf(this.country, divId)
            .map(id => this.clubView(id))
            .sort((a, b) => (b.reputation - a.reputation) || a.name.localeCompare(b.name));
        const expected = created ? this._createdDivSize(divId) : Clubs.staticDivSize(divId);
        const sizeClass = (expected != null && list.length !== expected) ? ' cx-count--bad' : '';
        const editor = (typeof GameState !== 'undefined' && GameState.canEditGameState);
        const repCap = created ? WorldExt.repCapFor(created, divId) : null;
        const capNote = (created && repCap != null && !editor) ? ' · ' + I18n.t('customize.repCapNote', { cap: repCap }) : '';
        const head = `<div class="cx-count${sizeClass}">${I18n.t('customize.sizeLabel', { n: list.length, exp: (expected != null ? expected : '?') })}${capNote}</div>`;
        const divIdx = created ? created.divIds.indexOf(divId) : -1;
        const canReserve = created && divIdx >= 1;   // D2-D4 may hold B-teams
        const rows = list.map(v => {
            const featuredLock = (!created && gate) ? ' cx-locked' : '';
            const bBtn = canReserve ? `<button class="cx-bbtn${v.reserve ? ' cx-bbtn--on' : ''}" data-act="ccreserve" data-cid="${UI.esc(v.id)}" title="${I18n.t('customize.bTeam')}">B</button>` : '';
            return `<div class="cx-row" data-cid="${UI.esc(v.id)}">
                <button class="cx-logo" data-act="logo" data-cid="${UI.esc(v.id)}" title="${I18n.t('customize.editLogo')}">${UI.crest(v)}</button>
                <div class="cx-namewrap">
                    <button class="cx-name" data-act="name" data-cid="${UI.esc(v.id)}">${UI.esc(v.name)}${(!created && v.isReserve) ? ` <span class="cx-btag">B</span>` : ''}</button>
                    <span class="cx-id">${UI.esc(v.id)}</span>
                </div>
                ${bBtn}
                <button class="cx-swatch" data-act="colp" data-cid="${UI.esc(v.id)}" style="background:${v.colors.primary}" title="${I18n.t('customize.primary')}"></button>
                <button class="cx-swatch" data-act="cols" data-cid="${UI.esc(v.id)}" style="background:${v.colors.secondary}" title="${I18n.t('customize.secondary')}"></button>
                <button class="cx-rep${featuredLock}" data-act="rep" data-cid="${UI.esc(v.id)}">${v.reputation}${(!created && gate) ? ' <i class="ti ti-lock"></i>' : ''}</button>
            </div>`;
        }).join('');
        return head + rows;
    },
    _createdDivSize(divId) { const i = this._created.divIds.indexOf(divId); const spec = (typeof WorldExt !== 'undefined') ? WorldExt.divSpec() : []; return (i >= 0 && spec[i]) ? spec[i].size : null; },

    // ---------- cell editors ----------
    editName(id) {
        const v = this.clubView(id); if (!v) return;
        this._overlay(I18n.t('customize.rename'), `
            <input id="cxIn" class="text-input" type="text" maxlength="40" value="${UI.esc(v.name)}">
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="namesave" data-cid="${UI.esc(id)}">${I18n.t('common.save')}</button>
            </div>`);
        this._delegate(this._ov());
        setTimeout(() => { const el = document.getElementById('cxIn'); if (el) { el.focus(); el.select(); } }, 30);
    },
    _saveName(id) {
        const el = document.getElementById('cxIn'); const nm = (el && el.value.trim()) || '';
        if (!nm) return;
        this._setOverride(id, { name: nm });
        this._closeOverlay(); this._refreshTable();
    },
    // common kit colours, so most picks never need the OS colour dialog
    PALETTE: ['#E30613', '#C8102E', '#8B1A1A', '#FF6600', '#FFDD00', '#1E7D32', '#006633', '#00A86B', '#0066CC', '#0A2A66', '#33B5E5', '#6A0DAD', '#000000', '#FFFFFF', '#8A8F98', '#5A626D'],
    editColor(id, which) {
        const v = this.clubView(id); if (!v) return;
        const cur = this._hex(which === 'primary' ? v.colors.primary : v.colors.secondary) || '#5A626D';
        const swatches = this.PALETTE.map(c => `<button class="cx-pal" data-act="palpick" data-which="${c}" style="background:${c}"${c.toUpperCase() === cur.toUpperCase() ? ' data-sel="1"' : ''}></button>`).join('');
        this._overlay(which === 'primary' ? I18n.t('customize.primary') : I18n.t('customize.secondary'), `
            <div class="cx-palgrid">${swatches}</div>
            <div class="cx-colrow" style="margin-top:12px">
                <span class="cx-prev" id="cxPrev" style="background:${cur}"></span>
                <input id="cxHex" class="text-input cx-hexin" type="text" maxlength="7" value="${cur}">
                <label class="cx-customcol" title="${I18n.t('customize.customColour')}">🎨<input id="cxCol" type="color" value="${cur}"></label>
            </div>
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="colsave" data-cid="${UI.esc(id)}" data-which="${which}">${I18n.t('common.save')}</button>
            </div>`);
        this._delegate(this._ov());
        const wheel = document.getElementById('cxCol'), hex = document.getElementById('cxHex');
        if (wheel) wheel.addEventListener('input', () => this._palPick(wheel.value));
        if (hex) hex.addEventListener('input', () => { const h = this._hex(hex.value); if (h) { const w = document.getElementById('cxCol'), p = document.getElementById('cxPrev'); if (w) w.value = h; if (p) p.style.background = h; } });
    },
    _palPick(color) {
        const h = this._hex(color); if (!h) return;
        const hex = document.getElementById('cxHex'), wheel = document.getElementById('cxCol'), prev = document.getElementById('cxPrev');
        if (hex) hex.value = h; if (wheel) wheel.value = h; if (prev) prev.style.background = h;
    },
    _saveColor(id, which) {
        const hex = document.getElementById('cxHex');
        const h = this._hex(hex && hex.value);
        if (!h) { const el = document.getElementById('cxHex'); if (el) el.classList.add('cx-input--bad'); return; }
        const v = this.clubView(id);
        const colors = { primary: v.colors.primary, secondary: v.colors.secondary };
        colors[which] = h.toUpperCase();
        this._setOverride(id, { colors });
        this._closeOverlay(); this._refreshTable();
    },
    editRep(id) {
        const editor = (typeof GameState !== 'undefined' && GameState.canEditGameState);
        // featured countries: reputation editing is gated. created countries: always editable, but
        // capped by the division limit unless the Gamestate editor is owned.
        if (!this._created && !editor) { this._toast(I18n.t('customize.gatedRep')); return; }
        const v = this.clubView(id); if (!v) return;
        const cap = this._repMaxFor(v);
        const note = (this._created && !editor) ? I18n.t('customize.repCapNote', { cap }) : I18n.t('customize.repNote');
        this._overlay(I18n.t('customize.reputation'), `
            <p class="cx-note">${note}</p>
            <input id="cxRep" class="text-input" type="number" min="1" max="${cap}" value="${v.reputation}">
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="repsave" data-cid="${UI.esc(id)}">${I18n.t('common.save')}</button>
            </div>`);
        this._delegate(this._ov());
        setTimeout(() => { const el = document.getElementById('cxRep'); if (el) { el.focus(); el.select(); } }, 30);
    },
    _repMaxFor(v) {
        const editor = (typeof GameState !== 'undefined' && GameState.canEditGameState);
        if (this._created && !editor) return WorldExt.repCapFor(this._created, v.division);
        return 99;
    },
    _saveRep(id) {
        const el = document.getElementById('cxRep');
        let r = Math.round(Number(el && el.value));
        if (!isFinite(r)) return;
        r = Math.max(1, Math.min(this._repMaxFor(this.clubView(id)), r));
        this._setOverride(id, { reputation: r });
        this._closeOverlay(); this._refreshTable();
    },
    // ----- created-country B-team toggle + parent link -----
    toggleReserve(id) {
        const cc = this._created; if (!cc) return;
        const c = cc.clubs.find(x => x.id === id); if (!c) return;
        if (c.reserve) { c.reserve = false; c.parentId = null; this._refreshTable(); return; }
        const cap = WorldExt.reserveCapFor(cc, c.division);
        const cur = cc.clubs.filter(x => x.division === c.division && x.reserve).length;
        if (cur >= cap) { this._toast(I18n.t('customize.reserveCapHit', { cap })); return; }
        const parents = cc.clubs.filter(x => (x.division === cc.divIds[0] || x.division === cc.divIds[1]) && !x.reserve);
        const opts = parents.map(p => `<option value="${UI.esc(p.id)}">${UI.esc(p.name)}</option>`).join('');
        this._overlay(I18n.t('customize.bTeam'), `
            <p class="cx-note">${I18n.t('customize.pickParentNote')}</p>
            <div class="select-wrap"><select id="cxParent" class="select-input">${opts}</select><i class="ti ti-chevron-down select-wrap__chevron"></i></div>
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="parentsave" data-cid="${UI.esc(id)}">${I18n.t('common.save')}</button>
            </div>`);
        this._delegate(this._ov());
    },
    _saveParent(id) {
        const cc = this._created; const c = cc && cc.clubs.find(x => x.id === id); if (!c) return;
        const pid = (document.getElementById('cxParent') || {}).value; if (!pid) return;
        c.reserve = true; c.parentId = pid;
        this._closeOverlay(); this._refreshTable();
    },
    editDivision(id) {
        if (!(typeof GameState !== 'undefined' && GameState.canEditGameState)) { this._toast(I18n.t('customize.gatedDiv')); return; }
        const v = this.clubView(id); if (!v) return;
        const tiers = this._tiersOf(this.country);
        const opts = tiers.map(t => `<option value="${UI.esc(t.id)}"${t.id === v.division ? ' selected' : ''}>${UI.esc(t.name)}</option>`).join('');
        this._overlay(I18n.t('customize.moveDivision', { club: UI.esc(v.name) }), `
            <p class="cx-note">${I18n.t('customize.moveNote')}</p>
            <div class="select-wrap"><select id="cxDivMove" class="select-input">${opts}</select><i class="ti ti-chevron-down select-wrap__chevron"></i></div>
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="divsave" data-cid="${UI.esc(id)}">${I18n.t('common.save')}</button>
            </div>`);
        this._delegate(this._ov());
    },
    _saveDivision(id) {
        const el = document.getElementById('cxDivMove');
        const div = el && el.value; if (!div) return;
        this._setOverride(id, { division: div });
        this._closeOverlay(); this._refreshTable();
    },
    triggerLogo(id) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (f) this._handleLogoFile(id, f); });
        inp.click();
    },
    _handleLogoFile(id, file) {
        // any image works — it's auto-fitted onto a square canvas below, so no square/size rules to fail
        this._normalizeLogo(file).then(uri => {
            if (!uri) { this._toast(I18n.t('customize.logoInvalid')); return; }
            this._setOverride(id, { logo: uri });
            this._refreshTable();
        });
    },
    // Draw any image (any size/shape/format) centred onto a transparent LOGO_MAX_PX square and re-encode
    // as a small PNG. This is what makes import forgiving — the old path rejected anything not already
    // ≤128px, perfectly square, and <10 KB, which is almost every real logo.
    _normalizeLogo(file) {
        return new Promise(resolve => {
            // accept a File (has a name) or a raw Blob unpacked from a zip (typed image/*, no name)
            if (!/image|png|jpe?g|webp|gif|bmp|svg/i.test(file.type || '') && !/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name || '')) { resolve(null); return; }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const S = this.LOGO_MAX_PX;
                        const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
                        const ctx = cv.getContext('2d');
                        const scale = Math.min(S / img.width, S / img.height) || 1;
                        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
                        ctx.clearRect(0, 0, S, S);
                        ctx.drawImage(img, Math.round((S - w) / 2), Math.round((S - h) / 2), w, h);
                        resolve(cv.toDataURL('image/png'));
                    } catch (e) { resolve(null); }
                };
                img.onerror = () => resolve(null);
                img.src = reader.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    },
    // Resolve a filename (minus extension) to a club id in the CURRENT country. Tolerant: exact id,
    // case-insensitive id, then a normalised match against the club's id / stock name / renamed name.
    _clubIdForFilename(base) {
        const norm = s => (s || '').toString().toLowerCase().replace(/[\s._'\-]+/g, '');
        const target = norm(base);
        if (!target) return null;
        // seniors only — a B-team is never a match target; it inherits its parent's logo
        const pool = (this._created ? (this._created.clubs || []) : Clubs.getClubsByCountry(this.country))
            .filter(c => this._created ? !c.reserve : !isReserveClub(c.id));
        let hit = pool.find(c => c.id === base) || pool.find(c => c.id.toLowerCase() === base.toLowerCase());
        if (hit) return hit.id;
        for (const c of pool) {
            const ov = (!this._created && this.db && this.db.overrides[c.id]) || {};
            const names = [c.id, c.name, ov.name].filter(Boolean).map(norm);
            if (names.indexOf(target) >= 0) return c.id;
        }
        return null;
    },

    // ---------- validation + save ----------
    _validateCountry(country) {
        const errors = [];
        this._tiersOf(country).forEach(t => {
            const ids = this._membersOf(country, t.id);
            const expected = Clubs.staticDivSize(t.id);
            if (expected != null && ids.length !== expected) errors.push(I18n.t('customize.errSize', { div: t.name, exp: expected, act: ids.length }));
            const cap = (typeof League !== 'undefined' && League.reserveCapFor) ? League.reserveCapFor(t.id) : Infinity;
            if (cap !== Infinity) {
                const res = ids.filter(id => isReserveClub(id)).length;
                if (res > cap) errors.push(I18n.t('customize.errCap', { div: t.name, cap, act: res }));
            }
        });
        return errors;
    },
    saveCountry() {
        const errors = this._validateCountry(this.country);
        if (errors.length) {
            this._overlay(I18n.t('customize.cantSaveCountry'), `
                <p class="cx-note cx-note--warn">${I18n.t('customize.fixFirst')}</p>
                <ul class="cx-errlist">${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                <button class="btn btn--primary cx-wide" style="margin-top:10px" data-act="ovcancel">${I18n.t('common.ok')}</button>`);
            this._delegate(this._ov());
            return;
        }
        this._snapshot = null;   // committed
        this.countryList();
    },
    _confirmLeaveCountry() {
        // Cancel/back from the editor: nothing to lose if no edits since the snapshot; otherwise confirm.
        if (this._snapshot == null || this._snapshot === JSON.stringify(this.db.overrides)) { this.countryList(); return; }
        this._overlay(I18n.t('customize.discardTitle'), `
            <p class="cx-note">${I18n.t('customize.discardNote')}</p>
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="cancelcountry">${I18n.t('customize.discard')}</button>
            </div>`);
        this._delegate(this._ov());
    },
    cancelCountry() {
        if (this._snapshot != null) { try { this.db.overrides = JSON.parse(this._snapshot); } catch (e) { /* keep as-is */ } }
        this._snapshot = null;
        this._closeOverlay();
        this.countryList();
    },
    async saveDatabase() {
        this.db.updatedAt = Date.now();
        const ok = await Storage.putDatabase(this.db.id, this.db, this._meta());
        this._toast(ok ? I18n.t('customize.dbSaved', { name: this.db.name }) : I18n.t('customize.saveFailed'));
    },

    // ---------- bulk import / export (matched by stable club id) ----------
    exportTemplate() {
        // full manifest of id,current-name for every club — the player edits this and re-imports.
        const lines = ['id,name'];
        (Clubs.allClubs || []).forEach(c => { const v = this.clubView(c.id); lines.push(`${this._csv(c.id)},${this._csv(v.name)}`); });
        this._download(`${this._slug(this.db.name)}-names.csv`, lines.join('\n'), 'text/csv');
    },
    importNames() {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.csv,text/csv,text/plain,application/json';
        inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (f) this._readNames(f); });
        inp.click();
    },
    // Parse a names file — JSON ({id:name} or [{id,name}]) or CSV (id,name) — into an {id:name} map.
    _parseNamesText(text) {
        const map = {};
        if (/^\s*[\{\[]/.test(text)) {
            const j = JSON.parse(text);
            (Array.isArray(j) ? j : Object.entries(j).map(([id, name]) => ({ id, name }))).forEach(r => { if (r && r.id) map[r.id] = r.name; });
        } else {
            text.split(/\r?\n/).forEach((ln, i) => {
                if (!ln.trim() || (i === 0 && /^id\s*,\s*name$/i.test(ln.trim()))) return;
                const idx = ln.indexOf(','); if (idx < 0) return;
                const id = ln.slice(0, idx).trim().replace(/^"|"$/g, '');
                const nm = ln.slice(idx + 1).trim().replace(/^"|"$/g, '').replace(/""/g, '"');
                if (id) map[id] = nm;
            });
        }
        return map;
    },
    _readNames(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let map;
            try { map = this._parseNamesText(String(reader.result || '')); } catch (e) { this._toast(I18n.t('customize.importBad')); return; }
            let n = 0;
            Object.entries(map).forEach(([id, nm]) => {
                if (!nm) return;
                const name = String(nm).slice(0, 40);
                if (Clubs.getClubById(id)) { this._setOverride(id, { name }); n++; }
                else if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS[id]) { if (!this.db.competitions) this.db.competitions = {}; this.db.competitions[id] = { name }; n++; }
            });
            this._snapshot = JSON.stringify(this.db.overrides);   // fold imports into the cancel baseline
            this._refreshTable();
            this._toast(I18n.t('customize.namesImported', { n }));
        };
        reader.onerror = () => this._toast(I18n.t('customize.importBad'));
        reader.readAsText(file);
    },
    importLogos() {
        // Pick many images at once, OR a single .zip of a logos folder (a zip keeps the real filenames,
        // so matching pre-fills reliably even on Android). Name each file after its club (Basel.png).
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*,.zip,application/zip'; inp.multiple = true;
        inp.addEventListener('change', () => { const fs = inp.files ? Array.from(inp.files) : []; if (fs.length) this._readLogos(fs); });
        inp.click();
    },
    async _readLogos(files) {
        // Expand any zips into their image entries, keep plain images as-is, then normalise everything and
        // hand off to the visual ASSIGN sheet. The filename is only a pre-fill hint (a zip preserves them;
        // an Android multi-select often doesn't), so nothing depends on it.
        const items = [];
        for (const f of files) {
            if (/\.zip$/i.test(f.name || '') || /zip/i.test(f.type || '')) {
                try { (await this._expandZip(f)).forEach(e => items.push(e)); } catch (e) { /* skip a bad zip */ }
            } else {
                items.push({ name: f.name || '', blob: f });
            }
        }
        const pending = [];
        for (const it of items) {
            const uri = await this._normalizeLogo(it.blob);
            if (!uri) continue;   // unreadable image, skip it
            const base = (it.name || '').replace(/\.[^.]+$/, '');
            pending.push({ name: it.name || '', uri, guess: this._clubIdForFilename(base) });
        }
        if (!pending.length) { this._toast(I18n.t('customize.logoNoneRead')); return; }
        this._pendingLogos = pending;
        this._logoAssignSheet();
    },
    // Minimal, dependency-free ZIP reader: walk the central directory, then inflate each image entry with
    // the browser's DecompressionStream (deflate-raw). Returns [{name, blob}] of the image files inside.
    async _expandZip(file) {
        const buf = new Uint8Array(await file.arrayBuffer());
        const dv = new DataView(buf.buffer);
        // locate the End Of Central Directory record (scan back over its max-size trailing comment)
        let eocd = -1;
        for (let i = buf.length - 22, min = Math.max(0, buf.length - 22 - 65536); i >= min; i--) {
            if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) return [];
        const count = dv.getUint16(eocd + 10, true);
        let off = dv.getUint32(eocd + 16, true);
        const dec = new TextDecoder();
        const out = [];
        for (let n = 0; n < count && off + 46 <= buf.length; n++) {
            if (dv.getUint32(off, true) !== 0x02014b50) break;   // central-directory file header
            const method = dv.getUint16(off + 10, true);
            const compSize = dv.getUint32(off + 20, true);
            const nameLen = dv.getUint16(off + 28, true);
            const extraLen = dv.getUint16(off + 30, true);
            const commentLen = dv.getUint16(off + 32, true);
            const localOff = dv.getUint32(off + 42, true);
            const fullName = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));
            off += 46 + nameLen + extraLen + commentLen;
            if (/\/$/.test(fullName)) continue;                          // directory entry
            const base = fullName.split('/').pop();
            if (/^__MACOSX/.test(fullName) || /^\./.test(base)) continue; // skip mac resource forks / dotfiles
            if (!/\.(png|jpe?g|webp|gif|bmp)$/i.test(base)) continue;     // images only
            if (dv.getUint32(localOff, true) !== 0x04034b50) continue;    // local file header
            const lNameLen = dv.getUint16(localOff + 26, true);
            const lExtraLen = dv.getUint16(localOff + 28, true);
            const dataStart = localOff + 30 + lNameLen + lExtraLen;
            const comp = buf.subarray(dataStart, dataStart + compSize);
            let bytes = null;
            if (method === 0) bytes = comp;                              // stored
            else if (method === 8) bytes = await this._inflateRaw(comp); // deflate
            if (bytes) out.push({ name: base, blob: new Blob([bytes], { type: 'image/png' }) });
        }
        return out;
    },
    _inflateRaw(bytes) {
        try {
            if (typeof DecompressionStream === 'undefined') return Promise.resolve(null);
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            return new Response(stream).arrayBuffer().then(ab => new Uint8Array(ab)).catch(() => null);
        } catch (e) { return Promise.resolve(null); }
    },
    // Assignable clubs for a logo: senior clubs only. B-teams are excluded on purpose — they
    // automatically inherit their parent's logo (see _propagateReserveLogo / applyDatabase).
    _logoClubList() {
        const src = this._created ? (this._created.clubs || []) : Clubs.getClubsByCountry(this.country);
        return src.filter(c => this._created ? !c.reserve : !isReserveClub(c.id))
            .map(c => { const v = this.clubView(c.id); return { id: c.id, name: v ? v.name : c.name }; })
            .sort((a, b) => a.name.localeCompare(b.name));
    },
    _logoAssignSheet() {
        const pend = this._pendingLogos || [];
        pend.forEach(p => { if (p.chosen === undefined) p.chosen = p.guess || ''; });
        this._overlay(I18n.t('customize.assignLogos'), this._assignBodyHTML());
        this._delegate(this._ov());
        this._wireAssignSelects();
    },
    // Rebuilt on every dropdown change so a club chosen in one row disappears from the others.
    _assignBodyHTML() {
        const pend = this._pendingLogos || [];
        const clubs = this._logoClubList();
        const rows = pend.map((p, i) => {
            const takenElsewhere = new Set(pend.filter((_, j) => j !== i).map(q => q.chosen).filter(Boolean));
            const opts = `<option value="">${I18n.t('customize.assignSkip')}</option>` +
                clubs.filter(c => c.id === p.chosen || !takenElsewhere.has(c.id))
                    .map(c => `<option value="${UI.esc(c.id)}"${c.id === p.chosen ? ' selected' : ''}>${UI.esc(c.name)}</option>`).join('');
            return `<div class="cx-asgrow">
                <img class="cx-asgimg" src="${p.uri}" alt="">
                <div class="cx-asgmeta">
                    ${p.name ? `<div class="cx-asgname">${UI.esc(p.name)}</div>` : ''}
                    <select class="cx-asgsel" data-idx="${i}">${opts}</select>
                </div>
            </div>`;
        }).join('');
        const matched = pend.filter(p => p.guess).length;
        return `<p class="cx-asghint">${I18n.t('customize.assignHint', { matched, total: pend.length })}</p>
            <div class="cx-asglist">${rows}</div>
            <div class="cx-ovrow">
                <button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button>
                <button class="btn btn--primary" data-act="asgapply">${I18n.t('customize.applyLogos')}</button>
            </div>`;
    },
    _wireAssignSelects() {
        const ov = this._ov(); if (!ov) return;
        (ov.querySelectorAll ? ov.querySelectorAll('.cx-asgsel') : []).forEach(sel => {
            sel.addEventListener('change', () => {
                const i = +sel.dataset.idx;
                if (this._pendingLogos && this._pendingLogos[i]) this._pendingLogos[i].chosen = sel.value;
                const body = ov.querySelector('.cx-ovbody');
                if (body) { body.innerHTML = this._assignBodyHTML(); this._wireAssignSelects(); }
            });
        });
    },
    // A B-team automatically shows its parent's logo (it's never in the assign list).
    _propagateReserveLogo(parentId, uri, setter) {
        setter = setter || ((id, u) => this._setOverride(id, { logo: u }));
        if (this._created) {
            (this._created.clubs || []).forEach(c => { if (c.reserve && c.parentId === parentId) setter(c.id, uri); });
        } else if (typeof Clubs !== 'undefined' && Clubs.parentReserveId && Clubs.parentReserveId[parentId]) {
            setter(Clubs.parentReserveId[parentId], uri);
        }
    },
    _applyAssignedLogos() {
        const pend = this._pendingLogos || [];
        const live = !!this._live;
        let done = 0;
        pend.forEach(p => {
            if (!p.chosen) return;
            if (live && typeof GameState !== 'undefined') {
                const set = (id, u) => GameState.setClubLogo(id, u);
                set(p.chosen, p.uri); this._propagateReserveLogo(p.chosen, p.uri, set);
            } else {
                this._setOverride(p.chosen, { logo: p.uri });
                this._propagateReserveLogo(p.chosen, p.uri);
            }
            done++;
        });
        this._pendingLogos = null;
        this._closeOverlay();
        if (live) {
            this._live = false;
            if (typeof GameState !== 'undefined' && GameState.save) GameState.save();
            if (typeof Router !== 'undefined' && Router.refresh) Router.refresh();
        } else {
            if (!this._created) this._snapshot = JSON.stringify(this.db.overrides);   // fold imports into the cancel baseline
            this._refreshTable();
        }
        this._toast(I18n.t('customize.logosImported', { n: done, dropped: pend.length - done }));
    },
    // ---- mid-save logo import (Settings) : same picker + assign sheet, but writes live club logos ----
    importLogosLive() {
        this._injectCSS();   // reached from Settings, not show() — the overlay/toast CSS isn't in the page yet
        this._live = true; this._created = null;
        const countries = [...new Set((Clubs.allClubs || []).map(c => c.country))].sort();
        const btns = countries.map(c => `<button class="cx-btn" data-act="livecountry" data-id="${UI.esc(c)}">${UI.esc(c)}</button>`).join('');
        this._overlay(I18n.t('customize.importLogos'), `
            <p class="cx-asghint">${I18n.t('customize.pickCountryLogos')}</p>${btns}
            <div class="cx-ovrow"><button class="btn btn--ghost" data-act="livecancel">${I18n.t('common.cancel')}</button></div>`);
        this._delegate(this._ov());
    },
    _livePickCountry(country) { this.country = country; this._closeOverlay(); this.importLogos(); },
    // ---- mid-save name import (Settings) : reads an {id:name} pack (e.g. the real-names file) and applies
    // it to the running save. No country/assignment step — names key straight off the club id. ----
    importNamesLive() {
        this._injectCSS();
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.csv,text/csv,text/plain,application/json,.json';
        inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (f) this._readNamesLive(f); });
        inp.click();
    },
    _readNamesLive(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let map;
            try { map = this._parseNamesText(String(reader.result || '')); } catch (e) { this._toast(I18n.t('customize.importBad')); return; }
            let n = 0;
            Object.entries(map).forEach(([id, nm]) => {
                if (!nm || typeof GameState === 'undefined') return;
                const name = String(nm).slice(0, 40);
                // the same file carries both clubs and competitions — route each id to the right one
                if (typeof Clubs !== 'undefined' && Clubs.getClubById(id)) { GameState.setClubName(id, name); n++; }
                else if (typeof COMPETITIONS !== 'undefined' && COMPETITIONS[id]) { GameState.setCompName(id, name); n++; }
            });
            if (typeof GameState !== 'undefined' && GameState.save) GameState.save();
            if (typeof Router !== 'undefined' && Router.refresh) Router.refresh();
            this._toast(I18n.t('customize.namesImported', { n }));
        };
        reader.onerror = () => this._toast(I18n.t('customize.importBad'));
        reader.readAsText(file);
    },

    // ---------- overlay data model ----------
    // Merge a club's stock (day-one) values with this database's sparse override for it. When building
    // a CREATED country (this._created set) the source of truth is that country's own clubs array.
    clubView(id) {
        if (this._created) {
            const c = (this._created.clubs || []).find(x => x.id === id); if (!c) return null;
            return { id, name: c.name, colors: c.colors || { primary: '#5A626D', secondary: '#FFFFFF' }, reputation: c.reputation, logo: c.logo || null, division: c.division, country: this._created.name, isReserve: !!c.reserve, reserve: !!c.reserve, parentId: c.parentId || null };
        }
        const c = Clubs.getClubById(id); if (!c) return null;
        const ov = (this.db && this.db.overrides[id]) || {};
        return {
            id,
            name: ov.name != null ? ov.name : c.name,
            colors: ov.colors || c.colors || { primary: '#5A626D', secondary: '#FFFFFF' },
            reputation: ov.reputation != null ? ov.reputation : c.reputation,
            logo: ov.logo !== undefined ? ov.logo : (c.logo || null),
            division: ov.division || c.division,
            country: c.country,
            isReserve: isReserveClub(id)
        };
    },
    _setOverride(id, patch) {
        if (this._created) { const c = (this._created.clubs || []).find(x => x.id === id); if (c) Object.assign(c, patch); return; }
        if (!this.db.overrides[id]) this.db.overrides[id] = {};
        Object.assign(this.db.overrides[id], patch);
    },
    _tiersOf(country) {
        if (this._created && this._created.name === country) return this._created.divIds.map((id, i) => ({ id, name: this._created.divNames[i], tier: i + 1 }));
        return (LEAGUES_DATA[country] && LEAGUES_DATA[country].tiers) || [];
    },
    // clubs of `country` currently sitting in `divId`, honouring override-moved divisions
    _membersOf(country, divId) {
        if (this._created) return (this._created.clubs || []).filter(c => c.division === divId).map(c => c.id);
        return Clubs.getClubsByCountry(country)
            .filter(c => { const ov = this.db.overrides[c.id]; return (ov && ov.division ? ov.division : c.division) === divId; })
            .map(c => c.id);
    },
    _countryEditCount(country) {
        const ids = new Set(Clubs.getClubsByCountry(country).map(c => c.id));
        return Object.keys(this.db.overrides).filter(id => ids.has(id)).length;
    },
    _meta() { return { name: this.db.name, createdAt: this.db.createdAt, updatedAt: this.db.updatedAt, clubs: Object.keys(this.db.overrides).length }; },

    // ---------- click delegation + long-press ----------
    // One delegated handler per rendered root; data-act names the action, data-cid/-id/-which the target.
    _delegate(root) {
        root = root || document.getElementById('cxRoot');
        if (!root || root._cxWired) return; root._cxWired = true;
        root.addEventListener('click', e => {
            const el = e.target.closest('[data-act]'); if (!el) return;
            if (this._lpFired) { this._lpFired = false; e.preventDefault(); e.stopPropagation(); return; }   // swallow the click after a long-press
            const act = el.dataset.act, id = el.dataset.cid || el.dataset.id, which = el.dataset.which;
            this._dispatch(act, id, which, el.dataset);
        });
    },
    _dispatch(act, id, which, ds) {
        switch (act) {
            case 'newdb': this._newDb(); break;
            case 'pickoverwrite': this._newDb(id); break;
            case 'createconfirm': this._doCreate((document.getElementById('cxDbName') || {}).value, id); break;
            case 'loaddb': this._loadDb(id); break;
            case 'deldb': this._deleteDb(id); break;
            case 'countries': this.countryList(); break;
            case 'addcountry': this.addCountryHome(); break;
            case 'savedb': this.saveDatabase(); break;
            case 'opencountry': this.openCountry(id); break;
            case 'name': this.editName(id); break;
            case 'namesave': this._saveName(id); break;
            case 'colp': this.editColor(id, 'primary'); break;
            case 'cols': this.editColor(id, 'secondary'); break;
            case 'palpick': this._palPick(which); break;
            case 'colsave': this._saveColor(id, which); break;
            case 'rep': this.editRep(id); break;
            case 'repsave': this._saveRep(id); break;
            case 'logo': this.triggerLogo(id); break;
            case 'divsave': this._saveDivision(id); break;
            case 'savecountry': this.saveCountry(); break;
            case 'cancelcountry': this.cancelCountry(); break;
            case 'impnames': this.importNames(); break;
            case 'implogos': this.importLogos(); break;
            case 'asgapply': this._applyAssignedLogos(); break;
            case 'livecountry': this._livePickCountry(id); break;
            case 'livecancel': this._live = false; this._closeOverlay(); break;
            case 'exporttpl': this.exportTemplate(); break;
            case 'ovcancel': this._closeOverlay(); break;
            // ---- add-a-new-country ----
            case 'createcountry': this.createCountry(); break;
            case 'importcountry': this.importCountry(); break;
            case 'docreatecountry': this.doCreateCountry(); break;
            case 'opencreated': this.countryMenu(id); break;
            case 'delcountry': this.deleteCountry(id); break;
            case 'delcountryok': this._doDeleteCountry(id); break;
            case 'buildleague': this.buildLeague(id); break;
            case 'savecreated': this.saveCreatedLeague(); break;
            case 'cancelcreated': this.cancelCreatedLeague(); break;
            case 'editnames': this.editNames(id); break;
            case 'savenames': this._saveNames(id); break;
            case 'regions': this.regionBuilder(id); break;
            case 'exportcountry': this.exportCountry(id); break;
            case 'ccreserve': this.toggleReserve(id); break;
            case 'parentsave': this._saveParent(id); break;
            case 'compnames': this.competitionNames(); break;
            case 'renameone': this.renameOne(id); break;
            case 'compsave': this._saveCompName(id); break;
            case 'regname': this.regName(id); break;
            case 'regnamesave': this._saveRegName(id); break;
            case 'regadd': this.regAdd(id); break;
            case 'regassign': this._regAssign(ds ? ds.region : which, id); break;
            case 'regremove': this._regRemove(id); break;
            case 'regdone': this.regionsDone(); break;
        }
    },
    // long-press a club row -> move-division dialog (gated); a plain tap on a cell hits its own editor
    _wireRows() {
        const table = document.getElementById('cxTable'); if (!table) return;
        if (this._created) return;   // created leagues have fixed division slots — no long-press move
        table.querySelectorAll('.cx-row').forEach(row => {
            let timer = null;
            const start = () => { timer = setTimeout(() => { this._lpFired = true; this.editDivision(row.dataset.cid); }, 500); };
            const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
            row.addEventListener('pointerdown', start);
            row.addEventListener('pointerup', cancel);
            row.addEventListener('pointermove', cancel);
            row.addEventListener('pointercancel', cancel);
        });
    },

    // ===================== ADD A NEW COUNTRY (Part 2) =====================
    // featured cup COMPETITIONS ids per country (for competition renaming; created cups live on the cc)
    CUP_COMPS: {
        Netherlands: ['BEKER', 'KBEK'], England: ['FACUP', 'LLC'], Germany: ['DFB', 'LPOKAL'], Spain: ['CDR', 'CFED'],
        Switzerland: ['SCHWCUP', 'CUPABASS', 'LICHCUP'], Italy: ['COPPA', 'COPPACOMP'], France: ['COUPEFR', 'COUPENAT'],
        Portugal: ['TACAPT', 'SEGTACA'], Belgium: ['BELCUP', 'NOTRECOUPE']
    },
    addCountryHome() {
        const created = Object.keys(this.db.countries || {});
        const list = created.length ? `<div class="cx-listhead">${I18n.t('customize.yourCountries')}</div><div class="cx-list">` +
            created.map(c => `<div class="cx-item" data-act="opencreated" data-id="${UI.esc(c)}"><div class="cx-item__main"><span class="cx-item__name">${UI.esc(c)}</span><span class="cx-item__sub">${this.db.countries[c].european ? I18n.t('customize.european') : I18n.t('customize.nonEuropean')}</span></div><button class="cx-del" data-act="delcountry" data-id="${UI.esc(c)}" aria-label="${I18n.t('common.delete')}">✕</button></div>`).join('') + '</div>' : '';
        const body = `
            <p class="cx-note">${I18n.t('customize.addCountryNote')}</p>
            <button class="btn btn--primary cx-wide cx-menu" data-act="createcountry"><i class="ti ti-plus"></i><span>${I18n.t('customize.createCountry')}</span></button>
            <button class="btn btn--ghost cx-wide cx-menu" data-act="importcountry"><i class="ti ti-upload"></i><span>${I18n.t('customize.importCountry')}</span></button>
            ${list}`;
        this._screen(I18n.t('customize.addCountry'), body, () => this.menu());
        this._delegate();
    },
    createCountry() {
        const body = `
            <p class="cx-note">${I18n.t('customize.createNote')}</p>
            <label class="field-label">${I18n.t('customize.confederation')}</label>
            <div class="select-wrap"><select id="cxEuro" class="select-input"><option value="1">${I18n.t('customize.european')}</option><option value="0">${I18n.t('customize.nonEuropean')}</option></select><i class="ti ti-chevron-down select-wrap__chevron"></i></div>
            <label class="field-label" style="margin-top:12px">${I18n.t('customize.nameDbLabel')}</label>
            <div class="select-wrap"><select id="cxTier" class="select-input"><option value="extended">${I18n.t('customize.tierExtended')}</option><option value="small">${I18n.t('customize.tierSmall')}</option><option value="none">${I18n.t('customize.tierNone')}</option></select><i class="ti ti-chevron-down select-wrap__chevron"></i></div>
            <label class="field-label" style="margin-top:12px">${I18n.t('customize.country')}</label>
            <div class="select-wrap"><select id="cxCountry" class="select-input"></select><i class="ti ti-chevron-down select-wrap__chevron"></i></div>
            <p class="cx-note cx-note--muted" id="cxEuroNote" style="margin-top:8px"></p>
            <button class="btn btn--primary cx-wide" style="margin-top:14px" data-act="docreatecountry">${I18n.t('customize.create')}</button>`;
        this._screen(I18n.t('customize.createCountry'), body, () => this.addCountryHome());
        this._delegate();
        const euro = document.getElementById('cxEuro'), tier = document.getElementById('cxTier');
        if (euro) euro.addEventListener('change', () => this._fillCountrySelect());
        if (tier) tier.addEventListener('change', () => this._fillCountrySelect());
        this._fillCountrySelect();
        this._explain('createCountry', I18n.t('customize.explainCreate'));
    },
    _fillCountrySelect() {
        const euro = document.getElementById('cxEuro'), tier = document.getElementById('cxTier'), sel = document.getElementById('cxCountry'), note = document.getElementById('cxEuroNote');
        if (!euro || !tier || !sel) return;
        const european = euro.value === '1';
        const list = (typeof WorldExt !== 'undefined') ? WorldExt.creatableCountries(european, tier.value) : [];
        sel.innerHTML = list.length ? list.map(c => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('') : `<option value="">${I18n.t('customize.noCountries')}</option>`;
        if (note) note.textContent = european ? '' : I18n.t('customize.nonEuropeanNote');
    },
    doCreateCountry() {
        const country = (document.getElementById('cxCountry') || {}).value;
        const european = (document.getElementById('cxEuro') || {}).value === '1';
        if (!country) { this._toast(I18n.t('customize.noCountries')); return; }
        if (this.db.countries[country]) { this._toast(I18n.t('customize.countryExists')); return; }
        this.db.countries[country] = WorldExt.makeSkeleton(country, european);
        this.countryMenu(country);
    },
    countryMenu(country) {
        const cc = this.db.countries[country]; if (!cc) { this.addCountryHome(); return; }
        const hasRegions = (cc.regions || []).length === 6 && cc.regions.every(r => (r.clubIds || []).length >= 2);
        const body = `
            <div class="cx-dbtag">${I18n.t('customize.building', { name: UI.esc(country) })}${cc.european ? '' : ' · ' + I18n.t('customize.noEurope')}</div>
            <button class="btn btn--primary cx-wide cx-menu" data-act="buildleague" data-id="${UI.esc(country)}"><i class="ti ti-table"></i><span>${I18n.t('customize.buildLeague')}</span></button>
            <button class="btn btn--ghost cx-wide cx-menu" data-act="editnames" data-id="${UI.esc(country)}"><i class="ti ti-abc"></i><span>${I18n.t('customize.addNames')}</span></button>
            <button class="btn btn--ghost cx-wide cx-menu" data-act="regions" data-id="${UI.esc(country)}"><i class="ti ti-map-2"></i><span>${I18n.t('customize.scoutingRegions')}${hasRegions ? ' ✓' : ''}</span></button>
            <button class="btn btn--ghost cx-wide" style="margin-top:12px" data-act="exportcountry" data-id="${UI.esc(country)}"><i class="ti ti-download"></i> ${I18n.t('customize.exportCountry')}</button>`;
        this._screen(country, body, () => this.addCountryHome());
        this._delegate();
        this._explain('countryMenu', I18n.t('customize.explainCountryMenu'));
    },
    // ----- league builder (reuses the editor over the created country's own clubs) -----
    buildLeague(country) {
        const cc = this.db.countries[country]; if (!cc) return;
        this._created = cc; this.country = country; this.division = cc.divIds[0];
        this._createdSnap = JSON.stringify(cc);
        this._renderEditor();
    },
    saveCreatedLeague() {
        const cc = this._created; if (!cc) return;
        // enforce reputation caps + B-team caps (the editor bypasses rep caps)
        const editor = (typeof GameState !== 'undefined' && GameState.canEditGameState);
        const errors = [];
        cc.divIds.forEach((d, i) => {
            const spec = WorldExt.divSpec()[i];
            const clubs = cc.clubs.filter(c => c.division === d);
            if (!editor) { const over = clubs.filter(c => c.reputation > spec.repCap).length; if (over) errors.push(I18n.t('customize.errRepCap', { div: cc.divNames[i], cap: spec.repCap, n: over })); }
            const res = clubs.filter(c => c.reserve).length;
            if (res > spec.resCap) errors.push(I18n.t('customize.errCap', { div: cc.divNames[i], cap: spec.resCap, act: res }));
        });
        if (errors.length) {
            this._overlay(I18n.t('customize.cantSaveCountry'), `<p class="cx-note cx-note--warn">${I18n.t('customize.fixFirst')}</p><ul class="cx-errlist">${errors.map(e => `<li>${e}</li>`).join('')}</ul><button class="btn btn--primary cx-wide" style="margin-top:10px" data-act="ovcancel">${I18n.t('common.ok')}</button>`);
            this._delegate(this._ov());
            return;
        }
        cc._leagueBuilt = true;
        const country = cc.name; this._created = null; this._createdSnap = null;
        this.countryMenu(country);
    },
    _confirmLeaveCreated() {
        if (this._createdSnap == null || this._createdSnap === JSON.stringify(this._created)) { const c = this._created.name; this._created = null; this.countryMenu(c); return; }
        this._overlay(I18n.t('customize.discardTitle'), `<p class="cx-note">${I18n.t('customize.discardNote')}</p><div class="cx-ovrow"><button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button><button class="btn btn--primary" data-act="cancelcreated">${I18n.t('customize.discard')}</button></div>`);
        this._delegate(this._ov());
    },
    cancelCreatedLeague() {
        const cc = this._created; const country = cc.name;
        if (this._createdSnap != null) { try { this.db.countries[country] = JSON.parse(this._createdSnap); } catch (e) { } }
        this._created = null; this._createdSnap = null;
        this._closeOverlay(); this.countryMenu(country);
    },
    deleteCountry(country) {
        this._overlay(I18n.t('common.delete'), `<p class="cx-note">${I18n.t('customize.deleteCountryNote', { name: UI.esc(country) })}</p><div class="cx-ovrow"><button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button><button class="btn btn--primary" data-act="delcountryok" data-id="${UI.esc(country)}">${I18n.t('common.delete')}</button></div>`);
        this._delegate(this._ov());
    },
    _doDeleteCountry(country) { delete this.db.countries[country]; this._closeOverlay(); this.addCountryHome(); },
    exportCountry(country) {
        const cc = this.db.countries[country]; if (!cc) return;
        this._download(this._slug(country) + '-country.json', JSON.stringify(cc), 'application/json');
    },
    importCountry() {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.json,application/json';
        inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (f) this._readCountry(f); });
        inp.click();
    },
    _readCountry(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let cc; try { cc = JSON.parse(String(reader.result || '')); } catch (e) { this._toast(I18n.t('customize.importBad')); return; }
            if (!cc || !cc.name || !Array.isArray(cc.divIds) || cc.divIds.length !== 4 || !Array.isArray(cc.clubs)) { this._toast(I18n.t('customize.importBadCountry')); return; }
            this.db.countries[cc.name] = cc;
            this._toast(I18n.t('customize.countryImported', { name: cc.name }));
            this.addCountryHome();
        };
        reader.onerror = () => this._toast(I18n.t('customize.importBad'));
        reader.readAsText(file);
    },
    // ----- competition names (divisions + cups, featured or created) -----
    competitionNames() {
        const comps = this._countryComps(this.country);
        const rows = comps.map(c => `<div class="cx-item" data-act="renameone" data-id="${UI.esc(c.id)}"><div class="cx-item__main"><span class="cx-item__name">${UI.esc(c.name)}</span><span class="cx-item__sub">${c.kind}</span></div><span class="cx-item__go">✎</span></div>`).join('');
        this._overlay(I18n.t('customize.competitionNames'), `<p class="cx-note">${I18n.t('customize.compNamesNote')}</p><div class="cx-list">${rows}</div><button class="btn btn--ghost cx-wide" style="margin-top:10px" data-act="ovcancel">${I18n.t('common.close')}</button>`);
        this._delegate(this._ov());
    },
    _countryComps(country) {
        if (this._created) {
            const cc = this._created;
            return cc.divIds.map((id, i) => ({ id, name: cc.divNames[i], kind: I18n.t('customize.kindLeague') }))
                .concat([{ id: cc.cups.higher.id, name: cc.cups.higher.name, kind: I18n.t('customize.kindCup') }, { id: cc.cups.lower.id, name: cc.cups.lower.name, kind: I18n.t('customize.kindCup') }]);
        }
        const out = (COUNTRY_DIVS[country] || []).map(id => ({ id, name: this._compName(id), kind: I18n.t('customize.kindLeague') }));
        (this.CUP_COMPS[country] || []).forEach(id => { if (COMPETITIONS[id]) out.push({ id, name: this._compName(id), kind: I18n.t('customize.kindCup') }); });
        return out;
    },
    renameOne(id) {
        const cur = this._compName(id);
        this._overlay(I18n.t('customize.rename'), `<input id="cxCompIn" class="text-input" type="text" maxlength="28" value="${UI.esc(cur)}"><div class="cx-ovrow"><button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button><button class="btn btn--primary" data-act="compsave" data-id="${UI.esc(id)}">${I18n.t('common.save')}</button></div>`);
        this._delegate(this._ov());
        setTimeout(() => { const el = document.getElementById('cxCompIn'); if (el) { el.focus(); el.select(); } }, 30);
    },
    _saveCompName(id) {
        const nm = ((document.getElementById('cxCompIn') || {}).value || '').trim(); if (!nm) return;
        if (this._created) {
            const cc = this._created, i = cc.divIds.indexOf(id);
            if (i >= 0) cc.divNames[i] = nm;
            else if (cc.cups.higher.id === id) cc.cups.higher.name = nm;
            else if (cc.cups.lower.id === id) cc.cups.lower.name = nm;
        } else {
            if (!this.db.competitions) this.db.competitions = {};
            this.db.competitions[id] = { name: nm, short: nm };
        }
        this._closeOverlay();
        if (this._insideEditor()) this._renderEditor(); else this.competitionNames();
    },
    _insideEditor() { return !!document.getElementById('cxTable'); },
    // ----- name editor -----
    editNames(country) {
        const cc = this.db.countries[country]; if (!cc) return;
        this._namesCountry = country;
        const body = `
            <p class="cx-note">${I18n.t('customize.namesNote')}</p>
            <label class="field-label">${I18n.t('customize.firstNames')} <span class="cx-ncount" id="cxFirstN"></span></label>
            <textarea id="cxFirst" class="text-input cx-area" rows="7"></textarea>
            <label class="field-label" style="margin-top:10px">${I18n.t('customize.lastNames')} <span class="cx-ncount" id="cxLastN"></span></label>
            <textarea id="cxLast" class="text-input cx-area" rows="7"></textarea>
            <button class="btn btn--primary cx-wide" style="margin-top:14px" data-act="savenames" data-id="${UI.esc(country)}">${I18n.t('common.save')}</button>`;
        this._screen(I18n.t('customize.addNames'), body, () => this.countryMenu(country));
        this._delegate();
        // Set the textarea values in JS (not via innerHTML) so a long list can't be truncated by the
        // HTML parser, and keep the counts live + accurate as the player edits.
        const fe = document.getElementById('cxFirst'), le = document.getElementById('cxLast');
        const upd = () => {
            const fn = document.getElementById('cxFirstN'), ln = document.getElementById('cxLastN');
            if (fn) fn.textContent = '(' + this._nameCount(fe && fe.value) + ')';
            if (ln) ln.textContent = '(' + this._nameCount(le && le.value) + ')';
        };
        if (fe) { fe.value = cc.names.first.join(', '); fe.addEventListener('input', upd); }
        if (le) { le.value = cc.names.last.join(', '); le.addEventListener('input', upd); }
        upd();
        this._explain('editNames', I18n.t('customize.explainNames'));
    },
    _nameCount(v) { return String(v || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean).length; },
    _saveNames(country) {
        const cc = this.db.countries[country]; if (!cc) return;
        const parse = v => String(v || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
        cc.names.first = parse((document.getElementById('cxFirst') || {}).value);
        cc.names.last = parse((document.getElementById('cxLast') || {}).value);
        this._toast(I18n.t('customize.namesSaved'));
        this.countryMenu(country);
    },
    // ----- scouting regions -----
    regionBuilder(country) {
        const cc = this.db.countries[country]; if (!cc) return;
        if (!cc._leagueBuilt) { this._toast(I18n.t('customize.buildLeagueFirst')); return; }
        if (!cc.regions || cc.regions.length !== 6) cc.regions = [0, 1, 2, 3, 4, 5].map(i => ({ id: 'CUS:' + country + ':r' + (i + 1), name: I18n.t('customize.regionN', { n: i + 1 }), clubIds: [] }));
        this._regCountry = country;
        this._renderRegions();
        this._explain('regions', I18n.t('customize.explainRegions'));
    },
    _renderRegions() {
        const cc = this.db.countries[this._regCountry];
        const assigned = new Set(); cc.regions.forEach(r => (r.clubIds || []).forEach(id => assigned.add(id)));
        const pool = cc.clubs.filter(c => !assigned.has(c.id));
        const costs = WorldExt.regionCosts(cc);
        const cards = cc.regions.map((r, idx) => {
            const reps = (r.clubIds || []).map(id => { const c = cc.clubs.find(x => x.id === id); return c ? c.reputation : 0; });
            const avg = reps.length ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : 0;
            const high = reps.length ? Math.max.apply(null, reps) : 0;
            const chips = (r.clubIds || []).map(id => { const c = cc.clubs.find(x => x.id === id); return `<button class="cx-chip2" data-act="regremove" data-cid="${UI.esc(id)}">${UI.esc(c ? c.name : id)} ✕</button>`; }).join('');
            const ok = (r.clubIds || []).length >= 2;
            return `<div class="cx-regcard">
                <div class="cx-reghead"><button class="cx-regname" data-act="regname" data-id="${idx}">${UI.esc(r.name)} ✎</button><span class="cx-regcost">${ok ? UI.cur() + UI.money(costs[r.id] || 0) : '<span class="cx-count--bad">' + I18n.t('customize.min2') + '</span>'}</span></div>
                <div class="cx-regmeta">${I18n.t('customize.regMeta', { n: (r.clubIds || []).length, avg: avg, high: high })}</div>
                <div class="cx-chips2">${chips}<button class="cx-chip2 cx-chip2--add" data-act="regadd" data-id="${idx}">+ ${I18n.t('customize.addClubs')}</button></div>
            </div>`;
        }).join('');
        const allOk = cc.regions.every(r => (r.clubIds || []).length >= 2);
        const body = `
            <p class="cx-note">${I18n.t('customize.regionsNote', { left: pool.length })}</p>
            ${cards}
            <button class="btn btn--primary cx-wide" style="margin-top:14px" data-act="regdone"${allOk ? '' : ' disabled'}>${I18n.t('customize.regionsDone')}</button>`;
        // keep the reader where they were: rebuilding the screen otherwise snaps back to the top on every pick
        const qs = sel => (document.querySelector ? document.querySelector(sel) : null);
        const prevBody = qs('#cxRoot .cx-body');
        const scrollY = prevBody ? prevBody.scrollTop : 0;
        this._screen(I18n.t('customize.scoutingRegions'), body, () => this.countryMenu(this._regCountry));
        const newBody = qs('#cxRoot .cx-body');
        if (newBody && scrollY) newBody.scrollTop = scrollY;
        this._delegate();
    },
    regName(idx) {
        const cc = this.db.countries[this._regCountry]; const r = cc.regions[idx]; if (!r) return;
        this._overlay(I18n.t('customize.rename'), `<input id="cxRegIn" class="text-input" type="text" maxlength="24" value="${UI.esc(r.name)}"><div class="cx-ovrow"><button class="btn btn--ghost" data-act="ovcancel">${I18n.t('common.cancel')}</button><button class="btn btn--primary" data-act="regnamesave" data-id="${idx}">${I18n.t('common.save')}</button></div>`);
        this._delegate(this._ov());
    },
    _saveRegName(idx) { const cc = this.db.countries[this._regCountry]; const nm = ((document.getElementById('cxRegIn') || {}).value || '').trim(); if (nm && cc.regions[idx]) cc.regions[idx].name = nm; this._closeOverlay(); this._renderRegions(); },
    regAdd(idx) {
        const cc = this.db.countries[this._regCountry];
        const assigned = new Set(); cc.regions.forEach(r => (r.clubIds || []).forEach(id => assigned.add(id)));
        const pool = cc.clubs.filter(c => !assigned.has(c.id));
        if (!pool.length) { this._closeOverlay(); this._toast(I18n.t('customize.poolEmpty')); return; }
        const rows = pool.map(c => `<button class="cx-btn" data-act="regassign" data-region="${idx}" data-cid="${UI.esc(c.id)}">${UI.esc(c.name)} <span class="cx-id">${UI.esc(this._compName(c.division))}</span></button>`).join('');
        this._overlay(I18n.t('customize.addClubs'), `<div class="cx-list" style="max-height:60vh;overflow:auto">${rows}</div><button class="btn btn--ghost cx-wide" style="margin-top:8px" data-act="ovcancel">${I18n.t('common.close')}</button>`);
        this._delegate(this._ov());
    },
    _regAssign(idx, cid) {
        const cc = this.db.countries[this._regCountry];
        if (cc.regions[idx] && !cc.regions[idx].clubIds.includes(cid)) cc.regions[idx].clubIds.push(cid);
        const listOf = () => { const ov = this._ov(); return (ov && ov.querySelector) ? ov.querySelector('.cx-list') : null; };
        const oldList = listOf();
        const listScroll = oldList ? oldList.scrollTop : 0;
        this._renderRegions();      // refresh the counts/costs underneath (page scroll is preserved)
        this.regAdd(idx);           // reopen the picker (now without the club just added) for rapid multi-add; it self-closes with a toast once the pool is empty
        const newList = listOf();
        if (newList && listScroll) newList.scrollTop = listScroll;   // and keep the picker where it was too
    },
    _regRemove(cid) { const cc = this.db.countries[this._regCountry]; cc.regions.forEach(r => { r.clubIds = (r.clubIds || []).filter(x => x !== cid); }); this._renderRegions(); },
    regionsDone() {
        const cc = this.db.countries[this._regCountry];
        if (!cc.regions.every(r => (r.clubIds || []).length >= 2)) { this._toast(I18n.t('customize.min2')); return; }
        this._toast(I18n.t('customize.regionsSaved'));
        this.countryMenu(this._regCountry);
    },
    // ----- first-time explainers -----
    _explain(key, text) {
        const seen = (typeof Prefs !== 'undefined' && Prefs.get) ? (Prefs.get('cxSeen') || {}) : (this.__seen = this.__seen || {});
        if (seen[key]) return;
        seen[key] = true;
        if (typeof Prefs !== 'undefined' && Prefs.set) Prefs.set('cxSeen', seen);
        this._overlay(I18n.t('customize.howto'), `<p class="cx-note" style="line-height:1.5">${text}</p><button class="btn btn--primary cx-wide" style="margin-top:8px" data-act="ovcancel">${I18n.t('common.ok')}</button>`);
        this._delegate(this._ov());
    },

    // ---------- chrome ----------
    _root() { return document.getElementById('cxRoot'); },
    _screen(title, bodyHTML, onBack) {
        document.getElementById('app').innerHTML = `<div class="cx-wrap" id="cxRoot">
            <div class="cx-head">
                <button class="cx-back" id="cxBack" aria-label="${I18n.t('common.back')}"><i class="ti ti-chevron-left"></i></button>
                <div class="cx-htitle">${UI.esc(title)}</div>
            </div>
            <div class="cx-body">${bodyHTML}</div>
        </div>`;
        const back = document.getElementById('cxBack');
        if (back) back.addEventListener('click', () => onBack());
    },
    _ov() { return document.getElementById('cxOverlay'); },
    _overlay(title, bodyHTML) {
        this._closeOverlay();
        const ov = document.createElement('div');
        ov.id = 'cxOverlay'; ov.className = 'cx-overlay';
        ov.innerHTML = `<div class="cx-ovcard"><div class="cx-ovtitle">${UI.esc(title)}</div><div class="cx-ovbody">${bodyHTML}</div></div>`;
        ov.addEventListener('click', e => { if (e.target === ov) this._closeOverlay(); });
        document.body.appendChild(ov);
    },
    _closeOverlay() { const ov = this._ov(); if (ov) ov.remove(); },
    _toast(msg) {
        let t = document.getElementById('cxToast');
        if (t) t.remove();
        t = document.createElement('div');
        t.id = 'cxToast'; t.className = 'cx-toast'; t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.classList.add('cx-toast--in'); }, 10);
        setTimeout(() => { t.classList.remove('cx-toast--in'); setTimeout(() => t.remove(), 250); }, 2200);
    },

    // ---------- small helpers ----------
    _hex(s) { s = (s == null ? '' : String(s)).trim(); if (/^#?[0-9a-fA-F]{6}$/.test(s)) return (s[0] === '#' ? s : '#' + s).toUpperCase(); return null; },
    _csv(s) { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; },
    _slug(s) { return String(s || 'database').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'database'; },
    _download(filename, text, mime) {
        try {
            const blob = new Blob([text], { type: mime || 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this._toast(I18n.t('customize.exported', { file: filename }));
        } catch (e) { this._toast(I18n.t('customize.exportFailed')); }
    },
    _when(ts) {
        if (!ts) return '';
        const diff = Date.now() - ts;
        if (diff < 60000) return I18n.t('customize.justNow');
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
        return new Date(ts).toLocaleDateString();
    },

    _injectCSS() {
        if (document.getElementById('cxCSS')) return;
        const css = `
        .cx-wrap{position:fixed;inset:0;background:var(--bg);color:var(--text);z-index:50;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0) + 8px) 0 calc(env(safe-area-inset-bottom,0) + 8px)}
        .cx-head{display:flex;align-items:center;gap:8px;padding:6px 12px 10px;border-bottom:1px solid var(--line)}
        .cx-back{background:none;border:none;color:var(--text-secondary);font-size:22px;cursor:pointer;display:flex;padding:4px}
        .cx-htitle{font-size:var(--fs-lg);font-weight:var(--weight-semibold);color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cx-body{flex:1;overflow-y:auto;padding:14px 16px 24px;max-width:560px;width:100%;margin:0 auto}
        .cx-note{color:var(--text-secondary);font-size:var(--fs-sm);margin:0 0 12px;line-height:1.45}
        .cx-note--warn{color:var(--state-bad,#e0574a)}
        .cx-err{color:var(--state-bad,#e0574a);font-size:var(--fs-sm);margin:8px 0 0}
        .cx-wide{width:100%}
        .cx-listhead{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-secondary);margin:20px 0 8px}
        .cx-list{display:flex;flex-direction:column;gap:8px}
        .cx-item{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer}
        .cx-item__main{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
        .cx-item__name{color:var(--text-bright);font-weight:var(--weight-semibold);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cx-item__sub{color:var(--text-secondary);font-size:12px}
        .cx-item__go{color:var(--text-dim);font-size:20px}
        .cx-del{background:none;border:none;color:var(--text-dim);font-size:15px;cursor:pointer;padding:4px 6px}
        .cx-empty,.cx-note--muted{color:var(--text-dim);font-size:var(--fs-sm);text-align:center;padding:14px}
        .cx-dbtag{color:var(--text-secondary);font-size:var(--fs-sm);margin-bottom:16px}
        .cx-menu{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;padding:16px}
        .cx-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;position:sticky;top:0;background:var(--bg);padding:2px 0;z-index:2}
        .cx-selwrap{flex:1}
        .cx-tbbtn{background:var(--surface);border:1px solid var(--line);border-radius:10px;color:var(--text-secondary);width:40px;height:40px;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}
        .cx-count{font-size:12px;color:var(--text-secondary);margin:2px 0 8px;text-align:right}
        .cx-count--bad{color:var(--state-bad,#e0574a);font-weight:var(--weight-semibold)}
        .cx-sizebanner{background:rgba(224,87,74,.12);border:1px solid var(--state-bad,#e0574a);color:var(--state-bad,#e0574a);border-radius:10px;padding:9px 12px;margin-bottom:10px;font-size:12px;line-height:1.5}
        .cx-table{display:flex;flex-direction:column;gap:6px}
        .cx-row{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:6px 8px;touch-action:pan-y}
        .cx-logo{background:none;border:none;padding:0;cursor:pointer;flex:none;display:flex;width:30px;height:30px;align-items:center;justify-content:center}
        .cx-logo .crest,.cx-logo img.crest{width:26px;height:30px}
        .cx-namewrap{flex:1;display:flex;flex-direction:column;min-width:0}
        .cx-name{background:none;border:none;color:var(--text-bright);font:inherit;font-weight:var(--weight-medium);text-align:left;cursor:pointer;padding:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cx-btag{background:var(--line-strong);color:var(--text-secondary);font-size:9px;padding:0 4px;border-radius:4px;vertical-align:middle}
        .cx-id{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cx-swatch{width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,255,255,.25);cursor:pointer;flex:none}
        .cx-rep{background:var(--surface-2,rgba(255,255,255,.05));border:1px solid var(--line);border-radius:8px;color:var(--text-bright);font:inherit;font-weight:var(--weight-semibold);min-width:38px;text-align:center;padding:5px 6px;cursor:pointer;flex:none}
        .cx-locked{color:var(--text-secondary)}
        .cx-editfoot{display:flex;gap:10px;margin-top:16px}
        .cx-editfoot .btn{flex:1}
        .cx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;z-index:80;padding:22px}
        .cx-ovcard{background:var(--surface);border:1px solid var(--line-strong);border-radius:16px;padding:18px;max-width:400px;width:100%;max-height:88vh;overflow-y:auto}
        .cx-ovtitle{font-weight:var(--weight-semibold);font-size:var(--fs-lg);color:var(--text-bright);margin-bottom:12px}
        .cx-ovrow{display:flex;gap:10px;margin-top:14px}
        .cx-ovrow .btn{flex:1}
        .cx-asghint{color:var(--text-secondary);font-size:var(--fs-sm);margin:0 0 10px;line-height:1.4}
        .cx-asglist{max-height:52vh;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:8px}
        .cx-asgrow{display:flex;align-items:center;gap:12px;background:var(--surface-2,rgba(255,255,255,.05));border:1px solid var(--line);border-radius:10px;padding:8px 10px}
        .cx-asgimg{width:40px;height:40px;object-fit:contain;flex:none;background:rgba(255,255,255,.06);border-radius:8px}
        .cx-asgmeta{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
        .cx-asgname{font-size:var(--fs-xs);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cx-asgsel{width:100%;background:var(--surface);border:1px solid var(--line);border-radius:8px;color:var(--text-bright);padding:8px 9px;font:inherit}
        .cx-colrow{display:flex;gap:10px;align-items:center}
        .cx-colwheel{width:54px;height:44px;border:1px solid var(--line);border-radius:8px;background:none;cursor:pointer;flex:none}
        .cx-hexin{flex:1;text-transform:uppercase}
        .cx-input--bad{border-color:var(--state-bad,#e0574a)}
        .cx-btn{display:block;width:100%;text-align:left;background:var(--surface-2,rgba(255,255,255,.05));border:1px solid var(--line);border-radius:10px;color:var(--text-bright);padding:11px 13px;margin-bottom:8px;cursor:pointer;font:inherit}
        .cx-btn--pick{margin-bottom:6px}
        .cx-errlist{margin:6px 0 0;padding-left:18px;color:var(--text-secondary);font-size:var(--fs-sm);line-height:1.6}
        .cx-toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0) + 26px);transform:translate(-50%,14px);background:var(--text-bright);color:var(--bg);padding:10px 16px;border-radius:22px;font-size:var(--fs-sm);font-weight:var(--weight-medium);z-index:95;opacity:0;transition:opacity .2s,transform .2s;max-width:90vw;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.3)}
        .cx-toast--in{opacity:1;transform:translate(-50%,0)}
        .cx-bbtn{width:24px;height:24px;border-radius:6px;border:1px solid var(--line);background:var(--surface-2,rgba(255,255,255,.05));color:var(--text-secondary);font-size:11px;font-weight:700;cursor:pointer;flex:none}
        .cx-bbtn--on{background:var(--accent,#34D399);color:#08331f;border-color:transparent}
        .cx-area{width:100%;resize:vertical;font-family:inherit;line-height:1.5}
        .cx-regcard{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px}
        .cx-reghead{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .cx-regname{background:none;border:none;color:var(--text-bright);font:inherit;font-weight:var(--weight-semibold);cursor:pointer;padding:0;text-align:left}
        .cx-regcost{font-size:var(--fs-sm);color:var(--accent,#34D399);font-weight:var(--weight-semibold);flex:none}
        .cx-regmeta{font-size:12px;color:var(--text-secondary);margin:3px 0 8px}
        .cx-chips2{display:flex;flex-wrap:wrap;gap:6px}
        .cx-chip2{background:var(--surface-2,rgba(255,255,255,.06));border:1px solid var(--line);border-radius:14px;color:var(--text);font-size:12px;padding:4px 10px;cursor:pointer}
        .cx-chip2--add{border-style:dashed;color:var(--text-secondary)}
        .cx-tools{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
        .cx-toolbtn{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:13px;padding:8px 12px;cursor:pointer}
        .cx-toolbtn i{color:var(--text-secondary)}
        .cx-ncount{color:var(--text-dim);font-weight:400;font-size:12px}
        .cx-palgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
        .cx-pal{width:100%;aspect-ratio:1;border-radius:8px;border:1px solid rgba(255,255,255,.22);cursor:pointer;padding:0}
        .cx-pal[data-sel="1"]{outline:2px solid var(--accent,#34D399);outline-offset:1px}
        .cx-prev{width:44px;height:44px;border-radius:8px;border:1px solid var(--line);flex:none;display:inline-block}
        .cx-customcol{position:relative;width:44px;height:44px;border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;font-size:20px}
        .cx-customcol input[type=color]{position:absolute;inset:0;opacity:0;width:100%;height:100%;border:none;padding:0;cursor:pointer}`;
        const st = document.createElement('style'); st.id = 'cxCSS'; st.textContent = css;
        document.head.appendChild(st);
    }
};
