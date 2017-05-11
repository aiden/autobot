'use strict';

import * as path from 'path';

import { Client } from './client';
import { Chat } from './chat';
import { ChatRunner } from './runner';
import * as commandLine from "./command-line";

// Environment vars
const secret = process.env.DIRECT_LINE_SECRET;

// Client
const client = new Client(secret);

// Command Line Options
const options = commandLine.getOptions();
const chatPath = options.chatPath;

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
