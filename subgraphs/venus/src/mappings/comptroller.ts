/* eslint-disable prefer-const */
// to satisfy AS compiler
import { Address } from '@graphprotocol/graph-ts';

import {
  DistributedSupplierVenus,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from '../../generated/DiamondComptroller/Comptroller';
import { zeroBigInt32 } from '../constants';
import { getMarket } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateComptroller,
  getOrCreateMarket,
} from '../operations/getOrCreate';

export function handleMarketListed(event: MarketListed): void {
  // Create the market for initial listing
  const market = getOrCreateMarket(event.params.vToken, event);
  // If the market is listed/relisted the following values are reset
  market.collateralFactorMantissa = zeroBigInt32;
  market.xvsBorrowStateBlock = event.block.number;
  market.xvsSupplyStateBlock = event.block.number;
  market.save();
}

export function handleMarketUnlisted(event: MarketListed): void {
  const market = getMarket(event.params.vToken)!;
  market.isListed = false;
  market.save();
}

export function handleMarketEntered(event: MarketEntered): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  getOrCreateAccount(event.params.account);
  const result = getOrCreateAccountVToken(Address.fromBytes(market.id), event.params.account);
  const accountVToken = result.entity;
  accountVToken.enteredMarket = true;
  accountVToken.save();
}

export function handleMarketExited(event: MarketExited): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  getOrCreateAccount(event.params.account);
  const result = getOrCreateAccountVToken(Address.fromBytes(market.id), event.params.account);
  const accountVToken = result.entity;
  accountVToken.enteredMarket = false;
  accountVToken.save();
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const comptroller = getOrCreateComptroller();
  comptroller.closeFactor = event.params.newCloseFactorMantissa;
  comptroller.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  market.collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  market.save();
}

// This should be the first event according to bscscan but it isn't.... price oracle is. weird
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
  const market = getOrCreateMarket(event.params.vToken, event);
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    event.params.venusDelta,
  );
  market.save();
}
