import { expect } from 'chai';
import { Turn } from '../../spec/turn';
import { DialogueInvalidError } from '../../spec/dialogue_invalid_error';

describe('turn.ts', () => {
  it('should not construct empty turns', () => {
    expect(() => {
      new Turn({});
    }).to.throw(DialogueInvalidError);
  });
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
  it('should refuse to construct bad branches', () => {
    expect(() => {
      new Turn({
        Branch: {
          0: [{
            Human: 'hello',

          }],
          1: [{
            Bot: 'world',
          }],
        },
      });
    }).to.throw(DialogueInvalidError);
  });
  it('should match branches correctly', () => {
    const branch1 = [{
      Bot: 'Hello world',
    }];
    const branch2 = [{
      Bot: 'Hi world',
    }];
    expect(new Turn({
      Branch: {
        1: branch1,
        2: branch2,
      },
    }).matches('Hello world')).to.deep.equal([new Turn(branch1[0])]);
  });
  it('should fail to match branches correctly', () => {
    const branch1 = [{
      Bot: 'Hello world',
    }];
    const branch2 = [{
      Bot: 'Hi world',
    }];
    expect(new Turn({
      Branch: {
        1: branch1,
        2: branch2,
      },
    }).matches('Bye world')).to.be.false;
  });
});
