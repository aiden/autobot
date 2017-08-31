export enum MessageType {
  Text,
  Image,
}

export class Message {
  messageType: MessageType;
  text: string;
}
