Invoke @rbxspec-swe to establish the Senior Roblox Engineer persona for this session.
When asked to /rbxspec.debug, work in 4 phases.

## Phase 1 - Reproduce

1. Start with direct triage: Studio output logs, failing test output, stack traces, search.
2. Verify the build is current first: stale compiled output is the most common false bug. Confirm the dev/watch process (`npm run dev`) is running and `out/` (roblox-ts) or synced sources are fresh, or rebuild with the project's build command before investigating further.
3. If `.rbxspec/tasks/` has an active directory, use its PROGRESS.md and Registry for context.
4. Read `.rbxspec/CONTEXT.md` when present for project context and conventions.
5. If the active feature spec has a `state` block, use it to identify which actions completed, which failed, and which decisions were made.
6. Create a minimal reproduction: a failing unit test counts if it isolates the bug; otherwise a Studio MCP playtest that triggers the behavior works when the bug needs runtime replication or UI interaction.
7. If you cannot reproduce, say so and report what you tried.

## Phase 2 - Investigate

8. Work serially through the most likely hypotheses. No parallel investigation.
9. Check the feature spec's `state` block for failed actions or validates. Use the error messages to narrow the hypothesis.
10. For networking bugs, check the boundary order first: client send → server receive/validate → server mutate → replication → client observe. Identify which hop breaks before changing code.
11. For persistence bugs, check DataStore throttling, retry logic, and session lifecycle (PlayerRemoving vs BindToClose) before suspecting schema code.
12. Stop once root cause is clear enough to fix.

## Phase 3 - Fix

13. Fix directly. Keep it surgical.
14. Keep logic server-authoritative. Never fix a bug by trusting client input or moving gameplay decisions to the client.
15. After fixing, update the `state` block if the fix resolves a previously failed action: remove the action from `failed`, add it to `completed`.

## Phase 4 - Verify

16. Verify against reproduction first, then smallest regression checks including edge cases.
17. Never claim fixed unless reproduction or regression check passes.
18. Clean up temp artifacts (test places, scratch scripts, debug prints).
19. If tied to an active task, update Active in PROGRESS.md and update the state block.

## Output

- Bug: <brief statement>
- Cause: <one sentence>
- Fix: <file:line summary>
- Verification: <repro and regression status>

## Constraints

- Only change what is necessary to fix the bug
- Avoid broad refactors unless unavoidable
- Stop once repro, cause, fix, and verification are known
- IF behavior differs only in Play mode → verify build output is current and Rojo is connected before debugging code
- IF error trace unclear → search the call path first
- IF reproduction fails → verify environment/setup first (Rojo sync, dependencies, place file)
- IF root cause stays ambiguous after a few checked hypotheses → stop and return evidence
