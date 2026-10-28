# Football Agency Simulator: project guide

This guide is for developers and AI coding agents joining the project, in particular for the iOS
(App Store) port. It explains how the code is organised, how it is built and tested, and what the iOS
build needs. `README.md` is a historical changelog; this file is the map.

**In one paragraph:** a single-player football-agent management game. All game logic is plain
JavaScript (no framework, no bundler, no server). It runs in a WebView wrapped by **Capacitor 8**,
which provides the Android app today and the iOS app next. Saves live on the device. Monetisation
is AdMob (ads) and RevenueCat (in-app purchases).

| | |
|---|---|
| App ID (Android + iOS) | `ch.jens.footballagent` |
| Home-screen name | `Football Agent Manager` (`capacitor.config.json`, Android `strings.xml`). The in-game title is "Football Agency Simulator". Confirm with the owner which name the App Store listing uses. |
| Current version | `android/app/build.gradle` (`versionName` / `versionCode`) and `settings.version` in `ui/js/i18n-en.js`. Bump both together. |
| Languages | English, German, Spanish, French, Italian, Dutch, Portuguese |

---

## 1. Folder map

```
js/                 game engine (logic, data, simulation). No DOM access except a few guarded spots.
ui/                 the app's interface
  index.html        loads every script in order (the browser / dev entry point)
  js/               screens, router, helpers, i18n UI strings, monetisation, ads, review
  app.css           app styles; files/design-tokens.css + files/components.css = design system
  assets/           images (logo, crests, upgrade art, plaques), audio (3 sound effects)
  vendor/           self-hosted Inter font, Tabler icons (trimmed), flag-icons (trimmed)
scripts/            build script + one-off data importers (xlsx -> js)
tests/              ~115 Node test suites (no browser needed), run by tests/run.js
android/            Capacitor Android project (generated once, then customised)
resources/          source art: app logo (FAS-Logo.png), upgrade artwork, plaques
docs/               design specs per feature (europe, internationals, negotiation, dialogue, ...)
legacy-desktop/     the old desktop UI. Not shipped, not maintained. Ignore it.
*.xlsx              game-data workbooks (clubs by region, dialogue lines, injuries, live-sim
                    events, national teams, UEFA access list). Scripts turn them into js/ files.
dist/mobile/        BUILD OUTPUT (gitignored): what Capacitor packages. Never edit by hand.
```

There is **no `ios/` folder yet.** Create it on a Mac with `npx cap add ios` (see section 7).

## 2. How a build is made

```
ui/ + js/  --(npm run build:mobile)-->  dist/mobile/  --(npx cap sync)-->  android/ (or ios/)  -->  Gradle / Xcode
```

- `scripts/build-mobile.js` copies exactly the files the app loads into `dist/mobile/`: engine files
  into `engine/`, UI scripts into `js/`, the three CSS files, assets and vendor folders. It rewrites
  `index.html` to point at them.
  - **Adding a JS file:** list it in the right array in that script (`ENGINE_FILES` or
    `UI_JS_FILES`) **and** add a `<script>` tag in `ui/index.html`. Both lists must stay in sync and
    in the same order.
- Environment switches for test builds (never for store builds):
  - `DEV_UNLOCK=1` unlocks every purchase and forces Google test ads.
  - `ADS_TEST=1` forces test ads only.
  - After a test build, run a plain `npm run build:mobile && npx cap sync` before any store build,
    and check that `DEV_UNLOCK_ALL: false` (`ui/js/monetization.js`) and `testing: false`
    (`ui/js/ads.js`) are in `dist/mobile`.
- Android release signing reads `android/keystore.properties`, which is gitignored. iOS signing is
  done in Xcode with the owner's Apple Developer account.

**Running in a browser (fastest dev loop):** from the project root run `python -m http.server 8000`
and open `http://localhost:8000/ui/`. Edits show on refresh. Ads, purchases, review and native share
don't exist in the browser and fail silently.

## 3. Engine architecture (`js/`)

Load order matters: files are classic scripts sharing globals. The order is `ENGINE_FILES` in
`scripts/build-mobile.js`.

