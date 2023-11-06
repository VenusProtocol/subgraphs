import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { GOVERNANCE, SEPERATOR } from '../constants';

export const getVoteId = (voter: Address, proposalId: BigInt): Bytes =>
  voter.concatI32(proposalId.toI32());

export const getPermissionId = (
  accountAddress: Address,
  contractAddress: Address,
  functionSig: string,
): string =>
  [accountAddress.toHexString(), contractAddress.toHexString(), functionSig].join(SEPERATOR);

export const getRoleId = (role: Bytes, account: Address, sender: Address): string =>
  [role.toHexString(), account.toHexString(), sender.toHexString()].join(SEPERATOR);

export const getDelegateId = (account: Address): Bytes => account;

export const getGovernanceId = (): string => GOVERNANCE;

export const getProposalId = (id: BigInt): string => id.toString();

export const getTrustedRemoteId = (id: i32): string => id.toString();
