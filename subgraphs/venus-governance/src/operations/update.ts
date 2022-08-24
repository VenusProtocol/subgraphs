import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import {
  ProposalCanceled,
  ProposalExecuted,
  ProposalQueued,
} from '../../generated/GovernorAlpha/GovernorAlpha';
import { DelegateChanged, DelegateVotesChanged } from '../../generated/VenusToken/VenusToken';
import { BIGINT_ONE, BIGINT_ZERO, CANCELLED, EXECUTED, QUEUED } from '../constants';
import { toDecimal } from '../utils/decimals';
import { getGovernanceEntity, getProposal } from './get';
import { getOrCreateDelegate, getOrCreateTokenHolder } from './getOrCreate';

export const updateProposalStatus = (id: string, status: string) => {
  const proposal = getProposal(id);
  proposal.status = status;
  proposal.save();
};

export const updateProposalCanceled = (event: ProposalCanceled) => {
  const params = event.params;
  const proposal = getProposal(params.id.toString());

  proposal.status = CANCELLED;
  proposal.save();
};

export const updateProposalQueued = (event: ProposalQueued) => {
  const params = event.params;
  const governance = getGovernanceEntity();
  const proposal = getProposal(params.id.toString());

  proposal.status = QUEUED;
  proposal.executionETA = params.eta;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.plus(BIGINT_ONE);
  governance.save();
};

export const updateProposalExecuted = (event: ProposalExecuted) => {
  const params = event.params;
  const governance = getGovernanceEntity();
  const proposal = getProposal(params.id.toString());

  proposal.status = EXECUTED;
  proposal.executionETA = null;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.minus(BIGINT_ONE);
  governance.save();
};

export const updateDelegateChanged = (event: DelegateChanged) => {
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
};

export const updateDelegateVoteChanged = (event: DelegateVotesChanged) => {
  const params = event.params;
  const governance = getGovernanceEntity();
  const delegateResult = getOrCreateDelegate(params.delegate.toHexString());
  const delegate = delegateResult.entity;
  const votesDifference = event.params.newBalance.minus(params.previousBalance);

  delegate.delegatedVotesRaw = params.newBalance;
  delegate.delegatedVotes = toDecimal(params.newBalance);
  delegate.save();

  if (params.previousBalance == BIGINT_ZERO && params.newBalance > BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.plus(BIGINT_ONE);
  }
  if (params.newBalance == BIGINT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.minus(BIGINT_ONE);
  }
  governance.delegatedVotesRaw = governance.delegatedVotesRaw.plus(votesDifference);
  governance.delegatedVotes = toDecimal(governance.delegatedVotesRaw);
  governance.save();
};

export const updateSentXvs = (from: Address, amount: BigInt) => {
  const governance = getGovernanceEntity();
  const fromHolderResult = getOrCreateTokenHolder(from.toHexString());
  const fromHolder = fromHolderResult.entity;
  const fromHolderPreviousBalance = fromHolder.tokenBalanceRaw;
  fromHolder.tokenBalanceRaw = fromHolder.tokenBalanceRaw.minus(amount);
  fromHolder.tokenBalance = toDecimal(fromHolder.tokenBalanceRaw);

  if (fromHolder.tokenBalanceRaw < BIGINT_ZERO) {
    log.error('Negative balance on holder {} with balance {}', [
      fromHolder.id,
      fromHolder.tokenBalanceRaw.toString(),
    ]);
  }

  if (fromHolder.tokenBalanceRaw == BIGINT_ZERO && fromHolderPreviousBalance > BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.minus(BIGINT_ONE);
    governance.save();
  } else if (fromHolder.tokenBalanceRaw > BIGINT_ZERO && fromHolderPreviousBalance == BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }

  fromHolder.save();
};

export const updateReceivedXvs = (to: Address, amount: BigInt) => {
  const governance = getGovernanceEntity();
  const toHolderResult = getOrCreateTokenHolder(to.toHexString());
  const toHolder = toHolderResult.entity;
  const toHolderPreviousBalance = toHolder.tokenBalanceRaw;
  toHolder.tokenBalanceRaw = toHolder.tokenBalanceRaw.plus(amount);
  toHolder.tokenBalance = toDecimal(toHolder.tokenBalanceRaw);
  toHolder.totalTokensHeldRaw = toHolder.totalTokensHeldRaw.plus(amount);
  toHolder.totalTokensHeld = toDecimal(toHolder.totalTokensHeldRaw);

  if (toHolder.tokenBalanceRaw == BIGINT_ZERO && toHolderPreviousBalance > BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.minus(BIGINT_ONE);
    governance.save();
  } else if (toHolder.tokenBalanceRaw > BIGINT_ZERO && toHolderPreviousBalance == BIGINT_ZERO) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(BIGINT_ONE);
    governance.save();
  }

  toHolder.save();
};
