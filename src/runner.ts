'use strict';
import { Client } from './clients/client_interface';
import { Dialogue } from './spec/dialogue';
import { Message, MessageType } from './spec/message';
import { Turn, TurnType } from './spec/turn';
import { Config } from './config';
import { DialogueInvalidError } from './spec/dialogue_invalid_error';

import * as fs from 'fs';
import * as glob from 'glob';

export interface TestResult {
  passed: boolean;
  errorMessage: string;
};

export interface TestMeta {
  branchNumber: number;
  dialogue: Dialogue;
  lastMessage: number;
};

export class Runner {
  private client: Client;
  private userMetadata = new Map<string, TestMeta>();
  private results = new Map<TestMeta, TestResult>();
  private stacks = new Map<TestMeta, Turn[]>();
  private onComplete: (results: TestResult[]) => void;
  private onReject: (e: Error) => void;
  private done = false;
  private config: Config;
  private preamble: Turn[];

  constructor(client: Client, dialoguePath: string, config: Config) {
    this.client = client;
    this.config = config;
    if (this.config.preamble) {
      this.preamble = this.config.preamble.map(turnData => new Turn(turnData));
    }

    const dialogueFileInfo = fs.lstatSync(dialoguePath);
    let dialogues: Dialogue[];
    if (dialogueFileInfo.isDirectory()) {
      dialogues = glob.sync('*.yml', {
        cwd: dialoguePath,
        matchBase: true,
      }).map(filepath => new Dialogue(filepath));
    } else if (dialogueFileInfo.isFile()) {
      dialogues = [new Dialogue(dialoguePath)];
    } else {
      throw new DialogueInvalidError(`${dialoguePath} does not exist`);
    }
    dialogues.forEach((dialogue) => {
      // Create a test user per dialogue branch
      const testMeta: TestMeta = {
        dialogue,
        branchNumber: 0,
        lastMessage: new Date().getTime(),
      };
      this.userMetadata.set(Runner.getUsername(testMeta), testMeta);
    });
    this.client.subscribeToReplies((message: Message) => {
      const test = this.userMetadata.get(message.user);
      test.lastMessage = new Date().getTime();
      if (this.results.has(test)) {
        // Short circuit as this test is already done
        return;
      }
      this.executeTurn(this.userMetadata.get(message.user), message);
    });
  }
  
  static getUsername(test: TestMeta): string {
    return `testuser-${test.dialogue.title}-${test.branchNumber}`;
  }

  public start(): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      this.onComplete = resolve;
      this.onReject = reject;
      this.userMetadata.forEach((test, username) => {
        const stack: Turn[] = [];
        if (this.preamble) {
          this.preamble.forEach((turn) => {
            stack.push(turn);
          });
        }
        test.dialogue.turns.forEach((turn) => {
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
  }

  private executeTurn(test: TestMeta, response: Message) {
    try {
      // It is only null on the first execution
      const stack = this.stacks.get(test);
      if (response !== null) {
        const expected = stack[0];
        if (!expected.matches(response.text)) {
          this.results.set(test, {
            passed: false,
            errorMessage: `Expected:${JSON.stringify(expected.responses)}\nGot:${response.text}`,
          });
          this.checkIfComplete();
          return;
        }
        stack.shift();
      }
      let next: Turn;
      while (stack.length > 0 &&
          ((next = stack[0]).turnType === TurnType.Human ||
          (next.turnType === TurnType.Branch && next.humanBranches.length > 0))) {
        const turn = next.turnType === TurnType.Human ? next : next.humanBranches[0][0];
        this.client.send({
          messageType: MessageType.Text,
          user: Runner.getUsername(test),
          text: turn.queries[0],
        });
        stack.shift();
      }
      if (stack.length === 0) {
        this.results.set(test, {
          passed: true,
          errorMessage: null,
        });
        this.checkIfComplete();
      }
    } catch (e) {
      this.onReject(e);
    }
  }

  private checkIfComplete = () => {
    if (this.done) {
      // Previously called
      return;
    }

    const now = new Date().getTime();

    this.userMetadata.forEach((test) => {
      if (!this.results.has(test) && (now - test.lastMessage > this.config.timeout)) {
        const stack = this.stacks.get(test);
        this.results.set(test, {
          passed: false,
          errorMessage: `timeout waiting on ${stack[stack.length - 1].toString()}`,
        });
      }
    });

    if (this.results.size === this.userMetadata.size) {
      this.done = true;
      this.onComplete(Array.from(this.results.values()));
    }
  }
}
