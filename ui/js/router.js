// ============================================================
//  Router — tiny hash router + app shell (app-bar / bottom-nav /
//  pushed-screen header) + shared sheet/modal helpers.
//  Screens register with Router.register(name, def) where def is:
//    { isMain: bool, title: string | (params)=>string, render(el, params),
//      parent?: hash | (params)=>hash }   // one level up; where back() goes with nothing stacked
// ============================================================
const Router = {
    NAV: [
        ['leagues', 'ti-trophy', 'Leagues'],
        ['clients', 'ti-users', 'Clients'],
        ['home', 'ti-home', 'Home'],
        ['scouting', 'ti-search', 'Scouting'],
        ['agency', 'ti-briefcase', 'Agency']
    ],
    screens: {},
    current: null,
    lastMain: 'home',
    lastWeekNet: null,   // set by Home.advance() after Sim.advanceWeek(); shown in the persistent header

    // Explicit hierarchy stack for back(), independent of the browser's own session
    // history. Raw history.back() also replays lateral taps between sibling detail
    // screens (e.g. two different offers opened one after another from the same
    // player) — hitting back would resurrect the first offer instead of popping up
    // to the screen that led to them. Landing on a main tab clears it: main screens
    // are hierarchy roots, so no stale breadcrumb from an earlier excursion should
    // resurface later.
    navStack: [],
    _lastHash: null,
    _backNavigating: false,
    _scrollMemory: {},        // hash -> scrollTop of the screen when the user navigated away

    isFreshNav: false,   // true for a genuine navigation, false for Router.refresh() — lets a
                         // screen (e.g. ClientDetail) reset its own local state only when actually
                         // (re-)entered, not on every in-place refresh after an action

    register(name, def) { this.screens[name] = def; },

    start() {
        window.addEventListener('hashchange', () => this.route(true));
        this._wireHardwareBack();
        this.route(true);
    },
    // Capacitor's bridge is normally ready before page scripts run, but this costs
    // nothing if it's ready immediately and guards against it not being — without
    // this listener the hardware button falls through to the WebView's own default
    // (history.back()), silently undoing the fix below.
    _wireHardwareBack(triesLeft) {
        triesLeft = triesLeft == null ? 20 : triesLeft;
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('backButton', () => this.hardwareBack());
        } else if (triesLeft > 0) {
            setTimeout(() => this._wireHardwareBack(triesLeft - 1), 100);
        }
    },
    parse() {
        const h = (location.hash || '#home').replace(/^#/, '');
        const [name, ...rest] = h.split('/');
        return { name: name || 'home', params: rest.map(s => decodeURIComponent(s)) };
    },
    // build a safe href for a route with an id that may contain spaces/unicode (e.g. club ids)
    link(name, id) { return `#${name}/${encodeURIComponent(id)}`; },
    go(hash) { if (location.hash === '#' + hash) { this.route(true); return; } location.hash = hash; },
    // An explicit fallback (e.g. Router.back('inbox') after resolving a mail item) is
    // a deliberate destination the caller wants regardless of how this screen was
    // reached — it takes priority over the hierarchy stack, not the other way round.
    // Only the plain Router.back() used by the back arrow/hardware button (no
    // fallback) walks the stack.
    back(fallback) {
        if (fallback) { this.navStack.length = 0; this.go(fallback); return; }
        const prev = this.navStack.pop();
        if (prev != null) { this._backNavigating = true; this.go(prev); return; }
        // Nothing stacked (deep link, or siblings collapsed away): go UP to this screen's declared
        // parent rather than dumping the user on the last main tab they happened to visit.
        const up = this.parentHash();
        if (up != null) { this._backNavigating = true; this.go(up); return; }
        this.go(this.lastMain);
    },
    // a screen's logical parent: def.parent is either a hash string or (params) => hash
    parentHash() {
        const def = this.screens[this.current];
        if (!def || def.parent == null) return null;
        try {
            const p = typeof def.parent === 'function' ? def.parent(this.parse().params) : def.parent;
            return p || null;
        } catch (e) { return null; }
    },
    // Android hardware back button: mirrors the in-app back arrow's hierarchy rather
    // than the WebView's own history.back() (which has the same ping-pong problem —
    // see navStack above). Falls through to Home, then exits, matching how Android
    // users expect the back button to behave.
    hardwareBack() {
        const def = this.screens[this.current];
        if (this.navStack.length || (def && !def.isMain)) { this.back(); return; }
        if (this.current !== 'home') { this.go('home'); return; }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) window.Capacitor.Plugins.App.exitApp();
    },
    refresh() { this.route(false); },

    route(isNav) {
        const { name, params } = this.parse();
        const def = this.screens[name];
        if (!def) { this.go('home'); return; }
        let restoreScroll = null;
        if (isNav) {
            const newHash = location.hash.replace(/^#/, '');
            // remember how far the screen we're leaving was scrolled, so backing into it
            // later (back arrow / hardware back) lands exactly where the user left off -
            // e.g. cup view -> club -> back should not jump to the top of the bracket
            if (this._lastHash != null && this._lastHash !== newHash) {
                const scr = document.querySelector('.screen');
                if (scr) {
                    if (Object.keys(this._scrollMemory).length > 50) this._scrollMemory = {};
                    this._scrollMemory[this._lastHash] = scr.scrollTop;
                }
                // Moving sideways between screens of the SAME kind (mail -> mail, club -> club) is
                // browsing siblings, not going a level deeper — don't stack those. Otherwise clicking
                // through a player's eight loan offers and pressing back rewinds all eight in reverse
                // instead of returning to the player you opened them from.
                if (!this._backNavigating && String(this._lastHash).split('/')[0] !== newHash.split('/')[0]) {
                    this.navStack.push(this._lastHash);
                }
            }
            if (this._backNavigating && this._scrollMemory[newHash] != null) restoreScroll = this._scrollMemory[newHash];
            this._backNavigating = false;
            this._lastHash = newHash;
        }
        this.isFreshNav = !!isNav;
        if (def.isMain) { this.lastMain = name; this.navStack.length = 0; }
        this.current = name;
        this.closeSheet(); this.closeModal();
        // renderShell() tears down and rebuilds the whole .screen subtree on every call,
        // including a plain in-place refresh (toggling a row, submitting an action) - a
        // freshly created element always starts at scrollTop 0, which reads as an
        // unwanted jump back to the top. Only a genuine navigation should land at the
        // top of the (new) screen; a refresh should leave the reader exactly where they were.
        const oldScreen = !isNav && document.querySelector('.screen');
        const prevScroll = oldScreen ? oldScreen.scrollTop : 0;
        this.renderShell(name, def, params);
        if (isNav) {
            if (restoreScroll != null) {
                const newScreen = document.querySelector('.screen');
                if (newScreen) newScreen.scrollTop = restoreScroll;
            } else {
                window.scrollTo(0, 0);
            }
        } else {
            const newScreen = document.querySelector('.screen');
            if (newScreen) newScreen.scrollTop = prevScroll;
        }
    },

    title(def, params) { return typeof def.title === 'function' ? def.title(params) : def.title; },

    inboxButton() {
        const unread = (typeof GameState !== 'undefined' && GameState.unreadCount) ? GameState.unreadCount() : 0;
        return `<a class="icon-btn" href="#inbox" aria-label="Inbox"><i class="ti ti-inbox" style="font-size:18px"></i>${unread ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : ''}</a>`;
    },
    // plain "?" rather than a vendored icon glyph — sidesteps needing to add a new
    // glyph to the trimmed self-hosted icon font just for this one button
    helpButton() {
        return `<a class="icon-btn" href="#" onclick="event.preventDefault();Setup.openHelp()" aria-label="How to play"><span style="font-size:15px;font-weight:var(--weight-semibold)">?</span></a>`;
    },
    navHTML(active) {
        return `<nav class="bottom-nav">${this.NAV.map(([id, icon, label]) =>
            `<a class="nav-item ${active === id ? 'is-active' : ''}" href="#${id}"><i class="ti ${icon}" style="font-size:var(--nav-icon)"></i><span>${label}</span></a>`).join('')}</nav>`;
    },

    // persistent Balance / this-week ± / Reputation strip — sits in the top bar itself, between the
    // page title and the inbox icon, on every screen, since you need to see both while buying things
    // (upgrades, scouts, gifts…) wherever you are in the app
    financeStrip() {
        const ag = (typeof GameState !== 'undefined') ? GameState.agency : null;
        if (!ag) return '';
        const net = this.lastWeekNet;
        const netColor = net == null ? 'var(--text-faint)' : net >= 0 ? 'var(--state-good)' : 'var(--state-bad)';
        const netText = net == null ? '—' : (net >= 0 ? '+€' : '−€') + UI.abbr(Math.abs(net));
        return `<a class="hdr-finance" href="#finance" aria-label="Finances">
            <span class="hf-item"><i class="ti ti-wallet"></i>${UI.eabbr(ag.balance)}</span>
            <span class="hf-item" style="color:${netColor}"><i class="ti ${net == null || net >= 0 ? 'ti-trending-up' : 'ti-trending-down'}"></i>${netText}</span>
            <span class="hf-item"><i class="ti ti-award"></i>${Math.round(ag.reputation)}</span>
        </a>`;
    },

    renderShell(name, def, params) {
        const app = document.getElementById('app');
        let chrome;
        if (def.isMain) {
            chrome = `<div class="app-bar"><span class="app-bar__title app-bar__title--shrink">${this.title(def, params)}</span>${this.helpButton()}${this.financeStrip()}${this.inboxButton()}</div>`;
        } else {
            chrome = `<div class="push-bar"><button class="push-bar__back" onclick="Router.back()" aria-label="Back"><i class="ti ti-chevron-left" style="font-size:24px"></i></button><span class="push-bar__title">${this.title(def, params)}</span>${this.helpButton()}${this.financeStrip()}${this.inboxButton()}</div>`;
        }
        app.innerHTML = `<div class="screen ${def.isMain ? '' : 'screen--push'}">${chrome}<div id="screenBody"></div></div>${def.isMain ? this.navHTML(name) : ''}<div id="sheetLayer"></div><div id="modalLayer"></div>`;
        def.render(document.getElementById('screenBody'), params || []);
    },

    // ---- generic action-result banner: screens include <div id="actionResult"></div>.
    // A sheet/modal can overlay a screen that also has one, so look there first when open.
    result(msg, cls) {
        const sheet = document.getElementById('sheetLayer'), modal = document.getElementById('modalLayer');
        const scope = (sheet && sheet.innerHTML) ? sheet : (modal && modal.innerHTML) ? modal : document;
        const el = scope.querySelector ? scope.querySelector('#actionResult') : document.getElementById('actionResult');
        if (el) el.innerHTML = `<div class="result ${cls}">${msg}</div>`;
    },

    // ---- bottom sheet (quick pickers / confirmations) ----
    sheet(html) {
        const layer = document.getElementById('sheetLayer'); if (!layer) return;
        layer.innerHTML = `<div class="sheet-backdrop" onclick="if(event.target===this)Router.closeSheet()"><div class="sheet">${html}</div></div>`;
    },
    closeSheet() { const layer = document.getElementById('sheetLayer'); if (layer) layer.innerHTML = ''; },

    // ---- centred modal (used for the week summary + simple confirms) ----
    // Tapping the backdrop (the dead space around the card) forwards the tap to the
    // card's own root element, so "tap anywhere to continue" also covers that space
    // instead of only the card itself — same intent as the sheet's tap-to-close, but
    // routed through whatever action the card's content already wires up (continue,
    // next spotlight, etc.) rather than a hardcoded close.
    modal(html) {
        const layer = document.getElementById('modalLayer'); if (!layer) return;
        layer.innerHTML = `<div class="modal-backdrop" onclick="Router._tapModalBackdrop(event)"><div class="modal-card">${html}</div></div>`;
    },
    _tapModalBackdrop(event) {
        if (event.target !== event.currentTarget) return;
        const inner = event.currentTarget.querySelector('.modal-card > *');
        if (inner) inner.click(); else Router.closeModal();
    },
    closeModal() { const layer = document.getElementById('modalLayer'); if (layer) layer.innerHTML = ''; }
};
