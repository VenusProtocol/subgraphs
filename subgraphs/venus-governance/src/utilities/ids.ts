import { Address, BigInt } from '@graphprotocol/graph-ts';

const SEPERATOR = '-';

export const getVoteId = (voter: Address, proposalId: BigInt): string =>
  [voter.toHexString(), proposalId.toHexString()].join(SEPERATOR);

export const getPermissionId = (
  accountAddress: Address,
  contractAddress: Address,
  functionSig: string,
): string =>
  [accountAddress.toHexString(), contractAddress.toHexString(), functionSig].join(SEPERATOR);

export const getDelegateId = (account: Address): string => account.toHexString();
