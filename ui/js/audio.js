// ============================================================
//  Sound — music playlist + SFX. Two channels (music, sfx), each
//  with a 0–100 volume and a mute, persisted in device Prefs.
//  Music is a shuffled playlist of the tracks in assets/audio/music/
//  (listed in the build-generated MUSIC_TRACKS): they play back to
//  back, reshuffling when exhausted, with a now-playing toast + skip
//  and per-track enable/disable in Settings. Playback is continuous
//  across the menu and in-game.
//  Files load best-effort: a missing/absent file just stays silent,
//  so the system is inert until real assets are dropped in
//  (see assets/audio/README.md).
//  Named `Sound`, NOT `Audio` (that's the DOM constructor). Lives in
//  the UI layer so the headless engine tests never touch it. Mobile
//  WebViews block audio until a user gesture; init() arms an unlock.
// ============================================================
const Sound = {
    BASE: 'assets/audio/',
    EXT: 'mp3',
    SFX: { tap: 'tap', goal: 'goal', whistle1: 'whistle1', whistle2: 'whistle2', cash: 'cash', notify: 'notify' },
    DEFAULT: { music: 55, sfx: 80 },

    _buf: {},                    // sfx name -> { el, ok }
    _music: null,                // current track's Audio element
    _queue: [], _qi: 0,          // shuffled play queue + index
    _lastFile: null,             // to avoid an immediate repeat on reshuffle
    _wantPlay: false,            // playlist should be running (deferred until unlock)
    _fadeTimer: null, _toastTimer: null,
    _unlocked: false, _ready: false, _css: false,

    init() {
        for (const name in this.SFX) this._preloadSfx(name, this.SFX[name]);
        this._ready = true;
        const unlock = () => this.unlock();
        ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
        // ubiquitous tap feedback without editing every screen
        document.addEventListener('click', e => {
            if (e.target && e.target.closest && e.target.closest('button, .btn, .ss-btn, .set-row, .list-row, a[href], .set-seg__btn'))
                this.play('tap');
        }, true);
    },

    _srcSfx(base) { return this.BASE + base + '.' + this.EXT; },
    _preloadSfx(name, base) {
        try {
            const el = new Audio(); el.preload = 'auto'; el.src = this._srcSfx(base);
            const rec = { el, ok: false };
            el.addEventListener('canplaythrough', () => { rec.ok = true; }, { once: true });
            el.addEventListener('error', () => { rec.ok = false; }, { once: true });
            this._buf[name] = rec;
        } catch (e) { /* no Audio ctor */ }
    },

    // ---- prefs-backed volume (0..100) / mute, per channel ----
    vol(ch) { return Math.max(0, Math.min(100, Prefs.get('vol_' + ch, this.DEFAULT[ch] != null ? this.DEFAULT[ch] : 80))); },
    muted(ch) { return !!Prefs.get('mute_' + ch, false); },
    _eff(ch) { return this.muted(ch) ? 0 : this.vol(ch) / 100; },
    setVol(ch, v) { Prefs.set('vol_' + ch, Math.max(0, Math.min(100, Math.round(+v)))); if (ch === 'music') this._applyMusicVol(); },
    setMuted(ch, b) {
        Prefs.set('mute_' + ch, !!b);
        if (ch === 'music') { if (b) this._pauseMusic(); else this._resumeMusic(); this._applyMusicVol(); }
    },
    toggleMuted(ch) { const b = !this.muted(ch); this.setMuted(ch, b); return b; },

    unlock() {
        if (this._unlocked) return;
        this._unlocked = true;
        if (this._wantPlay && !this._music) this._begin();
    },

    // ---- SFX ----
    play(name) {
        if (!this._ready) return;
        const rec = this._buf[name]; if (!rec || !rec.ok) return;   // missing file -> silent
        const g = this._eff('sfx'); if (g <= 0) return;
        try { const node = rec.el.cloneNode(true); node.volume = g; const p = node.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* */ }
    },

    // ---- music tracks / playlist ----
    allTracks() { return (typeof MUSIC_TRACKS !== 'undefined' && Array.isArray(MUSIC_TRACKS)) ? MUSIC_TRACKS : []; },
    _disabled() { const d = Prefs.get('music_off', []); return Array.isArray(d) ? d : []; },
    enabledTracks() { const off = this._disabled(); return this.allTracks().filter(t => off.indexOf(t.file) === -1); },
    trackEnabled(file) { return this._disabled().indexOf(file) === -1; },
    setTrackEnabled(file, on) {
        const off = this._disabled().slice();
        const i = off.indexOf(file);
        if (on && i !== -1) off.splice(i, 1);
        else if (!on && i === -1) off.push(file);
        Prefs.set('music_off', off);
        // React live, WITHOUT clearing the intent to play (so re-enabling always resumes):
        if (!this.enabledTracks().length) {                              // nothing left — stop the sound, keep _wantPlay
            this._hideToast(); this._stopEl(this._music); this._music = null;
            return;
        }
        if (!on && this._music && this._music._trackFile === file) {     // killed the current track — jump to a fresh one
            this._stopEl(this._music); this._music = null;
            this._buildQueue(); this._playCurrent();
            return;
        }
        if (!this._music) this.startPlaylist();                          // was silent (all had been off / not started yet) — (re)start
    },

    // start (or keep) the playlist running
    startPlaylist() {
        if (!this.enabledTracks().length) return;
        this._wantPlay = true;
        if (!this._unlocked || this._music) return;   // deferred to first gesture, or already going
        this._begin();
    },
    stopMusic() {
        this._wantPlay = false;
        this._hideToast();
        this._fade(0, () => { this._stopEl(this._music); this._music = null; });
    },
    skip() { this.next(); },
    // jump straight to a chosen track and play it now (Settings: tap a song). Rotation carries on
    // afterwards with the enabled tracks. Playing a currently-disabled track is a one-off preview.
    playTrack(file) {
        const t = this.allTracks().find(x => x.file === file);
        if (!t) return;
        this._wantPlay = true; this._unlocked = true;   // it's a user gesture
        this._stopEl(this._music); this._music = null;
        this._queue = [t].concat(this._shuffle(this.enabledTracks().filter(x => x.file !== file)));
        this._qi = 0;
        this._playCurrent();
    },
    next() {
        this._stopEl(this._music); this._music = null;
        if (!this._wantPlay) return;
        this._qi++;
        if (this._qi >= this._queue.length) this._buildQueue();
        this._playCurrent();
    },

    _begin() { this._buildQueue(); this._playCurrent(); },
    _shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; },
    _buildQueue() {
        this._queue = this._shuffle(this.enabledTracks());
        // avoid opening with the track we just finished, when there's a choice
        if (this._queue.length > 1 && this._queue[0].file === this._lastFile) this._queue.push(this._queue.shift());
        this._qi = 0;
    },
    _playCurrent() {
        const t = this._queue[this._qi];
        if (!t) return;
        try {
            const el = new Audio(); el.src = encodeURI(this._src(t)); el.volume = 0;
            el._trackFile = t.file;
            el.addEventListener('ended', () => this.next(), { once: true });
            el.addEventListener('error', () => this.next(), { once: true });   // skip a bad/missing file
            this._music = el; this._lastFile = t.file;
            const p = el.play();
            if (p && p.then) p.then(() => { this._fade(this._eff('music')); this._announce(t.name); }).catch(() => {});
            else this._announce(t.name);
        } catch (e) { /* */ }
    },
    _src(t) { return t.file.indexOf('/') !== -1 ? t.file : (this.BASE + 'music/' + t.file); },
    _pauseMusic() { if (this._music) { try { this._music.pause(); } catch (e) { /* */ } } },
    _resumeMusic() {
        if (this._wantPlay && !this._music) this._begin();
        else if (this._music && this._eff('music') > 0) { try { const p = this._music.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* */ } }
    },
    _applyMusicVol() { if (this._music) this._fade(this._eff('music')); },
    _stopEl(el) { if (el) { try { el.pause(); el.src = ''; } catch (e) { /* */ } } },
    _fade(target, done) {
        const el = this._music;
        if (!el) { if (done) done(); return; }
        if (this._fadeTimer) clearInterval(this._fadeTimer);
        this._fadeTimer = setInterval(() => {
            const d = target - el.volume;
            if (Math.abs(d) < 0.04) { el.volume = Math.max(0, Math.min(1, target)); clearInterval(this._fadeTimer); this._fadeTimer = null; if (done) done(); return; }
            el.volume = Math.max(0, Math.min(1, el.volume + (d > 0 ? 0.04 : -0.04)));
        }, 30);
    },

    // ---- now-playing toast ----
    _announce(name) {
        if (!name) return;
        this._injectCSS();
        let t = document.getElementById('npToast');
        if (!t) { t = document.createElement('div'); t.id = 'npToast'; t.className = 'np-toast'; document.body.appendChild(t); }
        const lbl = (typeof I18n !== 'undefined') ? I18n.t('music.nowPlaying') : 'Now playing';
        const skip = (typeof I18n !== 'undefined') ? I18n.t('music.skip') : 'Skip';
        t.innerHTML = `<div class="np-note">♪</div><div class="np-main"><div class="np-lbl"></div><div class="np-name"></div></div>
            <button class="np-skip" aria-label="${skip}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4l10 8-10 8V4zM19 5v14"/></svg></button>`;
        t.querySelector('.np-lbl').textContent = lbl;
        t.querySelector('.np-name').textContent = name;                // textContent: filenames can't inject HTML
        t.querySelector('.np-skip').onclick = () => Sound.skip();
        void t.offsetWidth; t.classList.add('show');                   // restart the CSS transition
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => this._hideToast(), 5000);
    },
    _hideToast() { const t = document.getElementById('npToast'); if (t) t.classList.remove('show'); },
    _injectCSS() {
        if (this._css) return; this._css = true;
        const css = `
        .np-toast{position:fixed;top:calc(env(safe-area-inset-top,0) + 8px);left:50%;transform:translate(-50%,-140%);z-index:62;
            display:flex;align-items:center;gap:10px;max-width:min(400px,calc(100vw - 24px));
            background:var(--surface-raised);border:1px solid var(--line-strong);border-radius:999px;
            padding:7px 8px 7px 14px;box-shadow:0 6px 20px rgba(0,0,0,.28);opacity:0;transition:transform .28s ease,opacity .28s ease;pointer-events:none}
        .np-toast.show{transform:translate(-50%,0);opacity:1;pointer-events:auto}
        .np-note{color:var(--accent);font-size:15px;flex:none}
        .np-main{min-width:0;display:flex;flex-direction:column;line-height:1.2}
        .np-lbl{color:var(--text-dim);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .np-name{color:var(--text-bright);font-size:var(--fs-sm);font-weight:var(--weight-semibold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .np-skip{flex:none;background:var(--surface);border:1px solid var(--line-strong);color:var(--text-secondary);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .np-skip:active{background:var(--accent-tint);color:var(--accent-text)}`;
        const el = document.createElement('style'); el.id = 'npCSS'; el.textContent = css; document.head.appendChild(el);
    },
};
