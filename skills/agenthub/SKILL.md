---
name: agenthub
description: Hand work to the local agenthub - a 127.0.0.1-only task queue where any Claude Code session can submit tasks to named specialist agents (slot-frontend-perf, slot-animator, stake-rgs-engineer, stake-math-engineer, stake-approval-reviewer, slot-asset-optimizer, slot-frontend-researcher) that run in order, one at a time per agent. Use when the user asks to queue, delegate, or hand off work to "the agents"/"the hub", or to check on hub tasks.
---

# agenthub

Hub: `agenthub/agenthub.py` from the workflow repo (https://github.com/zeqpz/workflow) (Python stdlib only). Listens on http://127.0.0.1:8799/mcp (MCP Streamable HTTP) with a status page at http://127.0.0.1:8799/ . State: `~/.agenthub/hub.db`, logs `~/.agenthub/logs/<id>.log`, optional `~/.agenthub/config.json` (max_parallel, permission_mode, allowed_roots, task_timeout_s, max_turns).

Workers run `claude -p --agent <name>` in the task's cwd, using the standalone CLI login (`claude` then `/login` once). The hub stores no keys and strips secret-looking env vars from workers.

## Using it
If the `agenthub` MCP tools are connected (`claude mcp add --transport http --scope user agenthub http://127.0.0.1:8799/mcp`):
1. `list_agents(cwd)` - see who is available.
2. `submit_task(agent, prompt, cwd, title, after?, submitter?)` - `after` = a task id that must finish first (a failed/cancelled dependency cancels the dependant).
3. `wait_task(id, 55)` repeatedly, or `get_task(id)` later. `list_tasks`, `cancel_task`.

Without MCP, use the CLI client: `python tools\agenthub\hubctl.py agents|submit|wait|get|list|cancel`.

## Writing a good task
- Self-contained brief: goal, files/area, constraints, what "done" looks like, how to verify. The agent sees nothing of your conversation.
- One deliverable per task; chain with `after` for ordered pipelines (e.g. asset-optimizer -> frontend-perf verify -> approval-reviewer).
- Never put secrets, tokens, passwords or personal data in a prompt. Agents must not ask for them either.
- Tell the agent whether it may edit files or should only report; agents do not commit unless told.
- Two agents writing the same files at once is unsafe - serialise them with `after`.
