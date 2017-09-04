import { Client } from './client_interface';
import { Message } from '../spec/message';

export class MockClient implements Client {
  private received = new Map<string, string[]>();
  private cb: (message: Message) => void;

  send(message: Message) {
    let messageQueue = this.received.get(message.user);
    if (messageQueue === undefined) {
      messageQueue = [];
      this.received.set(message.user, messageQueue);
    }
    messageQueue.push(message.text);
  }

  subscribeToReplies(callback: (message: Message) => void) {
    this.cb = callback;
  }

  close() {
  }

  onReady() {
    return new Promise<void>((resolve) => {
      resolve();
    });
  }

  read(user: string): string {
    const messageQueue = this.received.get(user);
    if (messageQueue === undefined) {
      return null;
    } else {
      return messageQueue.shift();
    }
  }

  reply(message: Message) {
    if (this.cb) {
      this.cb(message);
    } else {
      throw new Error('subscribeToReplies has not been called yet');
    }
  }

}
