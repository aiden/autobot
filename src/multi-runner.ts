import { Runner, TestMeta } from './runner';
import { Client } from './clients/client_interface';
import { Config } from './config';

import { Dialogue } from './spec/dialogue';
import { Message } from './spec/message';
// import { Response } from './spec/response';
// import { Turn, TurnType } from './spec/turn';
import { DialogueInvalidError } from './spec/dialogue_invalid_error';
import { Translator } from './translator';

import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
// import * as program from 'commander';
// import * as chalk from 'chalk';

export function getRunners(
  client: Client,
  dialoguePath: string,
  config: Config,
): Runner[] {
  const dialogueFileInfo = fs.lstatSync(dialoguePath);
  let dialogues;
  if (dialogueFileInfo.isDirectory()) {
    dialogues = glob.sync('**/*.yml', {
      cwd: dialoguePath,
    }).map(x => path.join(dialoguePath, x))
      .filter(x => x);

    if (dialogues.length === 0) {
      throw new Error('No test files found on path');
    }
  } else if (dialogueFileInfo.isFile()) {
    dialogues = [dialoguePath];
  } else {
    throw new DialogueInvalidError(`${dialoguePath} does not exist`);
  }
  const runners = dialogues.map((dpath) => {
    return new Runner(client, dpath, config);
  });
  return runners;
}
