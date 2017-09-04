export enum ClientType {
  BotFramework = 'botframework',
}

export interface Config {
  client: ClientType;
  directLineSecret: string;
  localeFiles: string[];
  luisLocale: boolean;
  stripNonAlpha: boolean;
}
