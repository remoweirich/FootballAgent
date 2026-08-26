// ============================================================
//  Dialogue — client personality, bond, and conversation scenes
//  (Phase 1 of the client-relationship system; see
//  docs/client-dialogue-design.md)
//
//  Pure logic, no DOM. Lines come from DIALOGUE_DATA, generated
//  from dialogue_lines.xlsx by scripts/parse-dialogue-xlsx.mjs.
//  The chat UI lives in ui/js/screen-dialogue.js.
// ============================================================
const Dialogue = {
    // ---- personality ----
    // Four axes, two poles each. Every player gets a primary and a secondary pole from two
    // DIFFERENT axes. Personality is hidden at signing and revealed through conversations;
    // the reveal state is stored alongside the roll.
    AXES: [
        ['hothead', 'professional'],
        ['showman', 'humble'],
        ['homebody', 'adventurer'],
        ['loyal', 'mercenary']
    ],
    POLE_LABEL: {
        hothead: 'Hothead', professional: 'Professional', showman: 'Showman', humble: 'Humble',
        homebody: 'Homebody', adventurer: 'Adventurer', loyal: 'Loyal', mercenary: 'Mercenary'
    },

    // Lazily assigned so every player from an older save gets one the first time it matters.
    ensurePersonality(p) {
        if (p.personality && p.personality.primary) return p.personality;
        const ai = Math.floor(Rng.next() * this.AXES.length);
        let bi = Math.floor(Rng.next() * (this.AXES.length - 1));
        if (bi >= ai) bi++;
        p.personality = {
            primary: this.AXES[ai][Math.floor(Rng.next() * 2)],
            secondary: this.AXES[bi][Math.floor(Rng.next() * 2)],
            revP: false, revS: false
        };
        return p.personality;
    },
    // what the agent KNOWS about him (revealed poles only); null when nothing is known yet
    knownPersona(p) {
        const pe = p.personality;
        if (!pe) return null;
        const parts = [];
        if (pe.revP) parts.push(this.poleLabel(pe.primary));
        if (pe.revS) parts.push(this.poleLabel(pe.secondary));
        return parts.length ? parts.join(' · ') : null;
    },
    hasTrait(p, pole) {
        const pe = this.ensurePersonality(p);
        return pe.primary === pole || pe.secondary === pole;
    },
    // a conversation teaches you something about the man, gradually
    _maybeReveal(p, forcePole) {
        const pe = this.ensurePersonality(p);
        if (forcePole) {
            if (pe.primary === forcePole && !pe.revP) { pe.revP = true; return this.POLE_LABEL[forcePole]; }
            if (pe.secondary === forcePole && !pe.revS) { pe.revS = true; return this.POLE_LABEL[forcePole]; }
        }
        if (!pe.revP && Rng.next() < 0.6) { pe.revP = true; return this.poleLabel(pe.primary); }
        if (pe.revP && !pe.revS && Rng.next() < 0.4) { pe.revS = true; return this.poleLabel(pe.secondary); }
        return null;
    },

    // ---- bond (career-long trust; slow, mostly earned at big moments) ----
    TIERS: [[75, 'Family'], [50, 'Confidant'], [25, 'Trusted'], [0, 'Business']],
    bondOf(p) {
        if (p.bond == null) {
            // seed from how he currently feels about you, so a settled long-term client
            // doesn't start from zero
            const agent = (p.morale && p.morale.agent) || 50;
            p.bond = Math.max(0, Math.min(10, Math.round((agent - 50) / 5)));
        }
        return p.bond;
    },
    tierOf(bond) { for (const [min, name] of this.TIERS) if (bond >= min) return name; return 'Business'; },
    tierName(p) { return this.tierOf(this.bondOf(p)); },
    addBond(p, delta, why) {
        if (!p || p.agentId !== 'me') return;
        const before = this.bondOf(p);
        p.bond = Math.max(0, Math.min(100, before + delta));
        const tb = this.tierOf(before), ta = this.tierOf(p.bond);
        if (ta !== tb && p.bond > before) {
            GameState.addLog(I18n.t('dlg.bond.log', { name: p.name, tier: this.tierLabel(ta) }), 'morale');
            // growing trust loosens the tongue: crossing a tier, he volunteers something personal
            const vol = p.archived ? '' : this._volunteerFact(p);
            const rel = I18n.t('dlg.bond.rel.' + ta.toLowerCase());
            const whyTxt = why ? ' (' + this._tk('dlg.why.' + why, why) + ')' : '';
            GameState.addMail({
                kind: 'news', cat: 'morale', subject: I18n.t('dlg.bond.subj', { name: p.name, tier: this.tierLabel(ta) }),
                body: I18n.t('dlg.bond.body', { name: p.name, rel, extra: whyTxt + vol }), ttl: 4
            });
        }
        // a big shared moment at Confidant+ sometimes moves him to give something back (Phase 4)
        if (delta > 0 && this._maybeThanks) this._maybeThanks(p, delta);
    },
    // Trusted+ perk: he gives you more time before taking a complaint further
    patienceBonusWeeks(p) { return this.bondOf(p) >= 25 ? 2 : 0; },

    // ---- line picking ----
    // How this client addresses you when {agent} appears in a line: first-name terms once the bond
    // reaches Trusted (25+), but the formal "Mr/Mrs <surname>" (Herr/Frau in German) while it is still
    // only Business. Falls back to the full name when no gender was chosen (e.g. an older save).
    _agentAddress(p) {
        const full = (GameState.agentName && GameState.agentName()) || '';
        if (!full) return 'boss';
        const parts = full.split(/\s+/), first = parts[0];
        if (!p || this.bondOf(p) >= 25) return first;   // Trusted and up -> first name
        const gender = (GameState.agency && GameState.agency.agentGender) || '';
        const surname = parts.length > 1 ? parts.slice(1).join(' ') : first;
        if (gender === 'male') return (this._isDe() ? 'Herr ' : 'Mr ') + surname;
        if (gender === 'female') return (this._isDe() ? 'Frau ' : 'Mrs ') + surname;
        if (gender === 'other') return (this._isDe() ? 'Hallo ' : 'Dear ') + full;   // non-binary / prefer not to say
        return full;
    },
    fill(text, p, extra) {
        const club = (typeof Clubs !== 'undefined') && Clubs.getClubById(effectiveClubId(p));
        const agent = this._agentAddress(p);
        let out = String(text)
            .replace(/\{first\}/g, (p.name || '').split(' ')[0] || p.name)
            .replace(/\{name\}/g, p.name || '')
            .replace(/\{club\}/g, club ? club.name : 'the club')
            .replace(/\{agent\}/g, agent)
            .replace(/\{position\}/g, p.position || '');
        if (extra) for (const k of Object.keys(extra)) {
            let v = extra[k];
            // localize discovered "vocabulary" values (hobby, keepsake, occasion, ...) at fill time,
            // so a value stored/generated in one language still reads right in the current locale
            if (this._isDe() && DIALOGUE_DE.vocab && DIALOGUE_DE.vocab[v]) v = DIALOGUE_DE.vocab[v];
            out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
        }
        return out;
    },
    // German dialogue lives in a parallel data file (js/dialogue-data-de.js, `DIALOGUE_DE`), keyed by
    // the same stable line ids; any line without a translation falls back to the English workbook text.
    _isDe() { return typeof I18n !== 'undefined' && I18n.locale === 'de' && typeof DIALOGUE_DE !== 'undefined'; },
    _deTxt(row) { return (this._isDe() && DIALOGUE_DE.lines && DIALOGUE_DE.lines[row.id]) || row.text; },
    // localized "{n} appearances" / "{n} career goals" milestone label (frozen when the moment is queued)
    _mileText(kind, n) {
        if (this._isDe() && DIALOGUE_DE.mile && DIALOGUE_DE.mile[kind]) return DIALOGUE_DE.mile[kind].replace('{n}', n);
        return kind === 'apps' ? `${n} appearances` : `${n} career goals`;
    },
    // localized display for the identifier-keyed engine values (personality poles, bond tiers, services);
    // each falls back to its English source, so the underlying keys stay stable for the game logic
    _tk(key, fallback) { const s = (typeof I18n !== 'undefined') ? I18n.t(key) : key; return s === key ? fallback : s; },
    poleLabel(key) { return this._tk('dlg.pers.' + key, this.POLE_LABEL[key] || key); },
    tierLabel(name) { return this._tk('dlg.tier.' + String(name).toLowerCase(), name); },
    serviceLabel(kind) { return this._tk('dlg.svc.' + kind, (this.SERVICES[kind] || {}).label); },
    locVocab(v) { return (this._isDe() && DIALOGUE_DE.vocab && DIALOGUE_DE.vocab[v]) || v; },
    // Prefer lines written for his personality over generic ones, and avoid anything he has said
    // recently. Falls back gracefully: personality pool -> any pool -> ignore the seen-filter.
    _pick(rows, p, extra) {
        const pe = this.ensurePersonality(p);
        const seen = p._linesSeen || [];
        const mine = rows.filter(r => r.personality === pe.primary || r.personality === pe.secondary);
        const generic = rows.filter(r => r.personality === 'any');
        let pool = mine.length && Rng.next() < 0.75 ? mine : generic;
        if (!pool.length) pool = mine.length ? mine : rows;
        if (!pool.length) return null;
        const fresh = pool.filter(r => !seen.includes(r.id));
        const row = (fresh.length ? fresh : pool)[Math.floor(Rng.next() * (fresh.length ? fresh.length : pool.length))];
        p._linesSeen = seen.concat(row.id).slice(-40);
        return { id: row.id, text: this.fill(this._deTxt(row), p, extra) };
    },

    choiceLabel(scene, choice) {
        const r = (DIALOGUE_DATA.choices || []).find(c => c.scene === scene && c.choice === choice);
        const de = this._isDe() ? DIALOGUE_DE : null;
        const dc = de && de.choices && de.choices[scene + '|' + choice];
        const say = (de && de.say && de.say[scene + ':' + choice]) || this.SAY[scene + ':' + choice] || '';
        if (r) return { label: (dc && dc.label) || r.label, hint: (dc && dc.hint) || r.hint, say };
        return { label: (dc && dc.label) || choice, hint: (dc && dc.hint) || '', say };
    },
    // What the AGENT actually SAYS when you pick a choice — full prose, so his side of the chat reads
    // like real speech instead of a stage direction ("Listen" → an actual line). The buttons keep their
    // short labels; this is only the spoken bubble. Keyed "scene:choice"; falls back to the label.
    // (Prose lives in code by design for now; a future pass can lift it into the dialogue workbook.)
    SAY: {
        'complaint:listen': "Talk to me. Whatever it is, I want to hear it — all of it.",
        'complaint:promise': "Alright. Here's what I'm going to do about it.",
        'complaint:pushback': "I hear you. But let me be straight with you for a second.",
        'complaint:deflect': "Let's not get ahead of ourselves. Give it a little time yet.",
        'promise:move': "Leave it with me. I'll find you the right move — the right club, not just any club.",
        'promise:newContract': "I'll get you the deal you deserve at this club. Give me a bit of time.",
        'promise:playingTime': "I'll have a proper word with the manager about your minutes. We'll sort this.",
        'promise:renegotiateRep': "And I'll take less on my end to make it happen. That's how much I back you.",
        'gift:praise': "You earned this. Every bit of it — don't let anyone tell you otherwise.",
        'gift:modest': "It's nothing, honestly. Just wanted you to know I'm paying attention.",
        'prematch:calm': "Breathe. You've done all the work already. Just go and play your game.",
        'prematch:fireup': "This is your night. Go out there and take it — leave nothing behind.",
        'prematch:bonus': "Tell you what — you win this one, and there's a little something extra in it for you.",
        'bonus:small': "You win tonight and there's a gift in it for you. My word on it.",
        'bonus:medium': "Win this and I'll look after you properly — that's a promise.",
        'bonus:large': "You bring this home and I'll make it worth your while, big time. My word.",
        'postwin:toast': "Come here — that was special. Let's enjoy this one.",
        'postwin:quiet': "Beautifully done. I'll let you get back to the lads.",
        'postwin:tab': "Everything's on me tonight. You've more than earned it.",
        'postloss:sit': "Sit with me a minute. It stings now — it won't for long.",
        'postloss:space': "I'll leave you to it. Head up. We go again.",
        'postloss:speech': "Listen to me. One game doesn't define you. Don't you dare forget that.",
        'farewell:career': "What a career it's been. You should be proud of every single minute.",
        'farewell:personal': "Forget the football a second — I'm just glad I got to know you.",
        'checkin:q-life': "So how are things away from the pitch? Everything good at home?",
        'checkin:q-club': "How are you settling in at the club? Getting on with everyone?",
        'checkin:q-ambition': "Where do you want all this to go? What are we really aiming for?",
        'checkin:q-room': "Who do you knock about with in the dressing room these days?",
        'checkin:q-none': "No agenda today. I just wanted to see how you're doing.",
        'moment:praise': "That was some moment. Take it all in — you earned it.",
        'moment:modest': "Quietly brilliant, that. Well played.",
        'injury:there': "I'm coming to see you. You're not going through this on your own.",
        'injury:flowers': "I'll send something over — just so you know I'm thinking of you.",
        'thanks:cherish': "This means a great deal to me. I'll keep it, honestly.",
        'thanks:banter': "You didn't have to do that, you soft sod. Cheers, though — really.",
        'invite:attend': "Wouldn't miss it for the world. I'll be right there in the stands.",
        'invite:gift': "I can't make it in person, but let me send something to mark the day.",
        'invite:decline': "I can't be there this time — but I'm with you in spirit, you know that.",
    },

    // =================================================== complaint scene
    // Launched from the client's open-case card ("Talk to him"). One conversation per cooldown
    // window, stage 1 and 2 only; at stage 3 talking is over by design.
    canTalk(p) {
        const c = p.moraleCase;
        if (!c || c.stage > 2) return { ok: false, reason: 'no case' };
        const aw = GameState.absWeek();
        const cdWeeks = (typeof MORALE !== 'undefined' ? MORALE.TALK_COOLDOWN_WEEKS : 4);
        if (p._talkCooldownAbs != null && aw - p._talkCooldownAbs < cdWeeks)
            return { ok: false, reason: 'cooldown', weeksLeft: Math.ceil(cdWeeks - (aw - p._talkCooldownAbs)) };
        return { ok: true };
    },
    buildComplaintScene(p) {
        const c = p.moraleCase; if (!c) return null;
        const stage = String(Math.min(2, c.stage));
        const opens = DIALOGUE_DATA.complaint.filter(r => r.beat === 'open'
            && (r.dim === c.dim || r.dim === 'any') && (r.stage === stage || r.stage === 'any'));
        const open = this._pick(opens, p);
        const keys = c.stage === 1 ? ['listen', 'promise', 'pushback', 'deflect'] : ['listen', 'pushback'];
        const choices = keys
            .filter(k => k !== 'promise' || (!c.promise && Agency.validPromiseTypes(p).length))
            .map(k => ({ key: k, ...this.choiceLabel('complaint', k) }));
        return { kind: 'complaint', playerId: p.id, dim: c.dim, stage: c.stage, open, choices };
    },
    // Whether pushing back lands. Deterministic and learnable: professionals respect a straight
    // answer, hotheads never take it, everyone else needs real trust behind it.
    _pushbackWorks(p) {
        if (this.hasTrait(p, 'hothead')) return { good: false, drove: 'hothead' };
        if (this.hasTrait(p, 'professional')) return { good: true, drove: 'professional' };
        return { good: this.bondOf(p) >= 50, drove: null };
    },
    // Apply a complaint-scene choice. Returns { reply: {id,text}, ok, revealed, closed }.
    // For 'promise', promiseType must be one of Agency.validPromiseTypes(p).
    resolveComplaint(p, choiceKey, promiseType) {
        const c = p.moraleCase; if (!c) return { ok: false, message: I18n.t('dlg.talk.noCase') };
        const aw = GameState.absWeek();
        const M = (typeof MORALE !== 'undefined') ? MORALE : { TALK_AGENT_BONUS: 6 };
        const replies = (choice, outcome) => DIALOGUE_DATA.complaint.filter(r => r.beat === 'reply'
            && r.choice === choice && (r.outcome === outcome || r.outcome === 'any'));
        let outcome = 'good', revealDriver = null, closed = false;

        if (choiceKey === 'listen') {
            p.morale.agent = Math.min(100, p.morale.agent + (M.TALK_AGENT_BONUS || 6));
            c.sinceAbsWeek += 2;                       // being heard buys patience
            GameState.addLog(I18n.t('dlg.talk.through', { name: p.name }), 'morale');
        } else if (choiceKey === 'promise') {
            const r = Agency.makePromise(p, promiseType);
            if (!r.ok) return { ok: false, message: r.message };
        } else if (choiceKey === 'pushback') {
            const res = this._pushbackWorks(p);
            outcome = res.good ? 'good' : 'bad';
            revealDriver = res.drove;
            if (res.good) {
                p.moraleCase = null; closed = true;    // he accepts your view; the matter is dropped
                p.morale.agent = Math.min(100, p.morale.agent + 4);
                this.addBond(p, 2, 'straightAnswer');
                GameState.addLog(I18n.t('dlg.talk.resolved', { name: p.name }), 'morale');
            } else {
                p.morale[c.dim] = Math.max(0, p.morale[c.dim] - 4);
                p.morale.agent = Math.max(0, p.morale.agent - 3);
                c.sinceAbsWeek -= 2;                   // you made it worse
                GameState.addLog(I18n.t('dlg.talk.badly', { name: p.name }), 'morale');
            }
        } else if (choiceKey === 'deflect') {
            outcome = 'bad';
            c.sinceAbsWeek += 2;                       // bought time
            p.morale.agent = Math.max(0, p.morale.agent - 2);   // at a price
        } else {
            return { ok: false, message: I18n.t('dlg.talk.unknownChoice') };
        }
        p._talkCooldownAbs = aw;
        const reply = this._pick(replies(choiceKey, outcome), p);
        const revealed = this._maybeReveal(p, revealDriver);
        return { ok: true, reply, outcome, revealed, closed };
    },

    // =================================================== gift scene
    buildGiftScene(p, tier, diminished) {
        const mood = diminished ? 'diminished' : 'fresh';
        const reacts = DIALOGUE_DATA.gifts.filter(r => r.beat === 'react'
            && (r.tier === tier || r.tier === 'any') && (r.mood === mood || r.mood === 'any'));
        const react = this._pick(reacts, p);
        const choices = ['praise', 'modest'].map(k => ({ key: k, ...this.choiceLabel('gift', k) }));
        return { kind: 'gift', playerId: p.id, tier, diminished: !!diminished, react, choices };
    },
    // Your parting words after a gift. A small read on the man: showmen enjoy the praise,
    // professionals and the humble prefer you keep it grounded.
    resolveGiftClose(p, choiceKey) {
        const rows = DIALOGUE_DATA.gifts.filter(r => r.beat === 'close' && r.choice === choiceKey);
        const matched = choiceKey === 'praise'
            ? (this.hasTrait(p, 'showman') || this.hasTrait(p, 'mercenary'))
            : (this.hasTrait(p, 'professional') || this.hasTrait(p, 'humble'));
        if (matched) p.morale.agent = Math.min(100, p.morale.agent + 1);
        const reply = this._pick(rows, p);
        const revealed = Rng.next() < 0.35 ? this._maybeReveal(p) : null;
        return { ok: true, reply, matched, revealed };
    },

    // =================================================== final-day rituals (Phase 2)
    // Which parting words suit which man. A choice "matches" when either of his poles is in the
    // set; matched choices earn the relationship, mismatches cost a little (or just fall flat).
    MATCH_SETS: {
        calm: ['hothead', 'professional', 'homebody', 'humble'],
        fireup: ['showman', 'adventurer', 'loyal', 'mercenary'],
        toast: ['showman', 'adventurer', 'hothead', 'mercenary'],
        quiet: ['humble', 'professional', 'homebody', 'loyal'],
        sit: ['humble', 'loyal', 'homebody'],
        space: ['hothead', 'adventurer'],
        speech: ['professional', 'showman', 'mercenary']
    },
    choiceMatches(p, key) {
        const set = this.MATCH_SETS[key]; if (!set) return false;
        const pe = this.ensurePersonality(p);
        return set.includes(pe.primary) || set.includes(pe.secondary);
    },
    // The client the ritual scenes are with: the best of your players on the inviting side who
    // actually took the pitch (falls back to any of them if none played).
    featuredClient(m) {
        if (!m || !m.clients || !m.clients.length) return null;
        const inviter = m.clients.some(c => c.side === 'home') ? 'home' : 'away';
        const cands = m.clients.filter(c => c.side === inviter);
        const pool = cands.filter(c => c.played).length ? cands.filter(c => c.played) : cands;
        let best = null, bestAb = -1;
        for (const c of pool) {
            const p = GameState.getPlayer(c.playerId);
            if (p && p.ability > bestAb) { best = p; bestAb = p.ability; }
        }
        return best;
    },
    _opponentName(m, p) {
        const myClub = effectiveClubId(p);
        const oppId = m.homeId === myClub ? m.awayId : m.homeId;
        const c = (typeof Clubs !== 'undefined') && Clubs.getClubById(oppId);
        return c ? c.name : (typeof findVirtualClub === 'function' && (findVirtualClub(oppId) || {}).name) || 'the opposition';
    },
    // Dressing-room word before kickoff. The result is already banked and CANNOT change here;
    // everything this scene does lands after the final whistle (see buildPostmatchScene).
    buildPrematchScene(p, m) {
        const extra = { opponent: this._opponentName(m, p) };
        const open = this._pick(DIALOGUE_DATA.final.filter(r => r.beat === 'pre-open'), p, extra);
        const choices = ['calm', 'fireup', 'bonus'].map(k => ({ key: k, ...this.choiceLabel('prematch', k) }));
        return { kind: 'prematch', playerId: p.id, matchId: m.id, extra, open, choices };
    },
    resolvePrematch(p, scene, choiceKey, bonusTier) {
        const extra = scene.extra;
        const replies = (choice, outcome) => DIALOGUE_DATA.final.filter(r => r.beat === 'pre-reply'
            && r.choice === choice && (r.outcome === outcome || r.outcome === 'any'));
        if (choiceKey === 'bonus') {
            const cost = Agency.giftCost(bonusTier, p);
            if (GameState.agency.balance < cost) return { ok: false, message: I18n.t('dlg.gift.cantCover', { tier: I18n.t('dlg.giftSize.' + bonusTier), amt: UI.money(cost) }) };
            p._finalTalk = { matchId: scene.matchId, choice: 'bonus', matched: false, bonusTier };
            return { ok: true, reply: this._pick(replies('bonus', 'any'), p, extra), outcome: 'good', revealed: null };
        }
        const matched = this.choiceMatches(p, choiceKey);
        p._finalTalk = { matchId: scene.matchId, choice: choiceKey, matched };
        const revealed = this._maybeReveal(p);
        return { ok: true, reply: this._pick(replies(choiceKey, matched ? 'good' : 'bad'), p, extra), outcome: matched ? 'good' : 'bad', revealed };
    },
    // Full time. Settles everything the dressing room set up (the right word, the promised
    // bonus) and opens the party or the consolation. Returns notes for the UI to show first.
    buildPostmatchScene(p, m, won, opts) {
        opts = opts || {};
        const extra = { opponent: this._opponentName(m, p) };
        const notes = [];
        const talk = p._finalTalk && p._finalTalk.matchId === m.id ? p._finalTalk : null;
        if (talk) {
            if (talk.matched) { this.addBond(p, 2); notes.push('Your word before kickoff steadied him.'); }
            if (talk.bonusTier) {
                if (won) {
                    const cost = Agency.giftCost(talk.bonusTier, p);
                    GameState.agency.balance -= cost;
                    GameState.addFinance('Gifts & relationships', -cost);
                    // an EARNED gift lands half again as hard, and never rings hollow
                    p.morale.agent = Math.min(100, p.morale.agent + Math.round(Agency.giftBoost(talk.bonusTier) * 1.5));
                    this.addBond(p, 3, 'winBonus');
                    GameState.addLog(I18n.t('dlg.gift.paidBonus', { name: p.name, amt: UI.money(cost) }), 'info');
                    notes.push(`You kept your promise: the ${talk.bonusTier} gift is his (−€${UI.money(cost)}).`);
                } else {
                    notes.push('The win bonus stays in your pocket. Not the way you wanted to save money.');
                }
            }
            delete p._finalTalk;
        }
        // won the match but a rival's parallel result cost the title: a distinct, gutted-but-proud
        // tone rather than the party OR a plain defeat lament (falls back to loss lines if none exist).
        let beat = won ? 'win-open' : 'loss-open';
        if (opts.titleMissed) {
            notes.push(I18n.t('dlg.titleMissedNote'));
            if (DIALOGUE_DATA.final.some(r => r.beat === 'titlemiss-open')) beat = 'titlemiss-open';
        }
        const open = this._pick(DIALOGUE_DATA.final.filter(r => r.beat === beat), p, extra);
        const keys = won ? ['toast', 'quiet', 'tab'] : ['sit', 'space', 'speech'];
        const choices = keys.map(k => ({ key: k, ...this.choiceLabel(won ? 'postwin' : 'postloss', k) }));
        return { kind: 'postmatch', playerId: p.id, matchId: m.id, won, extra, notes, open, choices };
    },
    resolvePostmatch(p, choiceKey, won, extra) {
        const beat = won ? 'win-reply' : 'loss-reply';
        const replies = outcome => DIALOGUE_DATA.final.filter(r => r.beat === beat
            && r.choice === choiceKey && (r.outcome === outcome || r.outcome === 'any'));
        let outcome = 'good', note = null;
        if (choiceKey === 'tab') {
            const cost = Agency.giftCost('medium', p);
            GameState.agency.balance -= cost;
            GameState.addFinance('Gifts & relationships', -cost);
            this.addBond(p, 4, 'nightOnYou');
            p.morale.agent = Math.min(100, p.morale.agent + 4);
            note = `The night is on you (−€${UI.money(cost)}).`;
        } else if (this.choiceMatches(p, choiceKey)) {
            this.addBond(p, won ? 3 : 4, won ? 'you celebrated it right' : 'you handled the defeat right');
            p.morale.agent = Math.min(100, p.morale.agent + (won ? 3 : 2));
        } else {
            outcome = 'bad';
            this.addBond(p, 1);   // showing up still counts, even when the words miss
            if (!won) p.morale.agent = Math.max(0, p.morale.agent - 2);
        }
        const revealed = this._maybeReveal(p);
        return { ok: true, reply: this._pick(replies(outcome), p, extra), outcome, revealed, note };
    },

    // =================================================== retirement farewell (Phase 2)
    // his career, in one line, from the records the game already keeps
    careerMontage(p) {
        const t = (typeof careerTotal === 'function') ? careerTotal(p) : { apps: 0, goals: 0, assists: 0 };
        const seasons = (typeof seasonsActiveLeague === 'function') ? seasonsActiveLeague(p) : 0;
        const clubs = (typeof careerByClub === 'function') ? careerByClub(p).filter(c => !c.youth && c.agg.apps > 0).length : 0;
        const cups = (p.trophies || []).length;
        const bits = [];
        if (seasons) bits.push(`${seasons} season${seasons === 1 ? '' : 's'}`);
        if (clubs) bits.push(`${clubs} club${clubs === 1 ? '' : 's'}`);
        bits.push(`${t.apps} appearances`, `${t.goals} goals`);
        if (cups) bits.push(`${cups} troph${cups === 1 ? 'y' : 'ies'}`);
        return bits.join(' · ');
    },
    buildFarewellScene(p) {
        const tier = this.tierOf(this.bondOf(p)).toLowerCase();
        const opens = DIALOGUE_DATA.farewell.filter(r => r.beat === 'open' && (r.tier === tier || r.tier === 'any'));
        const open = this._pick(opens, p);
        const choices = ['career', 'personal'].map(k => ({ key: k, ...this.choiceLabel('farewell', k) }));
        // the quiet capstone: he ended his career at the club he supported as a boy
        const f = p.facts;
        const boyhoodNote = (f && f.ambition && f.ambition.type === 'boyhood' && f.ambition.fulfilled)
            ? 'He got his wish: his last match came in the shirt he grew up worshipping.' : null;
        return { kind: 'farewell', playerId: p.id, tier, montage: this.careerMontage(p), boyhoodNote, open, choices };
    },
    resolveFarewell(p, choiceKey) {
        const rows = DIALOGUE_DATA.farewell.filter(r => r.beat === 'reply' && r.choice === choiceKey);
        // a star seen out properly reflects on the agency: word gets around you stay to the end
        let note = null;
        if (this.bondOf(p) >= 50 && !p._farewellDone) {
            Agency.bumpRep(2);
            note = 'Word gets around: you look after your people to the very end. (+2 reputation)';
        }
        p._farewellDone = true;
        return { ok: true, reply: this._pick(rows, p), note };
    },

    // =================================================== the facts ledger (Phase 3)
    // Things he has told you: his boyhood club, what drives him, his life outside football.
    // Discovered through Check in (or volunteered once he trusts you), displayed on his page,
    // and paid off later: land his dream move and the game remembers.
    HOBBIES: ['golf', 'fishing', 'gaming', 'chess', 'cooking', 'classic cars', 'photography', 'making music', 'padel', 'poker'],
    TOP5_DIVS: ['PREM', 'LaLiga', 'SerieA', 'BUNDES', 'Ligue1'],
    // the big-five leagues a talent might dream of, and how strongly (the glamour destinations lead)
    // the top-flight leagues a client can dream of joining — displayed via compName (generic by default,
    // or the real name once the real-names pack is imported), so no trademarked name is hard-coded here
    LEAGUE_IDS: ['PREM', 'LaLiga', 'BUNDES', 'SerieA', 'Ligue1'],
    LEAGUE_PULL: { PREM: 4, LaLiga: 3, BUNDES: 3, SerieA: 2, Ligue1: 1.5 },
    BIG5_COUNTRY: { England: 'PREM', Spain: 'LaLiga', Germany: 'BUNDES', Italy: 'SerieA', France: 'Ligue1' },
    // "smaller" football nations whose talents more often dream of a bigger league abroad
    SMALL_LEAGUE_HOMES: ['Netherlands', 'Switzerland', 'Portugal', 'Belgium', 'France'],

    _clubName(id) { const c = Clubs.getClubById(id); return c ? c.name : (typeof League !== 'undefined' && League.teamName ? League.teamName(id) : 'his club'); },
    _weightedByRep2(list) { if (!list.length) return null; const t = list.reduce((s, c) => s + c.reputation * c.reputation, 0); let r = Rng.next() * t; for (const c of list) { r -= c.reputation * c.reputation; if (r <= 0) return c.id; } return list[list.length - 1].id; },
    _weightedByRep(list) { if (!list.length) return null; const t = list.reduce((s, c) => s + c.reputation, 0); let r = Rng.next() * t; for (const c of list) { r -= c.reputation; if (r <= 0) return c.id; } return list[list.length - 1].id; },
    // the club he is most associated with: most senior appearances, else where he plays now
    _primaryClub(p) {
        let best = Clubs.getClubById(effectiveClubId(p)) || null, bestApps = -1;
        if (typeof careerByClub === 'function') careerByClub(p).forEach(c => {
            if (c.youth) return; const cl = Clubs.getClubById(c.clubId);
            if (cl && c.agg.apps > bestApps) { best = cl; bestApps = c.agg.apps; }
        });
        return best;
    },
    // Rivalry has no data table, so we use a sound proxy: two established clubs in the SAME country
    // are treated as rivals of each other. It keeps a one-club Basel man from naming FC Zürich (or any
    // big domestic side) as a dream — while a kid at a small club is still free to idolise a giant.
    _isPresumedRival(clubId, p) {
        const cand = Clubs.getClubById(clubId); if (!cand) return false;
        const primary = this._primaryClub(p); if (!primary || primary.id === clubId) return false;
        return cand.country === primary.country && cand.reputation >= 62 && primary.reputation >= 62;
    },

    _homeCountryOf(p) {
        // his nationality when it is a playable country; else where he plays now
        const played = ['Netherlands', 'England', 'Germany', 'Spain', 'Switzerland', 'Italy', 'France', 'Portugal', 'Belgium'];
        if (played.includes(p.nationality)) return p.nationality;
        const c = Clubs.getClubById(effectiveClubId(p));
        return c ? c.country : GameState.homeCountry;
    },
    // His boyhood club. ~19 in 20 it's from his home country; within that, ~8 in 10 it's from the
    // region he came up in (the club he's at now), so a Basel lad supports a Basel-region side, not a
    // crosstown/national rival. Big clubs still collect the most childhood hearts (rep-squared weight).
    _rollFavClub(p) {
        const home = this._homeCountryOf(p);
        const cur = Clubs.getClubById(effectiveClubId(p));
        const regionId = cur ? cur.region : null;
        const notRival = c => !this._isPresumedRival(c.id, p);
        // ~1 in 20: a foreign giant idolised from afar
        if (Rng.next() < 0.05) {
            const giants = Clubs.allClubs.filter(c => c.country !== home && c.tier === 1 && c.reputation >= 82);
            const g = this._weightedByRep2(giants); if (g) return g;
        }
        // within his home country: ~8 in 10 from his own region, else anywhere at home
        let pool = null;
        if (regionId && Rng.next() < 0.80) pool = Clubs.allClubs.filter(c => c.country === home && c.region === regionId && notRival(c));
        if (!pool || !pool.length) pool = Clubs.allClubs.filter(c => c.country === home && c.tier <= 2 && notRival(c));
        if (!pool.length) pool = Clubs.allClubs.filter(c => c.country === home && notRival(c));
        return this._weightedByRep2(pool) || (cur ? cur.id : null);
    },
    _rollFamily(p) {
        const r = Rng.next();
        if (p.age < 22) return r < 0.7 ? 'single' : 'partner';
        if (p.age < 28) return r < 0.3 ? 'single' : r < 0.8 ? 'partner' : 'kids';
        return r < 0.15 ? 'single' : r < 0.5 ? 'partner' : 'kids';
    },
    _rollAmbition(p, favClubId) {
        this.ensurePersonality(p);
        const club = Clubs.getClubById(effectiveClubId(p));
        const home = this._homeCountryOf(p);
        const hasType = t => (p.trophies || []).some(tr => COMPETITIONS[tr.compId] && COMPETITIONS[tr.compId].type === t);
        const w = {};   // eligible types with weights
        // playing at a higher level, expressed as a LEAGUE — the dominant dream, and more so for talents
        // out of the smaller football nations (a Young Boys kid wanting the Bundesliga). NOT offered to a
        // player who has already played in a big-five league — that dream is already lived (B1).
        if (!this._everInBig5(p)) w.league = this.SMALL_LEAGUE_HOMES.includes(home) ? 4 : 2.5;
        // playing for a specific big club someday (a foreign giant, his boyhood club, or — for a modest
        // talent — simply a top-flight side back home)
        w.dreamclub = 2.5;
        // "finish where it began" — only if there's a genuine prior spell at that club to return to (B2)
        if (favClubId && favClubId !== effectiveClubId(p) && !this._isPresumedRival(favClubId, p) && this._playedAtClub(p, favClubId)) w.boyhood = 1.5;
        if (!hasType('league')) w.title = 2;
        if (!hasType('cup')) w.cup = 1.5;
        if (!this._hasEuropeApps(p)) w.europe = 1.5;
        if (ATTACK_POS.includes(p.position)) w.goals = 2;
        // temperament pulls the dream in its own direction
        const boost = (k, f) => { if (w[k]) w[k] *= f; };
        if (this.hasTrait(p, 'adventurer')) boost('league', 3);
        if (this.hasTrait(p, 'mercenary') || this.hasTrait(p, 'showman')) { boost('league', 2); boost('dreamclub', 2); }
        if (this.hasTrait(p, 'showman')) boost('goals', 2);
        if (this.hasTrait(p, 'loyal') || this.hasTrait(p, 'homebody')) { boost('boyhood', 4); boost('title', 2); boost('league', 0.4); }
        if (this.hasTrait(p, 'professional')) { boost('title', 2); boost('cup', 2); }
        const keys = Object.keys(w);
        if (!keys.length) return { type: 'cup' };
        let r = Rng.next() * keys.reduce((s, k) => s + w[k], 0), type = keys[0];
        for (const k of keys) { r -= w[k]; if (r <= 0) { type = k; break; } }
        return this._mkAmbition(type, p, favClubId);
    },
    _mkAmbition(type, p, favClubId) {
        if (type === 'goals') {
            const cur = (typeof careerTotal === 'function') ? careerTotal(p).goals : 0;
            return { type, target: Math.max(50, Math.ceil((cur + 40 + Rng.next() * 80) / 25) * 25) };
        }
        if (type === 'league') return { type, div: this._rollDreamLeague(p) };
        if (type === 'dreamclub') { const id = this._rollDreamClub(p, favClubId); return id ? { type, clubId: id } : { type: 'title' }; }
        if (type === 'boyhood') return (favClubId && !this._isPresumedRival(favClubId, p)) ? { type } : { type: 'league', div: this._rollDreamLeague(p) };
        return { type };
    },
    // a big-five league other than the one he already plays in (his own, if it is a big five)
    _rollDreamLeague(p) {
        const homeDiv = this.BIG5_COUNTRY[this._homeCountryOf(p)];
        const curDiv = (Clubs.getClubById(effectiveClubId(p)) || {}).division;
        const opts = this.LEAGUE_IDS.filter(d => d !== homeDiv && d !== curDiv);
        const pool = opts.length ? opts : this.LEAGUE_IDS;
        let r = Rng.next() * pool.reduce((s, d) => s + (this.LEAGUE_PULL[d] || 1), 0);
        for (const d of pool) { r -= (this.LEAGUE_PULL[d] || 1); if (r <= 0) return d; }
        return pool[0];
    },
    // the specific club he dreams of. A capable talent aims at a foreign giant (or his boyhood club);
    // a modest one keeps it realistic: a top-flight side back home ("play for Thun someday"). Never a rival.
    _rollDreamClub(p, favClubId) {
        const home = this._homeCountryOf(p);
        if (p.ability >= 60) {
            if (favClubId && favClubId !== effectiveClubId(p) && !this._isPresumedRival(favClubId, p) && Rng.next() < 0.3) return favClubId;
            const giants = Clubs.allClubs.filter(c => c.country !== home && c.tier === 1 && c.reputation >= 80);
            const g = this._weightedByRep2(giants); if (g) return g;   // foreign, so never a domestic rival
        }
        // modest, home-grown dream: any top-flight side back home, linear-rep weighted so smaller names show up
        const pool = Clubs.allClubs.filter(c => c.country === home && c.tier === 1 && c.id !== effectiveClubId(p) && !this._isPresumedRival(c.id, p));
        const home1 = this._weightedByRep(pool); if (home1) return home1;
        const abroad = Clubs.allClubs.filter(c => c.country !== home && c.tier === 1 && c.reputation >= 78);
        return this._weightedByRep2(abroad) || favClubId || null;
    },
    _hasEuropeApps(p) {
        for (const y of Object.keys(p.stats || {}))
            for (const st of Object.values(p.stats[y]))
                for (const cid of Object.keys(st.comps || {}))
                    if ((cid === 'UCL' || cid === 'UEL' || cid === 'UECL') && st.comps[cid].apps > 0) return true;
        return false;
    },
    // has he ever played in a big-five league (current club or a past spell)? — gates the "play in a
    // bigger league" ambition so it's never handed to someone already living it (B1)
    _everInBig5(p) {
        const cur = (Clubs.getClubById(effectiveClubId(p)) || {}).division;
        if (cur && this.TOP5_DIVS && this.TOP5_DIVS.includes(cur)) return true;
        for (const y of Object.keys(p.stats || {}))
            for (const st of Object.values(p.stats[y]))
                for (const cid of Object.keys(st.comps || {}))
                    if (this.TOP5_DIVS && this.TOP5_DIVS.includes(cid) && (st.comps[cid].apps || 0) > 0) return true;
        return false;
    },
    // does he have a genuine prior spell (senior appearances) at this club? — gates the boyhood-return
    // ambition so it never points at a club he never played for (B2)
    _playedAtClub(p, clubId) {
        if (!clubId) return false;
        if (typeof careerByClub === 'function') return careerByClub(p).some(c => c.clubId === clubId && c.agg && c.agg.apps > 0);
        for (const y of Object.keys(p.stats || {}))
            for (const st of Object.values(p.stats[y]))
                if (st.clubId === clubId) { for (const c of Object.values(st.comps || {})) if ((c.apps || 0) > 0) return true; }
        return false;
    },
    ensureFacts(p) {
        if (p.facts && p.facts.ambition) {
            // migration: pin his formative country once (older facts objects lack it). Without
            // this, "home" would drift to wherever he currently plays, which breaks the abroad
            // ambition and made foreign-heritage players "settle in" on domestic moves.
            if (!p.facts.home) { p.facts.home = this._homeCountryOf(p); this._seedLangs(p, p.facts.home); }
            return p.facts;
        }
        const home = this._homeCountryOf(p);
        const favClub = this._rollFavClub(p);
        p.facts = {
            home,
            favClub: { clubId: favClub, discovered: false, fulfilled: false },
            family: { status: this._rollFamily(p), discovered: false },
            hobby: { name: this.HOBBIES[Math.floor(Rng.next() * this.HOBBIES.length)], discovered: false },
            ambition: { ...this._rollAmbition(p, favClub), discovered: false, fulfilled: false }
        };
        this._seedLangs(p, home);   // he grew up there: he speaks the language, whatever his passport says
        return p.facts;
    },
    _seedLangs(p, home) {
        const langs = this.LANGS[home] || [];
        p._langs = Array.from(new Set((p._langs || []).concat(langs)));
    },
    // A pronoun-free verb phrase that reads correctly both as a page label AND inside a spoken line
    // ("I want to {ambition}", "To {ambition}? Done.") — so never "his career" in the first person.
    ambitionText(p) {
        const f = this.ensureFacts(p), a = f.ambition;
        const de = this._isDe() ? DIALOGUE_DE.amb : null;
        const fav = f.favClub.clubId ? this._clubName(f.favClub.clubId) : (de ? de.favFallback : 'the club I grew up on');
        const league = (a.div && typeof compName === 'function' && compName(a.div)) || (de ? de.leagueFallback : 'a bigger league');
        const club = a.clubId ? this._clubName(a.clubId) : (de ? de.clubFallback : 'a big club');
        if (de) {
            const t = de.types[a.type];
            return t ? t.replace('{league}', league).replace('{club}', club).replace('{fav}', fav).replace('{target}', a.target) : de.dflt;
        }
        return {
            league: `play in ${league} someday`,
            dreamclub: `play for ${club} one day`,
            boyhood: `finish where it began, at ${fav}`,
            title: 'win a league title', cup: 'lift a cup', europe: 'play in Europe',
            goals: `reach ${a.target} career goals`,
            // legacy ambition types from older saves
            topflight: 'play in one of the big five leagues', abroad: 'play abroad'
        }[a.type] || 'make it to the top';
    },
    ambitionProgress(p) {
        const a = this.ensureFacts(p).ambition;
        if (a.fulfilled) return I18n.t('dlg.ambProg.fulfilled') + (a.year ? I18n.t('dlg.ambProg.inYear', { year: GameState.seasonLabelFor(a.year) }) : '');
        const club = Clubs.getClubById(effectiveClubId(p));
        const div = club ? ((COMPETITIONS[club.division] || {}).name || club.division) : null;
        switch (a.type) {
            case 'league': return club ? I18n.t('dlg.ambProg.nowIn', { div }) : I18n.t('dlg.ambProg.noClub');
            case 'dreamclub': return I18n.t('dlg.ambProg.notYet');
            case 'boyhood': return I18n.t('dlg.ambProg.doorOpen');
            case 'topflight': return club ? I18n.t('dlg.ambProg.currently', { div }) : I18n.t('dlg.ambProg.noClub');
            case 'title': return I18n.t('dlg.ambProg.noTitle');
            case 'cup': return I18n.t('dlg.ambProg.noCup');
            case 'europe': return I18n.t('dlg.ambProg.noEurope');
            case 'goals': return I18n.t('dlg.ambProg.goals', { n: (typeof careerTotal === 'function') ? careerTotal(p).goals : 0, target: a.target });
            case 'abroad': return I18n.t('dlg.ambProg.atHome');
            default: return '';
        }
    },
    // once he trusts you, he starts telling you things unprompted (used on tier upgrades)
    _volunteerFact(p) {
        const f = this.ensureFacts(p);
        if (f.favClub.clubId && !f.favClub.discovered) {
            f.favClub.discovered = true;
            const c = Clubs.getClubById(f.favClub.clubId);
            return I18n.t('dlg.vol.boyhood', { club: c ? c.name : I18n.t('dlg.clubBackHome') });
        }
        if (!f.ambition.discovered) {
            f.ambition.discovered = true;
            return I18n.t('dlg.vol.ambition', { amb: this.ambitionText(p) });
        }
        return '';
    },

    // =================================================== check in (Phase 3)
    CHECKIN_COOLDOWN_WEEKS: 3,
    canCheckIn(p) {
        if (p.agentId !== 'me' || p.archived) return { ok: false, reason: 'not a client' };
        const aw = GameState.absWeek();
        if (p._checkinAbs != null && aw - p._checkinAbs < this.CHECKIN_COOLDOWN_WEEKS)
            return { ok: false, reason: 'cooldown', weeksLeft: Math.ceil(this.CHECKIN_COOLDOWN_WEEKS - (aw - p._checkinAbs)) };
        return { ok: true };
    },
    buildCheckinScene(p) {
        const f = this.ensureFacts(p);
        const open = this._pick(DIALOGUE_DATA.checkin.filter(r => r.beat === 'open'), p);
        const keys = [];
        if (f.favClub.clubId && !f.favClub.discovered) keys.push('q-club');
        if (!f.ambition.discovered) keys.push('q-ambition');
        keys.push('q-life', 'q-room', 'q-none');
        const choices = keys.map(k => ({ key: k, ...this.choiceLabel('checkin', k) }));
        return { kind: 'checkin', playerId: p.id, open, choices };
    },
    resolveCheckin(p, q) {
        const f = this.ensureFacts(p);
        const aw = GameState.absWeek();
        p._checkinAbs = aw;
        Agency._creditAgentAction(p, 2);   // showing your face counts, and resets the neglect clock
        let variant = 'any', extra = {}, note = null;
        if (q === 'q-life') {
            if (!f.family.discovered) { f.family.discovered = true; variant = f.family.status; note = `Noted: ${f.family.status === 'single' ? "it's just him right now" : f.family.status === 'partner' ? 'he has a partner' : 'he has kids'}.`; }
            else if (!f.hobby.discovered) { f.hobby.discovered = true; variant = 'hobby'; extra.hobby = f.hobby.name; note = `Noted: he's into ${f.hobby.name}.`; }
            else variant = 'nothing';
        } else if (q === 'q-club') {
            f.favClub.discovered = true;
            const c = Clubs.getClubById(f.favClub.clubId);
            extra.favclub = c ? c.name : 'a club back home';
            note = `Noted: his boyhood club is ${extra.favclub}.`;
        } else if (q === 'q-ambition') {
            f.ambition.discovered = true;
            extra.ambition = this.ambitionText(p);
            note = `Noted: he wants to ${extra.ambition}.`;
        }
        const rows = DIALOGUE_DATA.checkin.filter(r => r.beat === 'reply' && r.choice === q
            && (r.variant === variant || r.variant === 'any' || (q !== 'q-life' && !r.variant)));
        const reply = this._pick(rows.length ? rows : DIALOGUE_DATA.checkin.filter(r => r.beat === 'reply' && r.choice === q), p, extra);
        const revealed = this._maybeReveal(p);
        return { ok: true, reply, note, revealed };
    },

    // =================================================== career moments (Phase 3)
    // A queue of small scenes triggered by the sim (persisted on the agency, played from Home).
    queueMoment(entry) {
        if (!GameState.agency) return;
        const q = GameState.agency.pendingScenes = GameState.agency.pendingScenes || [];
        if (q.length >= 12) return;
        if (q.some(e => e.type === entry.type && e.playerId === entry.playerId)) return;
        q.push(entry);
    },
    // weekly detection: appearance/goal milestones and ambition fulfilment. Baselines initialise
    // silently on first sight, so a veteran loaded from an old save never gets a stale "100 apps!".
    APPS_MARKS: [500, 1000],
    GOAL_MARKS: [50, 100, 200],
    weeklyMoments() {
        if (!GameState.agency) return;
        const year = GameState.seasonStartYear;
        Agency.clients().forEach(p => {
            this._settleTick(p);          // settling-in abroad ticks down (Phase 4)
            this._moneyTick(p, year);     // rare off-field money trouble (Phase 4)
            const t = (typeof careerTotal === 'function') ? careerTotal(p) : null;
            if (!t) return;
            if (!p._mile) { p._mile = { a: t.apps, g: t.goals }; }
            else if (t.apps !== p._mile.a || t.goals !== p._mile.g) {
                let best = null;   // { pri, entry } — one scene a week at most, the biggest one
                const offer = (pri, entry) => { if (!best || pri > best.pri) best = { pri, entry }; };
                if (p._mile.a === 0 && t.apps > 0) offer(1, { type: 'debut', playerId: p.id });
                if (p._mile.g === 0 && t.goals > 0) offer(2, { type: 'firstgoal', playerId: p.id });
                this.APPS_MARKS.forEach((m, i) => { if (p._mile.a < m && t.apps >= m) offer(3 + i, { type: 'milestone', playerId: p.id, milestone: this._mileText('apps', m) }); });
                this.GOAL_MARKS.forEach((m, i) => { if (p._mile.g < m && t.goals >= m) offer(6 + i, { type: 'milestone', playerId: p.id, milestone: this._mileText('goals', m) }); });
                if (best) this.queueMoment(best.entry);
                p._mile = { a: t.apps, g: t.goals };
            }
            this._checkAmbition(p);
        });
    },
    _checkAmbition(p) {
        const f = this.ensureFacts(p), a = f.ambition;
        if (!a.discovered || a.fulfilled || a.type === 'boyhood') return;   // boyhood settles at retirement
        const club = Clubs.getClubById(effectiveClubId(p));
        const hasType = t => (p.trophies || []).some(tr => COMPETITIONS[tr.compId] && COMPETITIONS[tr.compId].type === t);
        let done = false;
        if (a.type === 'league') done = !!(club && club.division === a.div);
        else if (a.type === 'dreamclub') done = effectiveClubId(p) === a.clubId;
        else if (a.type === 'title') done = hasType('league');
        else if (a.type === 'cup') done = hasType('cup');
        else if (a.type === 'europe') done = this._hasEuropeApps(p);
        else if (a.type === 'goals') done = (typeof careerTotal === 'function') && careerTotal(p).goals >= a.target;
        // legacy ambition types from older saves
        else if (a.type === 'topflight') done = !!(club && this.TOP5_DIVS.includes(club.division));
        else if (a.type === 'abroad') done = !!(club && club.country !== (f.home || this._homeCountryOf(p)));
        if (done) {
            a.fulfilled = true; a.year = GameState.seasonStartYear;
            this.queueMoment({ type: 'ambition', playerId: p.id });
        }
    },
    // called at retirement resolution, while he still has a club (see simulation.js)
    checkBoyhoodAtRetirement(p) {
        const f = p.facts; if (!f || !f.ambition || f.ambition.type !== 'boyhood' || f.ambition.fulfilled) return;
        if (f.favClub.clubId && effectiveClubId(p) === f.favClub.clubId) {
            f.ambition.fulfilled = true; f.ambition.year = GameState.seasonStartYear;
            this.addBond(p, 4, 'boyhoodFinish');
        }
    },
    // called by Agency._finalizeTransfer: a client only calls after a move that MEANS something — a
    // move to the club he supported as a boy (THE call of his career). A move that fulfils a stated
    // ambition already gets its own scene (see _checkAmbition); an ordinary transfer gets no chat, so
    // you aren't buried under ten identical "thanks for the move" screens every window.
    onTransferCompleted(p, toClubId) {
        if (p.agentId !== 'me') return;
        const f = this.ensureFacts(p);
        if (f.favClub.clubId === toClubId && !f.favClub.fulfilled) {
            f.favClub.discovered = true; f.favClub.fulfilled = true; f.favClub.year = GameState.seasonStartYear;
            this.queueMoment({ type: 'dreammove', playerId: p.id, clubId: toClubId });
        }
        this._startSettling(p, Clubs.getClubById(toClubId));   // a language barrier means an adjustment period
    },
    // called when a loan is agreed (see Agency.acceptLoanOffer): a shorter settling-in at the loan
    // club, and any settling at the club he just joined is cancelled — he's only passing through
    onLoanStarted(p, borrowerId) {
        if (p.agentId !== 'me') return;
        delete p.settling;
        this._startSettling(p, Clubs.getClubById(borrowerId), { loan: true });
    },
    // called when a long injury lands (see Sim._injuries)
    onInjury(p, weeks) {
        if (p.agentId !== 'me' || weeks < 6) return;
        this.queueMoment({ type: 'injury', playerId: p.id, weeks });
    },

    buildMomentScene(entry) {
        const p = GameState.getPlayer(entry.playerId);
        if (!p || p.archived) return null;
        const extra = {}, notes = [];
        if (entry.milestone) extra.milestone = entry.milestone;
        if (entry.clubId) extra.newclub = (Clubs.getClubById(entry.clubId) || {}).name || 'his new club';
        if (entry.weeks) extra.weeks = String(entry.weeks);
        if (entry.occasion) extra.occasion = entry.occasion;
        if (entry.type === 'ambition') extra.ambition = this.ambitionText(p);
        // the big ones pay out on arrival, so the numbers are right even if the scene is skipped
        if (entry.type === 'dreammove' && !entry._paid) { this.addBond(p, 8, 'dreamMove'); entry._paid = true; }
        if (entry.type === 'ambition' && !entry._paid) { this.addBond(p, 6, 'ambitionDelivered'); Agency.bumpRep(1); entry._paid = true; }
        if (entry.type === 'thanks' && !entry._paid) {
            entry._paid = true;
            if (entry.gift === 'money') {
                extra.thing = (this._isDe() && DIALOGUE_DE.envelope) ? DIALOGUE_DE.envelope.replace('{amt}', UI.money(entry.value)) : `an envelope. Inside: €${UI.money(entry.value)} toward the agency`;
                GameState.agency.balance += entry.value;
                GameState.addFinance('Gifts from clients', entry.value);
                notes.push(`He covered €${UI.money(entry.value)} of the agency's costs.`);
            } else {
                extra.thing = entry.thing;
                const f = this.ensureFacts(p);
                (f.keepsakes = f.keepsakes || []).push({ year: GameState.seasonStartYear, text: entry.thing });
                notes.push('A keepsake for the office shelf. It goes in his file, and your memory.');
            }
        }
        if (entry.type === 'thanks') extra.thing = extra.thing || entry.thing || 'a gift';
        const open = this._pick(DIALOGUE_DATA.moments.filter(r => r.kind === entry.type && r.beat === 'open'), p, extra);
        // an invite line can open with the occasion itself (e.g. "the little one's christening. It's…"),
        // which starts a sentence lowercase — capitalise the first letter so it reads as a message.
        if (entry.type === 'invite' && open && open.text) open.text = open.text.charAt(0).toUpperCase() + open.text.slice(1);
        const keys = entry.type === 'injury' ? ['there', 'flowers']
            : entry.type === 'thanks' ? ['cherish', 'banter']
            : entry.type === 'invite' ? ['attend', 'gift', 'decline']
            : ['praise', 'modest'];
        const scene = entry.type === 'injury' ? 'injury'
            : entry.type === 'thanks' ? 'thanks'
            : entry.type === 'invite' ? 'invite' : 'moment';
        const choices = keys.map(k => ({ key: k, ...this.choiceLabel(scene, k) }));
        return { kind: 'moment', momentType: entry.type, playerId: p.id, extra, notes, open, choices };
    },
    // Which countries count as neighbours for travel costs (symmetric). Used to price an in-person
    // visit: cheap at home, more abroad, most for a long haul. Kept here rather than in the map data
    // because it's a gameplay concept (reachability), not geography.
    NEIGHBOURS: {
        Netherlands: ['Belgium', 'Germany', 'England'],
        Belgium: ['Netherlands', 'Germany', 'France', 'England'],
        Germany: ['Netherlands', 'Belgium', 'France', 'Switzerland'],
        France: ['Belgium', 'Germany', 'Switzerland', 'Italy', 'Spain', 'England'],
        Switzerland: ['Germany', 'France', 'Italy', 'Liechtenstein'],
        Italy: ['France', 'Switzerland'],
        Spain: ['France', 'Portugal'],
        Portugal: ['Spain'],
        England: ['France', 'Belgium', 'Netherlands'],
        Liechtenstein: ['Switzerland'],
    },
    // Cost of visiting a player in person: €200 in your own country, €1,000 in a neighbouring one,
    // €2,000 for anywhere farther (or when his country can't be determined, treat it as home).
    visitCost(p) {
        const home = (GameState.agency && GameState.agency.homeCountry) || GameState.homeCountry;
        const club = (typeof Clubs !== 'undefined') ? Clubs.getClubById(effectiveClubId(p)) : null;
        const away = club ? club.country : null;
        if (!home || !away || home === away) return 200;
        return (this.NEIGHBOURS[home] || []).includes(away) ? 1000 : 2000;
    },
    resolveMoment(p, scene, key) {
        const rows = DIALOGUE_DATA.moments.filter(r => r.beat === 'reply' && r.choice === key
            && (r.kind === scene.momentType || r.kind === 'any'));
        let note = null;
        if (key === 'there') {
            // visiting him in person costs travel money, scaled by how far away he plays
            const cost = this.visitCost(p);
            GameState.agency.balance -= cost; GameState.addFinance('Gifts & relationships', -cost);
            this.addBond(p, 3, 'showedUp'); p.morale.agent = Math.min(100, p.morale.agent + 2);
            note = `You made the trip to see him (−€${UI.money(cost)}).`;
        }
        else if (key === 'flowers') {
            const cost = 50;
            GameState.agency.balance -= cost; GameState.addFinance('Gifts & relationships', -cost);
            this.addBond(p, 1);
            note = `Flowers on their way (−€${UI.money(cost)}).`;
        }
        else if (key === 'cherish' || key === 'banter') {
            // his gift to you: the graceful read for the sentimental, the laugh for the loud
            const matched = key === 'cherish'
                ? (this.hasTrait(p, 'loyal') || this.hasTrait(p, 'homebody') || this.hasTrait(p, 'humble'))
                : (this.hasTrait(p, 'showman') || this.hasTrait(p, 'hothead') || this.hasTrait(p, 'mercenary'));
            if (matched) { this.addBond(p, 1); p.morale.agent = Math.min(100, p.morale.agent + 1); }
        } else if (key === 'attend') {
            const cost = 2000;
            if (GameState.agency.balance < cost) return { ok: false, message: I18n.t('dlg.trip.cantCover', { amt: UI.money(cost) }) };
            GameState.agency.balance -= cost;
            GameState.addFinance('Gifts & relationships', -cost);
            this.addBond(p, 4, 'bigDay');
            p.morale.agent = Math.min(100, p.morale.agent + 3);
            note = `A weekend well spent (−€${UI.money(cost)}).`;
        } else if (key === 'gift') {
            const cost = Agency.giftCost('small', p);
            GameState.agency.balance -= cost;
            GameState.addFinance('Gifts & relationships', -cost);
            this.addBond(p, 1);
            note = `The gift is on its way (−€${UI.money(cost)}).`;
        } else if (key === 'decline') {
            this.addBond(p, -1);
            p.morale.agent = Math.max(0, p.morale.agent - 2);
        } else {
            const matched = key === 'praise'
                ? (this.hasTrait(p, 'showman') || this.hasTrait(p, 'mercenary') || this.hasTrait(p, 'hothead'))
                : (this.hasTrait(p, 'professional') || this.hasTrait(p, 'humble') || this.hasTrait(p, 'homebody'));
            this.addBond(p, matched ? 2 : 1);
            if (matched) p.morale.agent = Math.min(100, p.morale.agent + 1);
        }
        const revealed = Rng.next() < 0.35 ? this._maybeReveal(p) : null;
        return { ok: true, reply: this._pick(rows, p, scene.extra), note, revealed };
    },

    // =================================================== reciprocity (Phase 4)
    KEEPSAKES: ['a signed shirt from his debut', 'a watch with a date engraved on the back', 'a framed photo of the two of you at his first signing', 'the match ball from his best game, signed by the whole squad', 'a bottle from a vineyard he part-owns'],
    // Called from addBond: a big moment at Confidant+ sometimes moves him to give something back.
    _maybeThanks(p, delta) {
        if (p.archived || delta < 3 || this.bondOf(p) < 50) return;
        const year = GameState.seasonStartYear;
        // a gesture like this should feel special: at most once every 6 years for any one player
        // (previously once a season, which let a handful of confidants gift you every single year)
        if (p._thanksSeason != null && year - p._thanksSeason < 6) return;
        if (Rng.next() > 0.3) return;
        p._thanksSeason = year;
        const money = Rng.next() < 0.5;
        this.queueMoment(money
            ? { type: 'thanks', playerId: p.id, gift: 'money', value: Math.min(40000, Math.max(1000, Math.round((p.wage || 5000) * 1.5 / 100) * 100)) }
            : { type: 'thanks', playerId: p.id, gift: 'keepsake', thing: this.KEEPSAKES[Math.floor(Rng.next() * this.KEEPSAKES.length)] });
    },
    // Confidant+ perk: instead of a complaint landing cold, he pulls you aside first — a quiet
    // two-week head start before the formal case machinery begins. Once a season, per client.
    tipOff(p, dim) {
        const aw = GameState.absWeek(), year = GameState.seasonStartYear;
        if (p._tipUntil != null) {
            if (aw < p._tipUntil) return true;          // still inside the grace he bought you
            delete p._tipUntil; return false;           // grace over: the case opens for real
        }
        if (this.bondOf(p) < 50 || p._tipSeason === year) return false;
        p._tipSeason = year; p._tipUntil = aw + 2;
        const what = { time: I18n.t('dlg.tip.time'), club: I18n.t('dlg.tip.club'), wage: I18n.t('dlg.tip.wage'), agent: I18n.t('dlg.tip.agent') }[dim] || I18n.t('dlg.tip.something');
        GameState.addMail({
            kind: 'news', cat: 'morale', subject: I18n.t('dlg.tip.subj', { name: p.name }),
            body: I18n.t('dlg.tip.body', { name: p.name, what: what.charAt(0).toUpperCase() + what.slice(1) }), ttl: 4
        });
        GameState.addLog(I18n.t('dlg.tip.log', { name: p.name }), 'morale');
        return true;
    },
    // Season-rollover social calendar: wedding/christening invitations (Confidant+).
    onSeasonRollover() {
        const year = GameState.seasonStartYear;   // already the NEW season by this point
        Agency.clients().forEach(p => {
            const bond = this.bondOf(p);
            const f = this.ensureFacts(p);
            // a financial-advisor contract that has just run out: remind the agent to renew it
            if (p._finAdvisorUntil != null && year >= p._finAdvisorUntil) {
                delete p._finAdvisorUntil;
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('dlg.adv.expiredSubj', { name: p.name }), body: I18n.t('dlg.adv.expiredBody', { name: p.name }), ttl: 6 });
            }
            if (bond >= 50 && f.family.discovered) {
                if (f.family.status === 'partner' && !p._evWedding && Rng.next() < 0.25) {
                    p._evWedding = true;
                    this.queueMoment({ type: 'invite', playerId: p.id, occasion: 'my wedding' });
                } else if (f.family.status === 'kids' && !p._evChristening && Rng.next() < 0.25) {
                    p._evChristening = true;
                    this.queueMoment({ type: 'invite', playerId: p.id, occasion: "the little one's christening" });
                }
            }
            // family life moves on over the years: single → partner → kids. A change re-opens the topic
            // (discovered reset), so a yearly check-in can catch it (D6). Rolled AFTER this year's social
            // events so it only affects future seasons — this year's status is what triggers them.
            if (f.family) {
                if (f.family.status === 'single' && Rng.next() < 0.14) { f.family.status = 'partner'; f.family.discovered = false; }
                else if (f.family.status === 'partner' && Rng.next() < 0.14) { f.family.status = 'kids'; f.family.discovered = false; }
            }
        });
    },
    // =================================================== settling in & concierge (Phase 4)
    // Language map: a move to a country that shares no language with what he speaks starts a
    // settling-in period — a small morale drag and a small form drag until he finds his feet.
    LANGS: { Netherlands: ['nl'], Belgium: ['nl', 'fr'], England: ['en'], Germany: ['de'], Switzerland: ['de', 'fr', 'it'], Spain: ['es'], Italy: ['it'], France: ['fr'], Portugal: ['pt'] },
    // every country he has genuinely played in (senior apps) — he picked up the language there
    _countriesPlayedIn(p) {
        const out = new Set();
        if (typeof careerByClub === 'function')
            for (const c of careerByClub(p)) { if (!c.agg || !c.agg.apps) continue; const club = Clubs.getClubById(c.clubId); if (club && club.country) out.add(club.country); }
        return out;
    },
    // languages he speaks: his nationality's (we assume all national languages), any he's learned via a
    // move, and any from a country he's actually played in (D7)
    _langsOf(p) {
        const langs = new Set((this.LANGS[p.nationality] || []).concat(p._langs || []));
        for (const country of this._countriesPlayedIn(p)) (this.LANGS[country] || []).forEach(l => langs.add(l));
        return [...langs];
    },
    _startSettling(p, club, opts = {}) {
        if (!club || !this.LANGS[club.country]) return;
        const home = (p.facts && p.facts.home) || this._homeCountryOf(p);
        if (club.country === home) return;                                // moving (back) home — no adjustment
        const speaks = this._langsOf(p);
        const knowsLang = this.LANGS[club.country].some(l => speaks.includes(l));
        let weeks = 12 + Math.floor(Rng.next() * 7);                       // 12–18 weeks base
        if (this.hasTrait(p, 'homebody')) weeks = Math.round(weeks * 1.75);   // uprooted, and he feels it
        if (this.hasTrait(p, 'adventurer')) weeks = Math.round(weeks * 0.5);  // this is what he lives for
        if (knowsLang) weeks = Math.max(1, Math.round(weeks * 0.25));      // already speaks it: 75% shorter, not skipped
        if (opts.loan) weeks = Math.max(1, Math.round(weeks * 0.5));       // a loan is temporary — he knows he'll be off again soon
        p.settling = { weeksLeft: weeks, morale: !knowsLang, knowsLang, lang: this.LANGS[club.country][0], services: {}, loan: !!opts.loan };
        GameState.addMail({
            kind: 'news', cat: 'general', subject: I18n.t('dlg.settle.subj', { name: p.name }),
            body: knowsLang
                ? I18n.t('dlg.settle.bodyKnows', { name: p.name, weeks })
                : I18n.t('dlg.settle.bodyNo', { name: p.name, weeks }), ttl: 5
        });
    },
    _settleTick(p) {
        const s = p.settling; if (!s) return;
        if (s.morale && s.weeksLeft % 2 === 0) p.morale.club = Math.max(0, p.morale.club - 1);
        s.weeksLeft -= 1;
        if (s.weeksLeft <= 0) {
            p._langs = (p._langs || []).concat(s.lang);   // he leaves the period with the language
            delete p.settling;
            GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('dlg.settle.doneSubj', { name: p.name }), body: I18n.t('dlg.settle.doneBody', { name: p.name }), ttl: 3 });
        }
    },
    // Only certain temperaments are loose with money: the flashy showman and the impulsive hothead.
    // Sensible types never blow it on a bad scheme, so they never need an advisor.
    RISKY_MONEY_POLES: ['showman', 'hothead'],
    MONEY_TROUBLE_WEEKLY: 0.0006,   // deliberately rare: ~1 incident/season across a 60-strong roster
    _moneyRiskPole(p) { return this.RISKY_MONEY_POLES.find(pole => this.hasTrait(p, pole)) || null; },
    _moneyRisky(p) { return !!this._moneyRiskPole(p); },
    // whether you already KNOW he's reckless with money (a revealed risky trait) — drives the UI hint
    moneyRiskKnown(p) {
        const pe = p.personality; if (!pe) return false;
        return (pe.revP && this.RISKY_MONEY_POLES.includes(pe.primary)) || (pe.revS && this.RISKY_MONEY_POLES.includes(pe.secondary));
    },
    advisorEngaged(p) { return p._finAdvisorUntil != null && GameState.seasonStartYear < p._finAdvisorUntil; },
    // rare off-field money trouble, only for the reckless; a financial advisor (multi-year) heads it off
    _moneyTick(p, year) {
        if (!this._moneyRisky(p)) return;                                  // sensible players don't do this
        if (Rng.next() > this.MONEY_TROUBLE_WEEKLY) return;
        if (this.advisorEngaged(p)) {
            if (Rng.next() < 0.5) {
                GameState.addMail({ kind: 'news', cat: 'general', subject: I18n.t('dlg.adv.earnsSubj', { name: p.name }), body: I18n.t('dlg.adv.earnsBody', { name: p.name }), ttl: 3 });
                this.addBond(p, 1);
            }
            return;
        }
        p.morale.wage = Math.max(0, p.morale.wage - 12);
        p.morale.agent = Math.max(0, p.morale.agent - 4);
        const flavour = this.hasTrait(p, 'showman') ? I18n.t('dlg.money.flavourShowman') : I18n.t('dlg.money.flavourImpulse');
        GameState.addMail({ kind: 'news', cat: 'morale', subject: I18n.t('dlg.money.badSubj', { name: p.name }), body: I18n.t('dlg.money.badBody', { name: p.name, flavour }), ttl: 5 });
        this._maybeReveal(p, this._moneyRiskPole(p));   // the incident lays his reckless streak bare
    },
    // the concierge menu (client page): each purchase is the agent doing his real job
    SERVICES: {
        language: { label: 'Language course', cost: 5000 },
        house: { label: 'House hunting', cost: 8000 },
        family: { label: 'Fly the family over', cost: 4000 },
        media: { label: 'Media training', cost: 10000 }
    },
    ADVISOR_PER_YEAR: 2500,
    // a modest discount for committing to more years (so you don't have to re-hire every season)
    advisorCost(years) {
        years = Math.max(1, Math.min(5, years || 1));
        return Math.round(this.ADVISOR_PER_YEAR * years * (1 - Math.min(0.2, 0.05 * (years - 1))) / 50) * 50;
    },
    // hire (or extend) a financial advisor for 1–5 seasons — its own path, since the cost and the
    // multi-season term differ from the fixed one-off services
    hireAdvisor(p, years) {
        years = Math.max(1, Math.min(5, years || 1));
        const cost = this.advisorCost(years);
        if (GameState.agency.balance < cost) return { ok: false, message: I18n.t('dlg.notEnough', { amt: UI.money(cost) }) };
        // extends from the current end if he's already covered, otherwise from this season
        const from = this.advisorEngaged(p) ? p._finAdvisorUntil : GameState.seasonStartYear;
        p._finAdvisorUntil = from + years;
        GameState.agency.balance -= cost;
        GameState.addFinance('Client support', -cost);
        this.addBond(p, 1);
        const through = GameState.seasonLabelFor(p._finAdvisorUntil - 1);
        GameState.addLog(I18n.t('dlg.adv.engagedLog', { name: p.name, years, through, amt: UI.money(cost) }), 'info');
        return { ok: true, message: I18n.t('dlg.adv.engagedMsg', { name: p.name, through, amt: UI.money(cost) }) };
    },
    buyService(p, kind, years) {
        if (kind === 'advisor') return this.hireAdvisor(p, years);
        const svc = this.SERVICES[kind]; if (!svc) return { ok: false, message: I18n.t('dlg.svc.unknown') };
        if (GameState.agency.balance < svc.cost) return { ok: false, message: I18n.t('dlg.notEnough', { amt: UI.money(svc.cost) }) };
        const s = p.settling;
        if (kind === 'language') {
            // no course if he already speaks the language — nothing to teach him
            if (!s || s.services.language || s.knowsLang) return { ok: false, message: I18n.t('dlg.svc.noUse') };
            s.services.language = true; s.weeksLeft = Math.max(1, Math.ceil(s.weeksLeft / 2));
        } else if (kind === 'house') {
            if (!s || !s.morale) return { ok: false, message: I18n.t('dlg.svc.noUse') };
            s.morale = false; s.services.house = true;
        } else if (kind === 'family') {
            const f = this.ensureFacts(p);
            if (!s || s.services.family) return { ok: false, message: I18n.t('dlg.svc.noUse') };
            if (!f.family.discovered || f.family.status === 'single') return { ok: false, message: I18n.t('dlg.svc.noFamily') };
            s.services.family = true; s.weeksLeft = Math.max(1, Math.ceil(s.weeksLeft / 3));
        } else if (kind === 'media') {
            if (p._mediaTrained) return { ok: false, message: I18n.t('dlg.svc.mediaDone') };
            p._mediaTrained = true;
        }
        GameState.agency.balance -= svc.cost;
        GameState.addFinance('Client support', -svc.cost);
        this.addBond(p, 1);
        GameState.addLog(I18n.t('dlg.svc.arranged', { svc: this.serviceLabel(kind), name: p.name, amt: UI.money(svc.cost) }), 'info');
        return { ok: true, message: I18n.t('dlg.svc.arranged', { svc: this.serviceLabel(kind), name: p.name, amt: UI.money(svc.cost) }) };
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = { Dialogue };
