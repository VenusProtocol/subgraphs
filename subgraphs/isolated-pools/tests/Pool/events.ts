import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  ActionPausedMarket as ActionPausedMarketEvent,
  MarketEntered as MarketEnteredEvent,
  MarketExited as MarketExitedEvent,
  NewBorrowCap as NewBorrowCapEvent,
  NewCloseFactor as NewCloseFactorEvent,
  NewCollateralFactor as NewCollateralFactorEvent,
  NewLiquidationIncentive as NewLiquidationIncentiveEvent,
  NewMinLiquidatableCollateral as NewMinLiquidatableCollateralEvent,
  NewPriceOracle as NewPriceOracleEvent,
  NewSupplyCap as NewSupplyCapEvent,
} from '../../generated/PoolRegistry/Comptroller';
import { MarketAdded as MarketAddedEvent } from '../../generated/PoolRegistry/PoolRegistry';

export const createMarketAddedEvent = (
  comptrollerAddress: Address,
  vTokenAddress: Address,
): MarketAddedEvent => {
  const event = changetype<MarketAddedEvent>(newMockEvent());

  event.parameters = [];
  const comptrollerParam = new ethereum.EventParam(
    'comptroller',
    ethereum.Value.fromAddress(comptrollerAddress),
  );
  event.parameters.push(comptrollerParam);
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  return event;
};

export const createMarketEnteredEvent = (
  vTokenAddress: Address,
  accountAddress: Address,
): MarketEnteredEvent => {
  const event = changetype<MarketEnteredEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);
  const accountAddressParam = new ethereum.EventParam(
    'account',
    ethereum.Value.fromAddress(accountAddress),
  );
  event.parameters.push(accountAddressParam);

  return event;
};

export const createMarketExitedEvent = (
  vTokenAddress: Address,
  accountAddress: Address,
): MarketExitedEvent => {
  const event = changetype<MarketExitedEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);
  const accountAddressParam = new ethereum.EventParam(
    'account',
    ethereum.Value.fromAddress(accountAddress),
  );
  event.parameters.push(accountAddressParam);

  return event;
};

export const createNewCloseFactorEvent = (
  poolAddress: Address,
  oldCloseFactor: BigInt,
  newCloseFactor: BigInt,
): NewCloseFactorEvent => {
  const event = changetype<NewCloseFactorEvent>(newMockEvent());
  event.address = poolAddress;
  event.parameters = [];

  const oldCloseFactorMantissa = new ethereum.EventParam(
    'oldCloseFactorMantissa',
    ethereum.Value.fromSignedBigInt(oldCloseFactor),
  );
  event.parameters.push(oldCloseFactorMantissa);

  const newCloseFactorMantissa = new ethereum.EventParam(
    'newCloseFactorMantissa',
    ethereum.Value.fromSignedBigInt(newCloseFactor),
  );
  event.parameters.push(newCloseFactorMantissa);

  return event;
};

export const createNewCollateralFactorEvent = (
  vTokenAddress: Address,
  oldCollateralFactorMantissa: BigInt,
  newCollateralFactorMantissa: BigInt,
): NewCollateralFactorEvent => {
  const event = changetype<NewCollateralFactorEvent>(newMockEvent());

  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const oldCollateralFactorMantissaParam = new ethereum.EventParam(
    'oldCollateralFactorMantissa',
    ethereum.Value.fromSignedBigInt(oldCollateralFactorMantissa),
  );
  event.parameters.push(oldCollateralFactorMantissaParam);

  const newCollateralFactorMantissaParam = new ethereum.EventParam(
    'newCollateralFactorMantissa',
    ethereum.Value.fromSignedBigInt(newCollateralFactorMantissa),
  );
  event.parameters.push(newCollateralFactorMantissaParam);

  return event;
};

export const createNewLiquidationIncentiveEvent = (
  poolAddress: Address,
  oldLiquidationIncentiveMantissa: BigInt,
  newLiquidationIncentiveMantissa: BigInt,
): NewLiquidationIncentiveEvent => {
  const event = changetype<NewLiquidationIncentiveEvent>(newMockEvent());
  event.address = poolAddress;
  event.parameters = [];

  const oldLiquidationIncentiveMantissaParam = new ethereum.EventParam(
    'oldLiquidationIncentiveMantissa',
    ethereum.Value.fromSignedBigInt(oldLiquidationIncentiveMantissa),
  );
  event.parameters.push(oldLiquidationIncentiveMantissaParam);

  const newLiquidationIncentiveMantissaParam = new ethereum.EventParam(
    'newLiquidationIncentiveMantissa',
    ethereum.Value.fromSignedBigInt(newLiquidationIncentiveMantissa),
  );
  event.parameters.push(newLiquidationIncentiveMantissaParam);

  return event;
};

export const createNewPriceOracleEvent = (
  comptrollerAddress: Address,
  oldPriceOracle: Address,
  newPriceOracle: Address,
): NewPriceOracleEvent => {
  const event = changetype<NewPriceOracleEvent>(newMockEvent());
  event.address = comptrollerAddress;
  event.parameters = [];

  const oldPriceOracleParam = new ethereum.EventParam(
    'oldPriceOracle',
    ethereum.Value.fromAddress(oldPriceOracle),
  );
  event.parameters.push(oldPriceOracleParam);

  const newPriceOracleParam = new ethereum.EventParam(
    'newPriceOracle',
    ethereum.Value.fromAddress(newPriceOracle),
  );
  event.parameters.push(newPriceOracleParam);

  return event;
};

export const createActionPausedMarketEvent = (
  vTokenAddress: Address,
  action: i32,
  pauseState: boolean,
): ActionPausedMarketEvent => {
  const event = changetype<ActionPausedMarketEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const actionParam = new ethereum.EventParam('action', ethereum.Value.fromI32(action));
  event.parameters.push(actionParam);

  const pauseStateParam = new ethereum.EventParam(
    'pauseState',
    ethereum.Value.fromBoolean(pauseState),
  );
  event.parameters.push(pauseStateParam);

  return event;
};

export const createNewBorrowCapEvent = (
  vTokenAddress: Address,
  newBorrowCap: BigInt,
): NewBorrowCapEvent => {
  const event = changetype<NewBorrowCapEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newBorrowCapParam = new ethereum.EventParam(
    'newBorrowCap',
    ethereum.Value.fromUnsignedBigInt(newBorrowCap),
  );
  event.parameters.push(newBorrowCapParam);

  return event;
};

export const createNewMinLiquidatableCollateralEvent = (
  comptrollerAddress: Address,
  vTokenAddress: Address,
  newMinLiquidatableCollateral: BigInt,
): NewMinLiquidatableCollateralEvent => {
  const event = changetype<NewMinLiquidatableCollateralEvent>(newMockEvent());
  event.parameters = [];
  event.address = comptrollerAddress;

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newMinLiquidatableCollateralParam = new ethereum.EventParam(
    'newMinLiquidatableCollateral',
    ethereum.Value.fromUnsignedBigInt(newMinLiquidatableCollateral),
  );
  event.parameters.push(newMinLiquidatableCollateralParam);

  return event;
};

export const createNewSupplyCapEvent = (
  vTokenAddress: Address,
  newSupplyCap: BigInt,
): NewSupplyCapEvent => {
  const event = changetype<NewSupplyCapEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newSupplyCapParam = new ethereum.EventParam(
    'newSupplyCap',
    ethereum.Value.fromUnsignedBigInt(newSupplyCap),
  );
  event.parameters.push(newSupplyCapParam);

  return event;
};
