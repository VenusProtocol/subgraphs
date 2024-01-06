import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Actions } from '../constants';

const SEPERATOR = '-';

const joinIds = (idArray: Array<string>): string => idArray.join(SEPERATOR);

export const getAccountVTokenId = (marketAddress: Address, accountAddress: Address): string =>
  joinIds([marketAddress.toHexString(), accountAddress.toHexString()]);

export const getTransactionId = (transactionHash: Bytes, logIndex: BigInt): string =>
  joinIds([transactionHash.toHexString(), logIndex.toString()]);

export const getAccountVTokenTransactionId = (
  accountVTokenId: string,
  transactionHash: Bytes,
  logIndex: BigInt,
): string => joinIds([accountVTokenId, transactionHash.toHexString(), logIndex.toString()]);

export const getMarketActionId = (vTokenAddress: Address, action: i32): string => {
  const actionString = Actions[action];
  return joinIds([vTokenAddress.toHexString(), actionString]);
};
