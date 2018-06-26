import { Message, Attachment  } from './message';
import { Translator } from '../translator';
import * as program from 'commander';

const wildcardRegex: RegExp = /<\*>/g;
const wordRegex: RegExp = /<WORD>/g;
const numberRegex: RegExp = /<NUMBER>/g;
const regexRegex: RegExp = /<\((.+?)\)>/g;

// Matches an attachment wildcard (e.g. <IMAGE>) at the _end_ of responseData.
//
// The matched part is just the word in the brackets ('IMAGE'), which can be
// directly compared against the Attachment enum (from which it was generated).
const attachmentAlternatives = Object.values(Attachment).join('|');
const attachmentsRegex = new RegExp(`\\s*<(${attachmentAlternatives})>$`);

export class Response {
  attachments: Attachment[];
  private textMatchChecker: RegExp;
  private bodyText: string;
  original: string;

  constructor(responseData: string) {
    this.attachments = [];
    this.original = responseData.trim();
    this.bodyText = this.original;

    // Construct a list of attachments from the attachment wildcards at the
    // end of the response data.  The end result is that `this.bodyText`
    // contains only the body text and potentially some inline wildcards;
    // and `this.attachments` contains a list of attachment types, in the
    // same order as they originally were in the supplied data.
    let match;
    while ((match = this.bodyText.match(attachmentsRegex)) != null) {
      this.attachments.push(match[1]);
      this.bodyText = this.bodyText.slice(0, match.index);
    }
    this.attachments.reverse();

    // Construct a regex to match the remaining body text in terms of its
    // inline wildcards.
    this.textMatchChecker = new RegExp(Response.transformTags(this.bodyText));
  }

  matches(message: Message): boolean {

    // If we are expecting a message body, check that we have one...
    if (this.bodyText && !message.text) {
      return false;
    }

    // ...and check that the content is the same.
    //
    // Note that we ignore the message body altogether if the spec doesn't
    // include one.  This is for backwards compatibility with when <IMAGE>
    // and <CARDS> could only be used in place of the entire message.
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
