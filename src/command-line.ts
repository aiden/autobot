import minimist = require('minimist');

import * as utils from "./utils";

// Command Line
const minimistOpts: minimist.Opts = {
    string: ['chat-path'],
    alias: { 'c': ['chat-path'] },
};

var argv: {
      c?: string;
      _?: string[];
    } = minimist(process.argv.slice(2), minimistOpts);

export interface CommandLineOptions {
    chatPath: string;
}

export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        chatPath: argv.c,
    }
    return options;
});

