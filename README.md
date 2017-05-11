[![Circle CI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=undefined)](https://circleci.com/gh/aiden/bot-e2e)
# e2e-tests

## Build

```
npm run build
```

## Running

```
env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js
```

The `DIRECT_LINE_SECRET` can be found in the Bot's setup page [here](https://dev.botframework.com/bots).
