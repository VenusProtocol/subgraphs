import { Address, Bytes } from '@graphprotocol/graph-ts';

import { VoteCast as VoteCastAlpha } from '../../generated/GovernorAlpha/GovernorAlpha';
import { VoteCast as VoteCastBravo } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { Proposal, Vote } from '../../generated/schema';
import { ABSTAIN, ACTIVE, AGAINST, BIGINT_ONE, FOR, PENDING } from '../constants';
import { getVoteId } from '../utils/ids';
import { getDelegate, getGovernanceEntity, getProposal } from './get';

export function createProposal<E>(event: E): Proposal {
  const id = event.params.id.toString();
  const proposal = new Proposal(id);

  const governance = getGovernanceEntity();

  governance.proposals = governance.proposals.plus(BIGINT_ONE);
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
  proposal.status = event.block.number >= proposal.startBlock ? ACTIVE : PENDING;

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
  const voter = getDelegate(event.params.voter.toHexString());
  const id = getVoteId(event.params.voter, event.params.proposalId);
  const vote = new Vote(id);
  vote.proposal = proposal.id;
  vote.voter = voter.id;
  vote.votes = event.params.votes;
  const indexSupportConstant = [AGAINST, FOR, ABSTAIN];
  vote.support = indexSupportConstant[event.params.support];

  vote.save();

  return vote as Vote;
}
