# HTML5 slot frontend performance: best practice for 2025-2026 (Stake Engine / PixiJS v8)

Researched 2026-11-08. Scope: static `index.html` builds served in the Stake Engine iframe, running on desktop and low/mid phones. Stack: PixiJS v8 + TypeScript (+ Svelte via web-sdk), Spine 4.2, Howler, Vite.

Each claim is tagged by how well it is supported:
- **[doc]**: confirmed against official docs during this session.
- **[vendor]**: a vendor's own claim, not independently benchmarked.
- **[unverified]**: from experience or memory, or not confirmed in a primary source. Check these before relying on them.

---

## TL;DR: ten things that matter most

1. **Stay on TS + PixiJS v8 with the WebGL renderer.** It is the default and the one Pixi recommends; WebGPU is labelled experimental. Use WASM only for offline math, never for the renderer. [doc]
2. **Cap the resolution: `resolution: Math.min(devicePixelRatio, 2)`** (1.5 on weak phones) with `autoDensity: true` and `antialias: false`. A DPR-3 phone at native resolution fills 9x the pixels of DPR 1. [doc: antialias advice] [unverified: the DPR cap is community practice]
3. **Cap the frame rate with `Ticker.maxFPS = 60`.** 120/144/165 Hz screens otherwise run every loop at panel rate, costing battery and heat. [doc]
4. **Pack symbols, UI and FX into a few atlases** so sprites batch, up to 16 textures per batch. Group objects by blend mode, because every blend-mode switch breaks the batch. [doc]
5. **Treat filters and sprite masks as the most expensive things in the scene.** Rectangle masks use scissor and are the cheapest. Glow and blur go into baked textures or `cacheAsTexture`. [doc]
6. **Use BitmapText for anything that changes**: win counters, balance, multipliers. Each change to a `Text` redraws a canvas and re-uploads it. [doc]
7. **Upload before you show.** Load with `Assets` bundles, background-load the bonus bundle, and call `renderer.prepare.upload(...)` before the scene appears. Never let the first win animation be the first draw of a texture. [doc: Prepare plugin] [unverified: exact v8 signature]
8. **Use the official `@esotericsoftware/spine-pixi-v8`** (the pixijs/spine-v8 repo was archived Feb 2026). Export binary `.skel`, keep mesh vertex counts low, avoid clipping attachments, and watch draw calls when slots switch blend modes. [doc]
9. **Use KTX2/Basis for large art, with a PNG/WebP fallback, produced by AssetPack.** WebP or AVIF only shrinks the download; a decoded RGBA8 texture still takes full GPU memory. [doc: setup] [unverified: transcoder details]
10. **Profile on a real mid-range Android** through `chrome://inspect` and on an iPhone through Safari Web Inspector. Desktop CPU throttling does not reproduce GPU fill-rate limits. [doc]

---

## 1. Language and runtime choice

### Recommendation: TypeScript + PixiJS v8 (WebGL default)

- **Renderer default.** PixiJS switched the `autoDetectRenderer` default from WebGPU to WebGL in v8.1.0 [doc]. The renderer guide marks WebGL "✅ Recommended" and WebGPU "🚧 Experimental".
  - https://github.com/pixijs/pixijs/releases/tag/v8.1.0
  - https://pixijs.com/8.x/guides/components/renderers
- **Current version** is v8.19.0 (June 2026) [doc]. Relevant additions:
  - `preference` accepts an array, e.g. `['webgl','canvas']`, which hard-excludes WebGPU.
  - WebGPU "transient" MSAA buffers cut mobile bandwidth.
  - A workaround for an iOS 18.0-18.1 WebKit mip bug.
  - ParticleContainer particles now inherit ancestor blend modes. This is a behaviour change: check any FX under an `add` parent.
  - Source: https://pixijs.com/blog/june-2026
- **Stake's own web-sdk** uses Svelte 5 + PixiJS 8 + Howler, so Pixi v8 matches the platform reference stack [doc]. https://github.com/StakeEngine/web-sdk

### Alternatives

