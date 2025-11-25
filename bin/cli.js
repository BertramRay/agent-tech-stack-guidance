#!/usr/bin/env node

const { Command } = require('commander');
const { init } = require('../lib/commands/init');
const { add } = require('../lib/commands/add');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('agent-guidance')
  .description('CLI to manage agent guidance documentation')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize the .agent_guidance directory')
  .action(init);

program
  .command('add <query>')
  .description('Add a guidance file to your project')
  .option('-l, --lang <code', 'Language code (default: en)', 'en')
  .action((query, options) => add(query, options));

program.parse();
