#!/usr/bin/env node
'use strict';

import * as path from 'path';

import { Message } from './spec/message';
import { ChatRunner } from './runner';
import * as program from 'commander';
import { BotFrameworkClient } from './clients/botframework_client';

let chatPath: string = null;

program
  .version('0.1.0')
  .option('-c', '--client', 'Which bot client to use, choose from [botframework]', 'botframework')
  .option('-dls', '--direct-line-secret DLS')
  .arguments('<chatPath>')
  .action((chatPathVal) => {
    chatPath = chatPathVal;
  })
  .parse(process.argv);

// Client
let client;
if (program.client === 'botframework') {
  if (!program.directLineSecret) {
    console.error('ERROR: no directLine secret provided');
    process.exit(1);
  }
  client = new BotFrameworkClient(program.dls);
}

if (!chatPath) {
  // TODO: Improve logic for multiple checks
  console.log('ERROR: No chat files provided');
  process.exit(1);
}

// Load chat from files
// Const fullPath = path.resolve(chatPath);
// console.log(`Loading ${fullPath}`);
//
// const json = require(fullPath);

// const runner = new ChatRunner(client, chat);
// runner.start();
