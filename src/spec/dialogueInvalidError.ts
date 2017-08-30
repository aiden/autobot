export class DialogueInvalidError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, Error.prototype);
  }
}
