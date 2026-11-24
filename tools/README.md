# tools

Python standard library unless noted. They drive a local headless Chrome over the DevTools protocol, so nothing
leaves the machine except what you point them at (your mock RGS, and engine.io for the upload).

## memprobe/ - measure a slot front end the way an iPhone sees it
The model, what each number means and how to drive it are in [memprobe/README.md](memprobe/README.md); the causes and
the fix are in the `slot-ios-webkit-memory` skill. `instr.js` (injected before the page) and `webkit_model.js` (one
sample of the layer census, no game names) also work from any CDP or Playwright driver of your own.

Needs the game's mock RGS running (it also serves the front end) and Chrome at the default Windows path
(`tools/cdp.py: CHROME`). Pillow for `memlib.py` (picture sizes).

```
set SLOT_MOCK=http://localhost:8755
set SLOT_FRONTEND=C:\path\to\game\frontend
python tools\memprobe\lag.py out.json --throttle 4 --profile      # frame times per scenario + top CPU functions
python tools\memprobe\iosprobe3.py out.json --boot                # WebKit memory model through a boot
python tools\memprobe\iosprobe3.py out.json --mode base --event 94  # ... through a replayed round
python tools\memprobe\iosprobe3.py out.json --boot --extra "&mobile=0"   # the desktop path on the same build (A/B)
python tools\memprobe\who.py                                      # who owns the canvases and WebGL textures
python tools\memprobe\loadtime.py --mbps 20 [--desktop] [--page index_before.html] [--extra "&sheetworker=0"]
```

- `lag.py` scenario book ids (pops 844, cork 1, big win 94, bonus 8) are Tipsy Harvest's / Voodoo on Bourbon's 5x5
  books: pick your own for another game.
- They assume the shared slot skeleton: `playRound(mode)`, `state`, a `.fhit` "click to play" features screen,
  `#intro` for the studio ident, `RGS.state`. Adapt `enter_game` in `memlib.py` for a different game.
- `loadtime.py`: a fetch made inside a Web Worker escapes the network throttle and the resource log - give the game a
  switch to fetch on the main thread while measuring.
- `wkprobe.py` plays a replay in real WebKit (Playwright's Windows build). Throwaway venv:
  `uv venv X && uv pip install --python X playwright psutil && set PLAYWRIGHT_BROWSERS_PATH=Y && X\Scripts\python -m playwright install webkit`.

## qa_shots.py - photograph the game while it moves
An agent's embedded browser pane often reports `document.hidden`: animations are frozen in its screenshots and the game
fast-forwards its holds. This starts a headless Chrome of its own (`cdp.py`) and takes a burst of shots through the
moment, so you see the middle of a drop, not its end.

```
set SLOT_MOCK=http://localhost:8755
python tools\qa_shots.py OUT scene                 # the game at rest
python tools\qa_shots.py OUT replay:base:369       # a real book, a shot every .6 s for 15 s
python tools\qa_shots.py OUT js:fake_event.js 390x844   # run a snippet, then 7 shots over 2.6 s
```

It prints the page's uncaught errors. Look at the pictures too: a clean console has passed a visibly broken effect.

## engine_upload/github_upload_tab.js - Engine uploads from a pushed commit (Route A, the normal one)
Runs inside the logged-in `studio.engine.io/teams/<team>/games/<slug>/files` tab: reads the commit from public GitHub,
MD5-diffs every file against the scratch listing, uploads what differs and verifies it. Set `CFG.team/game/repo/commit`
and `partsToDo`, dry-run first. Steps, stale-file deletion, publish and lobby art: the `stake-engine-publish` skill.

## stake_upload.py - Engine uploads from disk (Route B: unpushed work, math books too big for GitHub)
See the `stake-engine-publish` skill. Set `STAKE_TEAM`, `STAKE_GAME`, `STAKE_FRONT`, `STAKE_MATH`. It never sees your
login: the presigned URLs are minted in your logged-in dashboard tab.
