'use strict';
import { Client } from './clients/client_interface';
import { Dialogue } from './spec/dialogue';
import { Message, MessageType } from './spec/message';
import { Turn, TurnType } from './spec/turn';

export interface TestResult {
  passed: boolean;
  errorMessage: string;
}

export class ChatRunner {
  client: Client;
  dialogues: Map<string, Dialogue>;
  stacks: Map<string, Turn[]>;
  results: Map<string, TestResult>;

  constructor(client: Client, dialogues: Dialogue[]) {
    this.client = client;
    this.dialogues = new Map();
    dialogues.forEach((dialogue) => {
      this.dialogues.set(dialogue.title, dialogue);
    });
    this.stacks = new Map();
  }
  

  public start() {
    this.dialogues.forEach((dialogue) => {
      const stack: Turn[] = [];
      dialogue.turns.forEach((turn) => {
        stack.push(turn);
      });
      this.stacks.set(dialogue.title, stack);
      this.executeTurn(dialogue.title, null);
    });
  }

  private executeTurn(title: string, response: Message) {
    // It is only null on the first execution
    const stack = this.stacks.get(title);
    if (response !== null) {
      const expected = stack[stack.length - 1];
      if (!expected.matches(response.text)) {
        this.results.get(title).passed = false;
        this.results.get(title).errorMessage =
          `Expected:${JSON.stringify(expected.responses)}\nGot:${response.text}`;
      }
      stack.pop();
    }
    let next: Turn;
    while (stack.length > 0 &&
      (next = stack[stack.length - 1]).turnType === TurnType.Human) {
      this.client.send({
        messageType: MessageType.Text,
        user: `testuser-${title}`,
        text: next.queries[0],
      });
    }
  }
}
