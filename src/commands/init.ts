import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates } from '../templates';

const { prompt } = require('enquirer');

export const KNOWN_AGENTS = ['claude', 'gemini', 'cursor', 'opencode', 'antigravity', 'kilo'];

export type PromptFn = (options: unknown) => Promise<{ agents: string[] }>;

export type ProjectFlavor = 'roblox-ts' | 'luau-wally' | null;

export function detectFlavor(cwd: string): ProjectFlavor {
  if (fs.existsSync(path.join(cwd, 'rojo.json'))) {
    return 'roblox-ts';
  }
  if (
    fs.existsSync(path.join(cwd, 'wally.toml')) ||
    fs.existsSync(path.join(cwd, 'default.project.json'))
  ) {
    return 'luau-wally';
  }
  return null;
}

export function contextStub(flavor: ProjectFlavor): string {
  const flavorLine = flavor ? flavor : '<roblox-ts or luau-wally>';
  return `# Project Context

When present, /rbxspec.spec treats this file as the primary source of truth.

## Flavor
${flavorLine}

## Key Directories
- src/client — client entry, UI, input
- src/server — server services (authoritative gameplay logic)
- src/shared — shared modules loaded from ReplicatedStorage

## Commands
Fill in the real commands used in this repo:
- test: <e.g. \`lune run tests\` or \`npm test\`>
- lint: <e.g. \`selene src\`>
- format: <e.g. \`stylua src\`>
- dev: <e.g. \`npm run dev\` — compiles and Rojo-syncs into Studio>

## Conventions
- Server-authoritative logic; clients never decide gameplay outcomes
- Every RemoteEvent/RemoteFunction payload is validated on the server
- <naming conventions, service layout, UI structure>
`;
}

export interface InitOptions {
  cwd?: string;
  yes?: boolean;
  agents?: string | string[];
  promptFn?: PromptFn;
}

export async function initCommand(options: InitOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const rbxspecDir = path.join(cwd, '.rbxspec');
  const configPath = path.join(rbxspecDir, 'rbxspec.json');

  let existingAgents: string[] = [];
  let config: any = {};

  if (fs.existsSync(rbxspecDir)) {
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config && config.agents && Array.isArray(config.agents)) {
          existingAgents = config.agents;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }

  let selectedAgents: string[] = [];

  if (options.yes || options.agents) {
    let requested: string[];
    if (typeof options.agents === 'string') {
      requested = options.agents.split(',').map((a) => a.trim()).filter(Boolean);
    } else if (Array.isArray(options.agents)) {
      requested = options.agents;
    } else {
      requested = existingAgents;
    }
    if (!requested || requested.length === 0) {
      console.log(chalk.yellow('--yes requires --agents. Example: rbxspec --yes --agents opencode,cursor'));
      return;
    }
    const invalid = requested.filter((a) => !KNOWN_AGENTS.includes(a));
    if (invalid.length > 0) {
      console.log(chalk.yellow(`Unknown agent(s): ${invalid.join(', ')}. Known agents: ${KNOWN_AGENTS.join(', ')}`));
      return;
    }
    selectedAgents = requested;
  } else {
    try {
      const ask = options.promptFn || prompt;
      const response = await ask({
        type: 'multiselect',
        name: 'agents',
        message: 'Which AI agents would you like to configure? (Space to toggle, Enter to confirm)',
        choices: KNOWN_AGENTS.map((c) => ({
          name: c,
          enabled: existingAgents.includes(c)
        }))
      });
      selectedAgents = response.agents;
    } catch (error) {
      console.log(chalk.yellow('\nInitialization cancelled.'));
      return;
    }
  }

  if (!selectedAgents || selectedAgents.length === 0) {
    console.log(chalk.yellow('No agents selected. Setup incomplete.'));
    return;
  }

  fs.mkdirSync(path.join(rbxspecDir, 'specs'), { recursive: true });
  fs.mkdirSync(path.join(rbxspecDir, 'tasks'), { recursive: true });

  // Create CONTEXT.md stub if it doesn't exist, prefilled with the detected flavor
  const contextPath = path.join(rbxspecDir, 'CONTEXT.md');
  if (!fs.existsSync(contextPath)) {
    fs.writeFileSync(contextPath, contextStub(detectFlavor(cwd)));
  }

  const rbxspecConfig = {
    ...config,
    agents: selectedAgents,
    paths: config.paths || {
      specs: '.rbxspec/specs',
      tasks: '.rbxspec/tasks'
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(rbxspecConfig, null, 2));

  for (const agent of selectedAgents) {
    const agentTemplates = getTemplates(agent);
    for (const template of agentTemplates) {
      const targetDir = path.join(cwd, template.dir);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, template.file), template.content);
      console.log(chalk.green(`Updated command file for ${agent} at ${path.join(template.dir, template.file)}`));
    }
  }

  console.log(chalk.green('rbxspec initialized/updated successfully!'));
}
