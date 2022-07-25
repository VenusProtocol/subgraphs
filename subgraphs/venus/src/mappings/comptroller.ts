/* eslint-disable prefer-const */
// to satisfy AS compiler
import { log } from '@graphprotocol/graph-ts';

import {
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from '../../generated/Comptroller/Comptroller';
import { Account, Comptroller, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates';
import {
  createAccount,
  ensureComptrollerSynced,
  mantissaFactorBD,
  updateCommonVTokenStats,
} from './helpers';
import { createMarket } from './markets';

export function handleMarketListed(event: MarketListed): void {
  // Dynamically index all new listed tokens
  VToken.create(event.params.vToken);
  // Create the market for this token, since it's now been listed.
  let market = createMarket(event.params.vToken.toHexString());
  market.save();
};

export function handleMarketEntered(event: MarketEntered): void {
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
  vTokenStats.enteredMarket = true;
  vTokenStats.save();
};

export function handleMarketExited(event: MarketExited): void {
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

export function handleNewCloseFactor(event: NewCloseFactor): void {
  let comptroller = Comptroller.load('1');
  if (comptroller == null) {
    comptroller = new Comptroller('1');
  }
  comptroller.closeFactor = event.params.newCloseFactorMantissa;
  comptroller.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = Market.load(event.params.vToken.toHexString());
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (market != null) {
    market.collateralFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(mantissaFactorBD);
    market.save();
  }
};

// This should be the first event acccording to bscscan but it isn't.... price oracle is. weird
export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let comptroller = Comptroller.load('1');
  if (comptroller == null) {
    comptroller = new Comptroller('1');
  }
  comptroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  comptroller.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let comptroller = Comptroller.load('1');
  // This is the first event used in this mapping, so we use it to create the entity
  if (comptroller == null) {
    comptroller = new Comptroller('1');
  }
  comptroller.priceOracle = event.params.newPriceOracle;
  comptroller.save();
}
