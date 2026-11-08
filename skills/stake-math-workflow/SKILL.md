---
name: stake-math-workflow
description: Build, optimise and verify Stake Engine slot math (StakeEngine math-sdk, Rust optimiser, convex-optimizer, mnemoo tools) to pass the RGS publisher and math-verification rules. Use when designing a new mode, tuning RTP/hit rate/max win, debugging stuck sims or optimiser hangs, failing compliance (RTP 96.7%, ETL, CVaR), or preparing publish files.
---

# Stake Engine math workflow

Sources: engine.io Discord #math-sdk-discussion / #mnemoo-tools-discussion (2025-06 to 2026-11, staff: Carrot Sticks), https://stakeengine.github.io/math-sdk/, https://stake-engine.com/docs/math/math-file-format, https://stake-engine.com/docs/approval-guidelines/math-verification, local experience on this machine.

## Publish format (what the RGS requires)
Per mode, all in the upload ROOT (no subfolders): `lookUpTable_<mode>_0.csv` (NO header; `id,weight,payoutMultiplier`, uint64), books `.jsonl.zst` (Zstandard; `{"id","events"|...,"payoutMultiplier"}`), plus one `index.json` (modes, cost, files).
- payoutMultiplier integer in HUNDREDTHS (1x = 100). Floats -> `ERR_INVALID_FORMAT`.
- LUT payouts and book payouts must match exactly (MD5 of both uint64 arrays -> "payout hash mismatch").
- Sum of weights < 2^64 (lower optimiser scaling 2^50 -> 2^40 if "maximum cumulative weight exceeded").
- IDs 0-indexed; replay event id = LUT line. 1 MB per book JSON; publish Lambda caps at 15 minutes - keep ~1M base/ante and ~300k per buy mode if uploads 404.
- No math changes after release (replays pin the math version).

## Compliance (check the live math-verification doc; values as of Aug-Nov 2026)
- Every mode RTP between **96.00% and 96.70%** (floor raised ~Oct 12 2026 without announcement; Studio's math page flags it; support made a game move every mode into the band) and within 0.5% of each other; a strict float `>` check - trim weights ~1e-10 under the cap.
- Base 1.0x mode required and cheapest; base std dev >= 0.6; every mode wins non-zero more often than 1 in 50; max payout <= 500,000x (penalties above 50k 2-star / 100k 3-star).
- 100k+ sims per mode. Max win must be realistically reachable (more often than ~1 in 10M; 1 in 650M was rejected).
- Risk tests (P>5000x, P>10000x, CVaR, ETL40/etl10k) now lower max bet/exposure rather than block. "Max-or-nothing" buys fail ETL - add wins near cost and in the thousands. etl10k/etl40b are ABSOLUTE; a buy whose pool hits 10,000x often can't pass 3-star.
- Rules screen must list RTP and max win per mode.

## math-sdk workflow
- Python 3.12 venv (`uv venv --python 3.12`), `run.py` with run_conditions (sims, optimization, analysis, format_checks), `compression=True`, threads. `num_sims` divisible by batching*threads.
- Rust optimiser on Windows without MSVC: `rustup toolchain install stable-x86_64-pc-windows-gnu` + override in `optimization_program/`.
- Optimiser weights distinct PAYOUT VALUES (Gaussian mixtures), so it needs many unique payouts per range; per-book scaling avoids one board repeating (keep most-likely board < ~1% - mnemoo "Simulation Diversity").
- Criteria are sequential buckets; only one criteria may use hit-rate "x"; specify 2 of rtp/hr/av_win (`rtp = hr * av_win`). Criteria rtps must sum to the mode RTP.
- Stuck sims = a criteria the reels can't satisfy (usually wincap) looping in `check_repeat`. Use dedicated WCAP strips, tiny wincap quotas (0.0002-0.001).
- Optimiser hang in "Combining Criteria Distributions" = a fence mean/median > 10 (default band 0..10). Run the Rust binary directly to see stdout.
- The optimiser is random per run; sims are seeded. Re-verify (RGS checks) after EVERY optimisation.

## Newer notes (Sept-Nov 2026)
- Bonus-buy cost limits from the Studio validator: 2-star <= 1000x, 3-star <= 1500x (over it only lowers exposure/max bet if published at 2-star).
- Payout steps: treat 0.1x (`payout % 10 == 0` in hundredths) as the rule - the math-sdk RGS-mirroring check asserts it; 0.01x acceptance by Studio is untested.
- 20-mode guideline can be exceeded (a live game has 177 modes) - ask via dashboard ticket "General inquiry". XGC `maxBet: 0` means that mode is DISABLED.
- Failing non-critical statistics only lowers max bet; `rgs_verification` script updated 2026-11-02 to match Studio - pull the latest math-sdk before checking.
- Books per mode hard-capped at 4 GiB unpacked. `config.json` is not required by the publisher; hand-made LUT weights are fine.
- math-sdk bug: in WAYS games a reel 1 of all wilds pays 0 (`get_ways_data` builds candidates from reel 1 only) - keep wilds off reel 1 or override.
- Test RGS has thrown `ERR_VAL` after feature buys since ~Oct 11 (platform side). XGC returns maxBet 0 for every mode.

## Design heuristics (staff guidance)
- RTP split ~50-60% base / 40-45% features. Buy at C x cost with RTP r -> av_win r*C; natural trigger hr ~= av_win / (base share).
- Max-win allocation 0.1-1% of RTP; `HR = maxAmt / allocation / cost`.
- Player choices that change odds (ante, picks, ladders) = separate modes. No true stateful/progressive games. 100+ modes break the publisher.

## Tools
- math-sdk https://github.com/StakeEngine/math-sdk (branches multi_freegame, bonus-merge), `utils/rgs_verification.py`, `utils/swap_lookups.py`.
- convex-optimizer (CVXPY + Streamlit) https://github.com/StakeEngine/convex-optimizer.
- mnemoo tools https://github.com/mnemoo/tools - books explorer, compliance checks, Event Finder (review event ids), optimiser (cost-normalised targets, capped 98%).
- Stake Dev Tool https://github.com/Stake-Dev-Tool/stake-dev-tool - local Rust RGS, forced events, saved rounds (validator rejects fractional costs like 1.25 - unconfirmed for prod).
- Slot Engine (TS/Rust alternative) https://slot-engine.dev ; JeanClaude-Math https://github.com/JeanClaude-Stake/JeanClaude-Math.

## Measure what players see
Weight every book by its LUT weight and scan events (play frequency of each feature, teaser rates, most-likely board). Raw sim pools differ a lot from optimised frequencies.
