import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

const SEPERATOR = '-';

const joinIds = (idArray: Array<string>): string => idArray.join(SEPERATOR);

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

export const getMarketActionId = (vTokenAddress: Address, action: string): string =>
  joinIds([vTokenAddress.toHexString(), action]);

export const getTransactionEventId = (
  transactionHash: Bytes,
  transactionLogIndex: BigInt,
): string => joinIds([transactionHash.toHexString(), transactionLogIndex.toString()]);
