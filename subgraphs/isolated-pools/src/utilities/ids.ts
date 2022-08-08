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
