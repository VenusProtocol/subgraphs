/* eslint-disable prefer-const */
// to satisfy AS compiler
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Comptroller as ComptrollerContract } from '../../generated/templates/VToken/Comptroller';
import {
  DistributedBorrowerVenus,
  DistributedSupplierVenus,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
  VenusBorrowSpeedUpdated,
  VenusSupplySpeedUpdated,
} from '../../generated/DiamondComptroller/Comptroller';
import { Comptroller } from '../../generated/schema';
import { zeroBigInt32 } from '../constants';
import { comptrollerAddress, nullAddress } from '../constants/addresses';
import { getComptroller, getMarket } from '../operations/get';
import { getOrCreateAccountVToken, getOrCreateMarket } from '../operations/getOrCreate';
import { updateXvsBorrowState } from '../operations/updateXvsBorrowState';
import { updateXvsSupplyState } from '../operations/updateXvsSupplyState';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleInitialization(block: ethereum.Block): void {
  const comptroller = new Comptroller(comptrollerAddress);
  comptroller.priceOracle = nullAddress;
  comptroller.closeFactorMantissa = zeroBigInt32;
  comptroller.liquidationIncentive = zeroBigInt32;
  comptroller.maxAssets = BigInt.fromI32(20);
  comptroller.save();
}

export function handleMarketListed(event: MarketListed): void {
  // Create the market for initial listing
  const market = getOrCreateMarket(event.params.vToken, event);
  // If the market is listed/relisted the following values are reset
  market.collateralFactorMantissa = zeroBigInt32;
  market.save();
}

export function handleMarketUnlisted(event: MarketListed): void {
  const market = getMarket(event.params.vToken)!;
  market.isListed = false;
  market.save();
}

export function handleMarketEntered(event: MarketEntered): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  const result = getOrCreateAccountVToken(event.params.account, Address.fromBytes(market.id));
  const accountVToken = result.entity;
  accountVToken.enteredMarket = true;
  accountVToken.save();
}

export function handleMarketExited(event: MarketExited): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  const result = getOrCreateAccountVToken(event.params.account, Address.fromBytes(market.id));
  const accountVToken = result.entity;
  accountVToken.enteredMarket = false;
  accountVToken.save();
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const comptroller = getComptroller();
  comptroller.closeFactorMantissa = event.params.newCloseFactorMantissa;
  comptroller.save();
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  market.collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  market.save();
}

// This should be the first event according to bscscan but it isn't.... price oracle is. weird
export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  const comptroller = getComptroller();
  comptroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  comptroller.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const comptroller = getComptroller();
  comptroller.priceOracle = event.params.newPriceOracle;
  comptroller.save();
}

export function handleXvsDistributedSupplier(event: DistributedSupplierVenus): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  // Update speeds and state
  updateXvsSupplyState(market, event);
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    event.params.venusDelta,
  );
  market.save();
}

export function handleXvsDistributedBorrower(event: DistributedBorrowerVenus): void {
  const market = getOrCreateMarket(event.params.vToken, event);
  // Update speeds and state
  updateXvsBorrowState(market, event);
  market.totalXvsDistributedMantissa = market.totalXvsDistributedMantissa.plus(
    event.params.venusDelta,
  );
  market.save();
}

export function handleVenusBorrowSpeedUpdated(event: VenusBorrowSpeedUpdated): void {
  const marketAddress = event.params.vToken;
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);
  const xvsBorrowState = comptrollerContract.venusBorrowState(marketAddress);
  const market = getMarket(marketAddress)!;
  market.xvsBorrowSpeed = event.params.newSpeed;
  market.xvsBorrowStateIndex = xvsBorrowState.getIndex();
  market.xvsBorrowStateBlock = xvsBorrowState.getBlock();
  market.save();
}

export function handleVenusSupplySpeedUpdated(event: VenusSupplySpeedUpdated): void {
  const marketAddress = event.params.vToken;
  const market = getMarket(event.params.vToken)!;
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);
  const xvsSupplyState = comptrollerContract.venusSupplyState(marketAddress);
  market.xvsSupplySpeed = event.params.newSpeed;
  market.xvsBorrowStateIndex = xvsSupplyState.getIndex();
  market.xvsBorrowStateBlock = xvsSupplyState.getBlock();
  market.save();
}
