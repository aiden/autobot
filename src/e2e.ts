import { DirectLine, ConnectionStatus, Activity, Message } from 'botframework-directlinejs';

// HAX: This is necessary for Node.js
// https://github.com/Microsoft/BotFramework-DirectLineJS/issues/20
global.XMLHttpRequest = require("xhr2");

const secret = process.env.DIRECT_LINE_SECRET;

const id = 'e2e';
const name = 'e2e';

console.log('CLIENT: Initialising DirectLine client');
const directLine = new DirectLine({ secret });

console.log('CLIENT: Subscribing to messages');
directLine.activity$
.filter(activity => activity.type === 'message' && activity.from.id !== id)
.subscribe(message => {
  const msg = message as Message;
  console.log(`RECEIVED: '${msg.text}'`);
});

function sendMessage(text: string) {
  const activity : Activity = {
    from: { id, name },
    type: 'message',
    text: text,
  };
  console.log(`POSTING: '${activity.text}'`);
  directLine
  .postActivity(activity)
  .subscribe(
    id => {},
    error => console.log("ERROR: posting activity: ", error)
  );
}

function startConversation() {
  sendMessage('Hi');
}

function resetConversation() {
  sendMessage('__reset');
}

// Monitor connection status
directLine.connectionStatus$
.subscribe(connectionStatus => {
    switch(connectionStatus) {
        case ConnectionStatus.Uninitialized:
          // the status when the DirectLine object is first created/constructed
          console.log('CONNECTION: Uninitialized');
          break;
        case ConnectionStatus.Connecting:
          // currently trying to connect to the conversation
          console.log('CONNECTION: Connecting');
          break;
        case ConnectionStatus.Online:
          // successfully connected to the converstaion. Connection is healthy so far as we know.
          console.log('CONNECTION: Online');
          startConversation();
          break;
        case ConnectionStatus.ExpiredToken:
          // last operation errored out with an expired token. Your app should supply a new one.
          console.log('CONNECTION: ExpiredToken');
          break;
        case ConnectionStatus.FailedToConnect:
          // the initial attempt to connect to the conversation failed. No recovery possible.
          console.log('CONNECTION: Failed');
          break;
        case ConnectionStatus.Ended:
          // the bot ended the conversation
          console.log('CONNECTION: Ended');
          break;
    }
});
