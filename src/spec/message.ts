export enum MessageType {
  Text = 'Text',
  Image = 'Image',
  Card = 'Card',
}

export interface Message {
  messageTypes: MessageType[];
  text: string;
  user: string;
}
