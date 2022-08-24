import { Address, BigInt, log } from '@graphprotocol/graph-ts';

import { Delegate, Governance, Proposal } from '../../generated/schema';
import { BIGINT_ONE, BIGINT_ZERO, GOVERNANCE } from '../constants';

/**
 * While techinically this function does also create, we don't care because it only happens once as the id is a constant.
 * @returns Governance
 */
export const getGovernanceEntity = (): Governance => {
  let governance = Governance.load(GOVERNANCE);
  if (!governance) {
    governance = new Governance(GOVERNANCE);
    governance.proposals = BIGINT_ZERO;
    governance.totalTokenHolders = BIGINT_ZERO;
    governance.currentTokenHolders = BIGINT_ZERO;
    governance.currentDelegates = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.delegatedVotes = BIGINT_ZERO;
    governance.proposalsQueued = BIGINT_ZERO;
    // defaulting to Governor Bravo constructor defaults
    governance.votingDelay = BIGINT_ONE;
    governance.votingPeriod = BigInt.fromI64(86400);
    governance.implementation = Address.fromString('0x18df46ec843e79d9351b57f85af7d69aec0d7eff');
    governance.proposalThreshold = BigInt.fromI64(300000000000000000000000);
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

export const getDelegate = (id: string): Delegate => {
  const delegate = Delegate.load(id);
  if (!delegate) {
    log.critical('Delegate {} not found', [id]);
  }
  return delegate as Delegate;
};
