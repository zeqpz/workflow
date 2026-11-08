# Stake Engine Discord digest: efficient slot frontends (dump of Sept 2026)

Source: local JSON scrape files (not published) (messages dated 2025-04-23 to 2026-09-12), plus the two earlier `frontend_anim_digest*.txt` files.

Channel tags used below:
- **FE** = frontend-sdk-discussion (about 3,300 msgs)
- **MATH** = math-sdk-discussion (about 4,700)
- **RGS** = rgs-docs-discussion (about 1,000)
- **MN** = mnemoo-tools-discussion
- **SDT** = stake-engine-dev-tool
- **CH** = community-help-threads

Staff and near-staff voices: Carrot Sticks (math/RGS engineer, wrote the optimizer), Hayden (reviews/ops), rob (RGS, founder), Dylan (web-sdk), "I Am The House" (ts-client author). Kuopionkansleri, Isaac, mnemoo and Cain are prolific community helpers, so treat their claims as experienced but unofficial.

Note: the dump contains reply previews that duplicate the quoted message under the replier's name, so a few "author" attributions in the raw data are off. Where it mattered, attributions below were checked against the original poster.

---

## 1. Languages, frameworks and stacks

**Official stack**
- The official web-sdk is a pnpm + Turborepo monorepo. It uses TypeScript, Svelte/SvelteKit, `pixi-svelte` (PixiJS wrapped as Svelte components), Storybook, an xstate state machine (`packages/utils-xstate/src/createPrimaryMachines.ts`), and Howler via a `utils-sound` wrapper. Spine runtime 4.2.x (pixi-spine). FE, Erwin P, 2025-07-07; Dylan, 2025-06-30; iNumLocks, 2026-06-05.
- The web-sdk is not a consumable SDK. Teams clone or fork it and live inside it, which makes pinning versions per game and pulling upstream painful (TearsOfSoy, FE 2025-07-17).
- The sdk's original author was pulled back to Stake/Kick. Staff said they would back a community-run fork (I Am The House, FE 2025-09-16). Replay support arrived as a community PR, web-sdk PR #22 by Izi (FE 2025-11-26). The SDK has since lagged: it is still on Spine 4.2 while animators moved to 4.3 (WSM, FE 2026-05-31).

