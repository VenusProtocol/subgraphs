import { Address, Bytes } from '@graphprotocol/graph-ts';

export const getPositionId = (accountAddress: Address, tokenAddress: Address): Bytes =>
  accountAddress.concat(tokenAddress);
