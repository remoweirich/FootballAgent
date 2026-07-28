# Football Agent — Roadmap to 1.0 (Play Store)

Living plan. Ordered by dependency, not wishlist. Each item lists **why now**, the
**key files**, and a ready-to-paste **Claude Code prompt**. Do phases top-to-bottom;
within a phase, items are mostly independent unless noted.

Guiding principle: **build the cross-cutting plumbing (theme / i18n / audio) before the
content features (achievements / customize / artwork)**, so new UI is born
themed, translatable, and audible instead of being retrofitted three times.

---

## Phase 0 — Land the current work (this week, blocking)

Everything below assumes a clean tree. The seven uncommitted batches
(review cleanup → prompt_end_juli backlog) are still gated behind your playtest.

- [ ] **0.1 Playtest the current build**, then commit the batches in logical groups
      (cleanup/RNG · playtest-feedback · features · multi-save · Best XI · scout-licence ·
      prompt_end_juli). Keep the in-progress dialogue/live-sim-xlsx work as its own thread.
- [ ] **0.2 Tag a baseline** (`v0.9.0-pre-store`) so the store work has a rollback point.
- [ ] **0.3 Device-verify E2** (the `touch-action: pan-y` swipe fix) on a real phone.

> Prompt (0.1): "Playtest is done and passed. Commit the uncommitted work in logical
> grouped commits (do NOT bundle the in-progress dialogue-system / live-sim-xlsx files).
> Propose the commit grouping and messages first, then commit once I approve. After
> committing, tag v0.9.0-pre-store."

---

## Phase 1 — Cross-cutting infrastructure (foundations)

These three are cheap to build once and expensive to retrofit. Ship the *engine* for
each even if the *content* (translations, extra themes, audio files) lands later. The
Settings screen already has dead placeholder rows for all of them — wire them up.

### 1.1 Theming / Light mode
**Why now:** `app.css` is already 100% CSS-variable-driven (`--bg`, `--surface`,
`--text-bright`, `--accent`, …). Light mode is a token override + a toggle, not a rewrite.
Do it before adding more screens so every new screen inherits it free.
**Key files:** `ui/app.css` (`:root` token block), `ui/js/screen-settings.js` (the
`Light mode` row at ~L43), `ui/js/main.js` or boot (apply `data-theme` early),
`js/game-state.js` (persist the choice).

> Prompt: "Implement light mode. In ui/app.css, move all color tokens into the :root
> block if any are loose, then add a `:root[data-theme=\"light\"]` override with a
> hand-tuned light palette (keep contrast ratios ≥ 4.5:1 for text). Add a Settings row
> that toggles light/dark/system, persist it (GameState + localStorage so it applies
> pre-boot to avoid a flash), and stamp `data-theme` on the root element as early as
> possible in boot. Respect `prefers-color-scheme` when set to 'system'. Replace the
> 'Coming soon' on the Light mode row with the live control."

### 1.2 Localization (i18n) engine + string extraction
**Why now:** every string you add later (achievements, customize, store) should be born
translatable. Retrofitting after those ship means touching them twice. Ship the engine +
extract UI strings + a German pack first (your primary second language); wire the
Settings `Language` row.
**Key files:** new `js/i18n.js` (`I18n.t(key, vars)`, locale dicts), new
`locales/en.json` + `locales/de.json`, `ui/js/screen-*.js` (wrap literals),
`scripts/build-mobile.js` (bundle locales), `ui/js/screen-settings.js` (`Language` row).
**Note:** game *narrative* text lives in the xlsx workbooks (dialogue, injuries) — plan a
locale **column** there as a second sub-pass; don't try to do UI + narrative in one shot.

> Prompt (1.2a — engine + UI strings): "Stand up an i18n layer. Create js/i18n.js with
> I18n.t(key, vars) doing nested-key lookup + {var} interpolation + English fallback, and
> a setLocale that re-renders the current screen. Create locales/en.json. Sweep the
> ui/js/screen-*.js files and replace user-facing string literals with I18n.t('...')
> keys, building en.json as you go (leave dynamic game data alone). Load i18n.js first in
> the bundle and both index.html. Wire the Settings Language row to switch locale and
> persist it. Keep it to the UI shell for now — do NOT touch the xlsx narrative text."
>
> Prompt (1.2b — German pack, later): "Create locales/de.json as a full German
> translation of en.json. Flag any keys where German length risks breaking layouts."

