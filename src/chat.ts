'use strict';

export enum ChatMessageType {
    Inbound = 1,
    Outbound
}

export interface ChatMessage {
  text: string; // TODO: Could be more than one
  type: ChatMessageType;
}

export class Chat {
  messages: Array<ChatMessage> = [];

  constructor(chat: [any]) {
    this.messages = this.parse(chat);
  }

  /**
   * Parse JSON chat into inbound and outbound
   */
  private parse(json: [any]) : Array<ChatMessage> {
    const messages: Array<ChatMessage> = [];
    json.forEach( v => {
      const text = v.text;
      const type = (v.type === 'inbound') ? ChatMessageType.Inbound : ChatMessageType.Outbound;
      messages.push({ text, type });
    });
    return messages
  }

  /**
   * Return next chat message in queue
   */
  public next() : ChatMessage {
    return this.messages.shift();
  }

  public isEmpty() : boolean {
    return (this.messages.length === 0);
  }
}

export default Chat;
