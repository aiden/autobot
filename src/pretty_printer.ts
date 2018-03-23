import * as ProgressBar from 'node-progress-bars';
import { Dialogue } from './spec/dialogue';
import { TurnType } from './spec/turn';
 
export function createBar(dialogue: Dialogue, minWidth: number): ProgressBar {
  const title = padString(dialogue.title, minWidth);
  return new ProgressBar({
    schema: `${title}: [:bar] :current/:total :percent :elapseds.yellow`,
    current: 0,
    total: dialogue.turns.filter(t => t.turnType === TurnType.Bot).length,
  });
}

export function tickProgress(progressBar: ProgressBar, dialogue: Dialogue, minWidth: number): void {
  const title = padString(dialogue.title, minWidth);
  progressBar.tick();
  if (progressBar.completed && progressBar.schema) {
    progressBar.setSchema(`${title}: [:bar] :current/:total :percent :elapseds.green`, true);
  }
}
export function failProgress(progressBar: ProgressBar, dialogue: Dialogue, minWidth: number): void {
  const title = padString(dialogue.title, minWidth);
  progressBar.setSchema(`${title}: [:bar] :current/:total :percent :elapseds.red`, true);
}
export function updateSchema(progressBar: ProgressBar, dialogue: Dialogue, minWidth: number): void {
  progressBar.setSchema({
    schema: `${padString(dialogue.title, minWidth)}: [:bar] :current/:total :percent :elapseds`,
  }, true);
}

function padString(text: string, width: number) {
  const widthDiff = width - text.length;
  if (widthDiff < 1) {
    return text;
  } else {
    return text + Array(widthDiff).fill(' ').join('');
  }
}
