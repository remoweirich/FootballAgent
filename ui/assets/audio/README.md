# Audio assets — shopping list & drop-in spec

The audio engine (`ui/js/audio.js`, global `Sound`) is fully wired. It plays nothing until
the files below exist here — a missing file just stays silent, so the app runs fine without
them. Drop the files in with the **exact names** and rebuild (`node scripts/build-mobile.js`).

## Music — a shuffled playlist

Put as many songs as you like in **`ui/assets/audio/music/`**. On build, `build-mobile.js` scans
that folder and regenerates `ui/js/music-manifest.js` automatically — no manifest to hand-edit.
They play **shuffled, back to back, continuously across the menu and in-game**, reshuffling when
the list runs out. A now-playing toast (name + Skip) shows briefly on each track change, and each
song can be toggled on/off in **Settings → Music tracks**.

- **Filename = display name.** Name each file as the song ("Artist - Title.mp3"); underscores
  become spaces. Spaces and unicode are fine (paths are URL-encoded at play time).
- The whole `music/` folder ships inside the app — ~35 MB total is fine.

## SFX to source

| File (put in `audio/`) | What it is | Length | Triggered when |
| :-- | :-- | :-- | :-- |
| `tap.mp3` | Soft UI tap/click | ≤ 150 ms | Any button / row / tab tap (global) |
| `cash.mp3` | Coins / cash register — a deal closed | ≤ 800 ms | Transfer, renewal, or sponsor signed |
| `goal.mp3` | Short crowd roar / goal sting | ≤ 1.5 s | Goal in the live match view |
| `whistle1.mp3` | Referee whistle — kick-off | ≤ 1 s | Start of a live match |
| `whistle2.mp3` | Referee whistle — full time | ≤ 1.5 s | End of a live match (final whistle) |
| `notify.mp3` | Gentle inbox chime | ≤ 700 ms | New inbox mail after advancing a week *(hook pending)* |

## Format & licensing

- **Format:** MP3, 44.1 kHz. Mono is fine for SFX; stereo for music. Keep SFX small (< 100 KB each).
- **Licence:** use royalty-free / CC0 (public-domain) or a licence that allows commercial app
  distribution with no attribution *inside the app*. Good sources: freesound.org (filter to
  CC0), Pixabay Audio, Kevin MacLeod (incompetech, CC-BY — needs a credit line). **Keep a note
  of each file's source + licence**; anything requiring attribution goes in the Copyright
  screen (`settings.copyrightBody`).
- Want a different extension? Change `Sound.EXT` in `ui/js/audio.js` (currently `mp3`).

## Volume / mute
Two channels — **Music** and **SFX** — each with a slider + mute in Settings, persisted per
device (`Prefs`: `vol_music`, `vol_sfx`, `mute_music`, `mute_sfx`). Defaults: music 55, sfx 80.

## Pending trigger hooks (wire when convenient)
`tap`, `cash`, `goal`, `whistle1`/`whistle2`, and the `music` playlist are all wired. Still open:
- **notify** → where advancing a week surfaces new inbox mail (Home advance flow):
  `Sound.play('notify')`.
