---
name: stake-rgs-integration
description: Wire a Stake Engine (engine.io) slot frontend to the RGS correctly - launch params, authenticate/play/end-round flow, live wire-format differences from math books, bet levels and decimals, resume, Bet Replay, social mode, demo rate limits. Use when writing or reviewing the network/round layer of a Stake game, or when spins "do nothing", rounds end instantly, balances look wrong, or replay/resume fails review.
---

# Stake Engine RGS integration

Sources: engine.io Discord (#rgs-docs-discussion, #frontend-sdk-discussion, 2025-04 to 2026-11), live checks against rgsd.engine.io, https://stake-engine.com/docs/rgs, https://github.com/StakeEngine/ts-client (cleanest minimal client), web-sdk `Authenticate.svelte`.

## Launch URL
`?sessionID=..&rgs_url=..&lang=en&currency=USD&device=desktop&social=false&demo=true` - read everything from the query string. It's `lang` (not `language`). `gameID` comes back from authenticate. Local dev: dashboard Launch Game -> "local testing" injects sessionID+rgs_url into your localhost URL (without them: `POST https://wallet/authenticate ERR_NAME_NOT_RESOLVED`).

## Round flow
1. `POST {rgs}/wallet/authenticate {sessionID, language}` -> balance, config (`minBet`, `maxBet`, `stepBet`, `betLevels`, `defaultBetLevel`, `gameModes:[{mode,costMultiplier,maxBet}]`, jurisdiction), and `round` ONLY if one is unfinished.
2. `POST /wallet/play {sessionID, amount, mode}` - amounts are micro-units (1_000_000 = 1.00). Mode names are case-sensitive vs index.json (`ERR_VAL` otherwise).
3. Animate the round, THEN `POST /wallet/end-round` - but only when `round.active === true`.

## Live wire format != math books (silent killers)
- Events are in `round.state`, NOT `round.events`. Unhandled -> reels never spin, round "ends instantly".
- `round.payoutMultiplier` is a PLAIN multiple (0.7 = 0.7x); books store hundredths. `round.payout` is the exact integer money amount - prefer it. Event-level amounts inside state (setWin/setTotalWin/finalWin/winInfo.win) ARE hundredths.
- Losing rounds are auto-settled: `active:false`; calling end-round then -> 400 `ERR_VAL "player does not have active round"`.
- `end-round` returns a BARE `{amount, currency}`, not `{balance:{...}}`.
- Errors use the `error` key (`ERR_VAL`, `ERR_GEN`, `ERR_ACT "Slow down"` = demo limit 100 req/min, `ERR_IPB`...).

## Balance, bets, decimals (review-enforced)
- Show `/play` balance (stake deducted) during the round; credit the win only after animations (end-round balance).
- Bet levels/min/max/default ONLY from authenticate; never hardcode, no free-typed bet input. Levels vary per currency.
- **Every load opens on `config.defaultBetLevel`** - a refresh included - or the level nearest it if it isn't one of them; only a round left open overrides it (it resumes at its own amount, below). Two rejections:
  - 2026-11-16 (Voodoo on Bourbon): "the selected bet level remains unchanged instead of returning to the default" - the game kept the chosen bet per session in localStorage. Never persist or restore a chosen bet.
  - 2026-11-17 (Smukiez & Skelly): "does not dynamically apply the betting parameters returned by /authenticate" - a 1,000 GC wallet with a 10,000 GC default opened at 1,000 GC because the game dropped to the highest level the balance covered. Open on the default EVEN WHEN THE BALANCE CAN'T COVER IT; Spin then answers "Not enough balance - lower the bet/play" without calling `/play`.
- The ladder = `config.betLevels` filtered to `minBet <= level <= maxBet` on a `stepBet` boundary (a 0/missing bound = no bound; if the filter leaves nothing, use the list as sent; with no list, `[minBet]`). Test it with a mock that can send any default (e.g. a session suffix) and a check that a 2.50 wallet with a 5.00 default opens at 5.00.
- Feature/ante cost x bet must land on a valid level; disable modes whose `maxBet` is below the current bet.
- Balance and bet: exactly 2 decimals. Wins: up to 3-4 decimals and must equal payoutMultiplier x bet exactly (1-cent bets exist since May 2026). Huge balances (ARS 10,000,000,000.00) must fit Popout-Small.
- Per-line / per-cluster wins shown individually and identifiably.

## Newer gotchas (Sept-Nov 2026)
- Demo RGS rate limit now surfaces as a Cloudflare 429 WITHOUT CORS headers: the game only sees `TypeError: Failed to fetch`. Treat a failed fetch as "slow down / reconnect" UI; never auto-retry a `/play`.
- Currencies: format money with `Intl.NumberFormat` and fall back to the RGS-provided display value for unknown codes (new XEC currency broke games). Huge VND/IDR wins exceed 2^53 - keep amounts as strings/BigInt end to end (end-round broke on demo).
- `minimumRoundDuration` (unit undocumented): enforce it as a minimum gap between bets, incl. turbo/autoplay.
- `gameModes[].maxBet: 0` (sent for every mode under XGC) means NO per-mode cap - fall back to `config.maxBet`. Never hide a mode for it: a reviewer rejected a build whose bonus cards vanished under GC (2026-11-15), and another whose cards all said "LOWER THE PLAY" while base spins were refused at every level (2026-11-16). One helper (`maxBetOf(mode)` -> positive mode cap, else `config.maxBet`, else none) used by the cards, the buy button, the round, ante/boost and autoplay.
- **Autoplay must always be stoppable** (rejected 2026-11-16: "can't be disabled when the balance can't cover all rounds").
  - Require only the NEXT round to be covered (ante/boost price included), not all N.
  - Never start if the first round isn't covered.
  - Every way it ends goes through one `stopAuto()`: Auto pressed, Spin between rounds, out of balance, a failed round. It retires the loop at once and gives back plain Spin at any level the balance covers. Spin between autoplay rounds stops the run and starts no round of its own.
- No supported way to persist player picks for resume/replay - encode choices as separate modes.
- Docs moved to https://studio.engine.io/docs/rgs ; replay requirements: https://stake-engine.com/docs/approval-guidelines/game-replay-requirements

## Resume
On a mid-round refresh authenticate returns the open round: replay or restart that event and RESTORE ITS BET AMOUNT (not defaultBetLevel). 0x rounds are already settled - nothing to resume. A round staked at an amount that's no longer a level still resumes: add it to the ladder for that round.

Long bonuses: resume where the player was, not from spin 1. A reviewer saw "crashes during Bonus Mode, persists after reloading": the reload replayed the whole bonus and rebuilt the same memory peak.
- Post a progress marker as each free spin finishes (`POST /bet/event`, fire-and-forget, with the index of the event the round stands at).
- On reload, read `round.event` defensively. Anything odd means replay from the first event.
- Apply the earlier events silently (board, multipliers, running total, spin counter: no intro, clips or sound), then play on to the total-win screen and end-round. Pay `round.payout` as always.
- Replays neither mark nor resume.
- How the live RGS echoes the marker was assumed from the docs, not verified live (2026-11-17).

## Bet Replay (required)
Params: `replay=true&game=<UUID>&version=<math ver>&mode=..&event=<book id>&amount=<bet>&currency&lang&device&social&rgs_url`.
`GET {rgs}/bet/replay/{game}/{version}/{mode}/{event}` - no session, no auth. `game` must be the UUID (slug -> 400 "UUID parsing failed"); unknown event -> 500 empty body. Returns `{state, payoutMultiplier (plain), costMultiplier}`.
Rules: auto-load, show a Play button, disable all betting UI, make no session calls, show bet cost + payout + multiplier, offer "Play again".
**The replay window reviewers ask for (2026-11; this layout passed review):** one card, shown before the round AND again when it has played out - a REPLAY tag, the title "Bet Replay", then **Mode, Base Bet, Cost Multiplier, Total Bet Cost** (boxed), **Payout Multiplier, Total Win** (boxed), a wide "Start Replay" button (it becomes "Replay Again" at the end), and the small print "This is a replay of a previous bet round. No bets will be placed." Everything is a multiple of the BASE bet: total = costMultiplier x amount, win = payoutMultiplier x amount. Loading and error states ("Replay Unavailable" + Try Again). Mode by its one display name. Format multipliers like the money (not the locale's decimal comma beside "EUR 965.70"). Two columns in short, wide windows (Popout S), scaled to fit, never scrolled.
**Respect `lang`:** translate the replay window's words for the languages a link can carry (es, pt, de, fr, it, tr, ru, pl, fi, id, vi, ja, ko, zh...), set `<html lang>`, fall back to English; social mode is English only. `amount` and `currency` may be missing or junk: default 1.00, and in social mode show bare figures (never "$"). Any frontend-only randomness (near-misses, decorative fills) must be SEEDED from book data so replays render identically. Reviewers ask for event IDs per mode: normal win, big win, wincap, loss, bonus trigger (event id = LUT line, 0-indexed).

## Social mode (stake.us)
`social=true` (or jurisdiction `socialCasino`). One build; swap strings. Rules page: https://studio.engine.io/docs/approval-guidelines/jurisdiction-requirements (JS-rendered: open it in a browser; a fetcher gets an empty shell). Always show RTP + max win per mode.
The official table (2026-11-16): at the cost of->for; be awarded to player's accounts->appear in player's accounts; bet/bets->play/plays; betting->playing; bonus buy->bonus (feature); bought->instantly triggered; buy->play; buy bonus->get bonus; cash->coins; cost of->can be played for; credit->balance; currency->token; deposit->get coins; fund->balance; gamble->play; money->coins; paid->won; paid out->win; pay->win; pay out->win/won; payer->winner; pays->wins; pays out->won; place your bets->come and play; purchase->play; rebet->respin; stake->play amount; total bet->total play; wager->play; withdraw->redeem; win feature->play feature.
The same page also says:
- ALL player-facing text: UI labels, buttons, paytables, help, loading screens, pop-ups, confirmations, error messages, settings (common misses: "Bet", "Auto Bet", "Total Bet" in autoplay, "Buy" on bonus buttons and their confirm dialogs).
- **Mode names carry no restricted term** ("buy", "bet", "pay") and are the SAME in the game, the replay window and the math files -> one `MODE_NAMES` table (Base, Bonus, Extreme Bonus, Bonus Boost...) used by the shop, rules, recent rounds and replay.
- The replay window has no restricted terms. XSC/XGC load and display correctly, never prefixed with "$". English only in social mode.
How we do it (zeqpz/orleans `rules.js`):
- Add the inflections the table leaves out (costs, buying, payouts, wagered, withdrawals...), and match everything in ONE regex pass, longest phrase first, on word boundaries (`\s+` between words), so "buy bonus" wins over "buy" and a replacement is never swapped again.
- Each replacement borrows the case of the word it replaces ("Buy Bonus" -> "Get Bonus", "BET" -> "PLAY").
- Where a word swap would change the meaning or read badly, write both wordings inline: `{real|social}` - "the new board is {paid|checked for wins} again", "every spin {costs|plays for} x1.25 the {bet|play amount}".
- Pass ticker, notices, banners, error panels and the server's own error messages through `T()` at show time (social can switch on after authenticate).
- Verify by scanning every text node and the `aria-label`/`title`/`alt`/`placeholder`/`value` attributes on every screen (shop, rules, autoplay, replay), hidden ones included, with an XGC wallet: zero restricted words and no "$".

## Hosting
CDN path is `<cdn>/<gameUUID>/<version>/index.html` -> Vite `base: "./"`, relative asset paths everywhere (absolute `/assets` 403s). CSP is `default-src 'self'`: no external fonts/scripts/analytics, cannot be extended.

## Checklist before review
- [ ] state vs events, plain vs hundredths handled; active:false skips end-round
- [ ] bet ladder from RGS (within min/max/step); EVERY launch and refresh opens on defaultBetLevel (no remembered bet), even above the balance; ante/buy costs validated; mode maxBet respected (0 = no cap)
- [ ] autoplay stoppable in every state; needs only the next round covered
- [ ] bonus buys work under GC with enough balance
- [ ] 2-dp balance/bet, exact win display, huge-balance layout
- [ ] resume restores bet; replay works without session; the replay window lists Mode, Base Bet, Cost Multiplier, Total Bet Cost, Payout Multiplier, Total Win with Start Replay / Replay Again, in the link's `lang`
- [ ] social strings (full table + inflections, mode names without buy/bet/pay, no "$" on GC/SC), scanned on every screen; console clean (favicon!) ; no external requests
