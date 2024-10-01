import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { OmnichainProposalSender as OmnichainProposalSenderContract } from '../../generated/OmnichainProposalSender/OmnichainProposalSender';
import {
  Delegate,
  Governance,
  OmnichainProposalSender,
  Proposal,
  RemoteProposal,
  RemoteProposalStateTransaction,
} from '../../generated/schema';
import { omnichainProposalSenderAddress } from '../constants/addresses';
import {
  getDelegateId,
  getGovernanceId,
  getOmnichainProposalSenderId,
  getProposalId,
  getRemoteProposalId,
  getRemoteProposalStateTransactionId,
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

export const getProposal = (proposalId: BigInt): Proposal => {
  const id = getProposalId(proposalId);
  const proposal = Proposal.load(id);
  if (!proposal) {
    log.critical('Proposal {} not found', [id.toString()]);
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

export const getRemoteProposal = (layerZeroChainId: i32, proposalId: BigInt): RemoteProposal => {
  const id = getRemoteProposalId(layerZeroChainId, proposalId);
  const remoteProposal = RemoteProposal.load(id);
  if (!remoteProposal) {
    log.critical('RemoteProposal {} not found', [proposalId.toString()]);
  }
  return remoteProposal as RemoteProposal;
};

export const getRemoteProposalStateTransaction = (
  proposalId: BigInt,
): RemoteProposalStateTransaction => {
  const id = getRemoteProposalStateTransactionId(proposalId);
  const remoteProposalStateTransaction = RemoteProposalStateTransaction.load(id);
  if (!remoteProposalStateTransaction) {
    log.critical('RemoteProposalStateTransaction {} not found', [proposalId.toString()]);
  }
  return remoteProposalStateTransaction as RemoteProposalStateTransaction;
};
