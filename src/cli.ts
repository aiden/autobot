#!/usr/bin/env node --harmony
'use strict';

import { Message } from './spec/message';
import { Runner } from './runner';
import { BotFrameworkClient } from './clients/botframework_client';
import { Client } from './clients/client_interface';
import { Config, defaultConfig, ClientType } from './config';

import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import * as program from 'commander';


let chatPath: string = null;

program
  .version('0.1.0')
  .arguments('<chatPath>')
  .action((chatPathVal) => {
    chatPath = chatPathVal;
  })
  .parse(process.argv);

const config: Config = Object.assign(
  {},
  defaultConfig,
  jsYaml.safeLoad(fs.readFileSync('./config.yml', 'utf8')));
let client: Client;

if (config.client === ClientType.BotFramework) {
  client = new BotFrameworkClient(config.directLineSecret);
} else {
  console.log('ERROR: unsupported client', config.client);
  process.exit(1);
}

const runner = new Runner(client, chatPath, config);
runner.start().then((results) => {
  results.forEach(result => console.log(result));
  console.log('DONE');
}).catch((err) => {
  console.log('ERR:', err);
}).then(() => {
  client.close();
});

