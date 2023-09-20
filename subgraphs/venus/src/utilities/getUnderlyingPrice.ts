import { Address } from '@graphprotocol/graph-ts';

import { getTokenPriceCents } from './getTokenPriceCents';

export function getUnderlyingPrice(address: string, underlyingDecimals: i32): i32 {
  const contractAddress = Address.fromString(address);
  const underlyingPriceCents = getTokenPriceCents(contractAddress, underlyingDecimals);

  return underlyingPriceCents;
}
