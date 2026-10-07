// ============================================================
//  Agency — reputation/clients/scouts/sponsor-reach stats, the
//  Upgrades (office, vehicles, properties, equipment, facilities:
//  one row each, opening its list) and staff. The International
//  Scouting Licence lives on the Scouting screen.
// ============================================================
// Per-tier pictograms so an upgrade ladder visually climbs, not just numerically.
// Offices come in 5 named families of 3 sub-tiers each (Home/Co-working/Traditional/
// Modern/Iconic); vehicles and properties are matched 1:1 against upgrades.js.
const AGENCY_PICS = {
    office: ['ti-home-2', 'ti-building', 'ti-building-community', 'ti-building-skyscraper', 'ti-building-arch'],
    vehicle: ['ti-car', 'ti-car', 'ti-car', 'ti-helicopter', 'ti-anchor', 'ti-plane'],
    property: ['ti-caravan', 'ti-building', 'ti-home', 'ti-building-estate', 'ti-building-castle', 'ti-building-skyscraper'],
    equipment: {
        resistance_bands: 'ti-stretching', dumbbells: 'ti-barbell', plyo_boxes: 'ti-arrow-up', kettlebells: 'ti-barbell',
        treadmills: 'ti-treadmill', weight_bench: 'ti-barbell', leg_curl: 'ti-adjustments', leg_extension: 'ti-adjustments',
        squat_rack: 'ti-barbell', functional_trainer: 'ti-tools', first_aid: 'ti-first-aid-kit', gym: 'ti-building-warehouse',
        pool: 'ti-swimming', training_ground: 'ti-run', medical_center: 'ti-heartbeat'
    },
    staff: { physio: 'ti-first-aid-kit', trainer: 'ti-run' }
};

