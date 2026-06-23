// ============================================================
//  Simulation — advancing one calendar week
// ============================================================
const INJURY_TYPES = ['Knock', 'Muscle strain', 'Ankle sprain', 'Hamstring', 'Knee ligament'];
const SPONSORS = ['Nike', 'Adidas', 'Puma', 'Castrol', 'KPN', 'Heineken Zero', 'Rabobank'];

const Sim = {
    advanceWeek() {
        const events = [];
        GameState.players.forEach(p => p._weekApps = 0);

        // ---- detect season-end / rollover ----
        let rolledSeason = false, seasonFinished = false;
        const prevWeek = GameState.week;
        GameState.week += 1;

        if (prevWeek === 47) { // finals (wk47) + play-offs (wk46) done -> crown season
            seasonFinished = true;
            this._endOfSeason(events);
        }
        if (GameState.week > 52) {
            GameState.week = 1;
            this._rollNewSeason(events);
            rolledSeason = true;
        }
        const week = GameState.week;
        // individual birthdays (week 1 = 1 July): a player ages on his birth week
        GameState.players.forEach(p => { if ((p.birthWeek || 0) === week) p.age += 1; });

        // ---- mid-season loan returns (summer half/1.5-season loans end at the winter window) ----
        if (week >= 21 && week <= 25) {
            GameState.players.forEach(p => {
                if (p.onLoanAt && !isU21Loan(p) && p.loanMid && p.loanUntilSeason === GameState.seasonStartYear) {
                    const back = Clubs.getClubById(p.clubId);
                    if (p.agentId === 'me') GameState.addMail({ kind: 'news', subject: `Loan over: ${p.name}`, body: `${p.name}'s loan spell has ended; he's back at ${back ? back.name : 'his club'}.`, ttl: 3 });
                    p.onLoanAt = null; p.loanRole = null; p.loanMid = false; p.loanUntilSeason = null;
                }
            });
        }

        // ---- clubs may recall a youngster from the U21/reserves mid-season if they need him ----
        if (week >= 8 && week <= 40) {
            Agency.clients().forEach(p => {
                if (p.onLoanAt && (isU21Loan(p) || isReserveClub(p.onLoanAt)) && Math.random() < 0.02) {
                    const back = Clubs.getClubById(p.clubId);
                    p.onLoanAt = null; p.loanRole = null; p.loanMid = false;
                    p.squadRole = 'fringe';   // eased back in — occasional minutes, not a guaranteed starter
                    GameState.addLog(`${back ? back.name : 'His club'} recalled ${p.name} from the youth side.`, 'info');
                    GameState.addMail({ kind: 'news', subject: `${back ? back.name : 'Club'} recall ${p.name}`, body: `${back ? back.name : 'His club'} have pulled ${p.name} back up to the first-team squad — they want him around. Expect the odd appearance from here on.`, ttl: 4 });
                }
            });
        }

        // ---- matches + development (leagues, cups, play-offs run through week 47) ----
        if (week <= 47) {
            League.simulateWeek();
            if (week <= 45) this._simU21();
            const notes = [];
            GameState.players.forEach(p => {
                const d = PlayerDev.weeklyTick(p, p._weekApps || 0);
                if (d > 0 && p.agentId === 'me') {
                    notes.push(`${p.name} improved to ${p.ability} OVR (+${d}).`);
                    Agency.bumpRep(0.05 * d);
                }
            });
            notes.slice(0, 5).forEach(n => { GameState.addLog(n, 'dev'); events.push({ type: 'dev', text: n }); });
            if (notes.length) GameState.addMail({ kind: 'news', cat: 'dev', subject: 'Development update', body: notes.join('<br>'), ttl: 3 });
            this._injuries(events);
            this._morale();
        }

        // ---- scouts ----
        const finds = Scouts.tick();
        finds.forEach(f => {
            const names = f.players.map(pl => `${pl.name} (${pl.position}, ${pl.ability} OVR — ${Clubs.getClubById(pl.clubId)?.name})`).join('; ');
            const t = `${f.scout} (${regionName(f.region)}) reports ${f.players.length} talent(s)${f.cost ? ' (cost €' + UI.money(f.cost) + ')' : ''}: ${names}.`;
            GameState.addLog(t, 'scout'); events.push({ type: 'scout', text: t });
            GameState.addMail({ kind: 'news', subject: `Scout report — ${regionName(f.region)} (${f.players.length} found)`, body: t, ttl: 4 });
        });

        // ---- finances ----
        const income = Agency.weeklyIncome(), expenses = Agency.weeklyExpenses();
        GameState.agency.balance += income - expenses;
        if (income || expenses) events.push({ type: 'money', text: `+€${UI.money(income)} commissions, −€${UI.money(expenses)} running costs (office + scouts). Balance €${UI.money(GameState.agency.balance)}.` });
        if (GameState.agency.balance < 0) { const t = `Agency in the red (€${UI.money(GameState.agency.balance)}).`; GameState.addLog(t, 'warn'); events.push({ type: 'warn', text: t }); }

        // ---- inbox: new offers during window, sponsors anytime, expiry/persistence ----
        if (GameState.isTransferWindowOpen(week)) this._generateOffers(events);
        this._sponsorOffers(events);
        this._expireMail(events);

        GameState.save();
        return { events, rolledSeason, seasonFinished };
    },

    _simU21() {
        const year = GameState.seasonStartYear;
        Agency.clients().forEach(p => {
            if (!isU21Loan(p) || p.injury) return;
            const c = statBucket(p, year, p.onLoanAt, true, true, 'U21');
            let g = 0, a = 0;
            if (ATTACK_POS.includes(p.position) && Math.random() < 0.30 + p.ability / 220) g = 1;
            if (Math.random() < 0.18) a = 1;
            c.apps += 1; c.goals += g; c.assists += a;
            p._weekApps = (p._weekApps || 0) + 1;
            const r = Math.random();
            if (r < 0.006) c.red += 1; else if (r < 0.10) c.yellow += 1;
            let rating = 7.0 + (p.ability - 34) * 0.03 + g * 0.45 + a * 0.25 + PlayerGen.gauss(0, 0.5);
            c.ratingSum += Math.max(4, Math.min(9.9, rating));
        });
    },

    _injuries(events) {
        GameState.players.forEach(p => {
            if (p.injury) {
                p.injury.weeksOut -= 1;
                if (p.injury.weeksOut <= 0) {
                    p.injuryHistory.push({ type: p.injury.type, weeks: p.injury.total, season: GameState.seasonLabel() });
                    if (p.agentId === 'me') { const t = `${p.name} has recovered from ${p.injury.type}.`; GameState.addLog(t, 'info'); GameState.addMail({ kind: 'news', cat: 'injury', subject: `${p.name} fit again`, body: t, ttl: 2 }); }
                    p.injury = null;
                }
                return;
            }
            // small weekly injury chance, a touch higher for outfield
            if (Math.random() < 0.0035 * ((typeof Upgrades !== 'undefined') ? Upgrades.injuryRiskMult() : 1)) {
                const weeks = 1 + Math.floor(Math.random() * 11);
                p.injury = { type: INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)], weeksOut: weeks, total: weeks };
                if (p.agentId === 'me') {
                    const t = `${p.name} picked up a ${p.injury.type} — out ~${weeks} week(s).`;
                    GameState.addLog(t, 'warn'); events.push({ type: 'warn', text: t });
                    GameState.addMail({ kind: 'news', cat: 'injury', subject: `Injury: ${p.name}`, body: t, ttl: 4 });
                    p.morale.time = Math.max(0, p.morale.time - 8);
                }
            }
        });
    },

    _morale() {
        const year = GameState.seasonStartYear, week = GameState.week;
        Agency.clients().forEach(p => {
            const club = Clubs.getClubById(p.clubId);
            const rep = club ? club.reputation : 50;
            const clubTarget = Math.max(20, Math.min(95, 50 + (rep - p.ability) * 1.5));
            const tot = seasonTotals(p, year);
            const ratio = tot.apps / Math.max(1, week * 0.8);
            const timeTarget = Math.max(15, Math.min(95, ratio * 100));
            const bench = PlayerGen.wageFor(p.ability, club ? club.tier : 3);
            const wRatio = p.wage / Math.max(1, bench);
            const wageTarget = Math.max(20, Math.min(95, 30 + wRatio * 50));
            p.morale.club += (clubTarget - p.morale.club) * 0.1;
            p.morale.time += (timeTarget - p.morale.time) * 0.1;
            p.morale.wage += (wageTarget - p.morale.wage) * 0.1;
            p.morale.agent = Math.max(0, p.morale.agent - 0.2); // decays; raise via gifts/deals
        });
    },

    _generateOffers(events) {
        Agency.clients().forEach(p => {
            if (p.injury) return;
            if (p.onLoanAt) return;   // out on loan / with reserves -> no transfer interest until he's back
            // free agents: clubs approach with contract offers (no transfer fee)
            if (Agency.isFreeAgent(p)) {
                const pending = GameState.inbox.filter(m => m.kind === 'transfer' && m.offer.playerId === p.id).length;
                if (pending < 2 && Math.random() < 0.5) {
                    const cands = Clubs.allClubs.filter(c =>
                        c.reputation >= p.ability - 10 && c.reputation <= p.ability + 14 &&
                        !Agency.clubHasMyPlayerAtPos(c.id, p.position, p.id) &&
                        !GameState.inbox.some(m => m.kind === 'transfer' && m.offer.playerId === p.id && m.offer.toClubId === c.id));
                    if (cands.length) {
                        const club = cands[Math.floor(Math.random() * cands.length)];
                        const offer = Agency._offerObj(p, null, club.id, 0, { initiatedByAgent: false });
                        GameState.addMail({ kind: 'transfer', subject: `${club.name} offer ${p.name} a contract`, offer, persistence: 0, ttl: 3 });
                        events.push({ type: 'offer', text: `${club.name} want to sign free agent ${p.name}.` });
                    }
                }
                return;
            }
            const pending = GameState.inbox.filter(m => m.kind === 'transfer' && m.offer.playerId === p.id).length;
            // a club may list a player it no longer builds on, to recoup a fee
            const homeClub = Clubs.getClubById(p.clubId);
            if (homeClub && !p.transferListed && ['youth', 'fringe'].includes(p.squadRole) && p.ability < homeClub.reputation - 6 && Math.random() < 0.015) {
                p.transferListed = true;
                GameState.addMail({ kind: 'news', subject: `${homeClub.name} list ${p.name}`, body: `${homeClub.name} no longer count on ${p.name} and have placed him on the transfer list to recoup a fee.`, ttl: 4 });
                events.push({ type: 'offer', text: `${homeClub.name} have transfer-listed ${p.name}.` });
            }
            if (pending < 2) {
                const tot = seasonTotals(p, GameState.seasonStartYear);
                const attract = p.ability + Math.min(20, tot.apps) * 0.4 + (p.transferListed ? 20 : 0);
                const chance = Math.min(0.30, 0.02 + attract / 400);
                if (Math.random() < chance) {
                    const lo = p.transferListed ? p.ability - 14 : p.ability - 6;
                    const cands = Clubs.allClubs.filter(c =>
                        c.id !== p.clubId && c.reputation >= lo && c.reputation <= p.ability + 16 &&
                        !Agency.clubHasMyPlayerAtPos(c.id, p.position, p.id) &&
                        !GameState.inbox.some(m => m.kind === 'transfer' && m.offer.playerId === p.id && m.offer.toClubId === c.id));
                    if (cands.length) {
                        const buyer = cands[Math.floor(Math.random() * cands.length)];
                        const fee = Agency.estimateFee(p, buyer);
                        const offer = Agency._offerObj(p, p.clubId, buyer.id, fee, { initiatedByAgent: false });
                        GameState.addMail({ kind: 'transfer', subject: `${buyer.name} bid for ${p.name}`, offer, persistence: Math.random() < 0.5 ? 1 : 0, ttl: 1 + Math.floor(Math.random() * 3) });
                        events.push({ type: 'offer', text: `${buyer.name} bid €${UI.money(fee)} for ${p.name} (${ROLE_LABEL[offer.role]}).` });
                    }
                }
            }
            // loan offers if loan-listed
            if (p.loanListed && !p.onLoanAt && !GameState.inbox.find(m => m.kind === 'loan' && m.offer.playerId === p.id)) {
                if (Math.random() < 0.4) {
                    const club = Clubs.getClubById(p.clubId);
                    const dest = Agency._findLoanClub(p, club || Clubs.allClubs[0]);
                    if (dest && !Agency.clubHasMyPlayerAtPos(dest.id, p.position, p.id)) {
                        GameState.addMail({ kind: 'loan', subject: `${dest.name} want ${p.name} on loan`, offer: { playerId: p.id, fromClubId: p.clubId, toClubId: dest.id, role: Agency.maxRoleAt(p, dest) === 'key' ? 'starter' : Agency.maxRoleAt(p, dest) }, persistence: 0, ttl: 2 });
                        events.push({ type: 'offer', text: `${dest.name} want ${p.name} on loan.` });
                    }
                }
            }
        });
    },

    _sponsorOffers(events) {
        if (GameState.week !== 49) return;                          // sponsors come calling once a year, in the off-season
        const level = Upgrades.sponsorLevel();
        const mult = { local: 1, regional: 1.6, national: 2.6, international: 4.5, worldwide: 8 }[level] || 1;
        Agency.clients().forEach(p => {
            if (p._sponsorSeason === GameState.seasonStartYear) return;
            if (GameState.inbox.find(m => m.kind === 'sponsor' && m.offer.playerId === p.id)) return;
            const tot = seasonTotals(p, GameState.seasonStartYear);
            const profile = p.ability + tot.goals * 2 + (tot.avg > 7 ? 10 : 0);
            if (profile < 42) return;
            p._sponsorSeason = GameState.seasonStartYear;
            const wBase = Math.round(Math.pow(Math.max(1, p.ability - 38), 1.5) * mult / 10) * 10 + 20;
            const aBase = wBase * 30;
            const pool = []; const used = new Set();
            while (pool.length < 3) { const c = Upgrades.pickSponsor(level); if (!used.has(c)) { used.add(c); pool.push(c); } if (used.size > 30) break; }
            const opts = [
                { company: pool[0], weekly: Math.round(wBase * 1.2 / 10) * 10, annual: Math.round(aBase * 0.4 / 100) * 100, termSeasons: 3 },
                { company: pool[1] || pool[0], weekly: wBase, annual: Math.round(aBase / 100) * 100, termSeasons: 2 },
                { company: pool[2] || pool[0], weekly: Math.round(wBase * 0.6 / 10) * 10, annual: Math.round(aBase * 2.2 / 100) * 100, termSeasons: 1 },
            ];
            const offer = { playerId: p.id, level, options: opts };
            GameState.addMail({ kind: 'sponsor', subject: `Sponsorship offers for ${p.name}`, offer, persistence: 0, ttl: 5 });
            events.push({ type: 'offer', text: `${SPONSOR_LABEL[level]} sponsors are interested in ${p.name} — three offers to weigh up.` });
        });
    },

    _expireMail(events) {
        const keep = [];
        GameState.inbox.forEach(m => {
            if (m.ttl == null) { keep.push(m); return; }
            m.ttl -= 1;
            if (m.ttl > 0) { keep.push(m); return; }
            // expiring
            if (m.kind === 'transfer' && (m.persistence || 0) > 0) {
                const p = GameState.getPlayer(m.offer.playerId);
                const to = Clubs.getClubById(m.offer.toClubId);
                if (p && to) {
                    const improved = { ...m.offer, transferFee: Math.round(m.offer.transferFee * 1.12 / 500) * 500, proposedWage: Math.round(m.offer.proposedWage * 1.1 / 10) * 10 };
                    keep.push({ id: 'm_' + Math.random().toString(36).slice(2, 9), kind: 'transfer', subject: `${to.name} improve bid for ${p.name}`, offer: improved, persistence: m.persistence - 1, ttl: 2, week: GameState.week, season: GameState.seasonLabel(), read: false });
                    events.push({ type: 'offer', text: `${to.name} came back with an improved bid for ${p.name}.` });
                }
            }
            // else: drops silently
        });
        GameState.inbox = keep;
    },

    _endOfSeason(events) {
        const awarded = League.finishSeason();
        const year = GameState.seasonStartYear;
        // record each club's finishing position + trophies (persists across seasons)
        if (!GameState.clubHistory) GameState.clubHistory = {};
        ['ERE', 'EED', 'TWD', 'DRD'].forEach(div => {
            League.sortedTable(div).forEach((row, i) => {
                const trophies = awarded.filter(a => a.clubId === row.clubId).map(a => a.compId);
                if (!GameState.clubHistory[row.clubId]) GameState.clubHistory[row.clubId] = [];
                GameState.clubHistory[row.clubId].push({ year, division: div, position: i + 1, trophies });
                if (GameState.clubHistory[row.clubId].length > 40) GameState.clubHistory[row.clubId].shift();
            });
        });
        // build summary of client trophies
        const L = GameState.league;
        const lines = [];
        awarded.forEach(a => {
            if (a.clients.length) {
                const names = a.clients.map(id => GameState.getPlayer(id)?.name).filter(Boolean).join(', ');
                lines.push(`${compName(a.compId)} — ${Clubs.getClubById(a.clubId)?.name}: ${names}`);
            }
        });
        const champs = ['ERE', 'EED', 'TWD', 'DRD'].map(d => `${COMPETITIONS[d].name}: ${Clubs.getClubById(League.sortedTable(d)[0]?.clubId)?.name || '—'}`).join('<br>');
        const cupLine = `KNVB Beker: ${Clubs.getClubById(L?.beker?.winner)?.name || '—'}<br>De kleine Beker: ${Clubs.getClubById(L?.kbek?.winner)?.name || '—'}`;
        const poLine = ['EED', 'TWD', 'DRD'].map(d => L?.playoffs?.[d] ? `${COMPETITIONS[d].short} play-off won by ${Clubs.getClubById(L.playoffs[d].winner)?.name} (promoted)` : null).filter(Boolean).join('<br>');
        const body = `<strong>Season ${GameState.seasonLabel()} is over.</strong><br><br>Champions:<br>${champs}<br><br>Cups:<br>${cupLine}<br><br>` +
            (poLine ? `Promotion play-offs:<br>${poLine}<br><br>` : '') +
            (lines.length ? `🏆 Your clients won:<br>${lines.join('<br>')}` : 'None of your clients won silverware this season.') +
            `<br><br>Final tables, cups and play-offs are viewable in the Leagues tab.`;
        GameState.addMail({ kind: 'summary', subject: `Season ${GameState.seasonLabel()} review`, body, ttl: 8 });

        // snapshot the finished season so it stays viewable after the rollover
        GameState.lastSeasonReport = {
            year,
            champions: { ...((L && L.champions) || {}) },
            beker: L && L.beker ? { winner: L.beker.winner, results: L.beker.results } : null,
            kbek: L && L.kbek ? { winner: L.kbek.winner, results: L.kbek.results, groups: L.kbek.groups } : null,
            playoffs: L && L.playoffs ? { EED: L.playoffs.EED, TWD: L.playoffs.TWD, DRD: L.playoffs.DRD } : null,
            prorel: null
        };
        GameState.addLog(`Season ${GameState.seasonLabel()} finished.`, 'season');
        events.push({ type: 'season', text: `Season ${GameState.seasonLabel()} finished — see your inbox for the review.` });

        // bring everyone home for the off-season: out of the U21/reserves and back from loans that end this season,
        // so they're at their parent club and ready to negotiate before the new campaign
        const backNames = [];
        GameState.players.forEach(p => {
            if (p.agentId !== 'me' || !p.onLoanAt) return;
            const isYouth = isU21Loan(p) || isReserveClub(p.onLoanAt);
            const loanEnds = p.loanUntilSeason == null || p.loanUntilSeason <= year;
            if (isYouth || loanEnds) {
                p.onLoanAt = null; p.loanRole = null; p.loanMid = false; p.loanUntilSeason = null;
                if (isYouth) p.squadRole = 'fringe';   // returns as a squad option, not an automatic starter
                backNames.push(p.name);
            }
        });
        if (backNames.length) GameState.addMail({ kind: 'news', subject: 'Players back for pre-season', body: `Back at their parent clubs for the off-season: ${backNames.join(', ')}. You can arrange transfers, loans or new terms before the new season.`, ttl: 6 });
    },

    _rollNewSeason(events) {
        const year = GameState.seasonStartYear;
        // promotion/relegation from the finished season (moves clubs between divisions)
        const prorel = League.applyPromotionRelegation();
        if (GameState.lastSeasonReport) GameState.lastSeasonReport.prorel = prorel;
        if (prorel) {
            const nm = id => Clubs.getClubById(id)?.name || id;
            GameState.addMail({
                kind: 'news', subject: 'Promotion & relegation',
                body: `<strong>Up to Eredivisie:</strong> ${prorel.eedUp.map(nm).join(', ')}<br>` +
                    `<strong>Down from Eredivisie:</strong> ${prorel.ereDown.map(nm).join(', ')}<br><br>` +
                    `<strong>Up to Eerste:</strong> ${prorel.twdUp.map(nm).join(', ')}<br>` +
                    `<strong>Down from Eerste:</strong> ${prorel.eedDown.map(nm).join(', ')}<br><br>` +
                    `<strong>Up to Tweede:</strong> ${prorel.drdUp.map(nm).join(', ')}<br>` +
                    `<strong>Down from Tweede:</strong> ${prorel.twdDown.map(nm).join(', ')}`, ttl: 6
            });
        }
        GameState.players.forEach(p => {
            if (p.onLoanAt && (p.loanUntilSeason == null || p.loanUntilSeason <= year)) { p.onLoanAt = null; p.loanRole = null; p.loanMid = false; }
            if (p.agentId !== 'me' && p.stats) {
                Object.keys(p.stats).forEach(y => { if (+y < year - 3) delete p.stats[y]; });
            }
        });
        GameState.seasonStartYear += 1;
        // contracts that have run out -> the player becomes a free agent (no club, free transfer, unsettled)
        GameState.players.forEach(p => {
            if (p.agentId === 'me' && !p.freeAgent && p.clubId && p.contractUntilSeason != null && p.contractUntilSeason < GameState.seasonStartYear) {
                const old = Clubs.getClubById(p.clubId);
                p.freeAgent = true; p.clubId = null; p.onLoanAt = null; p.loanRole = null; p.squadRole = 'fringe';
                p.morale.club = Math.max(0, p.morale.club - 25);
                GameState.addMail({ kind: 'news', subject: `${p.name} is a free agent`, body: `${p.name}'s contract at ${old ? old.name : 'his club'} has expired — he's now a free agent. Any club can sign him without a fee, but he's unsettled (morale has dropped). Interested clubs should table contract offers soon.`, ttl: 6 });
                GameState.addLog(`${p.name} is now a free agent.`, 'contract');
            }
        });
        // sponsor deals: pay the yearly instalment for active deals, expire the ones that have run out
        GameState.players.forEach(p => {
            if (p.agentId !== 'me' || !p.sponsorDeals || !p.sponsorDeals.length) return;
            const keep = [];
            p.sponsorDeals.forEach(d => {
                if (d.untilSeason >= GameState.seasonStartYear) {
                    const cut = Math.round((d.annual || 0) * p.sponsorCommission / 100);
                    if (cut) GameState.agency.balance += cut;
                    keep.push(d);
                } else {
                    p.sponsorIncome = Math.max(0, p.sponsorIncome - d.weekly);   // deal lapses
                }
            });
            p.sponsorDeals = keep;
        });
        Upgrades.facRollover();
        GameState.players.forEach(p => {
            if (p.agentId === 'me' && p.repUntilSeason != null && p.repUntilSeason < GameState.seasonStartYear && !p.repExpired) {
                p.repExpired = true;
                GameState.addMail({ kind: 'news', subject: `Representation term up: ${p.name}`, body: `Your representation deal with ${p.name} has run its course. He stays with your agency, and you can now release him at no cost whenever you like.`, ttl: 6 });
            }
        });
        League.setupSeason();
        const t = `New season ${GameState.seasonLabel()} begins.`;
        GameState.addLog(t, 'season'); events.push({ type: 'season', text: t });
    }
};
