import { Runner, TestMeta } from './runner';
import { Client } from './clients/client_interface';
import { Config, ClientType } from './config';
import { BotFrameworkClient } from './clients/botframework_client';

import { Dialogue } from './spec/dialogue';
import { Message } from './spec/message';
// import { Response } from './spec/response';
// import { Turn, TurnType } from './spec/turn';
import { DialogueInvalidError } from './spec/dialogue_invalid_error';
import { Translator } from './translator';
import { updateSchema } from './pretty_printer';

import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as program from 'commander';
// import * as chalk from 'chalk';

export function getRunners(
  dialoguePath: string,
  config: Config,
): Runner[] {
  const dialogueFileInfo = fs.lstatSync(dialoguePath);
  let dialogues;
  if (dialogueFileInfo.isDirectory()) {
    dialogues = glob.sync('**/*.yml', {
      cwd: dialoguePath,
    }).map(x => path.join(dialoguePath, x))
      .map((filepath) =>  {
        return isDialogue(filepath, config) ? filepath : null;
      })
      .filter(x => x);

    if (dialogues.length === 0) {
      throw new Error('No test files found on path');
    }
  } else if (dialogueFileInfo.isFile()) {
    dialogues = [dialoguePath];
  } else {
    throw new DialogueInvalidError(`${dialoguePath} does not exist`);
  }
  const runners: Runner[] = dialogues.map((dpath) => {
    return new Runner(createClient(config), dpath, config);
  }).sort((a: Runner, b: Runner): number => {
    return a.dialogues[0].title.toLowerCase() < b.dialogues[0].title.toLowerCase() ? -1 : 1;
  });
  // To print nicer (aligned), find the min width, set it, and update the progress bars
  const minWidth = runners.reduce((a: number, n: Runner) => {
    const titleLength = n.dialogues[0].title.length;
    return titleLength > a ? titleLength : a;
  }, 0);
  runners.forEach(r => r.minWidth = minWidth);
  runners.forEach(r => r.createProgressBar());
  // runners.forEach(r => r.progressBar && updateSchema(r.progressBar, r.dialogues[0], r.minWidth));

  return runners;
}

function createClient(config: Config): Client {
  if (config.client === ClientType.BotFramework) {
    const dom = program.dom;
    return new BotFrameworkClient(config.directLineSecret, dom);
  } else {
    console.log('ERROR: unsupported client', config.client);
    process.exit(1);
  }
}
function isDialogue(filepath: string, config): boolean {
  try {
    const dialogue = new Dialogue(filepath, config.preamble);
    return true;
  } catch (e) {
    if (e instanceof DialogueInvalidError) {
      return false;
    } else {
      throw e;
    }
  }
}
