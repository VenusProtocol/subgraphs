import { Delegate, TokenHolder } from '../../generated/schema';
import { BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO, ZERO_ADDRESS } from '../constants';
import { getGovernanceEntity } from './get';

export class GetOrCreateTokenHolderReturn {
  entity: TokenHolder;
  created: boolean;
}

export const getOrCreateTokenHolder = (id: string): GetOrCreateTokenHolderReturn => {
  let tokenHolder = TokenHolder.load(id);
  let created = false;
  if (!tokenHolder) {
    tokenHolder = new TokenHolder(id);
    tokenHolder.tokenBalanceRaw = BIGINT_ZERO;
    tokenHolder.tokenBalance = BIGDECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIGINT_ZERO;
    tokenHolder.totalTokensHeld = BIGDECIMAL_ZERO;

    if (id != ZERO_ADDRESS) {
      const governance = getGovernanceEntity();
      governance.totalTokenHolders = governance.totalTokenHolders.plus(BIGINT_ONE);
      governance.save();
    }

    tokenHolder.save();
    created = true;
  }

  return { entity: tokenHolder as TokenHolder, created };
};

export class GetOrCreateDelegateReturn {
  entity: Delegate;
  created: boolean;
}

export const getOrCreateDelegate = (id: string): GetOrCreateDelegateReturn => {
  let delegate = Delegate.load(id);
  let created = false;
  if (!delegate) {
    delegate = new Delegate(id);
    delegate.delegatedVotesRaw = BIGINT_ZERO;
    delegate.delegatedVotes = BIGDECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;

    if (id != ZERO_ADDRESS) {
      const governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }

    delegate.save();
    created = true;
  }

  return { entity: delegate as Delegate, created };
};
