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
- Feature/ante cost x bet must land on a valid level; disable modes whose `maxBet` is below the current bet.
- Balance and bet: exactly 2 decimals. Wins: up to 3-4 decimals and must equal payoutMultiplier x bet exactly (1-cent bets exist since May 2026). Huge balances (ARS 10,000,000,000.00) must fit Popout-Small.
- Per-line / per-cluster wins shown individually and identifiably.

## Newer gotchas (Sept-Nov 2026)
- Demo RGS rate limit now surfaces as a Cloudflare 429 WITHOUT CORS headers: the game only sees `TypeError: Failed to fetch`. Treat a failed fetch as "slow down / reconnect" UI; never auto-retry a `/play`.
- Currencies: format money with `Intl.NumberFormat` and fall back to the RGS-provided display value for unknown codes (new XEC currency broke games). Huge VND/IDR wins exceed 2^53 - keep amounts as strings/BigInt end to end (end-round broke on demo).
- `minimumRoundDuration` (unit undocumented): enforce it as a minimum gap between bets, incl. turbo/autoplay.
- A mode with `maxBet: 0` (seen for every mode under XGC) is DISABLED - hide/disable it, don't treat 0 as unlimited.
- No supported way to persist player picks for resume/replay - encode choices as separate modes.
- Docs moved to https://studio.engine.io/docs/rgs ; replay requirements: https://stake-engine.com/docs/approval-guidelines/game-replay-requirements

## Resume
On a mid-round refresh authenticate returns the open round: replay or restart that event and RESTORE ITS BET AMOUNT (not defaultBetLevel). 0x rounds are already settled - nothing to resume.

## Bet Replay (required)
Params: `replay=true&game=<UUID>&version=<math ver>&mode=..&event=<book id>&amount=<bet>&currency&lang&device&social&rgs_url`.
`GET {rgs}/bet/replay/{game}/{version}/{mode}/{event}` - no session, no auth. `game` must be the UUID (slug -> 400 "UUID parsing failed"); unknown event -> 500 empty body. Returns `{state, payoutMultiplier (plain), costMultiplier}`.
Rules: auto-load, show a Play button, disable all betting UI, make no session calls, show bet cost + payout + multiplier, offer "Play again". Any frontend-only randomness (near-misses, decorative fills) must be SEEDED from book data so replays render identically. Reviewers ask for event IDs per mode: normal win, big win, wincap, loss, bonus trigger (event id = LUT line, 0-indexed).

## Social mode (stake.us)
`social=true` (or jurisdiction `socialCasino`). One build; swap strings. Restricted words per https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements (bet->play, buy->get, cash->coins, pay->win, stake->play amount...). Docs pages are JS-rendered: open in a browser, not a fetcher. Always show RTP + max win per mode.

## Hosting
CDN path is `<cdn>/<gameUUID>/<version>/index.html` -> Vite `base: "./"`, relative asset paths everywhere (absolute `/assets` 403s). CSP is `default-src 'self'`: no external fonts/scripts/analytics, cannot be extended.

## Checklist before review
- [ ] state vs events, plain vs hundredths handled; active:false skips end-round
- [ ] bet ladder from RGS; ante/buy costs validated; mode maxBet respected
- [ ] 2-dp balance/bet, exact win display, huge-balance layout
- [ ] resume restores bet; replay works without session + Play again
- [ ] social strings; console clean (favicon!) ; no external requests
