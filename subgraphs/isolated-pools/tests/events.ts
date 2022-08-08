import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';
import { log } from 'matchstick-as/assembly/log';

import {
  MarketEntered as MarketEnteredEvent,
  MarketExited as MarketExitedEvent,
  MarketListed as MarketListedEvent,
  NewCloseFactor as NewCloseFactorEvent,
  NewCollateralFactor as NewCollateralFactorEvent,
} from '../generated/PoolRegistry/Comptroller';
import {
  PoolNameSet as PoolNameSetEvent,
  PoolRegistered as PoolRegisteredEvent,
} from '../generated/PoolRegistry/PoolRegistry';

export const createPoolRegisteredEvent = (
  index: BigInt,
  comptrollerAddress: Address,
): PoolRegisteredEvent => {
  const event = changetype<PoolRegisteredEvent>(newMockEvent());

  event.parameters = [];
  const indexParam = new ethereum.EventParam('index', ethereum.Value.fromUnsignedBigInt(index));
  event.parameters.push(indexParam);

  const tupleArray: Array<ethereum.Value> = [
    ethereum.Value.fromUnsignedBigInt(index),
    ethereum.Value.fromString('Pool One'),
    ethereum.Value.fromAddress(Address.fromString('0x0000000000000000000000000000000000000000')),
    ethereum.Value.fromAddress(comptrollerAddress),
    ethereum.Value.fromUnsignedBigInt(new BigInt(1000000)),
    ethereum.Value.fromUnsignedBigInt(new BigInt(1659579)),
  ];
  const tuple = changetype<ethereum.Tuple>(tupleArray);
  const tupleValue = ethereum.Value.fromTuple(tuple);

  const poolParam = new ethereum.EventParam('pool', tupleValue);
  event.parameters.push(poolParam);
  log.debug(event.parameters[1].name, []);
  return event;
};

export const createPoolNameSetEvent = (index: BigInt, name: string): PoolNameSetEvent => {
  const event = changetype<PoolNameSetEvent>(newMockEvent());

  event.parameters = [];

  const indexParam = new ethereum.EventParam('index', ethereum.Value.fromUnsignedBigInt(index));
  event.parameters.push(indexParam);
  const nameParam = new ethereum.EventParam('name', ethereum.Value.fromString(name));
  event.parameters.push(nameParam);
  return event;
};

export const createMarketListedEvent = (cTokenAddress: Address): MarketListedEvent => {
  const event = changetype<MarketListedEvent>(newMockEvent());

  event.parameters = [];
  const cTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(cTokenAddress));
  event.parameters.push(cTokenParam);

  return event;
};

export const createMarketEnteredEvent = (
  cTokenAddress: Address,
  accountAddress: Address,
): MarketEnteredEvent => {
  const event = changetype<MarketEnteredEvent>(newMockEvent());

  event.parameters = [];
  const cTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(cTokenAddress));
  event.parameters.push(cTokenParam);
  const accountAddressParam = new ethereum.EventParam(
    'account',
    ethereum.Value.fromAddress(accountAddress),
  );
  event.parameters.push(accountAddressParam);

  return event;
};

export const createMarketExitedEvent = (
  cTokenAddress: Address,
  accountAddress: Address,
): MarketExitedEvent => {
  const event = changetype<MarketExitedEvent>(newMockEvent());

  event.parameters = [];
  const cTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(cTokenAddress));
  event.parameters.push(cTokenParam);
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
  cTokenAddress: Address,
  oldCollateralFactorMantissa: BigInt,
  newCollateralFactorMantissa: BigInt,
): NewCollateralFactorEvent => {
  const event = changetype<NewCollateralFactorEvent>(newMockEvent());

  event.parameters = [];

  const cTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(cTokenAddress));
  event.parameters.push(cTokenParam);

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
