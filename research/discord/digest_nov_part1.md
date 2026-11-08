# Engine (ex-Stake Engine) Discord digest, Nov 2026, part 1: what is NEW since digest_sept.md

Source: JSON dumps in `research\discord\nov\` scraped 2026-11-08. Channels: announcements (full), rgs-docs-discussion (Sep 4 to Nov 7), mnemoo-tools-discussion, stake-engine-dev-tool, stake-engine-cli, stake-cruncher, watchtower, slot-engine-discussion (full history from Dec 2025), showcase (Sep 23 to Nov 8, skimmed for technical content).

Only items that are new or changed relative to `digest_sept.md` (data through 2026-09-12) are listed. A few older items that the Sept digest missed or got wrong are marked **[missed earlier]** or **[correction]**.

Channel tags: **ANN** announcements, **RGS** rgs-docs-discussion, **SDT** stake-engine-dev-tool, **CLI** stake-engine-cli, **CR** stake-cruncher, **WT** watchtower, **SE** slot-engine-discussion, **MN** mnemoo-tools-discussion, **SC** showcase.

---

## 1. Announcements and rule/policy changes

**Rebrand and new domains**
- The platform is now branded **"Engine"**; Stake-specific branding is being dropped (roadmap, Hayden, ANN 2026-06-30). The dashboard, docs and insights now live under `studio.engine.io`:
  - docs: https://studio.engine.io/docs/rgs
  - insights: https://studio.engine.io/insights
  - shareable demo links: `https://studio.engine.io/share/<team>/<game>/<x>/<y>` (used throughout SC from Oct).
