import { log } from '@graphprotocol/graph-ts';

import {
  MarketAdded,
  PoolMetadataUpdated,
  PoolNameSet,
  PoolRegistered,
} from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { Pool as PoolDataSource, VToken as VTokenDataSource } from '../../generated/templates';
import { createMarket, createPool } from '../operations/create';
import { updatePoolMetadata } from '../operations/update';

export function handlePoolRegistered(event: PoolRegistered): void {
  // Create data source
  PoolDataSource.create(event.params.comptroller);
  const pool = createPool(event.params.comptroller);
  // Sometimes the pool doesn't get created and is set with defaults
  // So we'll make sure we grab at least the block info for debugging
  pool.blockPosted = event.block.timestamp;
  pool.timestampPosted = event.block.number;
}

export function handlePoolNameSet(event: PoolNameSet): void {
  const comptroller = event.params.comptroller;
  const pool = Pool.load(comptroller.toHexString());
  if (pool) {
    pool.name = event.params.name;
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
  VTokenDataSource.create(vTokenAddress);
  createMarket(comptroller, vTokenAddress);
}

export function handlePoolMetadataUpdated(event: PoolMetadataUpdated): void {
  updatePoolMetadata(event.params.comptroller, event.params.newMetadata);
}
