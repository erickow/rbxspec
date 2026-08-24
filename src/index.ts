#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
const pkg = require('../package.json');

export function createProgram() {
  const program = new Command();

  program
    .name('rbxspec')
    .description('Minimalist spec-driven development CLI for Roblox games')
    .version(pkg.version)
    .option('-y, --yes', 'Non-interactive mode (requires --agents)')
    .option('--agents <list>', 'Comma-separated AI agents to configure (claude,gemini,cursor,opencode,antigravity,kilo)')
    .action(initCommand);

  return program;
}

if (require.main === module) {
  createProgram().parse(process.argv);
}
