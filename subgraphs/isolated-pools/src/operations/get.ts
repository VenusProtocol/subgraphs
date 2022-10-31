import { Address, log } from '@graphprotocol/graph-ts';
import { Market, Pool } from '../../generated/schema';

export const getPool = (comptroller: Address): Pool => {
  const pool = Pool.load(comptroller.toHexString());
  if (!pool) {
    log.critical('Pool {} not found', [comptroller.toString()]);
  }
  return pool as Pool;
};

export const getMarket = (vTokenAddress: Address): Market => {
  const market = Market.load(vTokenAddress.toHexString());
  if (!market) {
    log.critical('Market {} not found', [vTokenAddress.toHexString()]);
  }
  return market as Market;
};
