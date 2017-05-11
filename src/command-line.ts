import minimist = require('minimist');

import * as utils from "./utils";

// Command Line
const minimistOpts: minimist.Opts = {
    string: ['conversation'],
    alias: { 'c': ['conversation'] },
};

var argv: {
    conversation?: string;
    _?: string[];
} = minimist(process.argv.slice(2), minimistOpts);

interface CommandLineOptions {
    conversation: string;
}

export let getOptions = utils.once((): CommandLineOptions => {
    let options: CommandLineOptions = {
        conversation: argv.conversation,
    }
    if (typeof options.conversation !== 'string') {
        options.conversation = null;
    }
    return options;
});

