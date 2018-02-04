import * as ProgressBar from 'ascii-progress';
import { Dialogue } from './spec/dialogue';
 
export type ProgressBars = {
  [key: string]: ProgressBar,
};
export function createBar(dialogue: Dialogue, minWidth: number): ProgressBars {
  return new ProgressBar({
    schema: `${padString(dialogue.title, minWidth)}: [:bar] :current/:total :percent :elapseds.yellow`,
    current: 0,
    total: dialogue.turns.length,
  });
}

export function tickProgress(progressBar: ProgressBar, dialogue: Dialogue, minWidth: number): void {
  progressBar.tick();
  if (progressBar.completed) {
    progressBar.setSchema({
      schema: `${padString(dialogue.title, minWidth)}: [:bar.green] :current.green/:total.green` +
      ` :percent.green :elapseds.green`,
    }, true);
  }
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
