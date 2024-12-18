import {
  ActionPausedMarket,
  MarketEntered,
  MarketExited,
  MarketSupported,
  MarketUnlisted,
  NewBorrowCap,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewLiquidationThreshold,
  NewMinLiquidatableCollateral,
  NewPriceOracle,
  NewRewardsDistributor,
  NewSupplyCap,
} from '../../generated/PoolRegistry/Comptroller';
import { RewardsDistributor as RewardsDistributorDataSource } from '../../generated/templates';
import { zeroBigInt32 } from '../constants';
import { getMarket } from '../operations/get';
import {
  getOrCreateAccount,
  getOrCreateMarket,
  getOrCreatePool,
  getOrCreateRewardDistributor,
} from '../operations/getOrCreate';
import {
  updateOrCreateMarketPosition,
  updateOrCreateMarketAction,
} from '../operations/updateOrCreate';
import Box from '../utilities/box';

export function handleMarketSupported(event: MarketSupported): void {
  const comptroller = event.address;
  const market = getOrCreateMarket(event.params.vToken, comptroller, event.block.number);
  if (market) {
    market.isListed = true;
    market.collateralFactorMantissa = zeroBigInt32;
    market.liquidationThresholdMantissa = zeroBigInt32;
    market.save();
  }
}

export function handleMarketUnlisted(event: MarketUnlisted): void {
  const market = getMarket(event.params.vToken);
  if (market) {
    market.isListed = false;
    market.save();
  }
}

export function handleMarketEntered(event: MarketEntered): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  getOrCreateAccount(accountAddress);

  updateOrCreateMarketPosition(
    accountAddress,
    vTokenAddress,
    poolAddress,
    event.block.number,
    new Box(true),
  );
}

export function handleMarketExited(event: MarketExited): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  getOrCreateAccount(accountAddress);

  updateOrCreateMarketPosition(
    accountAddress,
    vTokenAddress,
    poolAddress,
    event.block.number,
    new Box(false),
  );
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.closeFactorMantissa = event.params.newCloseFactorMantissa;
    pool.save();
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const newCollateralFactorMantissa = event.params.newCollateralFactorMantissa;
  const market = getOrCreateMarket(vTokenAddress, poolAddress, event.block.number);
  if (market) {
    market.collateralFactorMantissa = newCollateralFactorMantissa;
    market.save();
  }
}

export function handleNewLiquidationThreshold(event: NewLiquidationThreshold): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const market = getOrCreateMarket(vTokenAddress, poolAddress, event.block.number);
  if (market) {
    market.liquidationThresholdMantissa = event.params.newLiquidationThresholdMantissa;
    market.save();
  }
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.liquidationIncentiveMantissa = event.params.newLiquidationIncentiveMantissa;
    pool.save();
  }
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const poolAddress = event.address;
  const pool = getOrCreatePool(poolAddress);
  if (pool) {
    pool.priceOracleAddress = event.params.newPriceOracle;
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
  if (market) {
    market.borrowCapMantissa = borrowCap;
    market.save();
  }
}

export function handleNewMinLiquidatableCollateral(event: NewMinLiquidatableCollateral): void {
  const poolAddress = event.address;
  const newMinLiquidatableCollateral = event.params.newMinLiquidatableCollateral;
  const pool = getOrCreatePool(poolAddress);
  pool.minLiquidatableCollateralMantissa = newMinLiquidatableCollateral;
  pool.save();
}

export function handleNewSupplyCap(event: NewSupplyCap): void {
  const vTokenAddress = event.params.vToken;
  const newSupplyCap = event.params.newSupplyCap;
  const market = getMarket(vTokenAddress);
  if (market) {
    market.supplyCapMantissa = newSupplyCap;
    market.save();
  }
}

export function handleNewRewardsDistributor(event: NewRewardsDistributor): void {
  RewardsDistributorDataSource.create(event.params.rewardsDistributor);
  getOrCreateRewardDistributor(event.params.rewardsDistributor, event.address);
}
