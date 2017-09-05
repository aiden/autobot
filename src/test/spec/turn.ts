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

  it('should unbox human lists as branches', () => {
    expect(new Turn({
      Human: [
        'One',
        'Two',
      ],
    })).to.eql(new Turn({
      Branch: {
        1: {
          Human: 'One',
        },
        2: {
          Human: 'Two',
        },
      },
    }));
  });

  it('should create the right number of branches for simple cases', () => {
    const turns = Turn.createTurns([
      { Human: 'Hi' },
      { Bot: 'Hey there' },
      { Human: 'How are you?' },
      { Bot: 'I\'m good' },
    ]);
    expect(turns[0].numRunnersRequired).to.equal(1);
  });

  it('should create the right number of branches for complex cases', () => {
    const turns = Turn.createTurns([
      { Human: 'Hi' },
      { Branch: {
        1: [
          { Bot: 'Hey' },
          { Branch: {
            1: [
              { Human: 'How are you?' },
              { Bot: 'I am good' },
            ],
            2: [
              { Bot: 'Is your day well?' },
            ],
          }},
        ],
        2: [
          { Human: 'Hello' },
        ],
      }},
      { Bot: 'Do you need assistance?' },
      { Branch: {
        1: {
          Human: 'Yes',
        },
        2: {
          Human: 'No',
        },
      }},
      { Bot: 'Ok' },
    ]);
    expect(turns[0].numRunnersRequired).to.equal(3);
    expect(turns[1].numRunnersRequired).to.equal(3);
    expect(turns[1].botBranches[0][0].numRunnersRequired).to.equal(2);
    expect(turns[1].humanBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[1].botBranches[0][1].humanBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[1].botBranches[0][1].botBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[2].numRunnersRequired).to.equal(2);
    expect(turns[3].numRunnersRequired).to.equal(2);
    expect(turns[4].numRunnersRequired).to.equal(1);
  });
});
