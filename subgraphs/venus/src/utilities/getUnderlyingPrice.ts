import { Address, BigInt } from '@graphprotocol/graph-ts';

import { getTokenPriceCents } from './getTokenPriceCents';

export function getUnderlyingPrice(contractAddress: Address, underlyingDecimals: i32): BigInt {
  const underlyingPriceCents = getTokenPriceCents(contractAddress, underlyingDecimals);

  return underlyingPriceCents;
}
