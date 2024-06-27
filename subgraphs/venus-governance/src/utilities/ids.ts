import { Address, BigInt, ByteArray, Bytes } from '@graphprotocol/graph-ts';

import { GOVERNANCE } from '../constants';
import { omnichainProposalSenderAddress } from '../constants/addresses';

export const getVoteId = (voter: Address, proposalId: BigInt): Bytes =>
  voter.concatI32(proposalId.toI32());

export const getPermissionId = (
  accountAddress: Address,
  contractAddress: Address,
  functionSig: string,
): Bytes =>
  accountAddress
    .concat(contractAddress)
    .concat(Bytes.fromByteArray(ByteArray.fromUTF8(functionSig)));

export const getRoleId = (role: Bytes, account: Address, sender: Address): Bytes =>
  role.concat(account).concat(sender);

export const getDelegateId = (account: Address): Bytes => account;

export const getGovernanceId = (): string => GOVERNANCE;

export const getOmnichainProposalSenderId = (): Bytes => omnichainProposalSenderAddress;

export const getProposalId = (id: BigInt): string => id.toString();

export const getTrustedRemoteId = (id: i32): Bytes => Bytes.fromI32(id);

export const getMaxDailyLimitId = (id: i32): Bytes => Bytes.fromI32(id);
