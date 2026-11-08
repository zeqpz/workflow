# Engine Discord digest, Nov 2026, part 3: #community-help forum (NEW vs sept / part1 / part2)

Source: `nov\community-help-threads.json`, 135 threads (one dates from 2025-09; most are 2026-10-09 to 11-08), all read in full. Only facts that are new or changed relative to `digest_sept.md`, `digest_nov_part1.md` and `digest_nov_part2.md` are listed. "[ENG]" is a Discord server tag, not a staff badge. Almost every answer comes from the community, and no Carrot Sticks or Hayden replies appear in this forum. Cain gives staff-like answers. "Unanswered" means nobody replied.

---

## 1. Low ratings: what reviewers and peers said, and fixes that moved scores

**Review process facts (new)**
- **The dashboard rejection notice text** (quoted by Vahagn, "Mouse Pi-Pi received 4.7/9", 10-21): "You may resubmit your improved game in 3 days". It then lists the common issues:
  - "Shallow gameplay with limited depth - players typically place only 1-2 bets before losing interest";
  - "Over-reliance on generic AI-generated assets (standard fonts, gradients, emoji icons, border effects)";
  - "Inconsistent or low-quality visual design with mismatched art styles and poor animation quality";
  - "Missing engaging features - bonus modes and additional game mechanics significantly enhance player retention".
- You can request a re-rating immediately, but a resubmit needs a 3-day wait (Ch3shere, same thread). **A resubmit is scored from scratch**, not just against the old notes (C - Black Coffee, "5.0/9 on first submission", 11-01).
- Initial rating takes at most about 24 h, typically 3-6 h (Ch3shere, "Game Review Timeline", 10-17).
- The guidelines queue holds **over 400 games at about 1-2 h each**, so 2-star checks are slow (ShaFo, "Publishing", 11-06). dakhart has had 6/9 games waiting since Oct 18 and Oct 24.
- **Post-rating production testing by Engine Support** (killme_kirill, "Blackpowder Oath", 10-20):
  - Support asked for a **brighter Game Tile and Cover Art** and an **RTP of 96-96.7% in every mode**.
  - The game then sat at "Waiting to hear back" with 42/51 guidelines ticked. The last items were "Check 5 wins per mode" and the final release checklist.
  - Black Coffee: "very normal… queue is smashed".
- Scores of 4.5 (Diego, 10-18) and 5.8/5.9 (GatorRolls, 10-12) don't fit three reviewers scoring in thirds. The panel size or averaging evidently varies.
- Loai ("Vault", 10-20) updated the versions first, used "Clear Rating & Resubmit", and still got v1-style feedback (3.3/9). He asked whether reviewers saw the old build. Unanswered.
- `#request-game-feedback` needs server verification first, and it shows "No access" until then (easydich 11-06, Lev 10-12). Ask a mod in general.
- LunaticLabs (Star System, 10-30): their first 3-star game started at 2 stars on its first rating. Staying Only-on-Stake got them no promotion so far.

**The "Poor animations" tag decoded (consensus across ~30 threads)**
- It refers to **mascot and symbols**, not ambient FX (Sergio, "CLEAN CUT 4.7", 11-06). Each symbol needs its own drop/land and pop/win animation. Use Spine or Rigby2D.
- Written reviewer note: "The game could benefit from additional individual symbol animations, as it currently is too static" (Nino, "Clean Getaway", 11-01). His fix was win animations for every symbol, lows included, plus wild and scatter.
- Written reviewer note: "Character animation is low framerate" (ĄRΞŚ, "Prohibition Payout", 10-27). Cause: the mascot idle ran at 8 fps (afk: "runs at 10fps"). The score went 3.7 → 4.7 after an art overhaul.
- **A static background counts.**
  - Animate wildlife or characters occasionally (Stylo, "CAPYBARA", 11-08; 9 reviews at 4.3-5.7).
  - Add sun rays (wise, "Really need any feedback", 10-28).
  - "0 animations in the background" (Chonpa, 10-16).