| Option | Verdict for a 2D slot |
|---|---|
| **Phaser 4** (released April 2026 [vendor]) | Viable. It has a new RenderNode architecture, index-buffer drawing, and a GPU-driven `SpriteGPULayer` claimed at "100x" for huge static sprite counts [vendor]. It is a full game framework (scenes, physics, input) you don't need for a slot. Spine support goes through Esoteric's spine-phaser runtime. There is no reason to migrate an existing Pixi codebase. https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games · https://phaser.io/news/2026/05/phaser4-spritegpulayer-performance |
| **Raw WebGL2 / WebGPU** | Only worth it if Pixi's batcher is provably your bottleneck, and it almost never is for a slot: 5x3 to 6x7 grids, a few hundred sprites. You lose Spine runtime integration, text and the asset loader. |
| **Rust/WASM renderers** (Bevy, macroquad, wgpu) | Not worth it. WASM builds start at hundreds of KB and reach multiple MB (Bevy) [unverified: exact sizes]. Every draw still goes through the same WebGL/WebGPU calls, and the JS-WASM boundary adds overhead to frequent small calls. Load time and memory get worse while GPU time stays the same. |
| **PlayCanvas** | A 3D-first engine with editor-centric tooling and a heavier runtime. Overkill unless the game is really 3D. |
| **Canvas2D** | Keep only as Pixi's fallback renderer. Spine's canvas path drops tint-black, slot objects and blend modes [doc: spine-pixi docs]. |

### Is WASM worth it for a 2D slot?

- **Client:** almost never. A Stake slot does not compute outcomes on the client; the RGS returns a pre-generated "book" (event list). Client CPU goes to the scene graph, Spine skinning, tweens and particles. All of these fit comfortably in JS at slot scale.
- **Where WASM can help:**
  1. **Offline math** (simulation and optimisation). Stake's math-sdk already uses Rust for its optimiser.
  2. **Particle simulation at 50k+ particles with heavy per-particle logic.** Even here, Pixi's own million-particle demo was limited by JS movement logic, not rendering [vendor] (https://pixijs.com/blog/particlecontainer-v8). Moving the simulation into a shader or a WebGPU compute pass is usually a better step than WASM.
  3. **Decoders.** The Basis/KTX2 transcoder already ships as WASM.
- **Verdict:** keep WASM to the math pipeline and the texture transcoder.

### WebGPU vs WebGL on mobile Safari (2026)

- **WebGPU ships on by default** in Safari 26 (iOS/iPadOS/macOS/visionOS 26, released September 2025). https://web.dev/blog/webgpu-supported-major-browsers · https://appdevelopermagazine.com/webgpu-in-ios-26/
- **The 26.x releases had real WebGPU bugs** [doc: WebKit Bugzilla]:
  - Canvas flicker on iOS 26.2: https://bugs.webkit.org/show_bug.cgi?id=301627
  - Instanced-mesh crash on iOS 26.0/26.1, fixed upstream December 2025: https://bugs.webkit.org/show_bug.cgi?id=302711
  - Command-buffer submission instability, reportedly better in 26.4: https://bugs.webkit.org/show_bug.cgi?id=311598
  - Device-lost reports under Emscripten builds: https://github.com/ocornut/imgui/issues/9103
- **There is a long tail of iOS 17/18 devices without WebGPU.** One forum claim says WebGPU needs an iPhone 15 Pro or later [unverified: not from Apple].
- **Recommendation:** ship `preference: 'webgl'`. Treat WebGPU as an A/B experiment behind a URL flag. Re-evaluate once Pixi drops the "experimental" label.

---

## 2. PixiJS v8 performance checklist

Primary sources:
- https://pixijs.com/8.x/guides/concepts/performance-tips
- https://pixijs.com/8.x/guides/concepts/render-groups
- https://pixijs.com/8.x/guides/components/scene-objects/container/cache-as-texture
- https://pixijs.com/8.x/guides/concepts/garbage-collection

### Init

```ts
await app.init({
  preference: 'webgl',
  resolution: Math.min(window.devicePixelRatio, 2), // 1.5 on low tier
  autoDensity: true,
  antialias: false,           // doc: recommended off on older mobile
  // useContextAlpha:false also recommended on old mobile in the perf-tips page
  powerPreference: 'high-performance',
  backgroundAlpha: 1,          // opaque canvas: cheaper compositing in the iframe [unverified]
});
app.ticker.maxFPS = 60;        // doc: maxFPS caps the ticker; 0 = uncapped
app.ticker.minFPS = 30;        // doc: clamps deltaTime so a hitch doesn't teleport tweens
```

