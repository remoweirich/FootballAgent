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

## 3. The save carries its own created countries — **Decided**

Only one thing a database does is structural. `applyDatabase`
([js/clubs.js:1561](../js/clubs.js#L1561)) performs exactly four operations:

| Operation | What it changes | Breaks a save if missing? |
|---|---|---|
| `db.countries` → `WorldExt.registerCountry()` | injects whole leagues, clubs, regions, name pools | **Yes** |
| `db.competitions` | competition name / short | No — cosmetic |
| `db.overrides` → name, colors, logo | club identity | No — cosmetic |
| `db.overrides` → reputation, division | club standing | No — the save's `clubState` is restored *after* the overlay and wins |

So the structural dependency is exactly the created countries, and **the save embeds them**:

```js
world: { countries: { Austria: <the cc, minus every club logo> } }
```

one entry per created country in play. On import they are installed and registered, so the save
is self-sufficient: no imprint, no hash, no "go and find database XY", no dead end on a device
that never had it.

### Measured: this is free

A created country is 84 clubs over a fixed 20/20/24/20 spec, plus a 150+150 name pool, four
divisions, two cups and six regions:

| | Raw JSON | gzipped |
|---|---|---|
| One created country, no logos | 18.6 KB | **2.4 KB** |

Against the 288 KB export measured in §1 that is **+0.9%**. Embedding costs nothing worth
discussing — but only because §2 already strips logos. With a logo on all 84 clubs the country
is ~690 KB of PNG data URIs, which barely compress, so the logo strip applies to the embedded
country exactly as it does to the save body. The country's logos still travel the way they
already can, through Customize's per-country export.

### Why this is better than fingerprinting it

An earlier draft had the save record a content hash of the country and refuse to load without a
matching one. Embedding is strictly better: it removes the hash, the capture-at-career-start
rule, the export-time verification, the override prompt for editing your own world, and the
whole class of "the file is valid but useless because the world it needs cannot be obtained".
The import simply works.

### The one case it does not solve: a name collision

Embedding fixes *missing*. It does not fix *conflicting* — and today conflicting fails in the
worst possible way. Registering a second, different Austria over an existing one was measured:

```
club CUS:Austria:c1 was "Austria Club 1", now "Austria Club 1"
division CUS:Austria:1 name is now "OTHER 1st Division"
=> clubs KEPT the first world, divisions took the SECOND world
```

Because `registerCountry` skips clubs that already exist (`if (Clubs.getClubById(c.id)) return;`)
but overwrites `COMPETITIONS[divId]` unconditionally
([js/world-ext.js:163](../js/world-ext.js#L163)), the result is a hybrid: the local world's clubs
playing in the imported world's divisions. Silently.

The check that remains is therefore small and needs no stored state, because the full definition
is right there in the file: **at import, compare the embedded country with the local one of the
same name.**

- **No local country of that name** — install it. The common case.
- **Present and identical** — use the local one, nothing to do.
- **Present and different** — the only real decision. For v1, **refuse** with a message that says
  what to do: *"This save brings its own Austria, and you already have a different one. Rename or
  delete yours in Customize, then import again."* Safe, honest, and rare — it needs two different
  worlds that happen to share a country name.

  Importing it alongside under a new name is the nicer answer and can come later, but it means
  rewriting every `CUS:Austria:*` id in the payload — in `players`, `clubHistory`, `clubState`,
  `league` tables and fixtures, `bestXI`, achievements and the inbox. Mechanical, but any key
  missed is silent corruption of exactly the kind this section exists to prevent, so it is not a
  v1 feature.

Comparison is on the same fields a hash would have covered — club `id`, `name`, `division`, plus
`divIds` and `divNames` — ignoring logos, colours and reputation. Reputation differences get a
warning, not a refusal: a different Austria will differ in names anyway, and refusing on
reputation alone would block a save whose world was merely tuned.

### Where the imported country lands

It has to persist, or the next boot is back to square one. On import it is written into a
customization database so it behaves exactly like one the player built — visible and editable in
Customize. If `MAX_DBS` (5) is already reached, the player frees one first, the same rule
Customize already enforces for creating a database.

### The local hole, closed at its cause

None of this helps the player who corrupts a career without ever exporting, and that vector is
real and unguarded: `_doCreate(name, overwriteId)` **reuses the existing id** when overwriting a
database ([ui/js/screen-customize.js:91](../ui/js/screen-customize.js#L91)) and `deleteDatabase`
checks nothing, so "My Austria" can be replaced wholesale and every career on it re-attaches to
whatever clubs now sit at those ids.

Fix that where it happens: **Customize warns before overwriting or deleting a database a save
depends on**, naming the saves. Worth doing on its own, with or without export.

## 4. The file

One file is one career. Extension `.fam`, named `<agency>-<season>-<date>.fam`.

```json
{
  "fam": 1,
  "app": "1.0.27",
  "schema": 5,
  "exported": 1759600000000,
  "encoding": "gzip+base64",
  "world": { "countries": { "Austria": { "...": "the full definition, logos stripped" } } },
  "game": {
    "agency": "Ferrari & Partners", "manager": "A. Tester",
    "country": "Switzerland", "season": "29/30", "week": 12, "clients": 14
  },
  "checksum": "…",
  "payload": "H4sIAAAA…"
}
```

The header stays plain so a human — or you, reading a bug report — can see what a file is without
running it. `world.countries` carries the created countries the save needs (§3); it is absent for
a base-game career and about 2.4 KB gzipped per country otherwise. `payload` is the `_snapshot()`
JSON minus `clubLogos`.

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
6. The §3 country comparison, at **import preview**: install, reuse, or refuse on a conflicting
   country of the same name — decided before the file is committed to a slot.

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

**In:** export current game or named slot; import from Load game as a new slot; **embedded
created countries** and the install/reuse/refuse comparison; the Customize warning before
overwriting or deleting a depended-on database; validation; strings in all seven languages.

**Out, deliberately:**
- Importing a conflicting country alongside the local one under a new name. Needs an exhaustive
  id remap across the whole payload; a missed key is silent corruption (§3).
- Cloud or account sync. Different feature, different cost.
- Exporting all slots in one file — one file = one career keeps the model and the errors simple.
- Auto-backup on a schedule.
- Any attempt to make saves tamper-*proof* (§7).

---

## 9. Build order

1. **Move `_download()` to `UI`**, repoint CustomizeScreen. No behaviour change; existing customize
   tests must pass untouched.
2. **Warn in Customize before overwriting or deleting a database a save depends on.** Stops the
   local corruption at its cause; worth doing on its own, with or without export.
3. **Embed and install created countries**: collect them from `WorldExt.created` on export, strip
   logos, and on import compare / install / refuse (§3).
4. **Envelope + codec** (`SaveFile.pack()` / `unpack()`), engine-side and headless testable, with
   the plain-encoding fallback and the logo strip.
5. **Export UI** in Settings.
6. **Import UI** on Load game: picker, validation, preview, land as a slot.
7. Strings, seven languages, ~25 keys, **informal register** (the mobile UI is informal throughout;
   formal only if any of it ends up in a mail).

Steps 2 and 3 carry the risk; step 2 is worth shipping on its own, since it closes a corruption
vector that exists today whether or not export ever ships.

---

## 10. Tests

- **Round trip**: `pack()` → `unpack()` reproduces `_snapshot()` exactly apart from the stripped
  logos, including `rngState`; then a round-tripped save advances a week to the *same* result as
  the original. Equality of the blob is not the point — the career continuing identically is.
- **Logos**: `clubLogos` is absent from the payload; a save with 100 of them exports at roughly the
  same size as one with none; `clubNames` / `compNames` survive.
- **A created-country save is self-sufficient**: export a career in Austria, import it on an
  install that has never seen Austria, and the clubs, names, divisions, cups and regions all come
  back — the clients are at the same teams they left.
- **The embedded country is logo-free** and the export stays within a few KB of the same save
  without a created country.
- **A conflicting Austria is refused, not merged.** Build two different Austrias, import across,
  and assert the refusal. The failure this guards is specific and measured: `registerCountry`
  skips existing clubs but overwrites `COMPETITIONS`, so without the check you get the local
  world's clubs in the imported world's divisions. A test that only checks "it loaded" passes
  on that hybrid.
- **An identical Austria is reused**, not duplicated into a second database.
- **Databases full**: importing a country when `MAX_DBS` is reached refuses the same way creating
  one does.
- **Two created countries** in one career both install.
- **Promotion and relegation do not change the embedded definition**: run five seasons, export,
  and the country in the file still matches the day-one definition — `registerCountry` copies
  clubs into fresh objects, so prom/rel moves the live registry and never `WorldExt.created`.
  A test pins it, because a future refactor that aliased them would ship a drifting world.
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

**Existing saves predate the embedding.** A career already running on a created country has no
`world` block. Exporting one is fine — the countries are collected from `WorldExt.created` at
export time, so an old save exports exactly like a new one, with no migration needed.

The only gap is exporting such a save on a device where the database has *already* gone missing:
`WorldExt.created` is empty, so there is nothing to embed, and the export would silently produce
a file that cannot be loaded anywhere. Refuse that export rather than writing it — "this save's
world is missing, so it cannot be exported" — which is also a useful signal that the career is
already broken locally. Cheap, and it stops a bad file existing at all.
