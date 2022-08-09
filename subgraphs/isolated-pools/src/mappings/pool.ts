import {
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from '../../generated/PoolRegistry/Comptroller';
import { CToken } from '../../generated/templates';
import { defaultMantissaFactorBigDecimal } from '../constants';
import { createMarket } from '../operations/create';
import {
  getOrCreateAccount,
  getOrCreateAccountVTokenTransaction,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import { updateOrCreateAccountVToken } from '../operations/updateOrCreate';
import { readPool } from '../operations/read';
import Box from '../utilities/box';

export const handleMarketListed = (event: MarketListed): void => {
  // Dynamically index all new listed tokens
  const cTokenAddress = event.params.cToken;
  CToken.create(cTokenAddress);
  createMarket(cTokenAddress);
};

export const handleMarketEntered = (event: MarketEntered): void => {
  const cTokenAddress = event.params.cToken;
  const accountAddress = event.params.account;

  const market = getOrCreateMarket(cTokenAddress);
  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(
    accountAddress,
    cTokenAddress,
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
  const cTokenAddress = event.params.cToken;
  const accountAddress = event.params.account;

  const market = getOrCreateMarket(cTokenAddress);
  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(
    accountAddress,
    cTokenAddress,
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
  const pool = readPool(poolAddress);
  pool.closeFactor = event.params.newCloseFactorMantissa;
  pool.save();
};

export const handleNewCollateralFactor = (event: NewCollateralFactor): void => {
  const cTokenAddress = event.params.cToken;
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  const market = getOrCreateMarket(cTokenAddress);
  market.collateralFactor = newCollateralFactorMantissa
    .toBigDecimal()
    .div(defaultMantissaFactorBigDecimal);
  market.save();
};

export const handleNewLiquidationIncentive = (event: NewLiquidationIncentive): void => {
  const poolAddress = event.address;
  const pool = readPool(poolAddress);
  pool.liquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  pool.save();
};

export const handleNewPriceOracle = (event: NewPriceOracle): void => {
  const poolAddress = event.address;
  const pool = readPool(poolAddress);
  pool.priceOracle = event.params.newPriceOracle;
  pool.save();
};

export const handleNewPauseGuardian = (): void => {}; // eslint-disable-line

export const handleGlobalActionPaused = (): void => {}; // eslint-disable-line

export const handleMarketActionPaused = (): void => {}; // eslint-disable-line

export const handleNewBorrowCap = (): void => {}; // eslint-disable-line

export const handleNewBorrowCapGuardian = (): void => {}; // eslint-disable-line

export const handleNewMinLiquidatableAmount = (): void => {}; // eslint-disable-line
