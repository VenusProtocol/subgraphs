import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { BIGINT_ONE, BIGINT_ZERO, CANCELLED, EXECUTED, QUEUED } from '../constants';
import { getGovernanceEntity, getProposal } from './get';
import { getOrCreateDelegate, getOrCreateTokenHolder } from './getOrCreate';

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
  const tokenHolderResult = getOrCreateTokenHolder(params.delegator.toHexString());
  const tokenHolder = tokenHolderResult.entity;
  const oldDelegateResult = getOrCreateDelegate(params.fromDelegate.toHexString());
  const oldDelegate = oldDelegateResult.entity;
  const newDelegateResult = getOrCreateDelegate(params.toDelegate.toHexString());
  const newDelegate = newDelegateResult.entity;
  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  oldDelegate.tokenHoldersRepresentedAmount = oldDelegate.tokenHoldersRepresentedAmount - 1;
  newDelegate.tokenHoldersRepresentedAmount = newDelegate.tokenHoldersRepresentedAmount + 1;
  oldDelegate.save();
  newDelegate.save();
}

export function updateDelegateVoteChanged<E>(event: E): void {
  const params = event.params;
  const governance = getGovernanceEntity();
  const delegateResult = getOrCreateDelegate(params.delegate.toHexString());
  const delegate = delegateResult.entity;
  // // Accessing this parameters by name throws `Ethereum value is not an int or uint`
  const previousBalance = event.parameters[1].value.kind
    ? BigInt.fromU64(event.parameters[1].value.data)
    : BIGINT_ZERO;
  const newBalance = event.parameters[2].value.kind
    ? BigInt.fromU64(event.parameters[2].value.data)
    : BIGINT_ZERO;
  const votesDifference = newBalance.minus(previousBalance);

  delegate.delegatedVotes = newBalance;
  delegate.save();

  if (previousBalance == BIGINT_ZERO && newBalance > BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.plus(BIGINT_ONE);
  }
  if (newBalance == BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.minus(BIGINT_ONE);
  }
  governance.delegatedVotes = governance.delegatedVotes.plus(votesDifference);
  governance.save();
}

export const updateSentXvs = (from: Address, amount: BigInt): void => {
  const governance = getGovernanceEntity();
  const fromHolderResult = getOrCreateTokenHolder(from.toHexString());
  const fromHolder = fromHolderResult.entity;
  const fromHolderPreviousBalance = fromHolder.tokenBalance;
  fromHolder.tokenBalance = fromHolder.tokenBalance.minus(amount);

  if (fromHolder.tokenBalance < BIGINT_ZERO) {
    log.error('Negative balance on holder {} with balance {}', [
      fromHolder.id,
      fromHolder.tokenBalance.toString(),
    ]);
  }

  if (fromHolder.tokenBalance == BIGINT_ZERO && fromHolderPreviousBalance > BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.minus(BIGINT_ONE);
    governance.save();
  } else if (fromHolder.tokenBalance > BIGINT_ZERO && fromHolderPreviousBalance == BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }

  fromHolder.save();
};

export const updateReceivedXvs = (to: Address, amount: BigInt): void => {
  const governance = getGovernanceEntity();
  const toHolderResult = getOrCreateTokenHolder(to.toHexString());
  const toHolder = toHolderResult.entity;
  const toHolderPreviousBalance = toHolder.tokenBalance;
  toHolder.tokenBalance = toHolder.tokenBalance.plus(amount);
  toHolder.totalTokensHeld = toHolder.totalTokensHeld.plus(amount);

  if (toHolder.tokenBalance == BIGINT_ZERO && toHolderPreviousBalance > BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.minus(BIGINT_ONE);
    governance.save();
  } else if (toHolder.tokenBalance > BIGINT_ZERO && toHolderPreviousBalance == BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }

  toHolder.save();
};
