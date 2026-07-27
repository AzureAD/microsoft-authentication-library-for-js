---
applyTo: "**"
---

# PR & ADO Work Item Telemetry Tagging — MANDATORY

> This section is the authoritative source of truth for how **PRs *and* ADO
> work items** (Tasks, Bugs, User Stories) get tagged. Any agent (Copilot
> CLI, Copilot Chat, Claude, Cursor, etc.) that drafts, edits, or completes
> a PR **or** a work item in this repo **must** apply the rules below on
> every turn — not just the first one. Tags drive Kusto telemetry
> (`AzureDevOpsPullRequest` + `AzureDevOpsWorkItem`) for M4-level
> agentic-vs-manual reporting.

> **PR and work-item titles are left to the author's discretion** — no
> required prefix. Tags live in labels/Tags + description footer only. The
> exact tokens below are what Kusto dashboards filter on — do not use
> synonyms (`ai`, `copilot`, `bugfix`, etc.) as anything else is invisible.

## 1. PR labels (required)

Apply two labels on every PR:
- one of: `agentic-cli`, `agentic-ide`, `agentic-mixed`, `manual`
  - `agentic-cli` — Copilot CLI / Claude CLI / any terminal agent drove the bulk of the edits
  - `agentic-ide` — Copilot Chat / Cursor / inline-suggest in VS Code / Visual Studio drove the bulk of the edits
  - `agentic-mixed` — agent + meaningful hand-edits (≥ ~20% human-authored lines)
  - `manual` — no agent involvement, or agent used only for trivial completions
- one of: `bug`, `hotfix`, `feature`, `refactor`, `test`, `docs`, `security`, `infra`, `telemetry`, `chore`

Labels survive squash-merge and are queryable via the `Labels` column in the
`AzureDevOpsPullRequest` Kusto table.

## 2. PR description footer (required)

Append this fenced block to the end of every PR description. Keep the
sentinels intact — a downstream pipeline relies on them:

```
<!-- BEGIN pr-telemetry -->
assistance: <agentic-cli|agentic-ide|agentic-mixed|manual>
type: <bug|hotfix|feature|refactor|test|docs|security|infra|telemetry|chore>
agent-tool: <copilot-cli|copilot-chat|claude-cli|cursor|other|n/a>
agent-model: <e.g. claude-opus-4.7, gpt-5, n/a>
work-item: AB#<id or n/a>
<!-- END pr-telemetry -->
```

If you cannot determine the model, use `n/a`. Never omit the block.

## 3. ADO work-item Tags (required)

Whenever you create or update an ADO work item (Task, Bug, User Story,
Feature), populate the built-in **Tags** field with exactly two tokens
from the same vocabularies used on PRs:

- one of: `agentic-cli`, `agentic-ide`, `agentic-mixed`, `manual`
  - Same semantics as PR labels — describes who/what drove the **work
    tracked by this item** (planning + execution), not just the PR that
    closes it.
- one of: `bug`, `hotfix`, `feature`, `refactor`, `test`, `docs`, `security`, `infra`, `telemetry`, `chore`
  - Match the work-item intent. For a `Bug` work-item type the tag is
    almost always `bug` or `hotfix`; for a `Task` it follows the change.

ADO work-item Tags are semicolon-separated in the UI and surface in the
`Tags` / `System.Tags` column of the `AzureDevOpsWorkItem` Kusto table.
Apply both tokens — missing either one drops the item from the dashboard.

## 4. ADO work-item description footer (required)

Append this fenced block to the **end of the work-item Description**
(HTML-friendly — ADO renders fenced blocks as `<pre>`). Keep the sentinels
intact:

```
<!-- BEGIN wit-telemetry -->
assistance: <agentic-cli|agentic-ide|agentic-mixed|manual>
type: <bug|hotfix|feature|refactor|test|docs|security|infra|telemetry|chore>
agent-tool: <copilot-cli|copilot-chat|claude-cli|cursor|other|n/a>
agent-model: <e.g. claude-opus-4.7, gpt-5, n/a>
related-pr: <PR id or n/a>
<!-- END wit-telemetry -->
```

If the work item pre-dates the PR, set `related-pr: n/a` and update it to
the PR id (e.g., `related-pr: 5120627`) when the PR is opened. Values for
`assistance` / `type` on the work item and its linked PR should normally
match; if they legitimately differ (e.g., human-planned Task, agent-drafted
PR), each item declares its own truth — do not force them to agree.

## 5. Self-declaration rule (agents only)

When **you** (an AI agent) are the one creating or updating a PR **or** a
work item, you **must** set `assistance` to one of the `agentic-*` values
— never `manual`. The `manual` value is reserved for items a human drafted
without agent help.

If a human later hand-edits an agent-authored PR or work item
significantly, upgrade `assistance` to `agentic-mixed`. Never downgrade an
`agentic-*` tag to `manual`.

## 6. Preservation rule

- Never remove labels, Tags, or footer entries a human or prior agent
  already set — on PRs **or** work items.
- Only apply/upgrade — never delete or downgrade.

## 7. When uncertain

If the change legitimately spans two types (e.g., a refactor that also
fixes a bug), pick the one the reviewer will care about more and note the
secondary intent in the PR or work-item description. **Do not invent new
tag values** and **do not skip tagging** — ask the user which type to pick
if you truly cannot decide.