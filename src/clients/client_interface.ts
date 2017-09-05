import { Message } from '../spec/message';

export class Client {
  send(message: Message) {
    throw new Error('Must implement send(message) on client');
  }
  onReply(callback: (message: Message) => void) {
    throw new Error('Must implement subscribeToREplies(callback) on client');
  }

  onReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  close() {
    return;
  }
}
