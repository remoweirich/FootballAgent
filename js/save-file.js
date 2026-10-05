// ============================================================
//  SaveFile — the .fam export envelope.
//
//  One file is one career. The header stays plain text so a human (or a bug report) can see what
//  a file is without running it; only the state itself is compressed, because a 15-season save is
//  1.8 MB raw and 216 KB gzipped.
//
//  Two things are deliberately NOT the same as the in-game save:
//    * clubLogos is stripped. They are 128px PNG data URIs, already compressed, so they do not
//      shrink — one logo'd country adds ~0.7 MB to a ~290 KB file. Logos added through a
//      customization database still travel, because the database's countries are embedded below.
//    * created countries are EMBEDDED. A save that needs Austria is useless on a device that has
//      never seen it, and at 2.4 KB gzipped per country carrying it costs ~1% of the file.
//
//  See docs/save-export-design.md.
// ============================================================
const SaveFile = {
    FORMAT: 1,
    EXT: '.fam',
    MAX_BYTES: 25 * 1024 * 1024,   // refuse absurd input before trying to decompress it

    // ---- primitives -------------------------------------------------------------------------
    _hasCompression() { return typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined'; },

    // chunked, because String.fromCharCode.apply blows the stack on a few hundred KB at once
    _b64(bytes) {
        let s = '', CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return btoa(s);
    },
    _unb64(str) {
        const bin = atob(str), out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    },
    async _gzip(text) {
        const cs = new CompressionStream('gzip');
        const buf = await new Response(new Blob([text]).stream().pipeThrough(cs)).arrayBuffer();
        return new Uint8Array(buf);
    },
    async _gunzip(bytes) {
        const ds = new DecompressionStream('gzip');
        return await new Response(new Blob([bytes]).stream().pipeThrough(ds)).text();
    },
    // Not security — a save on disk is editable and no client-side scheme changes that. This only
    // lets an import notice that a payload was altered outside the game (see the design doc).
    _checksum(text) {
        let h = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
        return (h >>> 0).toString(16);
    },

    // ---- what travels -----------------------------------------------------------------------
    // Everything the save holds except the mid-session logo imports.
    _stripLogos(state) {
        const out = {};
        for (const k in state) if (k !== 'clubLogos') out[k] = state[k];
        out.clubLogos = null;
        return out;
    },
    // The created countries this career depends on, logo-free. Taken from WorldExt.created, which
    // registerCountry keeps as the day-one DEFINITION — promotion and relegation mutate the copies
    // in Clubs.allClubs, never this, so what is embedded is stable across seasons.
    _collectCountries() {
        const src = (typeof WorldExt !== 'undefined' && WorldExt.created) || {};
        const out = {};
        for (const name in src) {
            const cc = src[name]; if (!cc) continue;
            const copy = JSON.parse(JSON.stringify(cc));
            (copy.clubs || []).forEach(c => { c.logo = null; });
            out[name] = copy;
        }
        return Object.keys(out).length ? out : null;
    },
    // Two created countries are the same world if the clubs, their names and their divisions line
    // up. Logos, colours and reputation are excluded on purpose: a crest import or a tuned
    // reputation is not a different world, and refusing on them would block a legitimate save.
    sameCountry(a, b) {
        if (!a || !b) return false;
        if (String(a.name) !== String(b.name)) return false;
        if ((a.divIds || []).join('|') !== (b.divIds || []).join('|')) return false;
        if ((a.divNames || []).join('|') !== (b.divNames || []).join('|')) return false;
        const key = cc => (cc.clubs || []).map(c => c.id + '\u0001' + c.name + '\u0001' + c.division).join('\u0002');
        return key(a) === key(b);
    },

    // ---- pack -------------------------------------------------------------------------------
    // `state` is a GameState._snapshot(). Returns { ok, text, filename, bytes } or { ok:false, error }.
    async pack(state, opts) {
        opts = opts || {};
        if (!state) return { ok: false, error: 'nostate' };
        const countries = this._collectCountries();
        // A career on a created country whose world has gone missing locally would export a file
        // that cannot load anywhere. Refuse rather than writing it — and say the career is broken.
        if (state.databaseId && !countries && opts.requireWorld !== false && this._needsWorld(state))
            return { ok: false, error: 'worldmissing' };

        // The world definitions go INSIDE the compressed payload: 84 clubs is ~18 KB of JSON, and
        // leaving it in the plain header costs that in full. The header keeps only the names, so a
        // human reading the file can still see which worlds it needs without decoding anything.
        const body = JSON.stringify({ state: this._stripLogos(state), world: countries });
        let encoding = 'plain', payload = body;
        if (this._hasCompression()) {
            try { payload = this._b64(await this._gzip(body)); encoding = 'gzip+base64'; }
            catch (e) { encoding = 'plain'; payload = body; }
        }
        const env = {
            fam: this.FORMAT,
            app: opts.app || null,
            schema: state.schemaVersion != null ? state.schemaVersion : null,
            exported: Date.now(),
            encoding,
            game: {
                agency: (state.agency && state.agency.name) || null,
                manager: (state.agency && state.agency.agentName) || null,
                country: state.homeCountry || null,
                season: opts.season || null,
                week: state.week || null,
                clients: (state.players || []).filter(p => p && p.agentId === 'me' && !p.retired).length,
                saveName: state.saveName || null
            },
            needs: countries ? Object.keys(countries) : null,
            checksum: this._checksum(body),
            payload
        };
        const text = JSON.stringify(env);
        return { ok: true, text, env, bytes: text.length, filename: this.filename(env) };
    },
    // a career is only world-dependent if any club it references is a created one
    _needsWorld(state) {
        const hit = s => typeof s === 'string' && s.indexOf('CUS:') === 0;
        if (hit(state.homeCountry)) return true;
        for (const id in (state.clubState || {})) if (hit(id)) return true;
        return (state.players || []).some(p => p && (hit(p.clubId) || hit(p.onLoanAt)));
    },

    filename(env) {
        const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const g = env.game || {};
        const d = new Date(env.exported || Date.now());
        const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        return [slug(g.saveName || g.agency) || 'career', slug(g.season), date].filter(Boolean).join('-') + this.EXT;
    },

    // ---- unpack -----------------------------------------------------------------------------
    // Returns { ok, state, world, env, modified } or { ok:false, error, detail }.
    // `error` is a code the UI turns into a sentence, so every refusal can say WHICH check failed.
    async unpack(text, opts) {
        opts = opts || {};
        if (typeof text !== 'string' || !text.length) return { ok: false, error: 'empty' };
        if (text.length > this.MAX_BYTES) return { ok: false, error: 'toobig' };
        let env;
        try { env = JSON.parse(text); } catch (e) { return { ok: false, error: 'notjson' }; }
        if (!env || typeof env !== 'object' || env.fam == null) return { ok: false, error: 'notasave' };
        if (env.fam > this.FORMAT) return { ok: false, error: 'newerformat' };
        const localSchema = opts.schemaVersion != null ? opts.schemaVersion
            : (typeof GameState !== 'undefined' ? GameState.SCHEMA_VERSION : null);
        if (env.schema != null && localSchema != null && env.schema > localSchema)
            return { ok: false, error: 'newerschema', detail: env.schema };

        let body;
        if (env.encoding === 'gzip+base64') {
            if (typeof DecompressionStream === 'undefined') return { ok: false, error: 'nocodec' };
            try { body = await this._gunzip(this._unb64(env.payload)); }
            catch (e) { return { ok: false, error: 'baddata' }; }
        } else {
            body = env.payload;
        }
        let outer;
        try { outer = JSON.parse(body); } catch (e) { return { ok: false, error: 'baddata' }; }
        // format 1 wraps { state, world }; anything without that shape is not one of ours
        const state = (outer && outer.state) ? outer.state : null;
        const world = (outer && outer.world) ? outer.world : null;

        // does it actually look like one of our saves?
        const bad = !state || typeof state !== 'object'
            || typeof state.week !== 'number'
            || typeof state.seasonStartYear !== 'number'
            || typeof state.homeCountry !== 'string'
            || !state.agency || typeof state.agency !== 'object'
            || !Array.isArray(state.players);
        if (bad) return { ok: false, error: 'notasave' };

        return {
            ok: true, env, state, world,
            modified: env.checksum != null && env.checksum !== this._checksum(body)
        };
    },

    // ---- the world an imported save brings --------------------------------------------------
    // For each embedded country: 'install' (absent locally), 'reuse' (identical), or 'conflict'
    // (a DIFFERENT country of the same name is already registered). A conflict must refuse:
    // registerCountry skips clubs whose ids exist but overwrites COMPETITIONS, so letting one
    // through produces the local world's clubs inside the imported world's divisions.
    planWorld(world) {
        const plan = { install: [], reuse: [], conflict: [] };
        const local = (typeof WorldExt !== 'undefined' && WorldExt.created) || {};
        for (const name in (world || {})) {
            if (!local[name]) plan.install.push(name);
            else if (this.sameCountry(local[name], world[name])) plan.reuse.push(name);
            else plan.conflict.push(name);
        }
        return plan;
    }
};
