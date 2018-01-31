#!/usr/bin/env node
'use strict';

import { Message } from './spec/message';
import { Runner, TestResult } from './runner';
import { getRunners } from './multi-runner';
import { BotFrameworkClient } from './clients/botframework_client';
import { Client } from './clients/client_interface';
import { Config, defaultConfig, ClientType } from './config';
import { Translator } from './translator';

import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';
import * as chalk from 'chalk';
import * as findParentDir from 'find-parent-dir';
import * as semver from 'semver';
import 'source-map-support/register';

process.on('unhandledRejection', (error) => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});

let chatPath: string = null;

program
  .version('0.1.0')
  .description('autobot is an multi-platform bot testing framework. ' +
    'It requires an autobot.yml config file to be in the working directory or a parent.')
  .option('-v --verbose', 'Enable full logging including bot queries and responses')
  .option('-j --json', 'Enable seeing the direct JSON responses from the client')
  .option('-c, --config <autobot.yml>', 'autobot.yml config file to use ' + 
    '(default current directory and parents)')
  .option('-np, --no-parallel', 'Disables parallelism')
  .arguments('<chatPath>')
  .action((chatPathVal) => {
    chatPath = chatPathVal;
  })
  .parse(process.argv);

if (chatPath === null) {
  chatPath = './';
}

let configPath;
if (program.config) {
  configPath = program.config;
} else {
  configPath = path.join(
    process.cwd(),
    'autobot.yml');
}

if (!fs.existsSync(configPath)) {
  if (program.configPath) {
    console.log(chalk.red(`Cannot find file ${configPath}`));
  } else {
    program.outputHelp();
    console.log(
      chalk.red(
        '\nYou must have an autobot.yml config file ' +
        'in this directory or in a parent directory\n'));
    process.exit(1);
  }
}

const config: Config = Object.assign(
  {},
  defaultConfig,
  jsYaml.safeLoad(fs.readFileSync(configPath, 'utf8')));
let client: Client;

if (config.client === ClientType.BotFramework) {
  client = new BotFrameworkClient(config.directLineSecret);
} else {
  console.log('ERROR: unsupported client', config.client);
  process.exit(1);
}

if (config.localeFiles) {
  if (typeof config.localeFiles === 'string') {
    config.localeFiles = [config.localeFiles];
  }
  Translator.loadTranslation(
    config.localeFiles
      .map(localePath => path.join(path.dirname(configPath), localePath)),
    config.client === ClientType.BotFramework);
}

console.log('');
async function run() {
  const runners = getRunners(client, chatPath, config);
  let success;

  let finalResults: TestResult[];
  let start;
  try {
    const results = await Promise.all(runners.map(runner => runner.start(() => {
      start = new Date().getTime();
      console.log(chalk.green(`\n\tDiscovered ${runner.dialogues.length} tests `) +
                  `(${runner.userMetadata.size} branches)\n`);
    })));
    finalResults = results.map(r => r[0]);
    finalResults.forEach((result) => {
      const chalkFn = result.passed ? chalk.green : chalk.red;
      console.log(
        chalkFn(`\t${result.passed ? '✓' : '✗'} ${result.dialogue.title}` +
          `: ${result.passed ? 'Passed' : 'Failed'}`));
    });
    success = !finalResults.some(result => !result.passed);
  } catch (err) {
    console.log(chalk.red(err));
  }

  client.close();
  console.log('');

  finalResults.filter(result => !result.passed).forEach((failedResult) => {
    console.log(chalk.red(`\t${failedResult.dialogue.title}`));
    console.log(`${failedResult.errorMessage}\n`);
  });

  const nSuccess = finalResults.filter(result => result.passed).length;
  const nFailures = finalResults.length - nSuccess;
  if (nSuccess > 0) {
    console.log(chalk.green(`\t${nSuccess} tests passed`));
  }
  if (nFailures > 0) {
    console.log(chalk.red(`\t${nFailures} tests failed`));
  }
  console.log(`\tTests took ${Math.round(new Date().getTime() - start)} ms\n\n`);
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}
run().catch((err) => {
  console.error(err);
});