- **Device tiers.** Pick the tier at boot from `navigator.hardwareConcurrency`, `deviceMemory` (Chrome only), the renderer's `maxTextureSize`, and the first few seconds of measured frame times. Lower `resolution` and drop optional FX on the low tier. [unverified: heuristic]

### Batching and textures

- **Sprite batching.** Sprites batch across up to 16 textures (hardware-dependent). This is the fastest path. Keep the total texture count low with spritesheets. [doc]
- **Draw order matters.** Sprite, Graphics, sprite, Graphics breaks batches. So does alternating blend modes: alternating screen/normal sprites makes 4 draw calls where grouping them makes 2. [doc]
  - In a slot, keep every additive glow layer in one container above the symbols, not interleaved per symbol.
- **Graphics** batch below roughly 100 points and are cheap when static. Hundreds of complex Graphics are slow; turn them into textures with `renderer.generateTexture`. [doc]
- **`@0.5x` atlases.** Name a half-resolution sheet `@0.5x` and Pixi scales it automatically. Ship 0.5x/1x sheets and choose with `texturePreference.resolution`. [doc]
- **Destroying textures.** When destroying many at once, stagger them with a random delay to avoid a freeze. [doc]
- **Texture GC.** The settings are `textureGCActive` (default true), `textureGCMaxIdle` (default 3600 frames), and `textureGCCheckCountMax` (default 600). [doc]
  - With a 60 fps cap, idle bonus textures are evicted after about 60 s and then re-uploaded on the next bonus. That re-upload is a hitch source.
  - Either raise `textureGCMaxIdle` or manage the bonus bundle explicitly with `Assets.unloadBundle` and a re-prepare.
- **Freeing GPU memory only:** `texture.source.unload()` frees the GPU copy and keeps the CPU source. [doc]

### RenderGroups and cacheAsTexture

- **RenderGroups.** `new Container({ isRenderGroup: true })` moves transform, tint and alpha for the subtree to the GPU, so moving the whole group is nearly free. They work best when the structure is static. [doc]
  - Natural split: background/frame, reels, and HUD, as separate groups.
  - Too many groups hurts; profile before and after.
- **cacheAsTexture.** `container.cacheAsTexture({ resolution, antialias })` replaced v7's `cacheAsBitmap`. Call `updateCacheTexture()` after a change and never toggle it on and off. [doc]
  - Containers larger than 4096x4096 may fail to cache.
  - Each cache costs GPU memory.
  - Filters inside cached content can misbehave: wrap the filtered item in a parent and cache the parent.
  - Good targets: the static reel frame, the paytable, and a filtered logo.
  - Reels that are spinning are not good targets.

### Filters and masks

- **Mask cost, cheapest first:** axis-aligned rectangle (scissor), then Graphics (stencil), then sprite masks (filter-based, "very expensive"). Hundreds of masks slow the scene. [doc]
  - Use rectangle masks for reel windows.
- **Filters.** Set `filterArea` when you know the bounds, and use `container.filters = null` to free memory. [doc]
- **Real-time blur/glow** on full-screen or per-symbol layers is the most common fill-rate killer on phones.
  - Bake glow into the atlas, or use one additive sprite.
  - If you need a live shader, run it once on a cached render texture.
- **CSS filters** on the canvas or overlay DOM (`filter: blur`, `backdrop-filter`) force extra compositor passes. Avoid them over an animating canvas. [unverified: general browser behaviour]

### Culling and events

- **Culling is off by default.** Enable it with `cullable = true`. It helps when GPU-bound and hurts when CPU-bound. [doc]
  - A slot scene is mostly on-screen, so cull only tall reel strips and off-screen bonus layers.
  - Prefer `visible = false` / `renderable = false` for layers you know are hidden.
- **Event traversal.** Set `interactiveChildren = false` on containers with no interactive descendants (reels, FX), and give buttons a fixed `hitArea`. [doc]

### ParticleContainer v8

- **Basics.** Use `new ParticleContainer({ dynamicProperties: { position: true, scale: false, rotation: false, color: false } })` with lightweight `Particle` objects and `addParticle`. [doc] https://pixijs.com/blog/particlecontainer-v8
  - Only position is dynamic by default.
  - Each dynamic property is re-uploaded every frame.
  - It is claimed to be more than 3x faster than v7 [vendor].