### 1.3 Audio engine (music + SFX plumbing)
**Why now:** one AudioManager serves both music and SFX; build it before achievements
(unlock sting) and before the store polish pass. Mobile WebViews block autoplay until a
user gesture — bake that in from the start.
**Key files:** new `js/audio.js` (preload, `play(name)`, music loop w/ crossfade,
master/music/sfx volume, mute, unlock-on-first-tap), `ui/js/screen-settings.js` (`Music`
+ SFX rows → real sliders/toggles), `ui/assets/audio/` (files), `game-state.js` (persist
volumes), `scripts/build-mobile.js` (copy assets).
**Content dependency:** needs royalty-free assets (see 4.3). Ship the engine + toggles
now with 3–4 placeholder SFX; swap in final audio later.

> Prompt: "Create js/audio.js — an AudioManager using HTMLAudio (with a WebAudio fallback
> only if needed). Support: preloading a named SFX map, play(name), a looping music track
> with fade in/out and crossfade, independent master/music/sfx volume + mute, and an
> unlock() that resolves the mobile autoplay-gesture requirement on first user tap.
> Persist volumes/mute in GameState. Replace the Settings Music/SFX placeholder rows with
> real sliders + mute toggles. Fire representative SFX on button tap, goal, whistle,
> transfer-complete, and inbox notification. Use placeholder tones I can swap later; add
> ui/assets/audio/ to the build copy step."

---

## Phase 2 — Feature systems (built on Phase 1)

### 2.1 Achievements
**Why here:** wants i18n (names/descriptions) and audio (unlock sting) from Phase 1. The
Settings row + `ti-trophy` icon already exist.
**Key files:** new `js/achievements.js` (definitions table + evaluator), hook points in
`js/agency.js` / `js/simulation.js` / `js/league.js` (trophies, transfers, milestones),
`game-state.js` (persist unlocked set), new `ui/js/screen-achievements.js` + route, a
toast component, `ui/js/screen-settings.js` (row → screen).
**Design first:** draft ~25–40 achievements across categories (first steps, trophies,
money, squad-building, longevity, hidden/fun) before coding.

> Prompt (2.1a — design): "Draft an achievements spec: 30–40 achievements grouped by
> category (first-steps, silverware, wealth, squad-building, loyalty, longevity, hidden).
> For each: id, title, description, unlock condition expressed against existing engine
> state/events, and a tier (bronze/silver/gold). Save it to docs/achievements-design.md.
> Ask me about any condition you can't map to current data."
>
> Prompt (2.1b — build): "Implement achievements per docs/achievements-design.md. Create
> js/achievements.js with the definitions and an evaluate() that checks after relevant
> engine events; persist unlocked ids (with timestamp) in the save. Add a toast on unlock
> (with an audio sting via AudioManager) and an Achievements screen reachable from
> Settings showing locked/unlocked with progress where measurable. All strings via i18n.
> Add tests for a few representative unlock conditions."

### 2.2 Customize
**Why here:** ties into artwork (2.3) and theming (1.1); Settings copy already promises
"name packs via Customize". **Scope needs your call** — I'll propose a sensible default
below and ask before building.
Proposed scope: (a) **agency identity** — agency name, primary colour, an emblem/crest
picked from a set; (b) **name packs** — swap the placeholder club/league/competition
names for user-supplied sets; (c) optional **office backdrop** picker (feeds 2.3 artwork).
**Key files:** new `ui/js/screen-customize.js` + route, `game-state.js` (persist profile),
theme hook for the chosen accent colour, name-pack loader in the relevant `js/*` data.

> Prompt (2.2 — after scope confirmed): "Implement the Customize screen with the agreed
> scope: agency name + primary-accent colour (feeding the theme) + emblem picker, and a
> name-pack import that overrides club/league/competition display names. Persist a profile
> in the save, apply it across the UI, and reach it from the Start and Settings screens.
> All labels via i18n."

### 2.3 Artwork / iconography
**Why here:** feeds Customize (emblems, office backdrops) and the store assets (icon,
feature graphic). Currently the app uses an icon font + a few inline SVGs.
**Key files:** `ui/assets/` (new art), `ui/app.css` (icon slots), office/agency screens.
**How:** decide direction — (a) a cohesive inline-SVG set (crisp, tiny, themeable via
`currentColor`, no CSP/asset headaches — recommended), or (b) commissioned/generated
raster art embedded as assets. Given the strict self-contained build, **prefer SVG**.

