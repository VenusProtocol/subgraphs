import { Delegate } from '../../generated/schema';
import { BIGINT_ONE, BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getGovernanceEntity } from './get';

export class GetOrCreateDelegateReturn {
  entity: Delegate;
  created: boolean;
}

export const getOrCreateDelegate = (id: string): GetOrCreateDelegateReturn => {
  let created = false;
  let delegate = Delegate.load(id);

  if (!delegate) {
    delegate = new Delegate(id);
    delegate.delegatedVotes = BIGINT_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;

    if (id != nullAddress.toString()) {
      const governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.totalVoters = governance.totalVoters.plus(BIGINT_ONE);
      governance.save();
    }

    delegate.save();
    created = true;
  }

  return { entity: delegate as Delegate, created };
};