- **Constraints** [unverified]:
  - All particles share a single texture source, so use a single FX atlas.
  - Set a fixed `boundsArea`, because the container does not compute bounds.
  - Particles cannot have children or filters.
- **Use it for:** coin showers, sparks, confetti, smoke. Pool particles and do not allocate per frame.

### Text

- **`Text`** re-rasterises a canvas and re-uploads on every change. **BitmapText** suits frequently changing text. Lowering text `resolution` saves memory. [doc]
  - For a rolling win counter, `BitmapText` with a prebuilt font from AssetPack's webfont/msdf output or `BitmapFont.install` is the right choice.
  - **Throttling the counter's string updates** to about 30 Hz is fine visually. [unverified]

### GC churn

- **Allocation in the hot path.** Pool objects. Don't allocate in ticker callbacks: no `new Point`, closures, array spreads or `{...}` per frame. Avoid `Promise`/`async` chains per symbol per frame. [doc: pooling advice] [unverified: specifics]
- **Measuring.** On phones, major GC pauses show up as 10-50 ms hitches. Check the Performance panel's "Major GC" events and the JS heap sawtooth.

### Assets and loading

- **Bundles.** Define bundles in a manifest (AssetPack writes it): `load` for boot, `base`, then `bonus`.
  - Await `Assets.loadBundle('load')`, then `base`.
  - Start `Assets.backgroundLoadBundle('bonus')` once idle.
  - At bonus trigger, `await Assets.loadBundle('bonus')`, which returns immediately if already loaded, then prepare-upload before the transition.
  - [doc: Assets API exists; the bundle names are a suggestion]
- **Prepare.** The Prepare plugin "pre-loads textures in a final step before displaying your project" [doc]: https://pixijs.com/8.x/guides/components/textures
  - Pattern: `await app.renderer.prepare.upload(container)` [unverified: exact v8 signature; older docs show a callback form].

---

## 3. Animation approaches, ranked for a slot

Ranked by performance/quality fit for a 2D slot frontend (my synthesis; there is no head-to-head benchmark of Spine, Rive and Lottie on the web):

