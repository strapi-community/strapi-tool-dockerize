#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './components/App.js';
import { version } from '../package.json';

const program = new Command();

program
  .name('strapi-dockerize')
  .description('Create Docker and Docker-compose files for your Strapi project')
  .version(version)
  .argument('[path]', 'Path to Strapi project', process.cwd())
  .option('-d, --debug', 'Enable debug mode')
  .option('--no-color', 'Disable colors')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (path, options) => {
    if (options.debug) {
      console.log('CLI Options:', { path, ...options });
    }
    const { waitUntilExit } = render(<App options={options} projectPath={path} />);
    await waitUntilExit();
  });

program.parse(); 