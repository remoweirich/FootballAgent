# Notes for AI coding agents

Read `ARCHITECTURE.md` first: it maps the code, the build, the tests and the iOS port.

Short version:
- Plain JavaScript in classic scripts. The engine is in `js/`, the interface in `ui/`. Capacitor 8 wraps it for Android and iOS.
- A new JS file goes into `scripts/build-mobile.js` **and** `ui/index.html`.
- Run `node tests/run.js` before you finish. All suites must pass.
- Player-facing text goes into all 7 language packs (engine pack formal, UI pack informal).
- Never add real club or competition names or logos. The game ships generic names on purpose.
