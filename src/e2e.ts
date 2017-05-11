'use strict';

import { Client } from './client';
import * as commandLine from "./command-line";

// Environment vars
const secret = process.env.DIRECT_LINE_SECRET;

// Command Line Options
const options = commandLine.getOptions();
console.log('Loaded command line options: ', options);

const client = new Client(secret);

if (options.chat_path) {

}
