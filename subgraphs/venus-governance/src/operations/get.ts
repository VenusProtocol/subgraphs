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
import { BIGINT_ZERO } from '../constants';
import { nullAddress, omnichainProposalSenderAddress } from '../constants/addresses';
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
  let governance = Governance.load(getGovernanceId());
  if (!governance) {
    governance = new Governance(getGovernanceId());
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
  }

  return governance as Governance;
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
