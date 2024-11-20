import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): Bytes => marketAddress.concat(accountAddress);

export const getTransactionId = (transactionHash: Bytes, logIndex: BigInt): Bytes => transactionHash.concatI32(logIndex.toI32());

export const getAccountVTokenTransactionId = (accountVTokenId: Bytes, transactionHash: Bytes, logIndex: BigInt): Bytes => accountVTokenId.concat(transactionHash).concatI32(logIndex.toI32());

export const getMarketActionId = (vTokenAddress: Address, action: i32): Bytes => vTokenAddress.concatI32(action);

export const getMarketId = (vTokenAddress: Address): Bytes => vTokenAddress;
