import { BigInt } from '@graphprotocol/graph-ts';

import { Proposal } from '../../generated/schema';
import { getProposalId } from '../utilities/ids';

export const getProposal = (proposalId: BigInt) => {
  const proposal = Proposal.load(getProposalId(proposalId));
  return proposal;
};