- Special symbols need idle and landing animations (Kingcom, "Wild West Slot", 6.7, 11-06).
- Use Spine, "not just jumping / floating around" (Duck, "Upgrade 2→3", 10-29).
- LeBulius (Neon Breach 5.7, 11-07) read "poor animation" as meaning the **big-win animations**.
- Other causes peers named:
  - laggy reel drop, too-simple symbol wins, subtle win screens (Next Chart, 10-27);
  - "rudimentary reel animations", and **symbols tumbling through the board frame** (Black Coffee, 11-01);
  - symbols "morphing" between idle and spin art (zuhnjj, 11-05).
- jacko (Danludan Ranch 5.3, 10-23): "poor animations" may really mean **every bonus plays the same** (all sticky wilds on the bottom row).
- Diego added "proper Spine" and still got 4.5. The mascot's feet were cropped on open, and the game had "no emotions" (LazyMortal, 10-18).

**"Low quality assets" / AI look**
- Peers' standard read: flat, matte, AI-genned symbols with no pop. AI human faces are the worst (Black Coffee 10-18/11-01; Arbi "Top Shelf" 10-29: "Very AI looking… frame AI, betbar is AI").
- **Default frontend-template assets, UI and transitions** get penalised (Next Chart, "game is 3.7", 10-10; Cabernet, "Danludan", 10-24).
- Other flaws named:
  - white pixel fragments and leftover white backgrounds on cut-outs;
  - top-row symbols cut off;
  - low symbols inconsistent in size;
  - cheap fonts;
  - "vibecoded" game-info, autoplay and bet menus that don't match each other (zuhnjj, "Jin Chan", 11-05).
- Ch3shere's process advice (World Builder, 10-18): idea → concept → moodboard or reference sheet → appealing concept art → only then production.
- Black Coffee to a dev who re-did symbols, bet bar and board in 2 hours: "the fact you made these changes in 2 hours, is the issue" (10-18).

**Bet bar / UI**
- "UI bar specific to the game is never good, for players or reviewers" (Black Coffee, "3rd review at 5.7", 10-18).
- "Clean, minimalist UI components instead of heavily illustrated buttons" (Alen, Mouse Pi-Pi, 10-20). Vahagn is building a **universal bet part for all games**.
- akado2009's re-work after 4.7→5.3→5.7 (resubmitted, result not posted):
  - a cleaner bet bar;
  - a bigger logo;
  - an accented board;
  - paylines removed;
  - fixed landings and cascades;
  - mascot reduced to idle only;
  - low symbols redrawn as hand-drawn vector.
- Layout:
  - the board is too small or blends into the background, so separate background, board and bet area into distinct layers (Vahagn "Sticky Ink" 10-20, Black Coffee "Hunted Wild" 10-18);
  - small symbols with a big HUD, even in free spins (killme_kirill 10-28);
  - make a 7x7 board full-width on mobile (LeBulius, Squatch Tracks 11-07);
  - shrink a big title to enlarge the reels (topaz 10-15);
  - empty left/right space (Melo 11-04).
- Polish nits:
  - spins-left counter off-centre;
  - oversized button icons and shadows;
  - **tap anywhere to slam-stop**;
  - mobile balance/win colours blending into the background;
  - tiny logo (LeBulius, "Hollow Saints" 6.7, 11-08).
- Clarity:
  - the bonus-buy button took 30 s to find (LeBulius, OG Sheriff);
  - a "chance x2" button didn't explain its effect on bet size (Stylo, 11-08);
  - a white tumble-win label on a white background (damo, 11-06);
  - position multipliers covering symbols;
  - a global multiplier too small to see.
- Bonus flow: give **each bonus its own intro and transition screen**, since a bought bonus that jumps straight in hurts bonus-hunt streamers (Sergio, 11-06).
- Give the bonus round its own background and music (Alen, 10-20). Base game needs "the same energy" as the bonus (nimnems, 10-18).
- Night Market notes (Pradeep, 10-17):
  - insufficient funds should be just a simple popup;
  - BAB (buy-a-bonus) text overflowed its boxes;
  - show a feature tutorial right after loading;
  - **BAB info, RTP and max win must exactly match the math**.
