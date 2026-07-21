# Legacy desktop UI (severed)

This folder holds the **old desktop web UI**, moved out of the active tree so it can't be confused
with the shipping app or drift out of sync with the engine. It is **not** part of the Android build
(`scripts/build-mobile.js` only bundles `ui/js/*` + the engine) and is not maintained.

## What's here
- `index.html` — desktop shell (sidebar layout).
- `js/ui.js` — the whole desktop UI (~1,700 lines).
- `js/main.js` — desktop boot sequence.
- `js/debug.js` — desktop debug console.
- `styles/main.css` — desktop stylesheet.

The **engine** (`js/*.js` at the repo root: clubs, league, agency, simulation, …) is shared and stays
in place; `index.html` loads it via `../js/…`.

## Status / caveats
This shell **predates** several engine systems and does **not** load or understand them:
- **Attend the Final** (`js/attend.js`, live sim) — it will show finals' results unhidden (spoilers)
  and won't repair impossible penalty scorelines (`League.penFixPair`).
- **Client relationships / dialogue** (`js/dialogue.js`) — none of the bond, personality, facts,
  check-in, farewell, concierge, or scene systems appear.
- Some interactions it still exposes were changed on mobile (e.g. loan-listing is an indicator there).

If you ever want to revive it, treat it as a **starting point, not a working build**: it needs the
newer engine scripts added and the diverged features reconciled before it reflects the current game.

## Running it
Serve the repo root with any static server and open `legacy-desktop/index.html`, or open the file
directly — the relative paths (`../js/…`, `js/…`, `styles/…`) resolve either way.
