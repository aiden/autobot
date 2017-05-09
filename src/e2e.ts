import { DirectLine } from 'botframework-directlinejs';

const secret = process.env.DIRECT_LINE_SECRET;
const id = 'e2e';
const name = 'e2e';

console.log('Initialising DirectLine client');
const directLine = new DirectLine({ secret });

console.log('Posting message');
directLine.postActivity({
  from: { id, name },
  type: 'message',
  text: 'Hi',
}).subscribe(
  id => console.log("Posted activity, assigned ID ", id),
  error => console.log("Error posting activity", error)
);

console.log('Subscribing to message');
directLine.activity$
.subscribe(
  activity => console.log("Received activity ", activity)
);
