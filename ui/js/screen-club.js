// ============================================================
//  Club profile — honours, recent finishes, your clients there.
// ============================================================
const ClubScreen = {
    state: { sort: 'apps', mode: 'season' },
    render(el, clubId) {
        const c = Clubs.getClubById(clubId);
        if (!c) {
            // European guest clubs (pooled associations 10-55) exist only in the UEFA competitions,
            // not in any simulated domestic league — show a minimal card instead of a dead end.
            const v = (typeof findVirtualClub === 'function' && findVirtualClub(clubId)) || null;
            if (v) {
                const vhist = (GameState.clubHistory && GameState.clubHistory[clubId]) || [];
                const vtitles = {}; vhist.forEach(h => (h.trophies || []).forEach(t => vtitles[t] = (vtitles[t] || 0) + 1));
                const vhonours = Object.keys(vtitles).length
                    ? `<div class="section-label">European honours</div><div class="chip-row" style="margin:var(--space-2) 0">${Object.entries(vtitles).map(([t, n]) => { const ic = (typeof europeTrophyIcon === 'function' && europeTrophyIcon(t)) || '<i class="ti ti-trophy" style="font-size:13px"></i>'; return `<span class="pill pill--gold">${ic}${compName(t)}${n > 1 ? ' ×' + n : ''}</span>`; }).join('')}</div>` : '';
                el.innerHTML = `<div class="flex-row" style="margin-bottom:var(--space-4)">${UI.crest({ name: v.name, colors: { primary: '#5A626D' } }, true)}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${v.name}</span></div>
                <p class="hint" style="margin-top:-8px">${v.country || 'Europe'} · reputation ${v.reputation}</p>
                <p class="muted">A club from ${v.country || 'a UEFA association'} that features only in the European competitions — its domestic league isn't simulated in the game.</p>${vhonours}${this.europeBestHTML(clubId)}`;
                return;
            }
            el.innerHTML = '<div class="empty">Unknown club.</div>'; return;
        }
        const hist = (GameState.clubHistory && GameState.clubHistory[clubId]) || [];
        const titleCount = {};
        hist.forEach(h => (h.trophies || []).forEach(t => titleCount[t] = (titleCount[t] || 0) + 1));
        const honours = Object.keys(titleCount).length
            ? `<div class="chip-row">${Object.entries(titleCount).map(([t, n]) => { const ic = (typeof europeTrophyIcon === 'function' && europeTrophyIcon(t)) || '<i class="ti ti-trophy" style="font-size:13px"></i>'; return `<span class="pill pill--gold">${ic}${compName(t)}${n > 1 ? ' ×' + n : ''}</span>`; }).join('')}</div>`
            : '<p class="muted">No major honours recorded yet.</p>';
        // all finishes, newest first — the container scrolls, so ~8 show and the deeper past is a scroll away
        const finishes = hist.length ? hist.slice().reverse().map(h => `<div class="frow"><span class="frow__k">${GameState.seasonLabelFor(h.year)} · ${(COMPETITIONS[h.division] || {}).short || h.division}</span><span class="frow__v">${h.position === 1 ? '🥇 ' : ''}${UI.ordinal(h.position)}${(h.trophies || []).length ? ' · 🏆 ' + h.trophies.map(t => (COMPETITIONS[t] || {}).short || t).join(', ') : ''}</span></div>`).join('')
            : '<p class="muted">No completed seasons yet.</p>';
        const euBestHTML = this.europeBestHTML(clubId);

        const mode = this.state.mode, year = GameState.seasonStartYear;
        // every player who has EVER been a client is kept — including retired/released ones, since
        // this page is meant to remember, not just show who's currently on the books. "Current
        // season" only counts appearances actually made here this season (a mid-season arrival
        // or departure still shows, just with however many games he's played here so far); "All
        // time" is the full career-at-this-club aggregate.
        const rowsData = [];
        GameState.players.filter(p => p.everClient).forEach(p => {
            const current = p.agentId === 'me' && (p.clubId === clubId || p.onLoanAt === clubId);
            if (mode === 'season') {
                const st = seasonStints(p, year).find(s => s.clubId === clubId);
                if (!st || !st.totals.apps) return;
                rowsData.push({ p, agg: st.totals, youthOnly: !!st.youth, current, tro: (p.trophies || []).filter(tr => tr.year === year && tr.clubId === clubId).length });
            } else {
                const byClub = careerByClub(p);
                const senior = byClub.find(m => m.clubId === clubId);
                const youth = byClub.find(m => m.clubId === 'u21:' + clubId);
                const registeredHere = p.clubId === clubId;
                if (!senior && !youth && !registeredHere) return;
                let agg, youthOnly = false;
                if (senior && senior.agg.apps > 0) agg = senior.agg;
                else if (youth && youth.agg.apps > 0) { agg = { apps: 0, goals: 0, assists: 0, avg: youth.agg.avg }; youthOnly = true; }
                else agg = { apps: 0, goals: 0, assists: 0, avg: 0 };
                rowsData.push({ p, agg, youthOnly, current, tro: (p.trophies || []).filter(tr => tr.clubId === clubId).length });
            }
        });
        const sorters = { apps: (a, b) => b.agg.apps - a.agg.apps, goals: (a, b) => b.agg.goals - a.agg.goals, assists: (a, b) => b.agg.assists - a.agg.assists, avg: (a, b) => b.agg.avg - a.agg.avg };
        rowsData.sort((a, b) => (b.current - a.current) || (sorters[this.state.sort] || sorters.apps)(a, b));
        const clientRows = rowsData.length ? rowsData.map(d => `<a href="${Router.link('client', d.p.id)}" class="frow" style="cursor:pointer;${d.current ? 'background:var(--accent-fill);border-radius:var(--radius-sm)' : ''}">
            <span class="frow__k">${d.p.name}${d.current ? ' <span class="pill pill--accent" style="padding:1px 6px;font-size:10px">current</span>' : ''}${d.p.retired ? ' <span class="pill" style="padding:1px 6px;font-size:10px">retired</span>' : ''}${d.youthOnly ? ' <span class="muted">(youth)</span>' : ''}</span>
            <span class="frow__v">${d.agg.apps} apps · ${d.agg.goals}g · ${UI.ratingText(d.agg.avg)}${d.tro ? ' · 🏆' + d.tro : ''}</span></a>`).join('')
            : `<p class="muted">${mode === 'season' ? 'None of your clients have played here this season.' : 'None of your clients have ever played here.'}</p>`;

        el.innerHTML = `
        <div class="flex-row" style="margin-bottom:var(--space-4)">${UI.crest(c, true)}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${c.name}</span></div>
        <p class="hint" style="margin-top:-8px"><a href="#leagues" onclick="LeaguesScreen.openFor('${c.division}');return false" style="color:var(--info-text);text-decoration:underline;text-underline-offset:2px">${c.divisionName}</a> · reputation ${c.reputation}</p>
        <div class="section-label">Honours</div>
        <div style="margin:var(--space-2) 0 var(--space-4)">${honours}</div>
        <div class="section-label">Recent finishes</div>
        <div class="fcard" style="margin-top:var(--space-2);max-height:300px;overflow-y:auto">${finishes}</div>
        ${euBestHTML}
        <a class="gbtn" style="margin-top:var(--space-3)" href="${Router.link('comphist', c.division)}"><i class="ti ti-history"></i>${c.divisionName} history</a>
        <div class="section-label">Your clients, past &amp; present</div>
        <div class="chip-row" style="margin:var(--space-2) 0 var(--space-3)">
            <button class="htog ${mode === 'season' ? 'is-on' : ''}" onclick="ClubScreen.setMode('${clubId}','season')">Current season</button>
            <button class="htog ${mode === 'all' ? 'is-on' : ''}" onclick="ClubScreen.setMode('${clubId}','all')">All time</button>
        </div>
        <div class="chip-row" style="margin:0 0 var(--space-3)">
            ${['apps', 'goals', 'assists', 'avg'].map(k => `<button class="htog ${this.state.sort === k ? 'is-on' : ''}" onclick="ClubScreen.setSort('${clubId}','${k}')">${k === 'avg' ? 'Rating' : k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
        </div>
        <div class="fcard">${clientRows}</div>`;
    },
    // Best-ever run in each European competition (UCL/UEL/UECL), if the club has ever qualified.
    europeBestHTML(clubId) {
        const eb = (GameState.clubEuropeBest && GameState.clubEuropeBest[clubId]) || null;
        if (!eb) return '';
        const labels = (typeof Europe !== 'undefined' && Europe.STAGE_LABELS) || [];
        const rows = ['UCL', 'UEL', 'UECL'].filter(k => eb[k]).map(k => {
            const b = eb[k];
            const ic = (typeof europeTrophyIcon === 'function' && europeTrophyIcon(k)) || '';
            const stage = labels[b.stage] || 'Reached';
            const won = b.stage >= 7;
            return `<div class="frow"><span class="frow__k">${ic}${compName(k)}</span><span class="frow__v"${won ? ' style="color:var(--gold)"' : ''}>${stage}${b.year != null ? ` <span class="muted">· ${GameState.seasonLabelFor(b.year)}</span>` : ''}</span></div>`;
        }).join('');
        if (!rows) return '';
        return `<div class="section-label">Best in Europe</div><div class="fcard" style="margin-top:var(--space-2)">${rows}</div>`;
    },
    setSort(clubId, k) { this.state.sort = k; Router.refresh(); },
    setMode(clubId, m) { this.state.mode = m; Router.refresh(); }
};
Router.register('clubs', { isMain: false, parent: 'leagues', title: 'Club', render(el, params) { ClubScreen.render(el, params[0]); } });
