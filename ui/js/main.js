// ============================================================
//  Boot sequence — mirrors the original js/main.js, but hands
//  off to the Router instead of the old modal-based UI.
// ============================================================
const Main = {
    async boot() {
        if (typeof I18n !== 'undefined') I18n.init();
        if (typeof Sound !== 'undefined') Sound.init();
        Clubs.init();
        if (typeof Ads !== 'undefined') Ads.init();   // fire-and-forget: sets up the ad SDK + EU consent when present
        if (typeof initRevenueCat === 'function') initRevenueCat();   // no-op until an SDK key + plugin are present (Step 5)
        await Storage.migrateLegacy();   // one-time: pull in a pre-IndexedDB localStorage save, if any
        // Always land on the start menu: Continue/Load resume a save, New starts one (see screen-start.js).
        await StartScreen.show();
    },
    afterLoad() {
        if (typeof Monetization !== 'undefined') Monetization.applyToGame();   // reflect owned entitlements into the loaded game
        // MUSIC DISABLED for now (SFX stays). Uncomment to bring the background playlist back.
        // if (typeof Sound !== 'undefined') Sound.startPlaylist();   // music plays continuously across menu + in-game
        Router.start();
    }
};

document.addEventListener('DOMContentLoaded', () => Main.boot());
