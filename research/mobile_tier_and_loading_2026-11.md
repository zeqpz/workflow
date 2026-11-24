# Voodoo on Bourbon review round, 2026-11-16 (zeqpz/orleans)

What one day of Engine review fixes on a 5x5 cluster slot taught us, with the numbers. Commits: 0cd0c03, 2ef6d35,
c522097, 295be74 (front v8-v11 on studio.engine.io).

## Review asks and what they turned out to need
| Ask | What it needed |
|---|---|
| Replay window "like the example" with Mode, Base Bet, Cost Multiplier, Total Bet Cost, Payout Multiplier, Total Win; respect `lang`; a button at the end to replay | One card shown before and after the round (Start Replay / Replay Again), a loading and error state, words in 15 languages from the link's `lang`, English in social mode, multipliers formatted like the money |
| Social version: every restricted term replaced, meaning unchanged | The official table + inflections in one longest-first regex pass, `{real|social}` pairs where a swap changes the meaning, every runtime message through `T()`, mode names without buy/bet/pay and identical in game/replay/math. Scan of 267 strings on every screen with an XGC wallet: 0 hits, no "$" |
| Default bet on refresh | The game remembered the bet per session in localStorage. Removed: a refresh with no round open opens on `defaultBetLevel`; an open round resumes at its own amount |
| "Mobile very laggy on iPhone" | A MOBILE tier (below) |
| "Loading screen still bugged and takes forever" | Wait for the first screen only, weight the bar, cap it (below) |
| "Click to play" over the third intro box | It was `position: absolute; bottom: 4vh`. Put it in the column and fit the column (CSS zoom) to the window |

## MOBILE tier - iPhone 12 emulation (390x844 @3, iOS UA), 4x CPU throttle
Frame time p95 (worst), before -> after:
- idle 54.5 -> 12 ms
- spin 54.6 -> 24-42 ms (first spin uploads symbol sheets)
- pops 78.8 (460) -> 18.2 (103)
- cork 91.1 (170) -> 12.2 (49)
- big win 103 (473) -> 24.3 (73)
- bonus 72.8 (303) -> 18.2 (176); frames > 33 ms 1122 -> 111

WebKit memory model (canvases + GL + textures + decoded pictures + layers at layout size x DPR^2):
- boot 647 -> 313 MB (layers 286 -> 44, textures 217 -> 147, 2D canvases 82 -> 39)
- big win 703 -> 316 MB

Before the change the top CPU costs were the character's rig skinning, layout reads, `getKeyframes` sampling of idle
wanders, the star canvas and the candle flame. After: the board's own WebGL draw.

What made the difference, biggest first: `zoom` instead of `transform: scale` on #app; no character; no living
background (one still painting made for the phone); no idle wanders; tier-aware preloads (the 33 MB-decoded 4K plate
was fetched on phones by a stylesheet-scanning preloader); offscreen dissolve canvases cut to the phone's size.

## Loading screen - cold load, 20 Mbps / 60 ms
- Before: 22.1 s (phone), 22.2 s (desktop); the bar reached 99.6% at 8 s and stayed there 13 s.
- After: 9.6 s / 10.5 s; the bar climbs steadily.
- Timeline after (phone): fixed pieces 2.4 s, effects 4.3 s, pictures + sounds 6.7 s, symbol landings 8.3 s.
- Causes: every animation clip (24-63 MB) was on the critical path and weighed as one step; music (3.6 MB) downloaded
  in parallel. A self-inflicted bug on the way: `sounds.map(one)` once `one` took a weight - the index became the weight.

## Engine hosting facts learned
- `https://<team>.live.engine.io/<game>/v<N>/` answers 403 for a freshly published version; the dashboard launcher
  serves it. Not a failed publish.
- Minting from the launcher URL is refused; use the plain Files page.
- Whole-bundle check: SHA-256 of sorted `key md5` lines (local, from git blobs) == of sorted `key etag` lines (tab).

## Tooling notes
- Python heredocs: `\b` in a non-raw string becomes a backspace character and silently breaks a regex written into
  JS. Use raw strings or `(&|$)`.
- Generated a portrait phone background with gpt-image (2:3) from the desktop painting as reference: say what goes in
  each band of the height (sky/moon, a calm middle for the board, simple dark ground under the controls) and "one
  continuous painting, no seams".
