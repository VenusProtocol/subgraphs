import { log } from '@graphprotocol/graph-ts';

import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteCast,
} from '../../generated/GovernorAlpha/GovernorAlpha';
import { createProposal, createVoteAlpha } from '../operations/create';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateProposalCanceled,
  updateProposalExecuted,
  updateProposalQueued,
} from '../operations/update';

// - event: ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)
//   handler: handleProposalCreated

export function handleProposalCreated(event: ProposalCreated): void {
  const result = getOrCreateDelegate(event.params.proposer.toHex());
  const created = result.created;
  createProposal<ProposalCreated>(event);

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
  updateProposalCanceled<ProposalCanceled>(event);
}

// - event: ProposalQueued(uint256,uint256)
//   handler: handleProposalQueued

export function handleProposalQueued(event: ProposalQueued): void {
  updateProposalQueued<ProposalQueued>(event);
}

// - event: ProposalExecuted(uint256)
//   handler: handleProposalExecuted

export function handleProposalExecuted(event: ProposalExecuted): void {
  updateProposalExecuted<ProposalExecuted>(event);
}

// - event: VoteCast(address,uint256,bool,uint256)
//   handler: handleVoteCast

export function handleVoteCast(event: VoteCast): void {
  // Alpha V1 doesn't require staking in the vault so we need to create delegates when casting a vote
  getOrCreateDelegate(event.params.voter.toHexString());
  createVoteAlpha(event);
}

export function handleVoteCastV2(event: VoteCast): void {
  createVoteAlpha(event);
}
