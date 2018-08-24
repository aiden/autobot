/*
 * An enumeration of the possible attachment types.
 *
 * `Other` is a catch-all for any attachment type that is not (yet) explicitly
 * supported.  The enum values are used to build the regexes for the attachment
 * wildcards, e.g. <IMAGE> is derived from 'IMAGE'.
 */
export enum Attachment {
  Image = 'IMAGE',
  Cards = 'CARDS',
  Other = 'OTHER',
}

export interface Message {
  attachments: Attachment[];
  text: string;
  user: string;
}
