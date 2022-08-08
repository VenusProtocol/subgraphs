import { MarketListed } from '../../generated/PoolRegistry/Comptroller';
import { CToken } from '../../generated/templates';
import { createMarket } from '../operations/create';

export const handleMarketListed = (event: MarketListed): void => {
  // Dynamically index all new listed tokens
  const cTokenAddress = event.params.cToken;
  CToken.create(cTokenAddress);
  createMarket(cTokenAddress);
};

export const handleMarketEntered = (): void => {}; // eslint-disable-line

export const handleMarketExited = (): void => {}; // eslint-disable-line

export const handleNewCloseFactor = (): void => {}; // eslint-disable-line

export const handleNewCollateralFactor = (): void => {}; // eslint-disable-line

export const handleNewLiquidationIncentive = (): void => {}; // eslint-disable-line

export const handleNewPriceOracle = (): void => {}; // eslint-disable-line

export const handleNewPauseGuardian = (): void => {}; // eslint-disable-line

export const handleGlobalActionPaused = (): void => {}; // eslint-disable-line

export const handleMarketActionPaused = (): void => {}; // eslint-disable-line

export const handleNewBorrowCap = (): void => {}; // eslint-disable-line

export const handleNewBorrowCapGuardian = (): void => {}; // eslint-disable-line

export const handleNewMinLiquidatableAmount = (): void => {}; // eslint-disable-line
