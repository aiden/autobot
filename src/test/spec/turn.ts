import { expect } from 'chai';
import { Turn } from '../../spec/turn';

describe('turn.ts', () => {
  it('should match when only one choice', () => {
    expect(new Turn({
      Bot: 'Hello',
    }).matches('Hello ')).to.be.true;
  });
  it('should not match when only one incorrect choice', () => {
    expect(new Turn({
      Bot: 'Hello',
    }).matches('bye ')).to.be.false;
  });
  it('should match when one of multiple is correct', () => {
    const turn = new Turn({
      Bot: [
        'Hello',
        'Hi',
      ],
    });
    expect(turn.matches('Hi')).to.be.true;
    expect(turn.matches('Hello')).to.be.true;
  });
  it('should not match when all of multiple is incorrect', () => {
    const turn = new Turn({
      Bot: [
        'Hello',
        'Hi',
      ],
    });
    expect(turn.matches('Bye')).to.be.false;
  });
});
