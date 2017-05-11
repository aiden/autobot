# bot-e2e

[![CircleCI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/bot-e2e)

Black-box test your Microsoft Bot Framework bot by using the Direct Line API client to send and receive messages.

## Install

```
$ npm install --save
```

## Build

```
$ npm run build
```

## Usage

### Chat file format

```
[
  {
    "in": "Hi!",
    "out": "Hey, how are you!"
  },
  {
    "in": "Hi!",
    "out": [
      "Hey, how are you!",
      "What's up!",
      "Hey!"
    ]
  }
]
```

### Specifying a chat file

* To run a single chat file, specify the file e.g. `./chats/onboarding.json` to run 1 chat file.
* To run multiple files, specify a directory e.g. `./chats`

```
$ env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js --chat-file ./chats/onboarding.json

OR

$ env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js --chat-file ./chats
```

Alternatively, use `-c`.

### Direct Line Secret

The `DIRECT_LINE_SECRET` can be found in the Bot's setup page [here](https://dev.botframework.com/bots).
Each bot has a unique secret that needs to be setup explicitly.
