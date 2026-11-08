---
name: slot-animation-pipeline
description: Choose and build slot-game animation (symbol land/idle/win, characters, big-win, bonus transitions, particles) that looks premium and stays cheap - Spine 4.2 via spine-pixi-v8, live 2D rigs exported from Blender, sprite sheets, GSAP timelines, shader FX, Pixi particles - plus budgets and the reviewer's "poor animations" bar. Use when planning or implementing animation for a Stake slot, picking a tool/runtime, or fixing animation jank or quality complaints.
---

# Slot animation pipeline

Sources: engine.io Discord (#frontend-sdk-discussion, community-help 2025-2026), Esoteric spine-pixi docs, Pixi v8 docs, our Blender->live-rig pipeline in fallslotsga.

## Pick the technique (best perf/quality first)
1. **Spine 4.2** (`@esotericsoftware/spine-pixi-v8@~4.2`; pixi-spine is ARCHIVED Feb 2026). Industry default for symbols/characters; json/skel + atlas + webp. Editor major.minor must match the runtime (web-sdk pins 4.2; 4.3 exports break it). Spine Pro for meshes.
2. **Live 2D rigs from Blender** (our pipeline): per-part affine + fade keyed per frame, drawn live from a small atlas - cut decoded symbol memory 441 MB -> 17 MB vs frame sheets. Use when art is painted parts, not a Spine project.
3. **Sprite sheets**: short FX loops and painterly changes Spine can't deform. Costly memory per second; keep small, KTX2 if big. Never full-screen 100-frame sequences (mobile killer); animate 1-3 background elements instead.
4. **Shader FX** on one quad/mesh (shimmer, UV scroll, dissolve, liquid level): very cheap. Full-screen post filters: very expensive. Warm-compile at load.
5. **GSAP** (free incl. plugins since 3.13) for UI, reel motion, timelines; tick it from `app.ticker`. Custom pooled tweens where hundreds run per spin.
6. **Particles**: Pixi v8 ParticleContainer or Spine particles; pooled, one FX atlas.
Avoid in-reel: Rive (own canvas per instance, no batching - menus only), Lottie (CPU-heavy), DragonBones (unmaintained), MP4 (heavy; transparent VP9 `yuva420p` webm possible but rare), GIF (not in Pixi).

## Spine performance
- Binary `.skel`; instances share SkeletonData; bounds provider instead of dynamic bounds.
- No clipping attachments in symbols (CPU polygon clipping per frame). Keep darkTint off unless needed (heavier renderer).
- Pause idle skeletons (`autoUpdate:false` + manual update) or swap to a static Sprite of the setup pose.
- Give each Spine `ticker: app.ticker` (shared ticker is uncapped -> 165 Hz on our screen).
- Blend-mode switches between slots add draw calls; keep additive slots contiguous or in a separate layer.
- Budget (start point): 15-30 skeletons animating, < 30 bones and < 300 deformed verts per symbol, ~10k weighted verts total.
- Atlas packing for Spine: trim off when sizes matter, rotation off.

## Quality bar (what reviewers reward)
- Reviewer-defined "poor animations" (Nov 2026 forum consensus): a symbol sharing generic land/win motion, a low-framerate mascot idle, a fully static background, identical-feeling bonuses. Give each symbol its own land + win clip and keep something alive in the background.
- Every symbol: land, idle (subtle), win; premiums get a character moment. Big-win sequence with motion, bonus intro/outro transitions, animated win counters (BitmapText).
- Coherent style; symbol hierarchy; weighty easing (anticipation, overshoot, settle). Rejections cite "poor animations" for baked low-res (256 px @24 fps) sheets and stiff tweens.
- Replays must look identical: seed any cosmetic randomness from book data.

## Production workflow
1. Storyboard the round: spin start -> reel stops -> evaluation -> wins -> count-up -> end-round. Time each beat; turbo mode compresses them.
2. Author (Spine / Blender parts / sheets); export at near display size (2x then downscaled pixelates without mipmaps).
3. Pack (AssetPack/TexturePacker), compress (WebP; KTX2 for large), mipmaps on.
4. Integrate behind a single animation clock; pre-upload textures before first use.
5. Verify on replay events (normal win, big win, max win, bonus) at 60 fps on a mid phone and in every layout.
