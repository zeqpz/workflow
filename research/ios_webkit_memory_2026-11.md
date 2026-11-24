# iPhone reloads in three Engine games: what the memory was, what fixed it (2026-11-16/17)

The reviewer's device was an iPhone 12 on iOS 18.6.4, and the owner tested in Chrome for iOS too (also WebKit). Each game reloaded by itself: its WebContent process was killed for memory inside Engine's casino iframe. None of it was verified on a real iPhone. The numbers are the WebKit memory model (`tools/memprobe/`, a lower bound) and Playwright WebKit. Skill: `slot-ios-webkit-memory`. Lag and loading time for Voodoo on Bourbon are in `mobile_tier_and_loading_2026-11.md`.

## The three games

| game (repo, Engine front) | what the reviewer saw | fix rounds |
|---|---|---|
| Tipsy Harvest (zeqpz/fallslotsga) | reloads every few seconds after a spin, and soon after launch; v8 "takes longer" | v8 (9694dd3): frame at shown size, pooled pop canvases, particle caps, 32 kHz audio, safety net. v9 (9c3ac82): the MOBILE tier |
| Voodoo on Bourbon (zeqpz/orleans) | same; then "crashes during Bonus Mode, persists after reloading" | v12 (a060a87): same fixes with no visible change. v13 (db24101): clips on demand, streamed music. v14 (ff43083): bonus resumes where it was; dead canvases recycled |
| Smukiez & Skelly (zeqpz/slotsgame) | phone lag, plus the sister games' crashes | v6 (53a4fb5): the MOBILE tier |

## Where the memory was (before)

| item | Tipsy Harvest | Voodoo on Bourbon | Smukiez & Skelly |
|---|---|---|---|
| model at boot, portrait | 217 MB | 433 MB (587 with Safari's toolbar) | 520 MB (569 toolbar) |
| biggest single cause | `#app` transform-scaled: layers 7-11x, `#app` fading in = 81-116 MB | Pixi's ImageBitmap copies of every atlas: 144 MB (232 toolbar) | layers 145-266 MB (the same transform), 81 clip atlases 101 MB |
| WebGL contexts | 3 | 2 | 6-7 |
| 2D canvases | ~250-280 | 204 dissolve kits plus a 19 MB burst canvas; 1,667 made through one Extreme Bonus | 700+ |
| oversized | art 2-4x what a phone draws | clips 1.27x too big under Safari's toolbar; 7 symbols the math never lands (40 MB) | wall picture 3840x2160 (33 MB) |
| decoded audio | 40-46 MB | 80 MB | 46-76 MB |

## After

- **Tipsy Harvest v9:**
  - Boot 217 -> 88 MB; Cork Storm whole run 240 -> 85, at the pops 201 -> 63.
  - 0 WebGL contexts; boot plus first spin fetch 7.9 MB.
  - 150-round soak flat.
- **Voodoo on Bourbon:**
  - v12: boot 433 -> 223 MB (toolbar 587 -> 220), graphics unchanged by pixel diff.
  - v13: boot 217 -> 68; rounds 79-85; audio 53 -> 11.
  - v14: canvases through one Extreme Bonus 1,667 -> 158.
  - In Playwright WebKit, five bonuses back to back peaked at 1010 MB before and 837 after.
- **Smukiez & Skelly v6:**
  - Boot 520 -> 134 MB; big win 567 -> 122; bonus 563 -> 129; extreme 564 -> 131.
  - Frame time at 4x CPU throttle, p95: big win 115 -> 24 ms (worst frame 1164 -> 91); spin-start long tasks 3 -> 0.

## Lessons that weren't in the skills before
1. A transform-scaled game root is the single biggest phone cost in WebKit. Use `zoom`, probe for zoomed rects, and keep the transform fallback.
2. Count ImageBitmaps that were uploaded to textures (worker-made ones never pass `createImageBitmap` on the page). On phones, `close()` them and re-cut the atlases on context restore.
3. Size clips for the board the phone actually shows: Safari's toolbar shortens the window, not the board's width.
4. Load only the symbols the math can land.
5. Peaks, not leaks. Every soak was flat, and the reviewer's "takes longer" meant a lower peak that still crossed the line.
6. "Crashes after reloading" in a bonus = a resume that replays from spin 1. Resume from a progress marker instead.
7. Phone copies of art pay off only to about 2x down. Pictures drawn 3-5x down looked softer as copies than with the browser's own scaling (PSNR 18-25 dB).
8. Playwright WebKit shows WebKit's own ~5-7 MB per free spin even with no inspector attached. Unexplained and not ours; long bonuses should start from a low baseline.

## Other review fixes in the same round (Smukiez & Skelly; see `stake-rgs-integration`)
- Bonus buys refused under GC: `gameModes[].maxBet: 0` is no cap.
- Autoplay couldn't be stopped when the balance fell short: it now needs only the next round covered, through one `stopAuto()`.
- `defaultBetLevel` wasn't applied: every launch now opens on it, even above the balance, with no remembered bet. That was front v7, 1f56cef.
- Lobby tile: one main character in the Key Focus Area, a bright background, no dark edges (see `stake-engine-publish`).
