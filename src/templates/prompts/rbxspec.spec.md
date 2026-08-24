Invoke @rbxspec-gd to establish the Game Designer persona for this session.
When asked to /rbxspec.spec, create a Product Requirements Document (PRD) for a Roblox game feature in 2 phases.

## Phase 1 - Question Phase

1. Read `.rbxspec/CONTEXT.md` first when present. Treat it as the primary source of truth.
2. Read `AGENTS.md` or `CLAUDE.md` if present. Use project conventions from them.
3. Read 1-3 reference files only when they help anchor naming, structure, or existing terminology (e.g., an existing service module or UI component).
4. Ask 5-10 numbered questions before writing the PRD. Use 5 for small work, more only when they add value.
5. Cover these categories. Skip only if the user already answered it:
   - player goal and game outcome (who is this for, what experience, what success looks like)
   - experience metadata: target audience, platforms (PC/Mobile/Console/VR), server size, character support (R6/R15), genre
   - base loop flow (ordered steps across client input → server authority → replication → player feedback)
   - edge cases and failure modes (cause → expected behavior), including where relevant:
     * network latency, disconnects, and rejoining mid-session
     * server restart or player leaving while state is in flight
     * DataStore throttling, failures, and retry behavior
     * exploit abuse of remotes (malformed payloads, spamming, unauthorized calls)
     * platform differences (mobile, desktop, console, VR) and input variance
     * StreamingEnabled edge cases and memory pressure
   - data model, interfaces, or contracts (DataStore schema, RemoteEvent/RemoteFunction payloads, Attributes, UI states)
   - dependencies and operational constraints (project flavor roblox-ts vs luau, platform targets, performance budget, monetization)
   - verification and definition of done (unit test framework available, Studio MCP playtest availability)
6. Each question must have a short title, 2-5 prefilled options, and a final `Custom` option.
7. Ask questions only in the first response. Do not write the PRD in the same response.
8. Stop and wait for answers.

## Phase 2 - PRD Draft Phase

9. After answers are collected, finish the full PRD in one pass.
10. Do not stop mid-draft to return a partial PRD, outline, TODO list, checkpoint, or next steps.
11. If self-audit finds a gap or contradiction, fix it and continue.
12. Only stop early to ask 1 follow-up question when a required input is still missing.
13. Write the PRD to `.rbxspec/specs/<epoch-ms>-<slug>.md` using this exact structure:

```yaml
---
kind: prd
stem: <epoch-ms-slug>
created: <ISO-8601>
---
```

```markdown
# <title>

## Intent
<one paragraph: what this builds, why, for whom, and what success looks like>

## Experience
- Audience: <who this experience targets>
- Platforms: <PC | Mobile | Console | VR>
- Server size: <planned max players per server>
- Character support: <R6 | R15>
- Genre: <experience genre>

## Flow
1. <step one>
2. <step two>
3. ...

## Acceptance Criteria
- AC-01: <concrete testable statement>
- AC-02: <concrete testable statement>

## Edge Cases
- EC-01: <failure mode> → <expected system behavior>
- EC-02: <failure mode> → <expected system behavior>

## Constraints
- <non-negotiable technical or product constraint>

## Features
- F01: <feature title> [INITIALIZED]
- F02: <feature title> [INITIALIZED]

## MVP
- The bare minimum playable slice includes: <F-* IDs from Features>

## Done
- [ ] All acceptance criteria are testable
- [ ] All edge cases have expected behaviors
- [ ] No placeholders remain
```

14. Use epoch milliseconds for the filename prefix (e.g. `1742451234567-daily-rewards.md`).
15. Every AC-* and EC-* must be unique.
16. Every EC-* must use `→` to pair cause with expected behavior.
17. Every F-* must map to one or more AC-* entries in the plan phase.
18. Do not save placeholder text (<...>, TBD, TODO, FIXME, "to be decided").
19. Before returning, verify the save-time checklist:
    - [ ] File has frontmatter with `kind: prd`
    - [ ] Exactly one `## Intent`
    - [ ] Exactly one `## Experience` with audience, platforms, server size, character support, and genre filled
    - [ ] Exactly one `## Flow` with >= 1 numbered step
    - [ ] `## Acceptance Criteria` has >= 1 unique AC-* entry
    - [ ] `## Edge Cases` has >= 1 unique EC-* entry, all with `→`
    - [ ] `## Features` has >= 1 unique F-* entry
    - [ ] `## MVP` lists at least one F-* ID that exists in Features
    - [ ] `## Done` has >= 1 checkbox
    - [ ] Zero instances of placeholder text
20. Return: saved file path, stem, and brief assumptions.
21. Offer next step: `/rbxspec.plan .rbxspec/specs/<filename>.md`

## Question Format

Use the agent's native question tool to present each question as an interactive selection. Each question must:
- Use a concise question text as the prompt
- Offer 2-5 prefilled option labels the user can click
- Include a "Custom" option so users can type their own answer
- Batch all questions in a single tool call when possible

Do not use text-based Q1/Q2 formats or ask users to type numbered answers. Use the tool's built-in selection mechanism for a click-based UX.

## Constraints

- Treat output as a PRD, not an implementation checklist
- Prefer explicit decisions over vague placeholders
- Design server-authoritative by default: gameplay outcomes are decided on the server, clients only request and display
- Keep the MVP honest: the `## MVP` slice must be playable end-to-end on its own; everything not listed is post-MVP
- Do not write the PRD before questions are answered
- Do not return a partial PRD after questions are answered
- Do not save unless all IDs are unique and all sections present

## Output

- File path: `.rbxspec/specs/<epoch-ms>-<slug>.md`
- Assumptions or decisions made
- Copy-pasteable next command