const AgencyScreen = {
    ICON: { office: 'ti-building', vehicle: 'ti-car', property: 'ti-home-2' },
    // icon for a specific rung of a ladder (offices climb by family-of-3; falls back to the last icon)
    iconFor(kind, idx) {
        const arr = AGENCY_PICS[kind]; if (!arr) return this.ICON[kind];
        const i = kind === 'office' ? Math.floor(idx / 3) : idx;
        return arr[Math.min(i, arr.length - 1)];
    },
    // Ladder kinds that have custom artwork, and where it lives. Offices stay on Tabler icons.
    ART_DIR: { vehicle: 'vehicles', property: 'properties' },
    artList(kind) {
        if (kind === 'vehicle') return (typeof VEHICLES !== 'undefined') ? VEHICLES : null;
        if (kind === 'property') return (typeof PROPERTIES !== 'undefined') ? PROPERTIES : null;
        return null;
    },
    // Pictogram markup for a ladder rung. Vehicles/properties use custom artwork in two states:
    // "<id>_buy.png" while it is still to be bought, "<id>.png" once owned. Anything without a
    // file (offices, or artwork not drawn yet) falls back to the Tabler icon - see artFallback.
    picInner(kind, idx, owned) {
        const dir = this.ART_DIR[kind], list = this.artList(kind);
        if (dir && list) {
            const item = list[Math.min(Math.max(idx, 0), list.length - 1)];
            if (item) {
                const src = `assets/img/${dir}/${item.id}${owned ? '' : '_buy'}.webp`;
                return `<img class="pic-img" src="${src}" alt="" onclick="AgencyScreen.zoomArt(event,'${src}')" onerror="AgencyScreen.artFallback(this,'${this.iconFor(kind, idx)}')">`;
            }
        }
        return `<i class="ti ${this.iconFor(kind, idx)}"></i>`;
    },
    // Artwork missing on disk: quietly swap the broken image for the kind's icon.
    artFallback(img, icon) {
        const i = document.createElement('i');
        i.className = 'ti ' + icon;
        if (img && img.parentNode) img.parentNode.replaceChild(i, img);
    },
    // Tap a thumbnail to enlarge its artwork centre-screen; tap anywhere to dismiss.
    // stopPropagation so tapping the art inside a clickable tier row doesn't also open the ladder.
    zoomArt(ev, src) {
        if (ev) { ev.stopPropagation(); ev.preventDefault(); }
        const old = document.getElementById('artLightbox'); if (old) old.remove();
        const box = document.createElement('div');
        box.id = 'artLightbox'; box.className = 'veh-lightbox';
        box.innerHTML = `<img src="${src}" alt="">`;
        box.addEventListener('click', () => box.remove());
        document.body.appendChild(box);
    },

    render(el) {
        const ag = GameState.agency;
        const off = Upgrades.office(), nextOff = Upgrades.nextOffice();
        const vNext = Upgrades.nextVehicle(), pNext = Upgrades.nextProperty();
        const sl = SPONSOR_LABEL[Upgrades.sponsorLevel()];
        
        el.innerHTML = `
        <div class="info-grid" style="margin-bottom:var(--space-5)">
            <div class="info"><span><i class="ti ti-star"></i>${I18n.t('agency.reputation')}</span><b>${(ag.reputation || 0).toFixed(2)}<span class="muted" style="font-size:var(--fs-xs)">/${Agency.repLimit()}</span></b></div>
            <a class="info" href="#clients" style="text-decoration:none;color:inherit;cursor:pointer"><span><i class="ti ti-users"></i>${I18n.t('nav.clients')} <i class="ti ti-chevron-right" style="font-size:11px;color:var(--text-faint)"></i></span><b>${Agency.clients().length}<span class="muted" style="font-size:var(--fs-xs)">/${Agency.capacity()}</span></b></a>
            <a class="info" href="#scouting" style="text-decoration:none;color:inherit;cursor:pointer"><span><i class="ti ti-zoom-scan"></i>${I18n.t('agency.scouts')} <i class="ti ti-chevron-right" style="font-size:11px;color:var(--text-faint)"></i></span><b>${ag.scouts.length}<span class="muted" style="font-size:var(--fs-xs)">/${Upgrades.maxScouts()}</span></b></a>
            <div class="info"><span><i class="ti ti-broadcast"></i>${I18n.t('agency.sponsorReach')}</span><b>${sl}</b></div>
        </div>
        <a class="list-row" href="#finance" style="cursor:pointer;justify-content:space-between;margin-bottom:var(--space-5)">
            <span class="flex-row" style="gap:8px"><i class="ti ti-currency-euro" style="color:var(--accent)"></i><span class="row-title">${I18n.t('common.finances')}</span></span>
            <i class="ti ti-chevron-right row-chev"></i>
        </a>

        <div class="section-label">${I18n.t('agency.upgrades')}</div>
        ${this.upgradeRow('office', I18n.t('agency.office'), `<div class="pic pic--current"><i class="ti ${this.iconFor('office', Upgrades.state().officeIndex)}"></i></div>`,
            UI.esc(Upgrades.itemName(off)), `${I18n.t('agency.repShort')} ${off.repLimit} · ${I18n.t('agency.scoutsN', { n: off.maxScouts })} · ${sl} · ${UI.euro(off.weekly)}/wk`, true)}
        ${this.upgradeRow('vehicle', I18n.t('agency.vehicles'), `<div class="pic ${vNext ? 'pic--locked' : 'pic--current'}">${this.picInner('vehicle', vNext ? Upgrades.state().vehicleIndex + 1 : Upgrades.state().vehicleIndex, !vNext)}</div>`,
            I18n.t('agency.ownedN', { n: Upgrades.ownedVehicles().length }), vNext ? I18n.t('agency.next', { name: Upgrades.itemName(vNext), price: UI.euro(vNext.price) }) : I18n.t('agency.fullGarage'), !vNext)}
        ${this.upgradeRow('property', I18n.t('agency.properties'), `<div class="pic ${pNext ? 'pic--locked' : 'pic--current'}">${this.picInner('property', pNext ? Upgrades.state().propertyIndex + 1 : Upgrades.state().propertyIndex, !pNext)}</div>`,
            I18n.t('agency.ownedN', { n: Upgrades.ownedProperties().length }), pNext ? I18n.t('agency.next', { name: Upgrades.itemName(pNext), price: UI.euro(pNext.price) }) : I18n.t('agency.ownAllProps'), !pNext)}
        ${this.shelfRow('equipment')}
        ${this.shelfRow('facilities')}
        <div style="margin-bottom:var(--space-5)"></div>

        <div class="section-label">${I18n.t('agency.staff')}</div>
        <div class="gap-3" style="display:flex;flex-direction:column;margin-bottom:var(--space-6)">${this.staffCards()}</div>

        <div class="section-label">${I18n.t('agency.dangerZone')}</div>
        <button class="btn btn--danger" onclick="AgencyScreen.confirmReset()"><i class="ti ti-trash"></i>${I18n.t('agency.resetSave')}</button>
        <div id="actionResult"></div>`;
    },
    confirmReset() {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('agency.resetQ')}</div>
            <p class="hint">${I18n.t('agency.resetDesc')}</p>
            <div class="flex-row" style="margin-top:var(--space-5)">
                <button class="btn btn--ghost" onclick="Router.closeSheet()">${I18n.t('common.cancel')}</button>
                <button class="btn btn--danger" onclick="AgencyScreen.doReset()"><i class="ti ti-trash"></i>${I18n.t('agency.deleteAll')}</button>
            </div>`);
    },
    doReset() { GameState.hardReset(); },

    // One row of the Upgrades section: what it is (kicker), where you stand, and a tap to its list.
    upgradeRow(kind, label, pic, name, benefit, done) {
        const open = kind === 'equipment' || kind === 'facilities' ? `AgencyScreen.shelf('${kind}')` : `AgencyScreen.ladder('${kind}')`;
        return `<a class="tier" style="margin-bottom:var(--space-3);cursor:pointer" onclick="${open}">
            <div class="tier__body ${done ? 'tier__body--current' : ''}">
                ${pic}
                <div style="flex:1;min-width:0"><div class="muted" style="font-size:var(--fs-xs)">${label}</div><div class="tier__name">${name}</div><div class="tier__benefit muted">${benefit}</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </div>
        </a>`;
    },
    // Equipment and facilities are not ladders: buy them in any order. Cheapest first in the list.
    shelfItems(kind) {
        return EQUIPMENT.filter(e => kind === 'facilities' ? e.facility : !e.facility)
            .map((e, i) => ({ e, i })).sort((a, b) => a.e.price - b.e.price || a.i - b.i).map(x => x.e);
    },
    shelfRow(kind) {
        const items = this.shelfItems(kind), owned = items.filter(e => Upgrades.ownsEquip(e.id));
        const next = items.find(e => !Upgrades.ownsEquip(e.id));
        const upkeep = owned.reduce((t, e) => t + (e.weekly || 0), 0);
        const benefit = next ? I18n.t('agency.next', { name: Upgrades.equipName(next.id), price: UI.euro(next.price) })
            : I18n.t(kind === 'facilities' ? 'agency.allFacilities' : 'agency.fullyEquipped');
        const icon = kind === 'facilities' ? 'ti-building-warehouse' : 'ti-barbell';
        return this.upgradeRow(kind, I18n.t('agency.' + kind), `<div class="pic ${owned.length ? 'pic--owned' : ''}"><i class="ti ${icon}"></i></div>`,
            I18n.t('agency.ownedOf', { n: owned.length, total: items.length }), benefit + (upkeep ? ` · ${UI.euro(upkeep)}/wk` : ''), !next);
    },
    shelf(kind) {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('agency.' + kind)} <span class="muted" style="font-weight:400;font-size:var(--fs-sm)">${I18n.t('agency.anyOrder')}</span></div>
            <div class="gap-3" style="display:flex;flex-direction:column;max-height:60vh;overflow-y:auto">${this.equipCards(this.shelfItems(kind))}</div>
            <div id="actionResult"></div>`);
    },
    equipCards(list) {
        return list.map(e => {
            const owned = Upgrades.ownsEquip(e.id);
            // an owned consumable counts down the weeks it has left; an unowned one advertises its term
            const left = e.expiresWeeks ? (owned ? Upgrades.weeksLeft(e.id) : null) : null;
            const expiry = !e.expiresWeeks ? ''
                : owned && left != null ? I18n.t('agency.eff.expiresIn', { w: left })
                    : I18n.t('agency.eff.lastsWeeks', { w: e.expiresWeeks });
            const eff = [e.dev ? `+${e.dev}% ${I18n.t('agency.eff.dev')}` : '', e.injury ? `${e.injury > 0 ? '+' : ''}${e.injury}% ${I18n.t('agency.eff.injury')}` : '', e.rep ? `+${e.rep} ${I18n.t('agency.eff.rep')}` : '', e.weekly ? `${UI.euro(e.weekly)}/wk` : '', expiry].filter(Boolean).join(' · ');
            return `<div class="card">
                <div class="flex-row" style="justify-content:space-between">
                    <div class="flex-row" style="gap:10px">
                        <div class="pic ${owned ? 'pic--owned' : ''}"><i class="ti ${AGENCY_PICS.equipment[e.id] || 'ti-tool'}"></i></div>
                        <div><div class="row-title">${UI.esc(Upgrades.equipName(e.id))} ${owned ? `<span class="pill pill--accent">${I18n.t('common.owned')}</span>` : ''}</div><div class="row-sub">${eff}</div></div>
                    </div>
                    ${owned ? '' : `<button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="AgencyScreen.buyEquip('${e.id}')">${UI.euro(e.price)}</button>`}
                </div></div>`;
        }).join('');
    },
    staffCards() {
        return STAFF.map(s => {
            const n = Upgrades.staffCount(s.id);
            const eff = [s.dev ? `+${s.dev}% ${I18n.t('agency.eff.dev')}` : '', s.injury ? `${s.injury}% ${I18n.t('agency.eff.injury')}` : '', s.rep ? `+${s.rep} ${I18n.t('agency.eff.rep')}` : '', I18n.t('agency.eff.restocks', { name: Upgrades.equipName(s.yearly) })].filter(Boolean).join(' · ');
            return `<div class="card">
                <div class="flex-row" style="justify-content:space-between">
                    <div class="flex-row" style="gap:10px">
                        <div class="pic ${n > 0 ? 'pic--owned' : ''}"><i class="ti ${AGENCY_PICS.staff[s.id] || 'ti-user'}"></i></div>
                        <div><div class="row-title">${UI.esc(Upgrades.itemName(s))} <span class="pill">${n}/${s.max}</span></div><div class="row-sub">${UI.euro(s.weekly)}/wk · ${eff}</div></div>
                    </div>
                    <div class="flex-row" style="gap:6px">
                        <button class="btn btn--accent-outline btn--sm" style="width:auto" ${n >= s.max ? 'disabled' : ''} onclick="AgencyScreen.hireStaff('${s.id}')">${I18n.t('agency.hire')}</button>
                        <button class="btn btn--ghost btn--sm" style="width:auto" ${n <= 0 ? 'disabled' : ''} onclick="AgencyScreen.releaseStaff('${s.id}')">${I18n.t('agency.release')}</button>
                    </div>
                </div></div>`;
        }).join('');
    },

    ladder(kind) {
        const LIST = { office: OFFICES, vehicle: VEHICLES, property: PROPERTIES }[kind];
        const idx = kind === 'office' ? Upgrades.state().officeIndex : kind === 'vehicle' ? Upgrades.state().vehicleIndex : Upgrades.state().propertyIndex;
        const rows = LIST.map((item, i) => {
            const state = i < idx ? 'owned' : i === idx ? 'current' : i === idx + 1 ? 'buyable' : 'locked';
            const price = kind === 'office' ? item.weekly * 4 : item.price;
            const meta = kind === 'office' ? `${I18n.t('agency.repShort')} ${item.repLimit} · ${I18n.t('agency.scoutsN', { n: item.maxScouts })} · ${SPONSOR_LABEL[item.sponsor]} · ${UI.euro(item.weekly)}/wk`
                : `+${item.repLimit} ${I18n.t('agency.eff.rep')} · +${item.players} ${I18n.t('agency.clientsShort')}${item.scoutDiscount ? ` · −${Math.round(item.scoutDiscount * 100)}% ${I18n.t('agency.scoutingShort')}` : ''}`;
            const cls = state === 'current' ? 'tier__body--current' : state === 'locked' ? 'tier__body--locked' : '';
            const pic = state === 'owned' ? 'pic--owned' : state === 'current' ? 'pic--current' : state === 'locked' ? 'pic--locked' : '';
            const action = state === 'buyable' ? `<button class="btn btn--primary btn--sm" style="width:auto" onclick="AgencyScreen.buy('${kind}')">${kind === 'office' ? I18n.t('agency.moveIn') : I18n.t('agency.buyPrefix')}${UI.euro(price)}</button>`
                : state === 'current' ? `<span class="pill pill--accent">${I18n.t('common.current')}</span>` : state === 'owned' ? `<span class="pill">${I18n.t('common.owned')}</span>` : '<i class="ti ti-lock" style="color:var(--text-dim)"></i>';
            return `<div class="tier" style="margin-bottom:var(--space-3)"><div class="tier__body ${cls}"><div class="pic ${pic}">${this.picInner(kind, i, state === 'owned' || state === 'current')}</div><div style="flex:1"><div class="tier__name">${UI.esc(Upgrades.itemName(item))}</div><div class="tier__benefit muted">${meta}</div></div>${action}</div></div>`;
        }).join('');
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${I18n.t('agency.ladder' + kind[0].toUpperCase() + kind.slice(1))}</div>
            <div style="max-height:60vh;overflow-y:auto">${rows}</div>
            <div id="actionResult"></div>`);
    },
    buy(kind) {
        const r = kind === 'office' ? Upgrades.upgradeOffice() : kind === 'vehicle' ? Upgrades.buyVehicle() : Upgrades.buyProperty();
        GameState.save();
        if (r.ok) {
            // refresh the screen underneath directly (Router.refresh() would tear down this sheet)
            this.render(document.getElementById('screenBody'));
            this.ladder(kind);
        }
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    // bought from its list: redraw the screen underneath and the list in place, like buy() above
    buyEquip(id) {
        const r = Upgrades.buyEquip(id), e = Upgrades.equipById(id);
        GameState.save();
        if (r.ok) {
            this.render(document.getElementById('screenBody'));
            this.shelf(e && e.facility ? 'facilities' : 'equipment');
        }
        Router.result(r.message, r.ok ? 'ok' : 'bad');
    },
    hireStaff(id) { const r = Upgrades.hireStaff(id); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    releaseStaff(id) { const r = Upgrades.releaseStaff(id); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); }
};
Router.register('agency', { isMain: true, title: () => I18n.t('nav.agency'), render(el) { AgencyScreen.render(el); } });
