---
name: slot-ios-webkit-memory
description: Stop an HTML5 slot game reloading or crashing on iPhone (Safari AND Chrome/Firefox/Edge for iOS - all WebKit) inside Engine's casino iframe - the causes (transform-scaled layers, 2D canvases as IOSurfaces, ImageBitmap copies, oversized art, decoded audio, effect peaks), the light MOBILE tier that fixes them, how to measure without an iPhone (WebKit memory model, Playwright WebKit, soak, failure test), and what only a device can confirm. Use when a reviewer reports "the page repeatedly reloads" / "crashes during the bonus" on an iPhone, or before shipping any game to phones.
---

# iPhone / WebKit memory: why the page reloads, and the fix

From three Engine rejections fixed on 2026-11-16/17 (Tipsy Harvest, Voodoo on Bourbon, Smukiez & Skelly; reviewer device iPhone 12, iOS 18.6.4). Full numbers: `research/ios_webkit_memory_2026-11.md`. Tools: `tools/memprobe/`.

## What the symptom means
- **Every iOS browser is WebKit** (Chrome for iOS = CriOS, Firefox = FxiOS, Edge = EdgiOS). "Check both Safari and Chrome" is one engine with two user agents and two viewports.
- **A page that reloads by itself = the WebContent process killed by jetsam (over its memory limit).** It is not a JS error and usually not a leak. The game runs in Engine's casino page, in an iframe, in the same process, so its budget is smaller than a tab's.
- Reports arrive as "reloads every few seconds after a spin", "reloads shortly after launch", "takes longer now but still reloads" (= you cut a peak but not the baseline), "crashes in the bonus and again after reloading" (= the resumed round rebuilds the same peak).
- Check peaks first. A 150-round soak was flat in all three games: these were peaks at boot and at the big moments, not leaks.

