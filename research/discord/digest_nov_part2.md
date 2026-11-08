# Engine Discord digest, Nov 2026, part 2: what is NEW since digest_sept.md and digest_nov_part1.md

Source: `research\discord\nov\` dumps scraped 2026-11-08. Read in full: frontend-sdk-discussion (FE, Sep 7 to Nov 4, 190 msgs), math-sdk-discussion (MATH, Sep 4 to Nov 8, 190 msgs), game-bug-reports (BUG, Jul 31 to Nov 7, 480 msgs). Keyword-filtered plus staff posts: game-releases (REL, Oct 13 to Nov 8), general (GEN, Nov 6-8), request-game-feedback (FB, Nov 6-8).

Only facts that are new or changed relative to the two earlier digests are listed. "Unanswered" means no staff reply appears in the dump. Most voices are community members; staff are Carrot Sticks (math/RGS), Hayden (ops) and Artem (tagged ENG, acts staff-like in MATH).

---

## 1. Frontend tech, performance and animation tips

**Repos and versions**
- The web-sdk moved to **https://github.com/engineio/web-sdk** (Cabernet, FE 09-25). The public docs still show a `<REPO_CLONE_URL>` placeholder (S Drg, FE 09-20). The math-sdk is likewise under `engineio/math-sdk` (commit a6dccd86 cited, MATH 09-27).
- The web-sdk pins **PixiJS 8.8.1**. Whether 8.22 is safe was asked and not answered (Solar Lemon, FE 10-08).
- One "graphical glitch on new games" report turned out to be device-specific: a Google Tensor G5 phone GPU drew vertices that are normally culled (Matt/Pigeon, REL 11-05). So test some Android GPUs too, not only iPhones.

**Bundle size: current community numbers**
- There is still no documented size or load-time limit (Cofizz13, FE 10-10). The consensus target is **10-20 MB** (Andes 10-14; ForTheTwo 10-11: "under 20mb is a decent target"). Arbi (FE 11-01): "everyone shoots for up to 20MB max"; 35-40 MB is too big for mobile. Lazy loading and MP4 are OK, but watch **decoded GPU size**, not file size.
- Worked case (Solar Lemon / JesusGoGetter, FE 09-20/21): spritesheets made up about 60 MB of the build.
  - Fixes: resize first, then KTX2 ("ultimate for now"). Look for the stray 2048x2048 small icon, unused files, and heavy audio.
  - Result: down to 30 MB. Keeping non-KTX fallbacks in the build keeps it around 30 MB.
  - "Check actual size in browser" (the network tab), not the folder size.
- Whether the Engine CDN serves gzip/brotli is **unanswered** (燕子 09-18; STAMP & SPIN 10-14). Assume raw transfer until you've measured it.
- STAMP & SPIN's pattern (FE 10-14): 95 MB total, but only 8.9 MB loads before the first spin (mostly one big JS inlined in index.html). Everything else lazy-loads after the first spin, and the game is spinnable in about 15 s on throttled 4G.
- A counter-view (jamalamchart, FB 11-07) on a 60 MB game: "players shouldn't have to wait for 60 MB". MP4 assets were the wrong approach there. **Load audio after the game starts**, and load only what the first screen needs.
- The Unity WebGL origin ignored `If-None-Match`, which forced a full 46 MB re-download on every launch (Raw Fun Gaming, BUG 08-01). Don't rely on revalidation caching for big files.

**Mobile and browser performance**
- iOS crashes and games that won't launch (Terminal Game titles on an iPhone 16 Pro Max): Kuopionkansleri (BUG 08-08) says "build size is irrelevant", and the cause is always **a single atlas, sprite or texture that is too big**. A 12 MB build can crash the same way with one oversized Spine atlas. He now uses KTX2.
- The iOS "A problem repeatedly occurred on https://..." page means the WebContent process was killed, usually for memory (travisscott on SHAFRAN's game, iPhone 14 Pro, BUG 10-12).
- Measured on an iPhone 14 inside the Engine player: 20-30 fps. Reviewers "will definitely test on phones". Fixes: compression, KTX2, or **serving different assets to mobile** (DosiKiller / Arbi, FE 10-09).
- **Safari doesn't support VP9-alpha WebM.** An iPad M5 game ran at 5-10 fps with broken video (Dongsiii, BUG 08-12). Animated provider logos are typically WebM (zimka, FE 10-13), so ship an HEVC-alpha or sprite fallback for Safari. One live game uses `.av1.webm` clips, which have the same Safari risk.
- Chrome 152.0.7977.65 showed a black screen after the Stake loader for *all* Engine games, and updating Chrome fixed it (Nordic Wager, BUG 09-02). Before blaming your build, check the browser version.
- Characters missing on a single user's Chrome is possibly **hardware acceleration being off**. Detect it and show a message, or degrade gracefully (java-LEEM, BUG 10-06).
- Some reviewers report that shared `studio.engine.io/share` links lag even on an M5 Max ("might be an Apple compat thing"), while others see no lag on a 2 GB GPU (palpoutine / REKT, FB 11-06).
- Chillster (GEN 11-07): iOS lag took a month to fix. It was "whack-a-mole" (fix iOS, break Windows Chrome). **The iOS simulator was useless**; test on real old hardware.
- Animations randomly ran "on speed" on first load, at a different speed each reload (TTL, FB 11-06). This is a classic missing delta-time or double-ticker bug.

**Animation: Spine vs sprites vs 3D vs video (new opinions)**
- "Even for 2-star games Spine animations is a must" (Kingcom, FB 11-06). A CryptoBiff joke (GEN 11-06), "a mascot made in spine that isn't awful" is 3-star worthy, shows the perception.
- Sprites can still reach 3 stars: Kuopionkansleri shipped sprites "with no performance issues… If it look and feel good, it get 3" (GEN 11-08). mario18g (REL 11-08) thinks sprite-sheet mascots are what "stake hates"; Ch3shere replied that the reviewers didn't.
- Low-fps sprite sheets with an unstable registration point (the character jitters) get mocked (bobl32, GEN 11-08). Spritesheets *are* recommended for things like paper crumples, for consistency and speed control (ExoFrame, FB 11-07).
- **3D:** Sergio (FB 11-06) switched a 3D mascot to 2D and got approved, and says 3D lags older machines and bloats size. Kuopionkansleri: "3d games is totally fine… if you do it well" (GEN 11-07).
- **AI-generated video** for characters is visibly worse ("me, the players and the reviewers can all see it"), and voice lines are "hit and miss" (palpoutine, FB 11-06). One game with AI video for prince and princess scored 4.3 with "low quality assets x3".
- PNG-swap or "twitch" mascots, and characters "flipping through images", read as poor animation (FB 11-06/07, several).
- **Generic Claude particle effects** are now recognisable: "reviewers have seen it about 10k times and rejected it" (palpoutine, FB 11-06).
- Background: animate something, such as sweeping spotlights, rather than a static image. "Poor background animation x3" is a reviewer tag (AVEX, FB 11-08).
- Contrast: if symbols blend into the background, add a backing panel behind the grid (Shrimx / Anci, FE 10-23).
- Win readability:
  - bounce the winning symbols sequentially, left to right, with a small delay per reel (ExoFrame, FB 11-07);
  - avoid "so much going on at once" in big wins (Wave, FB 11-08);
  - don't pause the count-up at each tier switch (AnomalyGaming, FB 11-06).

**Audio**
- AI SFX: ElevenLabs is common but "way under the quality" for slots (Solar Lemon, FE 10-12). Suno is decent for music. Freesound CC0 is hit-and-miss. Better to pick library sounds as references for a real sound designer (ForTheTwo, FE 10-12).
- "Robotic voice from elevenlabs" costs points (Ch3shere, FB 11-08). "Bad sound design" is a reviewer tag (FB 11-08), and "no music in base or bonus" gets noticed (Sergio, FB 11-06). High-pitched "tetris-style" tones that don't fit the theme also draw complaints (.Svjovin, FB 11-07).

---

## 2. Common game bugs from game-bug-reports, as a "don't ship this" list

Each item gives the reporter, the game or studio where known, and the cause where it was stated.

**Input, turbo and autoplay**
1. **Queued bets after spam-clicking.** Turning turbo on mid-tumble and then spam-clicking spin kept placing bets after the spin ended, with no autoplay on (birb on Meta Gaming, 11-01). Debounce spin, never queue `/play` calls, and drop clicks while a round is in flight.
2. **Spacebar after a bonus started an autospin that couldn't be stopped** (palpoutine on Tovix "Abyssal Reliquary", 08-24). Gate keyboard handlers on the game state.
3. **Transparent overlay/tooltip passed clicks through.** Pressing "confirm" on autoplay did one spin and then nothing, and tapping bet +/- started autospins (wise on Bad Habit, 09-05). Related bugs in the same game:
   - a bonus-card swipe hitbox jumped to the last card;
   - "Activate" scrolled the desktop page;
   - **ante mode switched itself off after a feature**.
4. **Overlapping DOM blocks a button.** A group div sat over the speed button (buff on Zero Fucks, 09-30).
5. **Double-tapping spin greyed it out instead of stopping** (ShaFo on Valkyrie, 08-07). Players want spin = slam-stop, and "hold space for hyper turbo". Lack of quick-stop is also called out in FB (Tom, 11-07).
6. **Turbo audio stacking.** The spin loop restarted every spin and sped up in turbo (wise on Donut "Kick Off", 08-16). Players mute the game when this happens.
7. **Coin-throw animation looped endlessly and couldn't be skipped** (Lezers, 08-12). "Tap to continue" didn't work, so the player had to click the cards (buff, 09-19).
8. **Resume played free spins behind the un-dismissed FS intro** (wise on Witloof, 08-11).

**Bet, balance and money display**
9. **The bet display didn't include the enhanced-mode cost.** It showed $1 while $10 was charged ("scam asf", Lukynnn on Rumble "Buddy", 11-02). Always show the total cost per spin.
10. **Resume showed the minimum bet instead of the round's bet** (100 ARS shown as 10, wise on Trifecta "Final Hour", 11-03).
11. Awkward bet ladders per currency: to reach 100 ARS you have to step to 50 and then press + (wise, 07-31).
12. **A "$" shown on stake.us** is not allowed (ufibu on "Bubble Rise", 08-06).
13. The bonus-buy bet "+" didn't work with GC on stake.us social (vanted on Valkyrie "High Elf", 09-15). Test social coins separately.
14. A win showed "50 decimals" (TTL, REL 10-19), and a 0.01-bet issue appeared (priv9 on "Charon", 10-24). Format with fixed precision.
15. **The frontend RTP didn't match the math after a math update** ("updated the math but not the FE", travisscott / Taylor, 08-31). Generate the info screen from the math `config.json` (see section 4).

**Rules or math vs presentation**
16. **The rules promised "guaranteed 3+ wilds" but some doors paid none** (Donut, 10-29). **Mystery bonus odds were displayed incorrectly** (Taylor on Meta Gaming, 11-07). Rule text must match the books exactly.
17. A max-win round was **visually truncated** "so it wouldn't take long", and players thought the round had ended early (DIMEH, 09-11).
18. Max-win spins showed nothing at all on live, although they worked in Engine testing (Dongsiii "Franken Nut", 10-15). Replay-test the actual max-win book IDs.
19. A "climb to the top" game paid 0x at the top (wise, 08-05). The feature's implied promise must hold.
20. AI-made math smells (palpoutine, 08-25, several studios):
    - a 24.7x payline for 3 symbols;
    - 20x bonus buys;
    - the scatter used as a *blocker* so free spins can't retrigger ("6-10 scatters each spin not giving a retrigger");
    - reels spinning upward.
21. Not a bug: "1 non-zero in 50" is a distribution property, not a per-session guarantee (08-31 argument).

**Layout and rendering**
22. **Mobile was unplayable**: the slider didn't work, buttons were unresponsive and the frame was "microscopic" (nonamehg, 08-07). "UI for ants" with a missing launcher button (Black Coffee on Creative City, 10-01). The FS counter wasn't visible on the phone (Valkyrie, 08-26).
23. **The board disappeared on mobile after opening a menu and returning** (Dongsiii, 08-15).
24. **Black bars**, persisting across refresh, on many Paperclip games on mobile (Artem, 09-11/16). Hayden passed it on.
25. A glitch came back on every fullscreen or theater-mode toggle, and only a reload fixed it (Joah, 10-12). Handle resize properly.
26. Other layout and rendering bugs:
    - no grid on Safari (Mutati, 08-08);
    - anims/grid broken on Windows Chrome (09-21);
    - the frame zoomed in on spin and edges overlapped (CSS grid, Color Drop, 09-26);
    - image tops cropped (CryptoBiff, 09-24);
    - layout broken on iPhone 14 Safari (Hugo, REL 10-15).
27. **Black screens**: 09-28; Win10 + Chrome 155 (halikete, 10-23). **404 assets** (ufibu on Partyhat, 10-14), so check relative paths in the CDN build.
28. **Freeze in a bonus on iPhone when spam-pressing** (Halloween Reaper, 10-05). A crashing site on mobile (nonamehg, 08-10). A broken Spine file shipped (Meta Gaming "Hidden Pond", 11-07).
29. Bonus effects bled over the open rules screen during a transition, and the total-win animation was bugged (Abugatti, REL 10-21).
30. Typos and polish:
    - the logo said "Ctystal Surge" while the tile was right (10-12);
    - broken translations (Taylor, 09-22).
31. A reviewer reported "game becomes unresponsive" with no detail, and the dev couldn't reproduce it (BangersStudio, 10-29). Watch for long-session leaks, tab switching (nonamehg, 07-31: it broke after opening another tab mid-game) and context loss.

**From FB (pre-release reviews, 11-06 to 11-08)**
- Skip jumped past all big-win steppers to the end of the whole spin (TTL).
- "WILD" text was clipped by the reel border on expanded wilds (TTL).
- The first spin swapped the board icons before spinning (AnomalyGaming).
- Symbols were visible outside the reel mask during landing (Sentora).
- Elements popped up before the "click to continue" intro (Doc Squiffy).
- A spin "nudge" (reels go up before down) was once flagged as a bug by a reviewer (Kuopionkansleri).

---

## 3. What reviewers and the community say about games

**Scoring mechanics (new detail)**
- Publish at **≥6.0/9**; **3 stars needs ≥7.5** (Ch3shere, GEN 11-08; Sentora, FB 11-08).
- Dana (GEN 11-06): 7.5 means two reviewers at 2.67 and one at 2.33, so each of the three reviewers scores in thirds.
- 3-star checklists are done in about 24 h. 2-star checklists take 24 h to 3 weeks, "most often not reviewed in a week or two" (Kuopionkansleri, GEN 11-08; Jeti; topaz, REL 10-20).
- Bug-fix updates after publishing are reviewed faster and the rating stays (df, GEN 11-07).
- Engine's guideline team **may edit your tile** themselves if a usable asset exists in your files (Ch3shere, FB 11-08). Comment if you dislike the change.
- **Variance is extreme:**
  - CryptoBiff resubmitted one 6.0 game for a month and got every score from 4.7 to 6.7 (GEN 11-08);
  - Sentora "reapplied ~8 times before hitting 3 star… 40 reviewers" (FB 11-08);
  - ReelLucky's advice is to resubmit at a different time or day to draw different reviewers;
  - "Rejected from 3 reviewers in a minute, it's not a human" (Kuopionkansleri).
- Stats: ufibu's bot showed "Rejected (24h): 364". 68 games were added in one day, 12 of them 3-star (Doc Squiffy, GEN 11-08).

**Reviewer tags quoted (new wording)**
- "Heavy reliance on generic or AI art, standard fonts, emoji icons or gradient fills that don't meet visual quality standards" (Grumpy Grandad, FB 11-08).
- "Limited gameplay depth" (often x2), "missing bonus modes" / "There is only one bonus mode" (slava9813, FB 11-07; DrCent0S, FE 09-14: 4/9 with all three reviewers flagging the bet bar).
- "Poor background animation" x3, "bad sound design", "weak burst concept" (FB 11-07/08).
- Plus the usual: poor animations, low quality assets, inconsistent art style, poor bet UI bar.
- "This type of game mode is not allowed on our platform" for a max-or-nothing "God Mode" (JesusGoGetter, MATH 09-29).

**Patterns of criticism (community pre-reviews)**
- **Empty or static screen:**
  - "70% of the screen is empty", a board with no drawn frame, nothing idle-animating (Kuopionkansleri, FB 11-06);
  - board too small, bet bar too big (several);
  - mobile reel size is "a tricky balance" (Doc Squiffy).
- **Symbol hierarchy unclear:** "can tell high vs low but not the tier" (palpoutine). Symbols look too similar. Over-designed or odd-sized 10-J-Q-K-A get flagged as low quality (AnomalyGaming).
- **Pacing:** free spins "drop stop play" with no time to read the board; symbol drop-in too slow; anticipation should be skippable. Players prefer skipping the current spin over skipping the whole bonus, or offer a separate skip-bonus button (.Svjovin, FB 11-07).
- **UI polish:**
  - mismatched fonts in the bottom bar;
  - no hover states;
  - a buy-feature button that looks like a menu button;
  - bonus-buy details should be readable without scrolling;
  - "press to continue" without a box;
  - a choppy tally font;
  - win panels cut off at the top.
- **Bet bar:** a plain solid-black bar stops "poor UI" appearing, while a themed skin of the same layout triggers it (AnomalyGaming, FB 11-06). Copying big-studio bars also gets hit (fedora, GEN 11-07). Unique bars were rejected until simplified (ReelLucky, Ander507).
- **Depth:** an expanding-wild-only game reads as "no depth" (TriizUp, FB 11-08). Add features, not just polish.
- "Simplified": "Clean, but simple… all animations done as simple as possible, audio simple" kept a game below 3 stars (Kuopionkansleri, FB 11-08).
- **Taste signals:** "vibrant cartoony simple but not too simple" (Gaugonimus). Some reviewers dislike dark goth themes (ReelLucky). "Every symbol needs to jump and the board to shake on every event" (RandomName, GEN 11-08). Gates of Olympus "wouldn't get 3 stars" through Engine (fedora).
- Praise from Hayden himself on a burst game: "animations look clean", but "the tag needs to be changed to burst" (REL 11-05).

**Business reality (GEN 11-08)**
- 2-star games get no exposure: "2 stars dead", "releasing a dead body". Yet CryptoBiff reports 2-star games doing $10k-45k in October.
- A recent 3-star made $64.5k in its first 24 h. Others report 3-star games doing $5k-15k when they miss New Releases.
- 3-star buys day-1 placement, not success. "It's all about marketing in the end" (REKT).
- Players criticised a 90.10% RTP release (REL 10-16). wise suspects games under 96% RTP don't show in Only-on-Stake "sort by new" (unconfirmed).

---

## 4. RGS, replay, resume and currency gotchas

- **The Studio test player does not pass `rgs_url`/`sessionID`** in its own URL (`studio.engine.io/teams/<team>/games/<game>/files?launch=true&…&math=1&front=5&checklist=false&replay=false&amount=1000000`), only replays work. The fix was passing math checks first (dude920228, FE 09-27/10-03).
- The docs' CDN launch pattern: `https://{{.teamname}}.cdn.engine.io/{{.GameID}}/{{.GameVersion}}/index.html?sessionID=…&lang=…&device=…&rgs_url=…`. A live asset host seen: `<team>.live.engine.io/<game>/v2/assets/...` (FB 11-06).
- **Don't fall back to debug books when `rgs_url` is missing or invalid.** Showing a playable screen without a valid RGS is a checklist failure (Pab, FE 09-27).
- Test-RGS `ERR_VAL` after a bonus feature buy, on all of one studio's released games, since about Oct 11. Others confirmed it ("common stake rgsd issue", Grandpak / afk, FE 10-13/15). There is no fix in the dump, so make the error UI graceful.
- `/play` returning **409**: should the game stop or pause? Unanswered (sebamed, FE 10-09). Treat it like an active-round conflict: block input, re-authenticate, and resume.
- **XGC authenticate returned `maxBet: 0` for every `gameModes` entry** while the global min/max were positive (Pancake Studios, MATH 10-23; unanswered). Handle a per-mode 0 explicitly, by disabling the mode or falling back, and test XGC.
- **Per-mode maxBet exists** in authenticate. Live Ganja Snail has a $1,000 base, but its 2,000x mode stopped at about $1,200 total (about $0.60 base). A max bet-cost cap of about $500k per round is implied (letsroll, MATH 11-04). Clamp per mode, not only globally.
- Bet levels start at 0.01, and the team prohibits restricting the minimum to 0.10 (3n1gma, FE 09-27).
- Social wording: "Cost 100x the play amount" and "paylines" are not OK; "pay = win, cost = played for" (wise, FE 10-06); use "lines" (DosiKiller). Doc: https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements
- Currency symbols: follow the docs table even where the dashboard differs, e.g. West African CFA (wise, FE 10-06). SGD auth trouble was reported 09-10 (travisscott).
- The bet-history page shows the base bet; click it to see the 500x cost (Andes, MATH 09-24).
- **Info-screen RTP and max win:** generate them from the math-sdk `config.json` (`bet_modes[].rtp/cost/max_win`) so they never drift (inyourcore, MATH 10-07). See failure #15 above.
- Pre-play selections (keno, positions): only the financially relevant configuration goes in the mode, exact picks stay frontend-only, and replay can be a random visual (RandomName, MATH 09-07). 104k modes is "madness".
- **Side bets with independently sized wagers in one round are not supported** (Tom, MATH 11-03; unanswered).
- Plinko and continuous play: "delay balance" (afk, MATH 09-08).
- Upload: the upload button disappearing plus "forbidden" (Gianni, FE 11-02; unanswered). The book-ID check tool hung on "loading" (MATH 09-08).

