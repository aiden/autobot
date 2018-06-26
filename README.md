# Autobot: Bot Testing for Humans

[![CircleCI](https://circleci.com/gh/aiden/autobot.svg?style=svg&circle-token=b945b5b109d685a84d3b1d7794c8fd0b2a4f2e0a)](https://circleci.com/gh/aiden/autobot)

![autobot terminal image](http://i.imgur.com/3pbAl39.png)

Autobot is a multi-platform bot testing framework designed for humans. It is designed to have
concise, simple test files with strong flexibility and extensibility.

**Features:**

- Human readable/writable YAML dialogue files
- Supports any bot platform.
  - Comes with connectors for botframework
  - Implement a new connector with only two methods: `send` and `onReply`.
- Parallel execution of tests
- Test against multiple acceptable answers
- Wildcard matching (`<NUMBER>`, `<WORD>`, `<*>`)
- Support for testing rich attachments (`<IMAGE>`, `<CARDS>`, `<OTHER>`)
- Support for regular expressions (`<(st|nt|nd)>`)
- Show diffs on error
- Conversation branches
- Full unicode support
- Support for preambles and loading variables from locale/translation files

## Dialogue Format

Simple Chat file

```YAML
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

```YAML
Title: "Branching conversation"
Dialogue:
  - Human: Hello
  - Bot: Hi <WORD> // Wildcard match
  - Human: How are you?
  - Bot: I am <$emotion> // variable loaded from external file
  - Wait: 5000
  - Human: How's my campaign doing?
  - Bot: Your impressions are up 20% since last week! Would you like to see more?
  - 1:
      - Human: Sure
      - Bot: Here's a graph of your impressions in the last month.
      - Bot: <IMAGE>
    2:
      - Human: No
      - Bot: Anything else I can help with?
      - Human: What countries is this campaign live in?
      - 1:
          - Bot: Your campaign is live in <NUMBER> countries right now
          - Human: Show me ad spend by country
          - Bot: Here you go
          - Bot: <IMAGE>
        2:
          - Bot: Your campaign is only live in 1 country right now
          - Human: Which one?
          - Bot: <WORD>
```

Handling multiple attachments

```YAML
Title: Conversation with rich messages
Dialogue:
  - Bot: Hi
  - Human: Hello
  - Human: How are we doing this month?
  - Bot: "Month-to-date: <IMAGE> <CARDS>"
  - Human: Show me ad spend compared to last month
  - Bot: <IMAGE> <IMAGE>
```

## Special Tags

You can use the following tags anywhere in the bot’s response:

Tag | Meaning
--- | ---
`<*>` | Matches anything, including whitespaces
`<WORD>` | A single word without whitespaces
`<(REGEX)>` | Any regex expression, i.e. `<([0-9]{2})>`
`<$VARNAME>` | An expression from the locale/translation file

You can match one or more attachments **on their own, or at the end** of the
response:

Tag | Meaning
--- | ---
`<CARDS>` | Any card attachment
`<IMAGE>` | Any image attachment
`<OTHER>` | Any other type of attachment

## Install

To install from npm
```
$ npm install -g auto-bot
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
    -j --json                   Enable seeing the direct JSON responses from the client
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