## The causes, biggest first (measured)
1. **`#app { transform: scale(fit) }`.** WebKit backs a composited layer at its LAYOUT size x DPR^2 and never shrinks it for a transform-scaled ancestor. At fit 0.37 (portrait) every layer inside costs ~7x what it shows, ~11x in landscape. `#app` fading in at boot alone was 81-116 MB, and a 3D-tilted stage was 30 MB for the whole session. **Fix: CSS `zoom` instead of the transform on phones.**
2. **ImageBitmaps kept for WebGL.** Pixi keeps every ImageBitmap you upload (to re-upload after its texture GC or a lost context): a full second copy of every atlas, 144 MB in one game (232 MB with Safari's toolbar). On phones, `close()` them after upload, keep those textures out of Pixi's GC, and re-cut the atlases on `webglcontextrestored`.
3. **2D canvases.** On Cocoa every canvas is an IOSurface, in the DOM or not: 600-1,700 burst pieces, smears, rim copies and dissolves. Resizing one re-allocates it. Don't make them on phones, or pool a few and set `width = 0` to free a released one at once.
4. **Several WebGL contexts** (living background, character Pixi app, Pixi's own probe): each has drawing buffers + textures. The phone tier should have 0-1.
5. **Clips and art bigger than shown.** Atlases cut for "the biggest window this screen allows" (screen/window) are 1.27x too big each way under Safari's toolbar: a portrait board is as wide as the screen whatever the bars take. Symbols the math can't land were still loaded (40 MB). Interface art was 2-4x the pixels a phone draws.
6. **Whole-screen layers at the big moments**: camera moves on wall/character layers (12 MB each), win flashes, intro/features cross-fades (two full-screen layers at once), loading grain, `backdrop-filter`, 3D tilt, `will-change`, `position: fixed` scenery.
7. **Decoded audio**: 48 kHz float samples, all decoded at first touch (46-80 MB).

## The MOBILE tier (pattern used in all three games; desktop untouched)
Detect it in `<head>` before the body parses:
```js
window.IOS_WEBKIT = (() => {   // every iOS browser, incl. iPadOS asking for the desktop site
  const q = new URLSearchParams(location.search).get("ios");
  if (q === "1" || q === "0") return q === "1";
  const ua = navigator.userAgent || "", touch = (navigator.maxTouchPoints || 0) > 1;
  return /iP(hone|od|ad)|CriOS|FxiOS|EdgiOS/.test(ua) || (/Macintosh/.test(ua) && touch) || (navigator.platform === "MacIntel" && touch);
})();
window.MOBILE = (() => {
  const p = new URLSearchParams(location.search), q = p.get("mobile");
  if (q === "1" || q === "0") return q === "1";
  if (p.get("ios") === "1" || p.get("lite") === "1") return true;
  if (window.IOS_WEBKIT) return true;
  const ua = navigator.userAgent || "", touch = (navigator.maxTouchPoints || 0) > 1;
  // a small touch screen counts only when touch is its main pointer: a touch laptop stays desktop
  const small = Math.min(screen.width || 9999, screen.height || 9999) <= 820, coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  return touch && (/Android|Mobi|Tablet|Silk|Kindle/i.test(ua) || (small && coarse));
})();
window.PHONE = !!window.MOBILE && Math.min(screen.width || 9999, screen.height || 9999) <= 500;   // phone-size art
document.documentElement.classList.toggle("mob", window.MOBILE);
```
Switches: `?mobile=1|0`, `?ios=1|0`, `?mobart=1|0`, `?zoomfit=0` (transform fallback), `?perf=1` (frame-time HUD), plus per-feature switches (`?keepsrc=1`, `?clipres=1`, `?sheethold=0`) so A/B runs can isolate each saving.

On phones:
- **Zoom fit**: `#app { zoom: fit }`, so its layout box is the shown size. px and vh zoom like the transform scaled them, and `contain: layout` keeps fixed children hanging off #app. At the first fit, probe whether `getBoundingClientRect` comes back zoomed: older engines return unzoomed px, so scale them back for #app's pieces. If the engine has no `zoom` or doesn't zoom viewport units, keep the transform. Mark it `html.zfit` so a device can tell you which path it took.
- **Not loaded at all**: the character rig(s) (and Pixi if only they used it), the living background shader, live rim/glow shaders. Show the still painting.
- **Effects off**: particle bursts, smears, spray/smoke, camera moves, lean-in/3D tilt, wall hops, idle wanders, win flash/knock, glitch filters, icon rain, loading grain, every CSS `filter` and `backdrop-filter` (use a darker veil), blend-mode glows.
- **Kept**: every symbol's own land and win clips (the reviewer's animation bar still applies), win lines, counters, the win/bonus screens, the shop, all sounds. A signature effect can stay as ONE small sprite on a compositor animation (e.g. the cork).
- **One full-screen fade at a time**; cut screen-to-screen instead of cross-fading.
- **Canvases**: DPR <= 2, drawn at the size shown, never resized per pop, pooled. Clip atlases at the phone's shown size (or baked at a phone density); load only symbols the math lands; on demand when idles aren't needed (keep landings resident, cut win/Multi clips when the book says they'll play, drop them after).
- **Phone copies of the art** (a build script writes `assets/phone/` or `assets/lite/`, sized >= 10% over the biggest a phone draws, measured at 375x667, 390x844, 844x390, 440x956 @3). Swap them by rewriting the stylesheet in `<head>` before the body parses, so the full files are never fetched. Don't copy pictures drawn 3-5x down: the browser's own scaling looked sharper (PSNR 18-25 dB).
- **Audio**: `new AudioContext({ sampleRate: 32000 })` (a third less memory; keep loop points in seconds), at most two decodes at once, never decode sounds the phone doesn't use. Long music can be streamed through one `<audio>` into the same bus if exact sample-cut loops aren't needed.
- **Worker clip decoding**: fetch each sheet once, keep it compressed, reuse the workers (one game made 74 workers and re-downloaded each Multi sheet 23x through one bonus).

All tiers (no visible change):
- **Safety net**: one `gfxCtx()` wrapper null-checks every 2D context (a refused canvas drops that effect, never throws), and `webglcontextlost` sets `GFX.low` with one `console.warn`. **Never reload the page yourself.**
- **Resume past what was played** (bonus crash): post a marker as each free spin finishes (`/bet/event`, fire-and-forget). On reload, read `round.event` defensively, apply the earlier events silently (board, multipliers, totals, counter) and play on to end-round. The reviewer's "crashes again after reloading" was the resumed round rebuilding the same peak from spin 1.

## Measuring without an iPhone
- **WebKit memory model** (`tools/memprobe/`): headless Chrome over CDP, iPhone emulation at DPR 3, iOS Safari or CriOS UA, `instr.js` injected before the page. Sum, every ~0.5 s:
  - live 2D canvases (w x h x 4);
  - WebGL buffers and textures (+1/3 mipmapped);
  - live ImageBitmaps, including ones uploaded to textures;
  - decoded pictures on displayed elements;
  - the layers WebKit is certain to make, at LAYOUT box x DPR^2 x 4 (`offsetWidth x currentCSSZoom`);
  - software drop-shadows.

  Decoded audio is reported beside it. It is a lower bound (overlap layers aren't modelled), so use it for before/after, not as jetsam's number. Targets reached: boot 520 -> 134, 433 -> 68, 217 -> 88 MB.
- **Safari's toolbar viewport**: also run a 390x664 window on a 390x844 screen (`screenHeight` in `Emulation.setDeviceMetricsOverride`), plus landscape 844x390 and 750x340.
- **Playwright WebKit for Windows** (a real WebKit engine, in a throwaway venv): confirms layout, no crash, no reload, a clean console, and the direction of WebContent+GPU memory. Not iOS numbers.
- **Soak**: 150 live rounds with big books forced in. Per round after a GC, canvases, layers, bitmaps and audio must be flat. JS heap and DOM nodes may settle in the first ~40 rounds (history fills up), then flat.
- **Failure test**: refuse 2D contexts and lose WebGL mid-round. Big win, tumble and bonus must still reach PLAY AGAIN on the same page; restore the context and atlases come back.
- **Lag**: 4x CPU throttle, p95 frame time per scenario, long tasks at spin start (aim 0), worst frame in the big win.
- **Desktop proof**: A/B screenshots with `Math.random` seeded and animations held at their end. The diff must be no bigger than before-vs-before.
- **Cut a picture's resolution?** Prove it with PSNR against the browser's own scaling at the phone sizes.

## What only a real iPhone can confirm (say so in the report)
- Whether the reloads actually stop: Safari Web Inspector > Timelines > Memory, in Engine's player, at launch and through the bonus.
- Whether iOS takes the zoom path (`document.documentElement.classList.contains("zfit")`).
- Whether the 32 kHz context opens (fall back to the default rate).
- How the still wall and lighter clips look at 60 Hz on a 3x screen. `?perf=1` gives frame times on the device.
- Whether WebKit's own ~5-7 MB per free spin (seen in a bare WebKit too) matters on long bonuses.

## Process
1. Read the reviewer's words: launch, after a spin, during the bonus, "persists after reloading". Each points to a different peak.
2. Model the boot and every big moment, portrait/landscape/toolbar/CriOS, before -> after, interleaved runs.
3. Fix the biggest item, re-measure, repeat. Put the table in the commit message.
4. Soak, failure test, Playwright WebKit, desktop A/B, `review_checks` on both tiers.
5. Upload and publish only when the owner says so (see `stake-engine-publish`). The reviewer retests on a device.
