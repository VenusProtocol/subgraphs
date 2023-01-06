import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Actions } from '../constants';

const SEPERATOR = '-';

const joinIds = (idArray: Array<string>): string => idArray.join(SEPERATOR);

export const getPoolId = (comptroller: Address): string => joinIds([comptroller.toHexString()]);

export const getMarketId = (vTokenAddress: Address): string =>
  joinIds([vTokenAddress.toHexString()]);

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): string =>
  joinIds([marketAddress.toHexString(), accountAddress.toHexString()]);

export const getAccountVTokenTransactionId = (
  accountAddress: Address,
  transactionHash: Bytes,
  logIndex: BigInt,
): string =>
  joinIds([accountAddress.toHexString(), transactionHash.toHexString(), logIndex.toString()]);

export const getPoolActionId = (poolAddress: Address, action: string): string =>
  joinIds([poolAddress.toHexString(), action]);

export const getMarketActionId = (vTokenAddress: Address, action: i32): string => {
  const actionString = Actions[action];
  return joinIds([vTokenAddress.toHexString(), actionString]);
};

export const getTransactionEventId = (
  transactionHash: Bytes,
  transactionLogIndex: BigInt,
): string => joinIds([transactionHash.toHexString(), transactionLogIndex.toString()]);

export const getApprovedTransferAllowanceId = (owner: Address, spender: Address): string =>
  joinIds([owner.toHexString(), spender.toString()]);

export const getBadDebtEventId = (transactionHash: Bytes, transactionLogIndex: BigInt): string =>
  joinIds([transactionHash.toHexString(), transactionLogIndex.toString()]);
