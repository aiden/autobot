import { MessageType  } from './message';
import { Translator } from '../translator';
import * as program from 'commander';

const wildcardRegex: RegExp = /<\*>/g;
const wordRegex: RegExp = /<WORD>/g;
const numberRegex: RegExp = /<NUMBER>/g;
const regexRegex: RegExp = /<\((.+?)\)>/g;

export class Response {
  responseType: MessageType;
  private textMatchChecker: RegExp;
  original: string;

  constructor(responseData: string) {
    const trimmedData = responseData.trim();
    this.original = trimmedData;
    this.responseType = (trimmedData === '<IMAGE>') ? MessageType.Image : MessageType.Text;
    if (this.responseType === MessageType.Text) {
      this.textMatchChecker = new RegExp(Response.transformTags(trimmedData));
    }
  }

  matches(text: string): boolean {
    return text.trim().match(this.textMatchChecker) !== null;
  }

  static transformTags(text: string): string {
    regexRegex.lastIndex = 0;

    const taggedText = text
      .replace(wildcardRegex, '<(.*?)>')
      .replace(wordRegex, '<([^ ]+?)>')
      .replace(numberRegex, '<([0-9\.]+)>');

    const regexes: string[] = [];
    let match;
    while ((match = regexRegex.exec(taggedText)) != null) {
      // Take the first group out
      regexes.push('(' + match[1] + ')');
    }

    const escapedText = Response.escapeRegex(taggedText);

    // Restore the regexes;
    let outText = escapedText;

    regexes.forEach((regexString) => {
      const escapedVersion = '<' + Response.escapeRegex(regexString) + '>';
      outText = outText.replace(escapedVersion, regexString);
    });

    return outText;
  }
  static escapeRegex(text: string): string {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}
