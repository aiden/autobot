import { DialogueInvalidError } from './dialogue_invalid_error';
import { Response } from './response';
import { Translator } from '../translator';

export enum TurnType {
  Human,
  Bot,
  Branch,
}

export class Turn {
  turnType: TurnType;
  responses: Response[];
  query: string;
  humanBranches: Turn[][] = [];
  botBranches: Turn[][] = [];
  numRunnersRequired: number;
  numRunnersEntered = 0;

  constructor(turnData: any, next?: Turn) {
    let data;

    // First extract the data and the type
    if (turnData.Human) {
      this.turnType = TurnType.Human;
      data = turnData.Human;
    } else if (turnData.Bot) {
      this.turnType = TurnType.Bot;
      data = turnData.Bot;
    } else if (turnData.Branch) {
      this.turnType = TurnType.Branch;
      data = turnData.Branch;
    } else {
      throw new DialogueInvalidError(
        `No Human, Bot, or Branch key on ${JSON.stringify(turnData)}`);
    }

    // Force data into array for Human and Bot
    if (this.turnType === TurnType.Human || this.turnType === TurnType.Bot) {
      if (typeof data === 'string') {
        data = [data];
      }
      // Expand translations
      data = data.reduce(
        (translatedData, phrase) => {
          return translatedData.concat(Translator.translate(phrase));
        },
        []);
    }

    // Transform Human multi input into a branch
    if (this.turnType === TurnType.Human && data.length > 1) {
      data = data.reduce(
        (branchData, response, i) => {
          branchData[i + 1] = [{ Human: response }];
          return branchData;
        },
        {},
      );
      this.turnType = TurnType.Branch;
    }

    // Set the appropriate fields
    switch (this.turnType) {
      case TurnType.Human:
        this.query = data[0];
        break;
      case TurnType.Bot:
        this.responses = data.map(responseData => new Response(responseData));
        break;
      case TurnType.Branch:
        const numBranches = Object.keys(data).length;
        const branches: Turn[][] = [...Array(numBranches)]
          .map((_, i) => data[i + 1])
          .filter(x => x)
          .map(branch => Turn.createTurns(branch));

        if (branches.length !== numBranches) {
          throw new DialogueInvalidError(
            `Branch numbers do not go from 1 to ${numBranches}: ${JSON.stringify(data)}`);
        }
        this.humanBranches = branches.filter(branch => branch[0].turnType === TurnType.Human);
        this.botBranches = branches.filter(branch => branch[0].turnType === TurnType.Bot);
        break;
    }

    this.numRunnersRequired = Math.max(
      this.humanBranches.concat(this.botBranches)
        .map(branch => branch[0].numRunnersRequired)
        .reduce(
          (totalRequired, numRequired) => {
            return totalRequired + numRequired;
          },
          0),
      next ? next.numRunnersRequired : 1,
    );
  }

  static createTurns(turnsData: any): Turn[] {
    const turnsArrayData = (turnsData instanceof Array) ? turnsData : [turnsData];
    return turnsArrayData
      .reverse()
      .reduce(
        (turns, turnData) => {
          turns.push(new Turn(turnData, turns[turns.length - 1]));
          return turns;
        },
        [])
      .reverse();
  }
  
  /** Tests if this phrase matches this turn.
   *  Returns:
   *    - true if it is a simple text match
   *    - Turn[] when it matches a branch with runner capacity
   *      (if numRunners has not been exceeded)
   *    - [] when it matches a branch but there is no capacity
   *    - false if there is no match **/
  matches(text: string): Turn[] | boolean {
    if (this.turnType === TurnType.Bot) {
      return this.responses.some((response) => {
        return response.matches(text);
      });
    } else if (this.turnType === TurnType.Branch) {
      const matchingBranches = this.botBranches
        .filter((branch) => {
          const match = branch[0].matches(text);
          return (match === true || (match instanceof Array && match.length > 0));
        });

      const validBranches = matchingBranches.filter((branch) => {
        return branch[0].numRunnersEntered < branch[0].numRunnersRequired;
      });

      if (matchingBranches.length === 0) {
        return false;
      } else if (validBranches.length === 0) {
        return [];
      } else {
        return validBranches[0];
      }
    } else {
      throw new Error('matches() should not be called for Human branches');
    }
  }

  // Used for debugging
  toMatchArray(): string[] {
    switch (this.turnType) {
      case TurnType.Bot:
        return this.responses.map(response => response.original);
      case TurnType.Branch:
        return this.botBranches
          .map(branch => branch[0].toString());
      default:
        throw new Error(`cannot have match array for Human`)
    }
  }
}
