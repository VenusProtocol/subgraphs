/* eslint-disable prefer-const */
// to satisfy AS compiler
import { log } from '@graphprotocol/graph-ts';

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
import { Market } from '../../generated/schema';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateAccountVTokenTransaction,
  getOrCreateComptroller,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import { ensureComptrollerSynced } from '../utilities';

export function handleMarketListed(event: MarketListed): void {
  getOrCreateMarket(event.params.vToken.toHexString());
}

export function handleMarketEntered(event: MarketEntered): void {
  const marketId = event.params.vToken.toHexString();
  let market = Market.load(marketId);
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (!market) {
    log.debug('[handleMarketEntered] market null: {}', [marketId]);
    ensureComptrollerSynced(event.block.number.toI32(), event.block.timestamp.toI32());
    market = Market.load(marketId);
  }

  if (!market) {
    log.debug('[handleMarketEntered] market still null, return...', []);
    return;
  }

  const accountId = event.params.account.toHex();
  const account = getOrCreateAccount(accountId);

  const accountVToken = getOrCreateAccountVToken(market.id, account.id);
  accountVToken.accrualBlockNumber = event.block.number;
  accountVToken.enteredMarket = true;
  accountVToken.save();

  getOrCreateAccountVTokenTransaction(market.id, account.id, event);
}

export function handleMarketExited(event: MarketExited): void {
  const marketId = event.params.vToken.toHexString();
  let market = Market.load(marketId);
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (!market) {
    log.debug('[handleMarketExited] market null: {}', [marketId]);
    ensureComptrollerSynced(event.block.number.toI32(), event.block.timestamp.toI32());
    market = Market.load(marketId);
  }

  if (!market) {
    log.debug('[handleMarketExited] market still null, return...', []);
    return;
  }

  const accountID = event.params.account.toHex();
  const account = getOrCreateAccount(accountID);

  const accountVToken = getOrCreateAccountVToken(market.id, account.id);
  accountVToken.accrualBlockNumber = event.block.number;
  accountVToken.enteredMarket = false;
  accountVToken.save();

  getOrCreateAccountVTokenTransaction(market.id, account.id, event);
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const comptroller = getOrCreateComptroller();
  comptroller.closeFactor = event.params.newCloseFactorMantissa;
  comptroller.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const market = Market.load(event.params.vToken.toHexString());
  // Null check needed to avoid crashing on a new market added. Ideally when dynamic data
  // sources can source from the contract creation block and not the time the
  // comptroller adds the market, we can avoid this altogether
  if (!market) {
    return;
  }
  market.collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  market.save();
}

// This should be the first event acccording to bscscan but it isn't.... price oracle is. weird
export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  const comptroller = getOrCreateComptroller();
  comptroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  comptroller.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const comptroller = getOrCreateComptroller();
  comptroller.priceOracle = event.params.newPriceOracle;
  comptroller.save();
}

// Also handles DistributedBorrowerVenus with same signature
export function handleXvsDistributed(event: DistributedSupplierVenus): void {
  const market = getOrCreateMarket(event.params.vToken.toHexString());
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    event.params.venusDelta,
  );
  market.save();
}
