#!/usr/bin/env node --harmony
'use strict';

import { Message } from './spec/message';
import { Runner, TestResult } from './runner';
import { BotFrameworkClient } from './clients/botframework_client';
import { Client } from './clients/client_interface';
import { Config, defaultConfig, ClientType } from './config';

import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import * as program from 'commander';
import * as chalk from 'chalk';
import * as findParentDir from 'find-parent-dir';
import 'source-map-support/register';

let chatPath: string = null;

program
  .version('0.1.0')
  .option('-v', '--verbose', 'Enable full logging including bot queries and responses')
  .option('-c', '--config', 'e2e-test.yml config file to use')
  .arguments('<chatPath>')
  .action((chatPathVal) => {
    chatPath = chatPathVal;
  })
  .parse(process.argv);
console.log('');


let configPath;
if (program.config) {
  configPath = program.config;
} else {
  configPath = findParentDir.sync(process.cwd(), 'bot-e2e.yml');
}

if (!fs.existsSync(configPath)) {
  if (configPath) {
    console.log(chalk.red(`Cannot find file ${configPath}`));
  } else {
    console.log(
      chalk.red(`Unable to discover bot-e2e.yml config file in this or parent directories`));
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

const runner = new Runner(client, chatPath, config);
let success;

let finalResults: TestResult[];
let start;
runner.start(() => {
  start = new Date().getTime();
  console.log(chalk.green(`\n\tDiscovered ${runner.dialogues.length} tests `) +
              `(${runner.userMetadata.size} branches)\n`);
}).then((results) => {
  finalResults = results;
  results.forEach((result) => {
    const chalkFn = result.passed ? chalk.green : chalk.red;
    console.log(
      chalkFn(`\t${result.passed ? '✓' : '✗'} ${result.dialogue.title}` +
        `: ${result.passed ? 'Passed' : 'Failed'}`));
  });
  success = !results.some(result => !result.passed);
}).catch((err) => {
  console.log('ERR:', err);
}).then(() => {
  client.close();
  console.log('');

  finalResults.filter(result => !result.passed).forEach((failedResult) => {
    console.log(chalk.red(`\t${failedResult.dialogue.title}`));
    console.log(`${failedResult.errorMessage}\n`);
  });

  const nSuccess = finalResults.filter(result => result.passed).length;
  const nFailures = finalResults.length - nSuccess;
  console.log(chalk.green(`\t${nSuccess} tests passed`));
  console.log(chalk.red(`\t${nFailures} tests failed`));
  console.log(`\t${Math.round(new Date().getTime() - start)} ms\n\n`);
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
