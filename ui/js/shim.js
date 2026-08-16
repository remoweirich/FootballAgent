// ============================================================
//  UI shim — the engine (agency.js, simulation.js, upgrades.js…)
//  calls UI.money(n) to format currency inline in its messages.
//  Everything else here is shared formatting used across screens.
// ============================================================
// nationality -> ISO 3166-1 alpha-2 (flag-icons uses gb-eng/gb-sct/gb-wls/gb-nir for the
// UK's constituent countries, and the common unofficial "xk" for Kosovo)
const NATIONALITY_ISO = {
    Albania: 'al', Algeria: 'dz', Argentina: 'ar', Armenia: 'am', Australia: 'au', Austria: 'at',
    Belgium: 'be', Bosnia: 'ba', Brazil: 'br', Bulgaria: 'bg', Cameroon: 'cm', Canada: 'ca',
    Chile: 'cl', China: 'cn', Colombia: 'co', Croatia: 'hr', Cyprus: 'cy', 'Czech Republic': 'cz',
    DRC: 'cd', Denmark: 'dk', Ecuador: 'ec', Egypt: 'eg', England: 'gb-eng', Finland: 'fi',
    France: 'fr', Gabon: 'ga', Gambia: 'gm', Georgia: 'ge', Germany: 'de', Ghana: 'gh',
    Greece: 'gr', Hungary: 'hu', Iceland: 'is', India: 'in', Indonesia: 'id', Iraq: 'iq',
    Ireland: 'ie', Italy: 'it', Japan: 'jp', Kazakhstan: 'kz', Kenya: 'ke', Kosovo: 'xk',
    Liechtenstein: 'li', Luxembourg: 'lu', Madagascar: 'mg', Mali: 'ml', Mexico: 'mx', Morocco: 'ma',
    Netherlands: 'nl', 'New Zealand': 'nz', Nigeria: 'ng', 'North Macedonia': 'mk', 'Northern Ireland': 'gb-nir',
    Norway: 'no', Peru: 'pe', Poland: 'pl', Portugal: 'pt', Romania: 'ro', Rwanda: 'rw',
    Scotland: 'gb-sct', Senegal: 'sn', Serbia: 'rs', Slovakia: 'sk', Slovenia: 'si', 'South Africa': 'za',
    'South Korea': 'kr', Spain: 'es', Sweden: 'se', Switzerland: 'ch', Tunisia: 'tn', Turkey: 'tr',
    USA: 'us', Uganda: 'ug', Ukraine: 'ua', Uruguay: 'uy', Wales: 'gb-wls',
    Russia: 'ru', Suriname: 'sr', 'Cape Verde': 'cv', Angola: 'ao', 'Guinea-Bissau': 'gw',
    Jamaica: 'jm', Pakistan: 'pk', Paraguay: 'py', Bolivia: 'bo', Iran: 'ir'
};

