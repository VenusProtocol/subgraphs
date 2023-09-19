import {
  ActionPausedMarket,
  MarketEntered,
  MarketExited,
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
import {
  getOrCreateAccount,
  getOrCreateAccountVTokenTransaction,
  getOrCreateMarket,
  getOrCreatePool,
  getOrCreateRewardDistributor,
} from '../operations/getOrCreate';
import {
  updateOrCreateAccountVToken,
  updateOrCreateMarketAction,
} from '../operations/updateOrCreate';
import Box from '../utilities/box';

export function handleMarketEntered(event: MarketEntered): void {
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(accountAddress, vTokenAddress, event.block.number, new Box(true));
  getOrCreateAccountVTokenTransaction(
    accountAddress,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    vTokenAddress,
  );
}

export function handleMarketExited(event: MarketExited): void {
  const vTokenAddress = event.params.vToken;
  const accountAddress = event.params.account;

  getOrCreateAccount(accountAddress);

  updateOrCreateAccountVToken(accountAddress, vTokenAddress, event.block.number, new Box(false));
  getOrCreateAccountVTokenTransaction(
    accountAddress,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex,
    vTokenAddress,
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
  const market = getOrCreateMarket(vTokenAddress, poolAddress);
  market.collateralFactorMantissa = newCollateralFactorMantissa;

  market.save();
}

export function handleNewLiquidationThreshold(event: NewLiquidationThreshold): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const market = getOrCreateMarket(vTokenAddress, poolAddress);
  market.liquidationThresholdMantissa = event.params.newLiquidationThresholdMantissa;
  market.save();
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
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const borrowCap = event.params.newBorrowCap;
  const market = getOrCreateMarket(vTokenAddress, poolAddress);
  market.borrowCapMantissa = borrowCap;
  market.save();
}

export function handleNewMinLiquidatableCollateral(event: NewMinLiquidatableCollateral): void {
  const poolAddress = event.address;
  const newMinLiquidatableCollateral = event.params.newMinLiquidatableCollateral;
  const pool = getOrCreatePool(poolAddress);
  pool.minLiquidatableCollateralMantissa = newMinLiquidatableCollateral;
  pool.save();
}

export function handleNewSupplyCap(event: NewSupplyCap): void {
  const poolAddress = event.address;
  const vTokenAddress = event.params.vToken;
  const newSupplyCap = event.params.newSupplyCap;
  const market = getOrCreateMarket(vTokenAddress, poolAddress);
  market.supplyCapMantissa = newSupplyCap;
  market.save();
}

export function handleNewRewardsDistributor(event: NewRewardsDistributor): void {
  RewardsDistributorDataSource.create(event.params.rewardsDistributor);
  getOrCreateRewardDistributor(event.params.rewardsDistributor, event.address);
}
