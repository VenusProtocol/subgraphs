import {
  PoolNameSet,
  PoolRegistered,
  PoolRegistry as PoolRegistryContract,
} from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { Pool as PoolContract } from '../../generated/templates';
import { poolRegistryAddress } from '../constants/addresses';
import { createPool } from '../operations/create';

export const handlePoolRegistered = (event: PoolRegistered): void => {
  createPool(event);
};

export const handlePoolNameSet = (event: PoolNameSet): void => {
  const poolIndex = event.params.index;
  const poolRegistryContract = PoolRegistryContract.bind(poolRegistryAddress);
  const poolData = poolRegistryContract.getPoolByID(poolIndex);
  PoolContract.create(poolData.comptroller);
  const pool = Pool.load(poolData.comptroller.toHexString());
  if (pool) {
    pool.name = event.params.name;
    pool.save();
  }
};