| Area | Main files | What it does |
|---|---|---|
| State and saving | `game-state.js`, `storage.js` | `GameState` holds the whole game. `save()` -> `Storage` (IndexedDB, debounced; `Storage.flush()` forces a write). `_snapshot()` / `_applySaved()` serialise. Saves have a `schemaVersion` with ordered migrations (`_runMigrations`). |
| World | `clubs.js`, `players.js`, `names-data.js`, `world-ext.js` | ~850 clubs in 9 countries from `LEAGUES_DATA`, player generation, created (custom) countries. |
| Season and matches | `league.js`, `simulation.js`, `live-sim*.js`, `attend.js` | Fixtures, tables, cups, play-offs, promotion/relegation, the weekly tick `Sim.advanceWeek()`, the watchable live match. |
| Europe and internationals | `europe*.js`, `nations.js`, `intl-*.js`, `internationals.js` | Club competitions and national-team football with call-ups. |
| The agency | `agency.js`, `scouting.js`, `scouts.js`, `upgrades.js`, `achievements.js` | Clients, contracts, negotiations, transfers, loans, scouting, reputation, prestige, upgrades. |
| Story | `dialogue*.js` | Client conversations, career moments (data files generated from `dialogue_lines.xlsx`). |
| Text | `i18n.js`, `i18n-<lang>.js` | Engine strings (formal register: Sie/vous/Lei/u). |

The game advances one week per tap. `Sim.advanceWeek()` returns a result object that the Home screen
turns into the weekly summary, scenes and pop-ups.

## 4. UI architecture (`ui/js/`)

- `router.js`: hash routes (`#home`, `#client/<id>`, ...), `Router.register(name, {render})`,
  `Router.modal()`, `Router.sheet()`. The Android hardware back button is wired here through
  `@capacitor/app` (iOS has none; nothing to do).
- `screen-*.js`: one file per screen. They render HTML strings into `#app`.
- `shim.js`: the `UI` helper object (money formatting, flags, crests, position tags, external links
  `APP_LINKS`).
- `prefs.js`: device-level settings in localStorage (language, theme, purchases, review and trial
  records). Device-level means shared across saves.
- `i18n-<lang>.js` (UI): UI strings in the informal register (du/tu/tú/je). Every key must exist in
  all 7 packs.
- Design system: tokens in `ui/files/design-tokens.css` (dark default, light via
  `html[data-theme="light"]`), components in `ui/files/components.css`. Use the tokens; don't hard-code
  colours.

## 5. Native features and their plugins

| Feature | Code | Plugin | iOS work needed |
|---|---|---|---|
| Ads (interstitial, rewarded "See potential") | `ui/js/ads.js` | `@capacitor-community/admob` | iOS AdMob app + ad units. **`AD_CONFIG` currently holds one ID per ad type for both platforms; make it platform-aware** (like `revenuecat.js` does). Info.plist: `GADApplicationIdentifier`, `SKAdNetworkItems`, `NSUserTrackingUsageDescription` (ATT). The consent flow (UMP) is already implemented. |
| In-app purchases | `ui/js/monetization.js` (store-agnostic), `ui/js/revenuecat.js` (adapter) | `@revenuecat/purchases-capacitor` | RevenueCat iOS app; fill `apiKeyIos` in `revenuecat.js`; create the same product IDs in App Store Connect (below). |
| In-app review | `ui/js/review.js` | `@capacitor-community/in-app-review` | None. Uses Apple's review sheet on iOS. |
| Save export / share | `screen-settings.js` | `@capacitor/share`, `@capacitor/filesystem` | Test on a device. |
| Status bar, splash | `capacitor.config.json` | `@capacitor/status-bar`, `@capacitor/splash-screen` | Check safe-area insets on notched iPhones. |

**Store product IDs** (`Monetization.PRODUCTS[*].storeId`), to create identically in App Store Connect:

