---
name: slot-frontend-performance
description: Make an HTML5 slot frontend (PixiJS v8 / Spine / CSS+canvas, Stake Engine iframe) run smoothly on mid phones, iPhones (WebKit) and high-refresh screens - renderer settings, batching, masks/filters, text, texture upload and GC, DOM/CSS compositor traps, a light MOBILE tier for iOS (zoom-fit, no character/live background), a fast loading screen, and a measurement workflow (CDP traces, frames presented, iPhone emulation + WebKit memory model, throttled cold loads, interleaved A/B). Use when the game lags, hitches at spin start / big win / bonus, reloads or lags on iPhone, loads slowly, drains battery, or before shipping a build.
---

# Slot frontend performance

Sources: PixiJS v8 docs (performance-tips, render-groups, cache-as-texture, garbage-collection, particle-container), Esoteric spine-pixi docs, engine.io Discord 2025-2026, four profiling passes on our own Stake games on this machine (2026-10), and the iOS reviews of Tipsy Harvest and Voodoo on Bourbon (2026-11, `research/mobile_tier_and_loading_2026-11.md`). Full research: `research/web_frontend_perf.md`, `research/discord/digest_*.md`. Measuring tools: `tools/memprobe/` in this repo.

## Rule 0: measure first, and measure the right thing
- This machine: 2560x1440 **165 Hz** AMD iGPU (Chrome renders there). Anything uncapped runs 165/s. The Claude browser pane competes for the same GPU: single runs swing 2x, so run **interleaved A/B with medians**.
- rAF fps UNDERSTATES compositor animations. Judge smoothness by frames presented: trace `--cats=-*,viz,devtools.timeline` and count `Display::DrawAndSwap`.
- Use replay mode (`?replay=true&...&event=<id>`) so every run plays the same round.
- Headless `--headless=new` Chrome over a stdlib Python CDP client gets the real GPU (check UNMASKED_RENDERER). Long tasks -> attribute to function@line. Composite failures -> trace `blink.animations`, read `compositeFailed` bits (Chrome 155: 1<<17 no visible change, 1<<18 important property, 1<<6 incompatible).
- Real devices: `chrome://inspect` (Android), Safari Web Inspector (iPhone). CPU throttling won't show fill-rate limits; render at DPR 3 to approximate.
- Ship an in-game `?perf=1` HUD (frame-time p50/p95/p99, frames > 20 ms per spin) - the only easy metric on iOS.
- Spector.js for draw calls (aim < 30-50 on mid phones), @pixi/devtools for scene/textures.

## Renderer setup (Pixi v8)
```ts
await app.init({ preference: 'webgl', resolution: Math.min(devicePixelRatio, 2), autoDensity: true,
                 antialias: false, powerPreference: 'high-performance', backgroundAlpha: 1 });
app.ticker.maxFPS = 63;   // NOT 60: Pixi floors frame delta to whole ms, 60 drops frames on a 60 Hz panel
app.ticker.minFPS = 30;
```
- Force WebGL: WebGPU caused iOS flicker (Discord) and Safari 26.x has open WebGPU bugs; Pixi labels WebGPU experimental.
- Every ticker must be capped: spine-pixi `autoUpdate` runs on `Ticker.shared` (uncapped) unless the Spine gets `ticker: app.ticker`. Drive GSAP from the same ticker.
- Handle `webglcontextlost/restored`; rebuild generated textures/gradients (white canvas after tab switch).
- Mipmaps (linear-mipmap-linear) instead of brute resolution against pixelation.

