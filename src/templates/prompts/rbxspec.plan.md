Invoke @rbxspec-tl to establish the Technical Lead persona for this session.
When asked to /rbxspec.plan, create a feature-spec directory from a PRD in 2 phases.

## Prerequisite

- If no spec path is given, stop: "Usage: `/rbxspec.plan <spec-path>`. Provide a PRD from `.rbxspec/specs/`."
- If the file does not exist, stop: "PRD not found: `.rbxspec/specs/<name>.md`. Run `/rbxspec.spec` first."
- Do not proceed without a confirmed PRD file.

## Phase 1 - Question Phase

1. Read `.rbxspec/CONTEXT.md` when present. Treat it as the primary source of truth for project context.
2. Read the validated PRD, `AGENTS.md`/`CLAUDE.md`, and reference files.
3. Ask 5-10 planning questions covering:
   - feature boundaries and file layout (`src/client`, `src/server`, `src/shared`, `Packages/`)
   - data model details: DataStore keys and schemas, session-only vs persistent state, versioning and migration
   - remote contracts when networking exists: name, kind (RemoteEvent or RemoteFunction), direction, payload shape, server-side validation strategy
   - input bindings per platform when gameplay work exists (PC keybinds, mobile buttons, console pad)
   - world scope when the PRD has a `## World` section: terrain treatment per zone, landmark and spawn placement, terrain collision and StreamingEnabled impact, part/memory budget
   - asset sourcing when props, models, or audio are needed: whether to search Creator Store candidates or build from primitives, and who approves third-party assets
   - story delivery when the PRD has a `## Story` section: where narrative content lives (dialogue data modules, quest configs, signage parts)
   - UI states and instance paths when UI work exists
   - unit test expectations: framework available (Lune, TestEZ, Jest-Lua) and what to cover
   - E2E verification artifact type: Studio MCP playtest checklist vs scripted check (ask whether Studio MCP is connected; if not, plan a scripted fallback)
   - rollout or integration constraints
4. Each question: short title, 2-5 options, final `Custom` option.
5. Ask questions only in the first response. Stop and wait.

## Phase 2 - Feature Spec Phase

6. After answers are sufficient, finish the full plan in one pass.
7. Do not stop mid-plan for partial output, drafts, TODO lists, or checkpoints.
8. Extract every AC-* and EC-* from the PRD. If missing, stop and report it.
9. Read `## Features` from the PRD. Plan features marked [INITIALIZED].
10. Read `## Experience` and `## MVP` from the PRD. Experience fields (platforms, server size, character support) feed Constraints; MVP defines the delivery order — its features must land first.
10. Create directory: `.rbxspec/tasks/<stem>/`
11. Merge `.rbxspec/CONTEXT.md` content (when present) into the PROGRESS.md frontmatter `context` block. Include key_files, patterns, commands, and conventions from CONTEXT.md.

### PROGRESS.md Format

Write `PROGRESS.md` with this exact structure:

```yaml
---
prd: <path to PRD file>
stem: <epoch-ms-slug>
created: <ISO-8601>
context:
  key_files:
    - <primary directories or files>
  patterns:
    - <coding patterns and conventions>
  commands:
    test: <test command>
    lint: <lint command>
    build: <build command>
    dev: <dev/watch command that syncs into Studio>
  conventions:
    naming: <naming conventions>
    exports: <export conventions>
---
```

```markdown
# Progress

## Registry

| ID | File | Title | Tag | Status | Depends |
|----|------|-------|-----|--------|---------|
| 01 | 01-<slug>.md | <title> | TRIVIAL | pending | — |
| 02 | 02-<slug>.md | <title> | CRITICAL | pending | 01 |

## Coverage

| Requirement | Specs |
|-------------|-------|
| AC-01 | 01, 02 |
| EC-01 | 01 |

## Active

- Spec: `None`
- Phase: `idle`
- Resume: `Start with spec 01.`
- Updated: `<ISO-8601>`

## Notes
<project-specific notes>
```

Status values: `pending` | `active` | `done` | `blocked`

### Feature Spec Format

Write each file `<NN>-<slug>.md` with this structure:

