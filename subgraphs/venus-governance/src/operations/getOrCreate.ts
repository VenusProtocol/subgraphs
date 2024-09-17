import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';

import {
  Delegate,
  MaxDailyLimit,
  RemoteProposalStateTransaction,
  Transaction,
  TrustedRemote,
} from '../../generated/schema';
import { BIGINT_ONE, BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getRemoteProposalId } from '../utilities/ids';
import {
  getDelegateId,
  getMaxDailyLimitId,
  getRemoteProposalStateTransactionId,
  getTrustedRemoteId,
} from '../utilities/ids';
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
  layerZeroChainId: i32,
  remoteAddress: Address,
): GetOrCreateTrustedRemoteReturn => {
  let created = false;
  const id = getTrustedRemoteId(layerZeroChainId);
  let trustedRemote = TrustedRemote.load(id);
  if (!trustedRemote) {
    trustedRemote = new TrustedRemote(id);
    trustedRemote.layerZeroChainId = layerZeroChainId;
    trustedRemote.address = remoteAddress;
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

export const getOrCreateTransaction = (event: ethereum.Event): Transaction => {
  let transaction = Transaction.load(event.transaction.hash);
  if (!transaction) {
    transaction = new Transaction(event.transaction.hash);
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.txHash = event.transaction.hash;
    transaction.save();
  }
  return transaction;
};

export const getOrCreateRemoteProposalStateTransaction = (
  layerZeroChainId: i32,
  proposalId: BigInt,
  remoteProposalId: BigInt,
): RemoteProposalStateTransaction => {
  const key = getRemoteProposalId(layerZeroChainId, proposalId);
  const id = getRemoteProposalStateTransactionId(remoteProposalId);
  let remoteProposalStateTransaction = RemoteProposalStateTransaction.load(id);
  if (!remoteProposalStateTransaction) {
    remoteProposalStateTransaction = new RemoteProposalStateTransaction(id);
    remoteProposalStateTransaction.key = key;
    remoteProposalStateTransaction.save();
  }
  return remoteProposalStateTransaction;
};
