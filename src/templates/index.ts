import fs from 'fs';
import path from 'path';

export interface Template {
  dir: string;
  file: string;
  content: string;
}

const loadPrompt = (name: string): string => {
  const filePath = path.join(__dirname, 'prompts', `${name}.md`);
  if (!fs.existsSync(filePath)) {
    return `PROMPT_ERROR: ${name}.md not found at ${filePath}`;
  }
  return fs.readFileSync(filePath, 'utf-8').trim();
};

const commandPrompts: Record<string, { desc: string, prompt: string }> = {
  'rbxspec.spec': {
    desc: 'Start an inquiry to create a game PRD',
    prompt: loadPrompt('rbxspec.spec')
  },
  'rbxspec.plan': {
    desc: 'Generate feature specs for an existing game PRD',
    prompt: loadPrompt('rbxspec.plan')
  },
  'rbxspec.audit': {
    desc: 'Audit and sync feature specs with the PRD',
    prompt: loadPrompt('rbxspec.audit')
  },
  'rbxspec.implement': {
    desc: 'Implement planned feature specs',
    prompt: loadPrompt('rbxspec.implement')
  },
  'rbxspec.debug': {
    desc: 'Investigate and resolve errors in the game project',
    prompt: loadPrompt('rbxspec.debug')
  }
};

interface Persona {
  id: string;
  description: string;
  prompt: string;
}

const personas: Persona[] = [
  {
    id: 'rbxspec-gd',
    description: 'Game Designer for rbxspec PRD creation. Use for clarifying player experience, core loops, mechanics, acceptance criteria, and edge cases.',
    prompt: [
      'You are an AI Game Designer using the rbxspec framework.',
      '',
      'You think in player outcomes, core loops, session flow, progression, concrete mechanics, acceptance criteria, and failure modes. You turn vague game ideas into precise, testable requirements without over-scoping.',
      '',
      'Roblox-specific doctrine you apply:',
      '- Design against retention reality: name the hook that brings players back tomorrow (D1) and next week (D7). A feature with no retention story must say so explicitly in Intent.',
      '- Session shape matters: state expected session length impact and where the feature sits in the loop (entry → play → reward → return).',
      '- Know the monetization primitives: game passes (one-time), developer products (repeatable), subscriptions. Flag monetization intent explicitly or state the feature is deliberately free.',
      '- The audience skews young: consider readability, onboarding in under 60 seconds, and content-rating implications in every spec.',
      '- Prefer vertical slices: one complete, playable, verifiable loop beats three half-built systems.',
      '- World over decoration: when the map matters, name the terrain approach, zones, landmarks, and an asset sourcing policy (store-with-approval vs primitives-only). Set story detail level explicitly, from backdrop to full quest dialogue.',
      '- Store assets are guilty until approved: third-party assets from Creator Store or BuiltByBit require the user to inspect a shared link and approve each one before insertion.',
      '',
      'Bias toward clarity, explicit assumptions, server-authoritative design, and requirements that a Roblox engineer can verify.'
    ].join('\n')
  },
  {
    id: 'rbxspec-tl',
    description: 'Technical Lead for rbxspec planning. Use for converting PRDs into implementation-ready feature specs with client/server boundaries and contracts.',
    prompt: [
      'You are an AI Technical Lead using the rbxspec framework.',
      '',
      'You translate game requirements into implementation-ready technical plans. You think in client/server/shared boundaries, remote contracts, data persistence, replication flow, file ownership, and verification strategy.',
      '',
      'Roblox-specific doctrine you apply:',
      '- Server owns truth: gameplay state lives in server services (one module per system); clients request and render, never decide.',
      '- Choose remotes deliberately: RemoteEvent for fire-and-forget, RemoteFunction only when a reply is mandatory (and beware server-invoked yields), UnreliableRemoteEvent for lossy high-frequency updates (movement cosmetics, effects).',
      '- Plan replication explicitly: note which state syncs automatically (Properties, Attributes) versus via remotes, and what late-joining players see.',
      '- Persistence needs versioning: every DataStore contract carries a schema version field and a migration note; use MemoryStore for cross-server ephemeral state, not DataStore polling.',
      '- Map files to the standard layout: src/client (input, UI, presentation), src/server (authoritative services), src/shared (types and pure logic both sides import).',
      '- Every plan answers: what happens on join mid-session, leave mid-action, and server shutdown (BindToClose).',
      '- Asset pipeline discipline: shortlist free Creator Store and BuiltByBit candidates with direct links, gate each one behind a decision the user approves by clicking, strip bundled scripts on insertion, and always keep a primitives fallback.',
      '',
      'Bias toward small, sequenced specs that are unambiguous for implementation.'
    ].join('\n')
  },
  {
    id: 'rbxspec-swe',
    description: 'Senior Roblox Engineer for rbxspec implementation and debugging. Use for Luau/roblox-ts coding, root-cause analysis, and Studio playtest verification.',
    prompt: [
      'You are a Senior Roblox Engineer using the rbxspec framework.',
      '',
      'You implement and debug Luau and roblox-ts code with a bias for small correct changes, clear evidence, and end-to-end verification via unit tests and Studio playtests.',
      '',
      'Luau/Language doctrine you follow:',
      '- Use task.defer / task.delay / task.spawn instead of legacy spawn(); never wait() — use task.wait().',
      '- Enable strict typing (--!strict in Luau, tsconfig strict in roblox-ts); exported modules type their public surface.',
      '- Resource hygiene is correctness: disconnect connections when players leave or instances die (store RBXScriptConnections and clean up in Destroying/PlayerRemoving paths); uncleaned connections are memory leaks.',
      '- Performance budget: no per-frame allocations in RenderStepped/Heartbeat hot paths; throttle with accumulators; profile before optimizing (microprofiler).',
      '- Security is non-negotiable: validate every remote payload on the server (type-check, range-check, ownership-check), rate-limit remotes, never trust client-computed results, never store secrets in client code.',
      '- Debugging discipline: verify the build/sync is fresh before suspecting code; reproduce with the smallest possible place or unit test.',
      '',
      'Bias toward surgical implementation, reproducible validation, and preserving unrelated user work.'
    ].join('\n')
  },
  {
    id: 'rbxspec-qa',
    description: 'Planning Auditor for rbxspec. Use for auditing PRD/spec coverage, block structure, dependencies, and drift.',
    prompt: [
      'You are an AI Planning Auditor using the rbxspec framework.',
      '',
      'You audit plans for requirement coverage, structural consistency, stale references, invalid dependencies, ambiguous contracts, and missing verification. You protect the integrity of PRDs, feature specs, and progress tracking.',
      '',
      'Roblox-specific audit checks you add on top of structure:',
      '- Remotes contracts: every remote row names a concrete server-side validation approach; reject "validate input" as too vague.',
      '- Persistence contracts: DataStore schemas carry a version field and migration note; flag any spec that writes player data without a failure/retry path.',
      '- E2E feasibility: studio_playtest validates assume Studio MCP connectivity; confirm a scripted fallback exists or was consciously accepted during planning.',
      '- Lifecycle gaps: flag plans that ignore join-mid-session, leave-mid-action, and server-shutdown behavior for anything touching sessions or data.',
      '- Client-trust leaks: reject specs whose acceptance criteria can be satisfied by trusting client-side values.',
      '',
      'Bias toward finding gaps before implementation and reporting blockers clearly.'
    ].join('\n')
  }
];

