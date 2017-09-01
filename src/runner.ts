import { Client } from './clients/client_interface';
import { Dialogue } from './spec/dialogue';

export class ChatRunner {
  client: Client;
  dialogue: Dialogue;

  constructor(client: Client, dialogue: Dialogue) {
    this.client = client;
    this.dialogue = dialogue;
  }

  public start() {
  }
}
