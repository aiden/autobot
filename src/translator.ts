'use strict';

import { Config } from './config';
import * as fs from 'fs';

const translateRegex = /<\$(.+?)>/;

export class Translator {
  static translations: Map<string, string[]>;
  static config: Config;

  static loadTranslation(translationFiles: string[], config: Config) {
    Translator.translations = translationFiles
      .map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')))
      .reduce(
        (res, mappings) => {
          Object.keys(mappings).forEach((key) => {
            let val = mappings[key];
            if (typeof val === 'string') {
              val = [val];
            }
            if (!Array.isArray(val)) {
              throw new Error(`locale file must contain string or array values, got: ${val}`);
            }
            if (res.has(key)) {
              res.set(key, res.get(key).concat(val));
            } else {
              res.set(key, val);
            }
          });
          return res;
        },
        new Map<string, string[]>());
    Translator.config = config;
  }

  static translate(original: string): string[] {
    const currentStrings = [original];
    const results: string[] = [];

    while (currentStrings.length > 0) {
      const current = currentStrings.pop();
      const match = translateRegex.exec(current);
      if (match !== null) {
        const identifier = match[1];
        const replacements = Translator.translations.get(identifier);
        if (replacements === undefined) {
          throw new Error(`Missing locale entry for $${identifier}`);
        }
        replacements.forEach((replacement) => {
          const translated = current.replace(`<$${identifier}>`, replacement);
          currentStrings.push(translated);
        });
      } else {
        // This means there are no more translations to make
        results.push(current);
      }
    }

    return results;
  }
}
