// ============================================================
//  Achievements — a full-screen takeover reached from Settings.
//  Lists every milestone grouped by theme; unlocked ones show a
//  Collect button that banks the euro reward. Also carries the
//  client tally (trophies / promotions / relegations).
// ============================================================
const AchievementsScreen = {
    _from: 'game',
    show(settingsFrom) {
        this._from = settingsFrom || 'game';
        if (typeof Achievements === 'undefined') return;
        Achievements.refresh();
        if (typeof SettingsScreen !== 'undefined' && SettingsScreen._injectCSS) SettingsScreen._injectCSS();
        this._injectCSS();
        const c = Achievements.counts(), tal = Achievements.tallies(), claim = Achievements.claimable();
        const defs = Achievements._buildDefs(), s = Achievements.state();
        const byGroup = {}; defs.forEach(d => (byGroup[d.group] = byGroup[d.group] || []).push(d));
        const groups = Achievements.GROUP_ORDER.filter(g => byGroup[g]);
        const claimTotal = claim.reduce((sum, d) => sum + d.reward, 0);

        const collectAll = claim.length
            ? `<button class="btn btn--primary" style="width:100%;margin-top:10px" onclick="AchievementsScreen.collectAll()"><i class="ti ti-coin"></i>${I18n.t('ach.collectAll', { v: UI.euro(claimTotal) })}</button>`
            : '';
        const summary = `<div class="ach-summary">
            <div class="ach-prog"><div class="ach-progbar"><div style="width:${c.total ? Math.round(c.unlocked / c.total * 100) : 0}%"></div></div>
            <span class="ach-progtxt">${I18n.t('ach.progress', { n: c.unlocked, total: c.total })}</span></div>
            ${collectAll}</div>`;

        const tallyCard = `<div class="set-heading">${I18n.t('ach.tally.title')}</div>
            <div class="ach-tallies">
                ${this._tally('ti-trophy', 'var(--gold)', tal.trophies, I18n.t('ach.tally.trophies'))}
                ${this._tally('ti-arrow-up-circle', 'var(--state-good)', tal.promotions, I18n.t('ach.tally.promotions'))}
                ${this._tally('ti-arrow-down-circle', 'var(--state-bad)', tal.relegations, I18n.t('ach.tally.relegations'))}
            </div>`;

        const sections = groups.map(g => {
            const rows = byGroup[g].map(d => this._row(d, s)).join('');
            return `<div class="set-heading">${I18n.t('ach.grp.' + g)}</div><div class="set-group">${rows}</div>`;
        }).join('');

        document.getElementById('app').innerHTML = `<div class="set-wrap">
            <div class="set-bar">
                <button class="set-close" onclick="AchievementsScreen.back()" aria-label="Back"><i class="ti ti-chevron-left" style="font-size:24px"></i></button>
                <span class="set-title">${I18n.t('settings.achievements')}</span>
            </div>
            <div class="set-body">${summary}${tallyCard}${sections}</div>
        </div>`;
    },
    _tally(icon, color, n, label) {
        return `<div class="ach-tally"><i class="ti ${icon}" style="color:${color}"></i><span class="ach-tallyn">${n}</span><span class="ach-tallylbl">${label}</span></div>`;
    },
    _row(d, s) {
        const unlocked = !!s.unlocked[d.id], collected = !!s.collected[d.id];
        const name = I18n.t(d.key, d.vars);
        const reward = UI.euro(d.reward);
        let right;
        if (collected) right = `<span class="ach-collected">${I18n.t('ach.collected')} <i class="ti ti-check"></i></span>`;
        else if (unlocked) right = `<button class="ach-collect" onclick="AchievementsScreen.collect('${d.id}')">${I18n.t('ach.collect')} · ${reward}</button>`;
        else right = `<span class="ach-reward">${reward}</span>`;
        const icon = collected ? 'ti-circle-check-filled' : unlocked ? 'ti-gift' : 'ti-lock';
        const iconCol = collected ? 'var(--state-good)' : unlocked ? 'var(--accent)' : 'var(--text-dim)';
        return `<div class="ach-row${unlocked ? '' : ' ach-row--locked'}">
            <i class="ti ${icon} ach-ico" style="color:${iconCol}"></i>
            <span class="ach-name">${name}</span>${right}</div>`;
    },
    collect(id) {
        const r = Achievements.collect(id);
        if (r.ok) { if (GameState.save) GameState.save(); if (typeof Sound !== 'undefined') Sound.play('cash'); }
        this.show(this._from);
    },
    collectAll() {
        const r = Achievements.collectAll();
        if (r.n) { if (GameState.save) GameState.save(); if (typeof Sound !== 'undefined') Sound.play('cash'); if (typeof Router !== 'undefined' && Router.result) Router.result(I18n.t('ach.collectedAll', { n: r.n, v: UI.euro(r.total) }), 'ok'); }
        this.show(this._from);
    },
    back() { if (typeof SettingsScreen !== 'undefined') SettingsScreen.show(this._from); },

    _injectCSS() {
        if (document.getElementById('achCSS')) return;
        const css = `
        .ach-summary{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}
        .ach-prog{display:flex;align-items:center;gap:10px}
        .ach-progbar{flex:1;height:8px;border-radius:5px;background:var(--line-strong);overflow:hidden}
        .ach-progbar>div{height:100%;background:var(--accent);transition:width .3s}
        .ach-progtxt{font-size:var(--fs-sm);color:var(--text-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}
        .ach-tallies{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .ach-tally{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:3px}
        .ach-tally i{font-size:22px}
        .ach-tallyn{font-size:var(--fs-xl);font-weight:var(--weight-bold);font-variant-numeric:tabular-nums}
        .ach-tallylbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-dim);text-align:center}
        .ach-row{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:.5px solid var(--line-faint)}
        .set-group .ach-row:last-child{border-bottom:none}
        .ach-row--locked{opacity:.55}
        .ach-ico{font-size:19px;flex:none}
        .ach-name{flex:1;min-width:0;font-size:var(--fs-sm)}
        .ach-reward{font-size:var(--fs-xs);color:var(--text-dim);white-space:nowrap;font-variant-numeric:tabular-nums}
        .ach-collected{font-size:var(--fs-xs);color:var(--state-good);white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
        .ach-collect{flex:none;background:var(--accent);border:none;color:var(--accent-ink,#04140c);border-radius:999px;padding:6px 12px;font:inherit;font-size:var(--fs-xs);font-weight:var(--weight-semibold);cursor:pointer;white-space:nowrap}
        .ach-collect:active{filter:brightness(.94)}
        .set-badge{margin-left:auto;background:var(--accent);color:var(--accent-ink,#04140c);border-radius:999px;min-width:20px;height:20px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:var(--weight-bold)}`;
        const el = document.createElement('style'); el.id = 'achCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
