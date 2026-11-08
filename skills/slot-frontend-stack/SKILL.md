---
name: slot-frontend-stack
description: Pick and set up the language, framework, build and asset pipeline for a Stake Engine slot frontend (TypeScript + PixiJS v8 + Vite, web-sdk/Svelte vs custom, ts-client, AssetPack, KTX2/WebP, Howler, fonts), with the iframe/CDN constraints that break builds. Use when starting a new game frontend, choosing tech, setting up the build, or deciding whether WASM/WebGPU/Phaser/Unity is worth it.
---

# Slot frontend stack

Sources: engine.io Discord 2025-2026, Pixi v8 docs, research in `Documents\fallslotsga\research\`.

## Recommendation
- **TypeScript + PixiJS v8 (WebGL renderer) + Vite**, `@esotericsoftware/spine-pixi-v8`, GSAP, Howler, the official **ts-client** (npm `stake-engine`) or a mirror of it for wire calls.
- The official **web-sdk** (Svelte 5/SvelteKit, pixi-svelte, XState, Storybook, Howler) is a reference, not a library: teams fork it and live in it. Borrow its patterns (book event `sequence()` playback, Authenticate.svelte for auth/replay/resume). Storybook on native Windows is painfully slow - use WSL.
- Any static `index.html` bundle is allowed (Vue/React/Phaser/plain DOM all shipped). Unity/Godot WebGL: effectively out (size, separate license).
- **WASM**: not for the client (the RGS returns precomputed books). Only for offline math and the KTX2 transcoder. **WebGPU**: not yet (iOS flicker, Safari 26 bugs). **Phaser 4**: fine but no reason to migrate.
- Plain DOM/CSS + canvas hybrids work (our fallslotsga/slotsgame) but watch compositor costs (see slot-frontend-performance).

## Build constraints (break on the CDN otherwise)
- Served at `<cdn>/<gameUUID>/<version>/index.html`: Vite `base: './'`, relative paths everywhere (incl. rules/paytable `<img>`). Prefer Vite+Svelte over SvelteKit (base-path pain).
- CSP `default-src 'self'`: bundle fonts, no CDNs/analytics.
- Read params from the query string (`sessionID`, `rgs_url`, `lang`, `currency`, `device`, `social`, `replay`...).
- Fill 100% of the iframe; CSS breakpoints over the `device` param; safe areas.

## Asset pipeline
- **AssetPack** (`@assetpack/core`, Node >= 20): atlases, @0.5x/1x resolutions, WebP/AVIF/KTX2, mipmaps, ffmpeg audio, Spine, webfonts/MSDF, Pixi manifest. Or TexturePacker (paid) / free-tex-packer.
- Images: WebP default (never ship PNG+WebP duplicates); KTX2/Basis (`import 'pixi.js/ktx2'`, sources ordered ktx2, basis, png) for large art to cut VRAM ~4x - test old iPhones.
- Audio: SFX as one Howler sprite; 96-128 kbps; formats `['webm','m4a']` or m4a+mp3 (Opus on iOS inconsistent); no blob URLs on iOS; music `html5:true`. Audio is usually the biggest chunk.
- Fonts: WOFF2 subset, preload, await `document.fonts` before laying out text; BitmapFont for numbers (BMFont / SnowB / AssetPack MSDF). Custom fonts avoid the "generic AI" flag.
- Bundles: `load` (tiny loader) -> `base` -> background `bonus`; prepare-upload before each scene.

## Local dev
- Mock RGS serving books locally (our `frontend/mock_rgs.py`) or Stake Dev Tool (Rust local RGS, multi-resolution QA view, forced events) https://github.com/Stake-Dev-Tool/stake-dev-tool, or mnemoo tools local server https://github.com/mnemoo/tools.
- Delta-time everything; cap the ticker (high-refresh screens).
- Agent help: `node_modules/pixi.js/skills/` (pixijs-skills, Pixi >= 8.19) keeps v8 API usage correct.
