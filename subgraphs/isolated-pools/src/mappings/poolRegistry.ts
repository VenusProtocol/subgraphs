import { log } from '@graphprotocol/graph-ts';

import {
  MarketAdded,
  PoolMetadataUpdated,
  PoolNameSet,
  PoolRegistered,
} from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { Pool as PoolDataSource } from '../../generated/templates';
import { createPool } from '../operations/create';
import { getOrCreateMarket } from '../operations/getOrCreate';
import { updatePoolMetadata } from '../operations/update';
import { getPoolId } from '../utilities/ids';

export function handlePoolRegistered(event: PoolRegistered): void {
  // Create data source
  PoolDataSource.create(event.params.comptroller);
  createPool(event.params.comptroller);
}

export function handlePoolNameSet(event: PoolNameSet): void {
  const comptroller = event.params.comptroller;
  const pool = Pool.load(getPoolId(comptroller));
  if (pool) {
    pool.name = event.params.newName;
    pool.save();
  } else {
    log.critical('Unable to fetch pool with comptroller: {}', [
      event.params.comptroller.toHexString(),
    ]);
  }
}

export function handleMarketAdded(event: MarketAdded): void {
  // Dynamically index all new listed tokens
  const vTokenAddress = event.params.vTokenAddress;
  const comptroller = event.params.comptroller;
  getOrCreateMarket(vTokenAddress, comptroller, event.block.number);
}

export function handlePoolMetadataUpdated(event: PoolMetadataUpdated): void {
  updatePoolMetadata(event.params.comptroller, event.params.newMetadata);
}
