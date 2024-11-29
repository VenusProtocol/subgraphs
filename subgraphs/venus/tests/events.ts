import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  MarketListed as MarketListedEvent,
  MarketUnlisted as MarketUnlistedEvent,
  NewPriceOracle as NewPriceOracleEvent,
} from '../generated/DiamondComptroller/Comptroller';

export const createMarketListedEvent = (vTokenAddress: Address): MarketListedEvent => {
  const event = changetype<MarketListedEvent>(newMockEvent());

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters = [];
  event.parameters.push(vTokenParam);

  return event;
};

export const createMarketUnlistedEvent = (vTokenAddress: Address): MarketUnlistedEvent => {
  const event = changetype<MarketUnlistedEvent>(newMockEvent());

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters = [];
  event.parameters.push(vTokenParam);

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
