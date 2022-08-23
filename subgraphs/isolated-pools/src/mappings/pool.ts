import {
  ActionPaused1 as MarketActionPaused,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewBorrowCap,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewMinLiquidatableAmount,
  NewPauseGuardian,
  NewPriceOracle,
  ActionPaused as PoolActionPaused,
} from '../../generated/PoolRegistry/Comptroller';
import { VToken } from '../../generated/templates';
import { defaultMantissaFactorBigDecimal } from '../constants';
import { createMarket } from '../operations/create';
import { getPool } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateAccountVTokenTransaction,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import {
  updateOrCreateAccountVToken,
  updateOrCreateMarketAction,
  updateOrCreatePoolAction,
} from '../operations/updateOrCreate';
import Box from '../utilities/box';

export const handleMarketListed = (event: MarketListed): void => {
  // Dynamically index all new listed tokens
  const vTokenAddress = event.params.cToken;
  VToken.create(vTokenAddress);
  createMarket(vTokenAddress);
};

export const handleMarketEntered = (event: MarketEntered): void => {
  const vTokenAddress = event.params.cToken;
  const accountAddress = event.params.account;

  const market = getOrCreateMarket(vTokenAddress);
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
};

export const handleMarketExited = (event: MarketExited): void => {
  const vTokenAddress = event.params.cToken;
  const accountAddress = event.params.account;

  const market = getOrCreateMarket(vTokenAddress);
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
};

export const handleNewCloseFactor = (event: NewCloseFactor): void => {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.closeFactor = event.params.newCloseFactorMantissa;
  pool.save();
};

export const handleNewCollateralFactor = (event: NewCollateralFactor): void => {
  const vTokenAddress = event.params.cToken;
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  const market = getOrCreateMarket(vTokenAddress);
  market.collateralFactor = newCollateralFactorMantissa
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal);
  market.save();
};

export const handleNewLiquidationIncentive = (event: NewLiquidationIncentive): void => {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  pool.save();
};

export const handleNewPriceOracle = (event: NewPriceOracle): void => {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.priceOracle = event.params.newPriceOracle;
  pool.save();
};

export const handleNewPauseGuardian = (event: NewPauseGuardian): void => {
  const poolAddress = event.address;
  const pool = getPool(poolAddress);
  pool.pauseGuardian = event.params.newPauseGuardian;
  pool.save();
};

export const handlePoolActionPaused = (event: PoolActionPaused): void => {
  const poolAddress = event.address;
  const action = event.params.action as string;
  const pauseState = event.params.pauseState;
  updateOrCreatePoolAction(poolAddress, action, pauseState);
};

export const handleMarketActionPaused = (event: MarketActionPaused): void => {
  const vTokenAddress = event.params.cToken;
  const action = event.params.action as string;
  const pauseState = event.params.pauseState;
  updateOrCreateMarketAction(vTokenAddress, action, pauseState);
};

export const handleNewBorrowCap = (event: NewBorrowCap): void => {
  const vTokenAddress = event.params.cToken;
  const borrowCap = event.params.newBorrowCap;
  const market = getOrCreateMarket(vTokenAddress);
  market.borrowCap = borrowCap;
  market.save();
};

export const handleNewMinLiquidatableAmount = (event: NewMinLiquidatableAmount): void => {
  const vTokenAddress = event.params.cToken;
  const newMinLiquidatableAmount = event.params.newMinLiquidatableAmount;
  const market = getOrCreateMarket(vTokenAddress);
  market.minLiquidatableAmount = newMinLiquidatableAmount;
  market.save();
};