- The loading screen showed "loading" and "tap to continue" at the same time (LazyMortal, 10-09).

**Sound**
- Voice lines are "super annoying" (jacko, "Wraith Anvil", 10-23).
- Only 2 tracks (base and FS), "no emotions" (Chonpa).
- Repetitive SFX, an annoying scatter-anticipation sound, obnoxious music, rough reel-drum sounds (several, 10-16 to 11-08).
- Nino on Neon Breach: "it's the sound".

**Performance-linked low scores**
- "Laggy" on mobile: Neon Breach, where LeBulius suspects bundle size; Overclock1000.
- Carnival After Dark 5.3 "crashes on mobile due to memory overload" (leroyjenkins, 11-03).
- Polaris Passage: FPS fluctuations and freezing at start (10-26).
- Cain (staff-like, "Where and how do you guys testing", 10-11): if the reviewers' browser crashes, "you clearly have a memory leak". Check frontend size and test on your own phone via the dashboard.

**Concrete score movements reported**
- Magician Toon 6 → 6.7 (RUBEN, 10-14). Next suggestions: better post-loading plaques, UI redesign, bigger logo, mascot not floating.
- Squatch Tracks 6 → 6.7 → 6.3 after colour grading and adding feature spins (Gaugonimus, 11-06). This is variance, not progress.
- DJ Ano 4 → 5. It got "Missing bonus modes" although it has free spins plus a carry-over multiplier (lezismore, 10-19). Yellow King got the same false "missing bonus mode" (10-15).
- Prohibition Payout 3.7 → 4.7. Neon Breach GlitchWays 4.7 → 5.3 → 5.7. Guns Load 5.7 → 4.3 (RANSOM, 10-28).
- Burst/plinko and instant runners get "weak burst concept" and "Limited gameplay depth ×3" (BangersStudio 10-15; Run Daddy Run 3.7, 10-18).

---

## 2. Frontend tech, animation and tool Q&A

- **Spine + Claude Code** ("SPINE-CLAUDE CODE-2D", 11-04 to 11-07):
  - Sergio: "Tell Claude you want it animated like a Spine animator would", then iterate "when it looks weird". He says he has multiple approved games made that way.
  - Sysy (WayvyGames): had Claude build a tool that uses Codex to generate an inspiration image, split it into layers, generate each layer, and assemble them. Characters were the hardest part. Clips were posted.
  - greenos: no AI animation is as smooth as a human's.
