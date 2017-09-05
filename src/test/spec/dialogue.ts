import { expect } from 'chai';
import { Dialogue } from '../../spec/dialogue';
import { Turn, TurnType } from '../../spec/turn';
import { DialogueInvalidError } from '../../spec/dialogue_invalid_error';
import * as path from 'path';

describe('dialogue.ts', () => {
  it('should fail to parse non-existent files', () => {
    expect(() => {
      new Dialogue('');
    }).to.throw(DialogueInvalidError);
  });
  it('should fail to open non-compliant YML', () => {
    expect(() => {
      new Dialogue(path.join(__dirname, '..', '..', '..', 'dialogues', 'bad_greeting.yml'));
    }).to.throw(/not valid YAML/);;
  });
  it('should parse valid YAML', () => {
    const dialogue = new Dialogue(
      path.join(__dirname, '..', '..', '..', 'dialogues', 'greeting.yml'),
    );
    expect(dialogue.title).to.equal('Greetings');
    expect(dialogue.turns).to.be.an('array').that.has.length(3);
    dialogue.turns.forEach((turn) => {
      turn.numRunnersRequired = 1;
    });
    expect(dialogue.turns[0]).to.deep.equals(new Turn({
      Human: 'Hey there',
    }));
    expect(dialogue.turns[1]).to.deep.equals(new Turn({
      Bot: [
        'How are you?',
        'Good day!',
      ],
    }));
    const branch = dialogue.turns[2];
    expect(branch.turnType).to.equal(TurnType.Branch);
    expect(branch.botBranches).to.have.length(1);
    expect(branch.humanBranches).to.have.length(1);
    expect(branch.botBranches[0]).to.deep.equals([new Turn({
      Bot: 'Hey',
    })]);
    expect(branch.humanBranches[0]).to.deep.equals([new Turn({
      Human: 'Hello',
    })]);
  });
});
