# e2e-tests

[![CircleCI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/bot-e2e)

## Install

```
$ npm install --save
```

## Build

```
$ npm run build
```

## Running

```
$ env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js
```

The `DIRECT_LINE_SECRET` can be found in the Bot's setup page [here](https://dev.botframework.com/bots).