> Prompt (2.3 — after direction chosen): "Design a cohesive inline-SVG icon/art set for
> the office/agency symbols (list the slots that need art). Keep them single-path where
> possible, sized on a 24px grid, and coloured via currentColor so they theme with light/
> dark. Add them to ui/assets/ and swap the placeholder glyphs. Provide 2–3 emblem options
> for Customize."

---

## Phase 3 — Legal & compliance (do before store submission; text is cheap, gating)

### 3.1 Real privacy policy + copyright/attribution
**Why:** the Play Store **requires a privacy-policy URL** and a Data Safety declaration
even if the app stores everything locally. Settings already has working Copyright/Privacy
overlays with placeholder text — replace with real, accurate text and mirror it at a
public URL (GitHub Pages is fine and free).
**Key files:** `ui/js/screen-settings.js` (`legal()` bodies ~L96–99), a new
`docs/privacy.html` for GitHub Pages, an attribution list for any third-party fonts/audio/
data.

> Prompt: "Write an accurate privacy policy for a fully-offline single-player game (local
> saves only, no accounts, no analytics, no network calls — verify that's still true and
> flag anything that isn't). Put the canonical version in docs/privacy.html (GitHub-Pages
> ready) and mirror the same text in the Settings privacy overlay. Update the copyright
> overlay with a third-party attribution section covering fonts, any audio, and the data
> sources. Keep both translatable via i18n."

---

## Phase 4 — Play Store release

Do these near-last; several depend on finished art (icon, feature graphic) and legal (URL).

### 4.1 Release build config & signing
**Key files:** `android/app/build.gradle` (applicationId, versionCode/versionName,
`minSdk`/`targetSdk` to Google's current requirement), a **release keystore** (store it
safely — losing it means you can never update the app), `android/app/proguard` if enabling
shrinking, `AndroidManifest.xml` (permissions — should be near-zero for an offline game).

> Prompt: "Prepare the Android release build. Set a real applicationId, versionCode 1 /
> versionName 1.0.0, bump targetSdk to Google Play's current minimum, and audit the
> manifest so we request no unnecessary permissions. Document (don't commit secrets) the
> exact steps to generate a release keystore and build a signed AAB with
> `./android/gradlew.bat bundleRelease`, including where the keystore/passwords go and how
> the app.gradle signingConfig references them via a gitignored keystore.properties."

### 4.2 Store listing assets
App icon (adaptive: fore/background), 512×512 hi-res icon, feature graphic 1024×500,
phone screenshots (min 2), short + full description, title. Reuse Phase-2 artwork.

> Prompt: "Generate the store-listing checklist and draft copy: app title, 80-char short
> description, and full description highlighting the agent-simulation loop. List every
> required graphic asset with exact dimensions and which existing artwork feeds each."

### 4.3 Audio content (final)
Source royalty-free music (menu loop + optional match ambience) and the SFX set; drop into
`ui/assets/audio/`, wire names into AudioManager (engine already built in 1.3), add
attributions to the Copyright overlay.

### 4.4 Data Safety + content rating + testing track
Fill Google's Data Safety form (should be "no data collected/shared" if 3.1 confirms it),
complete the IARC content-rating questionnaire. **Note:** new personal Play Console
accounts must run a **closed test with ≥12 testers for 14 days** before production — plan
that runway into the timeline.

> Prompt (pre-submission audit): "Do a pre-submission audit: confirm no network calls /
> data collection (grep the codebase), list the Data Safety answers that follow from that,
> and produce a go-live checklist covering content rating, the 12-tester closed-testing
> requirement, privacy URL, signed AAB, and listing assets."

---

## Sequencing at a glance

```
Phase 0  ██ commit + tag baseline            (blocking, now)
Phase 1  ████ theme · i18n · audio-engine    (foundations — do before new UI)
Phase 2  ████ achievements · customize · art  (features on the foundations)
Phase 3  █ privacy/legal text + URL           (cheap, gates the store)
Phase 4  ███ signing · listing · audio · launch
```

**Parallelizable:** Phase-1 items are independent of each other. Legal text (3.1) can be
written any time. Artwork (2.3) should start early because it feeds Customize *and* the
store icon/feature-graphic.

**Critical path to store:** 0 → 1.1 (theme baseline) → 2.3 (icon art) → 3.1 (privacy URL)
→ 4.1 (signing) → 4.4 (testing track). Everything else improves the product but doesn't
block submission.
