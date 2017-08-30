# bot-e2e

[![CircleCI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/bot-e2e)

bot-e2e is a bot testing framework designed for humans. We built this with the following principles in mind:

- Tests should serve as clear documentation on what the bot does
- Reading, writing and running tests should be easy and not require technical expertise
- Testing should be as flexible as the bot itself
- Tests should be deterministic

The core features of this framework are:

- Connector with Bot Framework, and a single simple interface to implement to add connectors to new bots.
- Human readable/writable YAML dialogue files
- Parallel execution of tests
- Wildcard matching (<NUMBER>, <WORD>, <\*>)
- Support for regular expressions (<(st|nt|nd)>)
- Multiple requests/responses
- Show diffs on error
- Conversation branches

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
Title: Greetings
Dialogue:
	- Human: Hey bot, how are you?
  - Bot:
    - Hi <*>, I'm great thanks
    - Feeling odd, might be some bugs
  - Human: What's the date today?
  - Bot: The date today is the <NUMBER><(st|nd|th)> <WORD> <NUMBER>
  - Human: Can you show me a picture of a cat?
  - Branch:
  	1:
    	- Bot: There are no pictures sorry
    2:
    	- Bot: Here you go
      - Bot: <IMAGE>
      - Bot:
      	- Would you like to see more?
        - Want another one?
      - Branch:
      		1:
      			Human: Yes please
          2:
          	Human: No thanks
```

### Specifying a chat file or directory

* To run a single chat file, specify the file e.g. `./chats/onboarding.json` to run 1 chat file.
* To run multiple files, specify a directory e.g. `./chats`

```
$ env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js --chat-path ./chats/onboarding.json

OR

$ env DIRECT_LINE_SECRET=<direct-line-secret>node built/e2e.js --chat-path ./chats
```

Alternatively, use `-c`.

### Direct Line Secret

The `DIRECT_LINE_SECRET` can be found in the Bot's setup page [here](https://dev.botframework.com/bots).
Each bot has a unique secret that needs to be setup explicitly.
