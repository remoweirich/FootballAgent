// ============================================================
//  Storage — IndexedDB-backed save/load, with a localStorage
//  fallback for environments where IndexedDB isn't available.
//
//  Why: a single localStorage JSON blob is fine in a desktop browser tab,
//  but in an Android WebView-wrapped app the OS can evict localStorage
//  under storage pressure far more readily than IndexedDB, and there's a
//  practical size ceiling (localStorage is a synchronous string API — a
//  large save means blocking JSON.stringify + a blocking write on every
//  call). IndexedDB is the durable, async-native option WebView apps expect.
//
//  Public API (all async — see game-state.js for how GameState.save()/load()
//  wrap these without every one of the ~80 call sites needing to change):
//    Storage.saveGame(state)   — queue a save; actual write is debounced
//    Storage.flush()           — force any queued save through immediately
//    Storage.loadGame()        — returns the saved state object, or null
//    Storage.deleteSave()      — wipes both IndexedDB and any legacy copy
//    Storage.hasSave()         — true if a save exists (either store)
//    Storage.migrateLegacy()   — one-time import of an old localStorage save
// ============================================================
const Storage = {
    DB_NAME: 'fam',
    DB_VERSION: 1,
    STORE: 'saves',
    KEY: 'current',                // the rolling autosave
    SLOT_INDEX: 'slotIndex',       // lightweight list of the manual named saves
    SLOT_PREFIX: 'slot:',          // per-slot full snapshots live at 'slot:<id>'
    MAX_SLOTS: 5,                  // how many manual named saves you may keep
    LEGACY_KEY: 'fam_proto_v4',
    FLUSH_DELAY_MS: 1500,

    _db: null,
    _dbPromise: null,
    _dirty: null,        // most recent state snapshot not yet durably written
    _flushTimer: null,
    _flushPromise: null,  // in-flight flush, so overlapping callers can await the same write

    _openDB() {
        if (this._db) return Promise.resolve(this._db);
        if (this._dbPromise) return this._dbPromise;
        if (typeof indexedDB === 'undefined') return Promise.resolve(null);
        this._dbPromise = new Promise(resolve => {
            let req;
            try { req = indexedDB.open(this.DB_NAME, this.DB_VERSION); }
            catch (e) { resolve(null); return; }
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(this.STORE)) req.result.createObjectStore(this.STORE);
            };
            req.onsuccess = () => { this._db = req.result; resolve(this._db); };
            req.onerror = () => resolve(null);
            req.onblocked = () => resolve(null);
        });
        return this._dbPromise;
    },
    // key-addressed IDB access — the autosave lives at KEY ('current'), named saves at 'slot:<id>',
    // and the small slot index at SLOT_INDEX. The three autosave helpers below are thin wrappers.
    async _idbGetKey(key) {
        const db = await this._openDB(); if (!db) return null;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(this.STORE, 'readonly');
                const req = tx.objectStore(this.STORE).get(key);
                req.onsuccess = () => resolve(req.result != null ? req.result : null);
                req.onerror = () => resolve(null);
            } catch (e) { resolve(null); }
        });
    },
    async _idbPutKey(key, value) {
        const db = await this._openDB(); if (!db) return false;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(this.STORE, 'readwrite');
                tx.objectStore(this.STORE).put(value, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
                tx.onabort = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    },
    async _idbDeleteKey(key) {
        const db = await this._openDB(); if (!db) return false;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(this.STORE, 'readwrite');
                tx.objectStore(this.STORE).delete(key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (e) { resolve(false); }
        });
    },
    _idbGet() { return this._idbGetKey(this.KEY); },
    _idbPut(value) { return this._idbPutKey(this.KEY, value); },
    _idbDelete() { return this._idbDeleteKey(this.KEY); },
    _legacyRead() {
        try { const raw = localStorage.getItem(this.LEGACY_KEY); return raw ? JSON.parse(raw) : null; }
        catch (e) { return null; }
    },
    _legacyWrite(state) {
        try { localStorage.setItem(this.LEGACY_KEY, JSON.stringify(state)); return true; }
        catch (e) { return false; }
    },
    _legacyClear() {
        try { localStorage.removeItem(this.LEGACY_KEY); } catch (e) { /* ignore */ }
    },

    // ---- public API ----

    // Fire-and-forget from the caller's point of view: updates the in-memory
    // "latest state" immediately and (re)schedules a debounced write, so bursts
    // of saves (several actions in a row) collapse into one actual disk write.
    saveGame(state) {
        this._dirty = state;
        clearTimeout(this._flushTimer);
        this._flushTimer = setTimeout(() => { this.flush(); }, this.FLUSH_DELAY_MS);
    },
    // Force the pending save through right now (advance-week completing,
    // the app being backgrounded, an explicit save point). Safe to call with
    // nothing pending — it's a no-op then.
    //
    // Race-safety: a save queued WHILE a write is in flight must not be lost. We snapshot the exact
    // state we're writing, and only clear `_dirty` if it still points at that snapshot when the write
    // finishes — if a newer saveGame() replaced it mid-write, we leave it dirty and loop to write the
    // newer state too. Overlapping flush() callers chain onto the same tail rather than returning a
    // promise that resolves before their (newer) data is on disk.
    async flush() {
        // An in-flight flush drains until nothing is dirty (see _drain's while-loop), so any save
        // queued during the write is guaranteed to be written before that same promise resolves —
        // overlapping callers can safely await it.
        if (this._flushPromise) return this._flushPromise;
        this._flushPromise = this._drain();
        try { await this._flushPromise; } finally { this._flushPromise = null; }
    },
    // Write successive dirty snapshots until none is left. Each iteration commits exactly the state it
    // captured, and only marks it clean if nothing newer arrived while the async write was in flight —
    // otherwise the newer snapshot is kept dirty and the loop writes it too, so no save is ever lost.
    async _drain() {
        while (this._dirty != null) {
            clearTimeout(this._flushTimer);
            const state = this._dirty;
            const ok = await this._idbPut(state);
            if (ok) { this._legacyClear(); if (this._dirty === state) this._dirty = null; }
            else { this._legacyWrite(state); if (this._dirty === state) this._dirty = null; }
        }
    },
    async loadGame() {
        // an unflushed save is more current than whatever's on disk
        if (this._dirty != null) return this._dirty;
        const fromIdb = await this._idbGet();
        if (fromIdb) return fromIdb;
        return this._legacyRead();
    },
    async deleteSave() {
        this._dirty = null;
        clearTimeout(this._flushTimer);
        await this._idbDelete();
        this._legacyClear();
    },
    async hasSave() {
        if (this._dirty != null) return true;
        const fromIdb = await this._idbGet();
        if (fromIdb) return true;
        return this._legacyRead() != null;
    },
    // ---- manual named saves (the autosave above is separate; these are explicit snapshots) ----
    // The index is a small array of { id, name, savedAt, ...summary } the caller supplies; full
    // snapshots sit at 'slot:<id>'. IndexedDB-only (no legacy fallback) — degrades to "unavailable".
    async listSlots() {
        const idx = await this._idbGetKey(this.SLOT_INDEX);
        return Array.isArray(idx) ? idx : [];
    },
    getSlot(id) { return this._idbGetKey(this.SLOT_PREFIX + id); },
    async putSlot(id, state, meta) {
        const ok = await this._idbPutKey(this.SLOT_PREFIX + id, state);
        if (!ok) return false;
        const idx = await this.listSlots();
        const entry = Object.assign({ id }, meta);
        const i = idx.findIndex(s => s.id === id);
        if (i >= 0) idx[i] = entry; else idx.push(entry);
        await this._idbPutKey(this.SLOT_INDEX, idx);
        return true;
    },
    async deleteSlot(id) {
        await this._idbDeleteKey(this.SLOT_PREFIX + id);
        const idx = (await this.listSlots()).filter(s => s.id !== id);
        await this._idbPutKey(this.SLOT_INDEX, idx);
        return true;
    },

    // One-time first-run step: if IndexedDB is empty but an old localStorage
    // save exists, copy it over, confirm it reads back, then drop the legacy copy.
    async migrateLegacy() {
        const already = await this._idbGet();
        if (already) return;
        const legacy = this._legacyRead();
        if (!legacy) return;
        const ok = await this._idbPut(legacy);
        if (ok) {
            const verify = await this._idbGet();
            if (verify) this._legacyClear();
        }
    }
};

// Flush on backgrounding — the two events mobile WebViews actually fire
// reliably when the app is switched away from or the OS reclaims it.
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') Storage.flush();
    });
    window.addEventListener('pagehide', () => { Storage.flush(); });
}
