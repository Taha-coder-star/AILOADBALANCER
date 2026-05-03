# Agent Teams Master Guide

> Source: https://code.claude.com/docs/en/agent-teams
> Requires: Claude Code v2.1.32+, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## What Are Agent Teams

Multiple Claude Code instances working together. One session is the **lead** — it spawns, coordinates, and cleans up **teammates**. Each teammate is a fully independent session with its own context window.

Unlike subagents (which only report back to the caller), teammates can **message each other directly** and self-coordinate via a shared task list.

---

## Subagents vs Agent Teams

| | Subagents | Agent Teams |
|---|---|---|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report to main agent only | Message each other directly |
| Coordination | Main agent manages all | Shared task list, self-coordinate |
| Best for | Focused tasks where only result matters | Complex work needing discussion |
| Token cost | Lower | Higher (scales with teammate count) |

**Rule of thumb**: use subagents for "do X and report back"; use agent teams when teammates need to share findings, debate, or collaborate.

---

## Architecture

```
Lead Session
  ├── Task List (shared)         ~/.claude/tasks/{team-name}/
  ├── Team Config                ~/.claude/teams/{team-name}/config.json
  ├── Teammate A (own context)
  ├── Teammate B (own context)
  └── Teammate C (own context)
```

- **Lead**: creates team, spawns teammates, assigns tasks, cleans up
- **Teammates**: claim tasks, message each other, notify lead when idle
- **Task states**: pending → in progress → completed
- **Task dependencies**: blocked tasks auto-unblock when dependencies complete
- **Mailbox**: async messaging between any agents by name

Do NOT hand-edit `config.json` — it is overwritten on every state update.

---

## Display Modes

| Mode | How | Requirement |
|---|---|---|
| `in-process` (default) | All in one terminal; Shift+Down to cycle | Any terminal |
| `tmux` | Each teammate in its own split pane | tmux or iTerm2 + `it2` CLI |

Set in `~/.claude/settings.json`:
```json
{ "teammateMode": "in-process" }
```
Or per session: `claude --teammate-mode in-process`

Auto mode (`"auto"`) uses split panes if already inside tmux, otherwise in-process.

---

## Key Controls

| Action | How |
|---|---|
| Cycle through teammates | Shift+Down (wraps back to lead) |
| Message a teammate | Cycle to them, then type |
| Interrupt a teammate | Enter their session → Escape |
| Toggle task list | Ctrl+T |
| Talk to lead | Just type in the lead pane |

---

## Starting a Team

Just describe what you want in natural language:

```
Create an agent team to explore this from different angles:
one on UX, one on technical architecture, one playing devil's advocate.
```

To specify count and model:
```
Create a team with 4 teammates. Use Sonnet for each.
```

To require plan approval before a teammate implements:
```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

---

## Task Assignment

- **Lead assigns**: tell the lead which task goes to which teammate
- **Self-claim**: after finishing, a teammate picks the next unassigned unblocked task
- File locking prevents race conditions on simultaneous claims

---

## Permissions

- Teammates inherit the lead's permission mode at spawn time
- If lead uses `--dangerously-skip-permissions`, all teammates do too
- Can change individual teammate modes after spawn; cannot set per-teammate modes at spawn time
- Pre-approve common operations in permission settings **before** spawning to reduce prompts

---

## Context Each Teammate Receives

On spawn, each teammate loads:
- `CLAUDE.md` from working directory
- MCP servers and skills from project/user settings
- The spawn prompt from the lead

Each teammate does **NOT** inherit the lead's conversation history. Put all relevant context in the spawn prompt.

---

## Using Subagent Definitions as Teammates

Define a role once, reuse it as both a subagent and a teammate:

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

The definition's `tools` allowlist and `model` are honored. Team coordination tools (`SendMessage`, task tools) are always available regardless of `tools` restrictions.

Note: `skills` and `mcpServers` frontmatter fields are **not** applied when running as a teammate — those come from project/user settings.

---

## Quality Gates with Hooks

| Hook | Trigger | Use |
|---|---|---|
| `TeammateIdle` | Teammate about to go idle | Exit code 2 to send feedback and keep them working |
| `TaskCreated` | Task being created | Exit code 2 to block creation with feedback |
| `TaskCompleted` | Task being marked complete | Exit code 2 to block completion with feedback |

---

## Cleanup

Always clean up through the lead:
```
Clean up the team
```

Cleanup fails if any teammates are still running — shut them down first.

For orphaned tmux sessions:
```bash
tmux ls
tmux kill-session -t <session-name>
```

---

## Best Practices

### Team Size
- **3–5 teammates** is the sweet spot for most workflows
- **5–6 tasks per teammate** keeps everyone productive
- Token cost scales linearly — don't overspawn

### Task Sizing
- Too small: coordination overhead beats the benefit
- Too large: risk of wasted effort before check-ins
- Just right: self-contained unit with a clear deliverable (a function, a test file, a review)

### Context
- Always include task-specific details in the spawn prompt
- Teammates do not see the lead's history

### File Conflicts
- Never have two teammates edit the same file
- Each teammate should own a distinct set of files

### Steering
- Check in regularly; redirect approaches that aren't working
- If the lead starts implementing instead of delegating: `"Wait for your teammates to complete their tasks before proceeding"`
- If a task appears stuck, check if work is done and update status manually

### Starting Out
- Begin with **research and review tasks** — clear boundaries, no code conflicts
- Move to parallel implementation once comfortable with coordination

---

## Proven Prompt Patterns

### Parallel Code Review
```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### Competing Hypotheses Debug
```
Users report X. Spawn 5 agent teammates to investigate different hypotheses.
Have them talk to each other to try to disprove each other's theories,
like a scientific debate. Update findings.md with whatever consensus emerges.
```

### Parallel Feature Build
```
Build the payment module. Spawn teammates:
- One for the frontend form (src/components/payment/)
- One for the backend API (src/api/payment/)
- One for tests (tests/payment/)
Each teammate owns their directory only.
```

---

## Limitations (Experimental)

| Limitation | Workaround |
|---|---|
| No `/resume` or `/rewind` for in-process teammates | Spawn new teammates after resuming |
| Task status can lag | Manually update or tell lead to nudge teammate |
| Shutdown can be slow | Teammates finish current request before exiting |
| One team per lead session | Clean up before starting a new team |
| No nested teams (teammates can't spawn teams) | Only lead manages the team |
| Split panes don't work in VS Code terminal, Windows Terminal, Ghostty | Use in-process mode |

---

## Quick Reference Checklist

Before starting a team:
- [ ] `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set
- [ ] Claude Code v2.1.32+
- [ ] Common tool permissions pre-approved (reduces prompts)
- [ ] CLAUDE.md has project context teammates will need
- [ ] Tasks are broken into non-overlapping file ownership

During a session:
- [ ] Give each teammate full context in the spawn prompt
- [ ] Name teammates explicitly for predictable references
- [ ] Check in periodically — don't let the team run unattended
- [ ] Shut down teammates before calling cleanup

After:
- [ ] Lead runs cleanup (`Clean up the team`)
- [ ] Verify no orphaned tmux sessions
