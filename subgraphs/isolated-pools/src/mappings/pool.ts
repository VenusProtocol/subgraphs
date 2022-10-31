import {
  ActionPaused1 as MarketActionPaused,
  MarketEntered,
  MarketExited,
  NewBorrowCap,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewMinLiquidatableAmount,
  NewPriceOracle,
  ActionPaused as PoolActionPaused,
} from '../../generated/PoolRegistry/Comptroller';
import { defaultMantissaFactorBigDecimal } from '../constants';
import { getMarket, getPool } from '../operations/get';
import { getOrCreateAccount, getOrCreateAccountVTokenTransaction } from '../operations/getOrCreate';
import {
  updateOrCreateAccountVToken,
  updateOrCreateMarketAction,
  updateOrCreatePoolAction,
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
  const pool = getPool(poolAddress);
  pool.closeFactor = event.params.newCloseFactorMantissa;
  pool.save();
}

export const handleNewCollateralFactor = (event: NewCollateralFactor): void => {
  const vTokenAddress = event.params.vToken;
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  const market = getMarket(vTokenAddress);
  market.collateralFactor = newCollateralFactorMantissa
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal);
  market.save();
};

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  pool.save();
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.priceOracle = event.params.newPriceOracle;
  pool.save();
}

export function handlePoolActionPaused(event: PoolActionPaused): void {
  const poolAddress = event.address;
  const action = event.params.action as string;
  const pauseState = event.params.pauseState;
  updateOrCreatePoolAction(poolAddress, action, pauseState);
}

export function handleMarketActionPaused(event: MarketActionPaused): void {
  const vTokenAddress = event.params.vToken;
  const action = event.params.action as string;
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

export function handleNewMinLiquidatableAmount(event: NewMinLiquidatableAmount): void {
  const vTokenAddress = event.params.vToken;
  const newMinLiquidatableAmount = event.params.newMinLiquidatableAmount;
  const market = getMarket(vTokenAddress);
  market.minLiquidatableAmount = newMinLiquidatableAmount;
  market.save();
}