1. **Spine 4.2 via `@esotericsoftware/spine-pixi-v8`.** Best quality per KB for characters and symbol animations. Renders through Pixi's batcher on WebGL and WebGPU. [doc]
   - **Install** `@esotericsoftware/spine-pixi-v8@~4.2.0`; the runtime's major.minor must match the editor export.
   - **Pixi version.** The current docs say "PixiJS 8, minimum 8.16" [doc]. An earlier announcement said 8.4, so check the requirement for your pinned runtime version.
   - **pixi-spine** (pixijs/spine-v8) was **archived on 2026-02-04** and points to the official runtime [doc]: https://github.com/pixijs/spine-v8
   - **Perf tips from the docs** (https://esotericsoftware.com/spine-pixi):
     - Prefer binary `.skel` over JSON.
     - Instances created from one asset key share `SkeletonData`.
     - Use a bounds provider (`SetupPoseBoundsProvider` / `AABBRectangleBoundsProvider`) instead of the default dynamic bounds, which are recalculated on every `getBounds`.
     - `darkTint` (tint black) switches to a heavier renderer whenever any slot uses it.
     - In v8 meshes no longer have v7's 100-vertex batching limit.
     - `autoUpdate: false` plus a manual `update(dt)` lets you stop idle symbols ticking at all.
   - **Draw-call caveat.** A forum user reported about 60 draw calls for 20 skeletons after moving from pixi-spine to spine-pixi-v8, caused by blend-mode switching between slots. https://esotericsoftware.com/forum/d/29092 [unverified: no official resolution seen]
     - Keep additive slots contiguous in draw order, or split additive FX into a separate skeleton or layer.
2. **Sprite sheets (AnimatedSprite).** Cheapest CPU and fully predictable, but they cost the most memory and download per second of animation.
   - Best for short FX loops (sparkles, explosions) and anything with heavy per-pixel painterly change that Spine can't deform.
   - Keep them in KTX2 if large.
3. **Shader effects** (custom `Filter` / `Mesh` shaders). Very cheap when applied to one quad or mesh: shimmer, UV scroll, dissolve, heat haze. Very expensive as full-screen post filters.
   - Warm-compile shaders at load (see section 5).
4. **Rive** (WASM runtime, own renderer). Strong for interactive UI and state machines, and it claims files 10-15x smaller than Lottie [vendor]. https://rive.app/blog/rive-as-a-lottie-alternative
   - It does not render into Pixi's batch, so you end up compositing a second canvas or texture. It adds a WASM runtime download [unverified: size].
   - Verdict: not worth it for in-reel art; only possibly for menus.
5. **Lottie** (lottie-web / dotLottie). Designer-friendly, but SVG/canvas rendering is CPU-heavy and lacks Pixi integration. Avoid it in-game.
6. **DragonBones.** Effectively unmaintained and has no maintained Pixi v8 runtime [unverified]. Avoid it.

### Mesh and bone budgets

- **Cost model.** Spine cost is CPU-side: world transforms per bone, plus vertex transforms for every weighted mesh vertex (vertices x bones-per-vertex), plus clipping.
  - Clipping attachments are by far the most expensive feature, because they do CPU polygon clipping per triangle each frame [unverified: general Spine guidance, not stated on the pixi page].
  - Physics constraints (4.2) add per-frame cost too.
- **Measure in the editor.** Use the Metrics view (Spine Editor), which shows bones, constraints, vertices and clipping. Esoteric's standing advice is to reduce vertex counts.
- **Suggested budget for a mid phone at 60 fps** [unverified: experience-based starting point, profile to confirm]:
  - Total animated skeletons on screen at once: 15-30.
  - Per symbol skeleton: under 30 bones and under 300 deformed vertices.
  - Total weighted vertices animated per frame: under about 10k.
  - Zero clipping in symbols.
  - Idle symbols paused or showing a static frame.
  - Big-win or character skeletons can be heavier, because they run when the grid is mostly static.
- **Static symbols.** When an animated symbol is idle, swap the Spine object for a plain Sprite of the setup pose: same atlas, zero CPU.

### Tweening

- **GSAP 3.13+ is now 100% free**, Club plugins included, with commercial use allowed apart from a "competitive visual-builder products" clause [doc]. https://webflow.com/blog/gsap-becomes-free
  - It has an excellent timeline API and drives Pixi through plain property tweens or the PixiPlugin.
  - Drive GSAP from Pixi's ticker so all animation shares one rAF: `gsap.ticker.remove(gsap.updateRoot)` then `app.ticker.add(() => gsap.updateRoot(performance.now()/1000))`, or set `gsap.ticker.lagSmoothing` [unverified: wiring pattern].
- **Lighter options:** `@tweenjs/tween.js` (tiny), `motion`, or a custom tween pool of about 100 lines.
  - Custom tweens make sense where GC churn matters, e.g. hundreds of per-symbol tweens per spin: preallocated tween objects, no closures.

---

## 4. Asset pipeline

### Textures

- **KTX2/Basis in Pixi v8** [doc]: https://pixijs.com/8.x/guides/components/assets/compressed-textures
  - Import `'pixi.js/ktx2'` (or `'pixi.js/basis'`) before any `Assets.load`.
  - In the manifest, list sources in order `bg.ktx2, bg.basis, bg.png`; Pixi picks the first format the device supports.
  - Transcoder path configuration and WASM hosting are not covered on that page [unverified]. Pixi exposes `setKTXTranscoderPath` / `setBasisTranscoderPath`, but I did not confirm the names in v8 docs.
  - A v8-RC discussion reported only the PNG loading: https://github.com/pixijs/pixijs/discussions/10222. Test on real iOS and Android.
- **Why KTX2 matters for slots: GPU memory.**
  - A 4096² RGBA8 atlas is 64 MB of VRAM, about 85 MB with mips.
  - ETC1S/UASTC transcode to ASTC/ETC2/BC7 at 8 bpp or less, a 4x saving. ETC1S can go lower on file size at some cost in quality. [unverified: standard figures]
  - Use UASTC for symbols and characters (quality) and ETC1S for backgrounds (size).
- **WebP/AVIF.** These only cut download size. AVIF decodes more slowly on the CPU, which matters for many large images on low phones [unverified]. WebP is the safe default for PNG-fallback sources.
- **Atlas size.** Keep atlases at 2048² or below for low-tier devices; 4096² is fine on modern iOS and Android [unverified]. Check `gl.MAX_TEXTURE_SIZE` at boot.

### Packers

- **AssetPack (official, `@assetpack/core`, Node ≥20)** [doc]. Recommended: one config produces atlases, resolutions, compressed variants, audio transcodes and the Pixi manifest.
  - Docs: https://pixijs.io/assetpack/
  - Install: https://pixijs.io/assetpack/docs/guide/getting-started/installation
  - Built-in plugins: TexturePacker, Compression (webp/avif/ktx2/basis), Mipmaps (resolutions), Audio & FFmpeg, Spine, Webfonts, JSON, Manifest, Cache Buster.
  - Config: `.assetpack.js` with `pixiPipes({...})` from `@assetpack/core/pixi`.
  - It can run from Vite (the plugin usage is on the Vite guide page; not checked).
- **TexturePacker** (paid). The best packer: polygon packing and multipack. AssetPack's texture-packer is free-tex-packer based [unverified].
- **free-tex-packer** (free GUI/CLI). Fine; AssetPack covers it.

### Audio (Howler)

- **Use audio sprites for SFX**: one file with `sprite: { name: [offsetMs, durMs] }`, which cuts requests and decode calls.
- **Music: `html5: true`.** With Web Audio, Howler decodes the whole file to PCM. One minute of stereo 44.1 kHz float audio is about 21 MB, so long music under Web Audio costs a lot of memory on phones. Streaming through `html5: true` avoids the full decode. [unverified: per Howler docs and arithmetic]
- **Formats on iOS:**
  - WebM/Opus support on Safari has been inconsistent. One WebKit comment says it is consistent from Safari 17.4. Other reports show iOS 17 failures and blob-URL failures.
  - https://bugs.webkit.org/show_bug.cgi?id=238546 · https://bugs.webkit.org/show_bug.cgi?id=245428
  - Ship `['webm', 'm4a']` (Opus first, AAC fallback), or simply AAC `.m4a` plus MP3. Howler picks the first format it can play.
  - Never load audio through blob URLs on iOS.
- **Unlock and lifecycle.** Unlock audio on the first user gesture, which Howler handles. Suspend the AudioContext when `document.hidden` to save battery.

### Fonts

- **Custom fonts.** Preload with `<link rel="preload" as="font" crossorigin>`, subset to the glyphs you use, and ship WOFF2. Wait for `document.fonts.load(...)` before creating any `Text`.
- **Counters** should use a BitmapFont baked at build time (AssetPack Webfonts/MSDF).

### Lazy-loading and budget

- **Boot path.** Show a minimal loader (well under 100 KB) and load the base game. Background-load bonus, big-win and paytable art.
- **Suggested budget** [unverified: industry rule of thumb; check Stake's upload limits separately]:
  - About 2 MB or less gzip of JS+CSS: Pixi v8 tree-shaken plus the Spine runtime is roughly 400-700 KB minified.
  - About 8-15 MB first-playable assets.
  - About 30 MB or less total download.
  - Peak GPU texture memory of 150 MB or less, so iOS Safari doesn't kill the tab in an iframe.
- **Pixi imports.** Import only the modules you need (`pixi.js` v8 supports tree-shaking with extension imports such as `pixi.js/ktx2`).

---

## 5. Profiling workflow

### Tools

- **Chrome DevTools Performance panel** (https://developer.chrome.com/docs/devtools/performance). Record a spin and a big win.
  - Look for long tasks, "Major GC", "Recalculate Style/Layout" (DOM HUD), and GPU raster or "Image Decode" during the spin.
  - Enable "Screenshots" and the frames lane to see dropped frames.
- **Android on a real device** (https://developer.chrome.com/docs/devtools/remote-debugging): USB debugging, then `chrome://inspect#devices`, then Inspect.
  - For scripted capture, use `adb forward tcp:9222 localabstract:chrome_devtools_remote` and CDP.
- **iOS:** Safari Web Inspector over USB (enable Develop on the Mac and Web Inspector on the iPhone). The Timelines tab has JS and rendering frames.
  - https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios [unverified: URL not fetched]
- **CPU throttling 4x/6x** catches JS-bound problems but not fill rate.
  - Simulate fill-rate limits by temporarily rendering at DPR 3, or test on a real 2021-2022 mid Android (Mali/Adreno 6xx).
- **Spector.js** (https://spector.babylonjs.com/, https://github.com/BabylonJS/Spector.js): captures one WebGL frame and lists every draw call, texture bind, state change and shader.
  - Use it to count draw calls per frame. Target under 30-50 on mid phones [unverified: heuristic].
  - Use it to spot batch breaks, e.g. from Spine blend switches.
- **PixiJS Devtools** (official extension): https://github.com/pixijs/devtools, docs at https://pixijs.io/devtools.
  - Hook it up with `initDevtools({ app })` from `@pixi/devtools`, or by setting `window.__PIXI_DEVTOOLS__ = { pixi, app }`.
  - It inspects the scene graph and textures. v8 support is likely given the active repo, but no explicit version matrix was found [unverified].
- **Memory.** Heap snapshots in DevTools Memory catch leaks from undestroyed containers and listeners.
  - Check GPU memory with Pixi devtools' texture list, or by summing `texture.source.width*height*4`.
  - Do 50 spins and two bonuses, then compare snapshots.
- **Frame-time HUD.** Build an in-game HUD that records frame time p50/p95/p99 and counts frames over 20 ms per spin, gated by `?perf=1`. It is the only reliable metric on iOS where you can't attach tools easily.

### Common slot jank sources and fixes

| Source | Fix |
|---|---|
| **First use of a texture mid-spin**: decode and upload hitches of tens to hundreds of ms on big atlases | Prepare-upload every bundle before its scene appears. Warm the big-win layer by rendering it once at alpha 0 or off-screen during the loader [unverified technique]. |
| **Texture GC evicting bonus art** and re-uploading on the next bonus | Raise `textureGCMaxIdle`, or manage bonus textures explicitly. |
| **Shader compile or link on first use**: filters, Spine dark-tint renderer, custom shaders | Warm up at load by rendering each filter/shader path once. `KHR_parallel_shader_compile` helps in Chrome only if you poll before querying uniforms; Safari has been reported to block anyway. https://developer.mozilla.org/docs/Web/API/KHR_parallel_shader_compile · https://bugs.webkit.org/show_bug.cgi?id=251514 |
| **DOM HUD over the canvas**: layout thrash from updating `textContent`/`style` and reading `offsetWidth` in the same frame; `backdrop-filter` panels | Batch DOM writes in one rAF and never read layout in the ticker. Prefer Pixi-drawn HUD (BitmapText), or keep DOM to static menus. Avoid CSS filters and blur over the canvas. |
| **`Text` updates for counters** | Use BitmapText. |
| **Sprite masks and filters per symbol** | Use rectangle masks and baked glow. |
| **Uncapped rAF on 120-165 Hz panels** | `ticker.maxFPS = 60`, and drive GSAP and Spine from the same ticker. |
| **`getImageData` / canvas readbacks** to build FX at runtime | Do it at build time. If unavoidable, use `willReadFrequently: true` on the 2D context. |
| **Burst allocation on win evaluation**: arrays per symbol per frame | Pool objects and preallocate tweens and particles. |
| **Many simultaneous Spine skeletons all ticking** | Pause idle ones and swap them for sprites. |
| **Audio decode on first play** of a long file | Decode SFX sprites at load and stream music with `html5: true`. |

---

## 6. Open-source kits and repos

| Repo / package | URL | Verdict |
|---|---|---|
| StakeEngine **web-sdk** (Svelte 5, PixiJS 8, Turbo/pnpm, XState, Howler; sample games cluster/lines/ways/scatter/price) | https://github.com/StakeEngine/web-sdk | The reference for book/event handling and RGS flow. Borrow its patterns (`sequence()` event playback, `pixi-svelte`) even if you don't adopt the whole monorepo. Storybook on Windows can take about 15 min on first load. |
| StakeEngine **ts-client** (npm `stake-engine`, BETA) | https://github.com/StakeEngine/ts-client | A small RGS client: `Authenticate/Play/EndRound/Event`, amount helpers, and `balanceUpdate`/`roundActive` events. Use it, or mirror it, for wire calls. |
| StakeEngine **math-sdk** (Python ≥3.12 + Rust optimiser) | https://github.com/StakeEngine/math-sdk · docs https://engineio.github.io/math-sdk/ | The official math pipeline: sims, then books plus lookup tables, then the optimiser. Required for publishing. |
| Stake RGS docs | https://stake-engine.com/docs/rgs | Wire format. |
| **@esotericsoftware/spine-pixi-v8** | https://esotericsoftware.com/spine-pixi · https://github.com/EsotericSoftware/spine-runtimes | The official Spine runtime for Pixi v8. Use this one. |
| pixijs/spine-v8 (pixi-spine) | https://github.com/pixijs/spine-v8 | Archived Feb 2026. Migrate off it. |
| @pixi/spine-pixi (community port) | https://npmjs.com/package/@pixi/spine-pixi | Lacks dark tint. Superseded. |
| **AssetPack** | https://pixijs.io/assetpack/ | The asset pipeline to standardise on. |
| **PixiJS Devtools** | https://github.com/pixijs/devtools | Scene and texture inspection. |
| **pixijs-skills** (official agent skills, bundled in `pixi.js` ≥8.19 at `node_modules/pixi.js/skills/`) | https://github.com/pixijs/pixijs-skills | Useful when coding with agents, to keep v8 API usage correct. |
| **Spector.js** | https://github.com/BabylonJS/Spector.js | WebGL frame capture. Essential. |
| **GSAP** (free) | https://gsap.com | The best timeline tweening; now free. |
| tween.js | https://github.com/tweenjs/tween.js | A tiny alternative. |
| Howler.js | https://github.com/goldfire/howler.js | Standard audio. It is effectively in maintenance mode [unverified]. |
| Phaser 4 | https://phaser.io | Only if starting a fresh non-Pixi project. |

Searching found no maintained "Pixi v8 slot machine" example repo better than Stake's web-sdk sample apps. Pixi's old v7 "slots" example in the docs examples is a toy [unverified for v8].

---

## 7. Math workflow (brief)

- **Pipeline.** math-sdk (Python 3.12) runs simulations and writes books plus lookup tables (weights per book). The Rust optimiser (Cargo) reweights books to hit the target RTP and hit rate per mode. Publish the books and LUTs. [doc] https://github.com/StakeEngine/math-sdk
- **Where performance matters:**
  - Board generation and win evaluation over millions of sims, in Python loops.
  - Vectorise with NumPy, or JIT the evaluator with **numba** (`@njit` on pure-array functions, typically 10-100x over pure Python) [unverified: typical figure].
  - Or write the evaluator in Rust behind PyO3.
  - The optimiser is already Rust.
  - Parallelise sims across processes; the math-sdk supports threads/batches.
- **Verifying RTP and hit rate.** Don't trust a fresh Monte Carlo; compute exactly from the final LUT:
  - `RTP = Σ(w_i · payout_i) / (Σ w_i · cost)`
  - `hit rate = Σ_{payout>0} w_i / Σ w_i`
  - The max-win frequency comes from the weights of capped books.
  - Then run an independent replay of N rounds sampled by weight, with a standard-error check: `SE = σ/√N`, and it should agree within ±3 SE.
  - Check per mode, including buy-feature cost multipliers.
  - Check volatility (σ) and the distribution of payouts by bucket, not just the mean.

---

## Not verified in this session

- The exact v8 signatures for `renderer.prepare.upload`, KTX2 transcoder path configuration (`setKTXTranscoderPath`), and the ParticleContainer single-texture and `boundsArea` constraints. Check these in the v8 API docs at https://pixijs.download/release/docs/.
- Whether spine-pixi-v8 4.2.x really requires Pixi ≥8.16; the doc says 8.16 and an older announcement said 8.4.
- The Spine blend-mode draw-call regression has no official fix confirmed.
- No independent Spine/Rive/Lottie runtime benchmark exists. The Phaser 4 "100x SpriteGPULayer" figure and Pixi's "3x ParticleContainer" are vendor claims.
- iPhone model requirement for WebGPU, and whether the Safari 26.x WebGPU bugs listed are fixed in current 26.x releases.
- Consistent WebM/Opus support on iOS Safari.
- Stake Engine's frontend size limits.
- All budget numbers (bones, vertices, draw calls, MB) are experience-based starting points, not sourced standards.
