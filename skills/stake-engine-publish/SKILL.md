---
name: stake-engine-publish
description: Upload a pushed commit to a Stake Engine (engine.io / studio.engine.io) game's scratch area from inside the logged-in dashboard tab, delete stale files, publish front or math, read the version list, and set the lobby tile (3:4) and cover (16:9) in the Media Editor. Use when the owner says "upload", "publish", "post this for engine", or when lobby art must change.
---

# Upload and publish on Engine

Engine has no API key: it trusts only the logged-in browser session. So everything runs in the dashboard tab (the Claude browser pane or the owner's Chrome), and the tab fetches the files itself from public GitHub. No URLs or tokens pass through the conversation. Script: `tools/engine_upload/github_upload_tab.js`.

**Only upload or publish when the owner asks.** "Upload and publish" / "post this for engine" covers that build only; a new build needs a new OK. Publishing is outward-facing: the owner, not an agent, decides.

## Before you start
- The commit is pushed and the working tree is clean (`git rev-parse HEAD origin/main` equal, `git status --short` empty). The tab reads GitHub, not your disk.
- Open `https://studio.engine.io/teams/<team>/games/<slug>/files`, the plain page:
  - `?launch=true` answers "Forbidden" to uploads;
  - `/games/<slug>/files` without `/teams/<team>` renders "Something went wrong".

## Route A (the normal route)
1. Fetch the script from raw GitHub and patch `CFG` with string replaces. Use a `rep(a, b)` that **throws if `a` is missing**: the repo's copy can differ from what you expect (one repo's copy still said another game's slug).
   - Set `game`, `repo`, `commit` (full 40-char SHA) and `partsToDo: ["front"]` (or `["math"]`).
   - Set `dryRun: true` first.
2. Run it. The page's CSP blocks `eval` but allows inline scripts, so append `<script>` with text `"window.__upRet = " + source`. Poll `__upStatus()` inside one JS call (loop up to ~40 s); a front batch of ~900 files checks in ~35 s.
3. Check that the dry run's `changed` list is exactly the files your commits touched. More means the scratch area holds someone else's upload, or CRLF copies (`crlfSame` handles those).
4. Run again with `dryRun: false`. It needs `phase: "done"`, `verified == uploaded`, `errors: []`. Every upload is checked against a fresh listing whose etag is the MD5 of the bytes sent.
5. **Stale files**: diff the scratch listing (`GET /api/file/game/<team>/<slug>/scratch/front`) against the commit's tree (`api.github.com/repos/<repo>/git/trees/<sha>?recursive=1`, `frontend/` minus `mock_rgs.py`/`__pycache__`).
   - For anything extra, confirm it was deleted in git and nothing references it (`git grep`).
   - Then `POST /api/file/delete {team, game, paths:[...]}`. Use a `paths` ARRAY: a singular `path` answers `{"deleted":0}` silently.
6. **Publish**: `POST /api/file/publish/front {team, game}` -> `{"version":N,"changed":true}`.
   - `changed:false` means nothing new reached the bundle (e.g. a path minted without its `front/` prefix landed beside it).
7. `GET /api/teams/<team>/games/<slug>/versions` lists newest first. `approved: []` = not live in any jurisdiction yet: players still get the last approved version until the reviewer passes it.

## API facts
- `POST /api/file/upload {team, game, path, size}`: ONE file per call. `path` keeps `front/` or `math/`; the real byte size is required. Returns `{url}` for a presigned S3 PUT (single-shot up to 100 MB). Never call `/api/file/complete`.
- Remote bundle files are the git blobs (LF). Uploads from a Windows working tree are CRLF and MD5-differ.
- A new version can 404 an asset on its first request (cold edge), and the bare `<cdn>/<slug>/v<N>/` URL can 403 for new versions. Neither is a failed publish: launch it from the dashboard's Play Game.
## Route B: math books too big for GitHub, or work not pushed yet (`tools/stake_upload.py`)
The tab can't reach localhost (the pane blocks it), so the bytes leave from Python:
1. `stake_upload.py manifest` writes the sorted key/md5/size list plus its SHA-256, and a tab script.
2. The tab verifies the hash, diffs against the scratch listings and mints one URL per changed file. It returns compact JSON `{origin, tokens[], creds[], rows[]}` plus that JSON's SHA-256, about 150 bytes a file instead of ~2 KB per presigned URL.
3. Write that JSON to a file with the Write tool. A Bash heredoc chokes on ~2 KB lines.
4. `stake_upload.py build mint.json <sha>` refuses a mistyped copy and rebuilds the URLs.
5. `stake_upload.py put front|math <urls file>` streams with stall timeouts, progress and retries. Books ran ~200 KB/s per connection, so run several processes in parallel. Use a Windows-style path (`C:/...`).

Mint fresh URLs per session: the STS credentials expire well before the advertised 6 h.

## Checking a whole bundle in one shot
The SHA-256 of the sorted `key md5` lines of the committed files (MD5 of the git blobs) must equal the SHA-256 of the sorted `key etag` lines from the scratch listing in the tab. Any difference means remote-only or changed files. Orleans was 775/775 equal, plus one unused `seal.webp` left in the bundle: delete it as in step 5 of Route A.

## Playing a version from the dashboard
- In a narrow browser pane, Play Game is hidden by the layout. Navigate to the launcher directly: `.../files?launch=true&team=<team>&game=<slug>&currency=USD&language=en&deviceType=desktop|mobile&balance=1000000000&social=false&math=<M>&front=<N>&checklist=false&replay=false&amount=1000000`.
- Read the iframe's src (`/<slug>/v<N>/`) to confirm which front version it serves.
- Engine's own splash shows for ~20 s first.
- Go back to the plain `/files` page before uploading again: the launch URL answers "Forbidden".

## When the tab isn't there
If navigating to studio.engine.io is refused, the owner isn't signed in, or the tab was closed: stop and ask the owner to open the Files page signed in. Never sign in for them or work around it.

## Lobby art (Media Editor)
Tiles are BUILT in `/teams/<team>/games/<slug>/media/tile?media=<id>&ratio=3:4|16:9` from Media-library images:
- **Background**: no text, BRIGHT (the editor auto-lightens dark ones; reviewers reject dark edges).
- **Foreground "key item"**: a transparent PNG of ONE main character that fills the key focus box. A reviewer rejected a tile with two characters: "a single main character in the Key Focus Area on a bright background with no dark edges". A pre-shrunk foreground came out too small; use the waist-up cut and let it fill the box.
- **Gradient colour**: set through the native value setter + `input`/`change` events, then Save.
- **Title** in Stake's font: 3:4 only, and the 16:9 cover carries no text.
- Save stores ONLY the format on screen. The background is shared between formats, and re-picking it resets the foreground's position. So save the 16:9 first, then re-pick the 3:4 background, re-place the foreground, save the tile. Clicking the 16:9 tab by ref may do nothing: navigate to `ratio=16:9` directly.
- File inputs: build a `DataTransfer` from a fetched blob, assign `input.files`, dispatch `change`. Where the page ignores synthetic events, `import()` the studio chunk that does `PUT /api/asset/<team>/<game>/media` (grep `/_app/immutable` chunks for "api/asset") and call its export with (team, game, File, tags).
- The Media page is lobby art only (16:9 cover, 3:4 tile). Runtime assets belong in the front bundle.

## After publishing, report
- The version number, how many files went up and how many were verified, and any stale files deleted.
- That it is not approved yet.
- What still needs a real device (see `slot-ios-webkit-memory`).
