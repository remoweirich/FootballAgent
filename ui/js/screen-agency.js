// ============================================================
//  Agency — reputation/clients/scouts/sponsor-reach stats, plus
//  upgrade ladders (office, vehicles, properties), the
//  International Scouting Licence, equipment/facilities and staff.
// ============================================================
// Per-tier pictograms so an upgrade ladder visually climbs, not just numerically.
// Offices come in 5 named families of 3 sub-tiers each (Home/Co-working/Traditional/
// Modern/Iconic); vehicles and properties are matched 1:1 against upgrades.js.
const AGENCY_PICS = {
    office: ['ti-home-2', 'ti-building', 'ti-building-community', 'ti-building-skyscraper', 'ti-building-arch'],
    vehicle: ['ti-car', 'ti-car', 'ti-car', 'ti-helicopter', 'ti-anchor', 'ti-plane'],
    property: ['ti-caravan', 'ti-building', 'ti-home', 'ti-building-estate', 'ti-building-castle', 'ti-building-skyscraper'],
    equipment: {
        resistance_bands: 'ti-stretching', dumbbells: 'ti-barbell', treadmills: 'ti-treadmill',
        strength_machine: 'ti-barbell', first_aid: 'ti-first-aid-kit', gym: 'ti-building-warehouse',
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

    render(el) {
        const ag = GameState.agency;
        const off = Upgrades.office(), nextOff = Upgrades.nextOffice();
        const vNext = Upgrades.nextVehicle(), pNext = Upgrades.nextProperty();
        const sl = SPONSOR_LABEL[Upgrades.sponsorLevel()];
        const has = Agency.hasIntlLicence();

        el.innerHTML = `
        <div class="info-grid" style="margin-bottom:var(--space-5)">
            <div class="info"><span><i class="ti ti-star"></i>Reputation</span><b>${Math.round(ag.reputation)}<span class="muted" style="font-size:11px">/${Agency.repLimit()}</span></b></div>
            <a class="info" href="#clients" style="text-decoration:none;color:inherit;cursor:pointer"><span><i class="ti ti-users"></i>Clients <i class="ti ti-chevron-right" style="font-size:11px;color:var(--text-faint)"></i></span><b>${Agency.clients().length}<span class="muted" style="font-size:11px">/${Agency.capacity()}</span></b></a>
            <a class="info" href="#scouting" style="text-decoration:none;color:inherit;cursor:pointer"><span><i class="ti ti-zoom-scan"></i>Scouts <i class="ti ti-chevron-right" style="font-size:11px;color:var(--text-faint)"></i></span><b>${ag.scouts.length}<span class="muted" style="font-size:11px">/${Upgrades.maxScouts()}</span></b></a>
            <div class="info"><span><i class="ti ti-broadcast"></i>Sponsor reach</span><b>${sl}</b></div>
        </div>
        <a class="list-row" href="#finance" style="cursor:pointer;justify-content:space-between;margin-bottom:var(--space-5)">
            <span class="flex-row" style="gap:8px"><i class="ti ti-currency-euro" style="color:var(--accent)"></i><span class="row-title">Finances</span></span>
            <i class="ti ti-chevron-right row-chev"></i>
        </a>

        <div class="section-label">Office <span class="muted" style="font-weight:400">· weekly running cost</span></div>
        <a class="tier" style="margin-bottom:var(--space-5);cursor:pointer" onclick="AgencyScreen.ladder('office')">
            <div class="tier__body tier__body--current">
                <div class="pic pic--current"><i class="ti ${this.iconFor('office', Upgrades.state().officeIndex)}"></i></div>
                <div style="flex:1"><div class="tier__name">${off.name}</div><div class="tier__benefit muted">Rep ${off.repLimit} · ${off.maxScouts} scout(s) · ${sl} · ${UI.euro(off.weekly)}/wk</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </div>
        </a>

        <div class="section-label">Vehicles <span class="muted" style="font-weight:400">· buy in order</span></div>
        <a class="tier" style="margin-bottom:var(--space-5);cursor:pointer" onclick="AgencyScreen.ladder('vehicle')">
            <div class="tier__body ${vNext ? '' : 'tier__body--current'}">
                <div class="pic ${vNext ? 'pic--locked' : 'pic--current'}"><i class="ti ${this.iconFor('vehicle', vNext ? Upgrades.state().vehicleIndex + 1 : Upgrades.state().vehicleIndex)}"></i></div>
                <div style="flex:1"><div class="tier__name">${Upgrades.ownedVehicles().length} owned</div><div class="tier__benefit muted">${vNext ? `Next: ${vNext.name} — ${UI.euro(vNext.price)}` : 'Full garage'}</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </div>
        </a>

        <div class="section-label">Properties <span class="muted" style="font-weight:400">· buy in order</span></div>
        <a class="tier" style="margin-bottom:var(--space-5);cursor:pointer" onclick="AgencyScreen.ladder('property')">
            <div class="tier__body ${pNext ? '' : 'tier__body--current'}">
                <div class="pic ${pNext ? 'pic--locked' : 'pic--current'}"><i class="ti ${this.iconFor('property', pNext ? Upgrades.state().propertyIndex + 1 : Upgrades.state().propertyIndex)}"></i></div>
                <div style="flex:1"><div class="tier__name">${Upgrades.ownedProperties().length} owned</div><div class="tier__benefit muted">${pNext ? `Next: ${pNext.name} — ${UI.euro(pNext.price)}` : 'You own the Skyscraper'}</div></div>
                <i class="ti ti-chevron-right row-chev"></i>
            </div>
        </a>

        <div class="section-label">International Scouting Licence</div>
        <div class="fcard">
            <div class="frow"><span class="frow__k"><i class="ti ti-license"></i>Status</span><span class="frow__v">${has ? `Active · ${Agency.intlLicenceWeeksLeft()}w left` : 'Not held'}</span></div>
            <div style="padding:9px 0"><p class="hint" style="margin:0 0 var(--space-3)">Lets an unassigned scout work a foreign league. Valid 3 seasons (156 weeks).</p>
            <button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="AgencyScreen.buyLicence()">${has ? 'Extend' : 'Buy'} — ${UI.euro(Agency.INTL_LICENCE_COST)}</button></div>
        </div>

        <div class="section-label">Equipment & facilities <span class="muted" style="font-weight:400">· any order</span></div>
        <div class="gap-3" style="display:flex;flex-direction:column;margin-bottom:var(--space-5)">${this.equipCards()}</div>

        <div class="section-label">Staff</div>
        <div class="gap-3" style="display:flex;flex-direction:column;margin-bottom:var(--space-6)">${this.staffCards()}</div>

        <div class="section-label">Danger zone</div>
        <button class="btn btn--danger" onclick="AgencyScreen.confirmReset()"><i class="ti ti-trash"></i>Reset save</button>
        <div id="actionResult"></div>`;
    },
    confirmReset() {
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">Reset your save?</div>
            <p class="hint">This permanently deletes your agency, clients, scouts and every season played. There's no undo.</p>
            <div class="flex-row" style="margin-top:var(--space-5)">
                <button class="btn btn--ghost" onclick="Router.closeSheet()">Cancel</button>
                <button class="btn btn--danger" onclick="AgencyScreen.doReset()"><i class="ti ti-trash"></i>Delete everything</button>
            </div>`);
    },
    doReset() { GameState.hardReset(); },

    equipCards() {
        return EQUIPMENT.map(e => {
            const owned = Upgrades.ownsEquip(e.id);
            const eff = [e.dev ? `+${e.dev}% dev` : '', e.injury ? `${e.injury > 0 ? '+' : ''}${e.injury}% injury` : '', e.rep ? `+${e.rep} rep` : '', e.weekly ? `${UI.euro(e.weekly)}/wk` : '', e.expires ? `expires ${e.expires}y` : ''].filter(Boolean).join(' · ');
            return `<div class="card">
                <div class="flex-row" style="justify-content:space-between">
                    <div class="flex-row" style="gap:10px">
                        <div class="pic ${owned ? 'pic--owned' : ''}"><i class="ti ${AGENCY_PICS.equipment[e.id] || 'ti-tool'}"></i></div>
                        <div><div class="row-title">${e.name} ${owned ? '<span class="pill pill--accent">owned</span>' : ''}</div><div class="row-sub">${eff}</div></div>
                    </div>
                    ${owned ? '' : `<button class="btn btn--accent-outline btn--sm" style="width:auto" onclick="AgencyScreen.buyEquip('${e.id}')">${UI.euro(e.price)}</button>`}
                </div></div>`;
        }).join('');
    },
    staffCards() {
        return STAFF.map(s => {
            const n = Upgrades.staffCount(s.id);
            const eff = [s.dev ? `+${s.dev}% dev` : '', s.injury ? `${s.injury}% injury` : '', s.rep ? `+${s.rep} rep` : '', `restocks ${s.yearlyName}/yr`].filter(Boolean).join(' · ');
            return `<div class="card">
                <div class="flex-row" style="justify-content:space-between">
                    <div class="flex-row" style="gap:10px">
                        <div class="pic ${n > 0 ? 'pic--owned' : ''}"><i class="ti ${AGENCY_PICS.staff[s.id] || 'ti-user'}"></i></div>
                        <div><div class="row-title">${s.name} <span class="pill">${n}/${s.max}</span></div><div class="row-sub">${UI.euro(s.weekly)}/wk · ${eff}</div></div>
                    </div>
                    <div class="flex-row" style="gap:6px">
                        <button class="btn btn--accent-outline btn--sm" style="width:auto" ${n >= s.max ? 'disabled' : ''} onclick="AgencyScreen.hireStaff('${s.id}')">Hire</button>
                        <button class="btn btn--ghost btn--sm" style="width:auto" ${n <= 0 ? 'disabled' : ''} onclick="AgencyScreen.releaseStaff('${s.id}')">Release</button>
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
            const meta = kind === 'office' ? `Rep ${item.repLimit} · ${item.maxScouts} scout(s) · ${SPONSOR_LABEL[item.sponsor]} · ${UI.euro(item.weekly)}/wk`
                : `+${item.repLimit} rep · +${item.players} clients${item.scoutDiscount ? ` · −${Math.round(item.scoutDiscount * 100)}% scouting` : ''}`;
            const cls = state === 'current' ? 'tier__body--current' : state === 'locked' ? 'tier__body--locked' : '';
            const pic = state === 'owned' ? 'pic--owned' : state === 'current' ? 'pic--current' : state === 'locked' ? 'pic--locked' : '';
            const action = state === 'buyable' ? `<button class="btn btn--primary btn--sm" style="width:auto" onclick="AgencyScreen.buy('${kind}')">${kind === 'office' ? 'Move in — ' : 'Buy — '}${UI.euro(price)}</button>`
                : state === 'current' ? '<span class="pill pill--accent">current</span>' : state === 'owned' ? '<span class="pill">owned</span>' : '<i class="ti ti-lock" style="color:var(--text-dim)"></i>';
            return `<div class="tier" style="margin-bottom:var(--space-3)"><div class="tier__body ${cls}"><div class="pic ${pic}"><i class="ti ${this.iconFor(kind, i)}"></i></div><div style="flex:1"><div class="tier__name">${item.name}</div><div class="tier__benefit muted">${meta}</div></div>${action}</div></div>`;
        }).join('');
        Router.sheet(`<div class="sheet__handle"></div><div class="sheet__title">${kind[0].toUpperCase() + kind.slice(1)} ladder</div>
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
    buyLicence() { const r = Agency.buyIntlLicence(); GameState.save(); Router.refresh(); Router.result(r.message, 'ok'); },
    buyEquip(id) { const r = Upgrades.buyEquip(id); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    hireStaff(id) { const r = Upgrades.hireStaff(id); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); },
    releaseStaff(id) { const r = Upgrades.releaseStaff(id); GameState.save(); Router.refresh(); Router.result(r.message, r.ok ? 'ok' : 'bad'); }
};
Router.register('agency', { isMain: true, title: 'Agency', render(el) { AgencyScreen.render(el); } });
