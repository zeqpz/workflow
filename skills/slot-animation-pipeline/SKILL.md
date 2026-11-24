---
name: slot-animation-pipeline
description: Choose and build slot-game animation (symbol land/idle/win, characters, big-win, bonus transitions, particles) that looks premium and stays cheap - Spine 4.2 via spine-pixi-v8, live 2D rigs exported from Blender, sprite sheets, GSAP timelines, shader FX, Pixi particles - plus budgets and the reviewer's "poor animations" bar. Use when planning or implementing animation for a Stake slot, picking a tool/runtime, or fixing animation jank or quality complaints.
---

# Slot animation pipeline

Sources: engine.io Discord (#frontend-sdk-discussion, community-help 2025-2026), Esoteric spine-pixi docs, Pixi v8 docs, our Blender->live-rig pipeline in fallslotsga, the High Peaks visual pass (research/visual_overhaul_2026-11.md).

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

## Rig painted art in Blender with tools, not by hand (High Peaks, 2026-11)
Hand-keying every part of every symbol is what produces stiff, samey motion. One script per game (a SPEC table per symbol: spine, loose parts, hit move, FX) rigged and rendered 18 symbols x 4 clips headless in ~90 s.
- **Mesh**: cut the flat PNG by its alpha into a grid mesh. **Skeleton**: a spine plus a short chain per loose part (pom-pom, strap, steam, flame). **Weights**: bone-heat automatic weights (`parent_set(type="ARMATURE_AUTO")`) - good enough for cut-outs, no painting.
- **Secondary motion**: Jiggle Physics (extensions.blender.org, module `bl_ext.user_default.jiggle_physics`), then bake.
  - `bpy.ops.armature.jiggle_bake()` needs POSE mode; it bakes through `nla.bake`.
  - It uses `scene.gravity`: build the rig in the XZ plane so gravity pulls "down" the picture.
  - It only swings a chain's last bone if that bone has no children.
  - Setting a jiggle property copies to every selected pose bone: deselect first.
  - Wiggle 2's bake is modal: no good headless.
- **Characters**: Rigify (bundled). Metarig -> generated rig works headless; export only the deform bones the runtime needs (47 for a full yeti) and bake the Jiggle secondaries into them. Auto-Rig Pro, Mixamo and AccuRIG are for 3D bipeds, not flat cut-outs.
- Run Blender headless with `-b --python script.py`, **never `--factory-startup`**: it drops the add-ons.
- Scale on a bone chain compounds down the chain (a flame came out 3.8x): scale the first link only.
- After animating, run a fit pass: find the clip's extreme bounds and shrink it into the frame box, or overshoot frames get clipped at the sheet edge.
- Each symbol gets its own four clips: land (~12 f), idle (subtle; a few at a time, long rests), hit (win), burn/leave. Keep the frame-sheet format the runtime already reads, so only the pictures change.
- QA with contact sheets (every frame of every clip on one page) before packing; the eye catches a popped weight there in seconds.

## A character standing in a scene, not on it
An owner said "the character still doesn't blend" twice before these were all true:
- **Exposure first**: tint the character to the scene's light. Read the colour of the ground where the character stands (after the page's own dim overlay) and match the character's ground and body tint to it, per scene; ease it when the scene changes.
- **Contact**: hide the art's own outlined base, draw a piece of the scene's ground over the feet, and add a flat multiply shadow. A soft radial blob reads as floating.
- **Shared air**: a few of the scene's own particles (snowflakes) in front of the character.
- **One camera**: put the character's element inside the layer the camera moves (the background's own layer), above the plate and below the foreground pieces. A character that lives in the page beside the board stays still while the mountain pans, and sits on top of the foreground.
- **Canvas size**: size the WebGL buffer and atlas by the pixels the character is really shown at (layout px x the page's fit scale x dpr, capped at 2). On resize, resize the renderer when EITHER the CSS size or the resolution changed: checking only the resolution left the canvas at its old height and cut the legs off.

## Layered backgrounds
- Back / mid / foreground plates plus small sprites give depth without motion. Ask first whether the owner wants the layers to move at all: "don't make the background and foreground move" came back within a day, and so did "make the background stop bouncing when you press spin". Keep life inside the picture (clouds, a lift, a flag, glints); do not slide, lean or bounce the plates.
- Foreground pieces live in the camera's layer with their own z-index, so anything else placed in that layer can sit behind them.

## Procedural FX textures (no art budget needed)
- **Smoke**: layered periodic noise (billows, finer curl, ridged streaks), warped by a slow field, saved as a tile that repeats top-to-bottom and side-to-side; scroll two copies at different speeds under a mask. Replaces round cartoon puffs.
- **Flame**: a teardrop of heat eaten by noise that scrolls up one N-th of its tiling height per frame, so frame N+1 is frame 1; map heat to a fire ramp, alpha thinning to the edge (no outline). 12 frames x 128x192 in one row, stepped with CSS `steps(12)`.
- Check the loop numerically: the last-to-first difference should be about the same as any frame-to-frame difference.
- **Sprite strips inside SVG**: a parent rule like `svg { overflow: visible }` also applies to a nested `<svg>` and beats its `overflow="hidden"` attribute, so all 12 frames show side by side. Give the strip's window its own `overflow: hidden` rule.
- Feature props drawn in SVG (a tall tube over a column) should take the box's aspect as a parameter and stretch their middle, so they fill the cells they cover on every layout.

## Generated art
- Keep it in the game's style: a realistic generated prop was rejected for a cartoon game ("it should still be cartoon style"). Send the game's own master picture as the style reference, and a shape reference when the owner gives one.
- Transparent output is never 4K: draw the layer on flat magenta and key it out.
- Job files must be UTF-8 **without** a BOM (PowerShell `Set-Content` adds one and the JSON parser dies).
- The API key lives in a file outside the repo, one per project. Never reuse another project's key unasked; an expired key answers HTTP 401.
- Log the cost per job; a full scene (3 plates, sprites, 5 banners, a button) was about $1.

## Look at it while it moves
- An agent's embedded browser pane often reports `document.hidden`: animations are frozen in its screenshots and the game fast-forwards its holds. Photograph with a headless Chrome instead: `tools/qa_shots.py OUT scene | replay:<mode>:<event> | js:<file>` takes a burst of shots through the moment.
- Check a feature in a REAL replayed round (note two or three book ids that trigger it early), not only with a fake event: the fake skips state the real one needs.
- Look at every picture. A run with zero console errors still had a flame strip leaking across the board.
- A text label on a feature effect is the first thing an owner removes ("get rid of the text on the multipliers", twice). Say it with the picture and the cells; keep words in the ticker line.

## Production workflow
1. Storyboard the round: spin start -> reel stops -> evaluation -> wins -> count-up -> end-round. Time each beat; turbo mode compresses them.
2. Author (Spine / Blender parts / sheets); export at near display size (2x then downscaled pixelates without mipmaps).
3. Pack (AssetPack/TexturePacker), compress (WebP; KTX2 for large), mipmaps on.
4. Integrate behind a single animation clock; pre-upload textures before first use.
5. Verify on replay events (normal win, big win, max win, bonus) at 60 fps on a mid phone and in every layout.
