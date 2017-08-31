import { Message } from '../spec/message';

export interface Client {
  send(text: string);
  subscribeToReplies(callback: (message: Message) => void);
}
