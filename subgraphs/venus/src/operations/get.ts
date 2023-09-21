import { Address, log } from '@graphprotocol/graph-ts';

import { Market } from '../../generated/schema';
import { getMarketId } from '../utilities/ids'

export const getMarket = (vTokenAddress: Address): Market | null => {
  const id = getMarketId(vTokenAddress);
  const market = Market.load(id);
  if (!market) {
    log.error('Market {} not found', [id]);
  }
  return market;
};
