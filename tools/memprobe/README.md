# memprobe: measure what an iPhone holds for your game, without an iPhone

Used to fix the iPhone reloads in three Engine games (2026-11-16/17). The skill `slot-ios-webkit-memory` explains the causes and the fix; this folder is the measuring kit.

| file | what |
|---|---|
| `instr.js` | Injected BEFORE the page's own scripts (CDP `Page.addScriptToEvaluateOnNewDocument`, or Playwright `add_init_script`). Counts every 2D canvas and WebGL context (with the stack that made it), WebGL texture uploads (mip levels), ImageBitmaps (including worker-made ones handed to `texImage2D`, which Pixi keeps), decoded and created AudioBuffers, and `<img>` elements. WeakRefs throughout: force a GC (`HeapProfiler.collectGarbage`) before reading, or the counts include garbage. Exposes `__mem.quick()`, `startSampler(ms)` / `stopSampler()` / `peak`, `detail()` (per-canvas/texture/bitmap/buffer list), `pics()` (pictures the page shows vs only holds), `startFrames()` / `stopFrames()` (p50/p95/p99 frame time, frames > 20/33 ms, long tasks with their start). |
| `webkit_model.js` | Evaluate in the page for one sample of the layer part of the model, plus the totals from `instr.js`. |

## The WebKit memory model
```
total = 2D canvases (w x h x 4, in the DOM or not: each is an IOSurface on Cocoa)
      + WebGL drawing buffers (front + back + depth/stencil)
      + WebGL textures (+1/3 if mipmapped)
      + live ImageBitmaps
      + decoded pictures on displayed elements (file w x h x 4; held-only pictures are NOT decoded by WebKit)
      + layers WebKit is certain to make, at LAYOUT box x DPR^2 x 4 (offsetWidth x currentCSSZoom)
      + software filters (a drop-shadow that isn't last in the filter list)
audio reported beside it (decoded float samples)
```
- It is a **lower bound**: overlap layers aren't modelled. Use it for before/after on the same tool, not as jetsam's limit.
- A layer under `transform: scale()` costs its UNSCALED box. That is the point of the model: switch to `zoom` and watch the layers line fall.
- `webkit_model.js` also counts `position: fixed` elements (WebKit composites them). The game-specific probes added named overlays (e.g. a frame drawn over the canvases).

## Driving it (what the game repos' probes do)
- **Chrome over CDP**, stdlib Python, headless `--headless=new`:
  - `Emulation.setDeviceMetricsOverride {width: 390, height: 844, deviceScaleFactor: 3, mobile: true}`, plus `screenWidth/screenHeight` for Safari's toolbar (window 390x664 on a 844 screen).
  - An iOS 18.6 Safari or CriOS user agent.
- **Scenarios**:
  - boot: load, intro, features, first touch so audio opens, one spin;
  - each big moment in replay mode with a fixed book: big win, max win, tumbles, bonus, extreme bonus.
- **Profiles**: portrait, landscape, toolbar, CriOS. Run before and after interleaved, scenario by scenario.
- **Soak**: 150 live rounds with big books forced in; sample after each round and a GC. Everything flat except heap/nodes settling early.
- **Failure test**: make `getContext('2d')` return null and lose WebGL (`WEBGL_lose_context`) mid-round. Every round must reach its end on the same page.
- **Real WebKit**: `pip install playwright && playwright install webkit` in a throwaway venv. The iPhone 12 device profile gives WebContent + GPU process memory (a direction, not an iOS number), console errors and crashes.
- **Lag**: `Emulation.setCPUThrottlingRate {rate: 4}` + `startFrames()`. Report p95 and the worst frame per scenario, and long tasks at spin start.

Drivers in this folder (stdlib CDP via `../cdp.py`, `SLOT_MOCK` / `SLOT_FRONTEND` env; usage in `../README.md`):
- `iosprobe3.py`: the model through a boot or a replayed round;
- `lag.py`: throttled frame times + CPU profile;
- `who.py`: who owns the canvases and textures;
- `loadtime.py`: the loading screen on a throttled link;
- `wkprobe.py`: a round in real WebKit.

They assume the shared slot skeleton (`memlib.py: enter_game`). The per-game copies with more probes are in `tools/review/memprobe/` of fallslotsga, orleans and slotsgame:
- `soak3.py`, `failsafe.py`;
- `wkbonus.py` (bonus resume / back-to-back bonuses);
- `abshots.py` (A/B screenshots), `picfit.py` (largest drawn size of each picture).
