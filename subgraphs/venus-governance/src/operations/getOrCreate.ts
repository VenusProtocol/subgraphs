import { Address } from '@graphprotocol/graph-ts';

import { Delegate } from '../../generated/schema';
import { BIGINT_ONE, BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getDelegateId } from '../utilities/ids';
import { getGovernanceEntity } from './get';

export class GetOrCreateDelegateReturn {
  entity: Delegate;
  created: boolean;
}

export const getOrCreateDelegate = (address: Address): GetOrCreateDelegateReturn => {
  let created = false;
  const id = getDelegateId(address);
  let delegate = Delegate.load(id);
  if (!delegate) {
    delegate = new Delegate(id);
    delegate.stakedXvsMantissa = BIGINT_ZERO;
    delegate.totalVotesMantissa = BIGINT_ZERO;
    delegate.delegateCount = 0;

    if (id != nullAddress) {
      const governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }

    delegate.save();
    created = true;
  }

  return { entity: delegate as Delegate, created };
};
