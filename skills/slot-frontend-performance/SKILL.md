---
name: slot-frontend-performance
description: Make an HTML5 slot frontend (PixiJS v8 / Spine / CSS+canvas, Stake Engine iframe) run smoothly on mid phones and high-refresh screens - renderer settings, batching, masks/filters, text, texture upload and GC, DOM/CSS compositor traps, and a measurement workflow (CDP traces, frames presented, interleaved A/B). Use when the game lags, hitches at spin start / big win / bonus, drains battery, or before shipping a build.
---

# Slot frontend performance

Sources: PixiJS v8 docs (performance-tips, render-groups, cache-as-texture, garbage-collection, particle-container), Esoteric spine-pixi docs, engine.io Discord 2025-2026, and four profiling passes on our own Stake games on this machine (2026-10). Full research: `Documents\fallslotsga\research\web_frontend_perf.md`, `research\discord\digest_*.md`.

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
