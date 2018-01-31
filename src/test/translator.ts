import { expect } from 'chai';
import { Translator } from '../translator';
import * as path from 'path';

export function getLocalePath(localeName: string): string {
  return path.join(__dirname, '..', '..', 'locale', localeName);
}

describe('translator.ts', () => {
  it('should refuse to load a bad json file', () => {
    expect(() => {
      Translator.loadTranslation([getLocalePath('bad_locale.json')]);
    }).to.throw(/locale file must contain string or array values/);
  });

  it('should throw error on missing identifier', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(() => {
      Translator.translate('Phrase with <$missing_identifier>');
    }).to.throw(/Missing locale entry for \$missing_identifier/);
  });

  it('should translate simply', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(Translator.translate('<$hey>, what\'s up?'))
      .to.eql(['hello, what\'s up?']);
  });

  it('should do multiple translation', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(Translator.translate('<$hey> <$yo>')).to.eql([
      'hello what\'s up?',
    ]);
  });

  it('should merge multiple translation files', () => {
    Translator.loadTranslation(
      [getLocalePath('locale1.json'),
       getLocalePath('locale2.json')]);
    expect(Translator.translate('hi <$friend>'))
      .to.have.members([
        'hi buddy',
        'hi amigo',
        'hi mate',
        'hi dude',
      ]);
    
    expect(Translator.translate('<$hello>')).to.eql(['ey']);
    expect(Translator.translate('<$hey>')).to.eql(['hello']);
  });

  it('should cross-product translations', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(Translator.translate('<$hey> <$cool> <$friend>')).to.have.members([
      'hello neat amigo',
      'hello fun amigo',
      'hello neat mate',
      'hello fun mate',
    ]);
  });

  it('should translate the same identifier multiple times', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(Translator.translate('<$hey> <$hey>')).to.eql(['hello hello']);
  });

  it('should translate luis variables correctly', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')], true);
    expect(Translator.translate('<$luisVar>')).to.eql(['hi <*>']);
  });

  it('should translate plural luis variables correctly', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')], true);
    expect(Translator.translate('<$luisVarPlural>')).to.eql(['hi <*>']);
  });
});
