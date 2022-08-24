import { log } from '@graphprotocol/graph-ts';

import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteCast,
} from '../../generated/GovernorAlpha/GovernorAlpha';
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer,
} from '../../generated/VenusToken/VenusToken';
import { ACTIVE, PENDING, ZERO_ADDRESS } from '../constants';
import { createProposal, createVote } from '../operations/create';
import { getProposal } from '../operations/get';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateDelegateChanged,
  updateDelegateVoteChanged,
  updateProposalCanceled,
  updateProposalExecuted,
  updateProposalQueued,
  updateProposalStatus,
  updateReceivedXvs,
  updateSentXvs,
} from '../operations/update';

// - event: ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)
//   handler: handleProposalCreated

export function handleProposalCreated(event: ProposalCreated): void {
  const result = getOrCreateDelegate(event.params.proposer.toHexString()); // eslint-disable-line @typescript-eslint/no-unused-vars
  const created = result.created;
  createProposal(event);

  // checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (created) {
    log.error('Delegate {} not found on ProposalCreated. tx_hash: {}', [
      event.params.proposer.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  }
}

// - event: ProposalCanceled(uint256)
//   handler: handleProposalCanceled

export function handleProposalCanceled(event: ProposalCanceled): void {
  updateProposalCanceled(event);
}

// - event: ProposalQueued(uint256,uint256)
//   handler: handleProposalQueued

export function handleProposalQueued(event: ProposalQueued): void {
  updateProposalQueued(event);
}

// - event: ProposalExecuted(uint256)
//   handler: handleProposalExecuted

export function handleProposalExecuted(event: ProposalExecuted): void {
  updateProposalExecuted(event);
}

// - event: VoteCast(address,uint256,bool,uint256)
//   handler: handleVoteCast

export function handleVoteCast(event: VoteCast): void {
  createVote(event);
  const proposalId = event.params.proposalId.toString();
  const proposal = getProposal(proposalId);
  if (proposal.status == PENDING) {
    updateProposalStatus(proposalId, ACTIVE);
  }
}

// - event: DelegateChanged(indexed address,indexed address,indexed address)
//   handler: handleDelegateChanged

export function handleDelegateChanged(event: DelegateChanged): void {
  updateDelegateChanged(event);
}

// - event: DelegateVotesChanged(indexed address,uint256,uint256)
//   handler: handleDelegateVotesChanged

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  updateDelegateVoteChanged(event);
}

// - event: Transfer(indexed address,indexed address,uint256)
//   handler: handleTransfer

export function handleTransfer(event: Transfer): void {
  const params = event.params;

  if (params.from.toHexString() != ZERO_ADDRESS) {
    updateSentXvs(params.from, params.amount);
  }

  updateReceivedXvs(params.to, params.amount);
}
