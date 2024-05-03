import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Actions } from '../constants';

export const getMarketId = (marketAddress: Address): Bytes => marketAddress;

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): Bytes =>
  marketAddress.concat(accountAddress);

export const getTransactionId = (transactionHash: Bytes, logIndex: BigInt): Bytes =>
  transactionHash.concatI32(logIndex);

export const getAccountVTokenTransactionId = (
  accountVTokenId: Bytes,
  transactionHash: Bytes,
  logIndex: BigInt,
): Bytes => accountVTokenId.concat(transactionHash).concatI32(logIndex);

export const getMarketActionId = (vTokenAddress: Address, action: i32): Bytes => {
  const actionString = Actions[action];
  return vTokenAddress.concatI32(actionString);
};
