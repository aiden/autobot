import { Client } from './client_interface';
import { Message } from '../spec/message';

export class MockClient {
  cb: (message: Message) => void;

  send(text: string) {
    // stub function
  }

  subscribeToReplies(callback: (message: Message) => void) {
    this.cb = callback;
  }

  reply(message: Message) {
    if (this.cb) {
      this.cb(message);
    } else {
      throw new Error('subscribeToReplies has not been called yet');
    }
  }

}