---

## 5. Math news and tips

- **Failing non-critical statistical criteria only lowers exposure and max bet**, and does not block or affect the rating (Carrot Sticks, MATH 09-29 and 11-02). On 11-02 he **updated the math-sdk verification script to match Studio**, which should fix local ETL warnings that show green on Studio (Sinker 10-13; Melk 11-01). Limits page: https://studio.engine.io/docs/approval-guidelines/math-verification
- A failing math star tier no longer "nerfs" the rating (Ch3shere, MATH 10-29). Carrot: math matters "for player retention… on the initial rating probably not so much" (10-09).
- **Reviewers still reject max-or-nothing modes** as a game-mode type ("God Mode", MATH 09-29). Artem: "max or zero" needs 3 stars (09-11). The workaround is "go big or go small" (Pab).
- **Hard book limit of 4 GiB unpacked per mode** (UInt32 byte index). It shows as `ERR_INVALID_FORMAT … :<offset near 4294967296>:0` (raccaccoonie 10-06; Carrot confirmed 10-09). Big per-round replay payloads (230 KB-2.2 MB a line) hit it fast.
- The "10M events" limit means 10M simulations (Carrot, 10-02).
- **`config.json` is not required for publishing; `index.json` is** (Onur, 09-18).
- **Your own LUT weighting is fine.** The backend only reads the CSV (`index,weight,payout`); it can even be edited in Excel (Carrot / rumbata2, 10-03). Reason given: the SDK optimizer piled about 22% of weight on the top 1% of books.
- **LOW/HIGH volatility switch:** use separate modes (same cost allowed), each with its own LUT and books, in one publish_files package (Carrot, 10-03).
- The mode cap of 20 is confirmed; more via a support ticket in the dashboard (Ch3shere / ShaFo, 10-26).
- RTP between modes: within ±0.5 of the slot RTP (Pab 09-23); a larger spread can't publish.
- Artem (09-11):
  - the books must already contain the sequences you want, since the optimizer only reweights;
  - "5,000x max feels a bit low; aim for 10k-20k";
  - reference game Corn Star (500x multiplier, 15k max): https://stake.com/en/casino/games/superstudios-corn-star/
