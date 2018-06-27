'use strict';
import { Client } from './clients/client_interface';
import { Dialogue } from './spec/dialogue';
import { Message, Attachment } from './spec/message';
import { Response } from './spec/response';
import { Turn, TurnType } from './spec/turn';
import { Config } from './config';
import { DialogueInvalidError } from './spec/dialogue_invalid_error';
import { Translator } from './translator';
import { createBar, tickProgress, failProgress } from './pretty_printer';

import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as program from 'commander';
import * as chalk from 'chalk';
import * as ProgressBar from 'node-progress-bars';

export interface TestResult {
  dialogue: Dialogue;
  passed: boolean;
  errorMessage: string;
}

export interface TestMeta {
  branchNumber: number;
  dialogue: Dialogue;
  lastMessage: number;
  terminated: boolean;
}

export class Runner {
  private client: Client;
  dialogues: Dialogue[];
  userMetadata = new Map<string, TestMeta>();
  progressBar: ProgressBar;
  minWidth: number = 0; // for the progress bar
  private numAlive = new Map<Dialogue, number>();
  private results = new Map<Dialogue, TestResult>();
  private stacks = new Map<TestMeta, Turn[]>();
  private onComplete: (results: TestResult[]) => void;
  private onReject: (e: Error) => void;
  private done = false;
  private config: Config;
  private timing: number;
  private ignore: Response[];

  constructor(client: Client, dialoguePath: string, config: Config) {
    this.client = client;
    this.config = config;
    this.ignore = config.ignore.reduce((allIgnored, ignoreLine) => {
      Translator.translate(ignoreLine).forEach((responseData) => {
        allIgnored.push(new Response(responseData));
      });
      return allIgnored;
    }, []);

    const dialogueFileInfo = fs.lstatSync(dialoguePath);
    if (dialogueFileInfo.isDirectory()) {
      this.dialogues = glob.sync('**/*.yml', {
        cwd: dialoguePath,
      }).map(x => path.join(dialoguePath, x))
        .map((filepath) =>  {
          try {
            return new Dialogue(filepath, this.config.preamble);
          } catch (e) {
            if (e instanceof DialogueInvalidError) {
              return null;
            } else {
              throw e;
            }
          }
        })
        .filter(x => x);

      if (this.dialogues.length === 0) {
        throw new Error('No test files found on path');
      }
    } else if (dialogueFileInfo.isFile()) {
      this.dialogues = [new Dialogue(dialoguePath, this.config.preamble)];
    } else {
      throw new DialogueInvalidError(`${dialoguePath} does not exist`);
    }
    this.dialogues.forEach((dialogue) => {
      // Create a test user per dialogue branch
      const numRunnersRequired = dialogue.turns[0].numRunnersRequired;
      this.numAlive.set(dialogue, numRunnersRequired);
      [...Array(numRunnersRequired)].forEach((_, i) => {
        const testMeta: TestMeta = {
          dialogue,
          branchNumber: i,
          lastMessage: new Date().getTime(),
          terminated: false,
        };
        this.userMetadata.set(Runner.getUsername(testMeta), testMeta);
      });
    });
    this.client.onReply((message: Message) => {
      const test = this.userMetadata.get(message.user);
      test.lastMessage = new Date().getTime();
      if (this.results.has(test.dialogue)) {
        // Short circuit as this test is already done
        return;
      }
      this.executeTurn(this.userMetadata.get(message.user), message);
    });
  }
  
  static getUsername(test: TestMeta): string {
    return `testuser-${test.dialogue.title}-${test.branchNumber}`;
  }
  
  public createProgressBar() {
    if (!program.verbose) {
      this.progressBar = createBar(this.dialogues[0], this.minWidth);
    }
  }

