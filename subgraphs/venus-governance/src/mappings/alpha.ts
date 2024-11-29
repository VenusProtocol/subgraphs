import { ethereum, log } from '@graphprotocol/graph-ts';

import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  ProposalQueued,
  VoteCast,
} from '../../generated/GovernorAlpha/GovernorAlpha';
import { Governance } from '../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { createProposal, createVoteAlpha } from '../operations/create';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import {
  updateAlphaProposalVotes,
  updateProposalCanceled,
  updateProposalExecuted,
  updateProposalQueued,
} from '../operations/update';
import { getGovernanceId } from '../utilities/ids';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitialization(block: ethereum.Block): void {
  const governance = new Governance(getGovernanceId());
  governance.totalProposals = BIGINT_ZERO;
  governance.totalDelegates = BIGINT_ZERO;
  governance.totalVoters = BIGINT_ZERO;
  governance.totalVotesMantissa = BIGINT_ZERO;
  // Mocking values until we can correctly index current governance contract
  governance.admin = nullAddress;
  governance.implementation = nullAddress;
  governance.guardian = nullAddress;
  governance.quorumVotesMantissa = BIGINT_ZERO;
  governance.proposalMaxOperations = BIGINT_ZERO;
  governance.save();
}

// - event: ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)
//   handler: handleProposalCreated

export function handleProposalCreated(event: ProposalCreated): void {
  const result = getOrCreateDelegate(event.params.proposer);
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
  getOrCreateDelegate(event.params.voter);
  createVoteAlpha(event);
  updateAlphaProposalVotes(event.params.proposalId, event.params.votes, event.params.support);
}

export function handleVoteCastV2(event: VoteCast): void {
  // Always check for a delegate in order to support 0 value votes
  getOrCreateDelegate(event.params.voter);
  createVoteAlpha(event);
  updateAlphaProposalVotes(event.params.proposalId, event.params.votes, event.params.support);
}
