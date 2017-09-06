import { Turn } from './turn';
import { DialogueInvalidError } from './dialogue_invalid_error';
import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export class Dialogue {
  title: string;
  turns: Turn[];

  constructor(filePath: string, preamble?: any[]) {
    let dialogueDoc;
    try {
      dialogueDoc = jsYaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
      if (!dialogueDoc) {
        throw new DialogueInvalidError('Not a valid yaml: ${filePath}');
      }
    } catch (e) {
      if (e instanceof jsYaml.YAMLException) {
        throw new DialogueInvalidError(`File is not valid YAML: ${e.message}`);
      } else {
        throw new DialogueInvalidError(e.message);
      }
    }
    this.title = dialogueDoc.Title ?
      dialogueDoc.Title :
      path.basename(filePath, path.extname(filePath));
    if (!dialogueDoc.Dialogue) {
      throw new DialogueInvalidError('No dialogue found');
    }
    if (!(dialogueDoc.Dialogue instanceof Array)) {
      throw new DialogueInvalidError(
        'Dialogue lines must start with dashes: ${dialogueDoc.Dialogue}');
    }

    const turnData = preamble ? preamble : [];
    this.turns = Turn.createTurns(turnData.concat(dialogueDoc.Dialogue));
  }
}
