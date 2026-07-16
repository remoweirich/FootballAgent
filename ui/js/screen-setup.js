// ============================================================
//  First-run setup — picks a home country + names the agency,
//  then boots GameState.startNewGame(...) and the router.
//  Runs before any save exists, so it bypasses the Router shell.
// ============================================================
const Setup = {
    slides: [
        { icon: 'ti-briefcase', title: "You're a football agent", text: "You don't manage a club — you build a stable of players. Discover talents, sign them as clients, and earn a cut of their wages and sponsorship deals as their careers take off." },
        { icon: 'ti-zoom-scan', title: 'Find the talent', text: 'Hire scouts and post them to a region at home (or, with an International Scouting Licence, to a foreign league). Every few weeks they report young prospects. Better scouts — and stronger leagues — turn up better players.' },
        { icon: 'ti-file-pencil', title: 'Sign your clients', text: 'Approach a prospect to represent him, then negotiate his move and contract: the club, the role, the wage. From then on you collect commission on his wage and sponsorships every single week.' },
        { icon: 'ti-currency-euro', title: 'Game time makes them grow', text: "Players improve mainly by playing. Tap a club to see its reputation number: a player needs ability at or near that number to start regularly. A fair bit below it he's rotation at best, and well below it he's a fringe or youth option who rarely plays. Steer him to a club and role — or out on loan — where he'll actually get minutes." },
        { icon: 'ti-building', title: 'Clubs rise and fall', text: "A club's reputation isn't fixed — it drifts up and down across the seasons with results. Stack a squad with your own high-ability clients at one club and its reputation climbs to match them, lifting it up the table and eventually into Europe; let that talent leave and it fades back down. Building a small club into a powerhouse by parking your best prospects there is a long game well worth playing." },
        { icon: 'ti-heartbeat', title: 'Keep clients happy', text: "Each client tracks four moods on his Morale tab — club, playing time, wage, and how he feels about you as his agent. Good moods lift match ratings and development; bad ones drag both down. Go quiet on a client for too long and his trust in you fades, even if nothing else is wrong — stay active with deals, loans, a chat or a gift and it holds up. Ignore a real complaint and it escalates: he'll demand action, then eventually force a move or walk away from your agency altogether." },
        { icon: 'ti-arrows-transfer-up', title: 'Grow your agency', text: 'Wins and big moves build your reputation, which unlocks bigger clients, more scouts and better facilities. Reinvest your commission in upgrades.' },
        { icon: 'ti-trophy', title: 'Play week by week', text: 'Advance the week to roll matches, offers, development and scouting forward. Deals happen in the transfer windows (weeks 1–6 and 28–33).' }
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
        document.getElementById('app').innerHTML = `<div class="setup-wrap"><div class="setup-card">
            <div class="setup-brand">
                ${this.CREST}
                <div class="setup-brand__title">Football Agent Manager</div>
                <div class="setup-brand__tag">Build the stable. Take the cut.</div>
            </div>

            ${this.howtoHTML()}

            <label class="field-label"><i class="ti ti-briefcase"></i>Agency name</label>
            <input id="setupName" class="text-input" type="text" maxlength="32" placeholder="e.g. Nordvind Sports Group" autocomplete="off" autocorrect="off" spellcheck="false">

            <label class="field-label"><i class="ti ti-world"></i>Home country</label>
            <div class="select-wrap">
                <select id="setupCountry" class="select-input">${opts}</select>
                <i class="ti ti-chevron-down select-wrap__chevron"></i>
            </div>
            <p class="hint" style="margin-top:var(--space-3)">Sets your starting talents and scouting regions. Unlock more countries later with an International Scouting Licence.</p>
        </div>
        <div class="setup-cta"><button class="btn btn--primary" id="setupStart" disabled><i class="ti ti-player-play"></i>Start your agency</button></div>
        </div>`;

        this.idx = 0;
        this._measureSlideHeight();
        this.renderSlide();
        this.wireHowto();

        const nameEl = document.getElementById('setupName'), startBtn = document.getElementById('setupStart');
        nameEl.value = '';   // belt-and-braces: some browsers restore a field's last typed value
        // by id across page loads even without autocomplete data for this exact origin/field.
        startBtn.disabled = true;
        nameEl.addEventListener('input', () => { startBtn.disabled = !nameEl.value.trim(); });
        startBtn.addEventListener('click', () => this.start());
    },

    // the how-to carousel markup, shared between first-run setup and the in-app help
    // sheet (opened from the '?' in the header) so both stay in sync off one slide list
    howtoHTML() {
        return `<div class="howto" id="howtoTrack">
                <div id="howtoSlide"></div>
                <div class="howto-nav">
                    <button class="howto-btn" id="htPrev" aria-label="Previous"><i class="ti ti-chevron-left"></i></button>
                    <div class="howto-dots" id="htDots"></div>
                    <button class="howto-btn" id="htNext" aria-label="Next"><i class="ti ti-chevron-right"></i></button>
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
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">How to play</div>${this.howtoHTML()}<button class="btn btn--ghost" style="width:100%;margin-top:var(--space-2)" onclick="Router.closeSheet()">Close</button>`);
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
        return `<div class="howto-icon"><i class="ti ${s.icon}"></i></div><h3>${s.title}</h3><p>${s.text}</p>`;
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
            `<button class="ht-dot ${i === this.idx ? 'on' : ''}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
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

    start() {
        const name = document.getElementById('setupName').value.trim();
        if (!name) return;
        const country = document.getElementById('setupCountry').value;
        GameState.startNewGame(country, name);
        Main.afterLoad();
    }
};
