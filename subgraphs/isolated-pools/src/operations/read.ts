import { Address, log } from '@graphprotocol/graph-ts';

import { Pool } from '../../generated/schema';

export const readPool = (poolAddress: Address): Pool => {
  const pool = Pool.load(poolAddress.toHexString());
  if (!pool) {
    log.critical('Pool {} not found', [poolAddress.toHexString()]);
  }
  return pool as Pool;
};
