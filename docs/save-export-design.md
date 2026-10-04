# Save export / import — design plan

Let a player move a career off one device and onto another: a new phone, a backup before a risky
update, a save attached to a bug report, or the `-PdevId` test build sitting beside the real one.

---

## 0. Most of this already exists

The work is smaller than it looks, because every hard part has a proven implementation in the repo.

| Piece | Where | Note |
|---|---|---|
| The one serializer | [js/game-state.js:178](../js/game-state.js#L178) `_snapshot()` | Used by both the autosave and named slots. Export must reuse it, not invent a second shape. |
| The one deserializer | [js/game-state.js](../js/game-state.js) `_applySaved()` + `_runMigrations()` | Already upgrades an old save. Import is just "feed it an object from a file instead of IndexedDB". |
| Writing a file on Android | [ui/js/screen-customize.js:1283](../ui/js/screen-customize.js#L1283) `_download()` | Already solves the real trap — Android's WebView **ignores `<a download>` and `blob:` URLs**. Writes to CACHE via Filesystem, then hands the uri to the system share sheet. Browser keeps the blob path. |
| Reading a file | [ui/js/screen-customize.js:419](../ui/js/screen-customize.js#L419) etc. | `<input type="file">` + `FileReader` already works in this WebView (logo import, names CSV, country JSON) — Capacitor's bridge supplies `onShowFileChooser`, so no Activity wiring is needed. |
| Named save slots | [js/storage.js:170](../js/storage.js#L170) `listSlots/putSlot/deleteSlot`, `MAX_SLOTS: 5` | Import should land here rather than inventing new storage. |

So the new code is a file format, two screens' worth of buttons, and the validation in between.

---

## 1. Measured: how big is a save?

Not guessed — simulated, at three career lengths, on a real `_snapshot()`:

| Seasons | Raw JSON | gzipped | Heaviest keys |
|---|---|---|---|
| 1 | 839 KB | **138 KB** | league 561, clubState 98, lastSeasonReport 87, clubHistory 66 |
| 5 | 1,274 KB | **183 KB** | league 561, clubHistory 281, lastSeasonReport 272, clubState 98 |
| 15 | 1,823 KB | **216 KB** | clubHistory 819, league 561, lastSeasonReport 271, clubState 98 |

base64 of the gzip at 15 seasons: **288 KB**.

Three things fall out of this:

- **Raw JSON is too fat to be the wire format.** 1.8 MB is awkward to email or paste into a bug
  report; 288 KB is not. Compression pays for itself immediately.
- **`clubHistory` grows without bound** — 66 KB → 281 KB → 819 KB, and it is the only key that
  does. That is the "save grows unbounded" item already on the open list. Export makes it visible
  but does not cause it, and it should be fixed separately rather than papered over here.
- **`league` is a flat 561 KB from season one.** Worth a look sometime; not this task.

### The logo exception

`clubLogos` lives *inside* the save (mid-save imports via Settings), so logos travel with an
export, which is what you want for fidelity. But they are 128px PNG data URIs — roughly 5–15 KB
each, already compressed, so gzip barely touches them. A player who has logo'd one country
(~50–100 clubs) adds **0.5–1 MB** to an export that would otherwise be 288 KB; all 856 clubs
would add several MB.

So the export must report its own size, and the UI must not promise "a small file".

---

## 2. The file

One file is one career. Extension `.fam`, MIME `application/json`, named
`<agency>-<season>-<date>.fam`.

```json
{
  "fam": 1,
  "app": "1.0.27",
  "schema": 5,
  "exported": 1730000000000,
  "encoding": "gzip+base64",
  "game": {
    "agency": "Ferrari & Partners",
    "manager": "A. Tester",
    "country": "Switzerland",
    "season": "29/30",
    "week": 12,
    "clients": 14
  },
  "database": { "id": "...", "name": "...", "overrides": { } },
  "payload": "H4sIAAAA…"
}
```

The header stays plain so a human (or you, reading a bug report) can see what a file is without
running it. Only `payload` — the `_snapshot()` JSON — is compressed.

**Compression**: `CompressionStream('gzip')`, which Android WebView has had since Chrome 80. The
WebView updates through Play independently of the OS, so minSdk 24 is not the constraint — but a
device with a frozen old WebView is still possible, so if `CompressionStream` is missing, write
`"encoding": "plain"` with the raw JSON instead. Import handles both. No library, no bundle growth.

---

## 3. Export

Lives in **Settings → Save game**, beside the existing named-save list, so export sits where saves
already are rather than in a new place.

- **Export current game** — snapshots live state (the same `_snapshot()` the autosave uses).
- **Export** on any named slot row — exports that slot's stored state.

Both build the envelope and hand it to a shared version of `_download()`. That helper currently
lives on `CustomizeScreen`; it should move to `UI` (ui-helpers/shim) so Settings can use it without
reaching across screens. That is a lift-and-shift of working code, not a rewrite.

The confirmation names the file and its size, because a 4 MB logo-laden export should not be a
surprise after the share sheet opens.

---

## 4. Import

**Import never touches the running career.** It always lands as a *new named slot*, which the
player then loads deliberately from the existing Load list. Overwriting the autosave on import is
the one mistake that turns a convenience feature into lost progress, and there is no undo for it.

Flow: file picker → read → validate → show what the file contains (agency, season, week, clients,
exported date) → confirm → `Storage.putSlot()` → offer to load it now.

If all 5 slots are full, the player must free one first — same rule `createNamedSave` already
enforces, not a new one.

### Validation, in order

1. Parses as JSON, and `fam` is a version this build knows.
2. `schema` is **not newer** than `SCHEMA_VERSION`. A save from a future build can carry fields and
   invariants this one has never heard of; refuse it with "this save is from a newer version of the
   game" rather than importing something half-understood. Older is fine — that is what the
   migration pipeline is for.
3. Payload decodes and parses.
4. It looks like a save: `week`, `seasonStartYear`, `homeCountry`, `agency`, `players` all present
   and the right types. A country the build does not know is a refusal, not a crash.
5. Size ceiling (say 25 MB) before decompressing, so a malformed or hostile file cannot be used to
   blow up memory.

Every refusal says which check failed. "Invalid save file" with no reason is the kind of message
that generates support mail.

---

## 5. Four traps

### 5a. The customization database — the one that bites silently

A save stores `databaseId`, but the database itself lives separately at `db:<id>`
([js/storage.js](../js/storage.js), `MAX_DBS: 5`). On load, `_hydrateDatabase()` does:

```js
try { const db = await Storage.getDatabase(this.databaseId); if (db) Clubs.applyDatabase(db); }
catch (e) { console.warn('Database overlay load failed', e); }
```

If the database is absent, that is a **silent no-op**. Import a custom-database save onto a device
without that database and the game does not fail — it loads with generic club names and the
day-one pyramid, while the save's own drifted reputations and divisions apply on top. A wrong
world, quietly, with no error.

So: **embed the referenced database in the envelope** (`database`), and on import, if the id is not
present locally, install it alongside the save. If the id *is* present locally, prefer the local
copy and say so — the player may have edited it since.

A save started on the base game has no `databaseId` and skips all of this.

### 5b. Save editing vs. the paid Gamestate editor

This is a product decision, not a technical one, and it should be made before any code is written.

`Monetization.canEditGameState` gates a paid editor. A compressed, base64'd payload is
**obfuscation, not protection** — anyone who wants to edit a save will, and a signature or HMAC
does not change that, because the key would ship inside a readable JS bundle. Security theatre
costs real complexity and buys nothing.

Three honest positions:

1. **Accept it.** Ship export/import; treat the paid editor as a *convenience* (a proper in-game UI
   on live state) rather than an exclusive capability. Most single-player games land here.
2. **Export only, no import.** Backups and bug reports still work; moving to a new phone does not.
   This guts the main use case to protect a feature that is already editable by anyone determined.
3. **Import, with tamper *detection* rather than prevention.** Store a checksum of the payload;
   on import, a mismatch does not block the load but marks the save `modified: true`. Useful later
   if leaderboards or shared achievements ever exist. Costs very little.

I would ship **1 + the checksum from 3**: full export and import, no gate, but the save knows
whether it was altered outside the game.

### 5c. Nothing shrinks the save on the way out

Export is the moment a player meets `clubHistory`'s growth as a concrete number. Resist the urge to
trim history during export: a "smaller" export that silently drops career data is a worse bug than
a large file. Fix the growth at source, separately.

### 5d. Determinism travels, and should

`rngSeed` and `rngState` are both in the snapshot, so an imported save resumes the same stream and
regenerates identical background squads. That is correct and needs no work — but it does mean a
round-trip must be **byte-identical**, which the tests below pin.

---

## 6. Scope

**In:** export the current game or a named slot; import as a new slot; the embedded database; the
validation above; `.fam` in all seven languages.

**Out, deliberately:**
- Cloud or account sync. Different feature, different cost.
- Exporting all slots in one file. One file = one career keeps the mental model and the error
  messages simple.
- Exporting the customization databases on their own — Customize already has its own
  export/import for those.
- Auto-backup on a schedule. Worth considering later; not needed for any of the use cases above.

---

## 7. Build order

1. **Move `_download()` to `UI`** and repoint CustomizeScreen at it. No behaviour change; the
   existing customize export tests should still pass untouched.
2. **Envelope + codec** (`SaveFile.pack()` / `SaveFile.unpack()`), engine-side and headless
   testable, with the plain-encoding fallback.
3. **Export UI** in Settings, current game and per slot.
4. **Import UI**: picker, validation, preview, land as a slot.
5. **Database embedding** and the missing/colliding-id handling.
6. Strings in all seven languages (~20 keys), **informal register** for the UI, formal only if any
   of it ends up in a mail.

Each step leaves the game working.

---

## 8. Tests

- **Round trip**: `pack()` → `unpack()` reproduces `_snapshot()` exactly, including `rngState`;
  then a loaded round-tripped save advances a week to the *same* result as the original. Equality
  of the blob is not enough — the point is that the career continues identically.
- **Both encodings**: gzip path and the plain fallback produce the same object.
- **Old schema in**: a schema-3 envelope imports and runs the migration pipeline to 5.
- **Future schema out**: a schema-99 envelope is refused with the right reason.
- **Garbage in**: not JSON, JSON that is not a save, truncated payload, a 30 MB file — each
  refused, each with its own message, none crashing.
- **Missing database**: importing a save whose `databaseId` is unknown locally installs the
  embedded one and the club names come out right. This is 5a and it is the test that matters most.
- **Import does not touch the live game**: a running career is byte-identical after an import.
- **Slots full**: refused the same way `createNamedSave` refuses.
- **Size reporting**: a save with 100 logos reports its real size.

And, because a DOM stub cannot prove a share sheet opens: one real-device pass exporting a save,
sending it somewhere, and importing it back on the `-PdevId` build — which is exactly the setup
this feature is for.

---

## 9. Open questions

1. **The 5b decision** — accept editable saves, or export-only? Everything else is downstream of it.
2. **Where does import live?** Settings → Save game, next to the slots (consistent), or also on the
   Start screen, so a player who has just reinstalled can restore before starting a career
   (discoverable at the moment of need). The second is more useful and slightly more work.
3. **Should export offer a "lean" variant** that drops `clubLogos` for a dramatically smaller file,
   clearly labelled as losing custom logos? Useful for bug reports, risky if a player picks it for
   a phone transfer without reading.
