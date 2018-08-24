import { expect } from 'chai';
import { Runner } from '../runner';
import { MockClient } from '../clients/mock_client';
import { defaultConfig } from '../config';
import { Dialogue } from '../spec/dialogue';
import { Attachment } from '../spec/message';

import * as fs from 'fs';
import * as path from 'path';
import * as jsYaml from 'js-yaml';

function getDialoguePath(dialogueName: string): string {
  return path.join(__dirname, '..', '..', 'dialogues', dialogueName);
}

describe('runner.ts', () => {
  it('should run a simple conversation from a file', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/simple.yml'), defaultConfig);
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('examples/simple.yml')),
          lastMessage: 0,
          terminated: false,
        });
        expect(client.read(username)).to.equal('Hello');
        client.reply({
          attachments: [],
          text: 'Hi',
          user: username,
        });
        client.reply({
          attachments: [],
          text: 'How are you?',
          user: username,
        });
        expect(client.read(username)).to.equal('I\'m good');
        expect(client.read(username)).to.equal('Yourself?');
        client.reply({
          attachments: [],
          text: 'I\'m good too',
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
    });
  });

  it('should ignore things in the ignore', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('simple-ignore.yml'),
      { ...defaultConfig, ignore: ['123'] });
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('simple-ignore.yml')),
          lastMessage: 0,
          terminated: false,
        });
        expect(client.read(username)).to.equal('Hello');
        client.reply({
          attachments: [],
          text: '123',
          user: username,
        });
        client.reply({
          attachments: [],
          text: 'Hi',
          user: username,
        });
        expect(client.read(username)).to.equal('I\'m good');
        expect(client.read(username)).to.equal('Yourself?');
        client.reply({
          attachments: [],
          text: 'I\'m good too',
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
    });
  });

  it('should load multiple conversations from a directory', () => {
    const client = new MockClient();
    const runner = new Runner(
      client,
      getDialoguePath('examples/'),
      Object.assign({}, defaultConfig, { timeout: 5 }));
    expect(runner.dialogues).to.have.length(4);
    expect(runner.dialogues).to.deep.include(
      new Dialogue(getDialoguePath('examples/simple.yml')),
    ).and.to.deep.include(
      new Dialogue(getDialoguePath('examples/branching.yml')),
    ).and.to.deep.include(
      new Dialogue(getDialoguePath('examples/simple-attachment.yml')),
    ).and.to.deep.include(
      new Dialogue(getDialoguePath('examples/multiple-attachments.yml')),
    );
  });

  it('should timeout', () => {
    const client = new MockClient();
    const runner = new Runner(
      client,
      getDialoguePath('examples/simple.yml'),
      Object.assign({}, defaultConfig, { timeout: 5 }));
    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.false;
      expect(testResult.errorMessage).to.contain('timeout');
    });
  });

  it('should fail a simple conversation if the text doesn\'t match', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/simple.yml'), defaultConfig);
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('examples/simple.yml')),
          lastMessage: 0,
          terminated: false,
        });
        client.reply({
          attachments: [],
          text: 'Bye',
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.false;
      expect(testResult.errorMessage)
        .to.contain('Expected:')
        .and.to.contain('Got:')
        .and.to.contain('Hi')
        .and.to.contain('Hello')
        .and.to.contain('Bye');
    });
  });

  it('should fail a simple conversation if the attachment doesn\'t match', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/simple-attachment.yml'),
      defaultConfig);
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('examples/simple-attachment.yml')),
          lastMessage: 0,
          terminated: false,
        });

        expect(client.read(username)).to.equal('Hello');
        client.reply({
          attachments: [],
          text: 'Hi',
          user: username,
        });

        expect(client.read(username)).to.equal('How is my campaign doing?');
        client.reply({
          attachments: [Attachment.Cards],
          text: null,
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.false;
      expect(testResult.errorMessage)
        .to.contain('Expected:\n\t\t<IMAGE>')
        .and.to.contain('Got:\n\t\t<CARDS>');
    });
  });

  it('should fail a conversation if attachment order doesn\'t match', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/multiple-attachments.yml'),
      defaultConfig);
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('examples/multiple-attachments.yml')),
          lastMessage: 0,
          terminated: false,
        });

        expect(client.read(username)).to.equal('Hello');
        client.reply({
          attachments: [],
          text: 'Hi',
          user: username,
        });

        expect(client.read(username)).to.equal('How is my campaign doing?');
        client.reply({
          attachments: [Attachment.Cards, Attachment.Image],
          text: 'Here are the stats for this week:',
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.false;
      expect(testResult.errorMessage)
        .to.contain('Expected:\n\t\tHere are the stats for this week: <IMAGE> <CARDS>')
        .and.to.contain('Got:\n\t\tHere are the stats for this week: <CARDS> <IMAGE>');
    });
  });

  it('should handle branching conversations correctly', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/branching.yml'), defaultConfig);
    setTimeout(
      () => {
        const users = [...Array(3)].map((_, i) => {
          return Runner.getUsername({
            branchNumber: i,
            dialogue: new Dialogue(getDialoguePath('examples/branching.yml')),
            lastMessage: 0,
            terminated: false,
          });
        });

        users.forEach((user) => {
          expect(client.read(user)).to.equal('Hello');
        });

        expect(client.read(users[0])).to.equal('How are you?');
        users.slice(1).forEach((user) => {
          expect(client.read(user)).to.equal(undefined);
        });

        expect(client.read(users[0])).to.equal('Can you assist me?');
        client.reply({
          attachments: [],
          text: 'Ok',
          user: users[0],
        });
        // This ends user0
        
        client.reply({
          attachments: [],
          text: 'Howdy',
          user: users[1],
        });

        expect(client.read(users[1])).to.equal('Are you a cowboy?');

        client.reply({
          attachments: [],
          text: 'Yes',
          user: users[1],
        });
        expect(client.read(users[1])).to.equal('Really?');
        expect(client.read(users[1])).to.equal('Can you assist me?');
        client.reply({
          attachments: [],
          text: 'No',
          user: users[1],
        });
        // This ends user1
        
        client.reply({
          attachments: [],
          text: 'Howdy',
          user: users[2],
        });

        expect(client.read(users[2])).to.equal('Are you a cowboy?');

        client.reply({
          attachments: [],
          text: 'No',
          user: users[2],
        });
        expect(client.read(users[2])).to.equal('I didn\'t think so...');
        // This ends user2
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
    });
  });

  it('should short-circuit a failing branching conversation', () => {
    const client = new MockClient();
    const runner = new Runner(client, getDialoguePath('examples/branching.yml'), defaultConfig);
    setTimeout(
      () => {
        const users = [...Array(3)].map((_, i) => {
          return Runner.getUsername({
            branchNumber: i,
            dialogue: new Dialogue(getDialoguePath('examples/branching.yml')),
            lastMessage: 0,
            terminated: false,
          });
        });

        users.forEach((user) => {
          expect(client.read(user)).to.equal('Hello');
        });

        expect(client.read(users[0])).to.equal('How are you?');
        users.slice(1).forEach((user) => {
          expect(client.read(user)).to.equal(undefined);
        });

        expect(client.read(users[0])).to.equal('Can you assist me?');
        client.reply({
          attachments: [],
          text: 'Random text',
          user: users[0],
        });
        // user0 fails now
        client.reply({
          attachments: [],
          text: 'Howdy',
          user: users[1],
        });

        expect(client.read(users[1])).to.equal(undefined);
        // user1 shortcircuits
        
        client.reply({
          attachments: [],
          text: 'Howdy',
          user: users[2],
        });

        expect(client.read(users[2])).to.equal(undefined);
        // user2 shortcircuits
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.false;
      expect(testResult.errorMessage).to.contain('Random text');
      const turns = runner.dialogues[0].turns;

      // Only one runner made it there
      expect(turns[turns.length - 1].numRunnersEntered).to.equal(1);
    });
  });
  
  it('should execute the preamble', () => {
    const client = new MockClient();
    const runner = new Runner(
      client,
      getDialoguePath('examples/simple.yml'),
      Object.assign(
        {},
        defaultConfig,
        jsYaml.safeLoad(fs.readFileSync(getDialoguePath('autobot.yml'), 'utf8'))),
      );

    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('examples/simple.yml')),
          lastMessage: 0,
          terminated: false,
        });

        expect(client.read(username)).to.equal('Hi there');
        client.reply({
          attachments: [],
          text: 'Hey',
          user: username,
        });

        expect(client.read(username)).to.equal('Hello');
        client.reply({
          attachments: [],
          text: 'Hi',
          user: username,
        });
        client.reply({
          attachments: [],
          text: 'How are you?',
          user: username,
        });
        expect(client.read(username)).to.equal('I\'m good');
        expect(client.read(username)).to.equal('Yourself?');
        client.reply({
          attachments: [],
          text: 'I\'m good too',
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
    });
  });
  it('should match images and cards correctly', () => {
    const client = new MockClient();
    const runner = new Runner(
      client,
      getDialoguePath('images_and_cards.yml'),
      Object.assign(
        {},
        defaultConfig),
    );

    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('images_and_cards.yml')),
          lastMessage: 0,
          terminated: false,
        });

        expect(client.read(username)).to.equal('Show me some cats');
        client.reply({
          attachments: [Attachment.Image],
          text: null,
          user: username,
        });

        expect(client.read(username)).to.equal('What can you do?');
        client.reply({
          attachments: [Attachment.Cards],
          text: null,
          user: username,
        });
      },
      0);

    return runner.start().then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
    });
  });

  it('should wait for Wait lines', () => {
    const client = new MockClient();
    const runner = new Runner(
      client,
      getDialoguePath('wait_greeting.yml'),
      Object.assign(
        {},
        defaultConfig),
    );
    setTimeout(
      () => {
        const username = Runner.getUsername({
          branchNumber: 0,
          dialogue: new Dialogue(getDialoguePath('wait_greeting.yml')),
          lastMessage: 0,
          terminated: false,
        });

        expect(client.read(username)).to.equal('Hey there');
        client.reply({
          attachments: [],
          text: 'How are you?',
          user: username,
        });
        expect(client.read(username)).to.be.undefined;
        setTimeout(() => {
          expect(client.read(username)).to.undefined;
        }, 25);
        setTimeout(() => {
          expect(client.read(username)).to.equal('Hola');
          client.reply({
            attachments: [],
            text: 'Como estas?',
            user: username,
          });
        }, 35);
      },
      0);
    let startTime: number;
    return runner.start(() => {
      startTime = new Date().getTime();
    }).then((results) => {
      const testResult = results[0];
      expect(testResult.passed).to.be.true;
      const duration = (new Date().getTime()) - startTime;
      expect(duration).to.be.greaterThan(30).and.lessThan(40);
    });
  });
});
