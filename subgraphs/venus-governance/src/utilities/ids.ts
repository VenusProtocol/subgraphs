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

export const getProposalId = (id: BigInt): string => id.toString();

export const getTrustedRemoteId = (id: i32): string => id.toString();
