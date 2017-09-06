export enum MessageType {
  Text,
  Image,
  Card,
}

export interface Message {
  messageType: MessageType;
  text: string;
  user: string;
}