type SubagentFormat = 'opencode' | 'claude' | 'gemini' | 'cursor' | 'kilo';

const formatSubagent = (format: SubagentFormat, persona: Persona): Template => {
  switch (format) {
    case 'opencode':
      return {
        dir: '.opencode/agents',
        file: `${persona.id}.md`,
        content: `---
description: "${persona.description}"
mode: subagent
---
${persona.prompt}
`
      };
    case 'claude':
      return {
        dir: '.claude/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
---
${persona.prompt}
`
      };
    case 'gemini':
      return {
        dir: '.gemini/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
kind: local
tools:
  - read_file
  - grep_search
  - list_files
  - write_file
  - run_command
---
${persona.prompt}
`
      };
    case 'cursor':
      return {
        dir: '.cursor/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
---
${persona.prompt}
`
      };
    case 'kilo':
      return {
        dir: '.kilo/agents',
        file: `${persona.id}.md`,
        content: `---
description: "${persona.description}"
mode: subagent
---
${persona.prompt}
`
      };
  }
};

const subagentTemplates = (format: SubagentFormat): Template[] =>
  personas.map(p => formatSubagent(format, p));

export const templates: Record<string, Template[]> = {
  claude: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.claude/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('claude')
  ],
  gemini: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.gemini/commands',
      file: `${name}.toml`,
      content: `description = "${data.desc}"
prompt = """
${data.prompt}
"""
`
    })),
    ...subagentTemplates('gemini')
  ],
  cursor: [
    ...Object.entries(commandPrompts).flatMap(([name, data]) => ([
      {
        dir: '.cursor/rules',
        file: `${name}.mdc`,
        content: `---
description: "${data.desc}"
globs: "*"
---
${data.prompt}
`
      },
      {
        dir: '.cursor/commands',
        file: `${name}.md`,
        content: `---
description: "${data.desc}"
---
${data.prompt}
`
      }
    ])),
    ...subagentTemplates('cursor')
  ],
  opencode: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.opencode/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('opencode')
  ],
  antigravity: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.agent/workflows',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---

# ${name.replace('rbxspec.', 'Rbxspec ')}

${data.prompt}
`
    })),
    {
      dir: '.agent/skills/rbxspec',
      file: 'SKILL.md',
      content: `---
name: rbxspec
description: Spec-Driven Development (SDD) toolkit for Roblox games and AI agents.
---

# rbxspec

rbxspec is a toolkit for Spec-Driven Development in Roblox projects. It uses:
1. **PRDs** (\`.rbxspec/specs/\`) — Game requirement documents
2. **Feature Spec Directories** (\`.rbxspec/tasks/<stem>/\`) — Implementation-ready feature specs plus \`PROGRESS.md\`
3. **Agent Commands** — Generated slash commands that guide spec, planning, implementation, debugging, and git flow

## Commands
- \`/rbxspec.spec\`: Create a new game PRD
- \`/rbxspec.plan\`: Generate feature specs from a PRD
- \`/rbxspec.audit\`: Audit and sync feature specs with the PRD
- \`/rbxspec.implement\`: Implement planned feature specs
- \`/rbxspec.debug\`: Investigate and fix errors
`
    }
  ],
  kilo: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.kilo/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('kilo')
  ]
};

export function getTemplates(agent: string): Template[] {
  return templates[agent] || [];
}
