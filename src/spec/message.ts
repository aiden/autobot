export enum MessageType {
  Text,
  Image,
}

export interface Message {
  messageType: MessageType;
  text: string;
}
