import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  initCommand,
  detectFlavor,
  contextStub,
  KNOWN_AGENTS
} from './init';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbxspec-init-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const fakePromptFn = (agents: string[]) => async () => ({ agents });

describe('detectFlavor', () => {
  it('detects roblox-ts from rojo.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'rojo.json'), '{}');
    expect(detectFlavor(tmpDir)).toBe('roblox-ts');
  });

  it('detects luau-wally from wally.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'wally.toml'), '');
    expect(detectFlavor(tmpDir)).toBe('luau-wally');
  });

  it('detects luau-wally from default.project.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'default.project.json'), '{}');
    expect(detectFlavor(tmpDir)).toBe('luau-wally');
  });

  it('returns null when nothing matches', () => {
    expect(detectFlavor(tmpDir)).toBeNull();
  });
});

describe('contextStub', () => {
  it('embeds the detected flavor', () => {
    expect(contextStub('roblox-ts')).toContain('roblox-ts');
    expect(contextStub(null)).toContain('<roblox-ts or luau-wally>');
  });
});

describe('initCommand', () => {
  it('creates .rbxspec structure and agent files', async () => {
    await initCommand({
      cwd: tmpDir,
      promptFn: fakePromptFn(['opencode'])
    });

    const rbxspecDir = path.join(tmpDir, '.rbxspec');
    expect(fs.existsSync(path.join(rbxspecDir, 'specs'))).toBe(true);
    expect(fs.existsSync(path.join(rbxspecDir, 'tasks'))).toBe(true);
    expect(fs.existsSync(path.join(rbxspecDir, 'CONTEXT.md'))).toBe(true);

    const config = JSON.parse(
      fs.readFileSync(path.join(rbxspecDir, 'rbxspec.json'), 'utf-8')
    );
    expect(config.agents).toEqual(['opencode']);
    expect(config.paths.specs).toBe('.rbxspec/specs');
    expect(config.paths.tasks).toBe('.rbxspec/tasks');

    expect(
      fs.existsSync(path.join(tmpDir, '.opencode/commands/rbxspec.spec.md'))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, '.opencode/commands/rbxspec.implement.md'))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(tmpDir, '.opencode/agents/rbxspec-gd.md'))
    ).toBe(true);
  });

  it('prefills CONTEXT.md with detected flavor', async () => {
    fs.writeFileSync(path.join(tmpDir, 'rojo.json'), '{}');
    await initCommand({ cwd: tmpDir, yes: true, agents: ['cursor'] });
    const context = fs.readFileSync(
      path.join(tmpDir, '.rbxspec/CONTEXT.md'),
      'utf-8'
    );
    expect(context).toContain('roblox-ts');
    expect(context).toContain('/rbxspec.spec treats this file as the primary source of truth');
  });

  it('supports non-interactive --yes --agents mode', async () => {
    await initCommand({ cwd: tmpDir, yes: true, agents: 'claude,kilo' });
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.rbxspec/rbxspec.json'), 'utf-8')
    );
    expect(config.agents).toEqual(['claude', 'kilo']);
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/commands/rbxspec.plan.md'))
    ).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.kilo/commands/rbxspec.debug.md'))).toBe(
      true
    );
  });

  it('accepts agent arrays from programmatic callers', async () => {
    await initCommand({ cwd: tmpDir, yes: true, agents: ['gemini'] });
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.rbxspec/rbxspec.json'), 'utf-8')
    );
    expect(config.agents).toEqual(['gemini']);
  });

  it('rejects unknown agents in non-interactive mode without writing config', async () => {
    await initCommand({ cwd: tmpDir, yes: true, agents: ['notreal' as never] });
    expect(fs.existsSync(path.join(tmpDir, '.rbxspec/rbxspec.json'))).toBe(false);
  });

  it('does nothing non-interactively when agents are missing', async () => {
    await initCommand({ cwd: tmpDir, yes: true });
    expect(fs.existsSync(path.join(tmpDir, '.rbxspec'))).toBe(false);
  });

  it('preserves existing specs and CONTEXT.md across re-runs', async () => {
    await initCommand({ cwd: tmpDir, promptFn: fakePromptFn(['opencode']) });
    const specPath = path.join(tmpDir, '.rbxspec/specs/1742451234567-daily-rewards.md');
    fs.writeFileSync(specPath, '# Daily Rewards\n');
    await initCommand({ cwd: tmpDir, promptFn: fakePromptFn(['opencode']) });
    expect(fs.existsSync(specPath)).toBe(true);
  });

  it('exposes exactly the six known agents', () => {
    expect(KNOWN_AGENTS).toEqual([
      'claude',
      'gemini',
      'cursor',
      'opencode',
      'antigravity',
      'kilo'
    ]);
  });
});
