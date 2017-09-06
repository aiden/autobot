# bot-e2e

[![CircleCI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/bot-e2e)

bot-e2e is a bot testing framework designed for humans. We built this with the following principles in mind:

- Tests should serve as clear documentation on what the bot does
- Reading, writing and running tests should be easy and not require technical expertise
- Testing should be as flexible as the bot itself
- Tests should be deterministic

The core features of this framework are:

- Bot platform agnostic. Existing connector with Bot Framework, and tiny interface to add new ones (only `send(message)` and `onReceive`)
- Human readable/writable YAML dialogue files
- Parallel execution of tests
- Test against multiple acceptable answers
- Wildcard matching (<NUMBER>, <WORD>, <\*>)
- Support for regular expressions (<(st|nt|nd)>)
- Show diffs on error
- Conversation branches
- Full unicode support
- Support for preambles, loading variables from locale/translation files

## Usage

### Dialogue file format

Simple Chat file

```
Title: "Simple Greetings"
Dialogue:
  - Human: Hello
  - Bot:
    - Hi
    - Hello
  - Bot: How are you?
  - Human: I'm good
  - Human: Yourself?
  - Bot: I'm good too!
```

Complex chat file with variables, branching, and wildcards

```
Title: "branching"
Dialogue:
  - Human: Hello
  - Bot: Hi <WORD> // Wildcard match
  - Human: How are you?
  - Bot: I am <$emotion> // variable loaded from external file
  - Human: Show me a picture of a cat
  - 1:
      - Bot: Sure
      - Bot: <IMAGE>
      - Human: Do you like cats?
      - 1:
          - Bot: No
          - Human: Really?
        2:
          - Bot: Yes
          - Human: Me too!
    2:
      - Bot: Sorry, no cats here
  - Human: Can you assist me?
  - 1:
      Bot: Ok
    2:
      Bot: No
```


## Install

To install from npm
```
$ sudo npm install -g autobot
```

To install from source
```
$ npm run build
$ npm install -g ./
```

## Usage

You must have a config file `autobot.yml` in the current directory or a parent directory.

```
$ autobot

  Usage: autobot [options] <chatPath>

  autobot is an multi-platform bot testing framework. It requires an autobot.yml config file to be in the working directory or a parent.


  Options:

    -V, --version               output the version number
    -v --verbose                Enable full logging including bot queries and responses
    -c, --config <autobot.yml>  autobot.yml config file to use (default current directory and parents)
    -h, --help                  output usage information
```

To run a specific test:

```
$ autobot ./path/to/test.yml
```

To run all tests recursively in a directory:

```
$ autobot ./path/to/directory
```

To see the dialogue in the console, add the `-v` flag

```
$ autobot -v ./path/to/test.yml

	Discovered 1 tests (1 branches)

  HUMAN testuser-simple-0: Hello
  BOT testuser-simple-0: Hi!
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
