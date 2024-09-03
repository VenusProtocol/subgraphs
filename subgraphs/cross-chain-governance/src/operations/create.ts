import { Address, Bytes } from '@graphprotocol/graph-ts';

import {
  ProposalReceived,
  ReceivePayloadFailed,
} from '../../generated/OmnichainGovernanceExecutor/OmnichainGovernanceExecutor';
import { FailedPayload, Proposal } from '../../generated/schema';
import { indexProposalTypeConstant } from '../constants';
import { getFailedPayloadId, getProposalId } from '../utilities/ids';

export const createProposal = (event: ProposalReceived): Proposal => {
  const proposal = new Proposal(getProposalId(event.params.proposalId));

  const targets = event.params.targets.map<Bytes>((address: Address) =>
    Bytes.fromHexString(address.toHexString()),
  );
  proposal.proposalId = event.params.proposalId;
  proposal.targets = targets;
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;

  proposal.route = indexProposalTypeConstant[event.params.proposalType];
  proposal.save();
  return proposal;
};

export const createFailedPayload = (event: ReceivePayloadFailed): FailedPayload => {
  const failedProposal = new FailedPayload(getFailedPayloadId(event.params.nonce));
  failedProposal.srcChainId = event.params.srcChainId;
  failedProposal.srcAddress = event.params.srcAddress;
  failedProposal.nonce = event.params.nonce;
  failedProposal.reason = event.params.reason.toString();

  failedProposal.save();
  return failedProposal;
};
