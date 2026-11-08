# workflow: Claude Code skills, agents and a local agent hub for Stake Engine slot frontends

Know-how for building HTML5 slot games for Stake Engine (Engine / engine.io) that run as efficiently as possible, packaged for Claude Code. It comes from:
- the engine.io Discord, April 2025 to November 2026;
- official docs (PixiJS v8, Spine, Stake Engine);
- profiling work on our own games.

## What's here

| Folder | Contents |
|---|---|
| `skills/` | 8 Claude Code skills, each a `SKILL.md` (see the list below) |
| `agents/` | 7 specialist subagents that preload those skills and share the same safety rules |
| `agenthub/` | Local MCP task hub, so any number of Claude Code sessions can queue work for the agents |
| `research/` | The sourced research the skills are built from: the web report plus Discord digests (summaries only, no raw message dumps) |

**Skills**
- `slot-frontend-performance`: Pixi v8 settings, batching, masks and filters, upload/GC hitches, DOM/CSS compositor traps, the measurement workflow
- `slot-animation-pipeline`: Spine 4.2 (spine-pixi-v8), rigs, sprite sheets, GSAP, shader FX, budgets, the reviewer quality bar
- `slot-frontend-stack`: TS + PixiJS v8 + Vite, web-sdk vs custom, the asset pipeline (AssetPack, KTX2/WebP, Howler, fonts), CDN/CSP constraints
- `slot-tools-and-resources`: catalogue of official and community repos and tools, with links
- `stake-rgs-integration`: wire format, bets and decimals, resume, Bet Replay, social mode, newer gotchas
- `stake-math-workflow`: math-sdk, optimisers, publish format, compliance (RTP 96.00-96.70%, buy caps, ETL)
- `stake-approval-checklist`: pre-submission QA plus a "don't ship this" list of real reported bugs
- `agenthub`: how to hand tasks to the hub

**Agents**
- `slot-frontend-perf`
- `slot-animator`
- `slot-asset-optimizer`
- `stake-rgs-engineer`
- `stake-math-engineer`
- `stake-approval-reviewer` (read-only)
- `slot-frontend-researcher` (read-only)

## Install
```
install.cmd
```
This copies `skills/*` to `%USERPROFILE%\.claude\skills\` and `agents/*.md` to `%USERPROFILE%\.claude\agents\`. On macOS or Linux, copy the same folders into `~/.claude/`.

## Agent hub (optional)
```
agenthub\start_hub.cmd
claude mcp add --transport http --scope user agenthub http://127.0.0.1:8799/mcp
claude auth login        # once, so headless workers have a login of their own
```
Full details are in [agenthub/README.md](agenthub/README.md).

Summary of how it works and why it's safe:
- Python standard library only.
- Listens on 127.0.0.1 only, with Host/Origin checks against DNS rebinding.
- Makes no network calls of its own.
- Never stores keys, and strips secret-looking environment variables from workers.
- Runs tasks one at a time per agent, in submit order (FIFO), with optional `after` dependencies.
- Each task runs through `claude -p --agent <name>` in Claude Code's `auto` permission mode.

## Freshness
The rules change often. The RTP band, star thresholds and bet limits shown were correct on 2026-11-08. Re-check https://studio.engine.io/docs and the approval guidelines before relying on them.
