import {
  PoolNameSet,
  PoolRegistered,
  PoolRegistry as PoolRegistryContract,
} from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { poolRegistryAddress } from '../constants';

export const handlePoolRegistered = (event: PoolRegistered): void => {
  const pool = new Pool(event.params.pool.comptroller.toHexString());
  pool.save();
  // Fetch metadata from lens
};

export const handlePoolNameSet = (event: PoolNameSet): void => {
  const poolIndex = event.params.index;
  const poolRegistryContract = PoolRegistryContract.bind(poolRegistryAddress);
  const poolData = poolRegistryContract.getPoolByID(poolIndex);
  const pool = Pool.load(poolData.comptroller.toHexString());
  if (pool) {
    pool.name = event.params.name;
    pool.save();
  }
};