**Any framework is allowed**
- Staff and community agree on this repeatedly: anything that compiles to a static `index.html` + assets bundle is allowed. Reported in use: Vue+Pixi, React+Pixi (with the official ts-client), React+Tailwind DOM-only, pure DOM, Phaser, Three.js for 3D. Sources: ENG answer, FE 2025-08-16; tman 2025-08-17/18; Jean (Cataclysm) 2026-03-21; Ashlad 2026-01-16; Kuopionkansleri 2026-04-23 ("pixi is industry standard, but Stake has never required it").
- Isaac (FE 2025-11-25) says he never used the web-sdk. His stack is plain Pixi + TS + Vite against a local math library, with the RGS wired in last.
- **Vite + Svelte (not SvelteKit)** is recommended to avoid SvelteKit base-path pain. The CDN nests files two levels deep (`<cdn>/<gameUUID>/<version>/index.html`), so set `base: "./"` in vite.config and use relative paths everywhere (staff ENG reply, FE 2025-07-26, linking sveltejs/kit#9569). Absolute `/assets/...` paths make the CDN try to load from the stake-engine root and return 403/404. Fix with `./assets/...` (afk 2025-11-10; Mala 2026-05-24; Philippe 2025-07-26).
- **Unity and Godot are effectively out.** Unity's WebGL build is heavy, and Unity needs a separate gambling license (ArtVandelay, FE 2025-08-16). A Godot user hit upload errors (leo__127, 2026-01-17). A C# developer asked whether a Unity build would be accepted (Treelz, 2026-07-27). No confirmed Unity approval appears in the dump.
- **Rive** runs as WASM. Its state machine is good for UI, but each Rive instance draws to its own canvas, so there is no batching and many on screen at once are slow (Moose / Simon², FE 2025-11-20).
- **WASM elsewhere:** `izi-math-deterministic` is an npm package that gives deterministic sin/cos/sqrt in WASM, useful when physics must replay identically (Izi, FE 2026-02-07).

**Tooling performance**
- Storybook on native Windows is very slow, with first loads of minutes to hours. Use WSL/Linux or Docker (Pleb, tman, Randy, FE 2025-08). Docker/VirtualBox with the full book set hit "JavaScript heap out of memory" when switching to `mode_base/book/random` (Randy, 2025-08-05), so don't feed Storybook a million-line book file.
- If pixi-svelte fails to resolve, rebuild it with `pnpm run build` inside the package, or run Storybook from the repo root so turbo builds it (Dylan, Fumlawbeu).
- Pixi runs on rAF. Use delta-time scaling (`requestAnimationFrame` + multiply by dt) so speed doesn't depend on refresh rate (afk, FE 2025-08-23). A 60 Hz lag complaint got the answer "check VRAM / resize assets for mobile" (Matt, FE 2025-11-04).

---

## 2. Animation

**What studios use**
- **Spine 2D is the industry default.** Most 3-star games ship Spine `.json` + `.atlas` + `.webp` pages, not frame sequences. Animations stay small even at 512px+ symbol size (ShaFo, FE 2026-07-29; many others).
- **Spine Pro vs Essential:** Pro is strongly recommended for rigging and meshes (Taylor, 2026-06-10). Spine version must match the runtime. The web-sdk pins 4.2.x, a 4.3 export breaks Storybook unless you upgrade pixi-spine yourself, and an old Spine 3.8 means downgrading Pixi (WSM 2026-05-31; ShaFo, CH 2026-04-16).
- **DragonBones** is the free alternative. It has Pixi support and is nearly 1:1 with Spine concepts, but exports only up to Spine 3.3 format and is dated (Rocka 2025-11-15; sef 2026-04-09). Loongbones has broken mask export (Anto', 2026-01-27).
- **Code-driven animation:** Pixi + GSAP handles a lot ("no need for animations if it's just particles and explode"). Layer FX, then add Spine for symbols only if needed (Kuopionkansleri, FE 2026-08-01).
- **Particles:** use Spine particles or Pixi's `ParticleContainer` (pixijs.com/8.x/guides/components/scene-objects/particle-container; Kuopionkansleri, CH 2026-08-08).
- **Static symbols:** using a Spine "static" pose for the idle symbol after an animation is fine (DizzWhale, FE 2026-05-13).
- **Video:** MP4 works but is heavier and less practical than sprites (Kuopionkansleri, 2025-09-08). Transparent video is possible: render on green, convert with ffmpeg colorkey to VP9 WebM with a `yuva420p` pixel format (Camo, FE 2026-07-12). Few people ship video. GIFs don't play in Pixi, so convert them to a spritesheet (Erwin P, 2025-10-08).
- **Blender pipeline for sprites:** render on green as MP4, ffmpeg to a PNG sequence plus key-out, pack with TexturePacker, then compress each sheet. 150+ frame animations reportedly came out around 400 KB (PASHiON++, CH 2026-04-16). For backgrounds, animate only 1-3 elements, never a full-frame 100-frame FHD sequence (Kuopionkansleri, CH 2026-04-16). Full-screen sprite sequences are "heavy for mobile" (LazyMortal, FE 2026-05-20).
- **Reviewer-flagged pipeline:** a 3D Unity character baked to a 256x256 @ 24 fps spritesheet earned a "poor animations" tag (ethan, FE 2026-07-29).

**Atlases and packing**
- TexturePacker is the standard for static atlases and is what the web-sdk sample sheets were made with (Jonah, Dylan, FE 2025-07-07).
- When packing loose PNGs for Spine use the Spine JSON/Atlas data format, turn trim off if exact sizes matter, and turn rotation off because Spine sometimes mishandles rotated regions (Zonko, FE 2025-09-10).
- pixi-svelte `createAsset` with Spine split across multiple webp pages is undocumented (closing, 2025-12-04).
- Bitmap fonts: generated with **BMFont** (NTGaming) or **SnowB** online (TriizUp), FE 2025-10-08. A common pattern is a bitmap font for English digits/labels plus a full-charset TTF for other languages (ALZENIO, CH 2026-05-24).

**Quality: pixelation and scaling**
- Down-scaled art pixelates. Enable **mipmaps** with a mipmap-linear-linear filter (ShaFo 2026-04-28; mnemoo / Next Chart 2026-05-16; "swapping to the mipmap filter worked", closing). Pixi antialias also helps.
- An old suggestion to set `SCALE_MODES.NEAREST` for downscaling (mura, 2025-11-28) is the wrong direction for smooth art.
- Export art near its display size rather than shipping 2x everything and scaling down (NTGaming, FE 2026-06-12). In one report, 1000x1000 source exported at 2x gave a 2048 atlas that pixelated in-game (closing, 2026-05-16).
- pixi-svelte's renderer resolution lives in `packages/pixi-svelte/lib/.../InitializeApplication.svelte`. Raising it fixed blurry builds (howl / Flashtube, FE 2026-06-16).
- One dev forced 1080x1920 resolution on mobile and performance collapsed (Truong, FE 2025-11-18). Mala capped DPR at 3, which helps sharpness, but the game sometimes lags (CH 2026-06-14). In practice, cap DPR around 2 and use mipmaps instead of brute resolution.

**Mobile pitfalls**
- **iOS flicker** was caused by Pixi's WebGPU preference. Forcing WebGL fixed it (Mala / ufibu, FE 2026-05-27/29).
- **Context loss:** a white canvas after tabbing away on mobile Chrome came from WebGL/WebGPU context loss (TearsOfSoy, FE 2025-10-15). Gradients created as GPU or canvas-gradient resources were not recreated after the loss, a Mac+Firefox edge case (palpoutine, FE 2026-01-30). Handle `webglcontextlost`/`restored` and rebuild generated textures.
- **iOS stuck rounds or crashes** came from 4000x4000 atlases and particle-heavy animations. The advice was not to use 4000x4000 sheets (ShaFo, FE 2026-05-18). Memory leaks on older iOS devices were also reported (Goldexia, 2026-01-19).
- **Safari** framerate is inconsistent across devices on the same OS (IgorVoit, 2026-04-09; no answer). Test real devices; BrowserStack is used for QA (CH 2026-09-03).
- **Lag starting after about 30 s of spinning on mobile** traced to audio: don't use HTML `<audio>` elements, use Howler/WebAudio (Cain / iNumLocks, FE 2026-06-05/06).
- **Font race:** text measured before a webfont loads renders at fallback metrics. Fit-text loops then shrink it and never recover, which is worse on the prod CDN because latency is higher (Jovan, FE 2026-05-13). Preload fonts with Pixi `Assets.init` manifest bundles (FE 2025-11-15), or load them via CSS and wait for `document.fonts` before laying out text (OnePieceIsReal 2026-05-12).

---

## 3. Performance and bundle size

**Size targets (no hard published frontend limit as of the dump, but reviewers comment)**
- Kuopionkansleri (2026-04-21): target 10 MB, accept 20 MB, avoid going over 30 MB. One of his early assets of about 4 MB was flagged by Hayden.
- Isaac: target 10-25 MB. Sysy's (2026-06-25): 20-50 MB, with 50 as the max. CH Ideal Sizes (2026-07-29): aim for 20 MB or less. Math size doesn't affect the player.
- Data points: Isaac 9.5 MB; Carlsson 9.38 MB (2-star); Mala 12 MB (spritesheets); Max 12 and 17 MB.
- One game went from 241 MB to 18.4 MB (howie dune, 2026-06-13). Coreffect cut over 50% and fixed **duplicate asset loading**. Its true build was 49 MB and the network tab showed about 100 MB (Izi, 2026-04-21). Simon² says some big 3-star games are around 100 MB.
- A 20 MB game took about 2 minutes on 10 Mbps. The diagnosis was app code stalling, not size (Isaac, 2026-04-14). A 15-minute load was also a stall, so check the console (D, 2026-05-24). Upload itself tolerated 200 MB (Tauraxus, 2025-11-15), so the upload limit isn't the constraint; reviewer perception and mobile load time are.
- "My first submissions had multi-hundred-MB builds" shows up repeatedly. Players on mobile are about 60-75% of traffic (tman citing Eddie, FE 2025-10-26), and Hayden confirms "a lot of mobile users".

**Where the bytes go and how to cut them**
- Audio is usually the biggest chunk. 96-128 kbps MP3 is fine for slots (FE 2026-08-28 reply). One mobile game was 18 MB with 8 MB of audio (2026-06-05).
- Formats people use: OGG + MP3 fallback (Mala), "mp3 for sound, fallback to ogg" (jamalamchart), OGG or AAC via Howler (DIMEH, 2026-05-28).
- An audio sprite (one file, segments per event) is how the web-sdk does it (Wahr, 2026-06-03).
- **Images:** use WebP instead of PNG for everything ("webp usually way smaller than png", Sysy's 2026-07-31). Don't ship both PNG and WebP copies, and make sure the loader picks the WebP one (afk 2026-03-08). WebP's max dimension is 16383 px; someone joked "32000x32000", so keep atlas pages at 4096 or less for mobile.
- **KTX2 / Basis (GPU-compressed):** recommended by PlayAndChill ("industry standard of big providers"; GPU-resident, lower VRAM), DIMEH ("KTX2 for mobile") and afk ("yes use ktx2", 2026-08-12). Zonko cautions it "cannot be used everywhere". Izi warns that converting formats can create extra GPU copies at upload, causing the "classic VRAM crash" on old devices, so test old phones.
- Pack animated assets into atlases instead of loose PNGs, and strip unused bundled assets (FE 2026-08-28).
- **Loader GIF:** the Stake Engine loader GIF is over 1 MB; one team's was 10 MB. Rebuild the loader in Spine/Pixi instead (CANDY, 2026-04-21).

**Runtime caps people hit**
- Fewer, smaller textures matter more than file size. VRAM crashes come from 4k atlases and particle storms. Matt (2025-11-04) saw VRAM problems until assets were resized for mobile.
- Mala removed glow, shadow and blur filters and saw improvement on mobile (CH 2026-06-14). Filters are expensive; bake glows into textures where possible.
- **RGS demo rate limit:** 100 requests/minute on demo rounds; production doesn't have the same limits (Carrot Sticks, 2026-07-29; Hayden, 2026-04-19). A 429 / `ERR_ACT "Slow down"` in testing is that limit (Matt, 2026-04-01). In April 2026 RGS latency across all engine games caused lag between spins, so mask the round-trip with spin animation.

**Approval items touching performance**
- No console errors or warnings. Kuopionkansleri recalls the console must be clean (RGS 2025-09-02). A missing favicon import is the most common console error.
- All images and fonts must load from the Stake CDN, meaning bundled in your upload. No Google Fonts or third-party CDNs. The CSP is `default-src 'self'` and external domains cannot be allowlisted (LogiX Haze Q, "not possible", FE 2026-04-09). External SDKs and analytics are killed by the iframe CSP (D, 2026-04-27).

---

## 4. Tools, kits, repos and resources (URLs verbatim)

**Official**
- Web SDK: https://github.com/StakeEngine/web-sdk. FAQ: https://github.com/StakeEngine/web-sdk?tab=readme-ov-file#faq. Launch guide: https://github.com/StakeEngine/web-sdk?tab=readme-ov-file#launch-a-game
  - Spritesheet example: https://github.com/StakeEngine/web-sdk/blob/main/packages/pixi-svelte-storybook/src/stories/SpriteSheet.stories.svelte
  - Auth, config, jurisdiction and replay handling: https://github.com/StakeEngine/web-sdk/blob/main/packages/components-shared/src/components/Authenticate.svelte. It also has a ResumeBet component (Baribum, 2026-01-19).
  - turbo build config: https://github.com/StakeEngine/web-sdk/blob/main/turbo.json#L20
- **ts-client** (official minimal RGS client, a couple of files; npm package `stake-engine`, v0.1.30 by Sept 2025): https://github.com/StakeEngine/ts-client. It's the cleanest base for a custom React/Pixi/vanilla frontend. Distribution is odd (dist committed), so vendor it or use a submodule (ksmit799).
- Math SDK: https://github.com/StakeEngine/math-sdk. Docs: https://stakeengine.github.io/math-sdk/ (old carrot-engineering.github.io links are stale)
  - Branches: `multi_freegame` (3/4/5-scatter bonus tiers), `bonus-merge` (bonus LUT substituted into base, folder `0_0_lines_feature_match`), `scatterpay_notumble`.
  - Verifier: https://github.com/StakeEngine/math-sdk/blob/main/utils/rgs_verification.py
  - max_win override per BetMode: commit 41ae0b7
- Convex optimizer (CVXPY + Streamlit GUI; target distributions Exponential/LogNormal/Gaussian; inputs are the unoptimized LUT + `lookUpTableSegmented` CSV; run `make setup` then `streamlit run src/app.py`): https://github.com/StakeEngine/convex-optimizer (Carrot Sticks, 2026-01-04)
- Docs:
  - https://stake-engine.com/docs/math/math-file-format
  - https://stake-engine.com/docs/rgs
  - https://stake-engine.com/docs/front-end/getting-started
  - https://stake-engine.com/docs/approval-guidelines (plus `/math-verification`, `/jurisdiction-requirements`, `/rgs-communication`, `/general-disclaimer`)
  - https://stake-engine.com/docs/math/optimization-algorithm (optimizer paper PDF)
  - Docs source: https://github.com/StakeEngine/docs (possibly stale, about 5-6 months old as of Aug 2026)
- Reference games: Paperclip "Pinball Peak", the model for rapid-fire bets and 3-decimal formatting, https://stake.com/casino/games/paperclip-pinball-peak. Showcase list: https://stake.com/casino/group/stake-engine

**Community**
- **Stake Dev Tool** (Simon², PlayAndChill): https://github.com/simnJS/stake-dev-tool (releases at /releases). v2 moved to https://github.com/Stake-Dev-Tool/stake-dev-tool
  - Rust local RGS server (drop-in for the reference contract).
  - 7-resolution multi-iframe QA view (about 250 MB RAM per iframe, so disable unused ones).
  - Force event, replay, saved rounds, notable rounds, and an SQLite session store for testing resume (Mala PR).
  - v2 adds a web workbench, hosted share links on a `<slug>.play` subdomain, math revisions with an RTP changelog, the `sdt push` CLI and an MCP server. Self-hostable with docker compose. Cloud is about €3/seat/month.
  - Validator note: it rejects fractional mode cost such as 1.25 ("expected a positive integer"). Unconfirmed whether production does too (czyzak, RGS 2026-08-14).
  - Bug reported: `/play` returned the post-win balance instead of balance minus cost (Mala, 2026-04-22).
- **Mnemoo Tools** (mnemoo): https://github.com/mnemoo/tools (releases v1.0.1 to v1.3.1)
  - Books explorer, replay, local game server, compliance checks and an optimizer (beta; some 3-star games use it).
  - Event Finder exports the review event IDs per mode.
  - Optimizer is bounded to 98% RTP.
  - v1.1.2 dropped RAM from 5 GB to 70 MB by not auto-loading books.
  - Expects `<dir>/publish_files`, so select the parent directory.
- Slot Engine (alternative TS/Rust slot framework with an optimization task): https://slot-engine.dev/docs/core/game-tasks/optimization
- JeanClaude-Math (generates Stake-compatible publish files): https://github.com/JeanClaude-Stake/JeanClaude-Math
- LLM-readable docs mirror: https://github.com/jovanpanetie/stake-engine-md-doc (Jovan, 2026-05-18)
- izi-math-deterministic (WASM deterministic math): https://www.npmjs.com/package/izi-math-deterministic
- Keyframe: a free browser 2D skeletal animator with an agent mode, local-only storage, by KC / 0DayGames. Written as keyframe(dot)it(dot)com in CH 2026-07-13.
- Mala's Spine `agent.md` workflow: auto-animate Spine 3.8/4.x exports with an AI agent as a starting point (CH 2026-06-29).
- Other: stakeplayercount(dot)com (player-count tracker); BMFont / SnowB for bitmap fonts; TexturePacker; caddyserver.com for local static hosting tests (Dylan); BrowserStack for device QA.

---

## 5. Math (math-sdk workflow, optimizer, formats, pitfalls)

**File format (what the RGS actually requires)**
- Per mode you need:
  - a lookup CSV with **no header**, rows `id,weight,payoutMultiplier`, all uint64;
  - a books file `.jsonl.zst` (Zstandard only), one JSON per line `{"id","events":[...],"payoutMultiplier"}`;
  - plus one `index.json` listing modes, cost, and file names.
  All files go in the upload root, with no subdirectories (Carrot Sticks, MATH 2025-08-13/14; Kuopionkansleri, 2026-01-06).
- **payoutMultiplier is an integer in hundredths** (1x = 100, 0.25x = 25). Floats are rejected with `ERR_INVALID_FORMAT` (mnemoo, 2025-11-11 and 2026-02-15). Minimum non-zero win is 0.01x.
- `rgs_verification.py` asserts `payout % 10 == 0` (0.1x steps). That is a guard against unreadable sub-cent wins, not an RGS rule; 0.01x granularity is allowed (Carrot Sticks, 2026-02-25; mnemoo, 2026-04-03).
- **Books and LUT must match exactly.** The publisher builds two uint64 arrays (CSV payouts and book payoutMultipliers) and compares MD5 hashes, giving a "payout hash mismatch" error on any difference.
- **The sum of weights must stay under 2^64**, or you get "maximum cumulative lookup table weight exceeded". Lower the optimizer's `2^50` scaling to `2^40` (Carrot Sticks, 2025-09-21, 2026-01-13, 2026-03-25).
- **IDs are 0-indexed in the RGS.** The math-sdk was patched from 1-indexing in Nov-Dec 2025, which broke older tools (avamaDev, MN 2025-12-24). The replay URL's event ID equals the LUT line number.
- Limits:
  - 1 MB per single event/result JSON;
  - 4.2 GB per file (uint32 indexing);
  - publish runs in an AWS Lambda with a **15-minute cap**, so a 14 GB upload silently 404s;
  - publisher compute is weak, so 1e7 sims is about the ceiling and a couple of million is comfortable.
  If uploads fail, reduce base/ante to 1M and buys to 300k (Onur, 2026-08-17). Sources: Carrot Sticks 2025-10-11/22, 2026-05-09/11/13.
- Event contents are arbitrary; the frontend defines them. Unicode in books can be base64-wrapped (mnemoo).
- Mode names are case-sensitive between the frontend call and index.json. One `booster` vs `RARE_BOOSTER` mismatch gave `ERR_VAL bad request`.
- No requirement to use the math-sdk. Any generator works as long as the output format matches (Carrot Sticks, 2025-08-12/13).

**math-sdk workflow and optimizer**
- Run `run.py` with `run_conditions` (sims, optimization, analysis, format_checks). Use `compression=True` and multiple threads.
- `num_sims` should be divisible by `batching*num_threads`, or totals get truncated (Carrot Sticks, 2025-06-27).
- Python 3.12 venv via `make setup`. On Windows, `make` needs WSL or Git tooling. The Rust/cargo optimizer runs on Windows natively.
- **Stuck sims:** almost always a `wincap` (or other) criteria that the reels can't satisfy, which loops forever on `self.repeat` / `check_repeat`. Use dedicated WCAP reelstrips with heavy high symbols, add `add_symbols_to_board()`, or force retriggers near the end of free spins (Carrot Sticks, 2025-08-12, 2025-10-25, 2026-05-12).
- **Stuck optimizer:** `cd optimization_program && cargo run --release` shows which criteria fail (it can loop forever on random trials). To lighten load, lower `rust_threads` (20 to 10), `sim_trials`, `num_show` and `num_per_fence` (2026-01-21, 2026-02-14).
- The optimizer works on the **map of unique payouts**, so you need diversity of unique wins in every range. Few unique low wins plus a high starting RTP lead to huge weight dumps on a handful of outcomes (2025-08-06, 2025-10-02, 2026-03-02).
- Criteria bucketing is sequential: each criteria removes matching sims from the pool. Duplicate search conditions starve later criteria, so tag with force records (2025-09-29).
- Only one criteria may use hit-rate `"x"`, because the probabilities must sum to 1. The optimizer solves `rtp = hr * av_win`, so specify 2 of the 3 (2025-09-30, 2026-02-09).
- Use the `scaling` property with `scale_factor: 0` on a `win_range` to suppress a range. In the convex optimizer use Rect/Linear functions (2025-08-10, 2026-02-02).
- Pick among several optimizer solutions with `utils/swap_lookups.py`. A CSV whose weights are all 1 means the optimizer never ran.
- **RTP split guidance:** about 50-60% base, 40-45% free games. To make a buy and a natural trigger feel the same: bonus at 100x cost with 96% RTP has av_win 96x, so the base trigger hit-rate is 96/(1*0.40), about 1 in 240 (Carrot Sticks, 2025-07-28, 2025-12-26, 2026-03-11).
- **Max-win allocation:** 0.1-1% of RTP is standard. `HR = maxAmt / allocation / cost`. A 5000x win hitting 1 in 900 is far too frequent (2025-12-31, 2026-01-01).
- `wincap` ConstructConditions should set `search_conditions=<maxwin>` exactly, or the optimizer struggles.
- "Hit rate of most likely result" detects one board repeating too often. Equal weights spread over win ranges (instead of per unique payout) inflate it. Mnemoo's "Simulation Diversity" warning flags a most-frequent outcome above 1% (MN 2026-02-25); the convex optimizer fixed it.
- Mnemoo's optimizer treats targets as **cost-normalized**: a 500x-cost mode with a 500x target searches the 250,000x absolute bucket (MN 2026-01-13).
- Physics/plinko style games: write your own generator plus optimizer scripts; physics can be stored in books at reasonable size (Kuopionkansleri, 2026-01-05).
- Choices that affect the outcome (dice number, keno picks, mines step, ladder cashout) must be **separate modes**, one per option. True stateful or progressive games aren't supported. Fake progressions reset on refresh (RGS 2025-11-12, 2026-02-05, 2026-07-02). 100+ modes cause publisher trouble (Carrot Sticks, 2026-05-13).

**Compliance thresholds (as of Aug-Sept 2026; check the math-verification doc)**
- **RTP:** the earlier rule was 90-98%. The Aug 4 2026 critical limit is RTP of all modes **at most 96.7%, with a maximum 0.5% spread between modes**. Reviewers read the 0.5% rule as relative to the base mode (Kuopionkansleri / TTL, Feb 2026).
- **Simulations:** 100k+ per mode for slots, and reviewers enforce it even on analytically small games (Simon², 2026-01-26).
- **Max win** must be realistically obtainable. The docs say "typically more frequent than 1 in 10,000,000". Community tools use 1 in 20M; 1 in 650M was rejected (MN 2026-02-25).
- Critical limits from the Aug 4 2026 update (Carrot Sticks, MATH 2026-08-04):
  - a base 1.0x mode is required and must be the cheapest mode;
  - base standard deviation of at least 0.6;
  - max payout of at most 500,000x, with a penalty above 50k (2-star) or 100k (3-star);
  - every mode must hit non-zero more often than 1 in 50;
  - a viable bet template must exist.
- Non-critical tests now reduce exposure and max bet instead of blocking: P(>5000x), P(>10000x), CVaR (risk, both cost-normalized and absolute), and ETL (expected tail liability above 40x cost). Grouped failures count once. Bet templates range from $1 to $1000 base, with a $100 max for US/EU. "Max or nothing" modes fail ETL; add wins around cost and in the thousands (2026-07-07). An ETL40 floor of about 0.81 makes high-cost buys hard to pass (Erik, 2026-06-09).
- Earlier tier caps (May-July 2026): 2-star max payout 25,000x, 3-star 100,000x. 3-star P(>5k) < 1e-2. Exposure guide (2026-04-05): 0-star 10k, 1-star under 100k, 2-star under 1M, 3-star under 10M.
- Rule statements must give max win and RTP per mode when they differ between modes (2026-01-09).
- **No math changes after release.** Replays depend on a fixed math version (2025-08-31, 2025-11-18).
- Review asks for event IDs per mode: normal win, big win, max win, loss, bonus trigger, and sometimes 3/4-scatter triggers and retriggers (vanted, 2026-05-07; Bazer, 2026-04-07).
- Mnemoo's mode-cost math: `rtp = av_win / hr`.

---

## 6. RGS and frontend integration gotchas

**Launch URL**
- Params: `?sessionID=…&rgs_url=…&lang=en&currency=USD&device=desktop&social=false&demo=true`. Read everything from the query string. The language param is `lang`, not `language` (BlingBlongBilly, 2025-05-21). `gameID` is not needed for calls; `config.gameID` comes back from authenticate.
- Local dev: the dashboard's Launch Game → "local testing" redirect injects session and rgs_url into your localhost URL. Without them you get `POST https://wallet/authenticate ERR_NAME_NOT_RESOLVED` (Reel GFX, 2026-08-12). Math must be published first, and at least one frontend must be published for the launch button to appear.
- An old dashboard bug passed `front=undefined`; remove it (Hayden, 2025-07-27).

**Flow**
- Always call `/wallet/authenticate` first, then `/wallet/play {sessionID, amount, mode}`. Amounts are in micro-units: 1,000,000 = $1, and bet levels are times 1e6.
- If the play response has `active=false` (a 0x loss), the RGS auto-closes the round and `/wallet/end-round` will error. If `active=true`, call end-round (I Am The House, RGS 2025-09-02; afk 2025-08-23).
- The `payoutMultiplier` in live responses is a plain float (0.2), not hundredths.
- Call end-round **after win animations finish**. Unended rounds are returned by authenticate for resume (I Am The House, 2025-06-30). An active bet stays open forever until end-round; play again gives "player has active bet".
- Balance: show `/play`'s balance (stake deducted) during the round and end-round's balance afterwards. Don't credit wins before the animation completes (rapid-fire games: Paperclip pattern, ArtVandelay, 2025-07-21).
- Changing currency mints a new session ID. Refreshing inside the dashboard resets the demo balance; use "Open in New Tab" to keep the session (Cain, 2026-03-02).
- Errors seen:
  - `ERR_VAL` = bad params or a mode-name mismatch;
  - `ERR_GEN` on /play happens intermittently, and an RGS bug was acknowledged (rob, 2026-03-28);
  - `ERR_ACT "Slow down"` = demo rate limit;
  - XSC/XGC test currencies caused failures, so switch to USD;
  - Tanzania/Uganda currencies gave ERR_GEN (July 2026).
  A plain-text 400 on a valid replay route was unresolved as of 2026-09-02.

**Bets, currency and decimals**
- Use `minBet`, `maxBet`, `stepBet`, `betLevels` and `defaultBetLevel` from authenticate. Never hardcode them and don't allow manual bet input (rejected). Bet levels vary per currency.
- Max bet is set by the operator and star tier. New providers start at $10; tiers have been described as 1-star $10 / 2-star $100 / 3-star $1000 (Isaac, 2025-12-15), now governed by bet templates.
- An expensive feature lowers max base bet. A 2000x feature capped the base at 200 (Peaky Spike, 2026-09-01).
- A feature or ante cost times the selected bet must exist in betLevels. Validate before enabling (PASHiON++, 2026-04-09). Use simple ante costs like 1.5x or 2x to avoid decimal trouble (ufibu).
- **1-cent bets** are now supported (May 2026), and new games must handle bets under $0.10. Wins show up to 3-4 decimals (copy Paperclip's formatter; Hayden, 2026-05-10). **Balance and bet must show exactly 2 decimals** (reviewers, June-July 2026).
- Win display must match payoutMultiplier times bet exactly. A $0.008 win shown as $0.01 got flagged (CrunchTooth, 2026-06-19).
- Huge balances (ARS 10,000,000,000.00) must still fit in Popout-Small. Abbreviating with K/B got mixed reviewer responses (BadJ0ker, May 2026).
- Currencies are enabled by Stake. Handle all symbols; the ts-client ships currency symbol tables.

**Replay**
- Required: "Bet Replay" is on the checklist. Stake launches the game with replay params (game slug, version, mode, event). The frontend fetches `GET {rgs}/bet/replay/{game}/{version}/{mode}/{event}`, with no session and no authentication (mnemoo, 2025-11-26; Erwin P, 2025-11-19).
- Show the round, then offer **"play again"** when replay completes (Big Dog, 2026-01-01). The amount param is the bet size.
- Replay must render identically, so any frontend-only randomization (near-miss, decorative values) must be seeded from book data (sef / ngfdev).
- The `betID` from `/play` doesn't map to an eventID. To build your own history, store the RGS responses; you still must support Stake's replay (Whippoorwill, 2026-03-12). Stake.com "My Bets" replay is coming.

**Resume and refresh**
- Reviewer requirement (Jontamania, 2026-06-26): on a mid-round refresh, resume or restart the same event, and **restore the bet amount** of that round rather than the default.
- At minimum, show the final win count-up (palpoutine). 0x rounds are not resumable because they're already settled. Some teams add a minimum 0.1x bonus win so bonuses are always resumable (ShaFo).
- With no unfinished round, use `defaultBetLevel`.

**Social mode (Stake.us)**
- `social=true` URL param, or `socialCasino` in authenticate's jurisdiction config. Ship **one frontend** and swap strings via `social` (Cabernet, 2026-04-18).
- Replace restricted words per the jurisdiction doc: bet becomes play, "buy" is restricted, use GC/SC coins. Invalid characters in US locale strings broke one build (wk).
- Always show RTP and max win per mode, regardless of `displayRTP` (2026-08-28).

**Layout and device**
- The game sits in an iframe; fill 100% width and height. Prefer CSS breakpoints over the `device` param.
- Reviewers check **every** size: desktop, mobile **portrait and landscape**, Popout S/L. No clipping and no forced rotation (Hayden, 2025-10-25; Riskit, 2026-05-13; Cain, 2026-03-10). Mobile Chrome's bottom bar overlaps, so keep safe areas.

---

## 7. Approval and review requirements that affect the frontend

- **Loader:** the Stake Engine loader must be the **first** loading animation (checklist, quoted 2025-10-08). The old Carrot loader should be replaced. Rebuild the large GIF as Pixi/Spine.
- **Assets** must come from the bundled CDN upload. No external fonts or scripts, and CSP can't be extended. English is the only required language. The general disclaimer comes from the approval flow; it is normally left untranslated.
- **RGS communication checklist:** bet levels, min/max and the default bet all from the RGS; replay support; resume support; correct balance handling; display that matches payout for 10 wins per mode (Cain, MN 2026-06-15). Paylines and clusters must be identifiable, and per-line amounts should show individually, not as a cumulative sum.
- **Console** must be free of errors (favicon, end-round misuse).
- **Quality rating:** the threshold rose from 4.5 to **6.0 points**. A 2-star rating isn't published after a re-rate (bloodfieers, 2026-05-15; nonamehg, CH 2026-08-17). Ratings are subjective and vary between reviewers; resubmission is allowed.
  - Most common rejections: "poor animations", "poor bet UI bar", "low quality assets".
  - Ingredients for 3 stars: coherent art style, polished Spine animation, a good bet bar, bonus transitions, win modals with motion, and a symbol hierarchy (CH threads, June-Aug 2026).
- **AI-asset policy:** "over-reliance on generic AI-generated assets (standard fonts, gradients, emoji icons, border effects)" is flagged. Never use emoji in the HUD. Replace stock gradients and use custom bitmap fonts and icons (Cain, FE 2026-08-15). Reviewers also catch reused sound effects that sound like other studios' (wise, CH 2026-08-26).
- **Game info/rules screen:** per-mode RTP and max win, paytable images loading from relative paths (`<img>` with absolute paths breaks on the CDN), and the jurisdiction disclaimer.
- **Process:** submit an approval request with tile/cover art (Google Drive link if the tile editor fails with "'Forbidden' is not valid JSON"). The 51-item checklist is reviewer-only. Turnaround ranges from a few days to weeks; reply in your thread to set "awaiting".
- Updates after approval are possible, but **math cannot change post-release**. Frontend optimization between approval and publish is fine.

---

## Quick "efficient frontend" checklist distilled from the above

1. PixiJS (v8 guides are what people link) or your own renderer, with **WebGL forced on iOS**; DPR capped at about 2; handle context loss.
2. Spine 4.2 (match the runtime) for symbols and characters. GSAP for UI motion. Avoid full-frame sprite sequences and multiple Rive canvases.
3. WebP atlases at most 2048-4096 per page with mipmaps on. Consider KTX2/Basis for VRAM, but test old iPhones.
4. One audio sprite in MP3/OGG at 96-128 kbps through Howler/WebAudio, never `<audio>` tags.
5. Relative paths, `base: "./"`, fonts bundled and awaited before measuring, no external requests.
6. Target 10-20 MB total and dedupe asset loads. Check the network tab on a throttled mobile profile.
7. Handle `active=false`/`true`, call end-round after animations, resume with bet restored, replay with "play again", seeded cosmetic randomness, and 2-decimal balance/bet with 3-4-decimal wins.
8. Test every layout (portrait, popout S) and both social and real-money strings, using Stake Dev Tool's multi-resolution view or a local RGS.