## Draw-call and fill-rate rules
- Atlases: few pages so sprites batch (16 textures/batch). Pages <= 2048 for low tier, never 4096x4096 on old iOS (crashes).
- Group by blend mode: all additive glows in ONE container above symbols, not interleaved.
- Masks: rectangle (scissor) << Graphics (stencil) << sprite masks (filter). Reel windows = rectangle masks.
- Filters/blur/glow live = biggest phone killer. Bake glow into art; `cacheAsTexture` static filtered layers (wrap in parent); set `filterArea`.
- RenderGroups for background / reels / HUD. `cacheAsTexture` for static frame, paytable; never toggle per frame.
- BitmapText for anything that changes (win counter, balance). `Text` re-rasterises + re-uploads on each change.
- ParticleContainer (v8) for coins/sparks/smoke: one FX atlas, only position dynamic, set `boundsArea`/`filterArea`. Measured: 2,000 smoke sprites + AlphaFilter 4.9 ms -> 1.15 ms.
- `interactiveChildren = false` on reels/FX; fixed `hitArea` on buttons. Cull only tall strips/off-screen layers.

## Hitches (spin start / big win / bonus)
- First use of a texture mid-spin = decode + upload stall. Load bundles (`load`, `base`, background `bonus`), then `renderer.prepare.upload(...)` / render once at alpha 0 before the scene shows.
- Texture GC evicts textures idle 3600 frames (~60 s): bonus art re-uploads next bonus. Raise `textureGCMaxIdle` or manage the bundle.
- Shader compile on first use (filters, Spine darkTint renderer): warm every path in the loader.
- Resizing a shared WebGL canvas mid-animation = GPU queue stall (we saw 50-400 ms at every spin start).
- `getImageData`/`toDataURL` on a GPU canvas = `ReadbackImagePixels` stall (~14 ms each). Do it at build time or `{willReadFrequently:true}`; warm one item per idle slot.
- Big allocations per frame -> GC pauses 10-50 ms on phones. Pool tweens/particles/points; no closures/spreads in the ticker.
- Audio: never HTML `<audio>` for SFX (lag after ~30 s, Discord). Howler sprites decoded at load; long music `html5: true`.

## DOM / CSS over the canvas
- Chrome samples every running Web Animation on the main thread each frame, scaled by keyframe count (105 idle wanders x 193 keyframes = ~9 ms/frame; 49 keyframes -> ~5 ms). Keep idle CSS animations short and few; pause off-screen ones.
- Animate only transform/opacity. A declared transform/opacity `transition` on an element can make its keyframe animations fail compositing even when idle - remove it. No box-shadow inside transform keyframes (move to ::after opacity). Cancel overlapping WAAPI animations on the same element.
- Never read layout (offsetWidth, getComputedStyle, animation getters) in a frame loop; batch DOM writes per rAF. Avoid `filter`/`backdrop-filter` over the animating canvas; animated `mask-position` repaints the layer every frame.
- Hundreds of per-element layers saturate the compositor; prefer one canvas for many moving pieces.

## Budgets (starting points, not standards)
iOS crashes come from ONE oversized atlas/texture, not total size. Nobody knows if the Engine CDN compresses - assume raw transfer. Load audio after the game starts; lazy-load extras but never visibly in menus.
JS+CSS <= ~2 MB; first playable 8-15 MB; total 10-20 MB (35-40 MB called too big for mobile); peak GPU textures <= ~150 MB on iOS; 15-30 animated skeletons on screen; idle symbols static.

## Workflow
1. Reproduce with replay + fixed event, capped device profile.
2. Trace; find the top long task / composite failure / frames-presented gap.
3. Change one thing; interleaved A/B >= 5 runs each; report medians and worst frame.
4. Keep the before/after numbers in the commit message.

## iPhone / WebKit: the MOBILE tier
The causes of iPhone reloads, the tier's detection code, what it drops and how to measure without a device are in the
`slot-ios-webkit-memory` skill - read it first. What the LAG side added (zeqpz/orleans 2ef6d35, "the mobile version is
very laggy on the iPhone"):
- **Results (iPhone 12 390x844 @3, 4x CPU throttle, same books, `tools/memprobe/lag.py`):** frame p95 idle 54.5 -> 12 ms,
  pops 79 -> 18, big win 103 -> 24 (worst 473 -> 73), bonus 73 -> 18 (frames > 33 ms 1122 -> 111). The CPU profile's top
  costs before were the character rig's skinning, layout reads, `getKeyframes` sampling of idle wanders (25 Multi slots
  + the frame), a star canvas and a candle flame. The zoom fit alone took the WebKit model at boot 647 -> 395 MB.
