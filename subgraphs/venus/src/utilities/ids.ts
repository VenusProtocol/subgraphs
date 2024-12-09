import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

export const getMarketPositionId = (accountAddress: Address, marketAddress: Address): Bytes =>
  accountAddress.concat(marketAddress);

export const getTransactionId = (transactionHash: Bytes, logIndex: BigInt): Bytes =>
  transactionHash.concatI32(logIndex.toI32());

export const getMarketPositionTransactionId = (
  marketPositionId: Bytes,
  transactionHash: Bytes,
  logIndex: BigInt,
): Bytes => marketPositionId.concat(transactionHash).concatI32(logIndex.toI32());

export const getMarketActionId = (vTokenAddress: Address, action: i32): Bytes =>
  vTokenAddress.concatI32(action);

export const getMarketId = (vTokenAddress: Address): Bytes => vTokenAddress;
