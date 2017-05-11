import minimist = require('minimist');

import * as utils from "./utils";

// Command Line
const minimistOpts: minimist.Opts = {
    string: ['chat-path'],
    alias: { 'c': ['chat-path'] },
};

var argv: {
    chat_path?: string;
    _?: string[];
} = minimist(process.argv.slice(2), minimistOpts);

interface CommandLineOptions {
    chat_path: string;
}

export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        chat_path: argv.chat_path,
    }
    if (typeof options.chat_path !== 'string') {
        options.chat_path = null;
    }
    return options;
});

