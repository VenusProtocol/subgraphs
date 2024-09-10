import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { GOVERNANCE } from '../constants';
import { omnichainProposalSenderAddress } from '../constants/addresses';

export const getVoteId = (voter: Address, proposalId: BigInt): Bytes =>
  voter.concatI32(proposalId.toI32());

export const getRoleId = (account: Address, role: Bytes): Bytes => account.concat(role);

export const getDelegateId = (account: Address): Bytes => account;

export const getGovernanceId = (): string => GOVERNANCE;

export const getOmnichainProposalSenderId = (): Bytes => omnichainProposalSenderAddress;

export const getProposalId = (id: BigInt): string => id.toString();

export const getTrustedRemoteId = (id: i32): Bytes => Bytes.fromI32(id);

export const getMaxDailyLimitId = (id: i32): Bytes => Bytes.fromI32(id);
