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

import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
// import * as program from 'commander';
// import * as chalk from 'chalk';

export function getRunners(
  dialoguePath: string,
  config: Config,
): Runner[] {
  const dialogueFileInfo = fs.lstatSync(dialoguePath);
  let dialogues;
  if (dialogueFileInfo.isDirectory()) {
    const titles = {};
    dialogues = glob.sync('**/*.yml', {
      cwd: dialoguePath,
    }).map(x => path.join(dialoguePath, x))
      .map((filepath) =>  {
        try {
          const dialogue = new Dialogue(filepath, config.preamble);
          if (titles[dialogue.title]) {
            return null;
          }
          titles[dialogue.title] = true;
          return filepath;
        } catch (e) {
          if (e instanceof DialogueInvalidError) {
            return null;
          } else {
            throw e;
          }
        }
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
  const runners = dialogues.map((dpath) => {
    return new Runner(createClient(config), dpath, config);
  });
  return runners;
}
function createClient(config: Config): Client {
  if (config.client === ClientType.BotFramework) {
    return new BotFrameworkClient(config.directLineSecret);
  } else {
    console.log('ERROR: unsupported client', config.client);
    process.exit(1);
  }
}
