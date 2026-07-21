// A tiny seedable PRNG so the simulation's randomness is reproducible. Rng.next() is a drop-in for
// Math.random() (a float in [0, 1)); every engine file draws through it instead of Math.random. Seed
// it and a run replays identically — that's what lets the tests pin down exact outcomes. The current
// stream position rides along in the save (see GameState.save/load), so a reloaded game keeps rolling
// from where it left off instead of jumping to a fresh sequence. With no seed set it self-seeds from
// the clock, so a normal game looks exactly as random as it did on plain Math.random().
//
// mulberry32: one 32-bit word of state, fast, and plenty for a management game (this is not crypto).
var Rng = (function () {
    let state = ((Date.now() >>> 0) ^ 0x9E3779B9) >>> 0;   // self-seed; overwritten by seed()/setState()

    function next() {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    return {
        next,
        // Reset the stream to a known point. Falsy/0 seeds map to 1 so the stream is never stuck.
        seed(n) { state = (n >>> 0) || 1; return this; },
        getState() { return state >>> 0; },
        setState(s) { state = (s >>> 0) || 1; return this; },
        // Run fn against a temporary stream derived from `n`, then restore the current stream. Lets
        // background-squad regeneration rebuild the same NPCs every load without disturbing (or
        // consuming from) the simulation's own sequence.
        withSeed(n, fn) { const saved = state; this.seed(n); try { return fn(); } finally { state = saved >>> 0; } }
    };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Rng;
