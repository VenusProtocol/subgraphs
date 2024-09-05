import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  MarketListed as MarketListedEvent,
  MarketUnlisted as MarketUnlistedEvent,
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
