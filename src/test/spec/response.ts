import { expect } from 'chai';
import { Response } from '../../spec/response';
import { Message, Attachment } from '../../spec/message';

export function createTextMessage(text: string): Message {
  return {
    text,
    attachments: [],
    user: null,
  };
}


describe('response.ts', () => {
  it('should correctly escape Regexes', () => {
    expect(Response.escapeRegex('<(.*)>')).to.equal('<\\(\\.\\*\\)>');
  });
  it('should transform tags', () => {
    expect(Response.transformTags('Hey <*>')).to.equal('^Hey ([\\s\\S]*?)$');
    expect(Response.transformTags('Hey <WORD> there')).to.equal('^Hey ([^ ]+?) there$');
  });
  it('should instantiate <CARDS> correctly', () => {
    expect(new Response(' <CARDS> ').responseType).to.equal(Attachment.Card);
  });
  it('should instantiate <IMAGE> correctly', () => {
    expect(new Response(' <IMAGE> ').responseType).to.equal(Attachment.Image);
  });
  it('should match <CARDS> correctly', () => {
    expect(new Response(' <CARDS> ').responseType).to.equal(Attachment.Card);
  });
  it('should match <IMAGE> correctly', () => {
    expect(new Response(' <IMAGE> ').matches({
      user: null,
      text: null,
      attachments: [Attachment.Image],
    })).to.be.true;
  });
  it('should match <CARDS> correctly', () => {
    expect(new Response(' <CARDS> ').matches({
      user: null,
      text: null,
      attachments: [Attachment.Cards],
    })).to.be.true;
  });
  it('should match simple phrases correctly', () => {
    expect(new Response('Hello there!').matches(createTextMessage(' Hello there! ')))
      .to.be.true;
  });
  it('should not match incorrect simple phrases correctly', () => {
    expect(new Response('Hello there!').matches(createTextMessage(' Hi there! '))).to.be.false;
  });
  it('should match complex phrases correctly', () => {
    expect(new Response('Hi <WORD>, your profits are up <NUMBER>% this week<*>')
      .matches(
        createTextMessage('Hi John, your profits are up 14.5% this week. Have a good day!')))
      .to.be.true;
  });
  it('should not match incorrect complex phrases correctly', () => {
    expect(new Response('Hi <WORD>, your profits are up <NUMBER>% this week<*>')
      .matches(createTextMessage('Hi , your profits are up 14.5% this week. Have a good day!')))
      .to.be.false;
  });
  it('should not be a contains match', () => {
    expect(new Response('up').matches(createTextMessage('whatsup'))).to.be.false;
  });
  it('should support unicode matches', () => {
    expect(new Response('✓').matches(createTextMessage('✓'))).to.be.true;
  });
  it('should match across newlines', () => {
    expect(new Response('Hey<*>World').matches(createTextMessage('Hey\nWorld'))).to.be.true;
  });
});
