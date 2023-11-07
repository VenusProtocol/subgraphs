import { ProposalReceived } from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { Proposal } from '../../generated/schema';
import { getProposalId } from '../utilities/ids';

export const createProposal = (event: ProposalReceived) => {
  const proposal = new Proposal(getProposalId(event.params.proposalId));
  proposal.targets = event.params.targets;
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.proposalType = event.params.proposalType;
  proposal.save();
};