- Max-win odds (community): 2,500x at 1 in 2.8M is "absurd"; about 1 in 100-150k is reasonable (Taylor, 10-11). A range just below max that is rarer than max itself is a reviewer judgement call, not a blocking test.
- Stake's displayed volatility bands (Cardinal, 09-22, likely std/cost): Low 1-8, Medium 8-15, High 15-25, Very High 25-40, Extreme 40+. The splash-screen volatility label isn't regulated (JesusGoGetter 09-29).
- Zeros: about 75% dead base spins is normal. Buys should "always give at least something back" (rumbata2, 09-30).
- Open questions, unanswered:
  - **ETL normalisation:** math-sdk `get_etl_cvar_p5k_10k_vales` doesn't divide by cost, so a 400x buy shows ETL above 2.0 (Maxpayn 09-27). ETL40b on a 2x Double Chance is measured against the base bet (macsonbets 10-23). Carrot's 11-02 script sync may resolve both.
  - The `payout % 10` guard vs 0.55x or 0.01-0.09x payouts (BangersStudio 09-27; raccaccoonie 10-05). The Sept digest says 0.01x is allowed.
- **math-sdk ways bug:** `src/calculations/ways.py get_ways_data()` builds candidates only from reel 1, so an all-Wild reel 1 pays 0 (axel, 10-30). Keep wilds off reel 1, or override the logic and add a full-row-of-wilds paytable entry.
- Upload scale: 40k math files (500 MB) failed to compile; about 15k files seemed to be the practical max (joeaa17, 09-19).
- Max base bet: a 2,000x mode caps the game at about $250, and failed classes lower it further. "Max win modes are really sketchy" for tail tests (letsroll / Bernoulli / rumbata2, 10-28 and 11-04).
- Updating RTP math on a released slot: java-LEEM says "ye" (10-04). This contradicts the Sept digest's "no math changes after release" and is unverified.

