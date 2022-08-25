import { Address, log } from '@graphprotocol/graph-ts';

import { Market, Pool } from '../../generated/schema';

export const getPool = (poolAddress: Address): Pool => {
  const pool = Pool.load(poolAddress.toHexString());
  if (!pool) {
    log.critical('Pool {} not found', [poolAddress.toHexString()]);
  }
  return pool as Pool;
};

export const getMarket = (vTokenAddress: Address): Market => {
  const market = Market.load(vTokenAddress.toHexString());
  if (!market) {
    log.critical('Pool {} not found', [vTokenAddress.toHexString()]);
  }
  return market as Market;
};
