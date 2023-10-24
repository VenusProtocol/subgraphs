import { Address, BigInt } from '@graphprotocol/graph-ts';

import { GOVERNANCE, SEPERATOR } from '../constants';

export const getVoteId = (voter: Address, proposalId: BigInt): string =>
  [voter.toHexString(), proposalId.toString()].join(SEPERATOR);

export const getPermissionId = (
  accountAddress: Address,
  contractAddress: Address,
  functionSig: string,
): string =>
  [accountAddress.toHexString(), contractAddress.toHexString(), functionSig].join(SEPERATOR);

export const getDelegateId = (account: Address): string => account.toHexString();

export const getGovernanceId = (): string => GOVERNANCE;
