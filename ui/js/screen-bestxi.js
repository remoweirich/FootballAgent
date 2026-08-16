// ============================================================
//  Best XI — a hall-of-fame line-up the player builds from every
//  client he has ever represented. Pick a formation, then tap a
//  position to choose from the ex/current clients who play there.
//  Up to 7 subs. Auto-saves; changing formation clears the XI.
// ============================================================
const BestXI = {
    // ---- formation definitions ----
    // Each slot: { id, pos: [allowed positions], lab: short label, x/y: % on the pitch (y from top) }.
    // Central-mid slots accept CDM/CM/CAM; a couple of formations narrow that (see below).
    FORMATIONS: (function () {
        const P = (id, pos, lab, x, y) => ({ id, pos, lab, x, y });
        const CM = (id, x, y) => P(id, ['CDM', 'CM', 'CAM'], 'CM', x, y);      // flexible central midfielder
        const GK = P('gk', ['GK'], 'GK', 50, 90);
        return {
            '433': { name: '4-3-3', slots: [GK,
                P('rb', ['RB'], 'RB', 83, 70), P('rcb', ['CB'], 'CB', 62, 73), P('lcb', ['CB'], 'CB', 38, 73), P('lb', ['LB'], 'LB', 17, 70),
                CM('m1', 30, 48), CM('m2', 50, 45), CM('m3', 70, 48),
                P('rw', ['RW'], 'RW', 80, 16), P('st', ['ST'], 'ST', 50, 12), P('lw', ['LW'], 'LW', 20, 16)] },
            '343': { name: '3-4-3', slots: [GK,
                P('rcb', ['CB'], 'CB', 72, 72), P('cb', ['CB'], 'CB', 50, 74), P('lcb', ['CB'], 'CB', 28, 72),
                P('rwb', ['RB', 'RW'], 'W/FB', 86, 50), CM('m1', 60, 50), CM('m2', 40, 50), P('lwb', ['LB', 'LW'], 'W/FB', 14, 50),
                P('rw', ['RW'], 'RW', 80, 16), P('st', ['ST'], 'ST', 50, 12), P('lw', ['LW'], 'LW', 20, 16)] },
            '523': { name: '5-2-3', slots: [GK,
                P('rb', ['RB'], 'RB', 88, 70), P('rcb', ['CB'], 'CB', 69, 73), P('cb', ['CB'], 'CB', 50, 74), P('lcb', ['CB'], 'CB', 31, 73), P('lb', ['LB'], 'LB', 12, 70),
                CM('m1', 62, 50), CM('m2', 38, 50),
                P('rw', ['RW'], 'RW', 80, 18), P('st', ['ST'], 'ST', 50, 14), P('lw', ['LW'], 'LW', 20, 18)] },
            '4312': { name: '4-3-1-2', slots: [GK,
                P('rb', ['RB'], 'RB', 83, 72), P('rcb', ['CB'], 'CB', 62, 75), P('lcb', ['CB'], 'CB', 38, 75), P('lb', ['LB'], 'LB', 17, 72),
                CM('m1', 28, 57), CM('m2', 50, 59), CM('m3', 72, 57),
                P('am', ['CAM', 'CM'], 'AM', 50, 38),
                P('st1', ['ST'], 'ST', 63, 14), P('st2', ['ST'], 'ST', 37, 14)] },
            '442': { name: '4-4-2', slots: [GK,
                P('rb', ['RB'], 'RB', 83, 72), P('rcb', ['CB'], 'CB', 62, 75), P('lcb', ['CB'], 'CB', 38, 75), P('lb', ['LB'], 'LB', 17, 72),
                P('rm', ['RW'], 'RW', 84, 50), CM('m1', 58, 50), CM('m2', 42, 50), P('lm', ['LW'], 'LW', 16, 50),
                P('st1', ['ST'], 'ST', 63, 14), P('st2', ['ST'], 'ST', 37, 14)] },
            '4231': { name: '4-2-3-1', slots: [GK,
                P('rb', ['RB'], 'RB', 83, 74), P('rcb', ['CB'], 'CB', 62, 77), P('lcb', ['CB'], 'CB', 38, 77), P('lb', ['LB'], 'LB', 17, 74),
                P('dm1', ['CDM', 'CM'], 'DM', 38, 58), P('dm2', ['CDM', 'CM'], 'DM', 62, 58),
                P('rw', ['RW'], 'RW', 82, 37), P('am', ['CAM', 'CM'], 'AM', 50, 39), P('lw', ['LW'], 'LW', 18, 37),
                P('st', ['ST'], 'ST', 50, 13)] },
        };
    })(),
    // The bench: fixed roles (1 keeper, 2 defenders, 2 midfielders, 2 forwards).
    BENCH: [
        { id: 'bgk', pos: ['GK'], lab: 'GK' },
        { id: 'bd1', pos: ['CB', 'LB', 'RB'], lab: 'DEF' }, { id: 'bd2', pos: ['CB', 'LB', 'RB'], lab: 'DEF' },
        { id: 'bm1', pos: ['CDM', 'CM', 'CAM'], lab: 'MID' }, { id: 'bm2', pos: ['CDM', 'CM', 'CAM'], lab: 'MID' },
        { id: 'bf1', pos: ['LW', 'RW', 'ST'], lab: 'FWD' }, { id: 'bf2', pos: ['LW', 'RW', 'ST'], lab: 'FWD' },
    ],

    // ---- state (persisted on GameState) ----
    _state() {
        if (!GameState.bestXI || typeof GameState.bestXI !== 'object') GameState.bestXI = { formation: null, picks: {} };
        if (!GameState.bestXI.picks) GameState.bestXI.picks = {};
        return GameState.bestXI;
    },
    _save() { if (GameState.save) GameState.save(); },

    // every player ever represented (current + archived ex-clients)
    _everClients() { return (GameState.players || []).filter(p => p.everClient); },
    _slotById(id) {
        const f = this.FORMATIONS[this._state().formation];
        return (f && f.slots.find(s => s.id === id)) || this.BENCH.find(s => s.id === id);
    },
    _playerName(pid) { const p = GameState.getPlayer(pid); return p ? p.name : null; },
    _shortName(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        return parts.length > 1 ? parts[parts.length - 1] : name;   // surname on the pitch tile
    },
    // the club he made the most SENIOR appearances for, and its kit colours (fill = primary, outline
    // = secondary). Falls back to his current/last club, then a neutral grey.
    _clubColors(p) {
        let clubId = null;
        if (typeof careerByClub === 'function') {
            const cs = careerByClub(p).filter(c => !c.youth && c.agg.apps > 0).sort((a, b) => b.agg.apps - a.agg.apps);
            if (cs.length) clubId = cs[0].clubId;
        }
        if (!clubId) clubId = p.clubId || null;
        const club = clubId && typeof Clubs !== 'undefined' ? Clubs.getClubById(clubId) : null;
        const c = (club && club.colors) || {};
        return { primary: c.primary || '#5A626D', secondary: c.secondary || '#0F1318' };
    },
    // black or white text, whichever reads on the given fill colour
    _ink(hex) {
        const h = String(hex || '').replace('#', '');
        if (h.length < 6) return '#fff';
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0b140c' : '#ffffff';
    },

    // ---- actions ----
    selectFormation(f) {
        const st = this._state();
        if (st.formation === f) return;      // no change
        st.formation = f; st.picks = {};     // a new formation clears the line-up (by design)
        this._save();
        this._rerender();
    },
    openPicker(slotId) {
        const st = this._state();
        if (!st.formation) return;
        const slot = this._slotById(slotId); if (!slot) return;
        const placed = new Set(Object.entries(st.picks).filter(([k]) => k !== slotId).map(([, v]) => v));
        const eligible = this._everClients()
            .filter(p => slot.pos.includes(p.position) && !placed.has(p.id))
            .sort((a, b) => (b.ability || 0) - (a.ability || 0));
        const current = st.picks[slotId];
        const posLabel = slot.pos.join(' / ');
        const rows = eligible.length
            ? eligible.map(p => {
                const era = this._era(p);
                return `<button class="bx-pick ${current === p.id ? 'bx-pick--on' : ''}" onclick="BestXI.pick('${slotId}','${p.id}')">
                    <span class="bx-pickname">${UI.flag(p.nationality)} ${UI.esc(p.name)}</span>
                    <span class="bx-pickmeta">${UI.esc(p.position)} · ${p.ability || '—'}${era ? ' · ' + era : ''}</span></button>`;
            }).join('')
            : `<p class="bx-empty">${I18n.t('bestxi.noneAtPos', { pos: UI.esc(posLabel) })}</p>`;
        const clear = current ? `<button class="bx-clear" onclick="BestXI.clear('${slotId}')">${I18n.t('bestxi.remove', { name: UI.esc(this._shortName(this._playerName(current))) })}</button>` : '';
        Router.sheet(`<div class="sheet__handle"></div>
            <div class="sheet__title">${I18n.t('bestxi.choose', { pos: UI.esc(posLabel) })}</div>
            ${clear}
            <div class="bx-picklist">${rows}</div>
            <button class="btn btn--ghost" style="width:100%;margin-top:var(--space-2)" onclick="Router.closeSheet()">${I18n.t('common.close')}</button>`);
    },
    // a light "when" hint next to a name in the picker
    _era(p) { return (!p.archived && p.agentId === 'me') ? I18n.t('bestxi.current') : (p.archived ? I18n.t('bestxi.former') : ''); },
    pick(slotId, pid) {
        this._state().picks[slotId] = pid;
        this._save();
        if (Router.closeSheet) Router.closeSheet();
        this._rerender();
    },
    clear(slotId) {
        delete this._state().picks[slotId];
        this._save();
        if (Router.closeSheet) Router.closeSheet();
        this._rerender();
    },

    _rerender() { const el = document.getElementById('screenBody'); if (el) this.render(el); },

    // ---- render ----
    render(el) {
        this._injectCSS();
        const st = this._state();
        const fkeys = Object.keys(this.FORMATIONS);
        const selector = `<div class="bx-forms">${fkeys.map(k =>
            `<button class="bx-form ${st.formation === k ? 'bx-form--on' : ''}" onclick="BestXI.selectFormation('${k}')">${this.FORMATIONS[k].name}</button>`).join('')}</div>`;

        if (!st.formation) {
            el.innerHTML = `${selector}<div class="bx-hint"><i class="ti ti-shirt"></i><p>${I18n.t('bestxi.pickFormation')}</p><p class="bx-hint__sub">${I18n.t('bestxi.pickFormationSub')}</p></div>`;
            return;
        }

        const f = this.FORMATIONS[st.formation];
        const tile = (slot, onPitch) => {
            const p = st.picks[slot.id] ? GameState.getPlayer(st.picks[slot.id]) : null;
            const filled = !!p;
            const posStyle = onPitch ? `style="left:${slot.x}%;top:${slot.y}%"` : '';
            // filled circle: peak ability inside, coloured by the club he made the most appearances for
            let circleStyle = '', circleInner = '<span class="bx-plus">+</span>';
            if (filled) {
                const col = this._clubColors(p);
                circleStyle = `style="background:${col.primary};border-color:${col.secondary};color:${this._ink(col.primary)}"`;
                circleInner = String(p.peakAbility || p.ability || '');
            }
            return `<button class="bx-slot ${filled ? 'bx-slot--on' : ''} ${onPitch ? 'bx-slot--pitch' : 'bx-slot--bench'}" ${posStyle} onclick="BestXI.openPicker('${slot.id}')">
                <span class="bx-slotlab">${slot.lab}</span>
                <span class="bx-circle" ${circleStyle}>${circleInner}</span>
                ${filled ? `<span class="bx-slotname">${UI.esc(this._shortName(p.name))}</span>` : ''}</button>`;
        };
        const pitch = `<div class="bx-pitch">${f.slots.map(s => tile(s, true)).join('')}</div>`;
        const bench = `<div class="bx-benchlab">${I18n.t('bestxi.substitutes')}</div><div class="bx-bench">${this.BENCH.map(s => tile(s, false)).join('')}</div>`;
        const count = f.slots.filter(s => st.picks[s.id]).length + this.BENCH.filter(s => st.picks[s.id]).length;
        // average rating of the STARTING eleven only (not the bench): peak ability, one decimal
        let xiSum = 0, xiFilled = 0;
        f.slots.forEach(s => { const p = st.picks[s.id] && GameState.getPlayer(st.picks[s.id]); if (p) { xiSum += (p.peakAbility || p.ability || 0); xiFilled++; } });
        const xiAvg = xiFilled ? xiSum / xiFilled : 0;
        const xiColor = UI.abilityVar ? UI.abilityVar(Math.round(xiAvg)) : '--accent';
        const xiInd = `<div class="bx-xirating">
            <span class="bx-xilbl">${I18n.t('bestxi.xiAvgLabel')}</span>
            <span class="bx-xival" style="color:var(${xiColor})">${xiFilled ? xiAvg.toFixed(1) : '—'}</span>
            <span class="bx-xisub">${I18n.t('bestxi.xiFilled', { filled: xiFilled, total: f.slots.length })}</span></div>`;
        el.innerHTML = `${selector}
            <p class="bx-note">${I18n.t('bestxi.note', { count, total: f.slots.length + this.BENCH.length })}</p>
            ${xiInd}
            ${pitch}${bench}`;
    },

    _injectCSS() {
        if (document.getElementById('bxCSS')) return;
        const css = `
        .bx-forms{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
        .bx-form{flex:1;min-width:60px;background:var(--surface);border:1px solid var(--line-strong);color:var(--text-secondary);border-radius:10px;padding:9px 4px;font:inherit;font-size:var(--fs-sm);font-weight:var(--weight-semibold);cursor:pointer}
        .bx-form--on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#04140c)}
        .bx-note{color:var(--text-muted);font-size:var(--fs-xs);margin-bottom:10px;text-align:center}
        .bx-hint{text-align:center;color:var(--text-muted);padding:40px 20px}
        .bx-hint i{font-size:34px;color:var(--text-dim)}
        .bx-hint p{margin-top:12px;font-size:var(--fs-md)}
        .bx-hint__sub{font-size:var(--fs-sm);color:var(--text-dim)}
        .bx-pitch{position:relative;width:100%;max-width:440px;margin:0 auto;aspect-ratio:68/94;border-radius:14px;
            background:linear-gradient(0deg,#1f7a3f,#2a8f4c);border:2px solid rgba(255,255,255,.14);overflow:hidden}
        .bx-pitch::before{content:"";position:absolute;inset:0;background:
            repeating-linear-gradient(0deg,transparent 0 11.11%,rgba(255,255,255,.05) 11.11% 22.22%);pointer-events:none}
        .bx-pitch::after{content:"";position:absolute;left:15%;right:15%;top:38%;bottom:38%;border:2px solid rgba(255,255,255,.16);border-radius:50%;pointer-events:none}
        .bx-slot{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;
            background:transparent;border:none;cursor:pointer;font:inherit;width:70px}
        .bx-slotlab{font-size:9px;font-weight:var(--weight-bold);color:rgba(255,255,255,.7);letter-spacing:.04em;text-transform:uppercase}
        .bx-circle{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;
            background:rgba(6,20,12,.55);border:2px dashed rgba(255,255,255,.4);color:#fff;font-size:15px;font-weight:var(--weight-bold);
            line-height:1;font-variant-numeric:tabular-nums}
        .bx-slot--on .bx-circle{border-style:solid;box-shadow:0 1px 4px rgba(0,0,0,.35)}
        .bx-slotname{max-width:74px;font-size:10px;font-weight:var(--weight-semibold);color:#fff;text-align:center;line-height:1.1;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.65)}
        .bx-plus{font-size:18px;color:rgba(255,255,255,.65);font-weight:var(--weight-regular)}
        .bx-benchlab{color:var(--text-dim);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.07em;margin:16px 2px 8px}
        .bx-bench{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px}
        .bx-slot--bench{position:static;transform:none;width:80px;flex:0 0 80px}
        .bx-slot--bench .bx-circle{width:100%;height:40px;border-radius:10px}
        .bx-slot--bench .bx-slotname{max-width:100%;color:var(--text-secondary);text-shadow:none}
        .bx-picklist{max-height:52vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin:6px 0}
        .bx-pick{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:var(--bg);border:1px solid var(--line-strong);border-radius:10px;padding:10px 12px;font:inherit;color:var(--text);cursor:pointer;text-align:left}
        .bx-pick--on{border-color:var(--accent);background:var(--accent-tint,rgba(52,211,153,.12))}
        .bx-pickname{font-weight:var(--weight-semibold)}
        .bx-pickmeta{color:var(--text-muted);font-size:var(--fs-xs)}
        .bx-clear{width:100%;background:none;border:1px solid var(--line-strong);color:var(--state-bad,#e5484d);border-radius:10px;padding:9px;font:inherit;cursor:pointer;margin-bottom:6px}
        .bx-empty{color:var(--text-dim);text-align:center;padding:20px 8px}
        .bx-xirating{display:flex;align-items:baseline;justify-content:center;gap:8px;margin:0 0 12px}
        .bx-xilbl{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.06em;color:var(--text-dim)}
        .bx-xival{font-size:var(--fs-xl);font-weight:var(--weight-bold);font-variant-numeric:tabular-nums}
        .bx-xisub{font-size:var(--fs-xs);color:var(--text-muted);font-variant-numeric:tabular-nums}`;
        const el = document.createElement('style'); el.id = 'bxCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
if (typeof Router !== 'undefined') Router.register('bestxi', { isMain: false, parent: 'clients', title: () => I18n.t('clients.bestXI'), render(el) { BestXI.render(el); } });
