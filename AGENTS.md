# AGENTS.md

Contributor-facing architecture notes for rbxspec.

## Layout

- `src/index.ts` — CLI entry (commander). Registers the default action plus `-y/--yes` and `--agents`.
- `src/commands/init.ts` — init command. Creates `.rbxspec/`, writes `rbxspec.json`, generates agent command files via the template registry. Detects project flavor from marker files (`rojo.json`, `wally.toml`, `default.project.json`). Supports injectable `promptFn` for testing and non-interactive mode (`yes` + `agents`) so parent tools (e.g., `robloxui init`) can invoke it headlessly.
- `src/templates/index.ts` — template registry. Loads the five prompt files from `src/templates/prompts/` at module load, wraps them per-agent (frontmatter/TOML/mdc), and appends four persona subagent files (`rbxspec-gd`, `rbxspec-tl`, `rbxspec-swe`, `rbxspec-qa`). Gemini gets TOML command files; Cursor gets both `.cursor/rules/*.mdc` and `.cursor/commands/*.md`; antigravity gets `.agent/workflows/*.md` plus a skill file instead of personas.
- `scripts/copy-prompts.mjs` — copies prompt files into `dist/templates/prompts/` after `tsc` (cross-platform replacement for shell copy).

## Build/runtime invariant

`loadPrompt` resolves prompts relative to `__dirname`. Tests exercise the TS source (`src/templates/prompts/`); published packages read `dist/templates/prompts/`. The `build` script must keep both locations populated.

## Prompt specialization vs pspec

rbxspec preserves pspec's execution machinery (orchestrator S1–S7, worker W1–W6, fail-closed rules, state/evidence blocks) and changes domain content only:

- Contracts tables: `Data / Remotes / UI / Controls` replace `Data / API / UI`. Remotes rows require a server-side validation column value; Controls rows bind platform → input → action.
- PRD carries an `## Experience` block (audience, platforms, server size, character support R6/R15, genre) that feeds planning Constraints, and an `## MVP` section whose features must be delivered by lower-numbered specs than non-MVP work (audited as Registry-order parity).
- New validate tool: `studio_playtest` alongside `run_command`; workers drive the Roblox Studio MCP server and record observations as evidence. Unavailable MCP = failed evidence, never a pass.
- Allowlists reference Roblox toolchain commands (`rojo build*`, `wally install*`, `lune run*`, `selene*`, `stylua*`, npm dev/build).
- Debug prompt checks stale builds/Rojo sync before code-level investigation and walks client/server boundary hops for network bugs.
- Paths use `.rbxspec/` everywhere; personas are game-design flavored.

When editing prompts, update `src/templates/index.test.ts` required-string assertions to cover the change.

## Tests

Vitest, colocated as `src/**/*.test.ts`. Run with `npm test`. Template tests assert agent coverage and Roblox-specific required strings; init tests run against temp dirs with a fake `promptFn`.
