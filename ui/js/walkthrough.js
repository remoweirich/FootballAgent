// ============================================================
//  Walkthrough — the first-run interactive tutorial.
//
//  It runs on the REAL screens, not mock-ups: a scripted demo save is swapped into GameState for
//  the duration, so every tab (Potential / Morale / Injuries / Contract / History) renders through
//  the normal code and the tutorial can never drift out of sync with the UI.
//
//  Nothing is persisted while it runs. GameState.save() has ~66 call sites, so rather than guard
//  each one, GameState.demoMode short-circuits save() itself (see js/game-state.js) — the player's
//  own save cannot be touched. On finish/skip the snapshotted fields are put back verbatim.
//
//  A step highlights a DOM element by CSS selector and dims everything else with four backdrop
//  panes around it, which leaves the highlighted element genuinely tappable while the rest of the
//  screen is inert. That is how "tap the inbox" steps work: the player performs the real action.
// ============================================================
const Walkthrough = {
    KEY: 'walkthroughDone',       // Prefs flag: device-scoped, so it runs once per device
    _active: false,
    _i: 0,
    _saved: null,                 // snapshot of the real GameState fields we replace
    _tick: null,                  // reposition poll
    _steps: [],

    // ---- lifecycle -------------------------------------------------------------------------
    done() { return (typeof Prefs !== 'undefined') && Prefs.get(this.KEY, false) === true; },
    markDone() { if (typeof Prefs !== 'undefined') Prefs.set(this.KEY, true); },

    // Offered automatically the first time a new game reaches Home. Replayable from Settings.
    maybeOffer() {
        if (this.done() || this._active) return false;
        if (typeof GameState === 'undefined' || !GameState.agency) return false;
        this.start();
        return true;
    },

    start() {
        if (this._active) return;
        this._active = true;
        this._i = 0;
        this._installDemo();
        this._steps = this.SCRIPT.slice();
        this._injectCSS();
        this._layer();
        if (typeof Router !== 'undefined') Router.go('home');
        // let the home render settle before measuring the first target
        setTimeout(() => this._show(), 60);
        this._tick = setInterval(() => this._position(), 220);
    },

    // Leave the tutorial: put the player's own game back exactly as it was, then land on Home.
    finish(skipped) {
        if (!this._active) return;
        this._active = false;
        clearInterval(this._tick); this._tick = null;
        this._restore();
        this.markDone();
        const l = document.getElementById('wtLayer'); if (l) l.remove();
        if (typeof Router !== 'undefined') { Router.closeSheet(); Router.closeModal(); Router.go('home'); Router.refresh(); }
        if (!skipped && typeof Router !== 'undefined') Router.result(I18n.t('wt.finished'), 'ok');
    },
    skip() { this.finish(true); },

    // ---- demo save -------------------------------------------------------------------------
    // Replace only the fields the tutorial shows. league/clubHistory and the rest stay as they are,
    // so screens that read them keep working; restoring puts the original references straight back.
    FIELDS: ['players', 'inbox', 'log', 'week', 'seasonStartYear', 'agency'],

    _installDemo() {
        const G = GameState;
        this._saved = {};
        this.FIELDS.forEach(f => { this._saved[f] = G[f]; });
        G.demoMode = true;                     // blocks every save() while the tutorial runs

        // Season 30/31, late in the campaign: Johan has 32 appearances behind him.
        G.seasonStartYear = 2030;
        G.week = 36;
        G.log = [];
        G.agency = Object.assign({}, this._saved.agency, {
            balance: 1850000,
            reputation: 58,
        });
        G.players = [this._demoPlayer()];
        G.inbox = [];
        // newest first, so the welcome sits on top
        const vars = { agency: G.agency.name };
        Walkthrough.STARTER_MAILS.forEach(m => G.addMail({ kind: m.kind, subject: I18n.t(m.subj, vars), body: I18n.t(m.body, vars), ttl: 99 }));
    },

    _restore() {
        const G = GameState;
        if (this._saved) this.FIELDS.forEach(f => { G[f] = this._saved[f]; });
        this._saved = null;
        G.demoMode = false;
    },

    // Built through the real PlayerGen so every field the seven tabs read exists in the right
    // shape; only the values the script names are overridden.
    _demoPlayer() {
        const club = Clubs.getClubById('Bayern Munich');
        const p = PlayerGen.makePlayer(club, { ability: 92, age: 24, position: 'CAM' });
        p.id = 'wt_johan';
        p.name = 'Johan Maradona';
        p.nationality = 'Switzerland';
        p.nationalityFlag = (typeof getNationalityFlag === 'function') ? getNationalityFlag('Switzerland') : '';
        p.clubId = 'Bayern Munich';
        p.squadRole = 'star';
        p.ability = 92; p.peakAbility = 92; p.potential = 96;
        p.wage = 250000;
        p.contractUntilSeason = 2031;          // -> "31/32"
        p.agentId = 'me';
        p.repUntilSeason = 2033;               // -> "33/34"
        p.repExpired = false;
        p.wageCommission = 0.08;
        p.sponsorCommission = 0.09;
        p.transferListed = false; p.loanListed = false;
        p.onLoanAt = null; p.loanUntilSeason = null;
        p.morale = { club: 47, time: 100, wage: 59, agent: 83 };
        p.bond = 38;                            // 25-49 -> "Trusted"
        p.personality = { primary: 'professional', secondary: 'homebody', revP: true, revS: false };
        // Ambition and life are deliberately left unknown -> the Morale tab shows its own
        // "ask him sometime" / "on his own for now" copy, which is what the script asks for.
        p.facts = { boyhoodClub: 'Basel', boyhoodKnown: true };
        p.injury = { type: 'Ankle sprain', weeksOut: 3, total: 3, specialistUsed: false, treatedWeek: null };
        p.injuryHistory = [{ type: 'Hamstring tear', weeks: 22, season: '26/27' }];
        p.styleRole = 'attacking_midfielder';
        p.scoutQuality = 78;
        p.report = {
            role: 'attacking_midfielder',
            ceiling: 'International Superstar',
            floor: 'International Regular',
        };
        p.stats = this._demoStats();
        p.trophies = [];
        return p;
    },

    // Career: Basel U21 23/24 · Basel (U21 + first team) 24/25 · Basel 25/26 · Stuttgart 26/27-27/28
    // · München Red 28/29-30/31 (third season, current). Age 17 at the first U21 season -> 24 now.
    _demoStats() {
        const st = {};
        const line = (year, clubId, loan, youth, apps, goals, assists, yellow, red, avg) => {
            if (!st[year]) st[year] = {};
            const key = clubId + (loan ? '|L' : '');
            st[year][key] = {
                clubId, loan: !!loan, youth: !!youth, order: year * 100,
                comps: { league: { apps, goals, assists, cs: 0, yellow, red, ratingSum: +(avg * apps).toFixed(2) } }
            };
        };
        line(2023, 'Basel U21', false, true, 24, 6, 5, 1, 0, 6.90);
        line(2024, 'Basel U21', false, true, 10, 4, 3, 0, 0, 7.30);
        line(2024, 'Basel', false, false, 19, 5, 4, 2, 0, 7.05);
        line(2025, 'Basel', false, false, 33, 11, 9, 3, 0, 7.42);
        line(2026, 'Stuttgart', false, false, 14, 4, 3, 1, 0, 7.31);   // hamstring tear cost him 22 weeks
        line(2027, 'Stuttgart', false, false, 34, 13, 11, 4, 1, 7.68);
        line(2028, 'Bayern Munich', false, false, 31, 12, 10, 3, 0, 7.84);
        line(2029, 'Bayern Munich', false, false, 35, 16, 13, 2, 0, 8.05);
        line(2030, 'Bayern Munich', false, false, 32, 14, 12, 2, 0, 8.38);   // current season
        return st;
    },

    // Two mails every new save starts with (also seeded in GameState.startNewGame).
    STARTER_MAILS: [
        { kind: 'news', subj: 'mail.welcome.subj', body: 'mail.welcome.body' },
        { kind: 'news', subj: 'mail.basics.subj', body: 'mail.basics.body' },
    ],

    // ---- the script ------------------------------------------------------------------------
    // target : CSS selector to highlight (null = narration over a dimmed screen)
    // tap    : the player must tap the target to advance (the real action happens)
    // until  : advance only once this predicate is true (free roam meanwhile)
    // go     : navigate here before showing the step
    SCRIPT: [
        // ---------------- Home ----------------
        { key: 'wt.home.intro', go: 'home' },
        { key: 'wt.home.attention', target: '[data-wt="attention"]' },
        { key: 'wt.home.inbox', target: 'a.icon-btn[href="#inbox"]', tap: true },

        // ---------------- Inbox ----------------
        { key: 'wt.inbox.intro', target: '[data-wt="inbox-list"]' },
        {
            key: 'wt.inbox.read', target: '[data-wt="inbox-list"]',
            until: () => GameState.inbox.length > 0 && GameState.inbox.every(m => m.read)
        },
        { key: 'wt.inbox.back', target: '.push-bar__back', tap: true },

        // ---------------- Home -> Clients ----------------
        { key: 'wt.home.clients', go: 'home', target: '[data-wt="clients-field"]' },
        { key: 'wt.home.clientsTab', target: 'a.nav-item[href="#clients"]', tap: true },

        // ---------------- Clients list ----------------
        { key: 'wt.clients.general', target: '[data-wt="cl-general"]' },
        { key: 'wt.clients.stats', target: '.cl-stats' },
        { key: 'wt.clients.morale', target: '[data-wt="cl-morale"]' },
        { key: 'wt.clients.open', target: 'a.cl-card', tap: true },

        // ---------------- Client detail: overview ----------------
        { key: 'wt.client.overview' },
        { key: 'wt.client.transferList', target: 'button[onclick*="toggleTL"]' },
        { key: 'wt.client.shop', target: 'button[onclick*="openShop"]' },
        { key: 'wt.client.loan', target: 'button[onclick*="reqLoan"]' },
        { key: 'wt.client.youth', target: 'button[onclick*="sendU21"]' },
        { key: 'wt.client.chat', target: 'button[onclick*="checkIn"]' },
        { key: 'wt.client.renew', target: 'button[onclick*="reqRenewal"]' },

        // ---------------- Potential ----------------
        { key: 'wt.client.toPotential', target: 'button.tab[onclick*="\'potential\'"]', tap: true },
        { key: 'wt.client.potential' },

        // ---------------- Morale ----------------
        { key: 'wt.client.toMorale', target: 'button.tab[onclick*="\'morale\'"]', tap: true },
        { key: 'wt.client.morale' },
        { key: 'wt.client.bond', scroll: 'bottom' },

        // ---------------- Injuries ----------------
        { key: 'wt.client.toInjuries', target: 'button.tab[onclick*="\'injuries\'"]', tap: true },
        { key: 'wt.client.injuries' },

        // ---------------- Contract ----------------
        { key: 'wt.client.toContract', target: 'button.tab[onclick*="\'contract\'"]', tap: true },
        { key: 'wt.client.contract' },

        // ---------------- Back to the list ----------------
        { key: 'wt.client.back', target: '.push-bar__back', tap: true },
        { key: 'wt.clients.filters', go: 'clients', target: '[data-wt="cl-filters"]' },
        { key: 'wt.clients.sort', target: 'button[onclick*="pickSort"]' },
        { key: 'wt.clients.history', target: 'a.gbtn[href="#clienthist"]' },
        { key: 'wt.clients.bestxi', target: 'a.gbtn[href="#bestxi"]' },
        { key: 'wt.clients.outro' },
    ],

    // ---- step machinery --------------------------------------------------------------------
    step() { return this._steps[this._i]; },

    next() {
        if (!this._active) return;
        this._i++;
        if (this._i >= this._steps.length) { this.finish(false); return; }
        this._show();
    },

    _show() {
        const s = this.step(); if (!s) { this.finish(false); return; }
        if (s.go && typeof Router !== 'undefined') {
            const cur = (location.hash || '').replace(/^#/, '').split('/')[0];
            if (cur !== s.go) Router.go(s.go);
        }
        if (s.scroll === 'bottom') {
            const scr = document.querySelector('.screen');
            if (scr) scr.scrollTo({ top: scr.scrollHeight, behavior: 'smooth' });
        }
        this._awaitTarget(s, 0);
    },

    // Screens re-render asynchronously after navigation, so wait (briefly) for the target to exist
    // rather than measuring a node that is not in the DOM yet.
    _awaitTarget(s, tries) {
        if (!this._active || this.step() !== s) return;
        if (!s.target || document.querySelector(s.target) || tries > 40) { this._paint(); return; }
        setTimeout(() => this._awaitTarget(s, tries + 1), 60);
    },

    // The "until" steps let the player roam freely; poll the predicate and move on when satisfied.
    _pollUntil() {
        const s = this.step();
        if (!s || !s.until) return;
        let ok = false;
        try { ok = !!s.until(); } catch (e) { ok = false; }
        if (ok) this.next();
    },

    // ---- rendering -------------------------------------------------------------------------
    _layer() {
        let l = document.getElementById('wtLayer');
        if (l) return l;
        l = document.createElement('div');
        l.id = 'wtLayer';
        l.innerHTML = `
            <div class="wt-pane" data-p="t"></div><div class="wt-pane" data-p="b"></div>
            <div class="wt-pane" data-p="l"></div><div class="wt-pane" data-p="r"></div>
            <div class="wt-ring"></div>
            <div class="wt-tap"><span></span></div>
            <div class="wt-card">
                <div class="wt-progress"></div>
                <p class="wt-text"></p>
                <div class="wt-actions">
                    <button class="wt-skip" onclick="Walkthrough.skip()"></button>
                    <button class="wt-next btn btn--primary btn--sm" onclick="Walkthrough.next()"></button>
                </div>
            </div>`;
        document.body.appendChild(l);
        return l;
    },

    _paint() {
        const l = this._layer(), s = this.step(); if (!s) return;
        l.querySelector('.wt-text').innerHTML = I18n.t(s.key);
        l.querySelector('.wt-skip').textContent = I18n.t('wt.skip');
        const nextBtn = l.querySelector('.wt-next');
        const gated = !!(s.tap || s.until);
        nextBtn.hidden = gated;
        nextBtn.textContent = I18n.t(this._i >= this._steps.length - 1 ? 'wt.done' : 'wt.next');
        l.querySelector('.wt-progress').textContent = I18n.t('wt.step', { n: this._i + 1, total: this._steps.length });
        l.classList.toggle('wt-gated', gated);
        this._position();
    },

    // Lay the four dim panes around the target's rect, leaving it exposed and tappable.
    _position() {
        if (!this._active) return;
        const l = document.getElementById('wtLayer'); const s = this.step();
        if (!l || !s) return;
        if (s.until) this._pollUntil();
        const el = s.target ? document.querySelector(s.target) : null;
        const ring = l.querySelector('.wt-ring'), tap = l.querySelector('.wt-tap'), card = l.querySelector('.wt-card');
        const W = window.innerWidth, H = window.innerHeight;
        const pane = (p, x, y, w, h) => {
            const d = l.querySelector(`.wt-pane[data-p="${p}"]`);
            d.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`;
        };
        if (!el) {   // narration: dim everything, centre the card
            pane('t', 0, 0, W, H); pane('b', 0, H, W, 0); pane('l', 0, 0, 0, 0); pane('r', 0, 0, 0, 0);
            ring.style.display = 'none'; tap.style.display = 'none';
            card.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%)';
            return;
        }
        const r = el.getBoundingClientRect(), pad = 6;
        const x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
        pane('t', 0, 0, W, y);
        pane('b', 0, y + h, W, H - (y + h));
        pane('l', 0, y, x, h);
        pane('r', x + w, y, W - (x + w), h);
        ring.style.display = 'block';
        ring.style.cssText += `;display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
        if (s.tap) {
            tap.style.display = 'block';
            tap.style.cssText += `;display:block;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px`;
        } else tap.style.display = 'none';
        // card goes under the target when there is room, otherwise above it
        const below = H - (y + h) > 190;
        card.style.cssText = below
            ? `left:50%;transform:translateX(-50%);top:${Math.min(y + h + 14, H - 180)}px`
            : `left:50%;transform:translateX(-50%);top:${Math.max(12, y - 174)}px`;
    },

    _injectCSS() {
        if (document.getElementById('wtCSS')) return;
        const css = `
        #wtLayer{position:fixed;inset:0;z-index:150;pointer-events:none}
        .wt-pane{position:fixed;background:rgba(4,7,11,.76);pointer-events:auto}
        .wt-ring{position:fixed;display:none;border:2px solid var(--accent);border-radius:var(--radius-md);
            box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 28%, transparent);pointer-events:none;
            transition:left .18s,top .18s,width .18s,height .18s}
        .wt-tap{position:fixed;display:none;width:0;height:0;pointer-events:none}
        .wt-tap span{position:absolute;left:-19px;top:-19px;width:38px;height:38px;border-radius:50%;
            border:2px solid var(--accent);animation:wtPulse 1.4s ease-out infinite}
        @keyframes wtPulse{0%{transform:scale(.55);opacity:.95}100%{transform:scale(1.5);opacity:0}}
        .wt-card{position:fixed;width:min(92vw,400px);background:var(--surface);color:var(--text);
            border:1px solid var(--line-strong);border-radius:var(--radius-lg);padding:var(--space-5);
            box-shadow:0 14px 44px rgba(0,0,0,.5);pointer-events:auto}
        .wt-progress{font-size:var(--fs-xs);color:var(--text-dim);text-transform:uppercase;
            letter-spacing:var(--tracking-caps);margin-bottom:6px}
        .wt-text{margin:0 0 var(--space-4);font-size:var(--fs-lg);line-height:1.55}
        .wt-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .wt-skip{background:none;border:none;color:var(--text-dim);font:inherit;font-size:var(--fs-sm);
            cursor:pointer;padding:6px 2px;text-decoration:underline}
        .wt-gated .wt-next{display:none}`;
        const st = document.createElement('style'); st.id = 'wtCSS'; st.textContent = css;
        document.head.appendChild(st);
    },
};

// A tap on a highlighted target advances the tutorial: the real click runs first (navigating,
// switching tab, opening the player), then the script moves to its next line.
document.addEventListener('click', (e) => {
    if (!Walkthrough._active) return;
    const s = Walkthrough.step();
    if (!s || !s.tap || !s.target) return;
    const el = document.querySelector(s.target);
    if (el && (e.target === el || el.contains(e.target))) setTimeout(() => Walkthrough.next(), 120);
}, true);

if (typeof module !== 'undefined' && module.exports) module.exports = Walkthrough;
