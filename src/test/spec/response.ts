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
  it('should ignore text with <IMAGE> if no text is expected', () => {
    // This is required for backwards compatibility with when <IMAGE>
    // could only be used as the entire response.
    expect(new Response(' <IMAGE> ').matches({
      user: null,
      text: ' Here is your image: ',
      attachments: [Attachment.Image],
    })).to.be.true;
  });
  it('should ignore text with <CARDS> if no text is expected', () => {
    // This is required for backwards compatibility with when <CARD>
    // could only be used as the entire response.
    expect(new Response(' <CARDS> ').matches({
      user: null,
      text: ' Here are your options: ',
      attachments: [Attachment.Cards],
    })).to.be.true;
  });
  it('should match correct text with an attachment if text is expected', () => {
    expect(new Response('Here are your options: <CARDS>').matches({
      user: null,
      text: ' Here are your options: ',
      attachments: [Attachment.Cards],
    })).to.be.true;
  });
  it('should not match incorrect text with an attachment if text is expected', () => {
    expect(new Response('Here are your options: <CARDS>').matches({
      user: null,
      text: 'choose from ',
      attachments: [Attachment.Cards],
    })).to.be.false;
  });
  it('should not match incorrect type of attachment', () => {
    expect(new Response('<IMAGE>').matches({
      user: null,
      text: null,
      attachments: [Attachment.Other],
    })).to.be.false;
  });
  it('should not match a missing attachment', () => {
    expect(new Response('Here you go: <IMAGE> ').matches({
      user: null,
      text: 'Here you go:',
      attachments: [],
    })).to.be.false;
  });
  it('should match multiple attachments', () => {
    expect(new Response('Here you go:<IMAGE><IMAGE> ').matches({
      user: null,
      text: 'Here you go:',
      attachments: [Attachment.Image, Attachment.Image],
    })).to.be.true;
  });
  it('should not match the wrong number of attachments', () => {
    expect(new Response('Here you go: <IMAGE> <IMAGE>').matches({
      user: null,
      text: 'Here you go:',
      attachments: [Attachment.Image, Attachment.Image, Attachment.Image],
    })).to.be.false;
  });
  it('should match different types of attachments', () => {
    expect(new Response(' Here you go:  <IMAGE>  <CARDS> ').matches({
      user: null,
      text: 'Here you go:',
      attachments: [Attachment.Image, Attachment.Cards],
    })).to.be.true;
  });
  it('should not match the wrong order of attachments', () => {
    expect(new Response(' <IMAGE> <CARDS>').matches({
      user: null,
      text: null,
      attachments: [Attachment.Cards, Attachment.Image],
    })).to.be.false;
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
