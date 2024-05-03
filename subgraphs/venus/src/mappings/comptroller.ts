/* eslint-disable prefer-const */
// to satisfy AS compiler
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
import { createAccountVTokenTransaction, createMarket } from '../operations/create';
import { getMarket } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateComptroller,
} from '../operations/getOrCreate';

export function handleMarketListed(event: MarketListed): void {
  createMarket(event.params.vToken, event);
}

export function handleMarketEntered(event: MarketEntered): void {
  const market = getMarket(event.params.vToken);
  const account = getOrCreateAccount(event.params.account.toHex());
  const accountVToken = getOrCreateAccountVToken(market.id, market.symbol, account.id, event);
  accountVToken.enteredMarket = true;
  accountVToken.save();

  createAccountVTokenTransaction(accountVToken.id, event);
}

export function handleMarketExited(event: MarketExited): void {
  const market = getMarket(event.params.vToken);
  const account = getOrCreateAccount(event.params.account.toHex());
  const accountVToken = getOrCreateAccountVToken(market.id, market.symbol, account.id, event);
  accountVToken.enteredMarket = false;
  accountVToken.save();

  createAccountVTokenTransaction(accountVToken.id, event);
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const comptroller = getOrCreateComptroller();
  comptroller.closeFactor = event.params.newCloseFactorMantissa;
  comptroller.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const market = getMarket(event.params.vToken);
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
  const market = getMarket(event.params.vToken);
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    event.params.venusDelta,
  );
  market.save();
}
