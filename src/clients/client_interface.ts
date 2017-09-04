import { Message } from '../spec/message';

export interface Client {
  send(message: Message);
  subscribeToReplies(callback: (message: Message) => void);
}
