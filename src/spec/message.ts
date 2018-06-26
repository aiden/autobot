export enum Attachment {
  Text = 'Text',
  Image = 'Image',
  Card = 'Card',
}

export interface Message {
  attachments: Attachment[];
  text: string;
  user: string;
}
