import { Address, log } from '@graphprotocol/graph-ts';

import { Delegate, Governance, Proposal, RemoteProposal } from '../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import { nullAddress } from '../constants/addresses';
import { getDelegateId, getGovernanceId } from '../utilities/ids';

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

export const getRemoteProposal = (id: string): RemoteProposal => {
  const remoteProposal = RemoteProposal.load(id);
  if (!remoteProposal) {
    log.critical('RemoteProposal {} not found', [id]);
  }
  return remoteProposal as RemoteProposal;
};
