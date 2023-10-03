import { BIGINT_ONE, BIGINT_ZERO, CANCELLED, EXECUTED, QUEUED } from '../constants';
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
  const oldDelegateResult = getOrCreateDelegate(params.fromDelegate.toHexString());
  const oldDelegate = oldDelegateResult.entity;
  const newDelegateResult = getOrCreateDelegate(params.toDelegate.toHexString());
  const newDelegate = newDelegateResult.entity;

  oldDelegate.delegateCount = oldDelegate.delegateCount - 1;
  oldDelegate.save();
  newDelegate.delegateCount = newDelegate.delegateCount + 1;
  newDelegate.save();
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

  if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
    governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
  }
  if (newBalance == BIGINT_ZERO) {
    governance.totalDelegates = governance.totalDelegates.minus(BIGINT_ONE);
  }
  governance.totalVotesMantissa = governance.totalVotesMantissa.plus(votesDifference);
  governance.save();
}