```yaml
---
kind: feature
id: <NN>
title: <action phrase>
tag: TRIVIAL|CRITICAL
spec_ref: [AC-01, EC-02]
depends_on: []
feature_ref: F01
---
```

```markdown
# Goal
<one paragraph: what this delivers>

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| <DataStore schema or session state> | <field list> | <constraints> |

### Remotes
| Name | Kind | Direction | Payload | Validation |
|------|------|-----------|---------|------------|
| AwardCoins | RemoteEvent | Client→Server | {amount: number} | Server clamps amount to earned value |

### UI
| State | Display | Instance path |
|-------|---------|---------------|
| Loading | spinner frame | PlayerGui.HUD.Loading |

### Controls
| Platform | Input | Action |
|----------|-------|--------|
| PC | Mouse1 | Shoot |
| Mobile | FireButton | Shoot |
| Console | RT | Shoot |

### World
Include when the PRD has a `## World` section.

| Zone | Terrain treatment | Purpose |
|------|-------------------|---------|
| Outpost | flat concrete parts, spawn pad | hub and onboarding |
| Wilds | smooth-terrain hills with grass material | exploration combat |

### Assets
Include when the feature needs props, models, decals, or audio.

| Name | Source | ID / Link | Approval |
|------|--------|-----------|----------|
| Supply crate | creator-store | [1234567890](https://create.roblox.com/store/asset/1234567890) | approved via `crate_asset` decision |
| Docks set | builtbybit | [harbor-docks](https://builtbybit.com/resources/harbor-docks.12345/) | approved via `docks_asset` decision |
| Watchtower | primitives | built in-spec | n/a |

Omit any subsection (Data, Remotes, UI, Controls, World, Assets) that does not apply. Do not write "Not applicable".

Every Remotes row must include a concrete server-side validation approach. Clients never decide gameplay outcomes.

### Asset Sourcing Gate (Creator Store & BuiltByBit)

When the PRD's asset sourcing policy allows store assets, run this gate before writing the Assets table:

1. Search two marketplaces for free candidates per prop slot (models, meshes, decals, audio):
   - Roblox Creator Store (`create.roblox.com/store`) — inserted by asset id
   - BuiltByBit free Roblox resources (`https://builtbybit.com/resources/categories/31/?type=free`) — downloaded files imported into Studio; prefer listings marked DRM-free, open-source, or unobfuscated, and follow each resource's license terms
2. Shortlist up to 3 candidates per slot. Record name, creator, and a direct link — `https://create.roblox.com/store/asset/<id>` for Creator Store, `https://builtbybit.com/resources/<slug>.<id>/` for BuiltByBit.
3. Turn every slot into a `decision` block whose options are the candidates from both marketplaces plus a "Build from primitives" fallback. Each option carries the raw link as its `value` and repeats the link in its label/description, so workers render a clickable selection and the user can open each page, inspect the asset manually, and click their choice before anything is applied.
4. Only an approved decision value authorizes use. A rejected or unanswered slot falls back to primitives-built parts — never leave an unapproved asset id or marketplace link in an action.
5. Plan script hygiene: marketplace-sourced models get their bundled Scripts stripped before touching Workspace; note poly count / size against the performance budget.

## Files
| Action | Path | Description |
|--------|------|-------------|
| create | src/server/services/rewards-service.luau | Core rewards service |
| modify | src/client/ui/hud.luau | Add reward toast |
| ref | src/shared/types.luau | Shared type definitions |

At least one `ref` row must exist.

## Actions

Write one `action` block per implementation step. Each action has:
- `id`: unique kebab-case identifier
- `tool`: one of `run_command`, `write_file`, `read_file`
- `args`: arguments for the tool (use `{{decisions.KEY}}` for decision references)
- `depends_on`: list of action ids that must complete first
- `condition`: optional expression referencing `decisions.KEY` or `completed`
- `retry`: number of retries (default from config)
- `on_failure`: `retry` | `skip` | `abort`

Example:

```action
id: create-service
description: Create the rewards service module
tool: write_file
args:
  path: "src/server/services/rewards-service.luau"
  strategy: "{{decisions.datastore_strategy}}"
depends_on: []
retry: 1
on_failure: abort
```

List actions in dependency order. Use `condition` for optional steps.

## Decisions

Write one `decision` block per choice point. Each decision has:
- `id`: unique kebab-case identifier
- `question`: the question to present
- `options`: at least 2 `{label, value}` objects
- `allow_other`: boolean (default false)
- `other_label`: label for Other option (default "Other (specify)")
- `other_validation`: `{type, pattern/message}` or `{type, min, max, message}` or `{type, values, message}`
- `other_normalize`: `{to: "slug"}` or `{to: "lower"}` or `{to: "raw"}`
- `condition`: optional expression; skip decision if false

Example:

```decision
id: datastore_strategy
question: "Which persistence strategy for player rewards?"
options:
  - label: "Raw DataStoreService with retry wrapper"
    value: raw-datastore
  - label: "ProfileService-style session locking"
    value: profile-session
allow_other: true
```

Asset decisions embed the marketplace links so the user can inspect each candidate before choosing:

```decision
id: crate_asset
question: "Which supply crate asset? Open each link to inspect it before choosing."
options:
  - label: "Wooden crate — Creator Store"
    value: https://create.roblox.com/store/asset/1234567890
  - label: "Crate pack — BuiltByBit (free)"
    value: https://builtbybit.com/resources/wooden-crate-pack.246810/
  - label: "Build from primitives instead"
    value: primitives
allow_other: true
other_normalize:
  to: raw
```

## Validates

Write one `validate` block per verification check. Each validate has:
- `id`: unique kebab-case identifier
- `name`: human-readable name
- `tool`: `run_command` or `studio_playtest`
- `args`: arguments for the tool
- `expect`: expected outcome description
- `depends_on`: action ids that must complete first
- `type`: `base` | `edges` | `e2e`
- `retry`: number of retries on failure (default 0)
- `on_failure`: `retry` | `skip` | `abort`

Examples:

```validate
id: check-base
name: Base case — coin pickup awards currency
tool: run_command
args:
  command: "lune run tests -- --filter coins"
depends_on: [create-service]
expect: "all tests pass"
type: base
```

```validate
id: check-e2e
name: E2E — Studio playtest: pickup replicates and persists after rejoin
tool: studio_playtest
args:
  steps: "Join → touch coin part → verify leaderstats increments → rejoin → verify persistence"
depends_on: [create-service]
expect: "coins awarded once, replicated to all clients, persisted across rejoins"
type: e2e
```

### E2E Verification Artifact (Roblox)

Every plan must define its e2e artifact:
- Gameplay or server work: a `studio_playtest` validate covering the full loop (join → act → verify replication/persistence), or a Lune script that simulates the flow headlessly when Studio MCP is unavailable
- UI work: a `studio_playtest` validate that exercises every UI state listed in the Contracts table
- World or terrain work: a `studio_playtest` validate that walks spawn → landmark → zone boundary and confirms collision, spawn placement, and StreamingEnabled behavior
- Pure utility or data code with no runtime dependency: the smallest runnable script (e.g., `lune run verify-rewards`) is acceptable

If Studio MCP is unavailable, plan the scripted fallback in the e2e validate itself. Never leave a spec without any e2e verification.

## Allowlists

Write one `allowlist` block constraining tool calls. Each entry:
- Top-level key: PascalCase name
- `tool`: which tool this constrains
- `allow`: list of glob patterns for permitted arguments

Example:

```allowlist
safe-commands:
  tool: run_command
  allow:
    - "npm run build*"
    - "npm run dev*"
    - "npm test*"
    - "npx tsc*"
    - "rojo build*"
    - "wally install*"
    - "wally package*"
    - "lune run*"
    - "selene*"
    - "stylua*"

src-paths:
  tool: write_file
  allow:
    - "src/**"
    - "Packages/**"
    - "tests/**"
    - "scripts/*"
```

Deny-by-default: if an allowlist entry exists for a tool, actions must match at least one pattern.

## Done
- [ ] Functional behavior works
- [ ] Unit tests pass (base + edges)
- [ ] All spec_ref IDs addressed in code
- [ ] E2E artifact runs successfully
```

Every feature spec MUST include a `config` block, a `state` block (initial status: idle, empty evidence), and at least one `action` block. Feature specs that have choice points MUST include `decision` blocks. All feature specs MUST include `validate` blocks and an `allowlist` block.

The `config` block lists allowed tools. Include `studio_playtest` only when the plan uses it:

```config
name: daily-rewards
version: 1.0.0
description: Add daily login rewards to the game
environment:
  NODE_ENV: test
defaults:
  retry: 2
  timeout: 30000
tools:
  - run_command
  - read_file
  - write_file
  - ask_user
  - studio_playtest
```

The `state` block tracks execution progress and validate evidence. Initial state:

```
```state
status: idle
completed: []
failed: []
decisions: {}
artifacts: {}
evidence: {}
current_action: null
started_at: null
finished_at: null
```
```

The `evidence` field maps validate block ids to brief evidence summaries (e.g., `"check-base": "all 12 tests pass, exit 0"`). The implement worker writes evidence entries after each validate completes.

### Planning Rules

10. One feature spec = one cohesive outcome. May touch multiple files.
11. Tag: TRIVIAL = 1 review pass, CRITICAL = 2 review passes.
12. Sequence actions: setup → core → integration → validation.
13. depends_on must reference lower IDs only.
14. Every AC-* and EC-* must appear in Coverage table.
15. Registry rows must match real files exactly (id, filename, title).
16. Update PRD `## Features` from [INITIALIZED] to [PLANNED].
17. MVP first: every feature listed in the PRD `## MVP` section must be delivered by lower-numbered specs than any non-MVP feature; record the MVP boundary (last MVP spec id) in Notes.
18. Store assets enter specs only through an approved decision: every Assets row with `creator-store` or `builtbybit` source must trace to a decision id recorded in its Approval column, and slots without approval fall back to primitives.

### Save-Time Checklist

Before returning, verify ALL:
- [ ] PROGRESS.md has Registry table with one row per feature spec file
- [ ] Every Registry row matches a real feature spec file (name, id, title)
- [ ] Coverage table maps every AC-* and EC-* from the PRD
- [ ] No AC-* or EC-* is unmapped
- [ ] Every feature spec has: Goal, Contracts, Files, Actions, Validates, Done
- [ ] Every feature spec has: config block, state block, allowlist block
- [ ] Every action has a unique id, a tool, and args
- [ ] Every validate has a unique id, a tool, args, and expect
- [ ] Every decision has a unique id, a question, and at least 2 options
- [ ] Every Remotes row has all 5 columns including server-side validation
- [ ] Every Controls row has all 3 columns
- [ ] Every World row has all 3 columns
- [ ] Every Assets row has all 4 columns including Approval, and every `creator-store` row traces to a decision id
- [ ] Every Files row has action|path|description
- [ ] Every spec with gameplay or UI work has at least one e2e validate of type `e2e`
- [ ] Registry delivers every PRD `## MVP` feature before any non-MVP spec
- [ ] Done section has >= 4 checkboxes
- [ ] No placeholder text anywhere

## Question Format

Use the agent's native question tool to present each question as an interactive selection. Each question must:
- Use a concise question text as the prompt
- Offer 2-5 prefilled option labels the user can click
- Include a "Custom" option so users can type their own answer
- Batch all questions in a single tool call when possible

Do not use text-based Q1/Q2 formats or ask users to type numbered answers. Use the tool's built-in selection mechanism for a click-based UX.

## Constraints

- Prefer feature spec files over long narrative plans
- Sequence: setup → core logic → integration → validation → tests
- Completeness takes priority over brevity
- Design server-authoritative by default; every remote payload gets server-side validation
- Do not write the feature-spec directory before the question phase is complete
- Do not return a partial feature-spec directory after the question phase is complete
- Do not finish planning until PROGRESS.md, feature spec files, and Coverage table all agree

## Output

- Directory: `.rbxspec/tasks/<stem>/`
- PROGRESS.md path
- Feature spec file list
- Copy-pasteable: `/rbxspec.implement .rbxspec/tasks/<stem>/PROGRESS.md`
