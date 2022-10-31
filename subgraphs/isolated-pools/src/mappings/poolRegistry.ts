import { log } from '@graphprotocol/graph-ts';

import { MarketAdded, PoolMetadataUpdated, PoolNameSet, PoolRegistered } from '../../generated/PoolRegistry/PoolRegistry';
import { Pool } from '../../generated/schema';
import { VToken } from '../../generated/templates';
import { createPool, createMarket } from '../operations/create';
import { updatePoolMetadata } from '../operations/update'

export function handlePoolRegistered(event: PoolRegistered): void {
  createPool(event);
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
  VToken.create(vTokenAddress);
  createMarket(comptroller, vTokenAddress);
}

export function handlePoolMetadataUpdated(event: PoolMetadataUpdated): void {
  updatePoolMetadata(event.params.comptroller, event.params.newMetadata)
}
