import { PoolNameSet, PoolRegistered } from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { createPool } from '../operations/create';

export function handlePoolRegistered(event: PoolRegistered): void {
  createPool(event);
}

export function handlePoolNameSet(event: PoolNameSet): void {
  const comptroller = event.params.comptroller;
  const pool = Pool.load(comptroller.toHexString());
  if (pool) {
    pool.name = event.params.name;
    pool.save();
  }
}
