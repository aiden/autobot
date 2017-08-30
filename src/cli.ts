#!/usr/bin/env node
'use strict';

import * as path from 'path';

import { Client } from './client';
import { Chat } from './chat';
import { ChatRunner } from './runner';
import * as program from "commander";


let chatPath: string = null;

program
  .version("0.1.0")
  .option("-dls", "--direct-line-secret DLS", )
  .arguments("<chatPath>")
  .action((chatPathVal) => {
    chatPath = chatPathVal;
  })
  .parse(process.argv);

// Environment vars
const secret = program.directLineSecret;

// Client
const client = new Client(secret);

if (!chatPath) {
  // TODO: Improve logic for multiple checks
  console.log("ERROR: No chat files provided");
  process.exit(1);
}

// Load chat from files
const fullPath = path.resolve(chatPath);
console.log(`Loading ${fullPath}`);

const json = require(fullPath);
const chat = new Chat(json);

const runner = new ChatRunner(client, chat);
runner.start();
