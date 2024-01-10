import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts';

import { VoteCast as VoteCastAlpha } from '../../generated/GovernorAlpha/GovernorAlpha';
import { VoteCast as VoteCastBravo } from '../../generated/GovernorBravoDelegate/GovernorBravoDelegate';
import { ExecuteRemoteProposal } from '../../generated/OmnichainProposalSender/OmnichainProposalSender';
import { Proposal, RemoteProposal, Vote } from '../../generated/schema';
import { ABSTAIN, AGAINST, BIGINT_ONE, FOR, NORMAL } from '../constants';
import { getProposalId, getVoteId } from '../utilities/ids';
import { getDelegate, getGovernanceEntity, getProposal } from './get';

export function createProposal<E>(event: E): Proposal {
  const id = getProposalId(event.params.id);
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
  const proposal = getProposal(getProposalId(event.params.proposalId));
  const voter = getDelegate(event.params.voter);
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

export function createRemoteProposal(event: ExecuteRemoteProposal): RemoteProposal {
  const remoteProposal = new RemoteProposal(event.params.nonce);
  remoteProposal.remoteChainId = event.params.remoteChainId;
  remoteProposal.proposalId = event.params.proposalId;
  const decoded = ethereum.decode(
    '(address[],uint[],string[],bytes[],uint8)',
    event.params.payload,
  );
  remoteProposal.targets = decoded[0].toArray();
  remoteProposal.targets = decoded[1].toArray();
  remoteProposal.signatures = decoded[2].toArray();
  remoteProposal.calldatas = decoded[3].toArray();
  remoteProposal.proposalType = decoded[4].toString();
  remoteProposal.save();
}
