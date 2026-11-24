# A visual overhaul in one day: what worked, what the owner sent back (High Peaks, 2026-11-23)

One game (a cartoon ski-resort cluster slot, single `index.html` + Pixi v8 board canvas) taken from "generic" to rigged
symbols, a rebuilt character, a layered scene and a new feature prop. Numbers are from that day's work; the rules are
in the `slot-animation-pipeline` and `stake-engine-publish` skills.

## What was built, and what it cost
| Piece | How | Numbers |
|---|---|---|
| 18 symbols x 4 clips (land, idle, hit, burn) | Blender 4.2.3 headless: alpha-cut mesh, spine + part chains, bone-heat weights, Jiggle Physics baked | ~90 s to rig and render all 18; pack ~90 s more |
| Character (yeti) | Rigify metarig -> generated rig, six clips re-authored | 47 exported bones, 22 Jiggle-baked secondaries |
| Scene | 3 generated plates (back, mid on magenta and keyed, foreground pieces) + sprites | ~$0.11 per 4K opaque plate, ~$0.05-0.07 per 1024 sprite |
| Bonus Buy banners, bonus button, new symbol art | generated with the game's master picture as the style reference | whole day's art about $1 |
| Feature prop (a tall tube over a column) | SVG drawn for the column's aspect, real smoke and flame textures made procedurally | smoke tile 256x512, flame strip 12 x 128x192 |
| Publish | commit -> dashboard-tab upload -> publish | 336 files uploaded and verified in 120 s |

## Add-on research verdict (Blender 4.2)
- Use: Rigify (bundled), Jiggle Physics (extension; bakes headless), bone-heat automatic weights.
- Don't: Wiggle 2 (modal bake), Auto-Rig Pro / Mixamo / AccuRIG (3D bipeds, not flat cut-outs). No good free
  keyframing add-on turned up: write the keys from a per-symbol table and let physics add the secondary motion.

## What the owner sent back, in order (each one is now a rule in the skill)
1. "Our character still doesn't blend well with the background" - the first pass added a shadow and a ground piece but
   left the character brighter than the scene. Matching exposure to the dimmed ground under the feet fixed it.
2. "Don't make the background and foreground move" - parallax and mouse lean were removed the same day. Later: "make
   the background stop bouncing when you press spin" - the spin's background hop went too. Life stays inside the picture.
3. "The bong should still be cartoon style" - a realistic generated prop did not belong in a cartoon game; the owner's
   reference picture was about the SHAPE. Ask which of style and shape a reference is for.
4. "Our character's legs missing" - the renderer was resized only when the resolution changed; a layout change that
   kept the resolution left the old canvas height and clipped the legs.
5. "Our character should move with the background when the cinematic camera moves" / "make the character behind the
   foreground" - the character's element belongs in the camera's own layer, between the plate and the foreground.
6. "Make sure the bong takes up the entire board ... from top to bottom" - a prop over N cells is drawn for that box's
   aspect, with a stretchable middle.
7. "Get rid of when it says powder dusting ..." then "get rid of the text that appears on the bong multipliers" - no
   words on the effect; the cells and the ticker line carry the number.
8. Alerts: "match the color / transparency / font and scheme of our hud ... thinner and longer and sits underneath the
   board" - every transient message uses the HUD's own fill, outline and face, placed from the board's rect.

## Bugs that only a picture showed
- The flame's 12-frame strip spilled across the board: a parent `svg { overflow: visible }` rule beat the nested
  `<svg overflow="hidden">` attribute. Console clean, picture obviously wrong.
- A fake feature event threw in code the real round never reaches; the real replay (a noted book id) was clean. Test
  the effect with both, trust the replay.
- Browser-pane screenshots showed animations at rest (`document.hidden`); headless Chrome showed them mid-flight.

## Still open after the day
- Nothing was checked on a real phone; an iPhone texture smear seen before the pass was never reproduced on desktop.
- Bonus scenes are still single plates; the icon-size prop still uses cartoon puffs for smoke.
