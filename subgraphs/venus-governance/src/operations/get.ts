import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { OmnichainProposalSender as OmnichainProposalSenderContract } from '../../generated/OmnichainProposalSender/OmnichainProposalSender';
import {
  Delegate,
  Governance,
  OmnichainProposalSender,
  Proposal,
  RemoteProposal,
} from '../../generated/schema';
import { omnichainProposalSenderAddress } from '../constants/addresses';
import {
  getDelegateId,
  getGovernanceId,
  getOmnichainProposalSenderId,
  getProposalId,
} from '../utilities/ids';

/**
 * While technically this function does also create, we don't care because it only happens once as the id is a constant.
 * The initial values are mocked because they are updated when an implementation is set
 * @returns Governance
 */
export const getGovernanceEntity = (): Governance => {
  const governance = Governance.load(getGovernanceId())!;
  return governance;
};

export const getOmnichainProposalSenderEntity = (): OmnichainProposalSender => {
  let omnichainProposalSender = OmnichainProposalSender.load(getOmnichainProposalSenderId());
  if (!omnichainProposalSender) {
    const omnichainProposalSenderContract = OmnichainProposalSenderContract.bind(
      omnichainProposalSenderAddress,
    );
    omnichainProposalSender = new OmnichainProposalSender(getOmnichainProposalSenderId());
    omnichainProposalSender.address = getOmnichainProposalSenderId();
    omnichainProposalSender.accessControlManagerAddress =
      omnichainProposalSenderContract.accessControlManager();
    omnichainProposalSender.paused = false;
    omnichainProposalSender.save();
  }
  return omnichainProposalSender;
};

export const getProposal = (id: string): Proposal => {
  const proposal = Proposal.load(id);
  if (!proposal) {
    log.critical('Proposal {} not found', [id]);
  }
  return proposal as Proposal;
};

export const getDelegate = (address: Address): Delegate => {
  const id = getDelegateId(address);
  const delegate = Delegate.load(id);
  if (!delegate) {
    log.critical('Delegate {} not found', [id.toHexString()]);
  }
  return delegate as Delegate;
};

export const getRemoteProposal = (proposalId: BigInt): RemoteProposal => {
  const id = getProposalId(proposalId);
  const remoteProposal = RemoteProposal.load(id.toString());
  if (!remoteProposal) {
    log.critical('RemoteProposal {} not found', [id.toString()]);
  }
  return remoteProposal as RemoteProposal;
};
