---
name: stake-approval-checklist
description: Pre-submission QA for a Stake Engine (engine.io) game - the frontend, RGS, layout, art-quality and math items reviewers check and the common rejection reasons ("poor animations", "poor bet UI bar", "low quality assets", generic AI art). Use before uploading/publishing a build or requesting approval, or when triaging a reviewer's rejection.
---

# Stake Engine approval checklist

Compiled from reviewer feedback in the engine.io Discord (2025-2026) and https://stake-engine.com/docs/approval-guidelines . The reviewers' 51-item list is private; this covers what has been reported. Rating bar is 6.0 points; ratings are subjective and resubmission is allowed.

## Load and console
- [ ] Loader: the Stake Engine loader GIF is NOT required since Oct 2025 (older threads say it is). A fast, light branded loader; menus/paytable must not visibly lazy-load (reviewers flag it).
- [ ] Zero console errors/warnings on load, spin, bonus, replay (favicon is the classic one; end-round misuse is another).
- [ ] No external requests at all: fonts, scripts, analytics bundled (CSP `default-src 'self'`, cannot be extended).
- [ ] Relative paths only (`base: "./"`; `<img>` in rules/paytable too).
- [ ] Build size: aim 10-20 MB, worry above ~30-50 MB. No duplicate asset loads (check the network tab).

## Layout (reviewers test every one)
- [ ] Desktop, mobile portrait, mobile landscape, Popout S, Popout L - no clipping, no forced rotation, safe areas (mobile Chrome bottom bar).
- [ ] Huge balance strings fit Popout-Small.
- [ ] Use Stake Dev Tool's multi-resolution view or a 7-iframe harness.

## Round / RGS (see the stake-rgs-integration skill)
- [ ] Bet ladder/min/max/default from RGS; mode maxBet respected; buy/ante cost valid.
- [ ] Balance & bet 2 decimals; wins exact (3-4 dp), match payoutMultiplier x bet for ~10 wins per mode.
- [ ] Win credited after animations; end-round only on active rounds.
- [ ] Resume mid-round restores the event AND its bet.
- [ ] Bet Replay: no session, betting UI disabled, Play + Play again, shows cost/payout/multiplier, deterministic visuals.
- [ ] Social mode word swaps; RTP + max win per mode shown in rules.
- [ ] Fast/turbo and autoplay (if present) behave; space-to-spin doesn't double-fire.

## Don't ship this (real bugs players/reviewers reported, Aug-Nov 2026)
- [ ] Spin spam / turbo toggled mid-round never queues extra `/play` calls; one round in flight max.
- [ ] Spin = slam-stop (second press stops reels); keyboard (space) gated on game state - never starts an unstoppable autospin after a bonus.
- [ ] No invisible overlay/tooltip/div swallowing or passing through clicks; bet +/- never starts spins.
- [ ] Bet display shows the TOTAL cost per spin incl. ante/enhanced modes; ante stays on after features.
- [ ] No "$" or money words on stake.us/social; GC/SC bet controls tested separately.
- [ ] Fixed-precision win formatting (no float tails), 0.01 bets OK.
- [ ] Info screen RTP/max win generated from the math config (FE drifted after math updates).
- [ ] Rules text matches the books exactly ("guaranteed" claims, mystery odds); max-win rounds play out fully and are replay-tested by book id.
- [ ] Turbo doesn't stack/restart looping audio; skippable celebrations ("tap to continue" works); skip doesn't jump past all big-win stages.
- [ ] Resume dismisses intros correctly and restores the round's bet.
- [ ] Mobile: readable UI (no "UI for ants"), counters visible, board survives opening menus / tab switching / fullscreen toggles / context loss; no black bars.
- [ ] Symbols never visible outside the reel mask; text not clipped by borders; nothing pops in before the intro click; no 404s on the CDN build.
- [ ] Long session (30+ min, 500 spins) has no memory leak or slowdown; iPhone spam-press doesn't freeze.
- [ ] Safari: no VP9-alpha WebM (unsupported) - provide a fallback; no single oversized atlas (iOS crash).

## Rules / info screen
- [ ] Per-mode RTP and max win, paytable, feature explanations, jurisdiction disclaimer.
- [ ] Paylines/clusters identifiable; per-line amounts shown individually.

## Art & animation quality (most common rejections)
Dashboard rejection text quotes reviewers: players would place "1-2 bets before losing interest", "generic AI assets (standard fonts, gradients, emoji icons, border effects)", missing bonus features. "Poor animations" in practice means: every symbol needs its OWN land + win animation, the mascot must animate smoothly (low-fps idles get "Character animation is low framerate"), the background must not be fully static ("too static"), and bonuses must not all play the same. Resubmit needs a 3-day wait and is scored from scratch; a re-rate can be requested immediately.
- [ ] Coherent art style; symbol hierarchy readable at a glance; enough gameplay depth (reviewers penalise thin features).
- [ ] Bet bar: clear, standard and usable - heavily custom-themed bet bars have been penalised; fps lag is penalised.
- [ ] Polished symbol animations (land, idle, win), bonus transitions, win modals with motion, a good bet bar.
- [ ] No "generic AI" tells: stock gradients, default fonts, emoji icons in the HUD, glow-border cliches. Use custom bitmap fonts and icons.
- [ ] Original SFX (reviewers recognise reused sounds).
- [ ] 60 fps on a mid phone; no hitches at spin start / big win / bonus entry (see slot-frontend-performance skill).

## Math (see stake-math-workflow)
- [ ] Compliance tests pass on the exact files uploaded; event ids per mode ready (normal win, big win, max win, loss, bonus trigger, retrigger).
- [ ] Math frozen - no changes after release.

## Process / platform (Nov 2026)
- Platform rebranded "Engine": dashboard, docs, insights and share links on studio.engine.io; demo RGS rgsd.engine.io.
- Ratings: three reviewers score in thirds of a point; >= 6.0/9 publishes, >= 7.5 needed for 3 stars. Scores vary a lot between resubmissions (one game 4.7-6.7 for the same build). A plain dark bet bar avoids "poor bet UI".
- Community pre-check: `npx stake-preflight ./build --math ./math` (third-party - read its source before running).
- 16:9 cover required (since Sep 14 2026). Since Oct 2 2026 only 3-star games appear in New Releases and the Slots/Burst lists, ordered by your team's 30-day Insights rank; a released game can't be re-rated. ~7.7/9 reviewer score has earned 3 stars.
- Engine Network (operators, 5% rev share) opened Oct 14 2026; operators build tiles from your uploaded media.
- Upload front + math to scratch, verify, owner presses Publish. Submit approval with tile/cover art. Reply in your thread to set "awaiting".
