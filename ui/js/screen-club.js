// ============================================================
//  Club profile — honours, recent finishes, your clients there.
// ============================================================
const ClubScreen = {
    state: { sort: 'apps' },
    render(el, clubId) {
        const c = Clubs.getClubById(clubId);
        if (!c) { el.innerHTML = '<div class="empty">Unknown club.</div>'; return; }
        const hist = (GameState.clubHistory && GameState.clubHistory[clubId]) || [];
        const titleCount = {};
        hist.forEach(h => (h.trophies || []).forEach(t => titleCount[t] = (titleCount[t] || 0) + 1));
        const honours = Object.keys(titleCount).length
            ? `<div class="chip-row">${Object.entries(titleCount).map(([t, n]) => `<span class="pill pill--gold"><i class="ti ti-trophy" style="font-size:13px"></i>${compName(t)}${n > 1 ? ' ×' + n : ''}</span>`).join('')}</div>`
            : '<p class="muted">No major honours recorded yet.</p>';
        const finishes = hist.length ? hist.slice().reverse().slice(0, 8).map(h => `<div class="frow"><span class="frow__k">${GameState.seasonLabelFor(h.year)} · ${(COMPETITIONS[h.division] || {}).short || h.division}</span><span class="frow__v">${h.position === 1 ? '🥇 ' : ''}${UI.ordinal(h.position)}${(h.trophies || []).length ? ' · 🏆 ' + h.trophies.map(t => (COMPETITIONS[t] || {}).short || t).join(', ') : ''}</span></div>`).join('')
            : '<p class="muted">No completed seasons yet.</p>';

        // every player who has EVER been a client is kept — including retired/released ones, since
        // this page is meant to remember, not just show who's currently on the books
        const rowsData = [];
        GameState.players.filter(p => p.everClient).forEach(p => {
            const byClub = careerByClub(p);
            const senior = byClub.find(m => m.clubId === clubId);
            const youth = byClub.find(m => m.clubId === 'u21:' + clubId);
            const registeredHere = p.clubId === clubId;
            if (!senior && !youth && !registeredHere) return;
            let agg, youthOnly = false;
            if (senior && senior.agg.apps > 0) agg = senior.agg;
            else if (youth && youth.agg.apps > 0) { agg = { apps: 0, goals: 0, assists: 0, avg: youth.agg.avg }; youthOnly = true; }
            else agg = { apps: 0, goals: 0, assists: 0, avg: 0 };
            const current = p.agentId === 'me' && (p.clubId === clubId || p.onLoanAt === clubId);
            rowsData.push({ p, agg, youthOnly, current, tro: (p.trophies || []).filter(tr => tr.clubId === clubId).length });
        });
        const sorters = { apps: (a, b) => b.agg.apps - a.agg.apps, goals: (a, b) => b.agg.goals - a.agg.goals, assists: (a, b) => b.agg.assists - a.agg.assists, avg: (a, b) => b.agg.avg - a.agg.avg };
        rowsData.sort((a, b) => (b.current - a.current) || (sorters[this.state.sort] || sorters.apps)(a, b));
        const clientRows = rowsData.length ? rowsData.map(d => `<a href="${Router.link('client', d.p.id)}" class="frow" style="cursor:pointer;${d.current ? 'background:var(--accent-fill);border-radius:var(--radius-sm)' : ''}">
            <span class="frow__k">${d.p.name}${d.current ? ' <span class="pill pill--accent" style="padding:1px 6px;font-size:10px">current</span>' : ''}${d.p.retired ? ' <span class="pill" style="padding:1px 6px;font-size:10px">retired</span>' : ''}${d.youthOnly ? ' <span class="muted">(youth)</span>' : ''}</span>
            <span class="frow__v">${d.agg.apps} apps · ${d.agg.goals}g · ${UI.ratingText(d.agg.avg)}${d.tro ? ' · 🏆' + d.tro : ''}</span></a>`).join('')
            : '<p class="muted">None of your clients have ever played here.</p>';

        el.innerHTML = `
        <div class="flex-row" style="margin-bottom:var(--space-4)">${UI.crest(c, true)}<span style="font-size:var(--fs-2xl);font-weight:var(--weight-semibold)">${c.name}</span></div>
        <p class="hint" style="margin-top:-8px">${c.divisionName} · reputation ${c.reputation}</p>
        <div class="section-label">Honours</div>
        <div style="margin:var(--space-2) 0 var(--space-4)">${honours}</div>
        <div class="section-label">Recent finishes</div>
        <div class="fcard" style="margin-top:var(--space-2)">${finishes}</div>
        <div class="section-label">Your clients, past &amp; present</div>
        <div class="chip-row" style="margin:var(--space-2) 0 var(--space-3)">
            ${['apps', 'goals', 'assists', 'avg'].map(k => `<button class="htog ${this.state.sort === k ? 'is-on' : ''}" onclick="ClubScreen.setSort('${clubId}','${k}')">${k === 'avg' ? 'Rating' : k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
        </div>
        <div class="fcard">${clientRows}</div>`;
    },
    setSort(clubId, k) { this.state.sort = k; Router.refresh(); }
};
Router.register('clubs', { isMain: false, title: 'Club', render(el, params) { ClubScreen.render(el, params[0]); } });
