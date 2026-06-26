// Entry point
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚽ Football Agent Manager — booting…');

    Clubs.init();          // build club list from league data

    // dev helpers (available regardless of setup state)
    window.GameState = GameState;
    window.Clubs = Clubs;
    window.Agency = Agency;
    window.Scouts = Scouts;
    window.Sim = Sim;
    window.League = League;
    window.COMPETITIONS = COMPETITIONS;
    window.UI = UI;

    if (!GameState.hasSave()) {
        UI.showSetup();    // first run: choose home country + agency name, then generate + render
    } else {
        GameState.init();  // load existing save
        UI.init();         // render
    }

    console.log(`Ready.`);
    console.log('Tips: Agency.clients() · GameState.inbox · League.sortedTable("ERE") · Sim.advanceWeek()');
});
