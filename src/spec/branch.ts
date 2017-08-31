import { Turn } from './turn';
import { DialogueInvalidError } from './dialogue_invalid_error';
export class Branch {
  branches: Turn[];
  constructor(branchData: any) {
    const numBranches = Object.keys(branchData).length;
    this.branches = [...Array(numBranches)].map((_, i) => branchData[i + 1]).filter(x => x);
    if (this.branches.length !== numBranches) {
      throw new DialogueInvalidError(
        'Branch numbers do not go from 1 to ${numBranches}: ${JSON.stringify(branchData)}');
    }

  }
}
