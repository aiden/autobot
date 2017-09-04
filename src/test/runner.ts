import { expect } from 'chai';
import { Runner } from '../runner';
import { MockClient } from '../clients/mock_client';
import { defaultConfig } from '../config';
import { Dialogue } from '../spec/dialogue';
import { MessageType } from '../spec/message';
import * as path from 'path';

function getDialoguePath(dialogueName: string): string {
  return path.join(__dirname, '..', '..', 'dialogues', dialogueName);
}

describe('runner.ts', () => {
  it('should run a simple conversation from a file', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('simple/simple.yml'), defaultConfig);
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('simple/simple.yml')),
          lastMessage: 0,
        });
        expect(client.read(username)).to.equal('Hello');
        client.reply({
          messageType: MessageType.Text,
          text: 'Hi',
          user: username,
        });
        client.reply({
          messageType: MessageType.Text,
          text: 'How are you?',
          user: username,
        });
        expect(client.read(username)).to.equal('I\'m good');
        expect(client.read(username)).to.equal('Yourself?');
        client.reply({
          messageType: MessageType.Text,
          text: 'I\'m good too',
          user: username,
        });
      },
      100);

    return runner.start().then((results) => {
      results.forEach((testResult) => {
        expect(testResult.passed).to.be.true;
      });
      console.log("FINISHED TESTING");
    }).catch((reason) => {
      expect.fail(reason);
    });
  });
});
