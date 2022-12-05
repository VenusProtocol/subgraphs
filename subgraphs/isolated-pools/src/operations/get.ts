import { Address, log } from '@graphprotocol/graph-ts';

import { Market, Pool } from '../../generated/schema';
import { getMarketId } from '../utilities/ids';

export const getPool = (comptroller: Address): Pool => {
  const pool = Pool.load(comptroller.toHexString());
  if (!pool) {
    log.critical('Pool {} not found', [comptroller.toString()]);
  }
  return pool as Pool;
};

export const getMarket = (vTokenAddress: Address): Market => {
  const id = getMarketId(vTokenAddress);
  const market = Market.load(id);
  if (!market) {
    log.critical('Market {} not found', [id]);
  }
  return market as Market;
};