- Learning path for mascots (Timon, 11-04): generate character images with ChatGPT or Codex, then learn mesh, rig and animate, starting from a single T-pose character and moving up to individual pieces.
- Duck (10-28): Spine "is built into the web-sdk provided".
- RGS integration via AI: give the AI the RGS docs and feed back the exact errors (LeBulius, 11-08). The thread was SmokeWorld's `/wallet/authenticate` failure on iPhone Safari, where the frontend was at fault.
- Higgsfield + Claude Code + ChatGPT stays at 2 stars (purpchateau's Sushi Belt and Prime Cut, live on stake.us, 11-03).
- Sound sources: Higgsfield, ElevenLabs, fal (Melo, 10-21). The `#collaboration` channel has SFX sellers (Black Coffee, 09-21). Diveev.Design and hmusicceo (a "150+ sounds" SFX pack) solicit by DM.
- Art spec from a hiring brief (ByJKimber, Bleu Blood, 10-15), useful as a benchmark:
  - symbols at 512x512 minimum;
  - backgrounds at 4K, crop-safe for portrait;
  - Spine JSON + atlas or PNG sprite sheets;
  - symbol idle, landing and win animations, plus host-mascot reactions.
- greenos (11-02): "90% of the game is art, graphics and frontend, 5% is math, 5% music/sound effects".
- Studio recovery testing: albertnyc verified accepted-round recovery in Studio's explicit **`demo=true` launch**. It covered Continue mid-bonus, Replay and Show result, with balances reconciled after reload and no double debit (10-10). `minimumRoundDuration` is still undocumented, and he gated positive values.
- Unanswered:
  - should the frontend honour `config.jurisdiction` flags (`disabledTurbo`, `disabledSuperTurbo`, `disabledAutoplay`, `disabledBuyFeature`, `displayRTP`), and how do Normal/Quick/Turbo map to them (Maximilian 10-30; albertnyc 10-03);
  - Polish language code: "po" in the docs or "pl"? (Maximilian).

---

## 3. RGS, upload and CDN problems and solutions

- **404/403 on JS, CSS or assets = base path.**
  - The Engine mints `/<game>/v<N>/` (e.g. `/liars-dice/v23`). The page loads but fetches from root.
  - SvelteKit: set `kit.paths.base`, not just Vite `base` (Aych, "getting 404 not found", 10-16).
  - Vanilla JS will "have a hard time with relative paths" (afk, 10-29).
  - There's no CDN setting to configure. Just keep the assets in the build folder (Arbi, 10-29).
- The 403-assets thread (2025-09-05) was "solved" via "need to use stake cdn" (JJ). Mathis (2026-08-10) gets **random** 403s on fonts, JSON and PNG with sync showing 176/176 on every browser. Unresolved.
- **Upload the built `dist/`, not `src/`** (Cain, 10-11).
- To replace all frontend files: re-import via the Files section (Soumay, 11-02).
- Versions have no hard limit ("people on v100"), and old versions stay (Black Coffee, 10-19).
- Renaming or re-theming: either resubmit or create a new game. Don't delete a game during its 3-day lock (Arbi, 10-31).
- **XGC `maxBet: 0` = mode disabled, not unlimited.** Set bet limits for that currency before submitting (Ch3shere, "XGC maxBet", 11-05; community answer). Part2 had this as unanswered.
- Bet sizes must be the `betLevels` from authenticate, with no custom in-between values (Cain, "Rules Question", 07-27). Taleb asked whether values between levels that respect min/max/step are allowed (10-12). Cain's answer implies no.
- `/bet/action` (decision endpoint) is not available to publishers. Stateful play is "in the works" (Cain, 07-27).
- Player picks can't be restored for replay because games are stateless (zimka, 10-13).
- Unanswered: can `/bet/event` hold a custom string such as "medium:3" that `/bet/replay` returns (Zavedos, 10-13)? Keno pre-bet selection binding for recovery and replay (iti92, 11-04).
- Payouts: settled automatically on the 1st of each month in USDT/USDC, **ERC-20 only, no TRC-20** (ufibu, "Reporting Access", 10-30).
- Reporting: there's no reporting API. The workaround is the stakecli method using the dashboard session SID, and accounting needs admin rights, not read-only. The Submit-for-approval "Game details" box is visible only to the team and reviewers.
- Binance source-of-funds check on a payout: open a ticket on the provider page. Support redirected NGF to Engine's legal team by email (11-03).
- **Support ticket routing:** the "Building a game" category redirects to Discord. For mode-limit exceptions use "General inquiry" (Black Coffee, 10-11).

---

## 4. Rules, math and policy clarifications

- **[CHANGED] Minimum RTP is now 96.00% (band 96.00-96.70%)**, replacing 90-96.7.
  - Pradeep's submission feedback said 96.00-96.70% (10-12).
  - Puru: the Studio math section flags min 96% and the docs are updated, with no announcement.
  - Older submissions at 94% passed under the previous rule (skidrow / Jak, 10-12).
  - Support required 96-96.7% in every mode on Blackpowder Oath (10-14).
- Max RTP is 96.7%, so no 98% burst (ShaFo, 10-13).
- Per mode, a hard limit of under 100%. A sequence- or compound-averaged RTP across step modes is not accepted, so each mode must stand alone (Ch3shere, "Step-Based Cash Out", 10-19).
- **Buy-cost tier limits (Studio validator text):**
  - "Cost multiplier: Mode "epic_bonus" value 1500 exceeds 2-star limit 1000";
  - "…within 3-star limit 1500" (cherie, "1500x Buy", 10-22).
  - Failing it only lowers exposure and max bet if published at 2 stars (Taylor), consistent with part2.
- **Max-or-nothing** (1,600x cost, 30,000x, 1 in 20): math tail checks fail, but you can still submit. Bet levels get reduced (Dennoh, 10-19; Ch3shere 10-15).
- **Payout granularity:** books store integer hundredths, but math-sdk `verify_lookup_format()` (which mirrors RGS verification) requires `payout % 10 == 0` and a minimum non-zero payout of 10, so effectively **0.1x steps** (Odd Wright, "Math SDK", 10-18; math-sdk commit a6dccd86).
  - Studio rejection is untested. Round to 0.1x and re-measure RTP from the rounded LUT.
  - This updates the Sept digest's "0.01x allowed".
- **20-mode limit:**
  - Error text: `ERR_BAD_REQUEST: too many modes: index.json declares 51, the limit is 20` (Wayn, 10-22).
  - greenos: "there is no exceptions". A dashboard ticket is still the official route.
  - Counter-example: **Candy Swipe Matchwin (Coreffect) exposes 177 modes** in authenticate (48 base, 48 ante, 72 multi_bonus, 8 feature_move, 1 ice_bonus), with the frontend choosing an equal-cost mode from the player's swipe and the rules showing base RTP as a range of 96.60-96.70% (loyal, 10-16). "Just submit it" (Zero Fucks).
- Step/crash games: there's no in-round cashout. Fake it with each step as a new bet, as Crossy Road-type games do (FluX, 10-14). There's no mid-round gamble either (Black Coffee, 10-23).
- Cash-out target as a pre-bet mode (Nate, 10-09): modes must sit within 0.5% RTP of each other.
- Unanswered questions:
  - **Max std dev 60**: is it on base-bet or cost-normalised wins, and does it apply per buy mode (Damdam 11-05; Bipo 10-17)?
  - ETL40b raw vs normalised; whether the ETL 10,000x threshold is base or cost.
  - Display titles vs mode identifiers in the UI (itshy, 10-21).
  - "Free flights" inside one round, bet-level templates, provably fair settings and post-approval art-only updates (Ginger151, 11-05).
  - Blackjack hit/stand on live games (LK7 Blackjack 100, Bolly Blackjack MAX) vs stateless rules (JimmyCricket07, 10-28).
  - Which action counts as licence acceptance (MichaelM, ticket #2741).
  - Where the 16:9 header shows (BangersStudio, 10-26).
  - Publisher loader logo GIF vs PNG (DudestDude, 10-25).
  - Challenges from countries where Stake is unlicensed (skidrow).
  - When to pick the 10% model (Colbin).
  - Canonical docs: engineio.github.io/docs vs stakeengine.org/docs, and whether there is an official CLI (Maximilian, 10-30).
- Content: dark or macabre themes (hanging figures) are probably fine (pumbaczech, 10-29).

---

## 5. Tools and URLs (verbatim)

- https://studio.engine.io/docs/approval-guidelines/jurisdiction-requirements#restricted-phrases (Arbi, 10-29)
- https://stake-engine.com/docs/approval-guidelines/math-verification (Bipo, 10-17)
- https://stake-engine.com/docs/approval-guidelines (Sandro, 10-28)
- engineio.github.io/docs and stakeengine.org/docs (named by Maximilian, 10-30; canonical status unknown)
- https://stake.us/casino/games/sevensgames-sushi-belt and https://stake.us/casino/games/sevensgames-prime-cut (2-star AI-pipeline examples)
- Share-link format: `https://studio.engine.io/share/<team>/<game>/<frontVer>/<mathVer?>`. Team page: `https://studio.engine.io/teams/<team>/games/<game>`.
- Studio demo launch flag: `demo=true` (albertnyc)
- glxtchgames .com (Picsou's demos, defanged in chat)
- Tools named: Spine (in web-sdk), Rigby2D, Claude Code, Codex, ChatGPT, Higgsfield, ElevenLabs, fal, stakecli (SID auth for reporting).
- Reference games: Hot Ink (Microgaming), Pragmatic and Hacksaw buy screens, Candy Swipe Matchwin, LK7 Blackjack 100, Bolly Blackjack MAX.
