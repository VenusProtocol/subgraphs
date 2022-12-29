import {
  ActionPausedMarket,
  MarketEntered,
  MarketExited,
  NewBorrowCap,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewMinLiquidatableCollateral,
  NewPriceOracle,
  NewSupplyCap,
} from '../../generated/PoolRegistry/Comptroller';
import { defaultMantissaFactorBigDecimal } from '../constants';
import { getMarket } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateAccountVTokenTransaction,
  getOrCreateMarket,
  getOrCreatePool,
} from '../operations/getOrCreate';
import {
  updateOrCreateAccountVToken,
  updateOrCreateMarketAction,
} from '../operations/updateOrCreate';
import Box from '../utilities/box';

export function handleMarketEntered(event: MarketEntered): void {
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  const market = getMarket(vTokenAddress);
  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(
    accountAddress,
    vTokenAddress,
    market.symbol,
    event.block.number,
    new Box(true),
  );
  getOrCreateAccountVTokenTransaction(
    accountAddress,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
  );
}

export function handleMarketExited(event: MarketExited): void {
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  const market = getMarket(vTokenAddress);
  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(
    accountAddress,
    vTokenAddress,
    market.symbol,
    event.block.number,
    new Box(false),
  );
  getOrCreateAccountVTokenTransaction(
    accountAddress,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
  );
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.closeFactor = event.params.newCloseFactorMantissa;
    pool.save();
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  const market = getOrCreateMarket(poolAddress, vTokenAddress);
  market.collateralFactor = newCollateralFactorMantissa
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal);
  market.save();
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
    pool.save();
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.priceOracle = event.params.newPriceOracle;
    pool.save();
  }
}

export function handleActionPausedMarket(event: ActionPausedMarket): void {
  const vTokenAddress = event.params.vToken;
  const action = event.params.action;
  const pauseState = event.params.pauseState;
  updateOrCreateMarketAction(vTokenAddress, action, pauseState);
}

export function handleNewBorrowCap(event: NewBorrowCap): void {
  const vTokenAddress = event.params.vToken;
  const borrowCap = event.params.newBorrowCap;
  const market = getMarket(vTokenAddress);
  market.borrowCap = borrowCap;
  market.save();
}

export function handleNewMinLiquidatableCollateral(event: NewMinLiquidatableCollateral): void {
  const poolAddress = event.address;
  const newMinLiquidatableCollateral = event.params.newMinLiquidatableCollateral;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.minLiquidatableCollateral = newMinLiquidatableCollateral;
    pool.save();
  }
}

export function handleNewSupplyCap(event: NewSupplyCap): void {
  const vTokenAddress = event.params.vToken;
  const newSupplyCap = event.params.newSupplyCap;
  const market = getMarket(vTokenAddress);
  market.supplyCap = newSupplyCap;
  market.save();
}
