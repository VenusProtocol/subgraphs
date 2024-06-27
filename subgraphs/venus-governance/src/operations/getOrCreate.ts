import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Delegate, MaxDailyLimit, TrustedRemote } from '../../generated/schema';
import { BIGINT_ONE, BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getDelegateId, getMaxDailyLimitId, getTrustedRemoteId } from '../utilities/ids';
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

export class GetOrCreateTrustedRemoteReturn {
  entity: TrustedRemote;
  created: boolean;
}

export const getOrCreateTrustedRemote = (
  remoteChainId: i32,
  remoteAddress: Bytes,
): GetOrCreateTrustedRemoteReturn => {
  let created = false;
  const id = getTrustedRemoteId(remoteChainId);
  let trustedRemote = TrustedRemote.load(id);
  if (!trustedRemote) {
    trustedRemote = new TrustedRemote(id);
    trustedRemote.chainId = remoteChainId;
    trustedRemote.address = Address.fromBytes(remoteAddress);
    trustedRemote.active = true;
    created = true;
    trustedRemote.save();
  }
  return { entity: trustedRemote, created };
};

export class GetOrCreateMaxDailyLimitReturn {
  entity: MaxDailyLimit;
  created: boolean;
}

export const getOrCreateMaxDailyLimit = (chainId: i32): GetOrCreateMaxDailyLimitReturn => {
  const id = getMaxDailyLimitId(chainId);
  let created = false;
  let maxDailyLimit = MaxDailyLimit.load(id);
  if (!maxDailyLimit) {
    maxDailyLimit = new MaxDailyLimit(id);
    maxDailyLimit.destinationChainId = BigInt.fromI32(chainId);
    maxDailyLimit.max = BigInt.fromI32(0);
    maxDailyLimit.save();
    created = true;
  }
  return { entity: maxDailyLimit, created };
};