- The demo/sandbox RGS host seen in reports is `rgsd.engine.io` (RGS, Oct). The older docs host `stake-engine.com/docs/...` is still linked (Cain, SE 2026-03-17: https://stake-engine.com/docs/approval-guidelines/game-replay-requirements).
- Someone asked whether RGS servers can be hosted on domains other than engine.io (Ali, RGS 2026-11-04); no answer. Build the RGS URL from the `rgs_url` param and never hardcode it.

**Publishing, visibility and revenue**
- **2026-09-14 (ANN, Hayden): 16:9 landscape covers are now required** for every release. Use bright backgrounds, one large clear focus, and keep it consistent with the portrait tile. A PDF guide was attached.
- **2026-09-17: "Stake and the network" option** can be picked at submission time. Only on Stake (OOS) pays 10% GGR (or the 7.5% turnover method). Network pays 5% GGR on Stake plus 5% on each operator (3.75% turnover). The choice is locked at launch, and reskins of OOS games are not allowed on the Network (ANN 09-09/09-11/09-17). FluX confirms Network games get 5% on Stake too, with no special lobby treatment (SE 10-15).
- **2026-09-24: paid promotion on Stake** via https://promoteonstake.com/.
- **2026-10-02 (Hayden): only 3-star games appear in New Releases and in the Slots/Burst sections.** Games below 3 stars can still be published but get little exposure. New Releases are ordered by your team's 30-day Insights rank, recalculated each Friday (Australian time): https://studio.engine.io/insights?type=teams&time=past30Days. The same post tells studios to do their own marketing (X, Stake follows with a ~30% launch-email open rate, giveaways, Stake Challenges, streamers via Watchtower).
- 2026-11-03 (Hayden, SC): changes are coming "to ensure 2 star games get some more air time". No details yet.
- **2026-10-11 conduct rule:** a public negative comment aimed at a person or team earns a ban of at least 7 days.
- **2026-10-14: the Engine Network opened to operators early** (it was planned for Dec 11). Operators integrate via `integration.engine.io`. Operator-exclusive "Only on X" games no longer have to release on Stake. 5% GGR is the default, and side deals with operators happen off-platform.
- 2026-10-24 (Eddie): games are live on roobet, stake.com/.us/.mx/.eu, cooked, 500casino, gamba, sixty.gg, dgenta and runewager, with 100+ more casinos signed. Operator research: www.Blask.com.
- **2026-11-04 to 11: a 7-day window to move existing OOS games to the Network.** It needs Stake's approval, top-1000 games will likely be refused, the move is one-way and goes to 5/5, and the rough bar is 2 stars or more. Earnings before the move keep the old rate (ANN 11-06).
- **Operator media (ANN 10-21 rob, 11-08 Hayden):** operators build their own tiles and banners from your team and game media uploads. Upload logos (colour, white and mono, on transparent backgrounds), tiles in square, portrait and landscape, and loose symbols, characters and backgrounds. Tag them `asset`, `tile` and `logo`. Missing media can be why an operator hasn't put your game live.
- Stats: 6,000+ review or rating requests and ~2,000 games set live in October (ANN 11-01). Requests are near 1,000 a week (ANN 10-01), and the review queue is slow (a week of waiting on a checklist submission, SE 10-16).

**Older rules the Sept digest missed or got wrong**
- **[correction] Loader:** the Stake Engine loader GIF has **not** been required since 2025-10-09 (Carrot Sticks). The Sept digest's "must be the first loading animation" is stale. Drop it and save the ~1 MB.
- **[missed earlier]** RTP band for new games is **90.0% to 96.70%** on every mode, checked automatically before review (Carrot Sticks, ANN 2026-06-11). It is quoted as "Expected: 90.0% – 96.70%" in the tool (E Z, SE 10-01).
- **[missed earlier] XEC currency / Stake EU (ANN 2026-07-15):** XEC is shown as SC (like Stake US) with `social=true`. More 3-letter sweepstakes codes are coming that `Intl` won't recognise. Use `Intl` when it knows the code, otherwise fall back to the RGS-provided display value. Never print the raw code or a `$`.
- **[missed earlier]** IP and clone policy (ANN 2026-05-14): don't mimic another publisher's titles, bet bars, symbols or characters. Disclose your inspiration at review; a title can be removed after a complaint. SC shows an active San Quentin clone argument (Oct 7).
- **[missed earlier]** Reviewers can leave written feedback with ratings (05-06). A support-ticket system lives in the team dashboard (05-11). Provably fair plus on-platform replays shipped 2026-04-24, toggled per game.

---

## 2. Tools

**stake-engine-cli = `stakecli` (mnemoo)**
- What it is: an open-source CLI and TUI for the Engine RGS/dashboard (team and game browser, upload wizard, publish flow). It also has a non-interactive mode for CI (`stakecli upload ...`).
- Ships as a single static binary: Linux .deb/.rpm, macOS, Windows. The install one-liner is in the README.
- Launched 2026-04-11 (CLI). The README has a full GitHub Actions example that builds a pnpm + Turborepo + SvelteKit frontend and publishes it on every push.
- Links: https://github.com/mnemoo/cli and https://github.com/mnemoo/cli#cicd-example--publish-a-svelte-front-end-on-every-push
- **v2.0.1 (2026-10-12)** updates it for the Engine rebrand: https://github.com/mnemoo/cli/releases/tag/v2.0.1
- Maturity: well received. "fast track uploading lots of math files" (Seal, 05-11). No security concerns were raised, but it holds your dashboard credentials, so review it before use in CI. The channel is otherwise `!payout` bot spam.

**stake-cruncher (Stake Cruncher)**
- A public stats site showing the math of games already live on Stake: payout distributions and "numbers" for published games. Launched about 2026-05-28. The URL is written defanged in chat as `stakecruncher .com` (Cabernet, CR 05-29). Feather appears to be connected to it.
- It does not analyse local or unpublished math. For that, use the LGS / local servers in mnemoo tools or Stake Dev Tool (ufibu, Onur, CR 06-06/07). It reportedly runs browser-side compute (Nordic Wager, SE 09-02).
- The site was briefly down on 2026-08-24. Nothing new after Sept 8.

**watchtower = Watchtowr (ArtVandelay)**
- A streamer-marketing platform: https://watchtowr.gg/
  - Vision models watch every Kick slots stream, detect which game is being played, and log minutes, viewers and VOD timecodes.
  - Providers fund campaigns; streamers see per-watch-hour rates derived from concurrent viewers, capped by max/creator and max/day. Watchtowr earns 5% of the rate paid to streamers.
  - Stream analytics for every game are free. Campaigns are the paid part. Endorsed in ANN 10-02.
- Signup: providers are manually verified, to stop people claiming other studios' names. A studio needs at least one game live on Stake to appear in the dropdown.
- Since Sept:
  - provider image setting and active-chatter tracking (09-02);
  - campaign fund withdrawal from the billing page, plus player count, turnover and bet count per game and provider (09-05);
  - a creators list (09-10);
  - games auto-added about 5 minutes after release (09-22);
  - campaign cancel (10-04);
  - a Discord integration that pushes live plays to your channels (10-12);
  - per-provider API tokens on request, for agents that pull VODs and auto-post wins (10-15).
- An auto-clip "moments" feature using chat velocity is in development and won't ship until accurate (10-03/10-15).
- Known issues:
  - campaigns used to stay locked until their end date;
  - mobile web logs users out, and withdraw failed on mobile (09-23, 10-01);
  - the API was briefly down (10-28);
  - the landing page needed `/login` as a workaround (08-27).
- Results: LunaticLabs spent $3k on a 2-star game with "decent results". Some streamers gamed min spins/duration and were blacklisted (WT 10-29). Only about 30 active creators as of 09-02.
- Concerns raised: none about security. Users ask for budget/ROI data and none has been shared (10-26).

**Slot Engine (FluX)** — TypeScript math SDK; the Sept digest only had its URL
- What it is: a TS/Node port of the Python math-sdk (npm-installable, no repo cloning). It generates Engine-format publish files (index.json, LUT CSV, .jsonl.zst books).
  - Lines, ways, cluster and tumble are built in. Multipliers are DIY via custom state.
  - Seeded RNG, Node worker threads, a reel generator (GeneratedReelSet), and a board service with `setSymbolsPerReel`, `setReelsAmount`, `removeSymbol` and `tumbleBoardAndForget` (experimental) for Megaways-style blockers.
- Links:
  - https://slot-engine.dev/
  - https://github.com/slot-engine/slot-engine
  - comparison: https://slot-engine.dev/docs/core/slot-engine-vs-stake-math-sdk
  - migrations: https://slot-engine.dev/docs/core/other/migration-guides
  - Panel: https://slot-engine.dev/docs/panel
  - cluster example: https://github.com/slot-engine/slot-engine/tree/main/examples/cluster_example
  - simulation memory options: https://slot-engine.dev/docs/core/game-tasks/simulation#options
  - optimization: https://slot-engine.dev/docs/core/game-tasks/optimization
  - LLM docs on Context7 (Simon², written as `http s://context7.com/llmstxt/slot-engine_dev_llms-full_txt`)
- Timeline:
  - 2025-12-01: core 0.1.x, using the math-sdk Rust optimizer.
  - 0.1.4 to 0.1.11: RAM fixes; temp data now spills to disk, so keep disk space free.
  - 0.1.7: LinesWinType calculation bug. Re-run if you used it.
  - 2026-01-02: user state/event data reference bug. Re-run sims.
  - **2026-01-21: Panel 0.1.0**, a web GUI with stats, simulation control, crowd sim, drag-drop reel designer and books/events explorer (payout filter added in 0.1.9). Core 0.2.0 at the same time.
  - 2026-03-03: 1.5-2.5x faster win calculation (core 0.2.11).
  - **2026-06-23: core 0.3.0** plus a new **TypeScript optimizer** (`@slot-engine/optimizer`) that replaces the Rust one and "optimizes lookup tables in milliseconds".
  - **2026-10-29:**
    - `@slot-engine/lgs` 0.1.0, a local gaming server that **mirrors the Engine RGS**, auto-picks up new math, and runs standalone or inside Panel;
    - Panel 0.3.0 can play the game in-browser with forced results and **replay mode**, and has a UI redesign;
    - **core 0.4.0 books start at ID 0** (was 1, so re-check replay event IDs), with some scatter helpers removed;
    - optimizer 0.2.0 is more reliable when the unoptimized game starts near target RTP.
- Maturity: the author calls it stable after many months, but it is a one-person project. Users report 6-10x faster sims than math-sdk (ufibu, 06-24) and "45m+ sims across 6 modes" (Hugo, 01-11). PRs are welcome only if they're not "completely AI generated" (FluX, 12-29).
- Concerns: the Bun runtime spams `MaxListenersExceededWarning` (harmless). No security or telemetry concerns.

**Mnemoo Tools** — nothing new since Sept
- Only memes plus older remarks the Sept digest didn't cover: "B/E" in the tool means break-even (Taylor, MN 07-01); sef says 80x/120x buys with a 75-80% chance of paying 0x "doesn't seem okay" (MN 06-19). Repo as before: https://github.com/mnemoo/tools

**Stake Dev Tool (Simon²)**
- **Stake Dev Tool Cloud shut down on 2026-10-16** because it wasn't financially sustainable. It had 400 providers, 800 GB of math and 300 GB of frontends uploaded. The self-hosted open-source tool remains: https://github.com/Stake-Dev-Tool/stake-dev-tool
- Before the shutdown: the hosted version was paid with a free tier, and a buyer charged back (08-13). It was down 09-24. A share/feedback link feature was demoed 07-23.
- Note: hosted share links from it are gone. Use Engine's own `studio.engine.io/share/...` links or self-host.
- Unrelated question in the same channel: the dashboard testing tool shows "Your session has expired. Please refresh the page." Sessions it issues seem short-lived, so handle an expired session by blocking bets and prompting a reload (燕子, SDT 09-18; no staff answer).

**Other tools and resources seen**
- **windistributions.zaurq.com** (AugustLearns, SE 09-02): win-range hit-rate and RTP breakdowns of popular Engine games from public data. One user said the URL "looks like a phishing site" (RandomName, 09-02); it was taken down and brought back. Same author is pitching a "match a top game's distribution" optimizer and a bankroll "reach 2x before bust" metric (SC 10-06).
- **XXR77's AI Spine tool**: auto layer-cutting, rigging and animation, exporting `.skel/.atlas/.json`. Closed beta on Dec 1, invite-only, 300 users (SC 09-24 to 10-22). Skeptics say its head turns couldn't come from a real Spine skeleton (Matt, 09-30).
- Several others are building AI skeletal-animation tools (java-LEEM, killomachines, Desimation, SC 10-25 to 11-01). Aych built a "custom spine program with claude" (SC 10-06); Mala tried and gave up after 2 weeks, then bought Spine.
- Free animation: DragonBones (afk, SC 10-29). Image models: fal.ai as a single API for many models (Kuopionkansleri, SC 10-09). Video compression for showcase clips: HandBrake.
- Telegram group: https://t.me/+gfJCp0QKwkJlOTc1 (ANN 08-13).
- Official TS client reminder: https://github.com/StakeEngine/ts-client. The Raw Fun Gaming "stake-engine-client" is not official (mnemoo, SE 2026-03-02).
- Caution: finished games are being sold in SC (Cloverbell via an external gmail and a Dubai FZCO, 10-19; Graaf 10-31). Treat these as unverified.

---

## 3. Frontend tech, performance and animation tips (new)

**Network and RGS robustness (most urgent)**
- **Cloudflare 429 on `rgsd.engine.io` (demo, Oct 8-12; Hashirama, Denys, TearsOfSoy, SHAFRAN, cheesemac).**
  - It hits after about 20 manual spins, or about 7 with turbo/autoplay, even on a single spin, and on the CORS preflight `OPTIONS /wallet/play`.
  - The response is a Cloudflare HTML page with **no CORS headers**, so the browser only gives `TypeError: Failed to fetch`.
  - Reloads, and other providers' games, stay blocked for a while.
  - No staff fix in the dump.
  - Frontend actions:
    - treat `Failed to fetch` on play/auth as a "slow down / reconnect" state with a modal, not a crash;
    - don't auto-retry a play;
    - SHAFRAN now holds at least 2 s from one play to the next;
    - keep turbo cadence modest.
  - This is separate from the documented `ERR_ACT` demo limit in the Sept digest.
- **Large zero-decimal currencies (VND, IDR) overflow 2^53.**
  - Top VND bet 15,000,000 at 6-decimal micro-units times 3,440x is about 5.2e16; a 25,000x win is about 3.75e17.
  - `/wallet/end-round` returns ERR_GEN on such wins (Victor 10-07; Stitch And Glitch 10-30).
  - Carrot Sticks (11-02) calls it a demo-only bug, patch pending. Whether amounts will be capped or sent as strings is unanswered.
  - Defensive option: parse RGS JSON with a big-int-safe reviver or keep amounts as strings, and test with VND/IDR.
- `config.jurisdiction.minimumRoundDuration`: neither the unit nor the timing boundary is documented (Sheldon, ChromeSharts, RGS 10-02). Community reading: seconds, measured from one `/wallet/play` to the next, gating turbo/autoplay rather than delaying end-round. Unconfirmed, so enforce it as a floor between wagers.
- A Studio test player can get stuck with an active round after a reload during a bonus: `ERR_VAL – player has active round`, and end-round returns `ERR_GEN` across Studio launches (alperen7847, RGS 10-02; unanswered). Make resume robust, and ask staff to clear it if it persists.

**Rapid-play / burst**
- Plinko-style continuous drops (several balls in flight, end-round called right after play): no official "batch" API. NTGaming's advice is to call end-round early and **delay the visible balance update** to match the animation, but adds "plinko style game is very unlikely to get approved" (RGS 09-18).
- Showing a cosmetic ball on tap before `/play` returns, with no path or result shown, was asked and not answered (BangersStudio, SDT 10-06).

**Load time and runtime perf (SC feedback)**
- "Super laggy on iPhone 15 Pro": the wheel rotation was a spritesheet. Rotate a sprite in code instead of baking frames (Théo, SC 10-07).
- "Front end seems very heavy, the animations loading is too long" (Théo, SC 10-08). Kuopionkansleri flagged a game where "everything what I open is lazy loaded" (SC 10-09). **Preload the bonus-buy and menu assets** before first interaction instead of lazy-loading on open.
- Reviewer feedback cards mention **fps problems**. One reviewer "lagged a lot" and the score dropped (Paco21, SC 10-03).
- Fill the full iframe. Black bars at the left/right edges got called out (wise, SC 10-14).
- Mobile blur traced to atlas packing and filtering: "linearlinear is the way to go" (ShaFo, SE 2026-08-05).

**Animation craft**
- **Spine is still the default route to 3 stars.** "In order to get 3 star games, you will need animation done through spine 2D" (Kingcom, SC 10-11).
  - Kuopionkansleri went the other way: he dropped Spine for sprites to avoid the "rubber band effect" (SC 09-27).
  - He also posted Claude-generated pure-Pixi FX made from one prompt (SC 11-08). TriizUp notes AI can't do weight painting for human rigs (11-08).
- Spine tricks shown by Mark Mograph:
  - **2.5D symbols** = a mesh deformed by bones (fake 3D);
  - liquid symbols;
  - shiny win sweeps (SC 10-05/10/20).
- Polish notes:
  - **ease in/out keyframes**, since linear mesh motion looks off (Ch3shere, SC 10-25);
  - eyelid blinks should either slide a lid over the eye or close top and bottom lids toward each other (REKT, SC 10-16); snappy blinks suit cartoon characters (Pleb);
  - give premium and scatter symbols distinct land/win reactions, different from the low symbols (wise, SC 10-14);
  - a mascot shown as low-fps video ("like 2fps") gets mocked (SC 10-04).
- AI-assisted pipeline that worked for Shrimx (SC 10-21): have an image model generate a **separated parts sheet** (each limb or prop on its own), then have Claude animate it, at about 10 minutes per symbol. Feeding Claude a single flattened symbol only gives "distorting symbols instead of animating layers".

**UI / bet bar**
- Heavily custom, themed bet bars review poorly. Top studios use a cleaner, more generic bar that "doesn't look like its just 1 image" (ShaFo, SC 10-13). "doing spin bars themed with the game dont get reviewed well" (Duck, SC 10-23).
- One studio fixed a past "poor bet bar" note with a **universal bet bar shared across all its games** (inyourcore, SC 10-03).
- Small requests from the community:
  - tapping the bet value opens a bet menu (vqs, 10-10);
  - put a bet selector inside the bonus-buy menu (DIMEH, 10-26);
  - don't let symbols visibly swap mid-spin (m, 10-10);
  - make big wins *feel* big, since "a 600x and it didnt really feel like i won anything" (Pleb, 10-27);
  - check that the max bet label handles more than $100 (kreshi, 10-12).
- "Claude-coded" generic menus and gradients are a recognisable negative (several, SC 09-26/27).
- Accessibility (reduced motion) is **not** required (FluX, SE 10-19).
- Branding: don't put Stake branding in-game. Stake adds its own "Only on Stake" intro (Ch3shere, SC 11-02). The disclaimer copyright may name your studio, Engine, or both (Kuopionkansleri, SC 10-10).

**Currency display**
- A reviewer rejected a game for using "kr" for both DKK and NOK: each currency must be unambiguous. Use the **symbol variant** from the studio.engine.io/docs/rgs table that distinguishes them (DarylRobot / wise, RGS 10-21/22).

---

## 4. RGS / replay / resume gotchas (new)

- **No custom RGS or backend** is allowed. You must use Engine's RGS (FluX, RGS 09-10).
- `/play` cannot take a custom parameter that steers outcome selection; every distinct outcome set has to be a mode (RasacL, RGS 09-10; implied).
- **Player-pick games** (keno picks, racer picks, routes): there is no selection-commitment API. Options people use:
  - one mode per choice (the Sept digest rule);
  - picks as pure cosmetics over the same books (pedro, SE 10-10/11), with care not to imply picks change the odds.
  - Whether picks can be persisted for resume and replay, including 0x rounds, is **unanswered** (FRANK 09-16, Cody Hoskin 10-13, TorstenTorben 10-15, LUMAR 10-11). Design replay to re-derive a deterministic cosmetic route from book data.
- Recovery after a network timeout on `/play` or end-round, when the round no longer appears in authenticate: an open question with no answer (LUMAR, RGS 10-11). razor_212's 13-question list (11-07: mode availability, amount = base vs total cost, fractional-cost rounding, safe retries) also got no staff answer. From the Sept digest: `amount` is the base bet, and mode names are case-sensitive.
- **Replay `GET /bet/replay/{game}/{version}/{mode}/{event}` returned 404** for a not-yet-approved game, using the game UUID from the studio page (LaSkeunk, RGS 09-18; unanswered). Possibly replays are only served after the math is live. Test locally (Slot Engine LGS or Panel replay mode, or mnemoo tools) before submission.
- **Persistent state between base spins is impossible** (collected coins and the like). It works inside a bonus, or via several 1x base modes explained in the rules, which is "weird" (ShaFo, RGS 09-21). Fake ladders such as the chicken game are separate bets per step (Isaac, SE 01-26). Cashout gets rejected as stateful (team reply quoted by maxbond007, SE 01-26). Stateful support is deprioritised (ANN 06-30).
- Slot Engine core 0.4.0 changed book IDs to start at 0 to match the RGS. Older Slot Engine builds were 1-based, so check event ID mapping in replay (SE 10-29).
- Replay docs page: https://stake-engine.com/docs/approval-guidelines/game-replay-requirements (Cain, SE 03-17).

---

## 5. Math tips (new)

- **RTP band 90-96.7%** for all modes, checked automatically. Players gravitate to the high end: "most the time a 96.7 is what people look for" (E Z, SE 10-01). Arcadien2k suggests about 95.4% as an unnoticeable trade (opinion). Revenue split options: 10% OOS, 7.5% turnover, 5/5 network (SE 10-04).
- **Bonus cost can be any multiple** (50x, 67x, 99x, 222x...); there is no 100x/200x rule (Artem [ENG], RGS 09-11).
- **Default mode limit is 20.** More can be requested via "engine technical support" (LongShotZombie, SE 10-07).
- Whether there is an absolute per-round currency cap beyond wincap was asked and not answered (Cofizz13, RGS 10-10). The VND overflow above suggests limits are coming.
- Star tier doesn't constrain which math template you use (Dana, RGS 09-04). "$200 is max bet for 2 stars" is rumoured and may have changed again.
- Burst/plinko clones are saturated, with "everyone does the exact same first project" (NTGaming, RGS 09-16/18). Hayden still sees a burst-category opportunity if the game is genuinely replayable (SE 2025-12-28).
- Quality of feel:
  - LuckyApesGames suggests a "FUN" checker that scans book events and drops repetitive, boring books (SC 10-22);
  - EricTehGreat says reviewers have a "low gameplay depth" style label for repetitive drop games (SC 11-07);
  - math that is "insta rip or massive profit and nothing in between" is a common complaint (Nordic Wager, SE 09-02).
- Buy modes: avoid a large share of 0x outcomes in expensive buys. A "coin respin" design that always pays something is OK (sef / Onur, MN 06-19).
- **Slot Engine simulation pitfalls:**
  - endless FS retriggers or tumbles blow RAM; cap tumbles (100 worked) and retriggers;
  - in `symbolQuotas` "any small quota" forces at least one symbol per reel, which made max-win sims impossible;
  - add a fallback win for the `maxwin` criterion while testing;
  - raise the Node heap with `NODE_OPTIONS='--max-old-space-size=...'`;
  - keep books zstd-compressed while streaming.
  Sources: Aristochat / FluX, SE 12-29; palpoutine, SE 12-03.
- AI-generated math cost one dev "100" with Claude Code hosting the sims. The advice is to build structured scripts and optimizer runs rather than prompting the math itself (Shrimx / Ch3shere, SC 10-21).
- Turnover by country (RGS): US, Norway, Canada, Hungary, Denmark, with heavy VPN caveats (Carrot Sticks, SE 10-13).

---

## 6. What reviewers praised or rejected (showcase and announcements)

**Scoring as seen in Oct-Nov**
- Ratings come as points out of 9 (three reviewers at up to 3 each). The publish floor is 6 (Sept digest). Data points:
  - 6.3 published at 2 stars (Kuopionkansleri's Cargo Stack: "no more boards without a BG. 6.3 points", SC 10-17);
  - 7.7 was a 3-star (Dana, SC 10-09);
  - 2.67/3 average (Paco21);
  - 6.7 got no written feedback (RaRa, 11-08);
  - 5.7 failed (Noob Plays, 10-22);
  - 5.3 failed with "low quality assets x2, poor animations, inconsistent art style" (TorstenTorben, 10-09);
  - one studio keeps getting exactly 7.0 (timkot, 10-14).
- Variance is acknowledged: a worse game can score 1.5 points more (Kuopionkansleri, SC 10-10). zimka complains that a "claude ui" game with stretched symbols got 6.3.
- **A released game cannot be re-rated** from 2 to 3 stars (Ch3shere / Pleb, SC 11-04). Get 3 stars before release, since only 3-star games get New Releases placement.

**Rejection and low-score reasons quoted**
- "Low quality assets", "Ai bonus ui", "Low quality character" (OZZY, SC 10-01).
- "Poor UI bet bar" repeatedly on custom art bars (Papa Hunter, 10-13).
- "Poor animations", "inconsistent art style" (10-09). "Animations look completely built with one prompt AI" (NTGaming, 09-23).
- "Images instead of symbols & art. No single animation, just pixi effects", and a "really static bonusbuy view" (Kuopionkansleri, 10-09).
- Pixelated or blurry asset outlines (Kuopionkansleri, 11-07). Pixel-art pickups read as low quality (10-09).
- FPS lag noted on the feedback card (10-03).
- Low gameplay depth / repetitive (11-07).
- A 3x3 grid as a "horrible design choice", and "I AM CLAUDED" UIs (TriizUp, 09-26).
- Copycat suspicion (San Quentin clone thread, 10-07). Disclose inspirations (ANN 05-14).
- Stateful mechanics (cashout, multi-stage rounds) are rejected outright (travisscott, SC 10-08).

**Praised or worked**
- First 3-star games shared: Marble Run (RasacL, 10-26) and Harvest Hurlers (LunaticLabs, third game, 66,666x max, 10-29).
- Things praised:
  - polished Spine work: 2.5D meshes, liquid and shine sweeps (Mark Mograph);
  - a coherent cartoon theme carried into UI details (Solar Lemon, 10-08);
  - good backgrounds such as the water-wave animation (E, 10-03);
  - board plus background (6.3 once a background was added);
  - a 3D drop game ("not many studios are making 3D games") but it needs more variety (Capy Drop, 11-07).
- A "pre-review checklist" the community uses:
  - QA every layout, including popouts ("the most annoying"), before submitting (NTGaming, SE 07-08);
  - test on a real iPhone;
  - send a `studio.engine.io/share/...` link to #request-game-feedback first.

**Process notes**
- A review can take about 12 hours to over a week depending on queue (RGS 09-10/11; SE 10-16).
- Reviewer feedback text is optional and often missing (RaRa, 11-08).
- Paid art/animation services at "$3,725 for a 2 star slot" were ridiculed (SC 09-29). Outsourcing animation is a common question (cheesemac, RGS 10-08) with no concrete vendor answers.