---

## 6. Tools and repos mentioned (URLs verbatim)

- Official repos (new org): https://github.com/engineio/web-sdk ; math-sdk file docs https://github.com/engineio/math-sdk/blob/main/docs/math_docs/source_section/file_info.md
- Docs: https://studio.engine.io/docs/rgs ; https://studio.engine.io/docs/approval-guidelines/math-verification ; https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements ; https://stake-engine.com/docs/math/math-file-format
- **stake-preflight** (egedev, FE 10-27): serves your build like the CDN, plays it against a mock RGS, and writes a report with screenshots. It checks:
  - bets that ignore RGS bet levels;
  - broken win-label amounts;
  - "buy" in social mode;
  - replay that calls the wallet;
  - resume without an event.
  Usage: `npx stake-preflight ./build --math ./math`. Repo: github.com/egedev0/stake-preflight (unofficial).
- **Engine Insights public API:** https://studio.engine.io/insights/developers (travisscott, GEN 11-06). Per-game insights: `https://studio.engine.io/insights/games/<team>/<game>`.
- **engineplayers.com**: community releases and reviews site, https://engineplayers.com/releases and `https://engineplayers.com/reviews/<team>/<game>` (FB 11-06/08).
- Spine AI: https://github.com/GenielabsOpenSource/spine-animation-ai ("That one is terrible", Arbi, FE 09-19). People also report "connected claude to spine" and teaching Claude Spine (GEN 11-07/08).
- **Rigby2D**: free open-source skeletal animator built on Tauri 2, claiming no Esoteric code (Sergio, FB 11-06). Kuopionkansleri notes that tools integrating the Spine runtime require users to hold a Spine license.
- RIFE frame interpolation for animation without video models (-sh, FE 10-25). Higgsfield MCP + Claude for assets (letsroll, FE 11-04). Seedance / Higgsfield in a pipeline (Ch3shere, GEN 11-08).
- Audio: ElevenLabs, Suno, freesound CC0 (FE 10-12).
- A YouTube video claimed to show reviewers' internal system: https://www.youtube.com/watch?v=wz-PtEJEaqY (CryptoBiff, GEN 11-06; unverified).
- Reference: Corn Star https://stake.com/en/casino/games/superstudios-corn-star/
