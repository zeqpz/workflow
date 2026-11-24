"""Photograph moments of a slot game in headless Chrome while they play (stdlib; drives tools/cdp.py).

Why: an agent's embedded browser pane often reports `document.hidden` - CSS animations and rAF are frozen in its
screenshots and the game fast-forwards its holds - so a screenshot there shows the start or the end of an animation,
never the middle. A headless Chrome of our own is always "visible": a shot taken .3 s into a drop shows the drop.

    set SLOT_MOCK=http://localhost:8755
    python tools/qa_shots.py OUT_DIR scene [WxH]                    the game at rest, after the intro
    python tools/qa_shots.py OUT_DIR replay:<mode>:<event> [WxH]    a real book played back, a shot every .6 s for 15 s
    python tools/qa_shots.py OUT_DIR js:<file.js> [WxH]             run a snippet (a fake event, a notice, a camera
                                                                    move), then shots at .12 .12 .12 .3 .45 .6 .9 s

Each writes OUT_DIR/<name>_<n>.png and prints the page's uncaught errors (and the snippet's return value). Look at the
pictures: "no errors" has passed builds whose flame strip was leaking across the whole board.

Assumes the shared slot skeleton that tools/cdp.py enter_game knows (a `.fhit` "click to play" screen, `#intro`,
`RGS.state`); adapt enter_game for another game. A replay needs its PLAY button pressed: PLAY_BTN finds it by its text.
Use real book ids for the feature you are checking (find them once with a scan of the books, note them in the repo).
"""
import json, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cdp

ERRS = "window.__errs = window.__errs || []; addEventListener('error', e => window.__errs.push(String(e.message)));"
PLAY_BTN = "(() => { const p = [...document.querySelectorAll('button')].find(x => /^play$/i.test(x.textContent.trim())); p && p.click(); return !!p; })()"


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    out, scen = sys.argv[1], sys.argv[2]
    w, h = (int(v) for v in (sys.argv[3] if len(sys.argv) > 3 else "1280x620").split("x"))
    os.makedirs(out, exist_ok=True)
    name = scen.replace(":", "_").replace(os.sep, "_").replace("/", "_").replace(".js", "")
    b, n = cdp.Browser(w, h), [0]

    def shot():
        p = os.path.join(out, f"{name}_{n[0]}.png")
        n[0] += 1
        b.shot(p)

    try:
        b.preload(ERRS)
        if scen.startswith("replay:"):
            _, mode, event = scen.split(":")
            b.open(cdp.replay_url(mode=mode, event=int(event)), settle=1.0)
            if not b.wait("typeof state !== 'undefined' && document.querySelector('.cell')", 90):
                raise RuntimeError("the game never came up")
            time.sleep(5)
            print("pressed PLAY:", b.js(PLAY_BTN))
            for _ in range(25):
                time.sleep(.6)
                shot()
        else:
            b.open(cdp.game_url(), settle=1.0)
            cdp.enter_game(b)
            time.sleep(4)
            if scen == "scene":
                shot()
            elif scen.startswith("js:"):
                with open(scen[3:], encoding="utf-8") as f:
                    print("snippet:", json.dumps(b.js(f.read())))
                for wait in (.12, .12, .12, .3, .45, .6, .9):
                    time.sleep(wait)
                    shot()
            else:
                sys.exit("unknown scenario: " + scen)
        print("errors:", json.dumps(b.js("window.__errs")))
        print("shots:", n[0], "->", out)
    finally:
        b.close()


if __name__ == "__main__":
    main()
