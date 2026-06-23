// Entry point
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚽ Football Agent Manager — booting…');

    Clubs.init();          // build club list from league data
    GameState.init();      // load save, or generate world + agency + competitions
    UI.init();             // render

    // dev helpers
    window.GameState = GameState;
    window.Clubs = Clubs;
    window.Agency = Agency;
    window.Scouts = Scouts;
    window.Sim = Sim;
    window.League = League;
    window.COMPETITIONS = COMPETITIONS;
    window.UI = UI;

    console.log(`Ready. ${GameState.players.length} players, ${Clubs.allClubs.length} clubs.`);
    console.log('Tips: Agency.clients() · GameState.inbox · League.sortedTable("ERE") · Sim.advanceWeek()');
});
