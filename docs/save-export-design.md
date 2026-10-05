# Save export / import — design plan

Let a player move a career off one device and onto another: a new phone, a backup before a risky
update, a save attached to a bug report, or the `-PdevId` test build sitting beside the real one.

Decisions settled 2026-10-05 are marked **Decided**.

---

## 0. Most of this already exists

The work is smaller than it looks, because every hard part has a proven implementation in the repo.

| Piece | Where | Note |
|---|---|---|
| The one serializer | [js/game-state.js:178](../js/game-state.js#L178) `_snapshot()` | Used by both the autosave and named slots. Export must reuse it, not invent a second shape. |
| The one deserializer | [js/game-state.js](../js/game-state.js) `_applySaved()` + `_runMigrations()` | Already upgrades an old save. Import is just "feed it an object from a file instead of IndexedDB". |
| Writing a file on Android | [ui/js/screen-customize.js:1283](../ui/js/screen-customize.js#L1283) `_download()` | Already solves the real trap — Android's WebView **ignores `<a download>` and `blob:` URLs**. Writes to CACHE via Filesystem, then hands the uri to the system share sheet. Browser keeps the blob path. |
| Reading a file | [ui/js/screen-customize.js:419](../ui/js/screen-customize.js#L419) etc. | `<input type="file">` + `FileReader` already works in this WebView (logo import, names CSV, country JSON) — Capacitor's bridge supplies `onShowFileChooser`, so no Activity wiring is needed. |
| Named save slots | [js/storage.js:170](../js/storage.js#L170) `listSlots/putSlot/deleteSlot`, `MAX_SLOTS: 5` | Import lands here rather than inventing new storage. |

---

## 1. Measured: how big is a save?

Not guessed — simulated, at three career lengths, on a real `_snapshot()`:

| Seasons | Raw JSON | gzipped | Heaviest keys |
|---|---|---|---|
| 1 | 839 KB | **138 KB** | league 561, clubState 98, lastSeasonReport 87, clubHistory 66 |
| 5 | 1,274 KB | **183 KB** | league 561, clubHistory 281, lastSeasonReport 272, clubState 98 |
| 15 | 1,823 KB | **216 KB** | clubHistory 819, league 561, lastSeasonReport 271, clubState 98 |

base64 of the gzip at 15 seasons: **288 KB**.

- **Raw JSON is too fat to be the wire format.** 1.8 MB is awkward to email or paste into a bug
  report; 288 KB is not.
- **`clubHistory` grows without bound** — 66 → 281 → 819 KB, the only key that does. That is the
  "save grows unbounded" item already on the open list. Export makes it visible but does not cause
  it; fix it at source, separately, and never by trimming history on the way out.
- **`league` is a flat 561 KB from season one.** Worth a look sometime; not this task.

---

## 2. Logos are never exported — **Decided**

`clubLogos` in the save holds 128px PNG data URIs. They are already compressed, so gzip barely
touches them: one logo'd country (~50–100 clubs) adds 0.5–1 MB to a 288 KB export, and all 856
clubs would add several MB. They are stripped from the payload.

This is cheaper than it sounds, because **there are two kinds of logo and only one is lost**:

| Added via | Stored in | Survives export? |
|---|---|---|
| Customize → club logo / logo zip | the **database** (`ov.logo`, applied in [js/clubs.js:1576](../js/clubs.js#L1576)) | **Yes** — §3 requires the database to be present, and it brings its logos with it |
| Settings → Import logos (mid-save) | `GameState.clubLogos` in the save | No — these fall back to generated crests |

So the common case (a logo pack applied through a database) survives intact, and only ad-hoc
mid-save additions are dropped. The export confirmation says so in one line rather than letting
the player discover it.

`clubNames` and `compNames` stay in the export: they are small text, and club identity reading
wrong is far worse than a missing crest.

---

## 3. The gate is created countries, not the database — **Decided**

Only one thing a database does is structural. `applyDatabase`
([js/clubs.js:1561](../js/clubs.js#L1561)) performs exactly four operations:

| Operation | What it changes | Breaks a save if missing? |
|---|---|---|
| `db.countries` → `WorldExt.registerCountry()` | injects whole leagues, clubs, regions, name pools | **Yes** |
| `db.competitions` | competition name / short | No — cosmetic |
| `db.overrides` → name, colors, logo | club identity | No — cosmetic |
| `db.overrides` → reputation, division | club standing | No — see below |

Reputation and division look structural but are not: the save stores its own per-club `division`
and `reputation` in `clubState`, and `_restoreClubState` runs **after** `applyDatabase`, so the
save's values win either way. A missing database cannot move a club or change its standing.

`registerCountry` is the whole problem. It injects into `COMPETITIONS`, `COUNTRY_DIVS`,
`ALL_LEAGUE_DIVS`, `LEAGUES_DATA`, `Clubs.*`, `REGIONS_BY_COUNTRY`, `Scouts.REGION_REPORT_COST`
and `NAMES_DATABASE`. Load an Austria save without it and every Austrian club id resolves to
`undefined`, clients point at clubs that do not exist, `league` holds divisions absent from
`COMPETITIONS`, and `homeCountry` has no regions, so scouting has nowhere to look. That is not a
degraded world, it is a broken one.

**So the imprint records the created countries the save depends on, not the database identity.**
`WorldExt.created` is already a live registry of exactly this, so the snapshot gains:

```js
requiresCountries: Object.keys(WorldExt.created || {}),   // e.g. ["Austria"]
databaseName: <the db's display name, for the message only>
```

The load gate is then a content check, not an identity check:

> **This save needs Austria.** It was started on the database "My World", which adds that country.
> Import it in Customize, then load the save again.

Consequences, all of them wanted:

- A database that only renames clubs, recolours them or adds logos produces an **empty**
  `requiresCountries`, so those saves load anywhere and simply look plain. Cosmetics are ignored,
  exactly as intended.
- A save that needs Austria loads on any device that has Austria — whichever database supplied it,
  and whatever local id that database was given. A player who rebuilt the country under a new
  database is not locked out of their own career by an id mismatch.
- The database *name* appears only in the message, as a hint about where to find the country.

This applies to **every** load path (autosave boot, named slot, imported file), not just import.
Today a missing database is a silent no-op — `if (db) Clubs.applyDatabase(db)` with a `console.warn`
— so this fixes a real bug that already exists, independently of export.

### Still a prerequisite: databases have to be able to travel

**There is no whole-database export today.** Customize exports a names-template CSV and a
per-country JSON, nothing more ([ui/js/screen-customize.js](../ui/js/screen-customize.js),
`exporttpl` / `exportcountry`). Of those, the per-country JSON is close to what is needed — it is
the created-country payload — but there is no way to move a database as a unit.

So a country export/import ships with this, or the refusal tells the player to fetch something
that cannot travel. Because the gate matches on country rather than database id, the existing
`exportcountry` / `importcountry` pair may be sufficient on its own: the player exports Austria
from the old device, imports it on the new one, and the save loads. **Confirm that path works
end to end before building anything heavier** — it may turn a prerequisite into nothing at all.

Keeping databases out of save files is also the better answer for the real-names posture: content
stays something the player sources, rather than being redistributed inside every shared save.

---

## 4. The file

One file is one career. Extension `.fam`, named `<agency>-<season>-<date>.fam`.

```json
{
  "fam": 1,
  "app": "1.0.27",
  "schema": 5,
  "exported": 1759600000000,
  "encoding": "gzip+base64",
  "requiresCountries": ["Austria"],
  "databaseName": "My World",
  "game": {
    "agency": "Ferrari & Partners", "manager": "A. Tester",
    "country": "Switzerland", "season": "29/30", "week": 12, "clients": 14
  },
  "checksum": "…",
  "payload": "H4sIAAAA…"
}
```

The header stays plain so a human — or you, reading a bug report — can see what a file is without
running it. `requiresCountries` is the gate (§3) and is usually `[]`; `databaseName` is a hint for the
message only. No overlay is embedded. `payload` is the `_snapshot()` JSON minus `clubLogos`.

**Compression**: `CompressionStream('gzip')`, which Android WebView has had since Chrome 80. The
WebView updates through Play independently of the OS, so minSdk 24 is not the constraint — but a
frozen old WebView is possible, so if `CompressionStream` is missing, write `"encoding": "plain"`
with raw JSON. Import handles both. No library, no bundle growth.

---

## 5. Export

Lives in **Settings → Save game**, beside the existing named-save list.

- **Export current game** — snapshots live state.
- **Export** on any named slot row — exports that slot's stored state.

Both build the envelope and hand it to a shared version of `_download()`. That helper currently
lives on `CustomizeScreen` and should move to `UI` so Settings can use it — a lift-and-shift of
working code, not a rewrite.

The confirmation names the file, its size, and the one thing that was left out (mid-save logos).

---

## 6. Import — **Decided: in Load game**

A button on the **Load game** screen, alongside the save list: that is where a player who has just
reinstalled looks, and it is the moment of need.

**Import never touches the running career.** It always lands as a *new named slot*, which the
player then loads deliberately. Overwriting the autosave on import is the one mistake that turns a
convenience feature into lost progress, and there is no undo.

Flow: picker → read → validate → preview (agency, season, week, clients, exported date, and the
database it needs) → confirm → `Storage.putSlot()` → offer to load it now.

If all 5 slots are full, the player frees one first — the rule `createNamedSave` already enforces.

### Validation, in order

1. Parses as JSON, and `fam` is a version this build knows.
2. `schema` is **not newer** than `SCHEMA_VERSION`. A save from a future build carries invariants
   this one has never heard of; refuse with "this save is from a newer version of the game".
   Older is fine — that is what the migration pipeline is for.
3. Payload decodes and parses.
4. It looks like a save: `week`, `seasonStartYear`, `homeCountry`, `agency`, `players` present and
   the right types. An unknown country is a refusal, not a crash.
5. Size ceiling (25 MB) checked *before* decompressing, so a malformed file cannot blow up memory.
6. The §3 country check — reported at **import preview**, not only at load, so the player learns
   which country they need before the file is committed to a slot.

Every refusal says which check failed. "Invalid save file" with no reason generates support mail.

---

## 7. Paid content — **Decided: nothing to do**

Worth recording, because the original concern was based on a misreading.

**Entitlements are already outside the save.** [ui/js/monetization.js](../ui/js/monetization.js)
states it in its own header:

> "Entitlements live in Prefs (localStorage), NOT in the game snapshot: a purchase belongs to the
> device/account and must apply across every save and survive starting a new game."

`_snapshot()` contains no entitlement, product or purchase field. An exported save therefore
**cannot** carry `editor`, `sandbox` or `removeAds` onto another device — the thing to prevent is
already structurally impossible, and no stripping step is needed.

The real (and much smaller) issue is different: once a save is a file on disk, a determined player
can edit it — money, ability, reputation — which overlaps what the €9.99 sandbox tier sells as a
convenience. That cannot be prevented in a client-side JS app; an HMAC would ship its own key in a
readable bundle. Two things make it a non-issue in practice:

- gzip + base64 means casual editing needs decompress → edit → recompress. A real speed bump for
  the curious, no barrier to the determined, and it costs nothing because compression is there for
  size anyway.
- A `checksum` over the payload. It does **not** block loading; it marks the save `modified: true`,
  which is there if shared achievements or leaderboards ever need it.

The sandbox tier stays worth paying for as the in-game UI on live state, not as the only way to
change a number.

---

## 8. Scope

**In:** export current game or named slot; import from Load game as a new slot; the
created-country imprint and its hard refusal on every load path; whatever is needed to let a
created country travel (§3 — possibly nothing, if the existing country export/import suffices);
validation; strings in all seven languages.

**Out, deliberately:**
- Cloud or account sync. Different feature, different cost.
- Exporting all slots in one file — one file = one career keeps the model and the errors simple.
- Auto-backup on a schedule.
- Any attempt to make saves tamper-*proof* (§7).

---

## 9. Build order

1. **Move `_download()` to `UI`**, repoint CustomizeScreen. No behaviour change; existing customize
   tests must pass untouched.
2. **Verify the existing country export/import round-trips a created country** between installs.
   If it does, the §3 prerequisite costs nothing; if it does not, fix that first.
3. **The created-country imprint + hard refusal** on every load path. Fixes the silent-broken-world
   bug that exists today, independently of export.
4. **Envelope + codec** (`SaveFile.pack()` / `unpack()`), engine-side and headless testable, with
   the plain-encoding fallback and the logo strip.
5. **Export UI** in Settings.
6. **Import UI** on Load game: picker, validation, preview, land as a slot.
7. Strings, seven languages, ~25 keys, **informal register** (the mobile UI is informal throughout;
   formal only if any of it ends up in a mail).

Steps 1–3 are worth shipping even if the rest slips: they fix a real bug and add a real feature.

---

## 10. Tests

- **Round trip**: `pack()` → `unpack()` reproduces `_snapshot()` exactly apart from the stripped
  logos, including `rngState`; then a round-tripped save advances a week to the *same* result as
  the original. Equality of the blob is not the point — the career continuing identically is.
- **Logos**: `clubLogos` is absent from the payload; a save with 100 of them exports at roughly the
  same size as one with none; `clubNames` / `compNames` survive.
- **Created-country gate**: a save needing Austria refuses on all three load paths, naming
  Austria; importing Austria then loads it correctly. It loads whichever database supplied the
  country, and regardless of that database's local id.
- **Cosmetic-only database**: a save from a renames/colours/logos database has an EMPTY
  `requiresCountries` and loads on a device with no databases at all — just plain. This is the
  check that proves cosmetics are genuinely ignored.
- **Base-game save**: no imprint, no gate, loads anywhere.
- **Both encodings** produce the same object.
- **Old schema in**: a schema-3 envelope migrates to 5. **Future schema out**: schema-99 refused.
- **Garbage in**: not JSON, JSON that is not a save, truncated payload, a 30 MB file — each refused
  with its own message, none crashing.
- **Import does not touch the live game**: a running career is byte-identical after an import.
- **Checksum**: an edited payload still loads, and is marked `modified`.

A DOM stub cannot prove a share sheet opens, so one real-device pass: export a save, send it
somewhere, import it back on the `-PdevId` build — which is exactly the setup this feature is for.

---

## 11. Remaining question

**Existing saves predate the imprint.** They carry `databaseId` but no `requiresCountries`. On a
device that still has the database nothing changes, and the imprint can simply be back-filled at
load time from `WorldExt.created` once the overlay has been applied — so it repairs itself before
it is ever needed, at no cost.

The gap is the device that does *not* have the database: there the countries cannot be derived,
because the thing that would name them is the missing database. The options are to let those
specific saves through with today's behaviour and a warning, or to refuse on the weaker signal
(`databaseId` present, database absent) without being able to say which country is missing. I lean
to refusing with the vaguer message — a broken world is worse than an unhelpful error — but it
only affects saves made before this ships.
