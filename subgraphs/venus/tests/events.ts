import { Address, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import { MarketListed as MarketListedEvent } from '../generated/Comptroller/Comptroller';

export const createMarketListedEvent = (vTokenAddress: Address): MarketListedEvent => {
  const event = changetype<MarketListedEvent>(newMockEvent());

  const vTokenParam = new ethereum.EventParam('vToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters = [];
  event.parameters.push(vTokenParam);

  return event;
};
