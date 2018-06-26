import { Message, Attachment  } from './message';
import { Translator } from '../translator';
import * as program from 'commander';

const wildcardRegex: RegExp = /<\*>/g;
const wordRegex: RegExp = /<WORD>/g;
const numberRegex: RegExp = /<NUMBER>/g;
const regexRegex: RegExp = /<\((.+?)\)>/g;

export class Response {
  attachments: Attachment[];
  private textMatchChecker: RegExp;
  original: string;

  constructor(responseData: string) {
    this.original = responseData.trim();
    switch (this.original) {
      case '<IMAGE>':
        this.responseType = Attachment.Image;
        break;
      case '<CARDS>':
        this.responseType = Attachment.Card;
        break;
      default:
        this.responseType = Attachment.Text;
        this.textMatchChecker = new RegExp(Response.transformTags(this.original));
    }
  }

  matches(message: Message): boolean {
    if (!message.attachments.includes(this.responseType)) {
      return false;
    } else if (this.responseType === Attachment.Text) {
      return message.text.trim().match(this.textMatchChecker) !== null;
    } else {
      return true;
    }
  }

  static transformTags(text: string): string {
    regexRegex.lastIndex = 0;

    const taggedText = text
      .replace(wildcardRegex, '<([\\s\\S]*?)>')
      .replace(wordRegex, '<([^ ]+?)>')
      .replace(numberRegex, '<([0-9\.,-]+)>');

    const regexes: string[] = [];
    let match;
    while ((match = regexRegex.exec(taggedText)) != null) {
      // Take the first group out
      regexes.push(`(${match[1]})`);
    }

    const escapedText = Response.escapeRegex(taggedText);

    // Restore the regexes;
    let outText = escapedText;

    regexes.forEach((regexString) => {
      const escapedVersion = '<' + Response.escapeRegex(regexString) + '>';
      outText = outText.replace(escapedVersion, regexString);
    });

    return `^${outText}$`;
  }
  static escapeRegex(text: string): string {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}
