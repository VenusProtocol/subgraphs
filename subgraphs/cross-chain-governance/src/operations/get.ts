import { BigInt, log } from '@graphprotocol/graph-ts';

import { Proposal } from '../../generated/schema';
import { getProposalId } from '../utilities/ids';

export const getProposal = (proposalId: BigInt): Proposal => {
  const proposal = Proposal.load(getProposalId(proposalId));
  if (!proposal) {
    log.critical('Proposal {} not found', [getProposalId(proposalId)]);
  }
  return proposal as Proposal;
};
