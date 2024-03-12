import { Address, Bytes } from '@graphprotocol/graph-ts';

import { VoteCast as VoteCastAlpha } from '../../generated/GovernorAlpha/GovernorAlpha';
import { VoteCast as VoteCastBravo } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { Proposal, Vote } from '../../generated/schema';
import { ABSTAIN, AGAINST, BIGINT_ONE, BIGINT_ZERO, FOR, NORMAL } from '../constants';
import { getVoteId } from '../utilities/ids';
import { getGovernanceEntity, getProposal } from './get';
import { getOrCreateDelegate } from './getOrCreate';

export function createProposal<E>(event: E): Proposal {
  const id = event.params.id.toString();
  const proposal = new Proposal(id);

  const governance = getGovernanceEntity();

  governance.totalProposals = governance.totalProposals.plus(BIGINT_ONE);
  governance.save();
  const targets = event.params.targets.map<Bytes>((address: Address) =>
    Bytes.fromHexString(address.toHexString()),
  );
  proposal.targets = targets;
  proposal.proposer = event.params.proposer.toHexString();
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;
  proposal.description = event.params.description;
  proposal.queued = false;
  proposal.canceled = false;
  proposal.executed = false;
  proposal.type = NORMAL;
  proposal.forVotes = BIGINT_ZERO;
  proposal.againstVotes = BIGINT_ZERO;
  proposal.abstainVotes = BIGINT_ZERO;

  proposal.save();

  return proposal as Proposal;
}

export function createVoteAlpha(event: VoteCastAlpha): Vote {
  const id = getVoteId(event.params.voter, event.params.proposalId);
  const vote = new Vote(id);
  vote.proposal = event.params.proposalId.toString();
  vote.voter = event.params.voter.toHexString();
  vote.votes = event.params.votes;
  vote.support = event.params.support ? FOR : AGAINST;

  vote.save();

  return vote as Vote;
}

export function createVoteBravo(event: VoteCastBravo): Vote {
  const proposal = getProposal(event.params.proposalId.toString());
  const voter = getOrCreateDelegate(event.params.voter).entity;
  const id = getVoteId(event.params.voter, event.params.proposalId);
  const vote = new Vote(id);
  vote.proposal = proposal.id;
  vote.voter = voter.id;
  vote.votes = event.params.votes;
  const indexSupportConstant = [AGAINST, FOR, ABSTAIN];
  vote.support = indexSupportConstant[event.params.support];
  vote.reason = event.params.reason;

  vote.save();

  return vote as Vote;
}
