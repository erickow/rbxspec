import { describe, it, expect } from 'vitest';
import { templates, getTemplates } from './index';

const ALL_AGENTS = ['claude', 'gemini', 'cursor', 'opencode', 'antigravity', 'kilo'];

describe('templates registry', () => {
  it('returns templates for every supported agent', () => {
    for (const agent of ALL_AGENTS) {
      expect(getTemplates(agent).length, `agent ${agent}`).toBeGreaterThan(0);
    }
  });

  it('returns empty array for unknown agents', () => {
    expect(getTemplates('unknown-agent')).toEqual([]);
  });

  it.each(ALL_AGENTS)('%s gets all 5 command files', (agent) => {
    const list = getTemplates(agent);
    for (const cmd of ['rbxspec.spec', 'rbxspec.plan', 'rbxspec.audit', 'rbxspec.implement', 'rbxspec.debug']) {
      expect(list.some((t) => t.file.startsWith(cmd)), `${agent} missing ${cmd}`).toBe(true);
    }
  });

  it('generates persona subagent files for interactive agents', () => {
    for (const agent of ['claude', 'gemini', 'cursor', 'opencode', 'kilo']) {
      const list = getTemplates(agent);
      for (const persona of ['rbxspec-gd', 'rbxspec-tl', 'rbxspec-swe', 'rbxspec-qa']) {
        expect(list.some((t) => t.file === `${persona}.md`), `${agent} missing ${persona}`).toBe(true);
      }
    }
  });

  it('writes cursor command files to both rules and commands directories', () => {
    const dirs = new Set(templates.cursor.map((t) => t.dir));
    expect(dirs.has('.cursor/rules')).toBe(true);
    expect(dirs.has('.cursor/commands')).toBe(true);
    expect(dirs.has('.cursor/agents')).toBe(true);
  });

  it('antigravity gets a skill file', () => {
    const skill = templates.antigravity.find((t) => t.file === 'SKILL.md');
    expect(skill).toBeDefined();
    expect(skill!.dir).toBe('.agent/skills/rbxspec');
  });
});

