import { Address, BigInt } from '@graphprotocol/graph-ts';

const SEPERATOR = '-';

export const getVoteId = (voter: Address, proposalId: BigInt): string =>
  [voter.toHexString(), proposalId.toHexString()].join(SEPERATOR);
