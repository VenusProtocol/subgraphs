import { BIGINT_ONE, BIGINT_ZERO, CANCELLED, EXECUTED, QUEUED } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getGovernanceEntity, getProposal } from './get';
import { getOrCreateDelegate } from './getOrCreate';

export const updateProposalStatus = (id: string, status: string): void => {
  const proposal = getProposal(id);
  proposal.status = status;
  proposal.save();
};

export function updateProposalCanceled<E>(event: E): void {
  const params = event.params;
  const proposal = getProposal(params.id.toString());

  proposal.status = CANCELLED;
  proposal.save();
}

export function updateProposalQueued<E>(event: E): void {
  const params = event.params;
  const governance = getGovernanceEntity();
  const proposal = getProposal(params.id.toString());

  proposal.status = QUEUED;
  proposal.executionETA = params.eta;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
}

export function updateProposalExecuted<E>(event: E): void {
  const params = event.params;
  const governance = getGovernanceEntity();
  const proposal = getProposal(params.id.toString());

  proposal.status = EXECUTED;
  proposal.executionETA = null;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.save();
}

export function updateDelegateChanged<E>(event: E): void {
  const params = event.params;
  const fromDelegate = params.fromDelegate.toHexString();
  const toDelegate = params.toDelegate.toHexString();
  const delegator = params.delegator.toHexString();

  const delegatorResult = getOrCreateDelegate(delegator);
  const delegatorEntity = delegatorResult.entity;
  delegatorEntity.delegatee = toDelegate;
  delegatorEntity.save();

  if (fromDelegate != nullAddress.toHexString()) {
    const oldDelegateResult = getOrCreateDelegate(fromDelegate);
    const oldDelegate = oldDelegateResult.entity;
    oldDelegate.delegateCount = oldDelegate.delegateCount - 1;
    oldDelegate.save();
  }

  if (toDelegate != nullAddress.toHexString()) {
    const newDelegateResult = getOrCreateDelegate(toDelegate);
    const newDelegate = newDelegateResult.entity;
    newDelegate.delegateCount = newDelegate.delegateCount + 1;
    newDelegate.save();
  }
}

export function updateDelegateVoteChanged<E>(event: E): void {
  const params = event.params;
  const governance = getGovernanceEntity();
  const delegateResult = getOrCreateDelegate(params.delegate.toHexString());
  const delegate = delegateResult.entity;

  const previousBalance = params.previousBalance;
  const newBalance = params.newBalance;
  const votesDifference = newBalance.minus(previousBalance);

  delegate.totalVotesMantissa = newBalance;
  delegate.save();

  governance.totalVotesMantissa = governance.totalVotesMantissa.plus(votesDifference);
  governance.save();
}
