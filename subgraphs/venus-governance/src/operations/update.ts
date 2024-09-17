import { BigInt } from '@graphprotocol/graph-ts';

import { GovernorBravoDelegate2 } from '../../generated/GovernorBravoDelegate2/GovernorBravoDelegate2';
import { Governance, Transaction } from '../../generated/schema';
import { BIGINT_ONE } from '../constants';
import { governorBravoDelegatorAddress, nullAddress } from '../constants/addresses';
import { getGovernanceId } from '../utilities/ids';
import { getGovernanceEntity, getProposal } from './get';
import { getOrCreateDelegate } from './getOrCreate';

export function updateProposalCanceled<E>(event: E): void {
  const params = event.params;
  const proposal = getProposal(params.id);

  const canceledAction = new Transaction(event.transaction.hash);
  canceledAction.blockNumber = event.block.number;
  canceledAction.timestamp = event.block.timestamp;
  canceledAction.txHash = event.transaction.hash;
  canceledAction.save();

  proposal.canceled = canceledAction.id;
  proposal.save();
}

export function updateProposalQueued<E>(event: E): void {
  const params = event.params;
  const proposal = getProposal(params.id);

  const queuedAction = new Transaction(event.transaction.hash);
  queuedAction.blockNumber = event.block.number;
  queuedAction.timestamp = event.block.timestamp;
  queuedAction.txHash = event.transaction.hash;
  queuedAction.save();

  proposal.queued = queuedAction.id;
  proposal.executionEta = params.eta;
  proposal.save();
}

export function updateProposalExecuted<E>(event: E): void {
  const params = event.params;
  const proposal = getProposal(params.id);

  const executedAction = new Transaction(event.transaction.hash);
  executedAction.blockNumber = event.block.number;
  executedAction.timestamp = event.block.timestamp;
  executedAction.txHash = event.transaction.hash;
  executedAction.save();

  proposal.executed = executedAction.id;
  proposal.save();
}

export function updateDelegateChanged<E>(event: E): void {
  const governance = getGovernanceEntity();
  const params = event.params;
  const fromDelegate = params.fromDelegate;
  const toDelegate = params.toDelegate;

  const delegatorResult = getOrCreateDelegate(params.delegator);
  const delegatorEntity = delegatorResult.entity;

  delegatorEntity.delegatee = toDelegate;
  delegatorEntity.save();

  if (fromDelegate != nullAddress) {
    const oldDelegateResult = getOrCreateDelegate(params.fromDelegate);
    const oldDelegate = oldDelegateResult.entity;
    oldDelegate.delegateCount = oldDelegate.delegateCount - 1;
    oldDelegate.save();
  }

  if (fromDelegate == nullAddress) {
    governance.totalVoters = governance.totalVoters.plus(BIGINT_ONE);
    governance.save();
  }

  if (toDelegate != nullAddress) {
    const newDelegateResult = getOrCreateDelegate(params.toDelegate);
    const newDelegate = newDelegateResult.entity;
    newDelegate.delegateCount = newDelegate.delegateCount + 1;
    newDelegate.save();
  }

  if (toDelegate == nullAddress) {
    governance.totalVoters = governance.totalVoters.minus(BIGINT_ONE);
    governance.save();
  }
}

export function updateDelegateVoteChanged<E>(event: E): void {
  const params = event.params;
  const governance = getGovernanceEntity();
  const delegateResult = getOrCreateDelegate(params.delegate);
  const delegate = delegateResult.entity;

  const previousBalance = params.previousBalance;
  const newBalance = params.newBalance;
  const votesDifference = newBalance.minus(previousBalance);

  delegate.totalVotesMantissa = newBalance;
  delegate.save();

  governance.totalVotesMantissa = governance.totalVotesMantissa.plus(votesDifference);
  governance.save();
}

export function updateGovernanceEntity(): void {
  const governorBravoDelegate2 = GovernorBravoDelegate2.bind(governorBravoDelegatorAddress);
  const governance = Governance.load(getGovernanceId())!;
  governance.quorumVotesMantissa = governorBravoDelegate2.quorumVotes();
  governance.admin = governorBravoDelegate2.admin();
  governance.guardian = governorBravoDelegate2.guardian();
  governance.proposalMaxOperations = governorBravoDelegate2.proposalMaxOperations();
  governance.save();
}

export function updateAlphaProposalVotes(id: BigInt, votes: BigInt, support: boolean): void {
  const proposal = getProposal(id);
  if (support) {
    proposal.forVotes = proposal.forVotes.plus(votes);
  } else {
    proposal.againstVotes = proposal.againstVotes.plus(votes);
  }
  proposal.passing = proposal.forVotes > proposal.againstVotes;
  proposal.save();
}

export function updateBravoProposalVotes(id: BigInt, votes: BigInt, support: i32): void {
  const proposal = getProposal(id);
  if (support == 0) {
    proposal.againstVotes = proposal.againstVotes.plus(votes);
  } else if (support == 1) {
    proposal.forVotes = proposal.forVotes.plus(votes);
  } else {
    proposal.abstainVotes = proposal.abstainVotes.plus(votes);
  }
  proposal.passing = proposal.forVotes > proposal.againstVotes;
  proposal.save();
}
