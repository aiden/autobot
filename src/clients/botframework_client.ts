'use strict';

import {
  DirectLine,
  ConnectionStatus,
  Activity,
  Message as BotMessage } from 'botframework-directlinejs';
import { Client } from './client_interface';
import { Message, MessageType } from '../spec/message';

// // HAX: This is necessary for Node.js
// // https://github.com/Microsoft/BotFramework-DirectLineJS/issues/20
const globalAny:any = global;
globalAny.XMLHttpRequest = require('xhr2');

export class BotFrameworkClient implements Client {
  private conectionStatus: string;
  private directLine: DirectLine;
  private convoIdToUser = new Map<string, string>();

  constructor(directLineSecret: string) {
    this.directLine = new DirectLine({ secret: directLineSecret });
    // this.subscribeToConnectionStatus();
  }

  public send(message: Message) {
    const activity : Activity = {
      from: { id: message.user, name: message.user },
      type: 'message',
      text: message.text,
    };
    console.log(`POSTING: ${activity.text}`);
    this.directLine
    .postActivity(activity)
    .subscribe(
      id => null,
      error => console.log('ERROR: posting activity: ', error),
    );
  }

  public subscribeToReplies(callback: (message: Message) => void) {
    this.directLine.activity$
    .filter(activity => activity.type === 'message')
    .subscribe((dlMessage: BotMessage) => {
      console.log(`RECEIVED: ${JSON.stringify(dlMessage)}`);
      if (dlMessage.from.id.indexOf('testuser') !== -1) {
        // Outbound message
        this.convoIdToUser.set(dlMessage.conversation.id, dlMessage.from.name);
      } else {
        // inbound message
        const user = this.convoIdToUser.get(dlMessage.conversation.id);
        if (user === undefined) {
          console.log('Unrecognized conversation on directline', dlMessage);
          return;
        }
        const message: Message = {
          user,
          messageType: MessageType.Text,
          text: dlMessage.text,
        };
        callback(message);
      }
    });
  }

  public close() {
    this.directLine.end();
  }

  // Only for debugging purposes
  // private subscribeToConnectionStatus() {
  //   // Monitor connection status
  //   console.log('HEY')
  //   this.directLine.connectionStatus$
  //   .subscribe(connectionStatus => {
  //       console.log('GOT CONNECTION STATUS', connectionStatus);
  //       switch(connectionStatus) {
  //           case ConnectionStatus.Uninitialized:
  //             // the status when the DirectLine object is first created/constructed
  //             console.log('CONNECTION: Uninitialized');
  //             break;
  //           case ConnectionStatus.Connecting:
  //             // currently trying to connect to the conversation
  //             console.log('CONNECTION: Connecting');
  //             break;
  //           case ConnectionStatus.Online:
  //             // successfully connected to the converstaion. Connection is healthy so far as we know.
  //             console.log('CONNECTION: Online');
  //             break;
  //           case ConnectionStatus.ExpiredToken:
  //             // last operation errored out with an expired token. Your app should supply a new one.
  //             console.log('CONNECTION: ExpiredToken');
  //             break;
  //           case ConnectionStatus.FailedToConnect:
  //             // the initial attempt to connect to the conversation failed. No recovery possible.
  //             console.log('CONNECTION: Failed');
  //             break;
  //           case ConnectionStatus.Ended:
  //             // the bot ended the conversation
  //             console.log('CONNECTION: Ended');
  //             break;
  //       }
  //   });
  // }
}

export default Client;
