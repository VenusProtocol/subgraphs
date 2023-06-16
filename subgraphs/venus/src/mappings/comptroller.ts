/* eslint-disable prefer-const */
// to satisfy AS compiler
import { BigInt, log } from '@graphprotocol/graph-ts';

import {
  DistributedSupplierVenus,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from '../../generated/Comptroller/Comptroller';
import { Account, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates';
import { createAccount, createMarket } from '../operations/create';
import { getOrCreateComptroller } from '../operations/getOrCreate';
import { updateCommonVTokenStats } from '../operations/update';
import { ensureComptrollerSynced } from '../utilities';
import { mantissaFactorBigDecimal } from '../constants';

export const handleMarketListed = (event: MarketListed): void => {
  // Dynamically index all new listed tokens
  VToken.create(event.params.vToken);
  // Create the market for this token, since it's now been listed.
  let market = createMarket(event.params.vToken.toHexString());
  market.save();
};

export const handleMarketEntered = (event: MarketEntered): void => {
  let market = Market.load(event.params.vToken.toHexString());
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (!market) {
    log.debug('[handleMarketEntered] market null: {}', [event.params.vToken.toHexString()]);
    ensureComptrollerSynced(event.block.number.toI32(), event.block.timestamp.toI32());
    market = Market.load(event.params.vToken.toHexString());
  }

  if (!market) {
    log.debug('[handleMarketEntered] market still null, return...', []);
    return;
  }

  let accountId = event.params.account.toHex();
  let account = Account.load(accountId);
  if (account == null) {
    createAccount(accountId);
  }

  let vTokenStats = updateCommonVTokenStats(
    market.id,
    market.symbol,
    accountId,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
  );
  vTokenStats.enteredMarket = true;
  vTokenStats.save();
};

export const handleMarketExited = (event: MarketExited): void => {
  let market = Market.load(event.params.vToken.toHexString());
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (!market) {
    log.debug('[handleMarketExited] market null: {}', [event.params.vToken.toHexString()]);
    ensureComptrollerSynced(event.block.number.toI32(), event.block.timestamp.toI32());
    market = Market.load(event.params.vToken.toHexString());
  }

  if (!market) {
    log.debug('[handleMarketExited] market still null, return...', []);
    return;
  }

  let accountID = event.params.account.toHex();
  let account = Account.load(accountID);
  if (account == null) {
    createAccount(accountID);
  }

  let vTokenStats = updateCommonVTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
  );
  vTokenStats.enteredMarket = false;
  vTokenStats.save();
};

export const handleNewCloseFactor = (event: NewCloseFactor): void => {
  const comptroller = getOrCreateComptroller();
  comptroller.closeFactor = event.params.newCloseFactorMantissa;
  comptroller.save();
};

export const handleNewCollateralFactor = (event: NewCollateralFactor): void => {
  let market = Market.load(event.params.vToken.toHexString());
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (market != null) {
    market.collateralFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(mantissaFactorBigDecimal);
    market.save();
  }
};

// This should be the first event acccording to bscscan but it isn't.... price oracle is. weird
export const handleNewLiquidationIncentive = (event: NewLiquidationIncentive): void => {
  const comptroller = getOrCreateComptroller();
  comptroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  comptroller.save();
};

export const handleNewPriceOracle = (event: NewPriceOracle): void => {
  const comptroller = getOrCreateComptroller();
  comptroller.priceOracle = event.params.newPriceOracle;
  comptroller.save();
};

// Also handles DistributedBorrowerVenus with same signature
export function handleXvsDistributed(event: DistributedSupplierVenus): void {
  let vTokenAddress = event.params.vToken.toHex();
  let venusDelta = event.params.venusDelta.toHex();
  let market = Market.load(vTokenAddress);
  if (market == null) {
    market = createMarket(vTokenAddress);
  }
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    BigInt.fromString(venusDelta),
  );
}
