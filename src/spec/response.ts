export enum ResponseType {
  Text,
  Image,
}
const wildcardRegex: RegExp = /<\*>/g;
const wordRegex: RegExp = /<WORD>/g;
const numberRegex: RegExp = /<NUMBER>/g;
const regexRegex: RegExp = /<\((.+?)\)>/g;

export class Response {
  responseType: ResponseType;
  textMatch: RegExp;
  constructor(responseData: string) {
    const trimmedData = responseData.trim();
    this.responseType = (trimmedData === '<IMAGE>') ? ResponseType.Image : ResponseType.Text;
    if (this.responseType === ResponseType.Text) {
      this.textMatch = new RegExp(Response.transformTags(trimmedData));
    }
  }

  matches(text: string): boolean {
    return text.trim().match(this.textMatch) !== null;
  }

  static transformTags(text: string): string {
    const taggedText = text.replace(wildcardRegex, '<(.*?)>')
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

    console.log(outText);
    return '^' + outText + '$';
  }
  static escapeRegex(text: string): string {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}
