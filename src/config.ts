export enum ClientType {
  BotFramework = 'botframework',
  Mock = 'mock',
}

export interface Config {
  client: ClientType;
  directLineSecret: string;
  localeFiles: string[];
  luisLocale: boolean;
  timeout: number;
  preamble: any;
}

export const defaultConfig: Config = {
  client: ClientType.Mock,
  directLineSecret: null,
  localeFiles: null,
  luisLocale: false,
  timeout: 10000,
  preamble: null,
};
