import { Message, Attachment  } from './message';
import { Translator } from '../translator';
import * as program from 'commander';

const wildcardRegex: RegExp = /<\*>/g;
const wordRegex: RegExp = /<WORD>/g;
const numberRegex: RegExp = /<NUMBER>/g;
const regexRegex: RegExp = /<\((.+?)\)>/g;

// Use the Attachment enum values to create a regex for any attachment wildcard.
const attachmentAlternatives = Object.values(Attachment).join('|');
const attachmentsRegex = new RegExp(`<(?:${attachmentAlternatives})>`, 'g');

export class Response {
  attachments: Attachment[];
  private textMatchChecker: RegExp;
  private bodyText: string;
  original: string;

  constructor(responseData: string) {
    this.original = responseData.trim();

    // Get a list of the Attachments in the response data.  The map removes the
    // angle brackets so that the resulting elements are valid enum values.
    this.attachments = (this.original.match(attachmentsRegex) || [])
      .map(match => <Attachment>match.slice(1, -1));

    // Get what's left of the body text once the attachment wildcards have been
    // removed.  Each attachment consumes the surrounding whitespace, which in
    // the end we replace with a single space.  This is done so that you can
    // write e.g. '<IMAGE> <CARDS>' as a message spec and _not_ have the
    // matcher try to match the message text with the space in between the
    // wildcards in the spec.
    //
    // TODO: Use the array just after the map() to create an _array of match
    //   checkers_ so that we can validate the interleaving of attachments and
    //   message text, rather than ignoring where the attachments come within
    //   the text.
    this.bodyText = this.original  // 'Here you go: <IMAGE> and <CARDS>'
      .split(attachmentsRegex)     // ['Here you go: ', ' and ', '']
      .map(s => s.trim())          // ['Here you go:', 'and', '']
      .filter(s => s)              // ['Here you go:', 'and']
      .join(' ');                  // 'Here you go: and'

    // Construct a regex to match the remaining body text.
    this.textMatchChecker = new RegExp(Response.transformTags(this.bodyText));
  }

  matches(message: Message): boolean {

    // Check that the message body is present or absent, as expected.
    if ((this.bodyText && !message.text) || (message.text && !this.bodyText)) {
      return false;
    }

    // If there is a message body, check that its content is correct.
    if (this.bodyText && message.text.trim().match(this.textMatchChecker) === null) {
      return false;
    }

    // Check that we have the right number of attachments.
    if (this.attachments.length !== message.attachments.length) {
      return false;
    }

    // Check that we have the right types of attachments.
    for (let i = 0; i < this.attachments.length; i += 1) {
      if (this.attachments[i] !== message.attachments[i]) {
        return false;
      }
    }

    // Everything appears to be in order.
    return true;
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
