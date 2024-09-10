import { Address, log } from '@graphprotocol/graph-ts';

import { Market, Pool } from '../../generated/schema';
import { getMarketId, getPoolId } from '../utilities/ids';

export const getPool = (comptroller: Address): Pool | null => {
  const pool = Pool.load(getPoolId(comptroller));
  if (!pool) {
    log.error('Pool {} not found', [comptroller.toString()]);
  }
  return pool as Pool;
};

export const getMarket = (vTokenAddress: Address): Market | null => {
  const id = getMarketId(vTokenAddress);
  const market = Market.load(id);
  if (!market) {
    log.error('Market {} not found', [id.toHexString()]);
  }
  return market;
};
