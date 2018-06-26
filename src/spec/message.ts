/*
 * An enumeration of the possible attachment types.
 *
 * `Other` is a catch-all for any attachment type that is not (yet) explicitly
 * supported.
 */
export enum Attachment {
  Image = 'Image',
  Cards = 'Cards',
  Other = 'Other',
}

export interface Message {
  attachments: Attachment[];
  text: string;
  user: string;
}