| Product | Store ID | Kind |
|---|---|---|
| Remove ads | `remove_ads` | non-consumable |
| Enhanced Insights | `enhanced_insights` | non-consumable |
| Database editor | `database_editor` | non-consumable |
| Agent Pro bundle | `agent_pro` | non-consumable |
| Sandbox editor | `sandbox_editor` | non-consumable |
| Supporter packs | `sup_1`, `sup_2`, `sup_3` | consumable |

Feature code only ever asks `Monetization.owns('<entitlement>')`; it never talks to a store directly.
`Monetization.TRIAL` is a time-limited local free trial (the November 2026 launch bonus).

## 6. Content and legal rules (please keep)

- **The game ships generic, copyright-safe names.** Clubs have fictional display names ("Manchester
  Red"); competitions have generic names ("English First Division"). Internal club **IDs** are real
  names: they are keys, never shown, and must not be renamed (other files reference them).
- **Real names and logos are never shipped, hosted or linked by the app.** Players can import their
  own packs (Settings > Import names / Import logos; the Customize screen). A real-names file is kept
  **only on the owner's machine** and is not in this repository. Don't add one, and don't put real
  names or logos in the iOS app, its screenshots or the store listing.
- `Settings > Remove imported names & logos` returns a save to the generic names (useful for store
  screenshots).
- Privacy texts exist in the game (`settings.privacyBody`) and as `docs/privacy-policy.html` (hosted).
  If the iOS build adds a data-processing feature (for example App Tracking Transparency), update both.

## 7. iOS port checklist

On a Mac with Xcode and the owner's Apple Developer account:

1. `npm install`, then `npm run build:mobile`, then `npx cap add ios`, then `npx cap sync ios`.
2. App icons and splash: `npx @capacitor/assets generate --ios` (installed as a dev dependency), from
   `resources/` (source logo: `resources/FAS-Logo.png`).
3. Info.plist: AdMob keys and ATT text (section 5). Set the display name to the agreed app name.
4. Ads: create the iOS AdMob app and units, then make `AD_CONFIG` in `ui/js/ads.js` platform-aware
   (`Capacitor.getPlatform() === 'ios'`).
5. Purchases: App Store Connect products with the IDs above, the Paid Apps agreement, the RevenueCat iOS
   app, and `apiKeyIos` in `ui/js/revenuecat.js`.
6. Test on a device: saves persist after a restart, purchases (sandbox), ads (test mode),
   import/export through the Files app, safe areas, light/dark theme, all 7 languages.
7. Archive, TestFlight, then App Store review.

**Things that differ from Android:**
- There is no back button; the in-app back arrows already cover navigation.
- WebView storage can be cleared by iOS under storage pressure. Saves use IndexedDB, and the
  Settings > Save export exists as a backup.
- Apple limits the review sheet to 3 prompts a year by itself.

## 8. Tests

```
node tests/run.js          # all suites (about 2.5 minutes); must be green before any build
node tests/test_xyz.js     # a single suite
```

Tests load the real engine files into a Node `vm` sandbox (the file list comes from
`scripts/build-mobile.js`) and call the game directly. No browser is needed. UI screens are tested by
rendering their HTML strings. When behaviour changes on purpose, update the test that pins it in
the same change.

## 9. Conventions

- Plain ES2017+ in classic scripts. No modules, no bundler, no framework.
- Match the surrounding code's style and comment density. Comments explain *why*.
- New player-facing text goes into all 7 language packs: engine strings in `js/i18n-*.js` (formal
  register), UI strings in `ui/js/i18n-*.js` (informal register).
- Game data that designers edit lives in the `.xlsx` workbooks; regenerate the matching `js/` file
  with the script in `scripts/` rather than hand-editing generated data.
- Don't commit build output (`dist/`, APK/AAB), `android/app/google-services.json`, signing files,
  `real-club-names.json`, or Office lock files (`~$*.xlsx`).

## 10. Where to read more

- `BUILD.md`: building the Android APK on Windows.
- `MONETIZATION_SETUP.md`: store, RevenueCat and AdMob setup steps.
- `DESIGN_DOC.md` and `docs/*.md`: feature designs (negotiation, reputation, Europe, internationals,
  dialogue, scouting, live match).
