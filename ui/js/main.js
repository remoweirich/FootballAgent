// ============================================================
//  Boot sequence — mirrors the original js/main.js, but hands
//  off to the Router instead of the old modal-based UI.
// ============================================================
const Main = {
    async boot() {
        Clubs.init();
        await Storage.migrateLegacy();   // one-time: pull in a pre-IndexedDB localStorage save, if any
        if (!(await GameState.hasSave())) { Setup.show(); return; }
        await GameState.init();
        this.afterLoad();
    },
    afterLoad() {
        Router.start();
    }
};

document.addEventListener('DOMContentLoaded', () => Main.boot());