- **A background made for the phone, not the desktop plate cropped:** a 2:3 portrait painting composed for an upright
  screen (sky/moon above the board, a calm middle, simple dark ground under the bar) plus the 16:9 still for a phone on
  its side, ~0.4 MB WebP each. Two stacked paintings (16:9 above the board + a stretched one behind) read as "two split
  backgrounds" to the owner.
- **The preloader must be tier-aware.** A loader that collects every `url()` in the stylesheet fetches and holds art from
  rules that never apply - the 4K desktop plate (33 MB decoded) on a phone, the phone art on desktop. Filter by tier.
- **A canvas under a zoomed ancestor:** a `ResizeObserver` does NOT fire when only an ancestor's zoom changes, so a
  canvas sized before the fit stays tiny (a live candle flame drew 14 px for a 47 px box). Re-check
  `getBoundingClientRect() x DPR` against its buffer a couple of times a second in its draw loop.
- **Owner's call, overriding "no backdrop-filter on phones":** keep the frosted blur behind the bonus shop, the rules
  panel and the HUD pop-ups (one `backdrop-filter` layer while the game is at rest behind it); kill it everywhere else.
  A small signature effect (the skull candle's flame) can come back at 30 fps once it is sized right.
- On an upright phone, lay the bonus shop's cards out as wide rows (art | name, pips, words | price, button) instead of
  tall columns (131x315 -> 336x89 px) - "make the bonus boxes for mobile less vertical".

## The loading screen (measured 2026-11)
"The loading screen is bugged and takes forever" was two bugs: it waited for EVERY animated clip of every symbol (24-63 MB by screen), and the progress bar counted that whole download as ONE step of ~300, so it raced to 99.6% and sat there for 13 s.
- Wait only for what the first screen shows: pictures, sounds, fonts, the symbols' LANDING clips. Stream the hit / Multi / idle clips and the music preload AFTER the loader (a gate promise the loader resolves; replay mode opens it at once; a 25 s fallback). A clip that is not in yet must have a fallback (hold the rest pose).
- Weight the bar by bytes, not by count. Careful with `array.map(one)` when `one(promise, weight)` gains a second parameter: map passes the index as the weight.
- Cap it: `Promise.race([all, 30 s])` - nothing may hold the game shut; everything has a fallback.
- Log it: `?loadlog=1` prints when each piece came in (`[load] symbol landings 8256 ms`).
- Result, cold load at 20 Mbps / 60 ms (`tools/memprobe/loadtime.py`): phone 22.1 -> 9.6 s, desktop 22.2 -> 10.5 s.
- Measuring trap: sheets fetched inside a Web Worker escape BOTH the CDP network throttle and `performance.getEntriesByType('resource')` - a throttled test then looks fast. Give the worker path an off switch (`?sheetworker=0`) for measurement.

## Measuring tools in this repo (`tools/memprobe/`, stdlib CDP + headless Chrome; see its README)
`lag.py` frame times + CPU profile per scenario; `iosprobe3.py` the WebKit memory model through a boot or a replayed
round; `who.py` who owns the canvases and textures; `loadtime.py` a throttled cold load (bar over time, MB by kind);
`wkprobe.py` a replayed round in real WebKit. Probe gotchas: `memlib.console()` keeps only errors and warnings; a
features screen's body class can be set before it shows (wait for `#intro` gone instead); pass a desktop UA explicitly
for desktop runs; A/B against the committed build by serving it as `index_before.html` beside the new one.
