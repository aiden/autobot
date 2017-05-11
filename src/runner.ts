import { Client } from './client';
import { Chat, ChatMessageType } from './chat';

export class ChatRunner {
  client: Client;
  chat: Chat;

  constructor(client: Client, chat: Chat) {
    this.client = client;
    this.chat = chat;

    this.client.listenToReplies((message) => {
      console.log(message);
    });
  }

  public start() {
    if (this.chat.isEmpty()) {
      console.log("ERROR: No chats to use, be sure to load with loadChat(chat: Chat)");
      return;
    }

    do {
      const message = this.chat.next();
      switch(message.type) {
        case ChatMessageType.Inbound:
          console.log(`Waiting for response with '${message.text}'`);
          break;
        case ChatMessageType.Outbound:
          this.client.send(message);
          break;
      }
    }
    while (!this.chat.isEmpty())
  }
}
