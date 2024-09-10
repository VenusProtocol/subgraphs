import { Address, log } from '@graphprotocol/graph-ts';

import { Market } from '../../generated/schema';

export const getMarket = (vTokenAddress: Address): Market | null => {
  const market = Market.load(vTokenAddress);
  if (!market) {
    log.error('Market {} not found', [vTokenAddress.toHexString()]);
  }
  return market;
};
