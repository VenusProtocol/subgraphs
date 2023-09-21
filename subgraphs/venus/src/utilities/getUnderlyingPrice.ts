import { Address, BigInt } from '@graphprotocol/graph-ts';

import { getTokenPriceCents } from './getTokenPriceCents';

export function getUnderlyingPrice(address: string, underlyingDecimals: i32): BigInt {
  const contractAddress = Address.fromString(address);
  const underlyingPriceCents = getTokenPriceCents(contractAddress, underlyingDecimals);

  return underlyingPriceCents;
}
