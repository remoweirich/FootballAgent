// ============================================================
//  Router — tiny hash router + app shell (app-bar / bottom-nav /
//  pushed-screen header) + shared sheet/modal helpers.
//  Screens register with Router.register(name, def) where def is:
//    { isMain: bool, title: string | (params)=>string, render(el, params) }
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

    register(name, def) { this.screens[name] = def; },

    start() {
        window.addEventListener('hashchange', () => this.route());
        this.route();
    },
    parse() {
        const h = (location.hash || '#home').replace(/^#/, '');
        const [name, ...rest] = h.split('/');
        return { name: name || 'home', params: rest.map(s => decodeURIComponent(s)) };
    },
    // build a safe href for a route with an id that may contain spaces/unicode (e.g. club ids)
    link(name, id) { return `#${name}/${encodeURIComponent(id)}`; },
    go(hash) { if (location.hash === '#' + hash) this.route(); else location.hash = hash; },
    back(fallback) { if (window.history.length > 1) window.history.back(); else this.go(fallback || this.lastMain); },
    refresh() { this.route(); },

    route() {
        const { name, params } = this.parse();
        const def = this.screens[name];
        if (!def) { this.go('home'); return; }
        if (def.isMain) this.lastMain = name;
        this.current = name;
        this.closeSheet(); this.closeModal();
        this.renderShell(name, def, params);
        window.scrollTo(0, 0);
    },

    title(def, params) { return typeof def.title === 'function' ? def.title(params) : def.title; },

    inboxButton() {
        const unread = (typeof GameState !== 'undefined' && GameState.unreadCount) ? GameState.unreadCount() : 0;
        return `<a class="icon-btn" href="#inbox" aria-label="Inbox"><i class="ti ti-inbox" style="font-size:18px"></i>${unread ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : ''}</a>`;
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
            chrome = `<div class="app-bar"><span class="app-bar__title app-bar__title--shrink">${this.title(def, params)}</span>${this.financeStrip()}${this.inboxButton()}</div>`;
        } else {
            chrome = `<div class="push-bar"><button class="push-bar__back" onclick="Router.back()" aria-label="Back"><i class="ti ti-chevron-left" style="font-size:24px"></i></button><span class="push-bar__title">${this.title(def, params)}</span>${this.financeStrip()}${this.inboxButton()}</div>`;
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
    modal(html) {
        const layer = document.getElementById('modalLayer'); if (!layer) return;
        layer.innerHTML = `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`;
    },
    closeModal() { const layer = document.getElementById('modalLayer'); if (layer) layer.innerHTML = ''; }
};
