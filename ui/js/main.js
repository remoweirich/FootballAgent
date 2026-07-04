// ============================================================
//  Boot sequence — mirrors the original js/main.js, but hands
//  off to the Router instead of the old modal-based UI.
// ============================================================
const Main = {
    boot() {
        Clubs.init();
        if (!GameState.hasSave()) { Setup.show(); return; }
        GameState.init();
        this.afterLoad();
    },
    afterLoad() {
        Router.start();
    }
};

document.addEventListener('DOMContentLoaded', () => Main.boot());
