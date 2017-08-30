import { expect } from 'chai';
import { Response, ResponseType } from '../../spec/response';

describe('Response.ts', () => {
  it('should correctly escape Regexes', () => {
    expect(Response.escapeRegex('<(.*)>')).to.equal('<\\(\\.\\*\\)>');
  });
  it('should transform tags', () => {
    expect(Response.transformTags('Hey <*>')).to.equal('^Hey (.*?)$');
    expect(Response.transformTags('Hey <WORD> there')).to.equal('^Hey ([^ ]+?) there$');
  });
  it('should instantiate <IMAGE> correctly', () => {
    expect(new Response(' <IMAGE> ').responseType).to.equal(ResponseType.Image);
  });
  it('should match simple phrases correctly', () => {
    expect(new Response('Hello there!').matches(' Hello there! ')).to.be.true;
  });
  it('should match complex phrases correctly', () => {
    expect(new Response('Hi <WORD>, your profits are up <NUMBER>% this week<*>')
      .matches('Hi John, your profits are up 14.5% this week. Have a good day!'))
      .to.be.true;
  });
});