describe('prompt content', () => {
  const allContent = Object.values(templates)
    .flat()
    .map((t) => t.content)
    .join('\n');

  it('contains no leftover pspec references', () => {
    expect(allContent).not.toMatch(/pspec(?!\w)/);
    expect(allContent).not.toContain('.pspec/');
  });

  it('references the rbxspec directory everywhere', () => {
    expect(allContent).toContain('.rbxspec/');
  });

  it('spec prompt covers game design concerns', () => {
    const spec = getTemplates('opencode').find((t) => t.file === 'rbxspec.spec.md')!;
    expect(spec.content).toContain('@rbxspec-gd');
    expect(spec.content).toMatch(/DataStore/);
    expect(spec.content).toMatch(/RemoteEvent/);
    expect(spec.content).toContain('server-authoritative');
  });

  it('spec prompt captures experience metadata and an MVP slice', () => {
    const spec = getTemplates('opencode').find((t) => t.file === 'rbxspec.spec.md')!;
    expect(spec.content).toContain('## Experience');
    expect(spec.content).toContain('- Character support:');
    expect(spec.content).toContain('- Server size:');
    expect(spec.content).toContain('## MVP');
    expect(spec.content).toMatch(/playable end-to-end on its own/);
  });

  it('spec prompt captures world building, asset sourcing policy, and story detail', () => {
    const spec = getTemplates('opencode').find((t) => t.file === 'rbxspec.spec.md')!;
    expect(spec.content).toContain('## World');
    expect(spec.content).toContain('- Terrain:');
    expect(spec.content).toContain('- Zones:');
    expect(spec.content).toContain('- Landmarks:');
    expect(spec.content).toContain('- Asset sourcing:');
    expect(spec.content).toContain('## Story');
    expect(spec.content).toContain('- Detail level:');
    expect(spec.content).toMatch(/Creator Store/i);
    expect(spec.content).toMatch(/BuiltByBit/i);
  });

  it('plan prompt defines Roblox contract tables and studio playtest artifact', () => {
    const plan = getTemplates('opencode').find((t) => t.file === 'rbxspec.plan.md')!;
    expect(plan.content).toContain('### Remotes');
    expect(plan.content).toContain('### UI');
    expect(plan.content).toContain('### Controls');
    expect(plan.content).toContain('| Platform | Input | Action |');
    expect(plan.content).toContain('studio_playtest');
    expect(plan.content).toContain('| Name | Kind | Direction | Payload | Validation |');
    expect(plan.content).toMatch(/lune|TestEZ|Jest-Lua/);
  });

  it('plan prompt gates store assets behind per-asset user approval', () => {
    const plan = getTemplates('opencode').find((t) => t.file === 'rbxspec.plan.md')!;
    expect(plan.content).toContain('### World');
    expect(plan.content).toContain('| Zone | Terrain treatment | Purpose |');
    expect(plan.content).toContain('### Assets');
    expect(plan.content).toContain('| ID / Link | Approval |');
    expect(plan.content).toMatch(/create\.roblox\.com\/store\/asset\//);
    expect(plan.content).toMatch(/builtbybit\.com\/resources\//);
    expect(plan.content).toContain('Asset Sourcing Gate (Creator Store & BuiltByBit)');
    expect(plan.content).toMatch(/\?type=free/);
    expect(plan.content).toContain('never leave an unapproved asset id or marketplace link in an action');
    expect(plan.content).toMatch(/repeats the link in its label\/description/);
    expect(plan.content).toMatch(/walks spawn → landmark → zone boundary/);
  });

  it('plan prompt sequences MVP features first', () => {
    const plan = getTemplates('opencode').find((t) => t.file === 'rbxspec.plan.md')!;
    expect(plan.content).toMatch(/MVP first:/);
    expect(plan.content).toMatch(/lower-numbered specs than any non-MVP/);
  });

  it('implement prompt audits remotes contracts and captures playtest evidence', () => {
    const impl = getTemplates('opencode').find((t) => t.file === 'rbxspec.implement.md')!;
    expect(impl.content).toContain('server-side payload validation exists for every remote');
    expect(impl.content).toContain('Roblox Studio MCP server');
    expect(impl.content).toMatch(/Controls contract \(platform, input, action\)/);
    expect(impl.content).toContain('W1 - Load');
    expect(impl.content).toContain('Return Contract');
  });

  it('implement prompt renders asset links and audits inserted assets', () => {
    const impl = getTemplates('opencode').find((t) => t.file === 'rbxspec.implement.md')!;
    expect(impl.content).toContain('Asset Decisions (Creator Store & BuiltByBit)');
    expect(impl.content).toMatch(/directly clickable/);
    expect(impl.content).toMatch(/interactive selection/);
    expect(impl.content).toContain('Never preselect, guess, auto-resolve, or time out an asset decision');
    expect(impl.content).toMatch(/strip any bundled Scripts/);
    expect(impl.content).toContain('no store asset present that lacks an approved decision');
  });

  it('audit prompt checks Controls rows and MVP ordering parity', () => {
    const audit = getTemplates('opencode').find((t) => t.file === 'rbxspec.audit.md')!;
    expect(audit.content).toMatch(/every Controls contract row has all 3 columns/);
    expect(audit.content).toMatch(/Registry order delivers every PRD `## MVP` feature/);
  });

  it('audit prompt checks World and Assets contract rows', () => {
    const audit = getTemplates('opencode').find((t) => t.file === 'rbxspec.audit.md')!;
    expect(audit.content).toMatch(/every World contract row has all 3 columns/);
    expect(audit.content).toMatch(/every Assets contract row has all 4 columns including Approval/);
    expect(audit.content).toMatch(/creator-store`, `builtbybit/);
  });

  it('debug prompt checks stale builds before debugging code', () => {
    const debug = getTemplates('opencode').find((t) => t.file === 'rbxspec.debug.md')!;
    expect(debug.content).toMatch(/stale compiled output|build is current/);
    expect(debug.content).toContain('Rojo sync');
  });
});

describe('persona depth', () => {
  const persona = (id: string): string =>
    getTemplates('opencode').find((t) => t.file === `${id}.md`)!.content;

  it('game designer embeds retention, monetization, and audience doctrine', () => {
    const gd = persona('rbxspec-gd');
    expect(gd).toMatch(/D1/);
    expect(gd).toMatch(/game passes/i);
    expect(gd).toMatch(/developer products/i);
    expect(gd).toMatch(/content-rating|onboarding/i);
    expect(gd).toMatch(/vertical slice/i);
  });

  it('game designer embeds world building and store-asset approval doctrine', () => {
    const gd = persona('rbxspec-gd');
    expect(gd).toMatch(/terrain approach/);
    expect(gd).toMatch(/asset sourcing policy/i);
    expect(gd).toMatch(/story detail level/i);
    expect(gd).toMatch(/approve each one before insertion/i);
  });

  it('tech lead embeds remote selection and persistence versioning doctrine', () => {
    const tl = persona('rbxspec-tl');
    expect(tl).toContain('UnreliableRemoteEvent');
    expect(tl).toMatch(/late-joining players/);
    expect(tl).toMatch(/schema version/);
    expect(tl).toMatch(/MemoryStore/);
    expect(tl).toMatch(/BindToClose/);
  });

  it('tech lead embeds the creator store asset pipeline doctrine', () => {
    const tl = persona('rbxspec-tl');
    expect(tl).toMatch(/per-asset human approval|approves by clicking/i);
    expect(tl).toMatch(/Creator Store and BuiltByBit/);
    expect(tl).toMatch(/primitives fallback/i);
    expect(tl).toMatch(/strip bundled scripts/i);
  });

  it('engineer embeds Luau idioms, resource hygiene, and security rules', () => {
    const swe = persona('rbxspec-swe');
    expect(swe).toContain('task.defer');
    expect(swe).toContain('--!strict');
    expect(swe).toMatch(/disconnect connections/);
    expect(swe).toMatch(/rate-limit remotes/);
    expect(swe).toMatch(/microprofiler/i);
  });

  it('auditor adds game-specific checks beyond structure', () => {
    const qa = persona('rbxspec-qa');
    expect(qa).toMatch(/server-side validation approach/);
    expect(qa).toMatch(/version field and migration note/);
    expect(qa).toMatch(/join-mid-session/);
    expect(qa).toMatch(/trusting client-side values/);
  });

  it('personas stay lean enough for subagent dispatch', () => {
    for (const id of ['rbxspec-gd', 'rbxspec-tl', 'rbxspec-swe', 'rbxspec-qa']) {
      expect(persona(id).length, `${id} too long`).toBeLessThan(2000);
    }
  });
});
