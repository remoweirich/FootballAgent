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

## 3. The gate: the exact created country, matched by fingerprint — **Decided**

Only one thing a database does is structural. `applyDatabase`
([js/clubs.js:1561](../js/clubs.js#L1561)) performs exactly four operations:

| Operation | What it changes | Breaks a save if missing? |
|---|---|---|
| `db.countries` → `WorldExt.registerCountry()` | injects whole leagues, clubs, regions, name pools | **Yes** |
| `db.competitions` | competition name / short | No — cosmetic |
| `db.overrides` → name, colors, logo | club identity | No — cosmetic |
| `db.overrides` → reputation, division | club standing | No — the save's `clubState` is restored *after* the overlay and wins |

`registerCountry` injects into `COMPETITIONS`, `COUNTRY_DIVS`, `ALL_LEAGUE_DIVS`, `LEAGUES_DATA`,
`Clubs.*`, `REGIONS_BY_COUNTRY`, `Scouts.REGION_REPORT_COST` and `NAMES_DATABASE`. Load an Austria
save with no Austria at all and every Austrian club id resolves to `undefined`, clients point at
clubs that do not exist, and `homeCountry` has no regions. Broken outright.

### Why "has a country called Austria" is NOT enough

Club ids for a created country are **positional, not derived from the name**
([js/world-ext.js:109](../js/world-ext.js#L109)):

```js
id: 'CUS:' + country + ':c' + n      // n counts across CUSTOM_DIV_SPEC
```

and `CUSTOM_DIV_SPEC` is fixed at 20 / 20 / 24 / 20 clubs. So **every** Austria anyone ever
creates has exactly the same 84 club ids, `CUS:Austria:c1` … `c84`, in exactly the same divisions.
Renaming a club does not change its id.

The consequence is the dangerous one, and it is worse than a crash:

> Two independently built Austrias have **identical ids and different teams**. `CUS:Austria:c7`
> is Rapid Wien in one and Sturm Graz in another. Load the save against the wrong Austria and
> nothing errors — every id resolves. The client's career, his club history, the league tables
> and the honours all silently re-attach to the wrong clubs.

So an existence check is useless as a gate: it always passes. It is precisely the check that would
let a corrupted career through looking perfectly healthy. (An earlier draft of this document
proposed exactly that; it was wrong.)

The variance shows up entirely in names, because the structure cannot vary — which is also why
the lower divisions are where it bites hardest. There is no real-world template for a 24-club
fourth tier, so two people filling one in will disagree about almost every club, while the ids
line up perfectly.

### The fingerprint

A save records a hash of the created country's **content**, not the database's identity:

```js
requiresCountries: {
  Austria: 'c4f1e9…'   // sha-256 (or a cheap 32-bit rolling hash) over the ordered
                       // id → name pairs, each club's division, and the division ids/names
}
```

Hashed: club `id`, club `name`, club `division`, `divIds`, `divNames`. That is exactly the set
that determines whether two Austrias are the same world.

**The source is the country DEFINITION, never the live world.** This is the part that is easy to
get wrong, and getting it wrong breaks every save after one season.

`registerCountry` copies each club into a **fresh object** before pushing it into the live
registry ([js/world-ext.js:186](../js/world-ext.js#L186)):

```js
cc.clubs.forEach(c => {
    const club = { id: c.id, name: c.name, /* … */ division: c.division, /* … */ };
    Clubs.allClubs.push(club);
});
```

So promotion and relegation mutate `Clubs.allClubs` and the save's `clubState`; they never touch
`WorldExt.created[name].clubs[].division`. `applyPromotionRelegationCustom` only *reads*
`cc.divIds` ([js/league.js:1665](../js/league.js#L1665)) and writes through `Clubs.setDivision`.
The definition is immutable at runtime — the only thing that ever rewrites it is the Customize
editor, which genuinely is making a different world.

Hence `division` is safe to hash, and worth hashing: two Austrias could share every club name and
still arrange them into a different pyramid, which is a different world. But the hash must be
taken from `WorldExt.created[name]`, and a future change that computes it from `Clubs.allClubs`
instead would see the fingerprint drift at the first promotion. A test pins this: **fingerprint,
simulate five seasons of promotion and relegation, fingerprint again, assert unchanged.**

Because the definition is immutable, the hash can be computed once at `registerCountry` and
cached, and invalidated only when the editor writes. Recomputing per save is also fine — it is
84 short string concatenations.

**Every club is hashed; nothing is sampled.** A fingerprint is a hash, so it occupies one short
string in the save whether it digests 8 clubs or 84 — sampling saves no space at all, only a
negligible amount of compute. And it would forfeit the guarantee precisely where it is needed:
the variance is concentrated in the lower divisions, where there is no real-world template, so
any sample that skipped them would wave through exactly the saves this check exists to stop.

**Not** hashed, on purpose:

- **logo** and **colors** — cosmetic, and would make a save refuse after a crest import.
- **reputation** — a different Austria will differ in names anyway, so the hash already catches
  it. Including reputation would instead lock a player out of their *own* save after editing one
  club's standing in Customize. Worth a soft warning on load if reputations differ while names
  match ("club strengths differ from the world this save was made in"), never a refusal — which
  matches the judgement that different reputations are undesirable but not corrupting.

The hash is recomputed on every save, so editing the world on the device you are playing on can
never lock you out: the save follows the world it is actually in. Only a *cross-device* mismatch
is caught, which is the case that matters.

The refusal names the country and the database it came from, because the database name is the
only thing the player can act on:

> **This save needs the Austria it was created with.** The Austria on this device is a different
> one — the clubs do not match. Import the country from the database "My World" and try again.

This applies to **every** load path (autosave boot, named slot, imported file). Today a missing
database is a silent no-op — `if (db) Clubs.applyDatabase(db)` with a `console.warn` — so this
fixes a real bug that already exists, independently of export.

### Transport: already solved

Customize's existing per-country export writes the whole created country —
`JSON.stringify(cc)`, clubs, names, divisions, reputations, regions and logos
([ui/js/screen-customize.js:1064](../ui/js/screen-customize.js#L1064)) — and `importCountry`
validates and reads it back. A country therefore round-trips **byte-faithfully** between devices,
which means the fingerprint matches after a transfer, which means there is **no prerequisite to
build**. Confirm the round trip, then rely on it.

It also means the created country's logos travel with the *country*, even though logos are
stripped from the save (§2). The common case keeps its crests.

Keeping all of this out of save files remains the right answer for the real-names posture:
world content stays something the player moves deliberately, not something redistributed inside
every shared save.

## 4. The file

One file is one career. Extension `.fam`, named `<agency>-<season>-<date>.fam`.

```json
{
  "fam": 1,
  "app": "1.0.27",
  "schema": 5,
  "exported": 1759600000000,
  "encoding": "gzip+base64",
  "requiresCountries": { "Austria": "c4f1e9a2" },
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
running it. `requiresCountries` is the gate (§3) — a content fingerprint per created country, usually `{}`;
`databaseName` is a hint for the message only. No overlay is embedded. `payload` is the `_snapshot()` JSON minus `clubLogos`.

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
created-country **fingerprint** and its hard refusal on every load path; the soft reputation
warning; validation; strings in all seven languages. No new transport — Customize's existing
per-country export/import already moves a country faithfully (§3).

**Out, deliberately:**
- Cloud or account sync. Different feature, different cost.
- Exporting all slots in one file — one file = one career keeps the model and the errors simple.
- Auto-backup on a schedule.
- Any attempt to make saves tamper-*proof* (§7).

---

## 9. Build order

1. **Move `_download()` to `UI`**, repoint CustomizeScreen. No behaviour change; existing customize
   tests must pass untouched.
2. **Verify the existing country export/import round-trips a created country byte-faithfully**
   between installs, so a transferred Austria fingerprints identically. If it does, §3 needs no
   new transport; if it does not, fix that first.
3. **The fingerprint + hard refusal** on every load path, plus the soft reputation warning. Fixes
   the silent-wrong-clubs bug that exists today, independently of export.
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
- **The fingerprint catches a different Austria.** Build two Austrias with the same name and
  different club names, confirm their club ids are IDENTICAL (they will be), and confirm the save
  refuses. This is the test the whole section exists for — an id-existence check passes here, so
  a test that only loads and looks for a crash proves nothing.
- **The fingerprint accepts the same Austria after a transfer**: export the country, re-import it
  into a different database with a different id, and the save still loads.
- **Promotion and relegation do not move the fingerprint**: fingerprint, simulate five seasons,
  fingerprint again, assert identical. This is the one that catches a future refactor computing
  the hash from `Clubs.allClubs` instead of the country definition.
- **Editing your own world never locks you out**: rename a club mid-save, save, reload — fine.
- **Reputation differs, names match**: loads, with a warning, not a refusal.
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

**Existing saves predate the fingerprint.** They carry `databaseId` but no `requiresCountries`.
On a device that still has the database, the fingerprint back-fills itself at load time from the
applied overlay, so it repairs before it is ever needed, at no cost.

The gap is the device that does *not* have it: the fingerprint cannot be derived, because the
thing that would supply it is the missing database. Those saves can only be refused on the weaker
signal (`databaseId` present, database absent) without naming the country. I lean to refusing
anyway — a silently wrong career is worse than an unhelpful error — but it only affects saves made
before this ships.
