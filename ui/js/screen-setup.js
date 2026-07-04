// ============================================================
//  First-run setup — picks a home country + names the agency,
//  then boots GameState.startNewGame(...) and the router.
//  Runs before any save exists, so it bypasses the Router shell.
// ============================================================
const Setup = {
    slides: [
        { icon: '🤝', title: "You're a football agent", text: "You don't manage a club — you build a stable of players. Discover talents, sign them as clients, and earn a cut of their wages and sponsorship deals as their careers take off." },
        { icon: '🕵️', title: 'Find the talent', text: 'Hire scouts and post them to a region at home (or, with an International Scouting Licence, to a foreign league). Every few weeks they report young prospects. Better scouts — and stronger leagues — turn up better players.' },
        { icon: '✍️', title: 'Sign your clients', text: 'Approach a prospect to represent him, then negotiate his move and contract: the club, the role, the wage. From then on you collect commission on his wage and sponsorships every single week.' },
        { icon: '📈', title: 'Game time makes them grow', text: 'Players improve mainly by playing. Steer your youngsters to the right club and role — or out on loan — so they get regular minutes and approach their potential.' },
        { icon: '🏢', title: 'Grow your agency', text: 'Wins and big moves build your reputation, which unlocks bigger clients, more scouts and better facilities. Reinvest your commission in upgrades.' },
        { icon: '🗓️', title: 'Play week by week', text: 'Advance the week to roll matches, offers, development and scouting forward. Deals happen in the transfer windows (weeks 1–6 and 21–25).' }
    ],
    idx: 0,

    show() {
        const countries = (typeof REGIONS_BY_COUNTRY !== 'undefined') ? Object.keys(REGIONS_BY_COUNTRY) : ['Netherlands'];
        const opts = countries.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('app').innerHTML = `<div class="setup-wrap"><div class="setup-card">
            <h1>⚽ Football Agent Manager</h1>
            <div class="howto">
                <div id="howtoSlide"></div>
                <div class="howto-nav">
                    <button class="howto-btn" id="htPrev" aria-label="Previous"><i class="ti ti-chevron-left"></i></button>
                    <div class="howto-dots" id="htDots"></div>
                    <button class="howto-btn" id="htNext" aria-label="Next"><i class="ti ti-chevron-right"></i></button>
                </div>
            </div>
            <label class="field-label">Agency name</label>
            <input id="setupName" class="text-input" type="text" maxlength="32" placeholder="e.g. Oranje Sports Management">
            <label class="field-label">Home country</label>
            <select id="setupCountry" class="select-input">${opts}</select>
            <p class="hint" style="margin-top:var(--space-3)">Your home country sets the talents you start with and the regions your scouts can cover. Unlock other countries later with an International Scouting Licence.</p>
            <button class="btn btn--primary" style="margin-top:var(--space-6)" id="setupStart"><i class="ti ti-player-play"></i>Start your agency</button>
        </div></div>`;

        this.idx = 0;
        this.renderSlide();
        document.getElementById('htPrev').addEventListener('click', () => { if (this.idx > 0) { this.idx--; this.renderSlide(); } });
        document.getElementById('htNext').addEventListener('click', () => { this.idx = (this.idx + 1) % this.slides.length; this.renderSlide(); });
        document.getElementById('setupStart').addEventListener('click', () => this.start());
    },
    renderSlide() {
        const s = this.slides[this.idx];
        document.getElementById('howtoSlide').innerHTML = `<div class="howto-icon">${s.icon}</div><h3>${s.title}</h3><p>${s.text}</p>`;
        document.getElementById('htDots').innerHTML = this.slides.map((_, i) => `<span class="ht-dot ${i === this.idx ? 'on' : ''}" data-i="${i}"></span>`).join('');
        document.getElementById('htDots').querySelectorAll('.ht-dot').forEach(d => d.addEventListener('click', () => { this.idx = +d.dataset.i; this.renderSlide(); }));
        document.getElementById('htPrev').disabled = this.idx === 0;
    },
    start() {
        const name = document.getElementById('setupName').value;
        const country = document.getElementById('setupCountry').value;
        GameState.startNewGame(country, name);
        Main.afterLoad();
    }
};
