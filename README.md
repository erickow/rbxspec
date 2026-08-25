# rbxspec

> **A minimalist Spec-Driven Development (SDD) toolkit for Roblox games, solo developers, and AI agents.**

`rbxspec` is the Roblox-flavored sibling of [pspec](https://github.com/rzkmak/pspec). It keeps the same philosophy — clear intent, executable task breakdowns, explicit verification, and a finish line that includes tests and real-flow validation — but specializes every artifact, contract table, verification step, and allowlist for game development.

It is designed to work alongside Claude Code, Gemini CLI, Cursor, OpenCode, Antigravity, and Kilo Code.

## Philosophy

- **Context First:** Specs and task directories carry the working context instead of relying on fragile chat history.
- **Review Driven:** Tasks are not done when the code compiles; they are done after verification and self-review.
- **Server-Authoritative By Default:** Specs treat gameplay decisions as server-owned; remote payloads get explicit validation contracts.
- **Edge-Case Aware:** `/rbxspec.spec` and `/rbxspec.plan` must cover failure modes: latency, disconnects, DataStore throttling, exploit abuse of remotes, platform input variance.
- **Real Verification:** Definition of done includes functional completion, Luau unit coverage, edge-case coverage, and an end-to-end Studio playtest (via Roblox Studio MCP) or scripted fallback.

## Installation

Run `rbxspec` directly with `npx` so your generated agent commands always use the latest prompts.

```
npx rbxspec@latest
```

Or non-interactively:

```
npx rbxspec@latest --yes --agents opencode,cursor
```

## How to Use

The workflow is: **Initialize → Spec → Plan → Audit → Implement**.

### Step 1: Initialize the Project

Run this in your Roblox project root:

```
npx rbxspec@latest
```

- It prompts for the AI agents you want to configure.
- It detects your project flavor (`rojo.json` → roblox-ts, `wally.toml` / `default.project.json` → luau-wally) and prefills context.
- It creates `.rbxspec/specs/`, `.rbxspec/tasks/`, and `.rbxspec/CONTEXT.md`.
- It writes agent-specific slash command files such as `.opencode/commands/rbxspec.plan.md` or `.cursor/rules/rbxspec.implement.mdc`.
- Running it again updates the generated instructions without overwriting your specs or task directories.

| Option | Description |
|--------|-------------|
| `-y, --yes` | Non-interactive mode (requires `--agents`) |
| `--agents <list>` | Comma-separated agents: `claude,gemini,cursor,opencode,antigravity,kilo` |

You may need to restart your AI agent session after init so it detects the new slash commands.

### Step 2: Create a Spec

Use `/rbxspec.spec` to draft a PRD:

```
/rbxspec.spec Add a daily login reward streak
```

- The agent reads project context first, including `.rbxspec/CONTEXT.md` when present.
- It asks 5-10 focused questions before drafting, covering player outcome, core loop flow, world building (terrain approach, zones, landmarks, art direction), asset sourcing policy, story detail level, edge cases (latency, disconnects, DataStore failures, exploit abuse, platform variance), data contracts (DataStore schema, remotes), constraints, and verification.
- After you answer, the full PRD is written in one pass to `.rbxspec/specs/<epoch-ms>-<slug>.md`.

The PRD uses a structured format with stable IDs: `AC-*` acceptance criteria, `EC-*` edge cases (`→` cause-effect syntax), and `F-*` features. When relevant it also carries an `## Experience` block (audience, platforms, server size, R6/R15, genre), optional `## World` (terrain, zones, landmarks, art direction, asset sourcing policy) and `## Story` (premise, detail level) blocks, plus an `## MVP` slice.

### Step 3: Create a Feature Spec Directory

Use `/rbxspec.plan` on a PRD:

```
/rbxspec.plan .rbxspec/specs/1742451234567-daily-rewards.md
```

- It asks 5-10 focused planning questions when execution details are unclear.
- It writes a feature-spec directory at `.rbxspec/tasks/<epoch-ms>-<slug>/` containing:
  - `PROGRESS.md` — completion tracker with Registry + Coverage tables
  - one Markdown file per feature spec, such as `01-rewards-service.md`

Each feature spec contains typed sections adapted for games:

- `## Contracts` — typed tables:
  - **Data**: DataStore schemas, session state, Attributes
  - **Remotes**: `Name | Kind | Direction | Payload | Validation` — every remote gets an explicit server-side validation approach
  - **UI**: states with display and instance paths
  - **Controls**: platform → input → action bindings
  - **World** (when the PRD has one): zone → terrain treatment → purpose
  - **Assets** (when props/models/audio are needed): name, source (`creator-store` | `builtbybit` | `primitives`), ID/link, approval
- `## Files` — create/modify/reference actions with paths under `src/client`, `src/server`, `src/shared`
- `## Actions` — executable steps with dependencies
- `## Decisions` — structured choice points (e.g., raw DataStoreService vs session-locking); asset choices embed clickable marketplace links
- `## Validates` — base (unit) → edges → e2e checks; e2e uses `studio_playtest` (Roblox Studio MCP) or a scripted fallback such as `lune run verify-x`
- `## Done` — checklist that must be ticked with evidence

### Step 4: Audit And Sync The Plan

Use `/rbxspec.audit` when the PRD changed after planning or when feature specs drift from `PROGRESS.md`. It audits Registry parity, Coverage parity, block structure, and syncs planning artifacts without touching product code.

### Step 5: Implement The Feature Specs

Use `/rbxspec.implement` with the feature-spec directory or `PROGRESS.md` path:

```
/rbxspec.implement .rbxspec/tasks/1742451234567-daily-rewards/PROGRESS.md
```

- An orchestrator loop dispatches one subagent per feature spec.
- Workers execute actions topologically, resolve decisions via `ask_user`, enforce allowlists, run validates, and capture evidence for every check.
- `studio_playtest` validates connect to the Roblox Studio MCP server, run the planned playtest steps, and record observations as evidence. If Studio MCP is unavailable, evidence records the failure — never a false pass.
- `TRIVIAL` tasks require 1 review pass; `CRITICAL` tasks require 2.

### Step 6: Debugging

Use `/rbxspec.debug` for failures or regressions:

```
/rbxspec.debug [error log or description]
```

- It verifies the build is current first (stale Rojo output is the most common false bug).
- It reproduces with a failing unit test or a Studio MCP playtest.
- For networking bugs it walks the boundary order: client send → server validate → server mutate → replication → client observe.

## Asset Sourcing

When a PRD allows store assets, `/rbxspec.plan` runs an **Asset Sourcing Gate**:

- It shortlists free candidates per prop slot from two marketplaces:
  - [Roblox Creator Store](https://create.roblox.com/store) — inserted by asset id
  - [BuiltByBit](https://builtbybit.com/) (free Roblox resources, DRM-free / open-source preferred) — downloaded files imported into Studio
- Each candidate becomes a clickable option in an interactive selection. Open the link, inspect the asset manually, and click your choice — nothing is applied without your explicit per-asset approval.
- Slots you reject or leave unanswered fall back to primitives built from parts.
- Workers strip bundled Scripts from approved marketplace models before they touch Workspace, and implementation rejects any unapproved store asset found in the place.

## Directory Structure

```
your-game/
├── .rbxspec/
│   ├── rbxspec.json
│   ├── CONTEXT.md
│   ├── specs/
│   │   └── 1742451234567-daily-rewards.md
│   └── tasks/
│       └── 1742451234567-daily-rewards/
│           ├── PROGRESS.md
│           ├── 01-rewards-service.md
│           └── 02-ui-and-playtest.md
├── .opencode/
│   └── commands/
│       ├── rbxspec.spec.md
│       ├── rbxspec.plan.md
│       ├── rbxspec.audit.md
│       ├── rbxspec.implement.md
│       └── rbxspec.debug.md
├── src/
│   ├── client/
│   ├── server/
│   └── shared/
├── rojo.json          # or wally.toml / default.project.json
└── package.json
```

## Pair With RobloxUI

`robloxui init` scaffolds a Roblox-TS or Luau/Wally project pre-wired with Rojo, a pinned toolchain, and the Roblox Studio MCP server — everything rbxspec's playtest verification needs. Offer rbxspec during init or run `npx rbxspec@latest` afterwards.

## Attribution

- Built on the architecture of [pspec](https://github.com/rzkmak/pspec) by rzkmak, specialized for Roblox development.
- Asset recommendations are sourced from the [Roblox Creator Store](https://create.roblox.com/store) and [BuiltByBit](https://builtbybit.com/). rbxspec does not host or redistribute these assets; all listings remain the property of their creators. Review and follow each marketplace's terms and each resource's license before using it in your experience.

## License

MIT