const UI = {
    // the active currency symbol ('€' by default; '£' / 'CHF ' when the player picks another)
    cur() { return (typeof Currency !== 'undefined') ? Currency.sym() : '€'; },
    // every amount is stored in euros; money() converts to the chosen currency (rounded to 10 for non-EUR)
    money(n) { return ((typeof Currency !== 'undefined') ? Currency.conv(n) : Math.round(n || 0)).toLocaleString('en-US'); },
    euro(n) { return UI.cur() + UI.money(n); },
    // compact form for tight spaces (the header finance strip): 1234567 -> "€1.2M"
    abbr(n) {
        n = (typeof Currency !== 'undefined') ? Currency.conv(n) : (n || 0);
        const sign = n < 0 ? '−' : '';
        const a = Math.abs(n);
        const fmt = (v, suf) => sign + (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + suf;
        if (a >= 1e9) return fmt(a / 1e9, 'B');
        if (a >= 1e6) return fmt(a / 1e6, 'M');
        if (a >= 1e3) return fmt(a / 1e3, 'k');
        return sign + Math.round(a);
    },
    eabbr(n) { return UI.cur() + UI.abbr(n); },

    // ---- ability badge colour band (7 bands, see DESIGN_SYSTEM.md) ----
    abilityVar(a) {
        if (a >= 85) return '--ability-7';
        if (a >= 75) return '--ability-6';
        if (a >= 60) return '--ability-5';
        if (a >= 45) return '--ability-4';
        if (a >= 30) return '--ability-3';
        if (a >= 15) return '--ability-2';
        return '--ability-1';
    },
    abilityBadge(a, lg) {
        return `<span class="ability${lg ? ' ability--lg' : ''}" style="--ab:var(${this.abilityVar(a)})">${a}</span>`;
    },

    // ---- average rating traffic light ----
    ratingVar(r) { return r >= 7.0 ? '--state-good' : r >= 6.5 ? '--state-mid' : '--state-bad'; },
    ratingText(r) {
        if (!r) return '<span class="muted">—</span>';
        return `<span style="color:var(${this.ratingVar(r)});font-weight:var(--weight-semibold)">${r.toFixed(2)}</span>`;
    },

    // ---- morale dot / bar colour ----
    moraleVar(v) { return v >= 60 ? '--state-good' : v >= 35 ? '--state-mid' : '--state-bad'; },

    ordinal(n) {
        if (n == null) return '';
        const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },

    // ---- week -> calendar month label (week 1 = 1 July) ----
    monthLabel(week, seasonStartYear) {
        const d = new Date(seasonStartYear, 6, 1);
        d.setDate(d.getDate() + (week - 1) * 7);
        return d.toLocaleString('en-US', { month: 'long' });
    },

    esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },

    // ---- crisp SVG flag (looks up by nationality name, not the stored emoji — so it
    // renders correctly even for players saved before this was added) ----
    flag(nationality) {
        const code = NATIONALITY_ISO[nationality];
        if (!code) return '';
        return `<span class="fi fi-${code}" title="${UI.esc(nationality)}"></span>`;
    },

    // ---- club colour chip (dense inline spots: Home client rows) ----
    clubChip(club) {
        const c = club && club.colors ? club.colors.primary : '#5A626D';
        return `<span class="chip" style="background:${c}"></span>`;
    },

    // ---- generated club crest (standings, client cards, negotiation headers) ----
    // Stock clubs have no emblem assets — a coloured shield with the club's initial gives real
    // identity at a glance without any licensing risk. A customization database can attach a real
    // logo (a small square PNG data: URI), in which case it's rendered in the same crest box.
    crest(club, lg) {
        const logo = club && club.logo;
        if (typeof logo === 'string' && logo.slice(0, 5) === 'data:')
            return `<img class="crest${lg ? ' crest--lg' : ''}" src="${logo}" alt="" aria-hidden="true" loading="lazy" style="object-fit:contain">`;
        const primary = club && club.colors ? club.colors.primary : '#5A626D';
        const secondary = club && club.colors && club.colors.secondary ? club.colors.secondary : '#FFFFFF';
        const initial = club && club.name ? club.name.trim()[0].toUpperCase() : '?';
        return `<svg class="crest${lg ? ' crest--lg' : ''}" viewBox="0 0 24 28" aria-hidden="true">
            <path d="M12 1 22 5v9c0 7-4.4 11.2-10 13C6.4 25.2 2 21 2 14V5Z" fill="${primary}" stroke="${secondary}" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M12 1 22 5v9c0 7-4.4 11.2-10 13Z" fill="rgba(255,255,255,.08)"/>
            <text x="12" y="17.5" text-anchor="middle" font-family="Inter,sans-serif" font-size="10.5" font-weight="700" fill="${secondary}">${initial}</text>
        </svg>`;
    },

    // ---- agency↔club relationship indicator (club page + negotiation headers) ----
    // 0–100, banded to match Agency.greetingFor's thresholds (75 / 55 / 35 / 18).
    relBadge(clubId) {
        if (typeof Agency === 'undefined' || clubId == null) return '';
        const v = Math.max(0, Math.min(100, Math.round(Agency.relationship(clubId))));
        const tier = v >= 75 ? 'warm' : v >= 55 ? 'friendly' : v >= 35 ? 'neutral' : v >= 18 ? 'cool' : 'cold';
        const cvar = (tier === 'warm' || tier === 'friendly') ? '--state-good' : tier === 'neutral' ? '--state-mid' : '--state-bad';
        const label = (typeof I18n !== 'undefined') ? I18n.t('rel.' + tier) : tier;
        const title = (typeof I18n !== 'undefined') ? I18n.t('rel.title') : 'Relationship';
        return `<span title="${title}: ${v}/100" style="display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-sm)">
            <i class="ti ti-heart-handshake" style="color:var(${cvar})"></i>
            <span style="color:var(${cvar});font-weight:var(--weight-semibold)">${label}</span>
            <span style="width:44px;height:5px;border-radius:5px;background:var(--line-strong);overflow:hidden;display:inline-block"><span style="display:block;height:100%;width:${v}%;background:var(${cvar})"></span></span>
            <span class="muted" style="font-size:11px">${v}</span></span>`;
    },

    clubName(id) {
        if (typeof id === 'string' && id.indexOf('u21') === 0) { const parent = id.split(':')[1], c = parent && Clubs.getClubById(parent); return c ? youthTeamName(c) : 'U21'; }
        const c = Clubs.getClubById(id); if (c) return c.name;
        if (typeof League !== 'undefined' && League.teamName) return League.teamName(id);
        return id || '—';
    },
    clubLabel(clubId, loan, youth) { const n = this.clubName(clubId); if (youth) return n; return loan ? `${n} <span class="muted">(loan)</span>` : n; },

    // Where a player is actually playing RIGHT NOW — the loan destination (including a
    // virtual U21/reserve loan with no real club entry, e.g. "u21:ajax") if he's away,
    // otherwise his contracted club. Distinct from tabHistory()'s past stints. Assumes
    // p.clubId is set — guard for free agents at the call site, same as the existing
    // `club ? … : 'Free agent'` pattern.
    currentClubInfo(p) {
        const effId = effectiveClubId(p);
        const youth = (p.onLoanAt && isU21Loan(p)) || isReserveClub(effId);
        const tag = youth ? 'youth' : (p.onLoanAt ? 'loan' : null);
        const club = Clubs.getClubById(effId) || (p.onLoanAt ? Clubs.getClubById(p.clubId) : null);
        // the owning club, surfaced whenever he's out on loan (D5)
        const parent = (p.onLoanAt && p.clubId && p.clubId !== effId) ? this.clubName(p.clubId) : null;
        return { club, name: this.clubName(effId), tag, parent };
    },

    niceStep(hi) {
        const targets = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
        for (const t of targets) if (hi / t <= 5) return t;
        return 5000000;
    },
    // a "nice" 1/2/5×10ⁿ step that splits `range` into roughly `ticks` intervals
    niceSpan(range, ticks = 4) {
        const raw = Math.max(1e-9, range) / Math.max(1, ticks);
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const norm = raw / mag;
        const s = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
        return s * mag;
    },
    // a rounded axis [min,max] with a nice step and ~`ticks` gridlines — keeps labels from crowding
    niceAxis(lo, hi, ticks = 4) {
        if (!(hi > lo)) hi = lo + 1;
        const step = this.niceSpan(hi - lo, ticks);
        return { min: Math.floor(lo / step) * step, max: Math.ceil(hi / step) * step, step };
    },

    // flexible inline SVG line chart: points [{x,y}]; opts {fmtY,yStep,yMin,yMax,xMin,xMax,xTicks,dotsOnly}
    xyChart(points, color, opts = {}) {
        if (!points || !points.length) return '<p class="muted">No data yet.</p>';
        points = points.slice().sort((a, b) => a.x - b.x);
        const W = 300, H = 120, padL = 40, padR = 10, padT = 10, padB = 20;
        const xMin = opts.xMin != null ? opts.xMin : points[0].x;
        const xMax = opts.xMax != null ? opts.xMax : (points[points.length - 1].x || xMin + 1);
        const xSpan = xMax > xMin ? (xMax - xMin) : 1;
        let lo = opts.yMin, hi = opts.yMax;
        if (lo == null || hi == null) {
            const ys = points.map(p => p.y); lo = lo != null ? lo : Math.min(...ys); hi = hi != null ? hi : Math.max(...ys);
            if (lo === hi) { lo -= 1; hi += 1; }
        }
        if (lo >= hi) hi = lo + (opts.yStep || 10);
        const X = v => padL + (W - padL - padR) * Math.max(0, Math.min(1, (v - xMin) / xSpan));
        const Y = v => padT + (H - padT - padB) * (1 - Math.max(0, Math.min(1, (v - lo) / (hi - lo))));
        const fmtY = opts.fmtY || (v => v);

        let grid = '', ylabels = '', xgrid = '', xlabels = '';
        if (opts.yStep) {
            const start = Math.ceil(lo / opts.yStep) * opts.yStep;
            for (let v = start; v <= hi + 1e-6; v += opts.yStep) {
                const yy = Y(v);
                grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}" class="grid-line"/>`;
                ylabels += `<text x="${padL - 5}" y="${(yy + 3).toFixed(1)}" text-anchor="end">${fmtY(v)}</text>`;
            }
        } else {
            ylabels = `<text x="${padL - 5}" y="${(Y(hi) + 4).toFixed(1)}" text-anchor="end">${fmtY(hi)}</text><text x="${padL - 5}" y="${Y(lo).toFixed(1)}" text-anchor="end">${fmtY(lo)}</text>`;
        }
        const xticks = opts.xTicks && opts.xTicks.length ? opts.xTicks : [{ v: xMin, label: '' }, { v: (xMin + xMax) / 2, label: '' }, { v: xMax, label: '' }];
        xticks.forEach(tk => {
            const xx = X(tk.v);
            xgrid += `<line x1="${xx.toFixed(1)}" y1="${padT}" x2="${xx.toFixed(1)}" y2="${H - padB}" class="grid-line"/>`;
            if (tk.label) xlabels += `<text x="${xx.toFixed(1)}" y="${H - 5}" text-anchor="middle">${tk.label}</text>`;
        });
        const dots = points.map(p => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${color}"/>`).join('');
        let path = '';
        if (points.length >= 2 && !opts.dotsOnly) path = `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>`;
        return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${grid}${xgrid}<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" class="axis-line"/>
            <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" class="axis-line"/>
            ${path}${dots}${xlabels}${ylabels}</svg>`;
    },

    kindIcon(kind) {
        return ({ transfer: 'ti-arrows-exchange', loan: 'ti-repeat', renewal: 'ti-file-pencil', sponsor: 'ti-currency-euro', news: 'ti-news', summary: 'ti-flag', info: 'ti-info-circle', attend: 'ti-ticket' })[kind] || 'ti-mail';
    },
    kindColor(kind) {
        return ({ transfer: 'var(--state-good)', loan: 'var(--info)', renewal: 'var(--warning)', sponsor: 'var(--state-good)', news: 'var(--text-secondary)', summary: 'var(--gold)', info: 'var(--info)', attend: 'var(--gold)' })[kind] || 'var(--text-secondary)';
    }
};
