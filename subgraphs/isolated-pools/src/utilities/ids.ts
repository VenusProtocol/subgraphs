import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

const SEPERATOR = '-';

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): string =>
  [marketAddress.toHexString(), accountAddress.toHexString()].join(SEPERATOR);

export const getAccountVTokenTransactionId = (
  accountAddress: Address,
  transactionHash: Bytes,
  logIndex: BigInt,
): string =>
  [accountAddress.toHexString(), transactionHash.toHexString(), logIndex.toString()].join(
    SEPERATOR,
  );

export const getPoolActionId = (poolAddress: Address, action: string): string =>
  [poolAddress.toHexString(), action].join(SEPERATOR);

export const getMarketActionId = (vTokenAddress: Address, action: string): string =>
  [vTokenAddress.toHexString(), action].join(SEPERATOR);

export const getTransactionEventId = (
  transactionHash: Bytes,
  transactionLogIndex: BigInt,
): string => [transactionHash.toHexString(), transactionLogIndex.toString()].join(SEPERATOR);
