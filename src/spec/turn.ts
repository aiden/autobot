import { DialogueInvalidError } from './dialogue_invalid_error';
import { Response } from './response';
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
    let transformedData;
    // Transform Human turnData into Branch if multiple
    if (turnData.Human instanceof Array) {
      transformedData = {
        Branch: turnData.Human.reduce(
          (branchData, response, i) => {
            branchData[i + 1] = [{ Human: response }];
            return branchData;
          },
          {}),
      };
    } else {
      transformedData = turnData;
    }
    if (transformedData.Human || transformedData.Bot) {
      if (transformedData.Human) {
        this.turnType = TurnType.Human;
        data = transformedData.Human;
      } else if (transformedData.Bot) {
        this.turnType = TurnType.Bot;
        data = transformedData.Bot;
      }
      if (typeof data === 'string') {
        data = [data];
      }
      if (transformedData.Human) {
        this.query = data;
      } else {
        this.responses = data.map(responseData => new Response(responseData));
      }
    } else if (transformedData.Branch) {
      this.turnType = TurnType.Branch;
      data = transformedData.Branch;

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
    } else {
      throw new DialogueInvalidError(
        `No Human, Bot, or Branch key on ${JSON.stringify(transformedData)}`);
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
   *    - Turn[] if it matches a branch, returns the branch to go to.
   *    - false if there is no match **/
  matches(text: string): Turn[] | boolean {
    if (this.turnType === TurnType.Bot) {
      return this.responses.some((response) => {
        return response.matches(text);
      });
    } else if (this.turnType === TurnType.Branch) {
      const matchingBranch = this.botBranches.find((turnList) => {
        if (turnList[0].turnType === TurnType.Bot) {
          return turnList[0].matches(text) !== false;
        } else {
          return false;
        }
      });
      return matchingBranch ? matchingBranch : false;
    } else {
      throw new Error('matches() should not be called for Human branches');
    }
  }

  toString(): string {
    switch (this.turnType) {
      case TurnType.Bot:
        return this.responses.map(response => response.original).join(' | ');
      case TurnType.Human:
        return this.query;
      case TurnType.Branch:
        return this.botBranches.concat(this.humanBranches)
          .map(branch => branch[0].toString()).join(' | ');
    }
  }
}
