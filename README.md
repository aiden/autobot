# bot-e2e

[![CircleCI](https://circleci.com/gh/aiden/bot-e2e.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/bot-e2e)

![autobot terminal image](http://i.imgur.com/3pbAl39.png)

autobot is a multi-platform bot testing framework designed for humans.

**Features:**

- Multi-platform support. Comes with botframework, or implement a new connector with only two methods: `send` and `onReceive`.
- Human readable/writable YAML dialogue files
- Parallel execution of tests
- Test against multiple acceptable answers
- Wildcard matching (`<NUMBER>`, `<WORD>`, ``<\*>``)
- Support for regular expressions (`<(st|nt|nd)>`)
- Show diffs on error
- Conversation branches
- Full unicode support
- Support for preambles, loading variables from locale/translation files

## Dialogue Format

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

## Config File Format

The config file `autobot.yml` takes the following fields:

```
client: botframework
directLineSecret: <SECRET IF USING BOT FRAMEWORK>
localeFiles:
  - locale/en/locale.json
timeout: 20000 (timeout in ms)
preamble:
  - Human: Hey there
  - Bot: <*>
  - Human: Hi
```

## Extending to a new platforms

autobot is designed to be super simple to integrate a new platform. You only need to implement the `Client` interface
found in `src/clients/client_interface.ts`, in either javascript or typescript. 

There are only 2 mandatory methods, and 2 optional methods to implement:

```
export class MyNewClient extends Client {
  send(message) {
    // Mandatory
  }

  onReply(callback) {
    // Mandatory
  }

  onReady(callback) {
    // Optional
  }

  close() {
    // Optional
  }
}
```
