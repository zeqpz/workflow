---
name: slot-tools-and-resources
description: Catalogue of the tools, kits, GitHub repos, docs and community resources for building Stake Engine (Engine / engine.io) slot games - official SDKs, local RGS/dev tools, math optimisers, CLIs, asset/animation/profiling tools - with what each is for and how trustworthy it is. Use when choosing a tool, looking for a repo/doc link, or setting up a new game's toolchain.
---

# Tools and resources (verified links, Nov 2026)

Compiled from the engine.io Discord (2025-04 to 2026-11) and web research; details in `Documents\fallslotsga\research\`. Before installing anything third-party: read its source for outbound URLs/telemetry, never give it account tokens it does not need, and prefer local-only modes.

## Official (Stake / Engine)
| What | Link | Use |
|---|---|---|
| Docs, dashboard, insights, share links | https://studio.engine.io (docs at /docs/rgs), approval guidelines https://stake-engine.com/docs/approval-guidelines | Source of truth for rules; JS-rendered (open in a browser) |
| web-sdk (Svelte 5, pixi-svelte, XState, Howler, Spine 4.2, sample games; pins PixiJS 8.8.1) | https://github.com/engineio/web-sdk (moved from StakeEngine/web-sdk) | Reference implementation; `Authenticate.svelte` for auth/replay/resume |
| ts-client (npm `stake-engine`) | https://github.com/StakeEngine/ts-client | Minimal RGS client for custom frontends |
| math-sdk (Python 3.12 + Rust optimiser) | https://github.com/StakeEngine/math-sdk , docs https://stakeengine.github.io/math-sdk/ | Sims, books, LUTs, `utils/rgs_verification.py` |
| convex-optimizer (CVXPY + Streamlit) | https://github.com/StakeEngine/convex-optimizer | Alternative LUT optimiser |
| Demo RGS | rgsd.engine.io | Rate-limited (Cloudflare 429, no CORS) |

## Community dev tools
| Tool | Link | Notes |
|---|---|---|
| Stake Dev Tool (Rust local RGS, multi-resolution QA iframes, forced events, saved rounds, MCP server) | https://github.com/Stake-Dev-Tool/stake-dev-tool | Open source; its paid cloud ended Oct 16 2026. ~250 MB RAM per QA iframe. Validator rejects fractional costs (1.25) |
| mnemoo tools (books explorer, compliance checks, Event Finder, optimiser, local server) | https://github.com/mnemoo/tools | Point it at the parent of `publish_files` |
| mnemoo stakecli v2 (upload/publish from CI, Engine support) | https://github.com/mnemoo/cli | CI example publishes a Svelte front on every push. Needs your account credentials - keep them in CI secrets, never in repo |
| Slot Engine (TS framework: sims, optimiser, Panel UI, local RGS `@slot-engine/lgs` with replay) | https://slot-engine.dev , https://github.com/slot-engine/slot-engine | Alternative to math-sdk; books 0-indexed now |
| watchtowr (game/insights tracking, Discord integration, API tokens) | https://watchtowr.gg/ | Third-party SaaS: share only public data |
| Stake Cruncher | stakecruncher(dot)com | Third-party stats site |
| stake-preflight (community pre-submission checker) | `npx stake-preflight ./build --math ./math` | Unvetted npm package - read source first |
| Engine Insights public API | https://studio.engine.io/insights/developers | Official stats API |
| engineplayers.com | community releases/reviews site | Read-only reference |
| Rigby2D (free open-source skeletal animator) | search "Rigby2D" | Spine alternative, unproven |
| LLM-readable docs mirror | https://github.com/jovanpanetie/stake-engine-md-doc | Feed to agents; may lag the live docs |
| JeanClaude-Math | https://github.com/JeanClaude-Stake/JeanClaude-Math | Publish-file generator |
| izi-math-deterministic (WASM deterministic trig) | https://www.npmjs.com/package/izi-math-deterministic | Physics that must replay identically |

## Rendering / animation / assets
- PixiJS v8 https://pixijs.com/8.x/guides (performance-tips, render-groups, cache-as-texture, garbage-collection, particle-container); agent skills ship in `node_modules/pixi.js/skills/` (>= 8.19) https://github.com/pixijs/pixijs-skills
- Spine runtime for Pixi v8 (official) https://esotericsoftware.com/spine-pixi - pixi-spine/spine-v8 is archived (Feb 2026).
- GSAP (free incl. plugins) https://gsap.com ; tween.js https://github.com/tweenjs/tween.js
- AssetPack https://pixijs.io/assetpack/ ; TexturePacker (paid); free-tex-packer; BMFont / SnowB for bitmap fonts.
- Howler https://github.com/goldfire/howler.js
- Blender (4.2 here) for pre-rendered/rigged art -> our live-rig pipeline in fallslotsga `tools/fall/`.

## Profiling / QA
- Chrome DevTools Performance + `chrome://inspect` (Android), Safari Web Inspector (iOS).
- Spector.js https://github.com/BabylonJS/Spector.js (draw calls); PixiJS Devtools https://github.com/pixijs/devtools
- BrowserStack for device coverage (used by studios); Stake Dev Tool multi-resolution view.

## Reference games
Paperclip Gaming titles (e.g. Pinball Peak) for rapid bets and 3-decimal win display https://stake.com/casino/games/paperclip-pinball-peak ; Engine showcase list https://stake.com/casino/group/stake-engine