  public start(onStart?: () => void): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      this.onComplete = resolve;
      this.onReject = reject;
      this.client.onReady().then(() => {
        if (onStart) {
          onStart();
        }
        this.userMetadata.forEach((test, username) => {
          const stack: Turn[] = [];
          test.dialogue.turns.slice().reverse().forEach((turn) => {
            stack.push(turn);
          });
          this.stacks.set(test, stack);
          this.executeTurn(test, null);
        });
        const intervalCheckIfDone = () => {
          this.checkIfComplete();
          if (!this.done) {
            setTimeout(intervalCheckIfDone, this.config.timeout / 2);
          }
        };
        setTimeout(intervalCheckIfDone, this.config.timeout / 2);
      });
    }).then((v) => {
      this.client.close();
      return <TestResult[]>v;
    });
  }

  private executeTurn(test: TestMeta, response: Message) {
    try {
      if (test.terminated) {
        return;
      }
      // It is only null on the first execution
      const stack = this.stacks.get(test);
      if (response !== null) {
        if (program.verbose) {
          const timing = (new Date().getTime() - this.timing) || 0;
          if (response.text) {
            const texts = response.text.split('\n');
            const truncatedText = texts.length > 5
              ? texts.slice(0, 5).join('\n') + '...' : response.text;
            console.log(chalk.blue('\tBOT', response.user, ':',
              truncatedText, ...response.attachments.map(a => `<${a}>`)),
              chalk.magenta(` (${timing}ms)`));
          } else {
            console.log(chalk.blue('\tBOT:', response.user, ':', JSON.stringify(response)),
              chalk.magenta(` (${timing}ms)`));
          }
        }
        if (this.ignore.find(i => i.matches(response))) {
          return;
        }
        // console.log('GOT RESPONSE: ', response);
        const nextBot = stack.pop();
        if (nextBot.numRunnersEntered === nextBot.numRunnersRequired) {
          // Kill this instance if exhausted
          this.terminateInstance(test);
          return;
        }
        nextBot.numRunnersEntered += 1;
        const match = nextBot.matches(response);
        if (!match) {
          if (this.progressBar) {
            failProgress(this.progressBar, this.dialogues[0], this.minWidth);
          }
          let expected;
          const matchArray = nextBot.toMatchArray();
          if (matchArray.length > 1) {
            expected = matchArray.map(str => `\t\t- ${str}`).join('\n');
          } else {
            expected = `\t\t${matchArray[0]}`;
          }

          let actual = response.text ? [response.text] : [];
          actual = actual.concat(response.attachments.map(a => `<${a}>`));

          this.results.set(test.dialogue, {
            dialogue: test.dialogue,
            passed: false,
            errorMessage: chalk.red(`\t${Runner.getUsername(test)}\n`) +
                          `\tExpected:\n${expected}` +
                          `\n\tGot:\n\t\t${actual.join(' ') || null}`,
          });
          this.terminateInstance(test);
          return;
        }
        if (!program.verbose && this.progressBar) {
          // So this will not be accurate if you expect multiple entries back
          tickProgress(this.progressBar, this.dialogues[0], this.minWidth);
        }
        if (match instanceof Array) {
          // Means it matched an exhausted branch, terminate this runner
          if (match.length === 0) {
            this.terminateInstance(test);
            return;
          }

          // Means we have entered a bot branch
          match[0].numRunnersEntered += 1;
          match.slice(1).reverse().forEach((turn) => {
            stack.push(turn);
          });
        }
      }

      let next: Turn;
      let nextBranch;
      while (stack.length > 0 &&
          ((next = stack[stack.length - 1]).turnType === TurnType.Human ||
          (next.turnType === TurnType.Branch &&
            (nextBranch = next.nextHuman()) !== undefined) ||
          (next.turnType === TurnType.Wait))) {

        stack.pop();
        // Kill if this turn is exhausted
        if (next.numRunnersEntered === next.numRunnersRequired) {
          this.terminateInstance(test);
          return;
        }

        next.numRunnersEntered += 1;

        if (next.turnType === TurnType.Wait) {
          setTimeout(
            () => {
              this.executeTurn(test, null);
            },
            next.waitTime);
          return;
        }

        if (next.turnType === TurnType.Branch) {
          next = nextBranch[0];
          next.numRunnersEntered += 1;
          nextBranch.slice(1).reverse().forEach(turn => stack.push(turn));
        }


        const user = Runner.getUsername(test);
        if (program.verbose) {
          console.log(chalk.yellow('\tHUMAN', user, ':', next.query));
          this.timing = new Date().getTime();
        }
        this.client.send({
          user,
          attachments: [],
          text: next.query,
        });
      }

      // This applies to both senders/receivers
      if (stack.length === 0) {
        this.terminateInstance(test);
      }
    } catch (e) {
      this.onReject(e);
    }
  }

  private terminateInstance(test: TestMeta) {
    test.terminated = true;
    this.numAlive.set(test.dialogue, this.numAlive.get(test.dialogue) - 1);
    this.checkIfComplete(test);
  }

  /* Checks if we are done. Optionally takes a test parameter
   * so that the checks only are performed on this one for
   * optimization reasons
   * */
  private checkIfComplete = (test?: TestMeta) => {
    if (this.done) {
      // Previously called
      return;
    }

    const now = new Date().getTime();

    const dialogues = test ? [test.dialogue] : this.dialogues;

    // see if we can cleanup any tests
    dialogues
      .filter(dialogue => !this.results.has(dialogue))
      .forEach((dialogue) => {
        const numAlive = this.numAlive.get(dialogue);
        if (numAlive === 0) {
          this.results.set(dialogue, {
            dialogue,
            passed: true,
            errorMessage: null,
          });
        }
      });
    
    const tests = test ? [test] : Array.from(this.userMetadata.values());

    tests.forEach((test) => {
      if (!this.results.has(test.dialogue) && (now - test.lastMessage > this.config.timeout)) {
        const stack = this.stacks.get(test);
        this.results.set(test.dialogue, {
          dialogue: test.dialogue,
          passed: false,
          errorMessage: 'timeout waiting on:\n' +
              chalk.red(`\t${Runner.getUsername(test)}\n`) +
              (stack[stack.length - 1].turnType === TurnType.Human ?
              (
                `Sending: ${stack[stack.length - 1].query}`
              ) : (
                stack[stack.length - 1]
                .toMatchArray()
                .map(str => `\t-${str}\n`)
              )),
        });
      }
    });

    if (this.results.size === this.dialogues.length) {
      this.done = true;
      this.onComplete(Array.from(this.results.values()));
    }
  }
}
