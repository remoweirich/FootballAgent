// ============================================================
//  DialogueView — full-screen chat scene player (Phase 1)
//  Renders a Dialogue scene (complaint talk, gift reaction) as
//  a conversation: client bubbles arrive with a typing pause,
//  your replies are the choice buttons pinned at the bottom.
//  Pure presentation; every effect is applied by js/dialogue.js.
// ============================================================
const DialogueView = {
    TYPE_MS: 650,          // "..." typing indicator before a client line lands

    scene: null,
    onDone: null,
    _timer: null,

    show(scene, onDone) {
        if (!scene) { if (onDone) onDone(); return; }
        this.scene = scene;
        this.onDone = onDone || function () { Router.refresh(); };
        this.p = GameState.getPlayer(scene.playerId);
        this.bubbles = [];        // { side: 'client'|'me'|'sys', text }
        this.pendingChoices = null;
        this._renderShell();
        if (scene.kind === 'complaint') {
            this._clientSay(scene.open ? scene.open.text : '...', () => this._offer(scene.choices));
        } else if (scene.kind === 'gift') {
            this._clientSay(scene.react ? scene.react.text : '...', () => this._offer(scene.choices));
        } else if (scene.kind === 'prematch') {
            this._sysNote(I18n.t('dialogue.dressingRoom'));
            this._clientSay(scene.open ? scene.open.text : '...', () => this._offer(scene.choices));
        } else if (scene.kind === 'postmatch') {
            (scene.notes || []).forEach(n => this._sysNote(n));
            this._clientSay(scene.open ? scene.open.text : '...', () => this._offer(scene.choices));
        } else if (scene.kind === 'farewell') {
            this._clientSay(scene.open ? scene.open.text : '...', () => {
                this._sysNote(scene.montage);
                if (scene.boyhoodNote) this._sysNote(scene.boyhoodNote);
                this._offer(scene.choices);
            });
        } else if (scene.kind === 'checkin' || scene.kind === 'moment') {
            (scene.notes || []).forEach(n => this._sysNote(n));
            this._clientSay(scene.open ? scene.open.text : '...', () => this._offer(scene.choices));
        }
    },

    _close() {
        clearTimeout(this._timer);
        const done = this.onDone; this.onDone = function () { };
        this.scene = null;
        done();
    },

    // ---------- conversation beats ----------
    _clientSay(text, then) {
        this.bubbles.push({ side: 'client', text: '…', typing: true });
        this._paint();
        const bubble = this.bubbles[this.bubbles.length - 1];
        // land() is idempotent so a tap (skip) and the timer can't both apply it
        this._land = () => {
            if (!bubble.typing) return;
            bubble.text = text; bubble.typing = false;
            this._paint();
            if (then) then();
        };
        this._timer = setTimeout(this._land, this.TYPE_MS);
    },
    _meSay(text) { this.bubbles.push({ side: 'me', text }); this._paint(); },
    _sysNote(text) { this.bubbles.push({ side: 'sys', text }); this._paint(); },
    _offer(choices) { this.pendingChoices = choices; this._paint(); },

    // reveal a typing bubble immediately on tap
    skip() {
        if (this._land) { clearTimeout(this._timer); this._land(); }
    },

    // ---------- choice handling ----------
    pick(key) {
        const s = this.scene; if (!s || !this.pendingChoices) return;
        const choice = this.pendingChoices.find(c => c.key === key); if (!choice) return;
        if (key === 'leave') { this.leave(); return; }
        if (s.kind === 'complaint' && key === 'promise') {
            // promises are concrete: pick WHAT you are promising before he answers
            const labels = { move: I18n.t('dialogue.promise.move'), newContract: I18n.t('dialogue.promise.newContract'), playingTime: I18n.t('dialogue.promise.playingTime'), renegotiateRep: I18n.t('dialogue.promise.renegotiateRep') };
            const types = Agency.validPromiseTypes(this.p);
            this.pendingChoices = types.map(t => ({ key: 'promise:' + t, label: labels[t] || t, hint: '', say: Dialogue.SAY['promise:' + t] || '' }))
                .concat([{ key: 'back', label: I18n.t('dialogue.secondThought'), hint: '' }]);
            this._paint();
            return;
        }
        if (s.kind === 'prematch' && key === 'bonus') {
            // pick the size of the promised gift; it only ever costs you if they win
            this.pendingChoices = ['small', 'medium', 'large'].map(t =>
                ({ key: 'bonus:' + t, label: I18n.t('dialogue.gift.' + t, { amount: UI.money(Agency.giftCost(t, this.p)) }), hint: I18n.t('dialogue.gift.hint'), say: Dialogue.SAY['bonus:' + t] || '' }))
                .concat([{ key: 'back', label: I18n.t('dialogue.secondThought'), hint: '' }]);
            this._paint();
            return;
        }
        if (key === 'back') { this.pendingChoices = this.scene.choices; this._paint(); return; }

        this.pendingChoices = null;
        this._meSay(choice.say || choice.label);   // the agent speaks his line in full, not the button label
        let res;
        if (s.kind === 'complaint') {
            const promiseType = key.indexOf('promise:') === 0 ? key.slice(8) : null;
            res = Dialogue.resolveComplaint(this.p, promiseType ? 'promise' : key, promiseType);
        } else if (s.kind === 'gift') {
            res = Dialogue.resolveGiftClose(this.p, key);
        } else if (s.kind === 'prematch') {
            const tier = key.indexOf('bonus:') === 0 ? key.slice(6) : null;
            res = Dialogue.resolvePrematch(this.p, s, tier ? 'bonus' : key, tier);
        } else if (s.kind === 'postmatch') {
            res = Dialogue.resolvePostmatch(this.p, key, s.won, s.extra);
        } else if (s.kind === 'farewell') {
            res = Dialogue.resolveFarewell(this.p, key);
        } else if (s.kind === 'checkin') {
            res = Dialogue.resolveCheckin(this.p, key);
        } else if (s.kind === 'moment') {
            res = Dialogue.resolveMoment(this.p, s, key);
        }
        if (!res || !res.ok) { this._sysNote((res && res.message) || I18n.t('dialogue.didntWork')); this._offer(s.choices); return; }
        GameState.save();
        this._clientSay(res.reply ? res.reply.text : '…', () => {
            if (res.note) this._sysNote(res.note);
            if (res.revealed) this._sysNote(I18n.t('dialogue.gettingToKnow', { revealed: res.revealed }));
            if (res.closed) this._sysNote(I18n.t('dialogue.droppedComplaint'));
            const leaveLabel = s.kind === 'gift' ? I18n.t('dialogue.leave.gift')
                : s.kind === 'prematch' ? I18n.t('dialogue.leave.prematch')
                : s.kind === 'postmatch' ? (s.won ? I18n.t('dialogue.leave.winCelebrate') : I18n.t('dialogue.leave.lose'))
                : s.kind === 'farewell' ? I18n.t('dialogue.leave.farewell')
                : s.kind === 'checkin' ? I18n.t('dialogue.leave.checkin')
                : s.kind === 'moment' ? (s.momentType === 'injury' ? I18n.t('dialogue.leave.injury') : I18n.t('dialogue.leave.gift'))
                : I18n.t('dialogue.leave.default');
            this._offer([{ key: 'leave', label: leaveLabel, hint: '' }]);
        });
    },
    leave() { this._close(); },
    // tap the header to open this client's full profile. The scene's effects are already banked (every
    // choice saves), so leaving the chat here is safe — the back button returns to the clients list.
    viewPlayer() {
        const id = this.scene && this.scene.playerId;
        clearTimeout(this._timer);
        this.scene = null; this.onDone = function () { };
        if (id != null && typeof Router !== 'undefined') Router.go('client/' + id);
    },

    // ---------- rendering ----------
    _renderShell() {
        const p = this.p;
        const club = Clubs.getClubById(effectiveClubId(p));
        document.getElementById('app').innerHTML = `<div class="dlg-wrap">
            <div class="dlg-head">
                <button class="icon-btn" onclick="DialogueView.leave()" aria-label="${I18n.t('common.close')}"><i class="ti ti-x" style="font-size:20px"></i></button>
                <div class="dlg-who" onclick="DialogueView.viewPlayer()" role="button" title="${I18n.t('dialogue.viewProfile')}">
                    <div class="dlg-name">${UI.flag(p.nationality)} ${UI.esc(p.name)} <i class="ti ti-chevron-right dlg-namechev"></i></div>
                    <div class="dlg-sub">${p.position} · ${club ? UI.esc(club.name) : I18n.t('dialogue.noClub')}</div>
                </div>
                <div class="dlg-ava" onclick="DialogueView.viewPlayer()">${(p.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
            </div>
            <div class="dlg-chat" id="dlgChat" onclick="DialogueView.skip()"></div>
            <div class="dlg-choices" id="dlgChoices"></div>
        </div>`;
        this._injectCSS();
        this._paint();
    },
    _paint() {
        const chat = document.getElementById('dlgChat'); if (!chat) return;
        chat.innerHTML = this.bubbles.map(b => {
            if (b.side === 'sys') return `<div class="dlg-sys">${UI.esc(b.text)}</div>`;
            const cls = b.side === 'me' ? 'dlg-b dlg-b--me' : 'dlg-b dlg-b--cl';
            return `<div class="${cls}${b.typing ? ' dlg-b--typing' : ''}">${b.typing ? '<span class="dlg-dots"><i></i><i></i><i></i></span>' : UI.esc(b.text)}</div>`;
        }).join('');
        chat.scrollTop = chat.scrollHeight;
        const bar = document.getElementById('dlgChoices'); if (!bar) return;
        bar.innerHTML = (this.pendingChoices || []).map(c =>
            `<button class="dlg-choice" onclick="DialogueView.pick('${c.key}')">
                <span class="dlg-choice__label">${UI.esc(c.label)}</span>
                ${c.hint ? `<span class="dlg-choice__hint">${UI.esc(c.hint)}</span>` : ''}
            </button>`).join('');
    },
    _injectCSS() {
        if (document.getElementById('dlgCSS')) return;
        const css = `
        .dlg-wrap{position:fixed;inset:0;display:flex;flex-direction:column;background:var(--bg);z-index:60}
        .dlg-head{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;border-bottom:.5px solid var(--line-strong);background:var(--surface)}
        .dlg-who{flex:1;min-width:0;cursor:pointer}
        .dlg-namechev{font-size:14px;color:var(--text-faint);vertical-align:middle}
        .dlg-name{font-weight:var(--weight-semibold);font-size:var(--fs-lg);color:var(--text-bright);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dlg-sub{color:var(--text-muted);font-size:var(--fs-sm);margin-top:1px}
        .dlg-ava{width:38px;height:38px;border-radius:50%;background:var(--accent-fill);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:var(--weight-semibold);flex:none}
        .dlg-chat{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:8px}
        .dlg-b{max-width:82%;padding:9px 13px;border-radius:16px;font-size:var(--fs-md);line-height:1.45;white-space:pre-wrap}
        .dlg-b--cl{align-self:flex-start;background:#232B35;color:var(--text);border:.5px solid rgba(255,255,255,.10);border-bottom-left-radius:5px}
        .dlg-b--me{align-self:flex-end;background:rgba(52,211,153,.16);color:var(--text);border:.5px solid rgba(52,211,153,.22);border-bottom-right-radius:5px}
        .dlg-sys{align-self:center;color:var(--text-secondary);font-size:var(--fs-sm);background:var(--surface-raised);border:.5px dashed var(--line-strong);border-radius:12px;padding:4px 12px;margin:2px 0}
        .dlg-dots{display:inline-flex;gap:4px;padding:3px 2px}
        .dlg-dots i{width:6px;height:6px;border-radius:50%;background:var(--text-faint);animation:dlgBlink 1s infinite}
        .dlg-dots i:nth-child(2){animation-delay:.18s}.dlg-dots i:nth-child(3){animation-delay:.36s}
        @keyframes dlgBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}
        .dlg-choices{padding:10px 14px calc(env(safe-area-inset-bottom, 0px) + 14px);display:flex;flex-direction:column;gap:8px;border-top:.5px solid var(--line-strong);background:var(--surface)}
        .dlg-choice{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;padding:11px 14px;border-radius:12px;border:1px solid var(--line-strong);background:var(--bg);color:var(--text);font:inherit;cursor:pointer}
        .dlg-choice:active{background:var(--accent-fill)}
        .dlg-choice__label{font-weight:var(--weight-semibold);font-size:var(--fs-md)}
        .dlg-choice__hint{color:var(--text-muted);font-size:var(--fs-sm)}`;
        const el = document.createElement('style'); el.id = 'dlgCSS'; el.textContent = css; document.head.appendChild(el);
    }
};
