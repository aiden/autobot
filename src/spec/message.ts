export enum MessageType {
  Text,
  Image,
  Card,
}

export interface Message {
  messageTypes: MessageType[];
  text: string;
  user: string;
}
