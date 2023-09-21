import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Actions } from '../constants';

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

export const getMarketActionId = (vTokenAddress: Address, action: i32): string => {
  const actionString = Actions[action];
  return joinIds([vTokenAddress.toHexString(), actionString]);
};
